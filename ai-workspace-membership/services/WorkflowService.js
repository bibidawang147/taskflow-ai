/**
 * 工作流服务
 * 处理工作流CRUD、发布审核、使用记录等
 */

const crypto = require('crypto');
const db = require('../config/database');
const UserService = require('./UserService');
const PermissionService = require('./PermissionService');
const {
  WORKFLOW_LEVEL,
  WORKFLOW_LEVEL_NAME,
  WORKFLOW_STATUS,
  PRO_NON_CREATOR_LIMITS,
  PROMPT_PREVIEW_LENGTH,
  POINTS_RULE
} = require('../config/constants');
const {
  WorkflowNotFoundError,
  PermissionDeniedError,
  PublishLimitError,
  BusinessError
} = require('../utils/errors');

class WorkflowService {
  /**
   * 创建工作流（草稿）
   * @param {string} creatorId - 创作者ID
   * @param {Object} data - 工作流数据
   * @returns {Promise<Object>}
   */
  async createWorkflow(creatorId, data) {
    const {
      title,
      description,
      prompt,
      coverImage,
      categoryId,
      tags
    } = data;

    // 生成prompt预览
    const promptPreview = prompt
      ? prompt.substring(0, PROMPT_PREVIEW_LENGTH)
      : null;

    const workflowId = crypto.randomUUID();

    await db.query(
      `INSERT INTO workflows
       (id, creator_id, title, description, prompt, prompt_preview, cover_image, category_id, tags, level, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workflowId,
        creatorId,
        title,
        description || null,
        prompt || null,
        promptPreview,
        coverImage || null,
        categoryId || null,
        tags ? JSON.stringify(tags) : null,
        WORKFLOW_LEVEL.FREE, // 默认为免费工作流
        WORKFLOW_STATUS.DRAFT
      ]
    );

    return this.getWorkflowById(workflowId);
  }

  /**
   * 获取工作流详情
   * @param {string} workflowId - 工作流ID
   * @returns {Promise<Object>}
   */
  async getWorkflowById(workflowId) {
    const workflow = await db.queryOne(
      `SELECT w.*, u.username as creator_name, u.avatar as creator_avatar
       FROM workflows w
       LEFT JOIN users u ON w.creator_id = u.id
       WHERE w.id = ?`,
      [workflowId]
    );

    if (!workflow) {
      throw new WorkflowNotFoundError(workflowId);
    }

    // 解析JSON字段
    if (workflow.tags && typeof workflow.tags === 'string') {
      workflow.tags = JSON.parse(workflow.tags);
    }

    return workflow;
  }

  /**
   * 更新工作流
   * @param {string} workflowId - 工作流ID
   * @param {string} userId - 操作用户ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>}
   */
  async updateWorkflow(workflowId, userId, data) {
    const workflow = await this.getWorkflowById(workflowId);

    // 检查所有权
    if (workflow.creator_id !== userId) {
      throw new PermissionDeniedError('您没有权限编辑此工作流');
    }

    // 已上架的工作流不能直接修改核心内容
    if (workflow.status === WORKFLOW_STATUS.APPROVED) {
      const restrictedFields = ['prompt', 'level', 'price'];
      const hasRestrictedChange = restrictedFields.some(field => data[field] !== undefined);

      if (hasRestrictedChange) {
        throw new BusinessError(
          '已上架的工作流不能修改Prompt、等级和价格，请先下架',
          'WORKFLOW_APPROVED',
          400
        );
      }
    }

    const allowedFields = [
      'title', 'description', 'prompt', 'cover_image',
      'category_id', 'tags', 'level', 'price'
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      // 将驼峰转换为下划线
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
      const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

      if (data[camelField] !== undefined || data[field] !== undefined) {
        let value = data[camelField] ?? data[field];

        // 处理特殊字段
        if (field === 'tags' && Array.isArray(value)) {
          value = JSON.stringify(value);
        }

        updates.push(`${dbField} = ?`);
        values.push(value);
      }
    }

    // 如果更新了prompt，同时更新preview
    if (data.prompt !== undefined) {
      updates.push('prompt_preview = ?');
      values.push(data.prompt ? data.prompt.substring(0, PROMPT_PREVIEW_LENGTH) : null);
    }

    if (updates.length === 0) {
      return workflow;
    }

    values.push(workflowId);

    await db.query(
      `UPDATE workflows SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    return this.getWorkflowById(workflowId);
  }

  /**
   * 删除工作流
   * @param {string} workflowId - 工作流ID
   * @param {string} userId - 操作用户ID
   * @returns {Promise<boolean>}
   */
  async deleteWorkflow(workflowId, userId) {
    const workflow = await this.getWorkflowById(workflowId);

    if (workflow.creator_id !== userId) {
      throw new PermissionDeniedError('您没有权限删除此工作流');
    }

    // 已有购买记录的付费工作流不能删除，只能下架
    if (workflow.level === WORKFLOW_LEVEL.PAID && workflow.purchase_count > 0) {
      throw new BusinessError(
        '已有用户购买的工作流不能删除，只能下架',
        'WORKFLOW_HAS_PURCHASES',
        400
      );
    }

    await db.query('DELETE FROM workflows WHERE id = ?', [workflowId]);
    return true;
  }

  /**
   * 检查发布权限
   * @param {string} userId - 用户ID
   * @param {number} level - 工作流等级
   * @param {string} excludeWorkflowId - 排除的工作流ID（用于编辑时）
   * @returns {Promise<{canPublish: boolean, reason?: string, details?: Object}>}
   */
  async checkPublishPermission(userId, level, excludeWorkflowId = null) {
    const identity = await UserService.getUserIdentity(userId);

    // Free用户不能发布
    if (identity.isFree) {
      return {
        canPublish: false,
        reason: '需要升级为Pro会员才能发布工作流',
        details: { userType: 'free' }
      };
    }

    // 付费工作流仅创作者可发布
    if (level === WORKFLOW_LEVEL.PAID && !identity.isCreator) {
      return {
        canPublish: false,
        reason: '仅创作者可以发布付费工作流，请先申请成为创作者',
        details: { userType: 'pro', requiredType: 'creator' }
      };
    }

    // Pro会员（非创作者）检查限制
    if (identity.isPro && !identity.isCreator) {
      // 检查等级限制
      if (!PRO_NON_CREATOR_LIMITS.ALLOWED_LEVELS.includes(level)) {
        return {
          canPublish: false,
          reason: `Pro会员只能发布${WORKFLOW_LEVEL_NAME[WORKFLOW_LEVEL.FREE]}和${WORKFLOW_LEVEL_NAME[WORKFLOW_LEVEL.PRO_FREE]}`,
          details: {
            allowedLevels: PRO_NON_CREATOR_LIMITS.ALLOWED_LEVELS,
            requestedLevel: level
          }
        };
      }

      // 检查在架数量
      let query = `SELECT COUNT(*) as count FROM workflows
                   WHERE creator_id = ? AND status = ?`;
      const params = [userId, WORKFLOW_STATUS.APPROVED];

      if (excludeWorkflowId) {
        query += ' AND id != ?';
        params.push(excludeWorkflowId);
      }

      const result = await db.queryOne(query, params);
      const approvedCount = result.count;

      if (approvedCount >= PRO_NON_CREATOR_LIMITS.MAX_APPROVED_WORKFLOWS) {
        return {
          canPublish: false,
          reason: `Pro会员最多可发布${PRO_NON_CREATOR_LIMITS.MAX_APPROVED_WORKFLOWS}个工作流，请下架部分工作流后再发布`,
          details: {
            limit: PRO_NON_CREATOR_LIMITS.MAX_APPROVED_WORKFLOWS,
            current: approvedCount
          }
        };
      }
    }

    return { canPublish: true };
  }

  /**
   * 提交工作流审核
   * @param {string} workflowId - 工作流ID
   * @param {string} userId - 用户ID
   * @param {Object} publishData - 发布参数
   * @returns {Promise<Object>}
   */
  async submitForReview(workflowId, userId, publishData = {}) {
    const workflow = await this.getWorkflowById(workflowId);

    // 检查所有权
    if (workflow.creator_id !== userId) {
      throw new PermissionDeniedError('您没有权限操作此工作流');
    }

    // 检查状态
    if (![WORKFLOW_STATUS.DRAFT, WORKFLOW_STATUS.REJECTED].includes(workflow.status)) {
      throw new BusinessError(
        '只有草稿或被拒绝的工作流可以提交审核',
        'INVALID_WORKFLOW_STATUS',
        400
      );
    }

    // 确定等级和价格
    const level = publishData.level ?? workflow.level;
    const price = level === WORKFLOW_LEVEL.PAID ? publishData.price : null;

    // 验证付费工作流必须有价格
    if (level === WORKFLOW_LEVEL.PAID && (!price || price <= 0)) {
      throw new BusinessError(
        '付费工作流必须设置价格',
        'PRICE_REQUIRED',
        400
      );
    }

    // 检查发布权限
    const permissionCheck = await this.checkPublishPermission(userId, level, workflowId);
    if (!permissionCheck.canPublish) {
      throw new PublishLimitError(permissionCheck.reason);
    }

    // 验证必填字段
    if (!workflow.title || !workflow.prompt) {
      throw new BusinessError(
        '请完善工作流标题和Prompt后再提交',
        'INCOMPLETE_WORKFLOW',
        400
      );
    }

    const transaction = await db.beginTransaction();

    try {
      // 更新工作流状态
      await transaction.query(
        `UPDATE workflows
         SET status = ?, level = ?, price = ?, updated_at = NOW()
         WHERE id = ?`,
        [WORKFLOW_STATUS.PENDING, level, price, workflowId]
      );

      // 记录审核日志
      const auditId = crypto.randomUUID();
      await transaction.query(
        `INSERT INTO workflow_audits
         (id, workflow_id, action, old_status, new_status)
         VALUES (?, ?, 'submit', ?, ?)`,
        [auditId, workflowId, workflow.status, WORKFLOW_STATUS.PENDING]
      );

      await transaction.commit();

      return this.getWorkflowById(workflowId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 审核通过工作流
   * @param {string} workflowId - 工作流ID
   * @param {string} adminId - 审核人ID
   * @returns {Promise<Object>}
   */
  async approveWorkflow(workflowId, adminId) {
    const workflow = await this.getWorkflowById(workflowId);

    if (workflow.status !== WORKFLOW_STATUS.PENDING) {
      throw new BusinessError(
        '只有待审核的工作流可以审核',
        'INVALID_WORKFLOW_STATUS',
        400
      );
    }

    const transaction = await db.beginTransaction();

    try {
      // 更新工作流状态
      await transaction.query(
        `UPDATE workflows
         SET status = ?, published_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [WORKFLOW_STATUS.APPROVED, workflowId]
      );

      // 记录审核日志
      const auditId = crypto.randomUUID();
      await transaction.query(
        `INSERT INTO workflow_audits
         (id, workflow_id, admin_id, action, old_status, new_status)
         VALUES (?, ?, ?, 'approve', ?, ?)`,
        [auditId, workflowId, adminId, WORKFLOW_STATUS.PENDING, WORKFLOW_STATUS.APPROVED]
      );

      // 更新创作者统计
      await transaction.query(
        `UPDATE creator_stats
         SET work_count = work_count + 1, updated_at = NOW()
         WHERE user_id = ?`,
        [workflow.creator_id]
      );

      // 给创作者加积分
      const points = this._getPublishPoints(workflow.level);
      await this._addPoints(transaction, workflow.creator_id, points, 'publish', workflow.level, workflowId);

      await transaction.commit();

      // 检查是否可以升级等级
      await UserService.checkAndUpgradeLevel(workflow.creator_id);

      return this.getWorkflowById(workflowId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 审核拒绝工作流
   * @param {string} workflowId - 工作流ID
   * @param {string} adminId - 审核人ID
   * @param {string} reason - 拒绝原因
   * @returns {Promise<Object>}
   */
  async rejectWorkflow(workflowId, adminId, reason) {
    const workflow = await this.getWorkflowById(workflowId);

    if (workflow.status !== WORKFLOW_STATUS.PENDING) {
      throw new BusinessError(
        '只有待审核的工作流可以审核',
        'INVALID_WORKFLOW_STATUS',
        400
      );
    }

    if (!reason) {
      throw new BusinessError('请填写拒绝原因', 'REASON_REQUIRED', 400);
    }

    const transaction = await db.beginTransaction();

    try {
      // 更新工作流状态
      await transaction.query(
        `UPDATE workflows
         SET status = ?, reject_reason = ?, updated_at = NOW()
         WHERE id = ?`,
        [WORKFLOW_STATUS.REJECTED, reason, workflowId]
      );

      // 记录审核日志
      const auditId = crypto.randomUUID();
      await transaction.query(
        `INSERT INTO workflow_audits
         (id, workflow_id, admin_id, action, old_status, new_status, reason)
         VALUES (?, ?, ?, 'reject', ?, ?, ?)`,
        [auditId, workflowId, adminId, WORKFLOW_STATUS.PENDING, WORKFLOW_STATUS.REJECTED, reason]
      );

      await transaction.commit();

      return this.getWorkflowById(workflowId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 下架工作流
   * @param {string} workflowId - 工作流ID
   * @param {string} userId - 操作用户ID
   * @returns {Promise<Object>}
   */
  async archiveWorkflow(workflowId, userId) {
    const workflow = await this.getWorkflowById(workflowId);

    if (workflow.creator_id !== userId) {
      throw new PermissionDeniedError('您没有权限操作此工作流');
    }

    if (workflow.status !== WORKFLOW_STATUS.APPROVED) {
      throw new BusinessError(
        '只有已上架的工作流可以下架',
        'INVALID_WORKFLOW_STATUS',
        400
      );
    }

    const transaction = await db.beginTransaction();

    try {
      await transaction.query(
        `UPDATE workflows
         SET status = ?, updated_at = NOW()
         WHERE id = ?`,
        [WORKFLOW_STATUS.ARCHIVED, workflowId]
      );

      // 更新创作者统计
      await transaction.query(
        `UPDATE creator_stats
         SET work_count = GREATEST(0, work_count - 1), updated_at = NOW()
         WHERE user_id = ?`,
        [workflow.creator_id]
      );

      // 记录审核日志
      const auditId = crypto.randomUUID();
      await transaction.query(
        `INSERT INTO workflow_audits
         (id, workflow_id, action, old_status, new_status)
         VALUES (?, ?, 'archive', ?, ?)`,
        [auditId, workflowId, WORKFLOW_STATUS.APPROVED, WORKFLOW_STATUS.ARCHIVED]
      );

      await transaction.commit();

      return this.getWorkflowById(workflowId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 重新上架工作流
   * @param {string} workflowId - 工作流ID
   * @param {string} userId - 操作用户ID
   * @returns {Promise<Object>}
   */
  async republishWorkflow(workflowId, userId) {
    const workflow = await this.getWorkflowById(workflowId);

    if (workflow.creator_id !== userId) {
      throw new PermissionDeniedError('您没有权限操作此工作流');
    }

    if (workflow.status !== WORKFLOW_STATUS.ARCHIVED) {
      throw new BusinessError(
        '只有已下架的工作流可以重新上架',
        'INVALID_WORKFLOW_STATUS',
        400
      );
    }

    // 检查发布权限（可能会员已过期）
    const permissionCheck = await this.checkPublishPermission(userId, workflow.level, workflowId);
    if (!permissionCheck.canPublish) {
      throw new PublishLimitError(permissionCheck.reason);
    }

    const transaction = await db.beginTransaction();

    try {
      await transaction.query(
        `UPDATE workflows
         SET status = ?, updated_at = NOW()
         WHERE id = ?`,
        [WORKFLOW_STATUS.APPROVED, workflowId]
      );

      // 更新创作者统计
      await transaction.query(
        `UPDATE creator_stats
         SET work_count = work_count + 1, updated_at = NOW()
         WHERE user_id = ?`,
        [workflow.creator_id]
      );

      await transaction.commit();

      return this.getWorkflowById(workflowId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 记录工作流使用
   * @param {string} workflowId - 工作流ID
   * @param {string} userId - 使用者ID
   * @returns {Promise<Object>}
   */
  async recordUsage(workflowId, userId) {
    const workflow = await this.getWorkflowById(workflowId);

    // 检查使用权限
    const canUse = await PermissionService.canUseWorkflow(userId, workflowId);
    if (!canUse.canUse) {
      throw new PermissionDeniedError(canUse.reason);
    }

    const usageId = crypto.randomUUID();

    try {
      // 尝试插入使用记录（防刷：同一用户同一工作流每分钟只记录一次）
      await db.query(
        `INSERT INTO workflow_usage (id, workflow_id, user_id, used_at)
         VALUES (?, ?, ?, NOW())`,
        [usageId, workflowId, userId]
      );

      // 更新工作流使用次数
      await db.query(
        `UPDATE workflows SET usage_count = usage_count + 1 WHERE id = ?`,
        [workflowId]
      );

      // 更新创作者统计
      await db.query(
        `UPDATE creator_stats SET total_usage = total_usage + 1 WHERE user_id = ?`,
        [workflow.creator_id]
      );

      // 给创作者加积分
      if (workflow.creator_id !== userId) {
        await this._addPointsSimple(
          workflow.creator_id,
          POINTS_RULE.WORKFLOW_USED,
          'workflow_used',
          workflowId
        );
      }

      return { recorded: true };
    } catch (error) {
      // 唯一索引冲突说明是重复记录，忽略
      if (error.code === 'ER_DUP_ENTRY') {
        return { recorded: false, reason: 'duplicate' };
      }
      throw error;
    }
  }

  /**
   * 获取用户的工作流列表
   * @param {string} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<{workflows: Array, total: number}>}
   */
  async getUserWorkflows(userId, options = {}) {
    const {
      status,
      level,
      page = 1,
      limit = 20,
      orderBy = 'created_at',
      order = 'DESC'
    } = options;

    let whereClause = 'WHERE creator_id = ?';
    const params = [userId];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (level) {
      whereClause += ' AND level = ?';
      params.push(level);
    }

    // 获取总数
    const countResult = await db.queryOne(
      `SELECT COUNT(*) as total FROM workflows ${whereClause}`,
      params
    );

    // 获取列表
    const offset = (page - 1) * limit;
    const orderClause = `ORDER BY ${orderBy} ${order}`;

    const workflows = await db.query(
      `SELECT id, title, description, cover_image, level, price, status,
              usage_count, purchase_count, created_at, updated_at, published_at
       FROM workflows
       ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      workflows,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  /**
   * 获取待审核工作流列表（管理后台）
   * @param {Object} options - 查询选项
   * @returns {Promise<{workflows: Array, total: number}>}
   */
  async getPendingWorkflows(options = {}) {
    const { page = 1, limit = 20 } = options;

    const countResult = await db.queryOne(
      'SELECT COUNT(*) as total FROM workflows WHERE status = ?',
      [WORKFLOW_STATUS.PENDING]
    );

    const offset = (page - 1) * limit;

    const workflows = await db.query(
      `SELECT w.*, u.username as creator_name, u.email as creator_email
       FROM workflows w
       LEFT JOIN users u ON w.creator_id = u.id
       WHERE w.status = ?
       ORDER BY w.created_at ASC
       LIMIT ? OFFSET ?`,
      [WORKFLOW_STATUS.PENDING, limit, offset]
    );

    return {
      workflows,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  /**
   * 获取公开工作流列表（探索页）
   * @param {Object} options - 查询选项
   * @returns {Promise<{workflows: Array, total: number}>}
   */
  async getPublicWorkflows(options = {}) {
    const {
      level,
      categoryId,
      keyword,
      page = 1,
      limit = 20,
      orderBy = 'published_at',
      order = 'DESC'
    } = options;

    let whereClause = 'WHERE w.status = ?';
    const params = [WORKFLOW_STATUS.APPROVED];

    if (level) {
      whereClause += ' AND w.level = ?';
      params.push(level);
    }

    if (categoryId) {
      whereClause += ' AND w.category_id = ?';
      params.push(categoryId);
    }

    if (keyword) {
      whereClause += ' AND (w.title LIKE ? OR w.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const countResult = await db.queryOne(
      `SELECT COUNT(*) as total FROM workflows w ${whereClause}`,
      params
    );

    const offset = (page - 1) * limit;
    const orderClause = `ORDER BY w.${orderBy} ${order}`;

    const workflows = await db.query(
      `SELECT w.id, w.title, w.description, w.prompt_preview, w.cover_image,
              w.level, w.price, w.usage_count, w.published_at,
              u.id as creator_id, u.username as creator_name, u.avatar as creator_avatar,
              cs.level as creator_level
       FROM workflows w
       LEFT JOIN users u ON w.creator_id = u.id
       LEFT JOIN creator_stats cs ON w.creator_id = cs.user_id
       ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      workflows,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  /**
   * 获取发布时的积分
   * @param {number} level - 工作流等级
   * @returns {number}
   */
  _getPublishPoints(level) {
    switch (level) {
      case WORKFLOW_LEVEL.FREE:
        return POINTS_RULE.PUBLISH_FREE;
      case WORKFLOW_LEVEL.PRO_FREE:
        return POINTS_RULE.PUBLISH_PRO_FREE;
      case WORKFLOW_LEVEL.PAID:
        return POINTS_RULE.PUBLISH_PAID;
      default:
        return 0;
    }
  }

  /**
   * 添加积分（事务内）
   */
  async _addPoints(transaction, userId, points, reasonType, level, relatedId) {
    // 获取当前积分
    const stats = await transaction.queryOne(
      'SELECT total_points FROM creator_stats WHERE user_id = ?',
      [userId]
    );

    if (!stats) return;

    const newBalance = parseFloat(stats.total_points) + points;

    // 更新积分
    await transaction.query(
      'UPDATE creator_stats SET total_points = ? WHERE user_id = ?',
      [newBalance, userId]
    );

    // 记录积分变动
    let reason;
    switch (level) {
      case WORKFLOW_LEVEL.FREE:
        reason = 'publish_free';
        break;
      case WORKFLOW_LEVEL.PRO_FREE:
        reason = 'publish_pro';
        break;
      case WORKFLOW_LEVEL.PAID:
        reason = 'publish_paid';
        break;
      default:
        reason = 'publish_free';
    }

    const recordId = crypto.randomUUID();
    await transaction.query(
      `INSERT INTO points_records
       (id, user_id, points, balance_after, reason, related_type, related_id)
       VALUES (?, ?, ?, ?, ?, 'workflow', ?)`,
      [recordId, userId, points, newBalance, reason, relatedId]
    );
  }

  /**
   * 添加积分（简单版，用于使用记录）
   */
  async _addPointsSimple(userId, points, reason, relatedId) {
    const transaction = await db.beginTransaction();

    try {
      const stats = await transaction.queryOne(
        'SELECT total_points FROM creator_stats WHERE user_id = ?',
        [userId]
      );

      if (!stats) {
        await transaction.rollback();
        return;
      }

      const newBalance = parseFloat(stats.total_points) + points;

      await transaction.query(
        'UPDATE creator_stats SET total_points = ? WHERE user_id = ?',
        [newBalance, userId]
      );

      const recordId = crypto.randomUUID();
      await transaction.query(
        `INSERT INTO points_records
         (id, user_id, points, balance_after, reason, related_type, related_id)
         VALUES (?, ?, ?, ?, ?, 'workflow', ?)`,
        [recordId, userId, points, newBalance, reason, relatedId]
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      // 积分添加失败不影响主流程，只记录日志
      console.error('Failed to add points:', error);
    }
  }
}

module.exports = new WorkflowService();
