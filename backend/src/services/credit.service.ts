import prisma from '../utils/database';
import schedule from 'node-schedule';

// 使用日志参数
interface UsageLogParams {
  userId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  workflowId?: string;
  executionId?: string;
  status: 'success' | 'failed';
  errorMessage?: string;
}

// 扣费参数
interface DeductCreditParams extends UsageLogParams {
  // 继承所有 UsageLogParams 的字段
}

// 充值参数
interface RechargeParams {
  userId: string;
  amount: number;  // 充值金额（人民币）
  coins: number;   // 获得的积分
  bonusCoins?: number;  // 赠送的积分
  paymentMethod?: string;
  paymentId?: string;
}

// 用户等级配置
const TIER_CONFIG = {
  free: {
    dailyQuota: 10000,    // 每日 10000 coins 免费额度
    discount: 1.0,        // 无折扣
  },
  pro: {
    dailyQuota: 50000,    // 每日 50000 coins 免费额度
    discount: 0.85,       // 85折
  },
  enterprise: {
    dailyQuota: 200000,   // 每日 200000 coins 免费额度
    discount: 0.7,        // 7折
  },
};

// 新用户奖励
const NEW_USER_BONUS = 50000; // 注册送 50000 积分

// 充值套餐配置
export const RECHARGE_PLANS = [
  { amount: 10, coins: 10000, bonus: 0 },
  { amount: 50, coins: 55000, bonus: 5000 },
  { amount: 100, coins: 120000, bonus: 20000 },
  { amount: 500, coins: 650000, bonus: 150000 },
];

export class CreditService {
  constructor() {
    // 每天凌晨重置免费额度
    this.scheduleQuotaReset();
  }

  /**
   * 初始化用户余额（注册时调用）
   */
  async initializeUserBalance(userId: string): Promise<void> {
    const existingBalance = await prisma.userBalance.findUnique({
      where: { userId },
    });

    if (existingBalance) {
      return; // 已经初始化过了
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    await prisma.userBalance.create({
      data: {
        userId,
        coins: NEW_USER_BONUS,  // 注册赠送积分
        freeQuota: 10000,       // 免费用户每日额度
        usedToday: 0,
        quotaResetAt: tomorrow,
      },
    });
  }

  /**
   * 检查用户是否有足够的积分
   */
  async checkCredit(userId: string): Promise<boolean> {
    const balance = await this.getBalance(userId);
    if (!balance) {
      return false;
    }

    // 如果有免费额度或者付费积分，就可以使用
    return balance.usedToday < balance.freeQuota || balance.coins > 0;
  }

  /**
   * 获取用户余额
   */
  async getBalance(userId: string) {
    let balance = await prisma.userBalance.findUnique({
      where: { userId },
    });

    // 如果不存在，初始化
    if (!balance) {
      await this.initializeUserBalance(userId);
      balance = await prisma.userBalance.findUnique({
        where: { userId },
      });
    }

    // 检查是否需要重置每日额度
    if (balance && new Date() >= balance.quotaResetAt) {
      balance = await this.resetDailyQuota(userId);
    }

    return balance;
  }

  /**
   * 扣除积分
   */
  async deductCredit(params: DeductCreditParams): Promise<void> {
    const balance = await this.getBalance(params.userId);
    if (!balance) {
      throw new Error('用户余额不存在');
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 获取用户等级配置
    const tierConfig = TIER_CONFIG[user.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.free;

    // 应用折扣
    const actualCost = Math.ceil(params.cost * tierConfig.discount);

    // 优先使用免费额度
    const remainingQuota = balance.freeQuota - balance.usedToday;

    let quotaUsed = 0;
    let coinsUsed = 0;

    if (remainingQuota > 0) {
      // 有免费额度
      quotaUsed = Math.min(remainingQuota, actualCost);
      coinsUsed = actualCost - quotaUsed;
    } else {
      // 没有免费额度，全部使用付费积分
      coinsUsed = actualCost;
    }

    // 检查付费积分是否足够
    if (coinsUsed > balance.coins) {
      throw new Error('积分不足，请充值');
    }

    // 更新余额
    await prisma.userBalance.update({
      where: { userId: params.userId },
      data: {
        coins: balance.coins - coinsUsed,
        usedToday: balance.usedToday + quotaUsed,
        totalConsumed: balance.totalConsumed + actualCost,
      },
    });

    // 记录使用日志
    await this.logUsage({
      ...params,
      cost: actualCost, // 记录实际扣费金额（折扣后）
    });
  }

  /**
   * 记录使用日志
   */
  async logUsage(params: UsageLogParams): Promise<void> {
    await prisma.usageLog.create({
      data: {
        userId: params.userId,
        provider: params.provider,
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        totalTokens: params.totalTokens,
        cost: params.cost,
        requestType: 'chat', // 可以扩展为其他类型
        status: params.status,
        errorMessage: params.errorMessage,
        workflowId: params.workflowId,
        executionId: params.executionId,
      },
    });
  }

  /**
   * 充值
   */
  async recharge(params: RechargeParams): Promise<string> {
    const orderNo = this.generateOrderNo();

    const order = await prisma.rechargeOrder.create({
      data: {
        userId: params.userId,
        orderNo,
        amount: params.amount,
        coins: params.coins,
        bonusCoins: params.bonusCoins ?? 0,
        status: 'pending',
        paymentMethod: params.paymentMethod,
        paymentId: params.paymentId,
      },
    });

    return order.orderNo;
  }

  /**
   * 确认充值成功（支付回调时调用）
   */
  async confirmRecharge(orderNo: string): Promise<void> {
    const order = await prisma.rechargeOrder.findUnique({
      where: { orderNo },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== 'pending') {
      throw new Error('订单状态异常');
    }

    // 使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 更新订单状态
      await tx.rechargeOrder.update({
        where: { orderNo },
        data: {
          status: 'success',
          paidAt: new Date(),
        },
      });

      // 增加用户积分
      const balance = await tx.userBalance.findUnique({
        where: { userId: order.userId },
      });

      if (!balance) {
        throw new Error('用户余额不存在');
      }

      await tx.userBalance.update({
        where: { userId: order.userId },
        data: {
          coins: balance.coins + order.coins + order.bonusCoins,
          totalRecharged: balance.totalRecharged + order.amount,
        },
      });
    });
  }

  /**
   * 重置每日免费额度
   */
  async resetDailyQuota(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const tierConfig = TIER_CONFIG[user.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.free;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return await prisma.userBalance.update({
      where: { userId },
      data: {
        freeQuota: tierConfig.dailyQuota,
        usedToday: 0,
        quotaResetAt: tomorrow,
      },
    });
  }

  /**
   * 定时重置所有用户的每日额度
   */
  private scheduleQuotaReset() {
    // 每天凌晨 0:00 执行
    schedule.scheduleJob('0 0 * * *', async () => {
      console.log('开始重置每日免费额度...');

      try {
        const expiredBalances = await prisma.userBalance.findMany({
          where: {
            quotaResetAt: {
              lte: new Date(),
            },
          },
          include: {
            user: true,
          },
        });

        for (const balance of expiredBalances) {
          await this.resetDailyQuota(balance.userId);
        }

        console.log(`成功重置 ${expiredBalances.length} 个用户的每日额度`);
      } catch (error) {
        console.error('重置每日额度失败:', error);
      }
    });
  }

  /**
   * 获取用户使用统计
   */
  async getUsageStats(userId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.usageLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
        status: 'success',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 统计数据
    const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
    const totalTokens = logs.reduce((sum, log) => sum + log.totalTokens, 0);
    const requestCount = logs.length;

    // 按模型统计
    const byModel = logs.reduce((acc: any, log) => {
      const key = `${log.provider}:${log.model}`;
      if (!acc[key]) {
        acc[key] = {
          provider: log.provider,
          model: log.model,
          count: 0,
          cost: 0,
          tokens: 0,
        };
      }
      acc[key].count++;
      acc[key].cost += log.cost;
      acc[key].tokens += log.totalTokens;
      return acc;
    }, {});

    return {
      totalCost,
      totalTokens,
      requestCount,
      byModel: Object.values(byModel),
      recentLogs: logs.slice(0, 20), // 最近 20 条
    };
  }

  /**
   * 生成订单号
   */
  private generateOrderNo(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RCH${timestamp}${random}`;
  }

  /**
   * 升级用户等级
   */
  async upgradeTier(userId: string, newTier: 'free' | 'pro' | 'enterprise'): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { tier: newTier },
    });

    // 立即更新免费额度
    await this.resetDailyQuota(userId);
  }
}

export const creditService = new CreditService();
