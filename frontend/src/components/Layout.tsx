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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '64px',
            padding: '0 1.5rem 0 28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link
              to="/workspace"
              className="brand-title"
              style={{
                fontSize: '1.4rem',
                color: '#374151',
                textDecoration: 'none',
              }}
            >
              瓴积AI
            </Link>
            <div style={{ display: 'flex', marginLeft: '2.5rem', gap: '1.5rem' }}>
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
                工作台
              </Link>
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
                AI工作方法广场
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', background: '#faf7ff', scrollBehavior: 'smooth' }}>
        <Outlet />
      </main>
    </div>
  );
}
