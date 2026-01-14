import React, { useState, useRef, useEffect } from 'react'
import { AIRecommendationPanel } from '../components/AIRecommendationPanel'
import api from '../services/api'
import './AIRecommendationTestPage.css'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

export const AIRecommendationTestPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}`)
  const [currentIntentId, setCurrentIntentId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      console.log('📤 发送消息:', inputMessage)
      const response = await api.post('/api/ai/conversation', {
        message: inputMessage.trim(),
        sessionId
      })

      console.log('📥 收到响应:', response.data)

      if (response.data.success) {
        const aiMessage: Message = {
          id: `ai_${Date.now()}`,
          type: 'ai',
          content: response.data.data.aiResponse,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, aiMessage])

        // 更新intentId以触发推荐面板更新
        if (response.data.data.intentData?.intentId) {
          console.log('🎯 更新intentId:', response.data.data.intentData.intentId)
          setCurrentIntentId(response.data.data.intentData.intentId)
        }
      } else {
        throw new Error(response.data.error || '请求失败')
      }
    } catch (error) {
      console.error('❌ 发送消息失败:', error)
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        type: 'ai',
        content: `抱歉，发生了错误：${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleWorkflowSelect = (workflowId: string) => {
    console.log('📋 选择工作流:', workflowId)
    // 可以在这里添加导航到工作流详情页的逻辑
  }

  return (
    <div className="ai-recommendation-test-page">
      {/* 顶部标题栏 */}
      <div className="test-page-header">
        <div>
          <h1>🤖 AI对话推荐功能 - 测试页面</h1>
          <p className="session-info">会话ID: {sessionId}</p>
        </div>
        <div className="status-indicators">
          <div className="status-item">
            <span className="status-label">对话消息:</span>
            <span className="status-value">{messages.length}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Intent ID:</span>
            <span className="status-value">{currentIntentId ? '✓' : '-'}</span>
          </div>
          <div className={`status-item ${loading ? 'loading' : ''}`}>
            <span className="status-label">状态:</span>
            <span className="status-value">{loading ? '处理中...' : '就绪'}</span>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="test-page-content">
        {/* 左侧：对话区域 */}
        <div className="chat-section">
          <div className="chat-header">
            <h2>💬 AI对话</h2>
            <button
              className="clear-button"
              onClick={() => {
                setMessages([])
                setCurrentIntentId(null)
              }}
            >
              清空对话
            </button>
          </div>

          {/* 消息列表 */}
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💭</div>
                <h3>开始对话</h3>
                <p>试试输入以下测试消息：</p>
                <div className="test-suggestions">
                  <button onClick={() => setInputMessage('我想做小红书爆款文案')}>
                    我想做小红书爆款文案
                  </button>
                  <button onClick={() => setInputMessage('帮我生成抖音短视频脚本')}>
                    帮我生成抖音短视频脚本
                  </button>
                  <button onClick={() => setInputMessage('我要优化公众号文章标题')}>
                    我要优化公众号文章标题
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.type}`}>
                    <div className="message-avatar">
                      {msg.type === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-sender">
                          {msg.type === 'user' ? '你' : 'AI助手'}
                        </span>
                        <span className="message-time">
                          {msg.timestamp.toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="message-text">
                        {msg.content.split('\n').map((line, i) => (
                          <React.Fragment key={i}>
                            {line}
                            {i < msg.content.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}

            {loading && (
              <div className="message ai loading-message">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 输入框 */}
          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="输入你的需求，比如：我想做小红书文案..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="send-button"
              onClick={handleSend}
              disabled={!inputMessage.trim() || loading}
            >
              {loading ? '发送中...' : '发送'}
            </button>
          </div>
        </div>

        {/* 右侧：推荐面板 */}
        <div className="recommendation-section">
          {currentIntentId ? (
            <AIRecommendationPanel
              intentId={currentIntentId}
              sessionId={sessionId}
              onWorkflowSelect={handleWorkflowSelect}
            />
          ) : (
            <div className="recommendation-placeholder">
              <div className="placeholder-icon">💡</div>
              <h3>智能推荐</h3>
              <p>发送消息后，这里会显示为你推荐的工作流</p>
            </div>
          )}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="test-page-footer">
        <div className="footer-tips">
          <h4>💡 测试提示：</h4>
          <ul>
            <li>✅ 后端服务运行在: <code>http://localhost:3000</code></li>
            <li>✅ 测试账号: <code>test@example.com / test123</code></li>
            <li>📊 右侧推荐面板会在发送消息后实时更新</li>
            <li>🔍 打开浏览器开发者工具(F12)查看详细日志</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AIRecommendationTestPage
