import { useEffect, useState } from 'react';
import { Coins, Zap, TrendingUp } from 'lucide-react';
import { creditService } from '../services/credit';
import { UserBalance } from '../types/credit';

interface CreditBalanceProps {
  compact?: boolean;
  onRechargeClick?: () => void;
}

export function CreditBalance({ compact = false, onRechargeClick }: CreditBalanceProps) {
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
      console.error('获取余额失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
        <div style={{
          height: '120px',
          background: '#e5e7eb',
          borderRadius: '24px'
        }} />
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  // 紧凑模式 - 用于导航栏
  if (compact) {
    return (
      <button
        onClick={onRechargeClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1.25rem',
          background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
          transition: 'all 0.2s',
          fontSize: '1.0625rem',
          fontWeight: '600',
          lineHeight: '1.5'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.4)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <Coins size={20} />
        <span>{creditService.formatCoins(balance.coins)}</span>
      </button>
    );
  }

  // 完整模式
  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '24px',
      padding: '3rem',
      color: 'white',
      boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 装饰性背景 */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '300px',
        height: '300px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1
      }}>
        {/* 头部 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2.5rem'
        }}>
          <h3 style={{
            fontSize: '1.75rem',
            fontWeight: 'bold',
            lineHeight: '1.3',
            margin: 0
          }}>
            我的积分
          </h3>
          {onRechargeClick && (
            <button
              onClick={onRechargeClick}
              style={{
                padding: '0.875rem 1.75rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.0625rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s',
                lineHeight: '1.5'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              充值
            </button>
          )}
        </div>

        {/* 付费积分 */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.25rem'
          }}>
            <Coins size={28} style={{ opacity: 0.9 }} />
            <span style={{
              fontSize: '1.125rem',
              opacity: 0.9,
              fontWeight: '500',
              lineHeight: '1.6',
              letterSpacing: '0.02em'
            }}>
              付费积分
            </span>
          </div>
          <div style={{
            fontSize: '4rem',
            fontWeight: '900',
            lineHeight: '1',
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em'
          }}>
            {balance.coins.toLocaleString()}
          </div>
          <div style={{
            fontSize: '1.25rem',
            opacity: 0.85,
            lineHeight: '1.6'
          }}>
            ≈ ¥{(balance.coins / 1000).toFixed(2)}
          </div>
        </div>

        {/* 免费额度 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          padding: '2rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.25rem'
          }}>
            <Zap size={24} style={{ opacity: 0.95 }} />
            <span style={{
              fontSize: '1.0625rem',
              fontWeight: '500',
              lineHeight: '1.6'
            }}>
              今日免费额度
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                lineHeight: '1.2',
                marginBottom: '0.5rem'
              }}>
                {balance.remainingQuota.toLocaleString()}
              </div>
              <div style={{
                fontSize: '1rem',
                opacity: 0.85,
                lineHeight: '1.6'
              }}>
                剩余 / {balance.freeQuota.toLocaleString()} 总额度
              </div>
            </div>
            <div style={{
              textAlign: 'right',
              fontSize: '1rem',
              opacity: 0.85,
              lineHeight: '1.6'
            }}>
              {new Date(balance.quotaResetAt).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              重置
            </div>
          </div>

          {/* 进度条 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.25)',
            borderRadius: '10px',
            height: '12px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div
              style={{
                background: 'linear-gradient(90deg, #fff 0%, rgba(255, 255, 255, 0.9) 100%)',
                height: '100%',
                borderRadius: '10px',
                transition: 'width 0.5s ease',
                width: `${Math.min(100, (balance.remainingQuota / balance.freeQuota) * 100)}%`,
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
              }}
            />
          </div>
        </div>

        {/* 累计统计 */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <TrendingUp size={22} style={{ opacity: 0.9 }} />
            <span style={{
              fontSize: '1.0625rem',
              opacity: 0.85,
              lineHeight: '1.6'
            }}>
              累计消耗
            </span>
          </div>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            lineHeight: '1.5'
          }}>
            {balance.totalConsumed.toLocaleString()} coins
          </span>
        </div>
      </div>
    </div>
  );
}

// 简化的余额显示组件（用于小卡片）
export function CreditBalanceMini() {
  const [balance, setBalance] = useState<UserBalance | null>(null);

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const data = await creditService.getBalance();
        setBalance(data);
      } catch (error) {
        console.error('获取余额失败:', error);
      }
    };
    loadBalance();
  }, []);

  if (!balance) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '2rem'
    }}>
      <div>
        <div style={{
          fontSize: '1rem',
          color: '#6b7280',
          marginBottom: '0.25rem',
          lineHeight: '1.6'
        }}>
          付费积分
        </div>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#1f2937',
          lineHeight: '1.3'
        }}>
          {creditService.formatCoins(balance.coins)}
        </div>
      </div>
      <div>
        <div style={{
          fontSize: '1rem',
          color: '#6b7280',
          marginBottom: '0.25rem',
          lineHeight: '1.6'
        }}>
          今日剩余
        </div>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#3b82f6',
          lineHeight: '1.3'
        }}>
          {creditService.formatCoins(balance.remainingQuota)}
        </div>
      </div>
    </div>
  );
}
