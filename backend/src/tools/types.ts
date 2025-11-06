/**
 * 工具执行上下文
 */
export interface ToolExecutionContext {
  variables: Record<string, any>
  workflowId?: string
  executionId?: string
}

/**
 * 工具执行结果
 */
export interface ToolExecutionResult {
  success: boolean
  data?: any
  error?: string
  metadata?: {
    duration?: number
    timestamp?: string
    [key: string]: any
  }
}

/**
 * 工具接口
 */
export interface Tool {
  name: string
  description: string
  version?: string

  /**
   * 执行工具
   * @param parameters 工具参数
   * @param context 执行上下文
   */
  execute(parameters: Record<string, any>, context: ToolExecutionContext): Promise<ToolExecutionResult>

  /**
   * 验证参数
   * @param parameters 工具参数
   */
  validateParameters?(parameters: Record<string, any>): { valid: boolean; errors?: string[] }
}

/**
 * 工具类别
 */
export enum ToolCategory {
  HTTP = 'http',
  DATA_TRANSFORM = 'data_transform',
  TEXT_PROCESSING = 'text_processing',
  FILE = 'file',
  AI = 'ai',
  DATABASE = 'database',
  NOTIFICATION = 'notification',
  CUSTOM = 'custom'
}

/**
 * 工具元数据
 */
export interface ToolMetadata {
  name: string
  displayName: string
  description: string
  category: ToolCategory
  version: string
  parameters: ToolParameterDefinition[]
  examples?: ToolExample[]
}

/**
 * 工具参数定义
 */
export interface ToolParameterDefinition {
  name: string
  displayName: string
  description: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  default?: any
  options?: Array<{ label: string; value: any }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
    enum?: any[]
  }
}

/**
 * 工具示例
 */
export interface ToolExample {
  title: string
  description: string
  parameters: Record<string, any>
  expectedResult?: any
}
