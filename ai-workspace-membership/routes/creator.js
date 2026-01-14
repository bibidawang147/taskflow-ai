/**
 * 创作者中心路由
 * 提供创作者的管理功能：作品管理、收益统计、等级进度等
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/database');
const UserService = require('../services/UserService');
const WorkflowService = require('../services/WorkflowService');
const PointsService = require('../services/PointsService');
const LevelService = require('../services/LevelService');
const RevenueService = require('../services/RevenueService');
const PurchaseService = require('../services/PurchaseService');
const { requireAuth, requireCreator, asyncHandler } = require('../middleware');

/**
 * 获取创作者中心概览
 * GET /creator/overview
 */
router.get('/overview', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;

  // 获取创作者统计
  const stats = await db.queryOne(
    `SELECT * FROM creator_stats WHERE user_id = ?`,
    [userId]
  );

  // 获取等级信息
  const levelInfo = await LevelService.getLevelProgress(userId);

  // 获取本月数据
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthlyStats = await db.queryOne(
    `SELECT
       (SELECT COUNT(*) FROM workflows WHERE creator_id = ? AND DATE_FORMAT(published_at, '%Y-%m') = ?) as published_count,
       (SELECT COUNT(*) FROM workflow_usage wu
        INNER JOIN workflows w ON wu.workflow_id = w.id
        WHERE w.creator_id = ? AND DATE_FORMAT(wu.used_at, '%Y-%m') = ?) as usage_count,
       (SELECT COUNT(*) FROM workflow_purchases wp
        INNER JOIN workflows w ON wp.workflow_id = w.id
        WHERE w.creator_id = ? AND wp.status = 'paid' AND DATE_FORMAT(wp.purchased_at, '%Y-%m') = ?) as purchase_count,
       (SELECT COALESCE(SUM(amount), 0) FROM revenue_records
        WHERE user_id = ? AND period = ? AND status != 'cancelled') as revenue
    `,
    [userId, thisMonth, userId, thisMonth, userId, thisMonth, userId, thisMonth]
  );

  // 获取待处理事项
  const pending = await db.queryOne(
    `SELECT
       (SELECT COUNT(*) FROM workflows WHERE creator_id = ? AND status = 'pending') as pending_review,
       (SELECT COUNT(*) FROM workflows WHERE creator_id = ? AND status = 'rejected') as rejected
    `,
    [userId, userId]
  );

  res.json({
    success: true,
    data: {
      stats: {
        level: stats?.level || 1,
        totalPoints: parseFloat(stats?.total_points) || 0,
        workCount: stats?.work_count || 0,
        totalUsage: stats?.total_usage || 0,
        totalPurchases: stats?.total_purchases || 0,
        totalRevenue: parseFloat(stats?.total_revenue) || 0,
        pendingRevenue: parseFloat(stats?.pending_revenue) || 0,
        withdrawnRevenue: parseFloat(stats?.withdrawn_revenue) || 0
      },
      levelInfo,
      thisMonth: {
        publishedCount: monthlyStats.published_count,
        usageCount: monthlyStats.usage_count,
        purchaseCount: monthlyStats.purchase_count,
        revenue: parseFloat(monthlyStats.revenue) || 0
      },
      pending: {
        pendingReview: pending.pending_review,
        rejected: pending.rejected
      }
    }
  });
}));

/**
 * 获取等级进度详情
 * GET /creator/level
 */
router.get('/level', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const levelProgress = await LevelService.getLevelProgress(userId);
  const levelHistory = await db.query(
    `SELECT * FROM level_upgrades
     WHERE user_id = ?
     ORDER BY upgraded_at DESC
     LIMIT 10`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      ...levelProgress,
      history: levelHistory
    }
  });
}));

/**
 * 获取积分记录
 * GET /creator/points
 */
router.get('/points', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { page = 1, pageSize = 20, reason } = req.query;

  const result = await PointsService.getPointsRecords(userId, {
    page: parseInt(page),
    limit: parseInt(pageSize),
    reason
  });

  res.json({
    success: true,
    data: result.records,
    pagination: {
      total: result.total,
      page: result.page,
      pageSize: result.limit,
      totalPages: result.totalPages
    }
  });
}));

/**
 * 获取积分统计
 * GET /creator/points/stats
 */
router.get('/points/stats', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const stats = await PointsService.getPointsStats(userId);

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * 获取收益记录
 * GET /creator/revenue
 */
router.get('/revenue', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { type, status, period, page = 1, pageSize = 20 } = req.query;

  const result = await RevenueService.getUserRevenueRecords(userId, {
    type,
    status,
    period,
    page: parseInt(page),
    limit: parseInt(pageSize)
  });

  res.json({
    success: true,
    data: result.records.map(r => ({
      ...r,
      amount: parseFloat(r.amount)
    })),
    pagination: {
      total: result.total,
      page: result.page,
      pageSize: result.limit,
      totalPages: result.totalPages
    }
  });
}));

/**
 * 获取收益统计
 * GET /creator/revenue/stats
 */
router.get('/revenue/stats', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const stats = await RevenueService.getUserRevenueStats(userId);

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * 获取销售记录
 * GET /creator/sales
 */
router.get('/sales', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { status, page = 1, pageSize = 20 } = req.query;

  const result = await PurchaseService.getCreatorSales(userId, {
    status,
    page: parseInt(page),
    limit: parseInt(pageSize)
  });

  res.json({
    success: true,
    data: result.sales,
    pagination: {
      total: result.total,
      page: result.page,
      pageSize: result.limit,
      totalPages: result.totalPages
    }
  });
}));

/**
 * 获取销售统计
 * GET /creator/sales/stats
 */
router.get('/sales/stats', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { period } = req.query;

  const stats = await PurchaseService.getCreatorSalesStats(userId, period);

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * 获取作品列表
 * GET /creator/works
 */
router.get('/works', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { status, level, page = 1, pageSize = 20 } = req.query;

  const limit = parseInt(pageSize) || 20;
  const offset = ((parseInt(page) || 1) - 1) * limit;

  let whereClause = 'WHERE creator_id = ?';
  const params = [userId];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  if (level) {
    whereClause += ' AND level = ?';
    params.push(parseInt(level));
  }

  const countResult = await db.queryOne(
    `SELECT COUNT(*) as total FROM workflows ${whereClause}`,
    params
  );

  const works = await db.query(
    `SELECT
       w.*,
       (SELECT COUNT(*) FROM workflow_usage WHERE workflow_id = w.id) as total_usage,
       (SELECT COUNT(*) FROM workflow_purchases WHERE workflow_id = w.id AND status = 'paid') as total_purchases,
       (SELECT COALESCE(SUM(creator_revenue), 0) FROM workflow_purchases WHERE workflow_id = w.id AND status = 'paid') as total_revenue
     FROM workflows w
     ${whereClause}
     ORDER BY w.updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: works.map(w => ({
      ...w,
      price: parseFloat(w.price) || 0,
      totalRevenue: parseFloat(w.total_revenue) || 0,
      levelName: w.level === 1 ? '免费' : (w.level === 2 ? 'Pro免费' : '付费'),
      statusName: getStatusName(w.status)
    })),
    pagination: {
      total: countResult.total,
      page: parseInt(page) || 1,
      pageSize: limit,
      totalPages: Math.ceil(countResult.total / limit)
    }
  });
}));

/**
 * 获取作品详情统计
 * GET /creator/works/:id/stats
 */
router.get('/works/:id/stats', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  // 验证是否是自己的作品
  const workflow = await db.queryOne(
    'SELECT * FROM workflows WHERE id = ? AND creator_id = ?',
    [id, userId]
  );

  if (!workflow) {
    return res.status(404).json({
      success: false,
      error: '作品不存在'
    });
  }

  // 使用趋势（最近30天）
  const usageTrend = await db.query(
    `SELECT DATE(used_at) as date, COUNT(*) as count
     FROM workflow_usage
     WHERE workflow_id = ? AND used_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY DATE(used_at)
     ORDER BY date ASC`,
    [id]
  );

  // 销售趋势（最近30天，仅付费工作流）
  let salesTrend = [];
  if (workflow.level === 3) {
    salesTrend = await db.query(
      `SELECT DATE(purchased_at) as date, COUNT(*) as count, SUM(creator_revenue) as revenue
       FROM workflow_purchases
       WHERE workflow_id = ? AND status = 'paid' AND purchased_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(purchased_at)
       ORDER BY date ASC`,
      [id]
    );
  }

  // 累计统计
  const totals = await db.queryOne(
    `SELECT
       (SELECT COUNT(*) FROM workflow_usage WHERE workflow_id = ?) as total_usage,
       (SELECT COUNT(*) FROM workflow_purchases WHERE workflow_id = ? AND status = 'paid') as total_purchases,
       (SELECT COALESCE(SUM(creator_revenue), 0) FROM workflow_purchases WHERE workflow_id = ? AND status = 'paid') as total_revenue
    `,
    [id, id, id]
  );

  res.json({
    success: true,
    data: {
      workflow: {
        ...workflow,
        price: parseFloat(workflow.price) || 0
      },
      totals: {
        usage: totals.total_usage,
        purchases: totals.total_purchases,
        revenue: parseFloat(totals.total_revenue) || 0
      },
      usageTrend,
      salesTrend: salesTrend.map(s => ({
        ...s,
        revenue: parseFloat(s.revenue) || 0
      }))
    }
  });
}));

/**
 * 创建工作流
 * POST /creator/works
 */
router.post('/works', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const workflowData = req.body;

  const workflow = await WorkflowService.createWorkflow(userId, workflowData);

  res.json({
    success: true,
    data: workflow,
    message: '工作流创建成功'
  });
}));

/**
 * 更新工作流
 * PUT /creator/works/:id
 */
router.put('/works/:id', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const workflowData = req.body;

  const workflow = await WorkflowService.updateWorkflow(id, userId, workflowData);

  res.json({
    success: true,
    data: workflow,
    message: '工作流更新成功'
  });
}));

/**
 * 提交审核
 * POST /creator/works/:id/submit
 */
router.post('/works/:id/submit', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  const workflow = await WorkflowService.submitForReview(id, userId);

  res.json({
    success: true,
    data: workflow,
    message: '已提交审核，请等待审核结果'
  });
}));

/**
 * 下架工作流
 * POST /creator/works/:id/archive
 */
router.post('/works/:id/archive', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  const workflow = await WorkflowService.archiveWorkflow(id, userId);

  res.json({
    success: true,
    data: workflow,
    message: '工作流已下架'
  });
}));

/**
 * 重新上架
 * POST /creator/works/:id/republish
 */
router.post('/works/:id/republish', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  const workflow = await WorkflowService.republishWorkflow(id, userId);

  res.json({
    success: true,
    data: workflow,
    message: '已重新提交审核'
  });
}));

/**
 * 删除工作流（仅草稿）
 * DELETE /creator/works/:id
 */
router.delete('/works/:id', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  await WorkflowService.deleteWorkflow(id, userId);

  res.json({
    success: true,
    message: '工作流已删除'
  });
}));

// ============ 合辑管理 ============

/**
 * 获取我的合辑列表
 * GET /creator/collections
 */
router.get('/collections', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { page = 1, pageSize = 20 } = req.query;

  const limit = parseInt(pageSize) || 20;
  const offset = ((parseInt(page) || 1) - 1) * limit;

  const countResult = await db.queryOne(
    'SELECT COUNT(*) as total FROM collections WHERE creator_id = ?',
    [userId]
  );

  const collections = await db.query(
    `SELECT c.*, COUNT(ci.id) as item_count
     FROM collections c
     LEFT JOIN collection_items ci ON c.id = ci.collection_id
     WHERE c.creator_id = ?
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  res.json({
    success: true,
    data: collections,
    pagination: {
      total: countResult.total,
      page: parseInt(page) || 1,
      pageSize: limit,
      totalPages: Math.ceil(countResult.total / limit)
    }
  });
}));

/**
 * 创建合辑
 * POST /creator/collections
 */
router.post('/collections', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { title, description, coverImage, workflowIds } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: '请输入合辑标题'
    });
  }

  const collectionId = crypto.randomUUID();

  await db.query(
    'INSERT INTO collections (id, creator_id, title, description, cover_image) VALUES (?, ?, ?, ?, ?)',
    [collectionId, userId, title.trim(), description || null, coverImage || null]
  );

  // 添加工作流到合辑
  if (workflowIds && workflowIds.length > 0) {
    for (let i = 0; i < workflowIds.length; i++) {
      const itemId = crypto.randomUUID();
      await db.query(
        'INSERT INTO collection_items (id, collection_id, workflow_id, sort_order) VALUES (?, ?, ?, ?)',
        [itemId, collectionId, workflowIds[i], i + 1]
      );
    }
  }

  res.json({
    success: true,
    data: { id: collectionId },
    message: '合辑创建成功'
  });
}));

/**
 * 更新合辑
 * PUT /creator/collections/:id
 */
router.put('/collections/:id', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { title, description, coverImage } = req.body;

  // 验证是否是自己的合辑
  const collection = await db.queryOne(
    'SELECT id FROM collections WHERE id = ? AND creator_id = ?',
    [id, userId]
  );

  if (!collection) {
    return res.status(404).json({
      success: false,
      error: '合辑不存在'
    });
  }

  const updates = [];
  const params = [];

  if (title) {
    updates.push('title = ?');
    params.push(title.trim());
  }

  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }

  if (coverImage !== undefined) {
    updates.push('cover_image = ?');
    params.push(coverImage);
  }

  if (updates.length > 0) {
    params.push(id);
    await db.query(
      `UPDATE collections SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );
  }

  res.json({
    success: true,
    message: '合辑已更新'
  });
}));

/**
 * 删除合辑
 * DELETE /creator/collections/:id
 */
router.delete('/collections/:id', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  await db.query(
    'DELETE FROM collections WHERE id = ? AND creator_id = ?',
    [id, userId]
  );

  res.json({
    success: true,
    message: '合辑已删除'
  });
}));

/**
 * 更新合辑内容
 * PUT /creator/collections/:id/items
 */
router.put('/collections/:id/items', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { workflowIds } = req.body;

  // 验证是否是自己的合辑
  const collection = await db.queryOne(
    'SELECT id FROM collections WHERE id = ? AND creator_id = ?',
    [id, userId]
  );

  if (!collection) {
    return res.status(404).json({
      success: false,
      error: '合辑不存在'
    });
  }

  // 清空现有内容
  await db.query('DELETE FROM collection_items WHERE collection_id = ?', [id]);

  // 添加新内容
  if (workflowIds && workflowIds.length > 0) {
    for (let i = 0; i < workflowIds.length; i++) {
      const itemId = crypto.randomUUID();
      await db.query(
        'INSERT INTO collection_items (id, collection_id, workflow_id, sort_order) VALUES (?, ?, ?, ?)',
        [itemId, id, workflowIds[i], i + 1]
      );
    }
  }

  res.json({
    success: true,
    message: '合辑内容已更新'
  });
}));

// ============ 提现管理 ============

/**
 * 获取可提现金额
 * GET /creator/withdrawal/available
 */
router.get('/withdrawal/available', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const stats = await db.queryOne(
    `SELECT
       pending_revenue,
       withdrawn_revenue,
       (SELECT COALESCE(SUM(amount), 0) FROM revenue_records WHERE user_id = ? AND status = 'settled') as settled_revenue
     FROM creator_stats
     WHERE user_id = ?`,
    [userId, userId]
  );

  const available = (parseFloat(stats?.settled_revenue) || 0) - (parseFloat(stats?.withdrawn_revenue) || 0);

  res.json({
    success: true,
    data: {
      pendingRevenue: parseFloat(stats?.pending_revenue) || 0,
      settledRevenue: parseFloat(stats?.settled_revenue) || 0,
      withdrawnRevenue: parseFloat(stats?.withdrawn_revenue) || 0,
      availableForWithdrawal: Math.max(0, available)
    }
  });
}));

/**
 * 申请提现
 * POST /creator/withdrawal/request
 */
router.post('/withdrawal/request', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { amount, accountType, accountInfo } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: '请输入有效的提现金额'
    });
  }

  // 检查可提现金额
  const stats = await db.queryOne(
    `SELECT
       (SELECT COALESCE(SUM(amount), 0) FROM revenue_records WHERE user_id = ? AND status = 'settled') as settled,
       withdrawn_revenue
     FROM creator_stats
     WHERE user_id = ?`,
    [userId, userId]
  );

  const available = (parseFloat(stats.settled) || 0) - (parseFloat(stats.withdrawn_revenue) || 0);

  if (amount > available) {
    return res.status(400).json({
      success: false,
      error: '提现金额超过可提现余额'
    });
  }

  // 创建提现申请
  const requestId = crypto.randomUUID();
  await db.query(
    `INSERT INTO withdrawal_requests
     (id, user_id, amount, account_type, account_info, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [requestId, userId, amount, accountType || 'bank', JSON.stringify(accountInfo || {})]
  );

  res.json({
    success: true,
    data: { id: requestId },
    message: '提现申请已提交，请等待审核'
  });
}));

/**
 * 获取提现记录
 * GET /creator/withdrawal/history
 */
router.get('/withdrawal/history', requireAuth, requireCreator, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { page = 1, pageSize = 20 } = req.query;

  const limit = parseInt(pageSize) || 20;
  const offset = ((parseInt(page) || 1) - 1) * limit;

  const countResult = await db.queryOne(
    'SELECT COUNT(*) as total FROM withdrawal_requests WHERE user_id = ?',
    [userId]
  );

  const requests = await db.query(
    `SELECT * FROM withdrawal_requests
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  res.json({
    success: true,
    data: requests.map(r => ({
      ...r,
      amount: parseFloat(r.amount),
      actualAmount: parseFloat(r.actual_amount)
    })),
    pagination: {
      total: countResult.total,
      page: parseInt(page) || 1,
      pageSize: limit,
      totalPages: Math.ceil(countResult.total / limit)
    }
  });
}));

// 辅助函数：获取状态名称
function getStatusName(status) {
  const names = {
    draft: '草稿',
    pending: '审核中',
    approved: '已上架',
    rejected: '已拒绝',
    archived: '已下架'
  };
  return names[status] || status;
}

module.exports = router;
