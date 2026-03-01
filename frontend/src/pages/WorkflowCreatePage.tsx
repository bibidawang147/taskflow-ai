import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { FileText, ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { createWorkflow, updateWorkflow, getWorkflowDetail } from '../services/workflowApi'
import { chatWithAI } from '../services/aiApi'
import { api, API_BASE_URL } from '../services/api'
import { popularWorkPackages } from '../data/popularWorkPackages'
import { exploreThemes } from '../data/exploreThemes'
import { useToast } from '../components/ui/Toast'
import { useConfirm } from '../components/ui/ConfirmDialog'
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
  expectedResultAttachments: Array<{ id: string; type: 'image' | 'file'; url: string; name: string }>
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

// AI 内部生成用模型配置（描述生成、文章转换等内部功能）
const INTERNAL_AI_CONFIG = {
  provider: 'qwen',
  model: 'qwen-plus',
} as const

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

interface WorkflowCreatePageProps {
  onTitleChange?: (title: string) => void
  onWorkflowIdChange?: (workflowId: string) => void  // 新建工作流后通知父组件更新ID
  externalTitle?: string
  editWorkflowId?: string  // 在Tab内编辑时传入的工作流ID
}

export default function WorkflowCreatePage({ onTitleChange, onWorkflowIdChange, externalTitle, editWorkflowId }: WorkflowCreatePageProps = {}) {
  const navigate = useNavigate()
  const { id: routeId } = useParams<{ id: string }>()
  const id = routeId || editWorkflowId  // 优先用URL参数，其次用prop传入的ID
  const location = useLocation()
  const { showToast } = useToast()
  const { showConfirm } = useConfirm()

  // 跟踪已保存的工作流ID（autoSave创建后记录，避免重复创建）
  const [savedWorkflowId, setSavedWorkflowId] = useState<string | null>(null)
  const workflowId = id || savedWorkflowId // 优先用URL参数，其次用已保存的ID

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
      expectedResultAttachments: [],
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

  // 前置准备折叠状态（默认折叠）
  const [prepsExpanded, setPrepsExpanded] = useState(false)

  // 资源卡片展开状态管理 - 格式: stepId_resourceType (tool/prompt/media/document)
  const [expandedResourceCards, setExpandedResourceCards] = useState<Set<string>>(new Set())

  // 正在编辑的新建资源临时数据 - 格式: stepId_resourceType
  const [newResourceData, setNewResourceData] = useState<Record<string, any>>({})

  // 自动保存和离开警告相关状态
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastFormDataRef = useRef<string>(JSON.stringify(formData))
  // formData 实时引用：确保 handleSave 始终能读取到最新的 formData
  const formDataRef = useRef(formData)
  useEffect(() => { formDataRef.current = formData }, [formData])
  // 手动保存进行中标记（ref 同步更新，防止 autoSave 竞态）
  const manualSaveInProgressRef = useRef(false)
  // autoSave 是否正在执行 API 调用（ref 同步更新）
  const autoSaveRunningRef = useRef(false)

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
      showToast('请输入工具名称', 'error')
      return
    }
    if (resourceType === 'prompt' && !data.title.trim()) {
      showToast('请输入提示词标题', 'error')
      return
    }
    if (resourceType === 'media' && !data.url.trim()) {
      showToast('请输入媒体链接', 'error')
      return
    }
    if (resourceType === 'document' && !data.name.trim()) {
      showToast('请输入文档名称', 'error')
      return
    }

    // 添加到对应的资源列表
    const newResource = {
      id: `${resourceType}_${Date.now()}_${Math.random()}`,
      ...data
    }

    setFormData(prev => {
      const newSteps = [...prev.steps]
      if (resourceType === 'tool') {
        newSteps[stepIndex] = { ...newSteps[stepIndex], tools: [...newSteps[stepIndex].tools, newResource] }
      } else if (resourceType === 'prompt') {
        newSteps[stepIndex] = { ...newSteps[stepIndex], promptResources: [...newSteps[stepIndex].promptResources, newResource] }
      } else if (resourceType === 'media') {
        newSteps[stepIndex] = { ...newSteps[stepIndex], demonstrationMedia: [...newSteps[stepIndex].demonstrationMedia, newResource] }
      } else if (resourceType === 'document') {
        newSteps[stepIndex] = { ...newSteps[stepIndex], documentResources: [...newSteps[stepIndex].documentResources, newResource] }
      }
      return { ...prev, steps: newSteps }
    })

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

  // 同步外部标题（tab双击编辑）到表单
  useEffect(() => {
    if (externalTitle !== undefined && externalTitle !== formData.title && externalTitle !== '未命名工作流') {
      setFormData(prev => ({ ...prev, title: externalTitle }))
    }
  }, [externalTitle])

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

      setFormData(prev => ({
        ...prev,
        title: state.data.title || '',
        description: state.data.description || '',
        tags: state.data.tags || [],
        steps: state.data.steps || [],
        category: state.data.category || 'general',
        isPublic: state.data.isPublic ?? true,
        associatedSolutions: [],
        associatedThemes: []
      }))
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
          setFormData(prev => ({
            ...prev,
            title: data.title || '',
            description: data.description || '',
            tags: data.tags || [],
            steps: data.steps || [],
            category: data.category || 'general',
            isPublic: data.isPublic ?? true,
            associatedSolutions: data.associatedSolutions || [],
            associatedThemes: data.associatedThemes || []
          }))

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

  // 从 useScenarios 推导侧边栏分类名称
  const SCENARIO_TO_SIDEBAR: Record<string, string> = {
    content: '内容创作',
    video: '视频制作',
    data: '数据分析',
    design: '图文设计',
    efficiency: '效率工具',
    monetize: '副业专区',
  }
  const deriveCategoryName = useCallback(() => {
    if (formData.useScenarios.length > 0) {
      for (const cat of SCENARIO_CATEGORIES) {
        if (cat.children.some(c => formData.useScenarios.includes(c.id))) {
          return SCENARIO_TO_SIDEBAR[cat.id] || cat.name
        }
      }
    }
    return '其他'
  }, [formData.useScenarios])

  // 构建工作流保存数据的辅助函数（autoSave 和 handleSave 共用）
  const buildWorkflowData = useCallback((data: WorkflowFormData, isDraft: boolean, isAutoSave: boolean) => {
    const derivedCategory = deriveCategoryName()
    return {
      title: data.title,
      description: data.description,
      tags: data.tags.join(','),
      category: derivedCategory,
      isPublic: isDraft ? false : data.isPublic,
      isDraft,
      difficultyLevel: data.difficultyLevel,
      useScenarios: data.useScenarios,
      preparations: data.preparations.filter(p => p.name.trim()).map((p, index) => ({
        name: p.name,
        description: p.description,
        link: p.link,
        order: index
      })),
      config: {
        nodes: data.steps.map((step, index) => ({
          id: step.id,
          type: 'ai',
          label: step.title,
          config: {
            goal: step.title,
            prompt: step.prompt,
            stepDescription: step.description,
            expectedResult: step.expectedResult,
            expectedResultAttachments: (step.expectedResultAttachments || []).map(a => ({
              id: a.id,
              type: a.type,
              url: a.url,
              name: a.name
            })),
            tools: step.tools.filter(t => t.name.trim()).map(t => ({
              name: t.name,
              url: t.url,
              description: t.description
            })),
            promptResources: step.promptResources.filter(p => p.title.trim()).map(p => ({
              title: p.title,
              content: p.content
            })),
            demonstrationMedia: step.demonstrationMedia.filter(m => m.url.trim()).map(m => ({
              type: m.type,
              url: m.url,
              caption: m.caption
            })),
            relatedResources: step.relatedResources.filter(r => r.title.trim() || r.url.trim()).map(r => ({
              title: r.title,
              type: r.type,
              url: r.url,
              description: r.description
            })),
            documentResources: step.documentResources.filter(d => d.name.trim()).map(d => ({
              name: d.name,
              url: d.url,
              description: d.description
            })),
            provider: step.tools.length > 0 ? '' : 'OpenAI',
            model: step.tools.length > 0 ? step.tools[0].name : 'GPT-4',
            alternativeModels: step.alternativeModels,
            temperature: 0.7,
            maxTokens: 2000,
            ...(!isAutoSave && {
              associatedSolutions: step.associatedSolutions,
              associatedThemes: step.associatedThemes
            })
          },
          position: { x: 100, y: 100 + index * 150 }
        })),
        edges: data.steps.slice(0, -1).map((_, index) => ({
          id: `e${index}-${index + 1}`,
          source: data.steps[index].id,
          target: data.steps[index + 1].id
        }))
      },
      _derivedCategory: derivedCategory // 内部使用，API发送时会被忽略
    }
  }, [deriveCategoryName])

  // 自动保存函数
  const autoSave = useCallback(async () => {
    // 手动保存进行中时跳过（使用 ref 同步检查，避免 state 延迟）
    if (manualSaveInProgressRef.current) return
    const token = localStorage.getItem('token')
    if (!hasUnsavedChanges || !token || !formData.title.trim() || saving) {
      return
    }

    try {
      autoSaveRunningRef.current = true
      setAutoSaveStatus('saving')

      // 使用 ref 获取最新的 formData，防止闭包捕获旧值
      const currentFormData = formDataRef.current
      const workflowData = buildWorkflowData(currentFormData, true, true)

      // 发送前再次检查手动保存是否已开始
      if (manualSaveInProgressRef.current) {
        autoSaveRunningRef.current = false
        setAutoSaveStatus('idle')
        return
      }

      console.log('🔄 [autoSave] 自动保存中...', {
        stepsCount: currentFormData.steps.length,
        steps: currentFormData.steps.map(s => ({
          title: s.title,
          promptLength: s.prompt?.length || 0,
          descLength: s.description?.length || 0
        }))
      })

      // 根据是编辑还是创建来决定调用哪个 API
      if (workflowId) {
        try {
          await updateWorkflow(workflowId, workflowData)
        } catch (updateErr: any) {
          // 如果工作流已被删除（404），自动创建新工作流
          if (updateErr.response?.status === 404) {
            console.log('🔄 [autoSave] 工作流已被删除，自动创建新工作流...')
            const result = await createWorkflow(workflowData)
            if (result.id) {
              setSavedWorkflowId(result.id)
              onWorkflowIdChange?.(result.id)
              // 仅在独立编辑页时修改URL，工作台内嵌时不改URL避免刷新后跳离画布
              if (!editWorkflowId && !location.pathname.startsWith('/workspace')) window.history.replaceState(null, '', `/workflow/edit/${result.id}`)
            }
          } else {
            throw updateErr
          }
        }
      } else {
        const result = await createWorkflow(workflowData)
        if (result.id) {
          setSavedWorkflowId(result.id)
          onWorkflowIdChange?.(result.id)
          // 更新 URL 为 /workflow/edit/:id，这样刷新页面时能从服务器加载数据
          // 仅在独立编辑页时修改URL，工作台内嵌时不改URL避免刷新后跳离画布
          if (!editWorkflowId && !location.pathname.startsWith('/workspace')) window.history.replaceState(null, '', `/workflow/edit/${result.id}`)
        }
      }

      // API 调用完成后，再次检查手动保存是否在此期间启动
      // 如果是，跳过状态更新（手动保存会负责状态）
      if (manualSaveInProgressRef.current) {
        console.log('🔄 [autoSave] 手动保存已启动，跳过状态更新')
        autoSaveRunningRef.current = false
        return
      }

      setAutoSaveStatus('saved')
      setLastSavedTime(new Date())
      setHasUnsavedChanges(false)

      setTimeout(() => {
        setAutoSaveStatus('idle')
      }, 2000)
    } catch (error) {
      console.error('自动保存失败:', error)
      if (!manualSaveInProgressRef.current) {
        setAutoSaveStatus('error')
        setTimeout(() => {
          setAutoSaveStatus('idle')
        }, 5000)
      }
    } finally {
      autoSaveRunningRef.current = false
    }
  }, [hasUnsavedChanges, formData, workflowId, saving, buildWorkflowData])

  // 监听 formData 变化，标记为有未保存的更改
  useEffect(() => {
    const currentFormData = JSON.stringify(formData)
    if (currentFormData !== lastFormDataRef.current) {
      // 首次加载时不标记为未保存
      if (lastFormDataRef.current !== JSON.stringify({
        title: '',
        description: '',
        tags: [],
        difficultyLevel: 'beginner',
        price: 0,
        useScenarios: [],
        preparations: [],
        steps: [{
          id: formData.steps[0]?.id || '',
          title: '',
          description: '',
          prompt: '',
          expectedResult: '',
          model: { brand: 'OpenAI', name: 'GPT-4', url: '' },
          alternativeModels: [],
          advancedSettings: { temperature: 0.7, maxTokens: 2000 },
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
      })) {
        setHasUnsavedChanges(true)
      }
      lastFormDataRef.current = currentFormData
    }
  }, [formData])

  // 自动保存定时器：每30秒检查一次
  useEffect(() => {
    if (hasUnsavedChanges && autoSaveStatus === 'idle') {
      autoSaveTimerRef.current = setTimeout(() => {
        autoSave()
      }, 30000) // 30秒
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [hasUnsavedChanges, autoSave, autoSaveStatus])

  // beforeunload 警告：关闭/刷新页面时提示
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '' // Chrome 需要设置 returnValue
        return '' // 一些浏览器需要返回字符串
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  // 拦截路由导航：监听 popstate（浏览器前进/后退）
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const handlePopState = () => {
      // 浏览器后退/前进时，如果有未保存更改，push 回当前路径阻止离开
      // 然后弹出确认框
      const currentPath = location.pathname
      window.history.pushState(null, '', currentPath)

      showConfirm({
        title: '未保存的更改',
        message: '你有未保存的更改。确定要离开吗？未保存的更改将会丢失。',
        type: 'warning',
        confirmText: '离开',
        cancelText: '继续编辑'
      }).then(confirmed => {
        if (confirmed) {
          setHasUnsavedChanges(false)
          window.history.back()
        }
      })
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [hasUnsavedChanges, location.pathname])

  // 安全导航：在有未保存更改时先弹确认框
  const safeNavigate = useCallback(async (to: string) => {
    if (hasUnsavedChanges) {
      const confirmed = await showConfirm({
        title: '未保存的更改',
        message: '你有未保存的更改。确定要离开吗？未保存的更改将会丢失。',
        type: 'warning',
        confirmText: '离开',
        cancelText: '继续编辑'
      })
      if (!confirmed) return
    }
    setHasUnsavedChanges(false)
    navigate(to)
  }, [hasUnsavedChanges, navigate, showConfirm])

  const loadWorkflow = async () => {
    if (!id) return
    try {
      const data = await getWorkflowDetail(id)
      console.log('📂 [loadWorkflow] 从服务器加载:', {
        id,
        title: data.title,
        hasConfig: !!data.config,
        nodesCount: data.config?.nodes?.length || 0,
        nodes: (data.config?.nodes || []).map((n: any) => ({
          id: n.id,
          label: n.label,
          promptLen: n.config?.prompt?.length || 0,
          promptPreview: n.config?.prompt?.substring(0, 60) || '(空)',
          descLen: n.config?.stepDescription?.length || 0,
          expectedLen: n.config?.expectedResult?.length || 0
        }))
      })
      // 转换数据格式
      const steps: WorkflowStep[] = (data.config?.nodes || []).map((node: any) => ({
        id: node.id || `step_${Date.now()}_${Math.random()}`,
        title: node.label || node.config?.goal || '',
        description: node.config?.stepDescription || '',
        prompt: node.config?.prompt || '',
        expectedResult: node.config?.expectedResult || '',
        expectedResultAttachments: (node.config?.expectedResultAttachments || []).map((a: any) => ({
          id: a.id || `att_${Date.now()}_${Math.random()}`,
          type: a.type || 'file',
          url: a.url || '',
          name: a.name || ''
        })),
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
        price: data.price || 0,
        useScenarios: (typeof data.useScenarios === 'string' ? (() => { try { return JSON.parse(data.useScenarios) } catch { return [] } })() : data.useScenarios) || [],
        preparations: preparations,
        steps: steps,
        category: data.category || 'general',
        isPublic: data.isPublic ?? true
      })
    } catch (error) {
      console.error('加载工作流失败:', error)
      showToast('加载工作流失败', 'error')
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
    setFormData(prev => ({
      ...prev,
      preparations: [...prev.preparations, newPrep]
    }))
  }

  // 更新前置准备项
  const handleUpdatePreparation = (index: number, field: keyof PreparationItem, value: string) => {
    setFormData(prev => {
      const newPreps = [...prev.preparations]
      newPreps[index] = { ...newPreps[index], [field]: value }
      return { ...prev, preparations: newPreps }
    })
  }

  // 删除前置准备项
  const handleRemovePreparation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      preparations: prev.preparations.filter((_, i) => i !== index)
    }))
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
      showToast('请先输入工作流标题', 'error')
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
        provider: INTERNAL_AI_CONFIG.provider,
        model: INTERNAL_AI_CONFIG.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 200
      })

      if (response.success && response.data.content) {
        setFormData(prev => ({ ...prev, description: response.data.content.trim() }))
      } else {
        showToast('生成失败，请重试', 'error')
      }
    } catch (error: any) {
      console.error('AI 生成简介失败:', error)
      showToast(error.message || '生成失败，请重试', 'error')
    } finally {
      setGeneratingDescription(false)
    }
  }

  // 文章快速转 - 一键转换
  const handleArticleConvert = async () => {
    if (!articleInput.trim()) return

    setConvertingArticle(true)
    try {
      const contentToAnalyze = articleInput.trim()

      const prompt = `# 角色
你是一个专业的AI工作流结构化解析专家。你的任务是将用户提供的一段内容（可能是教程、方法论、操作指南、经验分享等），智能拆解为一个完整的、可执行的工作流。

# 目标
从非结构化的内容中，提取并还原出一个完整工作流的所有步骤，使其可以直接录入到工作流平台中。

# 核心原则：最大程度保留原文
- 你的任务是**提取和结构化**，不是**改写和润色**
- 步骤说明、预期结果等文本字段，必须尽可能使用原文中的原始表述，保持原作者的语气和用词
- 只在原文确实缺失必要信息时才补充，补充内容要与原文风格一致
- 禁止将原文口语化表述改为书面语，禁止添加原文没有的修饰词
- 宁可直接摘录原文段落，也不要自行概括重写

# 解析字段定义

每个步骤包含以下字段：

## 1. 步骤标题
- 用"动词 + 对象"的格式概括该步骤核心动作
- 控制在5-15字以内
- 示例：「用DeepSeek生成选题清单」「在剪映中添加字幕」

## 2. 资源区（四类资源，缺失的输出空数组）

| 类型 | 说明 | 识别线索 |
|------|------|----------|
| tools | AI工具、软件、平台、插件 | 产品名、网址、APP名称 |
| prompts | 提示词、指令、咒语 | 引号内的指令、"输入以下内容"、prompt原文 |
| media | 图片、视频、音频、截图等素材 | "参考图"、"示例视频"、素材描述 |
| documents | 模板、文档、表格、参考资料 | "模板"、"清单"、"表格"、文件名 |

## 3. 步骤说明
- 直接摘录或拼接原文中描述该步骤操作的段落，保留原文用词和语气
- 仅在原文表述不完整、无法独立理解时做最小限度补充
- 如果涉及资源区的工具或提示词，用【】标注引用，如：打开【ChatGPT】，输入【提示词A】

## 4. 预期结果
- 如果原文中有提到该步骤的产出或结果，直接使用原文表述
- 如果原文未明确说明，则用简洁的格式补充：「得到一份/一个/一段 + 具体产出」

# 工作流级别信息

在步骤之外，还需要提取工作流本身的元信息：

- **workflow_title**：整个工作流的标题（15字以内）
- **workflow_description**：一句话说明这个工作流能帮用户解决什么问题
- **total_steps**：总步骤数

# 输出格式（严格JSON）
{
  "workflow_title": "工作流标题",
  "workflow_description": "一句话描述",
  "total_steps": 3,
  "steps": [
    {
      "step_number": 1,
      "title": "步骤标题",
      "resources": {
        "tools": [],
        "prompts": [],
        "media": [],
        "documents": []
      },
      "description": "步骤说明",
      "expected_result": "预期结果"
    }
  ]
}

# 智能拆分规则

1. **判断粒度**：每个步骤应该是一个独立的、可执行的最小操作单元。如果一个动作中包含"然后"、"接着"、"再"等连接词引出不同操作，考虑拆分
2. **保持顺序**：步骤顺序必须还原内容中的实际执行顺序，不可自行调整
3. **合并冗余**：如果多段内容描述的是同一个操作的不同细节，合并为一个步骤
4. **补全隐含步骤**：如果内容中存在逻辑跳跃（如突然出现一个结果但没说怎么得到的），补充缺失的中间步骤，并在description中标注「[补充步骤]」
5. **提示词完整保留**：内容中出现的提示词/prompt必须原文保留，一字不改地放入prompts数组
6. **工具精准识别**：工具名称使用内容中的原始写法，不要自行翻译或替换

# 待解析内容

${contentToAnalyze}`

      const response = await chatWithAI({
        provider: INTERNAL_AI_CONFIG.provider,
        model: INTERNAL_AI_CONFIG.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        maxTokens: 4000
      })

      if (response.success && response.data.content) {
        const content = response.data.content.trim()
        // 尝试提取 JSON（可能被包裹在 ```json ``` 中）
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])

          const newSteps: WorkflowStep[] = (parsed.steps || []).map((s: any, idx: number) => {
            const res = s.resources || {}
            return {
              id: `step_${Date.now()}_${idx}`,
              title: s.title || '',
              description: s.description || '',
              prompt: '',
              expectedResult: s.expected_result || '',
              expectedResultAttachments: [],
              model: { brand: 'OpenAI', name: 'GPT-4', url: '' },
              alternativeModels: [],
              advancedSettings: { temperature: 0.7, maxTokens: 2000 },
              showAdvanced: false,
              tools: (res.tools || []).map((t: string, ti: number) => ({
                id: `tool_${Date.now()}_${idx}_${ti}`,
                name: t,
                url: '',
                description: ''
              })),
              promptResources: (res.prompts || []).map((p: string, pi: number) => ({
                id: `prompt_${Date.now()}_${idx}_${pi}`,
                title: `提示词${pi + 1}`,
                content: p
              })),
              demonstrationMedia: (res.media || []).map((m: string, mi: number) => ({
                id: `media_${Date.now()}_${idx}_${mi}`,
                type: 'image' as const,
                url: '',
                caption: m
              })),
              relatedResources: [],
              documentResources: (res.documents || []).map((d: string, di: number) => ({
                id: `doc_${Date.now()}_${idx}_${di}`,
                name: d,
                url: '',
                description: ''
              })),
              associatedSolutions: [],
              associatedThemes: []
            }
          })

          setFormData({
            ...formData,
            title: parsed.workflow_title || formData.title,
            description: parsed.workflow_description || formData.description,
            steps: newSteps.length > 0 ? newSteps : formData.steps
          })

          setIsFromArticle(true)
          setSourceContent(articleInput.trim())
          setShowArticlePopover(false)
          setArticleInput('')
        } else {
          showToast('AI 返回格式异常，请重试', 'error')
        }
      } else {
        showToast('转换失败，请重试', 'error')
      }
    } catch (error: any) {
      console.error('文章转换失败:', error)
      showToast(error.message || '转换失败，请重试', 'error')
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
      expectedResultAttachments: [],
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

    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }))
  }

  // 更新步骤
  const handleUpdateStep = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newSteps = [...prev.steps]
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
      return { ...prev, steps: newSteps }
    })
  }

  // 预期结果附件上传
  const [uploadingStepIndex, setUploadingStepIndex] = useState<number | null>(null)

  const handleExpectedResultUpload = async (stepIndex: number, file: File) => {
    const isImage = file.type.startsWith('image/')
    const endpoint = isImage ? '/api/utils/upload-media' : '/api/utils/upload-document'

    const formDataUpload = new FormData()
    formDataUpload.append('file', file)

    setUploadingStepIndex(stepIndex)
    try {
      const res = await api.post(endpoint, formDataUpload)

      // 后端返回相对路径如 /uploads/images/xxx.png，直接使用相对路径（适配任何域名）
      const attachment = {
        id: `att_${Date.now()}_${Math.random()}`,
        type: (isImage ? 'image' : 'file') as 'image' | 'file',
        url: res.data.url,
        name: file.name || res.data.originalName || '未命名文件'
      }

      setFormData(prev => {
        const newSteps = [...prev.steps]
        newSteps[stepIndex] = {
          ...newSteps[stepIndex],
          expectedResultAttachments: [...(newSteps[stepIndex].expectedResultAttachments || []), attachment]
        }
        return { ...prev, steps: newSteps }
      })
      showToast('上传成功', 'success')
    } catch (err: any) {
      showToast(err.response?.data?.error || '文件上传失败', 'error')
    } finally {
      setUploadingStepIndex(null)
    }
  }

  // 删除预期结果附件
  const handleRemoveExpectedResultAttachment = (stepIndex: number, attachmentId: string) => {
    setFormData(prev => {
      const newSteps = [...prev.steps]
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        expectedResultAttachments: (newSteps[stepIndex].expectedResultAttachments || []).filter(a => a.id !== attachmentId)
      }
      return { ...prev, steps: newSteps }
    })
  }

  // 删除步骤
  const handleDeleteStep = async (index: number) => {
    if (await showConfirm({ message: '确定要删除这个步骤吗？' })) {
      setFormData(prev => ({
        ...prev,
        steps: prev.steps.filter((_, i) => i !== index)
      }))
    }
  }

  // 添加备用模型
  const handleAddAlternativeModel = (stepIndex: number) => {
    const defaultBrand = 'OpenAI'
    setFormData(prev => {
      const newSteps = [...prev.steps]
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        alternativeModels: [...newSteps[stepIndex].alternativeModels, {
          brand: defaultBrand,
          name: AI_MODELS[defaultBrand][0],
          url: ''
        }]
      }
      return { ...prev, steps: newSteps }
    })
  }

  // 更新备用模型
  const handleUpdateAlternativeModel = (stepIndex: number, altIndex: number, field: 'brand' | 'name', value: string) => {
    setFormData(prev => {
      const newSteps = [...prev.steps]
      const newAltModels = [...newSteps[stepIndex].alternativeModels]
      if (field === 'brand') {
        newAltModels[altIndex] = { brand: value, name: AI_MODELS[value][0], url: '' }
      } else {
        newAltModels[altIndex] = { ...newAltModels[altIndex], name: value }
      }
      newSteps[stepIndex] = { ...newSteps[stepIndex], alternativeModels: newAltModels }
      return { ...prev, steps: newSteps }
    })
  }

  // 删除备用模型
  const handleRemoveAlternativeModel = (stepIndex: number, altIndex: number) => {
    setFormData(prev => {
      const newSteps = [...prev.steps]
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        alternativeModels: newSteps[stepIndex].alternativeModels.filter((_, i) => i !== altIndex)
      }
      return { ...prev, steps: newSteps }
    })
  }

  // 拖拽开始
  const handleDragStart = (index: number) => {
    setDraggedStepIndex(index)
  }

  // 拖拽经过
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedStepIndex === null || draggedStepIndex === index) return

    setFormData(prev => {
      const newSteps = [...prev.steps]
      const draggedStep = newSteps[draggedStepIndex]
      newSteps.splice(draggedStepIndex, 1)
      newSteps.splice(index, 0, draggedStep)
      return { ...prev, steps: newSteps }
    })
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
      // prompt 字段没有独立输入框，不做验证
      // 工具不是必填项，移除强制验证
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 本地保存工作流到 localStorage
  const handleLocalSave = () => {
    if (!formData.title.trim()) {
      showToast('请填写工作流标题', 'error')
      return
    }
    const now = new Date().toISOString()
    const savedWorkflow = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      tags: formData.tags,
      category: formData.category,
      steps: formData.steps,
      preparations: formData.preparations,
      createdAt: now,
      updatedAt: now
    }
    const existing = JSON.parse(localStorage.getItem('savedWorkflows') || '[]')
    existing.push(savedWorkflow)
    localStorage.setItem('savedWorkflows', JSON.stringify(existing))
    // 触发 storage 事件通知其他组件
    window.dispatchEvent(new Event('savedWorkflowsUpdated'))
    // 保存到本地后也重置未保存状态
    setHasUnsavedChanges(false)
    setLastSavedTime(new Date())
    showToast('保存成功！', 'success')
  }

  // 保存工作流（存草稿或发布）
  const handleSave = async (isDraft: boolean) => {
    // 使用 ref 获取最新的 formData，防止闭包捕获旧值
    const currentFormData = formDataRef.current

    if (isDraft) {
      if (!currentFormData.title.trim()) {
        showToast('请输入工作流标题', 'error')
        return
      }
    } else {
      if (!validateForm()) {
        showToast('请填写所有必填字段', 'error')
        return
      }
    }

    try {
      // 同步标记手动保存开始，阻止 autoSave 继续或启动
      manualSaveInProgressRef.current = true
      // 清除 autoSave 定时器
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
      setSaving(true)

      // 如果 autoSave 正在执行 API 调用，等待它完成再继续
      // （避免两个并发请求到服务器，autoSave 的旧数据可能覆盖新数据）
      if (autoSaveRunningRef.current) {
        console.log('⏳ [handleSave] 等待 autoSave 完成...')
        await new Promise<void>(resolve => {
          const checkInterval = setInterval(() => {
            if (!autoSaveRunningRef.current) {
              clearInterval(checkInterval)
              resolve()
            }
          }, 50)
          // 最多等待 5 秒
          setTimeout(() => {
            clearInterval(checkInterval)
            resolve()
          }, 5000)
        })
        console.log('✅ [handleSave] autoSave 已完成，继续手动保存')
      }

      const workflowData: any = buildWorkflowData(currentFormData, isDraft, false)
      const derivedCategory = workflowData._derivedCategory
      delete workflowData._derivedCategory

      console.log('💾 [handleSave] 保存工作流，完整数据:', {
        isDraft,
        isPublic: workflowData.isPublic,
        stepsCount: currentFormData.steps.length,
        nodes: workflowData.config.nodes.map((n: any) => ({
          id: n.id,
          label: n.label,
          promptLength: n.config?.prompt?.length || 0,
          promptPreview: n.config?.prompt?.substring(0, 80) || '(空)',
          descLength: n.config?.stepDescription?.length || 0,
          expectedResultLength: n.config?.expectedResult?.length || 0
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

      let savedId: string | undefined
      if (workflowId) {
        try {
          await updateWorkflow(workflowId, workflowData)
          savedId = workflowId
        } catch (updateErr: any) {
          // 如果工作流已被删除（404），自动创建新工作流
          if (updateErr.response?.status === 404) {
            console.log('💾 [handleSave] 工作流已被删除，自动创建新工作流...')
            const result = await createWorkflow(workflowData)
            savedId = result.id
            if (result.id) {
              setSavedWorkflowId(result.id)
              onWorkflowIdChange?.(result.id)
              if (!editWorkflowId && !location.pathname.startsWith('/workspace')) window.history.replaceState(null, '', `/workflow/edit/${result.id}`)
            }
          } else {
            throw updateErr
          }
        }
        if (savedId) {
          localStorage.setItem('newlySavedWorkflowInfo', JSON.stringify({
            workflowId: savedId,
            categoryName: derivedCategory
          }))
        }
      } else {
        const result = await createWorkflow(workflowData)
        savedId = result.id
        if (result.id) {
          setSavedWorkflowId(result.id)
          onWorkflowIdChange?.(result.id)
          localStorage.setItem('newlySavedWorkflowInfo', JSON.stringify({
            workflowId: result.id,
            categoryName: derivedCategory
          }))
        }
      }

      // 保存后验证：立即从服务器读回数据，确认保存完整
      if (savedId) {
        try {
          const verify = await getWorkflowDetail(savedId)
          const serverNodes = verify.config?.nodes || []
          const sentNodes = workflowData.config.nodes
          const stepsMatch = serverNodes.length === sentNodes.length
          const contentMatch = sentNodes.every((sent: any, i: number) => {
            const server = serverNodes[i]
            if (!server) return false
            return server.config?.prompt === sent.config?.prompt
              && server.config?.stepDescription === sent.config?.stepDescription
              && server.config?.expectedResult === sent.config?.expectedResult
          })
          console.log('🔍 [handleSave] 保存验证:', {
            sent: sentNodes.length,
            received: serverNodes.length,
            stepsMatch,
            contentMatch,
            serverDetail: serverNodes.map((n: any) => ({
              id: n.id, label: n.label,
              promptLen: n.config?.prompt?.length || 0,
              descLen: n.config?.stepDescription?.length || 0
            }))
          })
          if (!stepsMatch || !contentMatch) {
            console.error('❌ [handleSave] 保存验证失败！发送和服务器数据不一致')
            showToast(`保存可能不完整！发送${sentNodes.length}步，服务器只有${serverNodes.length}步`, 'error')
            return // 不跳转，让用户看到问题
          }
        } catch (verifyErr) {
          console.warn('保存验证失败:', verifyErr)
        }
      }

      setHasUnsavedChanges(false)
      setLastSavedTime(new Date())
      const stepsSummary = currentFormData.steps.map(s => s.title || '无标题').join('、')
      showToast(
        isDraft
          ? `草稿保存成功！共${currentFormData.steps.length}个步骤（${stepsSummary}）`
          : '工作流发布成功！',
        'success'
      )
      window.dispatchEvent(new Event('workflowSavedToServer'))
      if (workflowId) {
        navigate('/workspace')
      } else if (isDraft) {
        navigate('/workspace')
      } else {
        navigate(`/workflow-intro/${savedId}`)
      }
    } catch (error) {
      console.error('保存工作流失败:', error)
      showToast('保存失败，请重试', 'error')
    } finally {
      setSaving(false)
      manualSaveInProgressRef.current = false
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
              onChange={(e) => {
                const newTitle = e.target.value
                setFormData({ ...formData, title: newTitle })
                onTitleChange?.(newTitle || '未命名工作流')
              }}
            />

            {/* 保存状态指示器 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginLeft: '12px',
              fontSize: '13px',
              color: autoSaveStatus === 'error' ? '#EF4444' :
                     autoSaveStatus === 'saving' ? '#F59E0B' :
                     autoSaveStatus === 'saved' ? '#10B981' :
                     hasUnsavedChanges ? '#6B7280' : '#9CA3AF',
              whiteSpace: 'nowrap'
            }}>
              {autoSaveStatus === 'saving' && (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  <span>保存中...</span>
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>已保存</span>
                </>
              )}
              {autoSaveStatus === 'error' && (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>保存失败</span>
                </>
              )}
              {autoSaveStatus === 'idle' && hasUnsavedChanges && (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>未保存</span>
                </>
              )}
              {autoSaveStatus === 'idle' && !hasUnsavedChanges && lastSavedTime && (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>已保存</span>
                </>
              )}
            </div>

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
                  <h4 className="article-popover-title">粘贴文章内容</h4>
                  <textarea
                    className="article-popover-textarea"
                    placeholder="将文章内容复制粘贴到这里..."
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
                    <Sparkles className="ai-sparkle" size={14} />
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

        {/* 前置准备区域 - 可折叠 */}
        <div className="info-card preparations-card">
          <div className="card-header-with-action">
            <div className="card-title-row" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => setPrepsExpanded(!prepsExpanded)}>
              {prepsExpanded ? <ChevronDown size={18} style={{ color: '#6b7280', flexShrink: 0 }} /> : <ChevronRight size={18} style={{ color: '#6b7280', flexShrink: 0 }} />}
              <h2 className="card-title" style={{ margin: 0 }}>前置准备</h2>
              <span className="card-subtitle-hint-inline">在开始工作流之前，用户需要准备什么？</span>
              {!prepsExpanded && formData.preparations.length > 0 && (
                <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>({formData.preparations.length} 项)</span>
              )}
            </div>
            {prepsExpanded && (
              <button className="add-btn-small" onClick={handleAddPreparation}>
                + 添加准备项
              </button>
            )}
          </div>

          {prepsExpanded && (
            <>
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
            </>
          )}
        </div>

        {/* 操作步骤区域 */}
        <div className="steps-section">
          <div className="steps-header">
            <h2 className="card-title" style={{ margin: 0 }}>操作步骤</h2>
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

                  {/* 已保存的资源卡片 */}
                  {(step.tools.length > 0 || step.promptResources.length > 0 || step.demonstrationMedia.length > 0 || step.documentResources.length > 0) && (
                    <div className="saved-resources-row">
                      {step.tools.map((tool) => (
                        <div key={tool.id} className="saved-resource-chip"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', `[工具: ${tool.name}]`)
                            e.dataTransfer.effectAllowed = 'copy'
                          }}
                        >
                          <span className="saved-resource-type">工具</span>
                          <span className="saved-resource-name">{tool.name}</span>
                          <button
                            type="button"
                            className="saved-resource-remove"
                            onClick={() => {
                              setFormData(prev => {
                                const newSteps = [...prev.steps]
                                newSteps[index] = { ...newSteps[index], tools: newSteps[index].tools.filter(t => t.id !== tool.id) }
                                return { ...prev, steps: newSteps }
                              })
                            }}
                          >×</button>
                        </div>
                      ))}
                      {step.promptResources.map((prompt) => (
                        <div key={prompt.id} className="saved-resource-chip"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', `[提示词: ${prompt.title}]`)
                            e.dataTransfer.effectAllowed = 'copy'
                          }}
                        >
                          <span className="saved-resource-type">提示词</span>
                          <span className="saved-resource-name">{prompt.title}</span>
                          <button
                            type="button"
                            className="saved-resource-remove"
                            onClick={() => {
                              setFormData(prev => {
                                const newSteps = [...prev.steps]
                                newSteps[index] = { ...newSteps[index], promptResources: newSteps[index].promptResources.filter(p => p.id !== prompt.id) }
                                return { ...prev, steps: newSteps }
                              })
                            }}
                          >×</button>
                        </div>
                      ))}
                      {step.demonstrationMedia.map((media) => (
                        <div key={media.id} className="saved-resource-chip"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', `[${media.type === 'image' ? '图片' : '视频'}: ${media.caption || media.url}]`)
                            e.dataTransfer.effectAllowed = 'copy'
                          }}
                        >
                          <span className="saved-resource-type">{media.type === 'image' ? '图片' : '视频'}</span>
                          <span className="saved-resource-name">{media.caption || media.url}</span>
                          <button
                            type="button"
                            className="saved-resource-remove"
                            onClick={() => {
                              setFormData(prev => {
                                const newSteps = [...prev.steps]
                                newSteps[index] = { ...newSteps[index], demonstrationMedia: newSteps[index].demonstrationMedia.filter(m => m.id !== media.id) }
                                return { ...prev, steps: newSteps }
                              })
                            }}
                          >×</button>
                        </div>
                      ))}
                      {step.documentResources.map((doc) => (
                        <div key={doc.id} className="saved-resource-chip"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', `[文档: ${doc.name}]`)
                            e.dataTransfer.effectAllowed = 'copy'
                          }}
                        >
                          <span className="saved-resource-type">文档</span>
                          <span className="saved-resource-name">{doc.name}</span>
                          <button
                            type="button"
                            className="saved-resource-remove"
                            onClick={() => {
                              setFormData(prev => {
                                const newSteps = [...prev.steps]
                                newSteps[index] = { ...newSteps[index], documentResources: newSteps[index].documentResources.filter(d => d.id !== doc.id) }
                                return { ...prev, steps: newSteps }
                              })
                            }}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 资源卡片容器 */}
                  <div className="resource-cards">
                    {/* 新建工具卡片 */}
                    {expandedResourceCards.has(`${step.id}_tool`) && (
                      <div className="new-resource-card">
                        <div className="new-resource-card-header">
                          <div className="new-resource-card-title">
                            <span>新建工具</span>
                          </div>
                          <div className="resource-header-actions">
                            <button
                              type="button"
                              className="confirm-resource-btn"
                              onClick={() => confirmAddResource(index, step.id, 'tool')}
                              disabled={!newResourceData[`${step.id}_tool`]?.name?.trim()}
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              className="close-resource-btn"
                              onClick={() => toggleResourceCard(step.id, 'tool')}
                            >
                              ×
                            </button>
                          </div>
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
                            <span>新建提示词</span>
                          </div>
                          <div className="resource-header-actions">
                            <button
                              type="button"
                              className="confirm-resource-btn"
                              onClick={() => confirmAddResource(index, step.id, 'prompt')}
                              disabled={!newResourceData[`${step.id}_prompt`]?.title?.trim()}
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              className="close-resource-btn"
                              onClick={() => toggleResourceCard(step.id, 'prompt')}
                            >
                              ×
                            </button>
                          </div>
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
                            <span>新建媒体</span>
                          </div>
                          <div className="resource-header-actions">
                            <button
                              type="button"
                              className="confirm-resource-btn"
                              onClick={() => confirmAddResource(index, step.id, 'media')}
                              disabled={!newResourceData[`${step.id}_media`]?.url?.trim()}
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              className="close-resource-btn"
                              onClick={() => toggleResourceCard(step.id, 'media')}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <div className="resource-form-fields">
                          <div className="file-upload-area">
                            <span className="file-upload-icon">↑</span>
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
                            <span>新建文档</span>
                          </div>
                          <div className="resource-header-actions">
                            <button
                              type="button"
                              className="confirm-resource-btn"
                              onClick={() => confirmAddResource(index, step.id, 'document')}
                              disabled={!newResourceData[`${step.id}_document`]?.name?.trim()}
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              className="close-resource-btn"
                              onClick={() => toggleResourceCard(step.id, 'document')}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <div className="resource-form-fields">
                          <div className="file-upload-area">
                            <span className="file-upload-icon">↑</span>
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
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'copy'
                      e.currentTarget.classList.add('drag-over')
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('drag-over')
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('drag-over')
                      const resourceRef = e.dataTransfer.getData('text/plain')
                      if (resourceRef && resourceRef.startsWith('[')) {
                        const textarea = e.target as HTMLTextAreaElement
                        const pos = textarea.selectionStart
                        const before = step.description.slice(0, pos)
                        const after = step.description.slice(pos)
                        handleUpdateStep(index, 'description', before + resourceRef + after)
                      }
                    }}
                  />
                </div>

                {/* 预期结果 */}
                <div className="step-content">
                  <label className="content-label">预期结果 <span className="optional-hint">(可选)</span></label>
                  <textarea
                    className="expected-result-textarea"
                    placeholder="完成这一步后，用户应该得到什么结果？支持直接粘贴图片"
                    rows={2}
                    value={step.expectedResult}
                    onChange={(e) => handleUpdateStep(index, 'expectedResult', e.target.value)}
                    onPaste={(e) => {
                      const items = e.clipboardData.items
                      for (let i = 0; i < items.length; i++) {
                        if (items[i].type.startsWith('image/')) {
                          e.preventDefault()
                          const file = items[i].getAsFile()
                          if (file) handleExpectedResultUpload(index, file)
                          return
                        }
                      }
                    }}
                  />

                  {/* 预期结果附件 */}
                  {(step.expectedResultAttachments?.length > 0) && (
                    <div className="expected-result-attachments">
                      {step.expectedResultAttachments.map(att => (
                        <div key={att.id} className="expected-result-attachment-item">
                          {att.type === 'image' ? (
                            <img src={att.url} alt={att.name} className="attachment-preview-img" />
                          ) : (
                            <div className="attachment-file-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span className="attachment-file-name">{att.name}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            className="attachment-remove-btn"
                            onClick={() => handleRemoveExpectedResultAttachment(index, att.id)}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadingStepIndex === index ? (
                    <div className="expected-result-upload-btn uploading">
                      <span className="ai-loading-spinner"></span>
                      <span>上传中...</span>
                    </div>
                  ) : (
                    <label className="expected-result-upload-btn">
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleExpectedResultUpload(index, file)
                            e.target.value = ''
                          }
                        }}
                      />
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>上传图片/文件，或直接粘贴图片</span>
                    </label>
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
            onClick={() => safeNavigate('/workspace')}
            disabled={saving}
          >
            取消
          </button>
          <button
            className="action-btn secondary"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存草稿'}
          </button>

          {/* 公开/私密切换 */}
          <div
            onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: formData.isPublic ? 'rgba(16, 185, 129, 0.08)' : 'rgba(107, 114, 128, 0.08)',
              border: `1px solid ${formData.isPublic ? 'rgba(16, 185, 129, 0.25)' : 'rgba(107, 114, 128, 0.25)'}`,
              transition: 'all 0.2s',
              userSelect: 'none'
            }}
          >
            <div style={{
              width: '32px',
              height: '18px',
              borderRadius: '9px',
              backgroundColor: formData.isPublic ? '#10b981' : '#9ca3af',
              position: 'relative',
              transition: 'background-color 0.2s'
            }}>
              <div style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                position: 'absolute',
                top: '2px',
                left: formData.isPublic ? '16px' : '2px',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
            </div>
            <span style={{
              fontSize: '13px',
              fontWeight: 500,
              color: formData.isPublic ? '#10b981' : '#6b7280'
            }}>
              {formData.isPublic ? '公开' : '私密'}
            </span>
          </div>

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
