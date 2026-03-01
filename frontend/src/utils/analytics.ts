/**
 * 轻量用户行为追踪
 * 纯 TypeScript 单例，无 React 依赖，任何文件可直接 import { track }
 */

import { API_BASE_URL } from '../services/api'

interface TrackEvent {
  sessionId: string
  event: string
  properties?: Record<string, any>
  page: string
  referrer: string
  timestamp: number
  userId?: string
}

// 单例状态
let sessionId: string | null = null
let userId: string | null = null
let buffer: TrackEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

const FLUSH_INTERVAL = 5000  // 5 秒
const BUFFER_MAX = 10        // 满 10 条立即发送

// ---- Session 管理 ----

function getSessionId(): string {
  if (sessionId) return sessionId
  let stored = sessionStorage.getItem('_t_sid')
  if (!stored) {
    stored = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
    sessionStorage.setItem('_t_sid', stored)
  }
  sessionId = stored
  return stored
}

// ---- 公开 API ----

/** 登录后调用，绑定用户身份；登出时传 null */
export function setAnalyticsUserId(id: string | null): void {
  userId = id
}

/** 追踪一个事件 */
export function track(event: string, properties?: Record<string, any>): void {
  const entry: TrackEvent = {
    sessionId: getSessionId(),
    event,
    properties,
    page: window.location.pathname,
    referrer: document.referrer,
    timestamp: Date.now(),
  }
  if (userId) {
    entry.userId = userId
  }

  buffer.push(entry)

  if (buffer.length >= BUFFER_MAX) {
    flush()
  } else if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL)
  }
}

// ---- Flush 逻辑 ----

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

function flush(): void {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  if (buffer.length === 0) return

  const events = [...buffer]
  buffer = []

  const headers = getHeaders()

  // 用原生 fetch（不用 axios），避免 401 拦截器副作用
  if (events.length === 1) {
    fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(events[0]),
      keepalive: true,
    }).catch(() => {})
  } else {
    fetch(`${API_BASE_URL}/api/events/batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ events }),
      keepalive: true,
    }).catch(() => {})
  }
}

// ---- 页面关闭时保证数据送达 ----

function handleUnload(): void {
  if (buffer.length === 0) return

  const events = [...buffer]
  buffer = []

  const body = events.length === 1
    ? JSON.stringify(events[0])
    : JSON.stringify({ events })
  const url = events.length === 1
    ? `${API_BASE_URL}/api/events`
    : `${API_BASE_URL}/api/events/batch`

  // sendBeacon 最可靠（但不支持自定义 header）
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    handleUnload()
  }
})
window.addEventListener('beforeunload', handleUnload)
