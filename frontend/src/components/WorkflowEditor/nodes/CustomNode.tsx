import type { Node, NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import { Brain, FileOutput, FileText, GitBranch, Wrench, ListChecks } from 'lucide-react'

export type CustomNodeType = 'input' | 'llm' | 'tool' | 'condition' | 'output' | 'step'

export interface CustomNodeConfig {
  placeholder?: string
  model?: string
  prompt?: string
  toolName?: string
  parameters?: Record<string, unknown>
  condition?: string
  trueOutput?: string
  falseOutput?: string
  format?: string
}

export interface CustomNodeData extends Record<string, unknown> {
  type: CustomNodeType
  label: string
  config?: CustomNodeConfig
}

export type CustomFlowNode = Node<CustomNodeData>

const defaultNodeData: CustomNodeData = {
  type: 'input',
  label: '未命名节点',
  config: {}
}

export default function CustomNode({ data, selected }: NodeProps<CustomFlowNode>) {
  const rawData = (data as Partial<CustomNodeData> | undefined) ?? {}
  const nodeData: CustomNodeData = {
    ...defaultNodeData,
    ...rawData
  }

  const config: CustomNodeConfig = nodeData.config ?? {}

  const getNodeIcon = () => {
    switch (nodeData.type) {
      case 'input':
        return <FileText className="w-4 h-4" />
      case 'llm':
        return <Brain className="w-4 h-4" />
      case 'tool':
        return <Wrench className="w-4 h-4" />
      case 'condition':
        return <GitBranch className="w-4 h-4" />
      case 'output':
        return <FileOutput className="w-4 h-4" />
      case 'step':
        return <ListChecks className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getNodeColor = () => {
    switch (nodeData.type) {
      case 'input':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'llm':
        return 'bg-primary-100 border-primary-300 text-primary-800'
      case 'tool':
        return 'bg-purple-100 border-purple-300 text-purple-800'
      case 'condition':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'output':
        return 'bg-red-100 border-red-300 text-red-800'
      case 'step':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const showTargetHandle = nodeData.type !== 'input'
  const showSourceHandle = nodeData.type !== 'output'

  return (
    <div 
      className={`px-4 py-3 shadow-md rounded-md border-2 min-w-[150px] ${getNodeColor()} ${
        selected ? 'ring-2 ring-primary-500' : ''
      }`}
    >
      {showTargetHandle && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-gray-400"
        />
      )}
      
      <div className="flex items-center space-x-2">
        <div className="flex-shrink-0">
          {getNodeIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {nodeData.label}
          </div>
          {nodeData.config && (
            <div className="text-xs opacity-75 truncate">
              {nodeData.type === 'llm' && config.model}
              {nodeData.type === 'input' && config.placeholder}
              {nodeData.type === 'output' && config.format}
              {nodeData.type === 'tool' && config.toolName}
            </div>
          )}
        </div>
      </div>

      {showSourceHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-gray-400"
        />
      )}

      {nodeData.type === 'condition' && (
        <>
          <Handle
            type="source"
            position={Position.Left}
            id="false"
            className="w-3 h-3 !bg-red-400"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="w-3 h-3 !bg-green-400"
          />
        </>
      )}
    </div>
  )
}
