import axios from 'axios'

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
    ? import.meta.env.VITE_API_BASE_URL
    : 'http://localhost:3000'

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
      // 重定向到登录页面
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
