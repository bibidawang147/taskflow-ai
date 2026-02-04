import api from './api'

export interface WorkflowVersion {
  id: string
  workflowId: string
  version: string
  title: string
  description: string | null
  config: any
  changelog: string | null
  changeType: 'major' | 'minor' | 'patch'
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
}

export interface VersionListResponse {
  currentVersion: string
  versions: WorkflowVersion[]
}

export const versionService = {
  // 获取版本历史
  async getVersions(workflowId: string): Promise<VersionListResponse> {
    const response = await api.get(`/workflows/${workflowId}/versions`)
    return response.data
  },

  // 获取特定版本详情
  async getVersion(workflowId: string, versionId: string): Promise<WorkflowVersion> {
    const response = await api.get(`/workflows/${workflowId}/versions/${versionId}`)
    return response.data
  },

  // 创建新版本（草稿）
  async createVersion(
    workflowId: string,
    data: {
      version?: string
      changelog?: string
      changeType?: 'major' | 'minor' | 'patch'
    }
  ): Promise<{ version: WorkflowVersion; message: string }> {
    const response = await api.post(`/workflows/${workflowId}/versions`, data)
    return response.data
  },

  // 发布版本
  async publishVersion(
    workflowId: string,
    versionId: string,
    data?: {
      notifySubscribers?: boolean
      notificationMessage?: string
    }
  ): Promise<{ version: WorkflowVersion; notificationsCount: number; message: string }> {
    const response = await api.post(
      `/workflows/${workflowId}/versions/${versionId}/publish`,
      data || {}
    )
    return response.data
  },

  // 删除草稿版本
  async deleteVersion(workflowId: string, versionId: string): Promise<void> {
    await api.delete(`/workflows/${workflowId}/versions/${versionId}`)
  },

  // 回滚到特定版本
  async rollbackVersion(
    workflowId: string,
    versionId: string
  ): Promise<{ workflow: any; message: string }> {
    const response = await api.post(`/workflows/${workflowId}/versions/${versionId}/rollback`)
    return response.data
  },

  // 计算下一个版本号
  getNextVersion(currentVersion: string, changeType: 'major' | 'minor' | 'patch'): string {
    const parts = currentVersion.split('.').map(Number)
    if (changeType === 'major') {
      parts[0]++
      parts[1] = 0
      parts[2] = 0
    } else if (changeType === 'minor') {
      parts[1]++
      parts[2] = 0
    } else {
      parts[2]++
    }
    return parts.join('.')
  }
}

export default versionService
