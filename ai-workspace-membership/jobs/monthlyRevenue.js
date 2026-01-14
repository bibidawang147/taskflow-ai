/**
 * 月度收益结算定时任务
 *
 * 功能：
 * - 每月1号凌晨执行上月收益结算
 * - 计算Pro免费工作流激励池
 * - 分配收益给创作者
 *
 * 使用方式：
 * 1. 在应用启动时引入此模块
 * 2. 调用 start() 启动定时任务
 * 3. 调用 stop() 停止定时任务
 * 4. 调用 runNow() 手动执行（用于测试或补跑）
 */

const cron = require('node-cron');
const RevenueService = require('../services/RevenueService');

// 定时任务实例
let scheduledTask = null;

// 任务执行状态
const taskStatus = {
  isRunning: false,
  lastRunAt: null,
  lastRunResult: null,
  lastError: null,
  runCount: 0
};

/**
 * 执行月度结算任务
 * @param {string} period - 指定周期（可选，默认上个月）
 * @returns {Promise<Object>}
 */
async function executeSettlement(period = null) {
  if (taskStatus.isRunning) {
    console.log('[MonthlyRevenue] 任务正在执行中，跳过本次执行');
    return {
      success: false,
      reason: '任务正在执行中'
    };
  }

  taskStatus.isRunning = true;
  taskStatus.runCount++;
  const startTime = new Date();

  console.log('========================================');
  console.log('[MonthlyRevenue] 开始执行月度收益结算');
  console.log(`[MonthlyRevenue] 执行时间: ${startTime.toISOString()}`);
  console.log('========================================');

  try {
    const result = await RevenueService.runMonthlySettlement(period);

    taskStatus.lastRunAt = startTime;
    taskStatus.lastRunResult = result;
    taskStatus.lastError = null;

    console.log('========================================');
    console.log('[MonthlyRevenue] 月度收益结算完成');
    console.log(`[MonthlyRevenue] 结果: ${result.success ? '成功' : '失败'}`);
    if (result.success && result.distributeResult) {
      console.log(`[MonthlyRevenue] 分配人数: ${result.distributeResult.distribution.total}`);
      console.log(`[MonthlyRevenue] 分配金额: ¥${result.distributeResult.distribution.totalAmount.toFixed(2)}`);
    }
    console.log(`[MonthlyRevenue] 耗时: ${Date.now() - startTime.getTime()}ms`);
    console.log('========================================');

    return result;
  } catch (error) {
    taskStatus.lastRunAt = startTime;
    taskStatus.lastError = error.message;

    console.error('========================================');
    console.error('[MonthlyRevenue] 月度收益结算失败');
    console.error(`[MonthlyRevenue] 错误: ${error.message}`);
    console.error(error.stack);
    console.error('========================================');

    throw error;
  } finally {
    taskStatus.isRunning = false;
  }
}

/**
 * 启动定时任务
 * 默认每月1号凌晨2:00执行
 * @param {string} cronExpression - cron表达式（可选）
 */
function start(cronExpression = '0 2 1 * *') {
  if (scheduledTask) {
    console.log('[MonthlyRevenue] 定时任务已在运行中');
    return;
  }

  // 验证cron表达式
  if (!cron.validate(cronExpression)) {
    throw new Error(`无效的cron表达式: ${cronExpression}`);
  }

  scheduledTask = cron.schedule(cronExpression, async () => {
    try {
      await executeSettlement();
    } catch (error) {
      // 错误已在 executeSettlement 中记录
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Shanghai'
  });

  console.log('[MonthlyRevenue] 定时任务已启动');
  console.log(`[MonthlyRevenue] Cron表达式: ${cronExpression}`);
  console.log('[MonthlyRevenue] 下次执行时间: 每月1号凌晨2:00 (Asia/Shanghai)');
}

/**
 * 停止定时任务
 */
function stop() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[MonthlyRevenue] 定时任务已停止');
  }
}

/**
 * 立即执行（用于测试或手动触发）
 * @param {string} period - 指定周期（可选）
 * @returns {Promise<Object>}
 */
async function runNow(period = null) {
  console.log('[MonthlyRevenue] 手动触发执行...');
  return executeSettlement(period);
}

/**
 * 获取任务状态
 * @returns {Object}
 */
function getStatus() {
  return {
    ...taskStatus,
    isScheduled: scheduledTask !== null
  };
}

/**
 * 预览下次执行（不实际执行）
 * @param {string} period - 指定周期
 * @returns {Promise<Object>}
 */
async function preview(period = null) {
  // 默认上个月
  if (!period) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    period = lastMonth.toISOString().slice(0, 7);
  }

  console.log(`[MonthlyRevenue] 预览 ${period} 月度结算...`);

  // 获取Pro会员收益
  const proRevenue = await RevenueService.getProRevenueForPeriod(period);

  // 获取使用统计
  const usageStats = await RevenueService.getProWorkflowUsageStats(period);

  // 计算预期分配
  const { INCENTIVE_POOL } = require('../config/constants');
  const poolAmount = proRevenue * INCENTIVE_POOL.RATE;
  const nonCreatorPool = poolAmount * INCENTIVE_POOL.NON_CREATOR_RATE;
  const creatorPool = poolAmount * INCENTIVE_POOL.CREATOR_RATE;

  // 计算每个用户的预期收益
  const nonCreatorDistributions = [];
  if (usageStats.nonCreator.totalUsage > 0) {
    const perUsage = nonCreatorPool / usageStats.nonCreator.totalUsage;
    for (const user of usageStats.nonCreator.users) {
      nonCreatorDistributions.push({
        userId: user.userId,
        usageCount: user.usageCount,
        expectedAmount: perUsage * user.usageCount
      });
    }
  }

  const creatorDistributions = [];
  if (usageStats.creator.totalUsage > 0) {
    const perUsage = creatorPool / usageStats.creator.totalUsage;
    for (const user of usageStats.creator.users) {
      creatorDistributions.push({
        userId: user.userId,
        usageCount: user.usageCount,
        expectedAmount: perUsage * user.usageCount
      });
    }
  }

  return {
    period,
    proRevenue,
    poolAmount,
    nonCreatorPool,
    creatorPool,
    usageStats,
    preview: {
      nonCreator: {
        skipped: usageStats.nonCreator.totalUsage === 0,
        distributions: nonCreatorDistributions
      },
      creator: {
        skipped: usageStats.creator.totalUsage === 0,
        distributions: creatorDistributions
      }
    }
  };
}

module.exports = {
  start,
  stop,
  runNow,
  getStatus,
  preview,
  executeSettlement
};
