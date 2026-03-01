import { useState } from 'react'
import { API_BASE_URL } from '../services/api'

const SLOT_COUNT = 10

interface SlotState {
  content: string
  rawJson: string
  isLoading: boolean
  error: string
  copied: boolean
}

function makeSlot(): SlotState {
  return { content: '', rawJson: '', isLoading: false, error: '', copied: false }
}

export default function TextToWorkflowJsonPage() {
  const [slots, setSlots] = useState<SlotState[]>(() => Array.from({ length: SLOT_COUNT }, makeSlot))
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ message: string; results: any[] } | null>(null)
  const [globalError, setGlobalError] = useState('')

  const updateSlot = (i: number, patch: Partial<SlotState>) => {
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  }

  const handleConvert = async (i: number) => {
    const slot = slots[i]
    if (!slot.content.trim()) {
      updateSlot(i, { error: '请粘贴内容' })
      return
    }

    updateSlot(i, { isLoading: true, error: '', rawJson: '' })

    try {
      const response = await fetch(`${API_BASE_URL}/api/workflows/text-to-import-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: slot.content.trim() })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '转换失败')
      }

      const data = await response.json()
      updateSlot(i, { rawJson: JSON.stringify(data.workflows, null, 2), isLoading: false })
    } catch (err: any) {
      updateSlot(i, { error: err.message || '转换失败', isLoading: false })
    }
  }

  const handleCopy = async (i: number) => {
    const json = slots[i].rawJson
    if (!json) return
    try {
      await navigator.clipboard.writeText(json)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = json
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    updateSlot(i, { copied: true })
    setTimeout(() => updateSlot(i, { copied: false }), 2000)
  }

  const handleDownload = (i: number) => {
    const json = slots[i].rawJson
    if (!json) return
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-${i + 1}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportAll = async () => {
    const allWorkflows: any[] = []
    for (const slot of slots) {
      if (!slot.rawJson) continue
      try {
        const parsed = JSON.parse(slot.rawJson)
        const arr = Array.isArray(parsed) ? parsed : [parsed]
        allWorkflows.push(...arr)
      } catch { /* skip */ }
    }

    if (allWorkflows.length === 0) {
      setGlobalError('没有可导入的工作流，请先转换')
      return
    }

    setGlobalError('')
    setIsImporting(true)
    setImportResult(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/workflows/batch-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ workflows: allWorkflows })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '导入失败')
      }

      const data = await response.json()
      setImportResult(data)
    } catch (err: any) {
      setGlobalError(err.message || '导入失败')
    } finally {
      setIsImporting(false)
    }
  }

  const finishedCount = slots.filter(s => s.rawJson).length

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>工作流批量导入</h1>
          <p style={{ color: '#666', fontSize: 14 }}>
            左侧粘贴文字，点转换后右侧出 JSON，最后一键导入（已转换 {finishedCount}/{SLOT_COUNT}）
          </p>
        </div>
        {finishedCount > 0 && !importResult && (
          <button
            onClick={handleImportAll}
            disabled={isImporting}
            style={{
              padding: '10px 28px',
              background: isImporting ? '#9ca3af' : '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: isImporting ? 'not-allowed' : 'pointer',
              flexShrink: 0,
            }}
          >
            {isImporting ? '导入中...' : `导入全部 ${finishedCount} 个到平台`}
          </button>
        )}
      </div>

      {importResult && (
        <div style={{ marginBottom: 20, padding: '16px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#166534', marginBottom: 8 }}>{importResult.message}</div>
          {importResult.results.map((r: any, idx: number) => (
            <div key={idx} style={{ fontSize: 13, color: r.success ? '#166534' : '#dc2626', marginTop: 4 }}>
              {r.success ? 'OK' : 'FAIL'} {r.title}
              {r.success && r.id && <span style={{ color: '#6b7280', marginLeft: 8 }}>({r.id})</span>}
              {!r.success && r.error && <span style={{ marginLeft: 8 }}>- {r.error}</span>}
            </div>
          ))}
        </div>
      )}

      {globalError && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 14 }}>
          {globalError}
        </div>
      )}

      {/* 10 组，每组左输入右输出 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {slots.map((slot, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: 16,
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: 16,
            background: '#fff',
          }}>
            {/* 左：输入 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6 }}>
                #{i + 1} 文字内容
              </div>
              <textarea
                value={slot.content}
                onChange={(e) => updateSlot(i, { content: e.target.value })}
                placeholder="粘贴一个工作流的文字描述..."
                style={{
                  flex: 1,
                  minHeight: 140,
                  padding: 12,
                  border: '1px solid #e0e0e0',
                  borderRadius: 6,
                  fontSize: 13,
                  lineHeight: 1.5,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => handleConvert(i)}
                  disabled={slot.isLoading || !slot.content.trim()}
                  style={{
                    padding: '6px 20px',
                    background: slot.isLoading ? '#9ca3af' : '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: slot.isLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {slot.isLoading ? '转换中...' : '转换'}
                </button>
                {slot.content.trim() && (
                  <span style={{ color: '#999', fontSize: 12 }}>{slot.content.length} 字</span>
                )}
                {slot.error && (
                  <span style={{ color: '#dc2626', fontSize: 12 }}>{slot.error}</span>
                )}
              </div>
            </div>

            {/* 右：输出 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>JSON 结果</span>
                {slot.rawJson && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleCopy(i)} style={smallBtn(slot.copied)}>
                      {slot.copied ? '已复制' : '复制'}
                    </button>
                    <button onClick={() => handleDownload(i)} style={smallBtn(false)}>
                      下载
                    </button>
                  </div>
                )}
              </div>
              {slot.isLoading ? (
                <div style={{
                  flex: 1,
                  minHeight: 140,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f9fafb',
                  borderRadius: 6,
                  border: '1px solid #e0e0e0',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 24, height: 24,
                      border: '3px solid #e5e7eb', borderTopColor: '#4f46e5',
                      borderRadius: '50%', animation: 'spin 1s linear infinite',
                      margin: '0 auto 8px',
                    }} />
                    <span style={{ color: '#999', fontSize: 12 }}>AI 转换中...</span>
                  </div>
                </div>
              ) : slot.rawJson ? (
                <textarea
                  value={slot.rawJson}
                  onChange={(e) => updateSlot(i, { rawJson: e.target.value })}
                  style={{
                    flex: 1,
                    minHeight: 140,
                    padding: 12,
                    border: '1px solid #d1fae5',
                    borderRadius: 6,
                    fontSize: 12,
                    lineHeight: 1.4,
                    resize: 'vertical',
                    fontFamily: 'monospace',
                    outline: 'none',
                    background: '#f0fdf4',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <div style={{
                  flex: 1,
                  minHeight: 140,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f9fafb',
                  borderRadius: 6,
                  border: '1px dashed #d1d5db',
                  color: '#bbb',
                  fontSize: 13,
                }}>
                  转换后显示
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function smallBtn(active: boolean): React.CSSProperties {
  return {
    padding: '2px 10px', background: active ? '#10b981' : '#f3f4f6',
    color: active ? '#fff' : '#374151', border: '1px solid #e5e7eb',
    borderRadius: 5, fontSize: 12, cursor: 'pointer',
  }
}
