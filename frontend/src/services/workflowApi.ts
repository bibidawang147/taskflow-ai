import { api } from './api'
import type {
  WorkflowPreparation,
  WorkflowStepDetail,
  StepTool,
  DemonstrationMedia,
  RelatedResource,
  NextStepConfig,
  DifficultyLevel
} from '../types/workflow'

// 工作流类型
export interface Workflow {
  id: string
  title: string
  description: string
  thumbnail?: string
  category: string
  tags: string[] | string
  version: string
  createdAt: string
  config?: {
    nodes?: any[]
    [key: string]: any
  }
  nodes?: any[]
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
  // 前端计算的字段
  isOwner?: boolean  // 是否是当前用户创建的
  canEdit?: boolean  // 是否可以编辑
  isPublic?: boolean  // 是否公开
  isDraft?: boolean  // 是否是草稿
  associatedSolutions?: string[]  // 关联的工作包ID列表
  associatedThemes?: string[]  // 关联的主题ID列表
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
    const response = await api.get('/api/users/favorites')
    return response.data.workflows
  } catch (error) {
    console.warn('获取收藏列表失败 (非关键错误):', error)
    return [] // 返回空数组而不是抛出错误
  }
}

// 检查工作流是否已收藏
export const checkIsFavorited = async (workflowId: string): Promise<boolean> => {
  try {
    const favorites = await getFavoriteWorkflows()
    return favorites.some(workflow => workflow.id === workflowId)
  } catch (error) {
    console.warn('检查收藏状态失败:', error)
    return false
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

// 获取公开工作流列表（用于推荐系统）
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

// 保存工作流为草稿
export interface SaveDraftData {
  title?: string
  description?: string
  category?: string
  tags?: string[]
  config?: any
  isDraft: true
}

export const saveDraft = async (
  workflowId: string,
  data: SaveDraftData
): Promise<Workflow> => {
  try {
    const response = await api.put(`/api/workflows/${workflowId}`, {
      ...data,
      isDraft: true
    })
    return response.data.workflow
  } catch (error) {
    console.error('保存草稿失败:', error)
    throw error
  }
}

// 创建新的草稿工作流
export const createDraft = async (data: CreateWorkflowData): Promise<Workflow> => {
  try {
    const response = await api.post('/api/workflows', {
      ...data,
      isDraft: true
    })
    return response.data.workflow
  } catch (error) {
    console.error('创建草稿失败:', error)
    throw error
  }
}

// 将草稿转为正式工作流（保存）
export const saveDraftAsWorkflow = async (
  workflowId: string,
  data?: UpdateWorkflowData
): Promise<Workflow> => {
  try {
    const response = await api.put(`/api/workflows/${workflowId}`, {
      ...data,
      isDraft: false
    })
    return response.data.workflow
  } catch (error) {
    console.error('保存工作流失败:', error)
    throw error
  }
}

// 发布工作流（预留接口，下一版本实现）
export interface PublishWorkflowData {
  title?: string
  description?: string
  category?: string
  tags?: string[]
  visibility?: 'public' | 'private' | 'unlisted'
  allowFork?: boolean
  license?: string
}

export const publishWorkflow = async (
  workflowId: string,
  data: PublishWorkflowData
): Promise<{
  workflow: Workflow
  publishedUrl?: string
  message: string
}> => {
  try {
    const response = await api.post(`/api/workflows/${workflowId}/publish`, data)
    return response.data
  } catch (error) {
    console.error('发布工作流失败:', error)
    throw error
  }
}

// 取消发布工作流（预留接口）
export const unpublishWorkflow = async (workflowId: string): Promise<void> => {
  try {
    await api.post(`/api/workflows/${workflowId}/unpublish`)
  } catch (error) {
    console.error('取消发布失败:', error)
    throw error
  }
}

// ==================== 执行历史记录 ====================

// 执行历史记录类型
export interface ExecutionHistory {
  id: string
  workflowId: string | null  // 孤岛记录时为 null
  workflowTitle: string
  workflowCategory?: string
  isTemporary?: boolean  // 是否为临时执行(孤岛记录)
  description?: string  // 执行描述
  status: 'pending' | 'running' | 'completed' | 'failed'
  input: any
  output?: any
  error?: string
  duration?: number // 执行时长（毫秒）
  startedAt: string
  completedAt?: string
  isFavorite?: boolean // 是否收藏
  notes?: string // 用户备注
}

// 获取执行历史列表
export interface GetExecutionHistoryParams {
  workflowId?: string // 筛选特定工作流
  status?: 'completed' | 'failed' // 筛选状态
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'duration' // 排序方式
  sortOrder?: 'asc' | 'desc'
}

export const getExecutionHistory = async (
  params?: GetExecutionHistoryParams
): Promise<{
  executions: ExecutionHistory[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> => {
  try {
    const response = await api.get('/api/workflows/executions', { params })
    return response.data
  } catch (error) {
    console.error('获取执行历史失败:', error)
    throw error
  }
}

// 获取单个执行历史详情
export const getExecutionHistoryDetail = async (
  executionId: string
): Promise<ExecutionHistory> => {
  try {
    const response = await api.get(`/api/workflows/executions/${executionId}`)
    return response.data.execution
  } catch (error) {
    console.error('获取执行历史详情失败:', error)
    throw error
  }
}

// 临时执行(不关联工作流)
export interface TempExecuteParams {
  title?: string
  description?: string
  config: any  // 节点配置
  input?: any
}

export const executeTempWorkflow = async (params: TempExecuteParams): Promise<{ id: string; status: string }> => {
  try {
    const response = await api.post('/api/workflows/execute-temp', params)
    return response.data.execution
  } catch (error) {
    console.error('临时执行失败:', error)
    throw error
  }
}

// 删除执行历史
export const deleteExecutionHistory = async (executionId: string): Promise<void> => {
  try {
    await api.delete(`/api/workflows/executions/${executionId}`)
  } catch (error) {
    console.error('删除执行历史失败:', error)
    throw error
  }
}

// 收藏执行结果
export const favoriteExecution = async (executionId: string): Promise<void> => {
  try {
    await api.post(`/api/workflows/executions/${executionId}/favorite`)
  } catch (error) {
    console.error('收藏执行结果失败:', error)
    throw error
  }
}

// 取消收藏执行结果
export const unfavoriteExecution = async (executionId: string): Promise<void> => {
  try {
    await api.delete(`/api/workflows/executions/${executionId}/favorite`)
  } catch (error) {
    console.error('取消收藏失败:', error)
    throw error
  }
}

// 添加执行备注
export const updateExecutionNotes = async (
  executionId: string,
  notes: string
): Promise<void> => {
  try {
    await api.put(`/api/workflows/executions/${executionId}/notes`, { notes })
  } catch (error) {
    console.error('更新备注失败:', error)
    throw error
  }
}

// 重新执行（使用相同的输入）
export const reExecuteWorkflow = async (
  executionId: string
): Promise<WorkflowExecutionResult> => {
  try {
    const response = await api.post(`/api/workflows/executions/${executionId}/rerun`)
    return response.data.execution
  } catch (error) {
    console.error('重新执行失败:', error)
    throw error
  }
}

// 用户数据统计类型
export interface UserDataStats {
  summary: {
    workflows: number
    executions: number
    favorites: number
    hasLayout: boolean
  }
  details: {
    workflowsByStatus: Array<{
      isPublic: boolean
      isDraft: boolean
      _count: number
    }>
    executionsByStatus: Array<{
      status: string
      _count: number
    }>
  }
}

// 获取用户数据统计
export const getUserDataStats = async (): Promise<UserDataStats> => {
  try {
    const response = await api.get('/api/users/data-stats')
    return response.data
  } catch (error) {
    console.error('获取用户数据统计失败:', error)
    throw error
  }
}

// ==================== 前置准备 API ====================

// 获取工作流的前置准备列表
export const getPreparations = async (workflowId: string): Promise<WorkflowPreparation[]> => {
  try {
    const response = await api.get(`/api/workflows/${workflowId}/preparations`)
    return response.data.preparations
  } catch (error) {
    console.error('获取前置准备列表失败:', error)
    throw error
  }
}

// 添加前置准备项
export const addPreparation = async (
  workflowId: string,
  data: { name: string; description?: string; link?: string }
): Promise<WorkflowPreparation> => {
  try {
    const response = await api.post(`/api/workflows/${workflowId}/preparations`, data)
    return response.data.preparation
  } catch (error) {
    console.error('添加前置准备失败:', error)
    throw error
  }
}

// 批量设置前置准备项（替换所有）
export const setPreparations = async (
  workflowId: string,
  preparations: Array<{ name: string; description?: string; link?: string }>
): Promise<WorkflowPreparation[]> => {
  try {
    const response = await api.put(`/api/workflows/${workflowId}/preparations`, { preparations })
    return response.data.preparations
  } catch (error) {
    console.error('批量设置前置准备失败:', error)
    throw error
  }
}

// 更新单个前置准备项
export const updatePreparation = async (
  workflowId: string,
  prepId: string,
  data: { name?: string; description?: string; link?: string; order?: number }
): Promise<WorkflowPreparation> => {
  try {
    const response = await api.put(`/api/workflows/${workflowId}/preparations/${prepId}`, data)
    return response.data.preparation
  } catch (error) {
    console.error('更新前置准备失败:', error)
    throw error
  }
}

// 删除前置准备项
export const deletePreparation = async (workflowId: string, prepId: string): Promise<void> => {
  try {
    await api.delete(`/api/workflows/${workflowId}/preparations/${prepId}`)
  } catch (error) {
    console.error('删除前置准备失败:', error)
    throw error
  }
}

// ==================== 步骤详情 API ====================

// 获取节点的步骤详情
export const getStepDetail = async (
  workflowId: string,
  nodeId: string
): Promise<WorkflowStepDetail | null> => {
  try {
    const response = await api.get(`/api/workflows/${workflowId}/nodes/${nodeId}/step-detail`)
    return response.data.stepDetail
  } catch (error) {
    console.error('获取步骤详情失败:', error)
    throw error
  }
}

// 创建或更新步骤详情
export interface SaveStepDetailData {
  stepDescription?: string
  expectedResult?: string
  tools?: StepTool[]
  promptTemplate?: string
  demonstrationMedia?: DemonstrationMedia[]
  relatedResources?: RelatedResource[]
  referencedWorkflowId?: string
  nextStepConfig?: NextStepConfig
}

export const saveStepDetail = async (
  workflowId: string,
  nodeId: string,
  data: SaveStepDetailData
): Promise<WorkflowStepDetail> => {
  try {
    const response = await api.post(`/api/workflows/${workflowId}/nodes/${nodeId}/step-detail`, data)
    return response.data.stepDetail
  } catch (error) {
    console.error('保存步骤详情失败:', error)
    throw error
  }
}

// 删除步骤详情
export const deleteStepDetail = async (workflowId: string, nodeId: string): Promise<void> => {
  try {
    await api.delete(`/api/workflows/${workflowId}/nodes/${nodeId}/step-detail`)
  } catch (error) {
    console.error('删除步骤详情失败:', error)
    throw error
  }
}

// ==================== 完整工作流 API ====================

// 完整工作流类型（含前置准备和步骤详情）
export interface FullWorkflow extends Workflow {
  preparations?: WorkflowPreparation[]
  difficultyLevel?: DifficultyLevel
  useScenarios?: string[]
  nodes?: Array<{
    id: string
    type: string
    label: string
    position: { x: number; y: number }
    config: any
    stepDetail?: WorkflowStepDetail
  }>
}

// 获取工作流完整详情（含前置准备和步骤详情）
export const getFullWorkflow = async (workflowId: string): Promise<FullWorkflow> => {
  try {
    const response = await api.get(`/api/workflows/${workflowId}/full`)
    return response.data.workflow
  } catch (error) {
    console.error('获取工作流完整详情失败:', error)
    throw error
  }
}

// 导出类型供外部使用
export type {
  WorkflowPreparation,
  WorkflowStepDetail,
  StepTool,
  DemonstrationMedia,
  RelatedResource,
  NextStepConfig,
  DifficultyLevel
}
