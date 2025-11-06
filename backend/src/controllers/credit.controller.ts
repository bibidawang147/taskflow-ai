import { Request, Response } from 'express';
import { creditService } from '../services/credit.service';
import { RECHARGE_PLANS } from '../services/credit.service';

/**
 * 获取用户余额
 */
export const getBalance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const balance = await creditService.getBalance(userId);

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: '余额信息不存在',
      });
    }

    res.json({
      success: true,
      data: {
        coins: balance.coins,
        freeQuota: balance.freeQuota,
        usedToday: balance.usedToday,
        remainingQuota: Math.max(0, balance.freeQuota - balance.usedToday),
        quotaResetAt: balance.quotaResetAt,
        totalRecharged: balance.totalRecharged,
        totalConsumed: balance.totalConsumed,
      },
    });
  } catch (error: any) {
    console.error('获取余额失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取余额失败',
    });
  }
};

/**
 * 获取使用统计
 */
export const getUsageStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const days = parseInt(req.query.days as string) || 7;

    const stats = await creditService.getUsageStats(userId, days);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('获取使用统计失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取使用统计失败',
    });
  }
};

/**
 * 获取充值套餐
 */
export const getRechargePlans = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: RECHARGE_PLANS,
    });
  } catch (error: any) {
    console.error('获取充值套餐失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取充值套餐失败',
    });
  }
};

/**
 * 创建充值订单
 */
export const createRechargeOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { amount, paymentMethod } = req.body;

    // 查找对应的充值套餐
    const plan = RECHARGE_PLANS.find(p => p.amount === amount);
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: '无效的充值金额',
      });
    }

    const orderNo = await creditService.recharge({
      userId,
      amount: plan.amount,
      coins: plan.coins,
      bonusCoins: plan.bonus,
      paymentMethod,
    });

    res.json({
      success: true,
      data: {
        orderNo,
        amount: plan.amount,
        coins: plan.coins,
        bonusCoins: plan.bonus,
        totalCoins: plan.coins + plan.bonus,
      },
      message: '订单创建成功',
    });
  } catch (error: any) {
    console.error('创建充值订单失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '创建充值订单失败',
    });
  }
};

/**
 * 支付回调（模拟）
 * 实际项目中需要对接真实的支付平台
 */
export const paymentCallback = async (req: Request, res: Response) => {
  try {
    const { orderNo, paymentId } = req.body;

    await creditService.confirmRecharge(orderNo);

    res.json({
      success: true,
      message: '充值成功',
    });
  } catch (error: any) {
    console.error('支付回调失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '支付回调失败',
    });
  }
};

/**
 * 升级用户等级
 */
export const upgradeTier = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { tier } = req.body;

    if (!['free', 'pro', 'enterprise'].includes(tier)) {
      return res.status(400).json({
        success: false,
        message: '无效的用户等级',
      });
    }

    await creditService.upgradeTier(userId, tier);

    res.json({
      success: true,
      message: '升级成功',
    });
  } catch (error: any) {
    console.error('升级用户等级失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '升级用户等级失败',
    });
  }
};
