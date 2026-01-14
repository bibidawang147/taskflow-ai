/**
 * 等级API路由
 */

const express = require('express');
const router = express.Router();

const LevelService = require('../services/LevelService');
const { requireAuth, requireCreator, asyncHandler } = require('../middleware');

/**
 * 获取所有等级信息（公开）
 * GET /api/levels
 */
router.get('/', (req, res) => {
  const levels = LevelService.getAllLevelInfo();

  res.json({
    success: true,
    data: levels
  });
});

/**
 * 获取指定等级信息（公开）
 * GET /api/levels/:level
 */
router.get('/:level', (req, res) => {
  const level = parseInt(req.params.level);

  if (isNaN(level) || level < 1 || level > 10) {
    return res.status(400).json({
      success: false,
      error: '无效的等级，等级范围为 1-10'
    });
  }

  const info = LevelService.getLevelInfo(level);

  res.json({
    success: true,
    data: info
  });
});

/**
 * 获取等级分布统计（公开）
 * GET /api/levels/stats/distribution
 */
router.get('/stats/distribution', asyncHandler(async (req, res) => {
  const distribution = await LevelService.getLevelDistribution();

  res.json({
    success: true,
    data: distribution
  });
}));

/**
 * 获取我的等级进度
 * GET /api/levels/my/progress
 */
router.get('/my/progress', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const progress = await LevelService.getLevelProgress(userId);

  res.json({
    success: true,
    data: progress
  });
}));

/**
 * 检查是否可以升级
 * GET /api/levels/my/check-upgrade
 */
router.get('/my/check-upgrade', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const checkResult = await LevelService.checkLevelUp(userId);

  res.json({
    success: true,
    data: checkResult
  });
}));

/**
 * 执行升级（手动触发）
 * POST /api/levels/my/upgrade
 */
router.post('/my/upgrade', requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;

  // 先检查是否满足条件
  const checkResult = await LevelService.checkLevelUp(userId);

  if (!checkResult.canUpgrade) {
    return res.status(400).json({
      success: false,
      error: '不满足升级条件',
      data: checkResult
    });
  }

  // 执行升级
  const upgradeResult = await LevelService.upgradeLevel(userId);

  if (!upgradeResult.success) {
    return res.status(400).json({
      success: false,
      error: upgradeResult.reason
    });
  }

  res.json({
    success: true,
    data: upgradeResult,
    message: `恭喜！您已升级到 ${upgradeResult.levelName}，分成比例提升至 ${(upgradeResult.newShareRate * 100).toFixed(0)}%`
  });
}));

/**
 * 获取我的等级历史
 * GET /api/levels/my/history
 */
router.get('/my/history', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { page, limit } = req.query;

  const history = await LevelService.getLevelHistory(userId, {
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20
  });

  res.json({
    success: true,
    data: history
  });
}));

/**
 * 管理员：强制升级用户等级
 * POST /api/levels/admin/upgrade
 */
router.post('/admin/upgrade', asyncHandler(async (req, res) => {
  const adminId = req.headers['x-admin-id'] || req.adminId;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: '需要管理员权限'
    });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '请指定用户ID'
    });
  }

  const upgradeResult = await LevelService.upgradeLevel(userId, { force: true });

  if (!upgradeResult.success) {
    return res.status(400).json({
      success: false,
      error: upgradeResult.reason
    });
  }

  res.json({
    success: true,
    data: upgradeResult,
    message: `用户已升级到 LV${upgradeResult.newLevel}`
  });
}));

/**
 * 管理员：批量检查并自动升级
 * POST /api/levels/admin/auto-upgrade-all
 */
router.post('/admin/auto-upgrade-all', asyncHandler(async (req, res) => {
  const adminId = req.headers['x-admin-id'] || req.adminId;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: '需要管理员权限'
    });
  }

  const db = require('../config/database');

  // 获取所有创作者
  const creators = await db.query(
    'SELECT user_id FROM creator_stats WHERE level > 0 AND level < 10'
  );

  const results = {
    total: creators.length,
    upgraded: 0,
    details: []
  };

  for (const creator of creators) {
    const upgradeResult = await LevelService.checkAndAutoUpgrade(creator.user_id);
    if (upgradeResult.upgraded) {
      results.upgraded++;
      results.details.push({
        userId: creator.user_id,
        upgrades: upgradeResult.upgrades
      });
    }
  }

  res.json({
    success: true,
    data: results,
    message: `共检查 ${results.total} 位创作者，${results.upgraded} 位完成升级`
  });
}));

module.exports = router;
