import { useState, useCallback, createContext, useContext, ReactNode, useRef } from 'react'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'danger'
}

interface ConfirmContextType {
  showConfirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      resolveRef.current = resolve
      setDialog(options)
    })
  }, [])

  const handleClose = (result: boolean) => {
    resolveRef.current?.(result)
    resolveRef.current = null
    setDialog(null)
  }

  const colors = {
    info: '#8b5cf6',
    warning: '#f59e0b',
    danger: '#ef4444'
  }

  const btnColor = dialog ? colors[dialog.type || 'info'] : colors.info

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      {dialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99998,
            backdropFilter: 'blur(2px)'
          }}
          onClick={() => handleClose(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              animation: 'confirmFadeIn 0.2s ease'
            }}
            onClick={e => e.stopPropagation()}
          >
            {dialog.title && (
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: 600,
                color: '#1f2937'
              }}>
                {dialog.title}
              </h3>
            )}
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              color: '#4b5563',
              lineHeight: 1.6,
              whiteSpace: 'pre-line'
            }}>
              {dialog.message}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => handleClose(false)}
                style={{
                  padding: '8px 18px',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                {dialog.cancelText || '取消'}
              </button>
              <button
                onClick={() => handleClose(true)}
                style={{
                  padding: '8px 18px',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: btnColor,
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                {dialog.confirmText || '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes confirmFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmContextType {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context
}
