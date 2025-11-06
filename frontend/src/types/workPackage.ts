// 爆款工作包类型定义

export interface WorkPackageTool {
  id: number
  name: string
  type: string
  description: string
  icon: string
  version?: string
  // AI 模型专属字段
  modelId?: string
  provider?: string
  inputPrice?: number
  outputPrice?: number
  maxTokens?: number
  features?: {
    vision?: boolean
    functionCalling?: boolean
    streaming?: boolean
    jsonMode?: boolean
  }
}

export interface WorkPackageItem {
  id: number
  name: string
  description: string
  icon: string
  difficulty: string
  tools: WorkPackageTool[]
}

export interface WorkPackage {
  id: string
  name: string
  description: string
  category: string
  icon: string
  color: string
  coverImage?: string
  tags: string[]
  author: {
    name: string
    avatar: string
  }
  stats: {
    downloads: number
    rating: number
    reviews: number
  }
  items: WorkPackageItem[]
  createdAt: string
  updatedAt: string
}
