import { forwardRef } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Play, Clock } from 'lucide-react'
import type { WorkflowNode, WorkflowStepDetail } from '../../types/workflow'
import PromptBlock from './PromptBlock'
import ToolsList from './ToolsList'
import MediaGallery from './MediaGallery'
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
  const detail = step.stepDetail

  const getStatusIcon = () => {
    if (isCompleted) {
      return <CheckCircle2 className="w-6 h-6 text-emerald-500" />
    }
    if (isActive) {
      return <Play className="w-6 h-6 text-blue-500" />
    }
    return <Circle className="w-6 h-6 text-gray-300" />
  }

  const getCardClassName = () => {
    const base = 'step-card'
    if (isCompleted) return `${base} step-card--completed`
    if (isActive) return `${base} step-card--active`
    return `${base} step-card--pending`
  }

  return (
    <div ref={ref} className={getCardClassName()} onClick={onClick}>
      {/* 卡片头部 */}
      <div className="step-card-header">
        <div className="step-card-status">
          {getStatusIcon()}
        </div>

        <div className="step-card-title-section">
          <div className="step-card-number">步骤 {stepIndex}</div>
          <h3 className="step-card-title">{step.data.label}</h3>
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
          {/* 步骤概览 - 快速了解这一步要做什么 */}
          <div className="step-card-overview">
            <h4 className="step-card-overview-title">📋 步骤概览</h4>
            <div className="step-card-overview-grid">
              {/* 使用工具 */}
              <div className="step-card-overview-item">
                <span className="step-card-overview-label">🛠️ 使用工具</span>
                <span className="step-card-overview-value">
                  {detail?.tools && detail.tools.length > 0
                    ? detail.tools.map(t => t.name).join('、')
                    : '无需特定工具'}
                </span>
              </div>

              {/* 核心提示词摘要 */}
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

              {/* 参考资料 */}
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

              {/* 预期产出 */}
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

          {/* 提示词模板 */}
          {detail?.promptTemplate && (
            <div className="step-card-section">
              <h4 className="step-card-section-title">提示词模板</h4>
              <PromptBlock content={detail.promptTemplate} />
            </div>
          )}

          {/* 工具/链接 */}
          {detail?.tools && detail.tools.length > 0 && (
            <div className="step-card-section">
              <h4 className="step-card-section-title">所需工具</h4>
              <ToolsList tools={detail.tools} />
            </div>
          )}

          {/* 演示媒体 */}
          {detail?.demonstrationMedia && detail.demonstrationMedia.length > 0 && (
            <div className="step-card-section">
              <h4 className="step-card-section-title">操作演示</h4>
              <MediaGallery media={detail.demonstrationMedia} />
            </div>
          )}

          {/* 相关资源 */}
          {detail?.relatedResources && detail.relatedResources.length > 0 && (
            <div className="step-card-section">
              <h4 className="step-card-section-title">相关资源</h4>
              <ResourcesList resources={detail.relatedResources} />
            </div>
          )}

          {/* 预期结果 */}
          {detail?.expectedResult && (
            <div className="step-card-section">
              <h4 className="step-card-section-title">预期结果</h4>
              <div className="step-card-expected-result">
                {detail.expectedResult}
              </div>
            </div>
          )}

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
