import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RecommendationCard } from './RecommendationCard'
import api from '../services/api'
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

interface Props {
  intentId: string | null
  sessionId: string
  onWorkflowSelect: (workflowId: string) => void
}

export const AIRecommendationPanel: React.FC<Props> = ({
  intentId,
  sessionId,
  onWorkflowSelect
}) => {
  const [recommendations, setRecommendations] = useState<WorkflowRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // 当意图更新时,获取推荐（实时更新）
  useEffect(() => {
    console.log('🔄 AIRecommendationPanel: intentId changed:', intentId)
    if (intentId) {
      fetchRecommendations()
    } else {
      // 如果没有intentId,清空推荐
      setRecommendations([])
    }
  }, [intentId]) // intentId变化时立即触发

  const fetchRecommendations = async () => {
    console.log('📡 开始获取推荐, intentId:', intentId)
    setLoading(true)
    setError(null)
    try {
      const response = await api.post('/api/ai/recommendations', {
        intentId,
        sessionId,
        filters: {
          minRelevance: 0.6,
          maxResults: expanded ? 20 : 6
        },
        personalizedBoost: true
      })

      console.log('✅ 推荐API响应:', response.data)

      if (response.data.success) {
        const recs = response.data.data.recommendations || []
        console.log(`📊 收到 ${recs.length} 个推荐结果`)
        setRecommendations(recs)
      } else {
        setError('获取推荐失败')
      }
    } catch (error) {
      console.error('❌ 获取推荐失败:', error)
      setError('获取推荐时发生错误,请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (workflowId: string) => {
    trackAction(workflowId, 'clicked')
    onWorkflowSelect(workflowId)
  }

  const handleTryNow = (workflowId: string) => {
    trackAction(workflowId, 'clicked')
    navigate(`/workflow/editor/${workflowId}?mode=demo`)
  }

  const handleImport = async (workflowId: string) => {
    trackAction(workflowId, 'imported')
    try {
      await api.post(`/api/workflows/${workflowId}/clone`)
      alert('导入成功!已添加到我的工作台')
    } catch (error) {
      console.error('导入失败:', error)
      alert('导入失败,请稍后重试')
    }
  }

  const handleDismiss = (workflowId: string) => {
    trackAction(workflowId, 'dismissed')
    // 从列表中移除
    setRecommendations(prev =>
      prev.filter(r => r.workflow.id !== workflowId)
    )
  }

  const trackAction = async (workflowId: string, action: string) => {
    const recommendation = recommendations.find(r => r.workflow.id === workflowId)
    if (!recommendation?.logId) return

    try {
      await api.post('/api/ai/feedback', {
        recommendationLogId: recommendation.logId,
        action
      })
    } catch (error) {
      console.error('记录反馈失败:', error)
    }
  }

  // 没有意图或没有推荐时不显示
  if (!intentId) {
    return null
  }

  if (error) {
    return (
      <div className="ai-recommendation-panel error">
        <div className="panel-header">
          <h2>💡 为你推荐</h2>
        </div>
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button className="retry-button" onClick={fetchRecommendations}>
            重试
          </button>
        </div>
      </div>
    )
  }

  if (recommendations.length === 0 && !loading) {
    return null
  }

  return (
    <div className="ai-recommendation-panel">
      <div className="panel-header">
        <h2>💡 为你推荐</h2>
        <span className="subtitle">基于对话内容智能匹配</span>
      </div>

      {loading ? (
        <div className="loading-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-thumbnail"></div>
              <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-description"></div>
                <div className="skeleton-tags"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className={`recommendation-grid ${expanded ? 'expanded' : ''}`}>
            {recommendations.map((rec) => (
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

          {recommendations.length > 6 && (
            <button
              className="expand-button"
              onClick={() => {
                setExpanded(!expanded)
                if (!expanded) {
                  fetchRecommendations()
                }
              }}
            >
              {expanded ? '收起' : `查看全部推荐结果 (${recommendations.length}+)`}
              <span className="arrow">{expanded ? '↑' : '→'}</span>
            </button>
          )}
        </>
      )}
    </div>
  )
}
