/**
 * 积分API路由
 */

const express = require('express');
const router = express.Router();

const PointsService = require('../services/PointsService');
const { requireAuth, asyncHandler } = require('../middleware');

/**
 * 获取当前用户积分信息
 * GET /api/points
 */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const points = await PointsService.getPoints(userId);

  res.json({
    success: true,
    data: points
  });
}));

/**
 * 获取积分记录列表
 * GET /api/points/records
 */
router.get('/records', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { reason, startDate, endDate, page, limit } = req.query;

  const result = await PointsService.getPointsRecords(userId, {
    reason,
    startDate,
    endDate,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20
  });

  res.json({
    success: true,
    data: result
  });
}));

/**
 * 获取积分统计
 * GET /api/points/stats
 */
router.get('/stats', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { days } = req.query;

  const stats = await PointsService.getPointsStats(userId, {
    days: days ? parseInt(days) : 30
  });

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * 获取积分排行榜
 * GET /api/points/leaderboard
 */
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const { limit } = req.query;

  const leaderboard = await PointsService.getPointsLeaderboard({
    limit: limit ? parseInt(limit) : 100
  });

  res.json({
    success: true,
    data: leaderboard
  });
}));

/**
 * 获取积分规则说明
 * GET /api/points/rules
 */
router.get('/rules', (req, res) => {
  const { POINTS_RULE } = require('../config/constants');

  res.json({
    success: true,
    data: {
      publish: {
        free: {
          points: POINTS_RULE.PUBLISH_FREE,
          description: '发布免费工作流'
        },
        proFree: {
          points: POINTS_RULE.PUBLISH_PRO_FREE,
          description: '发布Pro免费工作流'
        },
        paid: {
          points: POINTS_RULE.PUBLISH_PAID,
          description: '发布付费工作流'
        }
      },
      usage: {
        used: {
          points: POINTS_RULE.WORKFLOW_USED,
          description: '工作流被使用1次'
        },
        purchased: {
          points: POINTS_RULE.WORKFLOW_PURCHASED,
          description: '付费工作流被购买1次'
        }
      },
      notes: [
        '所有等级工作流的使用都计入积分',
        'Pro会员（非创作者）的积分可累积',
        '申请创作者后积分直接继承',
        '积分用于创作者等级升级'
      ]
    }
  });
});

/**
 * 管理员：手动调整用户积分
 * POST /api/points/adjust
 */
router.post('/adjust', asyncHandler(async (req, res) => {
  // 需要管理员权限
  const adminId = req.headers['x-admin-id'] || req.adminId;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: '需要管理员权限'
    });
  }

  const { userId, points, reason } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '请指定用户ID'
    });
  }

  if (typeof points !== 'number' || points === 0) {
    return res.status(400).json({
      success: false,
      error: '请指定有效的积分变动值'
    });
  }

  if (!reason) {
    return res.status(400).json({
      success: false,
      error: '请填写调整原因'
    });
  }

  const result = await PointsService.adjustPoints(userId, points, adminId, reason);

  res.json({
    success: true,
    data: result,
    message: `积分调整成功：${points > 0 ? '+' : ''}${points}`
  });
}));

module.exports = router;
