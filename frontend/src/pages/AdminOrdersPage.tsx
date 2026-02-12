import { useState, useEffect, useCallback } from 'react'
import { usePermission } from '../hooks/usePermission'
import { api } from '../services/api'
import { useToast } from '../components/ui/Toast'
import { useConfirm } from '../components/ui/ConfirmDialog'
import { Shield, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react'

interface OrderItem {
  id: string
  user: { id: string; name: string; email: string; avatar: string | null; role: string }
  plan: string
  status: string
  priceTier: string | null
  originalPrice: number | null
  paidAmount: number | null
  isRenewal: boolean
  renewalDiscount: number | null
  promoCode: string | null
  startedAt: string
  expiresAt: string
  createdAt: string
}

const TIER_LABELS: Record<string, string> = {
  early_bird: '早鸟价',
  growth: '成长价',
  standard: '标准价',
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待确认', color: '#D97706', bg: '#FEF3C7' },
  active: { label: '已激活', color: '#059669', bg: '#D1FAE5' },
  expired: { label: '已过期', color: '#6B7280', bg: '#F3F4F6' },
  cancelled: { label: '已取消', color: '#EF4444', bg: '#FEE2E2' },
}

export default function AdminOrdersPage() {
  const { isAdmin, loading: permLoading } = usePermission()
  const { showToast } = useToast()
  const { showConfirm } = useConfirm()
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [activatingId, setActivatingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await api.get('/api/pricing/admin/orders', {
        params: { status: statusFilter, page: p, pageSize: 20 }
      })
      setOrders(res.data.subscriptions)
      setTotal(res.data.total)
      setPage(p)
    } catch (err) {
      console.error('获取订单失败:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleActivate = async (orderId: string) => {
    if (!await showConfirm({ message: '确认该笔订单已支付？激活后用户将立即获得会员权益。' })) return
    setActivatingId(orderId)
    try {
      const res = await api.post(`/api/pricing/admin/activate/${orderId}`)
      if (res.data.success) {
        showToast('订阅已激活', 'success')
        fetchOrders(page)
      } else {
        showToast(res.data.error || '激活失败', 'error')
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || '激活失败', 'error')
    } finally {
      setActivatingId(null)
    }
  }

  if (permLoading) return <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF' }}>加载中...</div>
  if (!isAdmin) return <div style={{ padding: '60px', textAlign: 'center', color: '#EF4444', fontSize: '16px' }}>无权限访问此页面</div>

  const totalPages = Math.ceil(total / 20)

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Shield size={24} color="#8b5cf6" />
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: 0 }}>订单管理</h1>
      </div>

      {/* 状态筛选 */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid #E5E7EB' }}>
        {[
          { key: 'pending', label: '待确认', icon: Clock },
          { key: 'active', label: '已激活', icon: CheckCircle },
          { key: 'expired', label: '已过期', icon: XCircle },
          { key: 'all', label: '全部', icon: Shield },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', border: 'none', background: 'none',
              fontSize: '14px', fontWeight: statusFilter === tab.key ? 600 : 400,
              color: statusFilter === tab.key ? '#8b5cf6' : '#6B7280',
              borderBottom: statusFilter === tab.key ? '2px solid #8b5cf6' : '2px solid transparent',
              cursor: 'pointer', marginBottom: '-1px', transition: 'all 0.15s'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 订单列表 */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB' }}>
              {['用户', '方案', '阶段', '原价', '实付', '折扣', '状态', '创建时间', '操作'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> 加载中...
              </td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>暂无订单</td></tr>
            ) : orders.map(order => {
              const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending
              return (
                <tr key={order.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '10px 12px', minWidth: '180px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 600, color: '#8b5cf6', flexShrink: 0
                      }}>
                        {order.user.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: '#111' }}>{order.user.name}</div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{order.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#374151' }}>
                    Pro · 年度
                    {order.isRenewal && <span style={{ fontSize: '11px', color: '#059669', marginLeft: '6px' }}>续费</span>}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#374151' }}>
                    {order.priceTier ? TIER_LABELS[order.priceTier] || order.priceTier : '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#374151' }}>
                    {order.originalPrice != null ? `¥${order.originalPrice}` : '-'}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111' }}>
                    {order.paidAmount != null ? `¥${order.paidAmount}` : '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#374151', fontSize: '12px' }}>
                    {order.renewalDiscount ? `续费${Math.round(order.renewalDiscount * 100)}%` : ''}
                    {order.promoCode ? `码:${order.promoCode}` : ''}
                    {!order.renewalDiscount && !order.promoCode ? '-' : ''}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
                      fontSize: '11px', fontWeight: 600, backgroundColor: statusInfo.bg, color: statusInfo.color
                    }}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#6B7280', fontSize: '12px' }}>
                    {new Date(order.createdAt).toLocaleString('zh-CN')}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleActivate(order.id)}
                        disabled={activatingId === order.id}
                        style={{
                          padding: '5px 14px', backgroundColor: '#059669', color: 'white',
                          border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
                          opacity: activatingId === order.id ? 0.6 : 1
                        }}
                      >
                        {activatingId === order.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={12} />}
                        确认支付
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
          <button onClick={() => fetchOrders(page - 1)} disabled={page <= 1}
            style={{ padding: '6px 16px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', fontSize: '13px', cursor: 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
            上一页
          </button>
          <span style={{ padding: '6px 12px', fontSize: '13px', color: '#6B7280' }}>{page} / {totalPages}</span>
          <button onClick={() => fetchOrders(page + 1)} disabled={page >= totalPages}
            style={{ padding: '6px 16px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', fontSize: '13px', cursor: 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
