// 工作台API服务
import api from './api'

/**
 * 卡片配置类型
 */
export type CardLayout = {
  id: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
}

/**
 * 工作台完整状态类型
 */
export type WorkspaceSnapshot = {
  cards: CardLayout[]
  zoom: number
  expandedCards?: string[]
  selectedModules?: Record<string, string>
  selectedWorkItems?: Record<string, number>
}

/**
 * 获取用户的工作台布局
 */
export async function fetchWorkspaceLayout(): Promise<{
  layout: CardLayout[] | null
  zoom: number
  snapshot?: WorkspaceSnapshot
}> {
  try {
    const response = await api.get('/workspace/layout')

    if (response.data.layout) {
      return {
        layout: response.data.layout,
        zoom: response.data.zoom || 1.0,
        snapshot: response.data.snapshot
      }
    }

    // 如果没有保存的布局，返回null
    return { layout: null, zoom: 1.0 }
  } catch (error) {
    console.error('获取工作台布局失败:', error)
    return { layout: null, zoom: 1.0 }
  }
}

/**
 * 保存用户的工作台布局
 */
export async function saveWorkspaceLayout(
  layout: CardLayout[],
  zoom: number = 1.0,
  snapshot?: WorkspaceSnapshot
): Promise<boolean> {
  try {
    await api.post('/workspace/layout', {
      layout,
      zoom,
      snapshot
    })
    return true
  } catch (error) {
    console.error('保存工作台布局失败:', error)
    return false
  }
}

/**
 * 重置工作台布局为默认值
 */
export async function resetWorkspaceLayout(): Promise<boolean> {
  try {
    await api.delete('/workspace/layout')
    return true
  } catch (error) {
    console.error('重置工作台布局失败:', error)
    return false
  }
}

/**
 * 导出工作台数据到JSON文件
 */
export async function exportWorkspaceData(): Promise<void> {
  try {
    const response = await api.get('/workspace/export')
    const data = response.data

    // 创建下载链接
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `workspace-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出工作台数据失败:', error)
    throw error
  }
}

/**
 * 导出本地工作台状态（不通过API）
 */
export function exportLocalWorkspaceData(snapshot: WorkspaceSnapshot): void {
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    data: snapshot
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `workspace-local-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
