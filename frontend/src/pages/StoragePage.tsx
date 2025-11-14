import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TouchEvent as ReactTouchEvent } from 'react'
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { Clock, ChevronDown, ChevronUp } from 'lucide-react'
import {
  getFavoriteWorkflows,
  getUserWorkflows,
  updateWorkflow,
  getExecutionHistory,
  type Workflow,
  type ExecutionHistory
} from '../services/workflowApi'
import WorkflowExecutionModal from '../components/WorkflowExecutionModal'
import ExecutionSplitPanel, { type ExecutionWorkflow, type WorkflowNode } from '../components/ExecutionSplitPanel'
import ExecutionHistoryModal from '../components/ExecutionHistoryModal'
import ResizableSplitter from '../components/ResizableSplitter'
import { adjustOverlappingItemsAfterResize } from '../utils/storageAvoidanceUtils'

type WorkflowStatus = 'active' | 'draft' | 'paused'
type LibrarySection = 'created' | 'favorites' | 'recent'

type Position = {
  x: number
  y: number
}

const CARD_WIDTH = 220
const CARD_HEIGHT = 120
const CONTAINER_MIN_WIDTH = 280
const CONTAINER_MIN_HEIGHT = 200
const CONTAINER_PADDING = 16
const CONTAINER_HEADER_HEIGHT = 30
const ROOT_CONTAINER_ID = 'canvas-root'
const TOP_LEFT_LIMIT = 2
const MIN_VISIBLE_RATIO = 0.3
const INITIAL_POSITION_X = 10
const INITIAL_POSITION_Y = 10

const DEFAULT_EXECUTION_NODES: WorkflowNode[] = [
  {
    id: 'default-input',
    type: 'input',
    data: {
      label: '输入节点',
      config: {
        title: '输入准备',
        description: '在此补充执行该流程前需要的输入信息。'
      }
    }
  },
  {
    id: 'default-llm',
    type: 'llm',
    data: {
      label: 'AI 处理',
      config: {
        title: '模型指令',
        prompt: '请根据输入内容完成处理。'
      }
    }
  },
  {
    id: 'default-output',
    type: 'output',
    data: {
      label: '输出节点',
      config: {
        title: '输出结果',
        description: '总结本次执行的核心结果。'
      }
    }
  }
]

// 容器颜色池
const CONTAINER_COLORS = [
  'rgba(139, 92, 246, 0.15)',  // 紫色
  'rgba(59, 130, 246, 0.15)',  // 蓝色
  'rgba(16, 185, 129, 0.15)',  // 绿色
  'rgba(245, 158, 11, 0.15)',  // 橙色
  'rgba(239, 68, 68, 0.15)',   // 红色
  'rgba(236, 72, 153, 0.15)',  // 粉色
  'rgba(20, 184, 166, 0.15)',  // 青色
  'rgba(168, 85, 247, 0.15)'   // 紫罗兰
]

// 随机获取容器颜色
const getRandomContainerColor = () => {
  return CONTAINER_COLORS[Math.floor(Math.random() * CONTAINER_COLORS.length)]
}

// 获取根容器的颜色
const getRootContainerColor = (items: CanvasItemsMap, containerId: string): string => {
  if (containerId === ROOT_CONTAINER_ID) {
    const rootContainer = items[ROOT_CONTAINER_ID]
    if (rootContainer && rootContainer.type === 'container' && rootContainer.color) {
      return rootContainer.color
    }
    return 'rgba(139, 92, 246, 0.15)'
  }

  const container = items[containerId]
  if (!container || container.type !== 'container') {
    return getRandomContainerColor()
  }

  // 如果父容器是根容器，返回当前容器的颜色
  if (container.parentId === ROOT_CONTAINER_ID) {
    return container.color
  }

  // 递归查找根容器的颜色
  return getRootContainerColor(items, container.parentId)
}

// 递归更新容器及其所有子容器的颜色
const updateContainerColorRecursively = (items: CanvasItemsMap, containerId: string, color: string) => {
  const container = items[containerId]
  if (!container || container.type !== 'container') {
    return
  }

  // 更新当前容器的颜色
  items[containerId] = { ...container, color }

  // 递归更新所有子容器的颜色
  for (const childId of container.childrenIds) {
    const child = items[childId]
    if (child && child.type === 'container') {
      updateContainerColorRecursively(items, childId, color)
    }
  }
}

interface WorkflowDefinition {
  id: string
  name: string
  summary: string
  status: WorkflowStatus
  category: string
  tags: string[]
  owner: string
  updatedAt: string
  model?: string // 模型产品
  prompt?: string // 原始 prompt
  config?: {
    nodes?: WorkflowNode[]
    [key: string]: any
  }
  nodes?: WorkflowNode[]
}

interface AIToolDefinition {
  id: string
  name: string
  summary: string
  category: string
  tags: string[]
  provider: string
  updatedAt: string
  model?: string // 模型产品
  prompt?: string // 原始 prompt
}

type LibraryWorkflow = WorkflowDefinition & {
  section: LibrarySection
  isOwner?: boolean  // 是否是当前用户创建的
  canEdit?: boolean  // 是否可以编辑
}

type LibraryAITool = AIToolDefinition & {
  section: 'ai-tools'
}

type LibraryItem = LibraryWorkflow | LibraryAITool

interface WorkflowCanvasItem {
  id: string
  type: 'workflow'
  workflowId: string
  parentId: string
  position: Position
}

interface AIToolCanvasItem {
  id: string
  type: 'ai-tool'
  toolId: string
  parentId: string
  position: Position
}

interface ContainerCanvasItem {
  id: string
  type: 'container'
  name: string
  parentId: string
  position: Position
  size: { width: number; height: number }
  collapsed: boolean
  childrenIds: string[]
  color: string
}

type CanvasItem = WorkflowCanvasItem | AIToolCanvasItem | ContainerCanvasItem
type CanvasItemsMap = Record<string, CanvasItem>

const initialLibraryData: LibraryWorkflow[] = [
  {
    id: 'wf-orders',
    name: '订单处理流程',
    summary: '覆盖下单、库存校验、物流推送的全链路自动化流程。',
    status: 'active',
    category: '电商',
    tags: ['订单', '物流', '自动化'],
    owner: '我',
    updatedAt: '2025-02-08',
    section: 'created',
    model: 'GPT-4',
    prompt: '你是一个专业的订单处理助手。请根据用户输入的订单信息，自动执行以下步骤：\n1. 验证订单格式和完整性\n2. 校验库存是否充足\n3. 计算订单金额和优惠\n4. 生成物流推送信息\n5. 返回处理结果和追踪信息',
    nodes: [
      {
        id: 'node-1',
        type: 'input',
        label: '订单信息录入',
        position: { x: 0, y: 0 },
        config: {
          description: '请输入订单的基本信息',
          placeholder: '例如：订单号、商品列表、收货地址、联系方式等',
          requiredFields: ['订单号', '商品信息', '收货地址', '联系方式', '支付金额']
        }
      },
      {
        id: 'node-2',
        type: 'llm',
        label: '订单信息验证',
        position: { x: 200, y: 0 },
        config: {
          model: 'GPT-4',
          systemPrompt: '你是一个订单验证专家。请检查订单信息的完整性和格式正确性。',
          userPrompt: '请验证以下订单信息是否完整且格式正确：\n- 订单号格式是否符合规范\n- 商品信息是否完整（名称、数量、价格）\n- 收货地址是否详细准确\n- 联系方式是否有效\n- 支付金额是否匹配商品总价\n\n如果发现问题，请明确指出；如果验证通过，请输出"验证通过"并总结订单信息。',
          temperature: 0.3
        }
      },
      {
        id: 'node-3',
        type: 'tool',
        label: '库存查询与校验',
        position: { x: 400, y: 0 },
        config: {
          toolName: '库存管理系统 API',
          apiEndpoint: '/api/inventory/check',
          description: '调用库存管理系统API，查询商品库存并校验是否充足',
          parameters: {
            productIds: '从订单中提取的商品ID列表',
            quantities: '对应的购买数量'
          },
          expectedOutput: '库存充足状态和剩余库存数量'
        }
      },
      {
        id: 'node-4',
        type: 'llm',
        label: '订单金额计算',
        position: { x: 600, y: 0 },
        config: {
          model: 'GPT-4',
          systemPrompt: '你是一个订单金额计算专家。请根据商品价格、数量、优惠券和运费计算最终订单金额。',
          userPrompt: '请计算订单的最终金额：\n1. 商品总价 = ∑(商品单价 × 数量)\n2. 检查是否有可用优惠券或折扣\n3. 计算优惠后金额\n4. 根据收货地址计算运费\n5. 最终金额 = 商品总价 - 优惠金额 + 运费\n\n请输出详细的金额明细和最终应付金额。',
          temperature: 0.1
        }
      },
      {
        id: 'node-5',
        type: 'condition',
        label: '支付状态判断',
        position: { x: 800, y: 0 },
        config: {
          conditionType: '支付完成判断',
          conditions: [
            { name: '已支付', expression: 'payment_status === "paid"', nextNode: 'node-6' },
            { name: '待支付', expression: 'payment_status === "pending"', nextNode: 'node-wait' },
            { name: '支付失败', expression: 'payment_status === "failed"', nextNode: 'node-error' }
          ]
        }
      },
      {
        id: 'node-6',
        type: 'tool',
        label: '物流信息推送',
        position: { x: 1000, y: 0 },
        config: {
          toolName: '物流平台 API',
          apiEndpoint: '/api/logistics/create-order',
          description: '将订单信息推送到物流平台，创建物流单',
          parameters: {
            orderNumber: '订单号',
            receiverInfo: '收货人信息（姓名、电话、地址）',
            productInfo: '商品信息',
            deliveryType: '配送方式（标准/加急/次日达）'
          },
          expectedOutput: '物流单号和预计送达时间'
        }
      },
      {
        id: 'node-7',
        type: 'llm',
        label: '生成订单确认通知',
        position: { x: 1200, y: 0 },
        config: {
          model: 'GPT-4',
          systemPrompt: '你是一个客服专家。请生成友好、专业的订单确认通知。',
          userPrompt: '请生成订单确认通知内容，包括：\n1. 感谢客户下单\n2. 订单号和下单时间\n3. 商品清单和金额明细\n4. 收货地址和联系方式\n5. 物流单号和预计送达时间\n6. 客服联系方式\n\n要求：语气友好、信息完整、格式清晰。',
          temperature: 0.7
        }
      },
      {
        id: 'node-8',
        type: 'output',
        label: '输出处理结果',
        position: { x: 1400, y: 0 },
        config: {
          outputFormat: 'JSON',
          fields: [
            { name: 'orderId', description: '订单号' },
            { name: 'status', description: '处理状态' },
            { name: 'totalAmount', description: '订单总金额' },
            { name: 'logisticsNumber', description: '物流单号' },
            { name: 'estimatedDelivery', description: '预计送达时间' },
            { name: 'notificationContent', description: '确认通知内容' }
          ]
        }
      }
    ]
  },
  {
    id: 'wf-payments',
    name: '支付风险控制',
    summary: '支付回调监控、风控策略执行、异常通知的闭环流程。',
    status: 'draft',
    category: '财务',
    tags: ['风控', '支付', '监控'],
    owner: '我',
    updatedAt: '2025-02-05',
    section: 'created',
    model: 'GPT-4',
    prompt: '你是一个支付安全专家。请分析支付交易数据，识别潜在风险：\n1. 检查交易金额是否异常\n2. 验证用户行为模式\n3. 评估设备和地理位置风险\n4. 应用风控规则并返回风险评分\n5. 对高风险交易生成预警'
  },
  {
    id: 'wf-approvals',
    name: '多级审批模板',
    summary: '适用于费用、采购等审批场景，可自定义审批层级。',
    status: 'active',
    category: '协作',
    tags: ['审批', '模板', '自动提醒'],
    owner: '产品运营',
    updatedAt: '2025-01-29',
    section: 'favorites',
    model: 'Claude 3.5',
    prompt: '你是一个智能审批助手。根据审批请求，自动执行多级审批流程：\n1. 解析审批请求的类型和金额\n2. 根据规则确定审批层级\n3. 依次推送给相应审批人\n4. 跟踪审批进度\n5. 汇总审批意见并通知申请人'
  },
  {
    id: 'wf-notify',
    name: '全渠道通知流程',
    summary: '统一触达邮件、短信、站内信的通知流程。',
    status: 'active',
    category: '运营',
    tags: ['通知', '多渠道', '消息'],
    owner: '我',
    updatedAt: '2025-02-06',
    section: 'favorites',
    model: 'GPT-4',
    prompt: '你是一个通知编排专家。根据用户输入，自动分发通知到各个渠道：\n1. 解析通知内容和目标用户\n2. 根据用户偏好选择通知渠道（邮件/短信/站内信）\n3. 格式化不同渠道的消息内容\n4. 批量发送并记录状态\n5. 返回发送结果统计'
  },
  {
    id: 'wf-activity',
    name: '活动数据回流',
    summary: '拉取第三方平台活动数据并写入数据仓库。',
    status: 'paused',
    category: '数据',
    tags: ['数据同步', 'ETL'],
    owner: '数据团队',
    updatedAt: '2025-02-01',
    section: 'recent',
    model: 'GPT-4',
    prompt: '你是一个数据同步专家。自动从第三方平台拉取活动数据：\n1. 连接第三方API获取活动数据\n2. 清洗和标准化数据格式\n3. 验证数据完整性和准确性\n4. 将数据写入数据仓库\n5. 生成同步日志和数据质量报告'
  },
  {
    id: 'wf-content',
    name: '内容审校流程',
    summary: '聚合多种模型进行内容检测与风格校验。',
    status: 'active',
    category: '内容',
    tags: ['内容审核', '模型编排'],
    owner: '内容团队',
    updatedAt: '2025-02-07',
    section: 'recent',
    model: 'Claude 3.5',
    prompt: '你是一个内容审核专家。对用户提交的内容进行多维度审校：\n1. 检测敏感词和违规内容\n2. 分析文本语气和情感倾向\n3. 评估内容质量和可读性\n4. 检查事实准确性\n5. 提供修改建议和风险评级'
  }
]

const initialAIToolsData: LibraryAITool[] = [
  {
    id: 'ai-gpt4',
    name: 'GPT-4',
    summary: '最强大的大语言模型，擅长复杂推理、代码生成和创意写作。',
    category: '文本生成',
    tags: ['OpenAI', 'LLM', '对话'],
    provider: 'OpenAI',
    updatedAt: '2025-02-10',
    section: 'ai-tools',
    model: 'GPT-4 Turbo',
    prompt: '你是一个智能助手，请根据用户的输入提供准确、详细、有帮助的回答。\n\n要求：\n- 保持专业和友好的语气\n- 提供清晰的逻辑和结构化的回答\n- 必要时提供代码示例和具体步骤\n- 承认不确定性，不编造信息'
  },
  {
    id: 'ai-claude',
    name: 'Claude 3.5',
    summary: '强大的AI助手，在代码、分析和长文本理解方面表现出色。',
    category: '文本生成',
    tags: ['Anthropic', 'LLM', '对话'],
    provider: 'Anthropic',
    updatedAt: '2025-02-09',
    section: 'ai-tools',
    model: 'Claude 3.5 Sonnet',
    prompt: '你是 Claude，一个由 Anthropic 创建的 AI 助手。请根据用户输入提供有价值的帮助。\n\n特点：\n- 擅长代码分析和生成\n- 能够理解和处理长篇文本\n- 注重准确性和安全性\n- 提供清晰的解释和推理过程'
  },
  {
    id: 'ai-dalle',
    name: 'DALL·E 3',
    summary: '根据文本描述生成高质量图像的AI工具。',
    category: '图像生成',
    tags: ['OpenAI', '图像', '创作'],
    provider: 'OpenAI',
    updatedAt: '2025-02-08',
    section: 'ai-tools',
    model: 'DALL·E 3',
    prompt: '根据用户的文字描述生成相应的图像。\n\n指导原则：\n- 理解并提炼用户描述中的关键视觉元素\n- 考虑艺术风格、色彩、构图等要素\n- 确保生成的图像符合内容政策\n- 提供多样化和富有创意的视觉呈现'
  },
  {
    id: 'ai-whisper',
    name: 'Whisper',
    summary: '高精度的语音识别模型，支持多语言转录。',
    category: '语音识别',
    tags: ['OpenAI', '语音', 'STT'],
    provider: 'OpenAI',
    updatedAt: '2025-02-07',
    section: 'ai-tools',
    model: 'Whisper Large V3',
    prompt: '将音频内容转录为文本，支持多语言识别。\n\n功能：\n- 自动检测语言\n- 高精度语音识别\n- 支持长音频转录\n- 自动添加标点符号\n- 时间戳标注'
  },
  {
    id: 'ai-embeddings',
    name: 'Text Embeddings',
    summary: '将文本转换为向量表示，用于语义搜索和相似度计算。',
    category: '向量化',
    tags: ['嵌入', '向量', '搜索'],
    provider: 'OpenAI',
    updatedAt: '2025-02-06',
    section: 'ai-tools',
    model: 'text-embedding-3-large',
    prompt: '将输入的文本转换为高维向量表示，用于语义相似度计算和检索。\n\n应用场景：\n- 语义搜索和匹配\n- 文档聚类分析\n- 推荐系统\n- 相似内容检测'
  },
  {
    id: 'ai-sd',
    name: 'Stable Diffusion',
    summary: '开源的图像生成模型，可定制化程度高。',
    category: '图像生成',
    tags: ['开源', '图像', 'ControlNet'],
    provider: 'Stability AI',
    updatedAt: '2025-02-05',
    section: 'ai-tools',
    model: 'Stable Diffusion XL',
    prompt: '根据文本描述生成高质量图像，支持多种风格和控制方式。\n\n特性：\n- 支持 ControlNet 精确控制\n- 可定制 LoRA 模型\n- 支持图生图和图像修复\n- 负提示词控制\n- 批量生成和变体'
  }
]

const SECTION_META: Record<
  LibrarySection,
  { label: string; icon: string; description: string }
> = {
  created: {
    label: '我创建的',
    icon: '',
    description: '你构建的全部工作流'
  },
  favorites: {
    label: '我收藏的',
    icon: '',
    description: '常用或团队推荐的工作流'
  },
  recent: {
    label: '最近使用',
    icon: '',
    description: '最近执行或编辑过的工作流'
  }
}

type DragState =
  | {
      type: 'item'
      itemId: string
      itemType: CanvasItem['type']
      pointerStart: Position
      itemStart: Position
      parentId: string
    }
  | null

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`
}

function isContainer(item: CanvasItem | undefined): item is ContainerCanvasItem {
  return Boolean(item && item.type === 'container')
}

function getContainer(items: CanvasItemsMap, id: string): ContainerCanvasItem | null {
  const item = items[id]
  if (isContainer(item)) {
    return item
  }
  return null
}

function getParentId(item: CanvasItem): string {
  if (item.parentId) {
    return item.parentId
  }
  return ROOT_CONTAINER_ID
}

function getContainerContentOrigin(items: CanvasItemsMap, containerId: string): Position {
  if (containerId === ROOT_CONTAINER_ID) {
    return { x: 0, y: 0 }
  }

  const container = getContainer(items, containerId)
  if (!container) {
    return { x: 0, y: 0 }
  }

  const parentOrigin = getContainerContentOrigin(items, container.parentId || ROOT_CONTAINER_ID)
  return {
    x: parentOrigin.x + container.position.x + CONTAINER_PADDING,
    y: parentOrigin.y + container.position.y + CONTAINER_HEADER_HEIGHT + CONTAINER_PADDING
  }
}

function getContainerOuterOrigin(items: CanvasItemsMap, containerId: string): Position {
  if (containerId === ROOT_CONTAINER_ID) {
    return { x: 0, y: 0 }
  }
  const container = getContainer(items, containerId)
  if (!container) {
    return { x: 0, y: 0 }
  }
  const parentOrigin = getContainerContentOrigin(items, container.parentId || ROOT_CONTAINER_ID)
  return {
    x: parentOrigin.x + container.position.x,
    y: parentOrigin.y + container.position.y
  }
}

function getItemOuterSize(item: CanvasItem): { width: number; height: number } {
  if (item.type === 'workflow' || item.type === 'ai-tool') {
    return { width: CARD_WIDTH, height: CARD_HEIGHT }
  }
  const baseHeight = item.collapsed
    ? CONTAINER_HEADER_HEIGHT
    : item.size.height + CONTAINER_HEADER_HEIGHT + CONTAINER_PADDING * 2
  return {
    width: item.size.width + CONTAINER_PADDING * 2,
    height: baseHeight
  }
}

function getItemAbsoluteTopLeft(items: CanvasItemsMap, itemId: string): Position {
  const item = items[itemId]
  if (!item) {
    return { x: 0, y: 0 }
  }

  const parentOrigin = getContainerContentOrigin(items, item.parentId || ROOT_CONTAINER_ID)
  return {
    x: parentOrigin.x + item.position.x,
    y: parentOrigin.y + item.position.y
  }
}

function getItemCenterAbsolute(items: CanvasItemsMap, itemId: string): Position {
  const item = items[itemId]
  if (!item) {
    return { x: 0, y: 0 }
  }
  const topLeft = getItemAbsoluteTopLeft(items, itemId)
  const size = getItemOuterSize(item)
  return {
    x: topLeft.x + size.width / 2,
    y: topLeft.y + size.height / 2
  }
}

function getContainerDepth(items: CanvasItemsMap, containerId: string): number {
  if (containerId === ROOT_CONTAINER_ID) {
    return 0
  }
  let depth = 0
  let currentId: string | undefined = containerId
  while (currentId && currentId !== ROOT_CONTAINER_ID) {
    const container: CanvasItem | undefined = items[currentId]
    if (!isContainer(container)) {
      break
    }
    depth += 1
    currentId = container.parentId
  }
  return depth
}

type CanvasBounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

function calculateCanvasContentBounds(items: CanvasItemsMap): CanvasBounds {
  const rects: Array<{ left: number; top: number; right: number; bottom: number }> = []

  const root = getContainer(items, ROOT_CONTAINER_ID)
  if (root) {
    const rootWidth = root.size.width + CONTAINER_PADDING * 2
    const rootHeight = root.size.height + CONTAINER_HEADER_HEIGHT + CONTAINER_PADDING * 2
    rects.push({
      left: 0,
      top: 0,
      right: rootWidth,
      bottom: rootHeight
    })
  }

  for (const item of Object.values(items)) {
    if (!item || item.id === ROOT_CONTAINER_ID) {
      continue
    }
    const topLeft = getItemAbsoluteTopLeft(items, item.id)
    const size = getItemOuterSize(item)
    rects.push({
      left: topLeft.x,
      top: topLeft.y,
      right: topLeft.x + size.width,
      bottom: topLeft.y + size.height
    })
  }

  if (rects.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }

  // 添加边距，确保内容不会紧贴边缘，给容器留出足够的可视空间
  const CONTENT_MARGIN = 20
  return {
    minX: Math.min(...rects.map((rect) => rect.left)) - CONTENT_MARGIN,
    minY: Math.min(...rects.map((rect) => rect.top)) - CONTENT_MARGIN,
    maxX: Math.max(...rects.map((rect) => rect.right)) + CONTENT_MARGIN,
    maxY: Math.max(...rects.map((rect) => rect.bottom)) + CONTENT_MARGIN
  }
}

function isDescendant(items: CanvasItemsMap, ancestorId: string, maybeDescendantId: string): boolean {
  if (ancestorId === maybeDescendantId) {
    return true
  }

  let currentId: string | undefined = maybeDescendantId
  while (currentId) {
    if (currentId === ancestorId) {
      return true
    }
    const currentItem: CanvasItem | undefined = items[currentId]
    if (!currentItem) {
      return false
    }
    if (!currentItem.parentId) {
      return false
    }
    currentId = currentItem.parentId === ROOT_CONTAINER_ID ? ROOT_CONTAINER_ID : currentItem.parentId
    if (currentId === ROOT_CONTAINER_ID && ancestorId !== ROOT_CONTAINER_ID) {
      return false
    }
  }
  return false
}

function getContainerOuterRect(items: CanvasItemsMap, containerId: string) {
  const origin = getContainerOuterOrigin(items, containerId)
  if (containerId === ROOT_CONTAINER_ID) {
    const root = getContainer(items, containerId)
    return {
      x: origin.x,
      y: origin.y,
      width: (root?.size.width ?? 3200) + CONTAINER_PADDING * 2,
      height: (root?.size.height ?? 1800) + CONTAINER_PADDING * 2 + CONTAINER_HEADER_HEIGHT
    }
  }
  const container = getContainer(items, containerId)
  if (!container) {
    return { x: origin.x, y: origin.y, width: 0, height: 0 }
  }
  const size = getItemOuterSize(container)
  return { x: origin.x, y: origin.y, width: size.width, height: size.height }
}

// 检查两个矩形是否重叠
function doRectsOverlap(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    rect1.x + rect1.width <= rect2.x ||
    rect2.x + rect2.width <= rect1.x ||
    rect1.y + rect1.height <= rect2.y ||
    rect2.y + rect2.height <= rect1.y
  )
}

// 在容器中找到不重叠的位置
function findNonOverlappingPosition(
  items: CanvasItemsMap,
  containerId: string,
  preferredPosition: Position,
  itemWidth: number,
  itemHeight: number,
  excludeItemId?: string
): Position {
  const container = getContainer(items, containerId)
  if (!container) {
    return preferredPosition
  }

  // 获取容器中所有子项的位置和尺寸（排除正在移动的项目）
  const siblings = (container.childrenIds || [])
    .filter((childId) => childId !== excludeItemId)
    .map((childId) => items[childId])
    .filter(Boolean)
    .map((child) => {
      const size = getItemOuterSize(child)
      return {
        x: child.position.x,
        y: child.position.y,
        width: size.width,
        height: size.height
      }
    })

  // 检查首选位置是否可用
  const preferredRect = {
    x: preferredPosition.x,
    y: preferredPosition.y,
    width: itemWidth,
    height: itemHeight
  }

  let hasOverlap = false
  for (const sibling of siblings) {
    if (doRectsOverlap(preferredRect, sibling)) {
      hasOverlap = true
      break
    }
  }

  if (!hasOverlap) {
    return preferredPosition
  }

  // 如果有重叠，尝试在附近找一个空位
  // 使用螺旋搜索模式，从首选位置向外扩展
  const SPACING = 8 // 卡片之间的最小间距
  const GRID_STEP = 20 // 搜索步长
  const MAX_ATTEMPTS = 200 // 最大尝试次数

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // 螺旋搜索：计算当前层数和位置
    const layer = Math.floor(Math.sqrt(attempt))
    const offset = attempt - layer * layer
    const layerSize = 2 * layer + 1

    let testX = preferredPosition.x
    let testY = preferredPosition.y

    if (layer > 0) {
      if (offset < layerSize - 1) {
        // 右边
        testX = preferredPosition.x + layer * GRID_STEP
        testY = preferredPosition.y + (offset - layer) * GRID_STEP
      } else if (offset < 2 * (layerSize - 1)) {
        // 上边
        testX = preferredPosition.x + (layer - (offset - (layerSize - 1))) * GRID_STEP
        testY = preferredPosition.y - layer * GRID_STEP
      } else if (offset < 3 * (layerSize - 1)) {
        // 左边
        testX = preferredPosition.x - layer * GRID_STEP
        testY = preferredPosition.y + (layer - (offset - 2 * (layerSize - 1))) * GRID_STEP
      } else {
        // 下边
        testX = preferredPosition.x + (offset - 3 * (layerSize - 1) - layer) * GRID_STEP
        testY = preferredPosition.y + layer * GRID_STEP
      }
    }

    // 确保在容器范围内
    testX = Math.max(SPACING, testX)
    testY = Math.max(SPACING, testY)

    const testRect = {
      x: testX,
      y: testY,
      width: itemWidth,
      height: itemHeight
    }

    let testHasOverlap = false
    for (const sibling of siblings) {
      if (doRectsOverlap(testRect, sibling)) {
        testHasOverlap = true
        break
      }
    }

    if (!testHasOverlap) {
      return { x: testX, y: testY }
    }
  }

  // 如果找不到合适的位置，就在所有子项的右边放置
  let maxRight = SPACING
  for (const sibling of siblings) {
    maxRight = Math.max(maxRight, sibling.x + sibling.width + SPACING)
  }

  return { x: maxRight, y: SPACING }
}

function convertAbsoluteToContainerPosition(
  items: CanvasItemsMap,
  containerId: string,
  absoluteTopLeft: Position
): Position {
  const origin = getContainerContentOrigin(items, containerId)
  return {
    x: Math.max(0, absoluteTopLeft.x - origin.x),
    y: Math.max(0, absoluteTopLeft.y - origin.y)
  }
}

function recalcContainerSizes(items: CanvasItemsMap, startingContainers: string[]) {
  const queue: string[] = Array.from(new Set(startingContainers.filter(Boolean)))
  const changedContainers: string[] = [] // 记录尺寸发生变化的容器

  while (queue.length > 0) {
    const containerId = queue.shift()
    if (!containerId || containerId === ROOT_CONTAINER_ID) {
      continue
    }
    const container = getContainer(items, containerId)
    if (!container || container.collapsed) {
      continue
    }

    let maxX = 0
    let maxY = 0
    let hasChild = false

    for (const childId of container.childrenIds) {
      const child = items[childId]
      if (!child) {
        continue
      }
      hasChild = true
      const size = getItemOuterSize(child)
      maxX = Math.max(maxX, child.position.x + size.width)
      maxY = Math.max(maxY, child.position.y + size.height)
    }

    const desiredWidth = hasChild ? Math.max(CONTAINER_MIN_WIDTH, maxX + CONTAINER_PADDING) : CONTAINER_MIN_WIDTH
    const desiredHeight = hasChild ? Math.max(CONTAINER_MIN_HEIGHT, maxY + CONTAINER_PADDING) : CONTAINER_MIN_HEIGHT

    if (desiredWidth !== container.size.width || desiredHeight !== container.size.height) {
      items[containerId] = {
        ...container,
        size: { width: desiredWidth, height: desiredHeight }
      }
      // 记录尺寸发生了变化的容器
      changedContainers.push(containerId)
    }

    if (container.parentId) {
      queue.push(container.parentId)
    }
  }

  // 自动调整被覆盖的元素位置
  if (changedContainers.length > 0) {
    const adjustedPositions = adjustOverlappingItemsAfterResize(items, changedContainers)

    // 应用新位置
    for (const [itemId, newPos] of Object.entries(adjustedPositions)) {
      const item = items[itemId]
      if (item) {
        items[itemId] = {
          ...item,
          position: newPos
        }
      }
    }
  }
}

function findDropTargetContainer(
  items: CanvasItemsMap,
  absolutePoint: Position,
  draggingContainerId?: string
): string {
  const containers = Object.values(items).filter((item): item is ContainerCanvasItem => item.type === 'container')

  containers.sort((a, b) => getContainerDepth(items, b.id) - getContainerDepth(items, a.id))

  for (const container of containers) {
    if (container.id !== ROOT_CONTAINER_ID && container.collapsed) {
      continue
    }
    if (draggingContainerId && isDescendant(items, draggingContainerId, container.id)) {
      continue
    }

    const rect = getContainerOuterRect(items, container.id)
    if (
      absolutePoint.x >= rect.x &&
      absolutePoint.x <= rect.x + rect.width &&
      absolutePoint.y >= rect.y &&
      absolutePoint.y <= rect.y + rect.height
    ) {
      return container.id
    }
  }

  return ROOT_CONTAINER_ID
}

export default function StoragePage() {
  const [librarySearch, setLibrarySearch] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // 默认隐藏
  const [isHoveringEdge, setIsHoveringEdge] = useState(false) // 鼠标是否在左侧边缘热区

  // 工作流执行弹窗状态
  const [showExecutionModal, setShowExecutionModal] = useState(false)
  const [selectedExecutionItem, setSelectedExecutionItem] = useState<WorkflowDefinition | AIToolDefinition | null>(null)

  // 渐进式执行模态框（改为分屏模式）
  const [showStepByStepExecution, setShowStepByStepExecution] = useState(false)
  const [selectedWorkflowForExecution, setSelectedWorkflowForExecution] = useState<ExecutionWorkflow | null>(null)
  const [leftPanelWidth, setLeftPanelWidth] = useState(65) // 左侧面板宽度百分比，右侧执行面板为 100-65=35%

  // 执行历史模态框
  const [showExecutionHistoryModal, setShowExecutionHistoryModal] = useState(false)

  // 执行历史展开状态
  const [executionHistoryExpanded, setExecutionHistoryExpanded] = useState(false)
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [expandedExecutionId, setExpandedExecutionId] = useState<string | null>(null)

  const [activeSections, setActiveSections] = useState<Record<LibrarySection, boolean>>({
    created: false,
    favorites: false,
    recent: false
  })
  const [layoutSectionExpanded, setLayoutSectionExpanded] = useState(true)
  const [activeHeaderSection, setActiveHeaderSection] = useState<'layout' | LibrarySection | 'ai-tools'>('layout')
  const [aiToolsSectionExpanded, setAIToolsSectionExpanded] = useState(false)
  const [aiToolsData] = useState<LibraryAITool[]>(initialAIToolsData)
  const [libraryDraggingId, setLibraryDraggingId] = useState<string | null>(null)
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [favoriteWorkflows, setFavoriteWorkflows] = useState<Workflow[]>([])
  const [createdWorkflows, setCreatedWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [canvasItems, setCanvasItems] = useState<CanvasItemsMap>(() => ({
    [ROOT_CONTAINER_ID]: {
      id: ROOT_CONTAINER_ID,
      type: 'container',
      name: '工作流画布',
      parentId: '',
      position: { x: 0, y: 0 },
      size: { width: 3200, height: 1800 },
      collapsed: false,
      childrenIds: [],
      color: 'rgba(139, 92, 246, 0.15)' // 根容器默认颜色
    }
  }))
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [spacePressed, setSpacePressed] = useState(false)
  const [currentScale, setCurrentScale] = useState(1)

  const dragStateRef = useRef<DragState>(null)
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null)
  const transformStateRef = useRef({
    scale: 1,
    positionX: INITIAL_POSITION_X,
    positionY: INITIAL_POSITION_Y
  })
  const spacePressedRef = useRef(false)
  const canvasContainerRef = useRef<HTMLDivElement | null>(null)
  const pointerInsideCanvasRef = useRef(false)

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false
      }
      const tagName = target.tagName
      return tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') {
        return
      }
      if (isTypingTarget(event.target)) {
        return
      }
      if (!spacePressedRef.current) {
        event.preventDefault()
        spacePressedRef.current = true
        setSpacePressed(true)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') {
        return
      }
      if (spacePressedRef.current) {
        spacePressedRef.current = false
        setSpacePressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // 加载收藏和创建的工作流
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setLoading(true)
        const [favorites, created] = await Promise.all([
          getFavoriteWorkflows(),
          getUserWorkflows()
        ])
        setFavoriteWorkflows(favorites)
        setCreatedWorkflows(created)
      } catch (error) {
        console.error('加载工作流失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadWorkflows()
  }, [])

  // 加载执行历史
  const loadExecutionHistory = useCallback(async () => {
    try {
      setLoadingHistory(true)
      const response = await getExecutionHistory({
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 20
      })
      setExecutionHistory(response.executions)
    } catch (error) {
      console.error('加载执行历史失败:', error)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  // 当执行历史展开时加载数据
  useEffect(() => {
    if (executionHistoryExpanded) {
      loadExecutionHistory()
      // 每10秒自动刷新一次执行历史
      const interval = setInterval(() => {
        loadExecutionHistory()
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [executionHistoryExpanded, loadExecutionHistory])

  // 左侧边缘热区检测和自动显示/隐藏侧边栏
  useEffect(() => {
    const EDGE_THRESHOLD = 15 // 左侧边缘热区宽度（px）
    const SIDEBAR_WIDTH = 320 // 侧边栏宽度

    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX

      // 检测鼠标是否在左侧边缘热区
      if (mouseX <= EDGE_THRESHOLD && sidebarCollapsed) {
        setIsHoveringEdge(true)
        setSidebarCollapsed(false)
      }
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // 如果鼠标离开了侧边栏区域，自动收起
      if (e.clientX > SIDEBAR_WIDTH) {
        setSidebarCollapsed(true)
        setIsHoveringEdge(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [sidebarCollapsed])

  // 格式化时长
  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}min`
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`

    return date.toLocaleDateString('zh-CN')
  }

  const libraryData = useMemo(() => {
    // 将API数据转换为LibraryWorkflow格式,并添加所有权标记
    const convertToLibraryWorkflow = (workflow: Workflow, section: LibrarySection, isOwner: boolean): LibraryWorkflow => ({
      id: workflow.id,
      name: workflow.title,
      summary: workflow.description || '',
      status: 'active' as WorkflowStatus,
      category: workflow.category || '未分类',
      tags: Array.isArray(workflow.tags) ? workflow.tags : [],
      owner: workflow.author?.name || '我',
      updatedAt: new Date(workflow.createdAt).toISOString().split('T')[0],
      section,
      config: workflow.config,
      nodes: workflow.config?.nodes || workflow.nodes,
      isOwner,  // 标记是否拥有
      canEdit: isOwner  // 只有拥有者才能编辑
    })

    // created 工作流都是用户拥有的
    const favorites = (favoriteWorkflows || []).map(wf => {
      const isOwner = createdWorkflows.some(cw => cw.id === wf.id)
      return convertToLibraryWorkflow(wf, 'favorites', isOwner)
    })
    const created = (createdWorkflows || []).map(wf => convertToLibraryWorkflow(wf, 'created', true))

    // 合并静态数据和API数据，优先显示API数据
    const staticFavorites = initialLibraryData.filter(wf => wf.section === 'favorites')
    const staticCreated = initialLibraryData.filter(wf => wf.section === 'created')
    const staticRecent = initialLibraryData.filter(wf => wf.section === 'recent')

    return [
      ...created,
      ...staticCreated.filter(sf => !created.some(c => c.id === sf.id)),
      ...favorites,
      ...staticFavorites.filter(sf => !favorites.some(f => f.id === sf.id)),
      ...staticRecent
    ]
  }, [favoriteWorkflows, createdWorkflows])

  const filteredLibrary = useMemo(() => {
    const keyword = librarySearch.trim().toLowerCase()
    if (!keyword) {
      return libraryData
    }
    return libraryData.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.summary.toLowerCase().includes(keyword) ||
        item.tags.some((tag) => tag.toLowerCase().includes(keyword))
    )
  }, [libraryData, librarySearch])

  const sectionedLibrary = useMemo(() => {
    const grouped: Record<LibrarySection, LibraryWorkflow[]> = {
      created: [],
      favorites: [],
      recent: []
    }
    for (const workflow of filteredLibrary) {
      grouped[workflow.section].push(workflow)
    }
    return grouped
  }, [filteredLibrary])

  const rootContainer = canvasItems[ROOT_CONTAINER_ID] as ContainerCanvasItem

  const updateCanvasItems = useCallback(
    (mutate: (draft: CanvasItemsMap) => void) => {
      setCanvasItems((prev) => {
        const draft: CanvasItemsMap = { ...prev }
        for (const [id, item] of Object.entries(prev)) {
          if (item.type === 'container') {
            draft[id] = {
              ...item,
              position: { ...item.position },
              size: { ...item.size },
              childrenIds: [...item.childrenIds]
            }
          } else {
            draft[id] = {
              ...item,
              position: { ...item.position }
            }
          }
        }
        mutate(draft)
        return draft
      })
    },
    []
  )

  const handleLibraryDragStart = (workflowId: string) => {
    setLibraryDraggingId(workflowId)
  }

  const handleLibraryDragEnd = () => {
    setLibraryDraggingId(null)
  }

  const toggleSection = (section: LibrarySection) => {
    setActiveSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const attachToParent = useCallback((items: CanvasItemsMap, parentId: string, childId: string) => {
    const parent = getContainer(items, parentId)
    if (!parent) return
    if (!parent.childrenIds.includes(childId)) {
      items[parentId] = {
        ...parent,
        childrenIds: [...parent.childrenIds, childId]
      }
    }
  }, [])

  const detachFromParent = useCallback((items: CanvasItemsMap, parentId: string, childId: string) => {
    const parent = getContainer(items, parentId)
    if (!parent) return
    if (parent.childrenIds.includes(childId)) {
      items[parentId] = {
        ...parent,
        childrenIds: parent.childrenIds.filter((id) => id !== childId)
      }
    }
  }, [])

  const handleCanvasDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      if (!libraryDraggingId) return

      // 检查是工作流还是AI工具
      const workflow = libraryData.find((item) => item.id === libraryDraggingId)
      const aiTool = aiToolsData.find((item) => item.id === libraryDraggingId)

      if (!workflow && !aiTool) return

      const wrapperElement = transformRef.current?.instance.wrapperComponent
      if (!wrapperElement) return
      const wrapperRect = wrapperElement.getBoundingClientRect()

      const pointer = {
        x: event.clientX - wrapperRect.left,
        y: event.clientY - wrapperRect.top
      }
      const { scale, positionX, positionY } = transformStateRef.current
      const worldPoint: Position = {
        x: (pointer.x - positionX) / scale,
        y: (pointer.y - positionY) / scale
      }

      updateCanvasItems((draft) => {
        const dropTarget = findDropTargetContainer(draft, worldPoint)
        const topLeftGuess = {
          x: worldPoint.x - CARD_WIDTH / 2,
          y: worldPoint.y - CARD_HEIGHT / 2
        }
        const relativePositionGuess = convertAbsoluteToContainerPosition(draft, dropTarget, topLeftGuess)

        // 使用碰撞检测找到不重叠的位置
        const relativePosition = findNonOverlappingPosition(
          draft,
          dropTarget,
          relativePositionGuess,
          CARD_WIDTH,
          CARD_HEIGHT
        )

        if (workflow) {
          // 创建工作流卡片
          const cardId = generateId('workflow-card')
          draft[cardId] = {
            id: cardId,
            type: 'workflow',
            workflowId: workflow.id,
            parentId: dropTarget,
            position: relativePosition
          }
          attachToParent(draft, dropTarget, cardId)
        } else if (aiTool) {
          // 创建AI工具卡片
          const cardId = generateId('ai-tool-card')
          draft[cardId] = {
            id: cardId,
            type: 'ai-tool',
            toolId: aiTool.id,
            parentId: dropTarget,
            position: relativePosition
          }
          attachToParent(draft, dropTarget, cardId)
        }

        const targetContainer = getContainer(draft, dropTarget)
        if (targetContainer?.collapsed) {
          draft[dropTarget] = { ...targetContainer, collapsed: false }
        }

        recalcContainerSizes(draft, [dropTarget])
      })

      setLibraryDraggingId(null)
    },
    [attachToParent, aiToolsData, libraryData, libraryDraggingId, updateCanvasItems]
  )

  const handleCanvasDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (libraryDraggingId) {
      event.preventDefault()
    }
  }

  const handleWindowMouseMove = useCallback(
    (event: MouseEvent) => {
      if (dragStateRef.current?.type !== 'item') {
        return
      }
      const { itemId, pointerStart, itemStart } = dragStateRef.current
      const { scale } = transformStateRef.current
      const delta = {
        x: (event.clientX - pointerStart.x) / scale,
        y: (event.clientY - pointerStart.y) / scale
      }

      updateCanvasItems((draft) => {
        const item = draft[itemId]
        if (!item) {
          return
        }
        const nextPos = {
          x: Math.max(0, itemStart.x + delta.x),
          y: Math.max(0, itemStart.y + delta.y)
        }
        draft[itemId] = {
          ...item,
          position: nextPos
        }
      })
    },
    [updateCanvasItems]
  )

  const handleWindowMouseUp = useCallback(() => {
    if (dragStateRef.current?.type === 'item') {
      const { itemId, parentId: startParentId, itemType } = dragStateRef.current
      updateCanvasItems((draft) => {
        const item = draft[itemId]
        if (!item) {
          return
        }

        const absoluteCenter = getItemCenterAbsolute(draft, itemId)
        const dropTarget = findDropTargetContainer(draft, absoluteCenter, itemType === 'container' ? itemId : undefined)
        const initialParent = startParentId

        if (dropTarget !== item.parentId) {
          const absoluteTopLeft = getItemAbsoluteTopLeft(draft, itemId)
          const relativePositionGuess = convertAbsoluteToContainerPosition(draft, dropTarget, absoluteTopLeft)

          // 获取项目尺寸
          const itemSize = getItemOuterSize(item)

          // 使用碰撞检测找到不重叠的位置（排除自己）
          const relativePosition = findNonOverlappingPosition(
            draft,
            dropTarget,
            relativePositionGuess,
            itemSize.width,
            itemSize.height,
            itemId
          )

          detachFromParent(draft, getParentId(item), itemId)

          // 如果移动的是容器，继承根容器的颜色，并递归更新所有子容器
          if (item.type === 'container') {
            const rootColor = getRootContainerColor(draft, dropTarget)
            draft[itemId] = { ...item, parentId: dropTarget, position: relativePosition, color: rootColor }
            // 递归更新所有子容器的颜色
            updateContainerColorRecursively(draft, itemId, rootColor)
          } else {
            draft[itemId] = { ...item, parentId: dropTarget, position: relativePosition }
          }

          attachToParent(draft, dropTarget, itemId)

          const targetContainer = getContainer(draft, dropTarget)
          if (targetContainer?.collapsed) {
            draft[dropTarget] = { ...targetContainer, collapsed: false }
          }

          recalcContainerSizes(draft, [dropTarget, initialParent])
        } else {
          // 即使在同一个容器内，也检查是否与其他项目重叠
          const itemSize = getItemOuterSize(item)
          const nonOverlappingPosition = findNonOverlappingPosition(
            draft,
            item.parentId,
            item.position,
            itemSize.width,
            itemSize.height,
            itemId
          )

          // 如果位置有变化，更新位置
          if (nonOverlappingPosition.x !== item.position.x || nonOverlappingPosition.y !== item.position.y) {
            draft[itemId] = {
              ...item,
              position: nonOverlappingPosition
            }
          }

          recalcContainerSizes(draft, [item.parentId])
        }
      })
    }

    setDraggingItemId(null)
    dragStateRef.current = null

    window.removeEventListener('mousemove', handleWindowMouseMove)
    window.removeEventListener('mouseup', handleWindowMouseUp)
  }, [attachToParent, detachFromParent, handleWindowMouseMove, updateCanvasItems])

  const handleItemMouseDown = useCallback(
    (event: React.MouseEvent, itemId: string) => {
      const pointer = { x: event.clientX, y: event.clientY }
      const item = canvasItems[itemId]
      if (!item) {
        return
      }

      if (event.button !== 0) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      setDraggingItemId(itemId)
      dragStateRef.current = {
        type: 'item',
        itemId,
        itemType: item.type,
        pointerStart: pointer,
        itemStart: { ...item.position },
        parentId: getParentId(item)
      }

      window.addEventListener('mousemove', handleWindowMouseMove)
      window.addEventListener('mouseup', handleWindowMouseUp)
    },
    [canvasItems, handleWindowMouseMove, handleWindowMouseUp]
  )

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
    }
  }, [handleWindowMouseMove, handleWindowMouseUp])


  const applyBounds = useCallback(
    (
      positionX: number,
      positionY: number,
      scale: number,
      options: { damping?: boolean } = {}
    ): { x: number; y: number } => {
      const { damping = false } = options
      const contentBounds = calculateCanvasContentBounds(canvasItems)
      const wrapperElement = transformRef.current?.instance.wrapperComponent
      const viewportWidth = wrapperElement?.clientWidth ?? window.innerWidth
      const viewportHeight = wrapperElement?.clientHeight ?? window.innerHeight
      const contentWidth = Math.max(contentBounds.maxX - contentBounds.minX, 1)
      const contentHeight = Math.max(contentBounds.maxY - contentBounds.minY, 1)
      const requiredVisibleWidth = Math.min(contentWidth * scale * MIN_VISIBLE_RATIO, viewportWidth)
      const requiredVisibleHeight = Math.min(contentHeight * scale * MIN_VISIBLE_RATIO, viewportHeight)
      const minLeft = -Math.max(contentWidth * scale - requiredVisibleWidth, 0)
      const minTop = -Math.max(contentHeight * scale - requiredVisibleHeight, 0)

      let nextX = positionX
      let nextY = positionY

      const adjustUpper = (value: number, limit: number) => {
        if (value <= limit) {
          return value
        }
        if (damping) {
          return limit + (value - limit) * 0.3
        }
        return limit
      }

      const adjustLower = (value: number, limit: number) => {
        if (value >= limit) {
          return value
        }
        if (damping) {
          return limit - (limit - value) * 0.3
        }
        return limit
      }

      let left = positionX + contentBounds.minX * scale
      let right = positionX + contentBounds.maxX * scale
      const leftAdjustDelta = adjustUpper(left, TOP_LEFT_LIMIT) - left
      if (leftAdjustDelta !== 0) {
        nextX += leftAdjustDelta
        left += leftAdjustDelta
        right += leftAdjustDelta
      }
      const leftLowerDelta = adjustLower(left, minLeft) - left
      if (leftLowerDelta !== 0) {
        nextX += leftLowerDelta
        left += leftLowerDelta
        right += leftLowerDelta
      }

      let top = positionY + contentBounds.minY * scale
      let bottom = positionY + contentBounds.maxY * scale
      const upperTopDelta = adjustUpper(top, TOP_LEFT_LIMIT) - top
      if (upperTopDelta !== 0) {
        nextY += upperTopDelta
        top += upperTopDelta
        bottom += upperTopDelta
      }
      const lowerTopDelta = adjustLower(top, minTop) - top
      if (lowerTopDelta !== 0) {
        nextY += lowerTopDelta
        top += lowerTopDelta
        bottom += lowerTopDelta
      }

      return { x: nextX, y: nextY }
    },
    [canvasItems]
  )

  const clampTransform = useCallback(
    (ref: ReactZoomPanPinchRef, animationTime = 200, easing: 'easeOut' | 'easeInOutCubic' | 'linear' = 'easeOut') => {
      const { scale, positionX, positionY } = ref.state
      const bounded = applyBounds(positionX, positionY, scale)
      // 只有当偏移量较大时才调整（避免微小调整导致视图跳动）
      const deltaX = Math.abs(bounded.x - positionX)
      const deltaY = Math.abs(bounded.y - positionY)
      if (deltaX > 5 || deltaY > 5) {
        ref.setTransform(bounded.x, bounded.y, scale, animationTime, easing)
      }
    },
    [applyBounds]
  )

  const handleInit = useCallback((ref: ReactZoomPanPinchRef) => {
    transformRef.current = ref
    transformStateRef.current = {
      scale: ref.state.scale,
      positionX: ref.state.positionX,
      positionY: ref.state.positionY
    }
    setCurrentScale(ref.state.scale)
  }, [])

  const handleTransformed = useCallback((ref: ReactZoomPanPinchRef) => {
    transformStateRef.current = {
      scale: ref.state.scale,
      positionX: ref.state.positionX,
      positionY: ref.state.positionY
    }
    setCurrentScale(ref.state.scale)
  }, [])

  const handlePanningStart = useCallback(() => {
    setIsPanning(true)
  }, [])

  const handlePanning = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      const { scale, positionX, positionY } = ref.state
      const bounded = applyBounds(positionX, positionY, scale, { damping: true })
      if (bounded.x !== positionX || bounded.y !== positionY) {
        ref.setTransform(bounded.x, bounded.y, scale, 0)
      }
    },
    [applyBounds]
  )

  const handlePanningStop = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      setIsPanning(false)
      // 平移停止时不强制调整边界，让用户自由移动
    },
    []
  )

  const handlePinching = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      const { scale, positionX, positionY } = ref.state
      const bounded = applyBounds(positionX, positionY, scale, { damping: true })
      if (bounded.x !== positionX || bounded.y !== positionY) {
        ref.setTransform(bounded.x, bounded.y, scale, 0)
      }
    },
    [applyBounds]
  )

  const handlePinchingStop = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      clampTransform(ref, 250)
    },
    [clampTransform]
  )

  const handleZoomStop = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      clampTransform(ref, 200)
    },
    [clampTransform]
  )

  const handleWheelStop = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      // 滚轮停止时不强制调整边界，让用户自由滚动
    },
    []
  )

  const handleCanvasTouch = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null
    if (target && target.closest('.workflow-canvas-area')) {
      event.stopPropagation()
      if (event.touches.length > 1) {
        event.preventDefault()
      }
    }
  }, [])

  // 禁用页面级别的滚动，防止整个页面滚动
  useEffect(() => {
    // 保存原始样式
    const originalOverflow = document.body.style.overflow
    const originalOverscrollBehavior = document.body.style.overscrollBehavior
    const originalOverscrollBehaviorX = document.body.style.overscrollBehaviorX
    const originalHeight = document.body.style.height
    const originalPosition = document.body.style.position

    // 禁用 body 滚动和导航手势
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
    document.body.style.overscrollBehaviorX = 'none'
    document.body.style.height = '100vh'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'

    // 同时处理 html 元素
    const htmlElement = document.documentElement
    const originalHtmlOverflow = htmlElement.style.overflow
    const originalHtmlOverscrollBehavior = htmlElement.style.overscrollBehavior
    const originalHtmlOverscrollBehaviorX = htmlElement.style.overscrollBehaviorX

    htmlElement.style.overflow = 'hidden'
    htmlElement.style.overscrollBehavior = 'none'
    htmlElement.style.overscrollBehaviorX = 'none'

    return () => {
      // 恢复原始样式
      document.body.style.overflow = originalOverflow
      document.body.style.overscrollBehavior = originalOverscrollBehavior
      document.body.style.overscrollBehaviorX = originalOverscrollBehaviorX
      document.body.style.height = originalHeight
      document.body.style.position = originalPosition
      document.body.style.width = ''
      htmlElement.style.overflow = originalHtmlOverflow
      htmlElement.style.overscrollBehavior = originalHtmlOverscrollBehavior
      htmlElement.style.overscrollBehaviorX = originalHtmlOverscrollBehaviorX
    }
  }, [])

  useEffect(() => {
    const handleGlobalWheel = (event: WheelEvent) => {
      // 完全阻止页面级别的滚动
      const target = event.target as HTMLElement

      // 只允许在工作流库列表区域滚动
      const isInLibraryList = target.closest('.workflow-library-list')

      // 只允许在画布区域处理滚轮事件（由 handleWheel 处理）
      const isInCanvas = target.closest('.workflow-canvas-container')

      // 允许在标记为可滚动的数据面板内滚动（如渐进式执行面板）
      const isInCustomScrollArea = target.closest('[data-scroll-container="true"]')

      // 如果不在列表或画布区域，则阻止滚动
      if (!isInLibraryList && !isInCanvas && !isInCustomScrollArea) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    const wheelOptions = { passive: false, capture: true }
    window.addEventListener('wheel', handleGlobalWheel, wheelOptions)
    return () => {
      window.removeEventListener('wheel', handleGlobalWheel, wheelOptions as EventListenerOptions)
    }
  }, [])

  // 在全局级别阻止浏览器后退手势（但不影响画布区域）
  useEffect(() => {
    let touchStartX = 0
    let touchStartY = 0

    // 阻止整个页面的横向导航手势（但允许画布区域）
    const preventBackNavigation = (event: WheelEvent) => {
      const target = event.target as HTMLElement
      // 如果在画布区域内，不阻止横向滚动
      if (
        target.closest('.workflow-canvas-container') ||
        target.closest('[data-scroll-container="true"]')
      ) {
        return
      }
      // 检测是否是横向滚动（可能触发后退）
      if (Math.abs(event.deltaX) > 0) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    const handleTouchStart = (event: TouchEvent) => {
      // 只记录单指触摸的起始位置，双指及以上不处理
      if (event.touches.length === 1) {
        touchStartX = event.touches[0].clientX
        touchStartY = event.touches[0].clientY
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      // 双指及以上的手势不阻止，允许双指平移
      if (event.touches.length >= 2) {
        return
      }

      const target = event.target as HTMLElement
      // 如果在画布区域内，不阻止任何触摸手势
      if (
        target.closest('.workflow-canvas-container') ||
        target.closest('[data-scroll-container="true"]')
      ) {
        return
      }

      // 单指手势：检测是否是横向滑动
      if (event.touches.length === 1) {
        const touchX = event.touches[0].clientX
        const touchY = event.touches[0].clientY
        const deltaX = touchX - touchStartX
        const deltaY = touchY - touchStartY

        // 如果横向移动距离大于纵向移动距离，认为是横向滑动
        // 阻止横向滑动以防止浏览器后退手势
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
          event.preventDefault()
          event.stopPropagation()
        }
      }
    }

    // 在 window 级别监听，确保优先级最高
    const wheelOptions = { passive: false, capture: true }
    const touchStartOptions = { passive: true, capture: true }
    const touchMoveOptions = { passive: false, capture: true }

    window.addEventListener('wheel', preventBackNavigation, wheelOptions)
    window.addEventListener('touchstart', handleTouchStart, touchStartOptions)
    window.addEventListener('touchmove', handleTouchMove, touchMoveOptions)

    return () => {
      window.removeEventListener('wheel', preventBackNavigation, wheelOptions as EventListenerOptions)
      window.removeEventListener('touchstart', handleTouchStart, touchStartOptions as EventListenerOptions)
      window.removeEventListener('touchmove', handleTouchMove, touchMoveOptions as EventListenerOptions)
    }
  }, [])

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null
      if (!target || !target.closest('.workflow-canvas-area')) {
        return
      }
      event.stopPropagation()
      event.preventDefault()
      const ref = transformRef.current
      if (!ref) {
        return
      }
      const wrapper = ref.instance.wrapperComponent
      if (!wrapper) {
        return
      }
      event.preventDefault()
      const rect = wrapper.getBoundingClientRect()
      const { scale, positionX, positionY } = ref.state
      const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 120 : 1
      const deltaX = event.deltaX * multiplier
      const deltaY = event.deltaY * multiplier

      if (event.ctrlKey) {
        const pointer = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        }
        const worldX = (pointer.x - positionX) / scale
        const worldY = (pointer.y - positionY) / scale
        const zoomIntensity = 0.0015
        const targetScale = Math.min(Math.max(scale * (1 - deltaY * zoomIntensity), 0.3), 3)
        const targetX = pointer.x - worldX * targetScale
        const targetY = pointer.y - worldY * targetScale
        const bounded = applyBounds(targetX, targetY, targetScale)
        ref.setTransform(bounded.x, bounded.y, targetScale, 120, 'easeOut')
        return
      }

      const horizontalShift = event.shiftKey ? deltaY : deltaX
      const verticalShift = event.shiftKey ? 0 : deltaY
      const nextX = positionX - horizontalShift
      const nextY = positionY - verticalShift
      const bounded = applyBounds(nextX, nextY, scale)
      ref.setTransform(bounded.x, bounded.y, scale, 0)
    },
    [applyBounds]
  )

  const zoomIn = useCallback(() => {
    const ref = transformRef.current
    if (!ref) {
      return
    }
    const nextScale = Math.min(ref.state.scale * 1.1, 3)
    const bounded = applyBounds(ref.state.positionX, ref.state.positionY, nextScale)
    ref.setTransform(bounded.x, bounded.y, nextScale, 200, 'easeOut')
  }, [applyBounds])

  const zoomOut = useCallback(() => {
    const ref = transformRef.current
    if (!ref) {
      return
    }
    const nextScale = Math.max(ref.state.scale / 1.1, 0.3)
    const bounded = applyBounds(ref.state.positionX, ref.state.positionY, nextScale)
    ref.setTransform(bounded.x, bounded.y, nextScale, 200, 'easeOut')
  }, [applyBounds])

  const resetView = useCallback(() => {
    const ref = transformRef.current
    if (!ref) {
      return
    }
    const bounded = applyBounds(INITIAL_POSITION_X, INITIAL_POSITION_Y, 1)
    ref.setTransform(bounded.x, bounded.y, 1, 300, 'easeOut')
  }, [applyBounds])

  const zoomToFit = useCallback(() => {
    const ref = transformRef.current
    if (!ref) {
      return
    }
    const wrapperElement = ref.instance.wrapperComponent
    if (!wrapperElement) {
      return
    }
    const contentBounds = calculateCanvasContentBounds(canvasItems)
    const width = Math.max(contentBounds.maxX - contentBounds.minX, 1)
    const height = Math.max(contentBounds.maxY - contentBounds.minY, 1)
    const viewportWidth = wrapperElement.clientWidth
    const viewportHeight = wrapperElement.clientHeight
    const scaleX = (viewportWidth * 0.9) / width
    const scaleY = (viewportHeight * 0.9) / height
    const optimalScale = Math.min(Math.max(Math.min(scaleX, scaleY, 1), 0.3), 3)
    const desiredLeft = Math.max(
      TOP_LEFT_LIMIT,
      (viewportWidth - width * optimalScale) / 2
    )
    const desiredTop = Math.max(
      TOP_LEFT_LIMIT,
      (viewportHeight - height * optimalScale) / 2
    )
    const targetX = desiredLeft - contentBounds.minX * optimalScale
    const targetY = desiredTop - contentBounds.minY * optimalScale
    const bounded = applyBounds(targetX, targetY, optimalScale)
    ref.setTransform(bounded.x, bounded.y, optimalScale, 500, 'easeInOutCubic')
  }, [applyBounds, canvasItems])

  const handleToggleContainer = (containerId: string) => {
    updateCanvasItems((draft) => {
      const container = getContainer(draft, containerId)
      if (!container) return
      draft[containerId] = { ...container, collapsed: !container.collapsed }
    })
  }

  const handleStartRename = (containerId: string, currentName: string) => {
    setEditingContainerId(containerId)
    setEditingName(currentName)
  }

  const commitRename = () => {
    if (!editingContainerId) {
      return
    }
    const trimmed = editingName.trim()
    if (!trimmed) {
      setEditingContainerId(null)
      return
    }
    updateCanvasItems((draft) => {
      const container = getContainer(draft, editingContainerId)
      if (!container) return
      draft[editingContainerId] = { ...container, name: trimmed }
    })
    setEditingContainerId(null)
  }

  const handleDeleteContainer = (containerId: string) => {
    if (containerId === ROOT_CONTAINER_ID) {
      return // 不能删除根容器
    }

    updateCanvasItems((draft) => {
      const container = getContainer(draft, containerId)
      if (!container) return

      // 删除容器及其所有子项
      const itemsToDelete = [containerId]
      const queue = [...container.childrenIds]

      while (queue.length > 0) {
        const itemId = queue.shift()
        if (!itemId) continue

        itemsToDelete.push(itemId)
        const item = draft[itemId]
        if (item && item.type === 'container') {
          queue.push(...item.childrenIds)
        }
      }

      // 从父容器移除
      detachFromParent(draft, container.parentId, containerId)

      // 删除所有项
      for (const id of itemsToDelete) {
        delete draft[id]
      }

      // 重新计算父容器大小
      recalcContainerSizes(draft, [container.parentId])
    })
  }

  const handleExtractContainer = (containerId: string) => {
    if (containerId === ROOT_CONTAINER_ID) {
      return // 根容器不需要取出
    }

    updateCanvasItems((draft) => {
      const container = getContainer(draft, containerId)
      if (!container || container.parentId === ROOT_CONTAINER_ID) {
        return // 已经在根容器了
      }

      const oldParentId = container.parentId

      // 获取容器在画布上的绝对位置
      const absoluteTopLeft = getItemAbsoluteTopLeft(draft, containerId)

      // 转换为根容器的相对位置
      const newPosition = convertAbsoluteToContainerPosition(draft, ROOT_CONTAINER_ID, absoluteTopLeft)

      // 从原父容器移除
      detachFromParent(draft, oldParentId, containerId)

      // 添加到根容器，并分配新的随机颜色
      draft[containerId] = {
        ...container,
        parentId: ROOT_CONTAINER_ID,
        position: newPosition,
        color: getRandomContainerColor()
      }
      attachToParent(draft, ROOT_CONTAINER_ID, containerId)

      // 重新计算相关容器大小
      recalcContainerSizes(draft, [oldParentId, ROOT_CONTAINER_ID])
    })
  }

  const handleCreateContainer = () => {
    const containerId = generateId('container')

    updateCanvasItems((draft) => {
      // 首选位置：画布左上角（带一点偏移避免紧贴边缘）
      const preferredPosition = {
        x: 20,
        y: 20
      }

      // 计算容器的外部尺寸（包含padding和header）
      const outerWidth = CONTAINER_MIN_WIDTH + CONTAINER_PADDING * 2
      const outerHeight = CONTAINER_MIN_HEIGHT + CONTAINER_PADDING * 2 + CONTAINER_HEADER_HEIGHT

      // 使用碰撞检测找到不重叠的位置
      const position = findNonOverlappingPosition(
        draft,
        ROOT_CONTAINER_ID,
        preferredPosition,
        outerWidth,
        outerHeight
      )

      draft[containerId] = {
        id: containerId,
        type: 'container',
        name: '新容器',
        parentId: ROOT_CONTAINER_ID,
        position,
        size: { width: CONTAINER_MIN_WIDTH, height: CONTAINER_MIN_HEIGHT },
        collapsed: false,
        childrenIds: [],
        color: getRandomContainerColor()
      }
      attachToParent(draft, ROOT_CONTAINER_ID, containerId)
      recalcContainerSizes(draft, [ROOT_CONTAINER_ID])
    })

    // 不自动进入编辑模式，用户可以双击容器标题来重命名
    // setEditingContainerId(containerId)
    // setEditingName('新容器')
  }

  const buildExecutionWorkflowPayload = (workflow: LibraryWorkflow): ExecutionWorkflow => {
    const nodesFromConfig = workflow.config?.nodes
    const fallbackNodes = workflow.nodes
    const nodesSource = (nodesFromConfig && nodesFromConfig.length > 0)
      ? nodesFromConfig
      : (fallbackNodes && fallbackNodes.length > 0)
        ? fallbackNodes
        : DEFAULT_EXECUTION_NODES

    const normalizedNodes = nodesSource.map((node: any, index) => ({
      ...node,
      id: node.id || `node-${index + 1}`,
      type: node.type,
      data: node.data ?? {
        label: node.data?.label ?? node.label ?? `节点 ${index + 1}`,
        config: node.data?.config ?? node.config ?? {}
      }
    }))

    return {
      id: workflow.id,
      title: workflow.name,
      description: workflow.summary,
      config: {
        ...(workflow.config || {}),
        nodes: normalizedNodes
      }
    }
  }

  const handleExecutionWorkflowUpdate = useCallback(
    async (updatedWorkflow: ExecutionWorkflow) => {
      // 所有在用户数据库中的工作流都是副本，可以直接保存
      try {
        await updateWorkflow(updatedWorkflow.id, { config: updatedWorkflow.config })

        // 只更新 createdWorkflows (用户拥有的工作流)
        setCreatedWorkflows((prev) =>
          prev.map((wf) =>
            wf.id === updatedWorkflow.id
              ? { ...wf, config: updatedWorkflow.config, nodes: updatedWorkflow.config?.nodes }
              : wf
          )
        )

        // 如果这个工作流也在收藏列表中,同步更新(保持数据一致性)
        // 但收藏列表中的工作流配置更新不代表用户可以编辑它
        const isFavorited = favoriteWorkflows.some((wf) => wf.id === updatedWorkflow.id)
        if (isFavorited) {
          setFavoriteWorkflows((prev) =>
            prev.map((wf) =>
              wf.id === updatedWorkflow.id
                ? { ...wf, config: updatedWorkflow.config, nodes: updatedWorkflow.config?.nodes }
                : wf
            )
          )
        }

        setSelectedWorkflowForExecution(updatedWorkflow)
      } catch (error) {
        console.error('保存工作流配置失败:', error)
        throw error
      }
    },
    [libraryData, createdWorkflows, favoriteWorkflows]
  )

  const renderWorkflowCard = (card: WorkflowCanvasItem) => {
    const workflow = libraryData.find((item) => item.id === card.workflowId)
    const isDragging = draggingItemId === card.id

    // 状态配置
    const statusConfig = {
      active: { color: '#10b981', label: '运行中' },
      draft: { color: '#f59e0b', label: '草稿' },
      paused: { color: '#6b7280', label: '已暂停' }
    }
    const status = workflow?.status || 'draft'
    const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft

    // 获取工作流所在容器的根容器颜色
    const isInRoot = card.parentId === ROOT_CONTAINER_ID
    const containerColor = isInRoot ? 'rgba(0, 0, 0, 0.15)' : getRootContainerColor(canvasItems, card.parentId)
    return (
      <div
        className="workflow-card no-pan"
        key={card.id}
        onMouseDown={(event) => handleItemMouseDown(event, card.id)}
        onDoubleClick={(e) => {
          e.stopPropagation()
          if (workflow) {
            setSelectedExecutionItem(workflow)
            setShowExecutionModal(true)
          }
        }}
        style={{
          position: 'absolute',
          left: card.position.x,
          top: card.position.y,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: '8px',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: containerColor,
          cursor: 'grab',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          userSelect: 'none',
          // 添加位置过渡动画（拖拽时不应用）
          transition: isDragging ? 'none' : 'left 0.3s ease-out, top 0.3s ease-out',
          boxShadow: isDragging
            ? '0 8px 24px rgba(0, 0, 0, 0.15)'
            : '0 2px 8px rgba(0, 0, 0, 0.08)',
          zIndex: isDragging ? 1000 : 1
        }}
      >
        {/* 标题行 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 状态点 */}
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: currentStatus.color,
            flexShrink: 0
          }} />

          {/* 标题 */}
          <h3 style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 600,
            color: '#1f2937',
            lineHeight: 1.3,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {workflow?.name ?? '工作流'}
          </h3>

          {/* 状态标签 */}
          <span style={{
            fontSize: '10px',
            color: currentStatus.color,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            {currentStatus.label}
          </span>
        </div>

        {/* 描述 */}
        <p style={{
          margin: 0,
          fontSize: '12px',
          color: '#6b7280',
          lineHeight: 1.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          flex: 1
        }}>
          {workflow?.summary ?? '拖拽自定义的工作流卡片'}
        </p>

        {/* 底部标签和操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
            {(workflow?.tags ?? ['workflow']).slice(0, 2).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '10px',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(139, 92, 246, 0.12)',
                  color: '#7c3aed',
                  fontWeight: 500
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 渐进式执行按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (workflow) {
                const executionPayload = buildExecutionWorkflowPayload(workflow)
                setSelectedWorkflowForExecution(executionPayload)
                setLeftPanelWidth(65) // 立即设置为65%，右侧面板35%
                setShowStepByStepExecution(true)
              }
            }}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#8b5cf6',
              color: 'white',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#7c3aed'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#8b5cf6'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            执行 ▶
          </button>
        </div>
      </div>
    )
  }

  const renderAIToolCard = (card: AIToolCanvasItem) => {
    const tool = aiToolsData.find((item) => item.id === card.toolId)
    const isDragging = draggingItemId === card.id
    const isInRoot = card.parentId === ROOT_CONTAINER_ID
    const containerColor = isInRoot ? 'rgba(0, 0, 0, 0.15)' : getRootContainerColor(canvasItems, card.parentId)
    return (
      <div
        className="ai-tool-card no-pan"
        key={card.id}
        onMouseDown={(event) => handleItemMouseDown(event, card.id)}
        onDoubleClick={(e) => {
          e.stopPropagation()
          if (tool) {
            setSelectedExecutionItem(tool)
            setShowExecutionModal(true)
          }
        }}
        style={{
          position: 'absolute',
          left: card.position.x,
          top: card.position.y,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: '8px',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: containerColor,
          cursor: 'grab',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          userSelect: 'none',
          // 添加位置过渡动画（拖拽时不应用）
          transition: isDragging ? 'none' : 'left 0.3s ease-out, top 0.3s ease-out',
          boxShadow: isDragging
            ? '0 8px 24px rgba(0, 0, 0, 0.15)'
            : '0 2px 8px rgba(0, 0, 0, 0.08)',
          zIndex: isDragging ? 1000 : 1
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '6px',
              backgroundColor: 'rgba(124, 58, 237, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700,
              color: '#7c3aed'
            }}
          >
            AI
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '13px',
              fontWeight: 600,
              color: '#1f2937',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {tool?.name ?? 'AI 工具'}
          </h3>
          <span
            style={{
              fontSize: '10px',
              color: '#7c3aed',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {tool?.provider ?? '自定义'}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: '#6b7280',
            lineHeight: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            flex: 1
          }}
        >
          {tool?.summary ?? '拖拽的 AI 工具卡片'}
        </p>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(tool?.tags ?? ['ai']).slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '10px',
                padding: '3px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(124, 58, 237, 0.12)',
                color: '#7c3aed',
                fontWeight: 500
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const renderChildren = (containerId: string) => {
    const container = getContainer(canvasItems, containerId)
    if (!container) {
      return null
    }

    return (container.childrenIds || []).map((childId) => {
      const item = canvasItems[childId]
      if (!item) {
        return null
      }
      if (item.type === 'workflow') {
        return renderWorkflowCard(item)
      }
      if (item.type === 'ai-tool') {
        return renderAIToolCard(item)
      }
      return renderContainer(item)
    })
  }

  const renderContainer = (container: ContainerCanvasItem) => {
    const isDragging = draggingItemId === container.id
    const outerWidth = container.size.width + CONTAINER_PADDING * 2
    const outerHeight = container.collapsed
      ? CONTAINER_HEADER_HEIGHT
      : container.size.height + CONTAINER_HEADER_HEIGHT + CONTAINER_PADDING * 2

    return (
      <div
        className="workflow-container no-pan"
        key={container.id}
        style={{
          position: 'absolute',
          left: container.position.x,
          top: container.position.y,
          width: outerWidth,
          height: outerHeight,
          userSelect: 'none',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          overflow: container.collapsed ? 'hidden' : 'visible',
          // 添加位置过渡动画（拖拽时不应用）
          transition: isDragging ? 'none' : 'left 0.3s ease-out, top 0.3s ease-out',
          boxShadow: isDragging
            ? '0 10px 30px rgba(0, 0, 0, 0.2)'
            : '0 2px 8px rgba(0, 0, 0, 0.08)',
          zIndex: isDragging ? 1000 : 1
        }}
      >
        {/* 容器标题栏 */}
        <div
          onMouseDown={(event) => handleItemMouseDown(event, container.id)}
          style={{
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            cursor: 'grab',
            backgroundColor: container.color,
            borderBottom: container.collapsed ? 'none' : '1px dashed rgba(107, 114, 128, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleToggleContainer(container.id)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#6b7280',
                padding: 0
              }}
              title={container.collapsed ? '展开容器' : '折叠容器'}
            >
              {container.collapsed ? '▸' : '▾'}
            </button>
            {editingContainerId === container.id ? (
              <input
                className="no-pan"
                value={editingName}
                autoFocus
                onChange={(event) => setEditingName(event.target.value)}
                onBlur={commitRename}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    commitRename()
                  }
                  if (event.key === 'Escape') {
                    setEditingContainerId(null)
                  }
                  event.stopPropagation()
                }}
                onMouseDown={(event) => {
                  event.stopPropagation()
                }}
                onClick={(event) => {
                  event.stopPropagation()
                }}
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              />
            ) : (
              <span
                onDoubleClick={() => handleStartRename(container.id, container.name)}
                style={{ fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'text' }}
                title="双击重命名容器"
              >
                {container.name}
              </span>
            )}
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>({container.childrenIds.length})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* 取出容器按钮 */}
            {container.parentId && container.parentId !== ROOT_CONTAINER_ID && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  handleExtractContainer(container.id)
                }}
                onMouseDown={(event) => {
                  event.stopPropagation()
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: '#6b7280',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  transition: 'color 0.2s'
                }}
                title="取出到画布根层"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#3b82f6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b7280'
                }}
              >
                独立
              </button>
            )}

            {/* 删除容器按钮 */}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                if (confirm(`确定要删除容器"${container.name}"吗？\n容器内的所有内容也会被删除。`)) {
                  handleDeleteContainer(container.id)
                }
              }}
              onMouseDown={(event) => {
                event.stopPropagation()
              }}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#6b7280',
                padding: '2px 4px',
                borderRadius: '4px',
                transition: 'color 0.2s',
                lineHeight: 1
              }}
              title="删除容器"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        {!container.collapsed && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: container.size.height + CONTAINER_PADDING * 2,
              padding: `${CONTAINER_PADDING}px`,
              overflow: 'visible'
            }}
          >
            {renderChildren(container.id)}
            {container.childrenIds.length === 0 && (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '12px'
                }}
              >
                拖拽工作流或子容器到这里
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <style>{`
        .workflow-library-list::-webkit-scrollbar {
          width: 6px;
        }
        .workflow-library-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .workflow-library-list::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .workflow-library-list::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          height: 'calc(100vh - 64px)',
          width: '100%',
          backgroundColor: '#f5f3ff',
          overflow: 'hidden',
          gap: 0,
          position: 'relative'
        }}
      >
      <aside
        className="workflow-library"
        style={{
          width: sidebarCollapsed ? '0px' : '320px',
          transition: 'width 0.3s ease-in-out',
          backgroundColor: '#ffffff',
          borderRight: sidebarCollapsed ? 'none' : '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: '100%',
          flexShrink: 0,
          touchAction: 'auto'
        }}
        onMouseLeave={(e) => {
          // 鼠标离开侧边栏区域时，自动收起
          if (!sidebarCollapsed) {
            setSidebarCollapsed(true)
            setIsHoveringEdge(false)
          }
        }}
        onWheel={(event) => {
          event.stopPropagation()
          // 如果不是在可滚动列表内，则阻止默认行为
          const target = event.target as HTMLElement
          if (!target.closest('.workflow-library-list')) {
            event.preventDefault()
          }
        }}
        onTouchStart={(event) => {
          event.stopPropagation()
        }}
        onTouchMove={(event) => {
          event.stopPropagation()
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
            padding: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}
          onWheel={(e) => {
            // 冻结工作流库标题区域，阻止滚动事件冒泡
            e.stopPropagation()
            e.preventDefault()
          }}
        >
          {!sidebarCollapsed && (
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>工作流库</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>拖拽到画布以引用已有工作流</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              style={{
                border: '1px solid #c4b5fd',
                backgroundColor: '#f5f3ff',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7c3aed'
              }}
              title={sidebarCollapsed ? '展开工作流库' : '折叠工作流库'}
            >
              {sidebarCollapsed ? '◀' : '▶'}
            </button>
          </div>
        </div>

        {!sidebarCollapsed && (
          <div
            style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}
            onWheel={(e) => {
              // 冻结搜索框区域，阻止滚动事件冒泡
              e.stopPropagation()
              e.preventDefault()
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={librarySearch}
                placeholder="搜索工作流、标签或描述"
                onChange={(event) => setLibrarySearch(event.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontSize: '13px',
                  backgroundColor: '#fafafa'
                }}
              />
              <button
                type="button"
                onClick={() => setExecutionHistoryExpanded(!executionHistoryExpanded)}
                style={{
                  border: '1px solid #8b5cf6',
                  backgroundColor: executionHistoryExpanded ? '#ede9fe' : '#f5f3ff',
                  borderRadius: '10px',
                  width: '42px',
                  height: '42px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8b5cf6',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ede9fe'
                  e.currentTarget.style.borderColor = '#7c3aed'
                  e.currentTarget.style.color = '#7c3aed'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = executionHistoryExpanded ? '#ede9fe' : '#f5f3ff'
                  e.currentTarget.style.borderColor = '#8b5cf6'
                  e.currentTarget.style.color = '#8b5cf6'
                }}
                title={executionHistoryExpanded ? '收起执行历史' : '展开执行历史'}
              >
                <Clock size={20} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* 执行历史列表 */}
        {!sidebarCollapsed && executionHistoryExpanded && (
          <div
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#fafafa'
            }}
          >
            {/* 列表头部 */}
            <div style={{
              padding: '8px 16px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                执行记录
              </span>
              <button
                onClick={() => loadExecutionHistory()}
                style={{
                  fontSize: '11px',
                  color: '#8b5cf6',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                title="刷新执行历史"
              >
                刷新
              </button>
            </div>

            {loadingHistory ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                加载中...
              </div>
            ) : executionHistory.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                暂无执行记录
              </div>
            ) : (
              <div>
                {executionHistory.map((execution) => (
                  <div
                    key={execution.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <div
                      onClick={() => setExpandedExecutionId(
                        expandedExecutionId === execution.id ? null : execution.id
                      )}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#111827',
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {execution.workflowTitle}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center'
                        }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: execution.status === 'completed' ? '#d1fae5' :
                                           execution.status === 'failed' ? '#fee2e2' : '#e0e7ff',
                            color: execution.status === 'completed' ? '#065f46' :
                                   execution.status === 'failed' ? '#991b1b' : '#3730a3',
                            fontSize: '10px',
                            fontWeight: 600
                          }}>
                            {execution.status === 'completed' ? '完成' :
                             execution.status === 'failed' ? '失败' :
                             execution.status === 'running' ? '运行中' : '等待'}
                          </span>
                          <span>{formatDate(execution.startedAt)}</span>
                          <span>{formatDuration(execution.duration)}</span>
                        </div>
                      </div>
                      {expandedExecutionId === execution.id ? (
                        <ChevronUp size={16} color="#6b7280" />
                      ) : (
                        <ChevronDown size={16} color="#6b7280" />
                      )}
                    </div>

                    {/* 展开的详情 */}
                    {expandedExecutionId === execution.id && (
                      <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #f3f4f6',
                        fontSize: '12px'
                      }}>
                        {/* 输入 */}
                        {execution.input && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#6b7280',
                              marginBottom: '4px'
                            }}>
                              输入参数
                            </div>
                            <div style={{
                              padding: '8px',
                              backgroundColor: '#f9fafb',
                              borderRadius: '6px',
                              fontSize: '11px',
                              color: '#374151',
                              maxHeight: '100px',
                              overflowY: 'auto',
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word'
                            }}>
                              {JSON.stringify(execution.input, null, 2)}
                            </div>
                          </div>
                        )}

                        {/* 输出 */}
                        {execution.output && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#6b7280',
                              marginBottom: '4px'
                            }}>
                              输出结果
                            </div>
                            <div style={{
                              padding: '8px',
                              backgroundColor: '#f9fafb',
                              borderRadius: '6px',
                              fontSize: '11px',
                              color: '#374151',
                              maxHeight: '100px',
                              overflowY: 'auto',
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word'
                            }}>
                              {JSON.stringify(execution.output, null, 2)}
                            </div>
                          </div>
                        )}

                        {/* 错误信息 */}
                        {execution.error && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#dc2626',
                              marginBottom: '4px'
                            }}>
                              错误信息
                            </div>
                            <div style={{
                              padding: '8px',
                              backgroundColor: '#fef2f2',
                              borderRadius: '6px',
                              fontSize: '11px',
                              color: '#991b1b',
                              maxHeight: '100px',
                              overflowY: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word'
                            }}>
                              {execution.error}
                            </div>
                          </div>
                        )}

                        {/* 备注 */}
                        {execution.notes && (
                          <div>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#6b7280',
                              marginBottom: '4px'
                            }}>
                              备注
                            </div>
                            <div style={{
                              padding: '8px',
                              backgroundColor: '#fffbeb',
                              borderRadius: '6px',
                              fontSize: '11px',
                              color: '#78350f',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word'
                            }}>
                              {execution.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!sidebarCollapsed && (
          <div
            className="workflow-library-list"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '0 16px 24px',
              minHeight: 0
            }}
            onWheel={(e) => {
              // 允许列表区域滚动，阻止事件冒泡到外层
              e.stopPropagation()
            }}
          >
            {/* 我的工作布局区域 */}
            <div style={{ marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => {
                  setLayoutSectionExpanded(!layoutSectionExpanded)
                  setActiveHeaderSection('layout')
                }}
                style={{
                  width: '100%',
                  border: activeHeaderSection === 'layout' ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                  backgroundColor: activeHeaderSection === 'layout' ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: '#4b5563',
                  padding: activeHeaderSection === 'layout' ? '8px 10px' : '6px 4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (activeHeaderSection === 'layout') {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.12)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeHeaderSection === 'layout') {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)'
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>我的工作布局</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>画布中的容器和工作流</div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {layoutSectionExpanded ? '收起' : '展开'}
                </span>
              </button>

              {layoutSectionExpanded && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {(() => {
                    const renderContainerTree = (containerId: string, level: number = 0): React.ReactElement[] => {
                      const container = getContainer(canvasItems, containerId)
                      if (!container) return []

                      const elements: React.ReactElement[] = []

                      // 只显示非根容器
                      if (containerId !== ROOT_CONTAINER_ID) {
                        elements.push(
                          <div
                            key={containerId}
                            style={{
                              marginLeft: `${level * 12 + 12}px`,
                              padding: '6px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#f9fafb',
                              border: '1px solid #e5e7eb',
                              fontSize: '13px',
                              color: '#374151',
                              fontWeight: 600
                            }}
                          >
                            {container.name} ({container.childrenIds.length})
                          </div>
                        )
                      }

                      // 渲染子项
                      for (const childId of container.childrenIds) {
                        const child = canvasItems[childId]
                        if (!child) continue

                        if (child.type === 'container') {
                          // 递归渲染子容器
                          elements.push(...renderContainerTree(childId, containerId === ROOT_CONTAINER_ID ? level : level + 1))
                        } else if (child.type === 'workflow') {
                          // 渲染工作流
                          const workflow = libraryData.find((item) => item.id === child.workflowId)
                          elements.push(
                            <div
                              key={childId}
                              style={{
                                marginLeft: `${(containerId === ROOT_CONTAINER_ID ? level : level + 1) * 12 + 20}px`,
                                padding: '4px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                fontSize: '12px',
                                color: '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {workflow?.name ?? '工作流'}
                              </span>
                            </div>
                          )
                        }
                      }

                      return elements
                    }

                    const treeElements = renderContainerTree(ROOT_CONTAINER_ID)
                    return treeElements.length > 0 ? (
                      treeElements
                    ) : (
                      <div
                        style={{
                          borderRadius: '12px',
                          border: '1px dashed #d1d5db',
                          padding: '14px',
                          textAlign: 'center',
                          fontSize: '12px',
                          color: '#9ca3af'
                        }}
                      >
                        暂无布局内容，请从下方拖拽工作流到画布
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* 工作流库区域 */}
            {(Object.keys(SECTION_META) as LibrarySection[]).map((sectionKey) => {
              const workflows = sectionedLibrary[sectionKey] || []
              const meta = SECTION_META[sectionKey]

              return (
                <div key={sectionKey} style={{ marginTop: '18px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      toggleSection(sectionKey)
                      setActiveHeaderSection(sectionKey)
                    }}
                    style={{
                      width: '100%',
                      border: activeHeaderSection === sectionKey ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                      backgroundColor: activeHeaderSection === sectionKey ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      color: '#4b5563',
                      padding: activeHeaderSection === sectionKey ? '8px 10px' : '6px 4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (activeHeaderSection === sectionKey) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.12)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeHeaderSection === sectionKey) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)'
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>{meta.label}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{meta.description}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {activeSections[sectionKey] ? '收起' : '展开'}
                    </span>
                  </button>

                  {activeSections[sectionKey] && (
                    <div style={{ marginTop: '8px', marginLeft: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {workflows.length === 0 && (
                        <div
                          style={{
                            borderRadius: '6px',
                            border: '1px dashed #d1d5db',
                            padding: '12px',
                            textAlign: 'center',
                            fontSize: '12px',
                            color: '#9ca3af'
                          }}
                        >
                          暂无数据
                        </div>
                      )}
                      {workflows.map((workflow) => (
                        <div
                          key={workflow.id}
                          draggable
                          onDragStart={() => handleLibraryDragStart(workflow.id)}
                          onDragEnd={handleLibraryDragEnd}
                          style={{
                            borderRadius: '6px',
                            border: libraryDraggingId === workflow.id ? '1px solid #8b5cf6' : '1px solid rgba(0, 0, 0, 0.06)',
                            backgroundColor: libraryDraggingId === workflow.id ? 'rgba(139, 92, 246, 0.05)' : '#ffffff',
                            padding: '8px 10px',
                            cursor: 'grab',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                          onMouseEnter={(e) => {
                            if (libraryDraggingId !== workflow.id) {
                              e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.02)'
                              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (libraryDraggingId !== workflow.id) {
                              e.currentTarget.style.backgroundColor = '#ffffff'
                              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)'
                            }
                          }}
                        >
                          {/* 左侧状态点 */}
                          <div style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: workflow.status === 'active' ? '#10b981' : workflow.status === 'draft' ? '#f59e0b' : '#9ca3af',
                            flexShrink: 0
                          }} />

                          {/* 标题 */}
                          <span style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#1f2937',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {workflow.name}
                          </span>

                          {/* 日期 */}
                          <span style={{
                            fontSize: '11px',
                            color: '#9ca3af',
                            flexShrink: 0
                          }}>
                            {workflow.updatedAt}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* AI工具区域 */}
            <div style={{ marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => {
                  setAIToolsSectionExpanded(!aiToolsSectionExpanded)
                  setActiveHeaderSection('ai-tools')
                }}
                style={{
                  width: '100%',
                  border: activeHeaderSection === 'ai-tools' ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                  backgroundColor: activeHeaderSection === 'ai-tools' ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: '#4b5563',
                  padding: activeHeaderSection === 'ai-tools' ? '8px 10px' : '6px 4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (activeHeaderSection === 'ai-tools') {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.12)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeHeaderSection === 'ai-tools') {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)'
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>AI工具</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>可用的AI模型和工具</div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {aiToolsSectionExpanded ? '收起' : '展开'}
                </span>
              </button>

              {aiToolsSectionExpanded && (
                <div style={{ marginTop: '8px', marginLeft: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(aiToolsData || []).map((tool) => (
                    <div
                      key={tool.id}
                      draggable
                      onDragStart={() => handleLibraryDragStart(tool.id)}
                      onDragEnd={handleLibraryDragEnd}
                      style={{
                        borderRadius: '6px',
                        border: libraryDraggingId === tool.id ? '1px solid #8b5cf6' : '1px solid rgba(0, 0, 0, 0.06)',
                        backgroundColor: libraryDraggingId === tool.id ? 'rgba(139, 92, 246, 0.05)' : '#ffffff',
                        padding: '8px 10px',
                        cursor: 'grab',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                      onMouseEnter={(e) => {
                        if (libraryDraggingId !== tool.id) {
                          e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.02)'
                          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (libraryDraggingId !== tool.id) {
                          e.currentTarget.style.backgroundColor = '#ffffff'
                          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)'
                        }
                      }}
                    >
                      {/* 左侧AI图标 */}
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#8b5cf6',
                        flexShrink: 0
                      }}>
                        AI
                      </div>

                      {/* 标题 */}
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#1f2937',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {tool.name}
                      </span>

                      {/* Provider */}
                      <span style={{
                        fontSize: '10px',
                        color: '#9ca3af',
                        flexShrink: 0
                      }}>
                        {tool.provider}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          position: 'relative'
        }}
        onWheel={(e) => {
          // 阻止 main 区域的滚动冒泡
          const target = e.target as HTMLElement
          // 如果不是在画布容器内，则阻止默认行为
          if (
            !target.closest('.workflow-canvas-container') &&
            !target.closest('[style*="overflowY"]') &&
            !target.closest('[data-scroll-container="true"]')
          ) {
            e.preventDefault()
          }
        }}
      >
        {/* 左侧边缘展开触发区域 - 仅在侧边栏隐藏时显示 */}
        {sidebarCollapsed && (
          <div
            onClick={() => setSidebarCollapsed(false)}
            style={{
              position: 'fixed',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '24px',
              height: '80px',
              backgroundColor: 'rgba(139, 92, 246, 0.08)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              borderTopRightRadius: '12px',
              borderBottomRightRadius: '12px',
              transition: 'all 0.3s ease-in-out',
              backdropFilter: 'blur(8px)'
            }}
            title="展开工作流库"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.15)'
              e.currentTarget.style.width = '28px'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.08)'
              e.currentTarget.style.width = '24px'
            }}
          >
            <div style={{
              fontSize: '12px',
              color: '#8b5cf6',
              fontWeight: '600',
              opacity: 0.6,
              transition: 'opacity 0.2s'
            }}>
              ››
            </div>
          </div>
        )}

        <div
          style={{
            padding: '18px 16px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
          onWheel={(e) => {
            // 冻结工作流画布管理标题区域，阻止滚动事件冒泡
            e.stopPropagation()
            e.preventDefault()
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>工作流画布管理</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
              拖拽工作流卡片，在画布中按业务团队或模块进行可视化分组。
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* 缩放控制区域 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                padding: '6px 12px'
              }}
              onWheel={(e) => {
                // 冻结缩放控制区域，阻止滚动事件冒泡
                e.stopPropagation()
                e.preventDefault()
              }}
            >
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#4b5563',
                  minWidth: '45px'
                }}
              >
                {Math.round(currentScale * 100)}%
              </span>
              <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb' }} />
              <button
                type="button"
                onClick={zoomOut}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#4338ca',
                  transition: 'background-color 0.2s',
                  lineHeight: 1
                }}
                title="缩小 (Ctrl + 滚轮向下)"
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = '#f5f3ff'
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                −
              </button>
              <button
                type="button"
                onClick={zoomIn}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#4338ca',
                  transition: 'background-color 0.2s',
                  lineHeight: 1
                }}
                title="放大 (Ctrl + 滚轮向上)"
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = '#f5f3ff'
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                +
              </button>
              <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb' }} />
              <button
                type="button"
                onClick={zoomToFit}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#4338ca',
                  transition: 'background-color 0.2s'
                }}
                title="适配所有内容"
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = '#f5f3ff'
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                适应
              </button>
              <button
                type="button"
                onClick={resetView}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#4338ca',
                  transition: 'background-color 0.2s'
                }}
                title="重置视图"
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = '#f5f3ff'
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                重置
              </button>
            </div>

            <button
              type="button"
              onClick={handleCreateContainer}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #c4b5fd',
                backgroundColor: '#f5f3ff',
                color: '#5b21b6',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              新建容器
            </button>
          </div>
        </div>

        <div
          className="workflow-canvas-container"
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #ede9fe 0%, #fdf4ff 100%)',
            touchAction: 'none',
            transform: 'translateZ(0)',
            minHeight: 0,
            minWidth: 0
          }}
          onWheel={(e) => {
            // 阻止画布区域的滚动事件冒泡到页面，防止影响左侧工作流库
            e.stopPropagation()
            e.preventDefault()
          }}
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          onTouchStart={handleCanvasTouch}
          onTouchMove={handleCanvasTouch}
          onWheelCapture={handleWheel}
          onPointerEnter={() => {
            pointerInsideCanvasRef.current = true
          }}
          onPointerLeave={() => {
            pointerInsideCanvasRef.current = false
          }}
          onPointerCancel={() => {
            pointerInsideCanvasRef.current = false
          }}
          ref={canvasContainerRef}
        >
          <TransformWrapper
            initialScale={1}
            initialPositionX={INITIAL_POSITION_X}
            initialPositionY={INITIAL_POSITION_Y}
            minScale={0.3}
            maxScale={3}
            limitToBounds={false}
            centerOnInit={false}
            doubleClick={{ disabled: true }}
            wheel={{ disabled: true }}
            pinch={{
              disabled: false,
              step: 8
            }}
            panning={{
              disabled: false,
              velocityDisabled: false,
              allowLeftClickPan: true,
              allowMiddleClickPan: true,
              allowRightClickPan: false,
              activationKeys: ['Space'],
              wheelPanning: true,
              excluded: ['.no-pan']
            }}
            smooth={true}
            alignmentAnimation={{
              disabled: false,
              sizeX: 100,
              sizeY: 100,
              velocityAlignmentTime: 400
            }}
            velocityAnimation={{
              disabled: false,
              sensitivity: 1,
              animationTime: 400,
              animationType: 'easeOut'
            }}
            onInit={handleInit}
            onTransformed={handleTransformed}
            onPanningStart={handlePanningStart}
            onPanning={handlePanning}
            onPanningStop={handlePanningStop}
            onPinching={handlePinching}
            onPinchingStop={handlePinchingStop}
            onZoomStop={handleZoomStop}
            onWheelStop={handleWheelStop}
          >
            <TransformComponent
              wrapperClass="workflow-transform-wrapper"
              contentClass="workflow-transform-content"
            >
              <div
                className="workflow-canvas-area"
                style={{
                  position: 'relative',
                  width: rootContainer.size.width + CONTAINER_PADDING * 4,
                  height: rootContainer.size.height + CONTAINER_PADDING * 4 + CONTAINER_HEADER_HEIGHT,
                  cursor: isPanning ? 'grabbing' : spacePressed ? 'grab' : 'default',
                  transform: 'translateZ(0)',
                  willChange: 'transform'
                }}
              >
                <div
                  className="canvas-content"
                  style={{
                    position: 'relative',
                    width: rootContainer.size.width + CONTAINER_PADDING * 2,
                    height: rootContainer.size.height + CONTAINER_PADDING * 2,
                    padding: `${CONTAINER_PADDING}px`,
                    borderRadius: '16px',
                    backgroundImage:
                      'linear-gradient(0deg, rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    boxShadow: '0 18px 56px rgba(79, 70, 229, 0.12)',
                    overflow: 'visible',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                    boxSizing: 'border-box'
                  }}
                  onClick={(e) => {
                    // 只在点击画布空白处时收缩执行面板
                    // 检查是否点击的是画布本身，而不是其中的子元素
                    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-content')) {
                      if (showStepByStepExecution) {
                        setShowStepByStepExecution(false)
                      }
                    }
                  }}
                >
                  {renderChildren(ROOT_CONTAINER_ID)}
                </div>
              </div>
            </TransformComponent>
          </TransformWrapper>
        </div>
      </main>

      {/* 工作流执行弹窗 */}
      {showExecutionModal && selectedExecutionItem && (
        <WorkflowExecutionModal
          item={selectedExecutionItem}
          onClose={() => {
            setShowExecutionModal(false)
            setSelectedExecutionItem(null)
          }}
        />
      )}

      {/* 右侧执行面板触发器 - 继续 */}
      {selectedWorkflowForExecution && !showStepByStepExecution && (
        <div
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            width: '40px',
            height: '100%',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            zIndex: 999,
            pointerEvents: 'auto'
          }}
          onMouseEnter={() => setShowStepByStepExecution(true)}
        >
          {/* "继续"文字指示器 */}
          <div
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8b5cf6',
              fontSize: '14px',
              fontWeight: 600,
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              letterSpacing: '2px',
              textShadow: '0 0 8px rgba(139, 92, 246, 0.4)',
              animation: 'purpleDotPulse 2s ease-in-out infinite',
              pointerEvents: 'none'
            }}
          >
            继续
          </div>
        </div>
      )}

      <style>{`
        @keyframes purpleDotPulse {
          0%, 100% {
            transform: translateY(-50%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(-50%) scale(1.2);
            opacity: 0.8;
          }
        }
      `}</style>

      {/* 渐进式执行分屏面板 */}
      {selectedWorkflowForExecution && (
        <>
          <div
            style={{
              position: 'fixed',
              left: `${leftPanelWidth}%`,
              top: 0,
              height: '100%',
              opacity: showStepByStepExecution ? 1 : 0,
              pointerEvents: showStepByStepExecution ? 'auto' : 'none',
              transition: 'opacity 0.3s ease-in-out',
              zIndex: 1001
            }}
          >
            <ResizableSplitter onResize={setLeftPanelWidth} />
          </div>
          <div
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              width: `${100 - leftPanelWidth}%`,
              height: '100%',
              flexShrink: 0,
              transform: showStepByStepExecution ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: 'white',
              zIndex: 1000,
              boxShadow: showStepByStepExecution ? '-4px 0 12px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            <ExecutionSplitPanel
              workflow={selectedWorkflowForExecution}
              onClose={() => {
                setShowStepByStepExecution(false)
                setSelectedWorkflowForExecution(null)
              }}
              onWorkflowUpdate={handleExecutionWorkflowUpdate}
            />
          </div>
        </>
      )}

      {/* 执行历史模态框 */}
      <ExecutionHistoryModal
        isOpen={showExecutionHistoryModal}
        onClose={() => setShowExecutionHistoryModal(false)}
      />
    </div>
    </>
  )
}
