/**
 * 用户服务
 * 处理用户身份判断、会员状态管理、创作者申请等
 */

const db = require('../config/database');
const {
  MEMBERSHIP_TYPE,
  MEMBERSHIP_STATUS,
  USER_STATUS,
  WORKFLOW_STATUS,
  CREATOR_APPLY_REQUIREMENTS,
  CREATOR_LEVELS
} = require('../config/constants');
const {
  UserNotFoundError,
  UserSuspendedError,
  MembershipNotFoundError,
  MembershipExpiredError,
  NotProUserError,
  AlreadyCreatorError,
  CreatorApplyError
} = require('../utils/errors');

class UserService {
  /**
   * 获取用户信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 用户信息
   */
  async getUserById(userId) {
    const user = await db.queryOne(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      throw new UserSuspendedError(userId);
    }

    if (user.status === USER_STATUS.DELETED) {
      throw new UserNotFoundError(userId);
    }

    return user;
  }

  /**
   * 获取用户会员信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 会员信息
   */
  async getMembership(userId) {
    const membership = await db.queryOne(
      'SELECT * FROM memberships WHERE user_id = ?',
      [userId]
    );

    if (!membership) {
      throw new MembershipNotFoundError(userId);
    }

    return membership;
  }

  /**
   * 获取用户完整身份信息（用户信息 + 会员信息 + 创作者统计）
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 完整用户身份信息
   */
  async getUserIdentity(userId) {
    const user = await this.getUserById(userId);
    const membership = await this.getMembership(userId);

    // 检查Pro会员是否过期
    const isProExpired = membership.type === MEMBERSHIP_TYPE.PRO &&
      membership.expires_at &&
      new Date(membership.expires_at) < new Date();

    if (isProExpired && membership.status === MEMBERSHIP_STATUS.ACTIVE) {
      // 自动更新过期状态
      await db.query(
        'UPDATE memberships SET status = ? WHERE user_id = ?',
        [MEMBERSHIP_STATUS.EXPIRED, userId]
      );
      membership.status = MEMBERSHIP_STATUS.EXPIRED;
    }

    // 获取创作者统计（如果是创作者）
    let creatorStats = null;
    if (membership.is_creator) {
      creatorStats = await db.queryOne(
        'SELECT * FROM creator_stats WHERE user_id = ?',
        [userId]
      );
    }

    return {
      user,
      membership,
      creatorStats,
      // 便捷方法
      isFree: this._isFreeUser(membership),
      isPro: this._isProUser(membership),
      isCreator: this._isCreator(membership),
      isProExpired: membership.status === MEMBERSHIP_STATUS.EXPIRED
    };
  }

  /**
   * 判断是否为Free用户
   * @param {Object} membership - 会员信息
   * @returns {boolean}
   */
  _isFreeUser(membership) {
    return membership.type === MEMBERSHIP_TYPE.FREE ||
      membership.status !== MEMBERSHIP_STATUS.ACTIVE;
  }

  /**
   * 判断是否为有效Pro用户
   * @param {Object} membership - 会员信息
   * @returns {boolean}
   */
  _isProUser(membership) {
    return membership.type === MEMBERSHIP_TYPE.PRO &&
      membership.status === MEMBERSHIP_STATUS.ACTIVE;
  }

  /**
   * 判断是否为创作者
   * @param {Object} membership - 会员信息
   * @returns {boolean}
   */
  _isCreator(membership) {
    // 创作者必须是有效的Pro会员
    return this._isProUser(membership) && membership.is_creator === 1;
  }

  /**
   * 检查用户是否为Free用户
   * @param {string} userId - 用户ID
   * @returns {Promise<boolean>}
   */
  async isFreeUser(userId) {
    const membership = await this.getMembership(userId);
    return this._isFreeUser(membership);
  }

  /**
   * 检查用户是否为Pro用户（包含创作者）
   * @param {string} userId - 用户ID
   * @returns {Promise<boolean>}
   */
  async isProUser(userId) {
    const membership = await this.getMembership(userId);
    return this._isProUser(membership);
  }

  /**
   * 检查用户是否为创作者
   * @param {string} userId - 用户ID
   * @returns {Promise<boolean>}
   */
  async isCreator(userId) {
    const membership = await this.getMembership(userId);
    return this._isCreator(membership);
  }

  /**
   * 获取用户的有效身份类型
   * @param {string} userId - 用户ID
   * @returns {Promise<string>} 'free' | 'pro' | 'creator'
   */
  async getUserType(userId) {
    const membership = await this.getMembership(userId);

    if (this._isCreator(membership)) {
      return 'creator';
    }
    if (this._isProUser(membership)) {
      return 'pro';
    }
    return 'free';
  }

  /**
   * 获取用户已上架的工作流数量
   * @param {string} userId - 用户ID
   * @returns {Promise<number>}
   */
  async getApprovedWorkflowCount(userId) {
    const result = await db.queryOne(
      `SELECT COUNT(*) as count FROM workflows
       WHERE creator_id = ? AND status = ?`,
      [userId, WORKFLOW_STATUS.APPROVED]
    );
    return result.count;
  }

  /**
   * 检查用户是否满足创作者申请条件
   * @param {string} userId - 用户ID
   * @returns {Promise<{eligible: boolean, reason?: string, current: Object, required: Object}>}
   */
  async checkCreatorEligibility(userId) {
    const identity = await this.getUserIdentity(userId);

    // 检查是否是Pro用户
    if (!identity.isPro) {
      return {
        eligible: false,
        reason: '需要先成为Pro会员才能申请创作者',
        current: { isPro: false },
        required: { isPro: true }
      };
    }

    // 检查是否已经是创作者
    if (identity.isCreator) {
      return {
        eligible: false,
        reason: '您已经是创作者',
        current: { isCreator: true },
        required: {}
      };
    }

    // 检查已上架工作流数量
    const approvedCount = await this.getApprovedWorkflowCount(userId);
    const minRequired = CREATOR_APPLY_REQUIREMENTS.MIN_APPROVED_WORKFLOWS;

    if (approvedCount < minRequired) {
      return {
        eligible: false,
        reason: `需要至少${minRequired}个已上架工作流，当前有${approvedCount}个`,
        current: { approvedWorkflows: approvedCount },
        required: { approvedWorkflows: minRequired }
      };
    }

    return {
      eligible: true,
      current: { approvedWorkflows: approvedCount },
      required: { approvedWorkflows: minRequired }
    };
  }

  /**
   * 申请成为创作者
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 更新后的会员信息
   */
  async applyForCreator(userId) {
    const eligibility = await this.checkCreatorEligibility(userId);

    if (!eligibility.eligible) {
      throw new CreatorApplyError(eligibility.reason);
    }

    const transaction = await db.beginTransaction();

    try {
      // 更新会员表，设置为创作者
      await transaction.query(
        `UPDATE memberships
         SET is_creator = 1, creator_applied_at = NOW(), creator_approved_at = NOW()
         WHERE user_id = ?`,
        [userId]
      );

      // 创建创作者统计记录
      const statsId = require('crypto').randomUUID();
      await transaction.query(
        `INSERT INTO creator_stats (id, user_id, level, total_points, work_count, total_usage)
         VALUES (?, ?, 1, 0, ?, 0)`,
        [statsId, userId, eligibility.current.approvedWorkflows]
      );

      // 记录操作日志
      const logId = require('crypto').randomUUID();
      await transaction.query(
        `INSERT INTO operation_logs (id, operator_type, operator_id, action, target_type, target_id, new_value)
         VALUES (?, 'user', ?, 'apply_creator', 'membership', ?, ?)`,
        [logId, userId, userId, JSON.stringify({ is_creator: 1 })]
      );

      await transaction.commit();

      // 返回更新后的身份信息
      return this.getUserIdentity(userId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 获取创作者等级信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 等级信息和升级进度
   */
  async getCreatorLevelInfo(userId) {
    const identity = await this.getUserIdentity(userId);

    if (!identity.isCreator) {
      throw new NotProUserError();
    }

    const stats = identity.creatorStats;
    const currentLevel = stats.level;
    const nextLevel = currentLevel < 10 ? currentLevel + 1 : null;

    const currentThreshold = CREATOR_LEVELS[currentLevel];
    const nextThreshold = nextLevel ? CREATOR_LEVELS[nextLevel] : null;

    // 计算升级进度
    let progress = null;
    if (nextThreshold) {
      progress = {
        points: {
          current: parseFloat(stats.total_points),
          required: nextThreshold.points,
          percentage: Math.min(100, (parseFloat(stats.total_points) / nextThreshold.points) * 100)
        },
        works: {
          current: stats.work_count,
          required: nextThreshold.works,
          percentage: Math.min(100, (stats.work_count / nextThreshold.works) * 100)
        },
        usage: {
          current: stats.total_usage,
          required: nextThreshold.usage,
          percentage: Math.min(100, (stats.total_usage / nextThreshold.usage) * 100)
        }
      };
    }

    return {
      level: currentLevel,
      shareRate: currentThreshold.shareRate,
      stats: {
        totalPoints: parseFloat(stats.total_points),
        workCount: stats.work_count,
        totalUsage: stats.total_usage,
        totalRevenue: parseFloat(stats.total_revenue),
        pendingRevenue: parseFloat(stats.pending_revenue)
      },
      nextLevel,
      nextThreshold,
      progress,
      isMaxLevel: currentLevel === 10
    };
  }

  /**
   * 检查并升级创作者等级
   * @param {string} userId - 用户ID
   * @returns {Promise<{upgraded: boolean, oldLevel?: number, newLevel?: number}>}
   */
  async checkAndUpgradeLevel(userId) {
    const identity = await this.getUserIdentity(userId);

    if (!identity.isCreator) {
      return { upgraded: false };
    }

    const stats = identity.creatorStats;
    const currentLevel = stats.level;

    if (currentLevel >= 10) {
      return { upgraded: false };
    }

    // 检查是否满足下一级条件
    const nextThreshold = CREATOR_LEVELS[currentLevel + 1];

    const meetsPoints = parseFloat(stats.total_points) >= nextThreshold.points;
    const meetsWorks = stats.work_count >= nextThreshold.works;
    const meetsUsage = stats.total_usage >= nextThreshold.usage;

    if (meetsPoints && meetsWorks && meetsUsage) {
      const transaction = await db.beginTransaction();

      try {
        // 更新等级
        await transaction.query(
          'UPDATE creator_stats SET level = ? WHERE user_id = ?',
          [currentLevel + 1, userId]
        );

        // 记录升级历史
        const upgradeId = require('crypto').randomUUID();
        await transaction.query(
          `INSERT INTO level_upgrades (id, user_id, old_level, new_level, trigger_points, trigger_works, trigger_usage)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [upgradeId, userId, currentLevel, currentLevel + 1,
            stats.total_points, stats.work_count, stats.total_usage]
        );

        await transaction.commit();

        return {
          upgraded: true,
          oldLevel: currentLevel,
          newLevel: currentLevel + 1
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    return { upgraded: false };
  }

  /**
   * 初始化新用户的会员记录
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>}
   */
  async initializeMembership(userId) {
    const membershipId = require('crypto').randomUUID();

    await db.query(
      `INSERT INTO memberships (id, user_id, type, is_creator, status)
       VALUES (?, ?, ?, 0, ?)`,
      [membershipId, userId, MEMBERSHIP_TYPE.FREE, MEMBERSHIP_STATUS.ACTIVE]
    );

    return this.getMembership(userId);
  }

  /**
   * 升级为Pro会员
   * @param {string} userId - 用户ID
   * @param {string} planType - 订阅类型 'monthly' | 'quarterly' | 'yearly'
   * @param {Object} paymentInfo - 支付信息
   * @returns {Promise<Object>}
   */
  async upgradeToProMember(userId, planType, paymentInfo) {
    const membership = await this.getMembership(userId);

    // 计算过期时间
    const now = new Date();
    let expiresAt = new Date();

    switch (planType) {
      case 'monthly':
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        break;
      case 'quarterly':
        expiresAt.setMonth(expiresAt.getMonth() + 3);
        break;
      case 'yearly':
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        break;
      default:
        throw new Error('无效的订阅类型');
    }

    // 如果是续费，从当前过期时间开始计算
    if (membership.type === MEMBERSHIP_TYPE.PRO &&
      membership.status === MEMBERSHIP_STATUS.ACTIVE &&
      membership.expires_at) {
      const currentExpires = new Date(membership.expires_at);
      if (currentExpires > now) {
        expiresAt = new Date(currentExpires);
        switch (planType) {
          case 'monthly':
            expiresAt.setMonth(expiresAt.getMonth() + 1);
            break;
          case 'quarterly':
            expiresAt.setMonth(expiresAt.getMonth() + 3);
            break;
          case 'yearly':
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            break;
        }
      }
    }

    const transaction = await db.beginTransaction();

    try {
      // 更新会员状态
      await transaction.query(
        `UPDATE memberships
         SET type = ?, status = ?, started_at = COALESCE(started_at, NOW()), expires_at = ?
         WHERE user_id = ?`,
        [MEMBERSHIP_TYPE.PRO, MEMBERSHIP_STATUS.ACTIVE, expiresAt, userId]
      );

      // 记录订阅历史
      const subscriptionId = require('crypto').randomUUID();
      await transaction.query(
        `INSERT INTO pro_subscriptions (id, user_id, plan_type, amount, started_at, expires_at, payment_method, payment_id, status)
         VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, 'paid')`,
        [subscriptionId, userId, planType, paymentInfo.amount, expiresAt,
          paymentInfo.paymentMethod, paymentInfo.paymentId]
      );

      await transaction.commit();

      return this.getUserIdentity(userId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new UserService();
