import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../styles/intro-pages.css'

// 模拟AI工具数据
const toolData = {
  id: '1',
  name: 'ChatGPT-4',
  logo: '🤖',
  slogan: '最强大的自然语言处理AI，理解你的每一个需求',
  provider: 'OpenAI',
  category: 'AI对话',
  tags: ['文本生成', '代码助手', '多语言支持', '上下文理解'],
  pricing: {
    free: true,
    startingPrice: '$20',
    currency: 'USD'
  },

  features: [
    {
      icon: '💬',
      title: '自然对话',
      description: '强大的上下文理解能力，能够进行长时间、深入的对话交流'
    },
    {
      icon: '📝',
      title: '文本创作',
      description: '生成文章、邮件、报告等各类文本内容，质量接近人类水平'
    },
    {
      icon: '💻',
      title: '代码生成',
      description: '支持多种编程语言的代码生成、解释和调试'
    },
    {
      icon: '🌍',
      title: '多语言支持',
      description: '支持100+种语言的理解和翻译'
    },
    {
      icon: '🎯',
      title: '任务规划',
      description: '帮助分解复杂任务，制定执行计划'
    },
    {
      icon: '🔍',
      title: '数据分析',
      description: '分析数据、生成洞察和可视化建议'
    }
  ],

  techSpecs: [
    {
      name: '支持的模型',
      value: 'GPT-4, GPT-4 Turbo, GPT-4o'
    },
    {
      name: '最大上下文长度',
      value: '128K tokens'
    },
    {
      name: '响应速度',
      value: '平均 2-5 秒'
    },
    {
      name: '准确率',
      value: '98.5%'
    },
    {
      name: '支持的输入',
      value: '文本、图片、文档'
    },
    {
      name: '支持的输出',
      value: '文本、代码、JSON'
    }
  ],

  useCases: [
    {
      title: '内容创作',
      before: '需要写一篇产品介绍文章',
      after: '几分钟生成专业、引人入胜的产品文案',
      improvement: '效率提升 10x'
    },
    {
      title: '代码开发',
      before: '从零开始编写复杂功能',
      after: '快速生成代码框架，显著减少开发时间',
      improvement: '节省 60% 时间'
    },
    {
      title: '客户服务',
      before: '人工回复大量客户咨询',
      after: '智能回答常见问题，提供24/7服务',
      improvement: '成本降低 80%'
    }
  ],

  pricingPlans: [
    {
      name: '免费版',
      price: '$0',
      period: '永久免费',
      features: [
        'GPT-3.5 模型',
        '每天 10 次对话',
        '基础功能',
        '社区支持'
      ],
      limitations: [
        '有速率限制',
        '不支持高级功能'
      ],
      cta: '开始使用'
    },
    {
      name: '专业版',
      price: '$20',
      period: '/月',
      popular: true,
      features: [
        'GPT-4 完整访问',
        '无限次对话',
        '所有高级功能',
        '优先响应',
        'API 访问',
        '数据分析工具'
      ],
      limitations: [],
      cta: '立即订阅'
    },
    {
      name: '企业版',
      price: '定制',
      period: '联系销售',
      features: [
        '所有专业版功能',
        '专属模型微调',
        '团队协作功能',
        '专属客户经理',
        'SLA 保障',
        '私有部署选项'
      ],
      limitations: [],
      cta: '联系销售'
    }
  ]
}

const toolReviews = [
  {
    id: 1,
    user: {
      name: '程序员小李',
      avatar: '👨‍💻',
      role: '全栈开发工程师'
    },
    rating: 5,
    content: 'ChatGPT-4 彻底改变了我的工作方式！代码生成功能特别强大，能够理解复杂的需求并生成高质量代码。特别适合快速原型开发。',
    usageTime: '使用 6 个月',
    likes: 234
  },
  {
    id: 2,
    user: {
      name: '营销总监王女士',
      avatar: '👩‍💼',
      role: '市场营销'
    },
    rating: 5,
    content: '在内容创作方面表现优秀！帮助团队提升了内容产出效率，生成的文案质量很高，稍加修改就能使用。',
    usageTime: '使用 3 个月',
    likes: 156
  },
  {
    id: 3,
    user: {
      name: '创业者张三',
      avatar: '🧑‍💼',
      role: 'CEO'
    },
    rating: 4,
    content: '功能强大，但价格对小团队来说有点贵。希望能推出更适合初创公司的定价方案。',
    usageTime: '使用 2 个月',
    likes: 89
  }
]

const usageStats = {
  totalUsers: '100M+',
  dailyRequests: '10B+',
  satisfaction: '96%',
  uptime: '99.9%'
}

export default function AIToolIntroPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'pricing' | 'docs' | 'reviews'>('overview')
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)

  const handleTryTool = () => {
    alert('开始免费试用！')
  }

  const handleSubscribe = (planIndex: number) => {
    setSelectedPlan(planIndex)
    alert(`准备订阅 ${toolData.pricingPlans[planIndex].name}`)
  }

  return (
    <div className="intro-page tool-intro">
      {/* 顶部导航 */}
      <div className="intro-nav">
        <button onClick={() => navigate(-1)} className="back-button">
          ← 返回探索页
        </button>
      </div>

      {/* 头部展示 */}
      <header className="tool-header">
        <div className="tool-header-content">
          <div className="tool-logo-section">
            <div className="tool-logo-large">{toolData.logo}</div>
            <div className="tool-provider-badge">{toolData.provider}</div>
          </div>

          <div className="tool-info-section">
            <div className="tool-category-badge">{toolData.category}</div>
            <h1 className="tool-name">{toolData.name}</h1>
            <p className="tool-slogan">{toolData.slogan}</p>

            <div className="tool-tags">
              {toolData.tags.map((tag, index) => (
                <span key={index} className="tag tag-tool">{tag}</span>
              ))}
            </div>

            <div className="tool-quick-stats">
              <div className="quick-stat">
                <span className="quick-stat-value">{usageStats.totalUsers}</span>
                <span className="quick-stat-label">用户</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">{usageStats.satisfaction}</span>
                <span className="quick-stat-label">满意度</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">{usageStats.uptime}</span>
                <span className="quick-stat-label">可用性</span>
              </div>
            </div>

            {/* 价格标签 */}
            <div className="tool-pricing-badge">
              {toolData.pricing.free && <span className="free-badge">免费试用</span>}
              <span className="price-badge">起价 {toolData.pricing.startingPrice}</span>
            </div>
          </div>

          {/* CTA 按钮 */}
          <div className="tool-cta-section">
            <button onClick={handleTryTool} className="btn btn-primary btn-large">
              🚀 免费试用
            </button>
            <button onClick={() => setActiveTab('pricing')} className="btn btn-secondary btn-large">
              💳 查看定价
            </button>
            <button className="btn btn-ghost">
              📖 查看文档
            </button>
          </div>
        </div>
      </header>

      {/* Tab 导航 */}
      <div className="intro-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          功能概览
        </button>
        <button
          className={`tab-button ${activeTab === 'pricing' ? 'active' : ''}`}
          onClick={() => setActiveTab('pricing')}
        >
          定价方案
        </button>
        <button
          className={`tab-button ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          技术文档
        </button>
        <button
          className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          用户评价
        </button>
      </div>

      {/* 主要内容 */}
      <div className="intro-content">
        {activeTab === 'overview' && (
          <>
            {/* 功能特性 */}
            <section className="content-section">
              <h2 className="section-title">⚡ 核心功能</h2>
              <div className="features-grid">
                {toolData.features.map((feature, index) => (
                  <div key={index} className="feature-card">
                    <div className="feature-icon">{feature.icon}</div>
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-description">{feature.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 技术参数 */}
            <section className="content-section">
              <h2 className="section-title">📊 技术规格</h2>
              <div className="tech-specs-grid">
                {toolData.techSpecs.map((spec, index) => (
                  <div key={index} className="tech-spec-item">
                    <span className="tech-spec-name">{spec.name}</span>
                    <span className="tech-spec-value">{spec.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 使用案例 */}
            <section className="content-section">
              <h2 className="section-title">🎯 实际应用案例</h2>
              <div className="use-cases-comparison">
                {toolData.useCases.map((useCase, index) => (
                  <div key={index} className="comparison-card">
                    <h3 className="comparison-title">{useCase.title}</h3>
                    <div className="comparison-before">
                      <div className="comparison-label">使用前</div>
                      <p>{useCase.before}</p>
                    </div>
                    <div className="comparison-arrow">→</div>
                    <div className="comparison-after">
                      <div className="comparison-label">使用后</div>
                      <p>{useCase.after}</p>
                    </div>
                    <div className="comparison-improvement">
                      <span className="improvement-badge">{useCase.improvement}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 数据统计 */}
            <section className="content-section">
              <h2 className="section-title">📈 平台数据</h2>
              <div className="stats-showcase">
                <div className="stat-showcase-item">
                  <div className="stat-showcase-value">{usageStats.totalUsers}</div>
                  <div className="stat-showcase-label">全球用户</div>
                </div>
                <div className="stat-showcase-item">
                  <div className="stat-showcase-value">{usageStats.dailyRequests}</div>
                  <div className="stat-showcase-label">日均请求</div>
                </div>
                <div className="stat-showcase-item">
                  <div className="stat-showcase-value">{usageStats.satisfaction}</div>
                  <div className="stat-showcase-label">用户满意度</div>
                </div>
                <div className="stat-showcase-item">
                  <div className="stat-showcase-value">{usageStats.uptime}</div>
                  <div className="stat-showcase-label">服务可用性</div>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'pricing' && (
          <section className="content-section">
            <h2 className="section-title">💰 定价方案</h2>
            <p className="section-subtitle">选择最适合你的方案，随时可以升级或降级</p>

            <div className="pricing-grid">
              {toolData.pricingPlans.map((plan, index) => (
                <div
                  key={index}
                  className={`pricing-card ${plan.popular ? 'popular' : ''} ${selectedPlan === index ? 'selected' : ''}`}
                >
                  {plan.popular && <div className="popular-badge">最受欢迎</div>}

                  <div className="pricing-header">
                    <h3 className="pricing-name">{plan.name}</h3>
                    <div className="pricing-price">
                      <span className="price-amount">{plan.price}</span>
                      <span className="price-period">{plan.period}</span>
                    </div>
                  </div>

                  <div className="pricing-features">
                    <div className="features-list">
                      {plan.features.map((feature, fIndex) => (
                        <div key={fIndex} className="feature-item">
                          <span className="feature-check">✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {plan.limitations.length > 0 && (
                      <div className="limitations-list">
                        {plan.limitations.map((limitation, lIndex) => (
                          <div key={lIndex} className="limitation-item">
                            <span className="limitation-mark">✗</span>
                            <span>{limitation}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleSubscribe(index)}
                    className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'} btn-full`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>

            {/* 价格计算器 */}
            <div className="pricing-calculator">
              <h3 className="calculator-title">💵 成本估算器</h3>
              <p className="calculator-description">根据你的使用量估算成本</p>
              <div className="calculator-inputs">
                <div className="calculator-input-group">
                  <label>预计每月请求数</label>
                  <input type="number" placeholder="例如: 10000" className="calculator-input" />
                </div>
                <div className="calculator-input-group">
                  <label>团队人数</label>
                  <input type="number" placeholder="例如: 5" className="calculator-input" />
                </div>
                <button className="btn btn-primary">计算成本</button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'docs' && (
          <section className="content-section">
            <h2 className="section-title">📚 技术文档</h2>

            <div className="docs-section">
              <div className="docs-card">
                <div className="docs-icon">🚀</div>
                <h3 className="docs-title">快速开始</h3>
                <p className="docs-description">5分钟快速集成指南</p>
                <a href="#" className="docs-link">查看文档 →</a>
              </div>

              <div className="docs-card">
                <div className="docs-icon">📖</div>
                <h3 className="docs-title">API 参考</h3>
                <p className="docs-description">完整的 API 接口文档</p>
                <a href="#" className="docs-link">查看文档 →</a>
              </div>

              <div className="docs-card">
                <div className="docs-icon">💡</div>
                <h3 className="docs-title">示例代码</h3>
                <p className="docs-description">多种语言的集成示例</p>
                <a href="#" className="docs-link">查看示例 →</a>
              </div>

              <div className="docs-card">
                <div className="docs-icon">🔧</div>
                <h3 className="docs-title">SDK 下载</h3>
                <p className="docs-description">Python、JavaScript、Java等</p>
                <a href="#" className="docs-link">下载 SDK →</a>
              </div>
            </div>

            {/* API 示例 */}
            <div className="api-example">
              <h3 className="api-example-title">快速示例</h3>
              <div className="code-block">
                <pre><code>{`import openai

openai.api_key = "your-api-key"

response = openai.ChatCompletion.create(
  model="gpt-4",
  messages=[
    {"role": "user", "content": "Hello!"}
  ]
)

print(response.choices[0].message.content)`}</code></pre>
              </div>
            </div>

            {/* 开发者资源 */}
            <div className="developer-resources">
              <h3 className="resources-title">开发者资源</h3>
              <div className="resources-grid">
                <a href="#" className="resource-link">
                  <span className="resource-icon">📘</span>
                  <span>开发者社区</span>
                </a>
                <a href="#" className="resource-link">
                  <span className="resource-icon">🎓</span>
                  <span>教程和课程</span>
                </a>
                <a href="#" className="resource-link">
                  <span className="resource-icon">💬</span>
                  <span>Discord 频道</span>
                </a>
                <a href="#" className="resource-link">
                  <span className="resource-icon">🐛</span>
                  <span>问题反馈</span>
                </a>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'reviews' && (
          <section className="content-section">
            <h2 className="section-title">⭐ 用户评价</h2>

            <div className="reviews-summary">
              <div className="reviews-score">
                <div className="score-number">4.8</div>
                <div className="score-stars">★★★★★</div>
                <div className="score-count">基于 {toolReviews.length}k+ 条评价</div>
              </div>
            </div>

            <div className="reviews-list">
              {toolReviews.map((review) => (
                <div key={review.id} className="review-card tool-review-card">
                  <div className="review-header">
                    <div className="review-user">
                      <div className="review-avatar">{review.user.avatar}</div>
                      <div>
                        <div className="review-user-name">{review.user.name}</div>
                        <div className="review-user-role">{review.user.role}</div>
                      </div>
                    </div>
                    <div className="review-meta">
                      <div className="review-stars">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                      <div className="review-usage-time">{review.usageTime}</div>
                    </div>
                  </div>
                  <p className="review-content">{review.content}</p>
                  <div className="review-actions">
                    <button className="review-action-button">
                      👍 有帮助 ({review.likes})
                    </button>
                    <button className="review-action-button">💬 回复</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="load-more-section">
              <button className="btn btn-secondary">加载更多评价</button>
            </div>
          </section>
        )}
      </div>

      {/* 底部 CTA */}
      <section className="bottom-cta">
        <div className="cta-content">
          <h2 className="cta-title">准备好体验 {toolData.name} 了吗？</h2>
          <p className="cta-description">立即开始免费试用，无需信用卡</p>
          <div className="cta-buttons">
            <button onClick={handleTryTool} className="btn btn-primary btn-large">
              🚀 开始免费试用
            </button>
            <button className="btn btn-secondary btn-large">
              📞 联系销售
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
