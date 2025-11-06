import { useState } from 'react';
import { Check, Crown, Rocket, Building2, Zap } from 'lucide-react';
import { creditService } from '../services/credit';
import { UserTier } from '../types/credit';

export function MembershipPage() {
  const [currentTier, setCurrentTier] = useState<UserTier>('free');
  const [loading, setLoading] = useState(false);

  const tiers = [
    {
      tier: 'free' as UserTier,
      icon: Zap,
      name: '免费版',
      price: 0,
      period: '永久免费',
      color: 'gray',
      features: [
        '每日 10,000 积分免费额度',
        '注册赠送 50,000 积分',
        '访问基础 AI 模型',
        'GPT-4o Mini, Claude Haiku',
        '豆包、通义千问、GLM',
        '基本功能支持',
      ],
    },
    {
      tier: 'pro' as UserTier,
      icon: Crown,
      name: '专业版',
      price: 99,
      period: '每月',
      color: 'blue',
      popular: true,
      features: [
        '每日 50,000 积分免费额度',
        '访问所有 AI 模型',
        'GPT-4o, Claude 3.5 Sonnet',
        '所有调用享受 85 折优惠',
        '优先处理队列',
        '高级工作流功能',
        '邮件技术支持',
      ],
    },
    {
      tier: 'enterprise' as UserTier,
      icon: Building2,
      name: '企业版',
      price: 999,
      period: '每月',
      color: 'purple',
      features: [
        '每日 200,000 积分免费额度',
        '访问所有 AI 模型',
        '所有调用享受 7 折优惠',
        '最高优先级处理',
        '无限工作流数量',
        '团队协作功能',
        '专属客服经理',
        '定制化功能开发',
        'SLA 服务保障',
      ],
    },
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #faf5ff 100%)',
      padding: '3rem 2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 顶部 */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1.25rem',
            lineHeight: '1.2',
            letterSpacing: '-0.01em'
          }}>
            选择适合你的会员方案
          </h1>
          <p style={{
            fontSize: '1.375rem',
            color: '#6b7280',
            lineHeight: '1.7'
          }}>
            解锁更多功能，获得更优惠的价格
          </p>
        </div>

        {/* 当前等级 */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            color: 'white',
            borderRadius: '50px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            <Crown style={{ width: '22px', height: '22px' }} />
            <span style={{ fontWeight: '600', fontSize: '1.125rem', lineHeight: '1.5' }}>
              当前等级: {creditService.getTierInfo(currentTier).displayName}
            </span>
          </div>
        </div>

        {/* 会员卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '2.5rem',
          marginBottom: '4rem'
        }}>
          {tiers.map((tierInfo) => {
            const Icon = tierInfo.icon;
            const isCurrent = currentTier === tierInfo.tier;
            const colorGradients = {
              gray: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              blue: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            }[tierInfo.color];

            return (
              <div
                key={tierInfo.tier}
                style={{
                  position: 'relative',
                  background: 'white',
                  borderRadius: '24px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                  border: tierInfo.popular ? '4px solid #3b82f6' : (isCurrent ? '3px solid #10b981' : '1px solid #e5e7eb'),
                  transform: tierInfo.popular ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                {/* 热门标签 */}
                {tierInfo.popular && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
                    color: 'white',
                    padding: '0.625rem 1.25rem',
                    borderBottomLeftRadius: '12px',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                  }}>
                    最受欢迎
                  </div>
                )}

                {/* 当前标签 */}
                {isCurrent && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '0.625rem 1.25rem',
                    borderBottomRightRadius: '12px',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}>
                    当前等级
                  </div>
                )}

                {/* 头部 */}
                <div style={{
                  background: colorGradients,
                  padding: '2.5rem 2rem',
                  color: 'white'
                }}>
                  <Icon style={{ width: '56px', height: '56px', marginBottom: '1.25rem' }} />
                  <h3 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginBottom: '0.875rem',
                    lineHeight: '1.3'
                  }}>{tierInfo.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.625rem' }}>
                    <span style={{ fontSize: '3.5rem', fontWeight: 'bold', lineHeight: '1', letterSpacing: '-0.02em' }}>¥{tierInfo.price}</span>
                    {tierInfo.price > 0 && (
                      <span style={{ fontSize: '1.125rem', opacity: 0.85, lineHeight: '1.5' }}>/ {tierInfo.period}</span>
                    )}
                  </div>
                </div>

                {/* 功能列表 */}
                <div style={{ padding: '2.5rem 2rem' }}>
                  <ul style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    marginBottom: '2.5rem',
                    listStyle: 'none',
                    padding: 0
                  }}>
                    {tierInfo.features.map((feature, index) => (
                      <li key={index} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.875rem'
                      }}>
                        <Check style={{
                          width: '22px',
                          height: '22px',
                          color: '#10b981',
                          flexShrink: 0,
                          marginTop: '2px'
                        }} />
                        <span style={{
                          color: '#374151',
                          fontSize: '1.0625rem',
                          lineHeight: '1.7'
                        }}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* 按钮 */}
                  <button
                    onClick={() => handleUpgrade(tierInfo.tier)}
                    disabled={isCurrent || loading}
                    style={{
                      width: '100%',
                      padding: '1rem 1.5rem',
                      borderRadius: '12px',
                      border: 'none',
                      fontWeight: '600',
                      fontSize: '1.0625rem',
                      transition: 'all 0.2s',
                      cursor: isCurrent ? 'not-allowed' : 'pointer',
                      minHeight: '56px',
                      background: isCurrent
                        ? '#f3f4f6'
                        : tierInfo.tier === 'free'
                        ? '#e5e7eb'
                        : colorGradients,
                      color: isCurrent ? '#9ca3af' : tierInfo.tier === 'free' ? '#374151' : 'white',
                      boxShadow: isCurrent || tierInfo.tier === 'free' ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent && tierInfo.tier !== 'free') {
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      } else if (tierInfo.tier === 'free') {
                        e.currentTarget.style.background = '#d1d5db';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent && tierInfo.tier !== 'free') {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      } else if (tierInfo.tier === 'free') {
                        e.currentTarget.style.background = '#e5e7eb';
                      }
                    }}
                  >
                    {isCurrent ? '当前方案' : tierInfo.tier === 'free' ? '免费使用' : '立即升级'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 功能对比表 */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)',
            padding: '2rem 2.5rem'
          }}>
            <h2 style={{
              fontSize: '2.25rem',
              fontWeight: 'bold',
              color: 'white',
              lineHeight: '1.3'
            }}>详细功能对比</h2>
          </div>

          <div style={{ padding: '2.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{
                    textAlign: 'left',
                    padding: '1.25rem 1rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '1.125rem',
                    lineHeight: '1.5'
                  }}>功能</th>
                  <th style={{
                    textAlign: 'center',
                    padding: '1.25rem 1rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '1.125rem',
                    lineHeight: '1.5'
                  }}>免费版</th>
                  <th style={{
                    textAlign: 'center',
                    padding: '1.25rem 1rem',
                    fontWeight: '600',
                    color: '#2563eb',
                    fontSize: '1.125rem',
                    lineHeight: '1.5'
                  }}>专业版</th>
                  <th style={{
                    textAlign: 'center',
                    padding: '1.25rem 1rem',
                    fontWeight: '600',
                    color: '#8b5cf6',
                    fontSize: '1.125rem',
                    lineHeight: '1.5'
                  }}>企业版</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1.25rem 1rem', fontSize: '1.0625rem', color: '#1f2937', lineHeight: '1.6' }}>每日免费额度</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', fontSize: '1.0625rem', lineHeight: '1.6' }}>10,000 coins</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', fontWeight: '600', color: '#2563eb', fontSize: '1.0625rem', lineHeight: '1.6' }}>50,000 coins</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', fontWeight: '600', color: '#8b5cf6', fontSize: '1.0625rem', lineHeight: '1.6' }}>200,000 coins</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1.25rem 1rem', fontSize: '1.0625rem', color: '#1f2937', lineHeight: '1.6' }}>付费折扣</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', fontSize: '1.0625rem', lineHeight: '1.6' }}>无</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', fontWeight: '600', color: '#2563eb', fontSize: '1.0625rem', lineHeight: '1.6' }}>85折</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', fontWeight: '600', color: '#8b5cf6', fontSize: '1.0625rem', lineHeight: '1.6' }}>7折</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1.25rem 1rem', fontSize: '1.0625rem', color: '#1f2937', lineHeight: '1.6' }}>GPT-4o, Claude Opus</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', color: '#9ca3af' }}>-</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', color: '#10b981' }}>
                    <Check style={{ width: '22px', height: '22px', margin: '0 auto' }} />
                  </td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', color: '#10b981' }}>
                    <Check style={{ width: '22px', height: '22px', margin: '0 auto' }} />
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1.25rem 1rem', fontSize: '1.0625rem', color: '#1f2937', lineHeight: '1.6' }}>工作流数量限制</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', fontSize: '1.0625rem', lineHeight: '1.6' }}>5 个</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', fontSize: '1.0625rem', lineHeight: '1.6' }}>50 个</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', fontWeight: '600', color: '#8b5cf6', fontSize: '1.0625rem', lineHeight: '1.6' }}>无限制</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1.25rem 1rem', fontSize: '1.0625rem', color: '#1f2937', lineHeight: '1.6' }}>优先级</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', fontSize: '1.0625rem', lineHeight: '1.6' }}>标准</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', fontSize: '1.0625rem', lineHeight: '1.6' }}>优先</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', fontWeight: '600', color: '#8b5cf6', fontSize: '1.0625rem', lineHeight: '1.6' }}>最高</td>
                </tr>
                <tr>
                  <td style={{ padding: '1.25rem 1rem', fontSize: '1.0625rem', color: '#1f2937', lineHeight: '1.6' }}>技术支持</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', fontSize: '1.0625rem', lineHeight: '1.6' }}>社区</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', fontSize: '1.0625rem', lineHeight: '1.6' }}>邮件</td>
                  <td style={{ textAlign: 'center', padding: '1.25rem 1rem', fontWeight: '600', color: '#8b5cf6', fontSize: '1.0625rem', lineHeight: '1.6' }}>专属客服</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 说明 */}
        <div style={{
          marginTop: '4rem',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '1.0625rem',
          lineHeight: '1.8'
        }}>
          <p>* 演示环境：会员功能可直接升级测试，无需真实支付</p>
          <p style={{ marginTop: '0.75rem' }}>* 生产环境：需要接入真实的支付系统</p>
        </div>
      </div>
    </div>
  );
}
