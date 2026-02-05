import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/community.css'
import '../styles/explore.css'

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
  isOfficial?: boolean
  highlight?: string
  sellingPoints?: string[]
}

// 分类标签
const categoryTags = ['全部', '副业专区', '内容创作', '视频制作', '数据分析', '图文设计', '效率工具']

export function ExploreContent({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [workflowsLoading, setWorkflowsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [displayCount, setDisplayCount] = useState(9)

  // 获取工作流数据
  useEffect(() => {
    fetchWorkflows()
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

      const response = await fetch('http://localhost:3000/api/community/workflows?limit=50', {
        headers
      })
      const data = await response.json()
      setWorkflows(data.workflows || [])
    } catch (error) {
      console.error('获取工作流失败:', error)
      setWorkflows([])
    } finally {
      setWorkflowsLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  // 根据分类筛选工作流
  const filteredWorkflows = useMemo(() => {
    if (selectedCategory === '全部') {
      return workflows
    }
    return workflows.filter(w => w.category === selectedCategory)
  }, [workflows, selectedCategory])

  // 切换分类时重置显示数量
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat)
    setDisplayCount(9)
  }

  // 加载更多
  const loadMore = () => {
    setDisplayCount(prev => prev + 9)
  }

  // 是否还有更多
  const hasMore = displayCount < filteredWorkflows.length

  return (
    <div className={embedded ? 'explore-page explore-embedded' : 'explore-page'}>
      <div className="explore-content">
        {/* AI工作方法广场 */}
        <section className="section-block">
            <header className="panel-header">
              <div className="panel-header__main">
                <h2>AI工作方法广场</h2>
                <span className="subtitle">发现和使用社区分享的成熟AI工作方法</span>
              </div>
              <button
                className="refresh-button"
                onClick={fetchWorkflows}
                disabled={workflowsLoading}
              >
                ↻ 刷新
              </button>
            </header>

            {/* 分类标签筛选 */}
            <div className="filter-section">
              <div className="filter-categories">
                {categoryTags.map(cat => (
                  <button
                    key={cat}
                    className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {workflowsLoading ? (
              <div className="loading-state">加载中...</div>
            ) : (
              <div className="workflow-grid">
                {filteredWorkflows.slice(0, displayCount).map((workflow) => (
                  <article
                    key={workflow.id}
                    className="workflow-card"
                    onClick={() => navigate(`/workflow-intro/${workflow.id}`)}
                  >
                    <div className="workflow-card__header">
                      <h3 className="workflow-card__title">{workflow.title}</h3>
                      <span className="workflow-card__category">{workflow.category}</span>
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

            {hasMore && (
              <div className="section-footer">
                <button
                  className="secondary-button secondary-button--soft"
                  onClick={loadMore}
                >
                  加载更多 ({filteredWorkflows.length - displayCount} 个)
                </button>
              </div>
            )}
          </section>
      </div>
    </div>
  )
}

export default function ExplorePage() {
  return <ExploreContent />
}
