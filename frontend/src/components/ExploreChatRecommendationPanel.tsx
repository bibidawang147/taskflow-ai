import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RecommendationCard } from './RecommendationCard'
import './AIRecommendationPanel.css'

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
  matchReasons: Array<{
    label: string
    icon: string
    color: 'green' | 'blue' | 'gold' | 'orange'
  }>
  displayType: 'highlight' | 'normal' | 'suggested'
  position: number
  logId?: string
}

interface IntentTag {
  label: string
  type: 'keyword' | 'platform' | 'content' | 'goal'
}

interface Props {
  recommendations: WorkflowRecommendation[]
  intentTags?: IntentTag[]
  onWorkflowSelect?: (workflowId: string) => void
}

/**
 * ExploreChatRecommendationPanel
 * 专门用于Explore页面的AI对话推荐面板
 * 直接接收推荐数据，不需要自己请求API
 */
export const ExploreChatRecommendationPanel: React.FC<Props> = ({
  recommendations,
  intentTags = [],
  onWorkflowSelect
}) => {
  const [expanded, setExpanded] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const navigate = useNavigate()

  const handleViewDetail = (workflowId: string) => {
    navigate(`/workflow-intro/${workflowId}`)
  }

  const handleTryNow = (workflowId: string) => {
    navigate(`/workflow/edit/${workflowId}`)
  }

  const handleImport = async (workflowId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('请先登录')
        navigate('/login')
        return
      }

      const response = await fetch(`/api/workflows/${workflowId}/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        alert('导入成功！已添加到我的工作台')
      } else {
        const data = await response.json()
        alert(data.error || '导入失败，请稍后重试')
      }
    } catch (error) {
      console.error('导入失败:', error)
      alert('导入失败，请稍后重试')
    }
  }

  const handleDismiss = (workflowId: string) => {
    setDismissedIds(prev => new Set([...prev, workflowId]))
  }

  // 过滤掉被dismiss的推荐
  const filteredRecommendations = recommendations.filter(
    rec => !dismissedIds.has(rec.workflow.id)
  )

  // 如果没有推荐，不显示面板
  if (filteredRecommendations.length === 0) {
    return null
  }

  // 显示的推荐数量
  const displayedRecommendations = expanded
    ? filteredRecommendations
    : filteredRecommendations.slice(0, 6)

  return (
    <div className="ai-recommendation-panel explore-chat-recommendations">
      <div className="panel-header">
        <h2>💡 为你推荐</h2>
        <span className="subtitle">基于对话内容智能匹配</span>
      </div>

      {/* 意图标签 */}
      {intentTags.length > 0 && (
        <div className="intent-tags">
          {intentTags.map((tag, index) => (
            <span key={index} className={`intent-tag intent-${tag.type}`}>
              {tag.label}
            </span>
          ))}
        </div>
      )}

      <div className={`recommendation-grid ${expanded ? 'expanded' : ''}`}>
        {displayedRecommendations.map((rec) => (
          <RecommendationCard
            key={rec.workflow.id}
            recommendation={rec}
            onViewDetail={handleViewDetail}
            onTryNow={handleTryNow}
            onImport={handleImport}
            onDismiss={handleDismiss}
          />
        ))}
      </div>

      {filteredRecommendations.length > 6 && (
        <button
          className="expand-button"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '收起' : `查看更多推荐 (${filteredRecommendations.length})`}
          <span className="arrow">{expanded ? '↑' : '→'}</span>
        </button>
      )}
    </div>
  )
}
