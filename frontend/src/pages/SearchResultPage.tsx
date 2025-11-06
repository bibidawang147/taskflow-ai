import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const PAGE_BACKGROUND =
  'linear-gradient(to bottom right, #f8fafc 0%, rgba(245, 243, 255, 0.3) 45%, #f8fafc 100%)'
const THEME_COLOR = '#8b5cf6'
const SURFACE_COLOR = 'rgba(255, 255, 255, 0.9)'

// 对话历史数据
const conversationData: Record<string, { messages: Array<{ role: string; content: string; timestamp: string }> }> = {
  '1': {
    messages: [
      {
        role: 'user',
        content: '帮我写一篇关于人工智能发展趋势的科技文章',
        timestamp: '14:30'
      },
      {
        role: 'assistant',
        content:
          '好的，我将为您创建一个AI文章生成工作流。这个工作流包含以下步骤：\n\n1. 需求分析 - 分析您的文章主题和目标受众\n2. 内容生成 - 根据分析结果生成文章内容\n3. SEO优化 - 优化文章的搜索引擎友好度\n4. 质量检测 - 检查文章的质量和可读性\n\n工作流已创建完成，您可以在工作空间查看详情。',
        timestamp: '14:31'
      }
    ]
  },
  '2': {
    messages: [
      {
        role: 'user',
        content: '为我的淘宝店铺新品生成吸引人的产品描述',
        timestamp: '11:20'
      },
      {
        role: 'assistant',
        content:
          '我为您创建了一个电商产品描述生成工作流，可以帮助您快速生成专业的产品描述。工作流包含：\n\n1. 产品特点提取\n2. 卖点文案生成\n3. SEO关键词优化\n4. 情感化描述润色',
        timestamp: '11:21'
      }
    ]
  },
  '3': {
    messages: [
      {
        role: 'user',
        content: '创建一个适合小红书的美妆教程内容',
        timestamp: '昨天 15:20'
      },
      {
        role: 'assistant',
        content: '已为您创建小红书美妆内容生成工作流！包含标题优化、正文撰写、标签生成等功能。',
        timestamp: '昨天 15:21'
      }
    ]
  },
  '4': {
    messages: [
      {
        role: 'user',
        content: '写一个3分钟的产品介绍视频脚本',
        timestamp: '2天前 10:15'
      },
      {
        role: 'assistant',
        content: '视频脚本工作流已创建，包含开场、产品介绍、使用演示、总结等环节。',
        timestamp: '2天前 10:16'
      }
    ]
  },
  '5': {
    messages: [
      {
        role: 'user',
        content: '生成一封促销活动的营销邮件',
        timestamp: '3天前 09:30'
      },
      {
        role: 'assistant',
        content: '营销邮件工作流已创建，包含标题撰写、正文生成、CTA优化等步骤。',
        timestamp: '3天前 09:31'
      }
    ]
  }
}

export default function SearchResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const conversationId = location.state?.conversationId
  const searchQuery =
    conversationId && conversationData[conversationId]
      ? conversationData[conversationId].messages[0].content
      : location.state?.query || ''
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const recommendedWorkflows = [
    {
      id: 1,
      name: 'AI文章生成工作流',
      type: '工作流',
      description: '使用GPT-4自动生成高质量文章内容,支持多种文体和风格',
      steps: ['需求分析', '内容生成', 'SEO优化', '质量检测'],
      difficulty: '简单',
      rating: 5,
      estimatedTime: '10分钟',
      icon: '📝',
      color: '#3b82f6',
      category: '文字处理'
    },
    {
      id: 2,
      name: '内容优化助手',
      type: 'AI工具',
      description: '智能优化文章结构、语法和可读性,提升内容质量',
      steps: ['文本分析', '语法检查', '结构优化', '导出结果'],
      difficulty: '简单',
      rating: 4,
      estimatedTime: '5分钟',
      icon: '✨',
      color: '#10b981',
      category: '文字处理'
    },
    {
      id: 3,
      name: 'SEO关键词工具',
      type: '软件',
      description: '分析和优化文章SEO关键词,提高搜索引擎排名',
      steps: ['关键词提取', '密度分析', '优化建议', '应用修改'],
      difficulty: '中等',
      rating: 3,
      estimatedTime: '15分钟',
      icon: '🔍',
      color: '#f59e0b',
      category: '营销模块'
    },
    {
      id: 4,
      name: '多语言翻译流程',
      type: '工作流',
      description: '将文章翻译成多种语言,保持原意和格式',
      steps: ['语言检测', 'AI翻译', '人工校对', '格式调整'],
      difficulty: '中等',
      rating: 4,
      estimatedTime: '20分钟',
      icon: '🌐',
      color: '#8b5cf6',
      category: '文字处理'
    }
  ]

  const [needsConfirmed, setNeedsConfirmed] = useState(false)

  const [messages, setMessages] = useState(() => {
    if (conversationId && conversationData[conversationId]) {
      const historyMessages = conversationData[conversationId].messages
      setNeedsConfirmed(true)
      return [
        {
          id: 1,
          type: historyMessages[0].role as 'user' | 'ai',
          content: historyMessages[0].content,
          timestamp: new Date()
        },
        {
          id: 2,
          type: historyMessages[1].role === 'user' ? 'user' : 'ai',
          content: historyMessages[1].content,
          timestamp: new Date(),
          workflows: recommendedWorkflows,
          showCustomWorkflow: true
        }
      ]
    }

    return [
      {
        id: 1,
        type: 'user' as const,
        content: searchQuery,
        timestamp: new Date()
      },
      {
        id: 2,
        type: 'ai' as const,
        content: `我理解您想要"${searchQuery}"。为了给您推荐最合适的工作流，我需要了解更多信息：\n\n1. 这个任务的具体目标是什么？\n2. 您希望最终得到什么样的结果？\n3. 有没有特殊的要求或偏好？\n\n请告诉我更多细节，或者如果以上描述已经很清楚，直接回复"需求明确"即可开始搜索。`,
        timestamp: new Date()
      }
    ]
  })

  const [inputValue, setInputValue] = useState('')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim()) {
      return
    }

    const newUserMessage = {
      id: messages.length + 1,
      type: 'user' as const,
      content: inputValue,
      timestamp: new Date()
    }

    const isConfirming =
      inputValue.includes('需求明确') ||
      inputValue.includes('明确') ||
      inputValue.includes('是的') ||
      inputValue.includes('确认') ||
      inputValue.includes('可以') ||
      inputValue.includes('开始')

    let newAIMessage

    if (!needsConfirmed && isConfirming) {
      setNeedsConfirmed(true)
      newAIMessage = {
        id: messages.length + 2,
        type: 'ai' as const,
        content: '好的，我已经理解您的需求。根据您的描述，我为您找到了以下适合的工作流和工具：',
        timestamp: new Date(),
        workflows: recommendedWorkflows,
        showCustomWorkflow: true
      }
    } else if (!needsConfirmed) {
      newAIMessage = {
        id: messages.length + 2,
        type: 'ai' as const,
        content: `感谢您的补充说明。让我再确认一下：\n\n您提到的"${inputValue}"，这样我就能为您推荐更精准的工作流。\n\n还有其他需要补充的吗？或者现在就可以开始搜索了？（回复"需求明确"开始搜索）`,
        timestamp: new Date()
      }
    } else {
      newAIMessage = {
        id: messages.length + 2,
        type: 'ai' as const,
        content: '我已经收到您的补充信息，正在为您调整推荐方案...',
        timestamp: new Date()
      }
    }

    setMessages([...messages, newUserMessage, newAIMessage])
    setInputValue('')
  }

  const getTypeStyle = (type: string) => {
    switch (type) {
      case '工作流':
        return { bg: '#dcfce7', color: '#166534', icon: '⚡' }
      case 'AI工具':
        return { bg: '#dbeafe', color: '#1e40af', icon: '🤖' }
      case '软件':
        return { bg: '#fef3c7', color: '#92400e', icon: '🛠️' }
      default:
        return { bg: '#f3f4f6', color: '#374151', icon: '🔧' }
    }
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

  const renderConversationPanel = () => (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: '24px',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        backgroundColor: SURFACE_COLOR,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 20px 45px rgba(139, 92, 246, 0.08)'
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <div style={{ width: '100%', maxWidth: '900px' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              {message.type === 'user' ? (
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '1rem 1.25rem',
                    borderRadius: '18px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6' }}>{message.content}</p>
                </div>
              ) : (
                <div style={{ width: '100%' }}>
                  <div
                    style={{
                      padding: '16px 20px',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(139, 92, 246, 0.12)',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      color: '#312e81',
                      marginBottom: (message as any).workflows ? '20px' : 0,
                      boxShadow: '0 12px 30px rgba(139, 92, 246, 0.12)'
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          backgroundColor: THEME_COLOR,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          color: 'white'
                        }}
                      >
                        🤖
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: THEME_COLOR }}>AI 助手</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.65, color: '#312e81' }}>
                      {message.content}
                    </p>
                  </div>

                  {(message as any).workflows && (message as any).workflows.length > 0 && (
                    <>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '16px'
                        }}
                      >
                        {(message as any).workflows.map((workflow: any) => {
                          const typeStyle = getTypeStyle(workflow.type)
                          const difficultyStyle = getDifficultyStyle(workflow.difficulty)

                          return (
                            <div
                              key={workflow.id}
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '16px',
                                border: '1px solid rgba(139, 92, 246, 0.15)',
                                padding: '16px',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 14px 32px rgba(139, 92, 246, 0.22)'
                                e.currentTarget.style.transform = 'translateY(-3px)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'none'
                                e.currentTarget.style.transform = 'translateY(0)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div
                                  style={{
                                    width: '48px',
                                    height: '48px',
                                    backgroundColor: `${workflow.color}20`,
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                    flexShrink: 0
                                  }}
                                >
                                  {workflow.icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <h4
                                    style={{
                                      fontSize: '1rem',
                                      fontWeight: 600,
                                      color: '#1f2937',
                                      margin: 0,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {workflow.name}
                                  </h4>
                                  <div
                                    style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}
                                  >
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        backgroundColor: typeStyle.bg,
                                        color: typeStyle.color,
                                        padding: '3px 8px',
                                        borderRadius: '999px',
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <span>{typeStyle.icon}</span>
                                      <span>{workflow.type}</span>
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        backgroundColor: difficultyStyle.bg,
                                        color: difficultyStyle.color,
                                        padding: '3px 8px',
                                        borderRadius: '999px',
                                        fontWeight: 600
                                      }}
                                    >
                                      {workflow.difficulty}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        backgroundColor: '#ede9fe',
                                        color: THEME_COLOR,
                                        padding: '3px 8px',
                                        borderRadius: '999px',
                                        fontWeight: 600
                                      }}
                                    >
                                      ⏱️ {workflow.estimatedTime}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <p style={{ fontSize: '13px', color: '#4b5563', margin: 0, lineHeight: 1.55 }}>
                                {workflow.description}
                              </p>

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginTop: 'auto'
                                }}
                              >
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>适用：{workflow.category}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigate(`/workflow-intro/${workflow.id}`)
                                  }}
                                  style={{
                                    padding: '8px 14px',
                                    background: `linear-gradient(135deg, ${THEME_COLOR} 0%, #7c3aed 100%)`,
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  快速使用
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {(message as any).showCustomWorkflow && (
                        <div
                          style={{
                            marginTop: '1.5rem',
                            padding: '1.25rem',
                            backgroundColor: 'rgba(139, 92, 246, 0.08)',
                            borderRadius: '16px',
                            border: '1px dashed rgba(139, 92, 246, 0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ fontSize: '28px' }}>✨</div>
                            <div style={{ flex: 1 }}>
                              <h4
                                style={{
                                  fontSize: '1rem',
                                  fontWeight: 600,
                                  color: THEME_COLOR,
                                  margin: 0
                                }}
                              >
                                想要更贴合的方案？
                              </h4>
                              <p
                                style={{
                                  fontSize: '13px',
                                  color: '#5b21b6',
                                  margin: '6px 0 0 0',
                                  lineHeight: 1.6
                                }}
                              >
                                我们可以基于“{searchQuery.substring(0, 28)}
                                {searchQuery.length > 28 ? '…' : ''}”快速搭建一套专属工作流。
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              navigate('/workflow/new', {
                                state: {
                                  userRequirement: searchQuery,
                                  suggestedSteps: ['需求分析', '内容生成', '质量优化', '结果导出']
                                }
                              })
                            }}
                            style={{
                              width: '100%',
                              padding: '11px',
                              background: `linear-gradient(135deg, ${THEME_COLOR} 0%, #7c3aed 100%)`,
                              color: '#fff',
                              border: 'none',
                              borderRadius: '12px',
                              fontSize: '14px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              boxShadow: '0 6px 18px rgba(139, 92, 246, 0.28)'
                            }}
                          >
                            创建专属工作流
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid rgba(139, 92, 246, 0.12)',
          padding: '16px 24px',
          backgroundColor: 'rgba(248, 245, 255, 0.95)',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}
        >
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              color: THEME_COLOR,
              border: '1px solid rgba(139, 92, 246, 0.18)',
              borderRadius: '12px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              boxShadow: '0 6px 16px rgba(139, 92, 246, 0.08)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.98)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.92)'
            }}
          >
            🏠 返回首页
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="告诉我更多细节，我们会给出更贴合的建议"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              fontSize: '14px',
              color: '#312e81',
              outline: 'none',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.08)'
            }}
          />

          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            style={{
              padding: '12px 20px',
              background: `linear-gradient(135deg, ${THEME_COLOR} 0%, #7c3aed 100%)`,
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              opacity: inputValue.trim() ? 1 : 0.6,
              boxShadow: inputValue.trim()
                ? '0 6px 18px rgba(139, 92, 246, 0.28)'
                : '0 4px 12px rgba(139, 92, 246, 0.12)',
              transition: 'all 0.2s ease'
            }}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '24px',
        background: PAGE_BACKGROUND,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch'
      }}
    >
      <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', gap: '24px' }}>
        {renderConversationPanel()}
      </div>
    </div>
  )
}
