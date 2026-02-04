import { useState } from 'react'
import { X, Rocket, GitBranch, AlertCircle, Wrench, Bug, Bell } from 'lucide-react'
import { versionService } from '../services/versionService'

interface VersionPublishModalProps {
  isOpen: boolean
  onClose: () => void
  workflowId: string
  currentVersion: string
  workflowTitle: string
  onPublished?: (version: string, notificationsCount: number) => void
}

export function VersionPublishModal({
  isOpen,
  onClose,
  workflowId,
  currentVersion,
  workflowTitle,
  onPublished
}: VersionPublishModalProps) {
  const [changeType, setChangeType] = useState<'major' | 'minor' | 'patch'>('minor')
  const [changelog, setChangelog] = useState('')
  const [notifySubscribers, setNotifySubscribers] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const newVersion = versionService.getNextVersion(currentVersion, changeType)

  const changeTypeOptions = [
    {
      type: 'major' as const,
      label: '重大更新',
      icon: AlertCircle,
      color: '#ef4444',
      description: '全新改版、重大功能变更'
    },
    {
      type: 'minor' as const,
      label: '功能更新',
      icon: Wrench,
      color: '#7C9187',
      description: '新增功能、优化改进'
    },
    {
      type: 'patch' as const,
      label: '问题修复',
      icon: Bug,
      color: '#10b981',
      description: '修复问题、小幅调整'
    }
  ]

  const handlePublish = async () => {
    if (!changelog.trim()) {
      setError('请填写更新说明')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 创建版本
      const createResult = await versionService.createVersion(workflowId, {
        changeType,
        changelog: changelog.trim()
      })

      // 发布版本
      const publishResult = await versionService.publishVersion(
        workflowId,
        createResult.version.id,
        {
          notifySubscribers,
          notificationMessage: changelog.trim()
        }
      )

      onPublished?.(publishResult.version.version, publishResult.notificationsCount)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || '发布失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '520px',
        margin: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        {/* 头部 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #f3f4f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #7C9187 0%, #6A7C75 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Rocket size={20} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                发布新版本
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                {workflowTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#9ca3af'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 内容 */}
        <div style={{ padding: '24px' }}>
          {/* 版本号显示 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '12px'
          }}>
            <GitBranch size={20} color="#6b7280" />
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>版本变更</p>
              <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: '600' }}>
                <span style={{ color: '#9ca3af' }}>v{currentVersion}</span>
                <span style={{ margin: '0 8px', color: '#d1d5db' }}>→</span>
                <span style={{ color: '#7C9187' }}>v{newVersion}</span>
              </p>
            </div>
          </div>

          {/* 更新类型选择 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              更新类型
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {changeTypeOptions.map(option => {
                const Icon = option.icon
                const isSelected = changeType === option.type
                return (
                  <button
                    key={option.type}
                    onClick={() => setChangeType(option.type)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: isSelected ? `${option.color}10` : 'white',
                      border: `2px solid ${isSelected ? option.color : '#e5e7eb'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icon
                      size={20}
                      color={isSelected ? option.color : '#9ca3af'}
                      style={{ marginBottom: '6px' }}
                    />
                    <p style={{
                      margin: 0,
                      fontSize: '13px',
                      fontWeight: '600',
                      color: isSelected ? option.color : '#6b7280'
                    }}>
                      {option.label}
                    </p>
                    <p style={{
                      margin: '4px 0 0',
                      fontSize: '11px',
                      color: '#9ca3af'
                    }}>
                      {option.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 更新说明 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              更新说明 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="描述一下这次更新的内容..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7C9187'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* 通知选项 */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            background: '#f9fafb',
            borderRadius: '10px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={notifySubscribers}
              onChange={(e) => setNotifySubscribers(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: '#7C9187'
              }}
            />
            <Bell size={18} color="#6b7280" />
            <span style={{ fontSize: '14px', color: '#374151' }}>
              通知收藏了该工作流的用户
            </span>
          </label>

          {/* 错误提示 */}
          {error && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#fef2f2',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '20px 24px',
          borderTop: '1px solid #f3f4f6'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#4b5563',
              cursor: 'pointer'
            }}
          >
            取消
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              background: loading ? '#d1d5db' : 'linear-gradient(135deg, #7C9187 0%, #6A7C75 100%)',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Rocket size={16} />
            {loading ? '发布中...' : '发布版本'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default VersionPublishModal
