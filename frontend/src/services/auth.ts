import api from './api'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  referralCode?: string
}

export interface AuthResponse {
  user: User
  token: string
  message: string
}

export const authService = {
  // 注册
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/register', data)
    return response.data
  },

  // 登录
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', data)
    return response.data
  },

  // 获取用户信息
  getProfile: async (): Promise<{ user: User }> => {
    const response = await api.get('/api/auth/profile')
    return response.data
  },

  // 登出
  logout: (): void => {
    localStorage.removeItem('token')
  },

  // 检查是否已登录（含 token 过期检测）
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token')
    if (!token) return false
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token')
        return false
      }
      return true
    } catch {
      return true // token 格式异常时不阻断，交由后端校验
    }
  },

  // 获取存储的令牌
  getToken: (): string | null => {
    return localStorage.getItem('token')
  },

  // 存储令牌
  setToken: (token: string): void => {
    localStorage.setItem('token', token)
  },

  // 获取微信授权链接
  getWechatAuthUrl: async (): Promise<{ url: string; state: string }> => {
    const response = await api.get('/api/auth/wechat/url')
    return response.data
  },

  // 微信登录回调（用 code 换 JWT）
  wechatLogin: async (code: string): Promise<AuthResponse> => {
    const response = await api.get(`/api/auth/wechat/callback?code=${encodeURIComponent(code)}`)
    return response.data
  },

  // 获取微信绑定授权链接
  getWechatBindUrl: async (): Promise<{ url: string; state: string }> => {
    const response = await api.get('/api/auth/wechat/url?mode=bind')
    return response.data
  },

  // 检查邮箱是否已注册
  checkEmail: async (email: string): Promise<{ registered: boolean; name: string | null }> => {
    const response = await api.get(`/api/auth/check-email?email=${encodeURIComponent(email)}`)
    return response.data
  },

  // 绑定微信（用 code，可能返回需要确认）
  bindWechat: async (code: string): Promise<any> => {
    const response = await api.post('/api/auth/bind/wechat', { code })
    return response.data
  },

  // 确认绑定微信（合并）
  confirmBindWechat: async (wxDataToken: string): Promise<{ merged: boolean; message: string; token: string }> => {
    const response = await api.post('/api/auth/bind/wechat/confirm', { wxDataToken })
    return response.data
  },

  // 绑定邮箱（密码可选，已注册邮箱需要密码验证）
  bindEmail: async (data: { email: string; password?: string; name?: string }): Promise<{ merged: boolean; message: string; token: string }> => {
    const response = await api.post('/api/auth/bind/email', data)
    return response.data
  },

  // 忘记密码 - 发送重置邮件
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/api/auth/forgot-password', { email })
    return response.data
  },

  // 重置密码
  resetPassword: async (data: { token: string; email: string; password: string }): Promise<{ message: string }> => {
    const response = await api.post('/api/auth/reset-password', data)
    return response.data
  },
}