import { useNavigate } from 'react-router-dom';
import { X, LogIn } from 'lucide-react';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function LoginRequiredModal({ isOpen, onClose, message }: LoginRequiredModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  const handleRegister = () => {
    onClose();
    navigate('/register');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} color="#9ca3af" />
        </button>

        {/* 图标 */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#f3f0ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <LogIn size={28} color="#7C9187" />
        </div>

        {/* 标题 */}
        <h3
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '12px',
          }}
        >
          需要登录
        </h3>

        {/* 描述 */}
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '24px',
            lineHeight: '1.6',
          }}
        >
          {message || '登录后即可使用此功能，体验完整的AI工作流服务'}
        </p>

        {/* 按钮 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleLogin}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: '#7C9187',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6A7C75')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7C9187')}
          >
            登录
          </button>
          <button
            onClick={handleRegister}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: 'white',
              color: '#7C9187',
              border: '1px solid #7C9187',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f0ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            注册
          </button>
        </div>

        {/* 游客提示 */}
        <p
          style={{
            fontSize: '12px',
            color: '#9ca3af',
            marginTop: '16px',
          }}
        >
          游客可浏览内容，登录后可执行工作流
        </p>
      </div>
    </div>
  );
}
