import { useCallback, useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  BackgroundVariant,
  type NodeTypes,
  type NodeMouseHandler,
  type NodeProps
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import NodeToolbar from './NodeToolbar'
import CustomNode, {
  CustomFlowNode,
  CustomNodeConfig,
  CustomNodeData,
  CustomNodeType
} from './nodes/CustomNode'
import { WorkflowNode } from '../../types/workflow'

type FlowNode = CustomFlowNode

const nodeTypes: NodeTypes = {
  custom: CustomNode as ComponentType<NodeProps>
}

const defaultNodeData: CustomNodeData = {
  type: 'input',
  label: '未命名节点',
  config: {}
}

const defaultNodes: FlowNode[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 250, y: 25 },
    data: {
      type: 'input',
      label: '输入节点',
      config: { placeholder: '请输入文本...' }
    }
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 100, y: 125 },
    data: {
      type: 'llm',
      label: 'LLM 处理',
      config: { model: 'gpt-4o-mini', prompt: '处理用户输入...' }
    }
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 400, y: 125 },
    data: {
      type: 'output',
      label: '输出节点',
      config: { format: 'text' }
    }
  }
]

const defaultEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' }
]

const baseNodeConfig: Record<CustomNodeType, CustomNodeConfig> = {
  input: { placeholder: '请输入文本...' },
  llm: { model: 'gpt-4o-mini', prompt: '请描述这一步的意图或提示词...' },
  tool: { toolName: '', parameters: {} },
  condition: { condition: '', trueOutput: '', falseOutput: '' },
  output: { format: 'text' },
  step: { prompt: '' }  // 教程步骤节点
}

const cloneConfig = (config: CustomNodeConfig | undefined): CustomNodeConfig =>
  JSON.parse(JSON.stringify(config ?? {}))

const ensureNodeData = (node: FlowNode): CustomNodeData => ({
  ...defaultNodeData,
  ...((node.data as Partial<CustomNodeData> | undefined) ?? {})
})

export interface WorkflowEditorState {
  nodes: FlowNode[]
  edges: Edge[]
}

export interface WorkflowEditorProps {
  initialNodes?: FlowNode[]
  initialEdges?: Edge[]
  onWorkflowChange?: (state: WorkflowEditorState) => void
}

export type WorkflowEditorNode = FlowNode
export type WorkflowEditorEdge = Edge

export default function WorkflowEditor({
  initialNodes,
  initialEdges,
  onWorkflowChange
}: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(initialNodes ?? defaultNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges ?? defaultEdges)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const getDefaultConfig = useCallback(
    (type: CustomNodeType) => cloneConfig(baseNodeConfig[type]),
    []
  )

  const defaultedNodes = useMemo(() => initialNodes ?? defaultNodes, [initialNodes])
  const defaultedEdges = useMemo(() => initialEdges ?? defaultEdges, [initialEdges])

  useEffect(() => {
    setNodes(defaultedNodes)
  }, [defaultedNodes, setNodes])

  useEffect(() => {
    setEdges(defaultedEdges)
  }, [defaultedEdges, setEdges])

  useEffect(() => {
    if (!onWorkflowChange) return
    onWorkflowChange({
      nodes: nodes.map((node) => ({
        ...node,
        data: ensureNodeData(node)
      })),
      edges
    })
  }, [nodes, edges, onWorkflowChange])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick: NodeMouseHandler<FlowNode> = useCallback((_event, node) => {
    setSelectedNode(node.id)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const addNode = useCallback(
    (type: WorkflowNode['type']) => {
      const newNode: FlowNode = {
        id: `node_${Date.now()}`,
        type: 'custom',
        position: {
          x: Math.random() * 400,
          y: Math.random() * 400
        },
        data: {
          type,
          label: `${type === 'llm' ? 'LLM' : type} 节点`,
          config: getDefaultConfig(type as CustomNodeType)
        }
      }

      setNodes((nds) => [...nds, newNode])
    },
    [getDefaultConfig, setNodes]
  )

  const updateNodeConfig = useCallback(
    (nodeId: string, config: CustomNodeConfig) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId) return node
          const currentData = ensureNodeData(node)
          return {
            ...node,
            data: {
              ...currentData,
              config
            }
          }
        })
      )
    },
    [setNodes]
  )

  const updateNodeMeta = useCallback(
    (nodeId: string, updates: { label?: string; type?: CustomNodeType; config?: CustomNodeConfig }) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId) return node
          const currentData = ensureNodeData(node)
          const nextType = updates.type ?? currentData.type
          const nextConfig =
            updates.config ??
            (updates.type
              ? getDefaultConfig(nextType)
              : currentData.config ?? getDefaultConfig(nextType))

          return {
            ...node,
            data: {
              ...currentData,
              label: updates.label ?? currentData.label,
              type: nextType,
              config: nextConfig
            }
          }
        })
      )
    },
    [getDefaultConfig, setNodes]
  )

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId))
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
      setSelectedNode(null)
    },
    [setNodes, setEdges]
  )

  const exportWorkflow = useCallback(() => {
    const workflowData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      workflow: {
        nodes: nodes.map((node) => {
          const data = ensureNodeData(node)
          return {
            id: node.id,
            type: data.type,
            label: data.label,
            position: node.position,
            config: data.config
          }
        }),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle
        }))
      }
    }

    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `workflow-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [nodes, edges])

  const activeNode = useMemo(() => {
    if (!selectedNode) return null
    return nodes.find((n) => n.id === selectedNode) ?? null
  }, [nodes, selectedNode])

  return (
    <div className="w-full h-full flex">
      <NodeToolbar onAddNode={addNode} onExport={exportWorkflow} />

      <div className="flex-1 relative">
        <ReactFlow<FlowNode>
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>

        {activeNode && (
          <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border p-4">
            <h3 className="font-semibold mb-4">节点配置</h3>
            <NodeConfigPanel
              getDefaultConfig={getDefaultConfig}
              node={activeNode}
              onUpdateConfig={(config) => updateNodeConfig(activeNode.id, config)}
              onUpdateNode={(updates) => updateNodeMeta(activeNode.id, updates)}
              onDelete={() => deleteNode(activeNode.id)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

interface NodeConfigPanelProps {
  node: FlowNode
  getDefaultConfig: (type: CustomNodeType) => CustomNodeConfig
  onUpdateConfig: (config: CustomNodeConfig) => void
  onUpdateNode: (updates: { label?: string; type?: CustomNodeType; config?: CustomNodeConfig }) => void
  onDelete: () => void
}

function NodeConfigPanel({
  node,
  getDefaultConfig,
  onUpdateConfig,
  onUpdateNode,
  onDelete
}: NodeConfigPanelProps) {
  const nodeData = ensureNodeData(node)
  const [config, setConfig] = useState<CustomNodeConfig>(
    nodeData.config ?? getDefaultConfig(nodeData.type)
  )
  const [label, setLabel] = useState<string>(nodeData.label)
  const [nodeType, setNodeType] = useState<CustomNodeType>(nodeData.type)
  const [toolParametersText, setToolParametersText] = useState<string>(
    JSON.stringify(nodeData.config?.parameters ?? {}, null, 2)
  )

  useEffect(() => {
    setConfig(nodeData.config ?? getDefaultConfig(nodeData.type))
    setLabel(nodeData.label)
    setNodeType(nodeData.type)
    setToolParametersText(JSON.stringify(nodeData.config?.parameters ?? {}, null, 2))
  }, [nodeData, getDefaultConfig])

  const handleConfigChange = <K extends keyof CustomNodeConfig>(key: K, value: CustomNodeConfig[K]) => {
    const newConfig: CustomNodeConfig = { ...config, [key]: value }
    setConfig(newConfig)
    onUpdateConfig(newConfig)
  }

  const handleLabelChange = (value: string) => {
    setLabel(value)
    onUpdateNode({ label: value })
  }

  const handleTypeChange = (value: CustomNodeType) => {
    setNodeType(value)
    const defaultConfig = getDefaultConfig(value)
    setConfig(defaultConfig)
    setToolParametersText(JSON.stringify(defaultConfig.parameters ?? {}, null, 2))
    onUpdateNode({ type: value, config: defaultConfig })
  }

  const handleToolParametersChange = (value: string) => {
    setToolParametersText(value)
    try {
      const parsed = value.trim() ? JSON.parse(value) : {}
      handleConfigChange('parameters', parsed)
    } catch {
      // ignore JSON parse errors until input valid
    }
  }

  const renderConfigFields = (): ReactNode => {
    switch (nodeData.type) {
      case 'input':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">占位符文本</label>
            <input
              type="text"
              value={config.placeholder ?? ''}
              onChange={(e) => handleConfigChange('placeholder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        )

      case 'llm':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">模型</label>
              <select
                value={config.model ?? 'gpt-4o-mini'}
                onChange={(e) => handleConfigChange('model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="gpt-4o-mini">GPT-4o mini</option>
                <option value="gpt-4">GPT-4</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">提示词</label>
              <textarea
                value={config.prompt ?? ''}
                onChange={(e) => handleConfigChange('prompt', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        )

      case 'tool':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">工具名称</label>
              <input
                type="text"
                value={config.toolName ?? ''}
                onChange={(e) => handleConfigChange('toolName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                参数 (JSON，可选)
              </label>
              <textarea
                value={toolParametersText}
                onChange={(e) => handleToolParametersChange(e.target.value)}
                rows={4}
                className="w-full font-mono text-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        )

      case 'condition':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">条件表达式</label>
              <textarea
                value={config.condition ?? ''}
                onChange={(e) => handleConfigChange('condition', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">True 输出标识</label>
              <input
                type="text"
                value={config.trueOutput ?? ''}
                onChange={(e) => handleConfigChange('trueOutput', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">False 输出标识</label>
              <input
                type="text"
                value={config.falseOutput ?? ''}
                onChange={(e) => handleConfigChange('falseOutput', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        )

      case 'output':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">输出格式</label>
            <select
              value={config.format ?? 'text'}
              onChange={(e) => handleConfigChange('format', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="text">文本</option>
              <option value="json">JSON</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>
        )

      default:
        return <div>暂无配置项</div>
    }
  }

  const [showStepInfo, setShowStepInfo] = useState(false)

  const getNodeTypeColor = (type: CustomNodeType) => {
    switch (type) {
      case 'input':
        return 'bg-emerald-100 text-emerald-700'
      case 'llm':
        return 'bg-indigo-100 text-indigo-700'
      case 'tool':
        return 'bg-sky-100 text-sky-700'
      case 'condition':
        return 'bg-amber-100 text-amber-700'
      case 'output':
        return 'bg-rose-100 text-rose-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <input
          value={label}
          onChange={(e) => handleLabelChange(e.target.value)}
          className="font-medium border border-transparent focus:border-primary-400 focus:ring-primary-200 rounded px-2 py-1 text-sm w-[calc(100%-3rem)]"
        />
        <button onClick={onDelete} className="text-red-600 hover:text-red-800 text-sm">
          删除
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">节点类型</label>
        <select
          value={nodeType}
          onChange={(e) => handleTypeChange(e.target.value as CustomNodeType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="input">输入</option>
          <option value="llm">LLM</option>
          <option value="tool">工具</option>
          <option value="condition">条件</option>
          <option value="output">输出</option>
        </select>
      </div>

      {renderConfigFields()}

      {/* 步骤信息 - 可折叠 */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowStepInfo(!showStepInfo)}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <span>📋 步骤信息</span>
          <svg
            className={`w-4 h-4 transition-transform ${showStepInfo ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showStepInfo && (
          <div className="mt-3 space-y-3">
            {/* 节点ID */}
            <div className="text-xs">
              <span className="text-gray-500">节点ID:</span>
              <span className="ml-2 font-mono text-gray-700">{node.id}</span>
            </div>

            {/* 节点类型标签 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">类型:</span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${getNodeTypeColor(nodeData.type)}`}>
                {nodeData.type.toUpperCase()}
              </span>
            </div>

            {/* 配置详情 */}
            <div>
              <div className="text-xs text-gray-500 mb-1">配置详情:</div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 max-h-60 overflow-y-auto">
                <pre className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(config, null, 2)}
                </pre>
              </div>
            </div>

            {/* 位置信息 */}
            <div className="text-xs">
              <span className="text-gray-500">位置:</span>
              <span className="ml-2 font-mono text-gray-700">
                x: {Math.round(node.position.x)}, y: {Math.round(node.position.y)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
