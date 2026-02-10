import { Queue, QueueEvents } from 'bullmq'
import redisConfig from './redis.config'
import logger from '../utils/logger'

export interface EmbeddingJobData {
  type: 'single' | 'bulk'
  workflowId?: string
}

export const embeddingQueue = new Queue<EmbeddingJobData>('embedding-generation', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: {
      age: 3600,
      count: 200,
    },
    removeOnFail: {
      age: 86400,
    },
  },
})

const queueEvents = new QueueEvents('embedding-generation', {
  connection: redisConfig,
})

queueEvents.on('completed', ({ jobId }) => {
  logger.debug(`Embedding job completed: ${jobId}`)
})

queueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Embedding job failed: ${jobId}, reason: ${failedReason}`)
})

/**
 * 为单个工作流入队 embedding 生成任务（按 workflowId 去重）
 */
export async function enqueueEmbeddingJob(workflowId: string) {
  await embeddingQueue.add('generate-single', {
    type: 'single',
    workflowId,
  }, {
    jobId: `embed-${workflowId}`,
    removeOnComplete: { age: 600 },
  })
}

/**
 * 入队全量 embedding 生成任务
 */
export async function enqueueBulkEmbeddingJob() {
  await embeddingQueue.add('generate-bulk', {
    type: 'bulk',
  }, {
    jobId: `embed-bulk-${Date.now()}`,
    attempts: 1,
  })
}

export const closeEmbeddingQueue = async () => {
  await embeddingQueue.close()
  await queueEvents.close()
  logger.info('Embedding queue closed')
}

logger.info('Embedding generation queue initialized')
