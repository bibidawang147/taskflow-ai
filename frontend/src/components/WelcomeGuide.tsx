import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Sparkles, Compass, PenTool, Zap } from 'lucide-react'

const WELCOME_SHOWN_KEY = 'lingji_welcome_shown'

interface WelcomeGuideProps {
  onClose?: () => void
}

export default function WelcomeGuide({ onClose }: WelcomeGuideProps) {
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const shown = localStorage.getItem(WELCOME_SHOWN_KEY)
    if (!shown) {
      setVisible(true)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem(WELCOME_SHOWN_KEY, 'true')
    setVisible(false)
    onClose?.()
  }

  const handleAction = (path: string) => {
    handleClose()
    navigate(path)
  }

  if (!visible) return null

  const guides = [
    {
      icon: Compass,
      title: '探索工作流广场',
      desc: '浏览社区分享的 AI 工作流，一键复用到自己的工作台',
      action: () => handleAction('/explore'),
      buttonText: '去探索',
      color: '#8b5cf6',
    },
    {
      icon: PenTool,
      title: '创建第一个工作流',
      desc: '用可视化编辑器搭建你的专属 AI 工作流程',
      action: () => handleAction('/workflow/create'),
      buttonText: '去创建',
      color: '#3b82f6',
    },
    {
      icon: Zap,
      title: '从文章一键生成',
      desc: '粘贴一篇文章，AI 自动拆解为可执行的工作流',
      action: () => handleAction('/article-to-workflow'),
      buttonText: '试一试',
      color: '#f59e0b',
    },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '520px',
          padding: '32px',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          animation: 'slideUp 0.3s ease',
        }}
      >
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

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            marginBottom: '12px',
          }}>
            <Sparkles size={24} color="white" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
            欢迎使用瓴积AI
          </h2>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            三步快速上手，让 AI 成为你的工作流引擎
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {guides.map((g, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid #F3F4F6',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = g.color
                e.currentTarget.style.backgroundColor = `${g.color}08`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#F3F4F6'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              onClick={g.action}
            >
              <div style={{
                flexShrink: 0,
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: `${g.color}12`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <g.icon size={20} color={g.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                  {g.title}
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                  {g.desc}
                </div>
              </div>
              <span style={{
                flexShrink: 0,
                fontSize: '12px',
                fontWeight: 500,
                color: g.color,
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: `${g.color}10`,
              }}>
                {g.buttonText}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={handleClose}
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '10px',
            border: 'none',
            borderRadius: '8px',
            background: '#F9FAFB',
            color: '#6B7280',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#F9FAFB'}
        >
          稍后探索，直接进入工作台
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
