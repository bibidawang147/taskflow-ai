import { useState, useCallback, useMemo } from 'react'
import { X, Plus, Play, LayoutGrid } from 'lucide-react'
import WorkflowExecutionTab from './WorkflowExecutionTab'

export interface WorkspaceTab {
  id: string
  type: 'canvas' | 'workflow-execution'
  title: string
  workflowId?: string
  workflowData?: any
}

interface WorkspaceTabsManagerProps {
  /** 画布内容（当显示画布 tab 时渲染） */
  canvasContent: React.ReactNode
  /** 打开新工作流 tab 的回调 */
  onOpenWorkflow?: (workflowId: string, workflowData: any) => void
  /** 初始打开的工作流列表 */
  initialWorkflows?: Array<{ id: string; title: string; data: any }>
}

const CANVAS_TAB_ID = 'canvas-main'

export default function WorkspaceTabsManager({
  canvasContent,
  initialWorkflows = []
}: WorkspaceTabsManagerProps) {
  // 初始化 tabs：始终包含画布 tab
  const [tabs, setTabs] = useState<WorkspaceTab[]>(() => {
    const initialTabs: WorkspaceTab[] = [
      { id: CANVAS_TAB_ID, type: 'canvas', title: '工作画布' }
    ]

    // 添加初始工作流 tabs
    initialWorkflows.forEach(wf => {
      initialTabs.push({
        id: `workflow-${wf.id}-${Date.now()}`,
        type: 'workflow-execution',
        title: wf.title,
        workflowId: wf.id,
        workflowData: wf.data
      })
    })

    return initialTabs
  })

  const [activeTabId, setActiveTabId] = useState(CANVAS_TAB_ID)

  // 打开新的工作流 tab
  const openWorkflowTab = useCallback((workflowId: string, title: string, workflowData: any) => {
    // 检查是否已经打开了这个工作流
    const existingTab = tabs.find(
      tab => tab.type === 'workflow-execution' && tab.workflowId === workflowId
    )

    if (existingTab) {
      // 如果已存在，直接切换到该 tab
      setActiveTabId(existingTab.id)
      return
    }

    // 创建新 tab
    const newTab: WorkspaceTab = {
      id: `workflow-${workflowId}-${Date.now()}`,
      type: 'workflow-execution',
      title,
      workflowId,
      workflowData
    }

    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
  }, [tabs])

  // 关闭 tab
  const closeTab = useCallback((tabId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()

    // 不能关闭画布 tab
    if (tabId === CANVAS_TAB_ID) return

    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId)

      // 如果关闭的是当前活动 tab，切换到前一个或画布
      if (activeTabId === tabId) {
        const closedIndex = prev.findIndex(tab => tab.id === tabId)
        const newActiveIndex = Math.max(0, closedIndex - 1)
        setActiveTabId(newTabs[newActiveIndex]?.id || CANVAS_TAB_ID)
      }

      return newTabs
    })
  }, [activeTabId])

  // 当前活动 tab
  const activeTab = useMemo(
    () => tabs.find(tab => tab.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  )

  return (
    <div className="workspace-tabs-container">
      {/* Tab 栏 */}
      <div className="workspace-tabs-bar">
        <div className="workspace-tabs-list">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`workspace-tab ${activeTabId === tab.id ? 'workspace-tab--active' : ''}`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span className="workspace-tab-icon">
                {tab.type === 'canvas' ? (
                  <LayoutGrid className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </span>
              <span className="workspace-tab-title">{tab.title}</span>
              {tab.type !== 'canvas' && (
                <button
                  className="workspace-tab-close"
                  onClick={(e) => closeTab(tab.id, e)}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tab 内容区域 */}
      <div className="workspace-tabs-content">
        {/* 画布内容 - 保持挂载以保留状态 */}
        <div
          className="workspace-tab-panel"
          style={{ display: activeTab?.type === 'canvas' ? 'flex' : 'none' }}
        >
          {canvasContent}
        </div>

        {/* 工作流执行 tabs */}
        {tabs
          .filter(tab => tab.type === 'workflow-execution')
          .map(tab => (
            <div
              key={tab.id}
              className="workspace-tab-panel"
              style={{ display: activeTabId === tab.id ? 'flex' : 'none' }}
            >
              <WorkflowExecutionTab
                workflowId={tab.workflowId!}
                initialData={tab.workflowData}
                onClose={() => closeTab(tab.id)}
              />
            </div>
          ))}
      </div>

      {/* 暴露 openWorkflowTab 方法给父组件 */}
      <WorkspaceTabsContext.Provider value={{ openWorkflowTab }}>
        {null}
      </WorkspaceTabsContext.Provider>
    </div>
  )
}

// Context for opening workflow tabs from anywhere
import { createContext, useContext } from 'react'

interface WorkspaceTabsContextValue {
  openWorkflowTab: (workflowId: string, title: string, workflowData: any) => void
}

export const WorkspaceTabsContext = createContext<WorkspaceTabsContextValue | null>(null)

export function useWorkspaceTabs() {
  const context = useContext(WorkspaceTabsContext)
  if (!context) {
    throw new Error('useWorkspaceTabs must be used within WorkspaceTabsManager')
  }
  return context
}

// 导出 openWorkflowTab ref
export type WorkspaceTabsRef = {
  openWorkflowTab: (workflowId: string, title: string, workflowData: any) => void
}
