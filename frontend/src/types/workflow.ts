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
  content?: string  // 资源内容（内嵌展示）
}

// ========== GuideBlock 类型（新的引导块格式）==========

export interface GuideBlockText {
  id: string
  type: 'text'
  text: string
}

export interface GuideBlockTool {
  id: string
  type: 'tool'
  tool: StepTool
}

export interface GuideBlockPrompt {
  id: string
  type: 'prompt'
  prompt: string
}

export interface GuideBlockResource {
  id: string
  type: 'resource'
  resource: RelatedResource
}

export interface GuideBlockMedia {
  id: string
  type: 'media'
  media: DemonstrationMedia
}

export type GuideBlock =
  | GuideBlockText
  | GuideBlockTool
  | GuideBlockPrompt
  | GuideBlockResource
  | GuideBlockMedia

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
  guideBlocks?: GuideBlock[]      // 引导块（新格式，按顺序渲染）
  tools?: StepTool[]              // 工具/链接（旧格式，向后兼容）
  promptTemplate?: string         // 提示词模板（旧格式）
  demonstrationMedia?: DemonstrationMedia[]  // 图示/视频演示（旧格式）
  relatedResources?: RelatedResource[]       // 相关资源（旧格式）
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

// ========== 节点类型 ==========

export interface WorkflowNode {
  id: string
  type: 'input' | 'llm' | 'tool' | 'condition' | 'output' | 'step'
  label: string
  position: {
    x: number
    y: number
  }
  config: Record<string, any>
  stepDetail?: WorkflowStepDetail  // 步骤详情（可选）
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

// 难度级别
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

export interface Workflow {
  id: string
  title: string
  description?: string
  thumbnail?: string
  isPublic: boolean
  isTemplate: boolean
  isDraft?: boolean
  category?: string
  tags: string[]
  config: {
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
  }
  version: string
  authorId: string
  createdAt: string
  updatedAt: string

  // 扩展字段
  difficultyLevel?: DifficultyLevel  // 难度级别
  useScenarios?: string[]            // 适用场景
  preparations?: WorkflowPreparation[] // 前置准备项
}

export interface WorkflowExecution {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  input?: any
  output?: any
  error?: string
  duration?: number
  startedAt: string
  completedAt?: string
  userId: string
  workflowId: string
}

export interface ExecutionStep {
  id: string
  stepIndex: number
  nodeId: string
  nodeType: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  input?: any
  output?: any
  error?: string
  duration?: number
  startedAt: string
  completedAt?: string
}