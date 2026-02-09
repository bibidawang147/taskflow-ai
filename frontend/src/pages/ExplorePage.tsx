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
  tags?: string[]
}

// 分类标签
const categoryTags = ['全部', '副业专区', '内容创作', '视频制作', '数据分析', '图文设计', '效率工具']

// 分类颜色映射
const getCategoryType = (category: string): string => {
  const map: Record<string, string> = {
    '内容创作': 'purple',
    '视频制作': 'orange',
    '效率工具': 'blue',
    '数据分析': 'green',
    '图文设计': 'pink',
    '副业专区': 'gold'
  }
  return map[category] || 'default'
}

// 根据分类生成优势标签
const getAdvantageTags = (category: string): string[] => {
  const map: Record<string, string[]> = {
    '内容创作': ['新手友好', '爆款公式', '高转化'],
    '视频制作': ['省时80%', '热门模板', '零门槛'],
    '效率工具': ['省时80%', '新手友好', '即开即用'],
    '数据分析': ['零门槛', '高效率', '可视化'],
    '图文设计': ['热门模板', '新手友好', '高转化'],
    '副业专区': ['零门槛', '高转化', '爆款公式']
  }
  return map[category] || ['新手友好', '热门模板']
}

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
                    {/* 第一行：标题 + 类型标签 */}
                    <div className="workflow-card__header">
                      <h3 className="workflow-card__title">{workflow.title}</h3>
                      <span className={`workflow-card__category workflow-card__category--${getCategoryType(workflow.category)}`}>
                        {workflow.category}
                      </span>
                    </div>

                    {/* 第二行：作者信息 */}
                    <div className="workflow-card__author">
                      {workflow.isOfficial ? (
                        <span className="workflow-card__official-dot"></span>
                      ) : (
                        <span className="workflow-card__avatar">{workflow.author.name[0]}</span>
                      )}
                      <span className="workflow-card__author-name">{workflow.author.name}</span>
                    </div>

                    {/* 第三行：描述文字 */}
                    <p className="workflow-card__description">{workflow.description}</p>

                    {/* 小字解释 */}
                    {workflow.highlight && (
                      <p className="workflow-card__highlight">{workflow.highlight}</p>
                    )}

                    {/* 底部标签区 */}
                    {workflow.sellingPoints && workflow.sellingPoints.length > 0 && (
                      <div className="workflow-card__bottom-tags">
                        {workflow.sellingPoints.map((tag, index) => (
                          <span key={index} className="workflow-card__bottom-tag">{tag}</span>
                        ))}
                      </div>
                    )}

                    {/* 优势标签 */}
                    <div className="workflow-card__advantage-tags">
                      {getAdvantageTags(workflow.category).map((tag, index) => (
                        <span key={index} className="workflow-card__advantage-tag">{tag}</span>
                      ))}
                    </div>
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
