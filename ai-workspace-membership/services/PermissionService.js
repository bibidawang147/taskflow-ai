/**
 * 权限服务
 * 处理用户权限检查、工作流访问控制等
 */

const db = require('../config/database');
const UserService = require('./UserService');
const {
  WORKFLOW_LEVEL,
  WORKFLOW_STATUS,
  PRO_NON_CREATOR_LIMITS,
  PROMPT_PREVIEW_LENGTH,
  AI_QUOTA,
  PRO_DISCOUNT,
  ERROR_CODES
} = require('../config/constants');
const {
  PermissionDeniedError,
  WorkflowNotFoundError,
  PublishLimitError
} = require('../utils/errors');

class PermissionService {
  /**
   * 获取工作流信息
   * @param {string} workflowId - 工作流ID
   * @returns {Promise<Object>}
   */
  async getWorkflow(workflowId) {
    const workflow = await db.queryOne(
      'SELECT * FROM workflows WHERE id = ?',
      [workflowId]
    );

    if (!workflow) {
      throw new WorkflowNotFoundError(workflowId);
    }

    return workflow;
  }

  /**
   * 检查用户是否可以查看完整Prompt
   * Free用户只能看前50字，Pro及以上可以看完整内容
   * @param {string} userId - 用户ID
   * @returns {Promise<boolean>}
   */
  async canViewFullPrompt(userId) {
    const identity = await UserService.getUserIdentity(userId);
    return identity.isPro || identity.isCreator;
  }

  /**
   * 获取用户可见的Prompt内容
   * @param {string} userId - 用户ID
   * @param {string} prompt - 完整Prompt内容
   * @returns {Promise<{content: string, isTruncated: boolean}>}
   */
  async getVisiblePrompt(userId, prompt) {
    if (!prompt) {
      return { content: '', isTruncated: false };
    }

    const canViewFull = await this.canViewFullPrompt(userId);

    if (canViewFull) {
      return { content: prompt, isTruncated: false };
    }

    // Free用户只能看前50字
    if (prompt.length <= PROMPT_PREVIEW_LENGTH) {
      return { content: prompt, isTruncated: false };
    }

    return {
      content: prompt.substring(0, PROMPT_PREVIEW_LENGTH) + '...',
      isTruncated: true
    };
  }

  /**
   * 检查用户是否可以使用指定工作流
   * @param {string} userId - 用户ID
   * @param {string} workflowId - 工作流ID
   * @returns {Promise<{canUse: boolean, reason?: string, needPurchase?: boolean, price?: number}>}
   */
  async canUseWorkflow(userId, workflowId) {
    const identity = await UserService.getUserIdentity(userId);
    const workflow = await this.getWorkflow(workflowId);

    // 检查工作流是否已上架
    if (workflow.status !== WORKFLOW_STATUS.APPROVED) {
      // 创作者可以使用自己的草稿
      if (workflow.creator_id === userId) {
        return { canUse: true };
      }
      return {
        canUse: false,
        reason: '该工作流尚未上架'
      };
    }

    // 免费工作流（Level 1）：所有人可用
    if (workflow.level === WORKFLOW_LEVEL.FREE) {
      return { canUse: true };
    }

    // Pro免费工作流（Level 2）：仅Pro及以上可用
    if (workflow.level === WORKFLOW_LEVEL.PRO_FREE) {
      if (identity.isPro || identity.isCreator) {
        return { canUse: true };
      }
      return {
        canUse: false,
        reason: '此工作流仅限Pro会员使用，请升级会员'
      };
    }

    // 付费工作流（Level 3）：需购买
    if (workflow.level === WORKFLOW_LEVEL.PAID) {
      // 创作者本人免费
      if (workflow.creator_id === userId) {
        return { canUse: true };
      }

      // 检查是否已购买
      const purchase = await db.queryOne(
        `SELECT id FROM workflow_purchases
         WHERE workflow_id = ? AND buyer_id = ? AND status = 'paid'`,
        [workflowId, userId]
      );

      if (purchase) {
        return { canUse: true };
      }

      // 计算价格
      const originalPrice = parseFloat(workflow.price);
      let actualPrice = originalPrice;

      // Pro用户和创作者享受5折
      if (identity.isPro || identity.isCreator) {
        actualPrice = originalPrice * PRO_DISCOUNT;
      }

      return {
        canUse: false,
        reason: '此工作流需要购买',
        needPurchase: true,
        originalPrice,
        actualPrice,
        discount: identity.isPro || identity.isCreator ? PRO_DISCOUNT : 1
      };
    }

    return { canUse: false, reason: '未知的工作流类型' };
  }

  /**
   * 检查用户是否可以一键复制工作流
   * 仅Pro用户和创作者可以复制
   * @param {string} userId - 用户ID
   * @returns {Promise<boolean>}
   */
  async canCopyWorkflow(userId) {
    const identity = await UserService.getUserIdentity(userId);
    return identity.isPro || identity.isCreator;
  }

  /**
   * 检查用户是否可以发布工作流
   * @param {string} userId - 用户ID
   * @param {number} workflowLevel - 工作流等级 (1, 2, 3)
   * @returns {Promise<{canPublish: boolean, reason?: string}>}
   */
  async canPublishWorkflow(userId, workflowLevel) {
    const identity = await UserService.getUserIdentity(userId);

    // Free用户不能发布任何工作流
    if (identity.isFree) {
      return {
        canPublish: false,
        reason: '需要升级为Pro会员才能发布工作流'
      };
    }

    // 付费工作流仅创作者可发布
    if (workflowLevel === WORKFLOW_LEVEL.PAID && !identity.isCreator) {
      return {
        canPublish: false,
        reason: '仅创作者可以发布付费工作流，请先申请成为创作者'
      };
    }

    // Pro会员（非创作者）检查发布等级限制
    if (identity.isPro && !identity.isCreator) {
      // 只能发布免费和Pro免费工作流
      if (!PRO_NON_CREATOR_LIMITS.ALLOWED_LEVELS.includes(workflowLevel)) {
        return {
          canPublish: false,
          reason: '仅创作者可以发布付费工作流'
        };
      }

      // 检查在架数量限制
      const approvedCount = await UserService.getApprovedWorkflowCount(userId);
      if (approvedCount >= PRO_NON_CREATOR_LIMITS.MAX_APPROVED_WORKFLOWS) {
        return {
          canPublish: false,
          reason: `Pro会员最多可发布${PRO_NON_CREATOR_LIMITS.MAX_APPROVED_WORKFLOWS}个工作流，请下架部分工作流后再发布新的`
        };
      }
    }

    return { canPublish: true };
  }

  /**
   * 检查用户是否可以创建合辑
   * 仅创作者可以创建合辑
   * @param {string} userId - 用户ID
   * @returns {Promise<boolean>}
   */
  async canCreateCollection(userId) {
    const identity = await UserService.getUserIdentity(userId);
    return identity.isCreator;
  }

  /**
   * 检查用户是否可以编辑指定工作流
   * 只能编辑自己的工作流
   * @param {string} userId - 用户ID
   * @param {string} workflowId - 工作流ID
   * @returns {Promise<boolean>}
   */
  async canEditWorkflow(userId, workflowId) {
    const workflow = await this.getWorkflow(workflowId);
    return workflow.creator_id === userId;
  }

  /**
   * 检查用户是否可以删除/下架指定工作流
   * @param {string} userId - 用户ID
   * @param {string} workflowId - 工作流ID
   * @returns {Promise<boolean>}
   */
  async canDeleteWorkflow(userId, workflowId) {
    return this.canEditWorkflow(userId, workflowId);
  }

  /**
   * 获取用户当月AI使用额度
   * @param {string} userId - 用户ID
   * @returns {Promise<{limit: number, used: number, remaining: number}>}
   */
  async getAIQuota(userId) {
    const identity = await UserService.getUserIdentity(userId);
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // 确定额度上限
    const limit = identity.isPro || identity.isCreator
      ? AI_QUOTA.PRO
      : AI_QUOTA.FREE;

    // 获取已使用次数
    let quota = await db.queryOne(
      `SELECT used_count FROM ai_usage_quotas
       WHERE user_id = ? AND month = ?`,
      [userId, currentMonth]
    );

    if (!quota) {
      // 初始化本月额度记录
      const quotaId = require('crypto').randomUUID();
      await db.query(
        `INSERT INTO ai_usage_quotas (id, user_id, month, quota_limit, used_count)
         VALUES (?, ?, ?, ?, 0)`,
        [quotaId, userId, currentMonth, limit]
      );
      quota = { used_count: 0 };
    }

    return {
      limit,
      used: quota.used_count,
      remaining: Math.max(0, limit - quota.used_count)
    };
  }

  /**
   * 检查用户是否可以使用AI转工作流功能
   * @param {string} userId - 用户ID
   * @returns {Promise<{canUse: boolean, quota: Object, reason?: string}>}
   */
  async canUseAITransform(userId) {
    const quota = await this.getAIQuota(userId);

    if (quota.remaining <= 0) {
      return {
        canUse: false,
        quota,
        reason: `本月AI转工作流次数已用完（${quota.used}/${quota.limit}次）`
      };
    }

    return {
      canUse: true,
      quota
    };
  }

  /**
   * 使用一次AI转工作流额度
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 更新后的额度信息
   */
  async consumeAIQuota(userId) {
    const currentMonth = new Date().toISOString().slice(0, 7);

    await db.query(
      `UPDATE ai_usage_quotas
       SET used_count = used_count + 1
       WHERE user_id = ? AND month = ?`,
      [userId, currentMonth]
    );

    return this.getAIQuota(userId);
  }

  /**
   * 获取用户的完整权限列表
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 权限列表
   */
  async getUserPermissions(userId) {
    const identity = await UserService.getUserIdentity(userId);
    const aiQuota = await this.getAIQuota(userId);

    // Pro会员（非创作者）的工作流数量
    let approvedWorkflowCount = 0;
    if (identity.isPro && !identity.isCreator) {
      approvedWorkflowCount = await UserService.getApprovedWorkflowCount(userId);
    }

    return {
      userType: identity.isCreator ? 'creator' : (identity.isPro ? 'pro' : 'free'),
      identity: {
        isFree: identity.isFree,
        isPro: identity.isPro,
        isCreator: identity.isCreator,
        isProExpired: identity.isProExpired
      },

      // 消费权限
      consume: {
        canViewFullPrompt: identity.isPro || identity.isCreator,
        canUseProWorkflow: identity.isPro || identity.isCreator,
        canCopyWorkflow: identity.isPro || identity.isCreator,
        paidWorkflowDiscount: identity.isPro || identity.isCreator ? PRO_DISCOUNT : 1
      },

      // 创作权限
      create: {
        canPublishWorkflow: identity.isPro || identity.isCreator,
        canPublishFreeWorkflow: identity.isPro || identity.isCreator,
        canPublishProFreeWorkflow: identity.isPro || identity.isCreator,
        canPublishPaidWorkflow: identity.isCreator,
        canCreateCollection: identity.isCreator,
        publishLimit: identity.isCreator
          ? null  // 无限制
          : (identity.isPro ? PRO_NON_CREATOR_LIMITS.MAX_APPROVED_WORKFLOWS : 0),
        currentApprovedCount: approvedWorkflowCount,
        remainingPublishSlots: identity.isCreator
          ? null
          : Math.max(0, PRO_NON_CREATOR_LIMITS.MAX_APPROVED_WORKFLOWS - approvedWorkflowCount)
      },

      // AI额度
      aiQuota: {
        limit: aiQuota.limit,
        used: aiQuota.used,
        remaining: aiQuota.remaining
      },

      // 创作者相关（如果是创作者）
      creator: identity.isCreator ? {
        level: identity.creatorStats?.level || 1,
        totalPoints: parseFloat(identity.creatorStats?.total_points || 0),
        totalRevenue: parseFloat(identity.creatorStats?.total_revenue || 0)
      } : null
    };
  }

  /**
   * 验证权限并抛出异常（用于中间件）
   * @param {string} userId - 用户ID
   * @param {string} permission - 权限名称
   * @param {Object} context - 上下文信息（如workflowId等）
   */
  async requirePermission(userId, permission, context = {}) {
    switch (permission) {
      case 'viewFullPrompt': {
        const canView = await this.canViewFullPrompt(userId);
        if (!canView) {
          throw new PermissionDeniedError(
            '需要Pro会员才能查看完整Prompt',
            ERROR_CODES.CANNOT_VIEW_FULL_PROMPT
          );
        }
        break;
      }

      case 'useProWorkflow': {
        const result = await this.canUseWorkflow(userId, context.workflowId);
        if (!result.canUse) {
          throw new PermissionDeniedError(
            result.reason,
            ERROR_CODES.CANNOT_USE_PRO_WORKFLOW
          );
        }
        break;
      }

      case 'copyWorkflow': {
        const canCopy = await this.canCopyWorkflow(userId);
        if (!canCopy) {
          throw new PermissionDeniedError(
            '需要Pro会员才能复制工作流',
            ERROR_CODES.CANNOT_COPY_WORKFLOW
          );
        }
        break;
      }

      case 'publishWorkflow': {
        const result = await this.canPublishWorkflow(userId, context.level);
        if (!result.canPublish) {
          throw new PermissionDeniedError(
            result.reason,
            ERROR_CODES.CANNOT_PUBLISH_WORKFLOW
          );
        }
        break;
      }

      case 'editWorkflow': {
        const canEdit = await this.canEditWorkflow(userId, context.workflowId);
        if (!canEdit) {
          throw new PermissionDeniedError(
            '您没有权限编辑此工作流',
            ERROR_CODES.PERMISSION_DENIED
          );
        }
        break;
      }

      case 'createCollection': {
        const canCreate = await this.canCreateCollection(userId);
        if (!canCreate) {
          throw new PermissionDeniedError(
            '仅创作者可以创建合辑',
            ERROR_CODES.PERMISSION_DENIED
          );
        }
        break;
      }

      case 'useAITransform': {
        const result = await this.canUseAITransform(userId);
        if (!result.canUse) {
          throw new PermissionDeniedError(
            result.reason,
            ERROR_CODES.PERMISSION_DENIED
          );
        }
        break;
      }

      default:
        throw new Error(`未知的权限类型: ${permission}`);
    }
  }
}

module.exports = new PermissionService();
