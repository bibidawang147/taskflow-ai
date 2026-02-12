import { useState, useEffect } from 'react'
import { usePermission } from '../hooks/usePermission'
import { api } from '../services/api'
import { useToast } from '../components/ui/Toast'
import { Shield, Save, Loader2, RefreshCw } from 'lucide-react'

interface PricingConfig {
  id: string
  currentTier: string
  earlyBirdPrice: number
  growthPrice: number
  standardPrice: number
  earlyBirdLimit: number
  earlyBirdSold: number
  renewalDiscount: number
  renewalWindowDays: number
  growthStartAt: string
  standardStartAt: string
  createdAt: string
  updatedAt: string
}

const TIER_LABELS: Record<string, string> = {
  early_bird: '早鸟价',
  growth: '成长价',
  standard: '标准价',
}

export default function AdminPricingPage() {
  const { isAdmin, loading: permLoading } = usePermission()
  const { showToast } = useToast()
  const [config, setConfig] = useState<PricingConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    earlyBirdPrice: 199,
    growthPrice: 349,
    standardPrice: 499,
    earlyBirdLimit: 500,
    renewalDiscount: 0.7,
    renewalWindowDays: 30,
    growthStartAt: '',
    standardStartAt: '',
  })

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/pricing/admin/config')
      setConfig(res.data)
      setForm({
        earlyBirdPrice: res.data.earlyBirdPrice,
        growthPrice: res.data.growthPrice,
        standardPrice: res.data.standardPrice,
        earlyBirdLimit: res.data.earlyBirdLimit,
        renewalDiscount: res.data.renewalDiscount,
        renewalWindowDays: res.data.renewalWindowDays,
        growthStartAt: res.data.growthStartAt?.slice(0, 10) || '',
        standardStartAt: res.data.standardStartAt?.slice(0, 10) || '',
      })
    } catch (err) {
      console.error('获取定价配置失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConfig() }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.patch('/api/pricing/admin/config', {
        earlyBirdPrice: form.earlyBirdPrice,
        growthPrice: form.growthPrice,
        standardPrice: form.standardPrice,
        earlyBirdLimit: form.earlyBirdLimit,
        renewalDiscount: form.renewalDiscount,
        renewalWindowDays: form.renewalWindowDays,
        growthStartAt: form.growthStartAt || undefined,
        standardStartAt: form.standardStartAt || undefined,
      })
      if (res.data.success) {
        showToast('配置已保存', 'success')
        fetchConfig()
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || '保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (permLoading) return <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF' }}>加载中...</div>
  if (!isAdmin) return <div style={{ padding: '60px', textAlign: 'center', color: '#EF4444', fontSize: '16px' }}>无权限访问此页面</div>

  if (loading || !config) return <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF' }}>加载中...</div>

  const progressPercent = Math.min(100, (config.earlyBirdSold / config.earlyBirdLimit) * 100)

  return (
    <div style={{ padding: '24px 32px', maxWidth: '800px', margin: '0 auto' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={24} color="#8b5cf6" />
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: 0 }}>定价管理</h1>
        </div>
        <button onClick={fetchConfig} style={outlineBtn}>
          <RefreshCw size={14} /> 刷新
        </button>
      </div>

      {/* 当前状态卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>当前阶段</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>
            {TIER_LABELS[config.currentTier] || config.currentTier}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>早鸟已售</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#D97706' }}>
            {config.earlyBirdSold} / {config.earlyBirdLimit}
          </div>
          <div style={{ marginTop: '8px', height: '4px', background: '#FEF3C7', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPercent}%`, background: '#F59E0B', borderRadius: '2px' }} />
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>最后更新</div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
            {new Date(config.updatedAt).toLocaleString('zh-CN')}
          </div>
        </div>
      </div>

      {/* 配置表单 */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111', margin: '0 0 20px 0' }}>定价配置</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <FormField label="早鸟价（元）">
            <input type="number" value={form.earlyBirdPrice}
              onChange={e => setForm({ ...form, earlyBirdPrice: parseFloat(e.target.value) || 0 })}
              style={inputStyle} />
          </FormField>
          <FormField label="成长价（元）">
            <input type="number" value={form.growthPrice}
              onChange={e => setForm({ ...form, growthPrice: parseFloat(e.target.value) || 0 })}
              style={inputStyle} />
          </FormField>
          <FormField label="标准价/原价（元）">
            <input type="number" value={form.standardPrice}
              onChange={e => setForm({ ...form, standardPrice: parseFloat(e.target.value) || 0 })}
              style={inputStyle} />
          </FormField>
          <FormField label="早鸟名额上限">
            <input type="number" value={form.earlyBirdLimit}
              onChange={e => setForm({ ...form, earlyBirdLimit: parseInt(e.target.value) || 0 })}
              style={inputStyle} />
          </FormField>
          <FormField label="续费折扣（如 0.7 = 七折）">
            <input type="number" value={form.renewalDiscount} step="0.05" min="0" max="1"
              onChange={e => setForm({ ...form, renewalDiscount: parseFloat(e.target.value) || 0 })}
              style={inputStyle} />
          </FormField>
          <FormField label="续费窗口（到期前N天可续费）">
            <input type="number" value={form.renewalWindowDays}
              onChange={e => setForm({ ...form, renewalWindowDays: parseInt(e.target.value) || 0 })}
              style={inputStyle} />
          </FormField>
          <FormField label="成长价启动日期">
            <input type="date" value={form.growthStartAt}
              onChange={e => setForm({ ...form, growthStartAt: e.target.value })}
              style={inputStyle} />
          </FormField>
          <FormField label="标准价启动日期">
            <input type="date" value={form.standardStartAt}
              onChange={e => setForm({ ...form, standardStartAt: e.target.value })}
              style={inputStyle} />
          </FormField>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            保存配置
          </button>
        </div>
      </div>

      {/* 阶段说明 */}
      <div style={{ marginTop: '20px', padding: '16px 20px', background: '#F9FAFB', borderRadius: '8px', fontSize: '13px', color: '#6B7280', lineHeight: 1.8 }}>
        <strong>定价阶段切换规则：</strong><br />
        1. 早鸟名额售罄 → 自动切换到成长价<br />
        2. 到达成长价启动日期 → 自动切换到成长价<br />
        3. 到达标准价启动日期 → 自动切换到标准价<br />
        系统每小时自动检查一次阶段切换条件。
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#374151' }}>
      {label}
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px',
  fontSize: '14px', outline: 'none', boxSizing: 'border-box', width: '100%'
}

const cardStyle: React.CSSProperties = {
  padding: '16px 20px', backgroundColor: 'white',
  border: '1px solid #E5E7EB', borderRadius: '10px'
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
