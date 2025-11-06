import { 
  FileText, 
  Brain, 
  GitBranch, 
  FileOutput,
  Wrench
} from 'lucide-react'
import { WorkflowNode } from '../../types/workflow'

interface NodeToolbarProps {
  onAddNode: (type: WorkflowNode['type']) => void
  onExport?: () => void
  onSave?: () => void
  onTest?: () => void
}

export default function NodeToolbar({ onAddNode, onExport, onSave, onTest }: NodeToolbarProps) {
  const nodeTypes = [
    {
      type: 'input' as const,
      label: '输入节点',
      icon: FileText,
      description: '接收用户输入'
    },
    {
      type: 'llm' as const,
      label: 'LLM 节点',
      icon: Brain,
      description: '使用AI模型处理'
    },
    {
      type: 'tool' as const,
      label: '工具节点',
      icon: Wrench,
      description: '调用外部工具'
    },
    {
      type: 'condition' as const,
      label: '条件节点',
      icon: GitBranch,
      description: '条件判断分支'
    },
    {
      type: 'output' as const,
      label: '输出节点',
      icon: FileOutput,
      description: '输出处理结果'
    }
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <h2 className="text-lg font-semibold mb-4">节点工具箱</h2>
      
      <div className="space-y-2">
        {nodeTypes.map((nodeType) => {
          const Icon = nodeType.icon
          return (
            <button
              key={nodeType.type}
              onClick={() => onAddNode(nodeType.type)}
              className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200">
                  <Icon className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{nodeType.label}</div>
                  <div className="text-sm text-gray-500">{nodeType.description}</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-8">
        <h3 className="font-medium text-gray-900 mb-3">操作</h3>
        <div className="space-y-2">
          <button
            onClick={onSave}
            disabled={!onSave}
            className="w-full px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存工作流
          </button>
          <button
            onClick={onTest}
            disabled={!onTest}
            className="w-full px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            运行测试
          </button>
          <button
            onClick={onExport}
            disabled={!onExport}
            className="w-full px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            导出配置
          </button>
        </div>
      </div>
    </div>
  )
}
