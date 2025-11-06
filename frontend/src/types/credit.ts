// 用户余额
export interface UserBalance {
  coins: number;
  freeQuota: number;
  usedToday: number;
  remainingQuota: number;
  quotaResetAt: string;
  totalRecharged: number;
  totalConsumed: number;
  tier: UserTier;
}

// 使用统计
export interface UsageStats {
  totalCost: number;
  totalTokens: number;
  requestCount: number;
  byModel: ModelUsage[];
  recentLogs: UsageLog[];
}

export interface ModelUsage {
  provider: string;
  model: string;
  count: number;
  cost: number;
  tokens: number;
}

export interface UsageLog {
  id: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  status: 'success' | 'failed';
  createdAt: string;
}

// 充值套餐
export interface RechargePlan {
  amount: number;  // 充值金额
  coins: number;   // 获得积分
  bonus: number;   // 赠送积分
}

// 充值订单
export interface RechargeOrder {
  orderNo: string;
  amount: number;
  coins: number;
  bonusCoins: number;
  totalCoins: number;
}

// 用户等级
export type UserTier = 'free' | 'pro' | 'enterprise';

export interface TierInfo {
  name: string;
  displayName: string;
  dailyQuota: number;
  discount: number;
  price?: number;
  features: string[];
}
