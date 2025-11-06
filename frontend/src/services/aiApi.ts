import { api } from './api'

// AI 消息类型
export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// AI 聊天请求参数
export interface AIChatRequest {
  provider: 'openai' | 'anthropic' | 'doubao' | 'qwen' | 'zhipu'
  model: string
  messages: AIMessage[]
  temperature?: number
  maxTokens?: number
  workflowId?: string
  executionId?: string
}

// AI 聊天响应
export interface AIChatResponse {
  success: boolean
  data: {
    content: string
    usage: {
      inputTokens: number
      outputTokens: number
      totalTokens: number
    }
    cost: number
    finishReason: string
  }
}

// 获取可用模型列表
export const getAvailableModels = async () => {
  try {
    const response = await api.get('/api/ai/models')
    return response.data
  } catch (error) {
    console.error('获取模型列表失败:', error)
    throw error
  }
}

// AI 对话（流式响应）
export const chatWithAIStream = async (
  request: AIChatRequest,
  onToken: (token: string) => void,
  onComplete: (data: any) => void,
  onError: (error: Error) => void
) => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('http://localhost:3000/api/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'AI 对话失败')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('无法读取响应流')
    }

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()

          try {
            const parsed = JSON.parse(data)

            if (parsed.type === 'error') {
              onError(new Error(parsed.error))
              return
            }

            if (parsed.type === 'complete') {
              onComplete(parsed.data)
              return
            }

            if (parsed.token) {
              onToken(parsed.token)
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (error: any) {
    console.error('AI 流式对话失败:', error)
    onError(error)
  }
}

// AI 对话（非流式，兼容旧版）
export const chatWithAI = async (request: AIChatRequest): Promise<AIChatResponse> => {
  try {
    const response = await api.post('/api/ai/chat', request)
    return response.data
  } catch (error: any) {
    console.error('AI 对话失败:', error)

    // 处理特定错误
    if (error.response?.status === 402) {
      throw new Error('积分不足，请充值后继续使用')
    }

    if (error.response?.status === 403) {
      throw new Error('当前会员等级无法使用此模型，请升级会员')
    }

    throw new Error(error.response?.data?.message || 'AI 对话失败，请稍后重试')
  }
}

// 测试 AI 连接
export const testAIConnection = async (provider: string) => {
  try {
    const response = await api.post('/api/ai/test-connection', { provider })
    return response.data
  } catch (error) {
    console.error('测试连接失败:', error)
    throw error
  }
}
