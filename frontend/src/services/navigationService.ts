import axios from 'axios'
import { API_BASE_URL } from './api'

// Types
export interface Author {
  id: string
  name: string
  avatar?: string
}

export interface Workflow {
  id: string
  title: string
  description?: string
  thumbnail?: string
  category?: string
  tags?: string
  isDraft?: boolean
  isPublic?: boolean
  createdAt: string
  updatedAt: string
  usageCount?: number
  rating?: number
  author?: Author
  authorId?: string
  source?: 'own' | 'public'
  lastUsed?: string
  useCount?: number
  favoriteCount?: number
}

export interface FavoriteTag {
  id: string
  name: string
  color?: string
  icon?: string
  order: number
  count: number
  createdAt: string
  updatedAt: string
}

export interface Tool {
  id: string
  name: string
  description?: string
  icon?: string
  isActive: boolean
}

export interface NavigationPreferences {
  collapsedSections: string[]
  favoriteViewMode: 'grid' | 'list'
  defaultTab: string
  recentDaysRange: number
}

export interface SidebarData {
  quickStart: {
    templates: Workflow[]
    recommended: Workflow[]
  }
  myWorkflows: {
    recent: Workflow[]
    drafts: Workflow[]
    published: Workflow[]
  }
  favorites: {
    tags: FavoriteTag[]
    workflows: { [tagId: string]: Workflow[] }
    uncategorized: Workflow[]
  }
  aiTools: Tool[]
  preferences: NavigationPreferences
}

export interface SearchResult {
  results: Workflow[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

// API Functions
export const navigationService = {
  /**
   * 获取侧边栏导航数据
   */
  async getSidebarData(): Promise<SidebarData> {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/api/navigation/sidebar`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },

  /**
   * 更新导航偏好设置
   */
  async updatePreferences(
    preferences: Partial<NavigationPreferences>
  ): Promise<NavigationPreferences> {
    const token = localStorage.getItem('token')
    const response = await axios.patch(
      `${API_BASE_URL}/api/navigation/preferences`,
      preferences,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return response.data
  }
}

export const favoritesService = {
  /**
   * 创建收藏标签
   */
  async createTag(data: {
    name: string
    color?: string
    icon?: string
  }): Promise<FavoriteTag> {
    const token = localStorage.getItem('token')
    const response = await axios.post(`${API_BASE_URL}/api/favorites/tags`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    return response.data
  },

  /**
   * 获取所有标签
   */
  async getTags(): Promise<FavoriteTag[]> {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/api/favorites/tags`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },

  /**
   * 更新标签
   */
  async updateTag(
    id: string,
    data: Partial<{ name: string; color: string; icon: string; order: number }>
  ): Promise<FavoriteTag> {
    const token = localStorage.getItem('token')
    const response = await axios.patch(
      `${API_BASE_URL}/api/favorites/tags/${id}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return response.data
  },

  /**
   * 删除标签
   */
  async deleteTag(id: string): Promise<void> {
    const token = localStorage.getItem('token')
    await axios.delete(`${API_BASE_URL}/api/favorites/tags/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },

  /**
   * 为收藏添加标签
   */
  async addTagsToFavorite(favoriteId: string, tagIds: string[]): Promise<void> {
    const token = localStorage.getItem('token')
    await axios.post(
      `${API_BASE_URL}/api/favorites/${favoriteId}/tags`,
      { tagIds },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
  },

  /**
   * 移除收藏的标签
   */
  async removeTagFromFavorite(favoriteId: string, tagId: string): Promise<void> {
    const token = localStorage.getItem('token')
    await axios.delete(`${API_BASE_URL}/api/favorites/${favoriteId}/tags/${tagId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },

  /**
   * 重新排序标签
   */
  async reorderTags(tagOrders: { id: string; order: number }[]): Promise<void> {
    const token = localStorage.getItem('token')
    await axios.post(
      `${API_BASE_URL}/api/favorites/tags/reorder`,
      { tagOrders },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

export const workflowSearchService = {
  /**
   * 搜索工作流
   */
  async search(params: {
    q?: string
    status?: 'draft' | 'published' | 'all'
    source?: 'own' | 'favorite' | 'public' | 'team'
    days?: number
    sortBy?: 'relevance' | 'lastUsed' | 'useCount' | 'created'
    limit?: number
    offset?: number
  }): Promise<SearchResult> {
    const token = localStorage.getItem('token')
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()

    const response = await axios.get(
      `${API_BASE_URL}/api/workflows/search?${queryString}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    )
    return response.data
  }
}
