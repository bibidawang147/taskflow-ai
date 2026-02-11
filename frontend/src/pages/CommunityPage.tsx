import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../services/api'
import '../styles/community.css'

interface Workflow {
  id: string
  title: string
  description: string
  thumbnail?: string
  category: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  stats: {
    likes: number
    comments: number
    views: number
    copies: number
  }
  isLiked: boolean
}

interface Post {
  id: string
  title: string
  contentPreview: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  likeCount: number
  commentCount: number
  viewCount: number
  createdAt: string
  isLiked: boolean
}

export default function CommunityPage() {
  const navigate = useNavigate()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [workflowsLoading, setWorkflowsLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)

  useEffect(() => {
    fetchWorkflows()
    fetchPosts()
  }, [])

  const fetchWorkflows = async () => {
    try {
      setWorkflowsLoading(true)
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/api/community/workflows?limit=12`, {
        headers
      })
      const data = await response.json()
      setWorkflows(data.workflows || [])
    } catch (error) {
      console.error('获取工作流失败:', error)
    } finally {
      setWorkflowsLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      setPostsLoading(true)
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/api/community/posts?limit=6`, {
        headers
      })
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('获取帖子失败:', error)
    } finally {
      setPostsLoading(false)
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return '刚刚'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  return (
    <div className="community-page">
      <div className="community-container">
        {/* 工作流广场 */}
        <section className="section-block">
          <header className="panel-header">
            <div className="panel-header__main">
              <h2>工作流广场</h2>
              <span className="subtitle">发现和使用社区分享的优质工作流</span>
            </div>
            <button
              className="refresh-button"
              onClick={fetchWorkflows}
              disabled={workflowsLoading}
            >
              ↻ 刷新
            </button>
          </header>

          {workflowsLoading ? (
            <div className="loading-state">加载中...</div>
          ) : (
            <div className="workflow-grid">
              {workflows.map((workflow) => (
                <article
                  key={workflow.id}
                  className="workflow-card"
                  onClick={() => navigate(`/workflow-intro/${workflow.id}`)}
                >
                  <div className="workflow-card__header">
                    <h3 className="workflow-card__title">{workflow.title}</h3>
                    <span className="workflow-card__category">{workflow.category || '效率工具'}</span>
                  </div>

                  <div className="workflow-card__meta">
                    <div className="workflow-card__author">
                      <span className="workflow-card__avatar">{workflow.author.name[0]}</span>
                      <span className="workflow-card__author-name">{workflow.author.name}</span>
                    </div>
                    {workflow.stats.likes > 0 && (
                      <>
                        <span className="workflow-card__divider">·</span>
                        <span className="workflow-card__rating">
                          ★ {(workflow.stats.likes / 100).toFixed(1)}
                        </span>
                      </>
                    )}
                    <span className="workflow-card__divider">·</span>
                    <span className="workflow-card__stat">{formatNumber(workflow.stats.copies)} 次使用</span>
                  </div>

                  <p className="workflow-card__description">{workflow.description}</p>
                </article>
              ))}
            </div>
          )}

          <div className="section-footer">
            <button
              className="secondary-button secondary-button--soft"
              onClick={() => navigate('/community/workflows')}
            >
              查看更多工作流 →
            </button>
          </div>
        </section>

        {/* 讨论区 */}
        <section className="section-block">
          <header className="panel-header">
            <div className="panel-header__main">
              <h2>讨论区</h2>
              <span className="subtitle">分享经验，交流想法，共同成长</span>
            </div>
            <button
              className="primary-button primary-button--solid"
              onClick={() => navigate('/community/posts/new')}
            >
              + 发布新帖
            </button>
          </header>

          {postsLoading ? (
            <div className="loading-state">加载中...</div>
          ) : (
            <div className="post-list">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="post-item"
                  onClick={() => navigate(`/community/posts/${post.id}`)}
                >
                  <h3 className="post-item__title">{post.title}</h3>
                  <p className="post-item__preview">{post.contentPreview}</p>
                  <div className="post-item__meta">
                    <span className="meta-author">{post.author.name}</span>
                    <span className="meta-divider">·</span>
                    <span className="meta-time">{formatRelativeTime(post.createdAt)}</span>
                    <span className="meta-divider">·</span>
                    <span className="meta-stat">{post.commentCount} 回应</span>
                    <span className="meta-divider">·</span>
                    <span className="meta-stat">{post.viewCount} 浏览</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="section-footer">
            <button
              className="secondary-button secondary-button--soft"
              onClick={() => navigate('/community/posts')}
            >
              查看更多讨论 →
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
