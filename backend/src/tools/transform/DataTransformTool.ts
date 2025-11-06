import { Tool, ToolExecutionContext, ToolExecutionResult, ToolMetadata, ToolCategory } from '../types'

/**
 * 数据转换工具
 * 支持多种数据转换操作：映射、过滤、排序、聚合等
 */
export class DataTransformTool implements Tool {
  name = 'data_transform'
  description = 'Transform and manipulate data structures'
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

      const { operation, data, config = {} } = parameters

      let result: any

      switch (operation) {
        case 'map':
          result = this.mapData(data, config)
          break
        case 'filter':
          result = this.filterData(data, config)
          break
        case 'sort':
          result = this.sortData(data, config)
          break
        case 'aggregate':
          result = this.aggregateData(data, config)
          break
        case 'extract':
          result = this.extractField(data, config)
          break
        case 'merge':
          result = this.mergeData(data, config)
          break
        case 'flatten':
          result = this.flattenData(data, config)
          break
        case 'group':
          result = this.groupData(data, config)
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
          operation,
          inputSize: Array.isArray(data) ? data.length : 1,
          outputSize: Array.isArray(result) ? result.length : 1
        }
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Data transformation failed',
        metadata: {
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * 映射数据 - 转换每个元素
   */
  private mapData(data: any, config: any): any {
    if (!Array.isArray(data)) {
      throw new Error('Map operation requires an array')
    }

    const { fields } = config
    if (!fields || typeof fields !== 'object') {
      return data
    }

    return data.map(item => {
      const mapped: any = {}
      for (const [newKey, oldKey] of Object.entries(fields)) {
        mapped[newKey] = this.getNestedValue(item, oldKey as string)
      }
      return mapped
    })
  }

  /**
   * 过滤数据
   */
  private filterData(data: any, config: any): any {
    if (!Array.isArray(data)) {
      throw new Error('Filter operation requires an array')
    }

    const { condition } = config
    if (!condition) {
      return data
    }

    return data.filter(item => this.evaluateCondition(item, condition))
  }

  /**
   * 排序数据
   */
  private sortData(data: any, config: any): any {
    if (!Array.isArray(data)) {
      throw new Error('Sort operation requires an array')
    }

    const { field, order = 'asc' } = config
    if (!field) {
      return data
    }

    return [...data].sort((a, b) => {
      const aVal = this.getNestedValue(a, field)
      const bVal = this.getNestedValue(b, field)

      if (aVal === bVal) return 0

      const comparison = aVal < bVal ? -1 : 1
      return order === 'asc' ? comparison : -comparison
    })
  }

  /**
   * 聚合数据
   */
  private aggregateData(data: any, config: any): any {
    if (!Array.isArray(data)) {
      throw new Error('Aggregate operation requires an array')
    }

    const { operation: aggOp, field } = config

    switch (aggOp) {
      case 'count':
        return data.length

      case 'sum':
        return data.reduce((sum, item) => {
          const value = this.getNestedValue(item, field)
          return sum + (typeof value === 'number' ? value : 0)
        }, 0)

      case 'avg':
        const sum = data.reduce((sum, item) => {
          const value = this.getNestedValue(item, field)
          return sum + (typeof value === 'number' ? value : 0)
        }, 0)
        return data.length > 0 ? sum / data.length : 0

      case 'min':
        return Math.min(...data.map(item => this.getNestedValue(item, field)))

      case 'max':
        return Math.max(...data.map(item => this.getNestedValue(item, field)))

      default:
        throw new Error(`Unknown aggregation operation: ${aggOp}`)
    }
  }

  /**
   * 提取字段
   */
  private extractField(data: any, config: any): any {
    const { field } = config
    if (!field) {
      return data
    }

    if (Array.isArray(data)) {
      return data.map(item => this.getNestedValue(item, field))
    }

    return this.getNestedValue(data, field)
  }

  /**
   * 合并数据
   */
  private mergeData(data: any, config: any): any {
    const { source } = config
    if (!source) {
      return data
    }

    if (Array.isArray(data) && Array.isArray(source)) {
      return [...data, ...source]
    }

    if (typeof data === 'object' && typeof source === 'object') {
      return { ...data, ...source }
    }

    return data
  }

  /**
   * 展平数据
   */
  private flattenData(data: any, config: any): any {
    if (!Array.isArray(data)) {
      throw new Error('Flatten operation requires an array')
    }

    const { depth = 1 } = config
    return data.flat(depth)
  }

  /**
   * 分组数据
   */
  private groupData(data: any, config: any): any {
    if (!Array.isArray(data)) {
      throw new Error('Group operation requires an array')
    }

    const { field } = config
    if (!field) {
      return data
    }

    const grouped: Record<string, any[]> = {}
    data.forEach(item => {
      const key = String(this.getNestedValue(item, field))
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(item)
    })

    return grouped
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: any, path: string): any {
    if (!path) return obj

    const keys = path.split('.')
    let value = obj

    for (const key of keys) {
      if (value == null) return undefined
      value = value[key]
    }

    return value
  }

  /**
   * 评估条件
   */
  private evaluateCondition(item: any, condition: any): boolean {
    const { field, operator, value } = condition
    const itemValue = this.getNestedValue(item, field)

    switch (operator) {
      case 'equals':
      case '==':
        return itemValue === value
      case 'not_equals':
      case '!=':
        return itemValue !== value
      case 'greater_than':
      case '>':
        return itemValue > value
      case 'less_than':
      case '<':
        return itemValue < value
      case 'greater_or_equal':
      case '>=':
        return itemValue >= value
      case 'less_or_equal':
      case '<=':
        return itemValue <= value
      case 'contains':
        return String(itemValue).includes(String(value))
      case 'starts_with':
        return String(itemValue).startsWith(String(value))
      case 'ends_with':
        return String(itemValue).endsWith(String(value))
      case 'in':
        return Array.isArray(value) && value.includes(itemValue)
      default:
        return false
    }
  }

  validateParameters(parameters: Record<string, any>): { valid: boolean; errors?: string[] } {
    const errors: string[] = []

    if (!parameters.operation) {
      errors.push('Operation is required')
    }

    if (parameters.data === undefined) {
      errors.push('Data is required')
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }
}

/**
 * 数据转换工具的元数据
 */
export const dataTransformToolMetadata: ToolMetadata = {
  name: 'data_transform',
  displayName: '数据转换',
  description: '对数据进行各种转换操作，包括映射、过滤、排序、聚合等',
  category: ToolCategory.DATA_TRANSFORM,
  version: '1.0.0',
  parameters: [
    {
      name: 'operation',
      displayName: '操作类型',
      description: '要执行的转换操作',
      type: 'string',
      required: true,
      options: [
        { label: '映射(Map)', value: 'map' },
        { label: '过滤(Filter)', value: 'filter' },
        { label: '排序(Sort)', value: 'sort' },
        { label: '聚合(Aggregate)', value: 'aggregate' },
        { label: '提取(Extract)', value: 'extract' },
        { label: '合并(Merge)', value: 'merge' },
        { label: '展平(Flatten)', value: 'flatten' },
        { label: '分组(Group)', value: 'group' }
      ]
    },
    {
      name: 'data',
      displayName: '输入数据',
      description: '要转换的数据',
      type: 'object',
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
      title: '映射字段',
      description: '重命名和提取特定字段',
      parameters: {
        operation: 'map',
        data: [{ name: 'John', age: 30 }],
        config: {
          fields: {
            userName: 'name',
            userAge: 'age'
          }
        }
      }
    },
    {
      title: '过滤数据',
      description: '筛选符合条件的数据',
      parameters: {
        operation: 'filter',
        data: [{ age: 20 }, { age: 30 }],
        config: {
          condition: {
            field: 'age',
            operator: '>',
            value: 25
          }
        }
      }
    },
    {
      title: '聚合计算',
      description: '计算数组的总和',
      parameters: {
        operation: 'aggregate',
        data: [{ value: 10 }, { value: 20 }, { value: 30 }],
        config: {
          operation: 'sum',
          field: 'value'
        }
      },
      expectedResult: 60
    }
  ]
}
