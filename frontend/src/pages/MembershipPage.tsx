import { useState } from 'react';
import { Check, Crown, Zap, Building2, Sparkles, X } from 'lucide-react';
import { creditService } from '../services/credit';
import { UserTier } from '../types/credit';
import '../styles/membership.css';

export function MembershipPage() {
  const [currentTier, setCurrentTier] = useState<UserTier>('free');
  const [loading, setLoading] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  const tiers = [
    {
      tier: 'free' as UserTier,
      icon: Zap,
      name: '免费版',
      price: 0,
      period: '永久免费',
      iconClass: 'membership-card-icon--free',
      features: [
        '1 个画布，不可增加',
        'AI 转工作流 5 次/月',
        '复制免费工作方法',
        '浏览 AI 工作方法广场',
      ],
    },
    {
      tier: 'pro' as UserTier,
      icon: Crown,
      name: '专业版',
      price: 499,
      period: '每年',
      iconClass: 'membership-card-icon--pro',
      popular: true,
      features: [
        '10 个画布（年度会员）',
        'AI 转工作流 200 次/月',
        '发布与复制所有工作方法',
        '查看完整步骤详情与提示词',
        '购买付费工作方法',
        '申请成为创作者',
      ],
    },
    {
      tier: 'enterprise' as UserTier,
      icon: Building2,
      name: '企业定制',
      price: 999,
      period: '起',
      priceLabel: '999元起',
      iconClass: 'membership-card-icon--enterprise',
      features: [
        '无限画布',
        'AI 转工作流不限次数',
        '发布与复制所有工作方法',
        '查看完整步骤详情与提示词',
        '团队协作功能',
        '专属客服经理',
        '定制化功能开发',
      ],
    },
  ];

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

  const handleUpgrade = async (tier: UserTier) => {
    if (tier === 'free') return;

    const confirmed = window.confirm(`确定要升级到${creditService.getTierInfo(tier).displayName}吗？`);
    if (!confirmed) return;

    setLoading(true);
    try {
      await creditService.upgradeTier(tier);
      setCurrentTier(tier);
      alert('升级成功！你的会员权益已生效。');
    } catch (error: any) {
      alert(error.response?.data?.message || '升级失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="membership-page">
      <div className="membership-container">
        {/* 头部 */}
        <div className="membership-header">
          <h1 className="membership-title">选择适合你的方案</h1>
          <p className="membership-subtitle">解锁更多功能，提升工作效率</p>
          <div style={{ marginTop: 20 }}>
            <span className="membership-current-badge">
              <Sparkles />
              当前等级：{creditService.getTierInfo(currentTier).displayName}
            </span>
          </div>
        </div>

        {/* 会员卡片 */}
        <div className="membership-grid">
          {tiers.map((tierInfo) => {
            const Icon = tierInfo.icon;
            const isCurrent = currentTier === tierInfo.tier;

            let cardClass = 'membership-card';
            if (tierInfo.popular) cardClass += ' membership-card--popular';
            if (isCurrent) cardClass += ' membership-card--current';

            let btnClass = 'membership-btn';
            if (isCurrent) {
              btnClass += ' membership-btn--current';
            } else if (tierInfo.tier === 'free') {
              btnClass += ' membership-btn--free';
            } else if (tierInfo.tier === 'enterprise') {
              btnClass += ' membership-btn--enterprise';
            } else {
              btnClass += ' membership-btn--upgrade';
            }

            return (
              <div key={tierInfo.tier} className={cardClass}>
                {tierInfo.popular && (
                  <span className="membership-badge membership-badge--popular">推荐</span>
                )}
                {isCurrent && (
                  <span className="membership-badge membership-badge--current">当前</span>
                )}

                {/* 头部 */}
                <div className="membership-card-header">
                  <h3 className="membership-card-name">{tierInfo.name}</h3>
                </div>

                {/* 价格 */}
                <div className="membership-price">
                  {tierInfo.price === 0 ? (
                    <span className="membership-price-free">永久免费</span>
                  ) : tierInfo.priceLabel ? (
                    <div className="membership-price-amount">
                      <span className="membership-price-number" style={{ fontSize: 32 }}>¥{tierInfo.price}</span>
                      <span className="membership-price-unit">起</span>
                    </div>
                  ) : (
                    <div className="membership-price-amount">
                      <span className="membership-price-currency">¥</span>
                      <span className="membership-price-number">{tierInfo.price}</span>
                      <span className="membership-price-unit">/ {tierInfo.period}</span>
                    </div>
                  )}
                </div>

                {/* 功能列表 */}
                <ul className="membership-features">
                  {tierInfo.features.map((feature, index) => (
                    <li key={index} className="membership-feature-item">
                      <Check className="membership-feature-check" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* 按钮 */}
                <div className="membership-card-action">
                  <button
                    className={btnClass}
                    onClick={() => tierInfo.tier === 'enterprise' ? setShowQrCode(true) : handleUpgrade(tierInfo.tier)}
                    disabled={isCurrent || (loading && tierInfo.tier !== 'enterprise')}
                  >
                    {isCurrent ? '当前方案' : tierInfo.tier === 'free' ? '免费使用' : tierInfo.tier === 'enterprise' ? '联系我们' : '立即升级'}
                  </button>
                </div>
              </div>
            );
          })}
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
                  <th className="membership-th--pro">专业版</th>
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
          <p>* 画布数量以年度会员为准，月度会员画布数量可能不同</p>
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
    </div>
  );
}
