import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import communityApi from '../services/communityApi'
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

export default function CommunityWorkflowsPage() {
  const navigate = useNavigate()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('全部')
  const [sort, setSort] = useState<'latest' | 'hot' | 'recommended'>('latest')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const categories = ['全部', '自媒体', '电商', '营销', '数据分析', '效率工具']

  useEffect(() => {
    fetchWorkflows()
  }, [category, sort, page])

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      const data = await communityApi.getWorkflows({
        page,
        limit: 12,
        category: category === '全部' ? undefined : category,
        sort,
        search: searchQuery || undefined
      })
      setWorkflows(data.workflows || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('获取工作流失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchWorkflows()
  }

  const handleLike = async (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录')
      navigate('/login')
      return
    }

    try {
      const result = await communityApi.toggleWorkflowLike(workflowId)
      // 更新本地状态
      setWorkflows(workflows.map(w => {
        if (w.id === workflowId) {
          return {
            ...w,
            isLiked: result.isLiked,
            stats: {
              ...w.stats,
              likes: result.likeCount
            }
          }
        }
        return w
      }))
    } catch (error) {
      console.error('点赞失败:', error)
      alert('操作失败，请重试')
    }
  }

  const handleCopy = async (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录')
      navigate('/login')
      return
    }

    try {
      await communityApi.copyWorkflow(workflowId)
      alert('复制成功！已添加到"我的工作台"')
      navigate('/workspace')
    } catch (error) {
      console.error('复制失败:', error)
      alert('复制失败，请重试')
    }
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
        <button className="back-button" onClick={() => navigate('/community')}>
          ← 返回社群
        </button>

        <section className="section-block">
          <header className="panel-header">
            <div className="panel-header__main">
              <h2>工作流广场</h2>
              <span className="subtitle">发现和使用社区分享的优质工作流</span>
            </div>
          </header>

          {/* 筛选和搜索栏 */}
          <div className="filter-section">
            <div className="filter-tabs">
              <button
                className={`filter-tab ${sort === 'latest' ? 'active' : ''}`}
                onClick={() => setSort('latest')}
              >
                最新
              </button>
              <button
                className={`filter-tab ${sort === 'hot' ? 'active' : ''}`}
                onClick={() => setSort('hot')}
              >
                最热
              </button>
              <button
                className={`filter-tab ${sort === 'recommended' ? 'active' : ''}`}
                onClick={() => setSort('recommended')}
              >
                推荐
              </button>
            </div>

            <div className="filter-categories">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`category-btn ${category === cat ? 'active' : ''}`}
                  onClick={() => {
                    setCategory(cat)
                    setPage(1)
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="search-box">
              <input
                type="text"
                placeholder="搜索工作流..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch}>搜索</button>
            </div>
          </div>

          {/* 工作流网格 */}
          {loading ? (
            <div className="loading-state">加载中...</div>
          ) : (
            <>
              <div className="workflow-grid">
                {workflows.map((workflow) => (
                  <article
                    key={workflow.id}
                    className="workflow-card"
                  >
                    <div onClick={() => navigate(`/workflow-intro/${workflow.id}`)} style={{ cursor: 'pointer' }}>
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
                    </div>

                    <button
                      className="workflow-card__action-btn"
                      onClick={(e) => handleCopy(workflow.id, e)}
                    >
                      添加到工作台
                    </button>
                  </article>
                ))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ← 上一页
                  </button>
                  <span className="pagination-info">第 {page} / {totalPages} 页</span>
                  <button
                    className="pagination-btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    下一页 →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
