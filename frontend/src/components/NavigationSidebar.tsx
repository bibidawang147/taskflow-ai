import React, { useState, useEffect, useRef } from 'react'
import { navigationService, favoritesService, SidebarData, Workflow, FavoriteTag } from '../services/navigationService'
import { authService } from '../services/auth'
import { deleteWorkflow } from '../services/workflowApi'
import { FavoriteTagModal } from './FavoriteTagModal'
import { WorkflowContextMenu } from './WorkflowContextMenu'
import { WORKFLOW_CATEGORIES, WorkflowCategory, getCategoryByName } from '../config/workflowCategories'
import { ChevronRight, ChevronDown, Plus, X, Pencil } from 'lucide-react'

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

interface ArticleCanvasItem {
  id: string
  type: 'article'
  url: string
  title: string
  note?: string
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

type CanvasItem = WorkflowCanvasItem | ToolLinkCanvasItem | ArticleCanvasItem | ContainerCanvasItem
type CanvasItemsMap = Record<string, CanvasItem>

interface NavigationSidebarProps {
  onWorkflowSelect?: (workflowId: string) => void
  onRefresh?: () => void
  onWorkflowDragStart?: (workflowId: string) => void
  onWorkflowDragEnd?: () => void
  canvasItems?: CanvasItemsMap
  allCanvasData?: { tabId: string; title: string; items: CanvasItemsMap }[]
  libraryData?: any[]
  embedded?: boolean // 是否嵌入到其他容器中使用（不显示外层容器样式）
  externalSearchQuery?: string // 外部传入的搜索词
}

// 独立的WorkflowItem组件，避免Hooks规则违反
interface WorkflowItemProps {
  workflow: Workflow
  batchMode: boolean
  isSelected: boolean
  onDragStart: (e: React.DragEvent) => void
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
      onDragStart={(e) => onDragStart(e)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{
        padding: '3px 16px 3px 38px',
        fontSize: '13px',
        color: '#374151',
        cursor: batchMode ? 'pointer' : 'grab',
        borderRadius: '4px',
        transition: 'all 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0',
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
            title="添加到AI工作方法收藏"
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
  allCanvasData,
  libraryData = [],
  embedded = false,
  externalSearchQuery
}) => {
  const [sidebarData, setSidebarData] = useState<SidebarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // 默认所有section都是折叠的（页面刷新时）
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set([
      'quick-start', 'my-workflows', 'canvas-structure', 'favorites',
      'templates', 'recommended', 'uncategorized',
      // 6个标签大类默认折叠
      ...WORKFLOW_CATEGORIES.map(c => `category-${c.id}`)
    ])
  )
  const [isInitialLoad, setIsInitialLoad] = useState(true) // 标记是否首次加载
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery
  const setSearchQuery = setInternalSearchQuery
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<FavoriteTag | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    workflow: Workflow | null
    position: { x: number; y: number }
  }>({ workflow: null, position: { x: 0, y: 0 } })
  const contextMenuWorkflowRef = useRef<Workflow | null>(null)
  const [batchMode, setBatchMode] = useState(false)
  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<string>>(new Set())
  const [localSavedWorkflows, setLocalSavedWorkflows] = useState<any[]>([])
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingSectionName, setEditingSectionName] = useState('')

  // 轻量确认气泡
  const [confirmPopup, setConfirmPopup] = useState<{
    visible: boolean
    position: { x: number; y: number }
    message: string
    onConfirm: () => void
  }>({ visible: false, position: { x: 0, y: 0 }, message: '', onConfirm: () => {} })

  // 输入气泡（替代 prompt()）
  const [inputPopup, setInputPopup] = useState<{
    visible: boolean
    position: { x: number; y: number }
    placeholder: string
    onSubmit: (value: string) => void
  }>({ visible: false, position: { x: 0, y: 0 }, placeholder: '', onSubmit: () => {} })
  const [inputPopupValue, setInputPopupValue] = useState('')

  // 自定义分类（按父区域分组存储）
  type CustomCategory = { id: string; name: string; parent: 'quick-start' | 'my-workflows' }
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(() => {
    try { return JSON.parse(localStorage.getItem('customSidebarCategories') || '[]') } catch { return [] }
  })
  const updateCustomCategories = (updater: (prev: CustomCategory[]) => CustomCategory[]) => {
    setCustomCategories(prev => {
      const next = updater(prev)
      localStorage.setItem('customSidebarCategories', JSON.stringify(next))
      return next
    })
  }
  const addCustomCategory = (parent: 'quick-start' | 'my-workflows', name: string) => {
    const newCat: CustomCategory = { id: `custom-${Date.now()}`, name, parent }
    updateCustomCategories(prev => [...prev, newCat])
    // 自动展开父区域
    setCollapsedSections(prev => {
      const next = new Set(prev)
      next.delete(parent)
      return next
    })
  }
  const renameCustomCategory = (id: string, newName: string) => {
    updateCustomCategories(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c))
  }
  const deleteCustomCategory = (id: string) => {
    updateCustomCategories(prev => prev.filter(c => c.id !== id))
  }

  // 隐藏的系统分类（用户删除的二级分组）
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('hiddenSidebarCategories') || '[]')) } catch { return new Set() }
  })
  const hideCategory = (categoryId: string) => {
    setHiddenCategories(prev => {
      const next = new Set(prev)
      next.add(categoryId)
      localStorage.setItem('hiddenSidebarCategories', JSON.stringify(Array.from(next)))
      return next
    })
  }

  // 隐藏的二级分组（快速开始下的 templates/recommended 等）
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('hiddenSidebarSections') || '[]')) } catch { return new Set() }
  })
  const hideSection = (sectionId: string) => {
    setHiddenSections(prev => {
      const next = new Set(prev)
      next.add(sectionId)
      localStorage.setItem('hiddenSidebarSections', JSON.stringify(Array.from(next)))
      return next
    })
  }

  // 重命名的二级分组标题
  const [renamedSections, setRenamedSections] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('renamedSidebarSections') || '{}')
    } catch (error) {
      console.warn('[NavigationSidebar] 读取重命名的分组失败:', error)
      return {}
    }
  })
  const renameSection = (sectionId: string, newName: string) => {
    setRenamedSections(prev => {
      const next = { ...prev, [sectionId]: newName }
      localStorage.setItem('renamedSidebarSections', JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    loadSidebarData()
  }, [])

  // 加载本地保存的工作流
  useEffect(() => {
    const loadLocal = () => {
      const saved = JSON.parse(localStorage.getItem('savedWorkflows') || '[]')
      setLocalSavedWorkflows(saved)
    }
    loadLocal()
    window.addEventListener('savedWorkflowsUpdated', loadLocal)
    return () => window.removeEventListener('savedWorkflowsUpdated', loadLocal)
  }, [])

  const loadSidebarData = async () => {
    // 检查用户是否已登录
    if (!authService.isAuthenticated()) {
      console.log('User not authenticated, skipping sidebar data load')
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await navigationService.getSidebarData()
      setSidebarData(data)

      // 只在首次加载时设置默认折叠状态
      if (isInitialLoad) {
        const defaultCollapsed = new Set([
          'templates', 'recommended', 'recent', 'drafts', 'published', 'uncategorized', 'favorites',
          // 6个标签大类默认折叠
          ...WORKFLOW_CATEGORIES.map(c => `category-${c.id}`)
        ])
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

    // Save to backend only if authenticated
    if (authService.isAuthenticated()) {
      try {
        await navigationService.updatePreferences({
          collapsedSections: Array.from(newCollapsed)
        })
      } catch (err) {
        console.error('Failed to save preferences:', err)
      }
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
    contextMenuWorkflowRef.current = workflow
    setContextMenu({
      workflow,
      position: { x: e.clientX, y: e.clientY }
    })
  }

  const handleWorkflowOpen = () => {
    const wf = contextMenuWorkflowRef.current
    if (wf) {
      onWorkflowSelect?.(wf.id)
    }
  }

  const handleWorkflowCopy = () => {
    const wf = contextMenuWorkflowRef.current
    if (wf) {
      // TODO: Implement copy workflow logic
      console.log('Copy workflow:', wf.id)
    }
  }

  const handleWorkflowDelete = async () => {
    const workflow = contextMenuWorkflowRef.current
    if (!workflow) return
    if (!confirm(`确定要删除"${workflow.title}"吗？此操作不可撤销。`)) return
    try {
      await deleteWorkflow(workflow.id)
      contextMenuWorkflowRef.current = null
      loadSidebarData()
      onRefresh?.()
    } catch (err) {
      console.error('删除工作流失败:', err)
      alert('删除失败，请重试')
    }
  }

  const handleAddToFavorites = () => {
    const wf = contextMenuWorkflowRef.current
    if (wf) {
      // TODO: Implement add to favorites logic
      console.log('Add to favorites:', wf.id)
    }
  }

  const handleWorkflowEdit = () => {
    const wf = contextMenuWorkflowRef.current
    if (wf) {
      // TODO: Implement edit workflow logic
      console.log('Edit workflow:', wf.id)
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

  const handleBatchDelete = async () => {
    if (selectedWorkflows.size === 0) return
    if (!confirm(`确定要删除选中的 ${selectedWorkflows.size} 个AI工作方法吗？此操作不可撤销。`)) return
    try {
      await Promise.all(Array.from(selectedWorkflows).map(id => deleteWorkflow(id)))
      setSelectedWorkflows(new Set())
      setBatchMode(false)
      loadSidebarData()
      onRefresh?.()
    } catch (err) {
      console.error('批量删除失败:', err)
      alert('部分删除失败，请刷新后重试')
      loadSidebarData()
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
    icon?: string,
    actions?: { onRename?: (e: React.MouseEvent) => void; onDelete?: (e: React.MouseEvent) => void }
  ) => {
    const isCollapsed = collapsedSections.has(sectionId)
    const filteredItems = filterWorkflows(items)
    const isEditing = editingSectionId === sectionId
    const count = searchQuery ? filteredItems.length : items.length
    const displayTitle = renamedSections[sectionId] || title

    return (
      <div style={{ marginBottom: '2px' }}>
        <div
          onClick={() => { if (!isEditing) toggleSection(sectionId) }}
          onMouseEnter={(e) => {
            setHoveredSectionId(sectionId)
            e.currentTarget.style.backgroundColor = '#F5F5F7'
            const ic = e.currentTarget.querySelector('.expand-icon') as HTMLElement
            if (ic) ic.style.color = '#5B5B5F'
          }}
          onMouseLeave={(e) => {
            setHoveredSectionId(null)
            e.currentTarget.style.backgroundColor = 'transparent'
            const ic = e.currentTarget.querySelector('.expand-icon') as HTMLElement
            if (ic) ic.style.color = '#8E8E93'
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 16px 5px 30px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#4B5563',
            cursor: 'pointer',
            userSelect: 'none',
            borderRadius: '6px',
            transition: 'background-color 0.2s ease',
            marginBottom: '1px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
            {icon && <span>{icon}</span>}
            {isEditing ? (
              <input
                autoFocus
                value={editingSectionName}
                onChange={(e) => setEditingSectionName(e.target.value)}
                onBlur={() => {
                  const trimmed = editingSectionName.trim()
                  if (trimmed && trimmed !== title) {
                    renameSection(sectionId, trimmed)
                  }
                  setEditingSectionId(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.currentTarget.blur() }
                  if (e.key === 'Escape') setEditingSectionId(null)
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1, fontSize: '13px', fontWeight: 600, color: '#4B5563',
                  border: 'none', borderBottom: '1.5px solid #8b5cf6', outline: 'none',
                  background: 'transparent', padding: '0 2px', minWidth: 0
                }}
              />
            ) : (
              <>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayTitle}</span>
                <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 400, flexShrink: 0 }}>({count})</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            {actions && renderSectionActions({ sectionId, ...actions })}
            <span
              className="expand-icon"
              style={{
                color: '#8E8E93',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                flexShrink: 0,
                transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'
              }}
            >
              <ChevronRight size={14} />
            </span>
          </div>
        </div>
        {!isCollapsed && (
          <div style={{
            marginTop: '1px',
            animation: 'fadeIn 0.2s ease-in'
          }}>
            {filteredItems.length > 0 ? (
              filteredItems.map((workflow) => (
                <WorkflowItem
                  key={workflow.id}
                  workflow={workflow}
                  batchMode={batchMode}
                  isSelected={selectedWorkflows.has(workflow.id)}
                  onDragStart={(e) => {
                    if (!batchMode) {
                      e.dataTransfer.setData('workflow-library-id', workflow.id)
                      e.dataTransfer.effectAllowed = 'copy'
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
                padding: '0.5rem 1rem',
                fontSize: '12px',
                color: '#9ca3af',
                textAlign: 'center'
              }}>
                {searchQuery ? '未找到匹配的AI工作方法' : `暂无${displayTitle}`}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // 获取所有工作流（合并recent, drafts, published）
  const getAllMyWorkflows = (): Workflow[] => {
    if (!sidebarData) return []
    const allWorkflows = [
      ...sidebarData.myWorkflows.recent,
      ...sidebarData.myWorkflows.drafts,
      ...sidebarData.myWorkflows.published
    ]
    // 去重（基于id）
    const uniqueMap = new Map<string, Workflow>()
    allWorkflows.forEach(w => {
      if (!uniqueMap.has(w.id)) {
        uniqueMap.set(w.id, w)
      }
    })
    return Array.from(uniqueMap.values())
  }

  // 按标签大类分组工作流
  const getWorkflowsByCategory = (categoryName: string): Workflow[] => {
    const allWorkflows = getAllMyWorkflows()
    return allWorkflows.filter(w => w.category === categoryName)
  }

  // 渲染标签大类
  const renderCategorySection = (category: WorkflowCategory) => {
    const sectionId = `category-${category.id}`
    const isCollapsed = collapsedSections.has(sectionId)
    const workflows = getWorkflowsByCategory(category.name)
    const filteredWorkflows = filterWorkflows(workflows)
    const isEditing = editingSectionId === sectionId

    return (
      <div key={category.id} style={{ marginBottom: '2px' }}>
        <div
          onClick={() => { if (!isEditing) toggleSection(sectionId) }}
          onMouseEnter={(e) => {
            setHoveredSectionId(sectionId)
            e.currentTarget.style.backgroundColor = '#F5F5F7'
            const ic = e.currentTarget.querySelector('.expand-icon') as HTMLElement
            if (ic) ic.style.color = '#5B5B5F'
          }}
          onMouseLeave={(e) => {
            setHoveredSectionId(null)
            e.currentTarget.style.backgroundColor = 'transparent'
            const ic = e.currentTarget.querySelector('.expand-icon') as HTMLElement
            if (ic) ic.style.color = '#8E8E93'
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 16px 5px 30px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#4B5563',
            cursor: 'pointer',
            userSelect: 'none',
            borderRadius: '6px',
            transition: 'background-color 0.2s ease',
            marginBottom: '1px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
            {isEditing ? (
              <input
                autoFocus
                value={editingSectionName}
                onChange={(e) => setEditingSectionName(e.target.value)}
                onBlur={() => setEditingSectionId(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') setEditingSectionId(null)
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1, fontSize: '13px', fontWeight: 600, color: '#4B5563',
                  border: 'none', borderBottom: '1.5px solid #8b5cf6', outline: 'none',
                  background: 'transparent', padding: '0 2px', minWidth: 0
                }}
              />
            ) : (
              <>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{category.name}</span>
                <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 400, flexShrink: 0 }}>({searchQuery ? filteredWorkflows.length : workflows.length})</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            {renderSectionActions({
              sectionId,
              onRename: (e) => startRenameSection(sectionId, category.name, e),
              onDelete: (e) => {
                e.stopPropagation()
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                setConfirmPopup({
                  visible: true,
                  position: { x: rect.left - 120, y: rect.bottom + 4 },
                  message: `删除"${category.name}"？`,
                  onConfirm: () => { hideCategory(category.id); setConfirmPopup(p => ({ ...p, visible: false })) }
                })
              }
            })}
            <span
              className="expand-icon"
              style={{
                color: '#8E8E93',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                flexShrink: 0,
                transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'
              }}
            >
              <ChevronRight size={14} />
            </span>
          </div>
        </div>
        {!isCollapsed && (
          <div style={{
            marginTop: '1px',
            animation: 'fadeIn 0.2s ease-in'
          }}>
            {filteredWorkflows.length > 0 ? (
              filteredWorkflows.map((workflow) => (
                <WorkflowItem
                  key={workflow.id}
                  workflow={workflow}
                  batchMode={batchMode}
                  isSelected={selectedWorkflows.has(workflow.id)}
                  onDragStart={(e) => {
                    if (!batchMode) {
                      e.dataTransfer.setData('workflow-library-id', workflow.id)
                      e.dataTransfer.effectAllowed = 'copy'
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
                padding: '0.5rem 1rem',
                fontSize: '12px',
                color: '#9ca3af',
                textAlign: 'center'
              }}>
                {searchQuery ? '未找到匹配的AI工作方法' : `暂无${category.name}`}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // 按标签分组本地保存的工作流
  const getLocalWorkflowsByTag = (): Record<string, any[]> => {
    const groups: Record<string, any[]> = {}
    localSavedWorkflows.forEach(w => {
      if (w.tags && w.tags.length > 0) {
        w.tags.forEach((tag: string) => {
          if (!groups[tag]) groups[tag] = []
          groups[tag].push(w)
        })
      } else {
        if (!groups['未分类']) groups['未分类'] = []
        groups['未分类'].push(w)
      }
    })
    return groups
  }

  const renderLocalTagSection = (tag: string, workflows: any[]) => {
    const sectionId = `local-tag-${tag}`
    const isCollapsed = collapsedSections.has(sectionId)
    const isEditing = editingSectionId === sectionId

    return (
      <div key={tag} style={{ marginBottom: '2px' }}>
        <div
          onClick={() => { if (!isEditing) toggleSection(sectionId) }}
          onMouseEnter={(e) => {
            setHoveredSectionId(sectionId)
            e.currentTarget.style.backgroundColor = '#F5F5F7'
          }}
          onMouseLeave={(e) => {
            setHoveredSectionId(null)
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 16px 5px 30px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#4B5563',
            cursor: 'pointer',
            userSelect: 'none',
            borderRadius: '6px',
            transition: 'background-color 0.2s ease',
            marginBottom: '1px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
            {isEditing ? (
              <input
                autoFocus
                value={editingSectionName}
                onChange={(e) => setEditingSectionName(e.target.value)}
                onBlur={() => saveRenameLocalTag(tag)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') setEditingSectionId(null)
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1, fontSize: '13px', fontWeight: 600, color: '#4B5563',
                  border: 'none', borderBottom: '1.5px solid #8b5cf6', outline: 'none',
                  background: 'transparent', padding: '0 2px', minWidth: 0
                }}
              />
            ) : (
              <>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tag}</span>
                <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 400, flexShrink: 0 }}>({workflows.length})</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            {renderSectionActions({
              sectionId,
              onRename: (e) => startRenameSection(sectionId, tag, e),
              onDelete: (e) => handleDeleteLocalTag(tag, e)
            })}
            <span style={{
              color: '#8E8E93', transition: 'all 0.2s ease',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '16px', height: '16px', flexShrink: 0,
              transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'
            }}>
              <ChevronRight size={14} />
            </span>
          </div>
        </div>
        {!isCollapsed && (
          <div style={{ marginTop: '0.25rem' }}>
            {workflows.map(w => (
              <div
                key={w.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 16px 4px 38px',
                  fontSize: '13px',
                  color: '#3C3C43',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('workflow-library-id', w.id)
                  e.dataTransfer.effectAllowed = 'copy'
                  onWorkflowDragStart?.(w.id)
                }}
                onDragEnd={() => { onWorkflowDragEnd?.() }}
              >
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#8b5cf6', flexShrink: 0
                }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {w.title}
                </span>
                <span style={{ fontSize: '12px', color: '#9ca3af', flexShrink: 0 }}>
                  {w.steps?.length || 0}步
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 渲染自定义分类（空分类，可拖入工作流）
  const renderCustomCategorySection = (cat: CustomCategory) => {
    const sectionId = `custom-cat-${cat.id}`
    const isCollapsed = collapsedSections.has(sectionId)
    const isEditing = editingSectionId === sectionId

    return (
      <div key={cat.id} style={{ marginBottom: '2px' }}>
        <div
          onClick={() => { if (!isEditing) toggleSection(sectionId) }}
          onMouseEnter={(e) => {
            setHoveredSectionId(sectionId)
            e.currentTarget.style.backgroundColor = '#F5F5F7'
          }}
          onMouseLeave={(e) => {
            setHoveredSectionId(null)
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 16px 5px 30px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#4B5563',
            cursor: 'pointer',
            userSelect: 'none',
            borderRadius: '6px',
            transition: 'background-color 0.2s ease',
            marginBottom: '1px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
            {isEditing ? (
              <input
                autoFocus
                value={editingSectionName}
                onChange={(e) => setEditingSectionName(e.target.value)}
                onBlur={() => {
                  const trimmed = editingSectionName.trim()
                  if (trimmed && trimmed !== cat.name) renameCustomCategory(cat.id, trimmed)
                  setEditingSectionId(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') setEditingSectionId(null)
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1, fontSize: '13px', fontWeight: 600, color: '#4B5563',
                  border: 'none', borderBottom: '1.5px solid #8b5cf6', outline: 'none',
                  background: 'transparent', padding: '0 2px', minWidth: 0
                }}
              />
            ) : (
              <>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 400, flexShrink: 0 }}>(0)</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            {renderSectionActions({
              sectionId,
              onRename: (e) => startRenameSection(sectionId, cat.name, e),
              onDelete: (e) => {
                e.stopPropagation()
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                setConfirmPopup({
                  visible: true,
                  position: { x: rect.left - 120, y: rect.bottom + 4 },
                  message: `删除分组"${cat.name}"？`,
                  onConfirm: () => { deleteCustomCategory(cat.id); setConfirmPopup(p => ({ ...p, visible: false })) }
                })
              }
            })}
            <span style={{
              color: '#8E8E93', transition: 'all 0.2s ease',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '16px', height: '16px', flexShrink: 0,
              transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'
            }}>
              <ChevronRight size={14} />
            </span>
          </div>
        </div>
        {!isCollapsed && (
          <div style={{
            padding: '8px 16px 8px 38px',
            fontSize: '12px',
            color: '#9ca3af',
            textAlign: 'center'
          }}>
            暂无内容，拖入工作流即可
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


  const handleTagModalSuccess = () => {
    loadSidebarData()
  }

  // 删除收藏标签
  const handleDeleteFavoriteTag = (tag: FavoriteTag, e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setConfirmPopup({
      visible: true,
      position: { x: rect.left - 120, y: rect.bottom + 4 },
      message: `删除标签"${tag.name}"？`,
      onConfirm: async () => {
        setConfirmPopup(p => ({ ...p, visible: false }))
        try {
          await favoritesService.deleteTag(tag.id)
          loadSidebarData()
        } catch (err) {
          console.error('Failed to delete tag:', err)
          alert('删除失败，请重试')
        }
      }
    })
  }

  // 开始内联重命名
  const startRenameSection = (sectionId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSectionId(sectionId)
    setEditingSectionName(currentName)
  }

  // 保存重命名（收藏标签）
  const saveRenameFavoriteTag = async (tagId: string) => {
    const trimmed = editingSectionName.trim()
    if (!trimmed) {
      setEditingSectionId(null)
      return
    }
    try {
      await favoritesService.updateTag(tagId, { name: trimmed })
      loadSidebarData()
    } catch (err) {
      console.error('Failed to rename tag:', err)
      alert('重命名失败，请重试')
    }
    setEditingSectionId(null)
  }

  // 保存重命名（本地标签）
  const saveRenameLocalTag = (oldTag: string) => {
    const trimmed = editingSectionName.trim()
    if (!trimmed || trimmed === oldTag) {
      setEditingSectionId(null)
      return
    }
    const saved = JSON.parse(localStorage.getItem('savedWorkflows') || '[]')
    const updated = saved.map((w: any) => ({
      ...w,
      tags: (w.tags || []).map((t: string) => t === oldTag ? trimmed : t)
    }))
    localStorage.setItem('savedWorkflows', JSON.stringify(updated))
    setLocalSavedWorkflows(updated)
    window.dispatchEvent(new Event('savedWorkflowsUpdated'))
    setEditingSectionId(null)
  }

  // 删除本地标签
  const handleDeleteLocalTag = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const btn = (e.currentTarget as HTMLElement)
    const rect = btn.getBoundingClientRect()
    if (tag === '未分类') {
      // "未分类"是虚拟分组，删除 = 删除所有无标签的工作流
      setConfirmPopup({
        visible: true,
        position: { x: rect.left - 120, y: rect.bottom + 4 },
        message: `清空"未分类"中的工作流？`,
        onConfirm: () => {
          setConfirmPopup(p => ({ ...p, visible: false }))
          const saved = JSON.parse(localStorage.getItem('savedWorkflows') || '[]')
          const updated = saved.filter((w: any) => w.tags && w.tags.length > 0)
          localStorage.setItem('savedWorkflows', JSON.stringify(updated))
          setLocalSavedWorkflows(updated)
          window.dispatchEvent(new Event('savedWorkflowsUpdated'))
        }
      })
    } else {
      setConfirmPopup({
        visible: true,
        position: { x: rect.left - 120, y: rect.bottom + 4 },
        message: `删除分组"${tag}"？`,
        onConfirm: () => {
          setConfirmPopup(p => ({ ...p, visible: false }))
          const saved = JSON.parse(localStorage.getItem('savedWorkflows') || '[]')
          const updated = saved.map((w: any) => ({
            ...w,
            tags: (w.tags || []).filter((t: string) => t !== tag)
          }))
          localStorage.setItem('savedWorkflows', JSON.stringify(updated))
          setLocalSavedWorkflows(updated)
          window.dispatchEvent(new Event('savedWorkflowsUpdated'))
        }
      })
    }
  }


  // 渲染二级标题的行内操作按钮
  // 渲染二级标题的行内操作按钮（只有 重命名 和 删除）
  const renderSectionActions = (options: {
    sectionId: string
    onRename?: (e: React.MouseEvent) => void
    onDelete?: (e: React.MouseEvent) => void
  }) => {
    const isHovered = hoveredSectionId === options.sectionId
    if (editingSectionId === options.sectionId) return null
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1px',
        opacity: isHovered ? 1 : 0,
        pointerEvents: isHovered ? 'auto' : 'none',
        transition: 'opacity 0.15s'
      }}>
        {options.onRename && (
          <button
            onClick={options.onRename}
            title="重命名"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '20px', height: '20px', border: 'none', borderRadius: '4px',
              background: 'transparent', cursor: 'pointer', padding: 0,
              color: '#9CA3AF', transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#E0E7FF'; e.currentTarget.style.color = '#6366F1' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
          >
            <Pencil size={11} />
          </button>
        )}
        {options.onDelete && (
          <button
            onClick={options.onDelete}
            title="删除"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '20px', height: '20px', border: 'none', borderRadius: '4px',
              background: 'transparent', cursor: 'pointer', padding: 0,
              color: '#9CA3AF', transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
          >
            <X size={13} />
          </button>
        )}
      </div>
    )
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

  // 渲染单个画布的内容
  const renderSingleCanvasContent = (items: CanvasItemsMap) => {
    const ROOT_CONTAINER_ID = 'canvas-root'
    const containers = Object.values(items).filter(
      (item): item is ContainerCanvasItem => item.type === 'container' && item.id !== ROOT_CONTAINER_ID
    )
    const workflows = Object.values(items).filter(
      (item): item is WorkflowCanvasItem => item.type === 'workflow'
    )
    const rootContainers = containers.filter(c => c.parentId === ROOT_CONTAINER_ID)
    const rootWorkflows = workflows.filter(w => w.parentId === ROOT_CONTAINER_ID)

    if (rootContainers.length === 0 && rootWorkflows.length === 0) {
      return (
        <div style={{ padding: '0.5rem 1rem', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
          画布为空
        </div>
      )
    }

    // 渲染容器需要用到对应的 items
    const renderContainerItemForCanvas = (container: ContainerCanvasItem, depth: number = 0) => {
      const containerWorkflows = workflows.filter(w => w.parentId === container.id)
      const childContainers = containers.filter(c => c.parentId === container.id)
      const isContainerCollapsed = collapsedSections.has(`canvas-container-${container.id}`)

      return (
        <div key={container.id} style={{ marginBottom: '0.25rem' }}>
          <div
            onClick={() => toggleSection(`canvas-container-${container.id}`)}
            style={{
              paddingLeft: `${depth * 16 + 36}px`,
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
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

              <span>{container.name}</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                ({containerWorkflows.length + childContainers.length})
              </span>
            </div>
            <span style={{
              color: '#8E8E93',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              transform: isContainerCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'
            }}>
              <ChevronRight size={14} />
            </span>
          </div>
          {!isContainerCollapsed && (
            <div>
              {childContainers.map(c => renderContainerItemForCanvas(c, depth + 1))}
              {containerWorkflows.map(workflow => {
                const workflowData = libraryData.find(w => w.id === workflow.workflowId)
                return (
                  <div key={workflow.id} style={{
                    paddingLeft: `${(depth + 1) * 16 + 36}px`, paddingRight: '16px',
                    paddingTop: '6px', paddingBottom: '6px', fontSize: '13px', color: '#6b7280',
                    borderRadius: '6px', transition: 'background-color 0.2s ease',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <span>{workflowData?.name || '未命名工作流'}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    return (
      <>
        {rootContainers.map(container => renderContainerItemForCanvas(container, 0))}
        {rootWorkflows.map(workflow => {
          const workflowData = libraryData.find(w => w.id === workflow.workflowId)
          return (
            <div key={workflow.id} style={{
              paddingLeft: '36px', paddingRight: '16px', paddingTop: '6px', paddingBottom: '6px',
              fontSize: '13px', color: '#6b7280', borderRadius: '6px',
              transition: 'background-color 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px'
            }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <span>{workflowData?.name || '未命名工作流'}</span>
            </div>
          )
        })}
      </>
    )
  }

  // 渲染画布结构
  const renderCanvasStructure = () => {
    const isCollapsed = collapsedSections.has('canvas-structure')

    // 确定要展示的画布数据
    const canvasDataList = allCanvasData && allCanvasData.length > 0
      ? allCanvasData
      : [{ tabId: 'current', title: '当前画布', items: canvasItems }]

    return (
      <div style={{ marginBottom: '0.5rem' }}>
        <div
          onClick={() => toggleSection('canvas-structure')}
          style={{
            padding: '0.25rem 1rem 0.4rem 1rem',
            fontSize: '14px',
            fontWeight: 700,
            color: '#1A1A1A',
            marginBottom: '0.25rem',
            marginTop: '12px',
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
            color: '#8E8E93',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            flexShrink: 0,
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'
          }}>
            <ChevronRight size={14} />
          </span>
        </div>

        {!isCollapsed && (
          <div>
            {canvasDataList.map(canvasData => {
              const tabSectionId = `canvas-tab-${canvasData.tabId}`
              const isTabCollapsed = collapsedSections.has(tabSectionId)

              return (
                <div key={canvasData.tabId} style={{ marginBottom: '2px' }}>
                  {/* 每个画布Tab的标题 */}
                  <div
                    onClick={() => toggleSection(tabSectionId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 16px 5px 23px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#4B5563',
                      cursor: 'pointer',
                      userSelect: 'none',
                      borderRadius: '6px',
                      transition: 'background-color 0.2s ease',
                      marginBottom: '1px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>{canvasData.title}</span>
                    </div>
                    <span style={{
                      color: '#8E8E93',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      transform: isTabCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'
                    }}>
                      <ChevronRight size={14} />
                    </span>
                  </div>
                  {/* 该画布的内容 */}
                  {!isTabCollapsed && (
                    <div>
                      {renderSingleCanvasContent(canvasData.items)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderFavoriteTag = (tag: FavoriteTag, workflows: Workflow[]) => {
    const sectionId = `favorite-tag-${tag.id}`
    const isCollapsed = collapsedSections.has(sectionId)
    const filteredWorkflows = filterWorkflows(workflows)
    const isEditing = editingSectionId === sectionId

    return (
      <div
        key={tag.id}
        style={{ marginBottom: '2px' }}
        draggable={!isEditing}
        onDragStart={(e) => handleTagDragStart(tag, e)}
        onDragOver={(e) => handleTagDragOver(tag, e)}
        onDragLeave={handleTagDragLeave}
        onDrop={(e) => handleTagDrop(tag, e)}
      >
        <div
          onClick={() => { if (!isEditing) toggleSection(sectionId) }}
          onMouseEnter={(e) => {
            setHoveredSectionId(sectionId)
            e.currentTarget.style.backgroundColor = '#F5F5F7'
            const ic = e.currentTarget.querySelector('.expand-icon') as HTMLElement
            if (ic) ic.style.color = '#5B5B5F'
          }}
          onMouseLeave={(e) => {
            setHoveredSectionId(null)
            e.currentTarget.style.backgroundColor = 'transparent'
            const ic = e.currentTarget.querySelector('.expand-icon') as HTMLElement
            if (ic) ic.style.color = '#8E8E93'
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 16px 5px 30px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#4B5563',
            cursor: 'pointer',
            userSelect: 'none',
            borderRadius: '6px',
            transition: 'background-color 0.2s ease',
            marginBottom: '1px',
            opacity: draggedTag?.id === tag.id ? 0.5 : 1
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            {isEditing ? (
              <input
                autoFocus
                value={editingSectionName}
                onChange={(e) => setEditingSectionName(e.target.value)}
                onBlur={() => saveRenameFavoriteTag(tag.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') setEditingSectionId(null)
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1, fontSize: '13px', fontWeight: 600, color: '#4B5563',
                  border: 'none', borderBottom: '1.5px solid #8b5cf6', outline: 'none',
                  background: 'transparent', padding: '0 2px', minWidth: 0
                }}
              />
            ) : (
              <>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tag.name}</span>
                <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 400, flexShrink: 0 }}>({searchQuery ? filteredWorkflows.length : workflows.length})</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            {renderSectionActions({
              sectionId,
              onRename: (e) => startRenameSection(sectionId, tag.name, e),
              onDelete: (e) => handleDeleteFavoriteTag(tag, e)
            })}
            <span
              className="expand-icon"
              style={{
                color: '#8E8E93',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                flexShrink: 0,
                transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'
              }}
            >
              <ChevronRight size={14} />
            </span>
          </div>
        </div>
        {!isCollapsed && filteredWorkflows.length > 0 && (
          <div style={{ marginTop: '0.25rem', animation: 'fadeIn 0.2s ease-in' }}>
            {filteredWorkflows.map((workflow) => (
              <WorkflowItem
                key={workflow.id}
                workflow={workflow}
                batchMode={batchMode}
                isSelected={selectedWorkflows.has(workflow.id)}
                onDragStart={(e) => {
                  if (!batchMode) {
                    e.dataTransfer.setData('workflow-library-id', workflow.id)
                    e.dataTransfer.effectAllowed = 'copy'
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
            未找到匹配的AI工作方法
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{
        width: embedded ? '100%' : '280px',
        height: '100%',
        backgroundColor: embedded ? 'transparent' : 'white',
        borderRight: embedded ? 'none' : '1px solid #e5e7eb',
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
        width: embedded ? '100%' : '280px',
        height: '100%',
        backgroundColor: embedded ? 'transparent' : 'white',
        borderRight: embedded ? 'none' : '1px solid #e5e7eb',
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

  if (!sidebarData) {
    return (
      <div style={{
        width: embedded ? '100%' : '280px',
        height: '100%',
        backgroundColor: embedded ? 'transparent' : 'white',
        borderRight: embedded ? 'none' : '1px solid #e5e7eb',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center' }}>
          {authService.isAuthenticated() ? '暂无工作流数据' : '请先登录'}
        </div>
      </div>
    )
  }

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
        width: embedded ? '100%' : '280px',
        height: '100%',
        backgroundColor: embedded ? 'transparent' : 'white',
        borderRight: embedded ? 'none' : '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.5rem'
      }}>
        {/* Quick Start Section */}
        <div style={{ marginBottom: '0.5rem' }}>
          <div
            onClick={() => toggleSection('quick-start')}
            style={{
              padding: '0.25rem 1rem 0.4rem 1rem',
              fontSize: '14px',
              fontWeight: 700,
              color: '#1A1A1A',
              marginBottom: '0.25rem',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  setInputPopupValue('')
                  setInputPopup({
                    visible: true,
                    position: { x: rect.left - 160, y: rect.bottom + 4 },
                    placeholder: '添加分组',
                    onSubmit: (name) => { addCustomCategory('quick-start', name); setInputPopup(p => ({ ...p, visible: false })) }
                  })
                }}
                title="新增分类"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '20px', height: '20px', border: 'none', borderRadius: '5px',
                  background: 'transparent', cursor: 'pointer', padding: 0,
                  color: '#9CA3AF', transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#E0E7FF'; e.currentTarget.style.color = '#6366F1' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
              >
                <Plus size={14} />
              </button>
              <span style={{
                color: '#8E8E93',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                flexShrink: 0,
                transform: collapsedSections.has('quick-start') ? 'rotate(0deg)' : 'rotate(90deg)'
              }}>
                <ChevronRight size={14} />
              </span>
            </div>
          </div>
          {!collapsedSections.has('quick-start') && (
            <>
              {!hiddenSections.has('templates') && renderSection('模板AI工作方法', 'templates', sidebarData.quickStart.templates, undefined, {
                onRename: (e) => startRenameSection('templates', renamedSections['templates'] || '模板AI工作方法', e),
                onDelete: (e) => {
                  e.stopPropagation()
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  setConfirmPopup({
                    visible: true,
                    position: { x: rect.left - 120, y: rect.bottom + 4 },
                    message: `删除"${renamedSections['templates'] || '模板AI工作方法'}"？`,
                    onConfirm: () => { hideSection('templates'); setConfirmPopup(p => ({ ...p, visible: false })) }
                  })
                }
              })}
              {!hiddenSections.has('recommended') && renderSection('推荐AI工作方法', 'recommended', sidebarData.quickStart.recommended, undefined, {
                onRename: (e) => startRenameSection('recommended', renamedSections['recommended'] || '推荐AI工作方法', e),
                onDelete: (e) => {
                  e.stopPropagation()
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  setConfirmPopup({
                    visible: true,
                    position: { x: rect.left - 120, y: rect.bottom + 4 },
                    message: `删除"${renamedSections['recommended'] || '推荐AI工作方法'}"？`,
                    onConfirm: () => { hideSection('recommended'); setConfirmPopup(p => ({ ...p, visible: false })) }
                  })
                }
              })}
              {customCategories.filter(c => c.parent === 'quick-start').map(cat => renderCustomCategorySection(cat))}
            </>
          )}
        </div>

        {/* My Workflows Section */}
        <div style={{ marginBottom: '0.5rem' }}>
          <div
            onClick={() => toggleSection('my-workflows')}
            style={{
              padding: '0.25rem 1rem 0.4rem 1rem',
              fontSize: '14px',
              fontWeight: 700,
              color: '#1A1A1A',
              marginBottom: '0.25rem',
              marginTop: '12px',
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
            }}>我的AI工作法</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  setInputPopupValue('')
                  setInputPopup({
                    visible: true,
                    position: { x: rect.left - 160, y: rect.bottom + 4 },
                    placeholder: '添加分组',
                    onSubmit: (name) => { addCustomCategory('my-workflows', name); setInputPopup(p => ({ ...p, visible: false })) }
                  })
                }}
                title="新增分类"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '20px', height: '20px', border: 'none', borderRadius: '5px',
                  background: 'transparent', cursor: 'pointer', padding: 0,
                  color: '#9CA3AF', transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#E0E7FF'; e.currentTarget.style.color = '#6366F1' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
              >
                <Plus size={14} />
              </button>
              <span style={{
                color: '#8E8E93',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                flexShrink: 0,
                transform: collapsedSections.has('my-workflows') ? 'rotate(0deg)' : 'rotate(90deg)'
              }}>
                <ChevronRight size={14} />
              </span>
            </div>
          </div>
          {!collapsedSections.has('my-workflows') && (
            <>
              {/* 本地保存的工作流按标签分组 */}
              {Object.entries(getLocalWorkflowsByTag()).map(([tag, workflows]) =>
                renderLocalTagSection(tag, workflows)
              )}
              {/* 按6个标签大类显示工作流 */}
              {WORKFLOW_CATEGORIES.filter(c => !hiddenCategories.has(c.id)).map(category => renderCategorySection(category))}
              {/* 自定义分类 */}
              {customCategories.filter(c => c.parent === 'my-workflows').map(cat => renderCustomCategorySection(cat))}
            </>
          )}
        </div>

        {/* Favorites Section */}
        <div style={{ marginBottom: '0.5rem' }}>
          <div
            onClick={() => toggleSection('favorites')}
            style={{
              padding: '0.25rem 1rem 0.4rem 1rem',
              fontSize: '14px',
              fontWeight: 700,
              color: '#1A1A1A',
              marginBottom: '0.25rem',
              marginTop: '12px',
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
            }}>AI工作方法收藏夹</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  setInputPopupValue('')
                  setInputPopup({
                    visible: true,
                    position: { x: rect.left - 160, y: rect.bottom + 4 },
                    placeholder: '添加分组',
                    onSubmit: async (name) => {
                      setInputPopup(p => ({ ...p, visible: false }))
                      try {
                        await favoritesService.createTag({ name })
                        loadSidebarData()
                      } catch (err) {
                        console.error('创建标签失败:', err)
                        alert('创建失败，请重试')
                      }
                    }
                  })
                }}
                title="新增收藏标签"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '20px', height: '20px', border: 'none', borderRadius: '5px',
                  background: 'transparent', cursor: 'pointer', padding: 0,
                  color: '#9CA3AF', transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#E0E7FF'; e.currentTarget.style.color = '#6366F1' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
              >
                <Plus size={14} />
              </button>
              <span style={{
                color: '#8E8E93',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                flexShrink: 0,
                transform: collapsedSections.has('favorites') ? 'rotate(0deg)' : 'rotate(90deg)'
              }}>
                <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {!collapsedSections.has('favorites') && (
            <>
              {sidebarData.favorites.tags.map((tag) =>
                renderFavoriteTag(
                  tag,
                  sidebarData.favorites.workflows[tag.id] || []
                )
              )}

              {sidebarData.favorites.uncategorized.length > 0 && !hiddenSections.has('fav-uncategorized') &&
                renderSection(
                  '未分类',
                  'fav-uncategorized',
                  sidebarData.favorites.uncategorized,
                  undefined,
                  {
                    onRename: (e) => startRenameSection('fav-uncategorized', renamedSections['fav-uncategorized'] || '未分类', e),
                    onDelete: (e) => {
                      e.stopPropagation()
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      setConfirmPopup({
                        visible: true,
                        position: { x: rect.left - 120, y: rect.bottom + 4 },
                        message: `删除"${renamedSections['fav-uncategorized'] || '未分类'}"？`,
                        onConfirm: () => { hideSection('fav-uncategorized'); setConfirmPopup(p => ({ ...p, visible: false })) }
                      })
                    }
                  }
                )}
            </>
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

      {/* 确认气泡 */}
      {confirmPopup.visible && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onClick={() => setConfirmPopup(p => ({ ...p, visible: false }))}
          />
          <div style={{
            position: 'fixed',
            left: confirmPopup.position.x,
            top: confirmPopup.position.y,
            zIndex: 9999,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ color: '#374151' }}>{confirmPopup.message}</span>
            <button
              onClick={() => confirmPopup.onConfirm()}
              style={{
                padding: '3px 10px', fontSize: '12px', fontWeight: 600,
                color: 'white', backgroundColor: '#ef4444', border: 'none',
                borderRadius: '5px', cursor: 'pointer'
              }}
            >确定</button>
            <button
              onClick={() => setConfirmPopup(p => ({ ...p, visible: false }))}
              style={{
                padding: '3px 10px', fontSize: '12px',
                color: '#6b7280', backgroundColor: '#f3f4f6', border: 'none',
                borderRadius: '5px', cursor: 'pointer'
              }}
            >取消</button>
          </div>
        </>
      )}

      {/* 输入气泡 */}
      {inputPopup.visible && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onClick={() => setInputPopup(p => ({ ...p, visible: false }))}
          />
          <div style={{
            position: 'fixed',
            left: inputPopup.position.x,
            top: inputPopup.position.y,
            zIndex: 9999,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <input
              autoFocus
              value={inputPopupValue}
              onChange={(e) => setInputPopupValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputPopupValue.trim()) {
                  inputPopup.onSubmit(inputPopupValue.trim())
                }
                if (e.key === 'Escape') setInputPopup(p => ({ ...p, visible: false }))
              }}
              placeholder={inputPopup.placeholder}
              style={{
                width: '130px', padding: '4px 8px', fontSize: '13px',
                border: '1px solid #d1d5db', borderRadius: '5px', outline: 'none'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#8b5cf6' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db' }}
            />
            <button
              onClick={() => {
                if (inputPopupValue.trim()) inputPopup.onSubmit(inputPopupValue.trim())
              }}
              style={{
                padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                color: 'white', backgroundColor: '#8b5cf6', border: 'none',
                borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >添加</button>
          </div>
        </>
      )}
    </div>
  </>
  )
}
