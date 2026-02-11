import { useNavigate } from 'react-router-dom'
import { useState, KeyboardEvent, FocusEvent, MouseEvent } from 'react'

const quickLinks = [
  { icon: '✍️', label: '内容创作', themeId: 'self-media' },
  { icon: '🛒', label: '电商工作流', themeId: 'ecommerce' },
  { icon: '🤝', label: '个人助手', themeId: 'ai-assistant' },
  { icon: '🔍', label: '发现更多', path: '/explore' }
] as const

// 快捷示例提示，引导新用户
const examplePrompts = [
  '帮我写一篇关于人工智能发展趋势的科技文章',
  '为我的淘宝店铺新品生成吸引人的产品描述',
  '创建一个适合小红书的美妆教程内容',
  '写一个3分钟的产品介绍视频脚本',
  '生成一封促销活动的营销邮件'
]

export default function HomePage() {
  const [inputMessage, setInputMessage] = useState('')
  const navigate = useNavigate()

  const handleSend = () => {
    if (inputMessage.trim()) {
      navigate('/search', { state: { query: inputMessage } })
      setInputMessage('')
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Hero Section */}
      <div style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '2rem' }}>
          今天想完成什么任务？
        </h1>
        <div style={{ maxWidth: '900px', margin: '0 auto 2rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(139, 92, 246, 0.1), 0 4px 16px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease',
            position: 'relative'
          }}>
            <input
              type="text"
              value={inputMessage}
              onChange={(event) => setInputMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="告诉我你想要完成什么任务，我来帮你创建工作流..."
              style={{
                flex: 1,
                padding: '18px 16px',
                fontSize: '16px',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                color: '#1f2937'
              }}
              onFocus={(event: FocusEvent<HTMLInputElement>) => {
                const wrapper = event.currentTarget.parentElement
                if (wrapper instanceof HTMLElement) {
                  wrapper.style.borderColor = '#8b5cf6'
                  wrapper.style.boxShadow =
                    '0 10px 40px rgba(139, 92, 246, 0.2), 0 4px 16px rgba(139, 92, 246, 0.1)'
                }
              }}
              onBlur={(event: FocusEvent<HTMLInputElement>) => {
                const wrapper = event.currentTarget.parentElement
                if (wrapper instanceof HTMLElement) {
                  wrapper.style.borderColor = '#e5e7eb'
                  wrapper.style.boxShadow =
                    '0 10px 40px rgba(139, 92, 246, 0.1), 0 4px 16px rgba(0, 0, 0, 0.05)'
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim()}
              style={{
                width: '40px',
                height: '40px',
                margin: '6px',
                backgroundColor: inputMessage.trim() ? '#8b5cf6' : '#f3f4f6',
                color: inputMessage.trim() ? 'white' : '#9ca3af',
                border: 'none',
                borderRadius: '50%',
                cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(event: MouseEvent<HTMLButtonElement>) => {
                if (inputMessage.trim()) {
                  const button = event.currentTarget
                  button.style.backgroundColor = '#7c3aed'
                  button.style.transform = 'scale(1.1)'
                }
              }}
              onMouseLeave={(event: MouseEvent<HTMLButtonElement>) => {
                if (inputMessage.trim()) {
                  const button = event.currentTarget
                  button.style.backgroundColor = '#8b5cf6'
                  button.style.transform = 'scale(1)'
                }
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#6b7280',
          marginTop: '-0.5rem',
          marginBottom: '2rem'
        }}>
          按 Enter 快速发送 · 支持中文描述
        </div>

        {/* 快捷入口 */}
        <div style={{
          maxWidth: '980px',
          margin: '0 auto 3.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#8b5cf6',
            fontWeight: '500',
            letterSpacing: '0.5px',
            flexShrink: 0
          }}>
            快捷入口
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            flex: 1
          }}>
            {quickLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  if ('themeId' in link) {
                    navigate(`/explore/theme/${link.themeId}`)
                  } else if ('path' in link) {
                    navigate(link.path)
                  }
                }}
                style={{
                  fontSize: '14px',
                  color: '#374151',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  padding: '10px 18px',
                  borderRadius: '20px',
                  backgroundColor: 'white',
                  border: '1.5px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  flex: 1,
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  const button = e.currentTarget
                  button.style.borderColor = '#8b5cf6'
                  button.style.color = '#8b5cf6'
                  button.style.backgroundColor = '#faf5ff'
                  button.style.transform = 'translateY(-1px)'
                  button.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)'
                }}
                onMouseLeave={(e) => {
                  const button = e.currentTarget
                  button.style.borderColor = '#e5e7eb'
                  button.style.color = '#374151'
                  button.style.backgroundColor = 'white'
                  button.style.transform = 'translateY(0)'
                  button.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* 示例提示 */}
        <div style={{
          maxWidth: '980px',
          margin: '0 auto'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#64748b',
            fontWeight: '600',
            marginBottom: '14px',
            letterSpacing: '0.3px'
          }}>
            试试这些
          </div>

          <div style={{
            display: 'grid',
            gap: '6px'
          }}>
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => {
                  setInputMessage(prompt)
                  navigate('/search', { state: { query: prompt } })
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 18px',
                  backgroundColor: 'white',
                  border: '1.5px solid #f1f5f9',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fafbfc'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.04)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                  e.currentTarget.style.borderColor = '#f1f5f9'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#334155',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {prompt}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
