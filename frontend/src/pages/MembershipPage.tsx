import { useState, useEffect } from 'react';
import { Check, Sparkles, X, Loader2 } from 'lucide-react';
import { authService } from '../services/auth';
import { api } from '../services/api';
import '../styles/membership.css';

interface PricingInfo {
  currentTier: 'early_bird' | 'growth' | 'standard'
  currentPrice: number
  originalPrice: number
  earlyBirdRemaining: number
  earlyBirdLimit: number
  earlyBirdSold: number
  prices: { early_bird: number; growth: number; standard: number }
  renewalDiscount: number
  renewal: {
    canRenew: boolean
    daysUntilExpiry: number
    renewalPrice: number | null
    currentSubscriptionExpiresAt: string
  } | null
}

interface PurchaseResult {
  subscriptionId: string
  plan: string
  priceTier: string
  originalPrice: number
  paidAmount: number
  isRenewal: boolean
  usedPromoCode: boolean
  usedRenewalDiscount: boolean
  startedAt: string
  expiresAt: string
  status: string
}

interface SubscriptionInfo {
  role: string
  roleExpiresAt: string | null
  daysRemaining: number
  activeSubscription: {
    plan: string
    source: string
    startedAt: string
    expiresAt: string
  } | null
}

const TIER_LABELS: Record<string, string> = {
  early_bird: '早鸟价',
  growth: '成长价',
  standard: '标准价',
}

export function MembershipPage() {
  const isAuthenticated = authService.isAuthenticated();
  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [showQrCode, setShowQrCode] = useState(false);
  const [showContactQr, setShowContactQr] = useState(false);

  // 购买流程状态
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);
  const [purchaseError, setPurchaseError] = useState('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // 获取动态定价 + 订阅状态
  useEffect(() => {
    fetchPricing();
    if (isAuthenticated) fetchSubscription();
  }, []);

  const fetchPricing = async () => {
    try {
      const res = await api.get('/api/pricing');
      setPricing(res.data);
    } catch (err) {
      console.error('获取定价失败:', err);
    } finally {
      setLoadingPricing(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await api.get('/api/promo/subscription');
      setSubscription(res.data);
    } catch (err) {
      console.error('获取订阅信息失败:', err);
    }
  };

  // 购买 Pro
  const handlePurchase = async () => {
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }
    setPurchasing(true);
    setPurchaseError('');
    try {
      const res = await api.post('/api/pricing/purchase', {
        plan: 'pro',
      });
      if (res.data.success) {
        setPurchaseResult(res.data.data);
        setShowPurchaseModal(true);
        fetchPricing(); // 刷新定价信息（早鸟名额等）
      } else {
        setPurchaseError(res.data.error || '购买失败');
      }
    } catch (err: any) {
      setPurchaseError(err.response?.data?.error || '购买失败，请稍后重试');
    } finally {
      setPurchasing(false);
    }
  };

  // 主价格始终显示当前阶段基础价（如早鸟¥199），续费价单独展示
  const getDisplayPrice = () => {
    if (!pricing) return null;
    const base = pricing.currentPrice;
    return { price: base, label: TIER_LABELS[pricing.currentTier], isDiscount: pricing.currentTier !== 'standard' };
  };

  const userRole = subscription?.role || 'free';
  const subscriptionSource = subscription?.activeSubscription?.source;
  // 体验用户：通过邀请码/赠送获得的会员，不算真正付费
  const isTrial = isPaidRole(userRole) && subscriptionSource !== 'purchase';
  // 真正付费过的会员
  const isPaidPro = isPaidRole(userRole) && subscriptionSource === 'purchase';
  // 角色上是 pro 及以上（包含体验用户）
  const isPro = isPaidRole(userRole);
  const displayPrice = getDisplayPrice();

  function isPaidRole(role: string) {
    return role === 'pro' || role === 'creator' || role === 'admin';
  }

  const compareRows = [
    { label: '画布数量', free: '1 个', pro: '10 个', enterprise: '无限制' },
    { label: 'AI 转工作流', free: '5 次/月', pro: '200 次/月', enterprise: '不限' },
    { label: '发布工作流', free: false, pro: true, enterprise: true },
    { label: '查看步骤详情与提示词', free: false, pro: true, enterprise: true },
    { label: '复制会员工作方法', free: false, pro: true, enterprise: true },
    { label: '申请成为创作者', free: false, pro: true, enterprise: true },
    { label: '团队协作', free: false, pro: false, enterprise: true },
    { label: '专属客服', free: false, pro: false, enterprise: true },
  ];

  const renderCell = (value: boolean | string) => {
    if (typeof value === 'string') return value;
    if (value) {
      return (
        <span className="membership-table-check">
          <Check />
        </span>
      );
    }
    return <span className="membership-table-dash">—</span>;
  };

  if (loadingPricing) {
    return (
      <div className="membership-page">
        <div className="membership-loading">
          <Loader2 className="membership-loading-icon" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="membership-page">
      <div className="membership-container">
        {/* 头部 */}
        <div className="membership-header">
          <h1 className="membership-title">选择适合你的方案</h1>
          <div style={{ marginTop: 20 }}>
            <span className="membership-current-badge">
              当前等级：{isTrial
                ? `PRO会员体验中（剩余 ${subscription?.daysRemaining ?? 0} 天）`
                : isPaidPro
                  ? 'PRO会员'
                  : userRole === 'creator'
                    ? '创作者'
                    : '免费版'}
            </span>
          </div>
        </div>

        {/* 早鸟进度条 */}
        {pricing && pricing.currentTier === 'early_bird' && (
          <div className="membership-earlybird-bar">
            <div className="membership-earlybird-info">
              <span className="membership-earlybird-label">早鸟名额</span>
              <span className="membership-earlybird-count">
                已售 {pricing.earlyBirdSold} / {pricing.earlyBirdLimit}
              </span>
            </div>
            <div className="membership-earlybird-track">
              <div
                className="membership-earlybird-fill"
                style={{ width: `${Math.min(100, (pricing.earlyBirdSold / pricing.earlyBirdLimit) * 100)}%` }}
              />
            </div>
            <p className="membership-earlybird-hint">
              仅剩 {pricing.earlyBirdRemaining} 个早鸟名额，售完即恢复原价
            </p>
          </div>
        )}

        {/* 会员卡片 */}
        <div className="membership-grid">
          {/* 免费版 */}
          <div className={`membership-card${userRole === 'free' ? ' membership-card--current' : ''}`}>
            {userRole === 'free' && (
              <span className="membership-badge membership-badge--current">当前</span>
            )}
            <div className="membership-card-header">
              <h3 className="membership-card-name">免费版</h3>
            </div>
            <div className="membership-price">
              <span className="membership-price-free">永久免费</span>
            </div>
            <ul className="membership-features">
              {['1 个画布，不可增加', 'AI 转工作流 5 次/月', '复制免费工作方法', '浏览 AI 工作方法广场'].map((f, i) => (
                <li key={i} className="membership-feature-item">
                  <Check className="membership-feature-check" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="membership-card-action">
              <button className="membership-btn membership-btn--free" disabled>
                {userRole === 'free' ? '当前方案' : '免费使用'}
              </button>
            </div>
          </div>

          {/* PRO会员 */}
          <div className={`membership-card membership-card--popular${isPro ? ' membership-card--current' : ''}`}>
            <span className="membership-badge membership-badge--popular">推荐</span>
            {isPaidPro && (
              <span className="membership-badge membership-badge--current">当前</span>
            )}
            <div className="membership-card-header">
              <h3 className="membership-card-name">PRO会员</h3>
            </div>
            <div className="membership-price">
              <div className="membership-price-amount">
                {pricing && pricing.currentTier !== 'standard' && (
                  <span className="membership-tier-label">{TIER_LABELS[pricing.currentTier]}</span>
                )}
                <span className="membership-price-currency">¥</span>
                <span className="membership-price-number">
                  {displayPrice ? displayPrice.price : pricing?.currentPrice || 499}
                </span>
                <span className="membership-price-unit">/ 年</span>
                {/* 即将恢复原价提示，和价格同行 */}
                {pricing && displayPrice?.isDiscount && (
                  <span className="membership-price-original-inline">
                    即将恢复原价 ¥{pricing.originalPrice}/年
                  </span>
                )}
              </div>
              {/* 续费提示：仅真正付费会员 + 到期前60天内展示 */}
              {isPaidPro && pricing?.renewal?.canRenew && pricing.renewal.renewalPrice && (
                <div className="membership-price-renewal">
                  续费优惠 {Math.round(pricing.renewalDiscount * 100)}% · 到期前 {pricing.renewal.daysUntilExpiry} 天
                </div>
              )}
            </div>

            <ul className="membership-features">
              {[
                '10 个画布（年度会员）',
                'AI 转工作流 200 次/月',
                '发布与复制所有工作方法',
                '查看完整步骤详情与提示词',
                '购买付费工作方法',
                '申请成为创作者',
              ].map((f, i) => (
                <li key={i} className="membership-feature-item">
                  <Check className="membership-feature-check" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>


            <div className="membership-card-action">
              {isPaidPro ? (
                pricing?.renewal?.canRenew && pricing.renewal.renewalPrice ? (
                  <button
                    className="membership-btn membership-btn--upgrade"
                    onClick={handlePurchase}
                    disabled={purchasing}
                  >
                    {purchasing ? <><Loader2 size={16} className="spin" /> 处理中...</> : `续费 ¥${pricing.renewal.renewalPrice}`}
                  </button>
                ) : (
                  <button className="membership-btn membership-btn--current" disabled>
                    当前方案
                  </button>
                )
              ) : (
                <button
                  className="membership-btn membership-btn--upgrade"
                  onClick={isAuthenticated ? handlePurchase : () => alert('请先登录')}
                  disabled={purchasing}
                >
                  {purchasing ? <><Loader2 size={16} className="spin" /> 处理中...</> : '立即升级'}
                </button>
              )}
            </div>
            {purchaseError && (
              <div className="membership-purchase-error">{purchaseError}</div>
            )}
          </div>

          {/* 企业定制 */}
          <div className="membership-card">
            <div className="membership-card-header">
              <h3 className="membership-card-name">企业定制</h3>
            </div>
            <div className="membership-price">
              <div className="membership-price-amount">
                <span className="membership-price-number" style={{ fontSize: 32 }}>¥999</span>
                <span className="membership-price-unit">起</span>
              </div>
            </div>
            <ul className="membership-features">
              {[
                '无限画布',
                'AI 转工作流不限次数',
                '发布与复制所有工作方法',
                '查看完整步骤详情与提示词',
                '团队协作功能',
                '专属客服经理',
                '定制化功能开发',
              ].map((f, i) => (
                <li key={i} className="membership-feature-item">
                  <Check className="membership-feature-check" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="membership-card-action">
              <button
                className="membership-btn membership-btn--enterprise"
                onClick={() => setShowQrCode(true)}
              >
                联系我们
              </button>
            </div>
          </div>
        </div>

        {/* 功能对比表 */}
        <div className="membership-compare">
          <div className="membership-compare-header">
            <h2 className="membership-compare-title">功能对比</h2>
          </div>
          <div className="membership-compare-body">
            <table className="membership-table">
              <thead>
                <tr>
                  <th>功能</th>
                  <th>免费版</th>
                  <th className="membership-th--pro">PRO会员</th>
                  <th className="membership-th--enterprise">企业版</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, index) => (
                  <tr key={index}>
                    <td>{row.label}</td>
                    <td>
                      {typeof row.free === 'string' ? (
                        <span className="membership-table-value">{row.free}</span>
                      ) : (
                        renderCell(row.free)
                      )}
                    </td>
                    <td>
                      {typeof row.pro === 'string' ? (
                        <span className="membership-table-value membership-table-value--pro">{row.pro}</span>
                      ) : (
                        renderCell(row.pro)
                      )}
                    </td>
                    <td>
                      {typeof row.enterprise === 'string' ? (
                        <span className="membership-table-value membership-table-value--enterprise">{row.enterprise}</span>
                      ) : (
                        renderCell(row.enterprise)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 底部说明 */}
        <div className="membership-footer">
          <p>* 画布数量以年度会员为准 · 购买后请等待管理员确认支付</p>
        </div>
      </div>

      {/* 微信二维码弹窗 */}
      {showQrCode && (
        <div className="membership-modal-overlay" onClick={() => setShowQrCode(false)}>
          <div className="membership-modal" onClick={(e) => e.stopPropagation()}>
            <button className="membership-modal-close" onClick={() => setShowQrCode(false)}>
              <X size={18} />
            </button>
            <h3 className="membership-modal-title">添加微信咨询企业定制</h3>
            <div className="membership-modal-qrcode-wrapper">
              <img src="/wechat-qrcode.png" alt="微信二维码" className="membership-modal-qrcode" />
            </div>
            <p className="membership-modal-hint">扫描二维码添加微信</p>
          </div>
        </div>
      )}

      {/* 购买结果弹窗 */}
      {showPurchaseModal && purchaseResult && (
        <div className="membership-modal-overlay" onClick={() => setShowPurchaseModal(false)}>
          <div className="membership-modal membership-modal--purchase" onClick={(e) => e.stopPropagation()}>
            <button className="membership-modal-close" onClick={() => setShowPurchaseModal(false)}>
              <X size={18} />
            </button>
            <h3 className="membership-modal-title">订单已创建</h3>
            <div className="membership-order-summary">
              <div className="membership-order-row">
                <span>方案</span>
                <span>PRO会员 · 年度</span>
              </div>
              <div className="membership-order-row">
                <span>定价阶段</span>
                <span>{TIER_LABELS[purchaseResult.priceTier] || purchaseResult.priceTier}</span>
              </div>
              {purchaseResult.usedRenewalDiscount && (
                <div className="membership-order-row">
                  <span>续费折扣</span>
                  <span className="membership-order-discount">已享续费优惠</span>
                </div>
              )}
              {purchaseResult.usedPromoCode && (
                <div className="membership-order-row">
                  <span>优惠码</span>
                  <span className="membership-order-discount">已使用</span>
                </div>
              )}
              {purchaseResult.originalPrice !== purchaseResult.paidAmount && (
                <div className="membership-order-row">
                  <span>原价</span>
                  <span className="membership-order-original">¥{purchaseResult.originalPrice}</span>
                </div>
              )}
              <div className="membership-order-row membership-order-row--total">
                <span>应付金额</span>
                <span className="membership-order-total">¥{purchaseResult.paidAmount}</span>
              </div>
              <div className="membership-order-row">
                <span>有效期</span>
                <span>{new Date(purchaseResult.startedAt).toLocaleDateString()} ~ {new Date(purchaseResult.expiresAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="membership-order-pay">
              <p className="membership-order-pay-title">请扫码支付后等待管理员确认</p>
              <div className="membership-modal-qrcode-wrapper">
                <img src="/wechat-qrcode.png" alt="微信支付" className="membership-modal-qrcode" />
              </div>
              <p className="membership-modal-hint">转账时请务必备注你的用户名</p>
              <p className="membership-modal-hint">
                有任何问题请<span className="membership-modal-contact" onClick={() => setShowContactQr(!showContactQr)}>联系我</span>
              </p>
              {showContactQr && (
                <div className="membership-modal-qrcode-wrapper" style={{ marginTop: 12 }}>
                  <img src="/wechat-qrcode.png" alt="联系微信" className="membership-modal-qrcode" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
