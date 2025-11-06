import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exploreThemes } from '../data/exploreThemes'
import { popularWorkPackages } from '../data/popularWorkPackages'
import type { WorkPackage } from '../types/workPackage'
import PopularWorkPackageCard from '../components/PopularWorkPackageCard'
import WorkPackageDetailModal from '../components/WorkPackageDetailModal'
import WorkPackageImportModal from '../components/WorkPackageImportModal'

type Trend = 'up' | 'down' | 'flat'

type CreatorRanking = {
  rank: number
  name: string
  avatar: string
  workflows: number
  followers: number
  trend: Trend
}

type WorkflowRanking = {
  rank: number
  name: string
  uses: number
  likes: number
  author: string
  category: string
  trend: Trend
}

type ToolRanking = {
  rank: number
  name: string
  uses: number
  rating: number
  category: string
  provider: string
  trend: Trend
}

const creatorRankingData: CreatorRanking[] = [
  { rank: 1, name: 'Flow Architect', avatar: '👨‍💼', workflows: 156, followers: 12500, trend: 'up' },
  { rank: 2, name: 'Automation Guru', avatar: '👩‍💻', workflows: 142, followers: 10200, trend: 'up' },
  { rank: 3, name: 'Media Maker', avatar: '🧑‍🎨', workflows: 128, followers: 9800, trend: 'flat' },
  { rank: 4, name: 'Data Wrangler', avatar: '📊', workflows: 115, followers: 8600, trend: 'down' },
  { rank: 5, name: 'Commerce Pilot', avatar: '🛍️', workflows: 98, followers: 7500, trend: 'up' }
]

const workflowRankingData: WorkflowRanking[] = [
  { rank: 1, name: 'Newsletter Booster', uses: 25600, likes: 8900, author: 'Flow Architect', category: 'Publishing', trend: 'up' },
  { rank: 2, name: 'Customer Support Bot', uses: 22100, likes: 7800, author: 'Commerce Pilot', category: 'Support', trend: 'up' },
  { rank: 3, name: 'Video Script Studio', uses: 19800, likes: 7200, author: 'Media Maker', category: 'Content', trend: 'flat' },
  { rank: 4, name: 'Content Polisher', uses: 18500, likes: 6700, author: 'Flow Architect', category: 'Content', trend: 'up' },
  { rank: 5, name: 'Insight Dashboard', uses: 16200, likes: 6100, author: 'Data Wrangler', category: 'Analytics', trend: 'down' }
]

const toolRankingData: ToolRanking[] = [
  { rank: 1, name: 'ChatGPT-4', uses: 156000, rating: 4.9, category: 'Conversational AI', provider: 'OpenAI', trend: 'up' },
  { rank: 2, name: 'Midjourney', uses: 142000, rating: 4.8, category: 'Image Generation', provider: 'Midjourney', trend: 'up' },
  { rank: 3, name: 'Claude 3', uses: 128000, rating: 4.9, category: 'AI Assistant', provider: 'Anthropic', trend: 'up' },
  { rank: 4, name: 'Stable Diffusion', uses: 115000, rating: 4.7, category: 'Image Generation', provider: 'Stability AI', trend: 'flat' },
  { rank: 5, name: 'GitHub Copilot', uses: 98000, rating: 4.8, category: 'Developer Tools', provider: 'GitHub', trend: 'up' }
]

function getTrendBadge(trend: Trend) {
  switch (trend) {
    case 'up':
      return { icon: '📈', color: '#10b981' }
    case 'down':
      return { icon: '📉', color: '#ef4444' }
    default:
      return { icon: '➖', color: '#6b7280' }
  }
}

export default function ExplorePageNew() {
  const navigate = useNavigate()
  const [selectedPackageForDetail, setSelectedPackageForDetail] = useState<WorkPackage | null>(null)
  const [selectedPackageForImport, setSelectedPackageForImport] = useState<WorkPackage | null>(null)

  const highlightThemes = useMemo(() => exploreThemes.slice(0, 3), [])
  const highlightPackages = useMemo(() => popularWorkPackages.slice(0, 6), [])

  const handleViewDetails = (pkg: WorkPackage) => {
    setSelectedPackageForDetail(pkg)
  }

  const handleImportClick = (pkg: WorkPackage) => {
    setSelectedPackageForImport(pkg)
  }

  const handleConfirmImport = (targetModule: string) => {
    if (!selectedPackageForImport) return
    // TODO: integrate with real import API
    alert(`Imported "${selectedPackageForImport.name}" to module "${targetModule}".`)
    setSelectedPackageForImport(null)
  }

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '48px 32px', color: '#111827' }}>
      <header style={{ textAlign: 'center', marginBottom: '48px' }}>
        <p style={{ fontSize: '14px', color: '#6366f1', letterSpacing: '0.08em', margin: 0 }}>DISCOVER</p>
        <h1
          style={{
            fontSize: '40px',
            fontWeight: 700,
            margin: '12px 0 16px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Find the Next Workflow Breakthrough
        </h1>
        <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>
          Explore curated templates, top creators, and high-impact automation that ship faster results.
        </p>
      </header>

      <section style={{ marginBottom: '56px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Spotlight Themes</h2>
          <button
            type="button"
            onClick={() => navigate('/explore')}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#6366f1',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            View all themes →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          {highlightThemes.map((theme) => {
            const tags = theme.workflows.flatMap((workflow) => workflow.tags).slice(0, 3)
            return (
              <div
                key={theme.id}
                style={{
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 12px 24px rgba(79, 70, 229, 0.08)'
                }}
              >
                <div style={{ fontSize: '32px' }}>{theme.icon}</div>
                <div>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{theme.name}</p>
                  <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>{theme.summary}</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
                  {tags.map((tag: string) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '12px',
                        borderRadius: '999px',
                        background: '#f3f4ff',
                        color: '#4c1d95',
                        padding: '4px 10px'
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section style={{ marginBottom: '56px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Popular Work Packages</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            Import complete workflow playbooks crafted by the community.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {highlightPackages.map((pkg) => (
            <PopularWorkPackageCard
              key={pkg.id}
              workPackage={pkg}
              onViewDetails={() => handleViewDetails(pkg)}
              onImport={() => handleImportClick(pkg)}
            />
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: '56px' }}>
        <RankingCard title="Top Creators" description="Builders shipping the most loved workflows.">
          {creatorRankingData.map((creator) => {
            const trend = getTrendBadge(creator.trend)
            return (
              <div
                key={creator.rank}
                onClick={() => {
                  // 跳转到创作者主页
                  window.open(`/creator-profile/index.html?creator=${encodeURIComponent(creator.name)}`, '_blank')
                }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#4c1d95' }}>#{creator.rank}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '24px' }}>{creator.avatar}</div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600 }}>{creator.name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{creator.workflows} workflows · {creator.followers} followers</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', color: trend.color }}>{trend.icon}</span>
                </div>
              </div>
            )
          })}
        </RankingCard>

        <RankingCard title="Trending Workflows" description="High impact workflows adopted this week.">
          {workflowRankingData.map((item) => {
            const trend = getTrendBadge(item.trend)
            return (
              <div
                key={item.rank}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f3f4f6'
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#4c1d95' }}>#{item.rank}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {item.category} · {item.author}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {item.uses.toLocaleString()} runs · {item.likes.toLocaleString()} likes
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', color: trend.color }}>{trend.icon}</span>
                </div>
              </div>
            )
          })}
        </RankingCard>

        <RankingCard title="Tool Leaderboard" description="AI tools powering the most workflows.">
          {toolRankingData.map((tool) => {
            const trend = getTrendBadge(tool.trend)
            return (
              <div
                key={tool.rank}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f3f4f6'
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#4c1d95' }}>#{tool.rank}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>{tool.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {tool.category} · {tool.provider}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {tool.uses.toLocaleString()} uses · rating {tool.rating.toFixed(1)}
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', color: trend.color }}>{trend.icon}</span>
                </div>
              </div>
            )
          })}
        </RankingCard>
      </section>

      {selectedPackageForDetail && (
        <WorkPackageDetailModal
          workPackage={selectedPackageForDetail}
          onClose={() => setSelectedPackageForDetail(null)}
          onImport={(pkg) => {
            setSelectedPackageForDetail(null)
            handleImportClick(pkg)
          }}
        />
      )}

      {selectedPackageForImport && (
        <WorkPackageImportModal
          workPackage={selectedPackageForImport}
          onClose={() => setSelectedPackageForImport(null)}
          onConfirm={handleConfirmImport}
        />
      )}
    </div>
  )
}

type RankingCardProps = {
  title: string
  description: string
  children: React.ReactNode
}

function RankingCard({ title, description, children }: RankingCardProps) {
  return (
    <div
      style={{
        borderRadius: '18px',
        border: '1px solid #e5e7eb',
        background: '#ffffff',
        padding: '24px',
        boxShadow: '0 16px 32px rgba(99, 102, 241, 0.08)'
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{title}</h3>
        <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#6b7280' }}>{description}</p>
      </div>
      <div>{children}</div>
    </div>
  )
}
