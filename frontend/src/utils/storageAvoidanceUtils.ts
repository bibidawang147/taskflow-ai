/**
 * StoragePage 专用的拖拽避让工具
 * 适配 StoragePage 的数据结构和业务逻辑
 */

type Position = {
  x: number
  y: number
}

type Rect = {
  x: number
  y: number
  width: number
  height: number
}

type CanvasItemType = 'workflow' | 'ai-tool' | 'tool-link' | 'article' | 'container'

interface CanvasItemBase {
  id: string
  type: CanvasItemType
  parentId: string
  position: Position
}

interface WorkflowCanvasItem extends CanvasItemBase {
  type: 'workflow'
  workflowId: string
}

interface AIToolCanvasItem extends CanvasItemBase {
  type: 'ai-tool'
  toolId: string
}

interface ToolLinkCanvasItem extends CanvasItemBase {
  type: 'tool-link'
  name: string
  url: string
  logo?: string
  badge?: string
  description?: string
  category?: string
}

interface ArticleCanvasItem extends CanvasItemBase {
  type: 'article'
  url: string
  title: string
  note?: string
}

interface ContainerCanvasItem extends CanvasItemBase {
  type: 'container'
  name: string
  size: { width: number; height: number }
  collapsed: boolean
  childrenIds: string[]
  color: string
}

type CanvasItem = WorkflowCanvasItem | AIToolCanvasItem | ToolLinkCanvasItem | ArticleCanvasItem | ContainerCanvasItem

type CanvasItemsMap = Record<string, CanvasItem>

/**
 * 检测两个矩形是否重叠
 */
export function doRectsOverlap(rect1: Rect, rect2: Rect): boolean {
  return !(
    rect1.x + rect1.width <= rect2.x ||
    rect1.x >= rect2.x + rect2.width ||
    rect1.y + rect1.height <= rect2.y ||
    rect1.y >= rect2.y + rect2.height
  )
}

/**
 * 获取元素的外部尺寸
 */
export function getItemSize(item: CanvasItem): { width: number; height: number } {
  if (item.type === 'container') {
    return item.size
  }
  // workflow、ai-tool 和 tool-link 卡片的固定尺寸
  return { width: 220, height: 140 }
}

/**
 * 计算重叠区域
 */
export function calculateOverlap(rect1: Rect, rect2: Rect): {
  left: number
  right: number
  top: number
  bottom: number
  area: number
} | null {
  if (!doRectsOverlap(rect1, rect2)) {
    return null
  }

  const overlapLeft = Math.max(rect1.x, rect2.x)
  const overlapRight = Math.min(rect1.x + rect1.width, rect2.x + rect2.width)
  const overlapTop = Math.max(rect1.y, rect2.y)
  const overlapBottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height)

  const overlapWidth = overlapRight - overlapLeft
  const overlapHeight = overlapBottom - overlapTop

  return {
    left: overlapLeft - rect2.x,
    right: rect2.x + rect2.width - overlapRight,
    top: overlapTop - rect2.y,
    bottom: rect2.y + rect2.height - overlapBottom,
    area: overlapWidth * overlapHeight
  }
}

/**
 * 计算避让方向和距离
 */
export function calculateAvoidanceDirection(overlap: {
  left: number
  right: number
  top: number
  bottom: number
}): { direction: 'left' | 'right' | 'top' | 'bottom'; distance: number } {
  const distances = {
    left: overlap.left,
    right: overlap.right,
    top: overlap.top,
    bottom: overlap.bottom
  }

  let minDirection: 'left' | 'right' | 'top' | 'bottom' = 'right'
  let minDistance = Infinity

  for (const [dir, dist] of Object.entries(distances)) {
    if (dist < minDistance) {
      minDistance = dist
      minDirection = dir as typeof minDirection
    }
  }

  const gap = 20
  return { direction: minDirection, distance: minDistance + gap }
}

/**
 * 检查元素是否应该避让
 * @param draggingItem 正在拖拽的元素
 * @param item 待检查的元素
 * @returns 是否需要避让
 */
export function shouldAvoid(
  draggingItem: CanvasItem,
  item: CanvasItem
): boolean {
  // 不和自己比较
  if (draggingItem.id === item.id) {
    return false
  }

  // 必须在同一个父容器中
  if (draggingItem.parentId !== item.parentId) {
    return false
  }

  // 拖拽容器时：所有同级元素都避让
  if (draggingItem.type === 'container') {
    return true
  }

  // 拖拽卡片时：只有卡片避让，容器不动
  if (draggingItem.type === 'workflow' || draggingItem.type === 'ai-tool') {
    return item.type === 'workflow' || item.type === 'ai-tool'
  }

  return false
}

/**
 * 计算实时避让位置（改进版 - 支持恢复原位）
 * @param items 所有画布元素
 * @param draggingItemId 正在拖拽的元素ID
 * @param originalPositions 元素的原始位置映射
 * @returns 需要更新位置的元素映射 {itemId: newPosition | 'restore'}
 */
export function calculateRealTimeAvoidance(
  items: CanvasItemsMap,
  draggingItemId: string,
  originalPositions?: Record<string, Position>
): Record<string, Position | 'restore'> {
  const draggingItem = items[draggingItemId]
  if (!draggingItem) {
    return {}
  }

  const newPositions: Record<string, Position | 'restore'> = {}
  const gap = 20 // 最小间隙

  // 获取拖拽元素的矩形
  const draggingSize = getItemSize(draggingItem)
  const draggingRect: Rect = {
    x: draggingItem.position.x,
    y: draggingItem.position.y,
    width: draggingSize.width,
    height: draggingSize.height
  }

  // 按重叠面积排序，先处理重叠最多的元素
  const collisions: Array<{
    itemId: string
    item: CanvasItem
    overlap: ReturnType<typeof calculateOverlap>
  }> = []

  // 收集所有可能需要处理的元素
  const candidateItems = new Set<string>()

  // 检查所有元素
  for (const [itemId, item] of Object.entries(items)) {
    // 检查是否应该避让
    if (!shouldAvoid(draggingItem, item)) {
      continue
    }

    candidateItems.add(itemId)

    // 获取元素的矩形
    const itemSize = getItemSize(item)
    const itemRect: Rect = {
      x: item.position.x,
      y: item.position.y,
      width: itemSize.width,
      height: itemSize.height
    }

    // 检查是否碰撞
    const overlap = calculateOverlap(draggingRect, itemRect)
    if (overlap) {
      collisions.push({ itemId, item, overlap })
    }
  }

  // 按重叠面积从大到小排序
  collisions.sort((a, b) => (b.overlap?.area || 0) - (a.overlap?.area || 0))

  // 处理每个碰撞 - 应用避让
  const collidingIds = new Set<string>()
  for (const { itemId, item, overlap } of collisions) {
    if (!overlap) continue

    collidingIds.add(itemId)

    // 计算避让方向和距离
    const { direction, distance } = calculateAvoidanceDirection(overlap)

    // 计算新位置
    let newX = item.position.x
    let newY = item.position.y

    switch (direction) {
      case 'left':
        newX = Math.max(gap, item.position.x - distance)
        break
      case 'right':
        newX = item.position.x + distance
        break
      case 'top':
        newY = Math.max(gap, item.position.y - distance)
        break
      case 'bottom':
        newY = item.position.y + distance
        break
    }

    newPositions[itemId] = { x: newX, y: newY }
  }

  // 处理不再碰撞的元素 - 恢复原位
  if (originalPositions) {
    for (const itemId of candidateItems) {
      if (!collidingIds.has(itemId) && originalPositions[itemId]) {
        // 如果有原始位置且不再碰撞，标记为恢复
        newPositions[itemId] = 'restore'
      }
    }
  }

  return newPositions
}

/**
 * 智能避让 - 考虑连锁反应和恢复原位
 * @param items 所有画布元素
 * @param draggingItemId 正在拖拽的元素ID
 * @param originalPositions 元素的原始位置映射
 * @param maxIterations 最大迭代次数
 * @returns 需要更新位置的元素映射 {itemId: newPosition | 'restore'}
 */
export function calculateSmartAvoidance(
  items: CanvasItemsMap,
  draggingItemId: string,
  originalPositions?: Record<string, Position>,
  maxIterations: number = 2
): Record<string, Position | 'restore'> {
  let currentItems = { ...items }
  const allNewPositions: Record<string, Position | 'restore'> = {}

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const newPositions = calculateRealTimeAvoidance(currentItems, draggingItemId, originalPositions)

    // 如果没有新的变化，结束循环
    if (Object.keys(newPositions).length === 0) {
      break
    }

    // 合并到总结果中
    for (const [itemId, newPos] of Object.entries(newPositions)) {
      allNewPositions[itemId] = newPos
    }

    // 更新当前元素位置用于下一轮检测
    for (const [itemId, newPos] of Object.entries(newPositions)) {
      if (newPos !== 'restore') {
        currentItems[itemId] = {
          ...currentItems[itemId],
          position: newPos
        }
      } else if (originalPositions?.[itemId]) {
        // 恢复原位
        currentItems[itemId] = {
          ...currentItems[itemId],
          position: originalPositions[itemId]
        }
      }
    }
  }

  return allNewPositions
}

/**
 * 容器扩大时调整同级元素位置，避免重叠
 * @param items 所有画布元素
 * @param changedContainerIds 尺寸发生变化的容器ID列表
 * @returns 需要更新位置的元素映射 {itemId: newPosition}
 */
export function adjustOverlappingItemsAfterResize(
  items: CanvasItemsMap,
  changedContainerIds: string[]
): Record<string, Position> {
  const newPositions: Record<string, Position> = {}

  // 对每个尺寸变化的容器进行处理
  for (const containerId of changedContainerIds) {
    const container = items[containerId]
    if (!container || container.type !== 'container') {
      continue
    }

    // 获取容器的矩形区域
    const containerSize = getItemSize(container)
    const containerRect: Rect = {
      x: container.position.x,
      y: container.position.y,
      width: containerSize.width,
      height: containerSize.height
    }

    // 找出所有与此容器在同一父容器的元素
    const siblings = Object.values(items).filter(
      (item) => item.parentId === container.parentId && item.id !== containerId
    )

    // 检测并调整每个同级元素
    for (const sibling of siblings) {
      // 跳过已经处理过的元素
      if (newPositions[sibling.id]) {
        continue
      }

      const siblingSize = getItemSize(sibling)
      const siblingRect: Rect = {
        x: newPositions[sibling.id]?.x ?? sibling.position.x,
        y: newPositions[sibling.id]?.y ?? sibling.position.y,
        width: siblingSize.width,
        height: siblingSize.height
      }

      // 检查是否重叠
      const overlap = calculateOverlap(containerRect, siblingRect)
      if (overlap) {
        // 计算需要移动的方向和距离
        const { direction, distance } = calculateAvoidanceDirection(overlap)

        let newX = sibling.position.x
        let newY = sibling.position.y

        // 根据方向调整位置
        switch (direction) {
          case 'left':
            newX = Math.max(20, containerRect.x - siblingSize.width - 20)
            break
          case 'right':
            newX = containerRect.x + containerRect.width + 20
            break
          case 'top':
            newY = Math.max(20, containerRect.y - siblingSize.height - 20)
            break
          case 'bottom':
            newY = containerRect.y + containerRect.height + 20
            break
        }

        newPositions[sibling.id] = { x: newX, y: newY }
      }
    }
  }

  return newPositions
}
