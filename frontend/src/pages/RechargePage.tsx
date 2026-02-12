import { useState, useEffect } from 'react';
import { Check, Gift, Coins, CreditCard, Smartphone, X, Sparkles } from 'lucide-react';
import { creditService } from '../services/credit';
import { RechargePlan } from '../types/credit';
import { CreditBalance } from '../components/CreditBalance';
import { useToast } from '../components/ui/Toast';

export function RechargePage() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await creditService.getRechargePlans();
      setPlans(data);
    } catch (error) {
      console.error('获取充值套餐失败:', error);
    }
  };

  const handleRecharge = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      const order = await creditService.createRechargeOrder(
        selectedPlan.amount,
        paymentMethod
      );

      console.log('订单创建成功:', order);
      setShowPaymentModal(true);

      // 这里在实际项目中应该跳转到支付页面或显示支付二维码
      // 目前只是模拟
    } catch (error: any) {
      showToast(error.response?.data?.message || '创建订单失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #faf5ff 0%, #ffffff 100%)',
      padding: '3rem 2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 顶部标题 */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            lineHeight: '1.2'
          }}>
            <Sparkles size={48} style={{ color: '#8b5cf6' }} />
            充值中心
          </h1>
          <p style={{
            fontSize: '1.375rem',
            color: '#6b7280',
            lineHeight: '1.7'
          }}>
            选择适合你的充值套餐，畅享 AI 服务
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2.5rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '2.5rem'
          }}>
            {/* 左侧区域：充值套餐 + 支付方式 */}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '3rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
              }}>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  marginBottom: '2.5rem',
                  color: '#1f2937',
                  lineHeight: '1.3'
                }}>
                  选择充值套餐
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '2rem'
                }}>
                  {plans.map((plan) => {
                    const isSelected = selectedPlan?.amount === plan.amount;
                    const totalCoins = creditService.calculateTotalCoins(plan);
                    const hasBonus = plan.bonus > 0;

                    return (
                      <button
                        key={plan.amount}
                        onClick={() => setSelectedPlan(plan)}
                        style={{
                          position: 'relative',
                          padding: '2.5rem',
                          borderRadius: '20px',
                          border: isSelected ? '3px solid #8b5cf6' : '3px solid #e5e7eb',
                          background: isSelected
                            ? 'linear-gradient(135deg, #f3f0ff 0%, #faf5ff 100%)'
                            : 'white',
                          transition: 'all 0.3s',
                          textAlign: 'left',
                          cursor: 'pointer',
                          boxShadow: isSelected
                            ? '0 20px 60px rgba(139, 92, 246, 0.25)'
                            : '0 4px 20px rgba(0,0,0,0.05)',
                          transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#8b5cf6';
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(139, 92, 246, 0.15)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
                          }
                        }}
                      >
                        {/* 优惠标签 */}
                        {hasBonus && (
                          <div style={{
                            position: 'absolute',
                            top: '-16px',
                            right: '-16px',
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            color: 'white',
                            padding: '0.75rem 1.25rem',
                            borderRadius: '20px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            boxShadow: '0 8px 24px rgba(240, 147, 251, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            lineHeight: '1'
                          }}>
                            <Gift size={18} />
                            送 {plan.bonus.toLocaleString()}
                          </div>
                        )}

                        {/* 选中标记 */}
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '1.5rem',
                            right: '1.5rem',
                            width: '36px',
                            height: '36px',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                          }}>
                            <Check size={22} style={{ color: 'white', strokeWidth: 3 }} />
                          </div>
                        )}

                        {/* 金额 */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <div style={{
                            fontSize: '4rem',
                            fontWeight: '900',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            lineHeight: '1',
                            marginBottom: '0.75rem'
                          }}>
                            ¥{plan.amount}
                          </div>
                          <div style={{
                            fontSize: '1.0625rem',
                            color: '#6b7280',
                            lineHeight: '1.6'
                          }}>
                            人民币
                          </div>
                        </div>

                        {/* 获得积分 */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          marginBottom: '1rem',
                          padding: '1rem',
                          background: '#fef3c7',
                          borderRadius: '12px'
                        }}>
                          <Coins size={24} style={{ color: '#f59e0b' }} />
                          <span style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: '#92400e',
                            lineHeight: '1.5'
                          }}>
                            {plan.coins.toLocaleString()} 积分
                          </span>
                        </div>

                        {/* 赠送积分 */}
                        {hasBonus && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            background: '#fee2e2',
                            borderRadius: '12px'
                          }}>
                            <Gift size={24} style={{ color: '#ef4444' }} />
                            <span style={{
                              fontSize: '1.125rem',
                              fontWeight: '600',
                              color: '#991b1b',
                              lineHeight: '1.5'
                            }}>
                              额外赠送 {plan.bonus.toLocaleString()} 积分
                            </span>
                          </div>
                        )}

                        {/* 总计 */}
                        <div style={{
                          marginTop: '1.5rem',
                          paddingTop: '1.5rem',
                          borderTop: '2px solid #e5e7eb'
                        }}>
                          <div style={{
                            fontSize: '1rem',
                            color: '#6b7280',
                            marginBottom: '0.5rem',
                            lineHeight: '1.6'
                          }}>
                            实际获得
                          </div>
                          <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: '#8b5cf6',
                            lineHeight: '1.2'
                          }}>
                            {totalCoins.toLocaleString()} 积分
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 支付方式 */}
                {selectedPlan && (
                  <div style={{
                    marginTop: '3rem',
                    paddingTop: '3rem',
                    borderTop: '2px solid #e5e7eb'
                  }}>
                    <h3 style={{
                      fontSize: '1.75rem',
                      fontWeight: 'bold',
                      marginBottom: '2rem',
                      color: '#1f2937',
                      lineHeight: '1.3'
                    }}>
                      选择支付方式
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: '1.5rem'
                    }}>
                      <button
                        onClick={() => setPaymentMethod('wechat')}
                        style={{
                          padding: '2rem',
                          borderRadius: '16px',
                          border: paymentMethod === 'wechat' ? '3px solid #10b981' : '3px solid #e5e7eb',
                          background: paymentMethod === 'wechat' ? '#ecfdf5' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          boxShadow: paymentMethod === 'wechat'
                            ? '0 10px 30px rgba(16, 185, 129, 0.2)'
                            : '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={(e) => {
                          if (paymentMethod !== 'wechat') {
                            e.currentTarget.style.borderColor = '#10b981';
                            e.currentTarget.style.background = '#f0fdf4';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (paymentMethod !== 'wechat') {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.background = 'white';
                          }
                        }}
                      >
                        <Smartphone size={32} style={{ color: '#10b981' }} />
                        <span style={{
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          lineHeight: '1.5'
                        }}>
                          微信支付
                        </span>
                      </button>

                      <button
                        onClick={() => setPaymentMethod('alipay')}
                        style={{
                          padding: '2rem',
                          borderRadius: '16px',
                          border: paymentMethod === 'alipay' ? '3px solid #3b82f6' : '3px solid #e5e7eb',
                          background: paymentMethod === 'alipay' ? '#eff6ff' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          boxShadow: paymentMethod === 'alipay'
                            ? '0 10px 30px rgba(59, 130, 246, 0.2)'
                            : '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={(e) => {
                          if (paymentMethod !== 'alipay') {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.background = '#eff6ff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (paymentMethod !== 'alipay') {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.background = 'white';
                          }
                        }}
                      >
                        <CreditCard size={32} style={{ color: '#3b82f6' }} />
                        <span style={{
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          lineHeight: '1.5'
                        }}>
                          支付宝
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 确认按钮 */}
                {selectedPlan && (
                  <button
                    onClick={handleRecharge}
                    disabled={loading}
                    style={{
                      width: '100%',
                      marginTop: '2.5rem',
                      padding: '1.5rem',
                      background: loading
                        ? '#9ca3af'
                        : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '16px',
                      fontSize: '1.375rem',
                      fontWeight: 'bold',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: loading
                        ? 'none'
                        : '0 10px 30px rgba(139, 92, 246, 0.4)',
                      transition: 'all 0.3s',
                      lineHeight: '1.5'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 15px 40px rgba(139, 92, 246, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(139, 92, 246, 0.4)';
                      }
                    }}
                  >
                    {loading ? '处理中...' : `立即支付 ¥${selectedPlan.amount}`}
                  </button>
                )}
              </div>
            </div>

            {/* 右侧：当前余额 + 充值说明 */}
            <div>
              <CreditBalance onRechargeClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

              {/* 充值说明 */}
              <div style={{
                marginTop: '2.5rem',
                background: 'white',
                borderRadius: '24px',
                padding: '3rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
              }}>
                <h3 style={{
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  marginBottom: '2rem',
                  color: '#1f2937',
                  lineHeight: '1.3'
                }}>
                  充值说明
                </h3>
                <ul style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {[
                    '1000 积分 = ¥1 人民币',
                    '充值金额越大，赠送越多',
                    '积分永久有效，不会过期',
                    '优先使用每日免费额度',
                    '会员享受折扣优惠'
                  ].map((text, index) => (
                    <li key={index} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem'
                    }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        minWidth: '28px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '0.125rem'
                      }}>
                        <Check size={18} style={{ color: 'white', strokeWidth: 3 }} />
                      </div>
                      <span style={{
                        fontSize: '1.0625rem',
                        color: '#4b5563',
                        lineHeight: '1.7',
                        flex: 1
                      }}>
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 支付模态框（模拟） */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '3rem',
            maxWidth: '480px',
            width: '100%',
            margin: '2rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2.5rem'
            }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#1f2937',
                lineHeight: '1.3'
              }}>
                扫码支付
              </h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  color: '#9ca3af',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.background = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9ca3af';
                  e.currentTarget.style.background = 'none';
                }}
              >
                <X size={28} />
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '280px',
                height: '280px',
                margin: '0 auto 2rem',
                background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #d1d5db'
              }}>
                <div style={{ color: '#9ca3af', textAlign: 'center' }}>
                  <p style={{
                    fontSize: '1.125rem',
                    marginBottom: '0.75rem',
                    lineHeight: '1.6'
                  }}>
                    这里显示支付二维码
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    lineHeight: '1.6'
                  }}>
                    （演示环境）
                  </p>
                </div>
              </div>

              <p style={{
                fontSize: '1.25rem',
                color: '#6b7280',
                marginBottom: '1.5rem',
                lineHeight: '1.7'
              }}>
                使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫码支付
              </p>

              <p style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: '#8b5cf6',
                marginBottom: '2rem',
                lineHeight: '1'
              }}>
                ¥{selectedPlan?.amount}
              </p>

              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  showToast('支付功能需要对接真实支付平台。在测试环境中，你可以在后端直接调用确认接口来模拟支付成功。', 'info');
                }}
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  background: '#f3f4f6',
                  color: '#4b5563',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  lineHeight: '1.5'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
