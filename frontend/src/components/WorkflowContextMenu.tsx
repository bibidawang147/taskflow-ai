import { useEffect } from 'react'
import { Workflow } from '../services/navigationService'

interface WorkflowContextMenuProps {
  workflow: Workflow | null
  position: { x: number; y: number }
  onClose: () => void
  onOpen?: () => void
  onCopy?: () => void
  onDelete?: () => void
  onAddToFavorites?: () => void
  onEdit?: () => void
}

export const WorkflowContextMenu: React.FC<WorkflowContextMenuProps> = ({
  workflow,
  position,
  onClose,
  onOpen,
  onCopy,
  onDelete,
  onAddToFavorites,
  onEdit
}) => {
  useEffect(() => {
    const handleClickOutside = () => onClose()
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  if (!workflow) return null

  const menuItems = [
    {
      label: '打开工作流',
      icon: '📂',
      onClick: onOpen,
      show: true
    },
    {
      label: '编辑',
      icon: '✏️',
      onClick: onEdit,
      show: workflow.source === 'own'
    },
    {
      label: '复制',
      icon: '📋',
      onClick: onCopy,
      show: true
    },
    {
      label: '添加到收藏',
      icon: '⭐',
      onClick: onAddToFavorites,
      show: workflow.source !== 'own' || !workflow.id
    },
    {
      label: '删除',
      icon: '🗑️',
      onClick: onDelete,
      show: workflow.source === 'own' && workflow.isDraft,
      danger: true
    }
  ]

  return (
    <div
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)',
        padding: '0.5rem 0',
        minWidth: '180px',
        zIndex: 9999
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.filter(item => item.show).map((item, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation()
            item.onClick?.()
            onClose()
          }}
          style={{
            width: '100%',
            padding: '0.625rem 1rem',
            fontSize: '14px',
            color: item.danger ? '#dc2626' : '#374151',
            backgroundColor: 'transparent',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'background-color 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = item.danger ? '#fef2f2' : '#f3f4f6'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <span style={{ fontSize: '16px' }}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
