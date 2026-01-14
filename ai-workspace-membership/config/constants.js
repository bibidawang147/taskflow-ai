/**
 * 会员体系常量配置
 */

// 会员类型
const MEMBERSHIP_TYPE = {
  FREE: 'free',
  PRO: 'pro'
};

// 工作流等级
const WORKFLOW_LEVEL = {
  FREE: 1,        // 免费工作流：所有人可用
  PRO_FREE: 2,    // Pro免费工作流：仅Pro及以上可用
  PAID: 3         // 付费工作流：需购买
};

// 工作流等级名称
const WORKFLOW_LEVEL_NAME = {
  [WORKFLOW_LEVEL.FREE]: '免费工作流',
  [WORKFLOW_LEVEL.PRO_FREE]: 'Pro免费工作流',
  [WORKFLOW_LEVEL.PAID]: '付费工作流'
};

// 工作流状态
const WORKFLOW_STATUS = {
  DRAFT: 'draft',           // 草稿
  PENDING: 'pending',       // 待审核
  APPROVED: 'approved',     // 已上架
  REJECTED: 'rejected',     // 已拒绝
  ARCHIVED: 'archived'      // 已下架
};

// 会员状态
const MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

// 用户状态
const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted'
};

// 创作者等级配置
const CREATOR_LEVELS = {
  1: { points: 0, works: 0, usage: 0, shareRate: 0.60 },
  2: { points: 50, works: 5, usage: 5000, shareRate: 0.63 },
  3: { points: 150, works: 10, usage: 20000, shareRate: 0.66 },
  4: { points: 300, works: 15, usage: 50000, shareRate: 0.69 },
  5: { points: 500, works: 20, usage: 100000, shareRate: 0.72 },
  6: { points: 800, works: 30, usage: 200000, shareRate: 0.75 },
  7: { points: 1200, works: 40, usage: 400000, shareRate: 0.78 },
  8: { points: 1800, works: 50, usage: 700000, shareRate: 0.81 },
  9: { points: 2600, works: 60, usage: 1200000, shareRate: 0.85 },
  10: { points: 3600, works: 80, usage: 2000000, shareRate: 0.90 }
};

// AI使用额度
const AI_QUOTA = {
  FREE: 5,      // Free用户每月5次
  PRO: 200      // Pro用户每月200次
};

// 积分规则
const POINTS_RULE = {
  PUBLISH_FREE: 1,          // 发布免费工作流
  PUBLISH_PRO_FREE: 2,      // 发布Pro免费工作流
  PUBLISH_PAID: 3,          // 发布付费工作流
  WORKFLOW_USED: 0.001,     // 工作流被使用一次
  WORKFLOW_PURCHASED: 0.5   // 付费工作流被购买一次
};

// Pro会员价格（单位：元）
const PRO_PRICE = {
  MONTHLY: 29,
  QUARTERLY: 79,
  YEARLY: 299
};

// Pro用户购买折扣
const PRO_DISCOUNT = 0.5;

// 激励池分配比例
const INCENTIVE_POOL = {
  RATE: 0.20,                  // Pro收益的20%进入激励池
  NON_CREATOR_RATE: 0.25,      // 非创作者获得25%
  CREATOR_RATE: 0.75           // 创作者获得75%
};

// 创作者申请条件
const CREATOR_APPLY_REQUIREMENTS = {
  MIN_APPROVED_WORKFLOWS: 3    // 至少3个已上架工作流
};

// Pro会员（非创作者）发布限制
const PRO_NON_CREATOR_LIMITS = {
  MAX_APPROVED_WORKFLOWS: 3,   // 最多3个在架工作流
  ALLOWED_LEVELS: [WORKFLOW_LEVEL.FREE, WORKFLOW_LEVEL.PRO_FREE]  // 可发布的等级
};

// Prompt预览长度（Free用户）
const PROMPT_PREVIEW_LENGTH = 50;

// 错误码
const ERROR_CODES = {
  // 用户相关 1xxx
  USER_NOT_FOUND: 1001,
  USER_SUSPENDED: 1002,
  USER_DELETED: 1003,

  // 会员相关 2xxx
  MEMBERSHIP_NOT_FOUND: 2001,
  MEMBERSHIP_EXPIRED: 2002,
  NOT_PRO_USER: 2003,
  ALREADY_CREATOR: 2004,
  CREATOR_APPLY_FAILED: 2005,

  // 权限相关 3xxx
  PERMISSION_DENIED: 3001,
  CANNOT_VIEW_FULL_PROMPT: 3002,
  CANNOT_USE_PRO_WORKFLOW: 3003,
  CANNOT_COPY_WORKFLOW: 3004,
  CANNOT_PUBLISH_WORKFLOW: 3005,
  CANNOT_PUBLISH_PAID_WORKFLOW: 3006,
  PUBLISH_LIMIT_REACHED: 3007,

  // 工作流相关 4xxx
  WORKFLOW_NOT_FOUND: 4001,
  WORKFLOW_NOT_APPROVED: 4002,
  WORKFLOW_ALREADY_PURCHASED: 4003,
  WORKFLOW_IS_FREE: 4004
};

module.exports = {
  MEMBERSHIP_TYPE,
  WORKFLOW_LEVEL,
  WORKFLOW_LEVEL_NAME,
  WORKFLOW_STATUS,
  MEMBERSHIP_STATUS,
  USER_STATUS,
  CREATOR_LEVELS,
  AI_QUOTA,
  POINTS_RULE,
  PRO_PRICE,
  PRO_DISCOUNT,
  INCENTIVE_POOL,
  CREATOR_APPLY_REQUIREMENTS,
  PRO_NON_CREATOR_LIMITS,
  PROMPT_PREVIEW_LENGTH,
  ERROR_CODES
};
