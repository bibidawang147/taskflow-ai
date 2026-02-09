import { useMemo } from 'react'
import type { WorkflowNode, WorkflowEdge } from '../../types/workflow'

interface WorkflowOverviewChartProps {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  activeNodeId?: string | null
  completedNodeIds?: Set<string>
  onNodeClick?: (nodeId: string) => void
}

export default function WorkflowOverviewChart({
  nodes,
  edges,
  activeNodeId,
  completedNodeIds = new Set(),
  onNodeClick
}: WorkflowOverviewChartProps) {
  const stepNodes = useMemo(() => {
    const steps = nodes.filter(n => n.type === 'step')
    if (steps.length > 0) return steps
    return nodes.filter(n => ['ai', 'llm', 'tool', 'condition'].includes(n.type))
  }, [nodes])

  // 按 edges 拓扑排序
  const sortedNodes = useMemo(() => {
    if (edges.length === 0) return stepNodes

    const adjacency = new Map<string, string[]>()
    const inDegree = new Map<string, number>()
    stepNodes.forEach(n => {
      adjacency.set(n.id, [])
      inDegree.set(n.id, 0)
    })
    edges.forEach(e => {
      if (adjacency.has(e.source) && adjacency.has(e.target)) {
        adjacency.get(e.source)!.push(e.target)
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1)
      }
    })
    const queue: string[] = []
    stepNodes.forEach(n => {
      if (inDegree.get(n.id) === 0) queue.push(n.id)
    })
    const sorted: WorkflowNode[] = []
    const visited = new Set<string>()
    while (queue.length > 0) {
      const id = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)
      const node = stepNodes.find(n => n.id === id)
      if (node) sorted.push(node)
      ;(adjacency.get(id) || []).forEach(next => {
        inDegree.set(next, (inDegree.get(next) || 0) - 1)
        if (inDegree.get(next) === 0) queue.push(next)
      })
    }
    // 添加未连接的节点
    stepNodes.forEach(n => { if (!visited.has(n.id)) sorted.push(n) })
    return sorted
  }, [stepNodes, edges])

  if (stepNodes.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
        暂无步骤
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '4px 0' }}>
      {sortedNodes.map((node, index) => {
        const isCompleted = completedNodeIds.has(node.id)
        const isActive = node.id === activeNodeId
        const label = (node as any).data?.label || node.label || '未命名'
        const displayLabel = label.length > 12 ? label.slice(0, 12) + '...' : label

        return (
          <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* 连接线 */}
            {index > 0 && (
              <div style={{
                width: '1.5px',
                height: '20px',
                background: completedNodeIds.has(sortedNodes[index - 1].id) && (isCompleted || isActive)
                  ? 'linear-gradient(to bottom, #10b981, #10b981)'
                  : isActive
                    ? 'linear-gradient(to bottom, #c4b5fd, #8b5cf6)'
                    : '#e5e7eb',
                flexShrink: 0
              }} />
            )}

            {/* 节点 */}
            <div
              onClick={() => onNodeClick?.(node.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: isCompleted
                  ? 'rgba(16, 185, 129, 0.06)'
                  : isActive
                    ? 'rgba(139, 92, 246, 0.08)'
                    : 'transparent',
                border: isCompleted
                  ? '1px solid rgba(16, 185, 129, 0.2)'
                  : isActive
                    ? '1px solid rgba(139, 92, 246, 0.25)'
                    : '1px solid #e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!isActive && !isCompleted) {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.04)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && !isCompleted) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {/* 状态圆点 */}
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: isCompleted
                  ? '#10b981'
                  : isActive
                    ? '#8b5cf6'
                    : '#f3f4f6',
                border: isCompleted
                  ? 'none'
                  : isActive
                    ? 'none'
                    : '1.5px solid #d1d5db',
                transition: 'all 0.15s ease'
              }}>
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 6L5 8L9 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : isActive ? (
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />
                ) : (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af' }}>
                    {index + 1}
                  </span>
                )}
              </div>

              {/* 标题 */}
              <span style={{
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isCompleted
                  ? '#059669'
                  : isActive
                    ? '#7c3aed'
                    : '#4b5563',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s ease'
              }}>
                {displayLabel}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
