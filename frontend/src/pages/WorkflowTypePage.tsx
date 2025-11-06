import { useNavigate, useParams } from 'react-router-dom'

interface SpecificWorkflow {
  id: number
  name: string
  description: string
  difficulty: string
  rating: number
  icon: string
  color: string
  tags: string[]
  estimatedTime: string
}

// 工作流类型定义
const workflowTypeData: Record<string, { title: string; description: string; icon: string; color: string; category: string }> = {
  'wechat-article': {
    title: '公众号文章撰写',
    description: '专业的公众号文章生成工具，支持多种主题和风格',
    icon: '文章',
    color: '#10b981',
    category: 'content-creation'
  },
  'video-script': {
    title: '视频脚本撰写',
    description: '为短视频和长视频生成专业脚本',
    icon: '脚本',
    color: '#ef4444',
    category: 'content-creation'
  },
  'ai-humanize': {
    title: 'AI去痕迹优化',
    description: '让AI生成的内容更加人性化和真实',
    icon: 'AI',
    color: '#8b5cf6',
    category: 'content-creation'
  }
}

// 每个工作流类型下的具体工作流
const specificWorkflowsByType: Record<string, SpecificWorkflow[]> = {
  'wechat-article': [
    {
      id: 101,
      name: '历史类公众号文章',
      description: '生成历史题材的公众号文章，包含历史背景、人物介绍、事件分析等',
      difficulty: '简单',
      rating: 5,
      icon: '历史',
      color: '#f59e0b',
      tags: ['历史', '公众号', '深度内容'],
      estimatedTime: '12分钟'
    },
    {
      id: 102,
      name: '新闻类公众号文章',
      description: '根据新闻事件生成客观、专业的公众号新闻稿',
      difficulty: '简单',
      rating: 4,
      icon: '新闻',
      color: '#3b82f6',
      tags: ['新闻', '时事', '客观报道'],
      estimatedTime: '10分钟'
    },
    {
      id: 103,
      name: '科技类公众号文章',
      description: '撰写科技产品评测、技术解析、行业趋势等科技类文章',
      difficulty: '中等',
      rating: 5,
      icon: '科技',
      color: '#06b6d4',
      tags: ['科技', '产品', '评测'],
      estimatedTime: '15分钟'
    },
    {
      id: 104,
      name: '情感类公众号文章',
      description: '生成情感故事、心灵鸡汤、人生感悟等治愈系文章',
      difficulty: '简单',
      rating: 4,
      icon: '情感',
      color: '#ec4899',
      tags: ['情感', '故事', '治愈'],
      estimatedTime: '10分钟'
    },
    {
      id: 105,
      name: '职场类公众号文章',
      description: '职场干货、职业发展、工作技巧等实用文章',
      difficulty: '中等',
      rating: 5,
      icon: '职场',
      color: '#8b5cf6',
      tags: ['职场', '干货', '成长'],
      estimatedTime: '12分钟'
    },
    {
      id: 106,
      name: '美食类公众号文章',
      description: '美食探店、菜谱分享、饮食文化等美食主题文章',
      difficulty: '简单',
      rating: 4,
      icon: '美食',
      color: '#f59e0b',
      tags: ['美食', '探店', '菜谱'],
      estimatedTime: '10分钟'
    }
  ],
  'video-script': [
    {
      id: 201,
      name: '抖音短视频脚本',
      description: '15-60秒抖音短视频脚本，包含开场、亮点、结尾和转场提示',
      difficulty: '简单',
      rating: 5,
      icon: '抖音',
      color: '#000000',
      tags: ['抖音', '短视频', '爆款'],
      estimatedTime: '8分钟'
    },
    {
      id: 202,
      name: 'B站中长视频脚本',
      description: '5-30分钟B站视频脚本，包含章节划分、内容要点、互动设计',
      difficulty: '中等',
      rating: 5,
      icon: 'B站',
      color: '#00a1d6',
      tags: ['B站', '中长视频', '结构化'],
      estimatedTime: '20分钟'
    },
    {
      id: 203,
      name: '知识科普视频脚本',
      description: '科普类视频脚本，包含知识点讲解、案例分析、可视化建议',
      difficulty: '中等',
      rating: 4,
      icon: '科普',
      color: '#3b82f6',
      tags: ['科普', '教育', '知识'],
      estimatedTime: '18分钟'
    },
    {
      id: 204,
      name: 'Vlog生活记录脚本',
      description: '生活Vlog拍摄脚本，包含场景规划、镜头语言、配乐建议',
      difficulty: '简单',
      rating: 4,
      icon: 'Vlog',
      color: '#ec4899',
      tags: ['Vlog', '生活', '记录'],
      estimatedTime: '12分钟'
    },
    {
      id: 205,
      name: '产品评测视频脚本',
      description: '产品开箱、测评视频脚本，包含测试项目、对比分析、结论',
      difficulty: '中等',
      rating: 5,
      icon: '评测',
      color: '#10b981',
      tags: ['评测', '产品', '开箱'],
      estimatedTime: '15分钟'
    },
    {
      id: 206,
      name: '剧情类短视频脚本',
      description: '搞笑、情感、悬疑等剧情类短视频脚本，包含人物、对话、情节',
      difficulty: '中等',
      rating: 4,
      icon: '剧情',
      color: '#f59e0b',
      tags: ['剧情', '创意', '娱乐'],
      estimatedTime: '16分钟'
    }
  ],
  'ai-humanize': [
    {
      id: 301,
      name: '学术论文人性化',
      description: '将AI生成的学术内容进行人性化改写，保持专业性的同时去除机器痕迹',
      difficulty: '高级',
      rating: 5,
      icon: '学术',
      color: '#3b82f6',
      tags: ['学术', '论文', '专业'],
      estimatedTime: '20分钟'
    },
    {
      id: 302,
      name: '营销文案去AI化',
      description: '优化AI生成的营销文案，增加情感共鸣和真实感',
      difficulty: '中等',
      rating: 5,
      icon: '营销',
      color: '#10b981',
      tags: ['营销', '文案', '情感'],
      estimatedTime: '12分钟'
    },
    {
      id: 303,
      name: '新闻稿人性化改写',
      description: '让AI生成的新闻稿更加自然流畅，符合人类写作习惯',
      difficulty: '中等',
      rating: 4,
      icon: '新闻',
      color: '#06b6d4',
      tags: ['新闻', '改写', '自然'],
      estimatedTime: '15分钟'
    },
    {
      id: 304,
      name: '故事内容优化',
      description: '为AI生成的故事增加细节、情感和真实感，让叙事更生动',
      difficulty: '中等',
      rating: 5,
      icon: '故事',
      color: '#ec4899',
      tags: ['故事', '叙事', '细节'],
      estimatedTime: '18分钟'
    },
    {
      id: 305,
      name: '技术文档润色',
      description: '优化AI生成的技术文档，使其更易读、更专业',
      difficulty: '中等',
      rating: 4,
      icon: '文档',
      color: '#8b5cf6',
      tags: ['技术', '文档', '润色'],
      estimatedTime: '14分钟'
    },
    {
      id: 306,
      name: '社交媒体内容优化',
      description: '让AI生成的社交媒体内容更加口语化和接地气',
      difficulty: '简单',
      rating: 4,
      icon: '社交',
      color: '#f59e0b',
      tags: ['社交', '口语化', '真实'],
      estimatedTime: '10分钟'
    }
  ]
}

export default function WorkflowTypePage() {
  const navigate = useNavigate()
  const { type } = useParams<{ type: string }>()

  const typeInfo = type ? workflowTypeData[type] : null
  const workflows = type ? specificWorkflowsByType[type] || [] : []

  if (!typeInfo) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', color: '#1f2937', marginBottom: '1rem' }}>工作流类型不存在</h1>
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

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case '简单':
        return { bg: '#dcfce7', color: '#166534' }
      case '中等':
        return { bg: '#fef3c7', color: '#92400e' }
      case '高级':
        return { bg: '#fee2e2', color: '#991b1b' }
      default:
        return { bg: '#f3f4f6', color: '#374151' }
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* 工作流类型头部 */}
      <div style={{
        marginBottom: '3rem',
        padding: '2rem',
        background: `linear-gradient(135deg, ${typeInfo.color}15, ${typeInfo.color}05)`,
        borderRadius: '16px',
        border: `1px solid ${typeInfo.color}20`
      }}>
        <button
          onClick={() => navigate(`/category/${typeInfo.category}`)}
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
          ← 返回分类页面
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: `${typeInfo.color}20`,
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px'
          }}>
            {typeInfo.icon}
          </div>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0 0 0.5rem 0'
            }}>
              {typeInfo.title}
            </h1>
            <p style={{
              fontSize: '1.125rem',
              color: '#6b7280',
              margin: 0
            }}>
              {typeInfo.description}
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
            <span style={{ fontWeight: '600', color: '#1f2937' }}>{workflows.length}</span> 个具体工作流
          </div>
          <div>
            <span style={{ fontWeight: '600', color: '#1f2937' }}>
              {workflows.filter(w => w.difficulty === '简单').length}
            </span> 个简单
          </div>
          <div>
            <span style={{ fontWeight: '600', color: '#1f2937' }}>
              {workflows.filter(w => w.difficulty === '中等').length}
            </span> 个中等
          </div>
          <div>
            <span style={{ fontWeight: '600', color: '#1f2937' }}>
              {workflows.filter(w => w.difficulty === '高级').length}
            </span> 个高级
          </div>
        </div>
      </div>

      {/* 具体工作流网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1.5rem'
      }}>
        {workflows.map((workflow) => {
          const difficultyStyle = getDifficultyStyle(workflow.difficulty)

          return (
            <div
              key={workflow.id}
              onClick={() => navigate(`/workflow-intro/${workflow.id}`)}
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
                e.currentTarget.style.boxShadow = `0 12px 40px ${workflow.color}20`
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.borderColor = `${workflow.color}40`
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
                  backgroundColor: `${workflow.color}15`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  flexShrink: 0
                }}>
                  {workflow.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0 0 0.5rem 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {workflow.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px',
                      backgroundColor: difficultyStyle.bg,
                      color: difficultyStyle.color,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: '500'
                    }}>
                      {workflow.difficulty}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: '500',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      <span>{workflow.rating}分</span>
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
                {workflow.description}
              </p>

              {/* 标签 */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginBottom: '1rem'
              }}>
                {workflow.tags.map((tag, index) => (
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

              {/* 底部信息 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 'auto',
                paddingTop: '1rem',
                borderTop: '1px solid #f3f4f6'
              }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  预计 {workflow.estimatedTime}
                </span>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: workflow.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  开始使用 →
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* 空状态 */}
      {workflows.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#6b7280'
        }}>
          <h3 style={{ fontSize: '1.25rem', color: '#1f2937', marginBottom: '0.5rem' }}>
            暂无具体工作流
          </h3>
          <p>该类型下还没有具体工作流，敬请期待...</p>
        </div>
      )}
    </div>
  )
}
