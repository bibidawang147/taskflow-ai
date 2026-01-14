/**
 * 工作方法广场路由
 * 提供工作流浏览、搜索、分类等功能
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const WorkflowService = require('../services/WorkflowService');
const PurchaseService = require('../services/PurchaseService');
const { asyncHandler, optionalAuth } = require('../middleware');
const { WORKFLOW_LEVEL, WORKFLOW_STATUS } = require('../config/constants');

/**
 * 获取工作流广场列表
 * GET /explore/workflows
 * 支持筛选：等级、分类、排序、搜索
 */
router.get('/workflows', optionalAuth, asyncHandler(async (req, res) => {
  const {
    level,           // 工作流等级: 1, 2, 3
    category,        // 分类ID
    sort = 'hot',    // 排序: hot, new, usage
    keyword,         // 搜索关键词
    creatorId,       // 创作者ID
    page = 1,
    pageSize = 20
  } = req.query;

  const userId = req.userId;
  const limit = Math.min(parseInt(pageSize) || 20, 50);
  const offset = ((parseInt(page) || 1) - 1) * limit;

  // 构建查询条件
  let whereClause = "WHERE w.status = 'approved'";
  const params = [];

  // 根据用户身份过滤可见工作流
  if (!userId) {
    // 未登录用户只能看到免费工作流
    whereClause += ' AND w.level = 1';
  } else {
    // 已登录用户需要检查会员状态
    const membership = await db.queryOne(
      "SELECT type, is_creator FROM memberships WHERE user_id = ? AND status = 'active'",
      [userId]
    );

    if (!membership || membership.type === 'free') {
      // Free用户只能看到免费工作流
      whereClause += ' AND w.level = 1';
    }
    // Pro用户和创作者可以看到所有等级
  }

  // 按等级筛选
  if (level) {
    whereClause += ' AND w.level = ?';
    params.push(parseInt(level));
  }

  // 按分类筛选
  if (category) {
    whereClause += ' AND w.category_id = ?';
    params.push(category);
  }

  // 按创作者筛选
  if (creatorId) {
    whereClause += ' AND w.creator_id = ?';
    params.push(creatorId);
  }

  // 关键词搜索
  if (keyword) {
    whereClause += ' AND (w.title LIKE ? OR w.description LIKE ? OR JSON_SEARCH(w.tags, "one", ?) IS NOT NULL)';
    const searchTerm = `%${keyword}%`;
    params.push(searchTerm, searchTerm, `%${keyword}%`);
  }

  // 排序
  let orderClause = 'ORDER BY ';
  switch (sort) {
    case 'new':
      orderClause += 'w.published_at DESC';
      break;
    case 'usage':
      orderClause += 'w.usage_count DESC';
      break;
    case 'purchase':
      orderClause += 'w.purchase_count DESC';
      break;
    case 'hot':
    default:
      // 热门：综合使用次数和时间
      orderClause += '(w.usage_count * 0.7 + w.purchase_count * 10 + DATEDIFF(NOW(), w.published_at) * -0.1) DESC';
      break;
  }

  // 查询总数
  const countResult = await db.queryOne(
    `SELECT COUNT(*) as total FROM workflows w ${whereClause}`,
    params
  );

  // 查询列表
  const workflows = await db.query(
    `SELECT
       w.id, w.title, w.description, w.cover_image, w.level, w.price,
       w.usage_count, w.purchase_count, w.tags, w.published_at,
       u.id as creator_id, u.username as creator_name, u.avatar as creator_avatar,
       cs.level as creator_level,
       c.name as category_name
     FROM workflows w
     LEFT JOIN users u ON w.creator_id = u.id
     LEFT JOIN creator_stats cs ON w.creator_id = cs.user_id
     LEFT JOIN workflow_categories c ON w.category_id = c.id
     ${whereClause}
     ${orderClause}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  // 如果用户已登录，获取已购买的工作流列表
  let purchasedIds = [];
  if (userId) {
    purchasedIds = await PurchaseService.getPurchasedWorkflowIds(userId);
  }

  res.json({
    success: true,
    data: workflows.map(w => ({
      ...w,
      price: parseFloat(w.price) || 0,
      isPurchased: purchasedIds.includes(w.id),
      levelName: w.level === 1 ? '免费' : (w.level === 2 ? 'Pro免费' : '付费'),
      tags: parseTags(w.tags)
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
 * 获取工作流详情
 * GET /explore/workflows/:id
 */
router.get('/workflows/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const workflow = await db.queryOne(
    `SELECT
       w.*,
       u.id as creator_id, u.username as creator_name, u.avatar as creator_avatar,
       cs.level as creator_level, cs.work_count as creator_works,
       c.name as category_name
     FROM workflows w
     LEFT JOIN users u ON w.creator_id = u.id
     LEFT JOIN creator_stats cs ON w.creator_id = cs.user_id
     LEFT JOIN workflow_categories c ON w.category_id = c.id
     WHERE w.id = ? AND w.status = 'approved'`,
    [id]
  );

  if (!workflow) {
    return res.status(404).json({
      success: false,
      error: '工作流不存在或未上架'
    });
  }

  // 检查访问权限
  let canAccess = true;
  let canViewFullPrompt = false;
  let isPurchased = false;
  let isOwner = false;
  let priceInfo = null;

  if (userId) {
    isOwner = workflow.creator_id === userId;

    // 检查会员状态
    const membership = await db.queryOne(
      "SELECT type, is_creator FROM memberships WHERE user_id = ? AND status = 'active'",
      [userId]
    );

    const isPro = membership && membership.type === 'pro';
    const isCreator = membership && membership.is_creator;

    // 检查是否已购买
    if (workflow.level === WORKFLOW_LEVEL.PAID && !isOwner) {
      isPurchased = await PurchaseService.hasPurchased(userId, id);
    }

    // 判断是否可以查看完整prompt
    if (isOwner || isPro || isCreator || isPurchased) {
      canViewFullPrompt = true;
    }

    // 判断是否可以访问
    if (workflow.level === WORKFLOW_LEVEL.PRO_FREE && !isPro && !isCreator) {
      canAccess = false;
    }

    // 获取价格信息（付费工作流）
    if (workflow.level === WORKFLOW_LEVEL.PAID && !isOwner && !isPurchased) {
      try {
        priceInfo = await PurchaseService.calculatePrice(userId, id);
      } catch (e) {
        // 忽略价格计算错误
      }
    }
  } else {
    // 未登录用户
    if (workflow.level !== WORKFLOW_LEVEL.FREE) {
      canAccess = false;
    }
  }

  // 处理prompt显示
  let promptDisplay = null;
  if (canViewFullPrompt) {
    promptDisplay = workflow.prompt;
  } else if (workflow.prompt) {
    // 只显示前50个字符
    promptDisplay = workflow.prompt.substring(0, 50) + '...';
  }

  // 增加浏览次数（可选）
  await db.query(
    'UPDATE workflows SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?',
    [id]
  );

  res.json({
    success: true,
    data: {
      ...workflow,
      prompt: promptDisplay,
      price: parseFloat(workflow.price) || 0,
      tags: parseTags(workflow.tags),
      canAccess,
      canViewFullPrompt,
      isPurchased,
      isOwner,
      priceInfo,
      levelName: workflow.level === 1 ? '免费' : (workflow.level === 2 ? 'Pro免费' : '付费')
    }
  });
}));

/**
 * 获取分类列表
 * GET /explore/categories
 */
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await db.query(
    `SELECT c.*, COUNT(w.id) as workflow_count
     FROM workflow_categories c
     LEFT JOIN workflows w ON c.id = w.category_id AND w.status = 'approved'
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.name ASC`
  );

  res.json({
    success: true,
    data: categories
  });
}));

/**
 * 获取热门标签
 * GET /explore/tags
 */
router.get('/tags', asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;

  // 从工作流中提取热门标签
  const workflows = await db.query(
    `SELECT tags FROM workflows WHERE status = 'approved' AND tags IS NOT NULL AND tags != ''`
  );

  // 统计标签频率
  const tagCount = {};
  for (const w of workflows) {
    const tags = parseTags(w.tags);
    for (const tag of tags) {
      const trimmedTag = tag.trim();
      if (trimmedTag) {
        tagCount[trimmedTag] = (tagCount[trimmedTag] || 0) + 1;
      }
    }
  }

  // 排序并取前N个
  const sortedTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, parseInt(limit))
    .map(([tag, count]) => ({ tag, count }));

  res.json({
    success: true,
    data: sortedTags
  });
}));

/**
 * 获取热门创作者
 * GET /explore/creators
 */
router.get('/creators', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const creators = await db.query(
    `SELECT
       u.id, u.username, u.avatar,
       cs.level, cs.work_count, cs.total_usage,
       COUNT(DISTINCT w.id) as published_count
     FROM users u
     INNER JOIN memberships m ON u.id = m.user_id AND m.is_creator = 1 AND m.status = 'active'
     INNER JOIN creator_stats cs ON u.id = cs.user_id
     LEFT JOIN workflows w ON u.id = w.creator_id AND w.status = 'approved'
     GROUP BY u.id, u.username, u.avatar, cs.level, cs.work_count, cs.total_usage
     ORDER BY cs.total_usage DESC, cs.work_count DESC
     LIMIT ?`,
    [parseInt(limit)]
  );

  res.json({
    success: true,
    data: creators.map(c => ({
      ...c,
      levelName: getLevelName(c.level)
    }))
  });
}));

/**
 * 获取推荐工作流
 * GET /explore/recommended
 */
router.get('/recommended', optionalAuth, asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const userId = req.userId;

  // 简单推荐：热门 + 新发布
  let levelFilter = 'w.level = 1'; // 默认只推荐免费的

  if (userId) {
    const membership = await db.queryOne(
      "SELECT type, is_creator FROM memberships WHERE user_id = ? AND status = 'active'",
      [userId]
    );

    if (membership && membership.type === 'pro') {
      levelFilter = '1=1'; // Pro用户推荐所有等级
    }
  }

  const recommended = await db.query(
    `SELECT
       w.id, w.title, w.description, w.cover_image, w.level, w.price,
       w.usage_count, w.purchase_count, w.published_at,
       u.username as creator_name, u.avatar as creator_avatar,
       cs.level as creator_level
     FROM workflows w
     LEFT JOIN users u ON w.creator_id = u.id
     LEFT JOIN creator_stats cs ON w.creator_id = cs.user_id
     WHERE w.status = 'approved' AND ${levelFilter}
     ORDER BY
       (w.usage_count * 0.5 + DATEDIFF(NOW(), w.published_at) * -1) DESC
     LIMIT ?`,
    [parseInt(limit)]
  );

  res.json({
    success: true,
    data: recommended.map(w => ({
      ...w,
      price: parseFloat(w.price) || 0,
      levelName: w.level === 1 ? '免费' : (w.level === 2 ? 'Pro免费' : '付费')
    }))
  });
}));

/**
 * 获取创作者主页
 * GET /explore/creators/:id
 */
router.get('/creators/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const creator = await db.queryOne(
    `SELECT
       u.id, u.username, u.avatar, u.created_at,
       cs.level, cs.work_count, cs.total_usage, cs.total_purchases
     FROM users u
     INNER JOIN memberships m ON u.id = m.user_id AND m.is_creator = 1 AND m.status = 'active'
     INNER JOIN creator_stats cs ON u.id = cs.user_id
     WHERE u.id = ?`,
    [id]
  );

  if (!creator) {
    return res.status(404).json({
      success: false,
      error: '创作者不存在'
    });
  }

  // 获取创作者的工作流
  let levelFilter = 'w.level = 1';
  if (userId) {
    const membership = await db.queryOne(
      "SELECT type, is_creator FROM memberships WHERE user_id = ? AND status = 'active'",
      [userId]
    );
    if (membership && membership.type === 'pro') {
      levelFilter = '1=1';
    }
  }

  const workflows = await db.query(
    `SELECT
       w.id, w.title, w.description, w.cover_image, w.level, w.price,
       w.usage_count, w.purchase_count, w.published_at
     FROM workflows w
     WHERE w.creator_id = ? AND w.status = 'approved' AND ${levelFilter}
     ORDER BY w.published_at DESC
     LIMIT 20`,
    [id]
  );

  // 获取创作者的合辑
  const collections = await db.query(
    `SELECT c.*, COUNT(ci.id) as item_count
     FROM collections c
     LEFT JOIN collection_items ci ON c.id = ci.collection_id
     WHERE c.creator_id = ?
     GROUP BY c.id
     ORDER BY c.created_at DESC`,
    [id]
  );

  res.json({
    success: true,
    data: {
      creator: {
        ...creator,
        levelName: getLevelName(creator.level)
      },
      workflows: workflows.map(w => ({
        ...w,
        price: parseFloat(w.price) || 0,
        levelName: w.level === 1 ? '免费' : (w.level === 2 ? 'Pro免费' : '付费')
      })),
      collections
    }
  });
}));

/**
 * 获取合辑详情
 * GET /explore/collections/:id
 */
router.get('/collections/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const collection = await db.queryOne(
    `SELECT c.*, u.username as creator_name, u.avatar as creator_avatar
     FROM collections c
     LEFT JOIN users u ON c.creator_id = u.id
     WHERE c.id = ?`,
    [id]
  );

  if (!collection) {
    return res.status(404).json({
      success: false,
      error: '合辑不存在'
    });
  }

  // 获取合辑中的工作流
  let levelFilter = 'w.level = 1';
  if (userId) {
    const membership = await db.queryOne(
      "SELECT type, is_creator FROM memberships WHERE user_id = ? AND status = 'active'",
      [userId]
    );
    if (membership && membership.type === 'pro') {
      levelFilter = '1=1';
    }
  }

  const items = await db.query(
    `SELECT
       w.id, w.title, w.description, w.cover_image, w.level, w.price,
       w.usage_count, ci.sort_order
     FROM collection_items ci
     INNER JOIN workflows w ON ci.workflow_id = w.id
     WHERE ci.collection_id = ? AND w.status = 'approved' AND ${levelFilter}
     ORDER BY ci.sort_order ASC`,
    [id]
  );

  res.json({
    success: true,
    data: {
      collection,
      items: items.map(w => ({
        ...w,
        price: parseFloat(w.price) || 0,
        levelName: w.level === 1 ? '免费' : (w.level === 2 ? 'Pro免费' : '付费')
      }))
    }
  });
}));

/**
 * 使用工作流（记录使用次数）
 * POST /explore/workflows/:id/use
 */
router.post('/workflows/:id/use', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  // 记录使用
  const result = await WorkflowService.recordUsage(id, userId);

  res.json({
    success: true,
    data: result
  });
}));

// 辅助函数：获取等级名称
function getLevelName(level) {
  const names = ['', '新晋创作者', '初级创作者', '进阶创作者', '资深创作者',
                 '专业创作者', '高级创作者', '精英创作者', '大师创作者',
                 '殿堂创作者', '传奇创作者'];
  return names[level] || '创作者';
}

// 辅助函数：解析标签（支持JSON和字符串格式）
function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return tags.split(',').filter(t => t.trim());
    }
  }
  return [];
}

module.exports = router;
