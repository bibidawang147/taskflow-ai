import { WorkflowNode, ExecutionContext, TextTransformConfig } from '../../types/workflow'

/**
 * 文本转换节点执行器
 * 支持多种文本处理操作：大小写转换、去空格、替换、提取、分割等
 */
export class TextTransformExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const config = node.config as TextTransformConfig

    if (!config.inputVariable) {
      throw new Error('TextTransform 节点缺少 inputVariable 配置')
    }

    // 获取输入文本
    const inputText = this.getNestedValue(context, config.inputVariable)

    if (inputText === undefined || inputText === null) {
      throw new Error(`变量 "${config.inputVariable}" 不存在或为空`)
    }

    // 确保是字符串类型
    const text = String(inputText)

    let result: any

    // 根据操作类型执行相应的转换
    switch (config.operation) {
      case 'uppercase':
        result = text.toUpperCase()
        break

      case 'lowercase':
        result = text.toLowerCase()
        break

      case 'trim':
        result = text.trim()
        break

      case 'replace':
        if (!config.pattern) {
          throw new Error('replace 操作需要提供 pattern 参数')
        }
        try {
          // 支持正则表达式和普通字符串替换
          const regex = new RegExp(config.pattern, 'g')
          result = text.replace(regex, config.replacement || '')
        } catch (error) {
          // 如果不是有效的正则，使用普通字符串替换
          result = text.split(config.pattern).join(config.replacement || '')
        }
        break

      case 'extract':
        if (!config.pattern) {
          throw new Error('extract 操作需要提供 pattern 参数（正则表达式）')
        }
        try {
          const regex = new RegExp(config.pattern)
          const matches = text.match(regex)
          result = matches ? matches[0] : null
        } catch (error: any) {
          throw new Error(`正则表达式错误: ${error.message}`)
        }
        break

      case 'split':
        const separator = config.separator || ','
        result = text.split(separator).map(s => s.trim()).filter(s => s.length > 0)
        break

      default:
        throw new Error(`不支持的操作类型: ${config.operation}`)
    }

    console.log(`TextTransform 节点执行完成: ${config.operation}`, {
      input: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      output: typeof result === 'string'
        ? result.substring(0, 50) + (result.length > 50 ? '...' : '')
        : result
    })

    return result
  }

  /**
   * 获取嵌套对象的值
   * 例如: getNestedValue(obj, 'input.text') 返回 obj.input.text
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

export const textTransformExecutor = new TextTransformExecutor()
