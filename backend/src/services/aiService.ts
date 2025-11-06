import axios from 'axios'

/**
 * AI 服务统一接口
 */

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatResponse {
  content: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

/**
 * OpenAI 服务
 */
export class OpenAIService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',  // 或 gpt-4
          messages,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return {
        content: response.data.choices[0].message.content,
        usage: {
          inputTokens: response.data.usage.prompt_tokens,
          outputTokens: response.data.usage.completion_tokens
        }
      }
    } catch (error) {
      console.error('OpenAI API 调用失败:', error)
      throw new Error('AI 服务调用失败')
    }
  }
}

/**
 * 阿里通义千问服务
 */
export class DashScopeService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      const response = await axios.post(
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        {
          model: 'qwen-turbo',  // 免费模型
          input: {
            messages
          },
          parameters: {
            temperature: 0.7
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return {
        content: response.data.output.text,
        usage: {
          inputTokens: response.data.usage.input_tokens,
          outputTokens: response.data.usage.output_tokens
        }
      }
    } catch (error) {
      console.error('DashScope API 调用失败:', error)
      throw new Error('AI 服务调用失败')
    }
  }
}

/**
 * Anthropic Claude 服务
 */
export class ClaudeService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      // 将消息格式转换为 Claude 格式
      const claudeMessages = messages.filter(m => m.role !== 'system')
      const systemMessage = messages.find(m => m.role === 'system')?.content

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-haiku-20240307',  // 最便宜的模型
          max_tokens: 1024,
          system: systemMessage,
          messages: claudeMessages
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      )

      return {
        content: response.data.content[0].text,
        usage: {
          inputTokens: response.data.usage.input_tokens,
          outputTokens: response.data.usage.output_tokens
        }
      }
    } catch (error) {
      console.error('Claude API 调用失败:', error)
      throw new Error('AI 服务调用失败')
    }
  }
}

/**
 * AI 服务工厂
 */
export class AIService {
  private provider: OpenAIService | DashScopeService | ClaudeService

  constructor(providerType: string = 'dashscope') {
    switch (providerType) {
      case 'openai':
        this.provider = new OpenAIService(process.env.OPENAI_API_KEY!)
        break
      case 'claude':
        this.provider = new ClaudeService(process.env.ANTHROPIC_API_KEY!)
        break
      case 'dashscope':
      default:
        this.provider = new DashScopeService(process.env.DASHSCOPE_API_KEY!)
        break
    }
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    return this.provider.chat(messages)
  }

  /**
   * 简单的对话接口
   */
  async simpleChat(userMessage: string, systemPrompt?: string): Promise<string> {
    const messages: ChatMessage[] = []

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }

    messages.push({ role: 'user', content: userMessage })

    const response = await this.chat(messages)
    return response.content
  }
}

// 导出默认实例
export const aiService = new AIService(process.env.DEFAULT_AI_PROVIDER)
