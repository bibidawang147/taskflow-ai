import { WorkflowNode, ExecutionContext, ConditionConfig } from '../../types/workflow'

/**
 * 条件判断节点执行器（增强版）
 * 支持多种比较操作符：==, !=, >, <, >=, <=, contains, startsWith, endsWith, matches, exists
 */
export class ConditionExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const config = node.config as ConditionConfig

    if (!config.variable) {
      throw new Error('Condition 节点缺少 variable 配置')
    }

    if (!config.operator) {
      throw new Error('Condition 节点缺少 operator 配置')
    }

    // 获取变量值
    const variableValue = this.getNestedValue(context, config.variable)

    // 执行条件判断
    const result = this.evaluateCondition(variableValue, config.operator, config.value)

    console.log(`Condition 节点执行完成: ${config.variable} ${config.operator} ${config.value} => ${result}`)

    // 返回结果
    if (config.trueOutput !== undefined && config.falseOutput !== undefined) {
      // 如果配置了输出值，返回对应的输出
      return result ? config.trueOutput : config.falseOutput
    }

    // 否则返回布尔值
    return result
  }

  /**
   * 执行条件判断
   */
  private evaluateCondition(value: any, operator: string, compareValue?: string): boolean {
    // 处理 exists 操作符
    if (operator === 'exists') {
      return value !== undefined && value !== null
    }

    // 如果变量不存在或为 null，大多数操作符返回 false
    if (value === undefined || value === null) {
      return operator === '!='
    }

    // 转换为字符串以便比较
    const valueStr = String(value)
    const compareStr = compareValue ? String(compareValue) : ''

    switch (operator) {
      case '==':
        return valueStr === compareStr

      case '!=':
        return valueStr !== compareStr

      case '>':
        // 尝试数字比较
        const numValue = parseFloat(valueStr)
        const numCompare = parseFloat(compareStr)
        if (!isNaN(numValue) && !isNaN(numCompare)) {
          return numValue > numCompare
        }
        // 字符串比较
        return valueStr > compareStr

      case '<':
        const numValue2 = parseFloat(valueStr)
        const numCompare2 = parseFloat(compareStr)
        if (!isNaN(numValue2) && !isNaN(numCompare2)) {
          return numValue2 < numCompare2
        }
        return valueStr < compareStr

      case '>=':
        const numValue3 = parseFloat(valueStr)
        const numCompare3 = parseFloat(compareStr)
        if (!isNaN(numValue3) && !isNaN(numCompare3)) {
          return numValue3 >= numCompare3
        }
        return valueStr >= compareStr

      case '<=':
        const numValue4 = parseFloat(valueStr)
        const numCompare4 = parseFloat(compareStr)
        if (!isNaN(numValue4) && !isNaN(numCompare4)) {
          return numValue4 <= numCompare4
        }
        return valueStr <= compareStr

      case 'contains':
        return valueStr.includes(compareStr)

      case 'startsWith':
        return valueStr.startsWith(compareStr)

      case 'endsWith':
        return valueStr.endsWith(compareStr)

      case 'matches':
        // 正则表达式匹配
        try {
          const regex = new RegExp(compareStr)
          return regex.test(valueStr)
        } catch (error) {
          console.error('正则表达式错误:', error)
          return false
        }

      default:
        throw new Error(`不支持的操作符: ${operator}`)
    }
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

export const conditionExecutor = new ConditionExecutor()
