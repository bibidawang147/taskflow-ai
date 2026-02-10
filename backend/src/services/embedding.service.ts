import axios from 'axios'
import logger from '../utils/logger'

const EMBEDDING_MODEL = 'text-embedding-v3'
const EMBEDDING_DIMENSIONS = 1024
const BASE_URL = process.env.ALIBABA_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'

export interface EmbeddingResult {
  embedding: number[]
  model: string
  tokensUsed: number
}

export interface WorkflowTextData {
  title: string
  description?: string | null
  category?: string | null
  tags?: string | null
  stepTitles?: string[]
  toolsUsed?: string[]
  difficultyLevel?: string | null
  useScenarios?: string | null
  platformTypes?: string | null
  matchKeywords?: string | null
}

/**
 * 将工作流各字段拼接为结构化文本（用于生成 embedding）
 */
export function composeWorkflowText(data: WorkflowTextData): string {
  const parts: string[] = []

  parts.push(`title: ${data.title}`)
  if (data.description) parts.push(`description: ${data.description}`)
  if (data.category) parts.push(`category: ${data.category}`)
  if (data.tags) parts.push(`tags: ${data.tags}`)
  if (data.stepTitles && data.stepTitles.length > 0) {
    parts.push(`steps: ${data.stepTitles.join(' -> ')}`)
  }
  if (data.toolsUsed && data.toolsUsed.length > 0) {
    parts.push(`tools: ${data.toolsUsed.join(', ')}`)
  }
  if (data.difficultyLevel) parts.push(`difficulty: ${data.difficultyLevel}`)

  // 解析 JSON 数组字段
  const jsonFields: [string, string | null | undefined][] = [
    ['scenarios', data.useScenarios],
    ['platforms', data.platformTypes],
    ['keywords', data.matchKeywords],
  ]
  for (const [label, raw] of jsonFields) {
    if (raw) {
      try {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr) && arr.length > 0) {
          parts.push(`${label}: ${arr.join(', ')}`)
        }
      } catch { /* skip malformed JSON */ }
    }
  }

  return parts.join('\n')
}

/**
 * 批量调用 DashScope text-embedding-v3 API（OpenAI 兼容格式）
 * 每次最多 25 条文本
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  const apiKey = process.env.ALIBABA_API_KEY || process.env.QWEN_API_KEY
  if (!apiKey) {
    throw new Error('未配置 ALIBABA_API_KEY 或 QWEN_API_KEY')
  }

  const response = await axios.post(
    `${BASE_URL}/embeddings`,
    {
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 30000,
    }
  )

  const data = response.data
  const totalTokens = data.usage?.total_tokens ?? 0

  return data.data.map((item: any) => ({
    embedding: item.embedding,
    model: EMBEDDING_MODEL,
    tokensUsed: totalTokens,
  }))
}

/**
 * 单条文本生成 embedding
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const results = await generateEmbeddings([text])
  return results[0]
}

/**
 * 余弦相似度
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) return 0

  return dotProduct / denominator
}
