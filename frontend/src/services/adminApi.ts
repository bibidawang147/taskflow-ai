import { api } from './api'

// ==================== 类型定义 ====================

export interface AdminStats {
  users: {
    total: number
    pro: number
    creators: number
    recentNew: number
  }
  workflows: {
    total: number
    public: number
    recentNew: number
  }
  inviteCodes: {
    total: number
    used: number
  }
}

export interface InviteCode {
  id: string
  code: string
  type: 'beta_tester' | 'creator'
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  isActive: boolean
  note: string | null
  createdBy: string
  createdAt: string
  usages: InviteCodeUsage[]
}

export interface InviteCodeUsage {
  id: string
  userId: string
  usedAt: string
  grantedTier: string | null
  grantedTierDays: number | null
  grantedCreator: boolean
  user: {
    id: string
    name: string
    email: string
  }
}

export interface AdminUser {
  id: string
  name: string
  email: string
  avatar: string | null
  tier: string
  isAdmin: boolean
  isCreator: boolean
  creatorStatus: string | null
  createdAt: string
  _count: {
    workflows: number
    executions: number
  }
}

// ==================== API 方法 ====================

// 获取统计数据
export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await api.get('/api/admin/stats')
  return response.data
}

// 生成邀请码
export const createInviteCodes = async (params: {
  type: 'beta_tester' | 'creator'
  count?: number
  maxUses?: number
  expiresInDays?: number
  note?: string
}): Promise<{ message: string; codes: InviteCode[] }> => {
  const response = await api.post('/api/admin/invite-codes', params)
  return response.data
}

// 获取邀请码列表
export const getInviteCodes = async (params?: {
  type?: string
  isActive?: boolean
  page?: number
  limit?: number
}): Promise<{ total: number; codes: InviteCode[] }> => {
  const response = await api.get('/api/admin/invite-codes', { params })
  return response.data
}

// 更新邀请码
export const updateInviteCode = async (
  id: string,
  data: { isActive?: boolean; note?: string }
): Promise<{ message: string; code: InviteCode }> => {
  const response = await api.patch(`/api/admin/invite-codes/${id}`, data)
  return response.data
}

// 删除邀请码
export const deleteInviteCode = async (id: string): Promise<void> => {
  await api.delete(`/api/admin/invite-codes/${id}`)
}

// 获取用户列表
export const getAdminUsers = async (params?: {
  search?: string
  tier?: string
  isCreator?: boolean
  page?: number
  limit?: number
}): Promise<{ total: number; users: AdminUser[] }> => {
  const response = await api.get('/api/admin/users', { params })
  return response.data
}

// 更新用户
export const updateAdminUser = async (
  id: string,
  data: { tier?: string; isCreator?: boolean; isAdmin?: boolean }
): Promise<{ message: string; user: AdminUser }> => {
  const response = await api.patch(`/api/admin/users/${id}`, data)
  return response.data
}

// 删除用户
export const deleteAdminUser = async (id: string): Promise<void> => {
  await api.delete(`/api/admin/users/${id}`)
}

// 使用邀请码（用户端）
export const useInviteCode = async (code: string): Promise<{
  success: boolean
  message: string
  granted: {
    tier: string | null
    tierDays: number | null
    creator: boolean
  }
}> => {
  const response = await api.post('/api/admin/use-invite-code', { code })
  return response.data
}
