import api from './api';
import {
  UserBalance,
  UsageStats,
  RechargePlan,
  RechargeOrder,
  UserTier,
} from '../types/credit';

export const creditService = {
  /**
   * 获取用户余额
   */
  getBalance: async (): Promise<UserBalance> => {
    const response = await api.get('/credit/balance');
    return response.data.data;
  },

  /**
   * 获取使用统计
   */
  getUsageStats: async (days: number = 7): Promise<UsageStats> => {
    const response = await api.get('/credit/usage-stats', {
      params: { days },
    });
    return response.data.data;
  },

  /**
   * 获取充值套餐
   */
  getRechargePlans: async (): Promise<RechargePlan[]> => {
    const response = await api.get('/credit/plans');
    return response.data.data;
  },

  /**
   * 创建充值订单
   */
  createRechargeOrder: async (
    amount: number,
    paymentMethod: string = 'wechat'
  ): Promise<RechargeOrder> => {
    const response = await api.post('/credit/recharge', {
      amount,
      paymentMethod,
    });
    return response.data.data;
  },

  /**
   * 升级用户等级
   */
  upgradeTier: async (tier: UserTier): Promise<void> => {
    await api.post('/credit/upgrade-tier', { tier });
  },

  /**
   * 格式化积分显示
   */
  formatCoins: (coins: number): string => {
    if (coins >= 1000) {
      return `${(coins / 1000).toFixed(1)}K`;
    }
    return coins.toString();
  },

  /**
   * 计算充值金额
   */
  calculateTotalCoins: (plan: RechargePlan): number => {
    return plan.coins + plan.bonus;
  },

  /**
   * 获取等级信息
   */
  getTierInfo: (tier: UserTier) => {
    const tierMap = {
      free: {
        name: 'free',
        displayName: '免费版',
        dailyQuota: 10000,
        discount: 1.0,
        price: 0,
        features: [
          '每日 10,000 积分免费额度',
          '访问基础模型',
          '基本功能支持',
        ],
      },
      pro: {
        name: 'pro',
        displayName: '专业版',
        dailyQuota: 50000,
        discount: 0.85,
        price: 99,
        features: [
          '每日 50,000 积分免费额度',
          '访问所有模型',
          '85折优惠',
          '优先队列',
          '高级功能',
        ],
      },
      enterprise: {
        name: 'enterprise',
        displayName: '企业版',
        dailyQuota: 200000,
        discount: 0.7,
        price: 999,
        features: [
          '每日 200,000 积分免费额度',
          '访问所有模型',
          '7折优惠',
          '最高优先级',
          '专属客服',
          '定制化服务',
        ],
      },
    };
    return tierMap[tier];
  },
};
