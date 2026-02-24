import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth';
import { Loader2, AlertCircle, CheckCircle, MessageCircle } from 'lucide-react';

export default function WechatBindCallbackPage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmInfo, setConfirmInfo] = useState<{
    message: string;
    existingName: string;
    wxDataToken: string;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('微信授权失败，缺少授权码');
      return;
    }

    authService.bindWechat(code)
      .then((res) => {
        if (res.needsConfirm) {
          // 需要用户确认合并
          setConfirmInfo({
            message: res.message,
            existingName: res.existingName,
            wxDataToken: res.wxDataToken,
          });
        } else {
          // 直接绑定成功
          if (res.token) authService.setToken(res.token);
          setSuccess(res.message);
          setTimeout(() => { window.location.href = '/'; }, 1500);
        }
      })
      .catch((err) => {
        console.error('绑定微信失败:', err);
        setError(err.response?.data?.error || '绑定微信失败，请稍后重试');
      });
  }, [searchParams]);

  const handleConfirmMerge = async () => {
    if (!confirmInfo) return;
    setConfirmLoading(true);
    try {
      const res = await authService.confirmBindWechat(confirmInfo.wxDataToken);
      if (res.token) authService.setToken(res.token);
      setConfirmInfo(null);
      setSuccess(res.message);
      setTimeout(() => { window.location.href = '/'; }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || '合并失败，请稍后重试');
      setConfirmInfo(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancel = () => {
    window.location.href = '/';
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '16px',
    backgroundColor: '#faf7ff',
    padding: '1rem',
  };

  if (error) {
    return (
      <div style={containerStyle}>
        <AlertCircle size={48} color="#ef4444" />
        <p style={{ fontSize: '16px', color: '#ef4444', textAlign: 'center' }}>{error}</p>
        <a href="/" style={{ color: '#8b5cf6', textDecoration: 'none', fontSize: '14px' }}>
          返回首页
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div style={containerStyle}>
        <CheckCircle size={48} color="#22c55e" />
        <p style={{ fontSize: '16px', color: '#22c55e' }}>{success}</p>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>正在跳转...</p>
      </div>
    );
  }

  if (confirmInfo) {
    return (
      <div style={containerStyle}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}>
          <MessageCircle size={40} color="#f59e0b" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '12px' }}>
            发现已有微信账号
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, marginBottom: '20px' }}>
            {confirmInfo.message}
          </p>
          <div style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#92400E',
            lineHeight: 1.5,
          }}>
            合并后，「{confirmInfo.existingName}」的积分、工作流等数据将转移到当前账号，原微信账号将被删除。
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              取消
            </button>
            <button
              onClick={handleConfirmMerge}
              disabled={confirmLoading}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: confirmLoading ? '#9ca3af' : '#8b5cf6',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: confirmLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {confirmLoading && <Loader2 size={14} className="animate-spin" />}
              确认合并
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Loader2 size={48} color="#8b5cf6" className="animate-spin" />
      <p style={{ fontSize: '16px', color: '#6b7280' }}>正在绑定微信...</p>
    </div>
  );
}
