import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, text: '', color: '' }
    const hasLower = /[a-z]/.test(pwd)
    const hasUpper = /[A-Z]/.test(pwd)
    const hasNumber = /\d/.test(pwd)
    const hasMinLength = pwd.length >= 8
    if (!hasMinLength) return { strength: 1, text: '弱', color: '#dc2626' }
    const validCount = [hasLower, hasUpper, hasNumber].filter(Boolean).length
    if (validCount < 3) return { strength: 2, text: '中', color: '#f59e0b' }
    return { strength: 3, text: '强', color: '#10b981' }
  }

  const passwordStrength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!token || !email) {
      setError('重置链接无效，请从邮件中重新点击链接')
      return
    }

    if (password.length < 8) {
      setError('密码长度至少8位')
      return
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('密码必须包含大小写字母和数字')
      return
    }

    if (password !== confirmPassword) {
      setError('密码不匹配')
      return
    }

    setLoading(true)

    try {
      const response = await authService.resetPassword({ token, email, password })
      setSuccess(response.message)
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err: any) {
      const message = err.response?.data?.error || '重置密码失败，请稍后重试'
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
            重置密码
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            请输入您的新密码
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
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px',
              }}>
                新密码
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少8位，含大小写字母和数字"
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
              {password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      flex: 1,
                      height: '4px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${(passwordStrength.strength / 3) * 100}%`,
                        height: '100%',
                        backgroundColor: passwordStrength.color,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <span style={{
                      fontSize: '12px',
                      color: passwordStrength.color,
                      fontWeight: '500',
                    }}>
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="confirmPassword" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px',
              }}>
                确认新密码
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${confirmPassword && password !== confirmPassword ? '#dc2626' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#8b5cf6')}
                onBlur={(e) => {
                  e.target.style.borderColor = confirmPassword && password !== confirmPassword ? '#dc2626' : '#d1d5db'
                }}
              />
              {confirmPassword && password !== confirmPassword && (
                <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                  密码不匹配
                </div>
              )}
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
              {loading ? '重置中...' : '重置密码'}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <Link to="/login" style={{
              color: '#8b5cf6',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              返回登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
