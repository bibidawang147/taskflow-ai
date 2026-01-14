/**
 * 用户API路由
 * 会员升级、创作者申请等
 */

const express = require('express');
const router = express.Router();

const UserService = require('../services/UserService');
const PermissionService = require('../services/PermissionService');
const { requireAuth, requirePro, asyncHandler } = require('../middleware');

/**
 * 获取当前用户身份信息
 * GET /api/users/identity
 */
router.get('/identity', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const identity = await UserService.getUserIdentity(userId);

  res.json({
    success: true,
    data: {
      user: {
        id: identity.user.id,
        username: identity.user.username,
        email: identity.user.email,
        avatar: identity.user.avatar
      },
      membership: {
        type: identity.membership.type,
        isCreator: identity.membership.is_creator === 1,
        status: identity.membership.status,
        expiresAt: identity.membership.expires_at
      },
      flags: {
        isFree: identity.isFree,
        isPro: identity.isPro,
        isCreator: identity.isCreator,
        isProExpired: identity.isProExpired
      },
      creatorStats: identity.creatorStats ? {
        level: identity.creatorStats.level,
        totalPoints: parseFloat(identity.creatorStats.total_points),
        workCount: identity.creatorStats.work_count,
        totalUsage: identity.creatorStats.total_usage,
        totalRevenue: parseFloat(identity.creatorStats.total_revenue)
      } : null
    }
  });
}));

/**
 * 获取当前用户权限列表
 * GET /api/users/permissions
 */
router.get('/permissions', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const permissions = await PermissionService.getUserPermissions(userId);

  res.json({
    success: true,
    data: permissions
  });
}));

/**
 * 检查创作者申请资格
 * GET /api/users/creator-eligibility
 */
router.get('/creator-eligibility', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const eligibility = await UserService.checkCreatorEligibility(userId);

  res.json({
    success: true,
    data: eligibility
  });
}));

/**
 * 申请成为创作者
 * POST /api/users/apply-creator
 */
router.post('/apply-creator', requirePro, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const result = await UserService.applyForCreator(userId);

  res.json({
    success: true,
    data: result,
    message: '恭喜！您已成为创作者'
  });
}));

/**
 * 获取创作者等级信息
 * GET /api/users/creator-level
 */
router.get('/creator-level', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;

  try {
    const levelInfo = await UserService.getCreatorLevelInfo(userId);

    res.json({
      success: true,
      data: levelInfo
    });
  } catch (error) {
    if (error.message === '需要Pro会员才能执行此操作') {
      return res.json({
        success: true,
        data: {
          isCreator: false,
          message: '您还不是创作者'
        }
      });
    }
    throw error;
  }
}));

/**
 * 获取AI使用额度
 * GET /api/users/ai-quota
 */
router.get('/ai-quota', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const quota = await PermissionService.getAIQuota(userId);

  res.json({
    success: true,
    data: quota
  });
}));

/**
 * 升级为Pro会员（需要配合支付系统）
 * POST /api/users/upgrade-to-pro
 */
router.post('/upgrade-to-pro', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { planType, paymentInfo } = req.body;

  if (!planType || !['monthly', 'quarterly', 'yearly'].includes(planType)) {
    return res.status(400).json({
      success: false,
      error: '请选择有效的订阅周期'
    });
  }

  if (!paymentInfo || !paymentInfo.paymentId) {
    return res.status(400).json({
      success: false,
      error: '支付信息无效'
    });
  }

  const result = await UserService.upgradeToProMember(userId, planType, paymentInfo);

  res.json({
    success: true,
    data: result,
    message: '恭喜！您已成为Pro会员'
  });
}));

/**
 * 获取Pro会员订阅信息
 * GET /api/users/subscription
 */
router.get('/subscription', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const db = require('../config/database');

  const identity = await UserService.getUserIdentity(userId);

  // 获取订阅历史
  const subscriptions = await db.query(
    `SELECT * FROM pro_subscriptions
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 10`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      isPro: identity.isPro,
      isExpired: identity.isProExpired,
      expiresAt: identity.membership.expires_at,
      subscriptions
    }
  });
}));

module.exports = router;
