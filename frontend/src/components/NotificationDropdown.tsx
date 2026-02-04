import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, X, Sparkles, AlertCircle } from 'lucide-react'
import { notificationService, UpdateNotification } from '../services/notificationService'

interface NotificationDropdownProps {
  onClose?: () => void
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<UpdateNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 加载通知
  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationService.getNotifications({ limit: 10 })
      setNotifications(response.notifications)
      setUnreadCount(response.unreadCount)
    } catch (error) {
      console.error('加载通知失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载未读数量
  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('获取未读数量失败:', error)
    }
  }

  // 初始化和定时刷新
  useEffect(() => {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 60000) // 每分钟刷新
    return () => clearInterval(interval)
  }, [])

  // 打开下拉框时加载通知
  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 标记为已读并跳转
  const handleNotificationClick = async (notification: UpdateNotification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id)
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (error) {
        console.error('标记已读失败:', error)
      }
    }
    setIsOpen(false)
    navigate(`/workflow/${notification.workflowId}`)
  }

  // 全部标记为已读
  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('标记全部已读失败:', error)
    }
  }

  // 忽略通知
  const handleDismiss = async (e: React.MouseEvent, notification: UpdateNotification) => {
    e.stopPropagation()
    try {
      await notificationService.dismiss(notification.id)
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
      if (!notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('忽略通知失败:', error)
    }
  }

  // 获取通知图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'major_update':
        return <AlertCircle size={16} className="text-orange-500" />
      case 'deprecation':
        return <AlertCircle size={16} className="text-red-500" />
      default:
        return <Sparkles size={16} className="text-purple-500" />
    }
  }

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* 通知图标按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          padding: '8px',
          background: 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <Bell size={22} color="#6b7280" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            minWidth: '18px',
            height: '18px',
            padding: '0 5px',
            background: '#ef4444',
            color: 'white',
            fontSize: '11px',
            fontWeight: 'bold',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          width: '380px',
          maxHeight: '480px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          zIndex: 1000
        }}>
          {/* 头部 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              通知
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#7C9187',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f3ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <CheckCheck size={14} />
                全部已读
              </button>
            )}
          </div>

          {/* 通知列表 */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                加载中...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                <Bell size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>暂无通知</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '14px 20px',
                    cursor: 'pointer',
                    background: notification.isRead ? 'transparent' : '#faf5ff',
                    borderBottom: '1px solid #f9fafb',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (notification.isRead) {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notification.isRead ? 'transparent' : '#faf5ff'
                  }}
                >
                  {/* 未读标记 */}
                  <div style={{
                    width: '8px',
                    height: '8px',
                    marginTop: '6px',
                    borderRadius: '50%',
                    background: notification.isRead ? 'transparent' : '#7C9187',
                    flexShrink: 0
                  }} />

                  {/* 内容 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '4px'
                    }}>
                      {getNotificationIcon(notification.type)}
                      <span style={{
                        fontSize: '14px',
                        fontWeight: notification.isRead ? '400' : '600',
                        color: '#1f2937',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {notification.title}
                      </span>
                    </div>
                    {notification.message && (
                      <p style={{
                        margin: '0 0 6px',
                        fontSize: '13px',
                        color: '#6b7280',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {notification.message}
                      </p>
                    )}
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>

                  {/* 忽略按钮 */}
                  <button
                    onClick={(e) => handleDismiss(e, notification)}
                    style={{
                      padding: '4px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      flexShrink: 0,
                      opacity: 0.5,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.color = '#6b7280'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.5'
                      e.currentTarget.style.color = '#9ca3af'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 底部链接 */}
          {notifications.length > 0 && (
            <div style={{
              padding: '12px',
              borderTop: '1px solid #f3f4f6',
              textAlign: 'center'
            }}>
              <button
                onClick={() => {
                  setIsOpen(false)
                  navigate('/notifications')
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#7C9187',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f3ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                查看全部通知
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown
