import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { track } from '../utils/analytics'

/** 自动追踪页面浏览，放在 App 根组件即可覆盖所有路由 */
export function usePageTracking(): void {
  const location = useLocation()
  const prevPathRef = useRef('')

  useEffect(() => {
    if (location.pathname === prevPathRef.current) return

    const from = prevPathRef.current
    prevPathRef.current = location.pathname

    track('page_view', {
      path: location.pathname,
      search: location.search,
      from: from || undefined,
    })
  }, [location.pathname, location.search])
}
