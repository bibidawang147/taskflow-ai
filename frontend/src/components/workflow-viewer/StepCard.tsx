import { forwardRef } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Play } from 'lucide-react'
import type { WorkflowNode, WorkflowStepDetail, GuideBlock } from '../../types/workflow'
import ExpandableBlock from './ExpandableBlock'
import MediaGallery from './MediaGallery'
import PromptBlock from './PromptBlock'
import ToolsList from './ToolsList'
import ResourcesList from './ResourcesList'

interface StepCardProps {
  step: WorkflowNode & { stepDetail?: WorkflowStepDetail }
  stepIndex: number
  isActive: boolean
  isCompleted: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onComplete: () => void
  onClick: () => void
}

// 渲染单个 GuideBlock（新格式）
const GuideBlockRenderer = ({ block }: { block: GuideBlock }) => {
  switch (block.type) {
    case 'text':
      return (
        <div className="guide-block guide-block--text">
          {block.text}
        </div>
      )

    case 'tool':
      return block.tool ? (
        <ExpandableBlock
          title={block.tool.name}
          resourceType="工具"
          description={block.tool.description}
          content={block.tool.description}
          url={block.tool.url}
          type="tool"
        />
      ) : null

    case 'resource':
      return block.resource ? (
        <ExpandableBlock
          title={block.resource.title}
          resourceType={block.resource.type === 'file' ? '文档' : '链接'}
          description={block.resource.description}
          content={block.resource.content || block.resource.description}
          url={block.resource.url}
          type="resource"
        />
      ) : null

    case 'prompt':
      return block.prompt ? (
        <ExpandableBlock
          title="AI 提示词"
          resourceType="提示词"
          content={block.prompt}
          type="prompt"
        />
      ) : null

    case 'media':
      return block.media ? (
        <div className="guide-block guide-block--media">
          <MediaGallery media={[block.media]} />
        </div>
      ) : null

    default:
      return null
  }
}

const StepCard = forwardRef<HTMLDivElement, StepCardProps>(({
  step,
  stepIndex,
  isActive,
  isCompleted,
  isExpanded,
  onToggleExpand,
  onComplete,
  onClick
}, ref) => {
  const rawDetail = step.stepDetail
  const config = step.config || (step as any).data?.config || {}

  // 自动从旧格式/config生成 guideBlocks
  const detail = (() => {
    const src = rawDetail || {} as any
    if (src.guideBlocks && src.guideBlocks.length > 0) return src
    const blocks: GuideBlock[] = []
    let idx = 0
    const desc = src.stepDescription || config.stepDescription || config.goal || ''
    if (desc) blocks.push({ id: `a${idx++}`, type: 'text', text: desc } as any)
    const tools = src.tools || config.tools || []
    tools.forEach((t: any) => {
      if (t.name?.trim()) blocks.push({ id: `a${idx++}`, type: 'tool', tool: { name: t.name, url: t.url || '', description: t.description || '' } } as any)
    })
    const prompt = src.promptTemplate || config.prompt || ''
    if (prompt.trim()) blocks.push({ id: `a${idx++}`, type: 'prompt', prompt } as any)
    const resources = [
      ...(src.relatedResources || config.relatedResources || []),
      ...(config.promptResources || []).map((p: any) => ({ title: p.title, type: 'link', url: '', description: p.content || '' })),
      ...(config.documentResources || []).map((d: any) => ({ title: d.name, type: 'file', url: d.url || '', description: d.description || '' }))
    ]
    resources.forEach((r: any) => {
      if (r.title?.trim()) blocks.push({ id: `a${idx++}`, type: 'resource', resource: { title: r.title, type: r.type || 'link', url: r.url || '', description: r.description || '', content: r.content || '' } } as any)
    })
    const media = src.demonstrationMedia || config.demonstrationMedia || []
    media.forEach((m: any) => {
      if (m.url?.trim()) blocks.push({ id: `a${idx++}`, type: 'media', media: { type: m.type || 'image', url: m.url, caption: m.caption || '' } } as any)
    })
    const expected = src.expectedResult || config.expectedResult || ''
    if (expected.trim()) blocks.push({ id: `a${idx++}`, type: 'text', text: `预期结果：${expected}` } as any)
    // 始终返回 guideBlocks 格式，即使为空也用新样式
    return { ...src, guideBlocks: blocks }
  })()

  const getStatusIcon = () => {
    if (isCompleted) {
      return <CheckCircle2 className="w-6 h-6 text-emerald-500" />
    }
    if (isActive) {
      return <Play className="w-6 h-6 text-violet-500" />
    }
    return <Circle className="w-6 h-6 text-gray-300" />
  }

  const getCardClassName = () => {
    const base = 'step-card'
    if (isCompleted) return `${base} step-card--completed`
    if (isActive) return `${base} step-card--active`
    return `${base} step-card--pending`
  }

  // 渲染旧格式内容（向后兼容）
  const renderLegacyContent = () => (
    <>
      {/* 步骤概览 */}
      <div className="step-card-overview">
        <h4 className="step-card-overview-title">📋 步骤概览</h4>
        <div className="step-card-overview-grid">
          <div className="step-card-overview-item">
            <span className="step-card-overview-label">🛠️ 使用工具</span>
            <span className="step-card-overview-value">
              {detail?.tools && detail.tools.length > 0
                ? detail.tools.map(t => t.name).join('、')
                : '无需特定工具'}
            </span>
          </div>
          <div className="step-card-overview-item">
            <span className="step-card-overview-label">💬 操作指引</span>
            <span className="step-card-overview-value">
              {detail?.promptTemplate
                ? detail.promptTemplate.length > 80
                  ? detail.promptTemplate.substring(0, 80) + '...'
                  : detail.promptTemplate
                : '详见下方提示词模板'}
            </span>
          </div>
          <div className="step-card-overview-item">
            <span className="step-card-overview-label">📚 参考资料</span>
            <span className="step-card-overview-value">
              {detail?.relatedResources && detail.relatedResources.length > 0
                ? `${detail.relatedResources.length} 个相关资源`
                : detail?.demonstrationMedia && detail.demonstrationMedia.length > 0
                  ? `${detail.demonstrationMedia.length} 个演示教程`
                  : '无额外资料'}
            </span>
          </div>
          <div className="step-card-overview-item">
            <span className="step-card-overview-label">🎯 预期产出</span>
            <span className="step-card-overview-value">
              {detail?.expectedResult
                ? detail.expectedResult.length > 60
                  ? detail.expectedResult.substring(0, 60) + '...'
                  : detail.expectedResult
                : '完成本步骤操作'}
            </span>
          </div>
        </div>
      </div>

      {detail?.promptTemplate && (
        <div className="step-card-section">
          <h4 className="step-card-section-title">提示词模板</h4>
          <PromptBlock content={detail.promptTemplate} />
        </div>
      )}

      {detail?.tools && detail.tools.length > 0 && (
        <div className="step-card-section">
          <h4 className="step-card-section-title">所需工具</h4>
          <ToolsList tools={detail.tools} />
        </div>
      )}

      {detail?.demonstrationMedia && detail.demonstrationMedia.length > 0 && (
        <div className="step-card-section">
          <h4 className="step-card-section-title">操作演示</h4>
          <MediaGallery media={detail.demonstrationMedia} />
        </div>
      )}

      {detail?.relatedResources && detail.relatedResources.length > 0 && (
        <div className="step-card-section">
          <h4 className="step-card-section-title">相关资源</h4>
          <ResourcesList resources={detail.relatedResources} />
        </div>
      )}

      {detail?.expectedResult && (
        <div className="step-card-section">
          <h4 className="step-card-section-title">预期结果</h4>
          <div className="step-card-expected-result">
            {detail.expectedResult}
          </div>
        </div>
      )}
    </>
  )

  // 渲染新格式 guideBlocks 内容
  const renderGuideBlocksContent = () => (
    <div className="step-card-guide">
      {detail?.guideBlocks && detail.guideBlocks.length > 0 && (
        <div className="step-card-guide-blocks">
          {detail.guideBlocks.map((block, index) => (
            <GuideBlockRenderer key={block.id || index} block={block} />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div ref={ref} className={getCardClassName()} onClick={onClick}>
      {/* 卡片头部 */}
      <div className="step-card-header">
        <div className="step-card-status">
          {getStatusIcon()}
        </div>

        <div className="step-card-title-section">
          <div className="step-card-title-row">
            <span className="step-card-number">步骤 {stepIndex}</span>
            <h3 className="step-card-title">{(step as any).data?.label || step.label}</h3>
          </div>
          {detail?.stepDescription && (
            <p className="step-card-description">{detail.stepDescription}</p>
          )}
        </div>

        <div className="step-card-actions">
          {!isCompleted && (
            <button
              className="step-card-complete-btn"
              onClick={(e) => {
                e.stopPropagation()
                onComplete()
              }}
            >
              完成此步骤
            </button>
          )}

          <button
            className="step-card-expand-btn"
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 卡片内容 - 可展开 */}
      {isExpanded && (
        <div className="step-card-content">
          {renderGuideBlocksContent()}

          {/* 快捷键提示 */}
          {isActive && !isCompleted && (
            <div className="step-card-shortcut-hint">
              按 <kbd>Enter</kbd> 完成此步骤并跳转到下一步
            </div>
          )}
        </div>
      )}
    </div>
  )
})

StepCard.displayName = 'StepCard'

export default StepCard
