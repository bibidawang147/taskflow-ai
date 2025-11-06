import { WorkPackage } from '../types/workPackage'

interface WorkPackageDetailModalProps {
  workPackage: WorkPackage
  onClose: () => void
  onImport: (pkg: WorkPackage) => void
}

export default function WorkPackageDetailModal({
  workPackage,
  onClose,
  onImport
}: WorkPackageDetailModalProps) {
  const difficultyColors: Record<string, string> = {
    简单: '#10b981',
    中等: '#f59e0b',
    高级: '#ef4444'
  }

  const safeIcon = workPackage.icon || '📦'

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        padding: '2rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 弹窗头部 */}
        <div
          style={{
            background: `linear-gradient(135deg, ${workPackage.color}, ${workPackage.color}dd)`,
            padding: '2rem',
            borderRadius: '20px 20px 0 0',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)',
              filter: 'blur(40px)'
            }}
          />

          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.25)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)',
              zIndex: 1
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.35)'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'
            }}
          >
            ×
          </button>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  flexShrink: 0,
                  backdropFilter: 'blur(10px)'
                }}
              >
                {safeIcon}
              </div>

              <div style={{ flex: 1, paddingTop: '0.25rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
                  {workPackage.name}
                </h2>
                <p style={{ fontSize: '15px', opacity: 0.95, margin: '0 0 0.75rem 0', lineHeight: 1.5 }}>
                  {workPackage.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '14px' }}>
                  <span style={{ fontSize: '20px' }}>{workPackage.author.avatar || '👤'}</span>
                  <span style={{ opacity: 0.95, fontWeight: 500 }}>{workPackage.author.name}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '2px' }}>
                  {workPackage.stats.downloads >= 10000
                    ? `${(workPackage.stats.downloads / 1000).toFixed(1)}k`
                    : workPackage.stats.downloads}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>下载量</div>
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>⭐</span>
                  {workPackage.stats.rating}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>评分</div>
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '2px' }}>{workPackage.stats.reviews}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>评价数</div>
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '2px' }}>{workPackage.items.length}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>工作项</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              标签
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {workPackage.tags.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: `${workPackage.color}10`,
                    color: workPackage.color,
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', marginBottom: '1rem', textTransform: 'uppercase' }}>
              包含的工作项 ({workPackage.items.length})
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem'
              }}
            >
              {workPackage.items.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '16px',
                    backgroundColor: '#f9fafb',
                    padding: '1.25rem',
                    display: 'grid',
                    gap: '1rem',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          backgroundColor: `${workPackage.color}15`,
                          color: workPackage.color,
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 700
                        }}
                      >
                        {index + 1}
                      </div>
                      <div style={{ fontSize: '24px', flexShrink: 0, lineHeight: 1 }}>{item.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>{item.name}</div>
                        <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>{item.description}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          backgroundColor: `${difficultyColors[item.difficulty] ?? '#e5e7eb'}20`,
                          color: difficultyColors[item.difficulty] ?? '#6b7280',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        {item.difficulty}
                      </span>
                      <span
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#ede9fe',
                          color: '#6d28d9',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        {item.tools.length} 个工具
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gap: '0.65rem'
                    }}
                  >
                    {item.tools.map((tool) => (
                      <div
                        key={tool.id}
                        style={{
                          padding: '0.85rem',
                          backgroundColor: 'white',
                          borderRadius: '12px',
                          border: '1px solid #e5e7eb',
                          display: 'grid',
                          gap: '0.65rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                          <span style={{ fontSize: '22px', lineHeight: 1 }}>{tool.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>{tool.name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.6 }}>{tool.description}</div>
                          </div>
                          <span
                            style={{
                              padding: '4px 10px',
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              flexShrink: 0
                            }}
                          >
                            {tool.type}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                          {tool.version && (
                            <div
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#dbeafe',
                                color: '#1d4ed8',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}
                            >
                              版本 {tool.version}
                            </div>
                          )}
                          {tool.provider && (
                            <div
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#fef3c7',
                                color: '#d97706',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}
                            >
                              提供方 {tool.provider}
                            </div>
                          )}
                          {tool.modelId && (
                            <div
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#ede9fe',
                                color: '#6d28d9',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}
                            >
                              模型 {tool.modelId}
                            </div>
                          )}
                          {tool.inputPrice !== undefined && tool.outputPrice !== undefined && (
                            <div
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#dcfce7',
                                color: '#16a34a',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}
                            >
                              输入 {tool.inputPrice}元/M · 输出 {tool.outputPrice}元/M
                            </div>
                          )}
                          {tool.maxTokens !== undefined && (
                            <div
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#e0e7ff',
                                color: '#4f46e5',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}
                            >
                              最大 tokens: {tool.maxTokens.toLocaleString()}
                            </div>
                          )}
                        </div>

                        {tool.features && Object.keys(tool.features).length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {tool.features.vision && (
                              <span
                                style={{
                                  padding: '3px 8px',
                                  backgroundColor: '#fef3c7',
                                  color: '#d97706',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 600
                                }}
                              >
                                视觉识别
                              </span>
                            )}
                            {tool.features.functionCalling && (
                              <span
                                style={{
                                  padding: '3px 8px',
                                  backgroundColor: '#ddd6fe',
                                  color: '#7c3aed',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 600
                                }}
                              >
                                函数调用
                              </span>
                            )}
                            {tool.features.streaming && (
                              <span
                                style={{
                                  padding: '3px 8px',
                                  backgroundColor: '#bfdbfe',
                                  color: '#1d4ed8',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 600
                                }}
                              >
                                流式输出
                              </span>
                            )}
                            {tool.features.jsonMode && (
                              <span
                                style={{
                                  padding: '3px 8px',
                                  backgroundColor: '#d1fae5',
                                  color: '#059669',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 600
                                }}
                              >
                                JSON 模式
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
            backgroundColor: 'white',
            borderRadius: '0 0 20px 20px',
            flexShrink: 0
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'white',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = '#f9fafb'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'white'
            }}
          >
            关闭
          </button>
          <button
            onClick={() => onImport(workPackage)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: workPackage.color,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = 'scale(1.02)'
              event.currentTarget.style.boxShadow = `0 6px 20px ${workPackage.color}40`
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = 'scale(1)'
              event.currentTarget.style.boxShadow = 'none'
            }}
          >
            一键导入
          </button>
        </div>
      </div>
    </div>
  )
}
