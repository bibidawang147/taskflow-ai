import axios from 'axios'

const API_BASE_URL =
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除无效的令牌
      localStorage.removeItem('token')
      // 只在需要认证的页面才重定向到登录页面
      // 对于探索页面等公开页面，只记录错误而不重定向
      const currentPath = window.location.pathname
      const publicPaths = ['/explore', '/', '/workflow-intro', '/solution', '/community']
      const isPublicPath = publicPaths.some(path => currentPath.startsWith(path) || currentPath === path)

      if (!isPublicPath && currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
