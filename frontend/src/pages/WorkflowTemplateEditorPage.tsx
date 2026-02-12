import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui/Toast'
import PreparationsEditor from '../components/WorkflowEditor/PreparationsEditor'
import StepDetailEditor from '../components/WorkflowEditor/StepDetailEditor'
import {
  getFullWorkflow,
  updateWorkflow,
  setPreparations,
  saveStepDetail,
  type FullWorkflow,
  type WorkflowPreparation,
  type WorkflowStepDetail,
  type DifficultyLevel
} from '../services/workflowApi'

interface StepNode {
  id: string
  label: string
  stepDetail?: Partial<WorkflowStepDetail>
}

interface WorkflowFormData {
  title: string
  description: string
  thumbnail: string
  tags: string[]
  difficultyLevel: DifficultyLevel
  useScenarios: string[]
  preparations: Array<{ id?: string; name: string; description?: string; link?: string }>
  steps: StepNode[]
}

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; color: string }[] = [
  { value: 'beginner', label: '简单', color: 'bg-green-100 text-green-700' },
  { value: 'intermediate', label: '中等', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'advanced', label: '复杂', color: 'bg-red-100 text-red-700' }
]

export default function WorkflowTemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const isEditing = !!id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<'basic' | 'preparations' | 'steps'>('basic')
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [tagInput, setTagInput] = useState('')
  const [scenarioInput, setScenarioInput] = useState('')

  const [formData, setFormData] = useState<WorkflowFormData>({
    title: '',
    description: '',
    thumbnail: '',
    tags: [],
    difficultyLevel: 'beginner',
    useScenarios: [],
    preparations: [],
    steps: []
  })

  // 加载工作流数据
  useEffect(() => {
    const loadWorkflow = async () => {
      if (!id) {
        setLoading(false)
        // 创建默认的第一个步骤
        setFormData(prev => ({
          ...prev,
          steps: [{ id: `step_${Date.now()}`, label: '步骤 1', stepDetail: {} }]
        }))
        return
      }

      try {
        const workflow = await getFullWorkflow(id)

        // 解析 tags
        let tags: string[] = []
        if (typeof workflow.tags === 'string') {
          tags = workflow.tags.split(',').map(t => t.trim()).filter(Boolean)
        } else if (Array.isArray(workflow.tags)) {
          tags = workflow.tags
        }

        // 解析 useScenarios
        let useScenarios: string[] = []
        if (workflow.useScenarios) {
          useScenarios = Array.isArray(workflow.useScenarios)
            ? workflow.useScenarios
            : JSON.parse(workflow.useScenarios as any)
        }

        // 转换节点为步骤
        const steps: StepNode[] = (workflow.nodes || []).map(node => ({
          id: node.id,
          label: node.label,
          stepDetail: node.stepDetail || {}
        }))

        // 如果没有步骤，创建默认的第一个步骤
        if (steps.length === 0) {
          steps.push({ id: `step_${Date.now()}`, label: '步骤 1', stepDetail: {} })
        }

        setFormData({
          title: workflow.title || '',
          description: workflow.description || '',
          thumbnail: workflow.thumbnail || '',
          tags,
          difficultyLevel: (workflow.difficultyLevel as DifficultyLevel) || 'beginner',
          useScenarios,
          preparations: workflow.preparations || [],
          steps
        })
      } catch (error) {
        console.error('加载工作流失败:', error)
        showToast('加载工作流失败', 'error')
      } finally {
        setLoading(false)
      }
    }

    loadWorkflow()
  }, [id])

  // 更新表单字段
  const updateField = <K extends keyof WorkflowFormData>(
    field: K,
    value: WorkflowFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 添加标签
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateField('tags', [...formData.tags, tagInput.trim()])
      setTagInput('')
    }
  }

  // 删除标签
  const removeTag = (tag: string) => {
    updateField('tags', formData.tags.filter(t => t !== tag))
  }

  // 添加场景
  const addScenario = () => {
    if (scenarioInput.trim() && !formData.useScenarios.includes(scenarioInput.trim())) {
      updateField('useScenarios', [...formData.useScenarios, scenarioInput.trim()])
      setScenarioInput('')
    }
  }

  // 删除场景
  const removeScenario = (scenario: string) => {
    updateField('useScenarios', formData.useScenarios.filter(s => s !== scenario))
  }

  // 添加步骤
  const addStep = () => {
    const newStep: StepNode = {
      id: `step_${Date.now()}`,
      label: `步骤 ${formData.steps.length + 1}`,
      stepDetail: {}
    }
    updateField('steps', [...formData.steps, newStep])
    setActiveStepIndex(formData.steps.length)
  }

  // 删除步骤
  const removeStep = (index: number) => {
    if (formData.steps.length <= 1) {
      showToast('至少需要保留一个步骤', 'info')
      return
    }
    const updated = formData.steps.filter((_, i) => i !== index)
    updateField('steps', updated)
    if (activeStepIndex >= updated.length) {
      setActiveStepIndex(updated.length - 1)
    }
  }

  // 更新步骤标题
  const updateStepLabel = (index: number, label: string) => {
    const updated = [...formData.steps]
    updated[index] = { ...updated[index], label }
    updateField('steps', updated)
  }

  // 更新步骤详情
  const updateStepDetail = (index: number, stepDetail: Partial<WorkflowStepDetail>) => {
    const updated = [...formData.steps]
    updated[index] = { ...updated[index], stepDetail }
    updateField('steps', updated)
  }

  // 移动步骤
  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.steps.length - 1)
    ) {
      return
    }
    const updated = [...formData.steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]]
    updateField('steps', updated)
    setActiveStepIndex(targetIndex)
  }

  // 保存工作流
  const handleSave = async () => {
    if (!formData.title.trim()) {
      showToast('请输入工作流标题', 'info')
      return
    }

    if (!id) {
      showToast('请先创建工作流后再编辑', 'info')
      return
    }

    setSaving(true)
    try {
      // 1. 更新工作流基本信息
      await updateWorkflow(id, {
        title: formData.title,
        description: formData.description,
        // thumbnail: formData.thumbnail, // 需要后端支持
        tags: formData.tags,
        // difficultyLevel: formData.difficultyLevel, // 需要后端支持
        // useScenarios: formData.useScenarios, // 需要后端支持
      })

      // 2. 更新前置准备
      await setPreparations(id, formData.preparations.map(p => ({
        name: p.name,
        description: p.description,
        link: p.link
      })))

      // 3. 更新每个步骤的详情
      for (const step of formData.steps) {
        if (step.stepDetail && Object.keys(step.stepDetail).length > 0) {
          await saveStepDetail(id, step.id, step.stepDetail)
        }
      }

      showToast('保存成功！', 'success')
    } catch (error) {
      console.error('保存失败:', error)
      showToast('保存失败，请重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                {isEditing ? '编辑工作流模板' : '创建工作流模板'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 分区导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            {[
              { id: 'basic', label: '基本信息', icon: '📋' },
              { id: 'preparations', label: '前置准备', icon: '🔧' },
              { id: 'steps', label: '操作步骤', icon: '📝' }
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{section.icon}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 基本信息 */}
        {activeSection === 'basic' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900">基本信息</h2>

            {/* 标题 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="输入工作流标题"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 简介 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                简介
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="简要描述这个工作流的用途和价值"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 封面图 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                封面图
              </label>
              <input
                type="url"
                value={formData.thumbnail}
                onChange={(e) => updateField('thumbnail', e.target.value)}
                placeholder="输入图片链接"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {formData.thumbnail && (
                <div className="mt-2">
                  <img
                    src={formData.thumbnail}
                    alt="封面预览"
                    className="h-32 object-cover rounded-md"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </div>

            {/* 难度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                难度级别
              </label>
              <div className="flex gap-3">
                {DIFFICULTY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField('difficultyLevel', option.value)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      formData.difficultyLevel === option.value
                        ? `${option.color} ring-2 ring-offset-2 ring-blue-500`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="输入标签后按回车"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  添加
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 适用场景 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                适用场景
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={scenarioInput}
                  onChange={(e) => setScenarioInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addScenario())}
                  placeholder="输入场景后按回车（如：涨粉、提高打开率）"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addScenario}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  添加
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.useScenarios.map((scenario) => (
                  <span
                    key={scenario}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                  >
                    {scenario}
                    <button
                      type="button"
                      onClick={() => removeScenario(scenario)}
                      className="text-green-500 hover:text-green-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 前置准备 */}
        {activeSection === 'preparations' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <PreparationsEditor
              preparations={formData.preparations}
              onChange={(preparations) => updateField('preparations', preparations)}
            />
          </div>
        )}

        {/* 操作步骤 */}
        {activeSection === 'steps' && (
          <div className="flex gap-6">
            {/* 步骤列表 */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">步骤列表</h3>
                  <button
                    type="button"
                    onClick={addStep}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    title="添加步骤"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                        activeStepIndex === index
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setActiveStepIndex(index)}
                    >
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moveStep(index, 'up') }}
                          disabled={index === 0}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moveStep(index, 'down') }}
                          disabled={index === formData.steps.length - 1}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm text-gray-700 truncate">
                        {step.label}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeStep(index) }}
                        className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 步骤详情编辑 */}
            <div className="flex-1">
              {formData.steps[activeStepIndex] && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                  {/* 步骤标题 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      步骤标题
                    </label>
                    <input
                      type="text"
                      value={formData.steps[activeStepIndex].label}
                      onChange={(e) => updateStepLabel(activeStepIndex, e.target.value)}
                      placeholder="这一步做什么"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 步骤详情编辑器 */}
                  <StepDetailEditor
                    stepDetail={formData.steps[activeStepIndex].stepDetail || {}}
                    onChange={(stepDetail) => updateStepDetail(activeStepIndex, stepDetail)}
                    availableNodes={formData.steps.map(s => ({ id: s.id, label: s.label }))}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
