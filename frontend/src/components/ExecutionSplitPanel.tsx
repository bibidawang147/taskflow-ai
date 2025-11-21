import React, { useMemo, useState, useRef, useEffect } from 'react'
import { X, CheckCircle2, Circle, Clock, Pencil } from 'lucide-react'
import { executeTempWorkflow } from '../services/workflowApi'

export interface WorkflowNode {
  id: string
  type: string
  data?: {
    label: string
    config?: any
  }
  [key: string]: any
}

export interface ExecutionWorkflow {
  id: string
  title: string
  description?: string
  config?: {
    nodes?: WorkflowNode[]
    [key: string]: any
  }
  executionId?: string // 用于标识每次执行的唯一ID
  [key: string]: any
}

interface ExecutionSplitPanelProps {
  workflow: ExecutionWorkflow
  onClose: () => void
  onWorkflowUpdate?: (workflow: ExecutionWorkflow) => Promise<void> | void
}

type StepStatus = 'pending' | 'active' | 'completed'

interface StepData {
  id: string
  title: string
  type: string
  status: StepStatus
  config?: any
  editedConfig?: any
}

const STEP_SECTION_LABELS: Record<string, string> = {
  toolUrl: '工具地址',
  toolAddress: '工具地址',
  tool: '工具信息',
  operations: '操作步骤',
  steps: '操作步骤',
  guide: '操作指引',
  prompt: 'Prompt',
  promptHint: 'Prompt',
  notes: '注意点',
  cautions: '注意事项',
  warning: '注意事项',
  example: '示例',
  examples: '示例',
  input: '输入',
  inputs: '输入',
  output: '输出',
  outputs: '输出',
  reference: '参考链接',
  description: '目标',
  model: '模型',
  provider: '模型提供方',
  temperature: 'Temperature',
  placeholder: '工具地址',
  requiredFields: '指令或参数设置'
}

const formatSectionLabel = (key: string) => STEP_SECTION_LABELS[key] ?? key

type FieldType = 'shortText' | 'longText' | 'number' | 'boolean' | 'stringArray' | 'json'

interface EditableField {
  key: string
  label: string
  type: FieldType
  value: any
}

const deepClone = (value: any) => {
  if (value === undefined || value === null) {
    return {}
  }
  return JSON.parse(JSON.stringify(value))
}

const isStringArray = (value: any): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string')

const getFieldType = (value: any): FieldType => {
  if (typeof value === 'boolean') {
    return 'boolean'
  }
  if (typeof value === 'number') {
    return 'number'
  }
  if (typeof value === 'string') {
    return value.length > 80 || value.includes('\n') ? 'longText' : 'shortText'
  }
  if (isStringArray(value)) {
    return 'stringArray'
  }
  return 'json'
}

const buildEditableFields = (config: any): EditableField[] => {
  if (!config || typeof config !== 'object') {
    return []
  }
  return Object.entries(config).map(([key, value]) => ({
    key,
    label: formatSectionLabel(key),
    type: getFieldType(value),
    value
  }))
}

const formatValueForInput = (value: any, type: FieldType) => {
  if (type === 'boolean') {
    return Boolean(value)
  }
  if (type === 'number') {
    return typeof value === 'number' ? value : ''
  }
  if (type === 'stringArray') {
    return Array.isArray(value) ? value.join('\n') : ''
  }
  if (type === 'json') {
    if (value === undefined || value === null || value === '') {
      return ''
    }
    try {
      return JSON.stringify(value, null, 2)
    } catch (error) {
      return String(value)
    }
  }
  return typeof value === 'string' ? value : value ?? ''
}

const getCompositeFieldKey = (stepId: string, fieldKey: string) => `${stepId}:${fieldKey}`

const normalizeConfigSections = (config: any) => {
  if (config === undefined || config === null || config === '') {
    return []
  }

  if (typeof config !== 'object') {
    return [
      {
        key: 'raw',
        title: '目标',
        content: config
      }
    ]
  }

  const sections: Array<{ key: string; title: string; content: any }> = []

  if (config.title || config.description) {
    sections.push({
      key: 'primary',
      title: config.title ?? '目标',
      content: config.description ?? ''
    })
  }

  if (Array.isArray(config.sections) && config.sections.length > 0) {
    config.sections.forEach((section: any, index: number) => {
      sections.push({
        key: section.id ?? `section-${index}`,
        title: section.title ?? `说明 ${index + 1}`,
        content: section.content ?? section.description ?? ''
      })
    })
  } else {
    Object.entries(config).forEach(([key, value]) => {
      if (['title', 'description', 'sections'].includes(key)) {
        return
      }
      if (value === undefined || value === null || value === '') {
        return
      }
      sections.push({
        key,
        title: formatSectionLabel(key),
        content: value
      })
    })
  }

  if (sections.length === 0) {
    sections.push({
      key: 'fallback',
      title: '目标',
      content: config
    })
  }

  return sections
}

const renderSectionContent = (value: any): React.ReactNode => {
  if (value === undefined || value === null || value === '') {
    return (
      <p style={{ margin: '0.4rem 0 0', color: '#9ca3af' }}>
        暂无内容
      </p>
    )
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return (
      <p style={{ margin: '0.4rem 0 0', color: '#4b5563', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {String(value)}
      </p>
    )
  }

  if (Array.isArray(value)) {
    return (
      <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', color: '#4b5563', lineHeight: 1.6 }}>
        {value.map((item, index) => (
          <li key={index} style={{ marginBottom: '0.25rem' }}>
            {typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
              ? String(item)
              : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    )
  }

  if (typeof value === 'object') {
    return (
      <div style={{ margin: '0.5rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {Object.entries(value).map(([childKey, childValue]) => (
          <div key={childKey} style={{ lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: '#374151', marginRight: '0.35rem' }}>
              {formatSectionLabel(childKey)}：
            </span>
            <span style={{ color: '#4b5563', whiteSpace: 'pre-wrap' }}>
              {typeof childValue === 'string' || typeof childValue === 'number' || typeof childValue === 'boolean'
                ? String(childValue)
                : JSON.stringify(childValue)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return null
}

const ExecutionSplitPanel: React.FC<ExecutionSplitPanelProps> = ({ workflow, onClose, onWorkflowUpdate }) => {
  // 滚动容器引用
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  // 步骤卡片引用
  const stepRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // 初始化步骤数据
  const [steps, setSteps] = useState<StepData[]>(() => {
    const nodes = workflow.config?.nodes || []
    console.log('🔍 [ExecutionSplitPanel] 初始化步骤，收到的节点:', {
      workflowTitle: workflow.title,
      nodesCount: nodes.length,
      nodes: nodes.map((n, i) => ({
        index: i,
        id: n.id,
        type: n.type,
        label: n.data?.label ?? (n as any)?.label,
        hasDataConfig: !!n.data?.config,
        hasNodeConfig: !!(n as any)?.config,
        dataConfig: n.data?.config,
        nodeConfig: (n as any)?.config
      }))
    })

    return nodes.map((node, index) => {
      const baseConfig = node.data?.config ?? (node as any)?.config ?? {}
      const safeConfig = deepClone(baseConfig)

      console.log(`📋 [ExecutionSplitPanel] 步骤 ${index + 1} - ${node.data?.label ?? (node as any)?.label}:`, {
        baseConfig,
        safeConfig,
        configKeys: Object.keys(safeConfig),
        hasPrompt: 'prompt' in safeConfig,
        promptValue: safeConfig.prompt
      })

      return {
        id: node.id,
        title: node.data?.label ?? (node as any)?.label ?? `节点 ${index + 1}`,
        type: node.type,
        status: index === 0 ? 'active' : 'pending',
        config: safeConfig,
        editedConfig: deepClone(safeConfig)
      }
    })
  })

  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]))
  const [fieldDrafts, setFieldDrafts] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saveDecision, setSaveDecision] = useState<'saved' | 'discarded' | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editingStepIds, setEditingStepIds] = useState<Set<string>>(new Set())

  // 记录执行开始时间
  const [executionStartTime, setExecutionStartTime] = useState<number>(Date.now())
  // 标记是否已保存执行历史（避免重复保存）
  const [executionSaved, setExecutionSaved] = useState(false)

  // 监听workflow.executionId变化，重置所有步骤状态（新的执行）
  useEffect(() => {
    const nodes = workflow.config?.nodes || []
    const resetSteps = nodes.map((node, index) => {
      const baseConfig = node.data?.config ?? (node as any)?.config ?? {}
      const safeConfig = deepClone(baseConfig)
      return {
        id: node.id,
        title: node.data?.label ?? (node as any)?.label ?? `节点 ${index + 1}`,
        type: node.type,
        status: index === 0 ? 'active' : 'pending',
        config: safeConfig,
        editedConfig: deepClone(safeConfig)
      } as StepData
    })

    setSteps(resetSteps)
    setExpandedSteps(new Set([0])) // 展开第一步
    setFieldDrafts({})
    setFieldErrors({})
    setSaveDecision(null)
    setEditingStepIds(new Set())
    setExecutionStartTime(Date.now()) // 重置执行开始时间
    setExecutionSaved(false) // 重置保存标记

    console.log('🔄 [ExecutionSplitPanel] 重置执行状态，executionId:', workflow.executionId)
  }, [workflow.executionId])

  // 监听Enter键完成步骤
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // 如果焦点在输入框、文本域等元素上，不触发
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if (e.key === 'Enter') {
        // 找到当前展开且活跃的步骤
        const activeIndex = steps.findIndex(s => s.status === 'active')
        if (activeIndex !== -1 && expandedSteps.has(activeIndex)) {
          e.preventDefault()
          completeStep(activeIndex)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [steps, expandedSteps])

  const completedCount = useMemo(() => steps.filter(s => s.status === 'completed').length, [steps])
  const allStepsCompleted = steps.length > 0 && steps.every(s => s.status === 'completed')

  // 监听正在执行的步骤,自动滚动到可见范围
  useEffect(() => {
    const activeIndex = steps.findIndex(s => s.status === 'active')
    if (activeIndex !== -1) {
      const stepElement = stepRefs.current.get(activeIndex)
      if (stepElement && scrollContainerRef.current) {
        // 延迟一下确保DOM已更新
        setTimeout(() => {
          stepElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }, 100)
      }
    }
  }, [steps])

  // 监听所有步骤完成,自动收缩最后一步并滚动到底部，并保存执行历史
  useEffect(() => {
    if (allStepsCompleted && steps.length > 0) {
      const lastStepIndex = steps.length - 1

      // 延迟执行以确保DOM已更新
      setTimeout(() => {
        // 收缩最后一步
        setExpandedSteps(prev => {
          const newExpanded = new Set(prev)
          newExpanded.delete(lastStepIndex)
          return newExpanded
        })

        // 滚动到底部
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: 'smooth'
            })
          }
        }, 100)
      }, 300)

      // 保存执行历史（避免重复保存）
      if (!executionSaved) {
        const executionDuration = Date.now() - executionStartTime
        console.log('✅ [ExecutionSplitPanel] 所有步骤完成，保存执行历史...', {
          workflowId: workflow.id,
          executionId: workflow.executionId,
          duration: executionDuration
        })

        executeTempWorkflow({
          title: workflow.title,
          description: workflow.description || `完成 ${steps.length} 个步骤`,
          config: { nodes: workflow.config?.nodes },
          input: { executionId: workflow.executionId, duration: executionDuration }
        })
          .then(result => {
            console.log('✅ [ExecutionSplitPanel] 执行历史已保存:', result)
            setExecutionSaved(true)
          })
          .catch(error => {
            console.error('❌ [ExecutionSplitPanel] 保存执行历史失败:', error)
          })
      }
    }
  }, [allStepsCompleted, steps.length, executionSaved, executionStartTime, workflow])
  const hasEditableChanges = useMemo(
    () =>
      steps.some(step => {
        const original = JSON.stringify(step.config ?? {})
        const edited = JSON.stringify(step.editedConfig ?? step.config ?? {})
        return original !== edited
      }),
    [steps]
  )

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSteps(newExpanded)
  }

  const completeStep = (index: number) => {
    setSteps(prev =>
      prev.map((step, idx) => {
        if (idx === index) {
          return { ...step, status: 'completed' }
        }
        if (idx === index + 1 && step.status === 'pending') {
          return { ...step, status: 'active' }
        }
        return step
      })
    )

    // 自动展开下一步
    if (index + 1 < steps.length) {
      const newExpanded = new Set(expandedSteps)
      newExpanded.delete(index)
      newExpanded.add(index + 1)
      setExpandedSteps(newExpanded)
    }
  }

  const toggleStepEditing = (stepId: string) => {
    setEditingStepIds(prev => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }

  const updateStepField = (stepIndex: number, fieldKey: string, value: any) => {
    setSteps(prev => {
      const next = [...prev]
      const target = { ...next[stepIndex] }
      const editedConfig = {
        ...(target.editedConfig ?? deepClone(target.config ?? {})),
        [fieldKey]: value
      }
      target.editedConfig = editedConfig
      next[stepIndex] = target
      return next
    })
    setSaveDecision(null)
    setSaveError(null)
  }

  const clearDraftState = (compositeKey: string) => {
    setFieldDrafts(prev => {
      if (!(compositeKey in prev)) {
        return prev
      }
      const next = { ...prev }
      delete next[compositeKey]
      return next
    })
    setFieldErrors(prev => {
      if (!(compositeKey in prev)) {
        return prev
      }
      const next = { ...prev }
      delete next[compositeKey]
      return next
    })
  }

  const handleJsonFieldChange = (stepIndex: number, stepId: string, fieldKey: string, rawValue: string) => {
    const compositeKey = getCompositeFieldKey(stepId, fieldKey)
    setFieldDrafts(prev => ({ ...prev, [compositeKey]: rawValue }))
    if (rawValue.trim() === '') {
      updateStepField(stepIndex, fieldKey, {})
      clearDraftState(compositeKey)
      return
    }
    try {
      const parsed = JSON.parse(rawValue)
      updateStepField(stepIndex, fieldKey, parsed)
      clearDraftState(compositeKey)
    } catch (error) {
      setFieldErrors(prev => ({ ...prev, [compositeKey]: 'JSON 格式错误，请检查输入' }))
    }
  }

  const handleStringArrayChange = (stepIndex: number, fieldKey: string, textValue: string) => {
    const items = textValue
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean)
    updateStepField(stepIndex, fieldKey, items)
  }

  const handleNumberFieldChange = (stepIndex: number, fieldKey: string, value: string) => {
    if (value.trim() === '') {
      updateStepField(stepIndex, fieldKey, null)
      return
    }
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) {
      updateStepField(stepIndex, fieldKey, parsed)
    }
  }

  const handleTextFieldChange = (stepIndex: number, fieldKey: string, value: string) => {
    updateStepField(stepIndex, fieldKey, value)
  }

  const handleBooleanFieldChange = (stepIndex: number, fieldKey: string, checked: boolean) => {
    updateStepField(stepIndex, fieldKey, checked)
  }

  const persistEdits = async () => {
    setSaveError(null)
    const currentNodes = workflow.config?.nodes || []
    const updatedNodes = currentNodes.map(node => {
      const matchedStep = steps.find(step => step.id === node.id)
      if (!matchedStep) {
        return node
      }
      const updatedNode: WorkflowNode & Record<string, any> = { ...node }
      const updatedData = {
        label: node.data?.label ?? '',
        ...(updatedNode.data ?? {})
      }
      updatedData.config = deepClone(matchedStep.editedConfig ?? matchedStep.config ?? {})
      updatedNode.data = updatedData
      if (!node.data && 'config' in node) {
        updatedNode.config = updatedData.config
      }
      return updatedNode
    })

    const updatedWorkflow: ExecutionWorkflow = {
      ...workflow,
      config: {
        ...(workflow.config || {}),
        nodes: updatedNodes
      }
    }

    if (onWorkflowUpdate) {
      setIsSaving(true)
      try {
        await onWorkflowUpdate(updatedWorkflow)
      } catch (error) {
        console.error('保存工作流配置失败:', error)
        // 如果是用户取消，不显示错误消息
        const errorMessage = error instanceof Error ? error.message : '保存失败，请稍后重试'
        if (errorMessage !== '用户取消保存') {
          setSaveError(errorMessage)
        }
        return
      } finally {
        setIsSaving(false)
      }
    }

    setSteps(prev =>
      prev.map(step => {
        const synced = deepClone(step.editedConfig ?? step.config ?? {})
        return {
          ...step,
          config: synced,
          editedConfig: deepClone(synced)
        }
      })
    )
    setFieldDrafts({})
    setFieldErrors({})
    setSaveDecision('saved')
  }

  const discardEdits = () => {
    setSteps(prev =>
      prev.map(step => ({
        ...step,
        editedConfig: deepClone(step.config ?? {})
      }))
    )
    setFieldDrafts({})
    setFieldErrors({})
    setSaveError(null)
    setIsSaving(false)
    setSaveDecision('discarded')
  }

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={20} style={{ color: '#10b981' }} />
      case 'active':
        return <Clock size={20} style={{ color: '#8b5cf6' }} />
      default:
        return <Circle size={20} style={{ color: '#9ca3af' }} />
    }
  }

  const getStepColor = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return { border: '#10b981', bg: '#f0fdf4' }
      case 'active':
        return { border: '#8b5cf6', bg: '#faf5ff' }
      default:
        return { border: '#e5e7eb', bg: '#ffffff' }
    }
  }

  return (
    <div data-scroll-container="true" style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'white',
      overflow: 'hidden'
    }}>
      {/* 固定头部 - 不滚动 */}
      <div style={{
        padding: '1.5rem 2rem',
        borderBottom: '2px solid #f3f4f6',
        backgroundColor: 'white',
        flexShrink: 0
      }}>
        {/* 标题和关闭按钮 */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              {workflow.title}
            </h2>
            {workflow.description && (
              <p style={{
                margin: '0.5rem 0 0 0',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                {workflow.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* 进度条 */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
              执行进度
            </span>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {completedCount} / {steps.length}
            </span>
          </div>
          <div style={{
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              backgroundColor: '#8b5cf6',
              width: `${(completedCount / steps.length) * 100}%`,
              transition: 'width 0.5s ease-in-out'
            }} />
          </div>
        </div>
      </div>

      {/* 可滚动内容区域 */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '2rem',
          backgroundColor: '#fafafa'
        }}
      >
        {/* 步骤列表 */}
        {steps.map((step, index) => {
          const colors = getStepColor(step.status)
          const isExpanded = expandedSteps.has(index)
          const editableFields = buildEditableFields(step.editedConfig ?? step.config ?? {})
          const detailSections = normalizeConfigSections(step.editedConfig ?? step.config ?? {})
          const isEditingStep = editingStepIds.has(step.id)
          const canEdit = editableFields.length > 0

          return (
            <div
              key={step.id}
              ref={(el) => {
                if (el) {
                  stepRefs.current.set(index, el)
                } else {
                  stepRefs.current.delete(index)
                }
              }}
              style={{
                marginBottom: '2rem',
                transition: 'all 0.3s ease-in-out',
                opacity: step.status === 'pending' ? 0.6 : 1
              }}
            >
              {/* 步骤头部 - 可点击展开/折叠 */}
              <div
                onClick={() => toggleStep(index)}
                style={{
                  padding: step.status === 'completed' && !isExpanded ? '1rem' : '0.5rem 0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  backgroundColor: step.status === 'completed' && !isExpanded ? '#f9fafb' : 'transparent',
                  border: step.status === 'completed' && !isExpanded ? '1px solid #8b5cf6' : 'none',
                  borderRadius: step.status === 'completed' && !isExpanded ? '0' : '0',
                  boxShadow: step.status === 'completed' && !isExpanded ? '0 2px 8px rgba(139, 92, 246, 0.1)' : 'none',
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: step.status === 'completed' && !isExpanded ? '#8b5cf6' : '#1f2937',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      color: step.status === 'completed' && !isExpanded ? '#8b5cf6' : '#6b7280',
                      fontWeight: '500'
                    }}>
                      步骤 {index + 1}:
                    </span>
                    <span>{step.title}</span>
                  </div>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStepEditing(step.id)
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: isEditingStep ? '#7c3aed' : '#9ca3af',
                      cursor: 'pointer',
                      borderBottom: isEditingStep ? '1px solid #7c3aed' : '1px solid #d1d5db'
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                )}
                {/* 完成状态图标 */}
                {step.status === 'active' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      completeStep(index)
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#d1d5db',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle2 size={20} />
                  </button>
                )}
                {step.status === 'completed' && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: '#10b981'
                  }}>
                    <CheckCircle2 size={20} />
                  </div>
                )}
                <span style={{
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  {isExpanded ? '▼' : '▶'}
                </span>
              </div>

              {/* 步骤内容 - 展开时显示 */}
              {isExpanded && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: '0.5rem 0 0 0'
                  }}>
                  {/* 步骤说明 */}
                  <div style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0',
                    fontSize: '0.875rem',
                    color: '#374151',
                    border: isEditingStep ? '1px dashed #d8b4fe' : '1px solid #8b5cf6',
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.1)'
                  }}>
                    {!isEditingStep && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {detailSections.length === 0 && (
                          <div style={{
                            padding: '0.75rem',
                            borderRadius: '0',
                            border: '1px dashed #e5e7eb',
                            color: '#6b7280',
                            fontSize: '0.85rem'
                          }}>
                            当前步骤暂无说明内容
                          </div>
                        )}
                        {detailSections.map((section, index) => {
                          const isToolUrl = section.key === 'toolUrl' || section.key === 'toolAddress' || section.key === 'placeholder'
                          const content = section.content
                          const isUrl = typeof content === 'string' && (content.startsWith('http://') || content.startsWith('https://') || content.startsWith('www.'))

                          return (
                            <div key={section.key}>
                              <div style={{
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: '#4c1d95',
                                letterSpacing: '0.02em'
                              }}>
                                {section.title}
                              </div>
                              {isToolUrl && isUrl ? (
                                <p style={{ margin: '0.4rem 0 0', lineHeight: 1.6 }}>
                                  <a
                                    href={content.startsWith('www.') ? `https://${content}` : content}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      color: '#8b5cf6',
                                      textDecoration: 'underline',
                                      cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#7c3aed'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#8b5cf6'}
                                  >
                                    {content}
                                  </a>
                                </p>
                              ) : (
                                renderSectionContent(section.content)
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {isEditingStep && canEdit && (
                      <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {editableFields.map(field => {
                          const compositeKey = getCompositeFieldKey(step.id, field.key)
                          const draftValue = fieldDrafts[compositeKey]
                          const fieldError = fieldErrors[compositeKey]
                          const inputValue = draftValue ?? formatValueForInput(field.value, field.type)
                          return (
                            <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4c1d95' }}>
                                {field.label}
                              </label>

                              {field.type === 'boolean' && (
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(inputValue)}
                                    onChange={(e) => handleBooleanFieldChange(index, field.key, e.target.checked)}
                                    style={{ width: '16px', height: '16px' }}
                                  />
                                  启用
                                </label>
                              )}

                              {(field.type === 'shortText' || field.type === 'number') && (
                                <input
                                  type={field.type === 'number' ? 'number' : 'text'}
                                  value={field.type === 'number' ? inputValue ?? '' : inputValue ?? ''}
                                  onChange={(e) => {
                                    if (field.type === 'number') {
                                      handleNumberFieldChange(index, field.key, e.target.value)
                                    } else {
                                      handleTextFieldChange(index, field.key, e.target.value)
                                    }
                                  }}
                                  style={{
                                    padding: '0.65rem 0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #d4d4d8',
                                    fontSize: '0.875rem'
                                  }}
                                />
                              )}

                              {(field.type === 'longText' || field.type === 'stringArray') && (
                                <textarea
                                  value={inputValue ?? ''}
                                  onChange={(e) => {
                                    if (field.type === 'stringArray') {
                                      handleStringArrayChange(index, field.key, e.target.value)
                                    } else {
                                      handleTextFieldChange(index, field.key, e.target.value)
                                    }
                                  }}
                                  style={{
                                    minHeight: '90px',
                                    padding: '0.75rem',
                                    borderRadius: '10px',
                                    border: '1px solid #d4d4d8',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.6,
                                    fontFamily: 'inherit'
                                  }}
                                />
                              )}

                              {field.type === 'json' && (
                                <>
                                  <textarea
                                    value={inputValue ?? ''}
                                    onChange={(e) => handleJsonFieldChange(index, step.id, field.key, e.target.value)}
                                    style={{
                                      minHeight: '120px',
                                      padding: '0.75rem',
                                      borderRadius: '10px',
                                      border: `1px solid ${fieldError ? '#f87171' : '#d4d4d8'}`,
                                      fontSize: '0.8125rem',
                                      lineHeight: 1.5,
                                      fontFamily: 'SFMono-Regular, Consolas, monospace'
                                    }}
                                  />
                                  {fieldError && (
                                    <span style={{ fontSize: '0.75rem', color: '#b91c1c' }}>{fieldError}</span>
                                  )}
                                  {!fieldError && (
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                      使用 JSON 格式编辑复杂内容
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {isEditingStep && !canEdit && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: '1px dashed #e5e7eb',
                        color: '#6b7280',
                        fontSize: '0.85rem',
                        textAlign: 'center'
                      }}>
                        当前步骤暂无可编辑字段
                      </div>
                    )}
                  </div>

                  {/* Enter键提示 */}
                  {step.status === 'active' && isExpanded && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '0',
                      border: '1px solid #e5e7eb',
                      fontSize: '0.813rem',
                      color: '#6b7280',
                      textAlign: 'center'
                    }}>
                      按 <kbd style={{
                        padding: '0.15rem 0.4rem',
                        backgroundColor: '#8b5cf6',
                        border: '1px solid #8b5cf6',
                        borderRadius: '3px',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'white'
                      }}>Enter</kbd> 键标记完成
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* 全部完成提示与保存决策 */}
        {allStepsCompleted && (
          <div style={{
            marginTop: '2rem',
            padding: '2.5rem',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(139, 92, 246, 0.08))',
            border: '1px solid #8b5cf6',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 45%)',
              pointerEvents: 'none'
            }} />
            <div style={{ position: 'relative', textAlign: 'center' }}>
              {/* 工作流图标和名称 */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                  flexShrink: 0
                }}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                    style={{
                      overflow: 'visible'
                    }}
                  >
                    {/* 圆圈 */}
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      style={{
                        strokeDasharray: 63,
                        strokeDashoffset: 63,
                        animation: 'drawCircle 0.4s ease-out 1s forwards'
                      }}
                    />
                    {/* 勾号 */}
                    <path
                      d="M9 12l2 2 4-4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        strokeDasharray: 10,
                        strokeDashoffset: 10,
                        animation: 'drawCheck 0.3s ease-out 1.4s forwards'
                      }}
                    />
                  </svg>
                  <style>{`
                    @keyframes drawCircle {
                      to {
                        stroke-dashoffset: 0;
                      }
                    }
                    @keyframes drawCheck {
                      to {
                        stroke-dashoffset: 0;
                      }
                    }
                  `}</style>
                </div>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#8b5cf6',
                  letterSpacing: '0.01em'
                }}>
                  {workflow.title}
                </h3>
              </div>
              <p style={{ margin: '0 auto 1.5rem', maxWidth: '420px', color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {hasEditableChanges
                  ? '检测到对步骤配置的修改。是否保存这些修改到工作流？'
                  : '所有步骤均按当前配置完成，无额外修改。'}
              </p>

              {hasEditableChanges && !saveDecision && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={persistEdits}
                    disabled={isSaving}
                    style={{
                      padding: '0.85rem 1.5rem',
                      borderRadius: '999px',
                      border: 'none',
                      background: isSaving ? 'rgba(5, 150, 105, 0.4)' : '#059669',
                      color: 'white',
                      fontWeight: 600,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      boxShadow: '0 8px 20px rgba(5, 150, 105, 0.3)'
                    }}
                  >
                    {isSaving ? '保存中...' : '保存修改'}
                  </button>
                  <button
                    onClick={discardEdits}
                    disabled={isSaving}
                    style={{
                      padding: '0.85rem 1.5rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(15, 23, 42, 0.3)',
                      background: 'transparent',
                      color: isSaving ? 'rgba(15, 23, 42, 0.5)' : '#0f172a',
                      fontWeight: 600,
                      cursor: isSaving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    不保存
                  </button>
                </div>
              )}

              {saveError && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  fontSize: '0.9rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        color: '#92400e',
                        fontWeight: 600,
                        marginBottom: '0.5rem'
                      }}>
                        保存失败
                      </div>
                      <div style={{
                        color: '#78350f',
                        fontSize: '0.875rem',
                        lineHeight: 1.5
                      }}>
                        {saveError}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {saveDecision === 'saved' && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(5, 150, 105, 0.15)',
                  color: '#064e3b',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle2 size={18} />
                  修改已保存
                </div>
              )}

              {saveDecision === 'discarded' && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(15, 23, 42, 0.08)',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Circle size={16} />
                  保持原始设置
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExecutionSplitPanel
