import { useMemo } from 'react'
import { CheckCircle2, Circle, CircleDot } from 'lucide-react'
import type { WorkflowNode, WorkflowEdge } from '../../types/workflow'

interface WorkflowOverviewChartProps {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  activeNodeId?: string | null
  completedNodeIds?: Set<string>
  onNodeClick?: (nodeId: string) => void
}

interface PositionedNode {
  node: WorkflowNode
  x: number
  y: number
  column: number
  row: number
}

export default function WorkflowOverviewChart({
  nodes,
  edges,
  activeNodeId,
  completedNodeIds = new Set(),
  onNodeClick
}: WorkflowOverviewChartProps) {
  // 显示步骤节点（step 类型，或其他可执行节点）
  const stepNodes = useMemo(() => {
    const steps = nodes.filter(n => n.type === 'step')
    if (steps.length > 0) return steps
    // 兼容旧数据
    return nodes.filter(n => ['ai', 'llm', 'tool', 'condition'].includes(n.type))
  }, [nodes])

  // 计算节点位置 - 简单的横向布局
  const { positionedNodes, width, height } = useMemo(() => {
    const nodeWidth = 160
    const nodeHeight = 48
    const gapX = 80
    const gapY = 60
    const paddingX = 40
    const paddingY = 30

    // 构建邻接表
    const adjacencyList = new Map<string, string[]>()
    const inDegree = new Map<string, number>()

    stepNodes.forEach(node => {
      adjacencyList.set(node.id, [])
      inDegree.set(node.id, 0)
    })

    edges.forEach(edge => {
      const from = edge.source
      const to = edge.target
      if (adjacencyList.has(from) && adjacencyList.has(to)) {
        adjacencyList.get(from)!.push(to)
        inDegree.set(to, (inDegree.get(to) || 0) + 1)
      }
    })

    // 拓扑排序确定列位置
    const queue: string[] = []
    const columnMap = new Map<string, number>()
    const rowMap = new Map<string, number>()

    stepNodes.forEach(node => {
      if (inDegree.get(node.id) === 0) {
        queue.push(node.id)
        columnMap.set(node.id, 0)
      }
    })

    // 跟踪每列的行数
    const columnRowCount = new Map<number, number>()

    while (queue.length > 0) {
      const current = queue.shift()!
      const currentCol = columnMap.get(current) || 0

      // 分配行
      const rowInColumn = columnRowCount.get(currentCol) || 0
      rowMap.set(current, rowInColumn)
      columnRowCount.set(currentCol, rowInColumn + 1)

      const neighbors = adjacencyList.get(current) || []
      neighbors.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 1) - 1
        inDegree.set(neighbor, newDegree)

        const existingCol = columnMap.get(neighbor) || 0
        columnMap.set(neighbor, Math.max(existingCol, currentCol + 1))

        if (newDegree === 0) {
          queue.push(neighbor)
        }
      })
    }

    // 处理未连接的节点
    let nextColumn = Math.max(...Array.from(columnMap.values()), -1) + 1
    stepNodes.forEach((node, index) => {
      if (!columnMap.has(node.id)) {
        columnMap.set(node.id, nextColumn)
        rowMap.set(node.id, 0)
        nextColumn++
      }
    })

    // 计算实际位置
    const maxColumn = Math.max(...Array.from(columnMap.values()), 0)
    const maxRow = Math.max(...Array.from(rowMap.values()), 0)

    const positioned: PositionedNode[] = stepNodes.map(node => ({
      node,
      column: columnMap.get(node.id) || 0,
      row: rowMap.get(node.id) || 0,
      x: paddingX + (columnMap.get(node.id) || 0) * (nodeWidth + gapX),
      y: paddingY + (rowMap.get(node.id) || 0) * (nodeHeight + gapY)
    }))

    return {
      positionedNodes: positioned,
      width: paddingX * 2 + (maxColumn + 1) * nodeWidth + maxColumn * gapX,
      height: paddingY * 2 + (maxRow + 1) * nodeHeight + maxRow * gapY
    }
  }, [stepNodes, edges])

  // 绘制连接线
  const renderEdges = () => {
    const nodePositions = new Map<string, PositionedNode>()
    positionedNodes.forEach(pn => nodePositions.set(pn.node.id, pn))

    return edges.map((edge, index) => {
      const from = nodePositions.get(edge.source)
      const to = nodePositions.get(edge.target)
      if (!from || !to) return null

      const nodeWidth = 160
      const nodeHeight = 48

      const x1 = from.x + nodeWidth
      const y1 = from.y + nodeHeight / 2
      const x2 = to.x
      const y2 = to.y + nodeHeight / 2

      // 贝塞尔曲线控制点
      const midX = (x1 + x2) / 2
      const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`

      const isCompleted = completedNodeIds.has(edge.source) && completedNodeIds.has(edge.target)
      const isActive = edge.source === activeNodeId || edge.target === activeNodeId

      return (
        <path
          key={`${edge.source}-${edge.target}-${index}`}
          d={path}
          fill="none"
          stroke={isCompleted ? '#10b981' : isActive ? '#3b82f6' : '#d1d5db'}
          strokeWidth={isActive ? 2.5 : 2}
          strokeDasharray={isCompleted || isActive ? 'none' : '4 2'}
          markerEnd={`url(#arrow-${isCompleted ? 'completed' : isActive ? 'active' : 'default'})`}
        />
      )
    })
  }

  // 渲染节点
  const renderNodes = () => {
    const nodeWidth = 160
    const nodeHeight = 48
    const borderRadius = 8

    return positionedNodes.map(({ node, x, y }) => {
      const isCompleted = completedNodeIds.has(node.id)
      const isActive = node.id === activeNodeId
      const isPending = !isCompleted && !isActive

      let bgClass = 'fill-white'
      let borderClass = 'stroke-gray-200'
      let textClass = 'fill-gray-700'
      let iconColor = '#9ca3af'

      if (isCompleted) {
        bgClass = 'fill-emerald-50'
        borderClass = 'stroke-emerald-300'
        textClass = 'fill-emerald-700'
        iconColor = '#10b981'
      } else if (isActive) {
        bgClass = 'fill-blue-50'
        borderClass = 'stroke-blue-400'
        textClass = 'fill-blue-700'
        iconColor = '#3b82f6'
      }

      const stepIndex = positionedNodes.findIndex(pn => pn.node.id === node.id) + 1

      return (
        <g
          key={node.id}
          className="overview-node cursor-pointer"
          onClick={() => onNodeClick?.(node.id)}
          style={{ transition: 'transform 0.15s ease' }}
        >
          {/* 节点背景 */}
          <rect
            x={x}
            y={y}
            width={nodeWidth}
            height={nodeHeight}
            rx={borderRadius}
            className={`${bgClass} ${borderClass}`}
            strokeWidth={isActive ? 2.5 : 1.5}
          />

          {/* 状态图标 */}
          <g transform={`translate(${x + 12}, ${y + nodeHeight / 2 - 8})`}>
            {isCompleted ? (
              <circle cx="8" cy="8" r="8" fill={iconColor} />
            ) : isActive ? (
              <circle cx="8" cy="8" r="8" fill="none" stroke={iconColor} strokeWidth="2" />
            ) : (
              <circle cx="8" cy="8" r="7" fill="none" stroke="#d1d5db" strokeWidth="1.5" />
            )}
            {isCompleted && (
              <path
                d="M5 8 L7 10 L11 6"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {isActive && (
              <circle cx="8" cy="8" r="3" fill={iconColor} />
            )}
          </g>

          {/* 步骤序号 */}
          <text
            x={x + 36}
            y={y + nodeHeight / 2 + 1}
            className={`text-xs font-medium ${textClass}`}
            dominantBaseline="middle"
          >
            {stepIndex}.
          </text>

          {/* 节点标题 */}
          <text
            x={x + 50}
            y={y + nodeHeight / 2 + 1}
            className={`text-sm ${textClass}`}
            dominantBaseline="middle"
          >
            {node.data.label.length > 10
              ? node.data.label.slice(0, 10) + '...'
              : node.data.label}
          </text>
        </g>
      )
    })
  }

  if (stepNodes.length === 0) {
    return (
      <div className="overview-chart-empty">
        <p className="text-gray-500">暂无步骤</p>
      </div>
    )
  }

  return (
    <div className="overview-chart-container">
      <svg
        width={Math.max(width, 300)}
        height={Math.max(height, 80)}
        className="overview-chart"
      >
        {/* 箭头标记定义 */}
        <defs>
          <marker
            id="arrow-default"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="#d1d5db" />
          </marker>
          <marker
            id="arrow-active"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="#3b82f6" />
          </marker>
          <marker
            id="arrow-completed"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="#10b981" />
          </marker>
        </defs>

        {/* 连接线 */}
        <g className="edges">
          {renderEdges()}
        </g>

        {/* 节点 */}
        <g className="nodes">
          {renderNodes()}
        </g>
      </svg>
    </div>
  )
}
