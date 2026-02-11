import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../services/auth'
import { AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await authService.forgotPassword(email)
      setSuccess(response.message)
    } catch (err: any) {
      const message = err.response?.data?.error || '操作失败，请稍后重试'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#faf7ff',
      padding: '1.5rem 1rem',
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#8b5cf6',
            textDecoration: 'none',
            marginBottom: '1rem',
            display: 'block',
          }}>
            瓴积AI
          </Link>
          <h2 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.5rem',
          }}>
            忘记密码
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            输入您的注册邮箱，我们将发送密码重置链接
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {success && (
              <div style={{
                backgroundColor: '#dcfce7',
                border: '1px solid #bbf7d0',
                color: '#166534',
                padding: '12px 16px',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <CheckCircle size={16} />
                {success}
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px',
              }}>
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入注册邮箱"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#8b5cf6')}
                onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: loading ? '#9ca3af' : '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? '发送中...' : '发送重置链接'}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <Link to="/login" style={{
              color: '#8b5cf6',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <ArrowLeft size={14} />
              返回登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
