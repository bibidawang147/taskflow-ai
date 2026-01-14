/**
 * 管理后台服务
 * 提供用户管理、收益报表、系统仪表盘等功能
 */

const crypto = require('crypto');
const db = require('../config/database');
const RevenueService = require('./RevenueService');
const { BusinessError, ValidationError } = require('../utils/errors');
const {
  MEMBERSHIP_TYPE,
  WORKFLOW_LEVEL,
  WORKFLOW_STATUS,
  CREATOR_LEVELS
} = require('../config/constants');

class AdminService {
  // ============ 用户管理 ============

  /**
   * 获取用户列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getUserList(options = {}) {
    const {
      page = 1,
      limit = 20,
      keyword,
      membershipType,
      isCreator,
      status,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (membershipType) {
      whereClause += ' AND m.type = ?';
      params.push(membershipType);
    }

    if (isCreator !== undefined) {
      whereClause += ' AND m.is_creator = ?';
      params.push(isCreator ? 1 : 0);
    }

    if (status) {
      whereClause += ' AND u.status = ?';
      params.push(status);
    }

    // 计算总数
    const countResult = await db.queryOne(
      `SELECT COUNT(DISTINCT u.id) as total
       FROM users u
       LEFT JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
       ${whereClause}`,
      params
    );

    // 验证排序字段
    const allowedSortFields = ['created_at', 'username', 'email', 'last_login_at'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;
    const users = await db.query(
      `SELECT
         u.id, u.username, u.email, u.avatar, u.phone, u.status,
         u.created_at, u.last_login_at,
         m.type as membership_type, m.is_creator, m.started_at as membership_started,
         m.expires_at as membership_expires,
         cs.level as creator_level, cs.total_points, cs.work_count, cs.total_usage
       FROM users u
       LEFT JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
       LEFT JOIN creator_stats cs ON u.id = cs.user_id
       ${whereClause}
       ORDER BY u.${safeSortBy} ${safeSortOrder}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      users: users.map(u => ({
        ...u,
        totalPoints: parseFloat(u.total_points) || 0,
        isCreator: !!u.is_creator
      })),
      pagination: {
        total: countResult.total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(countResult.total / limit)
      }
    };
  }

  /**
   * 获取用户详情
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>}
   */
  async getUserDetail(userId) {
    const user = await db.queryOne(
      `SELECT
         u.*,
         m.type as membership_type, m.is_creator, m.started_at as membership_started,
         m.expires_at as membership_expires, m.status as membership_status,
         cs.level as creator_level, cs.total_points, cs.work_count,
         cs.total_usage, cs.total_revenue, cs.pending_revenue, cs.withdrawn_revenue
       FROM users u
       LEFT JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
       LEFT JOIN creator_stats cs ON u.id = cs.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (!user) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND', 404);
    }

    // 获取用户工作流统计
    const workflowStats = await db.queryOne(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
       FROM workflows
       WHERE creator_id = ?`,
      [userId]
    );

    // 获取用户购买记录统计
    const purchaseStats = await db.queryOne(
      `SELECT
         COUNT(*) as total_purchases,
         COALESCE(SUM(actual_price), 0) as total_spent
       FROM workflow_purchases
       WHERE buyer_id = ? AND status = 'paid'`,
      [userId]
    );

    // 获取用户销售统计（如果是创作者）
    let salesStats = null;
    if (user.is_creator) {
      salesStats = await db.queryOne(
        `SELECT
           COUNT(*) as total_sales,
           COALESCE(SUM(actual_price), 0) as total_amount,
           COALESCE(SUM(creator_revenue), 0) as total_revenue
         FROM workflow_purchases
         WHERE seller_id = ? AND status = 'paid'`,
        [userId]
      );
    }

    // 获取最近操作日志
    const recentLogs = await db.query(
      `SELECT * FROM operation_logs
       WHERE operator_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    return {
      ...user,
      totalPoints: parseFloat(user.total_points) || 0,
      totalRevenue: parseFloat(user.total_revenue) || 0,
      pendingRevenue: parseFloat(user.pending_revenue) || 0,
      withdrawnRevenue: parseFloat(user.withdrawn_revenue) || 0,
      isCreator: !!user.is_creator,
      workflowStats,
      purchaseStats: {
        totalPurchases: purchaseStats.total_purchases,
        totalSpent: parseFloat(purchaseStats.total_spent) || 0
      },
      salesStats: salesStats ? {
        totalSales: salesStats.total_sales,
        totalAmount: parseFloat(salesStats.total_amount) || 0,
        totalRevenue: parseFloat(salesStats.total_revenue) || 0
      } : null,
      recentLogs
    };
  }

  /**
   * 更新用户状态
   * @param {string} userId - 用户ID
   * @param {string} status - 新状态
   * @param {string} adminId - 管理员ID
   * @param {string} reason - 原因
   * @returns {Promise<Object>}
   */
  async updateUserStatus(userId, status, adminId, reason) {
    const validStatuses = ['active', 'suspended', 'banned'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('无效的状态值');
    }

    const user = await db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND', 404);
    }

    const oldStatus = user.status;

    await db.query(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, userId]
    );

    // 记录操作日志
    const logId = crypto.randomUUID();
    await db.query(
      `INSERT INTO operation_logs
       (id, operator_type, operator_id, action, target_type, target_id, old_value, new_value)
       VALUES (?, 'admin', ?, 'change_user_status', 'user', ?, ?, ?)`,
      [logId, adminId, userId, JSON.stringify({ status: oldStatus }), JSON.stringify({ status, reason })]
    );

    return {
      success: true,
      userId,
      oldStatus,
      newStatus: status
    };
  }

  /**
   * 获取创作者申请列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getCreatorApplications(options = {}) {
    const { page = 1, limit = 20, status = 'pending' } = options;

    const countResult = await db.queryOne(
      `SELECT COUNT(*) as total FROM creator_applications WHERE status = ?`,
      [status]
    );

    const offset = (page - 1) * limit;
    const applications = await db.query(
      `SELECT ca.*, u.username, u.email, u.avatar,
              (SELECT COUNT(*) FROM workflows WHERE creator_id = ca.user_id AND status = 'approved') as approved_workflows
       FROM creator_applications ca
       LEFT JOIN users u ON ca.user_id = u.id
       WHERE ca.status = ?
       ORDER BY ca.created_at ASC
       LIMIT ? OFFSET ?`,
      [status, limit, offset]
    );

    return {
      applications,
      pagination: {
        total: countResult.total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(countResult.total / limit)
      }
    };
  }

  /**
   * 审核创作者申请
   * @param {string} applicationId - 申请ID
   * @param {string} action - 操作: approve/reject
   * @param {string} adminId - 管理员ID
   * @param {string} reason - 原因（拒绝时必填）
   * @returns {Promise<Object>}
   */
  async reviewCreatorApplication(applicationId, action, adminId, reason) {
    const application = await db.queryOne(
      'SELECT * FROM creator_applications WHERE id = ?',
      [applicationId]
    );

    if (!application) {
      throw new BusinessError('申请不存在', 'APPLICATION_NOT_FOUND', 404);
    }

    if (application.status !== 'pending') {
      throw new BusinessError('申请已处理', 'APPLICATION_ALREADY_PROCESSED', 400);
    }

    const transaction = await db.beginTransaction();

    try {
      if (action === 'approve') {
        // 更新申请状态
        await transaction.query(
          `UPDATE creator_applications
           SET status = 'approved', reviewed_by = ?, reviewed_at = NOW()
           WHERE id = ?`,
          [adminId, applicationId]
        );

        // 更新会员为创作者
        await transaction.query(
          `UPDATE memberships SET is_creator = 1, updated_at = NOW()
           WHERE user_id = ? AND status = 'active'`,
          [application.user_id]
        );

        // 初始化创作者统计（如果不存在）
        const existingStats = await transaction.queryOne(
          'SELECT id FROM creator_stats WHERE user_id = ?',
          [application.user_id]
        );

        if (!existingStats) {
          const statsId = crypto.randomUUID();
          await transaction.query(
            `INSERT INTO creator_stats (id, user_id, level, total_points, work_count, total_usage)
             VALUES (?, ?, 1, 0, 0, 0)`,
            [statsId, application.user_id]
          );
        }
      } else {
        // 拒绝申请
        await transaction.query(
          `UPDATE creator_applications
           SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), reject_reason = ?
           WHERE id = ?`,
          [adminId, reason, applicationId]
        );
      }

      // 记录操作日志
      const logId = crypto.randomUUID();
      await transaction.query(
        `INSERT INTO operation_logs
         (id, operator_type, operator_id, action, target_type, target_id, new_value)
         VALUES (?, 'admin', ?, ?, 'creator_application', ?, ?)`,
        [
          logId,
          adminId,
          action === 'approve' ? 'approve_creator_application' : 'reject_creator_application',
          applicationId,
          JSON.stringify({ reason })
        ]
      );

      await transaction.commit();

      return {
        success: true,
        applicationId,
        action,
        userId: application.user_id
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ============ 收益报表 ============

  /**
   * 获取平台收益概览
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getRevenueOverview(options = {}) {
    const { startDate, endDate } = options;

    let dateFilter = '';
    const params = [];

    if (startDate) {
      dateFilter += ' AND created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ' AND created_at <= ?';
      params.push(endDate);
    }

    // Pro会员收入
    const proRevenue = await db.queryOne(
      `SELECT
         COUNT(*) as total_subscriptions,
         COALESCE(SUM(amount), 0) as total_amount
       FROM pro_subscriptions
       WHERE status = 'paid' ${dateFilter}`,
      params
    );

    // 付费工作流销售
    const saleParams = [...params];
    let saleDateFilter = dateFilter.replace(/created_at/g, 'purchased_at');

    const salesRevenue = await db.queryOne(
      `SELECT
         COUNT(*) as total_sales,
         COALESCE(SUM(actual_price), 0) as total_amount,
         COALESCE(SUM(platform_revenue), 0) as platform_revenue,
         COALESCE(SUM(creator_revenue), 0) as creator_revenue
       FROM workflow_purchases
       WHERE status = 'paid' ${saleDateFilter}`,
      saleParams
    );

    // 激励池分配
    const incentiveParams = [...params];
    let incentiveDateFilter = dateFilter.replace(/created_at/g, 'period_start');

    const incentivePool = await db.queryOne(
      `SELECT
         COUNT(*) as total_periods,
         COALESCE(SUM(total_amount), 0) as total_amount,
         COALESCE(SUM(distributed_amount), 0) as distributed_amount
       FROM incentive_pools
       WHERE status = 'distributed' ${incentiveDateFilter}`,
      incentiveParams
    );

    // 待结算收益
    const pendingRevenue = await db.queryOne(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM revenue_records
       WHERE status = 'pending'`
    );

    return {
      proMembership: {
        totalSubscriptions: proRevenue.total_subscriptions,
        totalAmount: parseFloat(proRevenue.total_amount) || 0
      },
      workflowSales: {
        totalSales: salesRevenue.total_sales,
        totalAmount: parseFloat(salesRevenue.total_amount) || 0,
        platformRevenue: parseFloat(salesRevenue.platform_revenue) || 0,
        creatorRevenue: parseFloat(salesRevenue.creator_revenue) || 0
      },
      incentivePool: {
        totalPeriods: incentivePool.total_periods,
        totalAmount: parseFloat(incentivePool.total_amount) || 0,
        distributedAmount: parseFloat(incentivePool.distributed_amount) || 0
      },
      pendingSettlement: parseFloat(pendingRevenue.total) || 0
    };
  }

  /**
   * 获取收益趋势
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getRevenueTrend(options = {}) {
    const { period = 'daily', days = 30 } = options;

    let dateFormat, interval;
    if (period === 'daily') {
      dateFormat = '%Y-%m-%d';
      interval = `DATE_SUB(NOW(), INTERVAL ${days} DAY)`;
    } else if (period === 'weekly') {
      dateFormat = '%Y-%u';
      interval = `DATE_SUB(NOW(), INTERVAL ${days * 7} DAY)`;
    } else {
      dateFormat = '%Y-%m';
      interval = `DATE_SUB(NOW(), INTERVAL ${days} MONTH)`;
    }

    // Pro会员收入趋势
    const proTrend = await db.query(
      `SELECT
         DATE_FORMAT(created_at, '${dateFormat}') as date,
         COUNT(*) as subscriptions,
         SUM(amount) as amount
       FROM pro_subscriptions
       WHERE status = 'paid' AND created_at >= ${interval}
       GROUP BY DATE_FORMAT(created_at, '${dateFormat}')
       ORDER BY date ASC`
    );

    // 销售收入趋势
    const salesTrend = await db.query(
      `SELECT
         DATE_FORMAT(purchased_at, '${dateFormat}') as date,
         COUNT(*) as sales,
         SUM(actual_price) as amount,
         SUM(platform_revenue) as platform_revenue
       FROM workflow_purchases
       WHERE status = 'paid' AND purchased_at >= ${interval}
       GROUP BY DATE_FORMAT(purchased_at, '${dateFormat}')
       ORDER BY date ASC`
    );

    return {
      period,
      proMembershipTrend: proTrend.map(t => ({
        date: t.date,
        subscriptions: t.subscriptions,
        amount: parseFloat(t.amount) || 0
      })),
      salesTrend: salesTrend.map(t => ({
        date: t.date,
        sales: t.sales,
        amount: parseFloat(t.amount) || 0,
        platformRevenue: parseFloat(t.platform_revenue) || 0
      }))
    };
  }

  /**
   * 获取创作者收益排行
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getCreatorRevenueRanking(options = {}) {
    const { page = 1, limit = 20, period } = options;

    let dateFilter = '';
    const params = [];

    if (period) {
      dateFilter = 'AND rr.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    }

    const offset = (page - 1) * limit;
    const ranking = await db.query(
      `SELECT
         u.id, u.username, u.avatar,
         cs.level as creator_level,
         COALESCE(SUM(rr.amount), 0) as total_revenue,
         COUNT(DISTINCT rr.id) as revenue_records
       FROM users u
       JOIN creator_stats cs ON u.id = cs.user_id
       LEFT JOIN revenue_records rr ON u.id = rr.user_id AND rr.status IN ('pending', 'settled') ${dateFilter}
       GROUP BY u.id, u.username, u.avatar, cs.level
       ORDER BY total_revenue DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return {
      ranking: ranking.map((r, index) => ({
        rank: offset + index + 1,
        ...r,
        totalRevenue: parseFloat(r.total_revenue) || 0
      })),
      pagination: {
        page,
        pageSize: limit
      }
    };
  }

  /**
   * 手动触发收益分配
   * @param {string} adminId - 管理员ID
   * @param {string} period - 结算周期 (YYYY-MM)
   * @returns {Promise<Object>}
   */
  async triggerRevenueDistribution(adminId, period) {
    // 检查是否已经分配过
    const existing = await db.queryOne(
      `SELECT * FROM incentive_pools WHERE period = ? AND status = 'distributed'`,
      [period]
    );

    if (existing) {
      throw new BusinessError('该周期已完成收益分配', 'ALREADY_DISTRIBUTED', 400);
    }

    // 执行收益分配
    const result = await RevenueService.runMonthlySettlement();

    // 记录操作日志
    const logId = crypto.randomUUID();
    await db.query(
      `INSERT INTO operation_logs
       (id, operator_type, operator_id, action, target_type, target_id, new_value)
       VALUES (?, 'admin', ?, 'trigger_revenue_distribution', 'incentive_pool', ?, ?)`,
      [logId, adminId, result.poolId || 'manual', JSON.stringify({ period, result })]
    );

    return result;
  }

  // ============ 系统仪表盘 ============

  /**
   * 获取系统概览数据
   * @returns {Promise<Object>}
   */
  async getDashboard() {
    // 用户统计
    const userStats = await db.queryOne(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_new,
        SUM(CASE WHEN DATE(last_login_at) = CURDATE() THEN 1 ELSE 0 END) as today_active
      FROM users
    `);

    // 会员统计
    const membershipStats = await db.query(`
      SELECT
        type,
        is_creator,
        COUNT(*) as count
      FROM memberships
      WHERE status = 'active'
      GROUP BY type, is_creator
    `);

    // 工作流统计
    const workflowStats = await db.queryOne(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_new
      FROM workflows
    `);

    // 今日交易
    const todayTransactions = await db.queryOne(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(actual_price), 0) as amount
      FROM workflow_purchases
      WHERE status = 'paid' AND DATE(purchased_at) = CURDATE()
    `);

    // 今日Pro会员
    const todayPro = await db.queryOne(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
      FROM pro_subscriptions
      WHERE status = 'paid' AND DATE(created_at) = CURDATE()
    `);

    // 待处理事项
    const pendingItems = await db.queryOne(`
      SELECT
        (SELECT COUNT(*) FROM workflows WHERE status = 'pending') as pending_workflows,
        (SELECT COUNT(*) FROM creator_applications WHERE status = 'pending') as pending_applications,
        (SELECT COUNT(*) FROM workflow_purchases WHERE status = 'refund_pending') as pending_refunds,
        (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending') as pending_withdrawals
    `);

    return {
      users: {
        total: userStats.total_users,
        todayNew: userStats.today_new,
        todayActive: userStats.today_active
      },
      memberships: {
        free: membershipStats.find(m => m.type === 'free')?.count || 0,
        pro: membershipStats.filter(m => m.type === 'pro' && !m.is_creator)
              .reduce((sum, m) => sum + m.count, 0),
        creators: membershipStats.filter(m => m.is_creator)
              .reduce((sum, m) => sum + m.count, 0)
      },
      workflows: {
        total: workflowStats.total,
        approved: workflowStats.approved,
        pending: workflowStats.pending,
        todayNew: workflowStats.today_new
      },
      todayRevenue: {
        sales: {
          count: todayTransactions.count,
          amount: parseFloat(todayTransactions.amount) || 0
        },
        proMembership: {
          count: todayPro.count,
          amount: parseFloat(todayPro.amount) || 0
        }
      },
      pendingItems: {
        workflows: pendingItems.pending_workflows,
        applications: pendingItems.pending_applications,
        refunds: pendingItems.pending_refunds,
        withdrawals: pendingItems.pending_withdrawals
      }
    };
  }

  /**
   * 获取系统配置
   * @returns {Promise<Object>}
   */
  async getSystemConfig() {
    const configs = await db.query('SELECT * FROM system_configs');

    return configs.reduce((acc, config) => {
      try {
        acc[config.config_key] = JSON.parse(config.config_value);
      } catch {
        acc[config.config_key] = config.config_value;
      }
      return acc;
    }, {});
  }

  /**
   * 更新系统配置
   * @param {string} key - 配置键
   * @param {any} value - 配置值
   * @param {string} adminId - 管理员ID
   * @returns {Promise<Object>}
   */
  async updateSystemConfig(key, value, adminId) {
    const existing = await db.queryOne(
      'SELECT * FROM system_configs WHERE config_key = ?',
      [key]
    );

    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    if (existing) {
      const oldValue = existing.config_value;
      await db.query(
        'UPDATE system_configs SET config_value = ?, updated_at = NOW() WHERE config_key = ?',
        [stringValue, key]
      );

      // 记录操作日志
      const logId = crypto.randomUUID();
      await db.query(
        `INSERT INTO operation_logs
         (id, operator_type, operator_id, action, target_type, target_id, old_value, new_value)
         VALUES (?, 'admin', ?, 'update_system_config', 'system_config', ?, ?, ?)`,
        [logId, adminId, key, oldValue, stringValue]
      );
    } else {
      const configId = crypto.randomUUID();
      await db.query(
        'INSERT INTO system_configs (id, config_key, config_value) VALUES (?, ?, ?)',
        [configId, key, stringValue]
      );
    }

    return { key, value };
  }

  // ============ 操作日志 ============

  /**
   * 获取操作日志
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getOperationLogs(options = {}) {
    const {
      page = 1,
      limit = 50,
      operatorType,
      operatorId,
      action,
      targetType,
      startDate,
      endDate
    } = options;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (operatorType) {
      whereClause += ' AND operator_type = ?';
      params.push(operatorType);
    }

    if (operatorId) {
      whereClause += ' AND operator_id = ?';
      params.push(operatorId);
    }

    if (action) {
      whereClause += ' AND action LIKE ?';
      params.push(`%${action}%`);
    }

    if (targetType) {
      whereClause += ' AND target_type = ?';
      params.push(targetType);
    }

    if (startDate) {
      whereClause += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND created_at <= ?';
      params.push(endDate);
    }

    const countResult = await db.queryOne(
      `SELECT COUNT(*) as total FROM operation_logs ${whereClause}`,
      params
    );

    const offset = (page - 1) * limit;
    const logs = await db.query(
      `SELECT * FROM operation_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      logs: logs.map(log => ({
        ...log,
        oldValue: log.old_value ? JSON.parse(log.old_value) : null,
        newValue: log.new_value ? JSON.parse(log.new_value) : null
      })),
      pagination: {
        total: countResult.total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(countResult.total / limit)
      }
    };
  }

  // ============ 提现管理 ============

  /**
   * 获取提现申请列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getWithdrawalRequests(options = {}) {
    const { page = 1, limit = 20, status = 'pending' } = options;

    const countResult = await db.queryOne(
      `SELECT COUNT(*) as total FROM withdrawal_requests WHERE status = ?`,
      [status]
    );

    const offset = (page - 1) * limit;
    const requests = await db.query(
      `SELECT wr.*, u.username, u.email, u.avatar,
              cs.total_revenue, cs.pending_revenue, cs.withdrawn_revenue
       FROM withdrawal_requests wr
       LEFT JOIN users u ON wr.user_id = u.id
       LEFT JOIN creator_stats cs ON wr.user_id = cs.user_id
       WHERE wr.status = ?
       ORDER BY wr.created_at ASC
       LIMIT ? OFFSET ?`,
      [status, limit, offset]
    );

    return {
      requests: requests.map(r => ({
        ...r,
        amount: parseFloat(r.amount) || 0,
        totalRevenue: parseFloat(r.total_revenue) || 0,
        pendingRevenue: parseFloat(r.pending_revenue) || 0,
        withdrawnRevenue: parseFloat(r.withdrawn_revenue) || 0
      })),
      pagination: {
        total: countResult.total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(countResult.total / limit)
      }
    };
  }

  /**
   * 处理提现申请
   * @param {string} requestId - 申请ID
   * @param {string} action - 操作: approve/reject
   * @param {string} adminId - 管理员ID
   * @param {Object} details - 详情
   * @returns {Promise<Object>}
   */
  async processWithdrawal(requestId, action, adminId, details = {}) {
    const request = await db.queryOne(
      'SELECT * FROM withdrawal_requests WHERE id = ?',
      [requestId]
    );

    if (!request) {
      throw new BusinessError('提现申请不存在', 'REQUEST_NOT_FOUND', 404);
    }

    if (request.status !== 'pending') {
      throw new BusinessError('申请已处理', 'REQUEST_ALREADY_PROCESSED', 400);
    }

    const transaction = await db.beginTransaction();

    try {
      if (action === 'approve') {
        // 批准提现
        await transaction.query(
          `UPDATE withdrawal_requests
           SET status = 'processing', processed_by = ?, processed_at = NOW()
           WHERE id = ?`,
          [adminId, requestId]
        );

        // 这里应该调用实际的支付接口进行打款
        // 假设打款成功后更新状态
        await transaction.query(
          `UPDATE withdrawal_requests
           SET status = 'completed', completed_at = NOW(), transaction_id = ?
           WHERE id = ?`,
          [details.transactionId || crypto.randomUUID(), requestId]
        );

        // 更新创作者统计
        await transaction.query(
          `UPDATE creator_stats
           SET pending_revenue = pending_revenue - ?,
               withdrawn_revenue = withdrawn_revenue + ?,
               updated_at = NOW()
           WHERE user_id = ?`,
          [request.amount, request.amount, request.user_id]
        );

        // 更新收益记录状态
        await transaction.query(
          `UPDATE revenue_records
           SET status = 'withdrawn'
           WHERE user_id = ? AND status = 'settled'
           AND id IN (SELECT related_id FROM withdrawal_request_items WHERE request_id = ?)`,
          [request.user_id, requestId]
        );
      } else {
        // 拒绝提现
        await transaction.query(
          `UPDATE withdrawal_requests
           SET status = 'rejected', processed_by = ?, processed_at = NOW(), reject_reason = ?
           WHERE id = ?`,
          [adminId, details.reason, requestId]
        );
      }

      // 记录操作日志
      const logId = crypto.randomUUID();
      await transaction.query(
        `INSERT INTO operation_logs
         (id, operator_type, operator_id, action, target_type, target_id, new_value)
         VALUES (?, 'admin', ?, ?, 'withdrawal_request', ?, ?)`,
        [
          logId,
          adminId,
          action === 'approve' ? 'approve_withdrawal' : 'reject_withdrawal',
          requestId,
          JSON.stringify({ amount: parseFloat(request.amount), ...details })
        ]
      );

      await transaction.commit();

      return {
        success: true,
        requestId,
        action,
        amount: parseFloat(request.amount)
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new AdminService();
