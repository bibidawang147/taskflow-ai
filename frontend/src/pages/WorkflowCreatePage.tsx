import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { createWorkflow, updateWorkflow, getWorkflowDetail } from '../services/workflowApi'
import { chatWithAI } from '../services/aiApi'
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

// 步骤工具
interface StepTool {
  id: string
  name: string
  url: string
  description: string
}

// 演示媒体
interface DemonstrationMedia {
  id: string
  type: 'image' | 'video'
  url: string
  caption: string
}

// 相关资源
interface RelatedResource {
  id: string
  title: string
  type: 'link' | 'file'
  url: string
  description: string
}

interface WorkflowStep {
  id: string
  title: string
  description: string  // 步骤说明
  prompt: string
  expectedResult: string  // 预期结果
  model: AIModel
  alternativeModels: AIModel[]
  advancedSettings: AdvancedSettings
  showAdvanced: boolean
  tools: StepTool[]  // 步骤工具列表
  demonstrationMedia: DemonstrationMedia[]  // 演示媒体（图片/视频）
  relatedResources: RelatedResource[]  // 相关资源
  associatedSolutions: string[]  // 关联工作包
  associatedThemes: string[]     // 关联主题
}

// 前置准备项
interface PreparationItem {
  id: string
  name: string
  description: string
  link: string
}

// 难度级别
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

interface WorkflowFormData {
  title: string
  description: string
  tags: string[]
  difficultyLevel: DifficultyLevel  // 难度级别
  price: number                     // 付费价格
  useScenarios: string[]            // 适用场景
  preparations: PreparationItem[]   // 前置准备
  steps: WorkflowStep[]
  category: string
  isPublic: boolean
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

// 场景分类（大类 -> 小类）
const SCENARIO_CATEGORIES = [
  {
    id: 'content',
    name: '内容创作',
    children: [
      { id: 'content-article', name: '文章写作' },
      { id: 'content-copywriting', name: '文案撰写' },
      { id: 'content-script', name: '脚本创作' },
      { id: 'content-translate', name: '翻译润色' },
    ]
  },
  {
    id: 'marketing',
    name: '营销推广',
    children: [
      { id: 'marketing-social', name: '社交媒体' },
      { id: 'marketing-ads', name: '广告投放' },
      { id: 'marketing-seo', name: 'SEO优化' },
      { id: 'marketing-email', name: '邮件营销' },
    ]
  },
  {
    id: 'design',
    name: '设计制作',
    children: [
      { id: 'design-image', name: '图片设计' },
      { id: 'design-video', name: '视频制作' },
      { id: 'design-ppt', name: 'PPT制作' },
      { id: 'design-ui', name: 'UI设计' },
    ]
  },
  {
    id: 'work',
    name: '办公效率',
    children: [
      { id: 'work-doc', name: '文档处理' },
      { id: 'work-data', name: '数据分析' },
      { id: 'work-meeting', name: '会议纪要' },
      { id: 'work-report', name: '报告撰写' },
    ]
  },
  {
    id: 'development',
    name: '开发技术',
    children: [
      { id: 'dev-code', name: '代码开发' },
      { id: 'dev-debug', name: '问题调试' },
      { id: 'dev-doc', name: '技术文档' },
      { id: 'dev-review', name: '代码审查' },
    ]
  },
  {
    id: 'learning',
    name: '学习教育',
    children: [
      { id: 'learn-study', name: '知识学习' },
      { id: 'learn-exam', name: '考试备考' },
      { id: 'learn-language', name: '语言学习' },
      { id: 'learn-skill', name: '技能提升' },
    ]
  },
  {
    id: 'other',
    name: '其他',
    children: [
      { id: 'other-life', name: '生活助手' },
      { id: 'other-creative', name: '创意灵感' },
      { id: 'other-consult', name: '咨询顾问' },
      { id: 'other-misc', name: '其他场景' },
    ]
  },
]

export default function WorkflowCreatePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()

  const [formData, setFormData] = useState<WorkflowFormData>({
    title: '',
    description: '',
    tags: [],
    difficultyLevel: 'beginner',
    price: 0,
    useScenarios: [],
    preparations: [],
    steps: [{
      id: `step_${Date.now()}_${Math.random()}`,
      title: '',
      description: '',
      prompt: '',
      expectedResult: '',
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
      tools: [],
      demonstrationMedia: [],
      relatedResources: [],
      associatedSolutions: [],
      associatedThemes: []
    }],
    category: 'general',
    isPublic: true
  })

  const [tagInput, setTagInput] = useState('')
  const [scenarioInput, setScenarioInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null)
  const [isFromArticle, setIsFromArticle] = useState(false)
  const [sourceContent, setSourceContent] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceTitle, setSourceTitle] = useState('')
  // 每个步骤的下拉框状态: stepId_type
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  // 每个步骤的高级设置展开状态
  const [expandedAdvanced, setExpandedAdvanced] = useState<Set<string>>(new Set())
  // AI 生成简介状态
  const [generatingDescription, setGeneratingDescription] = useState(false)
  // 场景选择：当前选中的大类
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.multi-select-dropdown')) {
        setOpenDropdown(null)
      }
    }

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

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
        description: node.config?.stepDescription || '',
        prompt: node.config?.prompt || '',
        expectedResult: node.config?.expectedResult || '',
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
        showAdvanced: false,
        // 加载工具列表（新增）
        tools: (node.config?.tools || []).map((t: any, idx: number) => ({
          id: `tool_${Date.now()}_${idx}`,
          name: t.name || '',
          url: t.url || '',
          description: t.description || ''
        })),
        // 加载演示媒体（新增）
        demonstrationMedia: (node.config?.demonstrationMedia || []).map((m: any, idx: number) => ({
          id: `media_${Date.now()}_${idx}`,
          type: m.type || 'image',
          url: m.url || '',
          caption: m.caption || ''
        })),
        // 加载相关资源（新增）
        relatedResources: (node.config?.relatedResources || []).map((r: any, idx: number) => ({
          id: `resource_${Date.now()}_${idx}`,
          title: r.title || '',
          type: r.type || 'link',
          url: r.url || '',
          description: r.description || ''
        })),
        associatedSolutions: node.config?.associatedSolutions || [],
        associatedThemes: node.config?.associatedThemes || []
      }))

      // 转换前置准备数据
      const preparations: PreparationItem[] = (data.preparations || []).map((p: any) => ({
        id: p.id || `prep_${Date.now()}_${Math.random()}`,
        name: p.name || '',
        description: p.description || '',
        link: p.link || ''
      }))

      setFormData({
        title: data.title || '',
        description: data.description || '',
        tags: typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : data.tags || [],
        difficultyLevel: data.difficultyLevel || 'beginner',
        useScenarios: data.useScenarios || [],
        preparations: preparations,
        steps: steps,
        category: data.category || 'general',
        isPublic: data.isPublic ?? true
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

  // 添加场景
  const handleAddScenario = () => {
    const trimmedScenario = scenarioInput.trim()
    if (trimmedScenario && !formData.useScenarios.includes(trimmedScenario)) {
      setFormData({
        ...formData,
        useScenarios: [...formData.useScenarios, trimmedScenario]
      })
      setScenarioInput('')
    }
  }

  // 删除场景
  const handleRemoveScenario = (scenario: string) => {
    setFormData({
      ...formData,
      useScenarios: formData.useScenarios.filter(s => s !== scenario)
    })
  }

  // 添加前置准备项
  const handleAddPreparation = () => {
    const newPrep: PreparationItem = {
      id: `prep_${Date.now()}_${Math.random()}`,
      name: '',
      description: '',
      link: ''
    }
    setFormData({
      ...formData,
      preparations: [...formData.preparations, newPrep]
    })
  }

  // 更新前置准备项
  const handleUpdatePreparation = (index: number, field: keyof PreparationItem, value: string) => {
    const newPreps = [...formData.preparations]
    newPreps[index] = { ...newPreps[index], [field]: value }
    setFormData({ ...formData, preparations: newPreps })
  }

  // 删除前置准备项
  const handleRemovePreparation = (index: number) => {
    setFormData({
      ...formData,
      preparations: formData.preparations.filter((_, i) => i !== index)
    })
  }

  // 切换步骤高级设置展开状态
  const toggleStepAdvanced = (stepId: string) => {
    setExpandedAdvanced(prev => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }

  // AI 生成简介
  const handleGenerateDescription = async () => {
    if (!formData.title.trim()) {
      alert('请先输入工作流标题')
      return
    }

    setGeneratingDescription(true)
    try {
      const prompt = `你是一个专业的工作流文案专家。请根据以下工作流标题，生成一段简洁、有吸引力的简介，让用户一眼就能明白这个工作流的价值和用途。

工作流标题：${formData.title}
${formData.tags.length > 0 ? `相关标签：${formData.tags.join('、')}` : ''}
${formData.useScenarios.length > 0 ? `适用场景：${formData.useScenarios.join('、')}` : ''}

要求：
1. 简介控制在50-100字以内
2. 突出工作流的核心价值和独特优势
3. 使用简洁有力的语言，避免空洞的描述
4. 让用户产生立即使用的欲望

直接输出简介内容，不要有任何前缀或解释。`

      const response = await chatWithAI({
        provider: 'doubao',
        model: 'doubao-1-5-pro-32k-250115',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 200
      })

      if (response.success && response.data.content) {
        setFormData({ ...formData, description: response.data.content.trim() })
      } else {
        alert('生成失败，请重试')
      }
    } catch (error: any) {
      console.error('AI 生成简介失败:', error)
      alert(error.message || '生成失败，请重试')
    } finally {
      setGeneratingDescription(false)
    }
  }

  // 添加新步骤
  const handleAddStep = () => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}_${Math.random()}`,
      title: '',
      description: '',
      prompt: '',
      expectedResult: '',
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
      tools: [],
      demonstrationMedia: [],
      relatedResources: [],
      associatedSolutions: [],
      associatedThemes: []
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
      // 工具不是必填项，移除强制验证
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
        difficultyLevel: formData.difficultyLevel,
        useScenarios: formData.useScenarios,
        preparations: formData.preparations.filter(p => p.name.trim()).map((p, index) => ({
          name: p.name,
          description: p.description,
          link: p.link,
          order: index
        })),
        config: {
          nodes: formData.steps.map((step, index) => ({
            id: step.id,
            type: 'ai',
            label: step.title,
            config: {
              goal: step.title,
              prompt: step.prompt,
              stepDescription: step.description,
              expectedResult: step.expectedResult,
              // 工具列表（新增）
              tools: step.tools.filter(t => t.name.trim()).map(t => ({
                name: t.name,
                url: t.url,
                description: t.description
              })),
              // 演示媒体（新增）
              demonstrationMedia: step.demonstrationMedia.filter(m => m.url.trim()).map(m => ({
                type: m.type,
                url: m.url,
                caption: m.caption
              })),
              // 相关资源（新增）
              relatedResources: step.relatedResources.filter(r => r.title.trim() || r.url.trim()).map(r => ({
                title: r.title,
                type: r.type,
                url: r.url,
                description: r.description
              })),
              // 保留旧字段以兼容
              provider: step.tools.length > 0 ? '' : 'OpenAI',
              model: step.tools.length > 0 ? step.tools[0].name : 'GPT-4',
              alternativeModels: step.alternativeModels,
              temperature: 0.7,
              maxTokens: 2000,
              associatedSolutions: step.associatedSolutions,
              associatedThemes: step.associatedThemes
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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <input
              type="text"
              className={`title-input ${errors.title ? 'error' : ''}`}
              placeholder="输入工作流标题，例如：AI辅助创作小红书爆款种草文案"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{ flex: 1 }}
            />
            {/* 文章快速转按钮 */}
            <button
              type="button"
              onClick={() => navigate('/workflow/import-from-article')}
              style={{
                padding: '10px 18px',
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
                color: '#8b5cf6',
                border: '1.5px solid rgba(139, 92, 246, 0.25)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                height: '44px',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.12)'
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(139, 92, 246, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.25)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <FileText size={16} />
              <span>文章快速转</span>
            </button>
          </div>
          {errors.title && <div className="error-message">{errors.title}</div>}
        </div>

        {/* 基本信息区域 */}
        <div className="info-card">
          <h2 className="card-title">基本信息</h2>

          <div className="form-field">
            <div className="field-label-with-action">
              <label className="field-label">简介</label>
              <button
                type="button"
                className="ai-assist-btn"
                onClick={handleGenerateDescription}
                disabled={generatingDescription}
              >
                {generatingDescription ? (
                  <>
                    <span className="ai-loading-spinner"></span>
                    生成中...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                    AI 生成
                  </>
                )}
              </button>
            </div>
            <textarea
              className="field-textarea"
              placeholder="描述这个工作流的用途和特点...（可点击右上方 AI 生成按钮自动生成）"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* 选择类型 */}
          <div className="form-field">
            <label className="field-label">选择类型</label>
            <div className="type-selector-row">
              <div className="difficulty-selector">
                <button
                  type="button"
                  className={`difficulty-btn ${formData.difficultyLevel === 'beginner' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, difficultyLevel: 'beginner' })}
                >
                  <span className="difficulty-text">免费</span>
                </button>
                <button
                  type="button"
                  className={`difficulty-btn ${formData.difficultyLevel === 'intermediate' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, difficultyLevel: 'intermediate' })}
                >
                  <span className="difficulty-text">会员</span>
                </button>
                <button
                  type="button"
                  className={`difficulty-btn ${formData.difficultyLevel === 'advanced' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, difficultyLevel: 'advanced' })}
                >
                  <span className="difficulty-text">付费</span>
                </button>
              </div>
              {formData.difficultyLevel === 'advanced' && (
                <div className="price-input-group">
                  <span className="price-currency">¥</span>
                  <input
                    type="number"
                    className="price-input"
                    placeholder="0"
                    min="0"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) || 0 })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 适用场景 - 两级选择 */}
          <div className="form-field">
            <label className="field-label">适用场景</label>
            <div className="scenario-two-level">
              {/* 第一级：大类选择 */}
              <select
                className="scenario-select"
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
              >
                <option value="">选择大类...</option>
                {SCENARIO_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* 第二级：小类选择 */}
              <select
                className="scenario-select"
                value={formData.useScenarios[0] || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setFormData({ ...formData, useScenarios: [e.target.value] })
                  } else {
                    setFormData({ ...formData, useScenarios: [] })
                  }
                }}
                disabled={!selectedCategory}
              >
                <option value="">选择小类...</option>
                {selectedCategory && SCENARIO_CATEGORIES
                  .find(cat => cat.id === selectedCategory)
                  ?.children.map((child) => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))
                }
              </select>
            </div>
          </div>
        </div>

        {/* 前置准备区域 */}
        <div className="info-card preparations-card">
          <div className="card-header-with-action">
            <div>
              <h2 className="card-title">前置准备</h2>
              <p className="card-description">在开始工作流之前，用户需要准备什么？</p>
            </div>
            <button className="add-btn-small" onClick={handleAddPreparation}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加准备项
            </button>
          </div>

          {formData.preparations.length === 0 ? (
            <div className="empty-preparations">
              <span className="empty-text">暂无前置准备项，点击上方按钮添加</span>
            </div>
          ) : (
            <div className="preparations-list">
              {formData.preparations.map((prep, index) => (
                <div key={prep.id} className="preparation-item">
                  <div className="preparation-number">{index + 1}</div>
                  <div className="preparation-fields">
                    <input
                      type="text"
                      className="prep-name-input"
                      placeholder="准备项名称，如：注册 ChatGPT 账号"
                      value={prep.name}
                      onChange={(e) => handleUpdatePreparation(index, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      className="prep-desc-input"
                      placeholder="简要说明（可选）"
                      value={prep.description}
                      onChange={(e) => handleUpdatePreparation(index, 'description', e.target.value)}
                    />
                    <input
                      type="text"
                      className="prep-link-input"
                      placeholder="相关链接（可选），如：https://chat.openai.com"
                      value={prep.link}
                      onChange={(e) => handleUpdatePreparation(index, 'link', e.target.value)}
                    />
                  </div>
                  <button
                    className="remove-prep-btn"
                    onClick={() => handleRemovePreparation(index)}
                    title="删除准备项"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
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

                {/* 步骤说明 */}
                <div className="step-content">
                  <label className="content-label">步骤说明 <span className="optional-hint">(可选)</span></label>
                  <textarea
                    className="step-description-textarea"
                    placeholder="简要描述这一步要做什么，让用户快速了解..."
                    rows={2}
                    value={step.description}
                    onChange={(e) => handleUpdateStep(index, 'description', e.target.value)}
                  />
                </div>

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

                {/* 使用的工具/平台 */}
                <div className="tools-section">
                  <div className="section-header-with-action">
                    <label className="content-label">使用的工具/平台</label>
                    <button
                      type="button"
                      className="add-item-btn"
                      onClick={() => {
                        const newTool: StepTool = {
                          id: `tool_${Date.now()}_${Math.random()}`,
                          name: '',
                          url: '',
                          description: ''
                        }
                        handleUpdateStep(index, 'tools', [...step.tools, newTool])
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      添加工具
                    </button>
                  </div>

                  {step.tools.length === 0 ? (
                    <div className="empty-list-hint">
                      <span>暂无工具，点击上方按钮添加（如：ChatGPT、Notion、Canva 等）</span>
                    </div>
                  ) : (
                    <div className="tools-list">
                      {step.tools.map((tool, toolIdx) => (
                        <div key={tool.id} className="tool-item">
                          <div className="tool-item-fields">
                            <input
                              type="text"
                              className="tool-name-input"
                              placeholder="工具名称（如：ChatGPT）"
                              value={tool.name}
                              onChange={(e) => {
                                const newTools = [...step.tools]
                                newTools[toolIdx] = { ...newTools[toolIdx], name: e.target.value }
                                handleUpdateStep(index, 'tools', newTools)
                              }}
                            />
                            <input
                              type="text"
                              className="tool-url-input"
                              placeholder="链接（可选，如：https://chat.openai.com）"
                              value={tool.url}
                              onChange={(e) => {
                                const newTools = [...step.tools]
                                newTools[toolIdx] = { ...newTools[toolIdx], url: e.target.value }
                                handleUpdateStep(index, 'tools', newTools)
                              }}
                            />
                            <input
                              type="text"
                              className="tool-desc-input"
                              placeholder="简要说明（可选，如：用于生成文案初稿）"
                              value={tool.description}
                              onChange={(e) => {
                                const newTools = [...step.tools]
                                newTools[toolIdx] = { ...newTools[toolIdx], description: e.target.value }
                                handleUpdateStep(index, 'tools', newTools)
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            className="remove-item-btn"
                            onClick={() => {
                              const newTools = step.tools.filter((_, i) => i !== toolIdx)
                              handleUpdateStep(index, 'tools', newTools)
                            }}
                            title="删除工具"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 演示媒体（图片/视频） */}
                <div className="demonstration-section">
                  <div className="section-header-with-action">
                    <label className="content-label">演示媒体 <span className="optional-hint">(可选)</span></label>
                    <button
                      type="button"
                      className="add-item-btn"
                      onClick={() => {
                        const newMedia: DemonstrationMedia = {
                          id: `media_${Date.now()}_${Math.random()}`,
                          type: 'image',
                          url: '',
                          caption: ''
                        }
                        handleUpdateStep(index, 'demonstrationMedia', [...step.demonstrationMedia, newMedia])
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      添加图片/视频
                    </button>
                  </div>

                  {step.demonstrationMedia.length === 0 ? (
                    <div className="empty-list-hint">
                      <span>添加截图或视频链接，帮助用户理解操作步骤</span>
                    </div>
                  ) : (
                    <div className="media-list">
                      {step.demonstrationMedia.map((media, mediaIdx) => (
                        <div key={media.id} className="media-item">
                          <div className="media-item-fields">
                            <select
                              className="media-type-select"
                              value={media.type}
                              onChange={(e) => {
                                const newMedia = [...step.demonstrationMedia]
                                newMedia[mediaIdx] = { ...newMedia[mediaIdx], type: e.target.value as 'image' | 'video' }
                                handleUpdateStep(index, 'demonstrationMedia', newMedia)
                              }}
                            >
                              <option value="image">图片</option>
                              <option value="video">视频</option>
                            </select>
                            <input
                              type="text"
                              className="media-url-input"
                              placeholder="图片/视频 URL"
                              value={media.url}
                              onChange={(e) => {
                                const newMedia = [...step.demonstrationMedia]
                                newMedia[mediaIdx] = { ...newMedia[mediaIdx], url: e.target.value }
                                handleUpdateStep(index, 'demonstrationMedia', newMedia)
                              }}
                            />
                            <input
                              type="text"
                              className="media-caption-input"
                              placeholder="说明文字（可选）"
                              value={media.caption}
                              onChange={(e) => {
                                const newMedia = [...step.demonstrationMedia]
                                newMedia[mediaIdx] = { ...newMedia[mediaIdx], caption: e.target.value }
                                handleUpdateStep(index, 'demonstrationMedia', newMedia)
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            className="remove-item-btn"
                            onClick={() => {
                              const newMedia = step.demonstrationMedia.filter((_, i) => i !== mediaIdx)
                              handleUpdateStep(index, 'demonstrationMedia', newMedia)
                            }}
                            title="删除媒体"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 相关资源 */}
                <div className="resources-section">
                  <div className="section-header-with-action">
                    <label className="content-label">相关资源 <span className="optional-hint">(可选)</span></label>
                    <button
                      type="button"
                      className="add-item-btn"
                      onClick={() => {
                        const newResource: RelatedResource = {
                          id: `resource_${Date.now()}_${Math.random()}`,
                          title: '',
                          type: 'link',
                          url: '',
                          description: ''
                        }
                        handleUpdateStep(index, 'relatedResources', [...step.relatedResources, newResource])
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      添加资源
                    </button>
                  </div>

                  {step.relatedResources.length === 0 ? (
                    <div className="empty-list-hint">
                      <span>添加相关文档、教程链接等辅助资源</span>
                    </div>
                  ) : (
                    <div className="resources-list">
                      {step.relatedResources.map((resource, resourceIdx) => (
                        <div key={resource.id} className="resource-item">
                          <div className="resource-item-fields">
                            <select
                              className="resource-type-select"
                              value={resource.type}
                              onChange={(e) => {
                                const newResources = [...step.relatedResources]
                                newResources[resourceIdx] = { ...newResources[resourceIdx], type: e.target.value as 'link' | 'file' }
                                handleUpdateStep(index, 'relatedResources', newResources)
                              }}
                            >
                              <option value="link">链接</option>
                              <option value="file">文件</option>
                            </select>
                            <input
                              type="text"
                              className="resource-title-input"
                              placeholder="资源名称"
                              value={resource.title}
                              onChange={(e) => {
                                const newResources = [...step.relatedResources]
                                newResources[resourceIdx] = { ...newResources[resourceIdx], title: e.target.value }
                                handleUpdateStep(index, 'relatedResources', newResources)
                              }}
                            />
                            <input
                              type="text"
                              className="resource-url-input"
                              placeholder="资源链接"
                              value={resource.url}
                              onChange={(e) => {
                                const newResources = [...step.relatedResources]
                                newResources[resourceIdx] = { ...newResources[resourceIdx], url: e.target.value }
                                handleUpdateStep(index, 'relatedResources', newResources)
                              }}
                            />
                            <input
                              type="text"
                              className="resource-desc-input"
                              placeholder="简要说明（可选）"
                              value={resource.description}
                              onChange={(e) => {
                                const newResources = [...step.relatedResources]
                                newResources[resourceIdx] = { ...newResources[resourceIdx], description: e.target.value }
                                handleUpdateStep(index, 'relatedResources', newResources)
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            className="remove-item-btn"
                            onClick={() => {
                              const newResources = step.relatedResources.filter((_, i) => i !== resourceIdx)
                              handleUpdateStep(index, 'relatedResources', newResources)
                            }}
                            title="删除资源"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 预期结果 */}
                <div className="step-content">
                  <label className="content-label">预期结果 <span className="optional-hint">(可选)</span></label>
                  <textarea
                    className="expected-result-textarea"
                    placeholder="完成这一步后，用户应该得到什么结果？"
                    rows={2}
                    value={step.expectedResult}
                    onChange={(e) => handleUpdateStep(index, 'expectedResult', e.target.value)}
                  />
                </div>

                {/* 步骤高级设置（可收缩） */}
                <div className="step-advanced-settings">
                  <button
                    type="button"
                    className="step-advanced-toggle"
                    onClick={() => toggleStepAdvanced(step.id)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ transform: expandedAdvanced.has(step.id) ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    <span>高级设置</span>
                    {(step.associatedSolutions.length > 0 || step.associatedThemes.length > 0) && (
                      <span className="step-advanced-badge">
                        {step.associatedSolutions.length + step.associatedThemes.length}
                      </span>
                    )}
                  </button>

                  {expandedAdvanced.has(step.id) && (
                    <div className="step-advanced-content">
                      {/* 关联到工作包 */}
                      <div className="form-field">
                        <label className="field-label">关联到工作包</label>
                        <div className="multi-select-dropdown">
                          <div
                            className="multi-select-trigger"
                            onClick={() => setOpenDropdown(openDropdown === `${step.id}_solution` ? null : `${step.id}_solution`)}
                          >
                            <span className="selected-text">
                              {step.associatedSolutions.length === 0
                                ? '选择工作包...'
                                : `已选择 ${step.associatedSolutions.length} 个`}
                            </span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                              style={{ transform: openDropdown === `${step.id}_solution` ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </div>
                          {openDropdown === `${step.id}_solution` && (
                            <div className="multi-select-options">
                              {popularWorkPackages.map((pkg) => (
                                <label key={pkg.id} className="multi-select-option">
                                  <input
                                    type="checkbox"
                                    checked={step.associatedSolutions.includes(pkg.id)}
                                    onChange={(e) => {
                                      const newSolutions = e.target.checked
                                        ? [...step.associatedSolutions, pkg.id]
                                        : step.associatedSolutions.filter(id => id !== pkg.id)
                                      handleUpdateStep(index, 'associatedSolutions', newSolutions)
                                    }}
                                  />
                                  <span className="option-icon">{pkg.icon}</span>
                                  <span className="option-name">{pkg.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                        {step.associatedSolutions.length > 0 && (
                          <div className="selected-tags">
                            {step.associatedSolutions.map(id => {
                              const pkg = popularWorkPackages.find(p => p.id === id)
                              return pkg ? (
                                <span key={id} className="selected-tag selected-tag-sm">
                                  <span className="tag-icon">{pkg.icon}</span>
                                  <span className="tag-text">{pkg.name}</span>
                                  <button
                                    type="button"
                                    className="tag-remove-btn"
                                    onClick={() => handleUpdateStep(index, 'associatedSolutions', step.associatedSolutions.filter(sid => sid !== id))}
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
                        <label className="field-label">关联到主题</label>
                        <div className="multi-select-dropdown">
                          <div
                            className="multi-select-trigger"
                            onClick={() => setOpenDropdown(openDropdown === `${step.id}_theme` ? null : `${step.id}_theme`)}
                          >
                            <span className="selected-text">
                              {step.associatedThemes.length === 0
                                ? '选择主题...'
                                : `已选择 ${step.associatedThemes.length} 个`}
                            </span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                              style={{ transform: openDropdown === `${step.id}_theme` ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </div>
                          {openDropdown === `${step.id}_theme` && (
                            <div className="multi-select-options">
                              {exploreThemes.map((theme) => (
                                <label key={theme.id} className="multi-select-option">
                                  <input
                                    type="checkbox"
                                    checked={step.associatedThemes.includes(theme.id)}
                                    onChange={(e) => {
                                      const newThemes = e.target.checked
                                        ? [...step.associatedThemes, theme.id]
                                        : step.associatedThemes.filter(id => id !== theme.id)
                                      handleUpdateStep(index, 'associatedThemes', newThemes)
                                    }}
                                  />
                                  <span className="option-icon">{theme.icon}</span>
                                  <span className="option-name">{theme.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                        {step.associatedThemes.length > 0 && (
                          <div className="selected-tags">
                            {step.associatedThemes.map(id => {
                              const theme = exploreThemes.find(t => t.id === id)
                              return theme ? (
                                <span key={id} className="selected-tag selected-tag-sm">
                                  <span className="tag-icon">{theme.icon}</span>
                                  <span className="tag-text">{theme.name}</span>
                                  <button
                                    type="button"
                                    className="tag-remove-btn"
                                    onClick={() => handleUpdateStep(index, 'associatedThemes', step.associatedThemes.filter(tid => tid !== id))}
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
