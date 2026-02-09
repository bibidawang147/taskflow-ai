import { useState, useEffect, useRef } from 'react'
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

// 提示词资源
interface PromptResource {
  id: string
  title: string
  content: string
}

// 文档资源
interface DocumentResource {
  id: string
  name: string
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
  promptResources: PromptResource[]  // 提示词资源
  demonstrationMedia: DemonstrationMedia[]  // 演示媒体（图片/视频）
  relatedResources: RelatedResource[]  // 相关资源
  documentResources: DocumentResource[]  // 文档资源
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

// 场景分类（一级Tab -> 二级胶囊标签）
const SCENARIO_CATEGORIES = [
  {
    id: 'content',
    name: '内容创作',
    children: [
      { id: 'xiaohongshu', name: '小红书' },
      { id: 'douyin', name: '抖音' },
      { id: 'gongzhonghao', name: '公众号' },
      { id: 'shipinhao', name: '视频号' },
      { id: 'bilibili', name: 'B站' },
      { id: 'weibo', name: '微博' },
      { id: 'content-other', name: '其他' },
    ]
  },
  {
    id: 'video',
    name: '视频制作',
    children: [
      { id: 'video-short', name: '短视频' },
      { id: 'video-vlog', name: 'Vlog' },
      { id: 'video-tutorial', name: '教程' },
      { id: 'video-ad', name: '广告片' },
      { id: 'video-other', name: '其他' },
    ]
  },
  {
    id: 'data',
    name: '数据分析',
    children: [
      { id: 'data-report', name: '报表' },
      { id: 'data-visualization', name: '可视化' },
      { id: 'data-prediction', name: '预测' },
      { id: 'data-cleaning', name: '数据清洗' },
      { id: 'data-other', name: '其他' },
    ]
  },
  {
    id: 'design',
    name: '图文设计',
    children: [
      { id: 'design-poster', name: '海报' },
      { id: 'design-banner', name: 'Banner' },
      { id: 'design-logo', name: 'Logo' },
      { id: 'design-ppt', name: 'PPT' },
      { id: 'design-other', name: '其他' },
    ]
  },
  {
    id: 'efficiency',
    name: '效率工具',
    children: [
      { id: 'eff-doc', name: '文档处理' },
      { id: 'eff-translate', name: '翻译' },
      { id: 'eff-meeting', name: '会议纪要' },
      { id: 'eff-code', name: '代码开发' },
      { id: 'eff-other', name: '其他' },
    ]
  },
  {
    id: 'monetize',
    name: '变现专区',
    children: [
      { id: 'mon-ecommerce', name: '电商' },
      { id: 'mon-affiliate', name: '带货' },
      { id: 'mon-course', name: '课程' },
      { id: 'mon-consulting', name: '咨询' },
      { id: 'mon-other', name: '其他' },
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
      promptResources: [],
      demonstrationMedia: [],
      relatedResources: [],
      documentResources: [],
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
  // 场景选择：当前选中的大类（默认选中"内容创作"）
  const [selectedCategory, setSelectedCategory] = useState<string | null>('content')
  // 文章快速转 Popover 状态
  const [showArticlePopover, setShowArticlePopover] = useState(false)
  const [articleInput, setArticleInput] = useState('')
  const [convertingArticle, setConvertingArticle] = useState(false)
  const articlePopoverRef = useRef<HTMLDivElement>(null)
  const articleBtnRef = useRef<HTMLButtonElement>(null)

  // 资源卡片展开状态管理 - 格式: stepId_resourceType (tool/prompt/media/document)
  const [expandedResourceCards, setExpandedResourceCards] = useState<Set<string>>(new Set())

  // 正在编辑的新建资源临时数据 - 格式: stepId_resourceType
  const [newResourceData, setNewResourceData] = useState<Record<string, any>>({})

  // 切换资源卡片展开状态
  const toggleResourceCard = (stepId: string, resourceType: 'tool' | 'prompt' | 'media' | 'document') => {
    const key = `${stepId}_${resourceType}`
    setExpandedResourceCards(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        // 关闭时清除临时数据
        setNewResourceData(prevData => {
          const { [key]: _, ...rest } = prevData
          return rest
        })
      } else {
        next.add(key)
        // 展开时初始化临时数据
        setNewResourceData(prevData => ({
          ...prevData,
          [key]: getInitialResourceData(resourceType)
        }))
      }
      return next
    })
  }

  // 获取初始资源数据
  const getInitialResourceData = (resourceType: string) => {
    switch (resourceType) {
      case 'tool':
        return { name: '', url: '', description: '' }
      case 'prompt':
        return { title: '', content: '' }
      case 'media':
        return { type: 'image', url: '', caption: '' }
      case 'document':
        return { name: '', url: '', description: '' }
      default:
        return {}
    }
  }

  // 更新新建资源的临时数据
  const updateNewResourceData = (stepId: string, resourceType: string, field: string, value: any) => {
    const key = `${stepId}_${resourceType}`
    setNewResourceData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }))
  }

  // 确认添加资源
  const confirmAddResource = (stepIndex: number, stepId: string, resourceType: 'tool' | 'prompt' | 'media' | 'document') => {
    const key = `${stepId}_${resourceType}`
    const data = newResourceData[key]

    if (!data) return

    // 验证必填字段
    if (resourceType === 'tool' && !data.name.trim()) {
      alert('请输入工具名称')
      return
    }
    if (resourceType === 'prompt' && !data.title.trim()) {
      alert('请输入提示词标题')
      return
    }
    if (resourceType === 'media' && !data.url.trim()) {
      alert('请输入媒体链接')
      return
    }
    if (resourceType === 'document' && !data.name.trim()) {
      alert('请输入文档名称')
      return
    }

    // 添加到对应的资源列表
    const newSteps = [...formData.steps]
    const newResource = {
      id: `${resourceType}_${Date.now()}_${Math.random()}`,
      ...data
    }

    if (resourceType === 'tool') {
      newSteps[stepIndex].tools = [...newSteps[stepIndex].tools, newResource]
    } else if (resourceType === 'prompt') {
      newSteps[stepIndex].promptResources = [...newSteps[stepIndex].promptResources, newResource]
    } else if (resourceType === 'media') {
      newSteps[stepIndex].demonstrationMedia = [...newSteps[stepIndex].demonstrationMedia, newResource]
    } else if (resourceType === 'document') {
      newSteps[stepIndex].documentResources = [...newSteps[stepIndex].documentResources, newResource]
    }

    setFormData({ ...formData, steps: newSteps })

    // 关闭卡片
    setExpandedResourceCards(prev => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })

    // 清除临时数据
    setNewResourceData(prevData => {
      const { [key]: _, ...rest } = prevData
      return rest
    })
  }

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

  // 点击外部关闭文章快速转 Popover
  useEffect(() => {
    const handlePopoverClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (
        articlePopoverRef.current && !articlePopoverRef.current.contains(target) &&
        articleBtnRef.current && !articleBtnRef.current.contains(target)
      ) {
        setShowArticlePopover(false)
      }
    }

    if (showArticlePopover) {
      document.addEventListener('mousedown', handlePopoverClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handlePopoverClickOutside)
    }
  }, [showArticlePopover])

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
        // 加载工具列表
        tools: (node.config?.tools || []).map((t: any, idx: number) => ({
          id: `tool_${Date.now()}_${idx}`,
          name: t.name || '',
          url: t.url || '',
          description: t.description || ''
        })),
        // 加载提示词资源
        promptResources: (node.config?.promptResources || []).map((p: any, idx: number) => ({
          id: `prompt_${Date.now()}_${idx}`,
          title: p.title || '',
          content: p.content || ''
        })),
        // 加载演示媒体
        demonstrationMedia: (node.config?.demonstrationMedia || []).map((m: any, idx: number) => ({
          id: `media_${Date.now()}_${idx}`,
          type: m.type || 'image',
          url: m.url || '',
          caption: m.caption || ''
        })),
        // 加载相关资源
        relatedResources: (node.config?.relatedResources || []).map((r: any, idx: number) => ({
          id: `resource_${Date.now()}_${idx}`,
          title: r.title || '',
          type: r.type || 'link',
          url: r.url || '',
          description: r.description || ''
        })),
        // 加载文档资源
        documentResources: (node.config?.documentResources || []).map((d: any, idx: number) => ({
          id: `doc_${Date.now()}_${idx}`,
          name: d.name || '',
          url: d.url || '',
          description: d.description || ''
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

  // 文章快速转 - 一键转换
  const handleArticleConvert = async () => {
    if (!articleInput.trim()) return

    setConvertingArticle(true)
    try {
      const isUrl = /^https?:\/\//.test(articleInput.trim())
      const prompt = `你是一个专业的 AI 工作流编辑专家。请根据以下${isUrl ? '文章链接对应的内容' : '文章内容'}，将其拆解为一个结构化的 AI 工作流。

${isUrl ? '文章链接：' : '文章内容：'}
${articleInput.trim()}

请严格按照以下 JSON 格式输出，不要有任何多余的文字或解释：
{
  "title": "工作流标题",
  "description": "一句话介绍（50-100字）",
  "steps": [
    {
      "title": "步骤标题",
      "description": "步骤说明",
      "prompt": "给 AI 的提示词内容"
    }
  ]
}

要求：
1. 标题简洁明了，体现核心价值
2. 步骤数量 2-6 个，每步骤有明确的目标
3. prompt 要具体可执行，不要太笼统
4. 直接输出 JSON，不要包裹在代码块中`

      const response = await chatWithAI({
        provider: 'doubao',
        model: 'doubao-1-5-pro-32k-250115',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        maxTokens: 3000
      })

      if (response.success && response.data.content) {
        const content = response.data.content.trim()
        // 尝试提取 JSON（可能被包裹在 ```json ``` 中）
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])

          const newSteps: WorkflowStep[] = (parsed.steps || []).map((s: any, idx: number) => ({
            id: `step_${Date.now()}_${idx}`,
            title: s.title || '',
            description: s.description || '',
            prompt: s.prompt || '',
            expectedResult: '',
            model: { brand: 'OpenAI', name: 'GPT-4', url: '' },
            alternativeModels: [],
            advancedSettings: { temperature: 0.7, maxTokens: 2000 },
            showAdvanced: false,
            tools: [],
            demonstrationMedia: [],
            relatedResources: [],
            associatedSolutions: [],
            associatedThemes: []
          }))

          setFormData({
            ...formData,
            title: parsed.title || formData.title,
            description: parsed.description || formData.description,
            steps: newSteps.length > 0 ? newSteps : formData.steps
          })

          setIsFromArticle(true)
          setSourceContent(articleInput.trim())
          setShowArticlePopover(false)
          setArticleInput('')
        } else {
          alert('AI 返回格式异常，请重试')
        }
      } else {
        alert('转换失败，请重试')
      }
    } catch (error: any) {
      console.error('文章转换失败:', error)
      alert(error.message || '转换失败，请重试')
    } finally {
      setConvertingArticle(false)
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
      promptResources: [],
      demonstrationMedia: [],
      relatedResources: [],
      documentResources: [],
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
              // 工具列表
              tools: step.tools.filter(t => t.name.trim()).map(t => ({
                name: t.name,
                url: t.url,
                description: t.description
              })),
              // 提示词资源
              promptResources: step.promptResources.filter(p => p.title.trim()).map(p => ({
                title: p.title,
                content: p.content
              })),
              // 演示媒体
              demonstrationMedia: step.demonstrationMedia.filter(m => m.url.trim()).map(m => ({
                type: m.type,
                url: m.url,
                caption: m.caption
              })),
              // 相关资源
              relatedResources: step.relatedResources.filter(r => r.title.trim() || r.url.trim()).map(r => ({
                title: r.title,
                type: r.type,
                url: r.url,
                description: r.description
              })),
              // 文档资源
              documentResources: step.documentResources.filter(d => d.name.trim()).map(d => ({
                name: d.name,
                url: d.url,
                description: d.description
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
          <div className="title-row">
            <input
              type="text"
              className={`title-input ${errors.title ? 'error' : ''}`}
              placeholder="输入工作流标题，例如：AI辅助创作小红书爆款种草文案"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <div className="article-convert-wrapper">
              <button
                ref={articleBtnRef}
                type="button"
                className={`article-convert-btn ${showArticlePopover ? 'active' : ''}`}
                onClick={() => setShowArticlePopover(!showArticlePopover)}
              >
                <FileText size={15} />
                <span>文章快速转</span>
              </button>
              {showArticlePopover && (
                <div ref={articlePopoverRef} className="article-popover">
                  <h4 className="article-popover-title">输入文章链接/直接粘贴文字内容</h4>
                  <textarea
                    className="article-popover-textarea"
                    placeholder="粘贴文章链接或直接粘贴文字内容..."
                    value={articleInput}
                    onChange={(e) => setArticleInput(e.target.value)}
                    autoFocus
                  />
                  <div className="article-popover-actions">
                    <button
                      type="button"
                      className="article-popover-cancel"
                      onClick={() => {
                        setShowArticlePopover(false)
                        setArticleInput('')
                      }}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      className={`article-popover-submit ${articleInput.trim() ? 'enabled' : ''}`}
                      disabled={!articleInput.trim() || convertingArticle}
                      onClick={handleArticleConvert}
                    >
                      {convertingArticle ? (
                        <>
                          <span className="ai-loading-spinner"></span>
                          转换中...
                        </>
                      ) : (
                        '一键转换'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {errors.title && <div className="error-message">{errors.title}</div>}
          <div className="title-divider" />
        </div>

        {/* 基本信息区域 */}
        <div className="info-card">
          <h2 className="card-title">基本信息</h2>

          <div className="form-field">
            <div className="field-label-with-action">
              <label className="field-label">一句话介绍</label>
              <button
                type="button"
                className="ai-generate-btn"
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
                    <span className="ai-sparkle">✨</span>
                    AI 生成
                  </>
                )}
              </button>
            </div>
            <textarea
              className="field-textarea"
              placeholder="描述这个工作流的用途和特点...（可点击右上方 AI 生成按钮自动生成）"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* 选择类型 & 选择标签 - 同一行布局 */}
          <div className="type-and-tags-row">
            {/* 左侧：选择类型 */}
            <div className="form-field type-field">
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

            {/* 右侧：选择标签 */}
            <div className="form-field tags-field">
              <label className="field-label">选择标签</label>
              {/* 一级标签 - Tab导航 */}
              <div className="tag-tabs">
                {SCENARIO_CATEGORIES.map((cat) => {
                  const hasSelected = cat.children.some(c => formData.useScenarios.includes(c.id))
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`tag-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name}
                      {hasSelected && <span className="tag-tab-dot" />}
                    </button>
                  )
                })}
              </div>
              {/* 二级标签 - 胶囊标签 */}
              {selectedCategory && (
                <div className="tag-capsules">
                  {SCENARIO_CATEGORIES
                    .find(cat => cat.id === selectedCategory)
                    ?.children.map((child) => {
                      const isSelected = formData.useScenarios.includes(child.id)
                      return (
                        <button
                          key={child.id}
                          type="button"
                          className={`tag-capsule ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            if (isSelected) {
                              setFormData({ ...formData, useScenarios: formData.useScenarios.filter(s => s !== child.id) })
                            } else {
                              setFormData({ ...formData, useScenarios: [...formData.useScenarios, child.id] })
                            }
                          }}
                        >
                          {child.name}
                          {isSelected && <span className="capsule-check">✓</span>}
                        </button>
                      )
                    })
                  }
                </div>
              )}
              {/* 已选标签展示区 */}
              {formData.useScenarios.length > 0 && (
                <div className="selected-scenarios-area">
                  <div className="selected-scenarios-divider" />
                  <div className="selected-scenarios-list">
                    {formData.useScenarios.map((scenarioId) => {
                      let label = scenarioId
                      for (const cat of SCENARIO_CATEGORIES) {
                        const found = cat.children.find(c => c.id === scenarioId)
                        if (found) { label = found.name; break }
                      }
                      return (
                        <span key={scenarioId} className="selected-scenario-tag">
                          <span className="selected-scenario-icon">📝</span>
                          <span className="selected-scenario-name">{label}</span>
                          <button
                            type="button"
                            className="selected-scenario-remove"
                            onClick={() => setFormData({ ...formData, useScenarios: formData.useScenarios.filter(s => s !== scenarioId) })}
                          >
                            ×
                          </button>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 前置准备区域 */}
        <div className="info-card preparations-card">
          <div className="card-header-with-action">
            <div>
              <h2 className="card-title">前置准备</h2>
              <p className="card-subtitle-hint">在开始工作流之前，用户需要准备什么？</p>
            </div>
            <button className="add-btn-small" onClick={handleAddPreparation}>
              + 添加准备项
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

                {/* 步骤头部 - 标题行 */}
                <div className="step-header">
                  <div className="step-number">{index + 1}</div>
                  <input
                    type="text"
                    className={`step-title-input ${errors[`step_${index}_title`] ? 'error' : ''}`}
                    placeholder="输入步骤标题..."
                    value={step.title}
                    onChange={(e) => handleUpdateStep(index, 'title', e.target.value)}
                  />
                </div>
                {errors[`step_${index}_title`] && (
                  <div className="error-message">{errors[`step_${index}_title`]}</div>
                )}

                {/* 资源区 */}
                <div className="resource-area">
                  <div className="resource-area-header">
                    <span className="resource-area-label">资源区</span>
                    <div className="resource-add-buttons">
                      <button
                        type="button"
                        className="resource-add-btn"
                        onClick={() => toggleResourceCard(step.id, 'tool')}
                      >
                        + 添加工具
                      </button>
                      <button
                        type="button"
                        className="resource-add-btn"
                        onClick={() => toggleResourceCard(step.id, 'prompt')}
                      >
                        + 添加提示词
                      </button>
                      <button
                        type="button"
                        className="resource-add-btn"
                        onClick={() => toggleResourceCard(step.id, 'media')}
                      >
                        + 添加媒体
                      </button>
                      <button
                        type="button"
                        className="resource-add-btn"
                        onClick={() => toggleResourceCard(step.id, 'document')}
                      >
                        + 添加文档
                      </button>
                    </div>
                  </div>

                  {/* 资源卡片容器 */}
                  <div className="resource-cards">
                    {/* 新建工具卡片 */}
                    {expandedResourceCards.has(`${step.id}_tool`) && (
                      <div className="new-resource-card">
                        <div className="new-resource-card-header">
                          <div className="new-resource-card-title">
                            <span className="resource-icon">🔧</span>
                            <span>新建工具</span>
                          </div>
                          <button
                            type="button"
                            className="confirm-resource-btn"
                            onClick={() => confirmAddResource(index, step.id, 'tool')}
                            disabled={!newResourceData[`${step.id}_tool`]?.name?.trim()}
                          >
                            ✓
                          </button>
                        </div>
                        <div className="resource-form-fields">
                          <input
                            type="text"
                            className="resource-form-input"
                            placeholder="工具名称（如：ChatGPT）"
                            value={newResourceData[`${step.id}_tool`]?.name || ''}
                            onChange={(e) => updateNewResourceData(step.id, 'tool', 'name', e.target.value)}
                          />
                          <input
                            type="text"
                            className="resource-form-input"
                            placeholder="链接（可选）"
                            value={newResourceData[`${step.id}_tool`]?.url || ''}
                            onChange={(e) => updateNewResourceData(step.id, 'tool', 'url', e.target.value)}
                          />
                          <input
                            type="text"
                            className="resource-form-input"
                            placeholder="简要说明（可选）"
                            value={newResourceData[`${step.id}_tool`]?.description || ''}
                            onChange={(e) => updateNewResourceData(step.id, 'tool', 'description', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* 新建提示词卡片 */}
                    {expandedResourceCards.has(`${step.id}_prompt`) && (
                      <div className="new-resource-card">
                        <div className="new-resource-card-header">
                          <div className="new-resource-card-title">
                            <span className="resource-icon">💬</span>
                            <span>新建提示词</span>
                          </div>
                          <button
                            type="button"
                            className="confirm-resource-btn"
                            onClick={() => confirmAddResource(index, step.id, 'prompt')}
                            disabled={!newResourceData[`${step.id}_prompt`]?.title?.trim()}
                          >
                            ✓
                          </button>
                        </div>
                        <div className="resource-form-fields">
                          <input
                            type="text"
                            className="resource-form-input"
                            placeholder="提示词标题"
                            value={newResourceData[`${step.id}_prompt`]?.title || ''}
                            onChange={(e) => updateNewResourceData(step.id, 'prompt', 'title', e.target.value)}
                          />
                          <textarea
                            className="resource-form-textarea"
                            placeholder="输入提示词内容..."
                            value={newResourceData[`${step.id}_prompt`]?.content || ''}
                            onChange={(e) => updateNewResourceData(step.id, 'prompt', 'content', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* 新建媒体卡片 */}
                    {expandedResourceCards.has(`${step.id}_media`) && (
                      <div className="new-resource-card">
                        <div className="new-resource-card-header">
                          <div className="new-resource-card-title">
                            <span className="resource-icon">▶️</span>
                            <span>新建媒体</span>
                          </div>
                          <button
                            type="button"
                            className="confirm-resource-btn"
                            onClick={() => confirmAddResource(index, step.id, 'media')}
                            disabled={!newResourceData[`${step.id}_media`]?.url?.trim()}
                          >
                            ✓
                          </button>
                        </div>
                        <div className="resource-form-fields">
                          <div className="file-upload-area">
                            <span className="file-upload-icon">⬆</span>
                            <span className="file-upload-text">点击上传图片或视频</span>
                          </div>
                          <div className="resource-divider">
                            <span className="resource-divider-text">或输入链接</span>
                          </div>
                          <div className="link-input-row">
                            <select
                              className="media-type-select"
                              value={newResourceData[`${step.id}_media`]?.type || 'image'}
                              onChange={(e) => updateNewResourceData(step.id, 'media', 'type', e.target.value)}
                            >
                              <option value="image">图片</option>
                              <option value="video">视频</option>
                            </select>
                            <input
                              type="text"
                              className="resource-form-input"
                              placeholder="粘贴图片/视频 URL"
                              value={newResourceData[`${step.id}_media`]?.url || ''}
                              onChange={(e) => updateNewResourceData(step.id, 'media', 'url', e.target.value)}
                            />
                          </div>
                          <input
                            type="text"
                            className="resource-form-input"
                            placeholder="说明文字（可选）"
                            value={newResourceData[`${step.id}_media`]?.caption || ''}
                            onChange={(e) => updateNewResourceData(step.id, 'media', 'caption', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* 新建文档卡片 */}
                    {expandedResourceCards.has(`${step.id}_document`) && (
                      <div className="new-resource-card">
                        <div className="new-resource-card-header">
                          <div className="new-resource-card-title">
                            <span className="resource-icon">🔗</span>
                            <span>新建文档</span>
                          </div>
                          <button
                            type="button"
                            className="confirm-resource-btn"
                            onClick={() => confirmAddResource(index, step.id, 'document')}
                            disabled={!newResourceData[`${step.id}_document`]?.name?.trim()}
                          >
                            ✓
                          </button>
                        </div>
                        <div className="resource-form-fields">
                          <div className="file-upload-area">
                            <span className="file-upload-icon">📄</span>
                            <span className="file-upload-text">点击上传文档 (PDF、Word、Excel、PPT等)</span>
                          </div>
                          <div className="resource-divider">
                            <span className="resource-divider-text">或输入链接</span>
                          </div>
                          <input
                            type="text"
                            className="resource-form-input"
                            placeholder="文档名称"
                            value={newResourceData[`${step.id}_document`]?.name || ''}
                            onChange={(e) => updateNewResourceData(step.id, 'document', 'name', e.target.value)}
                          />
                          <input
                            type="text"
                            className="resource-form-input"
                            placeholder="文档链接 (可粘贴网盘链接等)"
                            value={newResourceData[`${step.id}_document`]?.url || ''}
                            onChange={(e) => updateNewResourceData(step.id, 'document', 'url', e.target.value)}
                          />
                          <input
                            type="text"
                            className="resource-form-input"
                            placeholder="简要说明（可选）"
                            value={newResourceData[`${step.id}_document`]?.description || ''}
                            onChange={(e) => updateNewResourceData(step.id, 'document', 'description', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* 已添加的资源列表展示 */}
                    {step.tools.length > 0 && step.tools.map((tool) => (
                      <div key={tool.id} className="added-resource-item">
                        🔧 {tool.name}
                        {tool.url && ` (${tool.url})`}
                        {tool.description && ` - ${tool.description}`}
                      </div>
                    ))}
                    {step.promptResources.length > 0 && step.promptResources.map((prompt) => (
                      <div key={prompt.id} className="added-resource-item">
                        💬 {prompt.title}
                      </div>
                    ))}
                    {step.demonstrationMedia.length > 0 && step.demonstrationMedia.map((media) => (
                      <div key={media.id} className="added-resource-item">
                        ▶️ {media.type === 'image' ? '图片' : '视频'}: {media.url}
                      </div>
                    ))}
                    {step.documentResources.length > 0 && step.documentResources.map((doc) => (
                      <div key={doc.id} className="added-resource-item">
                        🔗 {doc.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 步骤说明 */}
                <div className="step-description-section">
                  <div className="step-description-header">
                    <label className="content-label">
                      步骤说明 <span className="optional-hint">(可选，可拖拽资源卡片到此处)</span>
                    </label>
                    <button type="button" className="save-step-btn">
                      ✓ 保存
                    </button>
                  </div>
                  <textarea
                    className="step-description-textarea"
                    placeholder="简要描述这一步要做什么，让用户快速了解...（可从上方拖拽资源卡片插入引用）"
                    rows={3}
                    value={step.description}
                    onChange={(e) => handleUpdateStep(index, 'description', e.target.value)}
                  />
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
