/**
 * 个人工作台路由
 * 提供用户个人相关的功能：已购买、收藏、使用历史等
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/database');
const UserService = require('../services/UserService');
const PermissionService = require('../services/PermissionService');
const PurchaseService = require('../services/PurchaseService');
const { requireAuth, asyncHandler } = require('../middleware');

/**
 * 获取工作台概览
 * GET /workspace/overview
 */
router.get('/overview', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;

  // 获取用户身份信息
  const identity = await UserService.getUserIdentity(userId);

  // 获取权限信息
  const permissions = await PermissionService.getUserPermissions(userId);

  // 获取统计数据
  const stats = await db.queryOne(
    `SELECT
       (SELECT COUNT(*) FROM workflow_purchases WHERE buyer_id = ? AND status = 'paid') as purchased_count,
       (SELECT COUNT(*) FROM user_favorites WHERE user_id = ?) as favorite_count,
       (SELECT COUNT(*) FROM workflow_usage WHERE user_id = ? AND DATE(used_at) = CURDATE()) as today_usage,
       (SELECT COUNT(*) FROM workflows WHERE creator_id = ?) as my_workflows
    `,
    [userId, userId, userId, userId]
  );

  // 获取AI使用配额
  const aiQuota = await PermissionService.getAIQuota(userId);

  res.json({
    success: true,
    data: {
      identity,
      permissions,
      stats: {
        purchasedCount: stats.purchased_count,
        favoriteCount: stats.favorite_count,
        todayUsage: stats.today_usage,
        myWorkflows: stats.my_workflows
      },
      aiQuota
    }
  });
}));

/**
 * 获取用户信息
 * GET /workspace/profile
 */
router.get('/profile', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const user = await db.queryOne(
    `SELECT
       u.id, u.username, u.email, u.avatar, u.phone, u.created_at,
       m.type as membership_type, m.is_creator, m.started_at as membership_started,
       m.expires_at as membership_expires
     FROM users u
     LEFT JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
     WHERE u.id = ?`,
    [userId]
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      error: '用户不存在'
    });
  }

  res.json({
    success: true,
    data: {
      ...user,
      isCreator: !!user.is_creator,
      membershipDaysLeft: user.membership_expires
        ? Math.max(0, Math.ceil((new Date(user.membership_expires) - new Date()) / (1000 * 60 * 60 * 24)))
        : null
    }
  });
}));

/**
 * 更新用户信息
 * PUT /workspace/profile
 */
router.put('/profile', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { username, avatar, phone } = req.body;

  const updates = [];
  const params = [];

  if (username) {
    // 检查用户名是否已存在
    const existing = await db.queryOne(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, userId]
    );
    if (existing) {
      return res.status(400).json({
        success: false,
        error: '用户名已被使用'
      });
    }
    updates.push('username = ?');
    params.push(username);
  }

  if (avatar !== undefined) {
    updates.push('avatar = ?');
    params.push(avatar);
  }

  if (phone !== undefined) {
    updates.push('phone = ?');
    params.push(phone);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      error: '没有要更新的内容'
    });
  }

  params.push(userId);
  await db.query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
    params
  );

  res.json({
    success: true,
    message: '个人信息已更新'
  });
}));

/**
 * 获取已购买的工作流
 * GET /workspace/purchases
 */
router.get('/purchases', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { page = 1, pageSize = 20 } = req.query;

  const result = await PurchaseService.getUserPurchases(userId, {
    status: 'paid',
    page: parseInt(page),
    limit: parseInt(pageSize)
  });

  res.json({
    success: true,
    data: result.purchases,
    pagination: {
      total: result.total,
      page: result.page,
      pageSize: result.limit,
      totalPages: result.totalPages
    }
  });
}));

/**
 * 获取收藏列表
 * GET /workspace/favorites
 */
router.get('/favorites', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { page = 1, pageSize = 20, folderId } = req.query;

  const limit = parseInt(pageSize) || 20;
  const offset = ((parseInt(page) || 1) - 1) * limit;

  let whereClause = 'WHERE uf.user_id = ?';
  const params = [userId];

  if (folderId) {
    whereClause += ' AND uf.folder_id = ?';
    params.push(folderId);
  }

  const countResult = await db.queryOne(
    `SELECT COUNT(*) as total FROM user_favorites uf ${whereClause}`,
    params
  );

  const favorites = await db.query(
    `SELECT
       uf.id as favorite_id, uf.created_at as favorited_at, uf.folder_id,
       w.id, w.title, w.description, w.cover_image, w.level, w.price,
       w.usage_count, w.status,
       u.username as creator_name, u.avatar as creator_avatar
     FROM user_favorites uf
     INNER JOIN workflows w ON uf.workflow_id = w.id
     LEFT JOIN users u ON w.creator_id = u.id
     ${whereClause}
     ORDER BY uf.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: favorites.map(f => ({
      ...f,
      price: parseFloat(f.price) || 0,
      levelName: f.level === 1 ? '免费' : (f.level === 2 ? 'Pro免费' : '付费')
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
 * 添加收藏
 * POST /workspace/favorites
 */
router.post('/favorites', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { workflowId, folderId } = req.body;

  if (!workflowId) {
    return res.status(400).json({
      success: false,
      error: '请指定要收藏的工作流'
    });
  }

  // 检查工作流是否存在
  const workflow = await db.queryOne(
    'SELECT id FROM workflows WHERE id = ?',
    [workflowId]
  );

  if (!workflow) {
    return res.status(404).json({
      success: false,
      error: '工作流不存在'
    });
  }

  // 检查是否已收藏
  const existing = await db.queryOne(
    'SELECT id FROM user_favorites WHERE user_id = ? AND workflow_id = ?',
    [userId, workflowId]
  );

  if (existing) {
    return res.status(400).json({
      success: false,
      error: '已收藏该工作流'
    });
  }

  const favoriteId = crypto.randomUUID();
  await db.query(
    'INSERT INTO user_favorites (id, user_id, workflow_id, folder_id) VALUES (?, ?, ?, ?)',
    [favoriteId, userId, workflowId, folderId || null]
  );

  res.json({
    success: true,
    data: { id: favoriteId },
    message: '收藏成功'
  });
}));

/**
 * 取消收藏
 * DELETE /workspace/favorites/:workflowId
 */
router.delete('/favorites/:workflowId', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { workflowId } = req.params;

  await db.query(
    'DELETE FROM user_favorites WHERE user_id = ? AND workflow_id = ?',
    [userId, workflowId]
  );

  res.json({
    success: true,
    message: '已取消收藏'
  });
}));

/**
 * 获取收藏文件夹列表
 * GET /workspace/favorite-folders
 */
router.get('/favorite-folders', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const folders = await db.query(
    `SELECT f.*, COUNT(uf.id) as item_count
     FROM favorite_folders f
     LEFT JOIN user_favorites uf ON f.id = uf.folder_id
     WHERE f.user_id = ?
     GROUP BY f.id
     ORDER BY f.created_at ASC`,
    [userId]
  );

  res.json({
    success: true,
    data: folders
  });
}));

/**
 * 创建收藏文件夹
 * POST /workspace/favorite-folders
 */
router.post('/favorite-folders', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: '请输入文件夹名称'
    });
  }

  const folderId = crypto.randomUUID();
  await db.query(
    'INSERT INTO favorite_folders (id, user_id, name) VALUES (?, ?, ?)',
    [folderId, userId, name.trim()]
  );

  res.json({
    success: true,
    data: { id: folderId, name: name.trim() },
    message: '文件夹创建成功'
  });
}));

/**
 * 删除收藏文件夹
 * DELETE /workspace/favorite-folders/:id
 */
router.delete('/favorite-folders/:id', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  // 将该文件夹下的收藏移到未分类
  await db.query(
    'UPDATE user_favorites SET folder_id = NULL WHERE folder_id = ? AND user_id = ?',
    [id, userId]
  );

  await db.query(
    'DELETE FROM favorite_folders WHERE id = ? AND user_id = ?',
    [id, userId]
  );

  res.json({
    success: true,
    message: '文件夹已删除'
  });
}));

/**
 * 获取使用历史
 * GET /workspace/history
 */
router.get('/history', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { page = 1, pageSize = 20 } = req.query;

  const limit = parseInt(pageSize) || 20;
  const offset = ((parseInt(page) || 1) - 1) * limit;

  const countResult = await db.queryOne(
    'SELECT COUNT(DISTINCT workflow_id) as total FROM workflow_usage WHERE user_id = ?',
    [userId]
  );

  // 获取最近使用的工作流（去重）
  const history = await db.query(
    `SELECT
       wu.workflow_id, MAX(wu.used_at) as last_used_at, COUNT(*) as use_count,
       w.title, w.description, w.cover_image, w.level, w.price, w.status,
       u.username as creator_name
     FROM workflow_usage wu
     INNER JOIN workflows w ON wu.workflow_id = w.id
     LEFT JOIN users u ON w.creator_id = u.id
     WHERE wu.user_id = ?
     GROUP BY wu.workflow_id, w.title, w.description, w.cover_image, w.level, w.price, w.status, u.username
     ORDER BY last_used_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  res.json({
    success: true,
    data: history.map(h => ({
      ...h,
      price: parseFloat(h.price) || 0,
      levelName: h.level === 1 ? '免费' : (h.level === 2 ? 'Pro免费' : '付费')
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
 * 获取我的工作流（草稿和已发布）
 * GET /workspace/my-workflows
 */
router.get('/my-workflows', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { status, page = 1, pageSize = 20 } = req.query;

  const limit = parseInt(pageSize) || 20;
  const offset = ((parseInt(page) || 1) - 1) * limit;

  let whereClause = 'WHERE creator_id = ?';
  const params = [userId];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  const countResult = await db.queryOne(
    `SELECT COUNT(*) as total FROM workflows ${whereClause}`,
    params
  );

  const workflows = await db.query(
    `SELECT
       id, title, description, cover_image, level, price, status,
       usage_count, purchase_count, created_at, updated_at, published_at
     FROM workflows
     ${whereClause}
     ORDER BY updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: workflows.map(w => ({
      ...w,
      price: parseFloat(w.price) || 0,
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
 * 检查是否可以申请创作者
 * GET /workspace/creator-eligibility
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
 * POST /workspace/apply-creator
 */
router.post('/apply-creator', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { reason } = req.body;

  const result = await UserService.applyForCreator(userId, reason);

  res.json({
    success: true,
    data: result,
    message: '创作者申请已提交，请等待审核'
  });
}));

/**
 * 获取创作者申请状态
 * GET /workspace/creator-application
 */
router.get('/creator-application', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const application = await db.queryOne(
    `SELECT * FROM creator_applications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  res.json({
    success: true,
    data: application
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
