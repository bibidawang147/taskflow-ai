import axios, { AxiosRequestConfig } from 'axios'
import { WorkflowNode, ExecutionContext, HTTPRequestConfig } from '../../types/workflow'

/**
 * HTTP 请求节点执行器
 * 支持 GET、POST、PUT、DELETE、PATCH 等方法
 * 支持自定义 headers 和 body
 * 支持变量替换
 */
export class HTTPRequestExecutor {
  // URL 白名单（安全考虑）
  private readonly ALLOWED_DOMAINS = [
    'api.github.com',
    'jsonplaceholder.typicode.com',
    'httpbin.org',
    'api.openai.com',
    'dashscope.aliyuncs.com',
    // 可以根据需要添加更多域名
  ]

  async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const config = node.config as HTTPRequestConfig

    if (!config.url) {
      throw new Error('HTTPRequest 节点缺少 url 配置')
    }

    if (!config.method) {
      throw new Error('HTTPRequest 节点缺少 method 配置')
    }

    // 替换 URL 中的变量
    const url = this.replaceVariables(config.url, context)

    // 验证 URL 安全性
    this.validateUrl(url)

    // 构建请求配置
    const axiosConfig: AxiosRequestConfig = {
      method: config.method,
      url: url,
      timeout: config.timeout || 30000, // 默认 30 秒超时
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Workflow-Platform/1.0',
        ...config.headers
      }
    }

    // 处理请求 body（仅用于 POST、PUT、PATCH）
    if (['POST', 'PUT', 'PATCH'].includes(config.method) && config.body) {
      try {
        // 替换 body 中的变量
        const bodyStr = this.replaceVariables(config.body, context)
        // 尝试解析为 JSON
        axiosConfig.data = JSON.parse(bodyStr)
      } catch (error) {
        // 如果不是有效的 JSON，直接使用字符串
        axiosConfig.data = config.body
      }
    }

    console.log(`HTTPRequest 节点执行: ${config.method} ${url}`)

    try {
      // 发送请求
      const response = await axios(axiosConfig)

      console.log(`HTTPRequest 成功: 状态码 ${response.status}`)

      // 返回响应数据
      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      }
    } catch (error: any) {
      console.error(`HTTPRequest 失败:`, error.message)

      // 如果是 HTTP 错误，返回错误响应
      if (error.response) {
        return {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
          error: true
        }
      }

      // 其他错误（网络错误、超时等）
      throw new Error(`HTTP 请求失败: ${error.message}`)
    }
  }

  /**
   * 验证 URL 安全性
   * 检查是否在白名单中
   */
  private validateUrl(url: string): void {
    try {
      const urlObj = new URL(url)

      // 检查协议（只允许 http 和 https）
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error(`不支持的协议: ${urlObj.protocol}`)
      }

      // 检查域名白名单（生产环境建议启用）
      // 注释掉以允许所有域名，或根据需要配置
      /*
      const isAllowed = this.ALLOWED_DOMAINS.some(domain =>
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      )

      if (!isAllowed) {
        throw new Error(`域名不在白名单中: ${urlObj.hostname}`)
      }
      */
    } catch (error: any) {
      throw new Error(`无效的 URL: ${error.message}`)
    }
  }

  /**
   * 替换字符串中的变量
   * 支持 {{variable}} 和 {variable} 语法
   */
  private replaceVariables(text: string, context: ExecutionContext): string {
    if (!text) return ''

    // 替换双大括号变量 {{...}}
    let result = text.replace(/\{\{([^}]+)\}\}/g, (match, varPath) => {
      const value = this.getNestedValue(context, varPath.trim())
      if (value !== undefined) {
        return typeof value === 'string' ? value : JSON.stringify(value)
      }
      return match
    })

    // 替换单大括号变量 {...}
    result = result.replace(/\{([^}]+)\}/g, (match, varName) => {
      if (context[varName] !== undefined) {
        const value = context[varName]
        return typeof value === 'string' ? value : JSON.stringify(value)
      }
      return match
    })

    return result
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.')
    let current = obj

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return undefined
      }
    }

    return current
  }
}

export const httpRequestExecutor = new HTTPRequestExecutor()
