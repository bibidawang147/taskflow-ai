import React, { useMemo, useState } from 'react'
import { X, CheckCircle2, Circle, Clock, Pencil } from 'lucide-react'

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
  description: '说明',
  model: '模型',
  provider: '模型提供方',
  temperature: 'Temperature'
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
        title: '步骤说明',
        content: config
      }
    ]
  }

  const sections: Array<{ key: string; title: string; content: any }> = []

  if (config.title || config.description) {
    sections.push({
      key: 'primary',
      title: config.title ?? '步骤说明',
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
      title: '步骤说明',
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
  // 初始化步骤数据
  const [steps, setSteps] = useState<StepData[]>(() => {
    const nodes = workflow.config?.nodes || []
    return nodes.map((node, index) => {
      const baseConfig = node.data?.config ?? (node as any)?.config ?? {}
      const safeConfig = deepClone(baseConfig)
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

  const completedCount = useMemo(() => steps.filter(s => s.status === 'completed').length, [steps])
  const allStepsCompleted = steps.length > 0 && steps.every(s => s.status === 'completed')
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
      const updatedData = { ...(updatedNode.data ?? {}) }
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
        setSaveError(error instanceof Error ? error.message : '保存失败，请稍后重试')
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
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '2rem',
        backgroundColor: '#fafafa'
      }}>
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
              style={{
                marginBottom: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                border: `1px solid ${colors.border}`,
                overflow: 'hidden',
                transition: 'all 0.3s ease-in-out',
                opacity: step.status === 'pending' ? 0.6 : 1
              }}
            >
              {/* 步骤头部 - 可点击展开/折叠 */}
              <div
                onClick={() => toggleStep(index)}
                style={{
                  padding: '1.25rem 1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  backgroundColor: colors.bg
                }}
              >
                {getStepIcon(step.status)}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '0.25rem'
                  }}>
                    步骤 {index + 1}: {step.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {step.type}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  {isExpanded ? '▼' : '▶'}
                </span>
              </div>

              {/* 步骤内容 - 展开时显示 */}
              {isExpanded && (
                <div style={{
                  padding: '1.5rem',
                  borderTop: '1px solid #f3f4f6'
                }}>
                  {/* 步骤说明 */}
                  <div style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    color: '#374151',
                    border: isEditingStep ? '1px dashed #d8b4fe' : '1px solid #f3e8ff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '0.938rem',
                        fontWeight: 700,
                        color: '#6b21a8'
                      }}>
                        步骤说明
                        {isEditingStep && (
                          <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: '#a855f7' }}>
                            编辑模式
                          </span>
                        )}
                      </h4>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => toggleStepEditing(step.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '999px',
                            border: '1px solid #c084fc',
                            backgroundColor: isEditingStep ? '#c084fc' : 'transparent',
                            color: isEditingStep ? '#fff' : '#7e22ce',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <Pencil size={14} />
                          {isEditingStep ? '完成编辑' : '编辑'}
                        </button>
                      )}
                    </div>

                    {!isEditingStep && (
                      <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {detailSections.length === 0 && (
                          <div style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px dashed #e5e7eb',
                            color: '#6b7280',
                            fontSize: '0.85rem'
                          }}>
                            当前步骤暂无说明内容
                          </div>
                        )}
                        {detailSections.map(section => (
                          <div key={section.key}>
                            <div style={{
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              color: '#4c1d95',
                              letterSpacing: '0.02em'
                            }}>
                              {section.title}
                            </div>
                            {renderSectionContent(section.content)}
                          </div>
                        ))}
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

                              {(field.type === 'shortText' || field.type === 'number') && field.type !== 'boolean' && (
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

                  {/* 完成按钮（仅当前活跃步骤显示） */}
                  {step.status === 'active' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        completeStep(index)
                      }}
                      style={{
                        marginTop: '1rem',
                        width: '100%',
                        padding: '0.875rem',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        fontSize: '0.938rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
                    >
                      <CheckCircle2 size={20} />
                      标记完成
                    </button>
                  )}

                  {/* 已完成提示 */}
                  {step.status === 'completed' && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #10b981',
                      color: '#065f46',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      此步骤已完成
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
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(59, 130, 246, 0.1))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 20px 40px rgba(16,185,129,0.15)',
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
              <CheckCircle2 size={56} style={{ color: '#0f766e', margin: '0 auto 1rem' }} />
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.01em' }}>
                全部步骤已完成
              </h3>
              <p style={{ margin: '0 auto 1.5rem', maxWidth: '420px', color: '#0f172a', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {hasEditableChanges
                  ? '检测到对步骤配置的临时修改。请选择是否将它们永久记录到工作流，或保留原始配置。'
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
                    {isSaving ? '保存中...' : '永久记录修改'}
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
                    不记录修改
                  </button>
                </div>
              )}

              {saveError && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(248, 113, 113, 0.15)',
                  color: '#7f1d1d',
                  fontSize: '0.9rem'
                }}>
                  {saveError}
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
                  修改已永久记录
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
                  已保留原始配置
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
