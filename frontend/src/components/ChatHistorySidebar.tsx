import { useState } from 'react'
import { History, Plus, Trash2, MessageSquare, X } from 'lucide-react'
import type { ChatSession } from '../services/chatApi'
import '../styles/chat-history-sidebar.css'

interface ChatHistorySidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  onDeleteSession: (sessionId: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function ChatHistorySidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  collapsed = false,
  onToggleCollapse
}: ChatHistorySidebarProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (deletingId === sessionId) {
      // 确认删除
      onDeleteSession(sessionId)
      setDeletingId(null)
    } else {
      // 第一次点击，显示确认
      setDeletingId(sessionId)
      setTimeout(() => setDeletingId(null), 3000)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  if (collapsed) {
    return (
      <div className="chat-history-sidebar collapsed">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          title="展开历史记录"
        >
          <History size={20} />
        </button>
      </div>
    )
  }

  return (
    <div className="chat-history-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <History size={20} />
          <span>对话历史</span>
        </div>
        {onToggleCollapse && (
          <button
            className="sidebar-toggle-btn"
            onClick={onToggleCollapse}
            title="收起侧边栏"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <button className="new-chat-btn" onClick={onNewChat}>
        <Plus size={18} />
        <span>新建对话</span>
      </button>

      <div className="sessions-list">
        {sessions.length === 0 ? (
          <div className="empty-sessions">
            <MessageSquare size={32} opacity={0.3} />
            <p>暂无历史对话</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${session.id === currentSessionId ? 'active' : ''}`}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="session-content">
                <div className="session-title">{session.title}</div>
                <div className="session-meta">
                  <span className="message-count">
                    {session.messages.length} 条消息
                  </span>
                  <span className="session-date">
                    {formatDate(session.updatedAt)}
                  </span>
                </div>
              </div>
              <button
                className={`delete-btn ${deletingId === session.id ? 'confirm' : ''}`}
                onClick={(e) => handleDelete(session.id, e)}
                title={deletingId === session.id ? '再次点击确认删除' : '删除对话'}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
