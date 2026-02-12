import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { API_BASE_URL } from '../services/api';
import { Loader2, AlertCircle, CheckCircle2, Gift } from 'lucide-react';

export default function RedeemPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [redeemData, setRedeemData] = useState<{
    plan: string;
    planLabel: string;
    durationDays: number;
    startedAt: string;
    expiresAt: string;
  } | null>(null);

  const code = searchParams.get('code');

  useEffect(() => {
    if (!code) {
      setStatus('error');
      setMessage('缺少兑换码参数');
      return;
    }

    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
      // 未登录：跳转登录页，带 redirect 参数
      navigate(`/login?redirect=${encodeURIComponent(`/redeem?code=${code}`)}`, { replace: true });
      return;
    }

    // 已登录：自动兑换
    const token = authService.getToken();
    fetch(`${API_BASE_URL}/api/promo/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setMessage(data.message);
          setRedeemData(data.data);
        } else {
          setStatus('error');
          setMessage(data.error || '兑换失败');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('网络错误，请稍后重试');
      });
  }, [code, navigate]);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    backgroundColor: '#faf7ff',
    padding: '1.5rem',
  };

  if (status === 'loading') {
    return (
      <div style={containerStyle}>
        <Loader2 size={48} color="#8b5cf6" className="animate-spin" />
        <p style={{ fontSize: '16px', color: '#6b7280' }}>正在兑换中...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={containerStyle}>
        <AlertCircle size={48} color="#ef4444" />
        <p style={{ fontSize: '16px', color: '#ef4444' }}>{message}</p>
        <Link
          to="/"
          style={{ color: '#8b5cf6', textDecoration: 'none', fontSize: '14px' }}
        >
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '2.5rem',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}>
        <CheckCircle2 size={56} color="#10b981" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
          兑换成功
        </h2>
        <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '24px' }}>{message}</p>

        {redeemData && (
          <div style={{
            backgroundColor: '#f5f3ff',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Gift size={18} color="#8b5cf6" />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#7c3aed' }}>
                {redeemData.planLabel} · {redeemData.durationDays} 天
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>
              <div>生效时间：{new Date(redeemData.startedAt).toLocaleDateString()}</div>
              <div>到期时间：{new Date(redeemData.expiresAt).toLocaleDateString()}</div>
            </div>
          </div>
        )}

        <Link
          to="/workspace"
          style={{
            display: 'inline-block',
            backgroundColor: '#8b5cf6',
            color: 'white',
            padding: '10px 32px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          开始使用
        </Link>
      </div>
    </div>
  );
}
