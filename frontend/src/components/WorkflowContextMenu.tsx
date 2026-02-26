import { useEffect, useRef } from 'react'
import { Workflow } from '../services/navigationService'

type SidebarSection = 'library' | 'my-workflows' | 'favorites'

interface WorkflowContextMenuProps {
  workflow: Workflow | null
  position: { x: number; y: number }
  section?: SidebarSection
  isFavorited?: boolean
  onClose: () => void
  onOpen?: () => void
  onCopy?: () => void
  onDelete?: () => void
  onAddToFavorites?: () => void
  onRemoveFromFavorites?: () => void
  onEdit?: () => void
}

export const WorkflowContextMenu: React.FC<WorkflowContextMenuProps> = ({
  workflow,
  position,
  section,
  isFavorited,
  onClose,
  onOpen,
  onCopy,
  onDelete,
  onAddToFavorites,
  onRemoveFromFavorites,
  onEdit
}) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    // 用 mousedown 而不是 click，避免和菜单项的 onClick 冲突
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  if (!workflow) return null

  // 根据 section 决定菜单项显隐；无 section 时回退到旧逻辑
  const s = section
  const isOwn = workflow.source === 'own'

  const menuItems = [
    {
      label: '打开工作流',
      onClick: onOpen,
      show: true
    },
    {
      label: '编辑',
      onClick: onEdit,
      show: s ? s === 'my-workflows' : isOwn
    },
    {
      label: '复制到我的AI工作法',
      onClick: onCopy,
      show: s ? s !== 'my-workflows' : true
    },
    {
      label: '添加到收藏',
      onClick: onAddToFavorites,
      show: s === 'library' || (s === 'my-workflows' && !isFavorited) || (!s && !isOwn)
    },
    {
      label: '取消收藏',
      onClick: onRemoveFromFavorites,
      show: s === 'favorites' || (s === 'my-workflows' && isFavorited)
    },
    {
      label: '删除',
      onClick: onDelete,
      show: s ? s === 'my-workflows' : isOwn,
      danger: true
    }
  ]

  return (
    <div
      ref={menuRef}
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
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
