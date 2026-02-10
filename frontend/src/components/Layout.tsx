import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Settings, HelpCircle, Package, LogOut, Gift, Check, Loader2, Crown, ShieldCheck, CreditCard } from 'lucide-react';
import { authService } from '../services/auth';
import { useState, useRef, useEffect } from 'react';

const API_BASE = 'http://localhost:3000';

interface SubscriptionInfo {
  role: string;
  roleExpiresAt: string | null;
  daysRemaining: number;
  activeSubscription: {
    plan: string;
    source: string;
    startedAt: string;
    expiresAt: string;
  } | null;
}

const ROLE_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro 会员',
  creator: '创作者',
  admin: '管理员'
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  pro: { bg: '#FEF3C7', text: '#D97706' },
  creator: { bg: '#F3E8FF', text: '#7C3AED' },
  admin: { bg: '#DBEAFE', text: '#2563EB' }
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    setDropdownOpen(false);
    authService.logout();
    navigate('/login');
  };

  // 获取会员状态
  const fetchSubscription = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/promo/subscription`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSubscription(await res.json());
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (isAuthenticated) fetchSubscription();
  }, [isAuthenticated]);

  const handleInviteSubmit = async () => {
    if (!inviteCode.trim()) return;
    setInviteLoading(true);
    setInviteResult(null);
    try {
      const token = authService.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. 预校验
      const checkRes = await fetch(`${API_BASE}/api/promo/check?code=${encodeURIComponent(inviteCode.trim())}`, { headers });
      const checkData = await checkRes.json();
      if (!checkRes.ok || !checkData.valid) {
        setInviteResult({ type: 'error', msg: checkData.error || '兑换码无效' });
        setInviteLoading(false);
        return;
      }

      // 2. 兑换
      const res = await fetch(`${API_BASE}/api/promo/redeem`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: inviteCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInviteResult({ type: 'success', msg: data.message || '兑换成功' });
        setInviteCode('');
        fetchSubscription(); // 刷新会员状态
      } else {
        setInviteResult({ type: 'error', msg: data.error || '兑换失败' });
      }
    } catch {
      setInviteResult({ type: 'error', msg: '网络错误，请重试' });
    } finally {
      setInviteLoading(false);
    }
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // 路由变化时关闭菜单
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  const isAdmin = subscription?.role === 'admin';

  const menuItems = [
    { icon: Package, label: '会员中心', path: '/membership' },
    ...(isAdmin ? [
      { icon: ShieldCheck, label: '订单管理', path: '/admin/orders' },
      { icon: CreditCard, label: '定价管理', path: '/admin/pricing' },
    ] : []),
    { icon: Settings, label: '设置', path: '/settings' },
    { icon: HelpCircle, label: '帮助中心', path: '/help' },
  ];

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <nav
        style={{
          background: 'linear-gradient(to right, #edefff 0%, #f2f3ff 100%)',
          borderBottom: 'none',
          padding: '0',
          position: 'relative',
          zIndex: 1000,
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
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                {/* 头像按钮 */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: dropdownOpen ? '2px solid #8b5cf6' : '2px solid #e5e7eb',
                    backgroundColor: dropdownOpen ? '#f3f0ff' : '#f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!dropdownOpen) {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!dropdownOpen) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  <User size={18} color={dropdownOpen ? '#8b5cf6' : '#6b7280'} />
                </button>

                {/* 下拉菜单 */}
                {dropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '230px',
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      zIndex: 1001,
                      overflow: 'hidden',
                      animation: 'dropdownFadeIn 0.15s ease',
                    }}
                  >
                    {/* 用户信息区 + 会员标签 */}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#111' }}>用户</span>
                        {subscription && subscription.role !== 'free' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '1px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: ROLE_COLORS[subscription.role]?.bg || '#F3F4F6',
                            color: ROLE_COLORS[subscription.role]?.text || '#6B7280',
                          }}>
                            <Crown size={11} />
                            {ROLE_LABELS[subscription.role] || subscription.role}
                          </span>
                        )}
                      </div>
                      {subscription && subscription.role !== 'free' && subscription.daysRemaining > 0 ? (
                        <div style={{
                          fontSize: '12px',
                          color: subscription.daysRemaining <= 7 ? '#EF4444' : '#9CA3AF',
                          marginTop: '4px',
                          fontWeight: subscription.daysRemaining <= 7 ? 500 : 400,
                        }}>
                          {subscription.daysRemaining <= 7
                            ? `会员即将到期，剩余 ${subscription.daysRemaining} 天`
                            : `到期时间：${new Date(subscription.roleExpiresAt!).toLocaleDateString('zh-CN')}`
                          }
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>欢迎使用瓴积AI</div>
                      )}
                    </div>

                    {/* 菜单项 */}
                    <div style={{ padding: '6px 0' }}>
                      {menuItems.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => {
                            setDropdownOpen(false);
                            navigate(item.path);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            width: '100%',
                            height: '48px',
                            padding: '0 20px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                            fontSize: '14px',
                            color: '#333',
                            textAlign: 'left',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#F3F4F6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <item.icon size={20} color="#6B7280" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* 填写邀请码 */}
                    <div style={{ borderTop: '1px solid #E5E7EB', padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Gift size={16} color="#8b5cf6" />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>填写邀请码</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={inviteCode}
                          onChange={(e) => { setInviteCode(e.target.value); setInviteResult(null); }}
                          placeholder="请输入邀请码"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '13px',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#8b5cf6')}
                          onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleInviteSubmit(); }}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleInviteSubmit(); }}
                          disabled={inviteLoading || !inviteCode.trim()}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: inviteLoading || !inviteCode.trim() ? '#d1d5db' : '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: inviteLoading || !inviteCode.trim() ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {inviteLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          兑换
                        </button>
                      </div>
                      {inviteResult && (
                        <div style={{
                          fontSize: '12px',
                          marginTop: '6px',
                          color: inviteResult.type === 'success' ? '#059669' : '#dc2626',
                        }}>
                          {inviteResult.msg}
                        </div>
                      )}
                    </div>

                    {/* 退出登录 */}
                    <div style={{ borderTop: '1px solid #E5E7EB' }}>
                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          height: '48px',
                          padding: '0 20px',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                          fontSize: '14px',
                          color: '#EF4444',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#FEF2F2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <LogOut size={20} color="#EF4444" />
                        <span>退出登录</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

      <main style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: location.pathname === '/explore'
          ? 'linear-gradient(to right, #f0edff 0%, #eae5fc 100%)'
          : 'transparent',
        scrollBehavior: 'smooth'
      }}>
        <Outlet />
      </main>
    </div>
  );
}
