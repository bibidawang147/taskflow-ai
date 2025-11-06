import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { Tool, ToolExecutionContext, ToolExecutionResult, ToolMetadata, ToolCategory } from '../types'

/**
 * HTTP请求工具
 * 支持 GET, POST, PUT, DELETE 等HTTP方法
 */
export class HttpRequestTool implements Tool {
  name = 'http_request'
  description = 'Send HTTP requests to external APIs'
  version = '1.0.0'

  async execute(parameters: Record<string, any>, context: ToolExecutionContext): Promise<ToolExecutionResult> {
    const startTime = Date.now()

    try {
      // 参数验证
      const validation = this.validateParameters(parameters)
      if (!validation.valid) {
        return {
          success: false,
          error: `Parameter validation failed: ${validation.errors?.join(', ')}`,
          metadata: {
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString()
          }
        }
      }

      const {
        url,
        method = 'GET',
        headers = {},
        body,
        params,
        timeout = 30000,
        responseType = 'json'
      } = parameters

      // 构建请求配置
      const config: AxiosRequestConfig = {
        url,
        method: method.toUpperCase(),
        headers,
        timeout,
        params,
        responseType
      }

      // 添加请求体（仅适用于 POST, PUT, PATCH）
      if (['POST', 'PUT', 'PATCH'].includes(config.method!) && body) {
        config.data = body
      }

      // 发送请求
      const response: AxiosResponse = await axios(config)

      return {
        success: true,
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data
        },
        metadata: {
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          url,
          method: config.method
        }
      }

    } catch (error: any) {
      // 处理错误
      const errorMessage = error.response
        ? `HTTP ${error.response.status}: ${error.response.statusText}`
        : error.message || 'Unknown error occurred'

      return {
        success: false,
        error: errorMessage,
        data: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : undefined,
        metadata: {
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          errorType: error.code || 'UNKNOWN'
        }
      }
    }
  }

  validateParameters(parameters: Record<string, any>): { valid: boolean; errors?: string[] } {
    const errors: string[] = []

    // URL必填
    if (!parameters.url) {
      errors.push('URL is required')
    } else if (typeof parameters.url !== 'string') {
      errors.push('URL must be a string')
    } else {
      // 简单的URL格式验证
      try {
        new URL(parameters.url)
      } catch {
        errors.push('URL format is invalid')
      }
    }

    // Method验证
    if (parameters.method) {
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
      if (!validMethods.includes(parameters.method.toUpperCase())) {
        errors.push(`Method must be one of: ${validMethods.join(', ')}`)
      }
    }

    // Timeout验证
    if (parameters.timeout !== undefined) {
      if (typeof parameters.timeout !== 'number' || parameters.timeout <= 0) {
        errors.push('Timeout must be a positive number')
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }
}

/**
 * HTTP请求工具的元数据
 */
export const httpRequestToolMetadata: ToolMetadata = {
  name: 'http_request',
  displayName: 'HTTP请求',
  description: '发送HTTP请求到外部API，支持GET、POST、PUT、DELETE等方法',
  category: ToolCategory.HTTP,
  version: '1.0.0',
  parameters: [
    {
      name: 'url',
      displayName: 'URL',
      description: '请求的完整URL地址',
      type: 'string',
      required: true
    },
    {
      name: 'method',
      displayName: 'HTTP方法',
      description: 'HTTP请求方法',
      type: 'string',
      required: false,
      default: 'GET',
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
        { label: 'PATCH', value: 'PATCH' }
      ]
    },
    {
      name: 'headers',
      displayName: '请求头',
      description: 'HTTP请求头对象',
      type: 'object',
      required: false,
      default: {}
    },
    {
      name: 'params',
      displayName: 'URL参数',
      description: 'URL查询参数对象',
      type: 'object',
      required: false
    },
    {
      name: 'body',
      displayName: '请求体',
      description: '请求体数据（用于POST/PUT/PATCH）',
      type: 'object',
      required: false
    },
    {
      name: 'timeout',
      displayName: '超时时间',
      description: '请求超时时间（毫秒）',
      type: 'number',
      required: false,
      default: 30000,
      validation: {
        min: 1000,
        max: 300000
      }
    },
    {
      name: 'responseType',
      displayName: '响应类型',
      description: '期望的响应数据类型',
      type: 'string',
      required: false,
      default: 'json',
      options: [
        { label: 'JSON', value: 'json' },
        { label: 'Text', value: 'text' },
        { label: 'Blob', value: 'blob' },
        { label: 'ArrayBuffer', value: 'arraybuffer' }
      ]
    }
  ],
  examples: [
    {
      title: 'GET请求示例',
      description: '获取用户信息',
      parameters: {
        url: 'https://api.example.com/users/123',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer {{token}}'
        }
      }
    },
    {
      title: 'POST请求示例',
      description: '创建新用户',
      parameters: {
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          name: '{{userName}}',
          email: '{{userEmail}}'
        }
      }
    }
  ]
}
