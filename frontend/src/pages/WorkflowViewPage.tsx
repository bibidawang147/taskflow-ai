import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronRight, RotateCcw, CheckCircle2, Loader2, Play, Edit3 } from 'lucide-react'
import { getFullWorkflow } from '../services/workflowApi'
import type { Workflow, WorkflowNode, WorkflowEdge, WorkflowStepDetail, WorkflowPreparation } from '../types/workflow'
import { useWorkflowExecution } from '../hooks/useWorkflowExecution'
import WorkflowOverviewChart from '../components/workflow-viewer/WorkflowOverviewChart'
import StepCardList from '../components/workflow-viewer/StepCardList'
import PreparationSection from '../components/workflow-viewer/PreparationSection'
import '../styles/workflow-viewer.css'

interface FullWorkflowData {
  workflow: Workflow
  nodes: (WorkflowNode & { stepDetail?: WorkflowStepDetail })[]
  edges: WorkflowEdge[]
  preparations: WorkflowPreparation[]
}

export default function WorkflowViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<FullWorkflowData | null>(null)

  // 获取步骤节点（step 类型，或者其他可执行节点类型如 ai, llm, tool）
  // 如果没有 step 类型节点，则使用所有非 input/output 的节点作为步骤
  const stepNodes = (() => {
    if (!data?.nodes) return []
    const steps = data.nodes.filter(n => n.type === 'step')
    if (steps.length > 0) return steps
    // 兼容旧数据：使用 ai, llm, tool 等节点作为步骤
    return data.nodes.filter(n => ['ai', 'llm', 'tool', 'condition'].includes(n.type))
  })()
  const stepIds = stepNodes.map(n => n.id)

  // 执行状态管理
  const execution = useWorkflowExecution({
    workflowId: id || '',
    stepIds,
    persistProgress: true
  })

  // 卡片引用，用于滚动定位
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // 加载工作流数据
  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getFullWorkflow(id)

        // 转换 API 返回格式
        // getFullWorkflow 返回 workflow 对象
        const apiWorkflow = result
        const nodes = apiWorkflow.nodes || []
        const preparations = apiWorkflow.preparations || []

        // 从 config 中提取 edges（如果有）
        const edges = apiWorkflow.config?.edges || []

        // 转换节点格式
        const transformedNodes = nodes.map((node: any) => ({
          id: node.id,
          type: node.type,
          position: node.position || { x: 0, y: 0 },
          data: {
            type: node.type,
            label: node.label || node.data?.label || '未命名节点',
            config: node.config || node.data?.config || {}
          },
          stepDetail: node.stepDetail || null
        }))

        setData({
          workflow: apiWorkflow,
          nodes: transformedNodes,
          edges,
          preparations
        })
      } catch (err) {
        console.error('Failed to load workflow:', err)
        setError('加载工作流失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  // 点击节点滚动到对应卡片
  const handleNodeClick = useCallback((nodeId: string) => {
    execution.setActiveStep(nodeId)
    const cardEl = cardRefs.current.get(nodeId)
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [execution])

  // 完成步骤并跳转下一步
  const handleCompleteStep = useCallback((stepId: string) => {
    execution.completeStep(stepId)
    execution.goToNextStep()

    // 滚动到下一步
    const currentIndex = stepIds.indexOf(stepId)
    if (currentIndex < stepIds.length - 1) {
      const nextStepId = stepIds[currentIndex + 1]
      setTimeout(() => {
        const cardEl = cardRefs.current.get(nextStepId)
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [execution, stepIds])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter 完成当前步骤
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const activeEl = document.activeElement
        const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA'
        if (!isInput && execution.activeStepId) {
          e.preventDefault()
          handleCompleteStep(execution.activeStepId)
        }
      }

      // 数字键选择分支
      if (e.key >= '1' && e.key <= '9') {
        const activeEl = document.activeElement
        const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA'
        if (!isInput) {
          // 分支选择逻辑将在 BranchModal 中实现
        }
      }

      // 方向键导航
      if (e.key === 'ArrowDown' || e.key === 'j') {
        const activeEl = document.activeElement
        const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA'
        if (!isInput) {
          e.preventDefault()
          execution.goToNextStep()
        }
      }
      if (e.key === 'ArrowUp' || e.key === 'k') {
        const activeEl = document.activeElement
        const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA'
        if (!isInput) {
          e.preventDefault()
          execution.goToPreviousStep()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [execution, handleCompleteStep])

  // 注册卡片引用
  const registerCardRef = useCallback((stepId: string, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(stepId, el)
    } else {
      cardRefs.current.delete(stepId)
    }
  }, [])

  if (loading) {
    return (
      <div className="workflow-viewer-loading">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p>加载中...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="workflow-viewer-error">
        <p className="text-red-500">{error || '工作流不存在'}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4">
          返回
        </button>
      </div>
    )
  }

  const { workflow, nodes, edges, preparations } = data

  return (
    <div className="workflow-viewer workflow-viewer--integrated">
      {/* 顶部区域：面包屑 + 标题 + 操作 */}
      <div className="workflow-viewer-top">
        {/* 面包屑导航 */}
        <div className="breadcrumb">
          <Link to="/explore" className="breadcrumb-link">探索</Link>
          <ChevronRight className="breadcrumb-sep" />
          <span className="breadcrumb-current">{workflow.title || workflow.name}</span>
        </div>

        {/* 标题区域 */}
        <div className="workflow-title-section">
          <div className="workflow-title-left">
            <h1 className="workflow-title">{workflow.title || workflow.name}</h1>
            {workflow.description && (
              <p className="workflow-description">{workflow.description}</p>
            )}
            <div className="workflow-meta">
              {workflow.category && (
                <span className="meta-tag">{workflow.category}</span>
              )}
              {workflow.difficultyLevel && (
                <span className={`meta-tag meta-tag--${workflow.difficultyLevel}`}>
                  {workflow.difficultyLevel === 'beginner' ? '入门' :
                   workflow.difficultyLevel === 'intermediate' ? '进阶' : '高级'}
                </span>
              )}
              <span className="meta-steps">{stepNodes.length} 个步骤</span>
            </div>
          </div>

          <div className="workflow-title-right">
            {/* 进度指示器 */}
            <div className="progress-card">
              <div className="progress-header">
                <span className="progress-label">执行进度</span>
                <span className="progress-value">{execution.progressPercentage}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${execution.progressPercentage}%` }}
                />
              </div>
              <div className="progress-footer">
                {execution.isAllCompleted ? (
                  <span className="progress-complete">
                    <CheckCircle2 className="w-4 h-4" />
                    已完成全部步骤
                  </span>
                ) : (
                  <span className="progress-status">
                    {execution.completedSteps.size}/{execution.totalSteps} 步已完成
                  </span>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="action-buttons">
              {!execution.isAllCompleted && execution.activeStepId && (
                <button
                  className="btn-primary"
                  onClick={() => handleCompleteStep(execution.activeStepId!)}
                >
                  <Play className="w-4 h-4" />
                  完成当前步骤
                </button>
              )}
              <button
                onClick={execution.resetProgress}
                className="btn-outline"
                title="重置进度"
              >
                <RotateCcw className="w-4 h-4" />
                重置
              </button>
              <Link to={`/workflow/edit/${id}`} className="btn-outline">
                <Edit3 className="w-4 h-4" />
                编辑
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="workflow-viewer-content">
        {/* 左侧：流程图 + 前置准备 */}
        <aside className="workflow-sidebar">
          {/* 概览层 - 流程图 */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">流程概览</h3>
            <div className="overview-chart-wrapper">
              <WorkflowOverviewChart
                nodes={nodes}
                edges={edges}
                activeNodeId={execution.activeStepId}
                completedNodeIds={execution.completedSteps}
                onNodeClick={handleNodeClick}
              />
            </div>
          </div>

          {/* 前置准备 */}
          {preparations.length > 0 && (
            <div className="sidebar-section">
              <PreparationSection preparations={preparations} />
            </div>
          )}

          {/* 快捷键提示 */}
          <div className="sidebar-section shortcuts-hint">
            <h3 className="sidebar-title">快捷键</h3>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <kbd>Enter</kbd>
                <span>完成当前步骤</span>
              </div>
              <div className="shortcut-item">
                <kbd>↑</kbd><kbd>↓</kbd>
                <span>切换步骤</span>
              </div>
            </div>
          </div>
        </aside>

        {/* 右侧：步骤卡片列表 */}
        <main className="workflow-main">
          <StepCardList
            steps={stepNodes}
            activeStepId={execution.activeStepId}
            completedSteps={execution.completedSteps}
            expandedCards={execution.expandedCards}
            onToggleExpand={execution.toggleCardExpand}
            onComplete={handleCompleteStep}
            onStepClick={handleNodeClick}
            registerCardRef={registerCardRef}
          />
        </main>
      </div>
    </div>
  )
}
