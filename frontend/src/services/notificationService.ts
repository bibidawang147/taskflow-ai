import api from './api'

export interface UpdateNotification {
  id: string
  userId: string
  workflowId: string
  versionId: string
  type: 'workflow_update' | 'major_update' | 'deprecation'
  title: string
  message: string | null
  isRead: boolean
  readAt: string | null
  isDismissed: boolean
  dismissedAt: string | null
  createdAt: string
  workflow: {
    id: string
    title: string
    thumbnail: string | null
    author: {
      id: string
      name: string
      avatar: string | null
    }
  }
  version: {
    id: string
    version: string
    changelog: string | null
    changeType: string
  }
}

export interface NotificationListResponse {
  notifications: UpdateNotification[]
  unreadCount: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const notificationService = {
  // 获取通知列表
  async getNotifications(params?: {
    page?: number
    limit?: number
    unreadOnly?: boolean
    type?: string
  }): Promise<NotificationListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true')
    if (params?.type) queryParams.append('type', params.type)

    const response = await api.get(`/notifications?${queryParams.toString()}`)
    return response.data
  },

  // 获取未读数量
  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count')
    return response.data.count
  },

  // 标记为已读
  async markAsRead(id: string): Promise<UpdateNotification> {
    const response = await api.patch(`/notifications/${id}/read`)
    return response.data
  },

  // 标记全部已读
  async markAllAsRead(): Promise<{ updatedCount: number }> {
    const response = await api.post('/notifications/read-all')
    return response.data
  },

  // 忽略通知
  async dismiss(id: string): Promise<UpdateNotification> {
    const response = await api.patch(`/notifications/${id}/dismiss`)
    return response.data
  },

  // 删除通知
  async delete(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`)
  },

  // 获取某工作流的通知
  async getWorkflowNotifications(workflowId: string): Promise<UpdateNotification[]> {
    const response = await api.get(`/notifications/workflow/${workflowId}`)
    return response.data
  }
}

export default notificationService
