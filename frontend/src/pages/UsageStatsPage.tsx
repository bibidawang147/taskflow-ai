import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Zap, MessageSquare, ArrowRight } from 'lucide-react';
import { creditService } from '../services/credit';
import { UsageStats } from '../types/credit';

export function UsageStatsPage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, [days]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await creditService.getUsageStats(days);
      setStats(data);
    } catch (error) {
      console.error('获取使用统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #faf5ff 0%, #ffffff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>加载中...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #faf5ff 0%, #ffffff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'white',
          padding: '3rem',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <BarChart3 size={64} style={{ color: '#d1d5db', margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            暂无使用数据
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            开始使用 AI 对话后，这里会显示你的使用统计
          </p>
          <button
            onClick={() => navigate('/ai-chat')}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '0.875rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            开始对话
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #faf5ff 0%, #ffffff 100%)',
      padding: '3rem 2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 标题和筛选 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '3rem',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <BarChart3 size={40} style={{ color: '#8b5cf6' }} />
              使用统计
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#6b7280', lineHeight: '1.8' }}>
              查看最近 {days} 天的使用情况
            </p>
          </div>

          {/* 时间选择 */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  padding: '0.875rem 1.75rem',
                  borderRadius: '12px',
                  border: days === d ? '2px solid #8b5cf6' : '2px solid #e5e7eb',
                  background: days === d ? '#f3f0ff' : 'white',
                  color: days === d ? '#8b5cf6' : '#6b7280',
                  fontSize: '1.0625rem',
                  fontWeight: days === d ? '600' : '500',
                  minHeight: '48px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (days !== d) {
                    e.currentTarget.style.borderColor = '#8b5cf6';
                    e.currentTarget.style.background = '#faf5ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (days !== d) {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                {d} 天
              </button>
            ))}
          </div>
        </div>

        {/* 核心统计卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {/* 总消耗 */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '24px',
            padding: '3rem',
            color: 'white',
            boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3)'
          }}>
            <div style={{ fontSize: '1.125rem', opacity: 0.9, marginBottom: '1.25rem', fontWeight: '600', letterSpacing: '0.02em' }}>
              总消耗积分
            </div>
            <div style={{ fontSize: '4rem', fontWeight: '900', marginBottom: '0.75rem', lineHeight: '1', letterSpacing: '-0.02em' }}>
              {creditService.formatCoins(stats.totalCost)}
            </div>
            <div style={{ fontSize: '1.25rem', opacity: 0.85, lineHeight: '1.6' }}>
              约 ¥{(stats.totalCost / 1000).toFixed(2)}
            </div>
          </div>

          {/* 总请求 */}
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '24px',
            padding: '3rem',
            color: 'white',
            boxShadow: '0 20px 60px rgba(240, 147, 251, 0.3)'
          }}>
            <div style={{ fontSize: '1.125rem', opacity: 0.9, marginBottom: '1.25rem', fontWeight: '600', letterSpacing: '0.02em' }}>
              总请求次数
            </div>
            <div style={{ fontSize: '4rem', fontWeight: '900', marginBottom: '0.75rem', lineHeight: '1', letterSpacing: '-0.02em' }}>
              {stats.requestCount}
            </div>
            <div style={{ fontSize: '1.25rem', opacity: 0.85, lineHeight: '1.6' }}>
              次对话请求
            </div>
          </div>

          {/* Token 使用 */}
          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '24px',
            padding: '3rem',
            color: 'white',
            boxShadow: '0 20px 60px rgba(79, 172, 254, 0.3)'
          }}>
            <div style={{ fontSize: '1.125rem', opacity: 0.9, marginBottom: '1.25rem', fontWeight: '600', letterSpacing: '0.02em' }}>
              Token 使用量
            </div>
            <div style={{ fontSize: '4rem', fontWeight: '900', marginBottom: '0.75rem', lineHeight: '1', letterSpacing: '-0.02em' }}>
              {(stats.totalTokens / 1000).toFixed(1)}K
            </div>
            <div style={{ fontSize: '1.25rem', opacity: 0.85, lineHeight: '1.6' }}>
              总计 {stats.totalTokens.toLocaleString()} tokens
            </div>
          </div>
        </div>

        {/* 按模型统计 */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '3rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            lineHeight: '1.3'
          }}>
            <Zap size={32} style={{ color: '#8b5cf6' }} />
            模型使用详情
          </h2>

          {stats.byModel.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#9ca3af'
            }}>
              <MessageSquare size={56} style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.25rem', lineHeight: '1.7' }}>暂无模型使用记录</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {stats.byModel.map((model, index) => {
                const percentage = (model.cost / stats.totalCost) * 100;
                return (
                  <div key={index} style={{
                    background: '#faf5ff',
                    borderRadius: '20px',
                    padding: '2.25rem',
                    border: '1px solid #f3f0ff'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.5rem',
                      flexWrap: 'wrap',
                      gap: '1.5rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          color: '#1f2937',
                          marginBottom: '0.5rem',
                          lineHeight: '1.4'
                        }}>
                          {model.model}
                        </div>
                        <div style={{ fontSize: '1rem', color: '#6b7280', lineHeight: '1.6' }}>
                          {model.provider}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '1.75rem',
                          fontWeight: 'bold',
                          color: '#8b5cf6',
                          marginBottom: '0.5rem',
                          lineHeight: '1.2'
                        }}>
                          {creditService.formatCoins(model.cost)}
                        </div>
                        <div style={{ fontSize: '1rem', color: '#6b7280', lineHeight: '1.6' }}>
                          {model.count} 次请求
                        </div>
                      </div>
                    </div>

                    {/* 进度条 */}
                    <div style={{
                      width: '100%',
                      height: '14px',
                      background: '#e5e7eb',
                      borderRadius: '7px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
                        borderRadius: '7px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>

                    <div style={{
                      marginTop: '1rem',
                      fontSize: '1rem',
                      color: '#6b7280',
                      lineHeight: '1.6'
                    }}>
                      占总消耗的 {percentage.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
