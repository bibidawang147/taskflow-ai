import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Package, LogOut, Gift, Check, Loader2, Crown, ShieldCheck, CreditCard, Copy, Ticket } from 'lucide-react';
import { authService } from '../services/auth';
import { useState, useRef, useEffect, useMemo } from 'react';

import { API_BASE_URL } from '../services/api';
import WelcomeGuide from './WelcomeGuide';
import FreeQuotaIndicator from './FreeQuotaIndicator';

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
  const [idCopied, setIdCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 从 JWT token 解析 userId
  const userId = useMemo(() => {
    try {
      const token = authService.getToken();
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.id || payload.sub || null;
    } catch { return null; }
  }, [isAuthenticated]);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  const isActive = (path: string) => {
    if (path === '/workspace') {
      return location.pathname === '/' || location.pathname === '/workspace';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
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
      const res = await fetch(`${API_BASE_URL}/api/promo/subscription`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSubscription(await res.json());
      } else {
        console.error('[Layout] 获取订阅信息失败:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('[Layout] 获取订阅信息异常:', error);
    }
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
      const checkRes = await fetch(`${API_BASE_URL}/api/promo/check?code=${encodeURIComponent(inviteCode.trim())}`, { headers });
      const checkData = await checkRes.json();
      if (!checkRes.ok || !checkData.valid) {
        setInviteResult({ type: 'error', msg: checkData.error || '兑换码无效' });
        setInviteLoading(false);
        return;
      }

      // 2. 兑换
      const res = await fetch(`${API_BASE_URL}/api/promo/redeem`, {
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
      { icon: Ticket, label: '优惠码管理', path: '/admin/promo' },
      { icon: ShieldCheck, label: '订单管理', path: '/admin/orders' },
      { icon: CreditCard, label: '定价管理', path: '/admin/pricing' },
    ] : []),
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
            {isAuthenticated && <FreeQuotaIndicator />}
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
                      top: 'calc(100% + 6px)',
                      right: 0,
                      width: '260px',
                      background: '#FFFFFF',
                      borderRadius: '14px',
                      border: '1px solid rgba(0,0,0,0.06)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.04)',
                      zIndex: 1001,
                      overflow: 'hidden',
                      animation: 'dropdownFadeIn 0.18s ease',
                    }}
                  >
                    {/* 用户信息区 */}
                    <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #F0F1F3' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#111827' }}>用户</span>
                        {subscription && subscription.role !== 'free' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            backgroundColor: ROLE_COLORS[subscription.role]?.bg || '#F3F4F6',
                            color: ROLE_COLORS[subscription.role]?.text || '#6B7280',
                          }}>
                            <Crown size={10} />
                            {ROLE_LABELS[subscription.role] || subscription.role}
                          </span>
                        )}
                      </div>
                      {subscription && subscription.role !== 'free' && subscription.daysRemaining > 0 ? (
                        <div style={{
                          fontSize: '11px',
                          color: subscription.daysRemaining <= 7 ? '#EF4444' : '#9CA3AF',
                          marginTop: '2px',
                          fontWeight: subscription.daysRemaining <= 7 ? 500 : 400,
                        }}>
                          {subscription.daysRemaining <= 7
                            ? `会员即将到期，剩余 ${subscription.daysRemaining} 天`
                            : `到期时间：${new Date(subscription.roleExpiresAt!).toLocaleDateString('zh-CN')}`
                          }
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#B0B7C3', marginTop: '2px' }}>欢迎使用瓴积AI</div>
                      )}
                      {userId && (
                        <div
                          onClick={handleCopyId}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '6px',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '10px',
                            background: idCopied ? '#ECFDF5' : '#F9FAFB',
                            color: idCopied ? '#059669' : '#9CA3AF',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                          }}
                          title="点击复制 ID"
                        >
                          <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', letterSpacing: '0.01em' }}>ID: {userId}</span>
                          {idCopied ? <Check size={10} /> : <Copy size={10} />}
                        </div>
                      )}
                    </div>

                    {/* 菜单项 */}
                    <div style={{ padding: '3px 0' }}>
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
                            gap: '8px',
                            width: '100%',
                            height: '34px',
                            padding: '0 14px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.12s ease',
                            fontSize: '12.5px',
                            fontWeight: 500,
                            color: '#374151',
                            textAlign: 'left',
                            borderRadius: 0,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#F5F3FF';
                            e.currentTarget.style.color = '#7C3AED';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#374151';
                          }}
                        >
                          <item.icon size={15} color="currentColor" style={{ opacity: 0.6 }} />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* 填写邀请码 - 单行布局 */}
                    <div style={{ borderTop: '1px solid #F0F1F3', padding: '7px 14px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Gift size={13} color="#8b5cf6" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#4B5563', flexShrink: 0 }}>邀请码</span>
                        <input
                          type="text"
                          value={inviteCode}
                          onChange={(e) => { setInviteCode(e.target.value); setInviteResult(null); }}
                          placeholder="输入兑换码"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '90px',
                            flex: '0 1 90px',
                            padding: '3px 7px',
                            border: '1px solid #E5E7EB',
                            borderRadius: '5px',
                            fontSize: '11px',
                            outline: 'none',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.2s, flex 0.2s',
                          }}
                          onFocus={(e) => { e.target.style.borderColor = '#8b5cf6'; e.target.style.flex = '1 1 90px'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; if (!inviteCode) e.target.style.flex = '0 1 90px'; }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleInviteSubmit(); }}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleInviteSubmit(); }}
                          disabled={inviteLoading || !inviteCode.trim()}
                          style={{
                            padding: '3px 8px',
                            backgroundColor: inviteLoading || !inviteCode.trim() ? '#E5E7EB' : '#8b5cf6',
                            color: inviteLoading || !inviteCode.trim() ? '#9CA3AF' : 'white',
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: 500,
                            cursor: inviteLoading || !inviteCode.trim() ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s',
                            flexShrink: 0,
                          }}
                        >
                          {inviteLoading ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                          兑换
                        </button>
                      </div>
                      {inviteResult && (
                        <div style={{
                          fontSize: '10.5px',
                          marginTop: '3px',
                          paddingLeft: '19px',
                          color: inviteResult.type === 'success' ? '#059669' : '#dc2626',
                        }}>
                          {inviteResult.msg}
                        </div>
                      )}
                    </div>

                    {/* 退出登录 */}
                    <div style={{ borderTop: '1px solid #F0F1F3' }}>
                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%',
                          height: '34px',
                          padding: '0 14px',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                          fontSize: '12.5px',
                          fontWeight: 500,
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
                        <LogOut size={15} color="#EF4444" style={{ opacity: 0.7 }} />
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

      {isAuthenticated && <WelcomeGuide />}

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
