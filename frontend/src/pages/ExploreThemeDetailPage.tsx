import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { exploreThemeMap } from '../data/exploreThemes'

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
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', color: '#1f2937', marginBottom: '1rem' }}>主题未找到</h1>
        <button
          onClick={() => navigate('/explore')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          返回探索页
        </button>
      </div>
    )
  }

  const totalWorkflows = theme.workflows.length
  const totalTemplates = theme.workflows.reduce((sum, workflow) => sum + workflow.count, 0)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* 主题头部 */}
      <div style={{
        marginBottom: '3rem',
        padding: '2rem',
        background: `linear-gradient(135deg, ${theme.color}15, ${theme.color}05)`,
        borderRadius: '16px',
        border: `1px solid ${theme.color}25`
      }}>
        <button
          onClick={() => navigate('/explore')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#6b7280',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white'
          }}
        >
          ← 返回探索页
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '96px',
            height: '96px',
            backgroundColor: `${theme.color}20`,
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '52px'
          }}>
            {theme.icon}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0 0 0.75rem 0'
            }}>
              {theme.name}
            </h1>
            <p style={{
              fontSize: '1.125rem',
              color: '#4b5563',
              margin: '0 0 1rem 0',
              lineHeight: 1.65
            }}>
              {theme.summary}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {theme.subcategories.map((subcategory) => (
                <span
                  key={subcategory.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '999px',
                    backgroundColor: 'white',
                    border: `1px solid ${theme.color}25`,
                    fontSize: '13px',
                    color: '#374151',
                    fontWeight: '500'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{subcategory.icon}</span>
                  {subcategory.name}
                  <span style={{
                    fontSize: '12px',
                    color: theme.color,
                    fontWeight: '600'
                  }}>
                    {subcategory.count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          <div>
            <span style={{ fontWeight: '600', color: '#1f2937' }}>{totalWorkflows}</span> 类重点工作流
          </div>
          <div>
            <span style={{ fontWeight: '600', color: '#1f2937' }}>{totalTemplates}</span> 个精选模板
          </div>
          <div>
            <span style={{ fontWeight: '600', color: '#1f2937' }}>{focusId ? '已高亮对应推荐' : '全部推荐已更新'}</span>
          </div>
        </div>
      </div>

      {/* 洞察卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem'
      }}>
        {theme.insights.map((insight) => (
          <div
            key={insight.title}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              padding: '1.5rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = `0 14px 32px ${theme.color}20`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'
            }}
          >
            <div style={{ fontSize: '13px', color: theme.color, fontWeight: '600', marginBottom: '0.5rem' }}>
              {insight.title}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.75rem' }}>
              {insight.value}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
              {insight.description}
            </div>
          </div>
        ))}
      </div>

      {/* 工作流卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '1.5rem'
      }}>
        {theme.workflows.map((workflow) => {
          const isFocused = focusId === workflow.id
          return (
            <div
              key={workflow.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                border: `1px solid ${isFocused ? `${theme.color}50` : '#e5e7eb'}`,
                padding: '1.5rem',
                transition: 'all 0.3s',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: isFocused ? `0 18px 42px ${theme.color}25` : 'none',
                position: 'relative',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                if (!isFocused) {
                  e.currentTarget.style.boxShadow = `0 12px 36px ${workflow.color}25`
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.borderColor = `${workflow.color}35`
                }
              }}
              onMouseLeave={(e) => {
                if (!isFocused) {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = '#e5e7eb'
                }
              }}
            >
              {isFocused && (
                <span style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  fontSize: '12px',
                  color: 'white',
                  background: theme.color,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontWeight: '600'
                }}>
                  推荐
                </span>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '14px',
                  backgroundColor: `${workflow.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px'
                }}>
                  {workflow.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0 0 0.4rem 0'
                  }}>
                    {workflow.name}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0,
                    lineHeight: 1.6
                  }}>
                    {workflow.description}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                marginTop: 'auto'
              }}>
                <span style={{
                  fontSize: '12px',
                  color: workflow.color,
                  fontWeight: '600',
                  backgroundColor: `${workflow.color}12`,
                  padding: '0.25rem 0.6rem',
                  borderRadius: '999px'
                }}>
                  收录 {workflow.count} 个模板
                </span>
                {workflow.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '12px',
                      color: '#4b5563',
                      backgroundColor: '#f3f4f6',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '999px',
                      fontWeight: '500'
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
    </div>
  )
}
