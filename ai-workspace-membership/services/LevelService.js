/**
 * 等级服务
 * 处理创作者等级升级判断、进度查询等
 *
 * 升级规则（参考 docs/requirements.md 第四章）：
 *
 * 升级条件：必须同时满足3个维度
 * 1. 累计积分达标
 * 2. 最低作品数达标
 * 3. 最低总使用次数达标
 *
 * 等级只影响付费工作流的销售分成比例（60%-90%）
 */

const crypto = require('crypto');
const db = require('../config/database');
const { CREATOR_LEVELS } = require('../config/constants');
const { BusinessError } = require('../utils/errors');

// 等级门槛配置（与数据库 level_thresholds 表同步）
const LEVEL_THRESHOLDS = {
  1: { points: 0, works: 0, usage: 0, shareRate: 0.60 },
  2: { points: 50, works: 5, usage: 5000, shareRate: 0.63 },
  3: { points: 150, works: 10, usage: 20000, shareRate: 0.66 },
  4: { points: 300, works: 15, usage: 50000, shareRate: 0.69 },
  5: { points: 500, works: 20, usage: 100000, shareRate: 0.72 },
  6: { points: 800, works: 30, usage: 200000, shareRate: 0.75 },
  7: { points: 1200, works: 40, usage: 400000, shareRate: 0.78 },
  8: { points: 1800, works: 50, usage: 700000, shareRate: 0.81 },
  9: { points: 2600, works: 60, usage: 1200000, shareRate: 0.85 },
  10: { points: 3600, works: 80, usage: 2000000, shareRate: 0.90 }
};

// 等级名称
const LEVEL_NAMES = {
  1: '新晋创作者',
  2: '初级创作者',
  3: '进阶创作者',
  4: '资深创作者',
  5: '优秀创作者',
  6: '杰出创作者',
  7: '精英创作者',
  8: '明星创作者',
  9: '顶级创作者',
  10: '传奇创作者'
};

// 等级徽章/图标
const LEVEL_BADGES = {
  1: '🌱',
  2: '🌿',
  3: '🌳',
  4: '⭐',
  5: '🌟',
  6: '💫',
  7: '🔥',
  8: '💎',
  9: '👑',
  10: '🏆'
};

class LevelService {
  /**
   * 获取创作者统计信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Object|null>}
   */
  async getCreatorStats(userId) {
    return db.queryOne(
      'SELECT * FROM creator_stats WHERE user_id = ?',
      [userId]
    );
  }

  /**
   * 获取等级门槛配置
   * @param {number} level - 等级
   * @returns {Object}
   */
  getThreshold(level) {
    return LEVEL_THRESHOLDS[level] || null;
  }

  /**
   * 获取所有等级门槛
   * @returns {Object}
   */
  getAllThresholds() {
    return LEVEL_THRESHOLDS;
  }

  /**
   * 检查是否满足升级条件
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>}
   */
  async checkLevelUp(userId) {
    const stats = await this.getCreatorStats(userId);

    if (!stats) {
      return {
        canUpgrade: false,
        reason: '用户不是创作者',
        isCreator: false
      };
    }

    const currentLevel = stats.level;

    // 已达到最高等级
    if (currentLevel >= 10) {
      return {
        canUpgrade: false,
        reason: '已达到最高等级',
        currentLevel,
        isMaxLevel: true
      };
    }

    // 等级为0表示还不是正式创作者
    if (currentLevel === 0) {
      return {
        canUpgrade: false,
        reason: '尚未成为创作者',
        currentLevel: 0,
        isCreator: false
      };
    }

    const nextLevel = currentLevel + 1;
    const threshold = this.getThreshold(nextLevel);

    const currentPoints = parseFloat(stats.total_points) || 0;
    const currentWorks = stats.work_count || 0;
    const currentUsage = stats.total_usage || 0;

    // 检查三个维度
    const meetsPoints = currentPoints >= threshold.points;
    const meetsWorks = currentWorks >= threshold.works;
    const meetsUsage = currentUsage >= threshold.usage;

    const canUpgrade = meetsPoints && meetsWorks && meetsUsage;

    return {
      canUpgrade,
      currentLevel,
      nextLevel,
      currentStats: {
        points: currentPoints,
        works: currentWorks,
        usage: currentUsage
      },
      requirements: {
        points: threshold.points,
        works: threshold.works,
        usage: threshold.usage
      },
      conditions: {
        points: {
          current: currentPoints,
          required: threshold.points,
          met: meetsPoints,
          gap: meetsPoints ? 0 : threshold.points - currentPoints
        },
        works: {
          current: currentWorks,
          required: threshold.works,
          met: meetsWorks,
          gap: meetsWorks ? 0 : threshold.works - currentWorks
        },
        usage: {
          current: currentUsage,
          required: threshold.usage,
          met: meetsUsage,
          gap: meetsUsage ? 0 : threshold.usage - currentUsage
        }
      },
      unmetConditions: [
        !meetsPoints && '积分不足',
        !meetsWorks && '作品数不足',
        !meetsUsage && '使用次数不足'
      ].filter(Boolean),
      newShareRate: canUpgrade ? threshold.shareRate : null
    };
  }

  /**
   * 执行等级升级
   * @param {string} userId - 用户ID
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>}
   */
  async upgradeLevel(userId, options = {}) {
    const { force = false, transaction = null } = options;

    // 检查升级条件
    const checkResult = await this.checkLevelUp(userId);

    if (!checkResult.canUpgrade && !force) {
      return {
        success: false,
        reason: checkResult.reason || '不满足升级条件',
        details: checkResult
      };
    }

    const stats = await this.getCreatorStats(userId);
    const oldLevel = stats.level;
    const newLevel = oldLevel + 1;

    // 不能超过最高等级
    if (newLevel > 10) {
      return {
        success: false,
        reason: '已达到最高等级'
      };
    }

    const executor = transaction || await db.beginTransaction();
    const isOwnTransaction = !transaction;

    try {
      // 更新等级
      await executor.query(
        'UPDATE creator_stats SET level = ?, updated_at = NOW() WHERE user_id = ?',
        [newLevel, userId]
      );

      // 记录升级历史
      const upgradeId = crypto.randomUUID();
      await executor.query(
        `INSERT INTO level_upgrades
         (id, user_id, old_level, new_level, trigger_points, trigger_works, trigger_usage)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          upgradeId,
          userId,
          oldLevel,
          newLevel,
          stats.total_points,
          stats.work_count,
          stats.total_usage
        ]
      );

      // 记录操作日志
      const logId = crypto.randomUUID();
      await executor.query(
        `INSERT INTO operation_logs
         (id, operator_type, operator_id, action, target_type, target_id, old_value, new_value)
         VALUES (?, 'system', ?, 'level_upgrade', 'creator_stats', ?, ?, ?)`,
        [
          logId,
          userId,
          stats.id,
          JSON.stringify({ level: oldLevel }),
          JSON.stringify({ level: newLevel })
        ]
      );

      if (isOwnTransaction) {
        await executor.commit();
      }

      const newThreshold = this.getThreshold(newLevel);

      return {
        success: true,
        oldLevel,
        newLevel,
        oldShareRate: this.getThreshold(oldLevel).shareRate,
        newShareRate: newThreshold.shareRate,
        levelName: LEVEL_NAMES[newLevel],
        levelBadge: LEVEL_BADGES[newLevel],
        triggerStats: {
          points: parseFloat(stats.total_points),
          works: stats.work_count,
          usage: stats.total_usage
        }
      };
    } catch (error) {
      if (isOwnTransaction) {
        await executor.rollback();
      }
      throw error;
    }
  }

  /**
   * 检查并自动升级（可连续升级多级）
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>}
   */
  async checkAndAutoUpgrade(userId) {
    const upgrades = [];
    let continueChecking = true;

    while (continueChecking) {
      const checkResult = await this.checkLevelUp(userId);

      if (checkResult.canUpgrade) {
        const upgradeResult = await this.upgradeLevel(userId);
        if (upgradeResult.success) {
          upgrades.push({
            from: upgradeResult.oldLevel,
            to: upgradeResult.newLevel,
            newShareRate: upgradeResult.newShareRate
          });
        } else {
          continueChecking = false;
        }
      } else {
        continueChecking = false;
      }
    }

    return {
      upgraded: upgrades.length > 0,
      upgradeCount: upgrades.length,
      upgrades,
      finalLevel: upgrades.length > 0
        ? upgrades[upgrades.length - 1].to
        : (await this.getCreatorStats(userId))?.level || 0
    };
  }

  /**
   * 获取等级进度
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>}
   */
  async getLevelProgress(userId) {
    const stats = await this.getCreatorStats(userId);

    if (!stats) {
      return {
        isCreator: false,
        level: 0,
        message: '尚未成为创作者'
      };
    }

    const currentLevel = stats.level;

    // 等级为0表示还不是正式创作者
    if (currentLevel === 0) {
      return {
        isCreator: false,
        level: 0,
        message: '请先申请成为创作者',
        stats: {
          points: parseFloat(stats.total_points) || 0,
          works: stats.work_count || 0,
          usage: stats.total_usage || 0
        }
      };
    }

    const currentThreshold = this.getThreshold(currentLevel);
    const isMaxLevel = currentLevel >= 10;

    const result = {
      isCreator: true,
      level: currentLevel,
      levelName: LEVEL_NAMES[currentLevel],
      levelBadge: LEVEL_BADGES[currentLevel],
      shareRate: currentThreshold.shareRate,
      shareRatePercent: `${(currentThreshold.shareRate * 100).toFixed(0)}%`,
      isMaxLevel,
      currentStats: {
        points: parseFloat(stats.total_points) || 0,
        works: stats.work_count || 0,
        usage: stats.total_usage || 0,
        totalRevenue: parseFloat(stats.total_revenue) || 0
      }
    };

    // 如果不是最高等级，计算下一级进度
    if (!isMaxLevel) {
      const nextLevel = currentLevel + 1;
      const nextThreshold = this.getThreshold(nextLevel);

      const pointsProgress = Math.min(100, (result.currentStats.points / nextThreshold.points) * 100);
      const worksProgress = Math.min(100, (result.currentStats.works / nextThreshold.works) * 100);
      const usageProgress = Math.min(100, (result.currentStats.usage / nextThreshold.usage) * 100);

      // 总体进度取三个维度的最小值
      const overallProgress = Math.min(pointsProgress, worksProgress, usageProgress);

      result.nextLevel = {
        level: nextLevel,
        levelName: LEVEL_NAMES[nextLevel],
        levelBadge: LEVEL_BADGES[nextLevel],
        shareRate: nextThreshold.shareRate,
        shareRatePercent: `${(nextThreshold.shareRate * 100).toFixed(0)}%`,
        shareRateIncrease: `+${((nextThreshold.shareRate - currentThreshold.shareRate) * 100).toFixed(0)}%`
      };

      result.progress = {
        overall: Math.floor(overallProgress),
        points: {
          current: result.currentStats.points,
          required: nextThreshold.points,
          progress: Math.floor(pointsProgress),
          gap: Math.max(0, nextThreshold.points - result.currentStats.points),
          met: result.currentStats.points >= nextThreshold.points
        },
        works: {
          current: result.currentStats.works,
          required: nextThreshold.works,
          progress: Math.floor(worksProgress),
          gap: Math.max(0, nextThreshold.works - result.currentStats.works),
          met: result.currentStats.works >= nextThreshold.works
        },
        usage: {
          current: result.currentStats.usage,
          required: nextThreshold.usage,
          progress: Math.floor(usageProgress),
          gap: Math.max(0, nextThreshold.usage - result.currentStats.usage),
          met: result.currentStats.usage >= nextThreshold.usage
        }
      };

      // 添加升级提示
      const unmetConditions = [];
      if (!result.progress.points.met) {
        unmetConditions.push(`积分还差 ${result.progress.points.gap.toFixed(1)}`);
      }
      if (!result.progress.works.met) {
        unmetConditions.push(`作品还差 ${result.progress.works.gap} 个`);
      }
      if (!result.progress.usage.met) {
        unmetConditions.push(`使用次数还差 ${result.progress.usage.gap.toLocaleString()} 次`);
      }

      result.upgradeHint = unmetConditions.length > 0
        ? `升级到 ${LEVEL_NAMES[nextLevel]} 需要：${unmetConditions.join('，')}`
        : '已满足升级条件，可以升级！';

      result.canUpgrade = unmetConditions.length === 0;
    }

    return result;
  }

  /**
   * 获取等级历史记录
   * @param {string} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getLevelHistory(userId, options = {}) {
    const { page = 1, limit = 20 } = options;

    const countResult = await db.queryOne(
      'SELECT COUNT(*) as total FROM level_upgrades WHERE user_id = ?',
      [userId]
    );

    const offset = (page - 1) * limit;
    const records = await db.query(
      `SELECT * FROM level_upgrades
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // 添加等级名称
    const enrichedRecords = records.map(record => ({
      ...record,
      oldLevelName: LEVEL_NAMES[record.old_level],
      newLevelName: LEVEL_NAMES[record.new_level],
      oldLevelBadge: LEVEL_BADGES[record.old_level],
      newLevelBadge: LEVEL_BADGES[record.new_level],
      oldShareRate: this.getThreshold(record.old_level)?.shareRate,
      newShareRate: this.getThreshold(record.new_level)?.shareRate
    }));

    return {
      records: enrichedRecords,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  /**
   * 获取等级信息（公开）
   * @param {number} level - 等级
   * @returns {Object}
   */
  getLevelInfo(level) {
    if (level < 1 || level > 10) {
      return null;
    }

    const threshold = this.getThreshold(level);
    const nextThreshold = level < 10 ? this.getThreshold(level + 1) : null;

    return {
      level,
      name: LEVEL_NAMES[level],
      badge: LEVEL_BADGES[level],
      shareRate: threshold.shareRate,
      shareRatePercent: `${(threshold.shareRate * 100).toFixed(0)}%`,
      requirements: {
        points: threshold.points,
        works: threshold.works,
        usage: threshold.usage
      },
      nextLevel: nextThreshold ? {
        level: level + 1,
        name: LEVEL_NAMES[level + 1],
        requirements: {
          points: nextThreshold.points,
          works: nextThreshold.works,
          usage: nextThreshold.usage
        }
      } : null
    };
  }

  /**
   * 获取所有等级信息列表
   * @returns {Array}
   */
  getAllLevelInfo() {
    return Object.keys(LEVEL_THRESHOLDS).map(level => this.getLevelInfo(parseInt(level)));
  }

  /**
   * 根据分成比例获取等级
   * @param {number} shareRate - 分成比例
   * @returns {number}
   */
  getLevelByShareRate(shareRate) {
    for (let level = 10; level >= 1; level--) {
      if (this.getThreshold(level).shareRate <= shareRate) {
        return level;
      }
    }
    return 1;
  }

  /**
   * 计算等级分布统计
   * @returns {Promise<Object>}
   */
  async getLevelDistribution() {
    const distribution = await db.query(
      `SELECT level, COUNT(*) as count
       FROM creator_stats
       WHERE level > 0
       GROUP BY level
       ORDER BY level ASC`
    );

    const total = distribution.reduce((sum, row) => sum + row.count, 0);

    return {
      total,
      distribution: distribution.map(row => ({
        level: row.level,
        name: LEVEL_NAMES[row.level],
        badge: LEVEL_BADGES[row.level],
        count: row.count,
        percentage: total > 0 ? ((row.count / total) * 100).toFixed(1) + '%' : '0%'
      }))
    };
  }
}

// 导出常量
LevelService.THRESHOLDS = LEVEL_THRESHOLDS;
LevelService.NAMES = LEVEL_NAMES;
LevelService.BADGES = LEVEL_BADGES;

module.exports = new LevelService();
