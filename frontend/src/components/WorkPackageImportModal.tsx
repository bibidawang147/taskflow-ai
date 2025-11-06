import { useState } from 'react'
import { WorkPackage } from '../types/workPackage'

interface WorkPackageImportModalProps {
  workPackage: WorkPackage
  onClose: () => void
  onConfirm: (targetModule: string) => void
}

export default function WorkPackageImportModal({
  workPackage,
  onClose,
  onConfirm
}: WorkPackageImportModalProps) {
  const [selectedModule, setSelectedModule] = useState<string>('')

  // 可选的目标模块
  const modules = [
    { id: 'ai', name: 'AI工具', icon: '🤖', color: '#ec4899' },
    { id: 'text', name: '文字处理', icon: '📝', color: '#3b82f6' },
    { id: 'image', name: '图片处理', icon: '🎨', color: '#06b6d4' },
    { id: 'video', name: '视频制作', icon: '🎬', color: '#8b5cf6' },
    { id: 'marketing', name: '营销模块', icon: '📢', color: '#f59e0b' },
    { id: 'product', name: '产品模块', icon: '📦', color: '#10b981' },
    { id: 'analysis', name: '分析模块', icon: '📊', color: '#ef4444' }
  ]

  const handleConfirm = () => {
    if (selectedModule) {
      onConfirm(selectedModule)
      onClose()
    }
  }

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
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 弹窗头部 */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            borderRadius: '20px 20px 0 0',
            zIndex: 1
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: `${workPackage.color}15`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}
              >
                {workPackage.icon}
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 0.25rem 0', color: '#1f2937' }}>
                  导入工作包
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  选择要导入到的工作模块
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* 弹窗内容 */}
        <div style={{ padding: '1.5rem' }}>
          {/* 工作包信息 */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
              {workPackage.name}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.75rem' }}>
              {workPackage.description}
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '13px', color: '#9ca3af' }}>
              <span>📦 {workPackage.items.length} 个工作项</span>
              <span>⬇️ {workPackage.stats.downloads >= 10000
                ? `${(workPackage.stats.downloads / 1000).toFixed(1)}k`
                : workPackage.stats.downloads} 次下载</span>
              <span>⭐ {workPackage.stats.rating} 评分</span>
            </div>
          </div>

          {/* 模块选择 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
              选择目标模块 *
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem'
              }}
            >
              {modules.map((module) => (
                <div
                  key={module.id}
                  onClick={() => setSelectedModule(module.id)}
                  style={{
                    padding: '1rem',
                    backgroundColor: selectedModule === module.id ? `${module.color}10` : 'white',
                    border: `2px solid ${selectedModule === module.id ? module.color : '#e5e7eb'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedModule !== module.id) {
                      e.currentTarget.style.borderColor = module.color
                      e.currentTarget.style.backgroundColor = `${module.color}05`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedModule !== module.id) {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.backgroundColor = 'white'
                    }
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: `${module.color}15`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}
                  >
                    {module.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                      {module.name}
                    </div>
                  </div>
                  {selectedModule === module.id && (
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: module.color,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 导入说明 */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>ℹ️</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e40af', marginBottom: '0.25rem' }}>
                  导入说明
                </div>
                <ul style={{ margin: '0', paddingLeft: '1.25rem', fontSize: '12px', color: '#3b82f6', lineHeight: '1.6' }}>
                  <li>工作包中的所有工作项和工具将导入到选定的模块中</li>
                  <li>如果存在同名工作项，将自动重命名避免冲突</li>
                  <li>导入后可以在「AI工作台」中查看和使用</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 弹窗底部 */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'white',
            borderRadius: '0 0 20px 20px'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: 'white',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white'
            }}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedModule}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: selectedModule ? workPackage.color : '#e5e7eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: selectedModule ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              opacity: selectedModule ? 1 : 0.6
            }}
            onMouseEnter={(e) => {
              if (selectedModule) {
                e.currentTarget.style.transform = 'scale(1.02)'
                e.currentTarget.style.boxShadow = `0 4px 12px ${workPackage.color}40`
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            确认导入
          </button>
        </div>
      </div>
    </div>
  )
}
