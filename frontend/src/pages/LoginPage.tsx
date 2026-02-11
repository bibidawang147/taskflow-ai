import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { API_BASE_URL } from '../services/api';
import { AlertCircle, Loader2, MessageCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [wechatLoading, setWechatLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 调用真实的登录 API
      const response = await authService.login({ email, password });

      // 保存 token
      authService.setToken(response.token);

      // 如果填了邀请码，登录成功后自动兑换
      if (inviteCode.trim()) {
        try {
          const redeemRes = await fetch(`${API_BASE_URL}/api/promo/redeem`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${response.token}`,
            },
            body: JSON.stringify({ code: inviteCode.trim() }),
          });

          if (!redeemRes.ok) {
            const errorData = await redeemRes.json();
            console.warn('[Login] 邀请码兑换失败:', errorData.error || '未知错误');
          }
        } catch (error) {
          // 兑换失败不阻塞登录，但记录错误
          console.warn('[Login] 邀请码兑换异常:', error);
        }
      }

      // 直接跳转到首页（使用 window.location.href 完全刷新页面）
      // 如果在iframe内，跳转整个顶层窗口
      if (window.self !== window.top) {
        window.top!.location.href = '/';
      } else {
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      const message = error.response?.data?.error || '登录失败，请检查邮箱和密码';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#faf7ff',
        padding: '3rem 1rem',
      }}
    >
      <div style={{ maxWidth: '400px', width: '100%' }}>
        {/* Logo和标题 */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link
            to="/"
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#8b5cf6',
              textDecoration: 'none',
              marginBottom: '1rem',
              display: 'block',
            }}
          >
            瓴积AI
          </Link>
          <h2
            style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem',
            }}
          >
            登录账户
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            还没有账户？{' '}
            <Link
              to="/register"
              style={{
                color: '#8b5cf6',
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              立即注册
            </Link>
          </p>
        </div>

        {/* 登录表单 */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
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
                }}
              >
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px',
                }}
              >
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱地址"
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

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px',
                }}
              >
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
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

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="inviteCode"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px',
                }}
              >
                邀请码 <span style={{ color: '#9ca3af', fontWeight: '400' }}>(选填)</span>
              </label>
              <input
                id="inviteCode"
                name="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="请输入邀请码"
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
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? '登录中...' : '登录'}
            </button>

            {/* 分隔线 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0.5rem 0',
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
              <span style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>其他登录方式</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
            </div>

            {/* 微信登录按钮 */}
            <button
              type="button"
              disabled={wechatLoading}
              onClick={async () => {
                setWechatLoading(true);
                setError('');
                try {
                  const { url } = await authService.getWechatAuthUrl();
                  window.location.href = url;
                } catch (err: any) {
                  setError(err.response?.data?.error || '获取微信授权链接失败');
                  setWechatLoading(false);
                }
              }}
              style={{
                width: '100%',
                backgroundColor: '#07c160',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: wechatLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: wechatLoading ? 0.7 : 1,
              }}
            >
              {wechatLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <MessageCircle size={16} />
              )}
              {wechatLoading ? '跳转中...' : '微信扫码登录'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
