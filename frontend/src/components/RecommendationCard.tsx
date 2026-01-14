import React from 'react'
import './RecommendationCard.css'

interface MatchReason {
  label: string
  icon: string
  color: 'green' | 'blue' | 'gold' | 'orange'
}

interface WorkflowRecommendation {
  workflow: {
    id: string
    title: string
    description: string | null
    thumbnail: string | null
    rating: number | null
    usageCount: number
    difficultyLevel: string
  }
  relevanceScore: number
  matchReasons: MatchReason[]
  displayType: 'highlight' | 'normal' | 'suggested'
  position: number
  logId?: string
}

interface Props {
  recommendation: WorkflowRecommendation
  onViewDetail: (workflowId: string) => void
  onTryNow: (workflowId: string) => void
  onImport: (workflowId: string) => void
  onDismiss: (workflowId: string) => void
}

export const RecommendationCard: React.FC<Props> = ({
  recommendation,
  onViewDetail,
  onTryNow,
  onImport,
  onDismiss
}) => {
  const { workflow, relevanceScore, matchReasons, displayType } = recommendation

  const borderClass =
    displayType === 'highlight' ? 'card-highlight' :
    displayType === 'normal' ? 'card-normal' : 'card-suggested'

  const difficultyMap: Record<string, string> = {
    beginner: '新手友好',
    intermediate: '进阶',
    advanced: '专业级'
  }

  return (
    <div className={`recommendation-card ${borderClass}`}>
      {/* 删除按钮 - 右上角 */}
      <button
        className="btn-dismiss-top"
        onClick={() => onDismiss(workflow.id)}
        title="不感兴趣"
      >
        ✕
      </button>

      {/* 推荐标识 */}
      {displayType === 'highlight' && (
        <div className="highlight-badge">推荐</div>
      )}

      {/* 相关度评分 */}
      <div className="relevance-score-top">
        匹配度 {Math.round(relevanceScore * 100)}%
      </div>

      {/* 卡片内容 */}
      <div className="card-content">
        <h3 className="card-title">{workflow.title}</h3>
        <p className="card-description">
          {workflow.description || '暂无描述'}
        </p>

        {/* 匹配理由标签 */}
        <div className="match-reasons">
          {matchReasons.map((reason, index) => (
            <span
              key={index}
              className={`reason-tag reason-${reason.color}`}
            >
              <span className="reason-icon">{reason.icon}</span>
              {reason.label}
            </span>
          ))}
        </div>

        {/* 快捷操作按钮 */}
        <div className="card-actions">
          <button
            className="btn-primary"
            onClick={() => onImport(workflow.id)}
          >
            导入工作台
          </button>
          <button
            className="btn-text"
            onClick={() => onViewDetail(workflow.id)}
          >
            查看详情
          </button>
        </div>
      </div>
    </div>
  )
}
