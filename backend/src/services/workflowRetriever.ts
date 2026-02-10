import { createRedisConnection } from '../queues/redis.config'
import prisma from '../utils/database'
import logger from '../utils/logger'
import { generateEmbedding, cosineSimilarity } from './embedding.service'

// ========== 类型定义 ==========

export interface WorkflowSummary {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  stepCount: number
  stepTitles: string[]
  toolsUsed: string[]
  difficulty: string
  usageCount: number
  rating?: number
}

export interface WorkflowRetriever {
  retrieve(query: string): Promise<WorkflowSummary[]>
  refreshCache(): Promise<void>
}

// ========== 常量 ==========

const CACHE_KEY = 'assistant:workflow:summaries'
const CACHE_TTL = 3600 // 1小时
const TOKEN_BUDGET = 8000
const EMBEDDING_HASH_KEY = 'embedding:workflows'
const TOP_K = 12
const VECTOR_MIN_THRESHOLD = 50 // 工作流少于此数量时用全量，多于时用向量检索

// ========== Token 估算 ==========

/**
 * 粗略估算文本的 token 数
 * 中文字符 ≈ 1.5 token，英文/数字 ≈ 0.4 token
 */
function estimateTokens(text: string): number {
  let tokens = 0
  for (const char of text) {
    if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(char)) {
      tokens += 1.5
    } else {
      tokens += 0.4
    }
  }
  return Math.ceil(tokens)
}

/**
 * 按 token 预算截断工作流摘要列表
 * 逐个累加，超出预算就停止
 */
function truncateByTokenBudget(summaries: WorkflowSummary[], budget: number): WorkflowSummary[] {
  const result: WorkflowSummary[] = []
  let usedTokens = 0

  for (const summary of summaries) {
    // 估算单个摘要序列化后的 token 数
    const text = [
      summary.title,
      summary.description,
      summary.category,
      summary.tags.join('、'),
      summary.stepTitles.join(' → '),
      summary.toolsUsed.join('、'),
    ].join(' ')

    const tokens = estimateTokens(text)

    if (usedTokens + tokens > budget) {
      break
    }

    usedTokens += tokens
    result.push(summary)
  }

  return result
}

// ========== 工作流转摘要 ==========

function workflowToSummary(workflow: any): WorkflowSummary {
  // 解析 tags（逗号分隔字符串）
  const tags: string[] = workflow.tags
    ? workflow.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : []

  // 从 nodes 提取步骤标题
  const stepTitles: string[] = (workflow.nodes || [])
    .map((n: any) => n.label)
    .filter(Boolean)

  // 从 nodes 提取使用的工具
  const toolsUsed: string[] = []
  for (const node of workflow.nodes || []) {
    if (node.type === 'tool' && node.label) {
      toolsUsed.push(node.label)
    }
    // 从 config 中提取工具名
    if (node.config && typeof node.config === 'object') {
      const config = node.config as Record<string, any>
      if (config.toolName) {
        toolsUsed.push(config.toolName)
      }
      if (config.tool) {
        toolsUsed.push(config.tool)
      }
    }
  }

  return {
    id: workflow.id,
    title: workflow.title,
    description: workflow.description || '',
    category: workflow.category || '',
    tags,
    stepCount: stepTitles.length,
    stepTitles,
    toolsUsed: [...new Set(toolsUsed)], // 去重
    difficulty: workflow.difficultyLevel || 'beginner',
    usageCount: workflow.usageCount || 0,
    rating: workflow.rating ?? undefined,
  }
}

// ========== SimpleRetriever ==========

class SimpleRetriever implements WorkflowRetriever {
  private redis = createRedisConnection()

  async retrieve(_query: string): Promise<WorkflowSummary[]> {
    try {
      // 1. 尝试从 Redis 读缓存
      const cached = await this.redis.get(CACHE_KEY)
      if (cached) {
        const summaries: WorkflowSummary[] = JSON.parse(cached)
        return truncateByTokenBudget(summaries, TOKEN_BUDGET)
      }

      // 2. 缓存未命中，从数据库查询
      const summaries = await this.fetchAndCache()
      return truncateByTokenBudget(summaries, TOKEN_BUDGET)
    } catch (error) {
      logger.error('WorkflowRetriever.retrieve 失败:', error)
      // 降级：返回空列表，不影响 AI 对话
      return []
    }
  }

  async refreshCache(): Promise<void> {
    try {
      await this.redis.del(CACHE_KEY)
      logger.info('🗑️ 已清除工作流摘要缓存')
    } catch (error) {
      logger.error('清除工作流摘要缓存失败:', error)
    }
  }

  private async fetchAndCache(): Promise<WorkflowSummary[]> {
    // 查询所有已发布的公开工作流
    const workflows = await prisma.workflow.findMany({
      where: {
        isPublic: true,
        isDraft: false,
      },
      include: {
        nodes: {
          select: {
            type: true,
            label: true,
            config: true,
          },
        },
      },
      orderBy: {
        usageCount: 'desc',
      },
    })

    // 转换为摘要格式
    const summaries = workflows.map(workflowToSummary)

    // 写入 Redis 缓存
    try {
      await this.redis.set(CACHE_KEY, JSON.stringify(summaries), 'EX', CACHE_TTL)
      logger.info(`✅ 已缓存 ${summaries.length} 个工作流摘要`)
    } catch (error) {
      logger.error('写入工作流摘要缓存失败:', error)
    }

    return summaries
  }
}

// ========== VectorRetriever ==========

class VectorRetriever implements WorkflowRetriever {
  private redis = createRedisConnection()
  private fallback = new SimpleRetriever()

  async retrieve(query: string): Promise<WorkflowSummary[]> {
    try {
      // 工作流数量少时直接全量（AI 看到全貌推荐更好）
      const allEmbeddings = await this.redis.hgetall(EMBEDDING_HASH_KEY)
      const entries = Object.entries(allEmbeddings)

      if (entries.length === 0) {
        logger.warn('No embeddings in Redis, falling back to SimpleRetriever')
        return this.fallback.retrieve(query)
      }

      if (entries.length < VECTOR_MIN_THRESHOLD) {
        logger.debug(`Workflow count (${entries.length}) < ${VECTOR_MIN_THRESHOLD}, using full list`)
        return this.fallback.retrieve(query)
      }

      // 1. 为用户 query 生成 embedding
      const queryResult = await generateEmbedding(query)
      const queryEmbedding = queryResult.embedding

      // 3. 计算余弦相似度
      const scored: { workflowId: string; score: number }[] = []
      for (const [workflowId, raw] of entries) {
        try {
          const { embedding } = JSON.parse(raw) as { embedding: number[] }
          const score = cosineSimilarity(queryEmbedding, embedding)
          scored.push({ workflowId, score })
        } catch {
          // skip malformed entries
        }
      }

      // 4. 按分数降序，取 top K
      scored.sort((a, b) => b.score - a.score)
      const topIds = scored.slice(0, TOP_K).map(s => s.workflowId)

      if (topIds.length === 0) {
        return this.fallback.retrieve(query)
      }

      // 5. 查询完整 workflow 数据
      const workflows = await prisma.workflow.findMany({
        where: {
          id: { in: topIds },
          isPublic: true,
          isDraft: false,
        },
        include: {
          nodes: { select: { type: true, label: true, config: true } },
        },
      })

      // 6. 转为 WorkflowSummary，保持相似度排序
      const summaryMap = new Map<string, WorkflowSummary>()
      for (const w of workflows) {
        summaryMap.set(w.id, workflowToSummary(w))
      }

      const orderedSummaries: WorkflowSummary[] = []
      for (const id of topIds) {
        const summary = summaryMap.get(id)
        if (summary) orderedSummaries.push(summary)
      }

      // 7. token 截断
      return truncateByTokenBudget(orderedSummaries, TOKEN_BUDGET)
    } catch (error) {
      logger.error('VectorRetriever.retrieve failed, falling back to SimpleRetriever:', error)
      return this.fallback.retrieve(query)
    }
  }

  async refreshCache(): Promise<void> {
    try {
      await this.redis.del(EMBEDDING_HASH_KEY)
      await this.redis.del(CACHE_KEY)
      logger.info('Cleared embedding and summary caches')
    } catch (error) {
      logger.error('Failed to clear embedding cache:', error)
    }
  }
}

// ========== 工厂函数 ==========

// 模块级单例，避免重复创建
let retrieverInstance: WorkflowRetriever | null = null

export function createRetriever(): WorkflowRetriever {
  if (!retrieverInstance) {
    const apiKey = process.env.ALIBABA_API_KEY || process.env.QWEN_API_KEY
    if (apiKey && process.env.ENABLE_VECTOR_RETRIEVER !== 'false') {
      retrieverInstance = new VectorRetriever()
      logger.info('Using VectorRetriever for workflow retrieval')
    } else {
      retrieverInstance = new SimpleRetriever()
      logger.info('Using SimpleRetriever (no embedding API key or vector disabled)')
    }
  }
  return retrieverInstance
}

// 导出缓存 key 供外部清除使用
export const WORKFLOW_CACHE_KEY = CACHE_KEY
export { EMBEDDING_HASH_KEY }
