import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth';
import { Loader2, AlertCircle } from 'lucide-react';

export default function WechatCallbackPage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('微信授权失败，缺少授权码');
      return;
    }

    authService.wechatLogin(code)
      .then((res) => {
        authService.setToken(res.token);
        // 完整刷新进入首页
        window.location.href = '/';
      })
      .catch((err) => {
        console.error('微信登录失败:', err);
        setError(err.response?.data?.error || '微信登录失败，请稍后重试');
      });
  }, [searchParams]);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        backgroundColor: '#faf7ff',
      }}>
        <AlertCircle size={48} color="#ef4444" />
        <p style={{ fontSize: '16px', color: '#ef4444' }}>{error}</p>
        <a
          href="/login"
          style={{
            color: '#8b5cf6',
            textDecoration: 'none',
            fontSize: '14px',
          }}
        >
          返回登录页
        </a>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      backgroundColor: '#faf7ff',
    }}>
      <Loader2 size={48} color="#8b5cf6" className="animate-spin" />
      <p style={{ fontSize: '16px', color: '#6b7280' }}>微信登录中...</p>
    </div>
  );
}
