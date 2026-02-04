import { useState, useEffect } from 'react'
import { NavigationSection, navigationSectionsService } from '../services/navigationService'

interface NavigationSectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editSection?: NavigationSection | null
}

export const NavigationSectionModal: React.FC<NavigationSectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editSection
}) => {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editSection) {
      setName(editSection.name)
    } else {
      setName('')
    }
    setError(null)
  }, [editSection, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('分类名称不能为空')
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (editSection) {
        await navigationSectionsService.updateSection(editSection.id, { name })
      } else {
        await navigationSectionsService.createSection({ name })
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Failed to save section:', err)
      setError(err.response?.data?.error || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!editSection) return

    // "最近使用" 不可删除
    if (editSection.type === 'recent') {
      setError('"最近使用"不可删除')
      return
    }

    if (!confirm(`确定要删除"${editSection.name}"吗？`)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await navigationSectionsService.deleteSection(editSection.id)
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Failed to delete section:', err)
      setError(err.response?.data?.error || '删除失败')
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
        zIndex: 10002
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          width: '90%',
          maxWidth: '400px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '1.5rem',
          color: '#374151'
        }}>
          {editSection ? '编辑分类' : '创建新分类'}
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
              分类名称 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入分类名称"
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                fontSize: '14px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#7C9187'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              marginBottom: '1rem',
              color: '#dc2626',
              fontSize: '14px'
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
            {editSection && editSection.type !== 'recent' && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                style={{
                  padding: '0.625rem 1rem',
                  fontSize: '14px',
                  color: '#dc2626',
                  backgroundColor: 'white',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
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
                padding: '0.625rem 1rem',
                fontSize: '14px',
                color: '#6b7280',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
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
                color: 'white',
                backgroundColor: '#7C9187',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
