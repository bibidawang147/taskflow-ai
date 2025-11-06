import { Tool, ToolExecutionContext, ToolExecutionResult, ToolMetadata, ToolCategory } from '../types'

/**
 * 文本处理工具
 * 支持各种文本操作：拼接、分割、替换、格式化等
 */
export class TextProcessingTool implements Tool {
  name = 'text_processing'
  description = 'Process and manipulate text strings'
  version = '1.0.0'

  async execute(parameters: Record<string, any>, context: ToolExecutionContext): Promise<ToolExecutionResult> {
    const startTime = Date.now()

    try {
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

      const { operation, text, config = {} } = parameters

      let result: any

      switch (operation) {
        case 'concat':
          result = this.concatText(text, config)
          break
        case 'split':
          result = this.splitText(text, config)
          break
        case 'replace':
          result = this.replaceText(text, config)
          break
        case 'trim':
          result = this.trimText(text, config)
          break
        case 'uppercase':
          result = String(text).toUpperCase()
          break
        case 'lowercase':
          result = String(text).toLowerCase()
          break
        case 'capitalize':
          result = this.capitalizeText(text)
          break
        case 'substring':
          result = this.substringText(text, config)
          break
        case 'length':
          result = String(text).length
          break
        case 'format':
          result = this.formatText(text, config)
          break
        case 'extract':
          result = this.extractPattern(text, config)
          break
        case 'join':
          result = this.joinText(text, config)
          break
        default:
          return {
            success: false,
            error: `Unknown operation: ${operation}`,
            metadata: {
              duration: Date.now() - startTime,
              timestamp: new Date().toISOString()
            }
          }
      }

      return {
        success: true,
        data: result,
        metadata: {
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          operation
        }
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Text processing failed',
        metadata: {
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * 拼接文本
   */
  private concatText(text: any, config: any): string {
    const { values = [], separator = '' } = config
    const allTexts = [text, ...values].map(v => String(v))
    return allTexts.join(separator)
  }

  /**
   * 分割文本
   */
  private splitText(text: any, config: any): string[] {
    const { delimiter = ',', limit } = config
    const str = String(text)

    if (limit !== undefined) {
      return str.split(delimiter, limit)
    }

    return str.split(delimiter)
  }

  /**
   * 替换文本
   */
  private replaceText(text: any, config: any): string {
    const { search, replace, global = false, caseInsensitive = false } = config

    if (!search) {
      return String(text)
    }

    const str = String(text)

    if (global || caseInsensitive) {
      let flags = ''
      if (global) flags += 'g'
      if (caseInsensitive) flags += 'i'

      const regex = new RegExp(search, flags)
      return str.replace(regex, replace || '')
    }

    return str.replace(search, replace || '')
  }

  /**
   * 修剪文本
   */
  private trimText(text: any, config: any): string {
    const { mode = 'both' } = config
    const str = String(text)

    switch (mode) {
      case 'start':
        return str.trimStart()
      case 'end':
        return str.trimEnd()
      case 'both':
      default:
        return str.trim()
    }
  }

  /**
   * 首字母大写
   */
  private capitalizeText(text: any): string {
    const str = String(text)
    if (str.length === 0) return str

    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  /**
   * 截取子字符串
   */
  private substringText(text: any, config: any): string {
    const { start = 0, end } = config
    const str = String(text)

    if (end !== undefined) {
      return str.substring(start, end)
    }

    return str.substring(start)
  }

  /**
   * 格式化文本（模板替换）
   */
  private formatText(text: any, config: any): string {
    const { variables = {} } = config
    let str = String(text)

    // 替换 {{variableName}} 格式的变量
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
      str = str.replace(regex, String(value))
    }

    return str
  }

  /**
   * 提取模式匹配
   */
  private extractPattern(text: any, config: any): string[] | null {
    const { pattern, flags = '' } = config

    if (!pattern) {
      return null
    }

    const str = String(text)
    const regex = new RegExp(pattern, flags)

    if (flags.includes('g')) {
      return str.match(regex)
    }

    const match = str.match(regex)
    return match ? [match[0]] : null
  }

  /**
   * 连接数组为文本
   */
  private joinText(text: any, config: any): string {
    if (!Array.isArray(text)) {
      return String(text)
    }

    const { separator = ',' } = config
    return text.map(v => String(v)).join(separator)
  }

  validateParameters(parameters: Record<string, any>): { valid: boolean; errors?: string[] } {
    const errors: string[] = []

    if (!parameters.operation) {
      errors.push('Operation is required')
    }

    if (parameters.text === undefined && parameters.operation !== 'join') {
      errors.push('Text is required')
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }
}

/**
 * 文本处理工具的元数据
 */
export const textProcessingToolMetadata: ToolMetadata = {
  name: 'text_processing',
  displayName: '文本处理',
  description: '对文本进行各种处理操作，包括拼接、分割、替换、格式化等',
  category: ToolCategory.TEXT_PROCESSING,
  version: '1.0.0',
  parameters: [
    {
      name: 'operation',
      displayName: '操作类型',
      description: '要执行的文本操作',
      type: 'string',
      required: true,
      options: [
        { label: '拼接(Concat)', value: 'concat' },
        { label: '分割(Split)', value: 'split' },
        { label: '替换(Replace)', value: 'replace' },
        { label: '修剪(Trim)', value: 'trim' },
        { label: '大写(Uppercase)', value: 'uppercase' },
        { label: '小写(Lowercase)', value: 'lowercase' },
        { label: '首字母大写(Capitalize)', value: 'capitalize' },
        { label: '截取(Substring)', value: 'substring' },
        { label: '长度(Length)', value: 'length' },
        { label: '格式化(Format)', value: 'format' },
        { label: '提取(Extract)', value: 'extract' },
        { label: '连接(Join)', value: 'join' }
      ]
    },
    {
      name: 'text',
      displayName: '输入文本',
      description: '要处理的文本内容',
      type: 'string',
      required: true
    },
    {
      name: 'config',
      displayName: '配置',
      description: '操作特定的配置参数',
      type: 'object',
      required: false,
      default: {}
    }
  ],
  examples: [
    {
      title: '拼接文本',
      description: '将多个文本用分隔符连接',
      parameters: {
        operation: 'concat',
        text: 'Hello',
        config: {
          values: ['World', '!'],
          separator: ' '
        }
      },
      expectedResult: 'Hello World !'
    },
    {
      title: '分割文本',
      description: '按分隔符分割文本',
      parameters: {
        operation: 'split',
        text: 'apple,banana,orange',
        config: {
          delimiter: ','
        }
      },
      expectedResult: ['apple', 'banana', 'orange']
    },
    {
      title: '替换文本',
      description: '替换文本中的内容',
      parameters: {
        operation: 'replace',
        text: 'Hello World',
        config: {
          search: 'World',
          replace: 'Claude',
          global: true
        }
      },
      expectedResult: 'Hello Claude'
    },
    {
      title: '格式化模板',
      description: '使用变量替换模板',
      parameters: {
        operation: 'format',
        text: 'Hello {{name}}, welcome to {{place}}!',
        config: {
          variables: {
            name: 'John',
            place: 'New York'
          }
        }
      },
      expectedResult: 'Hello John, welcome to New York!'
    }
  ]
}
