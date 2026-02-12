import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 表单验证
    if (formData.password !== formData.confirmPassword) {
      setError('密码不匹配');
      return;
    }

    if (formData.password.length < 8) {
      setError('密码长度至少8位');
      return;
    }

    // 密码必须包含大小写字母和数字
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      setError('密码必须包含大小写字母和数字');
      return;
    }

    setLoading(true);

    try {
      // 调用真实的注册 API
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // 保存 token
      authService.setToken(response.token);

      setSuccess('注册成功！已赠送 50,000 积分，即将跳转...');

      // 标记为新用户，确保欢迎引导弹出
      localStorage.removeItem('lingji_welcome_shown');
      localStorage.removeItem('lingji_canvas_welcome_shown');

      // 延迟跳转到工作台
      setTimeout(() => {
        navigate('/workspace');
      }, 1500);
    } catch (error: any) {
      console.error('注册失败:', error);
      const message =
        error.response?.data?.error ||
        error.response?.data?.details?.[0]?.msg ||
        '注册失败，请重试';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: '' };

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasMinLength = password.length >= 8;

    if (!hasMinLength) return { strength: 1, text: '弱', color: '#dc2626' };

    const validCount = [hasLower, hasUpper, hasNumber].filter(Boolean).length;
    if (validCount < 3) return { strength: 2, text: '中', color: '#f59e0b' };

    return { strength: 3, text: '强', color: '#10b981' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#faf7ff',
        padding: '1.5rem 1rem',
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
            创建新账户
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            已有账户？{' '}
            <Link
              to="/login"
              style={{
                color: '#8b5cf6',
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              立即登录
            </Link>
          </p>
        </div>

        {/* 注册表单 */}
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

            {success && (
              <div
                style={{
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
                }}
              >
                <CheckCircle size={16} />
                {success}
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="name"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px',
                }}
              >
                用户名
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="请输入用户名"
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
                value={formData.email}
                onChange={handleChange}
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
                value={formData.password}
                onChange={handleChange}
                placeholder="请输入密码（至少8位，含大小写字母和数字）"
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

              {/* 密码强度指示器 */}
              {formData.password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        flex: 1,
                        height: '4px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${(passwordStrength.strength / 3) * 100}%`,
                          height: '100%',
                          backgroundColor: passwordStrength.color,
                          transition: 'width 0.3s',
                        }}
                      ></div>
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        color: passwordStrength.color,
                        fontWeight: '500',
                      }}
                    >
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px',
                }}
              >
                确认密码
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="请再次输入密码"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? '#dc2626'
                      : '#d1d5db'
                  }`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#8b5cf6')}
                onBlur={(e) => {
                  if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
                    e.target.style.borderColor = '#dc2626';
                  } else {
                    e.target.style.borderColor = '#d1d5db';
                  }
                }}
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                  密码不匹配
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || formData.password !== formData.confirmPassword}
              style={{
                width: '100%',
                backgroundColor:
                  loading || formData.password !== formData.confirmPassword ? '#9ca3af' : '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor:
                  loading || formData.password !== formData.confirmPassword
                    ? 'not-allowed'
                    : 'pointer',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? '注册中...' : '创建账户'}
            </button>
          </form>

          {/* 注册优势 */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
            }}
          >
            <h4
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '0.5rem',
              }}
            >
              注册即可享受
            </h4>
            <ul style={{ fontSize: '12px', color: '#6b7280', margin: 0, paddingLeft: '1rem' }}>
              <li>注册赠送 50,000 积分</li>
              <li>每日 10,000 积分免费额度</li>
              <li>访问所有基础 AI 模型</li>
              <li>创建和管理工作流</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
