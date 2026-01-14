/**
 * 积分服务
 * 处理积分的添加、查询、转移等
 *
 * 积分规则（参考 docs/requirements.md 第四章）：
 *
 * 发布工作流：
 * - 发布免费工作流：+1分
 * - 发布Pro免费工作流：+2分
 * - 发布付费工作流：+3分
 *
 * 使用激励：
 * - 工作流被使用1次：+0.001分
 * - 付费工作流被购买1次：+0.5分
 *
 * 适用范围：
 * - 所有等级工作流的使用都计入积分
 * - Pro会员（非创作者）的积分可累积，申请创作者后直接继承
 */

const crypto = require('crypto');
const db = require('../config/database');
const {
  POINTS_RULE,
  WORKFLOW_LEVEL,
  WORKFLOW_LEVEL_NAME
} = require('../config/constants');
const { BusinessError } = require('../utils/errors');

// 积分变动原因映射
const POINTS_REASON = {
  PUBLISH_FREE: 'publish_free',
  PUBLISH_PRO: 'publish_pro',
  PUBLISH_PAID: 'publish_paid',
  WORKFLOW_USED: 'workflow_used',
  WORKFLOW_PURCHASED: 'workflow_purchased',
  MANUAL_ADJUST: 'manual_adjust'
};

// 积分变动原因描述
const REASON_DESCRIPTION = {
  [POINTS_REASON.PUBLISH_FREE]: '发布免费工作流',
  [POINTS_REASON.PUBLISH_PRO]: '发布Pro免费工作流',
  [POINTS_REASON.PUBLISH_PAID]: '发布付费工作流',
  [POINTS_REASON.WORKFLOW_USED]: '工作流被使用',
  [POINTS_REASON.WORKFLOW_PURCHASED]: '付费工作流被购买',
  [POINTS_REASON.MANUAL_ADJUST]: '管理员调整'
};

class PointsService {
  /**
   * 添加积分
   * @param {string} userId - 用户ID
   * @param {number} points - 积分数量（可正可负）
   * @param {string} reason - 原因类型
   * @param {Object} options - 可选参数
   * @param {string} options.relatedType - 关联对象类型 ('workflow' | 'purchase' | 'admin')
   * @param {string} options.relatedId - 关联对象ID
   * @param {string} options.description - 自定义描述
   * @param {Object} options.transaction - 数据库事务对象
   * @returns {Promise<{success: boolean, newBalance: number, record: Object}>}
   */
  async addPoints(userId, points, reason, options = {}) {
    const {
      relatedType = null,
      relatedId = null,
      description = null,
      transaction = null
    } = options;

    // 验证原因类型
    if (!Object.values(POINTS_REASON).includes(reason)) {
      throw new BusinessError(`无效的积分变动原因: ${reason}`, 'INVALID_POINTS_REASON', 400);
    }

    const executor = transaction || db;

    // 获取或创建创作者统计记录
    let stats = await executor.queryOne(
      'SELECT * FROM creator_stats WHERE user_id = ?',
      [userId]
    );

    // 如果用户还没有创作者统计记录，先创建一个临时记录用于积分累积
    // 这支持Pro会员（非创作者）累积积分
    if (!stats) {
      const statsId = crypto.randomUUID();
      await executor.query(
        `INSERT INTO creator_stats (id, user_id, level, total_points, work_count, total_usage)
         VALUES (?, ?, 0, 0, 0, 0)`,
        [statsId, userId]
      );
      stats = { total_points: 0 };
    }

    const currentBalance = parseFloat(stats.total_points) || 0;
    const newBalance = currentBalance + points;

    // 更新积分余额
    await executor.query(
      'UPDATE creator_stats SET total_points = ?, updated_at = NOW() WHERE user_id = ?',
      [newBalance, userId]
    );

    // 记录积分变动
    const recordId = crypto.randomUUID();
    const desc = description || REASON_DESCRIPTION[reason] || reason;

    await executor.query(
      `INSERT INTO points_records
       (id, user_id, points, balance_after, reason, related_type, related_id, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [recordId, userId, points, newBalance, reason, relatedType, relatedId, desc]
    );

    return {
      success: true,
      previousBalance: currentBalance,
      pointsAdded: points,
      newBalance,
      record: {
        id: recordId,
        reason,
        description: desc
      }
    };
  }

  /**
   * 发布工作流时添加积分
   * @param {string} userId - 用户ID
   * @param {number} workflowLevel - 工作流等级
   * @param {string} workflowId - 工作流ID
   * @param {Object} transaction - 事务对象
   * @returns {Promise<Object>}
   */
  async addPublishPoints(userId, workflowLevel, workflowId, transaction = null) {
    let points;
    let reason;

    switch (workflowLevel) {
      case WORKFLOW_LEVEL.FREE:
        points = POINTS_RULE.PUBLISH_FREE;
        reason = POINTS_REASON.PUBLISH_FREE;
        break;
      case WORKFLOW_LEVEL.PRO_FREE:
        points = POINTS_RULE.PUBLISH_PRO_FREE;
        reason = POINTS_REASON.PUBLISH_PRO;
        break;
      case WORKFLOW_LEVEL.PAID:
        points = POINTS_RULE.PUBLISH_PAID;
        reason = POINTS_REASON.PUBLISH_PAID;
        break;
      default:
        throw new BusinessError('无效的工作流等级', 'INVALID_WORKFLOW_LEVEL', 400);
    }

    return this.addPoints(userId, points, reason, {
      relatedType: 'workflow',
      relatedId: workflowId,
      description: `发布${WORKFLOW_LEVEL_NAME[workflowLevel]}`,
      transaction
    });
  }

  /**
   * 工作流被使用时添加积分
   * @param {string} creatorId - 创作者ID
   * @param {string} workflowId - 工作流ID
   * @returns {Promise<Object>}
   */
  async addUsagePoints(creatorId, workflowId) {
    return this.addPoints(creatorId, POINTS_RULE.WORKFLOW_USED, POINTS_REASON.WORKFLOW_USED, {
      relatedType: 'workflow',
      relatedId: workflowId
    });
  }

  /**
   * 付费工作流被购买时添加积分
   * @param {string} creatorId - 创作者ID
   * @param {string} purchaseId - 购买记录ID
   * @param {string} workflowId - 工作流ID
   * @param {Object} transaction - 事务对象
   * @returns {Promise<Object>}
   */
  async addPurchasePoints(creatorId, purchaseId, workflowId, transaction = null) {
    return this.addPoints(creatorId, POINTS_RULE.WORKFLOW_PURCHASED, POINTS_REASON.WORKFLOW_PURCHASED, {
      relatedType: 'purchase',
      relatedId: purchaseId,
      description: `工作流被购买`,
      transaction
    });
  }

  /**
   * 管理员手动调整积分
   * @param {string} userId - 用户ID
   * @param {number} points - 积分变动（正数增加，负数减少）
   * @param {string} adminId - 管理员ID
   * @param {string} reason - 调整原因说明
   * @returns {Promise<Object>}
   */
  async adjustPoints(userId, points, adminId, reason) {
    return this.addPoints(userId, points, POINTS_REASON.MANUAL_ADJUST, {
      relatedType: 'admin',
      relatedId: adminId,
      description: reason || '管理员手动调整'
    });
  }

  /**
   * 获取用户积分信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>}
   */
  async getPoints(userId) {
    const stats = await db.queryOne(
      'SELECT * FROM creator_stats WHERE user_id = ?',
      [userId]
    );

    if (!stats) {
      return {
        totalPoints: 0,
        level: 0,
        isCreator: false,
        workCount: 0,
        totalUsage: 0
      };
    }

    return {
      totalPoints: parseFloat(stats.total_points) || 0,
      level: stats.level,
      isCreator: stats.level > 0,
      workCount: stats.work_count,
      totalUsage: stats.total_usage,
      totalRevenue: parseFloat(stats.total_revenue) || 0,
      pendingRevenue: parseFloat(stats.pending_revenue) || 0
    };
  }

  /**
   * 获取积分记录列表
   * @param {string} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<{records: Array, total: number}>}
   */
  async getPointsRecords(userId, options = {}) {
    const {
      reason,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = options;

    let whereClause = 'WHERE user_id = ?';
    const params = [userId];

    if (reason) {
      whereClause += ' AND reason = ?';
      params.push(reason);
    }

    if (startDate) {
      whereClause += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND created_at <= ?';
      params.push(endDate);
    }

    // 获取总数
    const countResult = await db.queryOne(
      `SELECT COUNT(*) as total FROM points_records ${whereClause}`,
      params
    );

    // 获取记录
    const offset = (page - 1) * limit;
    const records = await db.query(
      `SELECT * FROM points_records
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      records,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  /**
   * 获取积分统计
   * @param {string} userId - 用户ID
   * @param {Object} options - 统计选项
   * @returns {Promise<Object>}
   */
  async getPointsStats(userId, options = {}) {
    const { days = 30 } = options;

    // 按原因分组统计
    const byReason = await db.query(
      `SELECT reason, SUM(points) as total, COUNT(*) as count
       FROM points_records
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY reason`,
      [userId, days]
    );

    // 按日期统计趋势
    const byDate = await db.query(
      `SELECT DATE(created_at) as date, SUM(points) as total
       FROM points_records
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [userId, days]
    );

    // 总计
    const totalEarned = await db.queryOne(
      `SELECT SUM(CASE WHEN points > 0 THEN points ELSE 0 END) as earned,
              SUM(CASE WHEN points < 0 THEN ABS(points) ELSE 0 END) as spent
       FROM points_records
       WHERE user_id = ?`,
      [userId]
    );

    return {
      period: `最近${days}天`,
      byReason: byReason.reduce((acc, row) => {
        acc[row.reason] = {
          total: parseFloat(row.total) || 0,
          count: row.count,
          description: REASON_DESCRIPTION[row.reason] || row.reason
        };
        return acc;
      }, {}),
      byDate,
      lifetime: {
        totalEarned: parseFloat(totalEarned?.earned) || 0,
        totalSpent: parseFloat(totalEarned?.spent) || 0
      }
    };
  }

  /**
   * 转移积分（Pro会员申请创作者时）
   * 将Pro会员累积的积分正式转为创作者积分
   * @param {string} userId - 用户ID
   * @param {Object} transaction - 事务对象
   * @returns {Promise<Object>}
   */
  async transferPoints(userId, transaction = null) {
    const executor = transaction || db;

    // 获取当前积分记录
    const stats = await executor.queryOne(
      'SELECT * FROM creator_stats WHERE user_id = ?',
      [userId]
    );

    if (!stats) {
      // 没有积分记录，创建新的创作者统计
      const statsId = crypto.randomUUID();
      await executor.query(
        `INSERT INTO creator_stats (id, user_id, level, total_points, work_count, total_usage)
         VALUES (?, ?, 1, 0, 0, 0)`,
        [statsId, userId]
      );

      return {
        transferred: false,
        reason: '没有待转移的积分',
        newBalance: 0
      };
    }

    const currentPoints = parseFloat(stats.total_points) || 0;

    // 如果level为0，说明是Pro会员累积的积分，需要转移
    if (stats.level === 0 && currentPoints > 0) {
      // 更新level为1（正式成为创作者）
      await executor.query(
        'UPDATE creator_stats SET level = 1, updated_at = NOW() WHERE user_id = ?',
        [userId]
      );

      // 记录转移日志
      const logId = crypto.randomUUID();
      await executor.query(
        `INSERT INTO operation_logs
         (id, operator_type, operator_id, action, target_type, target_id, old_value, new_value)
         VALUES (?, 'system', ?, 'transfer_points', 'creator_stats', ?, ?, ?)`,
        [
          logId,
          userId,
          stats.id,
          JSON.stringify({ level: 0, points: currentPoints }),
          JSON.stringify({ level: 1, points: currentPoints })
        ]
      );

      return {
        transferred: true,
        previousLevel: 0,
        newLevel: 1,
        pointsTransferred: currentPoints,
        newBalance: currentPoints
      };
    }

    // 已经是创作者，不需要转移
    return {
      transferred: false,
      reason: '已是创作者，无需转移',
      currentLevel: stats.level,
      currentBalance: currentPoints
    };
  }

  /**
   * 批量添加使用积分（用于批量处理）
   * @param {Array<{creatorId: string, workflowId: string}>} usages - 使用记录数组
   * @returns {Promise<Object>}
   */
  async batchAddUsagePoints(usages) {
    const transaction = await db.beginTransaction();
    const results = { success: 0, failed: 0, errors: [] };

    try {
      for (const usage of usages) {
        try {
          await this.addPoints(
            usage.creatorId,
            POINTS_RULE.WORKFLOW_USED,
            POINTS_REASON.WORKFLOW_USED,
            {
              relatedType: 'workflow',
              relatedId: usage.workflowId,
              transaction
            }
          );
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            creatorId: usage.creatorId,
            workflowId: usage.workflowId,
            error: error.message
          });
        }
      }

      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 获取积分排行榜
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>}
   */
  async getPointsLeaderboard(options = {}) {
    const { limit = 100, minLevel = 1 } = options;

    const leaderboard = await db.query(
      `SELECT cs.user_id, cs.level, cs.total_points, cs.work_count, cs.total_usage,
              u.username, u.avatar
       FROM creator_stats cs
       LEFT JOIN users u ON cs.user_id = u.id
       WHERE cs.level >= ?
       ORDER BY cs.total_points DESC
       LIMIT ?`,
      [minLevel, limit]
    );

    return leaderboard.map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      username: row.username,
      avatar: row.avatar,
      level: row.level,
      totalPoints: parseFloat(row.total_points) || 0,
      workCount: row.work_count,
      totalUsage: row.total_usage
    }));
  }

  /**
   * 检查并更新用户等级
   * 在添加积分后调用，检查是否满足升级条件
   * @param {string} userId - 用户ID
   * @returns {Promise<{upgraded: boolean, oldLevel?: number, newLevel?: number}>}
   */
  async checkAndUpgradeLevel(userId) {
    const stats = await db.queryOne(
      'SELECT * FROM creator_stats WHERE user_id = ?',
      [userId]
    );

    if (!stats || stats.level === 0 || stats.level >= 10) {
      return { upgraded: false };
    }

    // 获取等级门槛配置
    const thresholds = await db.query(
      'SELECT * FROM level_thresholds WHERE level > ? ORDER BY level ASC',
      [stats.level]
    );

    const currentLevel = stats.level;
    let newLevel = currentLevel;

    // 检查是否满足更高等级的条件
    for (const threshold of thresholds) {
      const meetsPoints = parseFloat(stats.total_points) >= parseFloat(threshold.required_points);
      const meetsWorks = stats.work_count >= threshold.required_works;
      const meetsUsage = stats.total_usage >= threshold.required_usage;

      if (meetsPoints && meetsWorks && meetsUsage) {
        newLevel = threshold.level;
      } else {
        break; // 不满足当前等级，后面的也不会满足
      }
    }

    if (newLevel > currentLevel) {
      const transaction = await db.beginTransaction();

      try {
        // 更新等级
        await transaction.query(
          'UPDATE creator_stats SET level = ?, updated_at = NOW() WHERE user_id = ?',
          [newLevel, userId]
        );

        // 记录升级历史
        const upgradeId = crypto.randomUUID();
        await transaction.query(
          `INSERT INTO level_upgrades
           (id, user_id, old_level, new_level, trigger_points, trigger_works, trigger_usage)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            upgradeId,
            userId,
            currentLevel,
            newLevel,
            stats.total_points,
            stats.work_count,
            stats.total_usage
          ]
        );

        await transaction.commit();

        return {
          upgraded: true,
          oldLevel: currentLevel,
          newLevel,
          stats: {
            points: parseFloat(stats.total_points),
            works: stats.work_count,
            usage: stats.total_usage
          }
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    return { upgraded: false };
  }
}

// 导出常量供外部使用
PointsService.REASON = POINTS_REASON;
PointsService.REASON_DESCRIPTION = REASON_DESCRIPTION;

module.exports = new PointsService();
