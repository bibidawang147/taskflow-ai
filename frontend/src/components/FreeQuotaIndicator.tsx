import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Crown } from 'lucide-react'
import { usePermission } from '../hooks/usePermission'
import { creditService } from '../services/credit'
import { UserBalance } from '../types/credit'

export default function FreeQuotaIndicator() {
  const { isFree, loading: permLoading, aiConvertLimit, maxCanvases } = usePermission()
  const [balance, setBalance] = useState<UserBalance | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (permLoading || !isFree) return
    const load = async () => {
      try {
        const data = await creditService.getBalance()
        setBalance(data)
      } catch (error) {
        console.error('[FreeQuotaIndicator] 获取余额失败:', error)
      }
    }
    load()
  }, [isFree, permLoading])

  if (permLoading || !isFree) return null

  const quotaPercent = balance
    ? Math.round((balance.remainingQuota / Math.max(balance.freeQuota, 1)) * 100)
    : 100

  const isLow = quotaPercent <= 20

  return (
    <div
      onClick={() => navigate('/membership')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 12px',
        borderRadius: '8px',
        backgroundColor: isLow ? '#FEF2F2' : '#F5F3FF',
        border: `1px solid ${isLow ? '#FECACA' : '#EDE9FE'}`,
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontSize: '12px',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isLow ? '#FEE2E2' : '#EDE9FE'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isLow ? '#FEF2F2' : '#F5F3FF'
      }}
      title={`免费版：AI转换 ${aiConvertLimit} 次/天，画布 ${maxCanvases} 个上限。点击升级。`}
    >
      <Zap size={13} color={isLow ? '#EF4444' : '#8b5cf6'} />
      <span style={{ color: isLow ? '#DC2626' : '#6B7280', fontWeight: 500 }}>
        免费版
      </span>
      {balance && (
        <>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <span style={{
            color: isLow ? '#DC2626' : '#9CA3AF',
            fontWeight: isLow ? 600 : 400,
          }}>
            今日额度 {quotaPercent}%
          </span>
        </>
      )}
      <Crown size={12} color="#D97706" style={{ marginLeft: '2px' }} />
      <span style={{ color: '#D97706', fontWeight: 500 }}>升级</span>
    </div>
  )
}
