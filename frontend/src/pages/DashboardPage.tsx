import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  TrendingUp,
  Star,
  Wallet,
  Zap,
  ArrowRight,
  Sparkles,
  BarChart3,
  Crown
} from 'lucide-react';
import { creditService } from '../services/credit';
import { UserBalance } from '../types/credit';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const data = await creditService.getBalance();
      setBalance(data);
    } catch (error) {
      console.error('加载余额失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 功能卡片数据
  const features = [
    {
      icon: MessageSquare,
      title: 'AI 对话',
      description: '与14个主流AI模型对话，解决各种问题',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      path: '/',
      stats: '14 个模型'
    },
    {
      icon: TrendingUp,
      title: '使用统计',
      description: '查看详细的使用记录和消耗分析',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      path: '/usage-stats',
      stats: '实时统计'
    },
    {
      icon: Crown,
      title: '会员中心',
      description: '升级会员，享受更多特权和折扣',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      path: '/membership',
      stats: balance?.tier === 'pro' ? '专业版' : balance?.tier === 'enterprise' ? '企业版' : '免费版'
    },
    {
      icon: Wallet,
      title: '充值中心',
      description: '购买积分，畅享AI服务',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      path: '/recharge',
      stats: '多种套餐'
    }
  ];

  // 快速操作
  const quickActions = [
    {
      icon: Sparkles,
      label: '开始对话',
      action: () => navigate('/'),
      color: '#8b5cf6'
    },
    {
      icon: BarChart3,
      label: '查看统计',
      action: () => navigate('/usage-stats'),
      color: '#10b981'
    },
    {
      icon: Star,
      label: '升级会员',
      action: () => navigate('/membership'),
      color: '#f59e0b'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #faf5ff 0%, #ffffff 100%)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
        {/* 欢迎横幅 */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          borderRadius: '24px',
          padding: '3rem',
          color: 'white',
          marginBottom: '3rem',
          boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* 装饰性背景 */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(30%, -30%)'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <h1 style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <Sparkles size={36} />
                  欢迎回来！
                </h1>
                <p style={{
                  fontSize: '1.125rem',
                  opacity: 0.9,
                  marginBottom: '2rem'
                }}>
                  开始你的 AI 之旅，探索无限可能
                </p>

                {/* 快速操作按钮 */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={action.action}
                        style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '12px',
                          padding: '0.75rem 1.5rem',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s',
                          backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <Icon size={16} />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 余额信息卡片 */}
              {!loading && balance && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  minWidth: '280px',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.25rem' }}>
                      积分余额
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                      {creditService.formatCoins(balance.coins)}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                    fontSize: '0.875rem'
                  }}>
                    <div>
                      <div style={{ opacity: 0.8 }}>今日免费</div>
                      <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>
                        {creditService.formatCoins(balance.remainingQuota)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ opacity: 0.8 }}>会员等级</div>
                      <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>
                        {creditService.getTierInfo(balance.tier).name}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 功能卡片网格 */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Zap size={24} style={{ color: '#8b5cf6' }} />
            核心功能
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  onClick={() => navigate(feature.path)}
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '2rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    border: '1px solid #e5e7eb',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = `0 20px 60px ${feature.color}33`;
                    e.currentTarget.style.borderColor = feature.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  {/* 图标背景渐变 */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    background: feature.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    boxShadow: `0 10px 30px ${feature.color}33`
                  }}>
                    <Icon size={28} color="white" />
                  </div>

                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    marginBottom: '0.5rem'
                  }}>
                    {feature.title}
                  </h3>

                  <p style={{
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                    lineHeight: '1.6'
                  }}>
                    {feature.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: '1px solid #f3f4f6'
                  }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: feature.color,
                      background: `${feature.color}15`,
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px'
                    }}>
                      {feature.stats}
                    </span>

                    <ArrowRight size={20} style={{ color: feature.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部提示 */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
              🎉 新用户福利
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              注册即送 50,000 积分，每日免费额度自动刷新
            </p>
          </div>

          <button
            onClick={() => navigate('/membership')}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '0.75rem 2rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
            }}
          >
            <Crown size={16} />
            升级会员
          </button>
        </div>
      </div>
    </div>
  );
}
