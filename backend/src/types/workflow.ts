// ========== 步骤详情相关类型 ==========

// 工具/链接
export interface StepTool {
  name: string
  url?: string
  description?: string
}

// 演示媒体（图片或视频）
export interface DemonstrationMedia {
  type: 'image' | 'video'
  url: string
  caption?: string
}

// 相关资源
export interface RelatedResource {
  title: string
  type: 'file' | 'link'
  url: string
  description?: string
}

// 下一步指向配置
export interface NextStepConfig {
  type: 'default' | 'conditional'
  conditions?: Array<{
    label: string
    targetNodeId: string
  }>
}

// 步骤详情（扩展节点信息）
export interface WorkflowStepDetail {
  id: string
  nodeId: string
  stepDescription?: string        // 步骤说明
  expectedResult?: string         // 预期结果
  tools?: StepTool[]              // 工具/链接
  promptTemplate?: string         // 提示词模板
  demonstrationMedia?: DemonstrationMedia[]  // 图示/视频演示
  relatedResources?: RelatedResource[]       // 相关资源
  referencedWorkflowId?: string   // 引用工作流ID
  nextStepConfig?: NextStepConfig // 下一步指向配置
  createdAt?: string
  updatedAt?: string
}

// 前置准备项
export interface WorkflowPreparation {
  id: string
  workflowId: string
  name: string          // 准备项名称
  description?: string  // 说明
  link?: string         // 相关链接
  order: number         // 排序
  createdAt?: string
  updatedAt?: string
}

// 难度级别
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

// ========== 节点类型定义 ==========

export type NodeType =
  // 基础节点
  | 'input'
  | 'output'
  | 'llm'
  | 'tool'
  | 'step'  // 新增：教程步骤类型
  // 数据处理类
  | 'textTransform'
  | 'jsonProcessor'
  | 'templateRenderer'
  // 流程控制类
  | 'condition'
  | 'loop'
  | 'delay'
  // 外部集成类
  | 'httpRequest'
  | 'webScraper'
  // AI增强类
  | 'imageGeneration'
  | 'visionAnalysis'
  | 'speechToText'
  // 数据存储类
  | 'variable'
  | 'dataCollector'

// ========== 节点配置接口 ==========

// TextTransform 节点配置
export interface TextTransformConfig {
  operation: 'uppercase' | 'lowercase' | 'trim' | 'replace' | 'extract' | 'split'
  inputVariable: string
  pattern?: string // 用于 replace 和 extract
  replacement?: string // 用于 replace
  separator?: string // 用于 split
  outputVariable?: string
}

// JSONProcessor 节点配置
export interface JSONProcessorConfig {
  operation: 'parse' | 'stringify' | 'extract' | 'merge'
  inputVariable: string
  path?: string // JSONPath 表达式
  outputVariable?: string
}

// TemplateRenderer 节点配置
export interface TemplateRendererConfig {
  template: string // 支持 {{variable}} 语法
  outputVariable?: string
}

// Condition 节点配置（增强版）
export interface ConditionConfig {
  variable: string
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith' | 'matches' | 'exists'
  value?: string
  trueOutput?: string
  falseOutput?: string
  outputVariable?: string
}

// Loop 节点配置
export interface LoopConfig {
  type: 'forEach' | 'repeat'
  inputArray?: string // type=forEach 时使用
  itemVariable?: string // 循环项的变量名
  indexVariable?: string // 索引变量名
  count?: number // type=repeat 时使用
  maxIterations?: number // 安全限制，默认100
  outputVariable?: string
}

// Delay 节点配置
export interface DelayConfig {
  duration: number
  unit: 'ms' | 'seconds' | 'minutes'
}

// HTTPRequest 节点配置
export interface HTTPRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string // 支持变量替换
  headers?: Record<string, string>
  body?: string // JSON 字符串，支持变量
  timeout?: number // 默认30000ms
  outputVariable?: string
}

// WebScraper 节点配置
export interface WebScraperConfig {
  url: string
  selector: string // CSS 选择器
  attribute?: string // 'text', 'href', 'src' 等
  multiple?: boolean // 是否提取多个元素
  outputVariable?: string
}

// ImageGeneration 节点配置
export interface ImageGenerationConfig {
  provider: 'qwen-image' | 'dalle'
  prompt: string
  size?: '512x512' | '1024x1024' | '1792x1024'
  quality?: 'standard' | 'hd'
  outputVariable?: string
}

// VisionAnalysis 节点配置
export interface VisionAnalysisConfig {
  provider: 'qwen-vision' | 'gpt-4-vision'
  imageVariable: string // 图像 URL 或 base64
  prompt: string
  outputVariable?: string
}

// SpeechToText 节点配置
export interface SpeechToTextConfig {
  audioVariable: string
  language?: string
  outputVariable?: string
}

// Variable 节点配置
export interface VariableConfig {
  name: string
  value: string // 支持变量引用
  operation?: 'set' | 'append' | 'increment'
}

// DataCollector 节点配置
export interface DataCollectorConfig {
  inputs: string[] // 多个变量名
  outputVariable?: string
}

// ========== 统一节点接口 ==========

export interface WorkflowNode {
  id: string
  type: NodeType
  label: string
  position: {
    x: number
    y: number
  }
  config: Record<string, any> | TextTransformConfig | JSONProcessorConfig |
          TemplateRendererConfig | ConditionConfig | LoopConfig | DelayConfig |
          HTTPRequestConfig | WebScraperConfig | ImageGenerationConfig |
          VisionAnalysisConfig | SpeechToTextConfig | VariableConfig | DataCollectorConfig
  stepDetail?: WorkflowStepDetail  // 步骤详情（可选）
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string // 用于条件节点的 true/false 分支
  targetHandle?: string
}

export interface WorkflowConfig {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

// ========== 节点执行器接口 ==========

export interface ExecutionContext {
  [key: string]: any
  input?: any // 初始输入
}

export interface ExecutionResult {
  success: boolean
  output?: any
  error?: string
  logs?: string[]
}

export interface NodeExecutor {
  execute(node: WorkflowNode, context: ExecutionContext): Promise<any>
}
