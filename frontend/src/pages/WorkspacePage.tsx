import { useEffect, useState, useRef, type CSSProperties, KeyboardEvent, FocusEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchWorkspaceLayout,
  saveWorkspaceLayout,
  exportWorkspaceData,
  exportLocalWorkspaceData,
  type CardLayout,
  type WorkspaceSnapshot
} from '../services/workspaceApi'
import {
  calculateSmartAvoidance,
  type CanvasElement,
  type ElementType
} from '../utils/dragAvoidanceUtils'
import api from '../services/api'

export default function WorkspacePage() {
  const navigate = useNavigate()
  const [inputMessage, setInputMessage] = useState('')
  const [activeModule, setActiveModule] = useState('all')
  const moduleSectionRef = useRef<HTMLDivElement>(null)
  const workItemSectionRef = useRef<HTMLDivElement>(null)
  const [activeJobRole, setActiveJobRole] = useState('all')
  const [selectedWorkItem, setSelectedWorkItem] = useState<string | null>(null)
  const [isEditingRoles, setIsEditingRoles] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [editingRoleName, setEditingRoleName] = useState('')

  // 画布卡片位置和大小管理
  type CardConfig = {
    id: string
    type: 'container' | 'card'  // 元素类型：容器或卡片
    position: { x: number; y: number }
    size: { width: number; height: number }
    zIndex: number
  }

  // 默认卡片布局
  const defaultCards: CardConfig[] = [
    { id: 'product_manager', type: 'card', position: { x: 50, y: 20 }, size: { width: 140, height: 120 }, zIndex: 1 },
    { id: 'social_media', type: 'card', position: { x: 260, y: 20 }, size: { width: 140, height: 120 }, zIndex: 1 },
    { id: 'content_creator', type: 'card', position: { x: 470, y: 20 }, size: { width: 140, height: 120 }, zIndex: 1 },
    { id: 'data_analyst', type: 'card', position: { x: 680, y: 20 }, size: { width: 140, height: 120 }, zIndex: 1 },
    { id: 'designer', type: 'card', position: { x: 890, y: 20 }, size: { width: 140, height: 120 }, zIndex: 1 }
  ]

  const [cards, setCards] = useState<CardConfig[]>(defaultCards)

  // 加载用户保存的布局
  useEffect(() => {
    const loadLayout = async () => {
      const result = await fetchWorkspaceLayout()
      if (result.layout && result.layout.length > 0) {
        // 使用保存的布局
        setCards(result.layout as CardConfig[])
        setZoom(result.zoom || 1.0)

        // 如果有完整快照，恢复其他状态
        if (result.snapshot) {
          if (result.snapshot.expandedCards) {
            setExpandedCards(new Set(result.snapshot.expandedCards))
          }
          if (result.snapshot.selectedModules) {
            setSelectedModules(new Map(Object.entries(result.snapshot.selectedModules)))
          }
          if (result.snapshot.selectedWorkItems) {
            setSelectedWorkItems(new Map(Object.entries(result.snapshot.selectedWorkItems).map(([k, v]) => [k, Number(v)])))
          }
        }
      }
      // 如果没有保存的布局，使用defaultCards（已经在useState中设置）
    }

    loadLayout()
  }, [])

  const [draggingCard, setDraggingCard] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizingCard, setResizingCard] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  // 拖拽避让状态
  const [avoidancePositions, setAvoidancePositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [isAvoidanceEnabled, setIsAvoidanceEnabled] = useState(true) // 是否启用避让功能

  // 画布尺寸（用于避让计算）
  const [canvasSize, setCanvasSize] = useState({ width: 2000, height: 2000 })
  const canvasRef = useRef<HTMLDivElement>(null)

  // 缩放功能
  const [zoom, setZoom] = useState(1)
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5))
  const handleResetZoom = () => setZoom(1)

  // 创建新容器
  const handleCreateContainer = () => {
    setCards(prev => {
      const maxZIndex = prev.length > 0 ? Math.max(...prev.map(c => c.zIndex), 0) : 0
      const newContainer: CardConfig = {
        id: `container_${Date.now()}`,
        type: 'container',
        position: { x: 100, y: 100 },
        size: { width: 300, height: 200 },
        zIndex: maxZIndex + 1
      }
      return [...prev, newContainer]
    })
  }

  // 切换避让功能
  const handleToggleAvoidance = () => {
    setIsAvoidanceEnabled(prev => !prev)
  }

  // 手动保存工作台布局
  const [isSaving, setIsSaving] = useState(false)
  const handleManualSave = async () => {
    setIsSaving(true)
    try {
      const layout = cards.map(card => ({
        id: card.id,
        type: card.type,
        position: card.position,
        size: card.size,
        zIndex: card.zIndex
      }))

      const snapshot: WorkspaceSnapshot = {
        cards: layout,
        zoom,
        expandedCards: Array.from(expandedCards),
        selectedModules: Object.fromEntries(selectedModules),
        selectedWorkItems: Object.fromEntries(selectedWorkItems)
      }

      const success = await saveWorkspaceLayout(layout, zoom, snapshot)
      if (success) {
        alert('工作台已保存')
      } else {
        alert('保存失败，请稍后重试')
      }
    } catch (error) {
      console.error('保存工作台失败:', error)
      alert('保存失败，请稍后重试')
    } finally {
      setIsSaving(false)
    }
  }

  // 导出工作台数据
  const handleExport = async () => {
    try {
      // 先尝试从服务器导出
      await exportWorkspaceData()
    } catch (error) {
      console.error('从服务器导出失败，尝试导出本地数据:', error)
      // 如果服务器导出失败，导出本地状态
      const snapshot: WorkspaceSnapshot = {
        cards: cards.map(card => ({
          id: card.id,
          type: card.type,
          position: card.position,
          size: card.size,
          zIndex: card.zIndex
        })),
        zoom,
        expandedCards: Array.from(expandedCards),
        selectedModules: Object.fromEntries(selectedModules),
        selectedWorkItems: Object.fromEntries(selectedWorkItems)
      }
      exportLocalWorkspaceData(snapshot)
    }
  }

  // 侧边栏状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // 对话历史
  type ChatMessage = {
    id: string
    message: string
    timestamp: Date
  }
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { id: '1', message: '帮我生成一篇关于AI的文章', timestamp: new Date(Date.now() - 3600000) },
    { id: '2', message: '创建一个视频剪辑工作流', timestamp: new Date(Date.now() - 7200000) },
    { id: '3', message: '分析用户数据并生成报表', timestamp: new Date(Date.now() - 86400000) }
  ])

  // 卡片展开状态（职位卡片是否展开显示工作模块）
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  // 选中的模块（每个卡片可以选中一个模块来显示工作流列表）
  const [selectedModules, setSelectedModules] = useState<Map<string, string>>(new Map())

  // 选中的工作项（每个卡片可以选中一个工作项来显示所有工作流）
  const [selectedWorkItems, setSelectedWorkItems] = useState<Map<string, number>>(new Map())

  // 工作流执行状态（在卡片中显示工作流执行界面）
  const [executingWorkflow, setExecutingWorkflow] = useState<Map<string, { workItemId: number; toolId: number; toolName: string }>>(new Map())

  // 工作流执行数据（prompt输入和输出结果）
  type OutputItem = {
    type: 'text' | 'image' | 'video' | 'audio' | 'file'
    content: string // 对于text是文本内容，对于media是URL
    caption?: string // 可选的说明文字
  }
  const [workflowExecutionData, setWorkflowExecutionData] = useState<Map<string, { prompt: string; outputs: OutputItem[]; isExecuting: boolean }>>(new Map())

  // 工作流编辑模式（是否进入工作流编辑页面）
  const [editingWorkflow, setEditingWorkflow] = useState<Set<string>>(new Set())

  // 工作流节点数据
  type WorkflowNode = {
    id: string
    type: string
    label: string
    position: { x: number; y: number }
    config: {
      tool?: string  // 工具/模型名称
      prompt?: string  // prompt指令
      attachments?: string[]  // 附件列表
    }
  }
  const [workflowNodes, setWorkflowNodes] = useState<Map<string, WorkflowNode[]>>(new Map())

  // 节点连接关系
  type NodeConnection = {
    from: string  // 源节点ID
    to: string    // 目标节点ID
  }
  const [nodeConnections, setNodeConnections] = useState<Map<string, NodeConnection[]>>(new Map())

  // 连接模式（是否正在创建连接）
  const [connectingFrom, setConnectingFrom] = useState<{ jobRoleId: string; nodeId: string } | null>(null)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // 节点拖拽状态
  const [draggingNode, setDraggingNode] = useState<{ jobRoleId: string; nodeId: string } | null>(null)
  const [nodeDragOffset, setNodeDragOffset] = useState({ x: 0, y: 0 })

  // 选中的节点（用于编辑配置）
  const [selectedNode, setSelectedNode] = useState<{ jobRoleId: string; nodeId: string } | null>(null)

  // 工具选择器状态
  const [toolSearchQuery, setToolSearchQuery] = useState('')
  const [isToolSelectorOpen, setIsToolSelectorOpen] = useState(false)

  // 工作流操作菜单状态（记录哪个卡片的哪个工具显示菜单）
  const [workflowActionMenu, setWorkflowActionMenu] = useState<{ cardId: string; toolId: number } | null>(null)

  // 记录卡片收起前的尺寸，用于恢复
  const [previousCardSizes, setPreviousCardSizes] = useState<Map<string, { width: number; height: number }>>(new Map())

  // 记录卡片收起前的状态，用于恢复
  type CardState = {
    selectedModule?: string
    selectedWorkItem?: number
    executingWorkflow?: { workItemId: number; toolId: number; toolName: string }
    editingWorkflow?: boolean
  }
  const [previousCardStates, setPreviousCardStates] = useState<Map<string, CardState>>(new Map())

  // 可用工具/模型列表
  const availableTools = [
    { id: 'gpt-4', name: 'GPT-4', category: 'OpenAI' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', category: 'OpenAI' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', category: 'OpenAI' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', category: 'Anthropic' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', category: 'Anthropic' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', category: 'Anthropic' },
    { id: 'gemini-pro', name: 'Gemini Pro', category: 'Google' },
    { id: 'gemini-ultra', name: 'Gemini Ultra', category: 'Google' },
    { id: 'midjourney', name: 'Midjourney', category: '图像生成' },
    { id: 'stable-diffusion', name: 'Stable Diffusion', category: '图像生成' },
    { id: 'dall-e-3', name: 'DALL-E 3', category: '图像生成' },
    { id: 'whisper', name: 'Whisper', category: '语音识别' },
    { id: 'tts', name: 'Text-to-Speech', category: '语音合成' }
  ]

  // 任务输入处理函数
  const handleSend = () => {
    if (inputMessage.trim()) {
      // 保存到对话历史
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        message: inputMessage.trim(),
        timestamp: new Date()
      }
      setChatHistory(prev => [newMessage, ...prev])

      navigate('/search', { state: { query: inputMessage } })
      setInputMessage('')
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSend()
    }
  }

  // 工作流画布状态（全屏显示工作流详情）
  const [activeWorkflow, setActiveWorkflow] = useState<{ jobRoleId: string; moduleId: string } | null>(null)

  const handleCardMouseDown = (cardId: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement

    // 不在这些元素上触发拖拽
    if (target.classList.contains('resize-handle')) {
      return
    }

    // 如果点击的是内容区域（不是边框区域），不触发拖拽
    if (target.classList.contains('card-content') || target.closest('.card-content')) {
      return
    }

    const card = cards.find(c => c.id === cardId)
    if (!card) return

    setDraggingCard(cardId)
    // 考虑缩放比例的偏移量计算
    setDragOffset({
      x: e.clientX - card.position.x * zoom,
      y: e.clientY - card.position.y * zoom
    })

    // 提升z-index
    setCards(prev => {
      const maxZIndex = prev.length > 0 ? Math.max(...prev.map(card => card.zIndex)) : 0
      return prev.map(c =>
        c.id === cardId ? { ...c, zIndex: maxZIndex + 1 } : c
      )
    })
  }

  // 双击卡片展开/收起工作模块
  const handleCardDoubleClick = (cardId: string) => {
    const isCurrentlyExpanded = expandedCards.has(cardId)

    // 如果是收起操作，先保存当前卡片的尺寸
    if (isCurrentlyExpanded) {
      const currentCard = cards.find(c => c.id === cardId)
      if (currentCard) {
        setPreviousCardSizes(prevSizes => {
          const newSizes = new Map(prevSizes)
          newSizes.set(cardId, {
            width: currentCard.size.width,
            height: currentCard.size.height
          })
          return newSizes
        })
      }
    }

    setExpandedCards(prev => {
      const newSet = new Set(prev)
      const isExpanding = !newSet.has(cardId)

      if (newSet.has(cardId)) {
        newSet.delete(cardId)

        // 收起时保存当前状态
        const currentState: CardState = {
          selectedModule: selectedModules.get(cardId),
          selectedWorkItem: selectedWorkItems.get(cardId),
          executingWorkflow: executingWorkflow.get(cardId),
          editingWorkflow: editingWorkflow.has(cardId)
        }
        setPreviousCardStates(prevStates => {
          const newStates = new Map(prevStates)
          newStates.set(cardId, currentState)
          return newStates
        })

        // 收起时清除选中的模块和其他状态
        setSelectedModules(prevModules => {
          const newMap = new Map(prevModules)
          newMap.delete(cardId)
          return newMap
        })
        setSelectedWorkItems(prevItems => {
          const newMap = new Map(prevItems)
          newMap.delete(cardId)
          return newMap
        })
        setExecutingWorkflow(prevExecuting => {
          const newMap = new Map(prevExecuting)
          newMap.delete(cardId)
          return newMap
        })
        setEditingWorkflow(prevEditing => {
          const newSet = new Set(prevEditing)
          newSet.delete(cardId)
          return newSet
        })
      } else {
        newSet.add(cardId)

        // 展开时恢复之前保存的状态
        const previousState = previousCardStates.get(cardId)
        if (previousState) {
          if (previousState.selectedModule) {
            setSelectedModules(prev => {
              const newMap = new Map(prev)
              newMap.set(cardId, previousState.selectedModule!)
              return newMap
            })
          }
          if (previousState.selectedWorkItem !== undefined) {
            setSelectedWorkItems(prev => {
              const newMap = new Map(prev)
              newMap.set(cardId, previousState.selectedWorkItem!)
              return newMap
            })
          }
          if (previousState.executingWorkflow) {
            setExecutingWorkflow(prev => {
              const newMap = new Map(prev)
              newMap.set(cardId, previousState.executingWorkflow!)
              return newMap
            })
          }
          if (previousState.editingWorkflow) {
            setEditingWorkflow(prev => {
              const newSet = new Set(prev)
              newSet.add(cardId)
              return newSet
            })
          }
        }
      }

      // 调整卡片尺寸和位置
      setCards(currentCards => {
        const targetCardIndex = currentCards.findIndex(c => c.id === cardId)
        if (targetCardIndex === -1) return currentCards

        const targetCard = currentCards[targetCardIndex]
        const newCards = [...currentCards]

        if (isExpanding) {
          // 展开：扩大当前卡片，移动其他卡片
          // 优先使用之前保存的尺寸，如果没有则使用默认尺寸
          const previousSize = previousCardSizes.get(cardId)
          const expandedWidth = previousSize?.width || 450
          const expandedHeight = previousSize?.height || 500

          newCards[targetCardIndex] = {
            ...targetCard,
            size: { width: expandedWidth, height: expandedHeight }
          }

          // 将其他卡片水平移动到两边，保持同一水平线
          const targetY = targetCard.position.y // 保持与展开卡片相同的y坐标
          const leftX = targetCard.position.x - 210 - 20 // 展开卡片左边
          const rightX = targetCard.position.x + expandedWidth + 20 // 展开卡片右边

          let leftOffset = 0
          let rightOffset = 0

          currentCards.forEach((card, index) => {
            if (index !== targetCardIndex) {
              if (index < targetCardIndex) {
                // 左边的卡片：向左排列
                newCards[index] = {
                  ...card,
                  position: {
                    x: leftX - leftOffset * 210,
                    y: targetY
                  }
                }
                leftOffset++
              } else {
                // 右边的卡片：向右排列
                newCards[index] = {
                  ...card,
                  position: {
                    x: rightX + rightOffset * 210,
                    y: targetY
                  }
                }
                rightOffset++
              }
            }
          })
        } else {
          // 收起：恢复原始小尺寸，重新排列所有卡片
          newCards[targetCardIndex] = {
            ...targetCard,
            size: { width: 140, height: 120 }
          }

          // 重新水平排列所有卡片
          newCards.forEach((card, index) => {
            newCards[index] = {
              ...card,
              position: {
                x: 50 + index * 210,
                y: 20
              }
            }
          })
        }

        return newCards
      })

      return newSet
    })
  }

  // 点击工作模块，在当前卡片中展开工作流列表
  const handleModuleClick = (jobRoleId: string, moduleId: string) => {
    setSelectedModules(prev => {
      const newMap = new Map(prev)

      // 如果点击的是同一个模块，则取消选择
      if (newMap.get(jobRoleId) === moduleId) {
        newMap.delete(jobRoleId)

        // 恢复到展开状态的尺寸
        setCards(currentCards => {
          const cardIndex = currentCards.findIndex(c => c.id === jobRoleId)
          if (cardIndex === -1) return currentCards

          const newCards = [...currentCards]
          // 优先使用保存的尺寸，否则使用默认尺寸
          const previousSize = previousCardSizes.get(jobRoleId)
          const restoredSize = previousSize || { width: 450, height: 500 }
          newCards[cardIndex] = {
            ...newCards[cardIndex],
            size: restoredSize
          }

          // 保存恢复后的尺寸
          setPreviousCardSizes(prevSizes => {
            const newSizes = new Map(prevSizes)
            newSizes.set(jobRoleId, restoredSize)
            return newSizes
          })

          return newCards
        })
      } else {
        // 选择新模块 - 先保存当前尺寸
        setCards(currentCards => {
          const cardIndex = currentCards.findIndex(c => c.id === jobRoleId)
          if (cardIndex === -1) return currentCards

          const currentCard = currentCards[cardIndex]
          // 保存当前尺寸
          setPreviousCardSizes(prevSizes => {
            const newSizes = new Map(prevSizes)
            newSizes.set(jobRoleId, {
              width: currentCard.size.width,
              height: currentCard.size.height
            })
            return newSizes
          })

          const newCards = [...currentCards]
          newCards[cardIndex] = {
            ...newCards[cardIndex],
            size: { width: 700, height: 600 }
          }

          // 保存新设置的尺寸
          setPreviousCardSizes(prevSizes => {
            const newSizes = new Map(prevSizes)
            newSizes.set(jobRoleId, { width: 700, height: 600 })
            return newSizes
          })

          // 其他卡片进一步向两边移动
          const targetCard = currentCards[cardIndex]
          const targetY = targetCard.position.y
          const leftX = targetCard.position.x - 210 - 20
          const rightX = targetCard.position.x + 700 + 20

          let leftOffset = 0
          let rightOffset = 0

          currentCards.forEach((card, index) => {
            if (index !== cardIndex) {
              if (index < cardIndex) {
                newCards[index] = {
                  ...card,
                  position: {
                    x: leftX - leftOffset * 210,
                    y: targetY
                  }
                }
                leftOffset++
              } else {
                newCards[index] = {
                  ...card,
                  position: {
                    x: rightX + rightOffset * 210,
                    y: targetY
                  }
                }
                rightOffset++
              }
            }
          })

          return newCards
        })

        // 选择新模块
        newMap.set(jobRoleId, moduleId)
      }

      return newMap
    })
  }

  // 双击工作项，展开显示所有工作流
  const handleWorkItemDoubleClick = (jobRoleId: string, workItemId: number) => {
    setSelectedWorkItems(prev => {
      const newMap = new Map(prev)

      // 如果点击的是同一个工作项，则取消选择
      if (newMap.get(jobRoleId) === workItemId) {
        newMap.delete(jobRoleId)

        // 恢复到模块选择状态的尺寸
        setCards(currentCards => {
          const cardIndex = currentCards.findIndex(c => c.id === jobRoleId)
          if (cardIndex === -1) return currentCards

          const newCards = [...currentCards]
          // 优先使用保存的尺寸，否则使用默认尺寸
          const previousSize = previousCardSizes.get(jobRoleId)
          const restoredSize = previousSize || { width: 700, height: 600 }
          newCards[cardIndex] = {
            ...newCards[cardIndex],
            size: restoredSize
          }

          // 保存恢复后的尺寸
          setPreviousCardSizes(prevSizes => {
            const newSizes = new Map(prevSizes)
            newSizes.set(jobRoleId, restoredSize)
            return newSizes
          })

          return newCards
        })
      } else {
        // 选择新工作项 - 先保存当前尺寸
        setCards(currentCards => {
          const cardIndex = currentCards.findIndex(c => c.id === jobRoleId)
          if (cardIndex === -1) return currentCards

          const currentCard = currentCards[cardIndex]
          // 保存当前尺寸
          setPreviousCardSizes(prevSizes => {
            const newSizes = new Map(prevSizes)
            newSizes.set(jobRoleId, {
              width: currentCard.size.width,
              height: currentCard.size.height
            })
            return newSizes
          })

          const newCards = [...currentCards]
          newCards[cardIndex] = {
            ...newCards[cardIndex],
            size: { width: 900, height: 700 }
          }

          // 保存新设置的尺寸
          setPreviousCardSizes(prevSizes => {
            const newSizes = new Map(prevSizes)
            newSizes.set(jobRoleId, { width: 900, height: 700 })
            return newSizes
          })

          // 其他卡片进一步向两边移动
          const targetCard = currentCards[cardIndex]
          const targetY = targetCard.position.y
          const leftX = targetCard.position.x - 210 - 20
          const rightX = targetCard.position.x + 900 + 20

          let leftOffset = 0
          let rightOffset = 0

          currentCards.forEach((card, index) => {
            if (index !== cardIndex) {
              if (index < cardIndex) {
                newCards[index] = {
                  ...card,
                  position: {
                    x: leftX - leftOffset * 210,
                    y: targetY
                  }
                }
                leftOffset++
              } else {
                newCards[index] = {
                  ...card,
                  position: {
                    x: rightX + rightOffset * 210,
                    y: targetY
                  }
                }
                rightOffset++
              }
            }
          })

          return newCards
        })

        // 选择新工作项
        newMap.set(jobRoleId, workItemId)
      }

      return newMap
    })
  }

  // 开始执行工作流
  const handleStartWorkflowExecution = (jobRoleId: string, workItemId: number, toolId: number, toolName: string) => {
    setExecutingWorkflow(prev => {
      const newMap = new Map(prev)
      newMap.set(jobRoleId, { workItemId, toolId, toolName })
      return newMap
    })

    // 初始化执行数据
    setWorkflowExecutionData(prev => {
      const newMap = new Map(prev)
      if (!newMap.has(jobRoleId)) {
        newMap.set(jobRoleId, { prompt: '', outputs: [], isExecuting: false })
      }
      return newMap
    })

    // 扩大卡片以显示执行界面 - 先保存当前尺寸
    setCards(currentCards => {
      const cardIndex = currentCards.findIndex(c => c.id === jobRoleId)
      if (cardIndex === -1) return currentCards

      const currentCard = currentCards[cardIndex]
      // 保存当前尺寸
      setPreviousCardSizes(prevSizes => {
        const newSizes = new Map(prevSizes)
        newSizes.set(jobRoleId, {
          width: currentCard.size.width,
          height: currentCard.size.height
        })
        return newSizes
      })

      const newCards = [...currentCards]
      newCards[cardIndex] = {
        ...newCards[cardIndex],
        size: { width: 750, height: 800 }
      }

      // 保存新设置的尺寸
      setPreviousCardSizes(prevSizes => {
        const newSizes = new Map(prevSizes)
        newSizes.set(jobRoleId, { width: 750, height: 800 })
        return newSizes
      })

      // 其他卡片进一步向两边移动
      const targetCard = currentCards[cardIndex]
      const targetY = targetCard.position.y
      const leftX = targetCard.position.x - 210 - 20
      const rightX = targetCard.position.x + 750 + 20

      let leftOffset = 0
      let rightOffset = 0

      currentCards.forEach((card, index) => {
        if (index !== cardIndex) {
          if (index < cardIndex) {
            newCards[index] = {
              ...card,
              position: {
                x: leftX - leftOffset * 210,
                y: targetY
              }
            }
            leftOffset++
          } else {
            newCards[index] = {
              ...card,
              position: {
                x: rightX + rightOffset * 210,
                y: targetY
              }
            }
            rightOffset++
          }
        }
      })

      return newCards
    })
  }

  // 运行工作流
  const handleRunWorkflow = (jobRoleId: string) => {
    setWorkflowExecutionData(prev => {
      const newMap = new Map(prev)
      const data = newMap.get(jobRoleId)
      if (data) {
        newMap.set(jobRoleId, { ...data, isExecuting: true, outputs: [{ type: 'text', content: '工作流正在执行中...' }] })

        // 模拟执行延迟
        setTimeout(() => {
          setWorkflowExecutionData(prevMap => {
            const updatedMap = new Map(prevMap)
            const currentData = updatedMap.get(jobRoleId)
            if (currentData) {
              // 模拟生成多种格式的输出
              const mockOutputs: OutputItem[] = [
                {
                  type: 'text',
                  content: `执行完成！\n\n基于您的输入: "${currentData.prompt}"\n\n工作流已成功处理您的请求，以下是生成的多媒体结果：`
                },
                {
                  type: 'image',
                  content: 'https://picsum.photos/800/400?random=1',
                  caption: '生成的示例图片 - AI创作结果'
                },
                {
                  type: 'text',
                  content: '这是第二段处理结果的文字说明。工作流已经完成了复杂的数据处理和分析。'
                },
                {
                  type: 'image',
                  content: 'https://picsum.photos/600/400?random=2',
                  caption: '数据可视化图表'
                },
                {
                  type: 'video',
                  content: 'https://www.w3schools.com/html/mov_bbb.mp4',
                  caption: '生成的视频演示'
                },
                {
                  type: 'text',
                  content: '处理总结：\n- 成功分析了输入数据\n- 生成了2张图片\n- 创建了1个演示视频\n- 所有结果已保存'
                }
              ]

              updatedMap.set(jobRoleId, {
                ...currentData,
                isExecuting: false,
                outputs: mockOutputs
              })
            }
            return updatedMap
          })
        }, 2000)
      }
      return newMap
    })
  }

  // 进入工作流编辑模式
  const handleEnterWorkflowEditor = (jobRoleId: string) => {
    setEditingWorkflow(prev => {
      const newSet = new Set(prev)
      newSet.add(jobRoleId)
      return newSet
    })

    // 初始化默认节点（如果没有的话）
    if (!workflowNodes.has(jobRoleId)) {
      const workflowExecution = executingWorkflow.get(jobRoleId)
      setWorkflowNodes(prev => {
        const newMap = new Map(prev)
        newMap.set(jobRoleId, [
          { id: 'node-1', type: 'input', label: '输入节点', position: { x: 250, y: 50 }, config: {} },
          { id: 'node-2', type: 'process', label: workflowExecution?.toolName || '处理节点', position: { x: 250, y: 200 }, config: { tool: workflowExecution?.toolName } },
          { id: 'node-3', type: 'output', label: '输出节点', position: { x: 250, y: 350 }, config: {} }
        ])
        return newMap
      })

      // 初始化默认连接
      setNodeConnections(prev => {
        const newMap = new Map(prev)
        newMap.set(jobRoleId, [
          { from: 'node-1', to: 'node-2' },
          { from: 'node-2', to: 'node-3' }
        ])
        return newMap
      })
    }
  }

  // 退出工作流编辑模式
  const handleExitWorkflowEditor = (jobRoleId: string) => {
    setEditingWorkflow(prev => {
      const newSet = new Set(prev)
      newSet.delete(jobRoleId)
      return newSet
    })
    setSelectedNode(null)
  }

  // 添加节点
  const handleAddNode = (jobRoleId: string) => {
    const nodes = workflowNodes.get(jobRoleId) || []

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: 'process',
      label: `节点 ${nodes.length + 1}`,
      position: { x: 250, y: nodes.length * 80 + 50 },
      config: {}
    }

    setWorkflowNodes(prev => {
      const newMap = new Map(prev)
      newMap.set(jobRoleId, [...nodes, newNode])
      return newMap
    })
  }

  // 删除节点
  const handleDeleteNode = (jobRoleId: string, nodeId: string) => {
    setWorkflowNodes(prev => {
      const newMap = new Map(prev)
      const nodes = newMap.get(jobRoleId) || []
      newMap.set(jobRoleId, nodes.filter(n => n.id !== nodeId))
      return newMap
    })
    if (selectedNode?.nodeId === nodeId) {
      setSelectedNode(null)
    }
  }

  // 节点拖拽开始
  const handleNodeMouseDown = (e: React.MouseEvent, jobRoleId: string, nodeId: string, nodePos: { x: number; y: number }) => {
    e.stopPropagation()
    setDraggingNode({ jobRoleId, nodeId })
    setNodeDragOffset({
      x: e.clientX - nodePos.x,
      y: e.clientY - nodePos.y
    })
  }

  // 全局鼠标移动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingNode) {
        const { jobRoleId, nodeId } = draggingNode
        setWorkflowNodes(prev => {
          const newMap = new Map(prev)
          const nodes = newMap.get(jobRoleId) || []
          const updatedNodes = nodes.map(node => {
            if (node.id === nodeId) {
              return {
                ...node,
                position: {
                  x: e.clientX - nodeDragOffset.x,
                  y: e.clientY - nodeDragOffset.y
                }
              }
            }
            return node
          })
          newMap.set(jobRoleId, updatedNodes)
          return newMap
        })
      }
    }

    const handleMouseUp = () => {
      setDraggingNode(null)
    }

    if (draggingNode) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingNode, nodeDragOffset])

  // 更新节点标签
  const handleUpdateNodeLabel = (jobRoleId: string, nodeId: string, label: string) => {
    setWorkflowNodes(prev => {
      const newMap = new Map(prev)
      const nodes = newMap.get(jobRoleId) || []
      const updatedNodes = nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, label }
        }
        return node
      })
      newMap.set(jobRoleId, updatedNodes)
      return newMap
    })
  }

  // 更新节点配置
  const handleUpdateNodeConfig = (jobRoleId: string, nodeId: string, config: Partial<WorkflowNode['config']>) => {
    setWorkflowNodes(prev => {
      const newMap = new Map(prev)
      const nodes = newMap.get(jobRoleId) || []
      const updatedNodes = nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, config: { ...node.config, ...config } }
        }
        return node
      })
      newMap.set(jobRoleId, updatedNodes)
      return newMap
    })
  }

  // 开始创建连接
  const handleStartConnection = (jobRoleId: string, nodeId: string) => {
    setConnectingFrom({ jobRoleId, nodeId })
  }

  // 完成连接
  const handleCompleteConnection = (jobRoleId: string, toNodeId: string) => {
    if (connectingFrom && connectingFrom.jobRoleId === jobRoleId) {
      const fromNodeId = connectingFrom.nodeId
      if (fromNodeId !== toNodeId) {
        setNodeConnections(prev => {
          const newMap = new Map(prev)
          const connections = newMap.get(jobRoleId) || []
          // 检查是否已存在相同连接
          const exists = connections.some(c => c.from === fromNodeId && c.to === toNodeId)
          if (!exists) {
            newMap.set(jobRoleId, [...connections, { from: fromNodeId, to: toNodeId }])
          }
          return newMap
        })
      }
      setConnectingFrom(null)
    }
  }

  // 删除连接
  const handleDeleteConnection = (jobRoleId: string, from: string, to: string) => {
    setNodeConnections(prev => {
      const newMap = new Map(prev)
      const connections = newMap.get(jobRoleId) || []
      newMap.set(jobRoleId, connections.filter(c => !(c.from === from && c.to === to)))
      return newMap
    })
  }

  // 点击外部关闭工具选择器
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-tool-selector]')) {
        setIsToolSelectorOpen(false)
      }
    }

    if (isToolSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isToolSelectorOpen])

  // 停止工作流执行，返回工作流列表
  const handleStopWorkflowExecution = (jobRoleId: string) => {
    setExecutingWorkflow(prev => {
      const newMap = new Map(prev)
      newMap.delete(jobRoleId)
      return newMap
    })

    // 恢复到工作流列表状态的尺寸
    setCards(currentCards => {
      const cardIndex = currentCards.findIndex(c => c.id === jobRoleId)
      if (cardIndex === -1) return currentCards

      const newCards = [...currentCards]
      // 优先使用保存的尺寸，否则使用默认尺寸
      const previousSize = previousCardSizes.get(jobRoleId)
      newCards[cardIndex] = {
        ...newCards[cardIndex],
        size: previousSize || { width: 900, height: 700 }
      }
      return newCards
    })
  }

  // 选择工作流
  const handleSelectWorkflow = (workflow: typeof myWorkflows[0]) => {
    if (!workflowSelectionCardId) return

    console.log('选择工作流:', {
      workflowId: workflow.id,
      workflowName: workflow.name,
      cardId: workflowSelectionCardId,
      category: workflow.category
    })

    // 更新卡片的选中模块（如果需要的话）
    if (workflow.category) {
      setSelectedModules(prev => {
        const newMap = new Map(prev)
        newMap.set(workflowSelectionCardId, workflow.category)
        return newMap
      })
    }

    // TODO: 可以在这里添加更多逻辑，比如：
    // - 保存工作流到执行数据
    // - 更新工作流配置
    // - 显示成功提示

    // 关闭弹窗
    setShowWorkflowSelectionModal(false)
    setWorkflowSelectionCardId(null)
  }

  // 关闭工作流画布
  const handleCloseWorkflow = () => {
    setActiveWorkflow(null)
  }

  const handleResizeMouseDown = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const card = cards.find(c => c.id === cardId)
    if (!card) return

    setResizingCard(cardId)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: card.size.width,
      height: card.size.height
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingCard) {
        const newX = Math.max(0, (e.clientX - dragOffset.x) / zoom)
        const newY = Math.max(0, (e.clientY - dragOffset.y) / zoom)

        // 更新拖拽元素的位置
        const updatedCards = cards.map(card =>
          card.id === draggingCard
            ? {
                ...card,
                position: { x: newX, y: newY }
              }
            : card
        )

        // 如果启用避让功能，计算避让位置
        if (isAvoidanceEnabled) {
          const draggingElement = updatedCards.find(c => c.id === draggingCard)
          if (draggingElement) {
            // 转换为 CanvasElement 类型
            const canvasElements: CanvasElement[] = updatedCards.map(card => ({
              id: card.id,
              type: card.type,
              position: card.position,
              size: card.size,
              zIndex: card.zIndex
            }))

            // 计算避让位置
            const avoidancePos = calculateSmartAvoidance(
              {
                id: draggingElement.id,
                type: draggingElement.type,
                position: draggingElement.position,
                size: draggingElement.size,
                zIndex: draggingElement.zIndex
              },
              canvasElements,
              canvasSize
            )

            // 保存避让位置到状态
            setAvoidancePositions(avoidancePos)

            // 应用避让位置
            const finalCards = updatedCards.map(card => {
              const avoidPos = avoidancePos.get(card.id)
              if (avoidPos) {
                return { ...card, position: avoidPos }
              }
              return card
            })

            setCards(finalCards)
          } else {
            setCards(updatedCards)
          }
        } else {
          setCards(updatedCards)
        }
      } else if (resizingCard) {
        setCards(cards.map(card =>
          card.id === resizingCard
            ? {
                ...card,
                size: {
                  width: Math.max(300, resizeStart.width + (e.clientX - resizeStart.x) / zoom),
                  height: Math.max(200, resizeStart.height + (e.clientY - resizeStart.y) / zoom)
                }
              }
            : card
        ))
      }
    }

    const handleMouseUp = () => {
      // 如果是调整大小，保存新的尺寸
      if (resizingCard) {
        const resizedCard = cards.find(c => c.id === resizingCard)
        if (resizedCard) {
          setPreviousCardSizes(prevSizes => {
            const newSizes = new Map(prevSizes)
            newSizes.set(resizingCard, {
              width: resizedCard.size.width,
              height: resizedCard.size.height
            })
            return newSizes
          })
        }
      }

      // 保存布局到后端（拖拽或调整大小后）
      if (draggingCard || resizingCard) {
        const layout = cards.map(card => ({
          id: card.id,
          type: card.type,
          position: card.position,
          size: card.size,
          zIndex: card.zIndex
        }))

        const snapshot: WorkspaceSnapshot = {
          cards: layout,
          zoom,
          expandedCards: Array.from(expandedCards),
          selectedModules: Object.fromEntries(selectedModules),
          selectedWorkItems: Object.fromEntries(selectedWorkItems)
        }

        saveWorkspaceLayout(layout, zoom, snapshot)
      }

      // 清除避让状态
      if (draggingCard) {
        setAvoidancePositions(new Map())
      }

      setDraggingCard(null)
      setResizingCard(null)
    }

    if (draggingCard || resizingCard) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [draggingCard, resizingCard, dragOffset, resizeStart, cards, zoom])

  // 鼠标滚轮/触控板缩放
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // 检测是否按住 Ctrl 键或使用触控板的双指手势
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()

        // e.deltaY < 0 表示向上滚动（放大），> 0 表示向下滚动（缩小）
        const delta = -e.deltaY * 0.01
        setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)))
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', handleWheel)
    }
  }, [])

  const getCardConfig = (cardId: string) => {
    return cards.find(c => c.id === cardId) || { position: { x: 0, y: 0 }, size: { width: 800, height: 600 }, zIndex: 1 }
  }

  // 职位预设 - 改为state以支持编辑
  const [jobRoles, setJobRoles] = useState([
    {
      id: 'all',
      name: '全部场景',
      icon: '',
      color: '#8b5cf6',
      modules: ['all', 'ai', 'text', 'image', 'video', 'marketing', 'product', 'analysis'],
      description: '完整工具集，适合所有工作场景'
    },
    {
      id: 'product_manager',
      name: '产品经理',
      icon: '',
      color: '#10b981',
      modules: ['product', 'analysis', 'text', 'image'],
      description: '需求分析、产品设计、数据洞察、文档撰写'
    },
    {
      id: 'social_media',
      name: '自媒体运营',
      icon: '',
      color: '#f59e0b',
      modules: ['marketing', 'text', 'image', 'video'],
      description: '内容创作、视觉设计、视频制作、推广运营'
    },
    {
      id: 'content_creator',
      name: '内容创作者',
      icon: '',
      color: '#3b82f6',
      modules: ['text', 'image', 'video', 'marketing'],
      description: '文案写作、视觉设计、视频编辑、内容推广'
    },
    {
      id: 'data_analyst',
      name: '数据分析师',
      icon: '',
      color: '#ef4444',
      modules: ['analysis', 'text', 'image'],
      description: '数据挖掘、报表制作、可视化图表、分析报告'
    },
    {
      id: 'designer',
      name: '设计师',
      icon: '',
      color: '#06b6d4',
      modules: ['image', 'video', 'text'],
      description: '视觉设计、图片处理、视频制作、设计文档'
    },
    {
      id: 'marketing_specialist',
      name: '营销专员',
      icon: '',
      color: '#8b5cf6',
      modules: ['marketing', 'text', 'image', 'analysis'],
      description: '营销策划、文案创作、素材制作、效果分析'
    }
  ])

  // 工作模块编辑状态
  const [isEditingModules, setIsEditingModules] = useState(false)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editingModuleName, setEditingModuleName] = useState('')

  // 具体工作编辑状态
  const [isEditingWorkItems, setIsEditingWorkItems] = useState(false)
  const [editingWorkItemKey, setEditingWorkItemKey] = useState<string | null>(null)
  const [editingWorkItemName, setEditingWorkItemName] = useState('')

  // 工作流/工具编辑状态
  const [isEditingWorkflows, setIsEditingWorkflows] = useState(false)
  const [editingWorkflowKey, setEditingWorkflowKey] = useState<string | null>(null)
  const [editingWorkflowName, setEditingWorkflowName] = useState('')

  // 最近常用工作流弹窗状态
  const [showRecentWorkflowsModal, setShowRecentWorkflowsModal] = useState(false)

  // 日常工作弹窗状态
  const [showFrequentModulesModal, setShowFrequentModulesModal] = useState(false)

  // 草稿箱弹窗状态
  const [showDraftsModal, setShowDraftsModal] = useState(false)

  // 最近更新弹窗状态
  const [showRecentUpdatesModal, setShowRecentUpdatesModal] = useState(false)

  // 工作流选择弹窗状态
  const [showWorkflowSelectionModal, setShowWorkflowSelectionModal] = useState(false)
  const [workflowSelectionCardId, setWorkflowSelectionCardId] = useState<string | null>(null)
  const [workflowSearchQuery, setWorkflowSearchQuery] = useState('')
  const [workflowFilterStatus, setWorkflowFilterStatus] = useState<'all' | '运行中' | '草稿'>('运行中')

  // 最近常用工作流显示数量
  const [visibleWorkflowCount, setVisibleWorkflowCount] = useState(6)

  // 删除职位预设
  const deleteJobRole = (roleId: string) => {
    if (roleId === 'all') return // 不允许删除"全部场景"
    setJobRoles(jobRoles.filter(role => role.id !== roleId))
    if (activeJobRole === roleId) {
      setActiveJobRole('all')
    }
  }

  // 添加新职位预设
  const addNewJobRole = () => {
    const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#06b6d4', '#8b5cf6']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    const newRoleId = `custom_${Date.now()}`
    const newRole = {
      id: newRoleId,
      name: '新职位',
      icon: '',
      color: randomColor,
      modules: ['text'],
      description: '点击编辑描述'
    }
    setJobRoles([...jobRoles, newRole])
    // 自动进入编辑状态
    setEditingRoleId(newRoleId)
    setEditingRoleName('新职位')
  }

  // 处理AI工具拖拽到画布
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()

    // 尝试获取AI工具数据
    const aiToolData = e.dataTransfer.getData('ai-tool')
    if (aiToolData) {
      try {
        const aiTool = JSON.parse(aiToolData)
        console.log('接收到AI工具数据:', aiTool)

        // 创建新的职位角色
        const newRoleId = `ai-tool-${Date.now()}`
        const newJobRole = {
          id: newRoleId,
          name: aiTool.name,
          icon: aiTool.logo || '🤖',
          color: '#ec4899',
          modules: ['ai'],
          description: aiTool.description || ''
        }

        // 计算放置位置（考虑缩放和偏移）
        const rect = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - rect.left) / zoom - 70  // 减去卡片宽度的一半
        const y = (e.clientY - rect.top) / zoom - 60    // 减去卡片高度的一半

        // 创建新的卡片配置
        const newCard: CardConfig = {
          id: newRoleId,
          type: 'card',
          position: { x: Math.max(0, x), y: Math.max(0, y) },
          size: { width: 140, height: 120 },
          zIndex: 1
        }

        console.log('创建新的jobRole:', newJobRole)
        console.log('创建新的card:', newCard)

        // 更新状态
        setJobRoles(prev => {
          const updated = [...prev, newJobRole]
          console.log('更新后的jobRoles:', updated)
          return updated
        })
        setCards(prev => {
          const updated = [...prev, newCard]
          console.log('更新后的cards:', updated)
          return updated
        })

        alert(`AI工具「${aiTool.name}」已添加到画布！双击卡片展开使用。`)
      } catch (error) {
        console.error('添加AI工具失败:', error)
        alert(`添加AI工具失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  // 加载待添加到画布的工作流卡片
  useEffect(() => {
    const pendingCards = JSON.parse(localStorage.getItem('pendingWorkspaceCards') || '[]')
    if (pendingCards.length > 0) {
      // 为每个待处理的卡片创建 jobRole 和 card
      const newJobRoles: any[] = []
      const newCards: CardConfig[] = []

      pendingCards.forEach((pendingCard: any, index: number) => {
        // 检查是否已存在
        if (jobRoles.find(r => r.id === pendingCard.id)) return

        // 创建新的 jobRole
        const newJobRole = {
          id: pendingCard.id,
          name: pendingCard.name,
          icon: '📋',
          color: pendingCard.color || '#6366f1',
          modules: ['all'],
          description: pendingCard.description || '自定义工作流'
        }
        newJobRoles.push(newJobRole)

        // 创建新的 card 配置
        const newCard: CardConfig = {
          id: pendingCard.id,
          type: 'card',
          position: {
            x: 50 + (index % 5) * 210,
            y: 160 + Math.floor(index / 5) * 140
          },
          size: { width: 140, height: 120 },
          zIndex: 1
        }
        newCards.push(newCard)
      })

      // 批量更新状态
      if (newJobRoles.length > 0) {
        setJobRoles(prev => [...prev, ...newJobRoles])
      }
      if (newCards.length > 0) {
        setCards(prev => [...prev, ...newCards])
      }

      // 清除待处理的卡片
      localStorage.removeItem('pendingWorkspaceCards')
    }
  }, [])

  // 加载待导入的工作包
  useEffect(() => {
    const pendingImportData = localStorage.getItem('pendingWorkPackageImport')
    if (pendingImportData) {
      try {
        const importData = JSON.parse(pendingImportData)
        const { module, workPackage } = importData

        // 将工作包的items添加到对应模块的workItems中
        setWorkItems(prevWorkItems => {
          const moduleItems = prevWorkItems[module] || []
          const newItems = workPackage.items.map((item: any) => ({
            ...item,
            // 确保ID不冲突
            id: Date.now() + item.id
          }))
          return {
            ...prevWorkItems,
            [module]: [...moduleItems, ...newItems]
          }
        })

        // 清除待处理的导入数据
        localStorage.removeItem('pendingWorkPackageImport')

        console.log(`已导入工作包「${workPackage.name}」到模块「${module}」`)
      } catch (error) {
        console.error('导入工作包失败:', error)
        localStorage.removeItem('pendingWorkPackageImport')
      }
    }
  }, [])

  // 更新职位名称
  const updateRoleName = (roleId: string, newName: string) => {
    setJobRoles(jobRoles.map(role =>
      role.id === roleId ? { ...role, name: newName } : role
    ))
    setEditingRoleId(null)
    setEditingRoleName('')
  }

  // 开始编辑职位名称
  const startEditingRole = (roleId: string, currentName: string) => {
    setEditingRoleId(roleId)
    setEditingRoleName(currentName)
  }

  // 工作流模块分类 - 改为state以支持编辑
  const [moduleCategories, setModuleCategories] = useState([
    { id: 'all', name: '全部', icon: '', color: '#8b5cf6' },
    { id: 'ai', name: 'AI工具', icon: '🤖', color: '#ec4899' },
    { id: 'text', name: '文字处理', icon: '', color: '#3b82f6' },
    { id: 'image', name: '图片处理', icon: '', color: '#06b6d4' },
    { id: 'video', name: '视频制作', icon: '', color: '#8b5cf6' },
    { id: 'marketing', name: '营销模块', icon: '', color: '#f59e0b' },
    { id: 'product', name: '产品模块', icon: '', color: '#10b981' },
    { id: 'analysis', name: '分析模块', icon: '', color: '#ef4444' }
  ])

  // 删除工作模块
  const deleteModule = (moduleId: string) => {
    if (moduleId === 'all') return // 不允许删除"全部"
    setModuleCategories(moduleCategories.filter(module => module.id !== moduleId))
    if (activeModule === moduleId) {
      setActiveModule('all')
    }
    // 同时从所有职位预设中移除该模块
    setJobRoles(jobRoles.map(role => ({
      ...role,
      modules: role.modules.filter(m => m !== moduleId)
    })))
  }

  // 添加新工作模块
  const addNewModule = () => {
    const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#06b6d4', '#8b5cf6']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    const newModuleId = `module_${Date.now()}`
    const newModule = {
      id: newModuleId,
      name: '新模块',
      icon: '',
      color: randomColor
    }
    setModuleCategories([...moduleCategories, newModule])

    // 如果当前在某个职位工作台,也要把新模块添加到该职位的modules中
    if (activeJobRole && activeJobRole !== 'all') {
      setJobRoles(jobRoles.map(role =>
        role.id === activeJobRole
          ? { ...role, modules: [...role.modules, newModuleId] }
          : role
      ))
    } else {
      // 如果在全部场景,则添加到全部场景的modules中
      setJobRoles(jobRoles.map(role =>
        role.id === 'all'
          ? { ...role, modules: [...role.modules, newModuleId] }
          : role
      ))
    }

    // 自动进入编辑状态
    setEditingModuleId(newModuleId)
    setEditingModuleName('新模块')
  }

  // 更新模块名称
  const updateModuleName = (moduleId: string, newName: string) => {
    setModuleCategories(moduleCategories.map(module =>
      module.id === moduleId ? { ...module, name: newName } : module
    ))
    setEditingModuleId(null)
    setEditingModuleName('')
  }

  // 开始编辑模块名称
  const startEditingModule = (moduleId: string, currentName: string) => {
    setEditingModuleId(moduleId)
    setEditingModuleName(currentName)
  }

  // 删除具体工作项
  const deleteWorkItem = (category: string, itemId: number) => {
    setWorkItems({
      ...workItems,
      [category]: workItems[category as keyof typeof workItems].filter(item => item.id !== itemId)
    })
  }

  // 添加新的具体工作项
  const addNewWorkItem = (category: string) => {
    const currentItems = workItems[category as keyof typeof workItems] || []
    const newId = currentItems.length > 0 ? Math.max(...currentItems.map(item => item.id)) + 1 : 1
    const newItem = {
      id: newId,
      name: '新工作项',
      description: '点击编辑描述',
      icon: '',
      difficulty: '简单',
      toolCount: 0
    }
    setWorkItems({
      ...workItems,
      [category]: [...currentItems, newItem]
    })
    // 自动进入编辑状态
    setEditingWorkItemKey(`${category}-${newId}`)
    setEditingWorkItemName('新工作项')
  }

  // 更新具体工作项名称
  const updateWorkItemName = (category: string, itemId: number, newName: string) => {
    setWorkItems({
      ...workItems,
      [category]: workItems[category as keyof typeof workItems].map(item =>
        item.id === itemId ? { ...item, name: newName } : item
      )
    })
    setEditingWorkItemKey(null)
    setEditingWorkItemName('')
  }

  // 开始编辑具体工作项名称
  const startEditingWorkItem = (category: string, itemId: number, currentName: string) => {
    setEditingWorkItemKey(`${category}-${itemId}`)
    setEditingWorkItemName(currentName)
  }

  // 删除工作流/工具
  const deleteWorkflow = (workItemKey: string, toolId: number) => {
    setWorkItemTools({
      ...workItemTools,
      [workItemKey]: workItemTools[workItemKey]?.filter(tool => tool.id !== toolId) || []
    })
  }

  // 添加新工作流/工具
  const addNewWorkflow = (workItemKey: string) => {
    const currentTools = workItemTools[workItemKey] || []
    const newId = currentTools.length > 0 ? Math.max(...currentTools.map(tool => tool.id)) + 1 : 1
    const newTool = {
      id: newId,
      name: '新工作流',
      type: '工作流',
      description: '点击编辑描述',
      icon: ''
    }
    setWorkItemTools({
      ...workItemTools,
      [workItemKey]: [...currentTools, newTool]
    })
    // 自动进入编辑状态
    setEditingWorkflowKey(`${workItemKey}-${newId}`)
    setEditingWorkflowName('新工作流')
  }

  // 更新工作流/工具名称
  const updateWorkflowName = (workItemKey: string, toolId: number, newName: string) => {
    setWorkItemTools({
      ...workItemTools,
      [workItemKey]: workItemTools[workItemKey]?.map(tool =>
        tool.id === toolId ? { ...tool, name: newName } : tool
      ) || []
    })
    setEditingWorkflowKey(null)
    setEditingWorkflowName('')
  }

  // 开始编辑工作流/工具名称
  const startEditingWorkflow = (workItemKey: string, toolId: number, currentName: string) => {
    setEditingWorkflowKey(`${workItemKey}-${toolId}`)
    setEditingWorkflowName(currentName)
  }

  // 具体工作项目配置 - 改为state以支持编辑
  const [workItems, setWorkItems] = useState<Record<string, Array<{
    id: number
    name: string
    description: string
    icon: string
    difficulty: string
    toolCount?: number
    tools?: Array<{
      id: number
      name: string
      type: string
      description: string
      icon: string
      version?: string
    }>
  }>>>({
    text: [
      {
        id: 1,
        name: "智能文章生成",
        description: "AI自动生成各类文章内容",
        icon: "",
        difficulty: "简单",
        toolCount: 5,
        tools: [
          { id: 1, name: 'GPT-4 文章生成器', type: 'AI工具', description: '智能生成文章', icon: '', version: 'v3.0' },
          { id: 2, name: '标题优化器', type: 'AI工具', description: '优化文章标题', icon: '', version: 'v2.1' },
          { id: 3, name: 'SEO关键词工具', type: '工作流', description: '自动优化SEO', icon: '', version: 'v1.8' },
          { id: 4, name: '内容润色', type: 'AI工具', description: '提升文章质量', icon: '', version: 'v2.0' },
          { id: 5, name: '排版美化', type: '软件', description: '自动排版', icon: '', version: 'v1.5' }
        ]
      },
      {
        id: 2,
        name: "文档翻译",
        description: "多语言文档互译",
        icon: "",
        difficulty: "中等",
        toolCount: 3,
        tools: [
          { id: 1, name: 'DeepL翻译', type: 'AI工具', description: '高质量翻译', icon: '', version: 'v3.2' },
          { id: 2, name: '术语库管理', type: '工作流', description: '专业术语统一', icon: '', version: 'v1.0' },
          { id: 3, name: '格式保持', type: '软件', description: '保持原文格式', icon: '', version: 'v2.0' }
        ]
      },
      {
        id: 3,
        name: "内容校对",
        description: "文本语法和格式检查",
        icon: "",
        difficulty: "简单",
        toolCount: 4,
        tools: [
          { id: 1, name: 'Grammarly', type: 'AI工具', description: '智能语法检查', icon: '', version: 'v4.0' },
          { id: 2, name: '错别字检测', type: 'AI工具', description: '中文错别字识别', icon: '', version: 'v2.5' },
          { id: 3, name: '格式规范检查', type: '工作流', description: '文档格式标准化', icon: '', version: 'v1.3' },
          { id: 4, name: '标点符号优化', type: 'AI工具', description: '标点使用规范', icon: '', version: 'v1.8' }
        ]
      },
      {
        id: 4,
        name: "摘要生成",
        description: "长文档智能摘要",
        icon: "",
        difficulty: "简单",
        toolCount: 2,
        tools: [
          { id: 1, name: 'AI摘要生成器', type: 'AI工具', description: '智能提取文章要点', icon: '', version: 'v3.1' },
          { id: 2, name: '关键词提取', type: 'AI工具', description: '自动提取关键词', icon: '', version: 'v2.0' }
        ]
      },
      {
        id: 5,
        name: "SEO优化",
        description: "内容SEO关键词优化",
        icon: "",
        difficulty: "中等",
        toolCount: 6,
        tools: [
          { id: 1, name: 'SEO分析工具', type: 'AI工具', description: 'SEO得分分析', icon: '', version: 'v3.5' },
          { id: 2, name: '关键词规划', type: 'AI工具', description: '关键词策略规划', icon: '', version: 'v2.8' },
          { id: 3, name: '竞品SEO分析', type: '工作流', description: '竞品关键词分析', icon: '', version: 'v1.9' },
          { id: 4, name: '内链优化', type: '工作流', description: '内部链接优化', icon: '', version: 'v2.1' },
          { id: 5, name: 'Meta标签生成', type: 'AI工具', description: '自动生成Meta标签', icon: '', version: 'v1.5' },
          { id: 6, name: 'SEO报告生成', type: '工作流', description: '生成SEO优化报告', icon: '', version: 'v2.3' }
        ]
      },
      {
        id: 6,
        name: "文案创作",
        description: "营销文案智能创作",
        icon: "",
        difficulty: "中等",
        toolCount: 4,
        tools: [
          { id: 1, name: '广告文案生成', type: 'AI工具', description: '创意广告文案', icon: '', version: 'v2.7' },
          { id: 2, name: '情感分析', type: 'AI工具', description: '文案情感倾向分析', icon: '', version: 'v1.9' },
          { id: 3, name: '文案模板库', type: '工作流', description: '多场景文案模板', icon: '', version: 'v3.0' },
          { id: 4, name: 'A/B测试工具', type: '软件', description: '文案效果测试', icon: '', version: 'v2.2' }
        ]
      }
    ],
    image: [
      {
        id: 1,
        name: "背景移除",
        description: "一键移除图片背景",
        icon: "",
        difficulty: "简单",
        tools: [
          { id: 1, name: 'Remove.bg', type: 'AI工具', description: '智能背景移除', icon: '', version: 'v2.0' },
          { id: 2, name: '批量抠图工作流', type: '工作流', description: '批量处理图片', icon: '', version: 'v1.5' }
        ]
      },
      {
        id: 2,
        name: "图片修复",
        description: "模糊图片清晰化处理",
        icon: "",
        difficulty: "中等",
        tools: [
          { id: 1, name: 'AI图片增强', type: 'AI工具', description: '提升图片清晰度', icon: '', version: 'v3.0' },
          { id: 2, name: '噪点去除', type: 'AI工具', description: '消除图片噪点', icon: '', version: 'v2.1' }
        ]
      },
      {
        id: 3,
        name: "风格转换",
        description: "图片艺术风格转换",
        icon: "",
        difficulty: "中等",
        tools: [
          { id: 1, name: '风格迁移工具', type: 'AI工具', description: '图片风格转换', icon: '', version: 'v2.3' },
          { id: 2, name: '艺术滤镜', type: '软件', description: '多种艺术效果', icon: '', version: 'v1.8' }
        ]
      },
      {
        id: 4,
        name: "尺寸调整",
        description: "批量图片尺寸调整",
        icon: "",
        difficulty: "简单",
        tools: [
          { id: 1, name: '批量裁剪工具', type: '软件', description: '批量图片裁剪', icon: '', version: 'v2.1' },
          { id: 2, name: '智能缩放', type: 'AI工具', description: 'AI智能缩放不失真', icon: '', version: 'v1.7' },
          { id: 3, name: '尺寸预设模板', type: '工作流', description: '常用尺寸快速调整', icon: '', version: 'v1.2' }
        ]
      },
      {
        id: 5,
        name: "水印添加",
        description: "批量添加水印保护",
        icon: "",
        difficulty: "简单",
        tools: [
          { id: 1, name: '水印设计器', type: '软件', description: '自定义水印设计', icon: '', version: 'v3.0' },
          { id: 2, name: '批量水印工作流', type: '工作流', description: '批量添加水印', icon: '', version: 'v2.3' },
          { id: 3, name: '防盗链保护', type: '软件', description: '图片防盗链技术', icon: '', version: 'v1.5' }
        ]
      },
      {
        id: 6,
        name: "AI作图",
        description: "文本描述生成图片",
        icon: "",
        difficulty: "高级",
        tools: [
          { id: 1, name: 'Midjourney', type: 'AI工具', description: '高质量AI绘图', icon: '', version: 'v6.0' },
          { id: 2, name: 'Stable Diffusion', type: 'AI工具', description: '开源AI绘图', icon: '', version: 'v3.5' },
          { id: 3, name: 'DALL-E', type: 'AI工具', description: 'OpenAI图像生成', icon: '', version: 'v3.0' },
          { id: 4, name: 'Prompt优化器', type: 'AI工具', description: '优化绘图提示词', icon: '', version: 'v2.1' },
          { id: 5, name: '风格库管理', type: '工作流', description: '管理绘图风格', icon: '', version: 'v1.8' }
        ]
      }
    ],
    video: [
      {
        id: 1,
        name: "视频剪辑",
        description: "智能视频剪辑合成",
        icon: "",
        difficulty: "中等",
        tools: [
          { id: 1, name: '剪映专业版', type: '软件', description: '专业视频剪辑软件', icon: '', version: 'v3.8' },
          { id: 2, name: 'AI智能剪辑', type: 'AI工具', description: 'AI自动剪辑视频', icon: '', version: 'v2.5' },
          { id: 3, name: '转场特效库', type: '工作流', description: '丰富转场效果', icon: '', version: 'v1.9' },
          { id: 4, name: '片段管理器', type: '软件', description: '素材片段管理', icon: '', version: 'v2.1' }
        ]
      },
      {
        id: 2,
        name: "字幕生成",
        description: "自动生成视频字幕",
        icon: "",
        difficulty: "简单",
        tools: [
          { id: 1, name: '语音识别引擎', type: 'AI工具', description: '高精度语音转文字', icon: '', version: 'v4.2' },
          { id: 2, name: '字幕样式编辑', type: '软件', description: '字幕样式设计', icon: '', version: 'v2.0' },
          { id: 3, name: '多语言翻译', type: 'AI工具', description: '字幕多语言翻译', icon: '', version: 'v3.1' }
        ]
      },
      {
        id: 3,
        name: "配音合成",
        description: "AI语音配音生成",
        icon: "",
        difficulty: "中等",
        tools: [
          { id: 1, name: 'TTS语音合成', type: 'AI工具', description: '真人级AI配音', icon: '', version: 'v5.0' },
          { id: 2, name: '声音克隆', type: 'AI工具', description: '克隆真实声音', icon: '', version: 'v2.8' },
          { id: 3, name: '情感调节', type: 'AI工具', description: '调节语音情感', icon: '', version: 'v1.5' },
          { id: 4, name: '音频降噪', type: '软件', description: '音频噪音去除', icon: '', version: 'v3.2' }
        ]
      },
      {
        id: 4,
        name: "场景检测",
        description: "视频场景自动分割",
        icon: "",
        difficulty: "高级",
        tools: [
          { id: 1, name: 'AI场景识别', type: 'AI工具', description: '智能识别场景切换', icon: '', version: 'v3.0' },
          { id: 2, name: '镜头分析', type: 'AI工具', description: '分析镜头类型', icon: '', version: 'v2.3' },
          { id: 3, name: '自动分段', type: '工作流', description: '自动切分视频段落', icon: '', version: 'v1.7' }
        ]
      },
      {
        id: 5,
        name: "特效添加",
        description: "视频特效和滤镜",
        icon: "",
        difficulty: "中等",
        tools: [
          { id: 1, name: '特效素材库', type: '工作流', description: '丰富特效资源', icon: '', version: 'v4.0' },
          { id: 2, name: '滤镜预设', type: '软件', description: '专业滤镜效果', icon: '', version: 'v2.5' },
          { id: 3, name: 'AI调色', type: 'AI工具', description: 'AI智能调色', icon: '', version: 'v3.1' },
          { id: 4, name: '粒子特效', type: '软件', description: '粒子动画效果', icon: '', version: 'v1.8' }
        ]
      },
      {
        id: 6,
        name: "格式转换",
        description: "视频格式批量转换",
        icon: "",
        difficulty: "简单",
        tools: [
          { id: 1, name: 'FFmpeg工作流', type: '工作流', description: '批量格式转换', icon: '', version: 'v6.0' },
          { id: 2, name: '压缩优化', type: '软件', description: '视频体积压缩', icon: '', version: 'v2.9' },
          { id: 3, name: '分辨率调整', type: '软件', description: '视频分辨率转换', icon: '', version: 'v1.6' }
        ]
      }
    ],
    marketing: [
      {
        id: 1,
        name: "用户画像",
        description: "目标用户群体分析",
        icon: "",
        difficulty: "中等",
        tools: [
          { id: 1, name: '用户数据分析', type: 'AI工具', description: '分析用户行为数据', icon: '', version: 'v3.5' },
          { id: 2, name: '画像标签系统', type: '工作流', description: '用户标签管理', icon: '', version: 'v2.2' },
          { id: 3, name: '兴趣预测模型', type: 'AI工具', description: '预测用户兴趣', icon: '', version: 'v1.9' },
          { id: 4, name: '分群工具', type: '软件', description: '用户分群管理', icon: '', version: 'v2.6' }
        ]
      },
      {
        id: 2,
        name: "营销策略",
        description: "营销方案策划制定",
        icon: "",
        difficulty: "高级",
        tools: [
          { id: 1, name: '策略规划模板', type: '工作流', description: '营销策略框架', icon: '', version: 'v3.0' },
          { id: 2, name: 'AI策略助手', type: 'AI工具', description: 'AI营销方案生成', icon: '', version: 'v2.8' },
          { id: 3, name: '竞品分析', type: 'AI工具', description: '竞品营销分析', icon: '', version: 'v2.1' },
          { id: 4, name: '预算规划器', type: '软件', description: '营销预算管理', icon: '', version: 'v1.7' }
        ]
      },
      {
        id: 3,
        name: "社媒运营",
        description: "社交媒体内容运营",
        icon: "",
        difficulty: "中等",
        tools: [
          { id: 1, name: '内容排期工具', type: '软件', description: '社媒内容计划', icon: '', version: 'v4.1' },
          { id: 2, name: 'AI文案生成', type: 'AI工具', description: '社媒文案创作', icon: '', version: 'v3.3' },
          { id: 3, name: '热点追踪', type: 'AI工具', description: '追踪社媒热点', icon: '', version: 'v2.5' },
          { id: 4, name: '数据分析面板', type: '工作流', description: '社媒数据分析', icon: '', version: 'v2.9' }
        ]
      },
      {
        id: 4,
        name: "广告投放",
        description: "广告策略优化投放",
        icon: "",
        difficulty: "高级",
        tools: [
          { id: 1, name: '广告平台管理', type: '软件', description: '多平台广告管理', icon: '', version: 'v5.2' },
          { id: 2, name: 'AI出价优化', type: 'AI工具', description: '智能竞价策略', icon: '', version: 'v3.7' },
          { id: 3, name: '素材测试工具', type: '工作流', description: 'A/B测试广告素材', icon: '', version: 'v2.4' },
          { id: 4, name: 'ROI分析器', type: 'AI工具', description: '广告投资回报分析', icon: '', version: 'v2.1' }
        ]
      },
      {
        id: 5,
        name: "活动策划",
        description: "营销活动创意策划",
        icon: "",
        difficulty: "中等",
        tools: [
          { id: 1, name: '活动模板库', type: '工作流', description: '丰富活动策划模板', icon: '', version: 'v3.8' },
          { id: 2, name: 'H5制作工具', type: '软件', description: '活动H5页面制作', icon: '', version: 'v4.0' },
          { id: 3, name: '抽奖系统', type: '软件', description: '活动抽奖管理', icon: '', version: 'v2.3' },
          { id: 4, name: '效果预测', type: 'AI工具', description: '预测活动效果', icon: '', version: 'v1.6' }
        ]
      },
      {
        id: 6,
        name: "效果分析",
        description: "营销效果数据分析",
        icon: "",
        difficulty: "中等",
        tools: [
          { id: 1, name: '数据看板', type: '工作流', description: '营销数据可视化', icon: '', version: 'v3.9' },
          { id: 2, name: '归因分析', type: 'AI工具', description: '营销渠道归因', icon: '', version: 'v2.7' },
          { id: 3, name: '转化漏斗', type: '软件', description: '转化路径分析', icon: '', version: 'v2.2' },
          { id: 4, name: '报告生成器', type: 'AI工具', description: '自动生成分析报告', icon: '', version: 'v3.1' }
        ]
      }
    ],
    product: [
      {
        id: 1,
        name: "市场分析",
        description: "目标市场深度调研分析",
        icon: "",
        difficulty: "中等",
        toolCount: 7,
        tools: [
          { id: 1, name: '市场调研工作流', type: '工作流', description: '完整市场调研流程', icon: '', version: 'v2.0' },
          { id: 2, name: '数据分析助手', type: 'AI工具', description: '智能数据分析', icon: '', version: 'v3.2' },
          { id: 3, name: '问卷设计器', type: '软件', description: '专业问卷设计', icon: '', version: 'v2.1' },
          { id: 4, name: 'Excel分析插件', type: '软件', description: 'Excel数据分析', icon: '', version: 'v1.7' },
          { id: 5, name: '报告生成器', type: 'AI工具', description: '自动生成报告', icon: '', version: 'v2.3' },
          { id: 6, name: '图表制作工具', type: '软件', description: '专业图表制作', icon: '', version: 'v1.9' },
          { id: 7, name: '趋势预测模型', type: 'AI工具', description: 'AI趋势预测', icon: '', version: 'v1.2' }
        ]
      },
      {
        id: 2,
        name: "竞品分析",
        description: "竞争对手产品分析",
        icon: "",
        difficulty: "中等",
        toolCount: 5,
        tools: [
          { id: 1, name: '竞品分析工作流', type: '工作流', description: '系统化竞品分析', icon: '', version: 'v2.5' },
          { id: 2, name: '产品对比工具', type: '软件', description: '功能对比分析', icon: '', version: 'v1.5' },
          { id: 3, name: '价格监控助手', type: 'AI工具', description: '竞品价格监控', icon: '', version: 'v1.1' },
          { id: 4, name: '用户评价分析', type: 'AI工具', description: '竞品用户反馈', icon: '', version: 'v2.0' },
          { id: 5, name: 'SWOT分析模板', type: '工作流', description: 'SWOT分析流程', icon: '', version: 'v1.4' }
        ]
      },
      {
        id: 3,
        name: "PRD撰写",
        description: "产品需求文档撰写",
        icon: "",
        difficulty: "高级",
        toolCount: 4,
        tools: [
          { id: 1, name: 'PRD模板工作流', type: '工作流', description: '标准PRD流程', icon: '', version: 'v3.2' },
          { id: 2, name: '需求收集助手', type: 'AI工具', description: '智能需求整理', icon: '', version: 'v2.1' },
          { id: 3, name: '文档协作平台', type: '软件', description: '团队协作撰写', icon: '', version: 'v4.5' },
          { id: 4, name: '版本管理系统', type: '软件', description: '文档版本控制', icon: '', version: 'v2.0' }
        ]
      },
      {
        id: 4,
        name: "产品设计",
        description: "产品功能架构设计",
        icon: "",
        difficulty: "高级",
        toolCount: 6,
        tools: [
          { id: 1, name: '架构设计工具', type: '软件', description: '产品架构设计', icon: '', version: 'v3.8' },
          { id: 2, name: 'AI需求分析', type: 'AI工具', description: 'AI功能建议', icon: '', version: 'v2.3' },
          { id: 3, name: '流程图工具', type: '软件', description: '业务流程设计', icon: '', version: 'v4.1' },
          { id: 4, name: '数据库设计', type: '软件', description: '数据模型设计', icon: '', version: 'v2.7' },
          { id: 5, name: '技术选型助手', type: 'AI工具', description: '技术方案推荐', icon: '', version: 'v1.5' },
          { id: 6, name: '设计文档模板', type: '工作流', description: '设计文档规范', icon: '', version: 'v2.9' }
        ]
      },
      {
        id: 5,
        name: "需求管理",
        description: "产品需求收集管理",
        icon: "",
        difficulty: "中等",
        toolCount: 3,
        tools: [
          { id: 1, name: '需求池管理', type: '软件', description: '需求收集整理', icon: '', version: 'v3.5' },
          { id: 2, name: '优先级评估', type: 'AI工具', description: 'AI需求排序', icon: '', version: 'v2.0' },
          { id: 3, name: '需求追踪系统', type: '工作流', description: '需求状态追踪', icon: '', version: 'v2.8' }
        ]
      },
      {
        id: 6,
        name: "会议安排",
        description: "产品会议组织安排",
        icon: "",
        difficulty: "简单",
        toolCount: 2,
        tools: [
          { id: 1, name: '会议日程管理', type: '软件', description: '会议日程安排', icon: '', version: 'v4.0' },
          { id: 2, name: '会议纪要助手', type: 'AI工具', description: 'AI生成会议纪要', icon: '', version: 'v2.5' }
        ]
      },
      {
        id: 7,
        name: "原型设计",
        description: "产品原型快速设计",
        icon: "",
        difficulty: "中等",
        toolCount: 4,
        tools: [
          { id: 1, name: 'Figma模板库', type: '软件', description: '丰富原型模板', icon: '', version: 'v5.0' },
          { id: 2, name: 'AI原型生成', type: 'AI工具', description: 'AI快速原型', icon: '', version: 'v1.9' },
          { id: 3, name: '组件库管理', type: '工作流', description: '复用组件管理', icon: '', version: 'v3.2' },
          { id: 4, name: '交互设计工具', type: '软件', description: '交互原型制作', icon: '', version: 'v2.6' }
        ]
      },
      {
        id: 8,
        name: "用户调研",
        description: "用户需求调研分析",
        icon: "",
        difficulty: "中等",
        toolCount: 5,
        tools: [
          { id: 1, name: '调研问卷设计', type: '软件', description: '专业问卷设计', icon: '', version: 'v3.3' },
          { id: 2, name: '用户访谈工具', type: '工作流', description: '访谈流程管理', icon: '', version: 'v2.1' },
          { id: 3, name: 'AI洞察分析', type: 'AI工具', description: 'AI用户洞察', icon: '', version: 'v2.7' },
          { id: 4, name: '数据可视化', type: '软件', description: '调研数据可视化', icon: '', version: 'v3.0' },
          { id: 5, name: '报告生成器', type: 'AI工具', description: '调研报告生成', icon: '', version: 'v2.4' }
        ]
      }
    ],
    analysis: [
      {
        id: 1,
        name: "数据可视化",
        description: "数据图表可视化展示",
        icon: "",
        difficulty: "中等",
        tools: [
          { id: 1, name: 'ECharts图表库', type: '软件', description: '丰富图表类型', icon: '', version: 'v5.4' },
          { id: 2, name: 'Tableau可视化', type: '软件', description: '专业数据可视化', icon: '', version: 'v2023.1' },
          { id: 3, name: 'BI仪表盘', type: '工作流', description: '交互式仪表盘', icon: '', version: 'v3.2' },
          { id: 4, name: 'AI图表推荐', type: 'AI工具', description: 'AI推荐合适图表', icon: '', version: 'v2.0' }
        ]
      },
      {
        id: 2,
        name: "趋势分析",
        description: "业务趋势分析预测",
        icon: "",
        difficulty: "高级",
        tools: [
          { id: 1, name: '时间序列分析', type: 'AI工具', description: '趋势预测模型', icon: '', version: 'v3.5' },
          { id: 2, name: '回归分析工具', type: '软件', description: '数据回归分析', icon: '', version: 'v2.7' },
          { id: 3, name: '异常检测', type: 'AI工具', description: 'AI异常值检测', icon: '', version: 'v2.1' },
          { id: 4, name: '预测报告生成', type: 'AI工具', description: '自动生成预测报告', icon: '', version: 'v1.8' }
        ]
      },
      {
        id: 3,
        name: "报表生成",
        description: "自动化报表生成",
        icon: "",
        difficulty: "简单",
        tools: [
          { id: 1, name: '报表自动化工作流', type: '工作流', description: '自动生成周报月报', icon: '', version: 'v2.9' },
          { id: 2, name: 'Excel模板库', type: '软件', description: '丰富报表模板', icon: '', version: 'v4.1' },
          { id: 3, name: 'PDF生成器', type: '软件', description: '导出PDF报表', icon: '', version: 'v3.0' },
          { id: 4, name: '邮件发送工具', type: '工作流', description: '自动发送报表', icon: '', version: 'v2.3' }
        ]
      },
      {
        id: 4,
        name: "用户行为",
        description: "用户行为数据分析",
        icon: "",
        difficulty: "中等",
        tools: [
          { id: 1, name: '用户路径分析', type: 'AI工具', description: '分析用户行为路径', icon: '', version: 'v3.3' },
          { id: 2, name: '热力图工具', type: '软件', description: '页面热力图分析', icon: '', version: 'v2.5' },
          { id: 3, name: '漏斗分析', type: '软件', description: '转化漏斗分析', icon: '', version: 'v3.1' },
          { id: 4, name: '留存分析', type: 'AI工具', description: '用户留存率分析', icon: '', version: 'v2.0' }
        ]
      },
      {
        id: 5,
        name: "A/B测试",
        description: "A/B测试数据分析",
        icon: "",
        difficulty: "高级",
        tools: [
          { id: 1, name: 'A/B测试平台', type: '软件', description: '实验设计与管理', icon: '', version: 'v4.0' },
          { id: 2, name: '统计显著性检验', type: '软件', description: '统计分析工具', icon: '', version: 'v2.6' },
          { id: 3, name: 'AI实验优化', type: 'AI工具', description: 'AI优化实验设计', icon: '', version: 'v1.9' },
          { id: 4, name: '结果报告生成', type: 'AI工具', description: '生成测试报告', icon: '', version: 'v2.2' }
        ]
      },
      {
        id: 6,
        name: "业务洞察",
        description: "深度业务洞察分析",
        icon: "",
        difficulty: "高级",
        tools: [
          { id: 1, name: 'AI洞察引擎', type: 'AI工具', description: 'AI深度数据洞察', icon: '', version: 'v3.7' },
          { id: 2, name: '多维度分析', type: '软件', description: '多维数据分析', icon: '', version: 'v2.9' },
          { id: 3, name: '关联分析工具', type: 'AI工具', description: '发现数据关联', icon: '', version: 'v2.4' },
          { id: 4, name: '决策建议生成', type: 'AI工具', description: 'AI业务决策建议', icon: '', version: 'v1.6' },
          { id: 5, name: '报告演示工具', type: '软件', description: '洞察报告演示', icon: '', version: 'v3.1' }
        ]
      }
    ],
    ai: [
      {
        id: 1,
        name: "OpenAI 模型",
        description: "GPT系列强大的语言模型",
        icon: "🤖",
        difficulty: "简单",
        tools: [
          { id: 1, name: 'GPT-4', type: 'AI模型', description: '最强大的GPT模型', icon: '🧠', version: 'v4.0' },
          { id: 2, name: 'GPT-4 Turbo', type: 'AI模型', description: '更快更经济的GPT-4', icon: '⚡', version: 'v4.0' },
          { id: 3, name: 'GPT-3.5 Turbo', type: 'AI模型', description: '快速且经济的对话模型', icon: '💬', version: 'v3.5' }
        ]
      },
      {
        id: 2,
        name: "Anthropic Claude",
        description: "Claude系列智能对话模型",
        icon: "🧠",
        difficulty: "简单",
        tools: [
          { id: 1, name: 'Claude 3.5 Sonnet', type: 'AI模型', description: '平衡性能与成本', icon: '🎵', version: 'v3.5' },
          { id: 2, name: 'Claude 3 Opus', type: 'AI模型', description: '最强大的Claude模型', icon: '👑', version: 'v3.0' },
          { id: 3, name: 'Claude 3 Haiku', type: 'AI模型', description: '快速且经济', icon: '🌸', version: 'v3.0' }
        ]
      },
      {
        id: 3,
        name: "豆包 AI",
        description: "字节跳动的AI模型服务",
        icon: "🫘",
        difficulty: "简单",
        tools: [
          { id: 1, name: '豆包 Pro', type: 'AI模型', description: '专业级对话模型', icon: '💼', version: 'v1.0' },
          { id: 2, name: '豆包 Lite', type: 'AI模型', description: '轻量快速的对话模型', icon: '⚡', version: 'v1.0' }
        ]
      },
      {
        id: 4,
        name: "通义千问",
        description: "阿里云的通义千问AI模型",
        icon: "💬",
        difficulty: "简单",
        tools: [
          { id: 1, name: '通义千问 Plus', type: 'AI模型', description: '强大的中文理解能力', icon: '🇨🇳', version: 'v2.0' },
          { id: 2, name: '通义千问 Turbo', type: 'AI模型', description: '快速响应的中文模型', icon: '⚡', version: 'v2.0' }
        ]
      },
      {
        id: 5,
        name: "智谱 AI",
        description: "智谱AI的GLM系列模型",
        icon: "⚡",
        difficulty: "简单",
        tools: [
          { id: 1, name: 'GLM-4', type: 'AI模型', description: '新一代对话模型', icon: '🌟', version: 'v4.0' },
          { id: 2, name: 'GLM-3 Turbo', type: 'AI模型', description: '高效的对话模型', icon: '💨', version: 'v3.0' }
        ]
      }
    ]
  })

  // 具体工具配置（每个工作项目包含的具体工具） - 改为state以支持编辑
  const [workItemTools, setWorkItemTools] = useState<Record<string, Array<{
    id: number
    name: string
    type: string
    description: string
    icon: string
    version?: string
    latestVersion?: string
    hasUpdate?: boolean
  }>>>({
    'text-1': [ // 智能文章生成
      { id: 1, name: "ChatGPT 文章助手", type: "AI工具", description: "使用GPT生成文章内容", icon: "", version: "v2.1.0", latestVersion: "v2.3.0", hasUpdate: true },
      { id: 2, name: "文章模板工作流", type: "工作流", description: "预设模板自动生成", icon: "", version: "v1.5.0", latestVersion: "v1.5.0" },
      { id: 3, name: "SEO优化器", type: "AI工具", description: "自动优化SEO关键词", icon: "", version: "v3.0.0", latestVersion: "v3.0.0" },
      { id: 4, name: "内容检测工具", type: "软件", description: "原创性和质量检测", icon: "", version: "v1.2.0", latestVersion: "v1.4.0", hasUpdate: true },
      { id: 5, name: "批量生成工作流", type: "工作流", description: "批量文章生成流程", icon: "", version: "v2.0.0", latestVersion: "v2.0.0" }
    ],
    'product-1': [ // 市场分析
      { id: 1, name: "市场调研工作流", type: "工作流", description: "完整市场调研流程", icon: "", version: "v1.8.0", latestVersion: "v2.0.0", hasUpdate: true },
      { id: 2, name: "数据分析助手", type: "AI工具", description: "智能数据分析解读", icon: "", version: "v3.2.0", latestVersion: "v3.2.0" },
      { id: 3, name: "问卷设计器", type: "软件", description: "专业问卷设计工具", icon: "", version: "v2.1.0", latestVersion: "v2.1.0" },
      { id: 4, name: "Excel分析插件", type: "软件", description: "Excel数据分析插件", icon: "", version: "v1.5.0", latestVersion: "v1.7.0", hasUpdate: true },
      { id: 5, name: "报告生成器", type: "AI工具", description: "自动生成分析报告", icon: "", version: "v2.3.0", latestVersion: "v2.3.0" },
      { id: 6, name: "图表制作工具", type: "软件", description: "专业图表制作软件", icon: "", version: "v1.9.0", latestVersion: "v1.9.0" },
      { id: 7, name: "趋势预测模型", type: "AI工具", description: "AI趋势预测分析", icon: "", version: "v1.0.0", latestVersion: "v1.2.0", hasUpdate: true }
    ],
    'product-2': [ // 竞品分析
      { id: 1, name: "竞品分析工作流", type: "工作流", description: "系统化竞品分析流程", icon: "", version: "v2.5.0", latestVersion: "v2.5.0" },
      { id: 2, name: "产品对比工具", type: "软件", description: "功能特性对比分析", icon: "", version: "v1.3.0", latestVersion: "v1.5.0", hasUpdate: true },
      { id: 3, name: "价格监控助手", type: "AI工具", description: "竞品价格实时监控", icon: "", version: "v1.1.0", latestVersion: "v1.1.0" },
      { id: 4, name: "用户评价分析", type: "AI工具", description: "竞品用户反馈分析", icon: "", version: "v2.0.0", latestVersion: "v2.0.0" },
      { id: 5, name: "SWOT分析模板", type: "工作流", description: "SWOT分析标准流程", icon: "", version: "v1.4.0", latestVersion: "v1.4.0" }
    ],
    'product-3': [ // PRD撰写
      { id: 1, name: "PRD模板工作流", type: "工作流", description: "标准PRD撰写流程", icon: "", version: "v3.0.0", latestVersion: "v3.2.0", hasUpdate: true },
      { id: 2, name: "需求收集助手", type: "AI工具", description: "智能需求整理分析", icon: "", version: "v2.1.0", latestVersion: "v2.1.0" },
      { id: 3, name: "文档协作平台", type: "软件", description: "团队协作撰写工具", icon: "", version: "v4.5.0", latestVersion: "v4.5.0" },
      { id: 4, name: "版本管理系统", type: "软件", description: "文档版本控制管理", icon: "", version: "v1.8.0", latestVersion: "v2.0.0", hasUpdate: true }
    ]
})

  useEffect(() => {
    if (activeModule === 'all') {
      if (selectedWorkItem !== null) {
        setSelectedWorkItem(null)
      }
      return
    }

    const items = workItems[activeModule as keyof typeof workItems] || []

    if (items.length === 0) {
      if (selectedWorkItem !== null) {
        setSelectedWorkItem(null)
      }
      return
    }

    const defaultKey = `${activeModule}-${items[0].id}`
    const hasSelectedInModule = !!selectedWorkItem &&
      selectedWorkItem.startsWith(`${activeModule}-`) &&
      items.some(item => `${activeModule}-${item.id}` === selectedWorkItem)

    if (!hasSelectedInModule) {
      setSelectedWorkItem(defaultKey)
    }
  }, [activeModule, workItems, selectedWorkItem])

  // 我的工作流 - 从API获取
  const [myWorkflows, setMyWorkflows] = useState<Array<{
    id: string
    name: string
    category: string
    icon: string
    status: string
    lastUsed: string
    useCount: number
    useFrequency: string
  }>>([])

  // 获取用户的工作流
  useEffect(() => {
    const fetchMyWorkflows = async () => {
      try {
        const response = await api.get('/api/workflows/my')
        const workflows = response.data.workflows

        // 将后端数据映射到前端格式
        const formattedWorkflows = workflows.map((wf: any) => {
          // 计算最后使用时间（使用updatedAt）
          const updatedAt = new Date(wf.updatedAt)
          const now = new Date()
          const diffMs = now.getTime() - updatedAt.getTime()
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
          const diffDays = Math.floor(diffHours / 24)

          let lastUsed = ''
          if (diffHours < 1) {
            lastUsed = '刚刚'
          } else if (diffHours < 24) {
            lastUsed = `${diffHours}小时前`
          } else {
            lastUsed = `${diffDays}天前`
          }

          // 根据执行次数计算使用频率
          const useCount = wf._count?.executions || 0
          let useFrequency = '低频'
          if (useCount > 100) {
            useFrequency = '高频'
          } else if (useCount > 30) {
            useFrequency = '中频'
          }

          return {
            id: wf.id,
            name: wf.title,
            category: wf.category || 'other',
            icon: wf.thumbnail || '',
            status: wf.isDraft ? '草稿' : '运行中',
            lastUsed,
            useCount,
            useFrequency
          }
        })

        setMyWorkflows(formattedWorkflows)
      } catch (error) {
        console.error('获取工作流列表失败:', error)
      }
    }

    fetchMyWorkflows()
  }, [])

  // 按使用频率排序的工作流（根据visibleWorkflowCount动态显示，最多20个）
  const allFrequentWorkflows = [...myWorkflows]
    .filter(w => w.status === '运行中')
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, 20)

  const frequentWorkflows = allFrequentWorkflows.slice(0, visibleWorkflowCount)

  // 工作流选择弹窗的过滤逻辑
  const getFilteredWorkflowsForSelection = () => {
    return myWorkflows.filter(workflow => {
      // 按状态过滤
      if (workflowFilterStatus !== 'all' && workflow.status !== workflowFilterStatus) {
        return false
      }

      // 按搜索关键词过滤
      if (workflowSearchQuery &&
          !workflow.name.toLowerCase().includes(workflowSearchQuery.toLowerCase())) {
        return false
      }

      // 可选：按当前选中的模块过滤
      if (workflowSelectionCardId) {
        const selectedModuleId = selectedModules.get(workflowSelectionCardId)
        if (selectedModuleId && selectedModuleId !== 'all') {
          if (workflow.category !== selectedModuleId) {
            return false
          }
        }
      }

      return true
    })
  }

  // 模块使用统计数据
  const moduleUsageStats = moduleCategories
    .filter(m => m.id !== 'all')
    .map(module => {
      const workflowsInModule = myWorkflows.filter(w => w.category === module.id)
      const totalUseCount = workflowsInModule.reduce((sum, w) => sum + w.useCount, 0)
      return {
        ...module,
        workflowCount: workflowsInModule.length,
        totalUseCount,
        lastUsed: workflowsInModule[0]?.lastUsed || '未使用'
      }
    })
    .sort((a, b) => b.totalUseCount - a.totalUseCount)

  // 工作项使用统计数据
  const workItemUsageStats = Object.entries(workItems).flatMap(([category, items]) =>
    items.map(item => {
      // 模拟使用次数，实际应该从数据库获取
      const useCount = Math.floor(Math.random() * 100) + 10
      const weeklyUseCount = Math.floor(Math.random() * 15) // 模拟每周使用次数 0-14次
      const module = moduleCategories.find(m => m.id === category)
      return {
        ...item,
        category,
        categoryName: module?.name || category,
        categoryIcon: module?.icon || '',
        categoryColor: module?.color || '#8b5cf6',
        useCount,
        weeklyUseCount,
        workItemKey: `${category}-${item.id}`
      }
    })
  ).sort((a, b) => b.weeklyUseCount - a.weeklyUseCount)

  // 日常工作筛选标准：每周使用次数 >= 5次
  const DAILY_WORK_THRESHOLD = 5
  const dailyWorkItems = workItemUsageStats.filter(item => item.weeklyUseCount >= DAILY_WORK_THRESHOLD)

  // 日常工作显示数量和列表
  const dailyWorkItemCount = dailyWorkItems.length
  const displayedWorkItems = dailyWorkItems.slice(0, 12) // 最多显示12个

  // 草稿工作流
  const draftWorkflows = myWorkflows.filter(w => w.status === '草稿')

  // 最近更新的工作流（用户复用过但创作者有新更新的）
  const updatedWorkflows = [
    {
      id: 1,
      name: "智能文章生成",
      icon: "",
      creator: "AI写作专家",
      creatorAvatar: "",
      updateTime: "2小时前",
      updateContent: "新增SEO优化功能，提升文章质量",
      version: "v2.3.0",
      myVersion: "v2.1.0",
      category: "text"
    },
    {
      id: 4,
      name: "社媒营销助手",
      icon: "",
      creator: "营销大师",
      creatorAvatar: "",
      updateTime: "1天前",
      updateContent: "支持小红书、抖音等新平台",
      version: "v3.2.0",
      myVersion: "v3.0.0",
      category: "marketing"
    },
    {
      id: 6,
      name: "数据可视化",
      icon: "",
      creator: "数据分析师",
      creatorAvatar: "",
      updateTime: "3天前",
      updateContent: "新增3D图表和交互式仪表盘",
      version: "v1.8.0",
      myVersion: "v1.5.0",
      category: "analysis"
    }
  ]

  // 最近工作
  const recentWork = [
    { id: 1, name: "季度报告分析", type: "analysis", time: "10分钟前", status: "completed" },
    { id: 2, name: "产品图片优化", type: "image", time: "1小时前", status: "processing" },
    { id: 3, name: "营销文案创作", type: "text", time: "3小时前", status: "completed" },
    { id: 4, name: "视频字幕生成", type: "video", time: "1天前", status: "completed" }
  ]

  // 个性化推荐
  const recommendations = [
    { id: 1, name: "AI写作助手", category: "text", description: "基于你的文字处理习惯推荐", popularity: "热门" },
    { id: 2, name: "智能抠图工具", category: "image", description: "提升图片处理效率", popularity: "推荐" },
    { id: 3, name: "数据洞察分析", category: "analysis", description: "深度分析业务数据", popularity: "新品" }
  ]

  // 一键导入模板
  const importTemplates = [
    { id: 1, name: "电商运营套装", modules: ["text", "image", "marketing"], workflows: 8 },
    { id: 2, name: "内容创作工具包", modules: ["text", "image", "video"], workflows: 12 },
    { id: 3, name: "数据分析套件", modules: ["analysis", "product"], workflows: 6 },
    { id: 4, name: "营销推广全家桶", modules: ["marketing", "text", "image"], workflows: 15 }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case '运行中': return { bg: '#dcfce7', color: '#166534' }
      case '草稿': return { bg: '#fef3c7', color: '#92400e' }
      case 'completed': return { bg: '#dcfce7', color: '#166534' }
      case 'processing': return { bg: '#dbeafe', color: '#1e40af' }
      default: return { bg: '#f3f4f6', color: '#374151' }
    }
  }

  const activeModuleItems = activeModule === 'all' ? [] : (workItems[activeModule as keyof typeof workItems] || [])
  const activeModuleToolTotal = activeModuleItems.reduce((sum, item) => {
    const key = `${activeModule}-${item.id}`
    const recorded = typeof item.toolCount === 'number' && item.toolCount > 0
      ? item.toolCount
      : (workItemTools[key as keyof typeof workItemTools]?.length || 0)
    return sum + recorded
  }, 0)

  const activeWorkflowCount = myWorkflows.filter(workflow => workflow.status === '运行中').length
  const draftWorkflowCount = myWorkflows.filter(workflow => workflow.status === '草稿').length
  const pageBackgroundStyle = {
    minHeight: '100vh',
    background: `
      linear-gradient(to right, #e5e7eb 1px, transparent 1px),
      linear-gradient(to bottom, #e5e7eb 1px, transparent 1px),
      #fafafa
    `,
    backgroundSize: '24px 24px',
    padding: '2rem 0',
    position: 'relative' as const
  }
  const contentContainerStyle = {
    width: '100%',
    minHeight: 'calc(100vh - 4rem)',
    margin: '0',
    padding: '2rem',
    position: 'relative' as const
  }
  const heroCardStyle: CSSProperties = {
    background: 'linear-gradient(135deg, #7c3aed 0%, #4338ca 45%, #1e1b4b 100%)',
    borderRadius: '28px',
    padding: '2.75rem 3rem',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 30px 80px rgba(67, 56, 202, 0.25)'
  }
  const sectionCardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    padding: '2rem',
    backdropFilter: 'blur(10px)'
  }
  const chipBaseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    color: '#374151',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
  }
  const heroStats = [
    { icon: '', label: '最近常用', value: `${activeWorkflowCount} 个` },
    { icon: '', label: '日常工作', value: `${dailyWorkItemCount} 项` },
    { icon: '', label: '草稿箱', value: `${draftWorkflowCount} 个` },
    { icon: '', label: '最近更新', value: recentWork[0]?.time ?? '刚刚' }
  ]

  return (
    <>
    <div style={pageBackgroundStyle}>

      <div style={contentContainerStyle}>
        {/* 快捷操作卡片区 - 固定在顶部 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
          maxWidth: '1200px'
        }}>
          {heroStats.map(stat => (
            <div
              key={stat.label}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              onClick={() => {
                if (stat.label === '最近常用') {
                  setVisibleWorkflowCount(6)
                  setShowRecentWorkflowsModal(true)
                } else if (stat.label === '日常工作') {
                  setShowFrequentModulesModal(true)
                } else if (stat.label === '草稿箱') {
                  setShowDraftsModal(true)
                } else if (stat.label === '最近更新') {
                  setShowRecentUpdatesModal(true)
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* 工作台控制按钮组 */}
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          zIndex: 1000
        }}>
          {/* 创建容器按钮 */}
          <button
            onClick={handleCreateContainer}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: '2px solid #10b981',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: '#10b981',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#10b981'
              e.currentTarget.style.color = 'white'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white'
              e.currentTarget.style.color = '#10b981'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            title="创建容器"
          >
            📦
          </button>

          {/* 避让功能开关 */}
          <button
            onClick={handleToggleAvoidance}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: isAvoidanceEnabled ? '#8b5cf6' : 'white',
              border: `2px solid ${isAvoidanceEnabled ? '#8b5cf6' : '#e5e7eb'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              color: isAvoidanceEnabled ? 'white' : '#6b7280',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
            title={isAvoidanceEnabled ? '禁用避让' : '启用避让'}
          >
            {isAvoidanceEnabled ? '🧲' : '⭕'}
          </button>

          {/* 分隔线 */}
          <div style={{
            width: '100%',
            height: '2px',
            backgroundColor: '#e5e7eb',
            margin: '0.25rem 0'
          }}></div>

          {/* 缩放控制 */}
          <button
            onClick={handleZoomIn}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#8b5cf6',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#8b5cf6'
              e.currentTarget.style.color = 'white'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white'
              e.currentTarget.style.color = '#8b5cf6'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            +
          </button>
          <button
            onClick={handleResetZoom}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#6b7280',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomOut}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#8b5cf6',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#8b5cf6'
              e.currentTarget.style.color = 'white'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white'
              e.currentTarget.style.color = '#8b5cf6'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            −
          </button>
        </div>

        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '1100px',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease'
          }}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
        >
        {/* 渲染画布元素（容器和卡片） */}
        {cards.map((cardConfig) => {
          // 如果是容器类型，渲染容器
          if (cardConfig.type === 'container') {
            const card = getCardConfig(cardConfig.id)
            return (
              <div
                key={cardConfig.id}
                onMouseDown={(e) => handleCardMouseDown(cardConfig.id, e)}
                style={{
                  position: 'absolute',
                  left: card.position.x,
                  top: card.position.y,
                  width: card.size.width,
                  height: card.size.height,
                  zIndex: card.zIndex,
                  padding: '8px',
                  cursor: draggingCard === cardConfig.id ? 'grabbing' : 'grab',
                  transition: draggingCard === cardConfig.id
                    ? 'box-shadow 0.2s ease, width 0.2s ease, height 0.2s ease'
                    : 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, width 0.2s ease, height 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(209, 250, 229, 0.5)',
                    border: '3px dashed #10b981',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    color: '#059669',
                    fontWeight: 'bold',
                    boxShadow: draggingCard === cardConfig.id
                      ? '0 8px 32px rgba(16, 185, 129, 0.3)'
                      : '0 2px 8px rgba(0,0,0,0.1)',
                    position: 'relative'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                    <div>容器</div>
                  </div>
                  {/* 调整大小手柄 */}
                  <div
                    className="resize-handle"
                    onMouseDown={(e) => handleResizeMouseDown(cardConfig.id, e)}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '20px',
                      height: '20px',
                      cursor: 'se-resize',
                      backgroundColor: '#10b981',
                      borderRadius: '0 0 8px 0'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" style={{ fill: 'white', opacity: 0.7 }}>
                      <path d="M20 20 L20 10 L10 20 Z" />
                    </svg>
                  </div>
                </div>
              </div>
            )
          }

          // 如果是卡片类型，渲染工作流卡片
          const jobRole = jobRoles.find(role => role.id === cardConfig.id)
          if (!jobRole) return null

          const card = getCardConfig(cardConfig.id)
          const isExpanded = expandedCards.has(cardConfig.id)
          return (
            <div
              key={cardConfig.id}
              onMouseDown={(e) => handleCardMouseDown(cardConfig.id, e)}
              onDoubleClick={(e) => {
                // 最小状态时：双击整个卡片展开
                if (!isExpanded) {
                  e.stopPropagation()
                  handleCardDoubleClick(cardConfig.id)
                }
                // 展开状态时：双击四周空白位置（padding区域）收缩
                else if (e.target === e.currentTarget) {
                  e.stopPropagation()
                  handleCardDoubleClick(cardConfig.id)
                }
              }}
              style={{
                position: 'absolute',
                left: card.position.x,
                top: card.position.y,
                width: card.size.width,
                height: card.size.height,
                zIndex: card.zIndex,
                padding: '8px',
                cursor: draggingCard === cardConfig.id ? 'grabbing' : 'grab',
                // 平滑动画效果 - 只在非拖拽元素上应用
                transition: draggingCard === cardConfig.id
                  ? 'box-shadow 0.2s ease, width 0.2s ease, height 0.2s ease'
                  : 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, width 0.2s ease, height 0.2s ease'
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  ...sectionCardStyle,
                  overflow: 'hidden',
                  borderTop: `4px solid ${jobRole.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: draggingCard === cardConfig.id
                    ? `0 8px 32px ${jobRole.color}40`
                    : '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
              {/* 标题栏区域 */}
              <div
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  handleCardDoubleClick(cardConfig.id)
                }}
                style={{
                  padding: isExpanded ? '0.75rem 1rem' : '0.5rem 0.5rem',
                  backgroundColor: draggingCard === cardConfig.id ? `${jobRole.color}15` : `${jobRole.color}08`,
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  cursor: 'pointer'
                }}
              >
                {/* AI工具特殊显示：大Logo + 名称 */}
                {cardConfig.id.startsWith('ai-tool-') ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isExpanded ? '1rem' : '0.5rem',
                    width: '100%',
                    justifyContent: isExpanded ? 'flex-start' : 'center'
                  }}>
                    <div style={{
                      fontSize: isExpanded ? '3rem' : '2rem',
                      lineHeight: 1
                    }}>
                      {jobRole.icon}
                    </div>
                    <div style={{
                      flex: 1,
                      fontWeight: 600,
                      color: '#111827',
                      fontSize: isExpanded ? '1.5rem' : '1rem'
                    }}>
                      {jobRole.name}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 拖拽图标 */}
                    {isExpanded && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        opacity: 0.4
                      }}>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: jobRole.color }}></div>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: jobRole.color }}></div>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: jobRole.color }}></div>
                      </div>
                    )}
                    <div style={{ flex: 1, fontWeight: 600, color: '#111827', fontSize: isExpanded ? '1.9rem' : '1.5rem' }}>
                      {jobRole.name}
                    </div>
                  </>
                )}
                {isExpanded && (
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                    双击标题栏收缩
                  </div>
                )}
              </div>

              {/* 调整大小手柄 */}
              <div
                className="resize-handle"
                onMouseDown={(e) => handleResizeMouseDown(cardConfig.id, e)}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '20px',
                  height: '20px',
                  cursor: 'nwse-resize',
                  background: `linear-gradient(135deg, transparent 50%, ${jobRole.color} 50%)`,
                  borderRadius: '0 0 16px 0',
                  zIndex: 10
                }}
              />

              {/* 卡片内容区域 */}
              <div
                className="card-content"
                onDoubleClick={(e) => {
                  // 展开状态时：双击内容区域的空白处收缩
                  if (isExpanded && e.target === e.currentTarget) {
                    e.stopPropagation()
                    handleCardDoubleClick(cardConfig.id)
                  }
                }}
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: isExpanded ? '1.5rem' : '0.25rem',
                  cursor: 'default'
                }}
              >
                {!isExpanded ? (
                  /* 未展开状态：显示简洁提示 */
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    height: '100%',
                    gap: '0.25rem',
                    padding: '0.25rem'
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: '11px',
                      color: '#9ca3af',
                      textAlign: 'center',
                      lineHeight: 1.3
                    }}>
                      {jobRole.modules.filter(m => m !== 'all').length} 个模块
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '10px',
                      color: '#d1d5db',
                      textAlign: 'center',
                      lineHeight: 1.2
                    }}>
                      双击查看
                    </p>
                  </div>
                ) : executingWorkflow.get(cardConfig.id) ? (
                  /* 第五层：工作流执行界面 */
                  (() => {
                    const workflowExecution = executingWorkflow.get(cardConfig.id)!
                    const selectedModuleId = selectedModules.get(cardConfig.id)!
                    const selectedModule = moduleCategories.find(m => m.id === selectedModuleId)
                    const executionData = workflowExecutionData.get(cardConfig.id) || { prompt: '', outputs: [], isExecuting: false }
                    const isEditingWorkflowMode = editingWorkflow.has(cardConfig.id)

                    // 如果在工作流编辑模式，显示编辑界面
                    if (isEditingWorkflowMode) {
                      return (
                        <>
                          <div style={{
                            marginBottom: '1.5rem',
                            paddingBottom: '1rem',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div>
                              <h3 style={{
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                color: '#111827',
                                margin: '0 0 0.5rem'
                              }}>
                                编辑工作流 - {workflowExecution.toolName}
                              </h3>
                              <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#6b7280'
                              }}>
                                可视化工作流编辑器
                              </p>
                            </div>
                            <button
                              onClick={() => handleExitWorkflowEditor(cardConfig.id)}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#f3f4f6',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                fontWeight: 500,
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e5e7eb'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#f3f4f6'
                              }}
                            >
                              ← 返回执行界面
                            </button>
                          </div>

                          {/* 工作流编辑器画布 */}
                          <div
                            onDoubleClick={(e) => {
                              // 双击空白处收缩
                              if (e.target === e.currentTarget) {
                                e.stopPropagation()
                                handleCardDoubleClick(cardConfig.id)
                              }
                            }}
                            style={{
                              flex: 1,
                              backgroundColor: '#f9fafb',
                              borderRadius: '12px',
                              border: '2px solid #e5e7eb',
                              padding: '2rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1.5rem',
                              minHeight: '650px',
                              maxHeight: '650px',
                              overflowY: 'auto',
                              backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                              backgroundSize: '20px 20px'
                            }}>
                            {/* 节点工具栏 */}
                            <div style={{
                              display: 'flex',
                              gap: '0.5rem',
                              padding: '1rem',
                              backgroundColor: 'white',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}>
                              <button
                                onClick={() => handleAddNode(cardConfig.id)}
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: '#f3f4f6',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = selectedModule?.color || '#8b5cf6'
                                  e.currentTarget.style.color = 'white'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                                  e.currentTarget.style.color = 'inherit'
                                }}
                              >
                                + 添加节点
                              </button>
                            </div>

                            {/* 连接模式提示 */}
                            {connectingFrom && connectingFrom.jobRoleId === cardConfig.id && (() => {
                              const nodes = workflowNodes.get(cardConfig.id) || []
                              const sourceNode = nodes.find(n => n.id === connectingFrom.nodeId)
                              return (
                                <div style={{
                                  padding: '0.75rem 1rem',
                                  backgroundColor: '#fef3c7',
                                  border: '2px solid #fcd34d',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  animation: 'pulse 2s infinite'
                                }}>
                                  <div style={{
                                    fontSize: '1.2rem'
                                  }}>
                                    🔗
                                  </div>
                                  <div style={{
                                    flex: 1
                                  }}>
                                    <div style={{
                                      fontSize: '0.85rem',
                                      fontWeight: 600,
                                      color: '#92400e',
                                      marginBottom: '0.15rem'
                                    }}>
                                      连接模式已激活
                                    </div>
                                    <div style={{
                                      fontSize: '0.75rem',
                                      color: '#78350f'
                                    }}>
                                      从 "{sourceNode?.label}" 创建连接 → 点击目标节点完成连接
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => setConnectingFrom(null)}
                                    style={{
                                      padding: '0.4rem 0.8rem',
                                      backgroundColor: 'white',
                                      border: '1px solid #fbbf24',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 500,
                                      color: '#92400e',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#fef3c7'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'white'
                                    }}
                                  >
                                    取消连接
                                  </button>
                                </div>
                              )
                            })()}

                            {/* 工作流节点画布和配置面板 */}
                            <div
                              onDoubleClick={(e) => {
                                // 双击空白处收缩
                                if (e.target === e.currentTarget) {
                                  e.stopPropagation()
                                  handleCardDoubleClick(cardConfig.id)
                                }
                              }}
                              style={{
                                flex: 1,
                                display: 'flex',
                                gap: '1rem',
                                minHeight: '450px'
                              }}>
                              {/* 左侧：节点画布 */}
                              <div
                                onDoubleClick={(e) => {
                                  // 双击画布空白处收缩
                                  if (e.target === e.currentTarget) {
                                    e.stopPropagation()
                                    handleCardDoubleClick(cardConfig.id)
                                  }
                                }}
                                style={{
                                  flex: selectedNode ? '0 0 60%' : '1',
                                  position: 'relative',
                                  minHeight: '400px',
                                  transition: 'all 0.3s'
                                }}
                              >
                                {(() => {
                                  const nodes = workflowNodes.get(cardConfig.id) || []
                                  const connections = nodeConnections.get(cardConfig.id) || []
                                  const nodeColor = selectedModule?.color || '#8b5cf6'

                                  return (
                                    <>
                                      {/* SVG连线层 */}
                                      <svg
                                        style={{
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          width: '100%',
                                          height: '100%',
                                          pointerEvents: connectingFrom && connectingFrom.jobRoleId === cardConfig.id ? 'all' : 'none',
                                          zIndex: 0
                                        }}
                                        onMouseMove={(e) => {
                                          if (connectingFrom && connectingFrom.jobRoleId === cardConfig.id) {
                                            const svg = e.currentTarget
                                            const pt = svg.createSVGPoint()
                                            pt.x = e.clientX
                                            pt.y = e.clientY
                                            const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
                                            setMousePosition({ x: svgP.x, y: svgP.y })
                                          }
                                        }}
                                      >
                                        {connections.map((conn, index) => {
                                          const fromNode = nodes.find(n => n.id === conn.from)
                                          const toNode = nodes.find(n => n.id === conn.to)
                                          if (!fromNode || !toNode) return null

                                          const startX = fromNode.position.x + 90
                                          const startY = fromNode.position.y + 60
                                          const endX = toNode.position.x + 90
                                          const endY = toNode.position.y + 20

                                          return (
                                            <g key={`${conn.from}-${conn.to}-${index}`}>
                                              <line
                                                x1={startX}
                                                y1={startY}
                                                x2={endX}
                                                y2={endY}
                                                stroke="#9ca3af"
                                                strokeWidth="2"
                                                strokeDasharray="5,5"
                                              />
                                              {/* 箭头 */}
                                              <polygon
                                                points={`${endX},${endY-8} ${endX-6},${endY-2} ${endX+6},${endY-2}`}
                                                fill="#9ca3af"
                                              />
                                            </g>
                                          )
                                        })}

                                        {/* 连接模式时的鼠标跟随线 */}
                                        {connectingFrom && connectingFrom.jobRoleId === cardConfig.id && (() => {
                                          const fromNode = nodes.find(n => n.id === connectingFrom.nodeId)
                                          if (!fromNode || mousePosition.x === 0 || mousePosition.y === 0) return null

                                          const startX = fromNode.position.x + 90
                                          const startY = fromNode.position.y + 40

                                          return (
                                            <g>
                                              <line
                                                x1={startX}
                                                y1={startY}
                                                x2={mousePosition.x}
                                                y2={mousePosition.y}
                                                stroke="#f59e0b"
                                                strokeWidth="3"
                                                strokeDasharray="8,4"
                                                opacity="0.8"
                                              />
                                              {/* 鼠标位置的圆点指示器 */}
                                              <circle
                                                cx={mousePosition.x}
                                                cy={mousePosition.y}
                                                r="4"
                                                fill="#f59e0b"
                                                opacity="0.8"
                                              />
                                            </g>
                                          )
                                        })()}
                                      </svg>

                                      {/* 节点层 */}
                                      {nodes.map((node, index) => {
                                        const isSelected = selectedNode?.nodeId === node.id
                                        const isDragging = draggingNode?.nodeId === node.id
                                        const isConnecting = connectingFrom?.nodeId === node.id
                                        const isConnectTarget = connectingFrom && connectingFrom.jobRoleId === cardConfig.id && connectingFrom.nodeId !== node.id

                                        return (
                                          <div
                                            key={node.id}
                                            onMouseDown={(e) => {
                                              if (!isConnectTarget) {
                                                handleNodeMouseDown(e, cardConfig.id, node.id, node.position)
                                              }
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              if (connectingFrom && connectingFrom.jobRoleId === cardConfig.id) {
                                                handleCompleteConnection(cardConfig.id, node.id)
                                              } else {
                                                setSelectedNode({ jobRoleId: cardConfig.id, nodeId: node.id })
                                              }
                                            }}
                                            style={{
                                              position: 'absolute',
                                              left: node.position.x,
                                              top: node.position.y,
                                              backgroundColor: isConnectTarget ? '#fffbeb' : 'white',
                                              border: `3px solid ${isConnecting ? '#f59e0b' : (isConnectTarget ? '#fbbf24' : nodeColor)}`,
                                              borderRadius: '12px',
                                              padding: '0.75rem 1rem',
                                              minWidth: '180px',
                                              textAlign: 'center',
                                              boxShadow: isSelected
                                                ? `0 8px 20px ${nodeColor}50`
                                                : (isConnectTarget ? '0 0 0 3px #fef3c7' : `0 4px 12px ${nodeColor}30`),
                                              cursor: isConnectTarget ? 'pointer' : (isDragging ? 'grabbing' : 'grab'),
                                              transition: isDragging ? 'none' : 'all 0.2s',
                                              transform: isSelected ? 'scale(1.05)' : (isConnectTarget ? 'scale(1.02)' : 'scale(1)'),
                                              zIndex: isDragging ? 1000 : (isSelected ? 100 : (isConnectTarget ? 50 : index + 1))
                                            }}
                                            onMouseEnter={(e) => {
                                              if (!isDragging) {
                                                e.currentTarget.style.transform = 'scale(1.05)'
                                              }
                                            }}
                                            onMouseLeave={(e) => {
                                              if (!isDragging && !isSelected) {
                                                e.currentTarget.style.transform = 'scale(1)'
                                              }
                                            }}
                                          >
                                            {/* 右上角删除按钮 */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteNode(cardConfig.id, node.id)
                                              }}
                                              style={{
                                                position: 'absolute',
                                                top: '-8px',
                                                right: '-8px',
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                backgroundColor: '#ef4444',
                                                color: 'white',
                                                border: '2px solid white',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s',
                                                padding: 0,
                                                lineHeight: 1,
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                              }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#dc2626'
                                                e.currentTarget.style.transform = 'scale(1.1)'
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#ef4444'
                                                e.currentTarget.style.transform = 'scale(1)'
                                              }}
                                            >
                                              ×
                                            </button>

                                            <div style={{
                                              fontSize: '0.9rem',
                                              fontWeight: 600,
                                              color: nodeColor,
                                              marginBottom: '0.25rem'
                                            }}>
                                              {node.label}
                                            </div>
                                            <div style={{
                                              fontSize: '0.65rem',
                                              color: '#6b7280',
                                              marginBottom: '0.5rem'
                                            }}>
                                              {node.config.tool && <div>工具: {node.config.tool}</div>}
                                              {!node.config.tool && <div>未配置工具</div>}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  if (isConnecting) {
                                                    setConnectingFrom(null)
                                                  } else {
                                                    handleStartConnection(cardConfig.id, node.id)
                                                  }
                                                }}
                                                style={{
                                                  padding: '0.2rem 0.5rem',
                                                  backgroundColor: isConnecting ? '#fef3c7' : '#f0fdf4',
                                                  color: isConnecting ? '#f59e0b' : '#10b981',
                                                  border: `1px solid ${isConnecting ? '#fcd34d' : '#bbf7d0'}`,
                                                  borderRadius: '4px',
                                                  fontSize: '0.65rem',
                                                  cursor: 'pointer',
                                                  transition: 'all 0.2s'
                                                }}
                                              >
                                                {isConnecting ? '取消链接' : '激活链接状态'}
                                              </button>
                                            </div>
                                          </div>
                                        )
                                      })}

                                      {/* 提示文字 */}
                                      {nodes.length === 0 && (
                                        <div style={{
                                          position: 'absolute',
                                          top: '50%',
                                          left: '50%',
                                          transform: 'translate(-50%, -50%)',
                                          textAlign: 'center',
                                          color: '#9ca3af',
                                          fontSize: '0.9rem'
                                        }}>
                                          点击上方按钮添加节点
                                        </div>
                                      )}
                                    </>
                                  )
                                })()}
                              </div>

                              {/* 右侧：节点配置面板 */}
                              {selectedNode && (() => {
                                const nodes = workflowNodes.get(cardConfig.id) || []
                                const node = nodes.find(n => n.id === selectedNode.nodeId)
                                if (!node) return null

                                const nodeColor = selectedModule?.color || '#8b5cf6'

                                return (
                                  <div style={{
                                    flex: '0 0 38%',
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    border: '2px solid #e5e7eb',
                                    padding: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    maxHeight: '450px',
                                    overflowY: 'auto'
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      paddingBottom: '0.75rem',
                                      borderBottom: `2px solid ${nodeColor}`
                                    }}>
                                      <h4 style={{
                                        margin: 0,
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        color: nodeColor
                                      }}>
                                        节点配置
                                      </h4>
                                      <button
                                        onClick={() => setSelectedNode(null)}
                                        style={{
                                          padding: '0.25rem 0.5rem',
                                          backgroundColor: '#f3f4f6',
                                          border: 'none',
                                          borderRadius: '4px',
                                          fontSize: '0.7rem',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        ✕
                                      </button>
                                    </div>

                                    <div style={{ position: 'relative' }} data-tool-selector>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                                        模型选择
                                      </label>
                                      <div style={{ position: 'relative' }}>
                                        <input
                                          type="text"
                                          value={toolSearchQuery || node.config.tool || ''}
                                          onChange={(e) => {
                                            setToolSearchQuery(e.target.value)
                                            setIsToolSelectorOpen(true)
                                          }}
                                          onFocus={() => setIsToolSelectorOpen(true)}
                                          placeholder="搜索或选择工具/模型..."
                                          style={{
                                            width: '100%',
                                            padding: '0.5rem 2rem 0.5rem 0.5rem',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem'
                                          }}
                                        />
                                        <div
                                          onClick={() => setIsToolSelectorOpen(!isToolSelectorOpen)}
                                          style={{
                                            position: 'absolute',
                                            right: '0.5rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            color: '#9ca3af'
                                          }}
                                        >
                                          {isToolSelectorOpen ? '▲' : '▼'}
                                        </div>
                                      </div>

                                      {/* 工具选择下拉列表 */}
                                      {isToolSelectorOpen && (() => {
                                        const query = toolSearchQuery.toLowerCase()
                                        const filteredTools = availableTools.filter(tool =>
                                          tool.name.toLowerCase().includes(query) ||
                                          tool.category.toLowerCase().includes(query)
                                        )

                                        return (
                                          <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            marginTop: '0.25rem',
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            zIndex: 1000
                                          }}>
                                            {filteredTools.length > 0 ? (
                                              filteredTools.map((tool) => (
                                                <div
                                                  key={tool.id}
                                                  onClick={() => {
                                                    handleUpdateNodeConfig(cardConfig.id, node.id, { tool: tool.name })
                                                    setToolSearchQuery('')
                                                    setIsToolSelectorOpen(false)
                                                  }}
                                                  style={{
                                                    padding: '0.5rem 0.75rem',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem',
                                                    borderBottom: '1px solid #f3f4f6',
                                                    transition: 'background-color 0.15s'
                                                  }}
                                                  onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#f9fafb'
                                                  }}
                                                  onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'white'
                                                  }}
                                                >
                                                  <div style={{ fontWeight: 600, color: '#111827' }}>
                                                    {tool.name}
                                                  </div>
                                                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.1rem' }}>
                                                    {tool.category}
                                                  </div>
                                                </div>
                                              ))
                                            ) : (
                                              <div style={{
                                                padding: '0.75rem',
                                                textAlign: 'center',
                                                fontSize: '0.75rem',
                                                color: '#9ca3af'
                                              }}>
                                                没有找到匹配的工具
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })()}
                                    </div>

                                    <div>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                                        Prompt 指令
                                      </label>
                                      <textarea
                                        value={node.config.prompt || ''}
                                        onChange={(e) => handleUpdateNodeConfig(cardConfig.id, node.id, { prompt: e.target.value })}
                                        placeholder="输入节点的prompt指令..."
                                        style={{
                                          width: '100%',
                                          minHeight: '80px',
                                          padding: '0.5rem',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '6px',
                                          fontSize: '0.75rem',
                                          fontFamily: 'monospace',
                                          resize: 'vertical'
                                        }}
                                      />
                                    </div>

                                    {/* 全局操作按钮 */}
                                    <div style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.5rem',
                                      marginTop: '1rem',
                                      paddingTop: '1rem',
                                      borderTop: '1px solid #e5e7eb'
                                    }}>
                                      <button
                                        onClick={() => {
                                          // 临时应用工作流（仅当前会话有效）
                                          const workflowData = workflowCanvasData.get(cardConfig.id)
                                          if (workflowData) {
                                            sessionStorage.setItem(`workflow_${cardConfig.id}`, JSON.stringify({
                                              nodes: workflowData.nodes,
                                              connections: workflowData.connections,
                                              timestamp: new Date().toISOString()
                                            }))
                                            alert('✅ 工作流已应用到当前会话！\n\n在本次会话中，您的配置将保持有效。')
                                          }
                                        }}
                                        style={{
                                          padding: '0.65rem',
                                          backgroundColor: '#3b82f6',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '6px',
                                          fontSize: '0.8rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#2563eb'
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#3b82f6'
                                        }}
                                      >
                                        本次工作应用此工作流
                                      </button>
                                      <button
                                        onClick={() => {
                                          // 永久保存工作流到工作区
                                          const workflowData = workflowCanvasData.get(cardConfig.id)
                                          if (workflowData) {
                                            const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]')
                                            const workflowToSave = {
                                              id: `workflow-${Date.now()}`,
                                              cardId: cardConfig.id,
                                              name: `工作流副本 ${new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
                                              nodes: workflowData.nodes.map(n => ({ ...n })),
                                              connections: workflowData.connections.map(c => ({ ...c })),
                                              createdAt: new Date().toISOString()
                                            }
                                            savedWorkflows.push(workflowToSave)
                                            localStorage.setItem('savedWorkflows', JSON.stringify(savedWorkflows))

                                            // 同时应用到当前会话
                                            sessionStorage.setItem(`workflow_${cardConfig.id}`, JSON.stringify({
                                              nodes: workflowData.nodes,
                                              connections: workflowData.connections,
                                              timestamp: new Date().toISOString()
                                            }))

                                            alert('✅ 工作流已保存到我的工作流！\n\n您可以在工作区画布中找到这个工作流卡片。')
                                          }
                                        }}
                                        style={{
                                          padding: '0.65rem',
                                          backgroundColor: 'white',
                                          color: '#10b981',
                                          border: '2px solid #10b981',
                                          borderRadius: '6px',
                                          fontSize: '0.8rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#f0fdf4'
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'white'
                                        }}
                                      >
                                        应用修改到我的工作流
                                      </button>
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>

                            <div style={{
                              textAlign: 'center',
                              fontSize: '0.75rem',
                              color: '#9ca3af',
                              padding: '0.6rem',
                              backgroundColor: 'white',
                              borderRadius: '8px'
                            }}>
                              💡 拖拽节点移动 | 点击"连接"按钮后点击目标节点创建连接 | 点击节点查看配置
                            </div>
                          </div>
                        </>
                      )
                    }

                    // 正常执行界面
                    return (
                      <>
                        <div style={{
                          marginBottom: '1.5rem',
                          paddingBottom: '1rem',
                          borderBottom: '1px solid #e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <h3 style={{
                              fontSize: '1.2rem',
                              fontWeight: 600,
                              color: '#111827',
                              margin: '0 0 0.5rem'
                            }}>
                              {workflowExecution.toolName}
                            </h3>
                            <p style={{
                              margin: 0,
                              fontSize: '13px',
                              color: '#6b7280'
                            }}>
                              工作流执行界面
                            </p>
                          </div>
                          <button
                            onClick={() => handleStopWorkflowExecution(cardConfig.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#f3f4f6',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              fontWeight: 500,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#e5e7eb'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6'
                            }}
                          >
                            ← 返回工作流列表
                          </button>
                        </div>

                        <div
                          onDoubleClick={(e) => {
                            // 双击空白处收缩
                            if (e.target === e.currentTarget) {
                              e.stopPropagation()
                              handleCardDoubleClick(cardConfig.id)
                            }
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            flex: 1,
                            minHeight: 0
                          }}>
                          {/* Prompt输入区 */}
                          <div>
                            <label style={{
                              display: 'block',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#374151',
                              marginBottom: '0.5rem'
                            }}>
                              输入指令 (Prompt)
                            </label>
                            <textarea
                              value={executionData.prompt}
                              onChange={(e) => {
                                setWorkflowExecutionData(prev => {
                                  const newMap = new Map(prev)
                                  newMap.set(cardConfig.id, { ...executionData, prompt: e.target.value })
                                  return newMap
                                })
                              }}
                              placeholder="请输入您的指令或需求..."
                              style={{
                                width: '100%',
                                minHeight: '100px',
                                padding: '0.75rem',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                outline: 'none',
                                transition: 'all 0.2s'
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = selectedModule?.color || '#8b5cf6'
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb'
                              }}
                            />
                          </div>

                          {/* 工作流模块区 */}
                          <div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '0.5rem'
                            }}>
                              <label style={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#374151'
                              }}>
                                工作流模块
                              </label>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => {
                                    setWorkflowSelectionCardId(cardConfig.id)
                                    setShowWorkflowSelectionModal(true)
                                  }}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'white',
                                    color: selectedModule?.color || '#8b5cf6',
                                    border: `2px solid ${selectedModule?.color || '#8b5cf6'}`,
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f3f0ff'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white'
                                  }}
                                >
                                  更改工作流
                                </button>
                                <button
                                  onClick={() => handleEnterWorkflowEditor(cardConfig.id)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'white',
                                    color: selectedModule?.color || '#8b5cf6',
                                    border: `2px solid ${selectedModule?.color || '#8b5cf6'}`,
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f3f0ff'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white'
                                  }}
                                >
                                  重新编辑
                                </button>
                                <button
                                  onClick={() => handleRunWorkflow(cardConfig.id)}
                                  disabled={executionData.isExecuting || !executionData.prompt.trim()}
                                  style={{
                                    padding: '0.5rem 1.25rem',
                                    backgroundColor: executionData.isExecuting || !executionData.prompt.trim() ? '#d1d5db' : (selectedModule?.color || '#8b5cf6'),
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: executionData.isExecuting || !executionData.prompt.trim() ? 'not-allowed' : 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  {executionData.isExecuting ? '执行中...' : '运行'}
                                </button>
                              </div>
                            </div>
                            <div
                              onClick={() => handleEnterWorkflowEditor(cardConfig.id)}
                              style={{
                                backgroundColor: 'white',
                                border: `3px solid ${selectedModule?.color || '#8b5cf6'}`,
                                borderRadius: '12px',
                                padding: '2rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: `0 4px 12px ${selectedModule?.color || '#8b5cf6'}20`
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = `0 8px 20px ${selectedModule?.color || '#8b5cf6'}30`
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = `0 4px 12px ${selectedModule?.color || '#8b5cf6'}20`
                              }}
                            >
                              <div style={{
                                fontSize: '2rem',
                                marginBottom: '0.5rem'
                              }}>
                                ⚙️
                              </div>
                              <div style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: '#111827',
                                marginBottom: '0.5rem'
                              }}>
                                {workflowExecution.toolName}
                              </div>
                              <div style={{
                                fontSize: '0.8rem',
                                color: '#6b7280'
                              }}>
                                点击进入工作流编辑器
                              </div>
                            </div>
                          </div>

                          {/* 输出结果区 */}
                          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                            <label style={{
                              display: 'block',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#374151',
                              marginBottom: '0.5rem'
                            }}>
                              输出结果
                            </label>
                            <div style={{
                              width: '100%',
                              flex: 1,
                              minHeight: '150px',
                              padding: '0.75rem',
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              backgroundColor: '#f9fafb',
                              overflowY: 'auto',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1rem'
                            }}>
                              {executionData.outputs.length === 0 ? (
                                <div style={{
                                  color: '#9ca3af',
                                  fontSize: '0.875rem',
                                  textAlign: 'center',
                                  padding: '2rem'
                                }}>
                                  运行后的结果将显示在这里...
                                </div>
                              ) : (
                                executionData.outputs.map((output, index) => (
                                  <div key={index} style={{
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    border: '1px solid #e5e7eb',
                                    position: 'relative'
                                  }}>
                                    {/* 操作按钮组 */}
                                    <div style={{
                                      position: 'absolute',
                                      top: '0.5rem',
                                      right: '0.5rem',
                                      display: 'flex',
                                      gap: '0.5rem',
                                      zIndex: 10
                                    }}>
                                      {/* 复制按钮 */}
                                      <button
                                        onClick={() => {
                                          const contentToCopy = output.type === 'text' ? output.content : output.content
                                          navigator.clipboard.writeText(contentToCopy).then(() => {
                                            // 可以添加复制成功提示
                                            const btn = document.activeElement as HTMLElement
                                            const originalText = btn.textContent
                                            btn.textContent = '✓'
                                            setTimeout(() => {
                                              btn.textContent = originalText
                                            }, 1000)
                                          })
                                        }}
                                        style={{
                                          padding: '0.4rem 0.75rem',
                                          backgroundColor: '#f3f4f6',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          fontSize: '0.75rem',
                                          fontWeight: 500,
                                          color: '#6b7280',
                                          transition: 'all 0.2s',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.25rem'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#e5e7eb'
                                          e.currentTarget.style.color = '#374151'
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#f3f4f6'
                                          e.currentTarget.style.color = '#6b7280'
                                        }}
                                        title={output.type === 'text' ? '复制文本' : '复制链接'}
                                      >
                                        📋 {output.type === 'text' ? '复制' : '复制链接'}
                                      </button>

                                      {/* 下载按钮 (非文本类型) */}
                                      {output.type !== 'text' && (
                                        <a
                                          href={output.content}
                                          download={output.caption || `output-${index}`}
                                          style={{
                                            padding: '0.4rem 0.75rem',
                                            backgroundColor: selectedModule?.color || '#8b5cf6',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'white',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            textDecoration: 'none'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.opacity = '0.8'
                                            e.currentTarget.style.transform = 'translateY(-1px)'
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.opacity = '1'
                                            e.currentTarget.style.transform = 'translateY(0)'
                                          }}
                                          title="下载"
                                        >
                                          ⬇️ 下载
                                        </a>
                                      )}
                                    </div>

                                    {/* 内容区域 */}
                                    {output.type === 'text' && (
                                      <div style={{
                                        fontSize: '0.875rem',
                                        color: '#374151',
                                        lineHeight: 1.6,
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: 'inherit',
                                        paddingRight: '6rem'
                                      }}>
                                        {output.content}
                                      </div>
                                    )}

                                    {output.type === 'image' && (
                                      <div>
                                        <img
                                          src={output.content}
                                          alt={output.caption || '生成的图片'}
                                          style={{
                                            width: '100%',
                                            borderRadius: '6px',
                                            marginBottom: output.caption ? '0.5rem' : 0,
                                            marginTop: '2rem'
                                          }}
                                        />
                                        {output.caption && (
                                          <div style={{
                                            fontSize: '0.8rem',
                                            color: '#6b7280',
                                            fontStyle: 'italic',
                                            textAlign: 'center'
                                          }}>
                                            {output.caption}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {output.type === 'video' && (
                                      <div>
                                        <video
                                          controls
                                          style={{
                                            width: '100%',
                                            borderRadius: '6px',
                                            marginBottom: output.caption ? '0.5rem' : 0,
                                            marginTop: '2rem'
                                          }}
                                        >
                                          <source src={output.content} type="video/mp4" />
                                          您的浏览器不支持视频播放
                                        </video>
                                        {output.caption && (
                                          <div style={{
                                            fontSize: '0.8rem',
                                            color: '#6b7280',
                                            fontStyle: 'italic',
                                            textAlign: 'center'
                                          }}>
                                            {output.caption}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {output.type === 'audio' && (
                                      <div>
                                        <audio
                                          controls
                                          style={{
                                            width: '100%',
                                            marginBottom: output.caption ? '0.5rem' : 0,
                                            marginTop: '2rem'
                                          }}
                                        >
                                          <source src={output.content} type="audio/mpeg" />
                                          您的浏览器不支持音频播放
                                        </audio>
                                        {output.caption && (
                                          <div style={{
                                            fontSize: '0.8rem',
                                            color: '#6b7280',
                                            fontStyle: 'italic'
                                          }}>
                                            {output.caption}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {output.type === 'file' && (
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem',
                                        backgroundColor: '#f3f4f6',
                                        borderRadius: '6px',
                                        marginTop: '2rem'
                                      }}>
                                        <div style={{
                                          fontSize: '1.5rem'
                                        }}>
                                          📄
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{
                                            fontSize: '0.875rem',
                                            color: '#111827',
                                            fontWeight: 600
                                          }}>
                                            {output.caption || '文件'}
                                          </div>
                                          <div style={{
                                            fontSize: '0.75rem',
                                            color: '#6b7280',
                                            marginTop: '0.25rem'
                                          }}>
                                            点击右上角下载
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )
                  })()
                ) : selectedWorkItems.get(cardConfig.id) ? (
                  /* 第四层：显示选中工作项的所有工作流 */
                  (() => {
                    const selectedWorkItemId = selectedWorkItems.get(cardConfig.id)!
                    const selectedModuleId = selectedModules.get(cardConfig.id)!
                    const selectedModule = moduleCategories.find(m => m.id === selectedModuleId)
                    const moduleWorkItems = workItems[selectedModuleId] || []
                    const selectedWorkItem = moduleWorkItems.find(item => item.id === selectedWorkItemId)

                    return (
                      <>
                        <div style={{
                          marginBottom: '1.5rem',
                          paddingBottom: '1rem',
                          borderBottom: '1px solid #e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <h3 style={{
                              fontSize: '1.2rem',
                              fontWeight: 600,
                              color: '#111827',
                              margin: '0 0 0.5rem'
                            }}>
                              {selectedWorkItem?.name || '工作流详情'}
                            </h3>
                            <p style={{
                              margin: 0,
                              fontSize: '13px',
                              color: '#6b7280'
                            }}>
                              {selectedWorkItem?.description}
                            </p>
                          </div>
                          <button
                            onClick={() => handleWorkItemDoubleClick(cardConfig.id, selectedWorkItemId)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#f3f4f6',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              fontWeight: 500,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#e5e7eb'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6'
                            }}
                          >
                            ← 返回工作列表
                          </button>
                        </div>

                        <div
                          onDoubleClick={(e) => {
                            // 双击网格空白处收缩
                            if (e.target === e.currentTarget) {
                              e.stopPropagation()
                              handleCardDoubleClick(cardConfig.id)
                            }
                          }}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                            gap: '1rem',
                            maxHeight: '550px',
                            overflowY: 'auto'
                          }}>
                          {selectedWorkItem?.tools && selectedWorkItem.tools.length > 0 ? (
                            selectedWorkItem.tools.map((tool) => (
                              <div
                                key={tool.id}
                                onClick={() => handleStartWorkflowExecution(cardConfig.id, selectedWorkItemId, tool.id, tool.name)}
                                style={{
                                  backgroundColor: 'white',
                                  border: '2px solid #e5e7eb',
                                  borderRadius: '12px',
                                  padding: '1.25rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.75rem'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = selectedModule?.color || '#8b5cf6'
                                  e.currentTarget.style.boxShadow = `0 6px 16px ${selectedModule?.color || '#8b5cf6'}30`
                                  e.currentTarget.style.transform = 'translateY(-2px)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#e5e7eb'
                                  e.currentTarget.style.boxShadow = 'none'
                                  e.currentTarget.style.transform = 'translateY(0)'
                                }}
                              >
                                {tool.type === 'AI模型' ? (
                                  /* AI模型特殊显示：大图标 + 模型名称 */
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '1rem',
                                    padding: '1rem'
                                  }}>
                                    <div style={{
                                      fontSize: '3.5rem',
                                      lineHeight: 1
                                    }}>
                                      {tool.icon || '🤖'}
                                    </div>
                                    <div style={{
                                      textAlign: 'center',
                                      width: '100%'
                                    }}>
                                      <h4 style={{
                                        margin: '0 0 0.5rem',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        color: '#111827'
                                      }}>
                                        {tool.name}
                                      </h4>
                                      <p style={{
                                        margin: '0 0 0.75rem',
                                        fontSize: '0.8rem',
                                        color: '#6b7280',
                                        lineHeight: 1.4
                                      }}>
                                        {tool.description}
                                      </p>
                                      {tool.version && (
                                        <span style={{
                                          display: 'inline-block',
                                          fontSize: '0.7rem',
                                          padding: '0.25rem 0.5rem',
                                          backgroundColor: `${selectedModule?.color || '#ec4899'}15`,
                                          color: selectedModule?.color || '#ec4899',
                                          borderRadius: '4px',
                                          fontWeight: 500
                                        }}>
                                          {tool.version}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  /* 普通工具显示 */
                                  <div>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      marginBottom: '0.5rem'
                                    }}>
                                      <h4 style={{
                                        margin: 0,
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        color: '#111827'
                                      }}>
                                        {tool.name}
                                      </h4>
                                      {tool.version && (
                                        <span style={{
                                          fontSize: '0.7rem',
                                          padding: '0.25rem 0.5rem',
                                          backgroundColor: '#f3f4f6',
                                          color: '#6b7280',
                                          borderRadius: '4px'
                                        }}>
                                          {tool.version}
                                        </span>
                                      )}
                                    </div>
                                    <p style={{
                                      margin: '0 0 0.75rem',
                                      fontSize: '0.85rem',
                                      color: '#6b7280',
                                      lineHeight: 1.5
                                    }}>
                                      {tool.description}
                                    </p>
                                    <div style={{
                                      display: 'inline-block',
                                      fontSize: '0.75rem',
                                      padding: '0.25rem 0.75rem',
                                      backgroundColor: `${selectedModule?.color || '#8b5cf6'}15`,
                                      color: selectedModule?.color || '#8b5cf6',
                                      borderRadius: '6px',
                                      fontWeight: 500
                                    }}>
                                      {tool.type}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div style={{
                              gridColumn: '1 / -1',
                              textAlign: 'center',
                              padding: '3rem',
                              color: '#9ca3af'
                            }}>
                              暂无工作流
                            </div>
                          )}
                        </div>
                      </>
                    )
                  })()
                ) : selectedModules.get(cardConfig.id) ? (
                  /* 第三层：显示选中模块的工作流列表 */
                  (() => {
                    const selectedModuleId = selectedModules.get(cardConfig.id)!
                    const selectedModule = moduleCategories.find(m => m.id === selectedModuleId)
                    const moduleWorkItems = workItems[selectedModuleId] || []

                    return (
                      <>
                        <div style={{
                          marginBottom: '1.5rem',
                          paddingBottom: '1rem',
                          borderBottom: '1px solid #e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <h3 style={{
                              fontSize: '1.1rem',
                              fontWeight: 600,
                              color: '#111827',
                              margin: '0 0 0.5rem'
                            }}>
                              {selectedModule?.name || '工作流列表'}
                            </h3>
                            <p style={{
                              margin: 0,
                              fontSize: '13px',
                              color: '#6b7280'
                            }}>
                              {moduleWorkItems.length} 项工作流
                            </p>
                          </div>
                          <button
                            onClick={() => handleModuleClick(cardConfig.id, selectedModuleId)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#f3f4f6',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              fontWeight: 500,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#e5e7eb'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6'
                            }}
                          >
                            ← 返回模块
                          </button>
                        </div>

                        <div
                          onDoubleClick={(e) => {
                            // 双击网格空白处收缩
                            if (e.target === e.currentTarget) {
                              e.stopPropagation()
                              handleCardDoubleClick(cardConfig.id)
                            }
                          }}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '1rem'
                          }}>
                          {moduleWorkItems.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleWorkItemDoubleClick(cardConfig.id, item.id)}
                              style={{
                                backgroundColor: 'white',
                                border: '2px solid #e5e7eb',
                                borderRadius: '12px',
                                padding: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = selectedModule?.color || '#8b5cf6'
                                e.currentTarget.style.boxShadow = `0 6px 16px ${selectedModule?.color || '#8b5cf6'}30`
                                e.currentTarget.style.transform = 'translateY(-2px)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb'
                                e.currentTarget.style.boxShadow = 'none'
                                e.currentTarget.style.transform = 'translateY(0)'
                              }}
                            >
                              <div>
                                <h4 style={{
                                  margin: '0 0 0.5rem',
                                  fontSize: '0.95rem',
                                  fontWeight: 600,
                                  color: '#111827'
                                }}>
                                  {item.name}
                                </h4>
                                <p style={{
                                  margin: '0 0 0.75rem',
                                  fontSize: '0.8rem',
                                  color: '#6b7280',
                                  lineHeight: 1.5
                                }}>
                                  {item.description}
                                </p>
                                <div style={{
                                  fontSize: '0.75rem',
                                  color: '#9ca3af'
                                }}>
                                  难度：{item.difficulty}
                                </div>
                              </div>
                              {item.tools && item.tools.length > 0 && (
                                <div style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '0.5rem',
                                  marginTop: 'auto'
                                }}>
                                  {item.tools.slice(0, 2).map((tool, idx) => (
                                    <span
                                      key={idx}
                                      style={{
                                        fontSize: '0.7rem',
                                        padding: '0.25rem 0.5rem',
                                        backgroundColor: `${selectedModule?.color || '#8b5cf6'}15`,
                                        color: selectedModule?.color || '#8b5cf6',
                                        borderRadius: '4px'
                                      }}
                                    >
                                      {tool.name}
                                    </span>
                                  ))}
                                  {item.tools.length > 2 && (
                                    <span style={{
                                      fontSize: '0.7rem',
                                      color: '#9ca3af'
                                    }}>
                                      +{item.tools.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )
                  })()
                ) : (
                  /* 第二层：展开状态，显示工作模块网格 */
                  <>
                    <div style={{
                      marginBottom: '1.5rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: '#111827',
                        margin: '0 0 0.5rem'
                      }}>
                        {jobRole.name} 工作模块
                      </h3>
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        color: '#6b7280'
                      }}>
                        点击模块打开工作流画布
                      </p>
                    </div>

                    <div
                      onDoubleClick={(e) => {
                        // 双击网格空白处收缩
                        if (e.target === e.currentTarget) {
                          e.stopPropagation()
                          handleCardDoubleClick(cardConfig.id)
                        }
                      }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '1rem'
                      }}>
                      {jobRole.modules.filter(moduleId => moduleId !== 'all').map(moduleId => {
                        const module = moduleCategories.find(m => m.id === moduleId)
                        if (!module) {
                          console.warn(`Module ${moduleId} not found in moduleCategories`)
                          return null
                        }

                        const moduleWorkItems = workItems[moduleId] || []

                        return (
                          <div
                            key={moduleId}
                            onClick={() => handleModuleClick(cardConfig.id, moduleId)}
                            style={{
                              backgroundColor: 'white',
                              border: `2px solid ${module.color}20`,
                              borderRadius: '12px',
                              padding: '1.25rem',
                              transition: 'all 0.2s',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.75rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = module.color
                              e.currentTarget.style.boxShadow = `0 6px 16px ${module.color}30`
                              e.currentTarget.style.transform = 'translateY(-2px)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = `${module.color}20`
                              e.currentTarget.style.boxShadow = 'none'
                              e.currentTarget.style.transform = 'translateY(0)'
                            }}
                          >
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              backgroundColor: `${module.color}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.25rem'
                            }}>
                              {module.icon || '📁'}
                            </div>
                            <div>
                              <h4 style={{
                                margin: '0 0 0.25rem',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                color: '#111827'
                              }}>
                                {module.name}
                              </h4>
                              <p style={{
                                margin: 0,
                                fontSize: '0.75rem',
                                color: '#9ca3af'
                              }}>
                                {moduleWorkItems.length} 项工作流
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          )
        })}
        </div>
      </div>
    </div>

    {/* 最近常用工作流弹窗 */}
    {showRecentWorkflowsModal && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setShowRecentWorkflowsModal(false)}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 0.25rem' }}>
                最近常用工作流
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                根据使用频率智能排序，快速访问常用工作流
              </p>
            </div>
            <button
              onClick={() => setShowRecentWorkflowsModal(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
                e.currentTarget.style.color = '#111827'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.color = '#6b7280'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {frequentWorkflows.map((workflow, index) => {
              const statusColors = getStatusColor(workflow.status)
              const frequencyColors = {
                '高频': { bg: '#dcfce7', color: '#166534', icon: '🔥' },
                '中频': { bg: '#dbeafe', color: '#1e40af', icon: '⭐' },
                '低频': { bg: '#f3f4f6', color: '#6b7280', icon: '' }
              }
              const freqColor = frequencyColors[workflow.useFrequency as keyof typeof frequencyColors]

              return (
                <div
                  key={workflow.id}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onClick={() => {
                    navigate(`/workflow-intro/${workflow.id}`)
                    setShowRecentWorkflowsModal(false)
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.borderColor = '#8b5cf6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = '#e5e7eb'
                  }}
                >
                  {/* 排名标识 */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      left: '12px',
                      width: '24px',
                      height: '24px',
                      backgroundColor: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : '#a78bfa',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'white',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    {index + 1}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                    <div style={{
                      fontSize: '32px',
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f9fafb',
                      borderRadius: '12px'
                    }}>
                      {workflow.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                          {workflow.name}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '12px',
                          backgroundColor: freqColor.bg,
                          color: freqColor.color,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {freqColor.icon && <span>{freqColor.icon}</span>}
                          {workflow.useFrequency} · {workflow.useCount}次
                        </span>
                        <span style={{
                          fontSize: '12px',
                          backgroundColor: statusColors.bg,
                          color: statusColors.color,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontWeight: 600
                        }}>
                          {workflow.status}
                        </span>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                          最后使用：{workflow.lastUsed}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {frequentWorkflows.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '1rem' }}>—</div>
              <p style={{ margin: 0, fontSize: '14px' }}>暂无常用工作流</p>
            </div>
          )}

          {/* 只有当还有更多工作流可以显示时才显示按钮 */}
          {visibleWorkflowCount < allFrequentWorkflows.length && (
            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                已显示 {frequentWorkflows.length} / {allFrequentWorkflows.length} 个工作流
              </div>
              <button
                onClick={() => {
                  setVisibleWorkflowCount(prev => Math.min(prev + 6, allFrequentWorkflows.length))
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#7c3aed'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#8b5cf6'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}
              >
                查看更多常用工作流
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    {/* 日常工作弹窗 */}
    {showFrequentModulesModal && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setShowFrequentModulesModal(false)}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 0.25rem' }}>
                🗂️ 日常工作
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                本周使用频繁的工作项，快速访问常用工作
              </p>
            </div>
            <button
              onClick={() => setShowFrequentModulesModal(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
                e.currentTarget.style.color = '#111827'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.color = '#6b7280'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {displayedWorkItems.map((workItem, index) => (
              <div
                key={workItem.workItemKey}
                style={{
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  textAlign: 'center'
                }}
                onClick={() => {
                  setActiveModule(workItem.category)
                  setSelectedWorkItem(workItem.workItemKey)
                  setShowFrequentModulesModal(false)
                  setTimeout(() => {
                    if (workItemSectionRef.current) {
                      workItemSectionRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      })
                    }
                  }, 100)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.borderColor = workItem.categoryColor
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = '#e5e7eb'
                }}
              >
                <div style={{
                  fontSize: '48px',
                  marginBottom: '0.75rem'
                }}>
                  {workItem.icon}
                </div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#111827',
                  margin: '0 0 0.5rem'
                }}>
                  {workItem.name}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    <span>{workItem.categoryIcon}</span>
                    <span>{workItem.categoryName}</span>
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: workItem.categoryColor
                  }}>
                    本周使用 {workItem.weeklyUseCount} 次
                  </span>
                </div>
                {index < 3 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '28px',
                      height: '28px',
                      backgroundColor: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : '#a78bfa',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'white',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    {index + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* 草稿箱弹窗 */}
    {showDraftsModal && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setShowDraftsModal(false)}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 0.25rem' }}>
                📎 草稿箱
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                未完成的工作流草稿，继续编辑或删除
              </p>
            </div>
            <button
              onClick={() => setShowDraftsModal(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
                e.currentTarget.style.color = '#111827'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.color = '#6b7280'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {draftWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => {
                  navigate(`/workflow-intro/${workflow.id}`)
                  setShowDraftsModal(false)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.borderColor = '#f59e0b'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = '#e5e7eb'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                  <div style={{
                    fontSize: '32px',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fef3c7',
                    borderRadius: '12px'
                  }}>
                    {workflow.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                        {workflow.name}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '12px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontWeight: 600
                      }}>
                        📝 草稿
                      </span>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        最后编辑：{workflow.lastUsed}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {draftWorkflows.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📭</div>
              <p style={{ margin: 0, fontSize: '14px' }}>暂无草稿</p>
            </div>
          )}

          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => {
                navigate('/workflow/new')
                setShowDraftsModal(false)
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#7c3aed'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#8b5cf6'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}
            >
              🚀 创建新工作流
            </button>
          </div>
        </div>
      </div>
    )}

    {/* 最近更新弹窗 */}
    {showRecentUpdatesModal && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setShowRecentUpdatesModal(false)}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '650px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 0.25rem' }}>
                最近更新
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                你使用的工作流有新版本，查看更新内容并升级
              </p>
            </div>
            <button
              onClick={() => setShowRecentUpdatesModal(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
                e.currentTarget.style.color = '#111827'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.color = '#6b7280'
              }}
            >
              ×
            </button>
          </div>

          {/* 一键更新全部按钮 */}
          {updatedWorkflows.length > 0 && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: '#dcfce7',
              borderRadius: '12px',
              border: '1px solid #10b981',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '0.25rem' }}>
                  发现 {updatedWorkflows.length} 个工作流有更新
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  一键升级所有工作流到最新版本
                </div>
              </div>
              <button
                onClick={() => {
                  const workflowNames = updatedWorkflows.map(w => `${w.name} (${w.myVersion} → ${w.version})`).join('\n')
                  if (confirm(`确定要升级以下工作流吗？\n\n${workflowNames}`)) {
                    alert(`已成功升级 ${updatedWorkflows.length} 个工作流！`)
                    setShowRecentUpdatesModal(false)
                  }
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                一键更新全部
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {updatedWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                style={{
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)'
                  e.currentTarget.style.borderColor = '#10b981'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = '#e5e7eb'
                }}
              >
                {/* 新版本标识 */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  🆕 新版本
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    fontSize: '40px',
                    width: '56px',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f9fafb',
                    borderRadius: '14px'
                  }}>
                    {workflow.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: '0 0 0.25rem' }}>
                      {workflow.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '20px' }}>{workflow.creatorAvatar}</span>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>
                        {workflow.creator}
                      </span>
                      <span style={{ fontSize: '13px', color: '#9ca3af' }}>•</span>
                      <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                        {workflow.updateTime}
                      </span>
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '14px',
                      color: '#374151',
                      backgroundColor: '#f3f4f6',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      borderLeft: '3px solid #10b981'
                    }}>
                      📢 {workflow.updateContent}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '12px',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontWeight: 600
                    }}>
                      当前: {workflow.myVersion}
                    </span>
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>→</span>
                    <span style={{
                      fontSize: '12px',
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontWeight: 600
                    }}>
                      最新: {workflow.version}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        navigate(`/workflow-intro/${workflow.id}`)
                        setShowRecentUpdatesModal(false)
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'white',
                        color: '#6b7280',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                        e.currentTarget.style.borderColor = '#9ca3af'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.borderColor = '#e5e7eb'
                      }}
                    >
                      查看详情
                    </button>
                    <button
                      onClick={() => {
                        // 升级工作流逻辑
                        alert(`升级 ${workflow.name} 到 ${workflow.version}`)
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#059669'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#10b981'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      🚀 立即升级
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {updatedWorkflows.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#9ca3af'
            }}>
              <p style={{ margin: 0, fontSize: '14px' }}>所有工作流都是最新版本</p>
            </div>
          )}
        </div>
      </div>
    )}

    {/* 工作流选择弹窗 */}
    {showWorkflowSelectionModal && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => {
          setShowWorkflowSelectionModal(false)
          setWorkflowSelectionCardId(null)
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#111827',
                margin: '0 0 0.25rem'
              }}>
                选择工作流
              </h2>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#6b7280'
              }}>
                从已有的工作流中选择一个应用到当前卡片
              </p>
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={() => {
                setShowWorkflowSelectionModal(false)
                setWorkflowSelectionCardId(null)
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
                e.currentTarget.style.color = '#111827'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.color = '#6b7280'
              }}
            >
              ×
            </button>
          </div>

          {/* 过滤器 */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            {/* 状态过滤 */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['all', '运行中', '草稿'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setWorkflowFilterStatus(status)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: workflowFilterStatus === status ? 'none' : '1px solid #e5e7eb',
                    backgroundColor: workflowFilterStatus === status ? '#8b5cf6' : 'white',
                    color: workflowFilterStatus === status ? 'white' : '#6b7280',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  {status === 'all' ? '全部' : status}
                </button>
              ))}
            </div>

            {/* 搜索输入 */}
            <input
              type="text"
              placeholder="搜索工作流..."
              value={workflowSearchQuery}
              onChange={(e) => setWorkflowSearchQuery(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                flex: 1,
                minWidth: '200px',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#8b5cf6'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            />
          </div>

          {/* 工作流列表 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {getFilteredWorkflowsForSelection().map((workflow) => (
              <div
                key={workflow.id}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onClick={() => handleSelectWorkflow(workflow)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.borderColor = '#8b5cf6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = '#e5e7eb'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <h3 style={{
                    margin: '0 0 0.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#111827'
                  }}>
                    {workflow.name}
                  </h3>
                  <span style={{
                    fontSize: '12px',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: workflow.status === '运行中' ? '#dcfce7' : '#fef3c7',
                    color: workflow.status === '运行中' ? '#166534' : '#92400e',
                    fontWeight: 600
                  }}>
                    {workflow.status}
                  </span>
                </div>

                <p style={{
                  margin: '0 0 0.75rem',
                  fontSize: '13px',
                  color: '#6b7280'
                }}>
                  分类: {moduleCategories.find(m => m.id === workflow.category)?.name || workflow.category}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>
                  <span>使用频率: {workflow.useFrequency} ({workflow.useCount}次)</span>
                  <span>最后使用: {workflow.lastUsed}</span>
                </div>
              </div>
            ))}

            {getFilteredWorkflowsForSelection().length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#9ca3af'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🔍</div>
                <p style={{ margin: 0, fontSize: '14px' }}>没有找到匹配的工作流</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* 全屏工作流画布 */}
    {activeWorkflow && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f9fafb',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* 顶部工具栏 */}
        <div style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={handleCloseWorkflow}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ← 返回
            </button>
            <div style={{ height: '24px', width: '1px', backgroundColor: '#e5e7eb' }} />
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#111827'
              }}>
                {moduleCategories.find(m => m.id === activeWorkflow.moduleId)?.name || '工作流画布'}
              </h2>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: '#6b7280'
              }}>
                {jobRoles.find(r => r.id === activeWorkflow.jobRoleId)?.name || ''}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151'
              }}
            >
              💾 保存
            </button>
            <button
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              ▶️ 执行
            </button>
          </div>
        </div>

        {/* 工作流列表区域 */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '2rem'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <div style={{
              marginBottom: '2rem'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#111827',
                margin: '0 0 0.5rem'
              }}>
                工作流列表
              </h3>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#6b7280'
              }}>
                点击工作流进行编辑和执行
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {(workItems[activeWorkflow.moduleId] || []).map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#8b5cf6'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.15)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                  onClick={() => {
                    // 这里可以打开工作流编辑器
                    navigate(`/workflow-intro/${item.id}`)
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      flex: 1
                    }}>
                      <h4 style={{
                        margin: '0 0 0.5rem',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#111827'
                      }}>
                        {item.name}
                      </h4>
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        color: '#6b7280',
                        lineHeight: 1.5
                      }}>
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #f3f4f6'
                  }}>
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: moduleCategories.find(m => m.id === activeWorkflow.moduleId)?.color + '15' || '#8b5cf615',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: moduleCategories.find(m => m.id === activeWorkflow.moduleId)?.color || '#8b5cf6'
                    }}>
                      {item.difficulty}
                    </div>
                    <div style={{
                      marginLeft: 'auto',
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>
                      点击编辑 →
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(workItems[activeWorkflow.moduleId] || []).length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '2px dashed #e5e7eb'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  📝
                </div>
                <h3 style={{
                  margin: '0 0 0.5rem',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#111827'
                }}>
                  暂无工作流
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  点击右上角"创建工作流"开始
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* 工作台保存和导出按钮 */}
    <div style={{
      position: 'fixed',
      top: '2rem',
      right: '2rem',
      display: 'flex',
      gap: '0.75rem',
      zIndex: 1000
    }}>
      <button
        onClick={handleManualSave}
        disabled={isSaving}
        style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: isSaving ? '#9ca3af' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: isSaving ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!isSaving) {
            e.currentTarget.style.backgroundColor = '#059669'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isSaving) {
            e.currentTarget.style.backgroundColor = '#10b981'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
          }
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        {isSaving ? '保存中...' : '保存工作台'}
      </button>

      <button
        onClick={handleExport}
        style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2563eb'
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#3b82f6'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        导出数据
      </button>
    </div>

    {/* 悬浮按钮 (FAB) - 科技感设计 */}
    <button
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      style={{
        position: 'fixed',
        top: '5rem',
        right: '2rem',
        padding: '0.75rem 1.5rem',
        borderRadius: '16px',
        background: 'white',
        color: '#8b5cf6',
        border: '2px solid #8b5cf6',
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        zIndex: 1000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontSize: '14px',
        fontWeight: 600,
        backdropFilter: 'blur(10px)',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateX(-4px) scale(1.05)'
        e.currentTarget.style.background = 'linear-gradient(135deg, #f3f0ff 0%, #ede9fe 100%)'
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.25)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.background = 'white'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)'
      }}
    >
      {/* 背景光晕效果 */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 2s ease-in-out infinite'
      }} />

      {/* 图标 */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>

      {/* 文字 */}
      <span style={{ position: 'relative', zIndex: 1 }}>探索工作流</span>

      {/* 未读消息提示点（可选） */}
      {chatHistory.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: '#ef4444',
          border: '2px solid white',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
          animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
        }} />
      )}
    </button>

    {/* CSS动画（添加到页面） */}
    <style>{`
      @keyframes pulse {
        0%, 100% {
          opacity: 0.6;
          transform: scale(1);
        }
        50% {
          opacity: 0.8;
          transform: scale(1.1);
        }
      }
      @keyframes ping {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        75%, 100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }
    `}</style>

    {/* 遮罩层 */}
    {isSidebarOpen && (
      <div
        onClick={() => setIsSidebarOpen(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1500,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.3s ease'
        }}
      />
    )}

    {/* 侧边栏面板 */}
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: isSidebarOpen ? 0 : '-480px',
        width: '480px',
        height: '100vh',
        backgroundColor: 'white',
        boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
        zIndex: 2000,
        transition: 'right 0.3s ease',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 侧边栏头部 */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#111827'
        }}>
          想完成什么任务？
        </h2>
        <button
          onClick={() => setIsSidebarOpen(false)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e5e7eb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
          }}
        >
          ×
        </button>
      </div>

      {/* 对话输入区 + 新建工作流按钮 */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start'
      }}>
        {/* 对话输入框 */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'all 0.2s'
        }}>
          <input
            type="text"
            value={inputMessage}
            onChange={(event) => setInputMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入您的任务或问题..."
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '14px',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              color: '#1f2937'
            }}
            onFocus={(e) => {
              const wrapper = e.currentTarget.parentElement
              if (wrapper) wrapper.style.borderColor = '#8b5cf6'
            }}
            onBlur={(e) => {
              const wrapper = e.currentTarget.parentElement
              if (wrapper) wrapper.style.borderColor = '#e5e7eb'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim()}
            style={{
              width: '40px',
              height: '40px',
              margin: '4px',
              backgroundColor: inputMessage.trim() ? '#8b5cf6' : '#f3f4f6',
              color: inputMessage.trim() ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '8px',
              cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (inputMessage.trim()) {
                e.currentTarget.style.backgroundColor = '#7c3aed'
                e.currentTarget.style.transform = 'scale(1.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (inputMessage.trim()) {
                e.currentTarget.style.backgroundColor = '#8b5cf6'
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>

        {/* 新建工作流按钮 */}
        <button
          onClick={() => {
            setIsSidebarOpen(false)
            navigate('/workflow/new')
          }}
          style={{
            padding: '12px 20px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#7c3aed'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#8b5cf6'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)'
          }}
        >
          <span style={{ fontSize: '18px' }}>+</span>
          新建工作流
        </button>
      </div>

      {/* 对话历史 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem'
      }}>
        <h3 style={{
          margin: '0 0 1rem',
          fontSize: '14px',
          fontWeight: 600,
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          对话历史
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {chatHistory.length > 0 ? (
            chatHistory.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  setInputMessage(chat.message)
                }}
                style={{
                  padding: '0.75rem 0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderBottom: '1px solid #f3f4f6'
                }}
                onMouseEnter={(e) => {
                  const textElement = e.currentTarget.querySelector('p')
                  if (textElement instanceof HTMLElement) {
                    textElement.style.color = '#8b5cf6'
                  }
                }}
                onMouseLeave={(e) => {
                  const textElement = e.currentTarget.querySelector('p')
                  if (textElement instanceof HTMLElement) {
                    textElement.style.color = '#111827'
                  }
                }}
              >
                {/* 标题和时间在同一行 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#111827',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.2s'
                  }}>
                    {chat.message}
                  </p>
                  <span style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    flexShrink: 0
                  }}>
                    {new Date(chat.timestamp).toLocaleString('zh-CN', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📝</div>
              <p style={{ margin: 0, fontSize: '14px' }}>暂无对话历史</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
)
}
