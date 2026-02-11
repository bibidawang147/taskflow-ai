import { useState, useEffect } from 'react'
import { authService } from '../services/auth'
import { API_BASE_URL } from '../services/api'

interface SubscriptionInfo {
  role: string
  roleExpiresAt: string | null
  daysRemaining: number
}

const ROLE_LEVEL: Record<string, number> = {
  free: 0,
  pro: 1,
  creator: 2,
  admin: 99
}

export function usePermission() {
  const [role, setRole] = useState<string>('free')
  const [daysRemaining, setDaysRemaining] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const token = authService.getToken()
        if (!token) {
          setLoading(false)
          return
        }
        const res = await fetch(`${API_BASE_URL}/api/promo/subscription`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data: SubscriptionInfo = await res.json()
          setRole(data.role)
          setDaysRemaining(data.daysRemaining)
        } else {
          // 请求失败：记录错误并降级为 free
          console.error('[usePermission] 获取订阅信息失败:', res.status, res.statusText)
          setRole('free')
          setDaysRemaining(0)
        }
      } catch (error) {
        // 网络错误或其他异常：记录错误并降级为 free
        console.error('[usePermission] 获取订阅信息异常:', error)
        setRole('free')
        setDaysRemaining(0)
      } finally {
        setLoading(false)
      }
    }
    fetchRole()
  }, [])

  const hasRole = (required: string) => {
    return (ROLE_LEVEL[role] ?? 0) >= (ROLE_LEVEL[required] ?? 0)
  }

  return {
    role,
    daysRemaining,
    loading,
    isPro: hasRole('pro'),
    isCreator: hasRole('creator'),
    isAdmin: hasRole('admin'),
    isFree: role === 'free',

    // 具体权限
    canPublish: hasRole('pro'),
    canReplicate: hasRole('pro'),
    canViewFullPrompt: hasRole('pro'),
    canCreateCollection: hasRole('creator'),
    canAccessAdmin: hasRole('admin'),

    // 用量相关（Free 有限制）
    aiConvertLimit: role === 'free' ? 5 : role === 'pro' ? 200 : 999,

    // 画布数量限制
    maxCanvases: role === 'free' ? 1 : role === 'pro' ? 10 : 999,
  }
}
