import { useNavigate, useParams } from 'react-router-dom'

interface WorkflowType {
  id: string
  name: string
  description: string
  category: string
  count: number
  icon: string
  color: string
  tags: string[]
}

const categoryData: Record<string, { title: string; description: string; icon: string; color: string }> = {
  'content-creation': {
    title: '内容创作',
    description: '智能内容生成、写作辅助、创意设计等工作流',
    icon: '✍️',
    color: '#8b5cf6'
  },
  'ecommerce': {
    title: '电商工作流',
    description: '商品管理、客服自动化、营销推广等电商相关工作流',
    icon: '🛒',
    color: '#10b981'
  },
  'personal-assistant': {
    title: '个人助手',
    description: '日程管理、邮件处理、智能提醒等个人效率工具',
    icon: '🤖',
    color: '#3b82f6'
  }
}

const workflowTypesByCategory: Record<string, WorkflowType[]> = {
  'content-creation': [
    {
      id: 'wechat-article',
      name: '公众号文章撰写',
      description: '根据主题自动生成公众号爆款文章，支持历史、新闻、科技、情感、职场、美食等多种类型',
      category: '内容创作',
      count: 6,
      icon: '📱',
      color: '#10b981',
      tags: ['公众号', '文章生成', '多类型']
    },
    {
      id: 'video-script',
      name: '视频脚本撰写',
      description: '为短视频和长视频生成结构化脚本，支持抖音、B站、科普、Vlog、评测、剧情等多种形式',
      category: '内容创作',
      count: 6,
      icon: '🎬',
      color: '#ef4444',
      tags: ['视频脚本', '分镜', '多平台']
    },
    {
      id: 'ai-humanize',
      name: 'AI去痕迹优化',
      description: '对AI生成的内容进行人性化改写，支持学术论文、营销文案、新闻稿、故事、技术文档等',
      category: '内容创作',
      count: 6,
      icon: '✨',
      color: '#8b5cf6',
      tags: ['去AI化', '人性化', '多场景']
    },
    {
      id: 'xiaohongshu',
      name: '小红书种草文案',
      description: '生成符合小红书风格的种草笔记，包含标题、正文、话题标签、表情符号等',
      category: '内容创作',
      count: 4,
      icon: '📕',
      color: '#ff2442',
      tags: ['小红书', '种草', '营销文案']
    },
    {
      id: 'zhihu-answer',
      name: '知乎高赞回答生成',
      description: '分析问题并生成专业、有深度的知乎风格回答，包含结构优化和引用建议',
      category: '内容创作',
      count: 5,
      icon: '💡',
      color: '#0066ff',
      tags: ['知乎', '问答', '专业内容']
    },
    {
      id: 'viral-copywriting',
      name: '爆款文案生成器',
      description: '基于热点话题和用户痛点，生成高转化率的营销文案和广告语',
      category: '内容创作',
      count: 4,
      icon: '🔥',
      color: '#f59e0b',
      tags: ['爆款文案', '营销', '转化']
    },
    {
      id: 'multi-platform',
      name: '多平台内容改写',
      description: '将一篇内容改写成适合不同平台风格的版本（公众号、抖音、小红书、知乎等）',
      category: '内容创作',
      count: 5,
      icon: '🔄',
      color: '#06b6d4',
      tags: ['多平台', '改写', '风格适配']
    },
    {
      id: 'content-expansion',
      name: '文章续写与扩展',
      description: '根据现有内容进行合理续写和扩展，保持风格一致，内容连贯',
      category: '内容创作',
      count: 3,
      icon: '📝',
      color: '#3b82f6',
      tags: ['续写', '扩写', 'AI辅助']
    }
  ],
  'ecommerce': [
    {
      id: 'customer-service',
      name: '智能客服机器人',
      description: '24小时自动回复客户咨询，支持商品推荐、订单查询、售后处理等多场景对话',
      category: '电商',
      count: 5,
      icon: '🤖',
      color: '#10b981',
      tags: ['客服', '自动回复', '多轮对话']
    },
    {
      id: 'product-description',
      name: '商品详情页生成',
      description: '根据商品信息自动生成吸引人的标题、卖点提炼、详情描述、FAQ等完整详情页内容',
      category: '电商',
      count: 4,
      icon: '🏷️',
      color: '#14b8a6',
      tags: ['商品描述', '卖点', '详情页']
    },
    {
      id: 'live-streaming',
      name: '直播带货脚本',
      description: '生成直播带货话术脚本，包含开场、产品介绍、互动环节、促单技巧等',
      category: '电商',
      count: 6,
      icon: '📹',
      color: '#ef4444',
      tags: ['直播', '带货脚本', '话术']
    },
    {
      id: 'review-analysis',
      name: '用户评论分析',
      description: '批量分析用户评论，提取产品优缺点、情感倾向、改进建议等关键信息',
      category: '电商',
      count: 3,
      icon: '⭐',
      color: '#f59e0b',
      tags: ['评论分析', '情感识别', '数据洞察']
    },
    {
      id: 'promotion-copywriting',
      name: '促销活动文案',
      description: '生成各类促销活动文案，包含双11、618等大促主题和优惠券话术',
      category: '电商',
      count: 5,
      icon: '🎉',
      color: '#ec4899',
      tags: ['促销', '活动文案', '营销']
    },
    {
      id: 'competitor-analysis',
      name: '竞品分析报告',
      description: '分析竞品的价格、卖点、评价等信息，生成对比分析报告',
      category: '电商',
      count: 4,
      icon: '📊',
      color: '#8b5cf6',
      tags: ['竞品分析', '市场调研', '报告']
    }
  ],
  'personal-assistant': [
    {
      id: 'schedule-management',
      name: '智能日程管理',
      description: '自动安排会议、待办事项，智能提醒重要任务，优化时间分配',
      category: '个人助手',
      count: 4,
      icon: '📅',
      color: '#6366f1',
      tags: ['日程', '时间管理', '提醒']
    },
    {
      id: 'meeting-minutes',
      name: '会议纪要生成',
      description: '根据会议录音或实时语音自动生成会议纪要、待办事项和行动计划',
      category: '个人助手',
      count: 5,
      icon: '📋',
      color: '#06b6d4',
      tags: ['会议', '纪要', '语音识别']
    },
    {
      id: 'email-assistant',
      name: '邮件智能助手',
      description: '自动分类邮件、生成回复草稿、提取重要信息、设置跟进提醒',
      category: '个人助手',
      count: 6,
      icon: '📧',
      color: '#3b82f6',
      tags: ['邮件', '自动回复', '分类']
    },
    {
      id: 'document-summarization',
      name: '文档总结提取',
      description: '快速总结长文档、PDF、论文等内容，提取关键信息和要点',
      category: '个人助手',
      count: 5,
      icon: '📄',
      color: '#10b981',
      tags: ['文档', '总结', '提取']
    },
    {
      id: 'data-analysis',
      name: '数据分析报告',
      description: '上传数据表格，自动生成可视化图表和分析报告，发现数据洞察',
      category: '个人助手',
      count: 4,
      icon: '📊',
      color: '#8b5cf6',
      tags: ['数据分析', '可视化', '报告']
    },
    {
      id: 'note-organization',
      name: '学习笔记整理',
      description: '将课程笔记、读书笔记整理成结构化内容，生成思维导图和知识卡片',
      category: '个人助手',
      count: 3,
      icon: '📚',
      color: '#f59e0b',
      tags: ['笔记', '学习', '知识管理']
    }
  ]
}

export default function CategoryPage() {
  const navigate = useNavigate()
  const { category } = useParams<{ category: string }>()

  const categoryInfo = category ? categoryData[category] : null
  const workflowTypes = category ? workflowTypesByCategory[category] || [] : []

  if (!categoryInfo) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', color: '#1f2937', marginBottom: '1rem' }}>分类不存在</h1>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          返回首页
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* 分类头部 */}
      <div style={{
        marginBottom: '3rem',
        padding: '2rem',
        background: `linear-gradient(135deg, ${categoryInfo.color}15, ${categoryInfo.color}05)`,
        borderRadius: '16px',
        border: `1px solid ${categoryInfo.color}20`
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#6b7280',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white'
          }}
        >
          ← 返回首页
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: `${categoryInfo.color}20`,
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px'
          }}>
            {categoryInfo.icon}
          </div>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0 0 0.5rem 0'
            }}>
              {categoryInfo.title}
            </h1>
            <p style={{
              fontSize: '1.125rem',
              color: '#6b7280',
              margin: 0
            }}>
              {categoryInfo.description}
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '2rem',
          marginTop: '1.5rem',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          <div>
            <span style={{ fontWeight: '600', color: '#1f2937' }}>{workflowTypes.length}</span> 种工作流类型
          </div>
          <div>
            <span style={{ fontWeight: '600', color: '#1f2937' }}>
              {workflowTypes.reduce((sum, type) => sum + type.count, 0)}
            </span> 个具体工作流
          </div>
        </div>
      </div>

      {/* 工作流类型网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1.5rem'
      }}>
        {workflowTypes.map((workflowType) => {
          return (
            <div
              key={workflowType.id}
              onClick={() => navigate(`/workflow-type/${workflowType.id}`)}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 12px 40px ${workflowType.color}20`
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.borderColor = `${workflowType.color}40`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              {/* 卡片头部 */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: `${workflowType.color}15`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  flexShrink: 0
                }}>
                  {workflowType.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {workflowType.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px',
                      backgroundColor: '#e0e7ff',
                      color: '#3730a3',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: '500'
                    }}>
                      {workflowType.count} 个工作流
                    </span>
                  </div>
                </div>
              </div>

              {/* 描述 */}
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.6',
                marginBottom: '1rem',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              } as any}>
                {workflowType.description}
              </p>

              {/* 标签 */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginBottom: '1rem'
              }}>
                {workflowType.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      fontSize: '11px',
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontWeight: '500'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 底部按钮 */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginTop: 'auto',
                paddingTop: '1rem',
                borderTop: '1px solid #f3f4f6'
              }}>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: workflowType.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  查看所有工作流 →
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* 空状态 */}
      {workflowTypes.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ fontSize: '1.25rem', color: '#1f2937', marginBottom: '0.5rem' }}>
            暂无工作流类型
          </h3>
          <p>该分类下还没有工作流类型，敬请期待...</p>
        </div>
      )}
    </div>
  )
}
