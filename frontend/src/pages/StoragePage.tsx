import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TouchEvent as ReactTouchEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { Clock, ChevronDown, ChevronUp, LayoutGrid, Play, X, Plus, FileText, Send, Pin, PinOff } from 'lucide-react'
import WorkflowExecutionTab from '../components/workspace/WorkflowExecutionTab'
import '../styles/workspace-tabs.css'
import {
  getFavoriteWorkflows,
  getUserWorkflows,
  updateWorkflow,
  cloneWorkflow,
  createWorkflow,
  getExecutionHistory,
  type Workflow,
  type ExecutionHistory
} from '../services/workflowApi'
import {
  fetchWorkspaceLayout,
  saveWorkspaceLayout
} from '../services/workspaceApi'
import ExecutionSplitPanel, { type ExecutionWorkflow, type WorkflowNode } from '../components/ExecutionSplitPanel'
import ExecutionHistoryModal from '../components/ExecutionHistoryModal'
import ResizableSplitter from '../components/ResizableSplitter'
import { adjustOverlappingItemsAfterResize } from '../utils/storageAvoidanceUtils'
import { NavigationSidebar } from '../components/NavigationSidebar'
import WorkflowCreatePage from './WorkflowCreatePage'

type WorkflowStatus = 'active' | 'draft' | 'paused'
type LibrarySection = 'created' | 'favorites' | 'recent'

// Tab 系统类型
interface WorkspaceTab {
  id: string
  type: 'canvas' | 'workflow' | 'create'
  title: string
  workflowId?: string
}

const CANVAS_TAB_ID = 'canvas-main'

type Position = {
  x: number
  y: number
}

const CARD_WIDTH = 264
const CARD_HEIGHT = 133
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


type LibraryWorkflow = WorkflowDefinition & {
  section: LibrarySection
  isOwner?: boolean  // 是否是当前用户创建的
  canEdit?: boolean  // 是否可以编辑
}

type LibraryItem = LibraryWorkflow

interface WorkflowCanvasItem {
  id: string
  type: 'workflow'
  workflowId: string
  parentId: string
  position: Position
}

interface ToolLinkCanvasItem {
  id: string
  type: 'tool-link'
  name: string
  url: string
  logo?: string
  badge?: string
  description?: string
  category?: string
  parentId: string
  position: Position
}

interface ArticleCanvasItem {
  id: string
  type: 'article'
  url: string
  title: string
  note?: string
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

type CanvasItem = WorkflowCanvasItem | ToolLinkCanvasItem | ArticleCanvasItem | ContainerCanvasItem
type CanvasItemsMap = Record<string, CanvasItem>

// === 连接线 (Edge) 类型 ===
type HandleDirection = 'top' | 'bottom' | 'left' | 'right'

interface CanvasEdge {
  id: string
  sourceItemId: string
  sourceHandle: HandleDirection
  targetItemId: string
  targetHandle: HandleDirection
  label?: string
  labelOffset?: Position
}

type CanvasEdgesMap = Record<string, CanvasEdge>

type ConnectionState =
  | { mode: 'idle' }
  | { mode: 'connecting'; sourceItemId: string; sourceHandle: HandleDirection; mousePosition: Position }

const HANDLE_RADIUS = 5
const HANDLE_HIT_RADIUS = 12

// AI工作方法库数据现在完全从API获取，不再使用硬编码数据
const initialLibraryData: LibraryWorkflow[] = []


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

type ResizeState = {
  containerId: string
  pointerStart: Position
  sizeStart: { width: number; height: number }
} | null

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
  if (item.type === 'workflow') {
    return { width: CARD_WIDTH, height: CARD_HEIGHT }
  }
  if (item.type === 'tool-link') {
    return { width: 70, height: 70 }  // 工具卡片是正方形
  }
  if (item.type === 'article') {
    return { width: 220, height: 60 }  // 文章卡片
  }
  // 必然是 container 类型
  const containerItem = item as ContainerCanvasItem
  const baseHeight = containerItem.collapsed
    ? CONTAINER_HEADER_HEIGHT
    : containerItem.size.height + CONTAINER_HEADER_HEIGHT + CONTAINER_PADDING * 2
  return {
    width: containerItem.size.width + CONTAINER_PADDING * 2,
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

// === 连接线工具函数 ===
function getHandleAbsolutePosition(
  items: CanvasItemsMap,
  itemId: string,
  direction: HandleDirection
): Position {
  const item = items[itemId]
  if (!item) return { x: 0, y: 0 }
  const topLeft = getItemAbsoluteTopLeft(items, itemId)
  const size = getItemOuterSize(item)
  switch (direction) {
    case 'top':    return { x: topLeft.x + size.width / 2, y: topLeft.y }
    case 'bottom': return { x: topLeft.x + size.width / 2, y: topLeft.y + size.height }
    case 'left':   return { x: topLeft.x, y: topLeft.y + size.height / 2 }
    case 'right':  return { x: topLeft.x + size.width, y: topLeft.y + size.height / 2 }
  }
}

function applyDirectionOffset(point: Position, dir: HandleDirection, offset: number): Position {
  switch (dir) {
    case 'top':    return { x: point.x, y: point.y - offset }
    case 'bottom': return { x: point.x, y: point.y + offset }
    case 'left':   return { x: point.x - offset, y: point.y }
    case 'right':  return { x: point.x + offset, y: point.y }
  }
}

function computeBezierPath(
  start: Position,
  end: Position,
  sourceDir: HandleDirection,
  targetDir: HandleDirection
): string {
  const dx = Math.abs(end.x - start.x)
  const dy = Math.abs(end.y - start.y)
  const offset = Math.max(50, Math.min(150, Math.max(dx, dy) * 0.4))
  const cp1 = applyDirectionOffset(start, sourceDir, offset)
  const cp2 = applyDirectionOffset(end, targetDir, offset)
  return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`
}

function bezierMidpoint(
  start: Position, end: Position, sourceDir: HandleDirection, targetDir: HandleDirection
): Position {
  const dx = Math.abs(end.x - start.x)
  const dy = Math.abs(end.y - start.y)
  const offset = Math.max(50, Math.min(150, Math.max(dx, dy) * 0.4))
  const cp1 = applyDirectionOffset(start, sourceDir, offset)
  const cp2 = applyDirectionOffset(end, targetDir, offset)
  const t = 0.5
  const u = 1 - t
  return {
    x: u * u * u * start.x + 3 * u * u * t * cp1.x + 3 * u * t * t * cp2.x + t * t * t * end.x,
    y: u * u * u * start.y + 3 * u * u * t * cp1.y + 3 * u * t * t * cp2.y + t * t * t * end.y
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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [librarySearch, setLibrarySearch] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // 默认隐藏
  const [sidebarPinned, setSidebarPinned] = useState(false) // 侧边栏是否固定
  const [isHoveringEdge, setIsHoveringEdge] = useState(false) // 鼠标是否在左侧边缘热区

  // 渐进式执行模态框（改为分屏模式）
  const [showStepByStepExecution, setShowStepByStepExecution] = useState(false)
  const [selectedWorkflowForExecution, setSelectedWorkflowForExecution] = useState<ExecutionWorkflow | null>(null)
  const [leftPanelWidth, setLeftPanelWidth] = useState(65) // 左侧面板宽度百分比，右侧执行面板为 100-65=35%

  // 执行历史模态框
  const [showExecutionHistoryModal, setShowExecutionHistoryModal] = useState(false)

  // 工具添加模态框
  const [showToolModal, setShowToolModal] = useState(false)
  const [toolFormData, setToolFormData] = useState({
    url: '',
    name: '',
    description: ''
  })

  // 文章添加模态框
  const [showArticleModal, setShowArticleModal] = useState(false)
  const [articleFormData, setArticleFormData] = useState({ url: '', title: '', note: '' })
  const [articleUrlError, setArticleUrlError] = useState(false)

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    itemId: string | null
  }>({ visible: false, x: 0, y: 0, itemId: null })

  // 保存工作流确认对话框状态
  const [saveConfirmDialog, setSaveConfirmDialog] = useState<{
    visible: boolean
    workflow: ExecutionWorkflow | null
    isOwned: boolean
  }>({ visible: false, workflow: null, isOwned: false })

  // 删除确认对话框
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    visible: boolean
    cardId: string | null
  }>({ visible: false, cardId: null })

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
  const [activeHeaderSection, setActiveHeaderSection] = useState<LibrarySection>('created')
  const [libraryDraggingId, setLibraryDraggingId] = useState<string | null>(null)
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [favoriteWorkflows, setFavoriteWorkflows] = useState<Workflow[]>([])
  const [createdWorkflows, setCreatedWorkflows] = useState<Workflow[]>([])
  const [localSavedWorkflows, setLocalSavedWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  // 创建空白画布的初始数据
  const createEmptyCanvasData = (): CanvasItemsMap => ({
    [ROOT_CONTAINER_ID]: {
      id: ROOT_CONTAINER_ID,
      type: 'container',
      name: '工作流画布',
      parentId: '',
      position: { x: 0, y: 0 },
      size: { width: 3200, height: 1800 },
      collapsed: false,
      childrenIds: [],
      color: 'rgba(139, 92, 246, 0.15)'
    }
  })

  // Tab 系统状态 - 必须在 canvasDataByTabId 之前声明
  const [workspaceTabs, setWorkspaceTabs] = useState<WorkspaceTab[]>([
    { id: CANVAS_TAB_ID, type: 'canvas', title: '工作画布' }
  ])
  const [activeTabId, setActiveTabId] = useState(CANVAS_TAB_ID)

  // 每个画布 Tab 的数据存储
  const [canvasDataByTabId, setCanvasDataByTabId] = useState<Record<string, CanvasItemsMap>>({
    [CANVAS_TAB_ID]: createEmptyCanvasData()
  })

  // 当前画布的数据（兼容旧代码）
  const canvasItems = canvasDataByTabId[activeTabId] || createEmptyCanvasData()
  const setCanvasItems = (updater: CanvasItemsMap | ((prev: CanvasItemsMap) => CanvasItemsMap)) => {
    setCanvasDataByTabId(prev => ({
      ...prev,
      [activeTabId]: typeof updater === 'function' ? updater(prev[activeTabId] || createEmptyCanvasData()) : updater
    }))
  }

  // === 连接线 (Edge) 状态 ===
  const [edgesByTabId, setEdgesByTabId] = useState<Record<string, CanvasEdgesMap>>({
    [CANVAS_TAB_ID]: {}
  })
  const canvasEdges = edgesByTabId[activeTabId] || {}
  const setCanvasEdges = (updater: CanvasEdgesMap | ((prev: CanvasEdgesMap) => CanvasEdgesMap)) => {
    setEdgesByTabId(prev => ({
      ...prev,
      [activeTabId]: typeof updater === 'function' ? updater(prev[activeTabId] || {}) : updater
    }))
  }
  const [connectionState, setConnectionState] = useState<ConnectionState>({ mode: 'idle' })
  const connectionStateRef = useRef<ConnectionState>({ mode: 'idle' })
  const [selectedEdgeId, _setSelectedEdgeId] = useState<string | null>(null)
  const selectedEdgeIdRef = useRef<string | null>(null)
  const setSelectedEdgeId = (v: string | null | ((prev: string | null) => string | null)) => {
    _setSelectedEdgeId(prev => {
      const next = typeof v === 'function' ? v(prev) : v
      selectedEdgeIdRef.current = next
      return next
    })
  }
  const [editingEdgeLabel, setEditingEdgeLabel] = useState<{ edgeId: string; x: number; y: number } | null>(null)
  const draggingLabelRef = useRef<{ edgeId: string; startMouse: Position; startOffset: Position } | null>(null)
  const connectionAnimFrameRef = useRef<number | null>(null)

  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const [resizingContainerId, setResizingContainerId] = useState<string | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [spacePressed, setSpacePressed] = useState(false)
  const [currentScale, setCurrentScale] = useState(1)
  const [aiInputMessage, setAiInputMessage] = useState('')
  const [showAiDialog, setShowAiDialog] = useState(false)
  const [showChatPanel, setShowChatPanel] = useState(false)
  const [animatingCanvasId, setAnimatingCanvasId] = useState<string | null>(null)

  const dragStateRef = useRef<DragState>(null)
  const resizeStateRef = useRef<ResizeState>(null)
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null)
  const transformStateRef = useRef({
    scale: 1,
    positionX: INITIAL_POSITION_X,
    positionY: INITIAL_POSITION_Y
  })
  const spacePressedRef = useRef(false)
  const canvasContainerRef = useRef<HTMLDivElement | null>(null)
  const pointerInsideCanvasRef = useRef(false)
  const hasLoadedRef = useRef(false)
  const hasLoadedWorkflowsRef = useRef(false)
  const isReloadingForClonedWorkflowRef = useRef(false)

  // 加载画布布局
  useEffect(() => {
    // 防止严格模式下重复加载
    if (hasLoadedRef.current) {
      console.log('⏭️ [StoragePage] 已加载过，跳过重复加载')
      return
    }
    hasLoadedRef.current = true

    const loadCanvasLayout = async () => {
      console.log('🔄 [StoragePage] 开始加载画布布局...')
      try {
        const result = await fetchWorkspaceLayout()
        console.log('📦 [StoragePage] 加载结果:', result)

        let loadedItems: CanvasItemsMap
        if (result.snapshot && result.snapshot.canvasItems) {
          console.log('✅ [StoragePage] 找到保存的画布布局，恢复数据...')
          // 深拷贝以确保可以修改
          loadedItems = JSON.parse(JSON.stringify(result.snapshot.canvasItems)) as CanvasItemsMap
          // 恢复连接线
          if ((result.snapshot as any).canvasEdges) {
            setEdgesByTabId(prev => ({
              ...prev,
              [CANVAS_TAB_ID]: (result.snapshot as any).canvasEdges as CanvasEdgesMap
            }))
          }
        } else {
          console.log('⚠️ [StoragePage] 没有保存的画布布局，使用默认布局')
          loadedItems = {
            [ROOT_CONTAINER_ID]: {
              id: ROOT_CONTAINER_ID,
              type: 'container',
              name: '工作流画布',
              parentId: '',
              position: { x: 0, y: 0 },
              size: { width: 3200, height: 1800 },
              collapsed: false,
              childrenIds: [],
              color: 'rgba(139, 92, 246, 0.15)'
            }
          }
        }

        // 检查是否有待导入的工作包
        const pendingImportData = localStorage.getItem('pendingWorkPackageImport')
        if (pendingImportData) {
          try {
            const importData = JSON.parse(pendingImportData)
            console.log('🎯 [StoragePage] 检测到工作包导入:', importData.workPackageName)

            if (importData.container && importData.cards) {
              // 查找空白位置的函数
              const findEmptyPosition = (width: number, height: number): { x: number; y: number } => {
                const MARGIN = 50
                const existingContainers = Object.values(loadedItems).filter(
                  (item): item is ContainerCanvasItem =>
                    item.type === 'container' &&
                    item.id !== ROOT_CONTAINER_ID &&
                    item.parentId === ROOT_CONTAINER_ID
                )

                // 检查位置是否与现有容器重叠
                const isOverlapping = (x: number, y: number) => {
                  for (const container of existingContainers) {
                    const containerRight = container.position.x + container.size.width + CONTAINER_PADDING * 2
                    const containerBottom = container.position.y + container.size.height + CONTAINER_HEADER_HEIGHT + CONTAINER_PADDING * 2
                    const newRight = x + width
                    const newBottom = y + height

                    if (
                      x < containerRight + MARGIN &&
                      newRight > container.position.x - MARGIN &&
                      y < containerBottom + MARGIN &&
                      newBottom > container.position.y - MARGIN
                    ) {
                      return true
                    }
                  }
                  return false
                }

                // 尝试找到空白位置
                let x = 100
                let y = 100
                const MAX_ATTEMPTS = 50
                let attempts = 0

                while (isOverlapping(x, y) && attempts < MAX_ATTEMPTS) {
                  attempts++
                  x += width + MARGIN

                  // 如果超出画布宽度，换行
                  if (x + width > 2800) {
                    x = 100
                    y += height + MARGIN
                  }
                }

                console.log(`🔍 [StoragePage] 找到空白位置: (${x}, ${y}), 尝试次数: ${attempts}`)
                return { x, y }
              }

              // 找到不重叠的位置
              const newPosition = findEmptyPosition(
                importData.container.size.width,
                importData.container.size.height + CONTAINER_HEADER_HEIGHT + CONTAINER_PADDING * 2
              )

              // 创建容器
              const containerId = importData.container.id
              const containerItem: CanvasItem = {
                id: containerId,
                type: 'container',
                name: importData.workPackageName,
                parentId: ROOT_CONTAINER_ID,
                position: newPosition,
                size: importData.container.size,
                collapsed: false,
                childrenIds: importData.cards.map((c: any) => c.id),
                color: importData.container.color
              }

              // 创建工作流卡片
              const workflowItems: CanvasItem[] = importData.cards.map((card: any) => ({
                id: card.id,
                type: 'workflow' as const,
                workflowId: card.workflowData.id,
                parentId: containerId,
                position: card.position
              }))

              // 合并到已加载的画布中
              loadedItems[containerId] = containerItem
              workflowItems.forEach((item) => {
                loadedItems[item.id] = item
              })

              // 更新根容器的子元素列表
              if (loadedItems[ROOT_CONTAINER_ID]) {
                loadedItems[ROOT_CONTAINER_ID] = {
                  ...loadedItems[ROOT_CONTAINER_ID],
                  childrenIds: [...(loadedItems[ROOT_CONTAINER_ID].childrenIds || []), containerId]
                }
              }

              // 将导入的工作流添加到收藏夹
              const importedWorkflows: Workflow[] = importData.cards.map((card: any) => ({
                id: card.workflowData.id,
                title: card.workflowData.name,
                description: card.workflowData.summary,
                category: card.workflowData.category,
                tags: card.workflowData.tags,
                version: '1.0.0',
                author: {
                  id: 'imported',
                  name: card.workflowData.owner
                },
                createdAt: new Date().toISOString(),
                config: {
                  nodes: card.workflowData.config?.nodes || []
                },
                nodes: card.workflowData.config?.nodes || []
              }))

              console.log('🔄 [StoragePage] 准备添加工作流到收藏夹:', importedWorkflows.length, '个')
              console.log('📋 [StoragePage] 工作流详情:', importedWorkflows.map(w => ({ id: w.id, title: w.title })))

              // 立即更新 favoriteWorkflows 状态
              setFavoriteWorkflows(prev => {
                const updated = [...prev, ...importedWorkflows]
                console.log('✅ [StoragePage] favoriteWorkflows 状态已更新，总数:', updated.length)
                return updated
              })

              // 同时保存到 localStorage 以便持久化
              const existingFavorites = JSON.parse(localStorage.getItem('favoriteWorkflows') || '[]')
              const updatedFavorites = [...existingFavorites, ...importedWorkflows]
              localStorage.setItem('favoriteWorkflows', JSON.stringify(updatedFavorites))
              console.log('💾 [StoragePage] 已保存到 localStorage，总数:', updatedFavorites.length)

              console.log('✅ [StoragePage] 已添加容器和', workflowItems.length, '个工作流到画布')
              console.log('📌 [StoragePage] 已添加', importedWorkflows.length, '个工作流到收藏夹')
              console.log('🔍 [StoragePage] ROOT容器的childrenIds:', loadedItems[ROOT_CONTAINER_ID]?.childrenIds)
              console.log('🔍 [StoragePage] 导入的容器ID:', containerId)
              console.log('🔍 [StoragePage] loadedItems所有键:', Object.keys(loadedItems))
              console.log('🔍 [StoragePage] 容器详情:', loadedItems[containerId])

              // 显示成功提示
              setTimeout(() => {
                alert(`✅ 成功导入工作包「${importData.workPackageName}」\n\n已在画布上显示 ${workflowItems.length} 个工作流\n已添加到我的收藏`)
              }, 500)
            }

            // 清除待处理的导入数据
            localStorage.removeItem('pendingWorkPackageImport')
          } catch (error) {
            console.error('[StoragePage] 导入工作包失败:', error)
            localStorage.removeItem('pendingWorkPackageImport')
          }
        }

        // 设置最终的画布状态到主画布
        setCanvasDataByTabId(prev => ({
          ...prev,
          [CANVAS_TAB_ID]: loadedItems
        }))
      } catch (error) {
        console.error('❌ [StoragePage] 加载画布布局失败:', error)
      }
    }

    loadCanvasLayout()
  }, [])

  // 全局点击关闭右键菜单
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, itemId: null })
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [contextMenu.visible])

  // 自动保存画布布局（防抖500ms）- 只保存主画布数据
  useEffect(() => {
    const mainCanvasItems = canvasDataByTabId[CANVAS_TAB_ID]
    if (!mainCanvasItems) return

    const timeoutId = setTimeout(async () => {
      const itemsCount = Object.keys(mainCanvasItems).length
      console.log('💾 [StoragePage] 画布内容变化，准备保存...项目数:', itemsCount)

      try {
        const success = await saveWorkspaceLayout(
          [], // StoragePage 不需要 layout 参数
          1.0, // zoom 固定为 1.0
          {
            cards: [],
            zoom: 1.0,
            canvasItems: mainCanvasItems, // 只保存主画布数据
            canvasEdges: edgesByTabId[CANVAS_TAB_ID] || {}
          } as any
        )
        console.log('✅ [StoragePage] 保存结果:', success ? '成功' : '失败')
      } catch (error) {
        console.error('❌ [StoragePage] 自动保存画布失败:', error)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [canvasDataByTabId, edgesByTabId])

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false
      }
      const tagName = target.tagName
      return tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape: 取消连接
      if (event.key === 'Escape') {
        if (connectionStateRef.current.mode === 'connecting') {
          window.removeEventListener('mousemove', handleConnectionMouseMove)
          setConnectionState({ mode: 'idle' })
          connectionStateRef.current = { mode: 'idle' }
        }
        setSelectedEdgeId(null)
        return
      }
      // Delete/Backspace: 删除选中的 edge
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const currentSelectedEdge = selectedEdgeIdRef.current
        if (!isTypingTarget(event.target) && currentSelectedEdge) {
          setCanvasEdges(prev => {
            const next = { ...prev }
            delete next[currentSelectedEdge]
            return next
          })
          setSelectedEdgeId(null)
          return
        }
      }
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
  const loadWorkflows = useCallback(async () => {
    try {
      console.log('🔄 [StoragePage] 开始加载工作流列表...')
      setLoading(true)
      const [favorites, created] = await Promise.all([
        getFavoriteWorkflows(),
        getUserWorkflows()
      ])

      console.log('✅ [StoragePage] 工作流列表加载完成:', {
        favorites: favorites.length,
        created: created.length,
        createdDetails: created.map(w => ({
          id: w.id,
          title: w.title,
          isDraft: w.isDraft,
          isPublic: w.isPublic,
          hasConfig: !!w.config,
          hasNodes: !!w.nodes,
          configNodesCount: w.config?.nodes?.length || 0
        }))
      })

      // 详细检查第一个工作流的配置
      if (created.length > 0) {
        console.log('🔍 [StoragePage] 第一个工作流的完整数据:', {
          title: created[0].title,
          config: created[0].config,
          nodes: created[0].nodes,
          configJSON: JSON.stringify(created[0].config, null, 2)
        })
      }

      // 合并localStorage中导入的工作流到收藏列表
      const localFavorites = JSON.parse(localStorage.getItem('favoriteWorkflows') || '[]')
      if (localFavorites.length > 0) {
        console.log('📥 从localStorage加载导入的工作流:', localFavorites.length, '个')
        // 合并，去重（以localStorage中的为准）
        const mergedFavorites = [...localFavorites, ...favorites.filter(
          (f: Workflow) => !localFavorites.some((lf: any) => lf.id === f.id)
        )]
        setFavoriteWorkflows(mergedFavorites)
      } else {
        setFavoriteWorkflows(favorites)
      }

      setCreatedWorkflows(created)
      console.log('📝 [StoragePage] 已更新 createdWorkflows 状态')
    } catch (error) {
      console.error('❌ [StoragePage] 加载工作流失败:', error)
    } finally {
      setLoading(false)
      console.log('✨ [StoragePage] 加载完成，loading 设置为 false')
    }
  }, [])

  useEffect(() => {
    // 防止严格模式下重复加载
    if (hasLoadedWorkflowsRef.current) {
      console.log('⏭️ [StoragePage] 工作流已加载过，跳过重复加载')
      return
    }
    hasLoadedWorkflowsRef.current = true

    loadWorkflows()
  }, [loadWorkflows])

  // 加载本地保存的工作流
  useEffect(() => {
    const loadLocal = () => {
      const saved = JSON.parse(localStorage.getItem('savedWorkflows') || '[]')
      setLocalSavedWorkflows(saved)
    }
    loadLocal()
    window.addEventListener('savedWorkflowsUpdated', loadLocal)
    return () => window.removeEventListener('savedWorkflowsUpdated', loadLocal)
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
      // 如果鼠标离开了侧边栏区域，自动收起（pinned时不收起）
      if (e.clientX > SIDEBAR_WIDTH && !sidebarPinned) {
        setSidebarCollapsed(true)
        setIsHoveringEdge(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [sidebarCollapsed, sidebarPinned])

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
    console.log('🔄 [libraryData] 重新计算AI工作方法库数据')
    console.log('📊 [libraryData] favoriteWorkflows数量:', favoriteWorkflows?.length || 0)
    console.log('📊 [libraryData] createdWorkflows数量:', createdWorkflows?.length || 0)

    // 将API数据转换为LibraryWorkflow格式,并添加所有权标记
    const convertToLibraryWorkflow = (workflow: Workflow, section: LibrarySection, isOwner: boolean): LibraryWorkflow => {
      const result = {
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
      }

      // 只为新创建的工作流打印详细日志
      if (workflow.title.includes('创业') || workflow.title.includes('想做')) {
        console.log(`🔍 [convertToLibraryWorkflow] ${workflow.title} 完整配置:`, {
          hasConfig: !!workflow.config,
          hasNodes: !!workflow.nodes,
          configNodesCount: workflow.config?.nodes?.length || 0,
          fullConfig: workflow.config,
          fullNodes: workflow.nodes,
          configNodes: JSON.stringify(workflow.config?.nodes, null, 2)
        })
      }

      return result
    }

    // created 工作流都是用户拥有的
    const favorites = (favoriteWorkflows || []).map(wf => {
      const isOwner = createdWorkflows.some(cw => cw.id === wf.id)
      return convertToLibraryWorkflow(wf, 'favorites', isOwner)
    })

    // ✅ 过滤：只显示已发布的工作流（isDraft: false）
    const publishedWorkflows = (createdWorkflows || []).filter(wf => !wf.isDraft)
    const created = publishedWorkflows.map(wf => convertToLibraryWorkflow(wf, 'created', true))

    console.log('✅ [libraryData] 转换后 favorites:', favorites.length, '个')
    console.log('✅ [libraryData] 转换后 created:', created.length, '个')
    console.log('📝 [libraryData] 工作流过滤:', {
      total: createdWorkflows?.length || 0,
      published: publishedWorkflows.length,
      drafts: (createdWorkflows?.length || 0) - publishedWorkflows.length
    })

    // 将本地保存的工作流转换为 LibraryWorkflow 格式
    const localWorkflows: LibraryWorkflow[] = localSavedWorkflows.map(w => ({
      id: w.id,
      name: w.title,
      summary: w.description || '',
      status: 'active' as WorkflowStatus,
      category: w.category || '未分类',
      tags: Array.isArray(w.tags) ? w.tags : [],
      owner: '我',
      updatedAt: new Date(w.createdAt).toISOString().split('T')[0],
      section: 'created' as LibrarySection,
      config: { nodes: (w.steps || []).map((step: any, i: number) => ({ id: step.id, type: 'ai', label: step.title, config: step })) },
      isOwner: true,
      canEdit: true
    }))

    // 合并静态数据和API数据，优先显示API数据
    const staticFavorites = initialLibraryData.filter(wf => wf.section === 'favorites')
    const staticCreated = initialLibraryData.filter(wf => wf.section === 'created')
    const staticRecent = initialLibraryData.filter(wf => wf.section === 'recent')

    return [
      ...localWorkflows,
      ...created,
      ...staticCreated.filter(sf => !created.some(c => c.id === sf.id)),
      ...favorites,
      ...staticFavorites.filter(sf => !favorites.some(f => f.id === sf.id)),
      ...staticRecent
    ]
  }, [favoriteWorkflows, createdWorkflows, localSavedWorkflows])

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

  // 自动添加克隆的工作流到画布
  useEffect(() => {
    console.log('🔍 [StoragePage] useEffect 检查克隆标记...', {
      loading,
      createdWorkflowsLength: createdWorkflows?.length,
      hasFlag: !!localStorage.getItem('newlyClonedWorkflowId'),
      isReloading: isReloadingForClonedWorkflowRef.current
    })

    // 检查是否有克隆标记
    const clonedWorkflowId = localStorage.getItem('newlyClonedWorkflowId')
    if (!clonedWorkflowId) {
      console.log('ℹ️ [StoragePage] 没有克隆标记，跳过')
      // 重置重新加载标记
      isReloadingForClonedWorkflowRef.current = false
      return
    }

    // 如果正在为克隆的工作流重新加载，则跳过 loading 检查
    // 只在工作流加载完成后执行（除非是重新加载状态）
    if (loading && !isReloadingForClonedWorkflowRef.current) {
      console.log('⏳ [StoragePage] 仍在加载中，跳过检查')
      return
    }

    if (!createdWorkflows || createdWorkflows.length === 0) {
      console.log('⏳ [StoragePage] 工作流数据未就绪，跳过检查')
      return
    }

    console.log('🎯 [StoragePage] 检测到克隆的工作流ID:', clonedWorkflowId)

    // 在createdWorkflows中查找该工作流
    const clonedWorkflow = createdWorkflows.find(w => w.id === clonedWorkflowId)

    if (!clonedWorkflow) {
      console.warn('⚠️ [StoragePage] 未找到克隆的工作流，可能尚未同步')
      console.log('📋 [StoragePage] 可用的工作流IDs:', createdWorkflows.map(w => w.id))

      // 如果还没有重新加载过，尝试刷新工作流列表
      if (!isReloadingForClonedWorkflowRef.current) {
        console.log('🔄 [StoragePage] 重新加载工作流列表以获取新克隆的工作流...')
        isReloadingForClonedWorkflowRef.current = true
        loadWorkflows()
      } else {
        console.warn('⚠️ [StoragePage] 已经重新加载过但仍未找到工作流，清除标记')
        localStorage.removeItem('newlyClonedWorkflowId')
        isReloadingForClonedWorkflowRef.current = false
      }
      return
    }

    console.log('✅ [StoragePage] 找到克隆的工作流，准备添加到画布:', clonedWorkflow.title)

    // 延迟执行，确保画布已经就绪
    setTimeout(() => {
      // 计算画布中心位置（考虑当前的缩放和平移）
      const { scale, positionX, positionY } = transformStateRef.current
      const wrapperElement = transformRef.current?.instance.wrapperComponent

      if (!wrapperElement) {
        console.warn('⚠️ [StoragePage] 画布未就绪')
        return
      }

      const wrapperRect = wrapperElement.getBoundingClientRect()
      const centerX = wrapperRect.width / 2
      const centerY = wrapperRect.height / 2

      // 转换为画布世界坐标
      const worldPoint = {
        x: (centerX - positionX) / scale,
        y: (centerY - positionY) / scale
      }

      console.log('📍 [StoragePage] 计算的画布位置:', worldPoint)

      // 在画布上创建卡片
      let newCardPosition: Position | null = null
      let newCardId: string | null = null

      setCanvasItems((prev) => {
        console.log('🔍 [StoragePage] 当前 canvasItems 状态:', {
          totalItems: Object.keys(prev).length,
          rootContainer: prev[ROOT_CONTAINER_ID],
          rootChildrenIds: prev[ROOT_CONTAINER_ID]?.type === 'container' ? prev[ROOT_CONTAINER_ID].childrenIds : []
        })

        // 获取根容器
        const rootContainer = prev[ROOT_CONTAINER_ID]
        if (!rootContainer || rootContainer.type !== 'container') {
          console.error('❌ [StoragePage] 找不到根容器')
          return prev
        }

        // 统计已存在的该工作流卡片数量（仅用于日志）
        const existingCards = Object.values(prev).filter(
          item => item.type === 'workflow' && item.workflowId === clonedWorkflowId
        )

        if (existingCards.length > 0) {
          console.log('ℹ️ [StoragePage] 工作流卡片已存在', existingCards.length, '个，继续添加新卡片')
        }

        // 计算左上角第一个不重叠的位置
        const MARGIN = 20
        const START_X = 50
        const START_Y = 50
        const COLS = 4 // 每行最多4个卡片

        // 获取根容器中所有现有卡片的位置
        const existingPositions: Position[] = []
        if (rootContainer && rootContainer.type === 'container') {
          rootContainer.childrenIds?.forEach(childId => {
            const child = prev[childId]
            if (child && child.type === 'workflow') {
              existingPositions.push(child.position)
            }
          })
        }

        // 计算新卡片位置（网格布局，从左上角开始）
        let row = 0
        let col = 0
        let position: Position

        while (true) {
          position = {
            x: START_X + col * (CARD_WIDTH + MARGIN),
            y: START_Y + row * (CARD_HEIGHT + MARGIN)
          }

          // 检查是否与现有卡片重叠
          const hasOverlap = existingPositions.some(existingPos => {
            return Math.abs(existingPos.x - position.x) < CARD_WIDTH &&
                   Math.abs(existingPos.y - position.y) < CARD_HEIGHT
          })

          if (!hasOverlap) {
            break
          }

          // 移动到下一个网格位置
          col++
          if (col >= COLS) {
            col = 0
            row++
          }
        }

        newCardPosition = position

        // 创建工作流卡片
        const cardId = generateId('workflow-card')
        newCardId = cardId

        const newCard = {
          id: cardId,
          type: 'workflow' as const,
          workflowId: clonedWorkflow.id,
          parentId: ROOT_CONTAINER_ID,
          position
        }

        console.log('🎉 [StoragePage] 成功添加克隆的工作流卡片到画布', newCard)

        // 将新卡片添加到根容器的 childrenIds 中
        const updatedRootContainer = {
          ...rootContainer,
          childrenIds: [...(rootContainer.childrenIds || []), cardId]
        }

        console.log('📌 [StoragePage] 已将卡片添加到根容器的 childrenIds', {
          cardId,
          oldChildrenCount: rootContainer.childrenIds?.length || 0,
          newChildrenCount: updatedRootContainer.childrenIds.length,
          allChildrenIds: updatedRootContainer.childrenIds
        })

        return {
          ...prev,
          [ROOT_CONTAINER_ID]: updatedRootContainer,
          [cardId]: newCard
        }
      })

      // 清除localStorage标记
      localStorage.removeItem('newlyClonedWorkflowId')
      console.log('✨ [StoragePage] 已清除克隆标记')
      // 重置重新加载标记
      isReloadingForClonedWorkflowRef.current = false
    }, 100)
  }, [loading, createdWorkflows, loadWorkflows])

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
      // 尝试从 dataTransfer 读取工具链接数据
      const toolLinkData = event.dataTransfer.getData('tool-link')

      if (toolLinkData) {
        // 处理工具链接拖拽
        try {
          const toolLink = JSON.parse(toolLinkData)

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
            const TOOL_CARD_SIZE = 70  // 工具卡片正方形尺寸
            const topLeftGuess = {
              x: worldPoint.x - TOOL_CARD_SIZE / 2,
              y: worldPoint.y - TOOL_CARD_SIZE / 2
            }
            const relativePositionGuess = convertAbsoluteToContainerPosition(draft, dropTarget, topLeftGuess)

            const relativePosition = findNonOverlappingPosition(
              draft,
              dropTarget,
              relativePositionGuess,
              TOOL_CARD_SIZE,
              TOOL_CARD_SIZE
            )

            // 创建工具链接卡片
            const cardId = generateId('tool-link-card')
            draft[cardId] = {
              id: cardId,
              type: 'tool-link',
              name: toolLink.name,
              url: toolLink.url,
              logo: toolLink.logo,
              badge: toolLink.badge,
              description: toolLink.description,
              category: toolLink.category,
              parentId: dropTarget,
              position: relativePosition
            }
            attachToParent(draft, dropTarget, cardId)

            const targetContainer = getContainer(draft, dropTarget)
            if (targetContainer?.collapsed) {
              draft[dropTarget] = { ...targetContainer, collapsed: false }
            }

            recalcContainerSizes(draft, [dropTarget])
          })

          return
        } catch (e) {
          console.error('Failed to parse tool-link data:', e)
        }
      }

      // 原有的工作流拖拽逻辑
      const draggedWorkflowId = libraryDraggingId || event.dataTransfer.getData('workflow-library-id')
      if (!draggedWorkflowId) return

      const workflow = libraryData.find((item) => item.id === draggedWorkflowId)
      if (!workflow) return

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

        const relativePosition = findNonOverlappingPosition(
          draft,
          dropTarget,
          relativePositionGuess,
          CARD_WIDTH,
          CARD_HEIGHT
        )

        const cardId = generateId('workflow-card')
        draft[cardId] = {
          id: cardId,
          type: 'workflow',
          workflowId: workflow.id,
          parentId: dropTarget,
          position: relativePosition
        }
        attachToParent(draft, dropTarget, cardId)

        const targetContainer = getContainer(draft, dropTarget)
        if (targetContainer?.collapsed) {
          draft[dropTarget] = { ...targetContainer, collapsed: false }
        }

        recalcContainerSizes(draft, [dropTarget])
      })

      setLibraryDraggingId(null)
    },
    [attachToParent, libraryData, libraryDraggingId, updateCanvasItems]
  )

  const handleCanvasDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    // 允许工具链接和工作流拖拽
    const hasToolLink = event.dataTransfer.types.includes('tool-link')
    const hasWorkflow = event.dataTransfer.types.includes('workflow-library-id')
    if (libraryDraggingId || hasToolLink || hasWorkflow) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
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

  // === 连接线交互 ===
  const clientToCanvasCoords = useCallback((clientX: number, clientY: number): Position => {
    const { scale, positionX, positionY } = transformStateRef.current
    const wrapperEl = canvasContainerRef.current?.querySelector('.workflow-transform-wrapper')
    if (!wrapperEl) return { x: 0, y: 0 }
    const rect = wrapperEl.getBoundingClientRect()
    return {
      x: (clientX - rect.left - positionX) / scale,
      y: (clientY - rect.top - positionY) / scale
    }
  }, [])

  const createEdge = useCallback((
    sourceItemId: string,
    sourceHandle: HandleDirection,
    targetItemId: string,
    targetHandle: HandleDirection
  ) => {
    if (sourceItemId === targetItemId) return
    const exists = Object.values(canvasEdges).some(e =>
      (e.sourceItemId === sourceItemId && e.targetItemId === targetItemId) ||
      (e.sourceItemId === targetItemId && e.targetItemId === sourceItemId)
    )
    if (exists) return
    const edgeId = generateId('edge')
    setCanvasEdges(prev => ({
      ...prev,
      [edgeId]: { id: edgeId, sourceItemId, sourceHandle, targetItemId, targetHandle }
    }))
  }, [canvasEdges, setCanvasEdges])

  const handleConnectionMouseMove = useCallback((e: MouseEvent) => {
    if (connectionAnimFrameRef.current) return
    connectionAnimFrameRef.current = requestAnimationFrame(() => {
      connectionAnimFrameRef.current = null
      const current = connectionStateRef.current
      if (current.mode !== 'connecting') return
      const pos = clientToCanvasCoords(e.clientX, e.clientY)
      const newState: ConnectionState = { ...current, mousePosition: pos }
      setConnectionState(newState)
      connectionStateRef.current = newState
    })
  }, [clientToCanvasCoords])

  const handleConnectionMouseUp = useCallback((e: MouseEvent) => {
    window.removeEventListener('mousemove', handleConnectionMouseMove)
    window.removeEventListener('mouseup', handleConnectionMouseUp)
    const current = connectionStateRef.current
    if (current.mode !== 'connecting') return
    const targetEl = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
    const handleEl = targetEl?.closest?.('[data-handle-direction]') as HTMLElement
    if (handleEl) {
      const targetItemId = handleEl.getAttribute('data-handle-item')
      const targetDir = handleEl.getAttribute('data-handle-direction') as HandleDirection
      if (targetItemId && targetItemId !== current.sourceItemId) {
        createEdge(current.sourceItemId, current.sourceHandle, targetItemId, targetDir)
      }
    }
    setConnectionState({ mode: 'idle' })
    connectionStateRef.current = { mode: 'idle' }
  }, [handleConnectionMouseMove, createEdge])

  const handleConnectionStart = useCallback((e: React.MouseEvent, itemId: string, direction: HandleDirection) => {
    const pos = clientToCanvasCoords(e.clientX, e.clientY)
    const state: ConnectionState = {
      mode: 'connecting',
      sourceItemId: itemId,
      sourceHandle: direction,
      mousePosition: pos
    }
    setConnectionState(state)
    connectionStateRef.current = state
    window.addEventListener('mousemove', handleConnectionMouseMove)
    window.addEventListener('mouseup', handleConnectionMouseUp)
  }, [clientToCanvasCoords, handleConnectionMouseMove, handleConnectionMouseUp])

  const handleConnectionClick = useCallback((e: React.MouseEvent, itemId: string, direction: HandleDirection) => {
    if (connectionState.mode === 'idle') {
      const pos = clientToCanvasCoords(e.clientX, e.clientY)
      const state: ConnectionState = {
        mode: 'connecting',
        sourceItemId: itemId,
        sourceHandle: direction,
        mousePosition: pos
      }
      setConnectionState(state)
      connectionStateRef.current = state
      window.addEventListener('mousemove', handleConnectionMouseMove)
    } else if (connectionState.mode === 'connecting') {
      window.removeEventListener('mousemove', handleConnectionMouseMove)
      if (itemId !== connectionState.sourceItemId) {
        createEdge(connectionState.sourceItemId, connectionState.sourceHandle, itemId, direction)
      }
      setConnectionState({ mode: 'idle' })
      connectionStateRef.current = { mode: 'idle' }
    }
  }, [connectionState, clientToCanvasCoords, handleConnectionMouseMove, createEdge])

  // 标签拖拽
  const handleLabelDragMove = useCallback((e: MouseEvent) => {
    const drag = draggingLabelRef.current
    if (!drag) return
    const canvasPos = clientToCanvasCoords(e.clientX, e.clientY)
    const startCanvas = clientToCanvasCoords(drag.startMouse.x, drag.startMouse.y)
    const dx = canvasPos.x - startCanvas.x
    const dy = canvasPos.y - startCanvas.y
    const newOffset = { x: drag.startOffset.x + dx, y: drag.startOffset.y + dy }
    setCanvasEdges(prev => {
      const edge = prev[drag.edgeId]
      if (!edge) return prev
      return { ...prev, [drag.edgeId]: { ...edge, labelOffset: newOffset } }
    })
  }, [clientToCanvasCoords, setCanvasEdges])

  const handleLabelDragUp = useCallback(() => {
    draggingLabelRef.current = null
    window.removeEventListener('mousemove', handleLabelDragMove)
    window.removeEventListener('mouseup', handleLabelDragUp)
  }, [handleLabelDragMove])

  const handleLabelDragStart = useCallback((e: React.MouseEvent, edgeId: string, currentOffset: Position) => {
    e.stopPropagation()
    e.preventDefault()
    draggingLabelRef.current = {
      edgeId,
      startMouse: { x: e.clientX, y: e.clientY },
      startOffset: { ...currentOffset }
    }
    window.addEventListener('mousemove', handleLabelDragMove)
    window.addEventListener('mouseup', handleLabelDragUp)
  }, [handleLabelDragMove, handleLabelDragUp])

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

  const handleResizeMouseMove = useCallback(
    (event: MouseEvent) => {
      const resizeState = resizeStateRef.current
      if (!resizeState) return

      const scale = transformStateRef.current.scale
      const deltaX = (event.clientX - resizeState.pointerStart.x) / scale
      const deltaY = (event.clientY - resizeState.pointerStart.y) / scale

      const newWidth = Math.max(CONTAINER_MIN_WIDTH, resizeState.sizeStart.width + deltaX)
      const newHeight = Math.max(CONTAINER_MIN_HEIGHT, resizeState.sizeStart.height + deltaY)

      setCanvasItems((prev) => {
        const container = prev[resizeState.containerId]
        if (!container || container.type !== 'container') return prev

        return {
          ...prev,
          [resizeState.containerId]: {
            ...container,
            size: { width: newWidth, height: newHeight }
          }
        }
      })
    },
    []
  )

  const handleResizeMouseUp = useCallback(() => {
    const resizeState = resizeStateRef.current
    if (!resizeState) return

    // 调整重叠项
    setCanvasItems((prev) => {
      const container = prev[resizeState.containerId]
      if (!container || container.type !== 'container') return prev

      const newPositions = adjustOverlappingItemsAfterResize(prev, [resizeState.containerId])

      // 应用新位置
      const updated = { ...prev }
      for (const [itemId, newPosition] of Object.entries(newPositions)) {
        const item = updated[itemId]
        if (item) {
          updated[itemId] = {
            ...item,
            position: newPosition
          }
        }
      }

      return updated
    })

    setResizingContainerId(null)
    resizeStateRef.current = null

    window.removeEventListener('mousemove', handleResizeMouseMove)
    window.removeEventListener('mouseup', handleResizeMouseUp)
  }, [handleResizeMouseMove])

  const handleResizeMouseDown = useCallback(
    (event: React.MouseEvent, containerId: string) => {
      const container = canvasItems[containerId]
      if (!container || container.type !== 'container') return

      if (event.button !== 0) return

      event.preventDefault()
      event.stopPropagation()

      setResizingContainerId(containerId)
      resizeStateRef.current = {
        containerId,
        pointerStart: { x: event.clientX, y: event.clientY },
        sizeStart: { ...container.size }
      }

      window.addEventListener('mousemove', handleResizeMouseMove)
      window.addEventListener('mouseup', handleResizeMouseUp)
    },
    [canvasItems, handleResizeMouseMove, handleResizeMouseUp]
  )

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
      window.removeEventListener('mousemove', handleResizeMouseMove)
      window.removeEventListener('mouseup', handleResizeMouseUp)
    }
  }, [handleWindowMouseMove, handleWindowMouseUp, handleResizeMouseMove, handleResizeMouseUp])


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

      // 只允许在AI工作方法库列表区域滚动
      const isInLibraryList = target.closest('.workflow-library-list')

      // 只允许在画布区域处理滚轮事件（由 handleWheel 处理）
      const isInCanvas = target.closest('.workflow-canvas-container')

      // 允许在标记为可滚动的数据面板内滚动（如渐进式执行面板）
      const isInCustomScrollArea = target.closest('[data-scroll-container="true"]')

      // 允许在执行 Tab 内滚动
      const isInExecutionTab = target.closest('.execution-tab')

      // 允许在创建工作流 Tab 内滚动
      const isInCreateTab = target.closest('.create-workflow-tab')

      // 如果不在列表、画布或执行Tab区域，则阻止滚动
      if (!isInLibraryList && !isInCanvas && !isInCustomScrollArea && !isInExecutionTab && !isInCreateTab) {
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

    // 阻止整个页面的横向导航手势（但允许画布区域、执行Tab和创建工作流Tab）
    const preventBackNavigation = (event: WheelEvent) => {
      const target = event.target as HTMLElement
      // 如果在画布区域、执行Tab或创建工作流Tab内，不阻止横向滚动
      if (
        target.closest('.workflow-canvas-container') ||
        target.closest('[data-scroll-container="true"]') ||
        target.closest('.execution-tab') ||
        target.closest('.create-workflow-tab')
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
      // 如果在画布区域、执行Tab或创建工作流Tab内，不阻止任何触摸手势
      if (
        target.closest('.workflow-canvas-container') ||
        target.closest('[data-scroll-container="true"]') ||
        target.closest('.execution-tab') ||
        target.closest('.create-workflow-tab')
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

    // 先收集所有要删除的 ID 用于清理 edges
    const container = getContainer(canvasItems, containerId)
    if (container) {
      const allIds = [containerId]
      const q = [...container.childrenIds]
      while (q.length > 0) {
        const id = q.shift()
        if (!id) continue
        allIds.push(id)
        const child = canvasItems[id]
        if (child && child.type === 'container') {
          q.push(...(child as ContainerCanvasItem).childrenIds)
        }
      }
      removeEdgesForItems(allIds)
    }

    updateCanvasItems((draft) => {
      const cont = getContainer(draft, containerId)
      if (!cont) return

      // 删除容器及其所有子项
      const itemsToDelete = [containerId]
      const queue = [...cont.childrenIds]

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
      detachFromParent(draft, cont.parentId, containerId)

      // 删除所有项
      for (const id of itemsToDelete) {
        delete draft[id]
      }

      // 重新计算父容器大小
      recalcContainerSizes(draft, [cont.parentId])
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

  // Tab 系统函数
  const activeTab = useMemo(() =>
    workspaceTabs.find(tab => tab.id === activeTabId) || workspaceTabs[0],
    [workspaceTabs, activeTabId]
  )

  const openWorkflowTab = useCallback((workflowId: string, title: string) => {
    // 检查是否已有该工作流的 tab
    const existingTab = workspaceTabs.find(tab => tab.workflowId === workflowId)
    if (existingTab) {
      setActiveTabId(existingTab.id)
      return
    }

    // 创建新 tab
    const newTab: WorkspaceTab = {
      id: `workflow-${workflowId}-${Date.now()}`,
      type: 'workflow',
      title: title || '工作流执行',
      workflowId
    }
    setWorkspaceTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
  }, [workspaceTabs])

  // 处理 URL 参数中的工作流 ID（支持 ?workflow=xxx 直接打开工作流）
  useEffect(() => {
    const workflowId = searchParams.get('workflow')
    const workflowTitle = searchParams.get('title') || '工作流执行'
    if (workflowId) {
      console.log('🎯 [StoragePage] 从 URL 参数打开工作流:', workflowId)
      openWorkflowTab(workflowId, workflowTitle)
    }
  }, [searchParams, openWorkflowTab])

  // 打开创建工作流 tab
  const openCreateTab = useCallback(() => {
    // 检查是否已有创建工作流的 tab
    const existingTab = workspaceTabs.find(tab => tab.type === 'create')
    if (existingTab) {
      setActiveTabId(existingTab.id)
      return
    }

    // 创建新 tab
    const newTab: WorkspaceTab = {
      id: `create-${Date.now()}`,
      type: 'create',
      title: '未命名工作流'
    }
    setWorkspaceTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
  }, [workspaceTabs])

  // 新增空白画布 tab
  const openNewCanvasTab = useCallback(() => {
    const canvasCount = workspaceTabs.filter(tab => tab.type === 'canvas').length
    const newTabId = `canvas-${Date.now()}`
    const newTab: WorkspaceTab = {
      id: newTabId,
      type: 'canvas',
      title: `画布 ${canvasCount + 1}`
    }
    // 初始化新画布的空数据
    setCanvasDataByTabId(prev => ({
      ...prev,
      [newTabId]: createEmptyCanvasData()
    }))
    setWorkspaceTabs(prev => [...prev, newTab])
    setActiveTabId(newTabId)
    // 触发入场动画
    setAnimatingCanvasId(newTabId)
    setTimeout(() => setAnimatingCanvasId(null), 300)
  }, [workspaceTabs])

  const closeWorkspaceTab = useCallback((tabId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    // 不能关闭默认画布 tab（始终保留）
    if (tabId === CANVAS_TAB_ID) return

    setWorkspaceTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId)
      // 如果关闭的是当前 tab，切换到默认画布
      if (activeTabId === tabId) {
        setActiveTabId(CANVAS_TAB_ID)
      }
      return newTabs
    })
    // 清理关闭的画布数据
    setCanvasDataByTabId(prev => {
      const next = { ...prev }
      delete next[tabId]
      return next
    })
  }, [activeTabId])

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

  // 处理添加工具
  const handleAddTool = () => {
    // 验证URL是否填写
    if (!toolFormData.url.trim()) {
      alert('请输入工具链接')
      return
    }

    // 验证URL格式
    let toolUrl = toolFormData.url.trim()
    try {
      // 如果URL没有协议，自动添加https://
      if (!toolUrl.startsWith('http://') && !toolUrl.startsWith('https://')) {
        toolUrl = 'https://' + toolUrl
      }
      new URL(toolUrl) // 验证URL格式
    } catch (e) {
      alert('请输入有效的URL地址')
      return
    }

    const toolCardId = generateId('tool-link-card')

    updateCanvasItems((draft) => {
      // 首选位置：画布左上角
      const preferredPosition = {
        x: 20,
        y: 20
      }

      const TOOL_CARD_SIZE = 70  // 工具卡片正方形尺寸

      // 使用碰撞检测找到不重叠的位置
      const position = findNonOverlappingPosition(
        draft,
        ROOT_CONTAINER_ID,
        preferredPosition,
        TOOL_CARD_SIZE,
        TOOL_CARD_SIZE
      )

      // 如果没有填写名称，尝试从URL中提取
      let toolName = toolFormData.name.trim()
      if (!toolName) {
        try {
          toolName = new URL(toolUrl).hostname.replace('www.', '')
        } catch {
          toolName = '新工具'
        }
      }

      draft[toolCardId] = {
        id: toolCardId,
        type: 'tool-link',
        name: toolName,
        url: toolUrl,
        logo: '🔗',
        description: toolFormData.description.trim() || undefined,
        parentId: ROOT_CONTAINER_ID,
        position
      }

      attachToParent(draft, ROOT_CONTAINER_ID, toolCardId)
      recalcContainerSizes(draft, [ROOT_CONTAINER_ID])
    })

    // 关闭模态框并重置表单
    setShowToolModal(false)
    setToolFormData({
      url: '',
      name: '',
      description: ''
    })
  }

  // 处理添加文章
  const handleAddArticle = () => {
    if (!articleFormData.url.trim()) {
      setArticleUrlError(true)
      return
    }

    let articleUrl = articleFormData.url.trim()
    try {
      if (!articleUrl.startsWith('http://') && !articleUrl.startsWith('https://')) {
        articleUrl = 'https://' + articleUrl
      }
      new URL(articleUrl)
    } catch {
      setArticleUrlError(true)
      return
    }

    const articleCardId = generateId('article-card')

    updateCanvasItems((draft) => {
      const preferredPosition = { x: 20, y: 20 }
      const position = findNonOverlappingPosition(
        draft,
        ROOT_CONTAINER_ID,
        preferredPosition,
        220,
        60
      )

      let articleTitle = articleFormData.title.trim()
      if (!articleTitle) {
        try {
          articleTitle = new URL(articleUrl).hostname.replace('www.', '')
        } catch {
          articleTitle = '新文章'
        }
      }

      draft[articleCardId] = {
        id: articleCardId,
        type: 'article',
        url: articleUrl,
        title: articleTitle,
        note: articleFormData.note.trim() || undefined,
        parentId: ROOT_CONTAINER_ID,
        position
      } as ArticleCanvasItem

      attachToParent(draft, ROOT_CONTAINER_ID, articleCardId)
      recalcContainerSizes(draft, [ROOT_CONTAINER_ID])
    })

    setShowArticleModal(false)
    setArticleFormData({ url: '', title: '', note: '' })
    setArticleUrlError(false)
  }

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      itemId
    })
  }

  // 复制卡片
  const handleCopyItem = () => {
    if (!contextMenu.itemId) return

    const item = canvasItems[contextMenu.itemId]
    if (!item || item.type === 'container') return

    // 生成新ID
    const newId = generateId(item.type === 'workflow' ? 'workflow-card' : 'ai-card')

    // 复制卡片，增加偏移量避免重叠（从20px改为50px）
    const newItem = {
      ...item,
      id: newId,
      position: {
        x: item.position.x + 50,
        y: item.position.y + 50
      }
    }

    setCanvasItems(prev => {
      const updated = { ...prev, [newId]: newItem }

      // 将新卡片添加到父容器的 childrenIds 中
      const parentId = item.parentId || ROOT_CONTAINER_ID
      const parent = updated[parentId]
      if (parent && parent.type === 'container') {
        updated[parentId] = {
          ...parent,
          childrenIds: [...parent.childrenIds, newId]
        }
      }

      return updated
    })

    console.log('📋 [StoragePage] 复制卡片:', {
      originalId: contextMenu.itemId,
      newId,
      type: item.type,
      parentId: item.parentId,
      originalPos: item.position,
      newPos: newItem.position
    })
    setContextMenu({ visible: false, x: 0, y: 0, itemId: null })
  }

  // 删除卡片
  const handleDeleteWorkflowCard = (cardId: string) => {
    const item = canvasItems[cardId]
    if (!item || item.type !== 'workflow') return

    // 显示确认对话框
    setDeleteConfirmDialog({ visible: true, cardId })
  }

  // 清除与指定 item 相关的所有 edges
  const removeEdgesForItems = (itemIds: string[]) => {
    const idSet = new Set(itemIds)
    setCanvasEdges(prev => {
      const next: CanvasEdgesMap = {}
      for (const [edgeId, edge] of Object.entries(prev)) {
        if (!idSet.has(edge.sourceItemId) && !idSet.has(edge.targetItemId)) {
          next[edgeId] = edge
        }
      }
      return next
    })
  }

  // 删除工具卡片
  const handleDeleteToolCard = (cardId: string) => {
    const item = canvasItems[cardId]
    if (!item || item.type !== 'tool-link') return

    if (!confirm('确定要删除这个工具卡片吗？')) return

    removeEdgesForItems([cardId])
    updateCanvasItems((draft) => {
      // 从父容器的 childrenIds 中移除
      const parentId = item.parentId || ROOT_CONTAINER_ID
      const parent = draft[parentId]
      if (parent && parent.type === 'container') {
        parent.childrenIds = parent.childrenIds.filter(id => id !== cardId)
      }

      // 删除卡片本身
      delete draft[cardId]

      // 重新计算容器尺寸
      recalcContainerSizes(draft, [parentId])
    })
    console.log('🗑️ [StoragePage] 删除工具卡片:', cardId)
  }

  // 删除文章卡片
  const handleDeleteArticleCard = (cardId: string) => {
    const item = canvasItems[cardId]
    if (!item || item.type !== 'article') return

    if (!confirm('确定要删除这个文章卡片吗？')) return

    removeEdgesForItems([cardId])
    updateCanvasItems((draft) => {
      const parentId = item.parentId || ROOT_CONTAINER_ID
      const parent = draft[parentId]
      if (parent && parent.type === 'container') {
        parent.childrenIds = parent.childrenIds.filter(id => id !== cardId)
      }
      delete draft[cardId]
      recalcContainerSizes(draft, [parentId])
    })
  }

  const confirmDeleteWorkflowCard = () => {
    const cardId = deleteConfirmDialog.cardId
    if (!cardId) return

    const item = canvasItems[cardId]
    if (!item) return

    removeEdgesForItems([cardId])
    setCanvasItems(prev => {
      const newItems = { ...prev }

      // 从父容器的 childrenIds 中移除
      const parentId = item.parentId || ROOT_CONTAINER_ID
      const parent = newItems[parentId]
      if (parent && parent.type === 'container') {
        newItems[parentId] = {
          ...parent,
          childrenIds: parent.childrenIds.filter(id => id !== cardId)
        }
      }

      // 删除卡片本身
      delete newItems[cardId]
      return newItems
    })
    console.log('🗑️ [StoragePage] 删除卡片:', cardId)

    // 关闭对话框
    setDeleteConfirmDialog({ visible: false, cardId: null })
  }

  const handleDeleteItem = () => {
    if (!contextMenu.itemId) return

    const item = canvasItems[contextMenu.itemId]
    if (!item) return

    // 如果是容器，使用已有的删除容器逻辑
    if (item.type === 'container') {
      handleDeleteContainer(contextMenu.itemId)
    } else {
      // 删除普通卡片
      removeEdgesForItems([contextMenu.itemId!])
      setCanvasItems(prev => {
        const newItems = { ...prev }

        // 从父容器的 childrenIds 中移除
        const parentId = item.parentId || ROOT_CONTAINER_ID
        const parent = newItems[parentId]
        if (parent && parent.type === 'container') {
          newItems[parentId] = {
            ...parent,
            childrenIds: parent.childrenIds.filter(id => id !== contextMenu.itemId)
          }
        }

        // 删除卡片本身
        delete newItems[contextMenu.itemId!]
        return newItems
      })
      console.log('🗑️ [StoragePage] 删除卡片:', contextMenu.itemId)
    }

    setContextMenu({ visible: false, x: 0, y: 0, itemId: null })
  }

  const buildExecutionWorkflowPayload = (workflow: LibraryWorkflow): ExecutionWorkflow => {
    const nodesFromConfig = workflow.config?.nodes
    const fallbackNodes = workflow.nodes
    const nodesSource = (nodesFromConfig && nodesFromConfig.length > 0)
      ? nodesFromConfig
      : (fallbackNodes && fallbackNodes.length > 0)
        ? fallbackNodes
        : DEFAULT_EXECUTION_NODES

    console.log('🏗️ [buildExecutionWorkflowPayload] 原始工作流数据:', {
      workflowName: workflow.name,
      nodesFromConfigCount: nodesFromConfig?.length ?? 0,
      fallbackNodesCount: fallbackNodes?.length ?? 0,
      selectedSource: nodesFromConfig && nodesFromConfig.length > 0 ? 'config.nodes' :
                      fallbackNodes && fallbackNodes.length > 0 ? 'nodes' : 'DEFAULT',
      originalNodes: nodesSource.map((n: any, i) => ({
        index: i,
        id: n.id,
        type: n.type,
        label: n.label,
        hasData: !!n.data,
        hasConfig: !!n.config,
        dataLabel: n.data?.label,
        dataConfig: n.data?.config,
        nodeConfig: n.config,
        dataConfigKeys: n.data?.config ? Object.keys(n.data.config) : [],
        nodeConfigKeys: n.config ? Object.keys(n.config) : []
      }))
    })

    const normalizedNodes = nodesSource.map((node: any, index) => {
      const result = {
        ...node,
        id: node.id || `node-${index + 1}`,
        type: node.type,
        data: node.data ?? {
          label: node.data?.label ?? node.label ?? `节点 ${index + 1}`,
          config: node.data?.config ?? node.config ?? {}
        }
      }

      console.log(`🔄 [buildExecutionWorkflowPayload] 节点 ${index + 1} 规范化:`, {
        original: {
          id: node.id,
          hasData: !!node.data,
          hasConfig: !!node.config,
          label: node.label,
          config: node.config,
          dataConfig: node.data?.config
        },
        normalized: {
          id: result.id,
          dataLabel: result.data.label,
          dataConfig: result.data.config
        }
      })

      return result
    })

    // 为每次执行生成唯一ID
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const payload = {
      id: workflow.id,
      executionId,
      title: workflow.name,
      description: workflow.summary,
      config: {
        ...(workflow.config || {}),
        nodes: normalizedNodes
      }
    }

    console.log('✅ [buildExecutionWorkflowPayload] 最终payload:', {
      title: payload.title,
      nodesCount: payload.config.nodes.length,
      nodes: payload.config.nodes.map((n: any) => ({
        id: n.id,
        dataLabel: n.data?.label,
        dataConfigKeys: n.data?.config ? Object.keys(n.data.config) : []
      }))
    })

    return payload
  }

  // 显示保存确认对话框
  const handleExecutionWorkflowUpdate = useCallback(
    async (updatedWorkflow: ExecutionWorkflow): Promise<void> => {
      // 检查用户是否拥有这个工作流
      const isOwned = createdWorkflows.some((wf) => wf.id === updatedWorkflow.id)

      // 创建一个 Promise 来等待用户的选择
      return new Promise((resolve, reject) => {
        // 保存 resolve 和 reject 函数
        setSavePromiseResolvers({ resolve: resolve as any, reject })

        // 显示确认对话框
        setSaveConfirmDialog({
          visible: true,
          workflow: updatedWorkflow,
          isOwned
        })
      })
    },
    [createdWorkflows]
  )

  // 保存操作的 Promise resolve/reject 函数
  const [savePromiseResolvers, setSavePromiseResolvers] = useState<{
    resolve: ((value: boolean) => void) | null
    reject: ((reason?: any) => void) | null
  }>({ resolve: null, reject: null })

  // 实际执行保存操作
  const handleConfirmSave = async (action: 'update' | 'clone' | 'cancel') => {
    const { workflow: updatedWorkflow, isOwned } = saveConfirmDialog

    if (!updatedWorkflow || action === 'cancel') {
      setSaveConfirmDialog({ visible: false, workflow: null, isOwned: false })
      // 用户取消保存，拒绝 Promise
      if (savePromiseResolvers.reject) {
        savePromiseResolvers.reject(new Error('用户取消保存'))
      }
      setSavePromiseResolvers({ resolve: null, reject: null })
      return
    }

    try {
      if (action === 'update' && isOwned) {
        // 直接更新已有工作流
        await updateWorkflow(updatedWorkflow.id, { config: updatedWorkflow.config })

        setCreatedWorkflows((prev) =>
          prev.map((wf) =>
            wf.id === updatedWorkflow.id
              ? { ...wf, config: updatedWorkflow.config, nodes: updatedWorkflow.config?.nodes }
              : wf
          )
        )

        // 如果这个工作流也在收藏列表中,同步更新
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
        console.log('✅ [StoragePage] 更新已有工作流:', updatedWorkflow.id)
      } else if (action === 'clone') {
        // 创建新工作流
        console.log('📋 [StoragePage] 创建工作流副本...')

        // 检查工作流是否存在于数据库中
        const isLocalExample = !createdWorkflows.some((wf) => wf.id === updatedWorkflow.id) &&
                               !favoriteWorkflows.some((wf) => wf.id === updatedWorkflow.id)

        let newWorkflow: Workflow

        if (isLocalExample) {
          // 对于本地示例工作流,直接创建新的工作流
          console.log('📋 [StoragePage] 本地示例工作流,直接创建...')

          const createdWf = await createWorkflow({
            title: `${updatedWorkflow.title} (我的副本)`,
            description: updatedWorkflow.description || '',
            category: '自定义',
            tags: [],
            config: updatedWorkflow.config,
            isPublic: false
          })

          newWorkflow = createdWf
        } else {
          // 对于数据库中的工作流,使用克隆接口
          console.log('📋 [StoragePage] 数据库工作流,使用克隆接口...')

          const cloneResponse = await cloneWorkflow(
            updatedWorkflow.id,
            `${updatedWorkflow.title} (我的副本)`
          )

          // 从响应中提取工作流对象
          const clonedWorkflow = cloneResponse.workflow

          // 更新克隆工作流的配置
          await updateWorkflow(clonedWorkflow.id, { config: updatedWorkflow.config })

          // 获取更新后的完整工作流数据
          newWorkflow = {
            ...clonedWorkflow,
            config: updatedWorkflow.config,
            nodes: updatedWorkflow.config?.nodes
          }
        }

        // 添加到"我创建的"列表
        setCreatedWorkflows((prev) => [newWorkflow, ...prev])

        // 更新执行面板显示的工作流为新克隆的
        setSelectedWorkflowForExecution({
          ...updatedWorkflow,
          id: newWorkflow.id,
          title: newWorkflow.title
        })

        console.log('✅ [StoragePage] 创建新工作流副本成功:', {
          originalId: updatedWorkflow.id,
          newId: newWorkflow.id,
          title: newWorkflow.title,
          isLocalExample
        })
      }

      setSaveConfirmDialog({ visible: false, workflow: null, isOwned: false })
      // 保存成功，解析 Promise
      if (savePromiseResolvers.resolve) {
        savePromiseResolvers.resolve(true)
      }
      setSavePromiseResolvers({ resolve: null, reject: null })
    } catch (error) {
      console.error('❌ [StoragePage] 保存工作流配置失败:', error)
      alert('保存失败，请重试')
      // 保存失败，拒绝 Promise
      if (savePromiseResolvers.reject) {
        savePromiseResolvers.reject(error)
      }
      setSavePromiseResolvers({ resolve: null, reject: null })
    }
  }

  // === 连接手柄渲染 ===
  const renderConnectionHandles = (itemId: string) => {
    const directions: HandleDirection[] = ['top', 'bottom', 'left', 'right']
    const item = canvasItems[itemId]
    if (!item) return null
    const size = getItemOuterSize(item)
    const isConnecting = connectionState.mode === 'connecting'

    const handlePositions: Record<HandleDirection, React.CSSProperties> = {
      top:    { left: size.width / 2 - HANDLE_RADIUS, top: -HANDLE_RADIUS },
      bottom: { left: size.width / 2 - HANDLE_RADIUS, bottom: -HANDLE_RADIUS },
      left:   { left: -HANDLE_RADIUS, top: size.height / 2 - HANDLE_RADIUS },
      right:  { right: -HANDLE_RADIUS, top: size.height / 2 - HANDLE_RADIUS }
    }

    return directions.map(dir => (
      <div
        key={`handle-${itemId}-${dir}`}
        className={`connection-handle no-pan${isConnecting ? ' connecting-active' : ''}`}
        data-handle-direction={dir}
        data-handle-item={itemId}
        onMouseDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
          handleConnectionStart(e, itemId, dir)
        }}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          handleConnectionClick(e, itemId, dir)
        }}
        style={{
          position: 'absolute',
          ...handlePositions[dir],
          width: HANDLE_RADIUS * 2,
          height: HANDLE_RADIUS * 2,
          borderRadius: '50%',
          background: isConnecting ? '#8b5cf6' : '#94a3b8',
          border: '2px solid white',
          cursor: 'crosshair',
          zIndex: 20,
          opacity: 0,
          transition: 'opacity 0.15s, transform 0.15s, background 0.15s',
          transform: 'scale(0.6)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}
      />
    ))
  }

  const renderWorkflowCard = (card: WorkflowCanvasItem) => {
    const workflow = libraryData.find((item) => item.id === card.workflowId)
    const isDragging = draggingItemId === card.id

    // 状态配置
    const statusConfig = {
      active: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', label: '运行中' },
      draft: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', label: '草稿' },
      paused: { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)', label: '已暂停' }
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
        onContextMenu={(e) => handleContextMenu(e, card.id)}
        onDoubleClick={(e) => {
          e.stopPropagation()
          if (workflow) {
            // 在画布上以标签页形式打开工作流执行界面
            openWorkflowTab(workflow.id, workflow.name || '工作流执行')
          }
        }}
        style={{
          position: 'absolute',
          left: card.position.x,
          top: card.position.y,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: 0,
          border: isDragging ? '1px solid rgba(139, 92, 246, 0.6)' : '1px solid rgba(0, 0, 0, 0.1)',
          background: '#ffffff',
          cursor: 'grab',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          userSelect: 'none',
          // 添加位置过渡动画（拖拽时不应用）
          transition: isDragging ? 'none' : 'left 0.3s ease-out, top 0.3s ease-out, box-shadow 0.2s, transform 0.2s, border 0.2s',
          boxShadow: isDragging
            ? '0 8px 24px rgba(139, 92, 246, 0.15), 0 2px 8px rgba(0, 0, 0, 0.05)'
            : '0 1px 4px rgba(0, 0, 0, 0.04)',
          zIndex: isDragging ? 1000 : 1,
          transform: isDragging ? 'scale(1.02)' : 'scale(1)'
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.35)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.border = '1px solid rgba(0, 0, 0, 0.1)'
            e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.04)'
            e.currentTarget.style.transform = 'translateY(0)'
          }
        }}
      >
        {/* 删除按钮 - 右上角 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDeleteWorkflowCard(card.id)
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            border: 'none',
            background: 'rgba(107, 114, 128, 0.1)',
            color: '#6b7280',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            zIndex: 10,
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#6b7280'
            e.currentTarget.style.color = '#ffffff'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)'
            e.currentTarget.style.color = '#6b7280'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="删除卡片"
        >
          ✕
        </button>

        {/* 标题行 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '2px',
          paddingRight: '28px' // 为删除按钮留出空间
        }}>
          {/* 标题 + 状态标签 */}
          <h3 style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 700,
            lineHeight: 1.3,
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0
            }}>
              {workflow?.name ?? '工作流'}
            </span>
            {/* 状态标签 */}
            <span style={{
              fontSize: '9px',
              color: currentStatus.color,
              backgroundColor: currentStatus.bgColor,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {currentStatus.label}
            </span>
          </h3>
        </div>

        {/* 描述 */}
        <p style={{
          margin: 0,
          fontSize: '11.5px',
          color: '#4b5563',
          lineHeight: 1.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          flex: 1
        }}>
          {workflow?.summary ?? '拖拽自定义的工作流卡片'}
        </p>

        {/* 底部标签和操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
            {(workflow?.tags ?? ['workflow']).slice(0, 2).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '10px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
                  color: '#7c3aed',
                  fontWeight: 600,
                  border: '1px solid rgba(139, 92, 246, 0.2)'
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 执行按钮 - 打开新 Tab */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (workflow) {
                console.log('🎯 [StoragePage] 点击执行按钮，打开工作流 Tab:', workflow.id)
                openWorkflowTab(workflow.id, workflow.name || '工作流执行')
              }
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.25)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.25)'
            }}
          >
            执行 ▶
          </button>
        </div>
        {renderConnectionHandles(card.id)}
      </div>
    )
  }

  const renderToolLinkCard = (card: ToolLinkCanvasItem) => {
    const isDragging = draggingItemId === card.id
    const TOOL_CARD_SIZE = 70  // 正方形尺寸，缩小一半

    return (
      <div
        className="tool-link-card no-pan"
        key={card.id}
        onMouseDown={(event) => handleItemMouseDown(event, card.id)}
        onDoubleClick={(e) => {
          e.stopPropagation()
          window.open(card.url, '_blank')
        }}
        style={{
          position: 'absolute',
          left: card.position.x,
          top: card.position.y,
          width: TOOL_CARD_SIZE,
          height: TOOL_CARD_SIZE,
          borderRadius: '8px',
          background: `
            linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 50%),
            linear-gradient(135deg, #667eea 0%, #764ba2 100%)
          `,
          cursor: 'grab',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          padding: '8px',
          boxShadow: isDragging
            ? `
              inset 0 1px 0 rgba(255, 255, 255, 0.3),
              inset 0 -1px 2px rgba(0, 0, 0, 0.2),
              0 4px 0 0 rgba(103, 126, 234, 0.5),
              0 6px 12px rgba(0, 0, 0, 0.3)
            `
            : `
              inset 0 1px 0 rgba(255, 255, 255, 0.4),
              inset 0 -1px 2px rgba(0, 0, 0, 0.15),
              0 3px 0 0 rgba(103, 126, 234, 0.4),
              0 4px 8px rgba(0, 0, 0, 0.2)
            `,
          transform: isDragging ? 'translateY(1px)' : 'translateY(0)',
          transition: isDragging ? 'none' : 'left 0.3s, top 0.3s, transform 0.2s, box-shadow 0.2s',
          zIndex: isDragging ? 1000 : 1,
          userSelect: 'none',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = `
              inset 0 1px 0 rgba(255, 255, 255, 0.5),
              inset 0 -1px 2px rgba(0, 0, 0, 0.15),
              0 4px 0 0 rgba(103, 126, 234, 0.5),
              0 6px 12px rgba(0, 0, 0, 0.3)
            `
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = `
              inset 0 1px 0 rgba(255, 255, 255, 0.4),
              inset 0 -1px 2px rgba(0, 0, 0, 0.15),
              0 3px 0 0 rgba(103, 126, 234, 0.4),
              0 4px 8px rgba(0, 0, 0, 0.2)
            `
          }
        }}
      >
        {/* 删除按钮 - 右上角 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDeleteToolCard(card.id)
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '16px',
            height: '16px',
            borderRadius: '3px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            zIndex: 10,
            padding: 0,
            opacity: 0.7
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.opacity = '0.7'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="删除工具"
        >
          ✕
        </button>

        {/* Logo - 使用网站favicon */}
        {(() => {
          try {
            const url = new URL(card.url)
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=24`
            return (
              <img
                src={faviconUrl}
                alt={card.name}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  padding: '2px',
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  // 如果favicon加载失败，隐藏图片
                  e.currentTarget.style.display = 'none'
                }}
              />
            )
          } catch {
            // URL解析失败，不显示logo
            return null
          }
        })()}

        {/* 工具名称 */}
        <h3 style={{
          margin: 0,
          fontSize: '10px',
          fontWeight: '700',
          color: 'white',
          textAlign: 'center',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          width: '100%',
          lineHeight: 1.2
        }}>
          {card.name}
        </h3>
        {renderConnectionHandles(card.id)}
      </div>
    )
  }

  // === 连接线渲染 ===
  const computedEdgePaths = useMemo(() => {
    return Object.values(canvasEdges).map(edge => {
      const sourceItem = canvasItems[edge.sourceItemId]
      const targetItem = canvasItems[edge.targetItemId]
      if (!sourceItem || !targetItem) return null
      const start = getHandleAbsolutePosition(canvasItems, edge.sourceItemId, edge.sourceHandle)
      const end = getHandleAbsolutePosition(canvasItems, edge.targetItemId, edge.targetHandle)
      const path = computeBezierPath(start, end, edge.sourceHandle, edge.targetHandle)
      const mid = bezierMidpoint(start, end, edge.sourceHandle, edge.targetHandle)
      return { ...edge, path, start, end, mid }
    }).filter(Boolean)
  }, [canvasItems, canvasEdges])

  const renderEdges = () => {
    return computedEdgePaths.map(edgeData => {
      if (!edgeData) return null
      const isSelected = selectedEdgeId === edgeData.id
      const hasLabel = !!edgeData.label?.trim()
      const labelOff = edgeData.labelOffset || { x: 0, y: 0 }
      const labelX = edgeData.mid.x + labelOff.x
      const labelY = edgeData.mid.y + labelOff.y
      const displayLabel = edgeData.label && edgeData.label.length > 20 ? edgeData.label.slice(0, 20) + '…' : edgeData.label
      return (
        <g key={edgeData.id}>
          {/* 不可见粗 path 用于点击检测 */}
          <path
            d={edgeData.path}
            fill="none"
            stroke="transparent"
            strokeWidth={14}
            style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); setSelectedEdgeId(prev => prev === edgeData.id ? null : edgeData.id) }}
            onDoubleClick={(e) => {
              e.stopPropagation()
              setEditingEdgeLabel({ edgeId: edgeData.id, x: labelX, y: labelY })
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (confirm('删除这条连接线？')) {
                setCanvasEdges(prev => {
                  const next = { ...prev }
                  delete next[edgeData.id]
                  return next
                })
                setSelectedEdgeId(null)
              }
            }}
          />
          {/* 可见细 path */}
          <path
            d={edgeData.path}
            fill="none"
            stroke={isSelected ? '#8b5cf6' : '#94a3b8'}
            strokeWidth={isSelected ? 1.2 : 0.8}
            markerEnd="url(#canvas-arrowhead)"
            style={{ pointerEvents: 'none', transition: 'stroke 0.2s, stroke-width 0.2s' }}
          />
          {/* 备注标签 - 可拖拽 */}
          {hasLabel && (
            <g
              style={{ pointerEvents: 'all', cursor: 'grab' }}
              onMouseDown={(e) => handleLabelDragStart(e, edgeData.id, labelOff)}
              onDoubleClick={(e) => {
                e.stopPropagation()
                setEditingEdgeLabel({ edgeId: edgeData.id, x: labelX, y: labelY })
              }}
            >
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12}
                fill={isSelected ? '#7c3aed' : '#6b7280'}
                fontFamily="system-ui, -apple-system, sans-serif"
                style={{ userSelect: 'none' }}
              >
                {displayLabel}
              </text>
              {/* 底部紫色下划线 */}
              <line
                x1={labelX - (displayLabel!.length * 6.5) / 2}
                y1={labelY + 9}
                x2={labelX + (displayLabel!.length * 6.5) / 2}
                y2={labelY + 9}
                stroke={isSelected ? '#8b5cf6' : '#a78bfa'}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </g>
          )}
          {/* 无备注时选中状态显示"双击添加备注"提示 */}
          {!hasLabel && isSelected && (
            <text
              x={edgeData.mid.x}
              y={edgeData.mid.y - 10}
              textAnchor="middle"
              fontSize={10}
              fill="#a78bfa"
              fontFamily="system-ui, -apple-system, sans-serif"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              双击添加备注
            </text>
          )}
        </g>
      )
    })
  }

  const renderDraftConnection = () => {
    if (connectionState.mode !== 'connecting') return null
    const sourceItem = canvasItems[connectionState.sourceItemId]
    if (!sourceItem) return null
    const start = getHandleAbsolutePosition(canvasItems, connectionState.sourceItemId, connectionState.sourceHandle)
    const end = connectionState.mousePosition
    // 猜测最佳目标方向
    const dx = end.x - start.x
    const dy = end.y - start.y
    let guessDir: HandleDirection = 'left'
    if (Math.abs(dx) > Math.abs(dy)) {
      guessDir = dx > 0 ? 'left' : 'right'
    } else {
      guessDir = dy > 0 ? 'top' : 'bottom'
    }
    const pathD = computeBezierPath(start, end, connectionState.sourceHandle, guessDir)
    return (
      <path
        d={pathD}
        fill="none"
        stroke="#8b5cf6"
        strokeWidth={0.8}
        strokeDasharray="4 3"
        style={{ pointerEvents: 'none' }}
      />
    )
  }

  const renderConnectionsSvg = () => (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'visible'
      }}
    >
      <defs>
        <marker
          id="canvas-arrowhead"
          markerWidth="6"
          markerHeight="4"
          refX="6"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 6 2, 0 4" fill="#94a3b8" />
        </marker>
      </defs>
      {renderEdges()}
      {renderDraftConnection()}
    </svg>
  )

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
      if (item.type === 'tool-link') {
        return renderToolLinkCard(item)
      }
      if (item.type === 'article') {
        return renderArticleCard(item)
      }
      return renderContainer(item)
    })
  }

  const renderArticleCard = (card: ArticleCanvasItem) => {
    const isDragging = draggingItemId === card.id

    return (
      <div
        className="article-card no-pan"
        key={card.id}
        onMouseDown={(event) => handleItemMouseDown(event, card.id)}
        onDoubleClick={(e) => {
          e.stopPropagation()
          window.open(card.url, '_blank')
        }}
        style={{
          position: 'absolute',
          left: card.position.x,
          top: card.position.y,
          width: 220,
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          background: '#ffffff',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          boxShadow: isDragging
            ? '0 8px 16px rgba(0, 0, 0, 0.15)'
            : '0 2px 8px rgba(0, 0, 0, 0.08)',
          transition: isDragging ? 'none' : 'left 0.3s, top 0.3s, box-shadow 0.2s, transform 0.2s',
          zIndex: isDragging ? 1000 : 1,
          userSelect: 'none',
          transform: isDragging ? 'scale(1.02)' : 'scale(1)'
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
            e.currentTarget.style.transform = 'translateY(0)'
          }
        }}
      >
        {/* 删除按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDeleteArticleCard(card.id)
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '18px',
            height: '18px',
            borderRadius: '4px',
            border: 'none',
            background: 'rgba(107, 114, 128, 0.1)',
            color: '#6b7280',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            zIndex: 10,
            padding: 0,
            opacity: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#6b7280'
            e.currentTarget.style.color = '#ffffff'
            e.currentTarget.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)'
            e.currentTarget.style.color = '#6b7280'
            e.currentTarget.style.opacity = '0'
          }}
          title="删除文章卡片"
        >
          ✕
        </button>

        {/* Favicon */}
        <div style={{ flexShrink: 0, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {(() => {
            try {
              const url = new URL(card.url)
              const faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=24`
              return (
                <img
                  src={faviconUrl}
                  alt=""
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none'
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = '<span style="font-size:20px;color:#9ca3af">🌐</span>'
                    }
                  }}
                />
              )
            } catch {
              return <span style={{ fontSize: '20px', color: '#9ca3af' }}>🌐</span>
            }
          })()}
        </div>

        {/* 文字内容 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          minWidth: 0
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#111827',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '160px'
          }}>
            {card.title}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#9ca3af',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '160px'
          }}>
            {card.url}
          </div>
        </div>
        {renderConnectionHandles(card.id)}
      </div>
    )
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
          backgroundColor: '#ffffff',
          border: isDragging ? '1px solid rgba(139, 92, 246, 0.6)' : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: 0,
          overflow: container.collapsed ? 'hidden' : 'visible',
          // 添加位置过渡动画（拖拽时不应用）
          transition: isDragging ? 'none' : 'left 0.3s ease-out, top 0.3s ease-out, border 0.2s, box-shadow 0.2s',
          boxShadow: isDragging
            ? '0 8px 24px rgba(139, 92, 246, 0.15), 0 2px 8px rgba(0, 0, 0, 0.05)'
            : '0 1px 4px rgba(0, 0, 0, 0.04)',
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
            padding: '0 12px',
            cursor: 'grab',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.05) 100%)',
            borderBottom: container.collapsed ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 0
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
                color: '#8b5cf6',
                padding: 0,
                transition: 'color 0.2s'
              }}
              title={container.collapsed ? '展开容器' : '折叠容器'}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#7c3aed'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#8b5cf6'
              }}
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
                  fontWeight: 700,
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              />
            ) : (
              <span
                onDoubleClick={() => handleStartRename(container.id, container.name)}
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  cursor: 'text'
                }}
                title="双击重命名容器"
              >
                {container.name}
              </span>
            )}
            <span style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 600 }}>({container.childrenIds.length})</span>
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
                  color: '#8b5cf6',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  fontWeight: 600
                }}
                title="取出到画布根层"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff'
                  e.currentTarget.style.background = '#8b5cf6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#8b5cf6'
                  e.currentTarget.style.background = 'transparent'
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
                color: '#ef4444',
                padding: '2px 6px',
                borderRadius: '6px',
                transition: 'all 0.2s',
                lineHeight: 1,
                fontWeight: 600
              }}
              title="删除容器"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff'
                e.currentTarget.style.background = '#ef4444'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#ef4444'
                e.currentTarget.style.background = 'transparent'
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

            {/* 右下角调整大小手柄 */}
            <div
              className="no-pan"
              onMouseDown={(event) => handleResizeMouseDown(event, container.id)}
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: '20px',
                height: '20px',
                cursor: 'nwse-resize',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: resizingContainerId === container.id ? 1 : 0.3,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                if (resizingContainerId !== container.id) {
                  e.currentTarget.style.opacity = '0.3'
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M14 10L10 14M14 6L6 14M14 2L2 14"
                  stroke="#8b5cf6"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        )}
        {renderConnectionHandles(container.id)}
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
        /* 连接手柄 - hover 时显示 */
        .workflow-card:hover .connection-handle,
        .tool-link-card:hover .connection-handle,
        .article-card:hover .connection-handle,
        .workflow-container:hover > .connection-handle {
          opacity: 1 !important;
          transform: scale(1) !important;
        }
        .connection-handle:hover {
          opacity: 1 !important;
          transform: scale(1.3) !important;
          background: #8b5cf6 !important;
        }
        .connection-handle.connecting-active {
          opacity: 1 !important;
          transform: scale(1) !important;
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          height: 'calc(100vh - 64px)',
          width: '100%',
          background: 'linear-gradient(to right, #edefff 0%, #f2f3ff 100%)',
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
          // 鼠标离开侧边栏区域时，自动收起（pinned时不收起）
          if (!sidebarCollapsed && !sidebarPinned) {
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
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            padding: '10px 14px',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #f5f3ff 100%)',
            borderRadius: '10px',
            margin: '8px 8px 4px',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.08)'
          }}
          onWheel={(e) => {
            // 冻结AI工作方法库标题区域，阻止滚动事件冒泡
            e.stopPropagation()
            e.preventDefault()
          }}
        >
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>AI工作方法库</h2>
              <button
                onClick={() => {
                  if (sidebarPinned) {
                    setSidebarPinned(false)
                  } else {
                    setSidebarPinned(true)
                  }
                }}
                title={sidebarPinned ? '取消固定' : '固定侧边栏'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: sidebarPinned ? '#f3f0ff' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (!sidebarPinned) e.currentTarget.style.backgroundColor = '#f3f4f6'
                }}
                onMouseLeave={(e) => {
                  if (!sidebarPinned) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {sidebarPinned
                  ? <Pin size={14} color="#8b5cf6" />
                  : <PinOff size={14} color="#9ca3af" />
                }
              </button>
            </div>
          )}
        </div>


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

        <div
          className="workflow-library-list"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '0 8px 12px',
            minHeight: 0,
            display: sidebarCollapsed ? 'none' : 'block'
          }}
          onWheel={(e) => {
            // 允许列表区域滚动，阻止事件冒泡到外层
            e.stopPropagation()
          }}
        >
          {/* AI工作方法库区域 - 使用新的NavigationSidebar组件 */}
          <div style={{ marginTop: '4px' }}>
            <NavigationSidebar
              onWorkflowDragStart={handleLibraryDragStart}
              onWorkflowDragEnd={handleLibraryDragEnd}
              canvasItems={canvasItems}
              libraryData={libraryData}
              embedded={true}
            />
          </div>
        </div>
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
            title="展开AI工作方法库"
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

        {/* Tab 栏 + 画布工具栏 */}
        <div
          className="workspace-tabs-bar"
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: '0 1rem',
            backgroundColor: '#ffffff',
            minHeight: '55px'
          }}
        >
          {/* Tab 列表 */}
          <div className="workspace-tabs-list" style={{ display: 'flex', gap: '2px', paddingTop: '0.5rem', alignItems: 'flex-end' }}>
            {workspaceTabs.map(tab => (
              <div
                key={tab.id}
                className={`workspace-tab ${activeTabId === tab.id ? 'workspace-tab--active' : ''}`}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span className="workspace-tab-icon">
                  {tab.type === 'canvas' ? (
                    <LayoutGrid className="w-4 h-4" />
                  ) : tab.type === 'create' ? (
                    <Plus className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </span>
                <span className="workspace-tab-title">{tab.title}</span>
                {tab.id !== CANVAS_TAB_ID && (
                  <button
                    className="workspace-tab-close"
                    onClick={(e) => closeWorkspaceTab(tab.id, e)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {/* 新增画布按钮 */}
            <button
              onClick={() => openNewCanvasTab()}
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '5px',
                border: 'none',
                background: 'transparent',
                color: '#8b5cf6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '6px',
                position: 'relative' as const,
                top: '-12px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#7c3aed'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#8b5cf6'
              }}
            >
              <Plus className="w-5 h-5" strokeWidth={3} />
            </button>
          </div>

          {/* 工作流操作按钮 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {/* 创建AI工作方法按钮 */}
            <button
              onClick={() => openCreateTab()}
              style={{
                padding: '6px 14px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 3px rgba(139, 92, 246, 0.12), 0 1px 2px rgba(139, 92, 246, 0.24)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.25), 0 2px 4px rgba(139, 92, 246, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(139, 92, 246, 0.12), 0 1px 2px rgba(139, 92, 246, 0.24)'
              }}
            >
              <Plus className="w-4 h-4" />
              <span>创建AI工作方法</span>
            </button>

            {/* AI助手输入框 - 深色紫色霓虹风格 */}
            <div
              style={{
                padding: '6px 6px 6px 16px',
                background: 'linear-gradient(135deg, rgb(26, 26, 46) 0%, rgb(15, 15, 26) 100%)',
                border: '1.5px solid rgb(168, 85, 247)',
                borderRadius: '12px',
                fontSize: '13px',
                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                width: '408px',
                boxShadow: 'rgba(168, 85, 247, 0.4) 0px 0px 10px, rgba(168, 85, 247, 0.2) 0px 0px 20px'
              }}
            >
              <input
                placeholder="不知道怎么开始？跟AI聊聊你想完成的任务吧..."
                className="ai-chat-neon-input"
                type="text"
                value={aiInputMessage}
                onChange={(e) => setAiInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowChatPanel(true)
                  }
                }}
                onFocus={() => setShowChatPanel(true)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'rgb(233, 213, 255)',
                  fontSize: '13px',
                  fontWeight: 400,
                  cursor: 'pointer'
                }}
              />
              <div
                onClick={() => setShowChatPanel(true)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgb(168, 85, 247) 0%, rgb(124, 58, 237) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'rgba(168, 85, 247, 0.5) 0px 0px 10px',
                  cursor: 'pointer',
                  transition: '0.2s',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = 'rgba(168, 85, 247, 0.7) 0px 0px 15px'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'rgba(168, 85, 247, 0.5) 0px 0px 10px'
                }}
              >
                <Send className="w-3.5 h-3.5" style={{ color: 'rgb(255, 255, 255)', transform: 'rotate(-135deg)' }} />
              </div>
            </div>
          </div>

        </div>

        {/* Tab 内容区域 */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* 画布内容 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: activeTab?.type === 'canvas' ? 'flex' : 'none',
              flexDirection: 'column'
            }}
          >
            <div
              className={`workflow-canvas-container${animatingCanvasId === activeTabId ? ' canvas-enter-animation' : ''}`}
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(to right, #edefff 0%, #f2f3ff 100%)',
            touchAction: 'none',
            transform: 'translateZ(0)',
            minHeight: 0,
            minWidth: 0
          }}
          onWheel={(e) => {
            // 阻止画布区域的滚动事件冒泡到页面，防止影响左侧AI工作方法库
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
          {/* 画布右上角悬浮工具栏 */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(0, 0, 0, 0.06)'
            }}
          >
            {/* 缩放控制 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={zoomOut}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="缩小"
              >
                −
              </button>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563', minWidth: '40px', textAlign: 'center' }}>
                {Math.round(currentScale * 100)}%
              </span>
              <button
                type="button"
                onClick={zoomIn}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="放大"
              >
                +
              </button>
              <button
                type="button"
                onClick={resetView}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#8b5cf6',
                  fontWeight: 500
                }}
                title="重置视图"
              >
                重置
              </button>
            </div>

            <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb' }} />

            {/* 操作按钮 */}
            <button
              type="button"
              onClick={handleCreateContainer}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #c4b5fd',
                backgroundColor: '#f5f3ff',
                color: '#5b21b6',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              新建容器
            </button>

            <button
              type="button"
              onClick={() => setShowToolModal(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #fed7aa',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
              title="添加工具链接到画布"
            >
              添加工具
            </button>
            <button
              type="button"
              onClick={() => setShowArticleModal(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #c4b5fd',
                backgroundColor: '#f5f3ff',
                color: '#5b21b6',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              添加文章
            </button>
          </div>

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
              excluded: ['no-pan']
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
                    // 只在点击画布空白处时
                    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-content')) {
                      if (showStepByStepExecution) {
                        setShowStepByStepExecution(false)
                      }
                      // 取消 edge 选中 & 备注编辑
                      setSelectedEdgeId(null)
                      setEditingEdgeLabel(null)
                      // 取消连接状态
                      if (connectionStateRef.current.mode === 'connecting') {
                        window.removeEventListener('mousemove', handleConnectionMouseMove)
                        setConnectionState({ mode: 'idle' })
                        connectionStateRef.current = { mode: 'idle' }
                      }
                    }
                  }}
                >
                  {renderConnectionsSvg()}
                  {/* 连接线备注编辑输入框 */}
                  {editingEdgeLabel && (
                    <div
                      className="no-pan"
                      style={{
                        position: 'absolute',
                        left: editingEdgeLabel.x,
                        top: editingEdgeLabel.y,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 50,
                        pointerEvents: 'all'
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <input
                        autoFocus
                        className="no-pan"
                        defaultValue={canvasEdges[editingEdgeLabel.edgeId]?.label || ''}
                        placeholder="输入备注..."
                        style={{
                          width: '140px',
                          padding: '2px 4px 4px',
                          fontSize: '12px',
                          border: 'none',
                          borderBottom: '2px solid #8b5cf6',
                          borderRadius: 0,
                          outline: 'none',
                          background: 'transparent',
                          textAlign: 'center',
                          color: '#374151',
                          caretColor: '#8b5cf6'
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation()
                          if (e.key === 'Enter') {
                            const value = (e.target as HTMLInputElement).value.trim()
                            const edgeId = editingEdgeLabel.edgeId
                            setCanvasEdges(prev => {
                              if (!prev[edgeId]) return prev
                              return { ...prev, [edgeId]: { ...prev[edgeId], label: value || undefined } }
                            })
                            setEditingEdgeLabel(null)
                          }
                          if (e.key === 'Escape') {
                            setEditingEdgeLabel(null)
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.trim()
                          const edgeId = editingEdgeLabel.edgeId
                          setCanvasEdges(prev => {
                            if (!prev[edgeId]) return prev
                            return { ...prev, [edgeId]: { ...prev[edgeId], label: value || undefined } }
                          })
                          setEditingEdgeLabel(null)
                        }}
                      />
                    </div>
                  )}
                  {renderChildren(ROOT_CONTAINER_ID)}
                </div>
              </div>
            </TransformComponent>
          </TransformWrapper>
          </div>
        </div>

        {/* 工作流执行 Tab 内容 */}
        {workspaceTabs.filter(tab => tab.type === 'workflow').map(tab => (
          <div
            key={tab.id}
            className="execution-tab"
            style={{
              position: 'absolute',
              inset: 0,
              display: activeTabId === tab.id ? 'flex' : 'none',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {tab.workflowId && (() => {
              const localWf = localSavedWorkflows.find(w => w.id === tab.workflowId)
              const libWf = libraryData.find(w => w.id === tab.workflowId)
              const initialData = localWf ? {
                id: localWf.id,
                title: localWf.title,
                description: localWf.description,
                category: localWf.category,
                tags: localWf.tags,
                preparations: localWf.preparations || [],
                config: {
                  edges: (localWf.steps || []).slice(0, -1).map((step: any, i: number) => ({
                    id: `e${i}-${i + 1}`,
                    source: step.id || `step-${i}`,
                    target: (localWf.steps[i + 1]?.id || `step-${i + 1}`)
                  }))
                },
                nodes: (localWf.steps || []).map((step: any, i: number) => {
                  // 构建 guideBlocks（与小红书工作流一致的格式）
                  const guideBlocks: any[] = []
                  let blockIdx = 0
                  if (step.description) {
                    guideBlocks.push({ id: `gb-${i}-${blockIdx++}`, type: 'text', text: step.description })
                  }
                  ;(step.tools || []).forEach((t: any) => {
                    if (t.name?.trim()) {
                      guideBlocks.push({ id: `gb-${i}-${blockIdx++}`, type: 'tool', tool: { name: t.name, url: t.url || '', description: t.description || '' } })
                    }
                  })
                  if (step.prompt?.trim()) {
                    guideBlocks.push({ id: `gb-${i}-${blockIdx++}`, type: 'prompt', prompt: step.prompt })
                  }
                  ;(step.promptResources || []).forEach((p: any) => {
                    if (p.title?.trim()) {
                      guideBlocks.push({ id: `gb-${i}-${blockIdx++}`, type: 'resource', resource: { title: p.title, type: 'link', url: '', description: p.content || '' } })
                    }
                  })
                  ;(step.documentResources || []).forEach((d: any) => {
                    if (d.name?.trim()) {
                      guideBlocks.push({ id: `gb-${i}-${blockIdx++}`, type: 'resource', resource: { title: d.name, type: 'file', url: d.url || '', description: d.description || '' } })
                    }
                  })
                  ;(step.demonstrationMedia || []).forEach((m: any) => {
                    if (m.url?.trim()) {
                      guideBlocks.push({ id: `gb-${i}-${blockIdx++}`, type: 'media', media: { type: m.type || 'image', url: m.url, caption: m.caption || '' } })
                    }
                  })
                  if (step.expectedResult?.trim()) {
                    guideBlocks.push({ id: `gb-${i}-${blockIdx++}`, type: 'text', text: `预期结果：${step.expectedResult}` })
                  }
                  return {
                    id: step.id || `step-${i}`,
                    type: 'step',
                    position: { x: 100 + i * 200, y: 100 },
                    data: { type: 'step', label: step.title || `步骤 ${i + 1}`, config: {} },
                    stepDetail: {
                      id: step.id || `step-${i}`,
                      nodeId: step.id || `step-${i}`,
                      stepDescription: step.description || '',
                      expectedResult: step.expectedResult || '',
                      guideBlocks
                    }
                  }
                })
              } : undefined
              return (
                <WorkflowExecutionTab
                  workflowId={tab.workflowId}
                  initialData={initialData}
                  onClose={() => closeWorkspaceTab(tab.id)}
                />
              )
            })()}
          </div>
        ))}

        {/* 创建工作流 Tab 内容 */}
        {workspaceTabs.filter(tab => tab.type === 'create').map(tab => (
          <div
            key={tab.id}
            className="create-workflow-tab"
            style={{
              position: 'absolute',
              inset: 0,
              display: activeTabId === tab.id ? 'flex' : 'none',
              flexDirection: 'column',
              overflowY: 'auto',
              overflowX: 'hidden',
              backgroundColor: '#edefff',
              touchAction: 'pan-y',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <WorkflowCreatePage />
          </div>
        ))}
      </div>
      </main>

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

      {/* 右键菜单 */}
      {contextMenu.visible && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 10000,
            minWidth: '140px',
            overflow: 'hidden'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCopyItem()
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            📋 制作副本
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteItem()
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#dc2626',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            🗑️ 删除
          </button>
        </div>
      )}

      {/* 保存工作流确认对话框 */}
      {saveConfirmDialog.visible && (
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
            zIndex: 10001
          }}
          onClick={() => handleConfirmSave('cancel')}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: 600,
                color: '#1f2937'
              }}
            >
              {saveConfirmDialog.isOwned ? '保存工作流' : '创建工作流副本'}
            </h3>
            <p
              style={{
                margin: '0 0 24px 0',
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.6'
              }}
            >
              {saveConfirmDialog.isOwned
                ? '您正在修改自己的工作流，请选择保存方式：'
                : '此工作流由他人创建，您无法直接修改。是否创建一个属于您的副本？'}
            </p>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}
            >
              <button
                onClick={() => handleConfirmSave('cancel')}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                取消
              </button>
              {saveConfirmDialog.isOwned && (
                <button
                  onClick={() => handleConfirmSave('update')}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#7c3aed'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#8b5cf6'
                  }}
                >
                  更新现有工作流
                </button>
              )}
              <button
                onClick={() => handleConfirmSave('clone')}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: saveConfirmDialog.isOwned ? '#10b981' : '#8b5cf6',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = saveConfirmDialog.isOwned
                    ? '#059669'
                    : '#7c3aed'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = saveConfirmDialog.isOwned
                    ? '#10b981'
                    : '#8b5cf6'
                }}
              >
                {saveConfirmDialog.isOwned ? '创建新工作流' : '创建我的副本'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 执行历史模态框 */}
      <ExecutionHistoryModal
        isOpen={showExecutionHistoryModal}
        onClose={() => setShowExecutionHistoryModal(false)}
      />

      {/* 工具添加模态框 */}
      {showToolModal && (
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
            zIndex: 10000
          }}
          onClick={() => {
            setShowToolModal(false)
            setToolFormData({
              url: '',
              name: '',
              description: ''
            })
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              minWidth: '420px',
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#1f2937'
            }}>
              添加工具链接
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* URL输入 - 必填 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  工具链接 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="url"
                  value={toolFormData.url}
                  onChange={(e) => setToolFormData({ ...toolFormData, url: e.target.value })}
                  placeholder="https://example.com"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              {/* 工具名称 - 可选 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  工具名称 <span style={{ fontSize: '12px', color: '#9ca3af' }}>(选填，留空自动从URL提取)</span>
                </label>
                <input
                  type="text"
                  value={toolFormData.name}
                  onChange={(e) => setToolFormData({ ...toolFormData, name: e.target.value })}
                  placeholder="例如：ChatGPT、Notion"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              {/* 描述 - 可选 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  描述 <span style={{ fontSize: '12px', color: '#9ca3af' }}>(选填)</span>
                </label>
                <textarea
                  value={toolFormData.description}
                  onChange={(e) => setToolFormData({ ...toolFormData, description: e.target.value })}
                  placeholder="简短描述这个工具的用途"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>

            {/* 按钮 */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '20px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowToolModal(false)
                  setToolFormData({
                    url: '',
                    name: '',
                    description: ''
                  })
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAddTool}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 文章添加模态框 */}
      {showArticleModal && (
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
            zIndex: 10000
          }}
          onClick={() => {
            setShowArticleModal(false)
            setArticleFormData({ url: '', title: '', note: '' })
            setArticleUrlError(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowArticleModal(false)
              setArticleFormData({ url: '', title: '', note: '' })
              setArticleUrlError(false)
            }
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '13px',
              padding: '26px',
              width: '416px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              margin: '0 0 24px 0',
              fontSize: '20px',
              fontWeight: 700,
              color: '#111'
            }}>
              添加参考文章
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 文章链接 - 必填 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#333',
                  marginBottom: '8px'
                }}>
                  文章链接 <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="url"
                  value={articleFormData.url}
                  onChange={(e) => {
                    setArticleFormData({ ...articleFormData, url: e.target.value })
                    if (articleUrlError) setArticleUrlError(false)
                  }}
                  placeholder="https://example.com/article"
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    border: articleUrlError ? '2px solid #EF4444' : '1px solid #D1D5DB',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    if (!articleUrlError) {
                      e.target.style.border = '2px solid #7C3AED'
                      e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)'
                    }
                  }}
                  onBlur={(e) => {
                    if (!articleUrlError) {
                      e.target.style.border = '1px solid #D1D5DB'
                      e.target.style.boxShadow = 'none'
                    }
                  }}
                  autoFocus
                />
                {articleUrlError && (
                  <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#EF4444' }}>请输入文章链接</p>
                )}
              </div>

              {/* 文章标题 - 选填 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#333',
                  marginBottom: '8px'
                }}>
                  文章标题 <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 400 }}>(选填，留空自动从URL提取)</span>
                </label>
                <input
                  type="text"
                  value={articleFormData.title}
                  onChange={(e) => setArticleFormData({ ...articleFormData, title: e.target.value })}
                  placeholder="例如：如何写出爆款小红书笔记"
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '2px solid #7C3AED'
                    e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid #D1D5DB'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* 备注 - 选填 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#333',
                  marginBottom: '8px'
                }}>
                  备注 <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 400 }}>(选填)</span>
                </label>
                <textarea
                  value={articleFormData.note}
                  onChange={(e) => setArticleFormData({ ...articleFormData, note: e.target.value })}
                  placeholder="添加一些备注信息"
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical' as const,
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '2px solid #7C3AED'
                    e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid #D1D5DB'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* 底部按钮 */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '28px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowArticleModal(false)
                  setArticleFormData({ url: '', title: '', note: '' })
                  setArticleUrlError(false)
                }}
                style={{
                  padding: '0 24px',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAddArticle}
                style={{
                  padding: '0 24px',
                  height: '40px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#7C3AED',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#6D28D9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#7C3AED'
                }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {deleteConfirmDialog.visible && (
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
            zIndex: 10000
          }}
          onClick={() => setDeleteConfirmDialog({ visible: false, cardId: null })}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              minWidth: '320px',
              maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#1f2937'
            }}>
              删除工作流卡片
            </h3>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: 1.5
            }}>
              确定要删除这个工作流卡片吗？此操作不会删除工作流本身，您可以随时从AI工作方法库重新添加。
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setDeleteConfirmDialog({ visible: false, cardId: null })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                取消
              </button>
              <button
                onClick={confirmDeleteWorkflowCard}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444'
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat 对话框面板 */}
      <div
        style={{
          position: 'fixed',
          right: '1rem',
          top: 'calc(68px)',
          width: '408px',
          height: 'calc(100% - 80px)',
          transform: showChatPanel ? 'translateX(0)' : 'translateX(calc(100% + 1rem))',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'rgb(255, 255, 255)',
          border: '1px solid rgb(229, 231, 235)',
          borderRadius: '16px',
          zIndex: 1002,
          boxShadow: showChatPanel ? '0 10px 40px rgba(0, 0, 0, 0.15)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Chat 头部 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'linear-gradient(135deg, rgb(26, 26, 46) 0%, rgb(15, 15, 26) 100%)',
            borderBottom: '1px solid rgba(168, 85, 247, 0.3)'
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgb(233, 213, 255)' }}>
            CHAT
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              title="对话历史"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: '0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.2)'
              }}
            >
              <Clock className="w-3.5 h-3.5" style={{ color: 'rgb(196, 181, 253)' }} />
            </button>
            <button
              title="新建对话"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: '0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.2)'
              }}
            >
              <Plus className="w-3.5 h-3.5" style={{ color: 'rgb(196, 181, 253)' }} />
            </button>
            <button
              title="关闭"
              onClick={() => setShowChatPanel(false)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: '0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.2)'
              }}
            >
              <X className="w-3.5 h-3.5" style={{ color: 'rgb(196, 181, 253)' }} />
            </button>
          </div>
        </div>

        {/* Chat 内容 - iframe */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            background: 'rgb(255, 255, 255)',
            borderRadius: '0px 0px 14px 14px'
          }}
        >
          <iframe
            src="/ai-chat?embedded=1"
            title="AI 对话"
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
          />
        </div>
      </div>
    </div>
    </>
  )
}
