import { type CSSProperties, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { exploreThemes } from '../data/exploreThemes'
import { popularWorkPackages } from '../data/popularWorkPackages'
import PopularWorkPackageCard from '../components/PopularWorkPackageCard'
import { ExploreChatRecommendationPanel } from '../components/ExploreChatRecommendationPanel'
import '../styles/explore.css'

type RankTrend = 'up' | 'down' | 'same'

interface WorkflowRankingItem {
  rank: number
  name: string
  uses: number
  likes: number
  author: string
  category: string
  trend: RankTrend
}

interface CreatorRankingItem {
  rank: number
  name: string
  avatar: string
  workflows: number
  followers: number
  trend: RankTrend
}

interface ToolRankingItem {
  rank: number
  name: string
  uses: number
  rating: number
  category: string
  provider: string
  trend: RankTrend
}

interface RankingMetric {
  label: string
  value: string
}

interface RankingEntry {
  rank: number
  title: string
  meta: string
  metrics: RankingMetric[]
  trend: RankTrend
  href: string
}

interface RankingColumnConfig {
  id: string
  title: string
  description: string
  viewAllHref: string
  entries: RankingEntry[]
}

const workflowsRanking: WorkflowRankingItem[] = [
  { rank: 1, name: '公众号爆款文章生成器', uses: 25600, likes: 8900, author: 'AI工作流大师', category: '自媒体', trend: 'up' },
  { rank: 2, name: '智能客服机器人', uses: 22100, likes: 7800, author: '电商运营达人', category: '电商', trend: 'up' },
  { rank: 3, name: '视频脚本一键生成', uses: 19800, likes: 7200, author: '自媒体老司机', category: '自媒体', trend: 'same' },
  { rank: 4, name: 'AI去痕迹内容优化', uses: 18500, likes: 6700, author: 'AI工作流大师', category: '内容创作', trend: 'up' },
  { rank: 5, name: '数据可视化报表', uses: 16200, likes: 6100, author: '数据分析师张三', category: '数据分析', trend: 'down' },
  { rank: 6, name: '会议纪要自动生成', uses: 14900, likes: 5600, author: '效率提升专家', category: '效率工具', trend: 'up' }
]

const creatorsRanking: CreatorRankingItem[] = [
  { rank: 1, name: 'AI工作流大师', avatar: '', workflows: 156, followers: 12500, trend: 'up' },
  { rank: 2, name: '效率提升专家', avatar: '', workflows: 142, followers: 10200, trend: 'up' },
  { rank: 3, name: '自媒体老司机', avatar: '', workflows: 128, followers: 9800, trend: 'same' },
  { rank: 4, name: '数据分析师张三', avatar: '', workflows: 115, followers: 8600, trend: 'down' },
  { rank: 5, name: '电商运营达人', avatar: '', workflows: 98, followers: 7500, trend: 'up' },
  { rank: 6, name: 'AI应用开发者', avatar: '', workflows: 69, followers: 5200, trend: 'up' },
  { rank: 7, name: '品牌内容策划师', avatar: '', workflows: 61, followers: 4600, trend: 'same' },
  { rank: 8, name: '跨境运营顾问', avatar: '', workflows: 54, followers: 4100, trend: 'up' },
  { rank: 9, name: '短视频剪辑师', avatar: '', workflows: 49, followers: 3800, trend: 'down' }
]

const toolsRanking: ToolRankingItem[] = [
  { rank: 1, name: 'ChatGPT-4', uses: 156000, rating: 4.9, category: 'AI对话', provider: 'OpenAI', trend: 'up' },
  { rank: 2, name: 'Midjourney', uses: 142000, rating: 4.8, category: '图像生成', provider: 'Midjourney', trend: 'up' },
  { rank: 3, name: 'Claude 3', uses: 128000, rating: 4.9, category: 'AI助手', provider: 'Anthropic', trend: 'up' },
  { rank: 4, name: 'Stable Diffusion', uses: 115000, rating: 4.7, category: '图像生成', provider: 'Stability AI', trend: 'same' },
  { rank: 5, name: 'GitHub Copilot', uses: 98000, rating: 4.8, category: '代码助手', provider: 'GitHub', trend: 'up' },
  { rank: 6, name: 'Notion AI', uses: 87000, rating: 4.6, category: '写作助手', provider: 'Notion', trend: 'down' },
  { rank: 7, name: 'Canva Magic Write', uses: 72000, rating: 4.5, category: '设计辅助', provider: 'Canva', trend: 'up' }
]

const trendIcons: Record<RankTrend, string> = {
  up: '▲',
  down: '▼',
  same: '▬'
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

export function ExploreContent({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate()
  const [showAllThemes, setShowAllThemes] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<WorkflowRecommendation[]>([])
  const [intentTags, setIntentTags] = useState<IntentTag[]>([])

  const compactFormatter = useMemo(
    () => new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }),
    []
  )

  // 监听来自AI对话iframe的推荐数据
  useEffect(() => {
    console.log('✅ ExplorePage: 消息监听器已设置')

    const handleMessage = (event: MessageEvent) => {
      console.log('📨 ExplorePage收到消息:', {
        origin: event.origin,
        type: event.data?.type,
        data: event.data
      })

      // 安全检查：确保消息来源可信
      if (event.data?.type === 'AI_RECOMMENDATIONS') {
        console.log('📥 ExplorePage: 识别到AI推荐消息')
        console.log('推荐数据:', event.data.recommendations)
        console.log('意图标签:', event.data.intentTags)

        setAiRecommendations(event.data.recommendations || [])
        setIntentTags(event.data.intentTags || [])

        console.log('✅ 状态已更新')
      }
    }

    window.addEventListener('message', handleMessage)
    console.log('🎧 事件监听器已添加')

    return () => {
      window.removeEventListener('message', handleMessage)
      console.log('🔇 事件监听器已移除')
    }
  }, [])

  const rankingColumns = useMemo<RankingColumnConfig[]>(
    () => [
      {
        id: 'workflow',
        title: '工作流排行',
        description: '快速复用热门工作流模板，保持创作高产。',
        viewAllHref: '/search?type=workflow',
        entries: workflowsRanking.slice(0, 6).map((item) => ({
          rank: item.rank,
          title: item.name,
          meta: `${item.category} · ${item.author}`,
          metrics: [
            { label: '使用', value: compactFormatter.format(item.uses) },
            { label: '点赞', value: compactFormatter.format(item.likes) }
          ],
          trend: item.trend,
          href: `/workflow-intro/${item.rank}`
        }))
      },
      {
        id: 'creator',
        title: '创作者排行',
        description: '关注优质创作者，获取他们的实战经验。',
        viewAllHref: '/search?type=creator',
        entries: creatorsRanking.slice(0, 9).map((item) => ({
          rank: item.rank,
          title: item.name,
          meta: `${item.workflows} 个工作流`,
          metrics: [
            { label: '粉丝', value: compactFormatter.format(item.followers) },
            { label: '作品', value: item.workflows.toString() }
          ],
          trend: item.trend,
          href: `/creator-profile/index.html?creator=${encodeURIComponent(item.name)}`
        }))
      },
      {
        id: 'tool',
        title: 'AI 工具排行',
        description: '挑选高口碑工具，为工作流注入可靠能力。',
        viewAllHref: '/search?type=tool',
        entries: toolsRanking.slice(0, 7).map((item) => ({
          rank: item.rank,
          title: item.name,
          meta: `${item.category} · ${item.provider}`,
          metrics: [
            { label: '评分', value: item.rating.toFixed(1) },
            { label: '使用', value: compactFormatter.format(item.uses) }
          ],
          trend: item.trend,
          href: `/tool/${item.rank}`
        }))
      }
    ],
    [compactFormatter]
  )


  const getSurfaceColor = (hex?: string) => {
    if (hex && hex.startsWith('#') && (hex.length === 7 || hex.length === 4)) {
      const normalized = hex.length === 4
        ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
        : hex
      return `${normalized}20`
    }
    return 'rgba(124, 58, 237, 0.12)'
  }

  return (
    <div className={embedded ? 'explore-page explore-embedded' : 'explore-page'}>

      <div className="explore-main-columns">
        <div className="explore-main-columns__left">
          <section className="section-block">
            <div className="embedded-chat-container">
              <iframe
                src="/ai-chat?embedded=1"
                title="AI 对话"
                className="embedded-chat-iframe"
                loading="lazy"
              />
            </div>
          </section>
        </div>

        <div className="explore-main-columns__right">
          {/* AI对话推荐面板 - 置顶显示 */}
          {aiRecommendations.length > 0 && (
            <section className="section-block" style={{ marginBottom: '24px' }}>
              <ExploreChatRecommendationPanel
                recommendations={aiRecommendations}
                intentTags={intentTags}
              />
            </section>
          )}

          <section className="section-block ai-recommendation-panel" aria-labelledby="packages-title">
            <header className="panel-header">
              <h2 id="packages-title">
                爆款工作包
              </h2>
              <span className="subtitle">精选热门组合，主打全链路解决方案，一套方案彻底解决一块工作。</span>
            </header>

            <div className="package-grid">
              {popularWorkPackages.slice(0, 8).map((pkg) => (
                <PopularWorkPackageCard
                  key={pkg.id}
                  workPackage={pkg}
                />
              ))}
            </div>
          </section>

          <section className="section-block ai-recommendation-panel" aria-labelledby="themes-title">
            <header className="panel-header">
              <h2 id="themes-title">
                热门主题
              </h2>
              <span className="subtitle">精选常用场景，全平台解决方案让你打破信息差，总能找到最好的方法。</span>
            </header>

            <div className="theme-grid">
              {(showAllThemes ? exploreThemes : exploreThemes.slice(0, 8)).map((theme) => (
                <article
                  key={theme.id}
                  className="theme-card"
                  style={{ ['--theme-color' as const]: theme.color, cursor: 'pointer' } as CSSProperties}
                  onClick={() => navigate(`/explore/theme/${theme.id}`)}
                >
                  <div className="theme-card__head">
                    <div className="flex items-start gap-3">
                      {theme.icon && (
                        <div
                          className="theme-card__icon"
                          aria-hidden="true"
                          style={{ backgroundColor: getSurfaceColor(theme.color), color: theme.color || '#8b5cf6' }}
                        >
                          {theme.icon}
                        </div>
                      )}
                      <div className="theme-card__info">
                        <div>
                          <h3 className="theme-card__title">{theme.name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()}</h3>
                          <p className="theme-card__desc">{theme.summary || theme.description}</p>
                        </div>

                        <div className="stats-row" style={{ marginTop: '12px' }}>
                          <div className="stat-item">
                            <span className="stat-number">{theme.downloads >= 1000 ? `${(theme.downloads / 1000).toFixed(1)}k` : theme.downloads}</span>
                            下载量
                          </div>
                          <div className="stat-item rating">
                            <span className="rating-star" aria-hidden>★</span>
                            <span className="rating-number">{theme.rating.toFixed(1)}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-number">{theme.workflows.length}</span>
                            工作项
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="theme-link-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/explore/theme/${theme.id}`)
                      }}
                    >
                      进入主题 →
                    </button>
                  </div>

                  <div className="theme-card__subgrid">
                    {theme.subcategories.slice(0, 4).map((sub) => (
                      <button
                        type="button"
                        key={sub.id}
                        className="theme-chip"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/explore/theme/${theme.id}`)
                        }}
                      >
                        <span className="theme-chip__name">{sub.name}</span>
                        <span className="theme-chip__count">{sub.count} 个</span>
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            {!showAllThemes && exploreThemes.length > 8 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  className="secondary-button secondary-button--soft"
                  onClick={() => setShowAllThemes(true)}
                  style={{ minWidth: '160px' }}
                >
                  查看更多主题 ({exploreThemes.length - 8})
                </button>
              </div>
            )}

            {showAllThemes && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  className="secondary-button secondary-button--ghost"
                  onClick={() => setShowAllThemes(false)}
                  style={{ minWidth: '160px' }}
                >
                  收起
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {false && (
        <section className="section-block" aria-labelledby="ranking-hidden-title">
          <header className="section-header">
            <h2 id="ranking-hidden-title" className="section-title">
              热门排行榜
            </h2>
            <p className="section-subtitle">实时追踪平台热度，寻找灵感与高转化打法。</p>
          </header>

          <div className="ranking-columns">
            {rankingColumns.map((column) => (
              <article key={column.id} className="ranking-column">
                <div className="ranking-column__header">
                  <h3 className="ranking-column__title">{column.title}</h3>
                  <p className="ranking-column__meta">{column.description}</p>
                </div>

                <div className="ranking-items">
                  {column.entries.map((entry) => (
                    <button
                      key={entry.rank}
                      type="button"
                      className="ranking-item"
                      onClick={() => {
                        if (entry.href.includes('creator-profile')) {
                          window.open(entry.href, '_blank')
                        } else {
                          navigate(entry.href)
                        }
                      }}
                    >
                      <span className={`ranking-number ${entry.rank <= 3 ? 'ranking-number--top' : ''}`}>
                        {entry.rank}
                      </span>
                      <div className="ranking-item__content">
                        <div className="ranking-item__info">
                          <span className="ranking-item__title">{entry.title}</span>
                          <span className="ranking-item__meta">{entry.meta}</span>
                        </div>
                        <div className="ranking-item__stats">
                          {entry.metrics.map((metric) => (
                            <span key={metric.label} className="stat-item">
                              <span className="stat-number">{metric.value}</span>
                              {metric.label}
                            </span>
                          ))}
                        </div>
                        <span className={`ranking-item__trend trend-indicator trend-${entry.trend}`}>
                          {trendIcons[entry.trend]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default function ExplorePage() {
  return <ExploreContent />
}
