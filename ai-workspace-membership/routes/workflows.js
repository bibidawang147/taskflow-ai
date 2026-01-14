/**
 * 工作流API路由
 */

const express = require('express');
const router = express.Router();

const WorkflowService = require('../services/WorkflowService');
const PermissionService = require('../services/PermissionService');
const { requireAuth, requirePro, requireCreator, asyncHandler } = require('../middleware');
const { WORKFLOW_LEVEL } = require('../config/constants');

/**
 * 获取公开工作流列表（探索页）
 * GET /api/workflows
 */
router.get('/', asyncHandler(async (req, res) => {
  const { level, categoryId, keyword, page, limit, orderBy, order } = req.query;

  const result = await WorkflowService.getPublicWorkflows({
    level: level ? parseInt(level) : undefined,
    categoryId,
    keyword,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
    orderBy,
    order
  });

  res.json({
    success: true,
    data: result
  });
}));

/**
 * 获取工作流详情
 * GET /api/workflows/:id
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId; // 可能未登录

  const workflow = await WorkflowService.getWorkflowById(id);

  // 处理Prompt显示
  let visiblePrompt = { content: workflow.prompt_preview, isTruncated: true };
  if (userId) {
    visiblePrompt = await PermissionService.getVisiblePrompt(userId, workflow.prompt);
  }

  // 检查使用权限
  let canUse = { canUse: false, reason: '请先登录' };
  if (userId) {
    canUse = await PermissionService.canUseWorkflow(userId, id);
  }

  res.json({
    success: true,
    data: {
      ...workflow,
      prompt: visiblePrompt.content,
      promptTruncated: visiblePrompt.isTruncated,
      canUse: canUse.canUse,
      useInfo: canUse
    }
  });
}));

/**
 * 创建工作流（草稿）
 * POST /api/workflows
 * 需要登录
 */
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { title, description, prompt, coverImage, categoryId, tags } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      error: '请填写工作流标题'
    });
  }

  const workflow = await WorkflowService.createWorkflow(userId, {
    title,
    description,
    prompt,
    coverImage,
    categoryId,
    tags
  });

  res.status(201).json({
    success: true,
    data: workflow
  });
}));

/**
 * 更新工作流
 * PUT /api/workflows/:id
 */
router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const workflow = await WorkflowService.updateWorkflow(id, userId, req.body);

  res.json({
    success: true,
    data: workflow
  });
}));

/**
 * 删除工作流
 * DELETE /api/workflows/:id
 */
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  await WorkflowService.deleteWorkflow(id, userId);

  res.json({
    success: true,
    message: '工作流已删除'
  });
}));

/**
 * 检查发布权限
 * GET /api/workflows/:id/publish-check
 */
router.get('/:id/publish-check', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { level } = req.query;
  const userId = req.userId;

  const workflow = await WorkflowService.getWorkflowById(id);

  // 检查所有权
  if (workflow.creator_id !== userId) {
    return res.status(403).json({
      success: false,
      error: '您没有权限操作此工作流'
    });
  }

  const targetLevel = level ? parseInt(level) : workflow.level;
  const result = await WorkflowService.checkPublishPermission(userId, targetLevel, id);

  res.json({
    success: true,
    data: {
      ...result,
      currentLevel: workflow.level,
      targetLevel,
      availableLevels: await getAvailableLevels(userId)
    }
  });
}));

/**
 * 提交审核
 * POST /api/workflows/:id/submit
 */
router.post('/:id/submit', requirePro, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const { level, price } = req.body;

  const workflow = await WorkflowService.submitForReview(id, userId, { level, price });

  res.json({
    success: true,
    data: workflow,
    message: '工作流已提交审核，请等待审核结果'
  });
}));

/**
 * 下架工作流
 * POST /api/workflows/:id/archive
 */
router.post('/:id/archive', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const workflow = await WorkflowService.archiveWorkflow(id, userId);

  res.json({
    success: true,
    data: workflow,
    message: '工作流已下架'
  });
}));

/**
 * 重新上架
 * POST /api/workflows/:id/republish
 */
router.post('/:id/republish', requirePro, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const workflow = await WorkflowService.republishWorkflow(id, userId);

  res.json({
    success: true,
    data: workflow,
    message: '工作流已重新上架'
  });
}));

/**
 * 使用工作流（记录使用）
 * POST /api/workflows/:id/use
 */
router.post('/:id/use', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const result = await WorkflowService.recordUsage(id, userId);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * 复制工作流到自己的草稿
 * POST /api/workflows/:id/copy
 */
router.post('/:id/copy', requirePro, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  // 检查复制权限
  const canCopy = await PermissionService.canCopyWorkflow(userId);
  if (!canCopy) {
    return res.status(403).json({
      success: false,
      error: '需要Pro会员才能复制工作流'
    });
  }

  // 获取原工作流
  const original = await WorkflowService.getWorkflowById(id);

  // 检查原工作流的使用权限
  const canUse = await PermissionService.canUseWorkflow(userId, id);
  if (!canUse.canUse) {
    return res.status(403).json({
      success: false,
      error: canUse.reason
    });
  }

  // 创建副本
  const copy = await WorkflowService.createWorkflow(userId, {
    title: `${original.title} (副本)`,
    description: original.description,
    prompt: original.prompt,
    coverImage: original.cover_image,
    categoryId: original.category_id,
    tags: original.tags
  });

  res.status(201).json({
    success: true,
    data: copy,
    message: '工作流已复制到您的草稿'
  });
}));

/**
 * 获取我的工作流列表
 * GET /api/workflows/my/list
 */
router.get('/my/list', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { status, level, page, limit, orderBy, order } = req.query;

  const result = await WorkflowService.getUserWorkflows(userId, {
    status,
    level: level ? parseInt(level) : undefined,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
    orderBy,
    order
  });

  res.json({
    success: true,
    data: result
  });
}));

/**
 * 获取用户可用的发布等级
 */
async function getAvailableLevels(userId) {
  const identity = await require('../services/UserService').getUserIdentity(userId);

  if (identity.isCreator) {
    return [
      { level: WORKFLOW_LEVEL.FREE, name: '免费工作流', available: true },
      { level: WORKFLOW_LEVEL.PRO_FREE, name: 'Pro免费工作流', available: true },
      { level: WORKFLOW_LEVEL.PAID, name: '付费工作流', available: true }
    ];
  }

  if (identity.isPro) {
    return [
      { level: WORKFLOW_LEVEL.FREE, name: '免费工作流', available: true },
      { level: WORKFLOW_LEVEL.PRO_FREE, name: 'Pro免费工作流', available: true },
      { level: WORKFLOW_LEVEL.PAID, name: '付费工作流', available: false, reason: '需要创作者身份' }
    ];
  }

  return [
    { level: WORKFLOW_LEVEL.FREE, name: '免费工作流', available: false, reason: '需要Pro会员' },
    { level: WORKFLOW_LEVEL.PRO_FREE, name: 'Pro免费工作流', available: false, reason: '需要Pro会员' },
    { level: WORKFLOW_LEVEL.PAID, name: '付费工作流', available: false, reason: '需要创作者身份' }
  ];
}

module.exports = router;
