import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Send,
  Loader2,
  Sparkles,
  Bot,
  User,
  Plus,
  Play,
  X,
  FileText,
  Image,
  Download,
  PlusCircle,
  AlertCircle,
  Heart,
  Eye,
  Star,
  Award,
  Target,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Paperclip,
  File,
  History,
  Trash2
} from 'lucide-react'
import type { ChatMessage as BaseChatMessage, AIModel, AIProvider } from '../types/ai'
import { workspaceContainers } from '../data/workspaceContainers'
import {
  createChatSession,
  getChatSessions,
  updateChatSession,
  deleteChatSession,
  type ChatSession
} from '../services/chatApi'
import {
  favoriteWorkflow,
  unfavoriteWorkflow,
  getFavoriteWorkflows,
  getUserWorkflows,
  cloneWorkflow,
  type Workflow
} from '../services/workflowApi'
import { chatWithAI, chatWithAIStream } from '../services/aiApi'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// 合并className的工具函数
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

// 工作流节点参数类型
type NodeParameter = {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea' | 'boolean'
  value: string | number | boolean
  required?: boolean
  editable?: boolean
  options?: { label: string; value: string }[]
  placeholder?: string
  description?: string
}

// 工作流节点类型
type WorkflowNode = {
  id: string
  name: string
  type: 'input' | 'ai-model' | 'tool' | 'output' | 'process'
  icon: string
  description: string
  params: NodeParameter[]
  editable?: boolean
}

type WorkflowCard = {
  id: string
  title: string
  description: string
  category: string
  author?: string
  authorLevel?: string
  authorBadge?: string
  useCases?: string[]
  examples?: {
    title: string
    description: string
    imageUrl?: string
  }[]
  reviews?: {
    userName: string
    rating: number
    comment: string
    date: string
  }[]
  rating?: number
  totalReviews?: number
  aiTools?: {
    name: string
    logo?: string
    type: 'model' | 'tool'
  }[]
  prompt?: string
  matchScore?: number
  nodes?: WorkflowNode[]
  icon?: string
  color?: string
  tags?: string[]
  tools?: any[]
  usageCount?: number
  favorite?: boolean
  updatedAt?: string
}

// AI工具卡片类型
type AIToolCard = {
  id: string
  name: string
  description: string
  category: string
  logo?: string
  type: 'model' | 'tool'
  provider?: string
  author?: string
  rating?: number
  totalReviews?: number
  useCases?: string[]
  examples?: {
    title: string
    description: string
  }[]
  prompt?: string
  capabilities?: string[]
  matchScore?: number
  model?: {
    provider: string
    modelId: string
    modelName: string
  }
}

// 推荐项类型（可以是工作流或AI工具）
type RecommendationCard =
  | ({ itemType: 'workflow' } & WorkflowCard)
  | ({ itemType: 'ai-tool' } & AIToolCard)

type WorkflowTool = NonNullable<WorkflowCard['aiTools']>[number]

type ToolExecutionResult = {
  id: string
  workflowId: string
  workflowTitle: string
  toolName: string
  toolType?: string
  status: 'success' | 'failed'
  output: string
  startedAt: string
  finishedAt: string
}

// 扩展消息类型，支持推荐工作流和AI工具
type ChatMessage = BaseChatMessage & {
  recommendedWorkflows?: WorkflowCard[]
  recommendedItems?: RecommendationCard[] // 新的推荐项列表
  toolExecutions?: ToolExecutionResult[]
}

type ExecutionResult =
  | { type: 'text'; content: string }
  | { type: 'image'; content: string; caption?: string }

interface AIChatPageProps {
  initialView?: 'chat' | 'explore'
  mode?: 'full' | 'embedded'
}

const baseWorkflows: WorkflowCard[] = []

// AI工具库 - 预定义的AI工具
const baseAITools: AIToolCard[] = [
  {
    id: 'ai-writer',
    name: 'AI写作助手',
    description: '智能文案生成，支持多种写作风格',
    category: '文本生成',
    logo: '✍️',
    type: 'model',
    model: { provider: 'qwen', modelId: 'qwen-plus', modelName: '通义千问Plus' }
  },
  {
    id: 'ai-translator',
    name: 'AI翻译',
    description: '多语言实时翻译，准确流畅',
    category: '语言处理',
    logo: '🌐',
    type: 'model',
    model: { provider: 'qwen', modelId: 'qwen-plus', modelName: '通义千问Plus' }
  },
  {
    id: 'ai-summarizer',
    name: 'AI摘要生成',
    description: '快速提取文章要点，生成摘要',
    category: '文本处理',
    logo: '📝',
    type: 'model',
    model: { provider: 'qwen', modelId: 'qwen-plus', modelName: '通义千问Plus' }
  },
  {
    id: 'ai-coder',
    name: 'AI代码助手',
    description: '代码生成、调试、优化一站式服务',
    category: '编程辅助',
    logo: '💻',
    type: 'model',
    model: { provider: 'qwen', modelId: 'qwen-plus', modelName: '通义千问Plus' }
  },
  {
    id: 'ai-analyzer',
    name: 'AI数据分析',
    description: '智能数据分析与可视化建议',
    category: '数据分析',
    logo: '📊',
    type: 'model',
    model: { provider: 'qwen', modelId: 'qwen-plus', modelName: '通义千问Plus' }
  },
  {
    id: 'ai-brainstorm',
    name: 'AI头脑风暴',
    description: '创意激发，思维发散',
    category: '创意辅助',
    logo: '💡',
    type: 'model',
    model: { provider: 'qwen', modelId: 'qwen-plus', modelName: '通义千问Plus' }
  }
]
const defaultModel: { provider: AIProvider; model: AIModel } = {
  provider: 'openai',
  model: {
    modelId: 'gpt-3.5-turbo',
    modelName: 'ChatGPT',
    description: 'OpenAI GPT-3.5 Turbo',
    inputPrice: 0.5,
    outputPrice: 1.5,
    category: 'text',
    maxTokens: 16385
  }
}

// 工作角色和具体工作定义已移至 src/data/workspaceContainers.ts
// 现在使用统一的数据源，与工作流画布共享

export function AIChatPage({ initialView = 'chat', mode = 'full' }: AIChatPageProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const embeddedParam = searchParams.get('embedded') === '1'
  const isEmbeddedMode = mode === 'embedded' || embeddedParam
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workflows, setWorkflows] = useState<WorkflowCard[]>([])
  const [aiTools, setAITools] = useState<AIToolCard[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowCard | null>(null)
  const [selectedAITool, setSelectedAITool] = useState<AIToolCard | null>(null)
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [selectedWorkflowDetail, setSelectedWorkflowDetail] = useState<WorkflowCard | null>(null)
  const [isEditingWorkflow, setIsEditingWorkflow] = useState(false)
  const [editedPrompt, setEditedPrompt] = useState('')
  const [editedAITools, setEditedAITools] = useState<WorkflowCard['aiTools']>([])
  const [selectedAIToolDetail, setSelectedAIToolDetail] = useState<AIToolCard | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [editedNodeParams, setEditedNodeParams] = useState<Record<string, NodeParameter[]>>({})
  const [showWorkflowPreview, setShowWorkflowPreview] = useState(false)
  const [expandedRecommendations, setExpandedRecommendations] = useState<Map<number, number>>(new Map())
  const [showCategorySelector, setShowCategorySelector] = useState(false)
  const [workflowToSave, setWorkflowToSave] = useState<WorkflowCard | null>(null)
  const [buttonPosition, setButtonPosition] = useState<{ top: number; left: number } | null>(null)
  const [selectedRole, setSelectedRole] = useState<string | null>(null) // 当前选择的角色，null表示在第一层
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  // 对话存储相关状态
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [showSessionList, setShowSessionList] = useState(false)
  const [isSavingChat, setIsSavingChat] = useState(false)

  // 收藏状态管理
  const [favoritedWorkflows, setFavoritedWorkflows] = useState<Set<string>>(new Set())

  // 用户工作流库
  const [userWorkflows, setUserWorkflows] = useState<Workflow[]>([])

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [model] = useState(defaultModel)

  // 推荐工作流列表
  const recommendedWorkflows = useMemo(() => baseWorkflows, [])

  if (!isEmbeddedMode && initialView === 'explore') {
    // 保留 legacy prop，当前界面始终展示 AI 对话
  }

  // 加载用户工作流
  useEffect(() => {
    const loadUserWorkflows = async () => {
      try {
        const workflows = await getUserWorkflows()
        console.log('📚 加载的用户工作流：', workflows)
        console.log('📊 工作流详情：', workflows.map(wf => ({
          title: wf.title,
          category: wf.category,
          tags: wf.tags,
          description: wf.description
        })))
        setUserWorkflows(workflows)
      } catch (error) {
        console.error('加载用户工作流失败:', error)
      }
    }
    loadUserWorkflows()
  }, [])

const commandKeywords = ['运行', '执行', '启动', '使用', '生成', '调用', '制作', '写', '帮我']

// Prompt 增强模板：自动完善简短输入
const promptEnhancers: Record<string, string> = {
  // 翻译相关
  '翻译': '我需要翻译功能，请分析我可能的使用场景（如文档翻译、实时对话翻译等），并推荐合适的AI工具或工作流',
  'translate': '我需要翻译功能，请分析我可能的使用场景（如文档翻译、实时对话翻译等），并推荐合适的AI工具或工作流',

  // 写作相关
  '写文章': '我想写文章，请告诉我你能帮助我创作哪些类型的文章（如技术博客、营销文案、小红书笔记等），并推荐对应的工具',
  '写作': '我需要写作帮助，请分析不同的写作场景（如创意写作、商务写作、学术写作等），并推荐合适的AI工具',
  '文案': '我需要文案创作帮助，请告诉我你支持哪些文案类型（如广告文案、社交媒体文案、产品描述等），并给出推荐',

  // 数据相关
  '数据分析': '我需要进行数据分析，请介绍你能提供的数据分析功能（如数据可视化、统计分析、报表生成等），并推荐工具或工作流',
  '分析': '我需要分析帮助，请告诉我你支持哪些分析场景（如文本分析、数据分析、用户行为分析等），并推荐合适的工具',

  // 图片相关
  '图片': '我需要图片相关的功能，请介绍你支持的图片处理能力（如图片生成、编辑、优化等），并推荐对应的工具',
  '生成图片': '我想生成图片，请告诉我你支持哪些图片生成场景（如AI绘画、图标生成、配图生成等），并给出详细推荐',
  'image': '我需要图片相关的功能，请介绍你支持的图片处理能力，并推荐对应的工具',

  // 代码相关
  '代码': '我需要代码帮助，请介绍你支持的编程辅助功能（如代码生成、调试、重构等），并推荐合适的AI工具',
  '编程': '我需要编程帮助，请告诉我你能提供哪些编程辅助（如代码审查、bug修复、算法实现等），并给出推荐',
  'code': '我需要代码帮助，请介绍你支持的编程辅助功能，并推荐合适的AI工具',

  // 总结相关
  '摘要': '我需要文本摘要功能，请介绍你支持的摘要场景（如文章摘要、会议纪要、长文总结等），并推荐AI工具',
  '总结': '我需要内容总结帮助，请告诉我你能处理哪些总结任务（如文档总结、视频总结、多文档汇总等），并给出推荐',
  'summary': '我需要文本摘要功能，请介绍你支持的摘要场景，并推荐AI工具',

  // 创意相关
  '创意': '我需要创意灵感，请介绍你能提供的创意辅助（如头脑风暴、创意方案、内容策划等），并推荐合适的工具',
  '头脑风暴': '我需要头脑风暴帮助，请告诉我你如何协助产生创意想法，并推荐AI工具',
  'brainstorm': '我需要头脑风暴帮助，请告诉我你如何协助产生创意想法，并推荐AI工具',

  // 通用帮助
  '帮我': '我需要帮助，请先了解我的具体需求是什么，并根据需求推荐合适的工作流或AI工具',
  '怎么': '请详细说明你的需求，我会根据你的具体场景推荐最合适的工作流或AI工具',
}


// 检测并增强简短的用户输入
const enhanceShortPrompt = (input: string): { enhanced: boolean; content: string } => {
  const trimmed = input.trim()

  // 如果输入已经足够详细（超过15个字符），不需要增强
  if (trimmed.length > 15) {
    return { enhanced: false, content: trimmed }
  }

  // 完全匹配检查（不区分大小写）
  const lowerInput = trimmed.toLowerCase()
  for (const [key, template] of Object.entries(promptEnhancers)) {
    if (lowerInput === key.toLowerCase()) {
      return { enhanced: true, content: template }
    }
  }

  // 包含关键词检查
  for (const [key, template] of Object.entries(promptEnhancers)) {
    if (trimmed.includes(key) && trimmed.length <= 10) {
      return { enhanced: true, content: template }
    }
  }

  // 如果输入非常短（<5字）但没有匹配到模板，给出通用提示
  if (trimmed.length < 5 && trimmed.length > 0) {
    return {
      enhanced: true,
      content: `关于"${trimmed}"，请告诉我你的具体需求，我会推荐最合适的工作流或AI工具来帮助你`
    }
  }

  return { enhanced: false, content: trimmed }
}

// 解析 AI 回复，提取意图类型和纯净内容
const parseAIResponse = (content: string): {
  intentType: 'chat' | 'solution' | 'unknown'
  cleanContent: string
  shouldRecommend: boolean
} => {
  // 检测开头的意图标记
  const chatMatch = content.match(/^\s*\[CHAT\]\s*/i)
  const solutionMatch = content.match(/^\s*\[SOLUTION\]\s*/i)

  let intentType: 'chat' | 'solution' | 'unknown' = 'unknown'
  let cleanContent = content

  if (chatMatch) {
    intentType = 'chat'
    cleanContent = content.replace(/^\s*\[CHAT\]\s*/i, '').trim()
  } else if (solutionMatch) {
    intentType = 'solution'
    cleanContent = content.replace(/^\s*\[SOLUTION\]\s*/i, '').trim()
  }

  // 只有在 solution 模式下才推荐工具
  const shouldRecommend = intentType === 'solution'

  return { intentType, cleanContent, shouldRecommend }
}

const normalizeForMatch = (text: string) => text.toLowerCase().replace(/\s+/g, '')

const formatTimestamp = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

const generateToolExecutionOutput = (workflow: WorkflowCard, tool: WorkflowTool) => {
  const highlight =
    workflow.useCases?.slice(0, 2).join('、') ||
    workflow.description?.split(/。|\.|；/)[0] ||
    workflow.title

  const followUp =
    workflow.aiTools && workflow.aiTools.length > 1
      ? `接下来可以继续尝试 ${workflow.aiTools.filter(t => t.name !== tool.name).map(t => `「${t.name}」`).join('、')} 进行联动。`
      : '如需深化结果，可继续补充更多上下文或关联其它工作流。'

  return `工具「${tool.name}」已根据「${workflow.title}」的目标完成初步输出，重点覆盖：${highlight}。${followUp}`
}

const buildToolExecutionResults = (workflow: WorkflowCard, tools: WorkflowTool[]): ToolExecutionResult[] => {
  const start = Date.now()

  return tools.map((tool, index) => ({
    id: `${workflow.id}-${normalizeForMatch(tool.name)}-${start}-${index}`,
    workflowId: workflow.id,
    workflowTitle: workflow.title,
    toolName: tool.name,
    toolType: tool.type,
    status: 'success',
    output: generateToolExecutionOutput(workflow, tool),
    startedAt: new Date(start + index * 180).toISOString(),
    finishedAt: new Date(start + (index + 1) * 420).toISOString()
  }))
}

  const simulateWorkflowExecution = (workflow: WorkflowCard, tool?: WorkflowTool) => {
    const toolsToRun = (tool ? [tool] : workflow.aiTools ?? []) as WorkflowTool[]

    if (toolsToRun.length === 0) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `「${workflow.title}」暂未配置可直接调用的 AI 工具，请先在工作流中补充工具节点。`
        }
      ])
      return
    }

    setWorkflows(prev => {
      if (prev.find((wf) => wf.id === workflow.id)) {
        return prev
      }
      return [...prev, workflow]
    })

    const executionResults = buildToolExecutionResults(workflow, toolsToRun)
    const summary = tool
      ? `已为你执行「${workflow.title}」中的工具「${tool.name}」，生成初步结果。`
      : `已为你执行「${workflow.title}」中的 ${toolsToRun.length} 个 AI 工具，生成初步结果。`

    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: summary,
        toolExecutions: executionResults
      }
    ])
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // 初始化：创建或加载对话会话和收藏状态
  useEffect(() => {
    const initChatSession = async () => {
      try {
        // 尝试从URL获取会话ID
        const urlParams = new URLSearchParams(window.location.search)
        const sessionId = urlParams.get('sessionId')

        if (sessionId) {
          // 加载指定会话
          setCurrentSessionId(sessionId)
        } else {
          // 创建新会话
          const newSession = await createChatSession('新对话')
          setCurrentSessionId(newSession.id)
        }

        // 加载所有会话列表和收藏的工作流
        const [sessions, favorites] = await Promise.all([
          getChatSessions(),
          getFavoriteWorkflows()
        ])
        setChatSessions(sessions)

        // 设置收藏的工作流ID
        const favoritedIds = new Set(favorites.map(wf => wf.id))
        setFavoritedWorkflows(favoritedIds)
      } catch (error) {
        console.error('初始化对话会话失败:', error)
      }
    }

    initChatSession()
  }, [])

  // 自动保存对话内容
  useEffect(() => {
    const saveChat = async () => {
      if (!currentSessionId || messages.length === 0 || isSavingChat) return

      try {
        setIsSavingChat(true)
        await updateChatSession(currentSessionId, {
          messages: messages as any[],
          title: messages[0]?.content.substring(0, 30) || '新对话'
        })
      } catch (error) {
        console.error('保存对话失败:', error)
      } finally {
        setIsSavingChat(false)
      }
    }

    // 防抖保存
    const timer = setTimeout(saveChat, 1000)
    return () => clearTimeout(timer)
  }, [messages, currentSessionId, isSavingChat])

  const handleSend = async () => {
    // 防止重复发送：检查是否正在加载或输入为空
    if (!inputValue.trim() || loading) {
      return
    }

    // 增强简短的用户输入
    const enhancedResult = enhanceShortPrompt(inputValue.trim())

    // 用户界面显示原始输入
    const userMessage: ChatMessage = { role: 'user', content: inputValue.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setUploadedFiles([]) // 清空上传的文件
    setLoading(true)
    setError(null)

    try {
      // 准备发送给 AI 的消息历史（包括当前消息）
      // 限制历史消息数量，只保留最近 6 条（3 轮对话），避免 token 过多和超时
      const allMessages = [...messages, userMessage]
      const recentMessages = allMessages.slice(-6)

      let aiMessages = recentMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }))

      // 如果用户输入被增强了，替换发送给 AI 的最后一条用户消息
      if (enhancedResult.enhanced && aiMessages.length > 0) {
        aiMessages[aiMessages.length - 1].content = enhancedResult.content
      }

      // 如果是第一条消息，添加系统提示
      if (messages.length === 0) {
        // 构建工作流信息（最多8个）
        const workflowInfo = userWorkflows.slice(0, 8).map(wf =>
          `- ${wf.title} (${wf.category})`
        ).join('\n')

        // 构建AI工具信息（最多6个）
        const aiToolInfo = baseAITools.slice(0, 6).map(tool =>
          `- ${tool.name} (${tool.category})`
        ).join('\n')

        const systemMessage = {
          role: 'system' as const,
          content: `你是专业的AI助手。根据用户意图自然响应。

【响应规则】
- 问候/闲聊：自然对话，在回复开头隐藏标记[CHAT]（用户看不到此标记）
- 任务需求：给出解决方案，在回复开头隐藏标记[SOLUTION]（用户看不到此标记）

【闲聊示例】
用户："你好"
你的回复：[CHAT]你好！很高兴见到你，有什么可以帮助你的吗？

用户："今天天气不错"
你的回复：[CHAT]是啊！这样的好天气让人心情舒畅。

【任务解决示例】
可用工作流（复杂任务）：
${workflowInfo || '无'}

可用AI工具（简单任务）：
${aiToolInfo}

用户："我想做个海报"
你的回复：[SOLUTION]我可以帮你生成专业海报。建议使用AI海报生成工作流，支持多种风格和尺寸，适合营销、社交媒体等场景。

用户："帮我翻译文档"
你的回复：[SOLUTION]建议使用AI翻译AI工具，支持50+种语言互译，保持专业术语准确性。

【重要】
1. 标记[CHAT]和[SOLUTION]必须放在回复最开头，但不要在回复内容中提及"模式"这个词
2. 自然对话，不要告诉用户你处于什么模式
3. 任务类请求必须明确推荐工具："建议使用XX工作流/AI工具"
4. 简洁回复，不超过100字`
        }

        aiMessages = [systemMessage, ...aiMessages]
      }

      // 创建一个临时的 AI 消息用于流式更新
      const streamingMessage: ChatMessage = {
        role: 'assistant',
        content: '',
      }
      setMessages((prev) => [...prev, streamingMessage])

      let fullContent = ''

      // 调用流式 AI API
      await chatWithAIStream(
        {
          provider: 'qwen',
          model: 'qwen-plus',
          messages: aiMessages,
          temperature: 0.7,
          maxTokens: 1500,
        },
        // onToken: 每次收到新 token 时调用
        (token: string) => {
          fullContent += token

          // 实时解析并移除标记
          const { cleanContent } = parseAIResponse(fullContent)

          setMessages((prev) => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: cleanContent,
            }
            return newMessages
          })
        },
        // onComplete: 完成时调用
        (data: any) => {
          // 解析最终回复，判断是否需要推荐
          const { cleanContent, shouldRecommend, intentType } = parseAIResponse(fullContent)

          console.log('🤖 AI 回复分析：', {
            原始回复: fullContent,
            意图类型: intentType,
            是否推荐: shouldRecommend,
            用户输入: userMessage.content
          })

          // 临时：总是执行推荐，用于调试
          const recommendations = analyzeAndRecommendWorkflows(fullContent, userMessage.content)

          console.log('📋 推荐结果：', {
            shouldRecommend,
            intentType,
            recommendationCount: recommendations.length,
            recommendations
          })

          const aiReply: ChatMessage = {
            role: 'assistant',
            content: cleanContent,
            // 只有在 solution 模式下才执行推荐
            recommendedItems: recommendations
          }

          setMessages((prev) => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1] = aiReply
            return newMessages
          })
          setLoading(false)
        },
        // onError: 错误时调用
        (error: Error) => {
          console.error('AI 对话失败:', error)

          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: `抱歉，${error.message || '服务暂时不可用，请稍后重试。'}`
          }

          setMessages((prev) => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1] = errorMessage
            return newMessages
          })
          setError(error.message)
          setLoading(false)
        }
      )
    } catch (error: any) {
      console.error('AI 对话失败:', error)

      // 显示错误信息
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `抱歉，${error.message || '服务暂时不可用，请稍后重试。'}`
      }

      setMessages((prev) => [...prev, errorMessage])
      setError(error.message)
      setLoading(false)
    }
  }

  // 辅助函数：根据 AI 回复和用户输入，智能推荐工作流
  const analyzeAndRecommendWorkflows = (aiResponse: string, userInput: string): RecommendationCard[] => {
    const recommendedItems: RecommendationCard[] = []

    console.log('🔍 开始分析推荐：', { userInput, aiResponse })

    // 方法1：检测 AI 是否明确推荐了工作流
    const workflowPatterns = [
      /建议使用[《「『]?(.+?)[》」』]?工作流/g,
      /我建议使用[《「『]?(.+?)[》」』]?工作流/g,
      /可以使用[《「『]?(.+?)[》」』]?工作流/g,
      /推荐使用[《「『]?(.+?)[》」』]?工作流/g,
      /试试[《「『]?(.+?)[》」』]?工作流/g,
      /使用[《「『]?(.+?)[》」』]?工作流来/g,
    ]

    const mentionedWorkflows: string[] = []
    for (const pattern of workflowPatterns) {
      let match
      while ((match = pattern.exec(aiResponse)) !== null) {
        mentionedWorkflows.push(match[1])
      }
    }

    console.log('💬 AI 提到的工作流：', mentionedWorkflows)

    // 如果 AI 明确提到了工作流名称，优先匹配这些
    if (mentionedWorkflows.length > 0) {
      const matchedByName = userWorkflows.filter(wf =>
        mentionedWorkflows.some(mentioned =>
          wf.title.includes(mentioned) || mentioned.includes(wf.title)
        )
      )

      matchedByName.slice(0, 2).forEach(wf => {
        recommendedItems.push({
          itemType: 'workflow',
          id: wf.id,
          title: wf.title,
          description: wf.description || '',
          category: wf.category || wf.tags?.[0] || '其他',
        } as any)
      })

      if (recommendedItems.length > 0) {
        return recommendedItems
      }
    }

    // 方法1.5：检测 AI 是否明确推荐了 AI 工具
    const aiToolPatterns = [
      /我建议使用[《「『]?(.+?)[》」』]?AI工具/g,
      /可以使用[《「『]?(.+?)[》」』]?AI工具/g,
      /推荐使用[《「『]?(.+?)[》」』]?AI工具/g,
      /试试[《「『]?(.+?)[》」』]?AI工具/g,
      /使用[《「『]?(.+?)[》」』]?AI工具来/g,
    ]

    const mentionedAITools: string[] = []
    for (const pattern of aiToolPatterns) {
      let match
      while ((match = pattern.exec(aiResponse)) !== null) {
        mentionedAITools.push(match[1])
      }
    }

    // 如果 AI 明确提到了 AI 工具名称，优先匹配这些
    if (mentionedAITools.length > 0) {
      const matchedByName = baseAITools.filter(tool =>
        mentionedAITools.some(mentioned =>
          tool.name.includes(mentioned) || mentioned.includes(tool.name)
        )
      )

      matchedByName.slice(0, 2).forEach(tool => {
        recommendedItems.push({
          itemType: 'ai-tool',
          id: tool.id,
          title: tool.name,
          description: `${tool.category}工具`,
          category: tool.category,
          logo: tool.logo,
        } as any)
      })

      if (recommendedItems.length > 0) {
        return recommendedItems
      }
    }

    // 方法2：基于关键词的语义匹配（作为备用方案）
    const keywords = {
      '图片': ['图像处理', '图片', '图像生成', '图像', 'image'],
      '图像': ['图像处理', '图片', '图像生成'],
      '海报': ['图像生成', '设计', '海报', 'poster', '图像处理'],
      '设计': ['图像生成', '设计', '海报', '图像处理', '创意'],
      '文章': ['内容创作', '文章', '文本生成', '写作', '博客'],
      '文案': ['文本生成', '内容创作', '营销', '广告'],
      '邮件': ['营销', '邮件', 'email', '通知'],
      '数据': ['数据分析', '分析', '统计', '报表'],
      '动画': ['图像处理', '动画', '视频'],
      '语音': ['语音处理', '语音', '音频', 'TTS'],
      '代码': ['文本生成', '代码生成', '编程', 'code'],
      '小红书': ['内容创作', '自媒体', '社交媒体'],
      '抖音': ['内容创作', '短视频', '社交媒体'],
      '公众号': ['内容创作', '文章', '微信'],
      '演讲': ['文本生成', '内容创作', '演示'],
      'PPT': ['文档处理', '演示', 'PowerPoint'],
      '翻译': ['文本处理', '翻译', '多语言'],
      'SEO': ['内容创作', 'SEO', '优化'],
      'Logo': ['图像生成', '设计', 'logo', '品牌'],
      '视频': ['视频处理', '视频', '剪辑', '动画'],
    }

    const combinedText = (userInput + ' ' + aiResponse).toLowerCase()

    // 检测用户输入中的关键词
    const detectedKeywords = Object.keys(keywords).filter(key =>
      combinedText.includes(key.toLowerCase())
    )

    console.log('🔑 检测到的关键词：', detectedKeywords)

    // 从用户工作流中匹配
    const matchedWorkflows = userWorkflows.filter(wf => {
      for (const [key, values] of Object.entries(keywords)) {
        if (combinedText.includes(key.toLowerCase())) {
          // 确保 tags 是数组
          const tagsArray = Array.isArray(wf.tags)
            ? wf.tags
            : (typeof wf.tags === 'string' ? wf.tags.split(',').map((t: string) => t.trim()) : [])

          const matched = values.some(v => {
            const titleMatch = wf.title.toLowerCase().includes(v.toLowerCase())
            const descMatch = wf.description?.toLowerCase().includes(v.toLowerCase())
            const categoryMatch = wf.category?.toLowerCase().includes(v.toLowerCase())
            const tagMatch = tagsArray.some((tag: string) => tag.toLowerCase().includes(v.toLowerCase()))

            if (titleMatch || descMatch || categoryMatch || tagMatch) {
              console.log(`✅ 匹配到工作流 [${wf.title}]`, {
                关键词: key,
                匹配值: v,
                匹配字段: {
                  标题: titleMatch,
                  描述: descMatch,
                  分类: categoryMatch,
                  标签: tagMatch,
                  标签数组: tagsArray
                }
              })
              return true
            }
            return false
          })

          if (matched) return true
        }
      }
      return false
    })

    console.log('📦 关键词匹配的工作流：', matchedWorkflows.map(wf => wf.title))

    // 转换为推荐卡片格式（最多显示 2 个）
    matchedWorkflows.slice(0, 2).forEach(wf => {
      recommendedItems.push({
        itemType: 'workflow',
        id: wf.id,
        title: wf.title,
        description: wf.description || '',
        category: wf.category || wf.tags?.[0] || '其他',
      } as any)
    })

    return recommendedItems
  }

  const handleAddWorkflow = async (workflow: WorkflowCard) => {
    try {
      // 检查是否已经在本地工具箱中
      const existingWorkflow = workflows.find((wf) => wf.id === workflow.id)
      if (existingWorkflow) {
        console.log('工作流已在工具箱中')
        setShowLibrary(false)
        return
      }

      // 调用克隆API，将工作流克隆到用户账户
      console.log('正在克隆工作流到您的账户...', workflow.id)
      const response = await cloneWorkflow(workflow.id)

      // 将克隆后的工作流添加到本地状态
      const clonedWorkflow: WorkflowCard = {
        id: response.workflow.id, // 使用新的ID
        title: response.workflow.title,
        description: response.workflow.description || workflow.description,
        category: workflow.category || '其他',
        icon: workflow.icon,
        color: workflow.color,
        tags: Array.isArray(response.workflow.tags) ? response.workflow.tags : (workflow.tags || []),
        tools: workflow.tools || [],
        usageCount: 0,
        favorite: false,
      }

      setWorkflows((prev) => [...prev, clonedWorkflow])

      // 显示成功提示
      if (response.isExisting) {
        console.log('✅ 使用已有的工作流副本')
      } else {
        console.log('✅ 工作流已成功克隆到您的账户')
      }

      setShowLibrary(false)
    } catch (error) {
      console.error('克隆工作流失败:', error)
      // 失败时，显示错误提示但仍添加到本地（降级处理）
      setWorkflows((prev) => {
        if (prev.find((wf) => wf.id === workflow.id)) {
          return prev
        }
        return [...prev, workflow]
      })
      setShowLibrary(false)
    }
  }

  const handleAddAITool = (tool: AIToolCard) => {
    setAITools((prev) => {
      if (prev.find((t) => t.id === tool.id)) {
        return prev
      }
      return [...prev, tool]
    })
    // 不自动选中，需要用户手动点击"设为当前"
    setShowLibrary(false)
  }

  const handleWorkflowToolExecution = async (workflow: WorkflowCard, tool?: WorkflowTool) => {
    await handleAddWorkflow(workflow)
    simulateWorkflowExecution(workflow, tool)
  }

  // 打开分类选择器
  const handleOpenCategorySelector = (workflow: WorkflowCard, event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    setButtonPosition({
      top: rect.top,
      left: rect.right + 8 // 加号右边8px处
    })
    setWorkflowToSave(workflow)
    setShowCategorySelector(true)
  }

  // 选择具体工作并保存
  const handleSaveToJob = async (role: string, job: string) => {
    if (!workflowToSave) return

    // 这里可以添加实际的保存逻辑（比如调用API保存到后端）
    console.log(`保存工作流"${workflowToSave.title}"到角色"${role}"的工作"${job}"`)

    // 同时添加到工具箱
    await handleAddWorkflow(workflowToSave)

    // 关闭弹窗并清空所有状态
    setShowCategorySelector(false)
    setWorkflowToSave(null)
    setSelectedRole(null)
    setButtonPosition(null)
  }

  // 收藏/取消收藏工作流
  const handleToggleFavorite = async (workflowId: string, event: React.MouseEvent) => {
    event.stopPropagation()

    const isFavorited = favoritedWorkflows.has(workflowId)

    try {
      if (isFavorited) {
        // 取消收藏
        await unfavoriteWorkflow(workflowId)
        setFavoritedWorkflows(prev => {
          const newSet = new Set(prev)
          newSet.delete(workflowId)
          return newSet
        })
      } else {
        // 收藏
        await favoriteWorkflow(workflowId)
        setFavoritedWorkflows(prev => new Set(prev).add(workflowId))
      }
    } catch (error) {
      console.error('收藏操作失败:', error)
      // 可以在这里添加错误提示
    }
  }

  // 创建新对话
  const handleCreateNewChat = async () => {
    // 先清空所有内容（无论 API 是否成功都清空）
    setMessages([])
    setExecutionResults([])
    setWorkflows([])
    setAITools([])
    setSelectedWorkflow(null)
    setSelectedAITool(null)
    setUploadedFiles([])
    setInputValue('')
    setError(null)
    setShowSessionList(false)

    try {
      const newSession = await createChatSession('新对话')
      setCurrentSessionId(newSession.id)

      // 更新会话列表
      const sessions = await getChatSessions()
      setChatSessions(sessions)
    } catch (error) {
      console.error('创建新对话失败:', error)
    }
  }

  // 切换对话会话
  const handleSwitchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    const session = chatSessions.find(s => s.id === sessionId)
    if (session) {
      setMessages(session.messages as any[])
    }

    // 切换会话时清空其他内容，每个会话有独立的状态
    setExecutionResults([])
    setWorkflows([])
    setSelectedWorkflow(null)
    setUploadedFiles([])
    setInputValue('')
    setShowSessionList(false)
  }

  // 删除对话会话
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteChatSession(sessionId)

      // 更新会话列表
      const sessions = await getChatSessions()
      setChatSessions(sessions)

      // 如果删除的是当前会话，创建新会话
      if (sessionId === currentSessionId) {
        await handleCreateNewChat()
      }
    } catch (error) {
      console.error('删除对话失败:', error)
    }
  }

  const handleExecuteWorkflow = () => {
    // 检查是否有选中的工作流或AI工具
    if ((!selectedWorkflow && !selectedAITool) || isExecuting) return
    setIsExecuting(true)

    setTimeout(() => {
      const newResults: ExecutionResult[] = []

      // 如果选中了工作流
      if (selectedWorkflow) {
        newResults.push({
          type: 'text',
          content: `工作流「${selectedWorkflow.title}」已完成。\n\n输出内容基于最近一次对话的需求。`
        })

        if (selectedWorkflow.category.includes('图像')) {
          newResults.push({
            type: 'image',
            content: `https://picsum.photos/seed/${selectedWorkflow.id}-${Date.now()}/600/360`,
            caption: '示例图片结果'
          })
        }
      }

      // 如果选中了AI工具
      if (selectedAITool) {
        newResults.push({
          type: 'text',
          content: `AI工具「${selectedAITool.name}」已完成。\n\n${selectedAITool.description}\n\n输出内容基于最近一次对话的需求。`
        })

        // 如果是图像类AI工具，也添加图片结果
        if (selectedAITool.category.includes('图像') || selectedAITool.name.includes('Midjourney') || selectedAITool.name.includes('DALL-E')) {
          newResults.push({
            type: 'image',
            content: `https://picsum.photos/seed/${selectedAITool.id}-${Date.now()}/600/360`,
            caption: `由 ${selectedAITool.name} 生成`
          })
        }
      }

      // 追加新结果到现有结果中，而不是替换
      setExecutionResults(prev => [...prev, ...newResults])
      setIsExecuting(false)
    }, 1200)
  }

  // 文件上传处理函数
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles = Array.from(files)
      setUploadedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleFileRemove = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files) {
      const newFiles = Array.from(files)
      setUploadedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ')

  // 统一样式系统 - 增强版
  const panelBaseClass =
    'flex h-full flex-col overflow-hidden rounded-3xl border border-violet-100 bg-white'
  const primaryButtonClasses =
    'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-bold transition-all duration-200 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl hover:from-violet-700 hover:to-indigo-700 hover:shadow-2xl hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100'
  const showLegacyPanels = false

  if (isEmbeddedMode) {
    return (
      <div className="flex h-screen flex-col bg-gradient-to-br from-white via-violet-50/30 to-white">
        {/* 对话消息区域 */}
        <div
          className={cn(
            'flex-1 overflow-y-auto px-4 py-4',
            messages.length === 0 ? 'flex items-center justify-center' : 'space-y-4'
          )}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center w-full max-w-md mx-auto">
              <div className="rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 p-4 shadow-xl mb-6">
                <Bot className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">AI 工作流助手</h3>
              <p className="text-sm leading-relaxed text-slate-600 mb-6">
                描述你想完成的任务，我会为你推荐并生成合适的工作流
              </p>
              <div className="flex items-center gap-2 text-xs text-violet-600 font-semibold bg-violet-50 px-4 py-2 rounded-full border border-violet-100">
                <Sparkles className="h-3.5 w-3.5" />
                <span>智能推荐 · 快速生成</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-w-3xl mx-auto pb-4">
              {messages.map((message, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'rounded-full p-1.5 shadow-sm',
                        message.role === 'user'
                          ? 'bg-violet-100 text-violet-600'
                          : 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white'
                      )}
                    >
                      {message.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                    </div>
                    <span className="text-xs font-semibold text-slate-600">
                      {message.role === 'user' ? '你' : 'AI 助手'}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 shadow-sm',
                      message.role === 'user'
                        ? 'bg-violet-50 border border-violet-100 ml-8'
                        : 'bg-white border border-slate-200'
                    )}
                  >
                    {message.role === 'user' ? (
                      <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ node, ...props }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed text-slate-800" {...props} />,
                          code: ({ node, ...props }) => {
                            const inline = (props as any).inline
                            return inline ? (
                              <code className="px-1.5 py-0.5 rounded bg-violet-50 text-xs font-mono text-violet-700" {...props} />
                            ) : (
                              <code className="block p-3 my-2 rounded-lg bg-slate-50 text-xs font-mono overflow-x-auto" {...props} />
                            )
                          },
                          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-1 space-y-1 text-sm text-slate-700" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-1 space-y-1 text-sm text-slate-700" {...props} />
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 输入区域 - 固定在底部 */}
        <div className="flex-shrink-0 border-t border-slate-200/80 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-lg">
          {/* 错误提示 */}
          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600 max-w-3xl mx-auto">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-end gap-2 max-w-3xl mx-auto">
            <textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={2}
              placeholder="输入你的需求，按 Enter 发送..."
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-violet-300 focus:ring-2 focus:ring-violet-100 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !inputValue.trim()}
              className="inline-flex h-[52px] w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md transition-all hover:from-violet-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const containerClass = 'flex h-[calc(100vh-64px)] flex-col bg-gradient-to-br from-slate-50 via-violet-50/20 to-slate-50'
  const mainClassName = 'grid flex-1 gap-2 overflow-hidden px-2 pb-3 pt-3 lg:gap-2.5 lg:px-3 xl:px-4 xl:grid-cols-[1.2fr_0.8fr_1.2fr]'

  return (
    <div className={containerClass}>
      <main className={mainClassName}>
        {/* 会话面板 */}
        <section className={`${panelBaseClass} w-full`}>
          <header className="flex items-center justify-between border-b border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50/50 px-3 py-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">AI 对话</h2>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">输入需求获取建议</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSessionList((prev) => !prev)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-violet-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 ring-2 ring-violet-100 transition-all duration-200"
                title="对话历史"
              >
                <History className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleCreateNewChat}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-violet-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 ring-2 ring-violet-100 transition-all duration-200"
                title="创建新对话"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className={cn("flex-1 overflow-y-auto px-2.5 py-2.5", messages.length === 0 ? "flex items-center justify-center" : "space-y-2")}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-violet-200 bg-gradient-to-br from-violet-100 to-indigo-100 px-5 py-8 text-center max-w-lg">
                <div className="rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 p-3 shadow-2xl mb-4 ring-4 ring-violet-200">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-2">开始与 AI 对话</p>
                <p className="text-base leading-relaxed text-slate-700 max-w-md">
                  描述你想完成的任务，我会为你推荐合适的工作流并协助执行
                </p>
                <div className="mt-5 flex items-center gap-3 text-sm text-violet-700 font-bold bg-white px-5 py-2.5 rounded-full">
                  <Sparkles className="h-4 w-4" />
                  <span>智能推荐 · 快速执行</span>
                </div>
              </div>
            )}

            {messages.map((message, idx) => (
              <div key={idx} className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                  <div
                    className={cn(
                      'rounded-lg p-1.5',
                      message.role === 'user' ? 'bg-violet-100 text-violet-600' : 'bg-indigo-100 text-indigo-600'
                    )}
                  >
                    {message.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>
                  <span>{message.role === 'user' ? '你' : 'AI 助手'}</span>
                </div>
                {message.role === 'user' ? (
                  <p className="max-w-[85%] text-base font-medium leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {message.content}
                  </p>
                ) : (
                  <div className="max-w-[85%] text-base leading-relaxed text-slate-800">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // 自定义样式 - 更紧凑的布局
                        p: ({node, ...props}) => <p className="mb-2 leading-7 last:mb-0" {...props} />,
                        code: ({node, ...props}) => {
                          const inline = (props as any).inline
                          return inline ? (
                            <code className="px-1.5 py-0.5 rounded bg-slate-100 text-sm font-mono text-red-600" {...props} />
                          ) : (
                            <code className="block p-3 my-2 rounded-lg bg-slate-100 text-sm font-mono overflow-x-auto" {...props} />
                          )
                        },
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-0.5" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-0.5" {...props} />,
                        li: ({node, ...props}) => <li className="leading-6" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-base font-bold mb-2 mt-2 first:mt-0" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-300 pl-4 italic my-2" {...props} />,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}

                {/* 推荐项卡片（AI工具和工作流）*/}
                {message.recommendedItems && message.recommendedItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      {message.recommendedItems.slice(0, expandedRecommendations.get(idx) || 4).map((item) => {
                        if (item.itemType === 'ai-tool') {
                          // AI工具卡片
                          const tool = item as AIToolCard & { itemType: 'ai-tool' }
                          return (
                            <div
                              key={tool.id}
                              className="group relative flex h-full flex-col rounded-lg border border-dashed border-cyan-200 bg-gradient-to-br from-white to-cyan-50 p-3 shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-2xl"
                              draggable={true}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('ai-tool', JSON.stringify(tool))
                              }}
                              onClick={() => {
                                setSelectedAIToolDetail(tool)
                              }}
                            >
                              {/* 标题行：Logo + 名称 + 分类 */}
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="text-lg">{tool.logo || '🤖'}</span>
                                <h4 className="text-sm font-bold text-slate-900">{tool.name}</h4>
                                <span className="text-[10px] font-bold text-cyan-600 bg-cyan-100 px-1.5 py-0.5 rounded">
                                  {tool.category}
                                </span>
                              </div>

                              {/* 描述 */}
                              <p className="mb-2 text-xs leading-snug text-slate-600 line-clamp-2">{tool.description}</p>

                              {/* 能力标签 */}
                              {tool.capabilities && tool.capabilities.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-1.5">
                                  {tool.capabilities.slice(0, 3).map((capability, capIdx) => (
                                    <span
                                      key={capIdx}
                                      className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-cyan-600"
                                    >
                                      {capability}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* 按钮行 */}
                              <div className="mt-auto flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAddAITool(tool)
                                  }}
                                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
                                >
                                  <Plus className="h-3 w-3" />
                                  使用此工具
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedAIToolDetail(tool)
                                  }}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-200 bg-white text-cyan-600 hover:bg-cyan-50 hover:scale-110 transition-all"
                                  title="查看详情"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleToggleFavorite(tool.id, e)}
                                  className={cn(
                                    "inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-all",
                                    favoritedWorkflows.has(tool.id)
                                      ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                      : "border-rose-200 bg-white text-rose-500 hover:bg-rose-50 hover:scale-110"
                                  )}
                                  title={favoritedWorkflows.has(tool.id) ? "取消收藏" : "收藏"}
                                >
                                  <Heart className={cn("h-3.5 w-3.5", favoritedWorkflows.has(tool.id) && "fill-rose-600")} />
                                </button>
                              </div>
                            </div>
                          )
                        } else {
                          // 工作流卡片
                          const workflow = item as WorkflowCard & { itemType: 'workflow' }
                          return (
                            <div
                              key={workflow.id}
                              className="group relative flex h-full flex-col rounded-lg border border-dashed border-violet-200 bg-gradient-to-br from-white to-violet-50 p-3 shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-2xl"
                              draggable
                              onClick={() => setSelectedWorkflowDetail(workflow)}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('workflow', JSON.stringify(workflow))
                              }}
                            >
                              {/* 标题行：图标 + 标题 + 分类 */}
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Sparkles className="h-4 w-4 text-violet-500 flex-shrink-0" />
                                <h4 className="text-sm font-bold text-slate-900">{workflow.title}</h4>
                                <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded">
                                  {workflow.category}
                                </span>
                              </div>

                              {/* 描述 */}
                              <p className="mb-2 text-xs leading-snug text-slate-600 line-clamp-2">{workflow.description}</p>

                              {/* 使用场景标签 */}
                              {workflow.useCases && workflow.useCases.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-1.5">
                                  {workflow.useCases.slice(0, 3).map((useCase, ucIdx) => (
                                    <span
                                      key={ucIdx}
                                      className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-violet-600"
                                    >
                                      {useCase}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* AI工具标签（如果有）*/}
                              {workflow.aiTools && workflow.aiTools.length > 0 && (
                                <div className="mb-2 flex items-center gap-1">
                                  <span className="text-[10px] text-slate-500 font-medium">集成:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {workflow.aiTools.slice(0, 3).map((tool, toolIdx) => (
                                      <span
                                        key={toolIdx}
                                        className="inline-flex items-center gap-0.5 text-[10px] font-medium text-violet-600"
                                      >
                                        {tool.logo && <span>{tool.logo}</span>}
                                        <span>{tool.name}</span>
                                      </span>
                                    ))}
                                    {workflow.aiTools.length > 3 && (
                                      <span className="text-[10px] text-slate-500">+{workflow.aiTools.length - 3}</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 按钮行 */}
                              <div className="mt-auto flex items-center gap-2">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    await handleAddWorkflow(workflow)
                                  }}
                                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
                                >
                                  <Plus className="h-3 w-3" />
                                  使用此工作流
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedWorkflowDetail(workflow)
                                  }}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-violet-200 bg-white text-violet-600 hover:bg-violet-50 hover:scale-110 transition-all"
                                  title="查看详情"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleToggleFavorite(workflow.id, e)}
                                  className={cn(
                                    "inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-all",
                                    favoritedWorkflows.has(workflow.id)
                                      ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                      : "border-rose-200 bg-white text-rose-500 hover:bg-rose-50 hover:scale-110"
                                  )}
                                  title={favoritedWorkflows.has(workflow.id) ? "取消收藏" : "收藏"}
                                >
                                  <Heart className={cn("h-3.5 w-3.5", favoritedWorkflows.has(workflow.id) && "fill-rose-600")} />
                                </button>
                              </div>
                            </div>
                          )
                        }
                      })}
                    </div>

                    {/* 更多按钮 */}
                    {message.recommendedItems.length > 4 && (
                      <button
                        onClick={() => {
                          const currentLimit = expandedRecommendations.get(idx) || 4
                          if (currentLimit === 4) {
                            const newMap = new Map(expandedRecommendations)
                            newMap.set(idx, 8)
                            setExpandedRecommendations(newMap)
                          } else {
                            navigate(`/search?q=${encodeURIComponent(message.content)}`)
                          }
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-50 to-indigo-50 border-2 border-violet-200 text-violet-700 font-semibold text-sm hover:from-violet-100 hover:to-indigo-100 hover:border-violet-300 hover:shadow-md transition-all duration-200"
                      >
                        <ChevronDown className="h-4 w-4" />
                        {(expandedRecommendations.get(idx) || 4) === 4 ? '查看更多推荐' : '探索全部相关内容'}
                      </button>
                    )}
                  </div>
                )}

                {/* 推荐工作流卡片 - 优化紧凑版（兼容旧数据）*/}
                {message.recommendedWorkflows && message.recommendedWorkflows.length > 0 && !message.recommendedItems && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      {message.recommendedWorkflows.slice(0, expandedRecommendations.get(idx) || 4).map((workflow) => (
                        <div
                          key={workflow.id}
                          className="group relative rounded-lg border-2 border-violet-200 bg-gradient-to-br from-white to-violet-50 p-3 shadow-lg hover:shadow-2xl hover:border-violet-400 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                          draggable
                          onClick={() => setSelectedWorkflowDetail(workflow)}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('workflow', JSON.stringify(workflow))
                          }}
                        >
                          {/* 右上角加号按钮 - 打开分类选择器 */}
                          <div className="absolute top-2 right-2 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenCategorySelector(workflow, e)
                              }}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:scale-110 transition-all"
                              title="选择分类并保存"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* 标题行：图标 + 标题 + 标签 */}
                          <div className="flex items-center gap-1.5 mb-1.5 pr-8">
                            <Sparkles className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                            <h4 className="text-sm font-bold text-slate-900">{workflow.title}</h4>
                            <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded">
                              {workflow.category}
                            </span>
                          </div>

                          {/* 描述（精简为单行） */}
                          <p className="text-xs text-slate-600 leading-snug mb-2 line-clamp-1">{workflow.description}</p>

                          {/* 关联 AI 工具 */}
                          {(() => {
                            const tools = (workflow.aiTools ?? []) as WorkflowTool[]
                            if (tools.length === 0) {
                              return null
                            }
                            return (
                              <div className="mb-2 flex flex-wrap gap-1.5">
                                {tools.slice(0, 3).map((tool, toolIndex) => (
                                  <button
                                    key={tool.name + toolIndex}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleWorkflowToolExecution(workflow, tool)
                                    }}
                                    className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold text-violet-600 hover:border-violet-300 hover:bg-violet-100 hover:shadow transition-all"
                                    title={`运行 ${tool.name}`}
                                  >
                                    {tool.logo && <span className="text-xs">{tool.logo}</span>}
                                    <span>{tool.name}</span>
                                  </button>
                                ))}
                              </div>
                            )
                          })()}

                          {/* 按钮行：横向排列 */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                await handleAddWorkflow(workflow)
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
                            >
                              <Plus className="h-3 w-3" />
                              添加到工具箱
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedWorkflowDetail(workflow)
                              }}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-violet-200 bg-white text-violet-600 hover:bg-violet-50 hover:scale-110 transition-all"
                              title="查看详情"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleToggleFavorite(workflow.id, e)}
                              className={cn(
                                "inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-all",
                                favoritedWorkflows.has(workflow.id)
                                  ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                  : "border-rose-200 bg-white text-rose-500 hover:bg-rose-50 hover:scale-110"
                              )}
                              title={favoritedWorkflows.has(workflow.id) ? "取消收藏" : "收藏"}
                            >
                              <Heart className={cn("h-3.5 w-3.5", favoritedWorkflows.has(workflow.id) && "fill-rose-600")} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 更多按钮 */}
                    {message.recommendedWorkflows.length > 4 && (
                      <button
                        onClick={() => {
                          const currentLimit = expandedRecommendations.get(idx) || 4
                          if (currentLimit === 4) {
                            // 第一次点击：扩展到8个
                            const newMap = new Map(expandedRecommendations)
                            newMap.set(idx, 8)
                            setExpandedRecommendations(newMap)
                          } else {
                            // 第二次点击：跳转到探索页面
                            navigate(`/search?q=${encodeURIComponent(message.content)}`)
                          }
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-50 to-indigo-50 border-2 border-violet-200 text-violet-700 font-semibold text-sm hover:from-violet-100 hover:to-indigo-100 hover:border-violet-300 hover:shadow-md transition-all duration-200"
                      >
                        <ChevronDown className="h-4 w-4" />
                        {(expandedRecommendations.get(idx) || 4) === 4 ? '查看更多推荐' : '探索全部相关内容'}
                      </button>
                    )}
                  </div>
                )}

                {message.toolExecutions && message.toolExecutions.length > 0 && (
                  <div className="mt-3 space-y-2 w-full">
                    {message.toolExecutions.map((execution) => (
                      <div
                        key={execution.id}
                        className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 px-4 py-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/90 shadow-sm">
                              <Play className="h-4 w-4 text-white" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-sm font-semibold text-emerald-800">{execution.toolName}</div>
                              <div className="text-[11px] text-emerald-700">
                                工作流：{execution.workflowTitle}
                                {execution.toolType && ` · ${execution.toolType === 'model' ? 'AI模型' : 'AI工具'}`}
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-medium text-emerald-700">
                            {formatTimestamp(execution.startedAt)} → {formatTimestamp(execution.finishedAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-emerald-800 leading-relaxed whitespace-pre-line">
                          {execution.output}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-3 shadow-md border border-violet-200 animate-pulse">
                <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                <span className="text-sm font-semibold text-violet-700">AI 正在思考...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="mx-6 mb-4 flex items-center gap-3 rounded-xl border-2 border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-md">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <footer className="border-t border-slate-200 bg-gradient-to-b from-white to-slate-50/50 px-3 py-2.5">
            {/* 已上传文件列表 */}
            {uploadedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-50 border border-violet-200 px-3 py-1.5 text-xs"
                  >
                    <File className="h-3.5 w-3.5 text-violet-600" />
                    <span className="font-medium text-slate-700 max-w-[150px] truncate">{file.name}</span>
                    <span className="text-slate-500">({formatFileSize(file.size)})</span>
                    <button
                      onClick={() => handleFileRemove(index)}
                      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-violet-200 text-violet-700 hover:bg-violet-300 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              className="flex items-center gap-3"
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
            >
              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* 输入框容器 - 包含回形针按钮 */}
              <div className="relative flex-1 h-[90px]">
                {/* 回形针按钮 - 在输入框左侧内部 */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
                  title="上传文件"
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                <textarea
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  rows={3}
                  placeholder="✨ 描述你想完成的任务... (支持拖拽文件)"
                  className="w-full h-full resize-none rounded-xl border-2 border-slate-200 bg-white pl-12 pr-4 py-3.5 text-base leading-relaxed text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-100 focus:shadow-md focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !inputValue.trim()}
                className="inline-flex h-[90px] w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </footer>
        </section>

        {!isEmbeddedMode && showLegacyPanels && (
          <section className={panelBaseClass}>
          <header className="flex items-center justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-3 py-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">实现工具</h2>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">选择并配置工具 · 拖拽排序</p>
            </div>
            <button
              type="button"
              onClick={() => setShowLibrary(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-indigo-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 ring-2 ring-indigo-100 transition-all duration-200"
            >
              <Plus className="h-3.5 w-3.5" />
              选择已有工具
            </button>
          </header>

          <div
            className="flex-1 space-y-2 overflow-y-auto px-2.5 py-2.5"
            onDragOver={(e) => {
              e.preventDefault()
              e.currentTarget.classList.add('bg-violet-50')
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('bg-violet-50')
            }}
            onDrop={async (e) => {
              e.preventDefault()
              e.currentTarget.classList.remove('bg-violet-50')

              // 尝试获取工作流数据
              const workflowData = e.dataTransfer.getData('workflow')
              if (workflowData) {
                try {
                  const workflow = JSON.parse(workflowData)
                  await handleAddWorkflow(workflow)
                } catch (err) {
                  console.error('Failed to parse workflow data:', err)
                }
                return
              }

              // 尝试获取AI工具数据
              const aiToolData = e.dataTransfer.getData('ai-tool')
              if (aiToolData) {
                try {
                  const aiTool = JSON.parse(aiToolData)
                  handleAddAITool(aiTool)
                } catch (err) {
                  console.error('Failed to parse AI tool data:', err)
                }
              }
            }}
          >
            {workflows.map((workflow) => {
              const active = selectedWorkflow?.id === workflow.id
              return (
                <article
                  key={workflow.id}
                  className={cn(
                    'rounded-xl border-2 bg-white p-3 text-left shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer',
                    active
                      ? 'border-violet-400 bg-gradient-to-br from-violet-50 to-indigo-50 shadow-lg shadow-violet-200/50 ring-2 ring-violet-200'
                      : 'border-violet-200 hover:border-violet-300'
                  )}
                  onClick={() => {
                    if (active) {
                      // 如果已选中，则取消选中
                      setSelectedWorkflow(null)
                    } else {
                      // 如果未选中，则选中并取消AI工具的选中
                      setSelectedWorkflow(workflow)
                      setSelectedAITool(null)
                    }
                  }}
                >
                  {/* 标题行：图标 + 标题 + 分类 */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <Sparkles className="h-4 w-4 text-violet-500 flex-shrink-0" />
                      <h4 className="text-sm font-bold text-slate-900 truncate">{workflow.title}</h4>
                      <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded flex-shrink-0">
                        {workflow.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setWorkflows((prev) => prev.filter((wf) => wf.id !== workflow.id))
                        if (active) setSelectedWorkflow(null)
                      }}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-rose-100 hover:text-rose-600 flex-shrink-0"
                      title="移除"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* 描述 */}
                  <p className="text-xs text-slate-600 leading-snug mb-2 line-clamp-2">{workflow.description}</p>

                  {/* 使用场景标签 */}
                  {workflow.useCases && workflow.useCases.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {workflow.useCases.slice(0, 3).map((useCase, ucIdx) => (
                        <span
                          key={ucIdx}
                          className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-violet-600"
                        >
                          {useCase}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* AI工具标签（如果有）*/}
                  {workflow.aiTools && workflow.aiTools.length > 0 && (
                    <div className="mb-2 flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-medium">集成:</span>
                      <div className="flex flex-wrap gap-1">
                        {workflow.aiTools.slice(0, 3).map((tool, toolIdx) => (
                          <span
                            key={toolIdx}
                            className="inline-flex items-center gap-0.5 text-[10px] font-medium text-violet-600"
                          >
                            {tool.logo && <span>{tool.logo}</span>}
                            <span>{tool.name}</span>
                          </span>
                        ))}
                        {workflow.aiTools.length > 3 && (
                          <span className="text-[10px] text-slate-500">+{workflow.aiTools.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 按钮行 */}
                  <div className="flex items-center justify-between pt-2 border-t border-violet-100">
                    {active && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-md">
                        <Sparkles className="h-2.5 w-2.5" />
                        已选中
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedWorkflowDetail(workflow)
                      }}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-[10px] font-medium text-violet-600 hover:bg-violet-50 transition-all"
                    >
                      <Eye className="h-3 w-3" />
                      查看详情
                    </button>
                  </div>
                </article>
              )
            })}

            {/* AI工具列表 */}
            {aiTools.map((tool) => {
              const active = selectedAITool?.id === tool.id
              return (
                <article
                  key={tool.id}
                  className={cn(
                    'rounded-xl border-2 bg-white p-3 text-left shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer',
                    active
                      ? 'border-cyan-400 bg-gradient-to-br from-cyan-50 to-blue-50 shadow-lg shadow-cyan-200/50 ring-2 ring-cyan-200'
                      : 'border-cyan-200 hover:border-cyan-300'
                  )}
                  onClick={() => {
                    if (active) {
                      // 如果已选中，则取消选中
                      setSelectedAITool(null)
                    } else {
                      // 如果未选中，则选中并取消工作流的选中
                      setSelectedAITool(tool)
                      setSelectedWorkflow(null)
                    }
                  }}
                >
                  {/* 标题行：Logo + 名称 + 分类 */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0">{tool.logo || '🤖'}</span>
                      <h4 className="text-sm font-bold text-slate-900 truncate">{tool.name}</h4>
                      <span className="text-[10px] font-bold text-cyan-600 bg-cyan-100 px-1.5 py-0.5 rounded flex-shrink-0">
                        {tool.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setAITools((prev) => prev.filter((t) => t.id !== tool.id))
                        if (active) setSelectedAITool(null)
                      }}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-rose-100 hover:text-rose-600 flex-shrink-0"
                      title="移除"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* 描述 */}
                  <p className="text-xs text-slate-600 leading-snug mb-2 line-clamp-2">{tool.description}</p>

                  {/* 能力标签 */}
                  {tool.capabilities && tool.capabilities.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {tool.capabilities.slice(0, 3).map((capability, capIdx) => (
                        <span
                          key={capIdx}
                          className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-cyan-600"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 按钮行 */}
                  <div className="flex items-center justify-between pt-2 border-t border-cyan-100">
                    {active && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded-md">
                        <Sparkles className="h-2.5 w-2.5" />
                        已选中
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedAIToolDetail(tool)
                      }}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg border border-cyan-200 bg-white px-2.5 py-1 text-[10px] font-medium text-cyan-600 hover:bg-cyan-50 transition-all"
                    >
                      <Eye className="h-3 w-3" />
                      查看详情
                    </button>
                  </div>
                </article>
              )
            })}

            {workflows.length === 0 && aiTools.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-violet-50/30 px-5 py-6 text-center">
                <div className="rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 p-2.5 shadow-lg shadow-indigo-500/25 mb-3">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <p className="text-lg font-bold text-slate-900 mb-2">等待选择工具</p>
                <p className="text-sm leading-relaxed text-slate-600 max-w-xs mb-3">
                  在左侧 AI 对话中选择推荐的工作流或AI工具
                  <br />
                  或点击右上角 <span className="font-semibold text-indigo-600">+</span> 号手动添加
                </p>
                <div className="inline-flex items-center gap-2 text-xs text-indigo-600 font-medium bg-indigo-100 px-3 py-1.5 rounded-lg">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>支持拖拽添加</span>
                </div>
              </div>
            )}
          </div>

          <footer className="border-t border-slate-200 bg-gradient-to-b from-white to-slate-50/50 px-3 py-2.5">
            <button
              type="button"
              onClick={handleExecuteWorkflow}
              disabled={(!selectedWorkflow && !selectedAITool) || isExecuting}
              className={primaryButtonClasses + ' w-full'}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  执行中...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  {selectedWorkflow ? '执行工作流' : selectedAITool ? '执行AI工具' : '选择工具'}
                </>
              )}
            </button>
          </footer>
          </section>
        )}

        {!isEmbeddedMode && showLegacyPanels && (
          <section className={panelBaseClass}>
            <header className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">成果预览</h2>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">查看生成内容 · 下载文件</p>
            </header>

            <div className="flex-1 space-y-2.5 overflow-y-auto px-2.5 py-2.5">
              {executionResults.length === 0 && !isExecuting && (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 px-5 py-6 text-center">
                  <div className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 p-2.5 shadow-lg shadow-emerald-500/25 mb-3">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-lg font-bold text-slate-900 mb-2">等待成果预览</p>
                  <p className="text-sm leading-relaxed text-slate-600 max-w-xs mb-3">
                    选择工作流或AI工具并点击 <span className="font-semibold text-emerald-600">执行</span>
                    <br />
                    生成的文本、图片或文件会出现在这里
                  </p>
                  <div className="flex items-center gap-6 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-emerald-500" />
                      <span>文本</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Image className="h-4 w-4 text-emerald-500" />
                      <span>图片</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                    <Download className="h-4 w-4 text-emerald-500" />
                    <span>文件</span>
                  </div>
                </div>
              </div>
            )}

            {isExecuting && (
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 px-4 py-3 border border-violet-200 shadow-md animate-pulse">
                <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                <span className="text-sm font-semibold text-violet-700">工作流执行中，请稍候…</span>
              </div>
            )}

            {executionResults.map((result, idx) => {
              if (result.type === 'text') {
                return (
                  <div
                    key={`text-${idx}`}
                    className="animate-in fade-in slide-in-from-bottom-2"
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{result.content}</p>
                  </div>
                )
              }

              return (
                <div
                  key={`image-${idx}`}
                  className="animate-in fade-in slide-in-from-bottom-2"
                >
                  <img
                    src={result.content}
                    alt={result.caption ?? '生成结果'}
                    className="w-full"
                  />
                </div>
              )
            })}
          </div>
        </section>
        )}
      </main>

      {/* 推荐工作流抽屉 */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-10 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <header className="flex items-center justify-between border-b-2 border-slate-200 bg-gradient-to-r from-violet-50 to-indigo-50 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/25">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">用户工作流库</h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">选择工作流添加到实现工具</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLibrary(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-md transition-all hover:bg-slate-100 hover:text-slate-700 hover:scale-110"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="grid max-h-[60vh] grid-cols-2 gap-5 overflow-y-auto px-8 py-8">
              {userWorkflows.map((workflow) => (
                <button
                  key={workflow.id}
                  type="button"
                  onClick={() => handleAddWorkflow({
                    id: workflow.id,
                    title: workflow.title,
                    description: workflow.description,
                    category: workflow.category,
                    author: workflow.author?.name,
                    icon: '📋',
                    color: '#8B5CF6',
                    tags: Array.isArray(workflow.tags) ? workflow.tags : [],
                    tools: [],
                    usageCount: 0,
                    favorite: false
                  })}
                  className="group flex flex-col gap-3 h-[140px] rounded-xl border-2 border-slate-200 bg-white p-5 text-left shadow-md transition-all duration-200 hover:-translate-y-1 hover:border-violet-400 hover:scale-[1.02] hover:shadow-xl"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-1">
                        {workflow.title}
                      </h4>
                      <span className="text-[10px] font-bold text-violet-500 bg-violet-100 px-2 py-0.5 rounded-md flex-shrink-0">
                        {workflow.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-1">{workflow.description}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 self-start text-[10px] font-semibold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg">
                    <PlusCircle className="h-3 w-3" />
                    点击添加
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 工作流详情弹窗 */}
      {selectedWorkflowDetail && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 py-8 animate-in fade-in duration-200"
          onClick={() => setSelectedWorkflowDetail(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <header className="border-b border-slate-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{selectedWorkflowDetail.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedWorkflowDetail.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedWorkflowDetail(null)}
                  className="ml-4 inline-flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-slate-600">
                {/* Author */}
                {selectedWorkflowDetail.author && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-900">{selectedWorkflowDetail.author}</span>
                    {selectedWorkflowDetail.authorLevel && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">{selectedWorkflowDetail.authorLevel}</span>
                    )}
                    {selectedWorkflowDetail.authorBadge && (
                      <span className="text-xs">{selectedWorkflowDetail.authorBadge}</span>
                    )}
                  </div>
                )}

                {/* Rating */}
                {selectedWorkflowDetail.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{selectedWorkflowDetail.rating}</span>
                    {selectedWorkflowDetail.totalReviews && (
                      <span className="text-slate-500">({selectedWorkflowDetail.totalReviews})</span>
                    )}
                  </div>
                )}

                {/* Usage count */}
                {selectedWorkflowDetail.usageCount && (
                  <div className="flex items-center gap-1">
                    <span>使用 {selectedWorkflowDetail.usageCount} 次</span>
                  </div>
                )}

                {/* Update time */}
                {selectedWorkflowDetail.updatedAt && (
                  <div className="flex items-center gap-1">
                    <span>更新于 {selectedWorkflowDetail.updatedAt}</span>
                  </div>
                )}
              </div>
            </header>

            {/* Content */}
            <div className="overflow-y-auto px-6 py-4 space-y-4">

              {/* Examples */}
              {selectedWorkflowDetail.examples && selectedWorkflowDetail.examples.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-2">使用案例</h4>
                  <div className="space-y-2">
                    {selectedWorkflowDetail.examples.map((example, index) => (
                      <div key={index} className="p-3 rounded border border-slate-200 bg-slate-50">
                        <h5 className="text-xs font-medium text-slate-900 mb-1">{example.title}</h5>
                        <p className="text-xs text-slate-600">{example.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {selectedWorkflowDetail.reviews && selectedWorkflowDetail.reviews.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-2">用户评价</h4>
                  <div className="space-y-2">
                    {selectedWorkflowDetail.reviews.map((review, index) => (
                      <div key={index} className="p-3 rounded border border-slate-200 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                              {review.userName.charAt(0)}
                            </div>
                            <div>
                              <span className="text-xs font-medium text-slate-900">{review.userName}</span>
                              <span className="text-xs text-slate-500 ml-2">{review.date}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 工作流预览区域 */}
              {selectedWorkflowDetail.nodes && selectedWorkflowDetail.nodes.length > 0 && (
                <div className="border-t border-slate-200 pt-4">
                  <div
                    className="flex items-center gap-2 mb-3 cursor-pointer"
                    onClick={() => setShowWorkflowPreview(!showWorkflowPreview)}
                  >
                    <h4 className="text-sm font-medium text-slate-700">工作流配置</h4>
                    <button
                      className="ml-auto text-slate-400 hover:text-slate-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowWorkflowPreview(!showWorkflowPreview)
                      }}
                    >
                      {showWorkflowPreview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>

                  {showWorkflowPreview && (
                    <div className="flex gap-4 h-[500px]">
                    {/* 左侧：节点流程图 */}
                    <div className="w-1/2 bg-slate-50 rounded border border-slate-200 overflow-y-auto p-4">
                      <div className="space-y-2">
                        {selectedWorkflowDetail.nodes.map((node, index) => (
                          <div key={node.id}>
                            {/* 节点卡片 */}
                            <div
                              onClick={() => {
                                setSelectedNodeId(node.id)
                                // 初始化编辑参数
                                if (!editedNodeParams[node.id]) {
                                  setEditedNodeParams(prev => ({
                                    ...prev,
                                    [node.id]: JSON.parse(JSON.stringify(node.params))
                                  }))
                                }
                              }}
                              className={cn(
                                "cursor-pointer rounded border p-3 transition-colors",
                                selectedNodeId === node.id
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base">{node.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm text-slate-900 truncate">
                                    {node.name}
                                  </h5>
                                  <p className="text-xs text-slate-500 truncate">{node.description}</p>
                                </div>
                              </div>
                            </div>

                            {/* 连接线 */}
                            {index < selectedWorkflowDetail.nodes!.length - 1 && (
                              <div className="flex justify-center py-1">
                                <div className="w-0.5 h-3 bg-slate-300"></div>
                              </div>
                            )}
                          </div>
                      ))}
                    </div>
                  </div>

                  {/* 右侧：节点详情面板 */}
                  <div className="w-1/2 bg-white rounded border border-slate-200 overflow-y-auto p-4">
                    {selectedNodeId ? (
                      (() => {
                        const selectedNode = selectedWorkflowDetail.nodes!.find(n => n.id === selectedNodeId)
                        if (!selectedNode) return null

                        const currentParams = editedNodeParams[selectedNodeId] || selectedNode.params

                        return (
                          <div className="space-y-3">
                            {/* 节点标题 */}
                            <div className="pb-3 border-b border-slate-200">
                              <h5 className="text-sm font-medium text-slate-900">{selectedNode.name}</h5>
                              <p className="text-xs text-slate-500 mt-0.5">{selectedNode.description}</p>
                            </div>

                            {/* 模型选择 */}
                            <div className="space-y-3">
                              {currentParams.filter(p => p.name === 'model').map((param, idx) => (
                                <div key={param.name} className="space-y-1.5">
                                  <label className="text-xs font-medium text-slate-700">
                                    {param.label}
                                  </label>

                                  {/* 根据类型渲染不同的输入组件 */}
                                  {param.type === 'text' && (
                                    <input
                                      type="text"
                                      value={String(param.value)}
                                      disabled={!param.editable}
                                      onChange={(e) => {
                                        const newParams = [...currentParams]
                                        newParams[idx] = { ...param, value: e.target.value }
                                        setEditedNodeParams(prev => ({
                                          ...prev,
                                          [selectedNodeId]: newParams
                                        }))
                                      }}
                                      placeholder={param.placeholder}
                                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-white"
                                    />
                                  )}

                                  {param.type === 'number' && (
                                    <input
                                      type="number"
                                      value={Number(param.value)}
                                      disabled={!param.editable}
                                      onChange={(e) => {
                                        const newParams = [...currentParams]
                                        newParams[idx] = { ...param, value: Number(e.target.value) }
                                        setEditedNodeParams(prev => ({
                                          ...prev,
                                          [selectedNodeId]: newParams
                                        }))
                                      }}
                                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-white"
                                    />
                                  )}

                                  {param.type === 'textarea' && (
                                    <textarea
                                      value={String(param.value)}
                                      disabled={!param.editable}
                                      onChange={(e) => {
                                        const newParams = [...currentParams]
                                        newParams[idx] = { ...param, value: e.target.value }
                                        setEditedNodeParams(prev => ({
                                          ...prev,
                                          [selectedNodeId]: newParams
                                        }))
                                      }}
                                      placeholder={param.placeholder}
                                      rows={3}
                                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-white resize-none"
                                    />
                                  )}

                                  {param.type === 'select' && (
                                    <select
                                      value={String(param.value)}
                                      disabled={!param.editable}
                                      onChange={(e) => {
                                        const newParams = [...currentParams]
                                        newParams[idx] = { ...param, value: e.target.value }
                                        setEditedNodeParams(prev => ({
                                          ...prev,
                                          [selectedNodeId]: newParams
                                        }))
                                      }}
                                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-white"
                                    >
                                      {param.options?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                    </select>
                                  )}

                                  {param.type === 'boolean' && (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(param.value)}
                                        disabled={!param.editable}
                                        onChange={(e) => {
                                          const newParams = [...currentParams]
                                          newParams[idx] = { ...param, value: e.target.checked }
                                          setEditedNodeParams(prev => ({
                                            ...prev,
                                            [selectedNodeId]: newParams
                                          }))
                                        }}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-1 focus:ring-blue-200"
                                      />
                                      <span className="text-xs text-slate-600">
                                        {param.value ? '已启用' : '已禁用'}
                                      </span>
                                    </label>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* 节点指令 */}
                            {(() => {
                              const promptParam = currentParams.find(p => p.name === 'prompt')
                              const promptValue = promptParam ? String(promptParam.value) : ''

                              return (
                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-slate-700">
                                    节点指令
                                  </label>
                                  <textarea
                                    value={promptValue}
                                    onChange={(e) => {
                                      const paramIdx = currentParams.findIndex(p => p.name === 'prompt')
                                      if (paramIdx !== -1) {
                                        // 如果已有 prompt 参数，更新它
                                        const newParams = [...currentParams]
                                        newParams[paramIdx] = { ...currentParams[paramIdx], value: e.target.value }
                                        setEditedNodeParams(prev => ({
                                          ...prev,
                                          [selectedNodeId]: newParams
                                        }))
                                      } else {
                                        // 如果没有 prompt 参数，添加一个新的
                                        const newParams = [
                                          ...currentParams,
                                          {
                                            name: 'prompt',
                                            label: 'Prompt',
                                            type: 'textarea' as const,
                                            value: e.target.value,
                                            editable: true,
                                            required: false
                                          }
                                        ]
                                        setEditedNodeParams(prev => ({
                                          ...prev,
                                          [selectedNodeId]: newParams
                                        }))
                                      }
                                    }}
                                    placeholder="请输入节点指令..."
                                    rows={6}
                                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-white resize-none font-mono"
                                  />
                                </div>
                              )
                            })()}

                          </div>
                        )
                      })()
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                        <p className="text-xs">选择左侧节点查看配置</p>
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-6 py-3 flex-shrink-0 bg-slate-50">
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    // 临时应用工作流（仅当前会话有效）
                    sessionStorage.setItem(`workflow_${selectedWorkflowDetail.id}`, JSON.stringify({
                      nodes: selectedWorkflowDetail.nodes,
                      editedParams: editedNodeParams,
                      timestamp: new Date().toISOString()
                    }))

                    // 添加到实现工具
                    await handleAddWorkflow(selectedWorkflowDetail)

                    // 关闭弹窗
                    setSelectedWorkflowDetail(null)

                    // 不需要 alert，工作流会出现在实现工具中
                  }}
                  className="flex-1 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  应用到当前会话
                </button>
                <button
                  onClick={async () => {
                    // 永久保存工作流到工作区
                    const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]')
                    const workflowId = `workflow-${Date.now()}`
                    const workflowToSave = {
                      id: workflowId,
                      originalId: selectedWorkflowDetail.id,
                      name: `${selectedWorkflowDetail.title} (副本)`,
                      nodes: selectedWorkflowDetail.nodes?.map(n => ({ ...n })),
                      editedParams: JSON.parse(JSON.stringify(editedNodeParams)),
                      createdAt: new Date().toISOString()
                    }
                    savedWorkflows.push(workflowToSave)
                    localStorage.setItem('savedWorkflows', JSON.stringify(savedWorkflows))

                    // 同时应用到当前会话
                    sessionStorage.setItem(`workflow_${selectedWorkflowDetail.id}`, JSON.stringify({
                      nodes: selectedWorkflowDetail.nodes,
                      editedParams: editedNodeParams,
                      timestamp: new Date().toISOString()
                    }))

                    // 创建待添加到工作台画布的卡片信息
                    const pendingCards = JSON.parse(localStorage.getItem('pendingWorkspaceCards') || '[]')
                    pendingCards.push({
                      id: workflowId,
                      name: workflowToSave.name,
                      color: '#6366f1', // indigo color
                      description: selectedWorkflowDetail.description || '自定义工作流',
                      createdAt: new Date().toISOString()
                    })
                    localStorage.setItem('pendingWorkspaceCards', JSON.stringify(pendingCards))

                    // 添加到实现工具
                    await handleAddWorkflow(selectedWorkflowDetail)

                    // 关闭弹窗
                    setSelectedWorkflowDetail(null)
                  }}
                  className="flex-1 px-4 py-2 text-xs font-medium text-blue-600 bg-white hover:bg-blue-50 border border-blue-600 rounded transition-colors"
                >
                  保存到我的工作流
                </button>
                <button
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-300 rounded transition-colors"
                >
                  收藏
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portal 渲染的两层选择弹窗 */}
      {showCategorySelector && workflowToSave && buttonPosition && createPortal(
        <div
          className="fixed w-72 rounded-xl bg-white shadow-2xl border-2 border-violet-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[9999]"
          style={{
            top: `${buttonPosition.top}px`,
            left: `${buttonPosition.left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseLeave={() => {
            setShowCategorySelector(false)
            setWorkflowToSave(null)
            setButtonPosition(null)
            setSelectedRole(null)
          }}
        >
          {selectedRole === null ? (
            // 第一层：工作角色选择
            <>
              {/* 头部 */}
              <div className="bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">选择工作角色</h3>
                    <p className="text-[10px] text-violet-100 mt-0.5">第一步：选择你的角色</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCategorySelector(false)
                      setWorkflowToSave(null)
                      setButtonPosition(null)
                      setSelectedRole(null)
                    }}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* 角色列表 */}
              <div className="max-h-80 overflow-y-auto p-2">
                {workspaceContainers.map((role) => (
                  <button
                    key={role.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedRole(role.id)
                    }}
                    className="w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left hover:bg-violet-50 transition-all group border-b border-slate-100 last:border-0"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 shadow-md text-xl flex-shrink-0">
                      {role.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                        {role.name}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {role.description}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-violet-600 transition-colors flex-shrink-0 rotate-[-90deg]" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            // 第二层：具体工作选择
            <>
              {/* 头部 */}
              <div className="bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedRole(null)
                      }}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all flex-shrink-0"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white truncate">
                        {workspaceContainers.find(r => r.id === selectedRole)?.name || ''}
                      </h3>
                      <p className="text-[10px] text-violet-100 mt-0.5">第二步：选择具体工作</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCategorySelector(false)
                      setWorkflowToSave(null)
                      setButtonPosition(null)
                      setSelectedRole(null)
                    }}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all flex-shrink-0 ml-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* 具体工作列表 */}
              <div className="max-h-80 overflow-y-auto p-2">
                {workspaceContainers.find(r => r.id === selectedRole)?.jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSaveToJob(selectedRole, job.id)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left hover:bg-violet-50 hover:text-violet-600 transition-all group"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-indigo-500 shadow-sm">
                      <Plus className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-violet-600">{job.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>,
        document.body
      )}

      {/* 对话历史列表 */}
      {showSessionList && createPortal(
        <div
          className="fixed top-0 left-0 right-0 bottom-0 bg-black/20 z-[9998] animate-in fade-in duration-200"
          onClick={() => setShowSessionList(false)}
        >
          <div
            className="fixed top-24 left-1/2 -translate-x-1/2 w-[500px] max-h-[600px] rounded-2xl bg-white shadow-2xl border-2 border-violet-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 z-[9999]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">对话历史</h3>
                  <p className="text-sm text-violet-100 mt-1">共 {chatSessions.length} 个对话</p>
                </div>
                <button
                  onClick={() => setShowSessionList(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 对话列表 */}
            <div className="max-h-[500px] overflow-y-auto p-4 space-y-2">
              {chatSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-violet-100 p-4 mb-4">
                    <MessageSquare className="h-8 w-8 text-violet-600" />
                  </div>
                  <p className="text-base font-semibold text-slate-900 mb-2">暂无对话记录</p>
                  <p className="text-sm text-slate-500">开始新对话来创建记录</p>
                </div>
              ) : (
                chatSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSwitchSession(session.id)}
                    className={cn(
                      'group relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
                      session.id === currentSessionId
                        ? 'border-violet-400 bg-gradient-to-r from-violet-50 to-indigo-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-violet-300'
                    )}
                  >
                    {/* 当前会话标识 */}
                    {session.id === currentSessionId && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                          当前
                        </span>
                      </div>
                    )}

                    {/* 对话标题 */}
                    <h4 className="text-base font-bold text-slate-900 mb-2 pr-16 line-clamp-1">
                      {session.title || '未命名对话'}
                    </h4>

                    {/* 对话信息 */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{session.messages?.length || 0} 条消息</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>更新于 {new Date(session.updatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* 最后一条消息预览 */}
                    {session.messages && session.messages.length > 0 && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                        {session.messages[session.messages.length - 1].content}
                      </p>
                    )}

                    {/* 删除按钮 */}
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="absolute bottom-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:scale-110 transition-all"
                      title="删除对话"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* AI工具详情弹窗 */}
      {selectedAIToolDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-10 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedAIToolDetail(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <header className="flex items-center justify-between border-b-2 border-slate-200 bg-gradient-to-r from-cyan-50 to-blue-50 px-8 py-6 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25 text-2xl">
                  {selectedAIToolDetail.logo || '🤖'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-1">{selectedAIToolDetail.name}</h3>
                  <span className="text-xs font-semibold text-cyan-600 bg-cyan-100 px-2.5 py-1 rounded-md border border-cyan-200">
                    {selectedAIToolDetail.category}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAIToolDetail(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-md transition-all hover:bg-slate-100 hover:text-slate-700 hover:scale-110"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {/* Content */}
            <div className="overflow-y-auto px-8 py-6 space-y-6">
              {/* Description */}
              <div className="relative p-5 rounded-xl bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 border-2 border-cyan-100 shadow-inner">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-500 rounded-l-xl"></div>
                <p className="text-sm text-slate-700 leading-relaxed font-medium pl-3">{selectedAIToolDetail.description}</p>
              </div>

              {/* Capabilities */}
              {selectedAIToolDetail.capabilities && selectedAIToolDetail.capabilities.length > 0 && (
                <div>
                  <h4 className="text-base font-bold text-slate-900 mb-3">核心能力</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAIToolDetail.capabilities.map((capability, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 rounded-full border-2 border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-600"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Use Cases */}
              {selectedAIToolDetail.useCases && selectedAIToolDetail.useCases.length > 0 && (
                <div>
                  <h4 className="text-base font-bold text-slate-900 mb-3">使用场景</h4>
                  <div className="space-y-2">
                    {selectedAIToolDetail.useCases.map((useCase, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-cyan-50 border border-cyan-100">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-sm text-slate-700 font-medium">{useCase}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prompt */}
              {selectedAIToolDetail.prompt && (
                <div>
                  <h4 className="text-base font-bold text-slate-900 mb-3">工具Prompt</h4>
                  <div className="relative p-4 rounded-xl bg-cyan-50 border-2 border-cyan-100">
                    <p className="text-sm text-slate-700 leading-relaxed font-mono">{selectedAIToolDetail.prompt}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t-2 border-slate-200 bg-gradient-to-br from-slate-50 via-white to-cyan-50 px-8 py-5 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleAddAITool(selectedAIToolDetail)
                    setSelectedAIToolDetail(null)
                  }}
                  className="flex-1 relative overflow-hidden group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-2xl hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-200"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Plus className="h-5 w-5 relative z-10" />
                  <span className="relative z-10">添加到工具箱</span>
                </button>
                <button
                  className="relative overflow-hidden group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-rose-300 bg-gradient-to-br from-white to-rose-50 px-6 py-3.5 text-sm font-bold text-rose-600 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-200/50 hover:scale-105 transition-all duration-200"
                >
                  <Heart className="h-5 w-5 group-hover:fill-rose-600 transition-all" />
                  <span>收藏</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIChatPage
