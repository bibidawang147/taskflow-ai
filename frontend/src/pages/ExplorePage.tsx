import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SAMPLE_WORKFLOW_IDS } from '../data/sampleWorkflows'
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

// 示例工作流数据 - 使用统一的 ID
const sampleWorkflows: Workflow[] = [
  {
    id: SAMPLE_WORKFLOW_IDS.XIAOHONGSHU,
    title: '小红书爆款笔记创作全流程',
    description: '从市场调研、选题策划、文案撰写到SEO优化，一站式AI辅助创作小红书种草笔记，提升内容曝光和转化率',
    category: '内容创作',
    author: {
      id: 'official',
      name: '瓴积AI官方',
      avatar: undefined
    },
    stats: {
      likes: 486,
      comments: 128,
      views: 12580,
      copies: 3240
    },
    isLiked: false,
    isOfficial: true,
    highlight: '已帮助10000+创作者产出爆款内容',
    sellingPoints: ['新手友好', '省时80%', '爆款公式']
  },
  {
    id: SAMPLE_WORKFLOW_IDS.DOUYIN,
    title: '抖音短视频脚本生成器',
    description: '智能分析热门视频结构，自动生成吸睛开头、内容主体和引导互动的完整短视频脚本',
    category: '短视频',
    author: {
      id: 'official',
      name: '瓴积AI官方',
      avatar: undefined
    },
    stats: {
      likes: 352,
      comments: 89,
      views: 8960,
      copies: 2180
    },
    isLiked: false,
    isOfficial: true,
    highlight: '3分钟生成专业级脚本',
    sellingPoints: ['零门槛', '高转化', '热门模板']
  },
  {
    id: SAMPLE_WORKFLOW_IDS.ARTICLE,
    title: '公众号长文写作助手',
    description: '从选题构思到成稿润色，AI全程辅助撰写高质量公众号文章，支持多种写作风格',
    category: '文章写作',
    author: {
      id: 'author-article-001',
      name: '内容创作者',
      avatar: undefined
    },
    stats: {
      likes: 298,
      comments: 67,
      views: 6540,
      copies: 1520
    },
    isLiked: false,
    isOfficial: false,
    highlight: '支持10+写作风格一键切换',
    sellingPoints: ['多风格', '智能润色']
  },
  {
    id: 'workflow-ecommerce-001',
    title: '电商产品描述生成器',
    description: '一键生成吸引眼球的产品标题、卖点提炼和详情页文案，提升商品转化率',
    category: '电商',
    author: {
      id: 'author-ecom-001',
      name: '电商运营达人',
      avatar: undefined
    },
    stats: {
      likes: 245,
      comments: 56,
      views: 5680,
      copies: 1280
    },
    isLiked: false,
    isOfficial: false,
    highlight: '平均提升转化率35%',
    sellingPoints: ['高转化', '多平台适配']
  },
  {
    id: 'workflow-data-001',
    title: '数据分析报告生成器',
    description: '自动分析数据趋势，生成专业的可视化报告，支持多种图表类型',
    category: '数据分析',
    author: {
      id: 'author-data-001',
      name: '数据分析师张三',
      avatar: undefined
    },
    stats: {
      likes: 189,
      comments: 42,
      views: 4320,
      copies: 980
    },
    isLiked: false,
    isOfficial: false,
    highlight: '节省90%报告制作时间',
    sellingPoints: ['自动化', '专业图表']
  },
  {
    id: 'workflow-meeting-001',
    title: '会议纪要智能整理',
    description: '自动提取会议要点，生成结构化纪要，支持待办事项追踪',
    category: '效率工具',
    author: {
      id: 'author-eff-001',
      name: '效率提升专家',
      avatar: undefined
    },
    stats: {
      likes: 167,
      comments: 38,
      views: 3890,
      copies: 856
    },
    isLiked: false,
    isOfficial: false,
    highlight: '会议效率提升200%',
    sellingPoints: ['智能提取', '待办追踪']
  }
]

// 分类标签
const categoryTags = ['全部', '内容创作', '短视频', '文章写作', '电商', '数据分析', '效率工具', '自媒体']

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

      const response = await fetch('http://localhost:3000/api/community/workflows?limit=12', {
        headers
      })
      const data = await response.json()
      // 合并示例数据和API数据，示例数据放在前面
      const apiWorkflows = data.workflows || []
      setWorkflows([...sampleWorkflows, ...apiWorkflows])
    } catch (error) {
      console.error('获取工作流失败:', error)
      // API 失败时仍然显示示例数据
      setWorkflows(sampleWorkflows)
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
                <span className="subtitle">发现和使用社区分享的优质AI工作方法</span>
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
