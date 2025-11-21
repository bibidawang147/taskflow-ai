import React, { useState, useEffect } from 'react'
import { navigationService, favoritesService, SidebarData, Workflow, FavoriteTag } from '../services/navigationService'
import { FavoriteTagModal } from './FavoriteTagModal'
import { WorkflowContextMenu } from './WorkflowContextMenu'

// 画布数据类型定义
interface Position {
  x: number
  y: number
}

interface WorkflowCanvasItem {
  id: string
  type: 'workflow'
  workflowId: string
  parentId: string
  position: Position
}

interface ToolLinkCanvasItem {
  id: string
  type: 'tool-link'
  name: string
  url: string
  logo?: string
  badge?: string
  description?: string
  category?: string
  parentId: string
  position: Position
}

interface ContainerCanvasItem {
  id: string
  type: 'container'
  name: string
  parentId: string
  position: Position
  size: { width: number; height: number }
  collapsed: boolean
  childrenIds: string[]
  color: string
}

type CanvasItem = WorkflowCanvasItem | ToolLinkCanvasItem | ContainerCanvasItem
type CanvasItemsMap = Record<string, CanvasItem>

interface NavigationSidebarProps {
  onWorkflowSelect?: (workflowId: string) => void
  onRefresh?: () => void
  onWorkflowDragStart?: (workflowId: string) => void
  onWorkflowDragEnd?: () => void
  canvasItems?: CanvasItemsMap
  libraryData?: any[]
}

// 独立的WorkflowItem组件，避免Hooks规则违反
interface WorkflowItemProps {
  workflow: Workflow
  batchMode: boolean
  isSelected: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onToggleSelection: () => void
  onAddToFavorites: () => void
}

const WorkflowItem: React.FC<WorkflowItemProps> = ({
  workflow,
  batchMode,
  isSelected,
  onDragStart,
  onDragEnd,
  onClick,
  onContextMenu,
  onToggleSelection,
  onAddToFavorites
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      key={workflow.id}
      draggable={!batchMode}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{
        padding: '0.625rem 1rem',
        fontSize: '14px',
        color: '#374151',
        cursor: batchMode ? 'pointer' : 'grab',
        borderRadius: '6px',
        transition: 'all 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '6px',
        position: 'relative',
        backgroundColor: isSelected ? '#eff6ff' : 'transparent',
        border: isSelected ? '1px solid #3b82f6' : '1px solid transparent'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = '#F5F5F7'
        setIsHovered(true)
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
        setIsHovered(false)
      }}
    >
      {/* Checkbox in batch mode */}
      {batchMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          style={{
            marginRight: '0.5rem',
            cursor: 'pointer'
          }}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {workflow.title}
        </div>
        {workflow.lastUsed && (
          <div style={{
            fontSize: '12px',
            color: '#9ca3af',
            marginTop: '2px'
          }}>
            {new Date(workflow.lastUsed).toLocaleDateString('zh-CN')}
          </div>
        )}
      </div>

      {/* Quick Actions - shown on hover */}
      {isHovered && !batchMode && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          marginLeft: '0.5rem'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddToFavorites()
            }}
            style={{
              padding: '0.25rem',
              fontSize: '14px',
              color: '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            title="添加到收藏"
          >
            收藏
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onContextMenu(e)
            }}
            style={{
              padding: '0.25rem',
              fontSize: '14px',
              color: '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            title="更多操作"
          >
            •••
          </button>
        </div>
      )}

      {/* Usage count - hidden on hover */}
      {!isHovered && workflow.useCount !== undefined && workflow.useCount > 0 && (
        <span style={{
          fontSize: '12px',
          color: '#9ca3af',
          marginLeft: '0.5rem'
        }}>
          {workflow.useCount}次
        </span>
      )}
    </div>
  )
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  onWorkflowSelect,
  onRefresh,
  onWorkflowDragStart,
  onWorkflowDragEnd,
  canvasItems = {},
  libraryData = []
}) => {
  const [sidebarData, setSidebarData] = useState<SidebarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // 默认所有section都是折叠的（页面刷新时）
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(['quick-start', 'my-workflows', 'canvas-structure', 'templates', 'recommended', 'recent', 'drafts', 'published', 'uncategorized'])
  )
  const [isInitialLoad, setIsInitialLoad] = useState(true) // 标记是否首次加载
  const [searchQuery, setSearchQuery] = useState('')
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<FavoriteTag | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    workflow: Workflow | null
    position: { x: number; y: number }
  }>({ workflow: null, position: { x: 0, y: 0 } })
  const [batchMode, setBatchMode] = useState(false)
  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadSidebarData()
  }, [])

  const loadSidebarData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await navigationService.getSidebarData()
      setSidebarData(data)

      // 只在首次加载时设置默认折叠状态
      if (isInitialLoad) {
        const defaultCollapsed = new Set(['templates', 'recommended', 'recent', 'drafts', 'published', 'uncategorized'])
        // 同时将所有收藏标签也设置为折叠
        data.favorites.tags.forEach(tag => {
          defaultCollapsed.add(`favorite-tag-${tag.id}`)
        })
        setCollapsedSections(defaultCollapsed)
        setIsInitialLoad(false) // 标记已完成首次加载
      }
      // 非首次加载时，保持用户当前的展开/折叠状态
    } catch (err: any) {
      console.error('Failed to load sidebar data:', err)
      setError(err.message || '加载导航数据失败')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = async (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId)
    } else {
      newCollapsed.add(sectionId)
    }
    setCollapsedSections(newCollapsed)

    // Save to backend
    try {
      await navigationService.updatePreferences({
        collapsedSections: Array.from(newCollapsed)
      })
    } catch (err) {
      console.error('Failed to save preferences:', err)
    }
  }

  const filterWorkflows = (workflows: Workflow[]) => {
    if (!searchQuery.trim()) return workflows

    const query = searchQuery.toLowerCase()
    return workflows.filter((workflow) => {
      return (
        workflow.title.toLowerCase().includes(query) ||
        workflow.description?.toLowerCase().includes(query) ||
        workflow.tags?.toLowerCase().includes(query) ||
        workflow.category?.toLowerCase().includes(query)
      )
    })
  }

  const handleContextMenu = (workflow: Workflow, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      workflow,
      position: { x: e.clientX, y: e.clientY }
    })
  }

  const handleWorkflowOpen = () => {
    if (contextMenu.workflow) {
      onWorkflowSelect?.(contextMenu.workflow.id)
    }
  }

  const handleWorkflowCopy = () => {
    if (contextMenu.workflow) {
      // TODO: Implement copy workflow logic
      console.log('Copy workflow:', contextMenu.workflow.id)
    }
  }

  const handleWorkflowDelete = () => {
    if (contextMenu.workflow) {
      // TODO: Implement delete workflow logic
      console.log('Delete workflow:', contextMenu.workflow.id)
    }
  }

  const handleAddToFavorites = () => {
    if (contextMenu.workflow) {
      // TODO: Implement add to favorites logic
      console.log('Add to favorites:', contextMenu.workflow.id)
    }
  }

  const handleWorkflowEdit = () => {
    if (contextMenu.workflow) {
      // TODO: Implement edit workflow logic
      console.log('Edit workflow:', contextMenu.workflow.id)
    }
  }

  const toggleBatchMode = () => {
    setBatchMode(!batchMode)
    if (batchMode) {
      setSelectedWorkflows(new Set())
    }
  }

  const toggleWorkflowSelection = (workflowId: string) => {
    const newSelected = new Set(selectedWorkflows)
    if (newSelected.has(workflowId)) {
      newSelected.delete(workflowId)
    } else {
      newSelected.add(workflowId)
    }
    setSelectedWorkflows(newSelected)
  }

  const handleBatchDelete = () => {
    if (selectedWorkflows.size === 0) return
    if (confirm(`确定要删除选中的 ${selectedWorkflows.size} 个工作流吗？`)) {
      console.log('Batch delete:', Array.from(selectedWorkflows))
      // TODO: Implement batch delete
      setSelectedWorkflows(new Set())
      setBatchMode(false)
    }
  }

  const handleBatchAddToFavorites = () => {
    if (selectedWorkflows.size === 0) return
    console.log('Batch add to favorites:', Array.from(selectedWorkflows))
    // TODO: Implement batch add to favorites
    setSelectedWorkflows(new Set())
    setBatchMode(false)
  }

  const renderSection = (
    title: string,
    sectionId: string,
    items: Workflow[],
    icon?: string
  ) => {
    const isCollapsed = collapsedSections.has(sectionId)
    const filteredItems = filterWorkflows(items)

    return (
      <div style={{ marginBottom: '0.5rem' }}>
        <div
          onClick={() => toggleSection(sectionId)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#1A1A1A',
            cursor: 'pointer',
            userSelect: 'none',
            borderRadius: '6px',
            transition: 'background-color 0.2s ease',
            marginBottom: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F5F5F7'
            const icon = e.currentTarget.querySelector('.expand-icon') as HTMLElement
            if (icon) icon.style.color = '#5B5B5F'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            const icon = e.currentTarget.querySelector('.expand-icon') as HTMLElement
            if (icon) icon.style.color = '#8E8E93'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon && <span>{icon}</span>}
            <span>{title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '14px',
              color: '#8E8E93',
              fontWeight: 400
            }}>
              ({searchQuery ? filteredItems.length : items.length})
            </span>
            <span
              className="expand-icon"
              style={{
                fontSize: '18px',
                color: '#8E8E93',
                transition: 'color 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                flexShrink: 0,
                fontWeight: 300
              }}
            >
              {isCollapsed ? '›' : '⌄'}
            </span>
          </div>
        </div>
        {!isCollapsed && (
          <div style={{
            marginTop: '0.25rem',
            animation: 'fadeIn 0.2s ease-in'
          }}>
            {filteredItems.length > 0 ? (
              filteredItems.map((workflow) => (
                <WorkflowItem
                  key={workflow.id}
                  workflow={workflow}
                  batchMode={batchMode}
                  isSelected={selectedWorkflows.has(workflow.id)}
                  onDragStart={() => {
                    if (!batchMode) {
                      onWorkflowDragStart?.(workflow.id)
                    }
                  }}
                  onDragEnd={() => {
                    if (!batchMode) {
                      onWorkflowDragEnd?.()
                    }
                  }}
                  onClick={() => {
                    if (batchMode) {
                      toggleWorkflowSelection(workflow.id)
                    } else {
                      onWorkflowSelect?.(workflow.id)
                    }
                  }}
                  onContextMenu={(e) => !batchMode && handleContextMenu(workflow, e)}
                  onToggleSelection={() => toggleWorkflowSelection(workflow.id)}
                  onAddToFavorites={() => {
                    handleAddToFavorites()
                    setContextMenu({ workflow, position: { x: 0, y: 0 } })
                  }}
                />
              ))
            ) : (
              <div style={{
                padding: '1rem',
                fontSize: '13px',
                color: '#9ca3af',
                textAlign: 'center'
              }}>
                {searchQuery ? '未找到匹配的工作流' : `暂无${title}`}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const handleEditTag = (tag: FavoriteTag, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTag(tag)
    setTagModalOpen(true)
  }

  const handleCreateTag = () => {
    setEditingTag(null)
    setTagModalOpen(true)
  }

  const handleTagModalSuccess = () => {
    loadSidebarData()
  }

  const [draggedTag, setDraggedTag] = React.useState<FavoriteTag | null>(null)
  const [dragOverTag, setDragOverTag] = React.useState<string | null>(null)

  const handleTagDragStart = (tag: FavoriteTag, e: React.DragEvent) => {
    e.stopPropagation()
    setDraggedTag(tag)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleTagDragOver = (tag: FavoriteTag, e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedTag && draggedTag.id !== tag.id) {
      setDragOverTag(tag.id)
    }
  }

  const handleTagDragLeave = () => {
    setDragOverTag(null)
  }

  const handleTagDrop = async (targetTag: FavoriteTag, e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverTag(null)

    if (!draggedTag || draggedTag.id === targetTag.id) {
      setDraggedTag(null)
      return
    }

    // Reorder tags
    const tags = sidebarData?.favorites.tags || []
    const draggedIndex = tags.findIndex(t => t.id === draggedTag.id)
    const targetIndex = tags.findIndex(t => t.id === targetTag.id)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTag(null)
      return
    }

    const newTags = [...tags]
    newTags.splice(draggedIndex, 1)
    newTags.splice(targetIndex, 0, draggedTag)

    // Update order values
    const tagOrders = newTags.map((tag, index) => ({
      id: tag.id,
      order: index
    }))

    try {
      await favoritesService.reorderTags(tagOrders)
      loadSidebarData()
    } catch (err) {
      console.error('Failed to reorder tags:', err)
    }

    setDraggedTag(null)
  }

  // 渲染画布结构
  const renderCanvasStructure = () => {
    const ROOT_CONTAINER_ID = 'canvas-root'
    const isCollapsed = collapsedSections.has('canvas-structure')

    // 获取所有容器和工作流
    const containers = Object.values(canvasItems).filter(
      (item): item is ContainerCanvasItem => item.type === 'container' && item.id !== ROOT_CONTAINER_ID
    )
    const workflows = Object.values(canvasItems).filter(
      (item): item is WorkflowCanvasItem => item.type === 'workflow'
    )

    // 渲染容器及其子项
    const renderContainerItem = (container: ContainerCanvasItem, depth: number = 0) => {
      const containerWorkflows = workflows.filter(w => w.parentId === container.id)
      const childContainers = containers.filter(c => c.parentId === container.id)
      const isContainerCollapsed = collapsedSections.has(`canvas-container-${container.id}`)

      return (
        <div key={container.id} style={{ marginBottom: '0.25rem' }}>
          {/* 容器标题 */}
          <div
            onClick={() => toggleSection(`canvas-container-${container.id}`)}
            style={{
              paddingLeft: `${depth * 16 + 16}px`,
              paddingRight: '16px',
              paddingTop: '8px',
              paddingBottom: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              userSelect: 'none',
              borderRadius: '6px',
              transition: 'background-color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F5F7'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>📁</span>
              <span>{container.name}</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                ({containerWorkflows.length + childContainers.length})
              </span>
            </div>
            <span style={{
              fontSize: '14px',
              color: '#8E8E93',
              transition: 'transform 0.2s ease'
            }}>
              {isContainerCollapsed ? '›' : '⌄'}
            </span>
          </div>

          {/* 容器内的工作流和子容器 */}
          {!isContainerCollapsed && (
            <div>
              {/* 子容器 */}
              {childContainers.map(childContainer => renderContainerItem(childContainer, depth + 1))}

              {/* 工作流 */}
              {containerWorkflows.map(workflow => {
                const workflowData = libraryData.find(w => w.id === workflow.workflowId)
                return (
                  <div
                    key={workflow.id}
                    style={{
                      paddingLeft: `${(depth + 1) * 16 + 16}px`,
                      paddingRight: '16px',
                      paddingTop: '6px',
                      paddingBottom: '6px',
                      fontSize: '13px',
                      color: '#6b7280',
                      borderRadius: '6px',
                      transition: 'background-color 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F5F5F7'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>📄</span>
                    <span>{workflowData?.name || '未命名工作流'}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    // 获取根容器下的顶层容器
    const rootContainers = containers.filter(c => c.parentId === ROOT_CONTAINER_ID)
    const rootWorkflows = workflows.filter(w => w.parentId === ROOT_CONTAINER_ID)

    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          onClick={() => toggleSection('canvas-structure')}
          style={{
            padding: '0.75rem 1rem',
            fontSize: '15px',
            fontWeight: 700,
            color: '#1A1A1A',
            marginBottom: '0.75rem',
            marginTop: '32px',
            borderBottom: 'none',
            letterSpacing: '0.02em',
            cursor: 'pointer',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '6px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F5F5F7'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <span style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700
          }}>画布结构</span>
          <span style={{
            fontSize: '18px',
            color: '#8E8E93',
            transition: 'color 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            flexShrink: 0,
            fontWeight: 300
          }}>
            {isCollapsed ? '›' : '⌄'}
          </span>
        </div>

        {!isCollapsed && (
          <div>
            {rootContainers.length === 0 && rootWorkflows.length === 0 ? (
              <div style={{
                padding: '1rem',
                fontSize: '13px',
                color: '#9ca3af',
                textAlign: 'center'
              }}>
                画布为空
              </div>
            ) : (
              <>
                {rootContainers.map(container => renderContainerItem(container, 0))}
                {rootWorkflows.map(workflow => {
                  const workflowData = libraryData.find(w => w.id === workflow.workflowId)
                  return (
                    <div
                      key={workflow.id}
                      style={{
                        paddingLeft: '16px',
                        paddingRight: '16px',
                        paddingTop: '6px',
                        paddingBottom: '6px',
                        fontSize: '13px',
                        color: '#6b7280',
                        borderRadius: '6px',
                        transition: 'background-color 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F5F5F7'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <span style={{ fontSize: '12px' }}>📄</span>
                      <span>{workflowData?.name || '未命名工作流'}</span>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderFavoriteTag = (tag: FavoriteTag, workflows: Workflow[]) => {
    const isCollapsed = collapsedSections.has(`favorite-tag-${tag.id}`)
    const filteredWorkflows = filterWorkflows(workflows)
    const isDragOver = dragOverTag === tag.id

    return (
      <div
        key={tag.id}
        style={{ marginBottom: '0.75rem' }}
        draggable
        onDragStart={(e) => handleTagDragStart(tag, e)}
        onDragOver={(e) => handleTagDragOver(tag, e)}
        onDragLeave={handleTagDragLeave}
        onDrop={(e) => handleTagDrop(tag, e)}
      >
        <div
          onClick={() => toggleSection(`favorite-tag-${tag.id}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 1rem',
            fontSize: '13px',
            fontWeight: 500,
            color: '#374151',
            cursor: draggedTag ? 'move' : 'pointer',
            userSelect: 'none',
            borderRadius: '6px',
            backgroundColor: tag.color ? `${tag.color}10` : '#f9fafb',
            position: 'relative',
            border: isDragOver ? '2px dashed #3b82f6' : '2px solid transparent',
            opacity: draggedTag?.id === tag.id ? 0.5 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ cursor: 'grab' }}>≡</span>
            <span>{tag.name}</span>
            <span style={{
              fontSize: '12px',
              color: '#9ca3af',
              fontWeight: 400
            }}>
              ({searchQuery ? filteredWorkflows.length : workflows.length})
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={(e) => handleEditTag(tag, e)}
              style={{
                padding: '0.25rem',
                fontSize: '12px',
                color: '#6b7280',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              编辑
            </button>
            <span style={{
              fontSize: '12px',
              transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}>
              ▼
            </span>
          </div>
        </div>
        {!isCollapsed && filteredWorkflows.length > 0 && (
          <div style={{ marginTop: '0.25rem', paddingLeft: '0.5rem' }}>
            {filteredWorkflows.map((workflow) => (
              <WorkflowItem
                key={workflow.id}
                workflow={workflow}
                batchMode={batchMode}
                isSelected={selectedWorkflows.has(workflow.id)}
                onDragStart={() => {
                  if (!batchMode) {
                    onWorkflowDragStart?.(workflow.id)
                  }
                }}
                onDragEnd={() => {
                  if (!batchMode) {
                    onWorkflowDragEnd?.()
                  }
                }}
                onClick={() => {
                  if (batchMode) {
                    toggleWorkflowSelection(workflow.id)
                  } else {
                    onWorkflowSelect?.(workflow.id)
                  }
                }}
                onContextMenu={(e) => !batchMode && handleContextMenu(workflow, e)}
                onToggleSelection={() => toggleWorkflowSelection(workflow.id)}
                onAddToFavorites={() => {
                  handleAddToFavorites()
                  setContextMenu({ workflow, position: { x: 0, y: 0 } })
                }}
              />
            ))}
          </div>
        )}
        {!isCollapsed && filteredWorkflows.length === 0 && workflows.length > 0 && searchQuery && (
          <div style={{
            marginTop: '0.25rem',
            padding: '1rem',
            fontSize: '13px',
            color: '#9ca3af',
            textAlign: 'center'
          }}>
            未找到匹配的工作流
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{
        width: '280px',
        height: '100%',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#9ca3af' }}>加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        width: '280px',
        height: '100%',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        padding: '1rem'
      }}>
        <div style={{
          color: '#ef4444',
          fontSize: '14px',
          textAlign: 'center',
          padding: '2rem 1rem'
        }}>
          {error}
          <button
            onClick={loadSidebarData}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              fontSize: '14px',
              color: '#3b82f6',
              backgroundColor: 'transparent',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  if (!sidebarData) return null

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div style={{
        width: '280px',
        height: '100%',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem 0.5rem'
      }}>
        {/* Quick Start Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            onClick={() => toggleSection('quick-start')}
            style={{
              padding: '0.25rem 1rem 0.75rem 1rem',
              fontSize: '15px',
              fontWeight: 700,
              color: '#1A1A1A',
              marginBottom: '0.75rem',
              marginTop: '0px',
              borderBottom: 'none',
              letterSpacing: '0.02em',
              cursor: 'pointer',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: '6px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F5F7'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700
            }}>快速开始</span>
            <span style={{
              fontSize: '18px',
              color: '#8E8E93',
              transition: 'color 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
              height: '18px',
              flexShrink: 0,
              fontWeight: 300
            }}>
              {collapsedSections.has('quick-start') ? '›' : '⌄'}
            </span>
          </div>
          {!collapsedSections.has('quick-start') && (
            <>
              {renderSection('模板工作流', 'templates', sidebarData.quickStart.templates)}
              {renderSection('推荐工作流', 'recommended', sidebarData.quickStart.recommended)}
            </>
          )}
        </div>

        {/* My Workflows Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            onClick={() => toggleSection('my-workflows')}
            style={{
              padding: '0.75rem 1rem',
              fontSize: '15px',
              fontWeight: 700,
              color: '#1A1A1A',
              marginBottom: '0.75rem',
              marginTop: '32px',
              borderBottom: 'none',
              letterSpacing: '0.02em',
              cursor: 'pointer',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: '6px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F5F7'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700
            }}>我的工作流</span>
            <span style={{
              fontSize: '18px',
              color: '#8E8E93',
              transition: 'color 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
              height: '18px',
              flexShrink: 0,
              fontWeight: 300
            }}>
              {collapsedSections.has('my-workflows') ? '›' : '⌄'}
            </span>
          </div>
          {!collapsedSections.has('my-workflows') && (
            <>
              {renderSection(
                '最近使用',
                'recent',
                sidebarData.myWorkflows.recent
              )}
              {renderSection(
                '草稿箱',
                'drafts',
                sidebarData.myWorkflows.drafts
              )}
              {renderSection(
                '已发布',
                'published',
                sidebarData.myWorkflows.published
              )}
            </>
          )}
        </div>

        {/* Favorites Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            padding: '0.75rem 1rem',
            fontSize: '15px',
            fontWeight: 700,
            color: '#1A1A1A',
            marginBottom: '0.75rem',
            marginTop: '32px',
            borderBottom: 'none',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700
            }}>收藏夹</span>
            <button
              onClick={handleCreateTag}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                color: '#8b5cf6',
                backgroundColor: '#f5f3ff',
                border: '1px solid #e9d5ff',
                cursor: 'pointer',
                borderRadius: '6px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ede9fe'
                e.currentTarget.style.borderColor = '#c4b5fd'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f3ff'
                e.currentTarget.style.borderColor = '#e9d5ff'
              }}
            >
              + 新建标签
            </button>
          </div>

          {sidebarData.favorites.tags.map((tag) =>
            renderFavoriteTag(
              tag,
              sidebarData.favorites.workflows[tag.id] || []
            )
          )}

          {sidebarData.favorites.uncategorized.length > 0 &&
            renderSection(
              '未分类',
              'uncategorized',
              sidebarData.favorites.uncategorized
            )}
        </div>

        {/* Canvas Structure Section */}
        {renderCanvasStructure()}

      </div>

      {/* Favorite Tag Modal */}
      <FavoriteTagModal
        isOpen={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        onSuccess={handleTagModalSuccess}
        editTag={editingTag}
      />

      {/* Workflow Context Menu */}
      {contextMenu.workflow && (
        <WorkflowContextMenu
          workflow={contextMenu.workflow}
          position={contextMenu.position}
          onClose={() => setContextMenu({ workflow: null, position: { x: 0, y: 0 } })}
          onOpen={handleWorkflowOpen}
          onCopy={handleWorkflowCopy}
          onDelete={handleWorkflowDelete}
          onAddToFavorites={handleAddToFavorites}
          onEdit={handleWorkflowEdit}
        />
      )}
    </div>
  </>
  )
}
