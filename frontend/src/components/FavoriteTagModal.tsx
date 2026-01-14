import { useState, useEffect } from 'react'
import { FavoriteTag, favoritesService } from '../services/navigationService'

interface FavoriteTagModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editTag?: FavoriteTag | null
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#64748b', // slate
  '#6b7280', // gray
]

const PRESET_ICONS = [
  '📌', '⭐', '❤️', '🔥', '💡', '📊', '📈', '📉',
  '🎯', '🚀', '💼', '📝', '📚', '🎨', '🔧', '⚙️',
  '🌟', '✨', '🎁', '🏆', '📱', '💻', '🖥️', '⌨️',
]

export const FavoriteTagModal: React.FC<FavoriteTagModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editTag
}) => {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [icon, setIcon] = useState('📌')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editTag) {
      setName(editTag.name)
      setColor(editTag.color || '#3b82f6')
      setIcon(editTag.icon || '📌')
    } else {
      setName('')
      setColor('#3b82f6')
      setIcon('📌')
    }
    setError(null)
  }, [editTag, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('标签名称不能为空')
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (editTag) {
        await favoritesService.updateTag(editTag.id, { name, color, icon })
      } else {
        await favoritesService.createTag({ name, color, icon })
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Failed to save tag:', err)
      setError(err.response?.data?.error || '保存标签失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!editTag) return

    if (!confirm(`确定要删除标签"${editTag.name}"吗？`)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await favoritesService.deleteTag(editTag.id)
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Failed to delete tag:', err)
      setError(err.response?.data?.error || '删除标签失败')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          fontSize: '20px',
          fontWeight: 600,
          marginBottom: '1.5rem',
          color: '#111827'
        }}>
          {editTag ? '编辑标签' : '创建新标签'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Name Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              标签名称 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入标签名称"
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                fontSize: '14px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
              autoFocus
            />
          </div>

          {/* Icon Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              图标
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '0.5rem'
            }}>
              {PRESET_ICONS.map((presetIcon) => (
                <button
                  key={presetIcon}
                  type="button"
                  onClick={() => setIcon(presetIcon)}
                  style={{
                    padding: '0.5rem',
                    fontSize: '20px',
                    border: icon === presetIcon ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: icon === presetIcon ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {presetIcon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              颜色
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(9, 1fr)',
              gap: '0.5rem'
            }}>
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '6px',
                    backgroundColor: presetColor,
                    border: color === presetColor ? '3px solid #111827' : '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              预览
            </label>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: `${color}15`,
                borderRadius: '8px',
                border: `2px solid ${color}`,
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              <span>{icon}</span>
              <span>{name || '标签名称'}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#dc2626',
              fontSize: '14px',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end'
          }}>
            {editTag && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                style={{
                  padding: '0.625rem 1.25rem',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#dc2626',
                  backgroundColor: 'white',
                  border: '1px solid #dc2626',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  marginRight: 'auto'
                }}
              >
                删除
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '14px',
                fontWeight: 500,
                color: '#6b7280',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '14px',
                fontWeight: 500,
                color: 'white',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? '保存中...' : editTag ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
