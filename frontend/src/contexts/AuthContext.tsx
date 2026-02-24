import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, authService, LoginData, RegisterData } from '../services/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user

  // 检查认证状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const { user } = await authService.getProfile()
          setUser(user)
        }
      } catch (error: any) {
        console.error('检查认证状态失败:', error)
        // 只有明确的 401 才清除 token（token 无效/过期）
        // 网络错误、后端重启、500 等情况保留 token，下次刷新可恢复
        if (error?.response?.status === 401) {
          authService.logout()
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (data: LoginData) => {
    try {
      const response = await authService.login(data)
      authService.setToken(response.token)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await authService.register(data)
      authService.setToken(response.token)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      const { user } = await authService.getProfile()
      setUser(user)
    } catch (error) {
      console.error('刷新用户信息失败:', error)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}