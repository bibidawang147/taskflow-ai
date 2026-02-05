// 工作流标签大类配置
// 这些标签用于侧边栏分类和工作流卡片标签

export interface WorkflowCategory {
  id: string
  name: string
  color: string        // 主色
  bgColor: string      // 背景色
  borderColor: string  // 边框色
  icon?: string
}

export const WORKFLOW_CATEGORIES: WorkflowCategory[] = [
  {
    id: 'side-business',
    name: '副业专区',
    color: '#d97706',
    bgColor: '#fef3c7',
    borderColor: '#f59e0b'
  },
  {
    id: 'content-creation',
    name: '内容创作',
    color: '#db2777',
    bgColor: '#fce7f3',
    borderColor: '#ec4899'
  },
  {
    id: 'video-production',
    name: '视频制作',
    color: '#dc2626',
    bgColor: '#fee2e2',
    borderColor: '#ef4444'
  },
  {
    id: 'data-analysis',
    name: '数据分析',
    color: '#2563eb',
    bgColor: '#dbeafe',
    borderColor: '#3b82f6'
  },
  {
    id: 'graphic-design',
    name: '图文设计',
    color: '#059669',
    bgColor: '#d1fae5',
    borderColor: '#10b981'
  },
  {
    id: 'productivity',
    name: '效率工具',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    borderColor: '#8b5cf6'
  }
]

// 获取所有分类名称
export const CATEGORY_NAMES = WORKFLOW_CATEGORIES.map(c => c.name)

// 根据名称获取分类配置
export const getCategoryByName = (name: string): WorkflowCategory | undefined => {
  return WORKFLOW_CATEGORIES.find(c => c.name === name)
}

// 根据ID获取分类配置
export const getCategoryById = (id: string): WorkflowCategory | undefined => {
  return WORKFLOW_CATEGORIES.find(c => c.id === id)
}

// 验证是否是有效的分类名称
export const isValidCategory = (name: string): boolean => {
  return CATEGORY_NAMES.includes(name)
}

// 获取默认分类
export const getDefaultCategory = (): WorkflowCategory => {
  return WORKFLOW_CATEGORIES[5] // 效率工具
}
