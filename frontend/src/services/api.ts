import axios from 'axios'

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL !== undefined)
    ? import.meta.env.VITE_API_BASE_URL
    : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:3000')

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 增加到 120 秒，支持较长的 AI 响应时间
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理认证错误
// 用标记防止多个并发 401 同时触发重复跳转
let isRedirecting = false

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 只有当请求确实携带了 token 时才清除（说明 token 已失效）
      // 避免未登录状态下的 401 误删新 token
      const requestHadToken = error.config?.headers?.Authorization
      if (requestHadToken) {
        localStorage.removeItem('token')
      }

      // 防止多个并发请求同时 401 导致重复跳转
      if (!isRedirecting) {
        const currentPath = window.location.pathname
        const publicPaths = ['/explore', '/workflow-intro', '/solution', '/community', '/forgot-password', '/reset-password']
        const isPublicPath = publicPaths.some(path => currentPath.startsWith(path))
            || currentPath === '/'

        if (!isPublicPath && currentPath !== '/login' && currentPath !== '/register') {
          isRedirecting = true
          window.location.href = '/login'
          setTimeout(() => { isRedirecting = false }, 3000)
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
