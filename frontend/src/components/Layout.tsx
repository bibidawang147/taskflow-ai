import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Package, LogOut, Gift, Check, Loader2, Crown, ShieldCheck, CreditCard, Copy, Ticket, Menu, X, ChevronDown } from 'lucide-react';
import { authService } from '../services/auth';
import { useState, useRef, useEffect, useMemo } from 'react';

import { API_BASE_URL } from '../services/api';
import WelcomeGuide from './WelcomeGuide';
import FreeQuotaIndicator from './FreeQuotaIndicator';
import { useIsMobile } from '../hooks/useIsMobile';
import '../styles/layout-responsive.css';

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
  const isMobile = useIsMobile();
  const isAuthenticated = authService.isAuthenticated();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [idCopied, setIdCopied] = useState(false);
  const [myReferralCode, setMyReferralCode] = useState('');
  const [referralUsedCount, setReferralUsedCount] = useState(0);
  const [referralCopied, setReferralCopied] = useState(false);
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
    setMobileMenuOpen(false);
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
    if (isAuthenticated) {
      fetchSubscription();
      // 获取我的邀请码
      (async () => {
        try {
          const token = authService.getToken();
          if (!token) return;
          const res = await fetch(`${API_BASE_URL}/api/referral/my-code`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setMyReferralCode(data.code || '');
            setReferralUsedCount(data.usedCount || 0);
          }
        } catch {}
      })();
    }
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

  // 下拉框关闭时重置邀请码展开状态
  useEffect(() => {
    if (!dropdownOpen) {
      setShowInviteInput(false);
      setInviteCode('');
      setInviteResult(null);
    }
  }, [dropdownOpen]);

  // 路由变化时关闭菜单
  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
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

  const navLinks = [
    { path: '/workspace', label: '工作台' },
    { path: '/explore', label: 'AI工作方法广场' },
  ];

  // 用户下拉菜单内容（桌面和移动端共用）
  const dropdownContent = (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: isMobile ? '14px 14px 0 0' : '14px',
        border: isMobile ? 'none' : '1px solid rgba(0,0,0,0.06)',
        boxShadow: isMobile ? '0 -4px 32px rgba(0,0,0,0.12)' : '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        animation: isMobile ? 'slideUpIn 0.2s ease' : 'dropdownFadeIn 0.18s ease',
        width: isMobile ? '100%' : '260px',
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
              height: isMobile ? '44px' : '34px',
              padding: '0 14px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
              fontSize: isMobile ? '14px' : '12.5px',
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

      {/* 填写邀请码 - 点击展开 */}
      <div style={{ borderTop: '1px solid #F0F1F3', padding: '7px 14px 8px' }}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowInviteInput(!showInviteInput); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            width: '100%',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          <Gift size={13} color="#8b5cf6" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#4B5563', flexShrink: 0 }}>兑换</span>
          <ChevronDown size={12} color="#9CA3AF" style={{ marginLeft: 'auto', transform: showInviteInput ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </button>
        {showInviteInput && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => { setInviteCode(e.target.value); setInviteResult(null); }}
              placeholder="输入兑换码"
              onClick={(e) => e.stopPropagation()}
              autoFocus
              style={{
                flex: 1,
                minWidth: 0,
                padding: '3px 7px',
                border: '1px solid #E5E7EB',
                borderRadius: '5px',
                fontSize: '11px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#8b5cf6'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; }}
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
        )}
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

      {/* 我的邀请码 */}
      <div style={{ borderTop: '1px solid #F0F1F3', padding: '7px 14px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <Ticket size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#4B5563', flexShrink: 0 }}>我的邀请码</span>
          <span style={{ fontSize: '10px', color: '#9CA3AF', marginLeft: 'auto' }}>{referralUsedCount}/200</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <code
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              padding: '3px 7px',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '5px',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#374151',
              letterSpacing: '0.5px',
              userSelect: 'all',
            }}
          >
            {myReferralCode || '加载中...'}
          </code>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!myReferralCode) return;
              navigator.clipboard.writeText(myReferralCode);
              setReferralCopied(true);
              setTimeout(() => setReferralCopied(false), 2000);
            }}
            disabled={!myReferralCode}
            style={{
              padding: '3px 8px',
              backgroundColor: !myReferralCode ? '#E5E7EB' : referralCopied ? '#059669' : '#f59e0b',
              color: !myReferralCode ? '#9CA3AF' : 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 500,
              cursor: !myReferralCode ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            {referralCopied ? <Check size={10} /> : <Copy size={10} />}
            {referralCopied ? '已复制' : '复制'}
          </button>
        </div>
        <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '3px', paddingLeft: '19px' }}>
          好友使用可得30天PRO，你获得7天
        </div>
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
            height: isMobile ? '44px' : '34px',
            padding: '0 14px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'all 0.12s ease',
            fontSize: isMobile ? '14px' : '12.5px',
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
  );

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
            height: isMobile ? '52px' : '64px',
            padding: isMobile ? '0 12px' : '0 1.5rem 0 28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* 移动端汉堡菜单按钮 */}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                  marginRight: '4px',
                }}
              >
                {mobileMenuOpen ? <X size={22} color="#374151" /> : <Menu size={22} color="#374151" />}
              </button>
            )}
            <Link
              to="/workspace"
              className="brand-title"
              style={{
                fontSize: isMobile ? '1.15rem' : '1.4rem',
                color: '#374151',
                textDecoration: 'none',
              }}
            >
              瓴积AI
            </Link>
            {/* 桌面端导航链接 */}
            {!isMobile && (
              <div style={{ display: 'flex', marginLeft: '2.5rem', gap: '1.5rem' }}>
                {navLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    style={{
                      color: isActive(link.path) ? '#8b5cf6' : '#6b7280',
                      textDecoration: 'none',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: isActive(link.path) ? '15px' : '14px',
                      fontWeight: isActive(link.path) ? '600' : '500',
                      backgroundColor: isActive(link.path) ? '#f3f0ff' : 'transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.75rem' }}>
            {isAuthenticated && !isMobile && <FreeQuotaIndicator />}
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

                {/* 桌面端下拉菜单 */}
                {dropdownOpen && !isMobile && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 1001 }}>
                    {dropdownContent}
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
                    fontSize: isMobile ? '13px' : '14px',
                  }}
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  style={{
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: isMobile ? '13px' : '14px',
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

      {/* 移动端导航抽屉 */}
      {isMobile && mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              top: '52px',
              background: 'rgba(0, 0, 0, 0.4)',
              zIndex: 998,
              animation: 'overlayFadeIn 0.2s ease',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '52px',
              left: 0,
              right: 0,
              background: '#FFFFFF',
              zIndex: 999,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              animation: 'slideDownIn 0.2s ease',
              maxHeight: 'calc(100vh - 52px)',
              overflowY: 'auto',
            }}
          >
            <div style={{ padding: '8px 0' }}>
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 20px',
                    color: isActive(link.path) ? '#8b5cf6' : '#374151',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: isActive(link.path) ? 600 : 500,
                    backgroundColor: isActive(link.path) ? '#f3f0ff' : 'transparent',
                    borderLeft: isActive(link.path) ? '3px solid #8b5cf6' : '3px solid transparent',
                  }}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && (
                <div style={{ borderTop: '1px solid #F0F1F3', padding: '8px 20px' }}>
                  <FreeQuotaIndicator />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 移动端用户菜单底部弹出 */}
      {isMobile && dropdownOpen && (
        <>
          <div
            onClick={() => setDropdownOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              zIndex: 1100,
              animation: 'overlayFadeIn 0.2s ease',
            }}
          />
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1101,
              paddingBottom: 'env(safe-area-inset-bottom, 0)',
            }}
          >
            {dropdownContent}
          </div>
        </>
      )}

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
