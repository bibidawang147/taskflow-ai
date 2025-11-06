import { api } from './api'

// 工作流类型
export interface Workflow {
  id: string
  title: string
  description: string
  thumbnail?: string
  category: string
  tags: string[]
  version: string
  createdAt: string
  author?: {
    id: string
    name: string
    avatar?: string
  }
  _count?: {
    executions: number
    ratings: number
    favorites: number
  }
}

// 收藏工作流
export const favoriteWorkflow = async (workflowId: string): Promise<void> => {
  try {
    await api.post(`/api/workflows/${workflowId}/favorite`)
  } catch (error) {
    console.error('收藏工作流失败:', error)
    throw error
  }
}

// 取消收藏工作流
export const unfavoriteWorkflow = async (workflowId: string): Promise<void> => {
  try {
    await api.delete(`/api/workflows/${workflowId}/favorite`)
  } catch (error) {
    console.error('取消收藏工作流失败:', error)
    throw error
  }
}

// 获取用户收藏的工作流列表
export const getFavoriteWorkflows = async (): Promise<Workflow[]> => {
  try {
    const response = await api.get('/users/favorites')
    return response.data.workflows
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    throw error
  }
}

// 克隆工作流到用户账户
export interface CloneWorkflowResponse {
  message: string
  workflow: Workflow
  originalWorkflow?: {
    id: string
    title: string
    author: {
      id: string
      name: string
      avatar?: string
    }
  }
  isExisting?: boolean
}

export const cloneWorkflow = async (
  workflowId: string,
  customTitle?: string
): Promise<CloneWorkflowResponse> => {
  try {
    const response = await api.post(`/api/workflows/${workflowId}/clone`, {
      customTitle
    })
    return response.data
  } catch (error) {
    console.error('克隆工作流失败:', error)
    throw error
  }
}

// 获取用户创建的工作流
export const getUserWorkflows = async (): Promise<Workflow[]> => {
  try {
    const response = await api.get('/api/users/workflows')
    return response.data.workflows
  } catch (error) {
    console.error('获取用户工作流失败:', error)
    throw error
  }
}

// 获取公开工作流列表
export const getPublicWorkflows = async (params?: {
  page?: number
  limit?: number
  category?: string
  search?: string
}): Promise<{ workflows: Workflow[]; pagination: any }> => {
  try {
    const response = await api.get('/api/workflows', { params })
    return response.data
  } catch (error) {
    console.error('获取工作流列表失败:', error)
    throw error
  }
}

// 获取工作流详情
export const getWorkflowDetail = async (workflowId: string): Promise<Workflow> => {
  try {
    const response = await api.get(`/api/workflows/${workflowId}`)
    return response.data.workflow
  } catch (error) {
    console.error('获取工作流详情失败:', error)
    throw error
  }
}

// 创建工作流
export interface CreateWorkflowData {
  title: string
  description: string
  category?: string
  tags?: string[]
  config?: any
  isPublic?: boolean
}

export const createWorkflow = async (data: CreateWorkflowData): Promise<Workflow> => {
  try {
    const response = await api.post('/api/workflows', data)
    return response.data.workflow
  } catch (error) {
    console.error('创建工作流失败:', error)
    throw error
  }
}

// 更新工作流
export interface UpdateWorkflowData {
  title?: string
  description?: string
  category?: string
  tags?: string[]
  config?: any
  isPublic?: boolean
}

export const updateWorkflow = async (
  workflowId: string,
  data: UpdateWorkflowData
): Promise<Workflow> => {
  try {
    const response = await api.put(`/api/workflows/${workflowId}`, data)
    return response.data.workflow
  } catch (error) {
    console.error('更新工作流失败:', error)
    throw error
  }
}

// 删除工作流
export const deleteWorkflow = async (workflowId: string): Promise<void> => {
  try {
    await api.delete(`/api/workflows/${workflowId}`)
  } catch (error) {
    console.error('删除工作流失败:', error)
    throw error
  }
}

// 运行工作流
export interface RunWorkflowInput {
  [key: string]: any
}

export interface WorkflowExecutionResult {
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed'
  input: RunWorkflowInput
  output?: any
  error?: string
  startedAt: string
  completedAt?: string
}

export const runWorkflow = async (
  workflowId: string,
  input: RunWorkflowInput
): Promise<WorkflowExecutionResult> => {
  try {
    const response = await api.post(`/api/workflows/${workflowId}/execute`, { input })
    return response.data.execution
  } catch (error) {
    console.error('运行工作流失败:', error)
    throw error
  }
}

// 获取工作流执行结果
export const getWorkflowExecution = async (executionId: string): Promise<WorkflowExecutionResult> => {
  try {
    const response = await api.get(`/api/workflows/executions/${executionId}`)
    return response.data.execution
  } catch (error) {
    console.error('获取执行结果失败:', error)
    throw error
  }
}
