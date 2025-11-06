export interface WorkflowNode {
  id: string
  type: 'input' | 'llm' | 'tool' | 'condition' | 'output'
  label: string
  position: {
    x: number
    y: number
  }
  config: Record<string, any>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface Workflow {
  id: string
  title: string
  description?: string
  thumbnail?: string
  isPublic: boolean
  isTemplate: boolean
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