import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, MousePointerClick, FolderOpen, Link2, Sparkles } from 'lucide-react'

const CANVAS_WELCOME_KEY = 'lingji_canvas_welcome_shown'

export function clearCanvasWelcomeFlag() {
  localStorage.removeItem(CANVAS_WELCOME_KEY)
}

interface CanvasWelcomeModalProps {
  onClose?: () => void
}

export default function CanvasWelcomeModal({ onClose }: CanvasWelcomeModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const shown = localStorage.getItem(CANVAS_WELCOME_KEY)
    if (shown) return
    // 只有 WelcomeGuide 已关闭时才显示（避免两个弹窗叠加）
    const welcomeShown = localStorage.getItem('lingji_welcome_shown')
    if (welcomeShown) {
      setVisible(true)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem(CANVAS_WELCOME_KEY, 'true')
    setVisible(false)
    onClose?.()
  }

  if (!visible) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(6px)',
        animation: 'cwm-fadeIn 0.25s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '20px',
          width: '92%',
          maxWidth: '640px',
          padding: '36px 32px 28px',
          position: 'relative',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
          animation: 'cwm-slideUp 0.35s ease',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            color: '#9CA3AF',
            display: 'flex',
          }}
        >
          <X size={18} />
        </button>

        {/* 标题区 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            marginBottom: '14px',
          }}>
            <Sparkles size={26} color="white" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
            欢迎来到你的 AI 工作台
          </h2>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            在画布上自由组织你的 AI 工作流，打造专属工作空间
          </p>
        </div>

        {/* 示例画布预览 */}
        <div style={{
          background: 'linear-gradient(135deg, #f5f3ff 0%, #eef2ff 50%, #fdf2f8 100%)',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid #e9e5f5',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* 网格背景 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, #c4b5fd 0.5px, transparent 0.5px)',
            backgroundSize: '16px 16px',
            opacity: 0.3,
          }} />

          <div style={{ position: 'relative', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {/* 独立卡片 + 连线指示 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <MiniCard label="起号方案" color="#8b5cf6" standalone />
              <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 500 }}>
                ↗ ↘ →
              </div>
            </div>

            {/* 容器们 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <MiniContainer name="文案创作" color="rgba(139,92,246,0.12)" borderColor="#c4b5fd">
                <MiniCard label="小红书笔记" color="#8b5cf6" />
                <MiniCard label="公众号爆文" color="#8b5cf6" />
              </MiniContainer>
              <MiniContainer name="视频制作" color="rgba(139,92,246,0.12)" borderColor="#c4b5fd">
                <MiniCard label="短视频脚本" color="#8b5cf6" />
                <MiniCard label="选题日历" color="#8b5cf6" />
              </MiniContainer>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <MiniContainer name="图文设计" color="rgba(236,72,153,0.1)" borderColor="#f9a8d4">
                <MiniCard label="主图文案" color="#ec4899" />
                <MiniCard label="配图方案" color="#ec4899" />
              </MiniContainer>
              <MiniContainer name="业务开发" color="rgba(59,130,246,0.1)" borderColor="#93c5fd">
                <MiniCard label="PRD 文档" color="#3b82f6" />
                <MiniCard label="竞品分析" color="#3b82f6" />
              </MiniContainer>
            </div>
          </div>
        </div>

        {/* 功能提示 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Tip icon={MousePointerClick} text="创建工作流，拖到画布排列" />
          <Tip icon={FolderOpen} text="用容器分组管理" />
          <Tip icon={Link2} text="连线标注关系" />
        </div>

        {/* 按钮 */}
        <button
          onClick={handleClose}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px',
            border: 'none',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: 'white',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          开始使用
        </button>
      </div>

      <style>{`
        @keyframes cwm-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cwm-slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body
  )
}

/** 迷你容器框 */
function MiniContainer({ name, color, borderColor, children }: {
  name: string
  color: string
  borderColor: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: color,
      border: `1.5px solid ${borderColor}`,
      borderRadius: '10px',
      padding: '8px 10px 10px',
      minWidth: '130px',
    }}>
      <div style={{
        fontSize: '10px',
        fontWeight: 600,
        color: '#4b5563',
        marginBottom: '6px',
        letterSpacing: '0.5px',
      }}>
        {name}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {children}
      </div>
    </div>
  )
}

/** 迷你工作流卡片 */
function MiniCard({ label, color, standalone }: {
  label: string
  color: string
  standalone?: boolean
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '6px',
      padding: standalone ? '10px 14px' : '5px 8px',
      fontSize: standalone ? '11px' : '10px',
      fontWeight: 500,
      color: '#374151',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      borderLeft: `3px solid ${color}`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </div>
  )
}

/** 功能提示标签 */
function Tip({ icon: Icon, text }: { icon: typeof MousePointerClick; text: string }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '5px 10px',
      borderRadius: '8px',
      background: '#f9fafb',
      border: '1px solid #f3f4f6',
      fontSize: '12px',
      color: '#6b7280',
    }}>
      <Icon size={13} color="#8b5cf6" />
      {text}
    </div>
  )
}
