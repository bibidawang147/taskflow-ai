const API_BASE_URL = 'http://localhost:3000/api/community'

interface ApiResponse<T> {
  data?: T
  error?: string
}

// 获取Token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// ==================== 工作流广场相关 ====================

export interface WorkflowListParams {
  page?: number
  limit?: number
  category?: string
  sort?: 'latest' | 'hot' | 'recommended'
  search?: string
}

export const communityApi = {
  // 获取工作流列表
  async getWorkflows(params: WorkflowListParams = {}) {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.category) queryParams.append('category', params.category)
    if (params.sort) queryParams.append('sort', params.sort)
    if (params.search) queryParams.append('search', params.search)

    const response = await fetch(`${API_BASE_URL}/workflows?${queryParams}`, {
      headers: getAuthHeaders()
    })
    return response.json()
  },

  // 点赞/取消点赞工作流
  async toggleWorkflowLike(workflowId: string) {
    const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}/like`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return response.json()
  },

  // 复制工作流到工作台
  async copyWorkflow(workflowId: string) {
    const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}/copy`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return response.json()
  },

  // ==================== 讨论区相关 ====================

  // 获取帖子列表
  async getPosts(params: { page?: number; limit?: number; sort?: 'latest' | 'hot'; search?: string } = {}) {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.sort) queryParams.append('sort', params.sort)
    if (params.search) queryParams.append('search', params.search)

    const response = await fetch(`${API_BASE_URL}/posts?${queryParams}`, {
      headers: getAuthHeaders()
    })
    return response.json()
  },

  // 获取帖子详情
  async getPostDetail(postId: string) {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      headers: getAuthHeaders()
    })
    return response.json()
  },

  // 发布新帖
  async createPost(data: { title: string; content: string; tags?: string[] }) {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return response.json()
  },

  // 点赞/取消点赞帖子
  async togglePostLike(postId: string) {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return response.json()
  },

  // 发布评论
  async createComment(postId: string, data: { content: string; parentId?: string }) {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    return response.json()
  }
}

export default communityApi
