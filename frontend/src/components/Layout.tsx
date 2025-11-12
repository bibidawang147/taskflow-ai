import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { authService } from '../services/auth';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();

  const isActive = (path: string) => {
    if (path === '/ai-chat' || path === '/storage' || path === '/explore') {
      if (path === '/storage') {
        return location.pathname === '/storage' || location.pathname === '/workspace';
      }
      return location.pathname === path;
    }
    if (path === '/workspace') {
      return location.pathname === '/workspace' || location.pathname === '/storage';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div style={{ height: '100vh', backgroundColor: '#faf7ff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <nav
        style={{
          background: 'linear-gradient(to bottom right, #f8fafc 0%, rgba(245, 243, 255, 0.2) 50%, #f8fafc 100%)',
          borderBottom: 'none',
          padding: '0',
          position: 'relative',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: 'none',
          flexShrink: 0
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '64px',
            padding: '0 1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link
              to="/"
              style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#1f2937',
                textDecoration: 'none',
              }}
            >
              工作流平台
            </Link>
            <div style={{ display: 'flex', marginLeft: '2.5rem', gap: '1.5rem' }}>
              <Link
                to="/explore"
                style={{
                  color: isActive('/explore') ? '#8b5cf6' : '#6b7280',
                  textDecoration: 'none',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: isActive('/explore') ? '15px' : '14px',
                  fontWeight: isActive('/explore') ? '600' : '500',
                  backgroundColor: isActive('/explore') ? '#f3f0ff' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                探索工作流
              </Link>
              <Link
                to="/workspace"
                style={{
                  color: isActive('/workspace') ? '#8b5cf6' : '#6b7280',
                  textDecoration: 'none',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: isActive('/workspace') ? '15px' : '14px',
                  fontWeight: isActive('/workspace') ? '600' : '500',
                  backgroundColor: isActive('/workspace') ? '#f3f0ff' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                我的工作台
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* 创建工作流按钮 */}
            <button
              onClick={() => navigate('/workflow/create')}
              style={{
                padding: '9px 18px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 3px rgba(139, 92, 246, 0.12), 0 1px 2px rgba(139, 92, 246, 0.24)',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                whiteSpace: 'nowrap',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.25), 0 2px 4px rgba(139, 92, 246, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(139, 92, 246, 0.12), 0 1px 2px rgba(139, 92, 246, 0.24)'
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>创建工作流</span>
            </button>

            {/* 文章转工作流按钮 */}
            <button
              onClick={() => navigate('/workflow/import-from-article')}
              style={{
                padding: '9px 18px',
                backgroundColor: 'rgba(139, 92, 246, 0.05)',
                color: '#8b5cf6',
                border: '1.5px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.35)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              <span>文章转工作流</span>
            </button>

            {isAuthenticated ? (
              <>
                {/* 用户头像和退出按钮 */}
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* 头像 */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <User size={18} color="#6b7280" />
                  </div>
                  {/* 退出文字 */}
                  <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '500' }}>退出</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    color: '#6b7280',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  style={{
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
}
