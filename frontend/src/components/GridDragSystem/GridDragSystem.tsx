import { useState, useRef, useCallback, useEffect, CSSProperties } from 'react'

// 元素类型：卡片或容器
export type ElementType = 'card' | 'container'

// 网格元素配置
export interface GridElement {
  id: string
  type: ElementType
  // 网格占用：卡片通常是1x1，容器可以是2x2或更大
  gridSize: {
    width: number  // 占用的列数
    height: number // 占用的行数
  }
  // 网格位置（基于网格索引，不是像素）
  gridPosition: {
    row: number
    col: number
  }
  // 自定义内容
  content: React.ReactNode
  // 自定义样式
  style?: CSSProperties
}

interface GridDragSystemProps {
  elements: GridElement[]
  onElementsChange: (elements: GridElement[]) => void
  // 网格配置
  gridConfig?: {
    columns: number      // 列数
    cellWidth: number    // 单元格宽度（px）
    cellHeight: number   // 单元格高度（px）
    gap: number         // 间距（px）
  }
  // 容器样式
  containerStyle?: CSSProperties
}

export default function GridDragSystem({
  elements,
  onElementsChange,
  gridConfig = {
    columns: 6,
    cellWidth: 160,
    cellHeight: 140,
    gap: 20
  },
  containerStyle
}: GridDragSystemProps) {
  const [draggingElement, setDraggingElement] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [hoveredGridPosition, setHoveredGridPosition] = useState<{ row: number; col: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // 计算网格占用情况
  const calculateOccupiedCells = useCallback((excludeId?: string) => {
    const occupied = new Set<string>()

    elements.forEach(element => {
      if (element.id === excludeId) return

      const { row, col } = element.gridPosition
      const { width, height } = element.gridSize

      for (let r = row; r < row + height; r++) {
        for (let c = col; c < col + width; c++) {
          occupied.add(`${r}-${c}`)
        }
      }
    })

    return occupied
  }, [elements])

  // 检查位置是否可用
  const isPositionAvailable = useCallback((
    row: number,
    col: number,
    width: number,
    height: number,
    excludeId?: string
  ) => {
    // 检查是否超出边界
    if (col < 0 || col + width > gridConfig.columns) return false
    if (row < 0) return false

    const occupied = calculateOccupiedCells(excludeId)

    // 检查每个单元格是否被占用
    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        if (occupied.has(`${r}-${c}`)) return false
      }
    }

    return true
  }, [gridConfig.columns, calculateOccupiedCells])

  // 找到最近的可用位置
  const findNearestAvailablePosition = useCallback((
    targetRow: number,
    targetCol: number,
    width: number,
    height: number,
    excludeId?: string
  ): { row: number; col: number } => {
    // 先检查目标位置
    if (isPositionAvailable(targetRow, targetCol, width, height, excludeId)) {
      return { row: targetRow, col: targetCol }
    }

    // 螺旋搜索最近的可用位置
    const maxSearchRadius = 20
    for (let radius = 1; radius <= maxSearchRadius; radius++) {
      // 在当前半径的所有位置中搜索
      for (let r = targetRow - radius; r <= targetRow + radius; r++) {
        for (let c = targetCol - radius; c <= targetCol + radius; c++) {
          if (isPositionAvailable(r, c, width, height, excludeId)) {
            return { row: Math.max(0, r), col: Math.max(0, c) }
          }
        }
      }
    }

    // 如果找不到，返回一个靠右下角的位置
    let row = 0
    let col = 0
    while (!isPositionAvailable(row, col, width, height, excludeId)) {
      col++
      if (col + width > gridConfig.columns) {
        col = 0
        row++
      }
    }

    return { row, col }
  }, [isPositionAvailable, gridConfig.columns])

  // 重新排列所有元素
  const rearrangeElements = useCallback((
    movingElementId: string,
    newRow: number,
    newCol: number
  ) => {
    const movingElement = elements.find(e => e.id === movingElementId)
    if (!movingElement) return elements

    const newElements = [...elements]
    const movingIndex = newElements.findIndex(e => e.id === movingElementId)

    // 更新移动元素的位置
    newElements[movingIndex] = {
      ...movingElement,
      gridPosition: { row: newRow, col: newCol }
    }

    // 检查其他元素是否需要移动
    const movedElement = newElements[movingIndex]
    const affectedElements: GridElement[] = []

    // 找出被影响的元素（与移动元素重叠的）
    newElements.forEach((element, index) => {
      if (index === movingIndex) return

      const isOverlapping = !(
        element.gridPosition.col + element.gridSize.width <= movedElement.gridPosition.col ||
        element.gridPosition.col >= movedElement.gridPosition.col + movedElement.gridSize.width ||
        element.gridPosition.row + element.gridSize.height <= movedElement.gridPosition.row ||
        element.gridPosition.row >= movedElement.gridPosition.row + movedElement.gridSize.height
      )

      if (isOverlapping) {
        affectedElements.push(element)
      }
    })

    // 为被影响的元素找新位置
    affectedElements.forEach(affectedElement => {
      const index = newElements.findIndex(e => e.id === affectedElement.id)
      const newPosition = findNearestAvailablePosition(
        affectedElement.gridPosition.row,
        affectedElement.gridPosition.col,
        affectedElement.gridSize.width,
        affectedElement.gridSize.height,
        affectedElement.id
      )

      newElements[index] = {
        ...affectedElement,
        gridPosition: newPosition
      }
    })

    return newElements
  }, [elements, findNearestAvailablePosition])

  // 鼠标按下开始拖拽
  const handleMouseDown = useCallback((elementId: string, e: React.MouseEvent) => {
    e.preventDefault()

    const element = elements.find(el => el.id === elementId)
    if (!element) return

    setDraggingElement(elementId)

    // 计算拖拽偏移量
    const elementDiv = e.currentTarget as HTMLDivElement
    const rect = elementDiv.getBoundingClientRect()

    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })

    setDragPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    })
  }, [elements, dragOffset])

  // 鼠标移动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingElement || !containerRef.current) return

      const element = elements.find(el => el.id === draggingElement)
      if (!element) return

      // 更新拖拽位置
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      setDragPosition({ x: newX, y: newY })

      // 计算鼠标相对于容器的位置
      const containerRect = containerRef.current.getBoundingClientRect()
      const relativeX = e.clientX - containerRect.left
      const relativeY = e.clientY - containerRect.top

      // 转换为网格坐标
      const col = Math.max(0, Math.min(
        Math.floor(relativeX / (gridConfig.cellWidth + gridConfig.gap)),
        gridConfig.columns - element.gridSize.width
      ))
      const row = Math.max(0, Math.floor(relativeY / (gridConfig.cellHeight + gridConfig.gap)))

      setHoveredGridPosition({ row, col })
    }

    const handleMouseUp = () => {
      if (draggingElement && hoveredGridPosition) {
        const element = elements.find(el => el.id === draggingElement)
        if (element) {
          // 检查目标位置是否可用
          if (isPositionAvailable(
            hoveredGridPosition.row,
            hoveredGridPosition.col,
            element.gridSize.width,
            element.gridSize.height,
            draggingElement
          )) {
            // 位置可用，直接移动
            const newElements = rearrangeElements(
              draggingElement,
              hoveredGridPosition.row,
              hoveredGridPosition.col
            )
            onElementsChange(newElements)
          } else {
            // 位置不可用，找最近的可用位置
            const nearestPosition = findNearestAvailablePosition(
              hoveredGridPosition.row,
              hoveredGridPosition.col,
              element.gridSize.width,
              element.gridSize.height,
              draggingElement
            )
            const newElements = rearrangeElements(
              draggingElement,
              nearestPosition.row,
              nearestPosition.col
            )
            onElementsChange(newElements)
          }
        }
      }

      setDraggingElement(null)
      setHoveredGridPosition(null)
    }

    if (draggingElement) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [
    draggingElement,
    dragOffset,
    elements,
    gridConfig,
    hoveredGridPosition,
    isPositionAvailable,
    findNearestAvailablePosition,
    rearrangeElements,
    onElementsChange
  ])

  // 渲染占位符（显示拖拽目标位置）
  const renderPlaceholder = () => {
    if (!draggingElement || !hoveredGridPosition) return null

    const element = elements.find(el => el.id === draggingElement)
    if (!element) return null

    const { row, col } = hoveredGridPosition
    const { width, height } = element.gridSize

    // 检查位置是否可用
    const available = isPositionAvailable(row, col, width, height, draggingElement)

    return (
      <div
        style={{
          position: 'absolute',
          left: col * (gridConfig.cellWidth + gridConfig.gap),
          top: row * (gridConfig.cellHeight + gridConfig.gap),
          width: width * gridConfig.cellWidth + (width - 1) * gridConfig.gap,
          height: height * gridConfig.cellHeight + (height - 1) * gridConfig.gap,
          border: `2px dashed ${available ? '#8b5cf6' : '#ef4444'}`,
          backgroundColor: available ? 'rgba(139, 92, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderRadius: '12px',
          pointerEvents: 'none',
          transition: 'all 0.2s ease',
          zIndex: 999
        }}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: gridConfig.columns * (gridConfig.cellWidth + gridConfig.gap),
        minHeight: '100vh',
        margin: '0 auto',
        padding: '20px',
        ...containerStyle
      }}
    >
      {/* 渲染占位符 */}
      {renderPlaceholder()}

      {/* 渲染所有元素 */}
      {elements.map(element => {
        const isDragging = element.id === draggingElement
        const { row, col } = element.gridPosition
        const { width, height } = element.gridSize

        const elementStyle: CSSProperties = {
          position: 'absolute',
          left: isDragging ? dragPosition.x : col * (gridConfig.cellWidth + gridConfig.gap),
          top: isDragging ? dragPosition.y : row * (gridConfig.cellHeight + gridConfig.gap),
          width: width * gridConfig.cellWidth + (width - 1) * gridConfig.gap,
          height: height * gridConfig.cellHeight + (height - 1) * gridConfig.gap,
          transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: isDragging ? 1000 : 1,
          opacity: isDragging ? 0.8 : 1,
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          boxShadow: isDragging
            ? '0 20px 60px rgba(0, 0, 0, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)',
          ...element.style
        }

        return (
          <div
            key={element.id}
            style={elementStyle}
            onMouseDown={(e) => handleMouseDown(element.id, e)}
          >
            {element.content}
          </div>
        )
      })}
    </div>
  )
}
