/**
 * 拖拽避让系统 - 碰撞检测和避让算法
 */

export type ElementType = 'container' | 'card'

export interface CanvasElement {
  id: string
  type: ElementType
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
}

export interface CollisionInfo {
  element: CanvasElement
  overlap: {
    left: number
    right: number
    top: number
    bottom: number
    area: number
  }
}

/**
 * 检测两个矩形是否碰撞
 */
export function detectCollision(
  element1: CanvasElement,
  element2: CanvasElement
): boolean {
  const rect1 = {
    left: element1.position.x,
    right: element1.position.x + element1.size.width,
    top: element1.position.y,
    bottom: element1.position.y + element1.size.height
  }

  const rect2 = {
    left: element2.position.x,
    right: element2.position.x + element2.size.width,
    top: element2.position.y,
    bottom: element2.position.y + element2.size.height
  }

  return !(
    rect1.right <= rect2.left ||
    rect1.left >= rect2.right ||
    rect1.bottom <= rect2.top ||
    rect1.top >= rect2.bottom
  )
}

/**
 * 计算碰撞重叠区域详情
 */
export function calculateOverlap(
  element1: CanvasElement,
  element2: CanvasElement
): CollisionInfo['overlap'] | null {
  if (!detectCollision(element1, element2)) {
    return null
  }

  const rect1 = {
    left: element1.position.x,
    right: element1.position.x + element1.size.width,
    top: element1.position.y,
    bottom: element1.position.y + element1.size.height
  }

  const rect2 = {
    left: element2.position.x,
    right: element2.position.x + element2.size.width,
    top: element2.position.y,
    bottom: element2.position.y + element2.size.height
  }

  const overlapLeft = Math.max(rect1.left, rect2.left)
  const overlapRight = Math.min(rect1.right, rect2.right)
  const overlapTop = Math.max(rect1.top, rect2.top)
  const overlapBottom = Math.min(rect1.bottom, rect2.bottom)

  const overlapWidth = overlapRight - overlapLeft
  const overlapHeight = overlapBottom - overlapTop

  return {
    left: overlapLeft - rect2.left,
    right: rect2.right - overlapRight,
    top: overlapTop - rect2.top,
    bottom: rect2.bottom - overlapBottom,
    area: overlapWidth * overlapHeight
  }
}

/**
 * 查找所有碰撞的元素
 */
export function findCollisions(
  draggingElement: CanvasElement,
  allElements: CanvasElement[],
  dragType: ElementType
): CollisionInfo[] {
  const collisions: CollisionInfo[] = []

  for (const element of allElements) {
    // 不和自己比较
    if (element.id === draggingElement.id) {
      continue
    }

    // 根据拖拽类型决定哪些元素需要参与碰撞检测
    if (dragType === 'card' && element.type === 'container') {
      // 拖拽卡片时，容器不参与避让
      continue
    }

    if (detectCollision(draggingElement, element)) {
      const overlap = calculateOverlap(draggingElement, element)
      if (overlap) {
        collisions.push({ element, overlap })
      }
    }
  }

  // 按重叠面积排序，面积大的优先避让
  return collisions.sort((a, b) => b.overlap.area - a.overlap.area)
}

/**
 * 计算避让方向和距离
 */
export function calculateAvoidanceDirection(
  collision: CollisionInfo
): { direction: 'left' | 'right' | 'top' | 'bottom'; distance: number } {
  const { overlap } = collision

  // 找到重叠最小的方向进行避让
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

  // 计算需要移动的距离（加上一点间隙）
  const gap = 20
  const moveDistance = minDistance + gap

  return { direction: minDirection, distance: moveDistance }
}

/**
 * 计算避让后的新位置
 */
export function calculateAvoidancePosition(
  element: CanvasElement,
  draggingElement: CanvasElement,
  canvasSize: { width: number; height: number }
): { x: number; y: number } {
  const collision = calculateOverlap(draggingElement, element)
  if (!collision) {
    return element.position
  }

  const { direction, distance } = calculateAvoidanceDirection({ element, overlap: collision })

  let newX = element.position.x
  let newY = element.position.y

  switch (direction) {
    case 'left':
      newX = Math.max(0, element.position.x - distance)
      break
    case 'right':
      newX = Math.min(
        canvasSize.width - element.size.width,
        element.position.x + distance
      )
      break
    case 'top':
      newY = Math.max(0, element.position.y - distance)
      break
    case 'bottom':
      newY = Math.min(
        canvasSize.height - element.size.height,
        element.position.y + distance
      )
      break
  }

  return { x: newX, y: newY }
}

/**
 * 批量计算所有需要避让的元素的新位置
 */
export function calculateAllAvoidancePositions(
  draggingElement: CanvasElement,
  allElements: CanvasElement[],
  canvasSize: { width: number; height: number }
): Map<string, { x: number; y: number }> {
  const newPositions = new Map<string, { x: number; y: number }>()

  // 查找所有碰撞
  const collisions = findCollisions(draggingElement, allElements, draggingElement.type)

  // 为每个碰撞的元素计算新位置
  for (const collision of collisions) {
    const newPos = calculateAvoidancePosition(
      collision.element,
      draggingElement,
      canvasSize
    )
    newPositions.set(collision.element.id, newPos)
  }

  return newPositions
}

/**
 * 智能避让 - 考虑连锁反应
 * 当一个元素被推开后，检查它是否又和其他元素碰撞
 */
export function calculateSmartAvoidance(
  draggingElement: CanvasElement,
  allElements: CanvasElement[],
  canvasSize: { width: number; height: number },
  maxIterations: number = 3
): Map<string, { x: number; y: number }> {
  const newPositions = new Map<string, { x: number; y: number }>()
  let currentElements = [...allElements]
  let iteration = 0

  while (iteration < maxIterations) {
    const avoidancePositions = calculateAllAvoidancePositions(
      draggingElement,
      currentElements,
      canvasSize
    )

    // 如果没有任何元素需要避让，结束循环
    if (avoidancePositions.size === 0) {
      break
    }

    // 更新位置
    for (const [id, pos] of avoidancePositions) {
      newPositions.set(id, pos)
    }

    // 更新元素位置用于下一轮检测
    currentElements = currentElements.map(el => {
      const newPos = avoidancePositions.get(el.id)
      if (newPos) {
        return { ...el, position: newPos }
      }
      return el
    })

    iteration++
  }

  return newPositions
}

/**
 * 检测元素是否在画布范围内
 */
export function isWithinCanvas(
  element: CanvasElement,
  canvasSize: { width: number; height: number }
): boolean {
  return (
    element.position.x >= 0 &&
    element.position.y >= 0 &&
    element.position.x + element.size.width <= canvasSize.width &&
    element.position.y + element.size.height <= canvasSize.height
  )
}

/**
 * 限制元素位置在画布范围内
 */
export function constrainToCanvas(
  position: { x: number; y: number },
  size: { width: number; height: number },
  canvasSize: { width: number; height: number }
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(position.x, canvasSize.width - size.width)),
    y: Math.max(0, Math.min(position.y, canvasSize.height - size.height))
  }
}
