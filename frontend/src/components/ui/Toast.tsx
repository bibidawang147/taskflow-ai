import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface ToastContextType {
  showToast: (message: string, type?: ToastItem['type']) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => setVisible(false), 2700)
    return () => clearTimeout(timer)
  }, [])

  const colors = {
    success: { bg: '#dcfce7', border: '#bbf7d0', text: '#166534', icon: '\u2713' },
    error: { bg: '#fee2e2', border: '#fecaca', text: '#dc2626', icon: '\u2717' },
    warning: { bg: '#fef3c7', border: '#fde68a', text: '#92400e', icon: '\u26A0' },
    info: { bg: '#ede9fe', border: '#ddd6fe', text: '#5b21b6', icon: '\u2139' }
  }

  const c = colors[toast.type]

  return (
    <div
      style={{
        padding: '12px 20px',
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '10px',
        color: c.text,
        fontSize: '14px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        pointerEvents: 'auto',
        cursor: 'pointer',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(100px)',
        transition: 'all 0.3s ease',
        maxWidth: '400px',
        wordBreak: 'break-word' as const
      }}
      onClick={onClose}
    >
      <span style={{ fontSize: '16px', flexShrink: 0 }}>{c.icon}</span>
      <span>{toast.message}</span>
    </div>
  )
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
