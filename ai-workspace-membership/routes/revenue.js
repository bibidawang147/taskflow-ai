/**
 * 收益API路由
 */

const express = require('express');
const router = express.Router();

const RevenueService = require('../services/RevenueService');
const monthlyRevenueJob = require('../jobs/monthlyRevenue');
const { requireAuth, requireCreator, asyncHandler } = require('../middleware');

/**
 * 获取我的收益统计
 * GET /api/revenue/stats
 */
router.get('/stats', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const stats = await RevenueService.getUserRevenueStats(userId);

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * 获取我的收益记录
 * GET /api/revenue/records
 */
router.get('/records', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { type, status, period, page, limit } = req.query;

  const result = await RevenueService.getUserRevenueRecords(userId, {
    type,
    status,
    period,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20
  });

  res.json({
    success: true,
    data: result
  });
}));

/**
 * 获取激励池历史（公开）
 * GET /api/revenue/pools
 */
router.get('/pools', asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const result = await RevenueService.getIncentivePoolHistory({
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 12
  });

  res.json({
    success: true,
    data: result
  });
}));

/**
 * 获取激励池详情
 * GET /api/revenue/pools/:id
 */
router.get('/pools/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const detail = await RevenueService.getIncentivePoolDetail(id);

  res.json({
    success: true,
    data: detail
  });
}));

/**
 * 管理员：获取平台收益统计
 * GET /api/revenue/admin/stats
 */
router.get('/admin/stats', asyncHandler(async (req, res) => {
  const adminId = req.headers['x-admin-id'] || req.adminId;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: '需要管理员权限'
    });
  }

  const { startPeriod, endPeriod } = req.query;

  const stats = await RevenueService.getPlatformRevenueStats({
    startPeriod,
    endPeriod
  });

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * 管理员：手动触发月度结算
 * POST /api/revenue/admin/run-settlement
 */
router.post('/admin/run-settlement', asyncHandler(async (req, res) => {
  const adminId = req.headers['x-admin-id'] || req.adminId;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: '需要管理员权限'
    });
  }

  const { period } = req.body;

  const result = await monthlyRevenueJob.runNow(period);

  res.json({
    success: true,
    data: result,
    message: result.success ? '月度结算执行成功' : '月度结算执行失败'
  });
}));

/**
 * 管理员：预览月度结算
 * GET /api/revenue/admin/preview
 */
router.get('/admin/preview', asyncHandler(async (req, res) => {
  const adminId = req.headers['x-admin-id'] || req.adminId;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: '需要管理员权限'
    });
  }

  const { period } = req.query;

  const preview = await monthlyRevenueJob.preview(period);

  res.json({
    success: true,
    data: preview
  });
}));

/**
 * 管理员：获取定时任务状态
 * GET /api/revenue/admin/job-status
 */
router.get('/admin/job-status', asyncHandler(async (req, res) => {
  const adminId = req.headers['x-admin-id'] || req.adminId;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: '需要管理员权限'
    });
  }

  const status = monthlyRevenueJob.getStatus();

  res.json({
    success: true,
    data: status
  });
}));

/**
 * 管理员：启动定时任务
 * POST /api/revenue/admin/job-start
 */
router.post('/admin/job-start', asyncHandler(async (req, res) => {
  const adminId = req.headers['x-admin-id'] || req.adminId;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: '需要管理员权限'
    });
  }

  const { cronExpression } = req.body;

  monthlyRevenueJob.start(cronExpression);

  res.json({
    success: true,
    message: '定时任务已启动'
  });
}));

/**
 * 管理员：停止定时任务
 * POST /api/revenue/admin/job-stop
 */
router.post('/admin/job-stop', asyncHandler(async (req, res) => {
  const adminId = req.headers['x-admin-id'] || req.adminId;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: '需要管理员权限'
    });
  }

  monthlyRevenueJob.stop();

  res.json({
    success: true,
    message: '定时任务已停止'
  });
}));

/**
 * 管理员：批量结算收益记录
 * POST /api/revenue/admin/settle
 */
router.post('/admin/settle', asyncHandler(async (req, res) => {
  const adminId = req.headers['x-admin-id'] || req.adminId;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: '需要管理员权限'
    });
  }

  const { recordIds } = req.body;

  const result = await RevenueService.settleRevenueRecords(recordIds);

  res.json({
    success: true,
    data: result,
    message: `已结算 ${result.settledCount} 条记录`
  });
}));

module.exports = router;
