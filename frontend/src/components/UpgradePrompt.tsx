import { useNavigate } from 'react-router-dom'
import { Crown } from 'lucide-react'

interface UpgradePromptProps {
  feature: string
  compact?: boolean
}

export function UpgradePrompt({ feature, compact = false }: UpgradePromptProps) {
  const navigate = useNavigate()

  if (compact) {
    return (
      <span
        onClick={() => navigate('/membership')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 10px',
          fontSize: '12px',
          color: '#D97706',
          backgroundColor: '#FEF3C7',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        <Crown size={12} />
        升级查看
      </span>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      padding: '32px 24px',
      backgroundColor: '#FAFAFA',
      border: '1px dashed #D1D5DB',
      borderRadius: '10px',
      textAlign: 'center',
    }}>
      <Crown size={28} color="#D97706" />
      <div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#111', marginBottom: '4px' }}>
          {feature} 为专业版功能
        </div>
        <div style={{ fontSize: '13px', color: '#6B7280' }}>
          升级到专业版解锁此功能及更多权益
        </div>
      </div>
      <button
        onClick={() => navigate('/membership')}
        style={{
          padding: '8px 24px',
          backgroundColor: '#6366F1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        查看方案
      </button>
    </div>
  )
}
