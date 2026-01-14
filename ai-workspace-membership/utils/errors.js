/**
 * 自定义错误类
 */

const { ERROR_CODES } = require('../config/constants');

/**
 * 业务错误基类
 */
class BusinessError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.statusCode = statusCode;
  }

  toJSON() {
    return {
      error: true,
      code: this.code,
      message: this.message
    };
  }
}

/**
 * 用户不存在错误
 */
class UserNotFoundError extends BusinessError {
  constructor(userId) {
    super(`用户不存在: ${userId}`, ERROR_CODES.USER_NOT_FOUND, 404);
    this.name = 'UserNotFoundError';
  }
}

/**
 * 用户被封禁错误
 */
class UserSuspendedError extends BusinessError {
  constructor(userId) {
    super(`用户已被封禁: ${userId}`, ERROR_CODES.USER_SUSPENDED, 403);
    this.name = 'UserSuspendedError';
  }
}

/**
 * 会员不存在错误
 */
class MembershipNotFoundError extends BusinessError {
  constructor(userId) {
    super(`会员信息不存在: ${userId}`, ERROR_CODES.MEMBERSHIP_NOT_FOUND, 404);
    this.name = 'MembershipNotFoundError';
  }
}

/**
 * 会员已过期错误
 */
class MembershipExpiredError extends BusinessError {
  constructor() {
    super('Pro会员已过期', ERROR_CODES.MEMBERSHIP_EXPIRED, 403);
    this.name = 'MembershipExpiredError';
  }
}

/**
 * 非Pro用户错误
 */
class NotProUserError extends BusinessError {
  constructor() {
    super('需要Pro会员才能执行此操作', ERROR_CODES.NOT_PRO_USER, 403);
    this.name = 'NotProUserError';
  }
}

/**
 * 已是创作者错误
 */
class AlreadyCreatorError extends BusinessError {
  constructor() {
    super('您已经是创作者', ERROR_CODES.ALREADY_CREATOR, 400);
    this.name = 'AlreadyCreatorError';
  }
}

/**
 * 创作者申请失败错误
 */
class CreatorApplyError extends BusinessError {
  constructor(message) {
    super(message, ERROR_CODES.CREATOR_APPLY_FAILED, 400);
    this.name = 'CreatorApplyError';
  }
}

/**
 * 权限拒绝错误
 */
class PermissionDeniedError extends BusinessError {
  constructor(message = '没有权限执行此操作', code = ERROR_CODES.PERMISSION_DENIED) {
    super(message, code, 403);
    this.name = 'PermissionDeniedError';
  }
}

/**
 * 工作流不存在错误
 */
class WorkflowNotFoundError extends BusinessError {
  constructor(workflowId) {
    super(`工作流不存在: ${workflowId}`, ERROR_CODES.WORKFLOW_NOT_FOUND, 404);
    this.name = 'WorkflowNotFoundError';
  }
}

/**
 * 发布限制错误
 */
class PublishLimitError extends BusinessError {
  constructor(message) {
    super(message, ERROR_CODES.PUBLISH_LIMIT_REACHED, 403);
    this.name = 'PublishLimitError';
  }
}

module.exports = {
  BusinessError,
  UserNotFoundError,
  UserSuspendedError,
  MembershipNotFoundError,
  MembershipExpiredError,
  NotProUserError,
  AlreadyCreatorError,
  CreatorApplyError,
  PermissionDeniedError,
  WorkflowNotFoundError,
  PublishLimitError
};
