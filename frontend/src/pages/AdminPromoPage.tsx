import { useState, useEffect, useCallback } from 'react'
import { usePermission } from '../hooks/usePermission'
import { authService } from '../services/auth'
import { Loader2, Copy, Download, Ban, Users, Ticket, BarChart3, Search, Crown, Shield } from 'lucide-react'

import { API_BASE_URL } from '../services/api'

// ==================== 类型定义 ====================

interface PromoCodeItem {
  id: string; code: string; type: string; plan: string; durationDays: number
  maxUses: number | null; usedCount: number; isActive: boolean
  expiresAt: string | null; description: string | null
  batchId: string | null; createdAt: string; redemptionCount: number
}

interface UserItem {
  id: string; name: string; email: string; avatar: string | null
  role: string; roleExpiresAt: string | null; tier: string; createdAt: string
  stats: { workflows: number; executions: number; favorites: number; redemptions: number; subscriptions: number }
  balance: { coins: number; totalRecharged: number; totalConsumed: number } | null
}

interface AdminStats {
  users: { total: number; pro: number; creator: number; free: number }
  codes: { total: number; used: number; unused: number }
  subscriptions: { total: number; active: number }
}

const TYPE_LABELS: Record<string, string> = { invite: '邀请码', discount: '优惠码', gift: '赠送码', annual: '年卡码' }
const ROLE_LABELS: Record<string, string> = { free: 'Free', pro: 'Pro', creator: '创作者', admin: '管理员' }
const ROLE_TAG: Record<string, { bg: string; text: string }> = {
  free: { bg: '#F3F4F6', text: '#6B7280' },
  pro: { bg: '#FEF3C7', text: '#D97706' },
  creator: { bg: '#F3E8FF', text: '#7C3AED' },
  admin: { bg: '#DBEAFE', text: '#2563EB' }
}

// ==================== 主组件 ====================

export default function AdminPromoPage() {
  const { isAdmin, loading: permLoading } = usePermission()
  const [activeTab, setActiveTab] = useState<'overview' | 'codes' | 'users'>('overview')

  const headers = useCallback(() => {
    const token = authService.getToken()
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) h['Authorization'] = `Bearer ${token}`
    return h
  }, [])

  if (permLoading) return <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF' }}>加载中...</div>
  if (!isAdmin) return <div style={{ padding: '60px', textAlign: 'center', color: '#EF4444', fontSize: '16px' }}>无权限访问此页面</div>

  const tabs = [
    { key: 'overview' as const, label: '数据概览', icon: BarChart3 },
    { key: 'codes' as const, label: '邀请码管理', icon: Ticket },
    { key: 'users' as const, label: '用户管理', icon: Users }
  ]

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Shield size={24} color="#8b5cf6" />
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: 0 }}>管理后台</h1>
      </div>

      {/* Tab 栏 */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid #E5E7EB', paddingBottom: '0' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', border: 'none', background: 'none',
              fontSize: '14px', fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? '#8b5cf6' : '#6B7280',
              borderBottom: activeTab === tab.key ? '2px solid #8b5cf6' : '2px solid transparent',
              cursor: 'pointer', marginBottom: '-1px', transition: 'all 0.15s'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      {activeTab === 'overview' && <OverviewPanel headers={headers} />}
      {activeTab === 'codes' && <CodesPanel headers={headers} />}
      {activeTab === 'users' && <UsersPanel headers={headers} />}
    </div>
  )
}

// ==================== 数据概览 ====================

function OverviewPanel({ headers }: { headers: () => Record<string, string> }) {
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/promo/stats`, { headers: headers() })
      .then(r => r.json()).then(setStats).catch((error) => {
        console.error('[AdminPromoPage] 获取统计数据失败:', error)
      })
  }, [headers])

  if (!stats) return <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>加载中...</div>

  const cards = [
    { label: '总用户数', value: stats.users.total, color: '#8b5cf6' },
    { label: 'Pro 会员', value: stats.users.pro, color: '#D97706' },
    { label: '创作者', value: stats.users.creator, color: '#7C3AED' },
    { label: 'Free 用户', value: stats.users.free, color: '#6B7280' },
    { label: '总邀请码', value: stats.codes.total, color: '#2563EB' },
    { label: '已使用', value: stats.codes.used, color: '#059669' },
    { label: '未使用', value: stats.codes.unused, color: '#9CA3AF' },
    { label: '活跃订阅', value: stats.subscriptions.active, color: '#EA580C' }
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      {cards.map((c, i) => (
        <div key={i} style={{
          padding: '20px', backgroundColor: 'white',
          border: '1px solid #E5E7EB', borderRadius: '10px'
        }}>
          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>{c.label}</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: c.color }}>{c.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  )
}

// ==================== 邀请码管理 ====================

function CodesPanel({ headers }: { headers: () => Record<string, string> }) {
  const [codes, setCodes] = useState<PromoCodeItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [listLoading, setListLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [genLoading, setGenLoading] = useState(false)
  const [genResult, setGenResult] = useState<string[] | null>(null)
  const [form, setForm] = useState({
    count: 10, type: 'invite', plan: 'pro', durationDays: 30,
    maxUsesPerCode: 1, expiresAt: '', description: '', prefix: 'LJINVITE'
  })

  const fetchCodes = useCallback(async (p = 1) => {
    setListLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/promo/list?page=${p}&pageSize=20`, { headers: headers() })
      if (res.ok) {
        const data = await res.json()
        setCodes(data.codes)
        setTotal(data.total)
        setPage(p)
      } else {
        console.error('[AdminPromoPage] 获取邀请码列表失败:', res.status, res.statusText)
      }
    } catch (error) {
      console.error('[AdminPromoPage] 获取邀请码列表异常:', error)
    } finally {
      setListLoading(false)
    }
  }, [headers])

  useEffect(() => { fetchCodes() }, [fetchCodes])

  const handleGenerate = async () => {
    setGenLoading(true); setGenResult(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/promo/generate`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ ...form, expiresAt: form.expiresAt || null })
      })
      const data = await res.json()
      if (res.ok && data.success) { setGenResult(data.codes); fetchCodes() }
      else alert(data.error || '生成失败')
    } catch { alert('网络错误') } finally { setGenLoading(false) }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('确定要停用该码吗？')) return
    await fetch(`${API_BASE_URL}/api/admin/promo/${id}/deactivate`, { method: 'PATCH', headers: headers() })
    fetchCodes(page)
  }

  const copy = (text: string) => navigator.clipboard.writeText(text)

  const copyAllUnused = () => {
    const unused = codes.filter(c => c.isActive && c.usedCount === 0).map(c => c.code)
    navigator.clipboard.writeText(unused.join('\n'))
    alert(`已复制 ${unused.length} 个未使用的码`)
  }

  const exportCSV = () => {
    const header = '兑换码,类型,等级,天数,已用/总量,状态,创建时间\n'
    const rows = codes.map(c =>
      `${c.code},${TYPE_LABELS[c.type] || c.type},${c.plan},${c.durationDays},${c.usedCount}/${c.maxUses ?? '∞'},${c.isActive ? '有效' : '停用'},${new Date(c.createdAt).toLocaleString('zh-CN')}`
    ).join('\n')
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `promo-codes-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* 操作栏 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => { setShowForm(!showForm); setGenResult(null) }} style={primaryBtn}>
          {showForm ? '收起' : '批量生成'}
        </button>
        <button onClick={copyAllUnused} style={outlineBtn}><Copy size={14} /> 复制未使用的码</button>
        <button onClick={exportCSV} style={outlineBtn}><Download size={14} /> 导出 CSV</button>
      </div>

      {/* 生成表单 */}
      {showForm && (
        <div style={{ padding: '20px', backgroundColor: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            <FormField label="数量">
              <input type="number" value={form.count} onChange={e => setForm({ ...form, count: parseInt(e.target.value) || 1 })} min={1} max={1000} style={inputStyle} />
            </FormField>
            <FormField label="类型">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                <option value="invite">邀请码</option><option value="discount">优惠码</option>
                <option value="gift">赠送码</option><option value="annual">年卡码</option>
              </select>
            </FormField>
            <FormField label="会员等级">
              <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} style={inputStyle}>
                <option value="pro">Pro</option><option value="creator">创作者</option>
              </select>
            </FormField>
            <FormField label="有效天数">
              <input type="number" value={form.durationDays} onChange={e => setForm({ ...form, durationDays: parseInt(e.target.value) || 30 })} min={1} style={inputStyle} />
            </FormField>
            <FormField label="每码使用次数">
              <input type="number" value={form.maxUsesPerCode} onChange={e => setForm({ ...form, maxUsesPerCode: parseInt(e.target.value) || 1 })} min={1} style={inputStyle} />
            </FormField>
            <FormField label="码前缀">
              <input type="text" value={form.prefix} onChange={e => setForm({ ...form, prefix: e.target.value.toUpperCase() })} style={inputStyle} />
            </FormField>
            <FormField label="码过期日期（选填）">
              <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} style={inputStyle} />
            </FormField>
            <FormField label="备注" span={2}>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="如：早鸟邀请码第一批" style={inputStyle} />
            </FormField>
          </div>
          <div style={{ marginTop: '14px' }}>
            <button onClick={handleGenerate} disabled={genLoading} style={{ ...primaryBtn, opacity: genLoading ? 0.6 : 1 }}>
              {genLoading && <Loader2 size={14} className="animate-spin" />} 确认生成
            </button>
          </div>
          {genResult && (
            <div style={{ marginTop: '14px', padding: '12px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', maxHeight: '200px', overflow: 'auto' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#166534', marginBottom: '6px' }}>成功生成 {genResult.length} 个码</div>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#374151', lineHeight: 1.8 }}>
                {genResult.map((code, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{code}</span>
                    <button onClick={() => copy(code)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}><Copy size={12} color="#6B7280" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 码列表 */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB' }}>
              {['兑换码', '类型', '等级', '天数', '已用/总量', '状态', '创建时间', '操作'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {listLoading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>加载中...</td></tr>
            ) : codes.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>暂无数据</td></tr>
            ) : codes.map(c => (
              <tr key={c.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                <td style={tdStyle}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{c.code}</span>
                  <button onClick={() => copy(c.code)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', marginLeft: '4px' }}><Copy size={12} color="#9CA3AF" /></button>
                </td>
                <td style={tdStyle}>{TYPE_LABELS[c.type] || c.type}</td>
                <td style={tdStyle}><RoleTag role={c.plan} /></td>
                <td style={tdStyle}>{c.durationDays}天</td>
                <td style={tdStyle}>{c.usedCount}/{c.maxUses ?? '∞'}</td>
                <td style={tdStyle}>
                  {c.isActive ? (c.maxUses !== null && c.usedCount >= c.maxUses
                    ? <span style={{ color: '#9CA3AF' }}>已用完</span>
                    : <span style={{ color: '#059669' }}>有效</span>
                  ) : <span style={{ color: '#EF4444' }}>已停用</span>}
                </td>
                <td style={tdStyle}>{new Date(c.createdAt).toLocaleDateString('zh-CN')}</td>
                <td style={tdStyle}>
                  {c.isActive && (
                    <button onClick={() => handleDeactivate(c.id)} style={{ background: 'none', border: '1px solid #FCA5A5', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', fontSize: '12px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Ban size={12} /> 停用
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {total > 20 && <Pagination page={page} total={total} pageSize={20} onPageChange={fetchCodes} />}
    </>
  )
}

// ==================== 用户管理 ====================

function UsersPanel({ headers }: { headers: () => Record<string, string> }) {
  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [newRole, setNewRole] = useState('')
  const [roleDays, setRoleDays] = useState(30)

  const fetchUsers = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: '15' })
      if (search) params.set('search', search)
      if (roleFilter !== 'all') params.set('role', roleFilter)
      const res = await fetch(`${API_BASE_URL}/api/admin/promo/users?${params}`, { headers: headers() })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotal(data.total)
        setPage(p)
      } else {
        console.error('[AdminPromoPage] 获取用户列表失败:', res.status, res.statusText)
      }
    } catch (error) {
      console.error('[AdminPromoPage] 获取用户列表异常:', error)
    } finally {
      setLoading(false)
    }
  }, [headers, search, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleRoleChange = async (userId: string) => {
    if (!newRole) return
    await fetch(`${API_BASE_URL}/api/admin/promo/users/${userId}/role`, {
      method: 'PATCH', headers: headers(),
      body: JSON.stringify({ role: newRole, durationDays: newRole !== 'free' && newRole !== 'admin' ? roleDays : undefined })
    })
    setEditingUser(null)
    fetchUsers(page)
  }

  return (
    <>
      {/* 搜索和筛选 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索用户名或邮箱..."
            style={{ ...inputStyle, paddingLeft: '36px', width: '100%' }}
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ ...inputStyle, width: '140px' }}>
          <option value="all">全部角色</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="creator">创作者</option>
          <option value="admin">管理员</option>
        </select>
      </div>

      {/* 用户列表 */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB' }}>
              {['用户', '角色', '积分', '工作流', '执行次数', '注册时间', '操作'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>加载中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>暂无数据</td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                <td style={{ ...tdStyle, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      backgroundColor: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 600, color: '#8b5cf6', flexShrink: 0
                    }}>
                      {u.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: '#111' }}>{u.name}</div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <RoleTag role={u.role} />
                    {u.role !== 'free' && u.role !== 'admin' && u.roleExpiresAt && (
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                        {new Date(u.roleExpiresAt).toLocaleDateString('zh-CN')} 到期
                      </span>
                    )}
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontWeight: 500 }}>{u.balance ? u.balance.coins.toLocaleString() : '-'}</span>
                </td>
                <td style={tdStyle}>{u.stats.workflows}</td>
                <td style={tdStyle}>{u.stats.executions}</td>
                <td style={tdStyle}>{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
                <td style={{ ...tdStyle, minWidth: '160px' }}>
                  {editingUser === u.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ ...inputStyle, fontSize: '12px', padding: '4px 6px' }}>
                          <option value="">选择角色</option>
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="creator">创作者</option>
                          <option value="admin">管理员</option>
                        </select>
                      </div>
                      {newRole && newRole !== 'free' && newRole !== 'admin' && (
                        <input type="number" value={roleDays} onChange={e => setRoleDays(parseInt(e.target.value) || 30)}
                          placeholder="天数" min={1} style={{ ...inputStyle, fontSize: '12px', padding: '4px 6px', width: '80px' }} />
                      )}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleRoleChange(u.id)} disabled={!newRole}
                          style={{ ...primaryBtn, padding: '3px 10px', fontSize: '12px', opacity: !newRole ? 0.5 : 1 }}>确定</button>
                        <button onClick={() => setEditingUser(null)}
                          style={{ ...outlineBtn, padding: '3px 10px', fontSize: '12px' }}>取消</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingUser(u.id); setNewRole(u.role); setRoleDays(30) }}
                      style={{ ...outlineBtn, padding: '4px 12px', fontSize: '12px' }}
                    >
                      <Crown size={12} /> 改角色
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 15 && <Pagination page={page} total={total} pageSize={15} onPageChange={fetchUsers} />}
    </>
  )
}

// ==================== 公共小组件 ====================

function RoleTag({ role }: { role: string }) {
  const t = ROLE_TAG[role] || ROLE_TAG.free
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
      fontSize: '11px', fontWeight: 600, backgroundColor: t.bg, color: t.text
    }}>
      {ROLE_LABELS[role] || role}
    </span>
  )
}

function FormField({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#374151', gridColumn: span ? `span ${span}` : undefined }}>
      {label}
      {children}
    </label>
  )
}

function Pagination({ page, total, pageSize, onPageChange }: { page: number; total: number; pageSize: number; onPageChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize)
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} style={{ ...paginationBtn, opacity: page <= 1 ? 0.4 : 1 }}>上一页</button>
      <span style={{ padding: '6px 12px', fontSize: '13px', color: '#6B7280' }}>{page} / {totalPages}</span>
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} style={{ ...paginationBtn, opacity: page >= totalPages ? 0.4 : 1 }}>下一页</button>
    </div>
  )
}

// ==================== 样式常量 ====================

const inputStyle: React.CSSProperties = {
  padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px',
  fontSize: '13px', outline: 'none', boxSizing: 'border-box'
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap'
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px', color: '#374151', whiteSpace: 'nowrap'
}

const primaryBtn: React.CSSProperties = {
  padding: '8px 20px', backgroundColor: '#8b5cf6', color: 'white',
  border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
}

const outlineBtn: React.CSSProperties = {
  padding: '8px 16px', backgroundColor: 'white', color: '#374151',
  border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px',
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
}

const paginationBtn: React.CSSProperties = {
  padding: '6px 16px', border: '1px solid #d1d5db', borderRadius: '6px',
  backgroundColor: 'white', fontSize: '13px', cursor: 'pointer'
}
