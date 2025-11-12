import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { exploreThemeMap } from '../data/exploreThemes'
import '../styles/solution.css'

export default function ExploreThemeDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { themeId } = useParams<{ themeId: string }>()

  const focusId = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('focus')
  }, [location.search])

  const theme = themeId ? exploreThemeMap[themeId] : undefined

  if (!theme) {
    return (
      <div className="solution-page">
        <div className="solution-loading">主题未找到</div>
      </div>
    )
  }

  const totalWorkflows = theme.workflows.length
  const totalTemplates = theme.workflows.reduce((sum, workflow) => sum + workflow.count, 0)

  return (
    <div className="solution-page">
      {/* 头部区域 */}
      <div className="solution-header">
        <button className="solution-back-button" onClick={() => navigate('/explore')}>
          ← 返回
        </button>

        <div className="solution-header-content">
          <div className="solution-info">
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{theme.icon}</div>
            <h1 className="solution-title">{theme.name}</h1>
            <p className="solution-description">{theme.summary}</p>

            <div className="solution-meta">
              {theme.subcategories.slice(0, 3).map((subcategory) => (
                <span key={subcategory.id} className="solution-category">
                  {subcategory.icon} {subcategory.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="solution-stats">
          <div className="solution-stat">
            <span className="solution-stat-number">{totalWorkflows}</span>
            <span className="solution-stat-label">工作流类</span>
          </div>
          <div className="solution-stat">
            <span className="solution-stat-number">{totalTemplates}</span>
            <span className="solution-stat-label">模板数</span>
          </div>
          <div className="solution-stat">
            <span className="solution-stat-number">{theme.subcategories.length}</span>
            <span className="solution-stat-label">子分类</span>
          </div>
          <div className="solution-stat">
            <span className="solution-stat-number">★ 5.0</span>
            <span className="solution-stat-label">评分</span>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="solution-content">
        {/* 工作流列表 */}
        <section className="solution-section">
          <h2 className="solution-section-title">攻略卡片</h2>
          <div className="solution-items">
            {theme.workflows.map((workflow, index) => {
              const isFocused = focusId === workflow.id
              return (
                <div
                  key={workflow.id}
                  className="solution-item"
                  style={{
                    position: 'relative',
                    backgroundColor: isFocused ? `${theme.color}05` : 'white',
                    borderColor: isFocused ? `${workflow.color}50` : 'rgba(255, 255, 255, 0.8)',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/workflow-intro/fake-${theme.id}-${workflow.id}`)}
                >
                  {isFocused && (
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      fontSize: '11px',
                      color: 'white',
                      background: theme.color,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      fontWeight: '600'
                    }}>
                      推荐
                    </span>
                  )}
                  <div className="solution-item-header">
                    <span className="solution-item-icon">{workflow.icon}</span>
                    <h3 className="solution-item-title">{workflow.name}</h3>
                  </div>

                  <p className="solution-item-description">{workflow.description}</p>

                  <div className="solution-item-tools">
                    <span className="solution-item-tools-label">标签：</span>
                    {workflow.tags.map((tag) => (
                      <span key={tag} className="solution-tool-tag">
                        {tag}
                      </span>
                    ))}
                    <span className="solution-tool-tag" style={{
                      backgroundColor: `${workflow.color}15`,
                      color: workflow.color,
                      borderColor: `${workflow.color}30`,
                      fontWeight: 600
                    }}>
                      {workflow.count} 个模板
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 标签 */}
        {theme.subcategories && theme.subcategories.length > 0 && (
          <section className="solution-section">
            <h2 className="solution-section-title">子分类</h2>
            <div className="solution-tags">
              {theme.subcategories.map((subcategory) => (
                <span key={subcategory.id} className="solution-tag" style={{ backgroundColor: `${theme.color}10`, color: theme.color }}>
                  {subcategory.icon} {subcategory.name} ({subcategory.count})
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
