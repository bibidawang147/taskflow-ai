import { User } from 'lucide-react'

interface UserDropdownMenuProps {
  onLogout: () => void
}

export function UserDropdownMenu({ onLogout }: UserDropdownMenuProps) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '6px 12px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#6b7280',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db'
          e.currentTarget.style.color = '#4b5563'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e5e7eb'
          e.currentTarget.style.color = '#6b7280'
        }}
      >
        <User size={16} />
        <span>退出</span>
      </button>
    </div>
  )
}
