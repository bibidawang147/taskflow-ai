import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { createWorkflow, updateWorkflow, getWorkflowDetail } from '../services/workflowApi'
import { popularWorkPackages } from '../data/popularWorkPackages'
import { exploreThemes } from '../data/exploreThemes'
import '../styles/workflow-create.css'

interface AIModel {
  brand: string
  name: string
  url?: string
}

interface AdvancedSettings {
  temperature: number
  maxTokens: number
}

interface WorkflowStep {
  id: string
  title: string
  prompt: string
  model: AIModel
  alternativeModels: AIModel[]
  advancedSettings: AdvancedSettings
  showAdvanced: boolean
  demonstrationImages?: string[]
}

interface WorkflowFormData {
  title: string
  description: string
  tags: string[]
  steps: WorkflowStep[]
  category: string
  isPublic: boolean
  associatedSolutions: string[]
  associatedThemes: string[]
}

const AI_BRANDS = [
  { value: 'OpenAI', label: 'OpenAI' },
  { value: 'Anthropic', label: 'Anthropic' },
  { value: 'Google', label: 'Google' },
  { value: 'Alibaba', label: 'Alibaba' }
]

const AI_MODELS: Record<string, string[]> = {
  'OpenAI': ['GPT-4', 'GPT-4-Turbo', 'GPT-3.5-Turbo'],
  'Anthropic': ['Claude-3.5-Sonnet', 'Claude-3-Opus', 'Claude-3-Haiku'],
  'Google': ['Gemini-Pro', 'Gemini-Ultra'],
  'Alibaba': ['Qwen-Max', 'Qwen-Plus', 'Qwen-Turbo']
}

export default function WorkflowCreatePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()

  const [formData, setFormData] = useState<WorkflowFormData>({
    title: '',
    description: '',
    tags: [],
    steps: [{
      id: `step_${Date.now()}_${Math.random()}`,
      title: '',
      prompt: '',
      model: {
        brand: 'OpenAI',
        name: 'GPT-4',
        url: ''
      },
      alternativeModels: [],
      advancedSettings: {
        temperature: 0.7,
        maxTokens: 2000
      },
      showAdvanced: false,
      demonstrationImages: []
    }],
    category: 'general',
    isPublic: true,
    associatedSolutions: [],
    associatedThemes: []
  })

  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null)
  const [isFromArticle, setIsFromArticle] = useState(false)
  const [sourceContent, setSourceContent] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceTitle, setSourceTitle] = useState('')
  const [showSolutionDropdown, setShowSolutionDropdown] = useState(false)
  const [showThemeDropdown, setShowThemeDropdown] = useState(false)

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.multi-select-dropdown')) {
        setShowSolutionDropdown(false)
        setShowThemeDropdown(false)
      }
    }

    if (showSolutionDropdown || showThemeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSolutionDropdown, showThemeDropdown])

  // 加载现有工作流（编辑模式）
  useEffect(() => {
    if (id) {
      loadWorkflow()
    }
  }, [id])

  // 处理从文章导入的预填充数据（location.state）
  useEffect(() => {
    const state = location.state as any
    if (state?.prefilled && state?.data) {
      setIsFromArticle(true)
      setSourceContent(state.data.sourceContent || '')
      setSourceUrl(state.data.sourceUrl || '')
      setSourceTitle(state.data.sourceTitle || '')

      setFormData({
        title: state.data.title || '',
        description: state.data.description || '',
        tags: state.data.tags || [],
        steps: state.data.steps || [],
        category: state.data.category || 'general',
        isPublic: state.data.isPublic ?? true,
        associatedSolutions: [],
        associatedThemes: []
      })
    }
  }, [location.state])

  // 处理从 AI Chat 导入的预填充数据（sessionStorage）
  useEffect(() => {
    const prefilledDataStr = sessionStorage.getItem('prefilledWorkflowData')

    if (prefilledDataStr) {
      try {
        const prefilledData = JSON.parse(prefilledDataStr)

        console.log('📥 [WorkflowCreatePage] 读取到预填充数据:', prefilledData)

        if (prefilledData?.prefilled && prefilledData?.data) {
          const data = prefilledData.data

          // 设置来源信息
          if (data.sourceType === 'ai-chat') {
            setIsFromArticle(true)
            setSourceContent(data.sourceContent || '')
            setSourceUrl('')
            setSourceTitle('来自 AI Chat')
          }

          // 设置表单数据
          setFormData({
            title: data.title || '',
            description: data.description || '',
            tags: data.tags || [],
            steps: data.steps || [],
            category: data.category || 'general',
            isPublic: data.isPublic ?? true,
            associatedSolutions: data.associatedSolutions || [],
            associatedThemes: data.associatedThemes || []
          })

          console.log('✅ [WorkflowCreatePage] 表单数据已设置:', {
            title: data.title,
            stepsCount: data.steps?.length,
            steps: data.steps?.map((s: any) => ({
              title: s.title,
              promptLength: s.prompt?.length || 0,
              prompt: s.prompt?.substring(0, 100) + '...'
            }))
          })

          // 清除 sessionStorage，避免下次打开时还显示旧数据
          sessionStorage.removeItem('prefilledWorkflowData')
        }
      } catch (error) {
        console.error('❌ [WorkflowCreatePage] 解析预填充数据失败:', error)
      }
    }
  }, []) // 只在组件挂载时执行一次

  const loadWorkflow = async () => {
    if (!id) return
    try {
      const data = await getWorkflowDetail(id)
      // 转换数据格式
      const steps: WorkflowStep[] = (data.config?.nodes || []).map((node: any) => ({
        id: node.id || `step_${Date.now()}_${Math.random()}`,
        title: node.label || node.config?.goal || '',
        prompt: node.config?.prompt || '',
        model: {
          brand: node.config?.provider || 'OpenAI',
          name: node.config?.model || 'GPT-4',
          url: ''
        },
        alternativeModels: node.config?.alternativeModels || [],
        advancedSettings: {
          temperature: node.config?.temperature || 0.7,
          maxTokens: node.config?.maxTokens || 2000
        },
        showAdvanced: false
      }))

      setFormData({
        title: data.title || '',
        description: data.description || '',
        tags: typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : data.tags || [],
        steps: steps,
        category: data.category || 'general',
        isPublic: data.isPublic ?? true,
        associatedSolutions: data.associatedSolutions || [],
        associatedThemes: data.associatedThemes || []
      })
    } catch (error) {
      console.error('加载工作流失败:', error)
      alert('加载工作流失败')
    }
  }

  // 添加标签
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, trimmedTag]
      })
      setTagInput('')
    }
  }

  // 删除标签
  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    })
  }

  // 添加新步骤
  const handleAddStep = () => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}_${Math.random()}`,
      title: '',
      prompt: '',
      model: {
        brand: 'OpenAI',
        name: 'GPT-4',
        url: ''
      },
      alternativeModels: [],
      advancedSettings: {
        temperature: 0.7,
        maxTokens: 2000
      },
      showAdvanced: false,
      demonstrationImages: []
    }

    setFormData({
      ...formData,
      steps: [...formData.steps, newStep]
    })
  }

  // 更新步骤
  const handleUpdateStep = (index: number, field: string, value: any) => {
    const newSteps = [...formData.steps]
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      newSteps[index] = {
        ...newSteps[index],
        [parent]: {
          ...(newSteps[index] as any)[parent],
          [child]: value
        }
      }
    } else {
      newSteps[index] = {
        ...newSteps[index],
        [field]: value
      }
    }
    setFormData({ ...formData, steps: newSteps })
  }

  // 删除步骤
  const handleDeleteStep = (index: number) => {
    if (confirm('确定要删除这个步骤吗？')) {
      const newSteps = formData.steps.filter((_, i) => i !== index)
      setFormData({ ...formData, steps: newSteps })
    }
  }

  // 添加备用模型
  const handleAddAlternativeModel = (stepIndex: number) => {
    const newSteps = [...formData.steps]
    const defaultBrand = 'OpenAI'
    newSteps[stepIndex].alternativeModels.push({
      brand: defaultBrand,
      name: AI_MODELS[defaultBrand][0],
      url: ''
    })
    setFormData({ ...formData, steps: newSteps })
  }

  // 更新备用模型
  const handleUpdateAlternativeModel = (stepIndex: number, altIndex: number, field: 'brand' | 'name', value: string) => {
    const newSteps = [...formData.steps]
    if (field === 'brand') {
      newSteps[stepIndex].alternativeModels[altIndex] = {
        brand: value,
        name: AI_MODELS[value][0],
        url: ''
      }
    } else {
      newSteps[stepIndex].alternativeModels[altIndex].name = value
    }
    setFormData({ ...formData, steps: newSteps })
  }

  // 删除备用模型
  const handleRemoveAlternativeModel = (stepIndex: number, altIndex: number) => {
    const newSteps = [...formData.steps]
    newSteps[stepIndex].alternativeModels.splice(altIndex, 1)
    setFormData({ ...formData, steps: newSteps })
  }

  // 拖拽开始
  const handleDragStart = (index: number) => {
    setDraggedStepIndex(index)
  }

  // 拖拽经过
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedStepIndex === null || draggedStepIndex === index) return

    const newSteps = [...formData.steps]
    const draggedStep = newSteps[draggedStepIndex]
    newSteps.splice(draggedStepIndex, 1)
    newSteps.splice(index, 0, draggedStep)

    setFormData({ ...formData, steps: newSteps })
    setDraggedStepIndex(index)
  }

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedStepIndex(null)
  }

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '请输入工作流标题'
    }

    if (formData.steps.length === 0) {
      newErrors.steps = '请至少添加一个步骤'
    }

    formData.steps.forEach((step, index) => {
      if (!step.title.trim()) {
        newErrors[`step_${index}_title`] = '请输入步骤标题'
      }
      if (!step.prompt.trim()) {
        newErrors[`step_${index}_prompt`] = '请输入提示词内容'
      }
      if (!step.alternativeModels || step.alternativeModels.length === 0) {
        newErrors[`step_${index}_models`] = '请至少添加一个工具/平台/模型，或点击"与上一步相同"'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 保存工作流（存草稿或发布）
  const handleSave = async (isDraft: boolean) => {
    if (!validateForm()) {
      alert('请填写所有必填字段')
      return
    }

    try {
      setSaving(true)

      // 转换为后端需要的格式
      const workflowData: any = {
        title: formData.title,
        description: formData.description,
        tags: formData.tags.join(','),
        category: formData.category,
        isPublic: isDraft ? false : formData.isPublic,
        isDraft: isDraft,
        config: {
          nodes: formData.steps.map((step, index) => ({
            id: step.id,
            type: 'ai',
            label: step.title,
            config: {
              goal: step.title,
              prompt: step.prompt,
              provider: step.alternativeModels.length > 0 ? '' : 'OpenAI',
              model: step.alternativeModels.length > 0 ? step.alternativeModels[0].name : 'GPT-4',
              alternativeModels: step.alternativeModels,
              temperature: 0.7,
              maxTokens: 2000
            },
            position: { x: 100, y: 100 + index * 150 }
          }))
        }
      }

      console.log('💾 [WorkflowCreatePage] 保存工作流，节点数据:', {
        isDraft,
        isPublic: workflowData.isPublic,
        nodesCount: workflowData.config.nodes.length,
        nodes: workflowData.config.nodes.map((n: any) => ({
          id: n.id,
          label: n.label,
          hasConfig: !!n.config,
          configKeys: n.config ? Object.keys(n.config) : [],
          hasPrompt: !!n.config?.prompt,
          promptLength: n.config?.prompt?.length || 0
        }))
      })

      // 添加关联信息（仅发布时）
      if (!isDraft) {
        if (formData.associatedSolutions.length > 0) {
          workflowData.associatedSolutions = formData.associatedSolutions
        }
        if (formData.associatedThemes.length > 0) {
          workflowData.associatedThemes = formData.associatedThemes
        }
      }

      // 如果是从文章导入的，添加来源信息
      if (isFromArticle) {
        workflowData.sourceType = 'article'
        if (sourceContent) {
          workflowData.sourceContent = sourceContent
        }
        if (sourceUrl) {
          workflowData.sourceUrl = sourceUrl
        }
        if (sourceTitle) {
          workflowData.sourceTitle = sourceTitle
        }
      }

      if (id) {
        await updateWorkflow(id, workflowData)
        alert('工作流更新成功！')
        navigate('/workspace')
      } else {
        const result = await createWorkflow(workflowData)
        alert(isDraft ? '草稿保存成功！' : '工作流发布成功！')
        if (isDraft) {
          navigate('/workspace')
        } else {
          navigate(`/workflow-intro/${result.id}`)
        }
      }
    } catch (error) {
      console.error('保存工作流失败:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="workflow-create-page-v2">
      <div className="create-container">
        {/* 从文章生成提示 */}
        {isFromArticle && (
          <div className="article-import-banner">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z" fill="currentColor"/>
            </svg>
            <div className="banner-content">
              <strong>此工作流已从文章自动生成</strong>
              <span>请仔细检查并修改内容，确保符合您的实际需求</span>
            </div>
          </div>
        )}

        {/* 标题输入 */}
        <div className="title-section">
          <input
            type="text"
            className={`title-input ${errors.title ? 'error' : ''}`}
            placeholder="输入工作流标题，例如：AI辅助创作小红书爆款种草文案"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          {errors.title && <div className="error-message">{errors.title}</div>}
        </div>

        {/* 基本信息区域 */}
        <div className="info-card">
          <h2 className="card-title">基本信息</h2>

          <div className="form-field">
            <label className="field-label">简介</label>
            <textarea
              className="field-textarea"
              placeholder="描述这个工作流的用途和特点..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label className="field-label">标签</label>
            <div className="tags-container">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag-badge">
                  {tag}
                  <button
                    className="tag-remove"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
              <div className="tag-input-group">
                <input
                  type="text"
                  className="tag-input"
                  placeholder="添加标签..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <button className="tag-add-btn" onClick={handleAddTag}>
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 操作步骤区域 */}
        <div className="steps-section">
          <div className="steps-header">
            <h2 className="section-title">操作步骤</h2>
            <button className="add-step-btn" onClick={handleAddStep}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加步骤
            </button>
          </div>

          {errors.steps && <div className="error-message">{errors.steps}</div>}

          <div className="steps-list">
            {formData.steps.map((step, index) => (
              <div
                key={step.id}
                className={`step-card ${draggedStepIndex === index ? 'dragging' : ''}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                {/* 删除按钮（右上角） */}
                <button
                  className="delete-step-btn"
                  onClick={() => handleDeleteStep(index)}
                  title="删除步骤"
                >
                  ×
                </button>

                {/* 步骤头部 */}
                <div className="step-header">
                  <div className="step-header-left">
                    <div className="drag-handle" title="拖拽排序">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="5" r="1" />
                        <circle cx="9" cy="12" r="1" />
                        <circle cx="9" cy="19" r="1" />
                        <circle cx="15" cy="5" r="1" />
                        <circle cx="15" cy="12" r="1" />
                        <circle cx="15" cy="19" r="1" />
                      </svg>
                    </div>
                    <span className="step-number">步骤 {index + 1}</span>
                    <input
                      type="text"
                      className={`step-title-input ${errors[`step_${index}_title`] ? 'error' : ''}`}
                      placeholder="输入步骤标题..."
                      value={step.title}
                      onChange={(e) => handleUpdateStep(index, 'title', e.target.value)}
                    />
                  </div>
                </div>
                {errors[`step_${index}_title`] && (
                  <div className="error-message">{errors[`step_${index}_title`]}</div>
                )}

                {/* 提示词输入 */}
                <div className="step-content">
                  <label className="content-label">提示词</label>
                  <textarea
                    className={`prompt-textarea ${errors[`step_${index}_prompt`] ? 'error' : ''}`}
                    placeholder="输入给 AI 的提示词内容..."
                    rows={6}
                    value={step.prompt}
                    onChange={(e) => handleUpdateStep(index, 'prompt', e.target.value)}
                  />
                  {errors[`step_${index}_prompt`] && (
                    <div className="error-message">{errors[`step_${index}_prompt`]}</div>
                  )}
                </div>

                {/* 用什么做的 在哪里做的 */}
                <div className="model-input-section">
                  <div className="model-section-header">
                    <label className="content-label">
                      用什么做的 在哪里做的
                    </label>
                    {index > 0 && (
                      <button
                        type="button"
                        className="copy-previous-btn"
                        onClick={() => {
                          const previousStep = formData.steps[index - 1]
                          if (previousStep.alternativeModels && previousStep.alternativeModels.length > 0) {
                            // 深拷贝上一步的模型列表
                            const copiedModels = previousStep.alternativeModels.map(model => ({
                              brand: model.brand,
                              name: model.name,
                              url: model.url
                            }))
                            handleUpdateStep(index, 'alternativeModels', copiedModels)
                            // 清除错误
                            const newErrors = { ...errors }
                            delete newErrors[`step_${index}_models`]
                            setErrors(newErrors)
                          }
                        }}
                        title="复制上一步的工具/模型"
                      >
                        与上一步相同
                      </button>
                    )}
                  </div>

                  {/* 添加模型输入框 */}
                  <div className="model-input-wrapper">
                    <input
                      type="text"
                      className={`model-text-input ${errors[`step_${index}_models`] ? 'error' : ''}`}
                      placeholder="输入工具/平台/模型，按回车添加（如：ChatGPT、Notion、Figma、https://...）"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement
                          const modelText = input.value.trim()
                          if (modelText) {
                            const currentModels = step.alternativeModels || []
                            // 将模型名称存储为 {brand: '', name: modelText, url: ''}
                            handleUpdateStep(index, 'alternativeModels', [
                              ...currentModels,
                              { brand: '', name: modelText, url: '' }
                            ])
                            input.value = ''
                            // 清除错误
                            const newErrors = { ...errors }
                            delete newErrors[`step_${index}_models`]
                            setErrors(newErrors)
                          }
                        }
                      }}
                    />
                    <span className="hint-text">支持工具名称、平台名称或链接，按回车添加</span>
                  </div>

                  {/* 模型列表 */}
                  {step.alternativeModels && step.alternativeModels.length > 0 && (
                    <div className="models-list">
                      {step.alternativeModels.map((model, modelIdx) => (
                        <div key={modelIdx} className="model-tag">
                          <span className="model-text">{model.name}</span>
                          <button
                            type="button"
                            className="remove-model-btn"
                            onClick={() => {
                              const currentModels = step.alternativeModels || []
                              const newModels = currentModels.filter((_, i) => i !== modelIdx)
                              handleUpdateStep(index, 'alternativeModels', newModels)
                            }}
                            title="删除模型"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 错误提示 */}
                  {errors[`step_${index}_models`] && (
                    <div className="error-message">{errors[`step_${index}_models`]}</div>
                  )}
                </div>

              </div>
            ))}

            {/* 添加步骤按钮 */}
            {formData.steps.length > 0 && (
              <button className="add-step-btn-inline" onClick={handleAddStep}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                添加步骤
              </button>
            )}
          </div>
        </div>

        {/* 关联设置区域 */}
        <div className="info-card">
          <h2 className="card-title">关联设置</h2>
          <p className="card-description">
            发布工作流时，可以选择将其添加到相关的工作包和主题分类中，方便用户发现和使用
          </p>

          {/* 关联到工作包 */}
              <div className="form-field">
                <label className="field-label">
                  关联到工作包 (可选)
                  <span className="field-hint">选择将此工作流添加到哪些工作包中</span>
                </label>
                <div className="multi-select-dropdown">
                  <div
                    className="multi-select-trigger"
                    onClick={() => setShowSolutionDropdown(!showSolutionDropdown)}
                  >
                    <span className="selected-text">
                      {formData.associatedSolutions.length === 0
                        ? '请选择工作包...'
                        : `已选择 ${formData.associatedSolutions.length} 个工作包`}
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ transform: showSolutionDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  {showSolutionDropdown && (
                    <div className="multi-select-options">
                      {popularWorkPackages.map((pkg) => (
                        <label key={pkg.id} className="multi-select-option">
                          <input
                            type="checkbox"
                            checked={formData.associatedSolutions.includes(pkg.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  associatedSolutions: [...formData.associatedSolutions, pkg.id]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  associatedSolutions: formData.associatedSolutions.filter(id => id !== pkg.id)
                                })
                              }
                            }}
                          />
                          <span className="option-icon">{pkg.icon}</span>
                          <span className="option-name">{pkg.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formData.associatedSolutions.length > 0 && (
                  <div className="selected-tags">
                    {formData.associatedSolutions.map(id => {
                      const pkg = popularWorkPackages.find(p => p.id === id)
                      return pkg ? (
                        <span key={id} className="selected-tag">
                          <span className="tag-icon">{pkg.icon}</span>
                          <span className="tag-text">{pkg.name}</span>
                          <button
                            type="button"
                            className="tag-remove-btn"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                associatedSolutions: formData.associatedSolutions.filter(sid => sid !== id)
                              })
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </div>

              {/* 关联到主题 */}
              <div className="form-field">
                <label className="field-label">
                  关联到主题 (可选)
                  <span className="field-hint">选择将此工作流添加到哪些主题分类中</span>
                </label>
                <div className="multi-select-dropdown">
                  <div
                    className="multi-select-trigger"
                    onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                  >
                    <span className="selected-text">
                      {formData.associatedThemes.length === 0
                        ? '请选择主题...'
                        : `已选择 ${formData.associatedThemes.length} 个主题`}
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ transform: showThemeDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  {showThemeDropdown && (
                    <div className="multi-select-options">
                      {exploreThemes.map((theme) => (
                        <label key={theme.id} className="multi-select-option">
                          <input
                            type="checkbox"
                            checked={formData.associatedThemes.includes(theme.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  associatedThemes: [...formData.associatedThemes, theme.id]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  associatedThemes: formData.associatedThemes.filter(id => id !== theme.id)
                                })
                              }
                            }}
                          />
                          <span className="option-icon">{theme.icon}</span>
                          <span className="option-name">{theme.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formData.associatedThemes.length > 0 && (
                  <div className="selected-tags">
                    {formData.associatedThemes.map(id => {
                      const theme = exploreThemes.find(t => t.id === id)
                      return theme ? (
                        <span key={id} className="selected-tag">
                          <span className="tag-icon">{theme.icon}</span>
                          <span className="tag-text">{theme.name}</span>
                          <button
                            type="button"
                            className="tag-remove-btn"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                associatedThemes: formData.associatedThemes.filter(tid => tid !== id)
                              })
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="form-actions">
          <button
            className="action-btn secondary"
            onClick={() => navigate('/workspace')}
            disabled={saving}
          >
            取消
          </button>
          <button
            className="action-btn secondary"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? '保存中...' : '存草稿'}
          </button>
          <button
            className="action-btn primary"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? '发布中...' : (
              <>
                发布
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}>
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
