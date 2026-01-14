import { api } from './api'

// 对话消息类型
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  recommendedWorkflows?: any[]
}

// 对话会话类型
export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

// 创建新对话会话
export const createChatSession = async (title: string = '新对话'): Promise<ChatSession> => {
  try {
    const response = await api.post('/api/chats', { title })
    return response.data
  } catch (error) {
    console.error('创建对话会话失败:', error)
    throw error
  }
}

// 获取所有对话会话列表
export const getChatSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await api.get('/api/chats')
    return response.data
  } catch (error) {
    console.error('获取对话列表失败:', error)
    throw error
  }
}

// 获取单个对话会话详情
export const getChatSession = async (sessionId: string): Promise<ChatSession> => {
  try {
    const response = await api.get(`/api/chats/${sessionId}`)
    return response.data
  } catch (error) {
    console.error('获取对话详情失败:', error)
    throw error
  }
}

// 更新对话会话
export const updateChatSession = async (
  sessionId: string,
  data: { title?: string; messages?: ChatMessage[] }
): Promise<ChatSession> => {
  try {
    const response = await api.put(`/api/chats/${sessionId}`, data)
    return response.data
  } catch (error) {
    console.error('更新对话失败:', error)
    throw error
  }
}

// 保存消息到对话会话
export const saveChatMessage = async (
  sessionId: string,
  message: ChatMessage
): Promise<ChatSession> => {
  try {
    const response = await api.post(`/chats/${sessionId}/messages`, message)
    return response.data
  } catch (error) {
    console.error('保存消息失败:', error)
    throw error
  }
}

// 删除对话会话
export const deleteChatSession = async (sessionId: string): Promise<void> => {
  try {
    await api.delete(`/api/chats/${sessionId}`)
  } catch (error) {
    console.error('删除对话失败:', error)
    throw error
  }
}

// 批量保存消息
export const saveChatMessages = async (
  sessionId: string,
  messages: ChatMessage[]
): Promise<ChatSession> => {
  try {
    const response = await api.put(`/api/chats/${sessionId}`, { messages })
    return response.data
  } catch (error) {
    console.error('批量保存消息失败:', error)
    throw error
  }
}
