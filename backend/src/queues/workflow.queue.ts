import { Queue, QueueEvents } from 'bullmq'
import redisConfig from './redis.config'
import logger from '../utils/logger'

// 工作流执行任务数据类型
export interface WorkflowJobData {
  executionId: string
  workflowId: string
  userId: string
  config: any
  input: any
}

// 创建工作流执行队列
export const workflowQueue = new Queue<WorkflowJobData>('workflow-execution', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3, // 失败重试3次
    backoff: {
      type: 'exponential', // 指数退避
      delay: 5000 // 初始延迟5秒
    },
    removeOnComplete: {
      age: 3600, // 完成的任务保留1小时
      count: 100 // 最多保留100个完成的任务
    },
    removeOnFail: {
      age: 86400 // 失败的任务保留24小时
    }
  }
})

// 队列事件监听
const queueEvents = new QueueEvents('workflow-execution', {
  connection: redisConfig
})

queueEvents.on('completed', ({ jobId }) => {
  logger.info(`✅ 任务完成: ${jobId}`)
})

queueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`❌ 任务失败: ${jobId}, 原因: ${failedReason}`)
})

queueEvents.on('progress', ({ jobId, data }) => {
  logger.info(`⏳ 任务进度: ${jobId}, ${JSON.stringify(data)}`)
})

// 优雅关闭
export const closeWorkflowQueue = async () => {
  await workflowQueue.close()
  await queueEvents.close()
  logger.info('🔒 工作流队列已关闭')
}

// 添加工作流执行任务到队列
export const addWorkflowJob = async (data: WorkflowJobData) => {
  const job = await workflowQueue.add('execute-workflow', data, {
    jobId: data.executionId, // 使用 executionId 作为 jobId,避免重复
    priority: 10 // 默认优先级
  })

  logger.info(`📋 任务已加入队列: ${job.id}`)
  return job
}

// 获取队列状态
export const getQueueStats = async () => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    workflowQueue.getWaitingCount(),
    workflowQueue.getActiveCount(),
    workflowQueue.getCompletedCount(),
    workflowQueue.getFailedCount(),
    workflowQueue.getDelayedCount()
  ])

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed
  }
}

// 获取任务状态
export const getJobStatus = async (jobId: string) => {
  const job = await workflowQueue.getJob(jobId)
  if (!job) {
    return null
  }

  return {
    id: job.id,
    name: job.name,
    data: job.data,
    progress: await job.getState(),
    attemptsMade: job.attemptsMade,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason
  }
}

// 取消任务
export const cancelJob = async (jobId: string) => {
  const job = await workflowQueue.getJob(jobId)
  if (job) {
    await job.remove()
    logger.info(`🚫 任务已取消: ${jobId}`)
    return true
  }
  return false
}

// 重试失败的任务
export const retryFailedJob = async (jobId: string) => {
  const job = await workflowQueue.getJob(jobId)
  if (job && await job.isFailed()) {
    await job.retry()
    logger.info(`🔄 任务重试: ${jobId}`)
    return true
  }
  return false
}

logger.info('📋 工作流队列已初始化')
