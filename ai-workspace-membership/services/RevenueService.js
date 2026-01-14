/**
 * 收益服务
 * 处理Pro免费工作流激励分配、付费工作流分成等
 *
 * Pro免费工作流激励规则（参考 docs/requirements.md 第五章5.1节）：
 *
 * 激励池来源：
 *   激励池 = 上月所有Pro会员收益（新开 + 续费）× 20%
 *
 * 激励池分配比例：
 *   非创作者池 = 激励池 × 25%
 *   创作者池 = 激励池 × 75%
 *
 * 收益计算公式：
 *   单人收益 = 对应池子 / 该类别总使用次数 × 该用户Pro工作流被使用次数
 *
 * 边界情况：
 *   - 某类别无人发布Pro工作流，对应池子轮空
 *   - 轮空的池子不累积到下月
 */

const crypto = require('crypto');
const db = require('../config/database');
const { INCENTIVE_POOL, WORKFLOW_LEVEL, WORKFLOW_STATUS } = require('../config/constants');
const { BusinessError } = require('../utils/errors');

class RevenueService {
  /**
   * 获取指定月份的Pro会员收益总额
   * @param {string} period - 周期 YYYY-MM
   * @returns {Promise<number>}
   */
  async getProRevenueForPeriod(period) {
    // 从 pro_subscriptions 表获取该月份的付费总额
    const result = await db.queryOne(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM pro_subscriptions
       WHERE status = 'paid'
       AND DATE_FORMAT(created_at, '%Y-%m') = ?`,
      [period]
    );

    return parseFloat(result.total) || 0;
  }

  /**
   * 获取指定月份Pro免费工作流的使用统计
   * @param {string} period - 周期 YYYY-MM
   * @returns {Promise<Object>}
   */
  async getProWorkflowUsageStats(period) {
    // 获取该月Pro免费工作流（level=2）的使用记录
    // 按创作者是否为正式创作者分组

    const stats = await db.query(
      `SELECT
         w.creator_id,
         m.is_creator,
         COUNT(wu.id) as usage_count
       FROM workflow_usage wu
       INNER JOIN workflows w ON wu.workflow_id = w.id
       INNER JOIN memberships m ON w.creator_id = m.user_id
       WHERE w.level = ?
       AND w.status = ?
       AND DATE_FORMAT(wu.used_at, '%Y-%m') = ?
       GROUP BY w.creator_id, m.is_creator`,
      [WORKFLOW_LEVEL.PRO_FREE, WORKFLOW_STATUS.APPROVED, period]
    );

    // 分类统计
    let nonCreatorTotal = 0;
    let creatorTotal = 0;
    const nonCreatorUsers = [];
    const creatorUsers = [];

    for (const row of stats) {
      if (row.is_creator === 1) {
        creatorTotal += row.usage_count;
        creatorUsers.push({
          userId: row.creator_id,
          usageCount: row.usage_count
        });
      } else {
        nonCreatorTotal += row.usage_count;
        nonCreatorUsers.push({
          userId: row.creator_id,
          usageCount: row.usage_count
        });
      }
    }

    return {
      nonCreator: {
        totalUsage: nonCreatorTotal,
        users: nonCreatorUsers,
        userCount: nonCreatorUsers.length
      },
      creator: {
        totalUsage: creatorTotal,
        users: creatorUsers,
        userCount: creatorUsers.length
      }
    };
  }

  /**
   * 计算月度激励池
   * @param {string} period - 周期 YYYY-MM（要计算的月份，通常是上个月）
   * @returns {Promise<Object>}
   */
  async calculateMonthlyPool(period) {
    // 检查是否已经计算过
    const existingPool = await db.queryOne(
      'SELECT * FROM incentive_pools WHERE period = ?',
      [period]
    );

    if (existingPool && existingPool.status !== 'pending') {
      return {
        success: false,
        reason: '该月份激励池已计算',
        pool: existingPool
      };
    }

    // 获取Pro会员收益
    const proRevenue = await this.getProRevenueForPeriod(period);

    // 计算激励池总额
    const poolAmount = proRevenue * INCENTIVE_POOL.RATE;
    const nonCreatorPool = poolAmount * INCENTIVE_POOL.NON_CREATOR_RATE;
    const creatorPool = poolAmount * INCENTIVE_POOL.CREATOR_RATE;

    // 获取使用统计
    const usageStats = await this.getProWorkflowUsageStats(period);

    const transaction = await db.beginTransaction();

    try {
      let poolId;

      if (existingPool) {
        // 更新现有记录
        poolId = existingPool.id;
        await transaction.query(
          `UPDATE incentive_pools SET
           pro_revenue = ?,
           pool_amount = ?,
           non_creator_pool = ?,
           creator_pool = ?,
           non_creator_usage = ?,
           creator_usage = ?,
           status = 'calculated',
           calculated_at = NOW()
           WHERE id = ?`,
          [
            proRevenue,
            poolAmount,
            nonCreatorPool,
            creatorPool,
            usageStats.nonCreator.totalUsage,
            usageStats.creator.totalUsage,
            poolId
          ]
        );
      } else {
        // 创建新记录
        poolId = crypto.randomUUID();
        await transaction.query(
          `INSERT INTO incentive_pools
           (id, period, pro_revenue, pool_amount, non_creator_pool, creator_pool,
            non_creator_usage, creator_usage, status, calculated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'calculated', NOW())`,
          [
            poolId,
            period,
            proRevenue,
            poolAmount,
            nonCreatorPool,
            creatorPool,
            usageStats.nonCreator.totalUsage,
            usageStats.creator.totalUsage
          ]
        );
      }

      await transaction.commit();

      return {
        success: true,
        poolId,
        period,
        proRevenue,
        poolAmount,
        nonCreatorPool,
        creatorPool,
        usageStats,
        // 边界情况标记
        nonCreatorPoolSkipped: usageStats.nonCreator.totalUsage === 0,
        creatorPoolSkipped: usageStats.creator.totalUsage === 0
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 分配月度收益
   * @param {string} period - 周期 YYYY-MM
   * @returns {Promise<Object>}
   */
  async distributeRevenue(period) {
    // 获取激励池信息
    const pool = await db.queryOne(
      'SELECT * FROM incentive_pools WHERE period = ?',
      [period]
    );

    if (!pool) {
      return {
        success: false,
        reason: '激励池不存在，请先计算激励池'
      };
    }

    if (pool.status === 'distributed') {
      return {
        success: false,
        reason: '该月份收益已分配',
        pool
      };
    }

    if (pool.status !== 'calculated') {
      return {
        success: false,
        reason: '激励池尚未计算完成'
      };
    }

    // 获取使用统计
    const usageStats = await this.getProWorkflowUsageStats(period);

    const transaction = await db.beginTransaction();
    const distributions = [];
    const revenueRecords = [];

    try {
      // 分配非创作者池
      if (usageStats.nonCreator.totalUsage > 0 && parseFloat(pool.non_creator_pool) > 0) {
        const perUsage = parseFloat(pool.non_creator_pool) / usageStats.nonCreator.totalUsage;

        for (const user of usageStats.nonCreator.users) {
          const amount = perUsage * user.usageCount;
          const shareRatio = user.usageCount / usageStats.nonCreator.totalUsage;

          // 记录分配明细
          const distId = crypto.randomUUID();
          await transaction.query(
            `INSERT INTO incentive_distributions
             (id, pool_id, user_id, is_creator, usage_count, share_ratio, amount)
             VALUES (?, ?, ?, 0, ?, ?, ?)`,
            [distId, pool.id, user.userId, user.usageCount, shareRatio, amount]
          );

          distributions.push({
            userId: user.userId,
            isCreator: false,
            usageCount: user.usageCount,
            amount
          });

          // 创建收益记录
          const revenueId = crypto.randomUUID();
          await transaction.query(
            `INSERT INTO revenue_records
             (id, user_id, amount, type, source, period, related_type, related_id, status)
             VALUES (?, ?, ?, 'pro_incentive', ?, ?, 'incentive_pool', ?, 'pending')`,
            [revenueId, user.userId, amount, `${period}月Pro工作流激励`, period, pool.id]
          );

          revenueRecords.push({ id: revenueId, userId: user.userId, amount });

          // 更新创作者统计中的待结算收益
          await transaction.query(
            `UPDATE creator_stats
             SET pending_revenue = pending_revenue + ?, total_revenue = total_revenue + ?
             WHERE user_id = ?`,
            [amount, amount, user.userId]
          );
        }
      }

      // 分配创作者池
      if (usageStats.creator.totalUsage > 0 && parseFloat(pool.creator_pool) > 0) {
        const perUsage = parseFloat(pool.creator_pool) / usageStats.creator.totalUsage;

        for (const user of usageStats.creator.users) {
          const amount = perUsage * user.usageCount;
          const shareRatio = user.usageCount / usageStats.creator.totalUsage;

          // 记录分配明细
          const distId = crypto.randomUUID();
          await transaction.query(
            `INSERT INTO incentive_distributions
             (id, pool_id, user_id, is_creator, usage_count, share_ratio, amount)
             VALUES (?, ?, ?, 1, ?, ?, ?)`,
            [distId, pool.id, user.userId, user.usageCount, shareRatio, amount]
          );

          distributions.push({
            userId: user.userId,
            isCreator: true,
            usageCount: user.usageCount,
            amount
          });

          // 创建收益记录
          const revenueId = crypto.randomUUID();
          await transaction.query(
            `INSERT INTO revenue_records
             (id, user_id, amount, type, source, period, related_type, related_id, status)
             VALUES (?, ?, ?, 'pro_incentive', ?, ?, 'incentive_pool', ?, 'pending')`,
            [revenueId, user.userId, amount, `${period}月Pro工作流激励`, period, pool.id]
          );

          revenueRecords.push({ id: revenueId, userId: user.userId, amount });

          // 更新创作者统计
          await transaction.query(
            `UPDATE creator_stats
             SET pending_revenue = pending_revenue + ?, total_revenue = total_revenue + ?
             WHERE user_id = ?`,
            [amount, amount, user.userId]
          );
        }
      }

      // 更新激励池状态
      await transaction.query(
        `UPDATE incentive_pools SET status = 'distributed', distributed_at = NOW() WHERE id = ?`,
        [pool.id]
      );

      // 记录操作日志
      const logId = crypto.randomUUID();
      await transaction.query(
        `INSERT INTO operation_logs
         (id, operator_type, operator_id, action, target_type, target_id, new_value)
         VALUES (?, 'system', NULL, 'distribute_revenue', 'incentive_pool', ?, ?)`,
        [logId, pool.id, JSON.stringify({
          period,
          totalDistributed: distributions.reduce((sum, d) => sum + d.amount, 0),
          distributionCount: distributions.length
        })]
      );

      await transaction.commit();

      // 计算统计信息
      const nonCreatorDistributed = distributions
        .filter(d => !d.isCreator)
        .reduce((sum, d) => sum + d.amount, 0);
      const creatorDistributed = distributions
        .filter(d => d.isCreator)
        .reduce((sum, d) => sum + d.amount, 0);

      return {
        success: true,
        period,
        pool: {
          id: pool.id,
          proRevenue: parseFloat(pool.pro_revenue),
          poolAmount: parseFloat(pool.pool_amount),
          nonCreatorPool: parseFloat(pool.non_creator_pool),
          creatorPool: parseFloat(pool.creator_pool)
        },
        distribution: {
          total: distributions.length,
          totalAmount: nonCreatorDistributed + creatorDistributed,
          nonCreator: {
            userCount: distributions.filter(d => !d.isCreator).length,
            totalAmount: nonCreatorDistributed,
            skipped: usageStats.nonCreator.totalUsage === 0
          },
          creator: {
            userCount: distributions.filter(d => d.isCreator).length,
            totalAmount: creatorDistributed,
            skipped: usageStats.creator.totalUsage === 0
          }
        },
        details: distributions
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 执行完整的月度结算流程
   * @param {string} period - 周期 YYYY-MM（默认为上个月）
   * @returns {Promise<Object>}
   */
  async runMonthlySettlement(period = null) {
    // 默认计算上个月
    if (!period) {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      period = lastMonth.toISOString().slice(0, 7);
    }

    console.log(`[RevenueService] 开始执行 ${period} 月度结算...`);

    // 步骤1：计算激励池
    console.log('[RevenueService] 步骤1: 计算激励池...');
    const poolResult = await this.calculateMonthlyPool(period);

    if (!poolResult.success) {
      console.log(`[RevenueService] 激励池计算跳过: ${poolResult.reason}`);
    } else {
      console.log(`[RevenueService] 激励池计算完成: 总额 ¥${poolResult.poolAmount.toFixed(2)}`);
    }

    // 步骤2：分配收益
    console.log('[RevenueService] 步骤2: 分配收益...');
    const distributeResult = await this.distributeRevenue(period);

    if (!distributeResult.success) {
      console.log(`[RevenueService] 收益分配跳过: ${distributeResult.reason}`);
      return {
        success: false,
        period,
        poolResult,
        distributeResult
      };
    }

    console.log(`[RevenueService] 收益分配完成: ${distributeResult.distribution.total} 人，共 ¥${distributeResult.distribution.totalAmount.toFixed(2)}`);

    return {
      success: true,
      period,
      poolResult,
      distributeResult
    };
  }

  /**
   * 预览月度结算（不实际执行）
   * @param {string} period - 周期 YYYY-MM（默认为上个月）
   * @returns {Promise<Object>}
   */
  async previewMonthlySettlement(period = null) {
    // 默认计算上个月
    if (!period) {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      period = lastMonth.toISOString().slice(0, 7);
    }

    // 检查是否已经分配过
    const existingPool = await db.queryOne(
      'SELECT * FROM incentive_pools WHERE period = ?',
      [period]
    );

    if (existingPool && existingPool.status === 'distributed') {
      return {
        success: false,
        reason: '该月份收益已分配',
        period,
        pool: {
          id: existingPool.id,
          proRevenue: parseFloat(existingPool.pro_revenue),
          poolAmount: parseFloat(existingPool.pool_amount),
          nonCreatorPool: parseFloat(existingPool.non_creator_pool),
          creatorPool: parseFloat(existingPool.creator_pool),
          status: existingPool.status
        }
      };
    }

    // 获取Pro会员收益
    const proRevenue = await this.getProRevenueForPeriod(period);

    // 计算激励池总额
    const poolAmount = proRevenue * INCENTIVE_POOL.RATE;
    const nonCreatorPool = poolAmount * INCENTIVE_POOL.NON_CREATOR_RATE;
    const creatorPool = poolAmount * INCENTIVE_POOL.CREATOR_RATE;

    // 获取使用统计
    const usageStats = await this.getProWorkflowUsageStats(period);

    // 模拟计算分配结果
    const previewDistributions = {
      nonCreator: [],
      creator: []
    };

    // 计算非创作者分配预览
    if (usageStats.nonCreator.totalUsage > 0 && nonCreatorPool > 0) {
      const perUsage = nonCreatorPool / usageStats.nonCreator.totalUsage;
      for (const user of usageStats.nonCreator.users) {
        previewDistributions.nonCreator.push({
          userId: user.userId,
          usageCount: user.usageCount,
          shareRatio: user.usageCount / usageStats.nonCreator.totalUsage,
          estimatedAmount: Math.round(perUsage * user.usageCount * 100) / 100
        });
      }
    }

    // 计算创作者分配预览
    if (usageStats.creator.totalUsage > 0 && creatorPool > 0) {
      const perUsage = creatorPool / usageStats.creator.totalUsage;
      for (const user of usageStats.creator.users) {
        previewDistributions.creator.push({
          userId: user.userId,
          usageCount: user.usageCount,
          shareRatio: user.usageCount / usageStats.creator.totalUsage,
          estimatedAmount: Math.round(perUsage * user.usageCount * 100) / 100
        });
      }
    }

    return {
      success: true,
      isPreview: true,
      period,
      pool: {
        proRevenue,
        poolAmount,
        nonCreatorPool,
        creatorPool
      },
      usageStats: {
        nonCreator: {
          totalUsage: usageStats.nonCreator.totalUsage,
          userCount: usageStats.nonCreator.userCount,
          poolSkipped: usageStats.nonCreator.totalUsage === 0
        },
        creator: {
          totalUsage: usageStats.creator.totalUsage,
          userCount: usageStats.creator.userCount,
          poolSkipped: usageStats.creator.totalUsage === 0
        }
      },
      preview: {
        nonCreator: {
          totalAmount: previewDistributions.nonCreator.reduce((sum, d) => sum + d.estimatedAmount, 0),
          userCount: previewDistributions.nonCreator.length,
          distributions: previewDistributions.nonCreator.slice(0, 10) // 只返回前10个
        },
        creator: {
          totalAmount: previewDistributions.creator.reduce((sum, d) => sum + d.estimatedAmount, 0),
          userCount: previewDistributions.creator.length,
          distributions: previewDistributions.creator.slice(0, 10) // 只返回前10个
        }
      }
    };
  }

  /**
   * 获取用户的收益记录
   * @param {string} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getUserRevenueRecords(userId, options = {}) {
    const { type, status, period, page = 1, limit = 20 } = options;

    let whereClause = 'WHERE user_id = ?';
    const params = [userId];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (period) {
      whereClause += ' AND period = ?';
      params.push(period);
    }

    const countResult = await db.queryOne(
      `SELECT COUNT(*) as total FROM revenue_records ${whereClause}`,
      params
    );

    const offset = (page - 1) * limit;
    const records = await db.query(
      `SELECT * FROM revenue_records
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
   * 获取用户收益统计
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>}
   */
  async getUserRevenueStats(userId) {
    // 总收益统计
    const totals = await db.queryOne(
      `SELECT
         SUM(CASE WHEN type = 'pro_incentive' THEN amount ELSE 0 END) as incentive_total,
         SUM(CASE WHEN type = 'paid_sale' THEN amount ELSE 0 END) as sales_total,
         SUM(amount) as total
       FROM revenue_records
       WHERE user_id = ? AND status != 'cancelled'`,
      [userId]
    );

    // 待结算金额
    const pending = await db.queryOne(
      `SELECT COALESCE(SUM(amount), 0) as pending
       FROM revenue_records
       WHERE user_id = ? AND status = 'pending'`,
      [userId]
    );

    // 已结算金额
    const settled = await db.queryOne(
      `SELECT COALESCE(SUM(amount), 0) as settled
       FROM revenue_records
       WHERE user_id = ? AND status = 'settled'`,
      [userId]
    );

    // 已提现金额
    const withdrawn = await db.queryOne(
      `SELECT COALESCE(SUM(actual_amount), 0) as withdrawn
       FROM withdrawal_requests
       WHERE user_id = ? AND status = 'completed'`,
      [userId]
    );

    // 按月统计（最近6个月）
    const monthly = await db.query(
      `SELECT
         period,
         SUM(CASE WHEN type = 'pro_incentive' THEN amount ELSE 0 END) as incentive,
         SUM(CASE WHEN type = 'paid_sale' THEN amount ELSE 0 END) as sales,
         SUM(amount) as total
       FROM revenue_records
       WHERE user_id = ? AND status != 'cancelled'
       GROUP BY period
       ORDER BY period DESC
       LIMIT 6`,
      [userId]
    );

    return {
      totals: {
        incentive: parseFloat(totals?.incentive_total) || 0,
        sales: parseFloat(totals?.sales_total) || 0,
        total: parseFloat(totals?.total) || 0
      },
      pending: parseFloat(pending?.pending) || 0,
      settled: parseFloat(settled?.settled) || 0,
      withdrawn: parseFloat(withdrawn?.withdrawn) || 0,
      available: (parseFloat(settled?.settled) || 0) - (parseFloat(withdrawn?.withdrawn) || 0),
      monthly
    };
  }

  /**
   * 获取激励池历史
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getIncentivePoolHistory(options = {}) {
    const { page = 1, limit = 12 } = options;

    const countResult = await db.queryOne(
      'SELECT COUNT(*) as total FROM incentive_pools'
    );

    const offset = (page - 1) * limit;
    const pools = await db.query(
      `SELECT * FROM incentive_pools
       ORDER BY period DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return {
      pools: pools.map(pool => ({
        ...pool,
        proRevenue: parseFloat(pool.pro_revenue),
        poolAmount: parseFloat(pool.pool_amount),
        nonCreatorPool: parseFloat(pool.non_creator_pool),
        creatorPool: parseFloat(pool.creator_pool)
      })),
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  /**
   * 获取激励池详情（含分配明细）
   * @param {string} poolId - 激励池ID
   * @returns {Promise<Object>}
   */
  async getIncentivePoolDetail(poolId) {
    const pool = await db.queryOne(
      'SELECT * FROM incentive_pools WHERE id = ?',
      [poolId]
    );

    if (!pool) {
      throw new BusinessError('激励池不存在', 'POOL_NOT_FOUND', 404);
    }

    // 获取分配明细
    const distributions = await db.query(
      `SELECT d.*, u.username, u.avatar
       FROM incentive_distributions d
       LEFT JOIN users u ON d.user_id = u.id
       WHERE d.pool_id = ?
       ORDER BY d.amount DESC`,
      [poolId]
    );

    return {
      pool: {
        ...pool,
        proRevenue: parseFloat(pool.pro_revenue),
        poolAmount: parseFloat(pool.pool_amount),
        nonCreatorPool: parseFloat(pool.non_creator_pool),
        creatorPool: parseFloat(pool.creator_pool)
      },
      distributions: distributions.map(d => ({
        ...d,
        amount: parseFloat(d.amount),
        shareRatio: parseFloat(d.share_ratio)
      })),
      summary: {
        totalUsers: distributions.length,
        totalAmount: distributions.reduce((sum, d) => sum + parseFloat(d.amount), 0),
        nonCreatorCount: distributions.filter(d => d.is_creator === 0).length,
        creatorCount: distributions.filter(d => d.is_creator === 1).length
      }
    };
  }

  /**
   * 标记收益为已结算
   * @param {Array<string>} recordIds - 收益记录ID列表
   * @returns {Promise<Object>}
   */
  async settleRevenueRecords(recordIds) {
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      throw new BusinessError('请指定要结算的记录', 'INVALID_RECORDS', 400);
    }

    const result = await db.query(
      `UPDATE revenue_records
       SET status = 'settled', settled_at = NOW()
       WHERE id IN (?) AND status = 'pending'`,
      [recordIds]
    );

    return {
      success: true,
      settledCount: result.affectedRows
    };
  }

  /**
   * 获取平台收益统计（管理后台）
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getPlatformRevenueStats(options = {}) {
    const { startPeriod, endPeriod } = options;

    let whereClause = '';
    const params = [];

    if (startPeriod) {
      whereClause += ' AND period >= ?';
      params.push(startPeriod);
    }

    if (endPeriod) {
      whereClause += ' AND period <= ?';
      params.push(endPeriod);
    }

    // Pro会员收益
    const proRevenue = await db.queryOne(
      `SELECT COALESCE(SUM(pro_revenue), 0) as total
       FROM incentive_pools
       WHERE 1=1 ${whereClause}`,
      params
    );

    // 激励池支出
    const incentivePaid = await db.queryOne(
      `SELECT COALESCE(SUM(pool_amount), 0) as total
       FROM incentive_pools
       WHERE status = 'distributed' ${whereClause}`,
      params
    );

    // 付费工作流平台分成
    const salesRevenue = await db.queryOne(
      `SELECT COALESCE(SUM(platform_revenue), 0) as total
       FROM workflow_purchases
       WHERE status = 'paid'`
    );

    return {
      proMemberRevenue: parseFloat(proRevenue.total) || 0,
      incentivePaid: parseFloat(incentivePaid.total) || 0,
      salesRevenue: parseFloat(salesRevenue.total) || 0,
      netRevenue: (parseFloat(proRevenue.total) || 0) -
                  (parseFloat(incentivePaid.total) || 0) +
                  (parseFloat(salesRevenue.total) || 0)
    };
  }
}

module.exports = new RevenueService();
