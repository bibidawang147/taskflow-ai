import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getBalance,
  getUsageStats,
  getRechargePlans,
  createRechargeOrder,
  paymentCallback,
  upgradeTier,
} from '../controllers/credit.controller';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * GET /api/credit/balance
 * 获取用户余额
 */
router.get('/balance', getBalance);

/**
 * GET /api/credit/usage-stats
 * 获取使用统计
 * Query: ?days=7
 */
router.get('/usage-stats', getUsageStats);

/**
 * GET /api/credit/plans
 * 获取充值套餐
 */
router.get('/plans', getRechargePlans);

/**
 * POST /api/credit/recharge
 * 创建充值订单
 * Body: { amount: number, paymentMethod: string }
 */
router.post('/recharge', createRechargeOrder);

/**
 * POST /api/credit/payment-callback
 * 支付回调（实际项目中需要验证签名）
 * Body: { orderNo: string, paymentId: string }
 */
router.post('/payment-callback', paymentCallback);

/**
 * POST /api/credit/upgrade-tier
 * 升级用户等级
 * Body: { tier: 'free' | 'pro' | 'enterprise' }
 */
router.post('/upgrade-tier', upgradeTier);

export default router;
