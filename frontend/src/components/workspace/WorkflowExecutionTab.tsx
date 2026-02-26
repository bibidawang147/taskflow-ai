import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, RotateCcw, CheckCircle2, Loader2, Play, X, Edit3 } from 'lucide-react'
import { getFullWorkflow } from '../../services/workflowApi'
import type { WorkflowNode, WorkflowEdge, WorkflowStepDetail, WorkflowPreparation } from '../../types/workflow'
import { useWorkflowExecution } from '../../hooks/useWorkflowExecution'
import WorkflowOverviewChart from '../workflow-viewer/WorkflowOverviewChart'
import StepCardList from '../workflow-viewer/StepCardList'
import PreparationSection from '../workflow-viewer/PreparationSection'
import '../../styles/workflow-viewer.css'

interface WorkflowExecutionTabProps {
  workflowId: string
  initialData?: any
  onClose?: () => void
  onEdit?: (workflowId: string, title: string) => void
}

interface FullWorkflowData {
  workflow: any
  nodes: (WorkflowNode & { stepDetail?: WorkflowStepDetail })[]
  edges: WorkflowEdge[]
  preparations: WorkflowPreparation[]
}

export default function WorkflowExecutionTab({
  workflowId,
  initialData,
  onClose,
  onEdit
}: WorkflowExecutionTabProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<FullWorkflowData | null>(null)

  // 获取步骤节点
  const stepNodes = (() => {
    if (!data?.nodes) return []
    const steps = data.nodes.filter(n => n.type === 'step')
    if (steps.length > 0) return steps
    return data.nodes.filter(n => ['ai', 'llm', 'tool', 'condition'].includes(n.type))
  })()
  const stepIds = stepNodes.map(n => n.id)

  // 执行状态管理
  const execution = useWorkflowExecution({
    workflowId,
    stepIds,
    persistProgress: true
  })

  // 卡片引用
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // 将旧格式 stepDetail 或 config 转换为 guideBlocks 格式
  const ensureGuideBlocks = (detail: any, nodeConfig?: any): any => {
    // 如果没有 stepDetail，尝试从 node.config 构建
    const src = detail || (nodeConfig ? {
      stepDescription: nodeConfig.stepDescription || nodeConfig.goal || '',
      expectedResult: nodeConfig.expectedResult || '',
      promptTemplate: nodeConfig.prompt || '',
      tools: nodeConfig.tools || [],
      demonstrationMedia: nodeConfig.demonstrationMedia || [],
      relatedResources: [
        ...(nodeConfig.promptResources || []).map((p: any) => ({ title: p.title, type: 'link', url: '', description: p.content || '' })),
        ...(nodeConfig.documentResources || []).map((d: any) => ({ title: d.name, type: 'file', url: d.url || '', description: d.description || '' })),
        ...(nodeConfig.relatedResources || [])
      ]
    } : null)
    if (!src) return null
    if (src.guideBlocks && src.guideBlocks.length > 0) return src
    // 从旧字段生成 guideBlocks
    const blocks: any[] = []
    let idx = 0
    if (src.stepDescription) {
      blocks.push({ id: `auto-${idx++}`, type: 'text', text: src.stepDescription })
    }
    if (src.tools && src.tools.length > 0) {
      src.tools.forEach((t: any) => {
        if (t.name?.trim()) {
          blocks.push({ id: `auto-${idx++}`, type: 'tool', tool: { name: t.name, url: t.url || '', description: t.description || '' } })
        }
      })
    }
    if (src.promptTemplate?.trim()) {
      blocks.push({ id: `auto-${idx++}`, type: 'prompt', prompt: src.promptTemplate })
    }
    if (src.relatedResources && src.relatedResources.length > 0) {
      src.relatedResources.forEach((r: any) => {
        if (r.title?.trim()) {
          blocks.push({ id: `auto-${idx++}`, type: 'resource', resource: { title: r.title, type: r.type || 'link', url: r.url || '', description: r.description || '', content: r.content || '' } })
        }
      })
    }
    if (src.demonstrationMedia && src.demonstrationMedia.length > 0) {
      src.demonstrationMedia.forEach((m: any) => {
        if (m.url?.trim()) {
          blocks.push({ id: `auto-${idx++}`, type: 'media', media: { type: m.type || 'image', url: m.url, caption: m.caption || '' } })
        }
      })
    }
    if (src.expectedResult?.trim()) {
      blocks.push({ id: `auto-${idx++}`, type: 'text', text: `预期结果：${src.expectedResult}` })
    }
    if (blocks.length === 0) return src
    return { ...src, guideBlocks: blocks }
  }

  // 加载工作流数据
  useEffect(() => {
    if (initialData) {
      // 使用初始数据
      const nodes = initialData.nodes || initialData.config?.nodes || []
      const preparations = initialData.preparations || []
      const edges = initialData.config?.edges || []

      const transformedNodes = nodes.map((node: any) => ({
        id: node.id,
        type: node.type,
        label: node.label || node.data?.label || '未命名节点',
        position: node.position || { x: 0, y: 0 },
        config: node.config || node.data?.config || {},
        data: {
          type: node.type,
          label: node.label || node.data?.label || '未命名节点',
          config: node.config || node.data?.config || {}
        },
        stepDetail: ensureGuideBlocks(node.stepDetail, node.config || node.data?.config)
      }))

      setData({
        workflow: initialData,
        nodes: transformedNodes,
        edges,
        preparations
      })
      setLoading(false)
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getFullWorkflow(workflowId)

        const apiWorkflow = result
        const nodes = apiWorkflow.nodes || []
        const preparations = apiWorkflow.preparations || []
        const edges = apiWorkflow.config?.edges || []

        const transformedNodes = nodes.map((node: any) => ({
          id: node.id,
          type: node.type,
          label: node.label || node.data?.label || '未命名节点',
          position: node.position || { x: 0, y: 0 },
          config: node.config || node.data?.config || {},
          data: {
            type: node.type,
            label: node.label || node.data?.label || '未命名节点',
            config: node.config || node.data?.config || {}
          },
          stepDetail: ensureGuideBlocks(node.stepDetail, node.config || node.data?.config)
        }))

        setData({
          workflow: apiWorkflow,
          nodes: transformedNodes,
          edges,
          preparations
        })
      } catch (err) {
        console.error('Failed to load workflow:', err)
        setError('加载工作流失败')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [workflowId, initialData])

  // 点击节点滚动到卡片
  const handleNodeClick = useCallback((nodeId: string) => {
    execution.setActiveStep(nodeId)
    const cardEl = cardRefs.current.get(nodeId)
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [execution])

  // 完成步骤
  const handleCompleteStep = useCallback((stepId: string) => {
    execution.completeStep(stepId)
    execution.goToNextStep()

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
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const activeEl = document.activeElement
        const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA'
        if (!isInput && execution.activeStepId) {
          e.preventDefault()
          handleCompleteStep(execution.activeStepId)
        }
      }

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

  const registerCardRef = useCallback((stepId: string, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(stepId, el)
    } else {
      cardRefs.current.delete(stepId)
    }
  }, [])

  if (loading) {
    return (
      <div className="execution-tab-loading">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>加载中...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="execution-tab-error">
        <p>{error || '工作流不存在'}</p>
        {onClose && (
          <button onClick={onClose} className="btn-outline mt-4">
            关闭
          </button>
        )}
      </div>
    )
  }

  const { workflow, nodes, edges, preparations } = data

  return (
    <div className="execution-tab">
      {/* 顶部区域 */}
      <div className="execution-tab-header">
        <div className="execution-tab-title">
          <h2>{workflow.title || workflow.name}</h2>
          {workflow.description && (
            <p className="execution-tab-description">{workflow.description}</p>
          )}
        </div>

        <div className="execution-tab-actions">
          {/* 进度 */}
          <div className="execution-progress">
            <div className="execution-progress-bar">
              <div
                className="execution-progress-fill"
                style={{ width: `${execution.progressPercentage}%` }}
              />
            </div>
            <span className="execution-progress-text">
              {execution.completedSteps.size}/{execution.totalSteps}
            </span>
          </div>

          {/* 操作按钮 */}
          {!execution.isAllCompleted && execution.activeStepId && (
            <button
              className="btn-primary btn-sm"
              onClick={() => handleCompleteStep(execution.activeStepId!)}
            >
              <Play className="w-4 h-4" />
              完成步骤
            </button>
          )}

          {execution.isAllCompleted && (
            <span className="completion-badge">
              <CheckCircle2 className="w-4 h-4" />
              已完成
            </span>
          )}

          <button
            onClick={() => {
              if (onEdit) {
                const title = workflow?.title || workflow?.name || '编辑工作流'
                onEdit(workflowId, title)
              } else {
                navigate(`/workflow/edit/${workflowId}`)
              }
            }}
            className="btn-outline btn-sm"
            title="编辑工作流"
          >
            <Edit3 className="w-4 h-4" />
            编辑
          </button>

          <button
            onClick={execution.resetProgress}
            className="btn-icon"
            title="重置进度"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onClose && (
            <button onClick={onClose} className="btn-icon" title="关闭">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="execution-tab-body">
        {/* 左侧：流程图 + 准备 */}
        <aside className="execution-tab-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-card-title">流程概览</h3>
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

          {preparations.length > 0 && (
            <div className="sidebar-card">
              <PreparationSection preparations={preparations} />
            </div>
          )}

          <div className="sidebar-card shortcuts-card">
            <h3 className="sidebar-card-title">快捷键</h3>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <kbd>Enter</kbd>
                <span>完成步骤</span>
              </div>
              <div className="shortcut-item">
                <kbd>↑</kbd><kbd>↓</kbd>
                <span>切换</span>
              </div>
            </div>
          </div>
        </aside>

        {/* 右侧：步骤列表 */}
        <main className="execution-tab-main">
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
