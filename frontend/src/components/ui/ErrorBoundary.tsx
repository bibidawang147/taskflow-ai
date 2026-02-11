import { Component, type ReactNode, type ErrorInfo } from 'react'
import * as Sentry from '@sentry/react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })
  }

  handleReload = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: '#374151',
          backgroundColor: '#f9fafb',
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '420px',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              :(
            </div>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
              color: '#111827',
            }}>
              页面出了点问题
            </h1>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: '2rem',
              lineHeight: 1.6,
            }}>
              我们已经收到错误报告，正在修复中。请尝试刷新页面。
            </p>
            <button
              onClick={this.handleReload}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#8b5cf6',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              返回首页
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
