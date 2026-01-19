import { useState } from 'react'
import type {
  WorkflowStepDetail,
  StepTool,
  DemonstrationMedia,
  RelatedResource,
  NextStepConfig
} from '../../types/workflow'

interface StepDetailEditorProps {
  stepDetail: Partial<WorkflowStepDetail>
  onChange: (stepDetail: Partial<WorkflowStepDetail>) => void
  availableNodes?: Array<{ id: string; label: string }>
  availableWorkflows?: Array<{ id: string; title: string }>
  disabled?: boolean
}

export default function StepDetailEditor({
  stepDetail,
  onChange,
  availableNodes = [],
  availableWorkflows = [],
  disabled = false
}: StepDetailEditorProps) {
  const [activeSection, setActiveSection] = useState<string | null>('basic')

  const updateField = <K extends keyof WorkflowStepDetail>(
    field: K,
    value: WorkflowStepDetail[K]
  ) => {
    onChange({ ...stepDetail, [field]: value })
  }

  // 工具/链接管理
  const tools = stepDetail.tools || []
  const addTool = () => {
    updateField('tools', [...tools, { name: '', url: '', description: '' }])
  }
  const updateTool = (index: number, field: keyof StepTool, value: string) => {
    const updated = [...tools]
    updated[index] = { ...updated[index], [field]: value }
    updateField('tools', updated)
  }
  const removeTool = (index: number) => {
    updateField('tools', tools.filter((_, i) => i !== index))
  }

  // 演示媒体管理
  const media = stepDetail.demonstrationMedia || []
  const addMedia = (type: 'image' | 'video') => {
    updateField('demonstrationMedia', [...media, { type, url: '', caption: '' }])
  }
  const updateMedia = (index: number, field: keyof DemonstrationMedia, value: string) => {
    const updated = [...media]
    updated[index] = { ...updated[index], [field]: value } as DemonstrationMedia
    updateField('demonstrationMedia', updated)
  }
  const removeMedia = (index: number) => {
    updateField('demonstrationMedia', media.filter((_, i) => i !== index))
  }

  // 相关资源管理
  const resources = stepDetail.relatedResources || []
  const addResource = (type: 'file' | 'link') => {
    updateField('relatedResources', [...resources, { title: '', type, url: '', description: '' }])
  }
  const updateResource = (index: number, field: keyof RelatedResource, value: string) => {
    const updated = [...resources]
    updated[index] = { ...updated[index], [field]: value } as RelatedResource
    updateField('relatedResources', updated)
  }
  const removeResource = (index: number) => {
    updateField('relatedResources', resources.filter((_, i) => i !== index))
  }

  // 下一步配置
  const nextConfig = stepDetail.nextStepConfig || { type: 'default' as const }
  const updateNextConfig = (config: NextStepConfig) => {
    updateField('nextStepConfig', config)
  }

  const sections = [
    { id: 'basic', label: '基本信息', icon: '📝' },
    { id: 'tools', label: '工具/链接', icon: '🔧' },
    { id: 'prompt', label: '提示词', icon: '💬' },
    { id: 'media', label: '图示/视频', icon: '🖼️' },
    { id: 'resources', label: '相关资源', icon: '📎' },
    { id: 'next', label: '下一步', icon: '➡️' }
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* 分区导航 */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeSection === section.id
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>{section.icon}</span>
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {/* 分区内容 */}
      <div className="p-4">
        {/* 基本信息 */}
        {activeSection === 'basic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                步骤说明
              </label>
              <textarea
                value={stepDetail.stepDescription || ''}
                onChange={(e) => updateField('stepDescription', e.target.value)}
                placeholder="具体怎么做、为什么这样做..."
                rows={4}
                disabled={disabled}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                预期结果
              </label>
              <textarea
                value={stepDetail.expectedResult || ''}
                onChange={(e) => updateField('expectedResult', e.target.value)}
                placeholder="完成这一步后应该得到什么结果..."
                rows={3}
                disabled={disabled}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>
        )}

        {/* 工具/链接 */}
        {activeSection === 'tools' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">需要跳转的工具或网址</p>
              <button
                type="button"
                onClick={addTool}
                disabled={disabled}
                className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加工具
              </button>
            </div>

            {tools.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-sm text-gray-500">暂无工具链接</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tools.map((tool, index) => (
                  <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={tool.name}
                        onChange={(e) => updateTool(index, 'name', e.target.value)}
                        placeholder="工具名称（如：ChatGPT）"
                        disabled={disabled}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="url"
                        value={tool.url || ''}
                        onChange={(e) => updateTool(index, 'url', e.target.value)}
                        placeholder="链接地址"
                        disabled={disabled}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={tool.description || ''}
                        onChange={(e) => updateTool(index, 'description', e.target.value)}
                        placeholder="简要说明（可选）"
                        disabled={disabled}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTool(index)}
                      disabled={disabled}
                      className="p-1.5 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 提示词 */}
        {activeSection === 'prompt' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                提示词模板
              </label>
              <p className="text-xs text-gray-500 mb-2">给AI的prompt，用户可以一键复制使用</p>
              <textarea
                value={stepDetail.promptTemplate || ''}
                onChange={(e) => updateField('promptTemplate', e.target.value)}
                placeholder="输入提示词模板..."
                rows={8}
                disabled={disabled}
                className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>
        )}

        {/* 图示/视频 */}
        {activeSection === 'media' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">展示效果的图片或视频</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addMedia('image')}
                  disabled={disabled}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  添加图片
                </button>
                <button
                  type="button"
                  onClick={() => addMedia('video')}
                  disabled={disabled}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  添加视频
                </button>
              </div>
            </div>

            {media.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-sm text-gray-500">暂无演示媒体</p>
              </div>
            ) : (
              <div className="space-y-3">
                {media.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                    <div className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-white ${
                      item.type === 'image' ? 'bg-green-500' : 'bg-purple-500'
                    }`}>
                      {item.type === 'image' ? '🖼️' : '🎬'}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="url"
                        value={item.url}
                        onChange={(e) => updateMedia(index, 'url', e.target.value)}
                        placeholder={item.type === 'image' ? '图片链接' : '视频链接'}
                        disabled={disabled}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={item.caption || ''}
                        onChange={(e) => updateMedia(index, 'caption', e.target.value)}
                        placeholder="说明文字（可选）"
                        disabled={disabled}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      disabled={disabled}
                      className="p-1.5 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 相关资源 */}
        {activeSection === 'resources' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">可下载的文件或外部链接</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addResource('file')}
                  disabled={disabled}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-orange-700 bg-orange-100 hover:bg-orange-200 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  添加文件
                </button>
                <button
                  type="button"
                  onClick={() => addResource('link')}
                  disabled={disabled}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  添加链接
                </button>
              </div>
            </div>

            {resources.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-sm text-gray-500">暂无相关资源</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resources.map((resource, index) => (
                  <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                    <div className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-white ${
                      resource.type === 'file' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {resource.type === 'file' ? '📄' : '🔗'}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={resource.title}
                        onChange={(e) => updateResource(index, 'title', e.target.value)}
                        placeholder="资源名称"
                        disabled={disabled}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="url"
                        value={resource.url}
                        onChange={(e) => updateResource(index, 'url', e.target.value)}
                        placeholder={resource.type === 'file' ? '文件下载链接' : '外部链接'}
                        disabled={disabled}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={resource.description || ''}
                        onChange={(e) => updateResource(index, 'description', e.target.value)}
                        placeholder="资源说明（可选）"
                        disabled={disabled}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeResource(index)}
                      disabled={disabled}
                      className="p-1.5 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 下一步配置 */}
        {activeSection === 'next' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                下一步指向
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={nextConfig.type === 'default'}
                    onChange={() => updateNextConfig({ type: 'default' })}
                    disabled={disabled}
                    className="mr-2"
                  />
                  <span className="text-sm">默认下一步</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={nextConfig.type === 'conditional'}
                    onChange={() => updateNextConfig({ type: 'conditional', conditions: [] })}
                    disabled={disabled}
                    className="mr-2"
                  />
                  <span className="text-sm">条件分支</span>
                </label>
              </div>
            </div>

            {nextConfig.type === 'conditional' && (
              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">设置分支条件</p>
                  <button
                    type="button"
                    onClick={() => {
                      const conditions = nextConfig.conditions || []
                      updateNextConfig({
                        type: 'conditional',
                        conditions: [...conditions, { label: '', targetNodeId: '' }]
                      })
                    }}
                    disabled={disabled}
                    className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50"
                  >
                    添加分支
                  </button>
                </div>

                {(nextConfig.conditions || []).map((condition, index) => (
                  <div key={index} className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg">
                    <input
                      type="text"
                      value={condition.label}
                      onChange={(e) => {
                        const conditions = [...(nextConfig.conditions || [])]
                        conditions[index] = { ...conditions[index], label: e.target.value }
                        updateNextConfig({ ...nextConfig, conditions })
                      }}
                      placeholder="分支名称（如：成功/失败）"
                      disabled={disabled}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={condition.targetNodeId}
                      onChange={(e) => {
                        const conditions = [...(nextConfig.conditions || [])]
                        conditions[index] = { ...conditions[index], targetNodeId: e.target.value }
                        updateNextConfig({ ...nextConfig, conditions })
                      }}
                      disabled={disabled}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">选择目标步骤</option>
                      {availableNodes.map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const conditions = (nextConfig.conditions || []).filter((_, i) => i !== index)
                        updateNextConfig({ ...nextConfig, conditions })
                      }}
                      disabled={disabled}
                      className="p-1.5 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 引用工作流 */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                引用其他工作流（可选）
              </label>
              <select
                value={stepDetail.referencedWorkflowId || ''}
                onChange={(e) => updateField('referencedWorkflowId', e.target.value || undefined)}
                disabled={disabled}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">不引用其他工作流</option>
                {availableWorkflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                引用的工作流会作为子流程展示给用户
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
