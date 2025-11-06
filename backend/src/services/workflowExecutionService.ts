import OpenAI from 'openai'
import { WorkflowNode, WorkflowEdge, WorkflowConfig } from '../types/workflow'
import { textTransformExecutor } from './nodes/TextTransformExecutor'
import { templateRendererExecutor } from './nodes/TemplateRendererExecutor'
import { conditionExecutor } from './nodes/ConditionExecutor'
import { httpRequestExecutor } from './nodes/HTTPRequestExecutor'
import { toolRegistry } from '../tools'

interface ExecutionContext {
  [nodeId: string]: any
}

interface ExecutionResult {
  success: boolean
  output?: any
  error?: string
  nodeResults?: { [nodeId: string]: any }
  executionOrder?: string[]
}

type ProgressCallback = (nodeId: string, nodeLabel: string, currentIndex: number, total: number) => Promise<void>

export class WorkflowExecutionService {
  private openai: OpenAI | null = null
  private provider: 'openai' | 'alibaba' | null = null

  constructor() {
    // 优先使用阿里云百炼 API（兼容 OpenAI 格式）
    if (process.env.ALIBABA_API_KEY) {
      console.log('✅ 使用阿里云百炼大模型 API')
      console.log(`   Base URL: ${process.env.ALIBABA_BASE_URL}`)
      console.log(`   默认模型: ${process.env.ALIBABA_DEFAULT_MODEL}`)

      this.openai = new OpenAI({
        apiKey: process.env.ALIBABA_API_KEY,
        baseURL: process.env.ALIBABA_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        defaultHeaders: {
          'X-DashScope-SSE': 'disable' // 禁用流式输出
        }
      })
      this.provider = 'alibaba'
    }
    // 如果没有阿里云 API，尝试使用 OpenAI API
    else if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
      console.log('✅ 使用 OpenAI API')
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
      this.provider = 'openai'
    } else {
      console.log('⚠️  未配置 AI API Key，将返回模拟结果')
    }
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(
    config: WorkflowConfig,
    input: any,
    progressCallback?: ProgressCallback
  ): Promise<ExecutionResult> {
    try {
      const { nodes, edges } = config

      if (!nodes || nodes.length === 0) {
        return {
          success: false,
          error: '工作流没有节点'
        }
      }

      // 构建节点依赖图（拓扑排序）
      const executionOrder = this.buildExecutionOrder(nodes, edges)

      if (!executionOrder || executionOrder.length === 0) {
        return {
          success: false,
          error: '无法确定节点执行顺序，可能存在循环依赖'
        }
      }

      console.log(`工作流执行顺序: ${executionOrder.join(' → ')}`)

      // 存储每个节点的执行结果
      const context: ExecutionContext = {
        input: input // 初始输入
      }

      const nodeResults: { [nodeId: string]: any } = {}

      // 按顺序执行节点
      for (let i = 0; i < executionOrder.length; i++) {
        const nodeId = executionOrder[i]
        const node = nodes.find(n => n.id === nodeId)
        if (!node) continue

        console.log(`[${i + 1}/${executionOrder.length}] 执行节点: ${nodeId} (${node.label})`)

        // 调用进度回调
        if (progressCallback) {
          await progressCallback(nodeId, node.label, i + 1, executionOrder.length)
        }

        try {
          const nodeResult = await this.executeNode(node, context, edges)
          context[nodeId] = nodeResult
          nodeResults[nodeId] = nodeResult
          console.log(`节点 ${nodeId} 执行完成`)
        } catch (error: any) {
          console.error(`节点 ${nodeId} 执行失败:`, error)
          return {
            success: false,
            error: `节点 "${node.label}" 执行失败: ${error.message}`,
            nodeResults,
            executionOrder
          }
        }
      }

      // 返回最后一个节点的输出
      const lastNodeId = executionOrder[executionOrder.length - 1]
      const finalOutput = context[lastNodeId]

      return {
        success: true,
        output: {
          result: finalOutput,
          nodeOutputs: context,
          executionOrder
        },
        nodeResults,
        executionOrder
      }
    } catch (error: any) {
      console.error('工作流执行错误:', error)
      return {
        success: false,
        error: error.message || '未知错误'
      }
    }
  }

  /**
   * 构建节点执行顺序（拓扑排序 - Kahn算法）
   */
  private buildExecutionOrder(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
    // 如果没有边，按节点数组顺序执行
    if (!edges || edges.length === 0) {
      return nodes.map(node => node.id)
    }

    // 1. 计算每个节点的入度
    const inDegree = new Map<string, number>()
    const adjList = new Map<string, string[]>()

    // 初始化
    nodes.forEach(node => {
      inDegree.set(node.id, 0)
      adjList.set(node.id, [])
    })

    // 构建邻接表和入度表
    edges.forEach(edge => {
      const from = edge.source
      const to = edge.target

      if (adjList.has(from) && inDegree.has(to)) {
        adjList.get(from)!.push(to)
        inDegree.set(to, (inDegree.get(to) || 0) + 1)
      }
    })

    // 2. 找到所有入度为0的节点（起始节点）
    const queue: string[] = []
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId)
      }
    })

    // 3. Kahn算法：逐个移除入度为0的节点
    const result: string[] = []

    while (queue.length > 0) {
      const current = queue.shift()!
      result.push(current)

      // 遍历当前节点的所有邻接节点
      const neighbors = adjList.get(current) || []
      neighbors.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1
        inDegree.set(neighbor, newDegree)

        if (newDegree === 0) {
          queue.push(neighbor)
        }
      })
    }

    // 4. 检查是否存在循环依赖
    if (result.length !== nodes.length) {
      console.error('检测到循环依赖，无法执行工作流')
      console.error('已排序节点:', result)
      console.error('剩余节点:', nodes.filter(n => !result.includes(n.id)).map(n => n.id))
      return [] // 返回空数组表示失败
    }

    return result
  }

  /**
   * 执行单个节点
   */
  private async executeNode(
    node: WorkflowNode,
    context: ExecutionContext,
    edges: WorkflowEdge[]
  ): Promise<any> {
    switch (node.type) {
      case 'input':
        return this.executeInputNode(node, context)
      case 'llm':
        return this.executeLLMNode(node, context)
      case 'tool':
        return this.executeToolNode(node, context)
      case 'condition':
        // 使用增强版条件执行器
        return conditionExecutor.execute(node, context)
      case 'textTransform':
        return textTransformExecutor.execute(node, context)
      case 'templateRenderer':
        return templateRendererExecutor.execute(node, context)
      case 'httpRequest':
        return httpRequestExecutor.execute(node, context)
      case 'output':
        return this.executeOutputNode(node, context, edges)
      default:
        throw new Error(`未知节点类型: ${node.type}`)
    }
  }

  /**
   * 执行输入节点
   */
  private async executeInputNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    // 输入节点直接返回用户输入
    const config = node.config as any
    return context.input || config?.placeholder || ''
  }

  /**
   * 执行 LLM 节点
   */
  private async executeLLMNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const config = (node.config as any) || {}
    const {
      prompt,        // 旧格式：单一prompt
      userPrompt,    // 新格式：用户提示词
      systemPrompt,  // 新格式：系统提示词
      model,
      temperature = 0.7,
      maxTokens = 2000
    } = config

    // 支持新旧两种格式的prompt
    const finalUserPrompt = userPrompt || prompt

    if (!finalUserPrompt) {
      throw new Error('LLM 节点缺少 prompt 配置（需要 prompt 或 userPrompt）')
    }

    // 替换 prompt 中的变量
    const processedUserPrompt = this.replaceVariables(finalUserPrompt, context)
    const processedSystemPrompt = systemPrompt ? this.replaceVariables(systemPrompt, context) : undefined

    // 如果没有配置 API key，返回模拟结果
    if (!this.openai) {
      console.log('⚠️  没有配置 AI API Key，返回模拟结果')
      return `[模拟输出] 节点 "${node.label}" 的执行结果\n\nUser Prompt:\n${processedUserPrompt}\n\n${processedSystemPrompt ? `System Prompt:\n${processedSystemPrompt}\n\n` : ''}模型: ${model || 'gpt-4o-mini'}`
    }

    try {
      const mappedModel = this.mapModelName(model)
      console.log(`🤖 调用 ${this.provider === 'alibaba' ? '阿里云千问' : 'OpenAI'} API，模型: ${mappedModel}`)

      // 构建消息数组
      const messages: any[] = []

      // 添加系统提示词（如果有）
      if (processedSystemPrompt) {
        messages.push({
          role: 'system',
          content: processedSystemPrompt
        })
      }

      // 添加用户提示词
      messages.push({
        role: 'user',
        content: processedUserPrompt
      })

      // 调用 AI API（通过 OpenAI SDK，支持兼容的接口）
      const completion = await this.openai.chat.completions.create({
        model: mappedModel,
        messages,
        temperature: temperature as number,
        max_tokens: maxTokens as number
      })

      const result = completion.choices[0]?.message?.content || ''
      console.log(`✅ LLM 调用成功，返回 ${result.length} 个字符`)
      return result
    } catch (error: any) {
      console.error(`❌ ${this.provider === 'alibaba' ? '阿里云' : 'OpenAI'} API 调用失败:`, error)
      throw new Error(`LLM 调用失败: ${error.message}`)
    }
  }

  /**
   * 执行工具节点
   */
  private async executeToolNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const config = (node.config as any) || {}
    const { toolName, parameters = {} } = config

    if (!toolName) {
      throw new Error('工具节点缺少 toolName 配置')
    }

    // 从工具注册表获取工具
    const tool = toolRegistry.getTool(toolName)

    if (!tool) {
      console.warn(`工具 "${toolName}" 未注册，返回模拟结果`)
      return {
        tool: toolName,
        parameters,
        result: `工具 "${toolName}" 执行完成（模拟）`,
        note: '该工具未在系统中注册'
      }
    }

    try {
      console.log(`🔧 执行工具: ${toolName}`)

      // 处理参数中的变量替换
      const processedParameters = this.processToolParameters(parameters, context)

      // 执行工具
      const result = await tool.execute(processedParameters, {
        variables: context,
        workflowId: config.workflowId,
        executionId: config.executionId
      })

      if (!result.success) {
        throw new Error(result.error || '工具执行失败')
      }

      console.log(`✅ 工具 ${toolName} 执行成功`)

      // 返回工具的执行结果数据
      return result.data

    } catch (error: any) {
      console.error(`❌ 工具 ${toolName} 执行失败:`, error)
      throw new Error(`工具 "${toolName}" 执行失败: ${error.message}`)
    }
  }

  /**
   * 处理工具参数中的变量替换
   */
  private processToolParameters(parameters: Record<string, any>, context: ExecutionContext): Record<string, any> {
    const processed: Record<string, any> = {}

    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string') {
        // 字符串类型：替换变量
        processed[key] = this.replaceVariables(value, context)
      } else if (Array.isArray(value)) {
        // 数组类型：递归处理每个元素
        processed[key] = value.map(item => {
          if (typeof item === 'string') {
            return this.replaceVariables(item, context)
          } else if (typeof item === 'object' && item !== null) {
            return this.processToolParameters(item, context)
          }
          return item
        })
      } else if (typeof value === 'object' && value !== null) {
        // 对象类型：递归处理
        processed[key] = this.processToolParameters(value, context)
      } else {
        // 其他类型：直接复制
        processed[key] = value
      }
    }

    return processed
  }

  /**
   * 执行条件节点
   */
  private async executeConditionNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const { condition, trueOutput, falseOutput } = (node.config as any) || {}

    // 简单的条件判断（可以扩展为支持更复杂的表达式）
    try {
      // 替换条件中的变量
      const processedCondition = this.replaceVariables(condition, context)

      // 这里简化处理，实际应该有更安全的条件评估
      const result = processedCondition.includes('true')

      return result ? trueOutput : falseOutput
    } catch (error) {
      return falseOutput
    }
  }

  /**
   * 执行输出节点
   */
  private async executeOutputNode(node: WorkflowNode, context: ExecutionContext, edges: WorkflowEdge[]): Promise<any> {
    const { format } = (node.config as any) || {}

    // 通过edges找到连接到当前output节点的前一个节点
    const incomingEdge = edges.find(e => e.target === node.id)
    const previousNodeId = incomingEdge?.source

    let previousOutput
    if (previousNodeId && context[previousNodeId] !== undefined) {
      previousOutput = context[previousNodeId]
    } else {
      // 如果找不到，使用最后执行的节点输出
      const nodeIds = Object.keys(context).filter(key => key !== 'input' && key !== node.id)
      const lastNodeId = nodeIds[nodeIds.length - 1]
      previousOutput = context[lastNodeId]
    }

    // 根据格式处理输出
    switch (format) {
      case 'json':
        return typeof previousOutput === 'string'
          ? { result: previousOutput }
          : previousOutput
      case 'markdown':
        return `# 工作流执行结果\n\n${previousOutput}`
      case 'text':
      default:
        return previousOutput
    }
  }

  /**
   * 替换 prompt 中的变量
   * 支持格式:
   * - {{variable_name}} - 双大括号
   * - {{input.text}} - 嵌套属性
   * - {{step-1.output}} - 节点输出
   * - {variable_name} - 单大括号（兼容）
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

    // 替换单大括号变量 {...}（兼容旧格式）
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

  /**
   * 映射模型名称到实际的 API 模型
   */
  private mapModelName(model?: string): string {
    if (!model) {
      // 根据提供商返回默认模型
      if (this.provider === 'alibaba') {
        return process.env.ALIBABA_DEFAULT_MODEL || 'qwen-plus'
      }
      return 'gpt-4o-mini'
    }

    // 阿里云模型映射
    if (this.provider === 'alibaba') {
      const alibabaModelMap: { [key: string]: string } = {
        'GPT-4': 'qwen-max',
        'GPT-4o': 'qwen-max',
        'GPT-4o-mini': 'qwen-turbo',
        'GPT-3.5': 'qwen-turbo',
        'qwen-turbo': 'qwen-turbo',
        'qwen-plus': 'qwen-plus',
        'qwen-max': 'qwen-max',
        'qwen-max-longcontext': 'qwen-max-longcontext'
      }
      return alibabaModelMap[model] || 'qwen-plus'
    }

    // OpenAI 模型映射
    const openaiModelMap: { [key: string]: string } = {
      'GPT-4': 'gpt-4',
      'GPT-4o': 'gpt-4o',
      'GPT-4o-mini': 'gpt-4o-mini',
      'GPT-3.5': 'gpt-3.5-turbo',
      'gpt-4o-mini': 'gpt-4o-mini'
    }

    return openaiModelMap[model] || 'gpt-4o-mini'
  }
}
