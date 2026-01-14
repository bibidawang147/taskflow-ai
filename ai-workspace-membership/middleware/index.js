/**
 * Express 权限中间件
 */

const UserService = require('../services/UserService');
const PermissionService = require('../services/PermissionService');
const { BusinessError } = require('../utils/errors');

/**
 * 错误处理包装器
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 要求用户已登录（需要配合认证中间件使用）
 * 假设认证中间件已将 userId 注入到 req.userId
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      error: true,
      code: 'UNAUTHORIZED',
      message: '请先登录'
    });
  }

  try {
    // 获取用户身份并注入到请求对象
    const identity = await UserService.getUserIdentity(req.userId);
    req.userIdentity = identity;
    next();
  } catch (error) {
    if (error instanceof BusinessError) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    throw error;
  }
});

/**
 * 可选认证（不强制要求登录，但如果有userId则注入身份信息）
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  if (req.userId) {
    try {
      const identity = await UserService.getUserIdentity(req.userId);
      req.userIdentity = identity;
    } catch (error) {
      // 忽略错误，继续处理
      req.userId = null;
    }
  }
  next();
});

/**
 * 要求Pro会员
 */
const requirePro = asyncHandler(async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      error: true,
      code: 'UNAUTHORIZED',
      message: '请先登录'
    });
  }

  try {
    const identity = await UserService.getUserIdentity(req.userId);
    req.userIdentity = identity;

    if (!identity.isPro && !identity.isCreator) {
      return res.status(403).json({
        error: true,
        code: 'NOT_PRO_USER',
        message: '需要Pro会员才能访问此功能'
      });
    }

    next();
  } catch (error) {
    if (error instanceof BusinessError) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    throw error;
  }
});

/**
 * 要求创作者身份
 */
const requireCreator = asyncHandler(async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      error: true,
      code: 'UNAUTHORIZED',
      message: '请先登录'
    });
  }

  try {
    const identity = await UserService.getUserIdentity(req.userId);
    req.userIdentity = identity;

    if (!identity.isCreator) {
      return res.status(403).json({
        error: true,
        code: 'NOT_CREATOR',
        message: '需要创作者身份才能访问此功能'
      });
    }

    next();
  } catch (error) {
    if (error instanceof BusinessError) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    throw error;
  }
});

/**
 * 检查特定权限
 * @param {string} permission - 权限名称
 * @param {Function} contextFn - 上下文函数，返回权限检查所需的上下文
 */
const checkPermission = (permission, contextFn = () => ({})) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.userId) {
      return res.status(401).json({
        error: true,
        code: 'UNAUTHORIZED',
        message: '请先登录'
      });
    }

    try {
      const context = contextFn(req);
      await PermissionService.requirePermission(req.userId, permission, context);
      next();
    } catch (error) {
      if (error instanceof BusinessError) {
        return res.status(error.statusCode).json(error.toJSON());
      }
      throw error;
    }
  });
};

/**
 * 检查工作流编辑权限
 */
const checkWorkflowOwnership = asyncHandler(async (req, res, next) => {
  const workflowId = req.params.id || req.params.workflowId;

  if (!workflowId) {
    return res.status(400).json({
      error: true,
      code: 'MISSING_WORKFLOW_ID',
      message: '缺少工作流ID'
    });
  }

  try {
    await PermissionService.requirePermission(req.userId, 'editWorkflow', { workflowId });
    next();
  } catch (error) {
    if (error instanceof BusinessError) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    throw error;
  }
});

/**
 * 统一错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  console.error('Membership Error:', err);

  if (err instanceof BusinessError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  res.status(500).json({
    error: true,
    code: 'INTERNAL_ERROR',
    message: '服务器内部错误'
  });
};

module.exports = {
  asyncHandler,
  requireAuth,
  optionalAuth,
  requirePro,
  requireCreator,
  checkPermission,
  checkWorkflowOwnership,
  errorHandler
};
