/**
 * 管理后台API路由
 * 工作流审核、用户管理、收益报表等功能
 */

const express = require('express');
const router = express.Router();

const WorkflowService = require('../services/WorkflowService');
const AdminService = require('../services/AdminService');
const PurchaseService = require('../services/PurchaseService');
const RevenueService = require('../services/RevenueService');
const { asyncHandler } = require('../middleware');

/**
 * 管理员认证中间件
 * 需要配合实际的管理员认证系统使用
 */
const requireAdmin = asyncHandler(async (req, res, next) => {
  // 这里应该验证管理员身份
  // 示例：从header或session获取管理员ID
  const adminId = req.headers['x-admin-id'] || req.adminId;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: '需要管理员权限'
    });
  }

  req.adminId = adminId;
  next();
});

/**
 * 获取待审核工作流列表
 * GET /api/admin/workflows/pending
 */
router.get('/workflows/pending', requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const result = await WorkflowService.getPendingWorkflows({
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20
  });

  res.json({
    success: true,
    data: result
  });
}));

/**
 * 获取工作流详情（管理员视图，包含完整信息）
 * GET /api/admin/workflows/:id
 */
router.get('/workflows/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const workflow = await WorkflowService.getWorkflowById(id);

  res.json({
    success: true,
    data: workflow
  });
}));

/**
 * 审核通过工作流
 * POST /api/admin/workflows/:id/approve
 */
router.post('/workflows/:id/approve', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.adminId;

  const workflow = await WorkflowService.approveWorkflow(id, adminId);

  res.json({
    success: true,
    data: workflow,
    message: '工作流审核通过'
  });
}));

/**
 * 审核拒绝工作流
 * POST /api/admin/workflows/:id/reject
 */
router.post('/workflows/:id/reject', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.adminId;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      error: '请填写拒绝原因'
    });
  }

  const workflow = await WorkflowService.rejectWorkflow(id, adminId, reason);

  res.json({
    success: true,
    data: workflow,
    message: '工作流已拒绝'
  });
}));

/**
 * 批量审核通过
 * POST /api/admin/workflows/batch-approve
 */
router.post('/workflows/batch-approve', requireAdmin, asyncHandler(async (req, res) => {
  const { ids } = req.body;
  const adminId = req.adminId;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      error: '请选择要审核的工作流'
    });
  }

  const results = [];
  const errors = [];

  for (const id of ids) {
    try {
      await WorkflowService.approveWorkflow(id, adminId);
      results.push({ id, success: true });
    } catch (error) {
      errors.push({ id, success: false, error: error.message });
    }
  }

  res.json({
    success: true,
    data: {
      total: ids.length,
      succeeded: results.length,
      failed: errors.length,
      results,
      errors
    }
  });
}));

/**
 * 批量审核拒绝
 * POST /api/admin/workflows/batch-reject
 */
router.post('/workflows/batch-reject', requireAdmin, asyncHandler(async (req, res) => {
  const { ids, reason } = req.body;
  const adminId = req.adminId;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      error: '请选择要审核的工作流'
    });
  }

  if (!reason) {
    return res.status(400).json({
      success: false,
      error: '请填写拒绝原因'
    });
  }

  const results = [];
  const errors = [];

  for (const id of ids) {
    try {
      await WorkflowService.rejectWorkflow(id, adminId, reason);
      results.push({ id, success: true });
    } catch (error) {
      errors.push({ id, success: false, error: error.message });
    }
  }

  res.json({
    success: true,
    data: {
      total: ids.length,
      succeeded: results.length,
      failed: errors.length,
      results,
      errors
    }
  });
}));

/**
 * 获取审核统计
 * GET /api/admin/workflows/stats
 */
router.get('/workflows/stats', requireAdmin, asyncHandler(async (req, res) => {
  const db = require('../config/database');

  const stats = await db.query(`
    SELECT
      status,
      COUNT(*) as count
    FROM workflows
    GROUP BY status
  `);

  const byLevel = await db.query(`
    SELECT
      level,
      COUNT(*) as count
    FROM workflows
    WHERE status = 'approved'
    GROUP BY level
  `);

  // 今日审核数
  const todayApproved = await db.queryOne(`
    SELECT COUNT(*) as count
    FROM workflow_audits
    WHERE action = 'approve'
    AND DATE(created_at) = CURDATE()
  `);

  const todayRejected = await db.queryOne(`
    SELECT COUNT(*) as count
    FROM workflow_audits
    WHERE action = 'reject'
    AND DATE(created_at) = CURDATE()
  `);

  res.json({
    success: true,
    data: {
      byStatus: stats.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {}),
      byLevel: byLevel.reduce((acc, row) => {
        acc[row.level] = row.count;
        return acc;
      }, {}),
      today: {
        approved: todayApproved.count,
        rejected: todayRejected.count
      }
    }
  });
}));

// ============ 系统仪表盘 ============

/**
 * 获取系统仪表盘数据
 * GET /api/admin/dashboard
 */
router.get('/dashboard', requireAdmin, asyncHandler(async (req, res) => {
  const dashboard = await AdminService.getDashboard();

  res.json({
    success: true,
    data: dashboard
  });
}));

// ============ 用户管理 ============

/**
 * 获取用户列表
 * GET /api/admin/users
 */
router.get('/users', requireAdmin, asyncHandler(async (req, res) => {
  const {
    page, limit, keyword, membershipType, isCreator, status, sortBy, sortOrder
  } = req.query;

  const result = await AdminService.getUserList({
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
    keyword,
    membershipType,
    isCreator: isCreator !== undefined ? isCreator === 'true' : undefined,
    status,
    sortBy,
    sortOrder
  });

  res.json({
    success: true,
    data: result.users,
    pagination: result.pagination
  });
}));

/**
 * 获取用户详情
 * GET /api/admin/users/:id
 */
router.get('/users/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await AdminService.getUserDetail(id);

  res.json({
    success: true,
    data: user
  });
}));

/**
 * 更新用户状态
 * PUT /api/admin/users/:id/status
 */
router.put('/users/:id/status', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const result = await AdminService.updateUserStatus(id, status, req.adminId, reason);

  res.json({
    success: true,
    data: result,
    message: '用户状态已更新'
  });
}));

// ============ 创作者申请管理 ============

/**
 * 获取创作者申请列表
 * GET /api/admin/creator-applications
 */
router.get('/creator-applications', requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;

  const result = await AdminService.getCreatorApplications({
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
    status: status || 'pending'
  });

  res.json({
    success: true,
    data: result.applications,
    pagination: result.pagination
  });
}));

/**
 * 审核创作者申请
 * POST /api/admin/creator-applications/:id/review
 */
router.post('/creator-applications/:id/review', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      error: '无效的操作'
    });
  }

  if (action === 'reject' && !reason) {
    return res.status(400).json({
      success: false,
      error: '请填写拒绝原因'
    });
  }

  const result = await AdminService.reviewCreatorApplication(id, action, req.adminId, reason);

  res.json({
    success: true,
    data: result,
    message: action === 'approve' ? '已批准创作者申请' : '已拒绝创作者申请'
  });
}));

// ============ 收益管理 ============

/**
 * 获取收益概览
 * GET /api/admin/revenue/overview
 */
router.get('/revenue/overview', requireAdmin, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const overview = await AdminService.getRevenueOverview({ startDate, endDate });

  res.json({
    success: true,
    data: overview
  });
}));

/**
 * 获取收益趋势
 * GET /api/admin/revenue/trend
 */
router.get('/revenue/trend', requireAdmin, asyncHandler(async (req, res) => {
  const { period, days } = req.query;

  const trend = await AdminService.getRevenueTrend({
    period: period || 'daily',
    days: days ? parseInt(days) : 30
  });

  res.json({
    success: true,
    data: trend
  });
}));

/**
 * 获取创作者收益排行
 * GET /api/admin/revenue/ranking
 */
router.get('/revenue/ranking', requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, period } = req.query;

  const ranking = await AdminService.getCreatorRevenueRanking({
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
    period
  });

  res.json({
    success: true,
    data: ranking.ranking,
    pagination: ranking.pagination
  });
}));

/**
 * 获取平台销售统计
 * GET /api/admin/revenue/stats
 */
router.get('/revenue/stats', requireAdmin, asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy } = req.query;

  const stats = await PurchaseService.getPlatformSalesStats({
    startDate,
    endDate,
    groupBy: groupBy || 'day'
  });

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * 手动触发收益分配
 * POST /api/admin/revenue/distribute
 */
router.post('/revenue/distribute', requireAdmin, asyncHandler(async (req, res) => {
  const { period } = req.body;

  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return res.status(400).json({
      success: false,
      error: '请提供有效的结算周期 (格式: YYYY-MM)'
    });
  }

  const result = await AdminService.triggerRevenueDistribution(req.adminId, period);

  res.json({
    success: true,
    data: result,
    message: '收益分配已完成'
  });
}));

/**
 * 预览收益分配
 * GET /api/admin/revenue/preview
 */
router.get('/revenue/preview', requireAdmin, asyncHandler(async (req, res) => {
  const preview = await RevenueService.previewMonthlySettlement();

  res.json({
    success: true,
    data: preview
  });
}));

// ============ 退款管理 ============

/**
 * 获取待处理退款列表
 * GET /api/admin/refunds/pending
 */
router.get('/refunds/pending', requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const result = await PurchaseService.getPendingRefunds({
    page: page ? parseInt(page) : 1,
    pageSize: limit ? parseInt(limit) : 20
  });

  res.json({
    success: true,
    data: result.refunds,
    pagination: result.pagination
  });
}));

/**
 * 处理退款
 * POST /api/admin/refunds/:id/process
 */
router.post('/refunds/:id/process', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      error: '无效的操作'
    });
  }

  const result = await PurchaseService.processRefund(id, req.adminId, action, reason);

  res.json({
    success: true,
    data: result,
    message: action === 'approve' ? '退款已批准' : '退款已拒绝'
  });
}));

// ============ 提现管理 ============

/**
 * 获取提现申请列表
 * GET /api/admin/withdrawals
 */
router.get('/withdrawals', requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;

  const result = await AdminService.getWithdrawalRequests({
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
    status: status || 'pending'
  });

  res.json({
    success: true,
    data: result.requests,
    pagination: result.pagination
  });
}));

/**
 * 处理提现申请
 * POST /api/admin/withdrawals/:id/process
 */
router.post('/withdrawals/:id/process', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, reason, transactionId } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      error: '无效的操作'
    });
  }

  const result = await AdminService.processWithdrawal(id, action, req.adminId, {
    reason,
    transactionId
  });

  res.json({
    success: true,
    data: result,
    message: action === 'approve' ? '提现已批准' : '提现已拒绝'
  });
}));

// ============ 系统配置 ============

/**
 * 获取系统配置
 * GET /api/admin/config
 */
router.get('/config', requireAdmin, asyncHandler(async (req, res) => {
  const config = await AdminService.getSystemConfig();

  res.json({
    success: true,
    data: config
  });
}));

/**
 * 更新系统配置
 * PUT /api/admin/config/:key
 */
router.put('/config/:key', requireAdmin, asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  if (value === undefined) {
    return res.status(400).json({
      success: false,
      error: '请提供配置值'
    });
  }

  const result = await AdminService.updateSystemConfig(key, value, req.adminId);

  res.json({
    success: true,
    data: result,
    message: '配置已更新'
  });
}));

// ============ 操作日志 ============

/**
 * 获取操作日志
 * GET /api/admin/logs
 */
router.get('/logs', requireAdmin, asyncHandler(async (req, res) => {
  const {
    page, limit, operatorType, operatorId, action, targetType, startDate, endDate
  } = req.query;

  const result = await AdminService.getOperationLogs({
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 50,
    operatorType,
    operatorId,
    action,
    targetType,
    startDate,
    endDate
  });

  res.json({
    success: true,
    data: result.logs,
    pagination: result.pagination
  });
}));

module.exports = router;
