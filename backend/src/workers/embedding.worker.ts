import { Worker, Job } from 'bullmq'
import redisConfig, { createRedisConnection } from '../queues/redis.config'
import type { EmbeddingJobData } from '../queues/embedding.queue'
import {
  generateEmbedding,
  generateEmbeddings,
  composeWorkflowText,
} from '../services/embedding.service'
import prisma from '../utils/database'
import logger from '../utils/logger'

const REDIS_HASH_KEY = 'embedding:workflows'
const REDIS_HASH_TTL = 86400 // 24 hours
const BATCH_SIZE = 20

const redis = createRedisConnection()

/**
 * 从 workflow + nodes 提取 stepTitles 和 toolsUsed
 */
function extractNodeInfo(nodes: any[]): { stepTitles: string[]; toolsUsed: string[] } {
  const stepTitles = nodes.map((n: any) => n.label).filter(Boolean)
  const toolsUsed: string[] = []
  for (const node of nodes) {
    if (node.type === 'tool' && node.label) toolsUsed.push(node.label)
    if (node.config && typeof node.config === 'object') {
      const config = node.config as Record<string, any>
      if (config.toolName) toolsUsed.push(config.toolName)
      if (config.tool) toolsUsed.push(config.tool)
    }
  }
  return { stepTitles, toolsUsed: [...new Set(toolsUsed)] }
}

/**
 * 处理单个工作流的 embedding 生成
 */
async function processSingleWorkflow(workflowId: string): Promise<void> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: {
      nodes: { select: { type: true, label: true, config: true } },
    },
  })

  if (!workflow) {
    logger.warn(`Workflow ${workflowId} not found, skipping embedding`)
    return
  }

  // 非公开或草稿 → 删除已有 embedding
  if (!workflow.isPublic || workflow.isDraft) {
    await prisma.workflowEmbedding.deleteMany({ where: { workflowId } })
    await redis.hdel(REDIS_HASH_KEY, workflowId)
    logger.info(`Removed embedding for non-public workflow ${workflowId}`)
    return
  }

  const { stepTitles, toolsUsed } = extractNodeInfo(workflow.nodes)

  const textContent = composeWorkflowText({
    title: workflow.title,
    description: workflow.description,
    category: workflow.category,
    tags: workflow.tags,
    stepTitles,
    toolsUsed,
    difficultyLevel: workflow.difficultyLevel,
    useScenarios: workflow.useScenarios,
    platformTypes: workflow.platformTypes,
    matchKeywords: workflow.matchKeywords,
  })

  const result = await generateEmbedding(textContent)

  await prisma.workflowEmbedding.upsert({
    where: { workflowId },
    create: {
      workflowId,
      embedding: JSON.stringify(result.embedding),
      textContent,
      model: result.model,
    },
    update: {
      embedding: JSON.stringify(result.embedding),
      textContent,
      model: result.model,
    },
  })

  await redis.hset(REDIS_HASH_KEY, workflowId, JSON.stringify({
    embedding: result.embedding,
    textContent,
  }))

  logger.info(`Generated embedding for workflow ${workflowId} (${textContent.length} chars)`)
}

/**
 * 批量生成所有公开工作流的 embedding
 */
async function processBulkGeneration(job: Job): Promise<void> {
  const workflows = await prisma.workflow.findMany({
    where: { isPublic: true, isDraft: false },
    include: {
      nodes: { select: { type: true, label: true, config: true } },
    },
  })

  logger.info(`Bulk embedding: found ${workflows.length} published workflows`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < workflows.length; i += BATCH_SIZE) {
    const batch = workflows.slice(i, i + BATCH_SIZE)

    const batchData = batch.map(workflow => {
      const { stepTitles, toolsUsed } = extractNodeInfo(workflow.nodes)
      return {
        workflowId: workflow.id,
        textContent: composeWorkflowText({
          title: workflow.title,
          description: workflow.description,
          category: workflow.category,
          tags: workflow.tags,
          stepTitles,
          toolsUsed,
          difficultyLevel: workflow.difficultyLevel,
          useScenarios: workflow.useScenarios,
          platformTypes: workflow.platformTypes,
          matchKeywords: workflow.matchKeywords,
        }),
      }
    })

    try {
      const texts = batchData.map(d => d.textContent)
      const results = await generateEmbeddings(texts)

      for (let j = 0; j < batchData.length; j++) {
        const { workflowId, textContent } = batchData[j]
        const { embedding, model } = results[j]

        await prisma.workflowEmbedding.upsert({
          where: { workflowId },
          create: {
            workflowId,
            embedding: JSON.stringify(embedding),
            textContent,
            model,
          },
          update: {
            embedding: JSON.stringify(embedding),
            textContent,
            model,
          },
        })

        await redis.hset(REDIS_HASH_KEY, workflowId, JSON.stringify({
          embedding,
          textContent,
        }))

        successCount++
      }
    } catch (error) {
      logger.error(`Bulk embedding batch ${i}-${i + batch.length} failed:`, error)
      errorCount += batch.length
    }

    await job.updateProgress({
      processed: Math.min(i + BATCH_SIZE, workflows.length),
      total: workflows.length,
      successCount,
      errorCount,
    })

    // 批次间 100ms 间隔避免 API 限流
    if (i + BATCH_SIZE < workflows.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  await redis.expire(REDIS_HASH_KEY, REDIS_HASH_TTL)
  logger.info(`Bulk embedding complete: ${successCount} success, ${errorCount} errors`)
}

// 创建 Worker
export const embeddingWorker = new Worker<EmbeddingJobData>(
  'embedding-generation',
  async (job: Job<EmbeddingJobData>) => {
    const { type, workflowId } = job.data

    if (type === 'single' && workflowId) {
      await processSingleWorkflow(workflowId)
    } else if (type === 'bulk') {
      await processBulkGeneration(job)
    } else {
      logger.warn(`Unknown embedding job type: ${type}`)
    }
  },
  {
    connection: redisConfig,
    concurrency: 2,
    limiter: {
      max: 5,
      duration: 1000,
    },
  }
)

embeddingWorker.on('completed', (job) => {
  logger.info(`Embedding worker completed: ${job.id}`)
})

embeddingWorker.on('failed', (job, err) => {
  logger.error(`Embedding worker failed: ${job?.id}, error: ${err.message}`)
})

embeddingWorker.on('error', (err) => {
  logger.error('Embedding worker error:', err)
})

export const closeEmbeddingWorker = async () => {
  await embeddingWorker.close()
  await redis.disconnect()
  logger.info('Embedding worker closed')
}

logger.info('Embedding worker started')
