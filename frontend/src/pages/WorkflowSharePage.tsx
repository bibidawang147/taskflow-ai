import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getWorkflowDetail,
  favoriteWorkflow,
  unfavoriteWorkflow,
  cloneWorkflow,
  getWorkflowExecution,
  type Workflow as APIWorkflow
} from '../services/workflowApi'
import '../styles/workflow-share.css'

interface WorkflowNode {
  id: string
  type: string
  label: string
  config: {
    provider?: string
    model?: string
    prompt?: string
    goal?: string
    tool?: string
    parameters?: Record<string, any>
    [key: string]: any
  }
}

interface Workflow extends Omit<APIWorkflow, 'category' | 'tags'> {
  category?: string
  tags?: string[]
  config?: any // 允许任意配置格式
  rating?: number // 平均评分
  exampleOutput?: any // 示例输出
  sourceUrl?: string // 原文链接
  sourceTitle?: string // 原文标题
}

// 获取模型官网链接或用户填写的工具链接
function getModelLink(node: any): string {
  // 优先使用 alternativeModels 中的第一个有效 URL
  if (node?.config?.alternativeModels && Array.isArray(node.config.alternativeModels)) {
    for (const model of node.config.alternativeModels) {
      if (model.url && model.url.trim() !== '') {
        return model.url
      }
      // 如果 name 字段本身是一个 URL
      if (model.name && (model.name.startsWith('http://') || model.name.startsWith('https://'))) {
        return model.name
      }
    }
  }

  // 如果没有找到 URL，使用默认的模型官网链接
  const provider = node?.config?.provider
  if (provider?.toLowerCase().includes('openai')) {
    return 'https://platform.openai.com/docs/models'
  }
  if (provider?.toLowerCase().includes('anthropic')) {
    return 'https://www.anthropic.com/claude'
  }
  if (provider?.toLowerCase().includes('google')) {
    return 'https://ai.google.dev/'
  }
  return '#'
}

// 按模型分组步骤
function groupStepsByModel(nodes: any[]): any[][] {
  if (nodes.length === 0) return []

  const groups: any[][] = []
  let currentGroup: any[] = []
  let currentModelKey: string | null = null

  nodes.forEach((node, index) => {
    const provider = node.config?.provider || ''
    const model = node.config?.model || ''
    const modelKey = `${provider}-${model}`

    if (currentModelKey === modelKey && modelKey !== '-') {
      // 相同模型，加入当前组
      currentGroup.push({ ...node, originalIndex: index })
    } else {
      // 不同模型或无模型信息，开始新组
      if (currentGroup.length > 0) {
        groups.push(currentGroup)
      }
      currentGroup = [{ ...node, originalIndex: index }]
      currentModelKey = modelKey !== '-' ? modelKey : null
    }
  })

  // 添加最后一组
  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  return groups
}

export default function WorkflowSharePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(true)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [showShareModal, setShowShareModal] = useState(false)

  useEffect(() => {
    loadWorkflow()
  }, [id])

  const loadWorkflow = async () => {
    if (!id) return

    try {
      setLoading(true)
      console.log('正在加载工作流，ID:', id)
      const data = await getWorkflowDetail(id)
      console.log('获取到的工作流数据:', data)

      // 处理 tags: 如果是字符串，转换为数组
      const processedData: any = { ...data }
      if (typeof data.tags === 'string') {
        processedData.tags = data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      }

      setWorkflow(processedData)

      // 如果有示例输出，使用示例输出
      if (data.exampleOutput) {
        setExecutionResult(data.exampleOutput)
      }
    } catch (error: any) {
      console.error('加载工作流失败:', error)
      console.error('错误详情:', error.response?.data || error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFavorite = async () => {
    if (!id) return

    try {
      if (isFavorited) {
        await unfavoriteWorkflow(id)
        setIsFavorited(false)
      } else {
        await favoriteWorkflow(id)
        setIsFavorited(true)
      }
    } catch (error) {
      console.error('收藏操作失败:', error)
      alert('操作失败，请重试')
    }
  }

  const handleClone = async () => {
    if (!id) return

    try {
      const result = await cloneWorkflow(id)
      alert(`✅ 已收藏到"我的工作流"！\n\n您可以在工作区中查看和编辑这个工作流。`)
      navigate('/workspace')
    } catch (error) {
      console.error('克隆工作流失败:', error)
      alert('操作失败，请重试')
    }
  }

  const handleShare = () => {
    setShowShareModal(true)
  }

  const generateShareCard = () => {
    // TODO: 实现生成分享卡片功能
    alert('生成分享卡片功能开发中...')
  }

  if (loading) {
    return (
      <div className="workflow-share-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="workflow-share-error">
        <h2>工作流不存在</h2>
        <button onClick={() => navigate('/explore')}>返回探索</button>
      </div>
    )
  }

  // 使用真实数据或假数据
  const nodes = Array.isArray(workflow.config?.nodes) && workflow.config.nodes.length > 0
    ? workflow.config.nodes
    : [
        {
          id: 'step1',
          type: 'llm',
          label: '市场调研与选题',
          config: {
            goal: '分析热门话题，确定文案方向',
            provider: 'OpenAI',
            model: 'GPT-4',
            prompt: '请帮我分析当前小红书上关于【护肤品】的热门话题和用户痛点。要求：\n1. 列出5个最受关注的话题方向\n2. 分析每个话题的热度原因\n3. 给出适合种草的产品类型\n4. 推荐最佳发布时间段'
          }
        },
        {
          id: 'step2',
          type: 'llm',
          label: '生成文案大纲',
          config: {
            goal: '根据选题创建文案结构',
            provider: 'OpenAI',
            model: 'GPT-4',
            prompt: '基于前面的调研结果，为【敏感肌保湿精华推荐】这个主题创建小红书文案大纲。要求：\n1. 开头：3种吸睛钩子（问题式/数据式/故事式）\n2. 正文结构：痛点-产品-效果-使用感受\n3. 结尾：引导互动的话术\n4. 标题：5个备选标题（包含表情符号）'
          }
        },
        {
          id: 'step3',
          type: 'llm',
          label: '撰写正文内容',
          config: {
            goal: '创作完整的种草文案',
            provider: 'Anthropic',
            model: 'Claude-3-Sonnet',
            prompt: '根据大纲，撰写一篇800字左右的小红书种草笔记。要求：\n1. 语言风格：真诚、口语化、有共鸣感\n2. 内容要点：开头我的敏感肌困扰、产品介绍、使用体验、购买建议\n3. 排版：使用表情符号、分段清晰\n4. 避免：夸大宣传、绝对化用词'
          }
        },
        {
          id: 'step4',
          type: 'llm',
          label: 'SEO关键词优化',
          config: {
            goal: '提升文案搜索排名',
            provider: 'OpenAI',
            model: 'GPT-3.5-Turbo',
            prompt: '对上面的文案进行SEO优化，提升小红书搜索曝光。要求：\n1. 提取10个高频搜索关键词\n2. 自然融入文案中（不影响阅读体验）\n3. 优化标题包含核心关键词\n4. 添加5-8个相关话题标签\n5. 给出搜索流量预估'
          }
        },
        {
          id: 'step5',
          type: 'tool',
          label: '检查内容合规性',
          config: {
            goal: '确保内容符合平台规范',
            tool: '文本审核API',
            description: '使用文本审核工具检查违禁词、广告法规范、医疗美容限制、引流信息等，确保内容合规。'
          }
        }
      ]

  console.log('=== WorkflowSharePage Debug ===')
  console.log('Workflow:', workflow)
  console.log('Nodes count:', nodes.length)
  console.log('Nodes:', nodes)

  return (
    <div className="workflow-share-page">
      {/* 头部信息区 */}
      <header className="share-header">
        <div className="share-header-content">
          <div className="share-title-section">
            <h1 className="share-title">{workflow.title}</h1>

            {/* 作者和统计信息 */}
            <div className="share-meta-row">
              <div className="author-info">
                {workflow.author?.avatar && (
                  <img
                    src={workflow.author.avatar}
                    alt={workflow.author.name}
                    className="author-avatar"
                  />
                )}
                <span className="author-name">{workflow.author?.name || '匿名'}</span>
              </div>

              <div className="share-stats">
                {workflow.rating && (
                  <>
                    <div className="stat-item">
                      <span className="stat-stars">{'★'.repeat(Math.round(workflow.rating))}</span>
                      <span className="stat-number">{workflow.rating.toFixed(1)}</span>
                    </div>
                    <span className="stat-divider">•</span>
                  </>
                )}
                <span className="stat-text">
                  {workflow._count?.ratings || 0} 条评价
                </span>
                <span className="stat-divider">•</span>
                <span className="stat-text">
                  {workflow._count?.executions || 0} 次使用
                </span>
              </div>
            </div>

            {/* 描述 */}
            {workflow.description && (
              <p className="share-description">{workflow.description}</p>
            )}

            {/* 原文链接 */}
            {workflow.sourceUrl && (
              <div className="source-link-container">
                <span className="source-label">📄 原文链接：</span>
                <a
                  href={workflow.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-link"
                  title={workflow.sourceTitle || '查看原文'}
                >
                  {workflow.sourceTitle || workflow.sourceUrl}
                </a>
              </div>
            )}

            {/* 标签 */}
            {workflow.tags && Array.isArray(workflow.tags) && workflow.tags.length > 0 && (
              <div className="share-tags">
                {workflow.tags.map((tag, index) => (
                  <span key={index} className="share-tag">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="share-actions">
            <button
              className="action-btn primary-action"
              onClick={handleClone}
              title="添加到我的工作台"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              添加到我的工作台
            </button>

            <button
              className={`action-btn ${isFavorited ? 'favorited' : ''}`}
              onClick={handleFavorite}
              title={isFavorited ? '取消收藏' : '收藏'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
              {isFavorited ? '已收藏' : '收藏'}
            </button>

            <button
              className="action-btn"
              onClick={handleShare}
              title="分享"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              分享
            </button>
          </div>
        </div>
      </header>

      {/* 主体内容区 */}
      <div className="share-content">
        <div className="share-main">
          {/* 操作步骤 */}
          <section className="steps-section">
            <h2 className="section-title">操作步骤</h2>
            <div className="steps-container">
              {groupStepsByModel(nodes).map((group, groupIndex) => {
                const firstNode = group[0]
                return (
                  <div key={`group-${groupIndex}`} className="step-item">
                    <div className="step-content-wrapper">
                      {/* 渲染组内的所有步骤 */}
                      {group.map((node, indexInGroup) => (
                        <div key={node.id}>
                          {indexInGroup > 0 && <div className="step-divider step-divider-light"></div>}
                          <div className="step-content">
                            {/* 卡片顶部 - 步骤编号 + 标题 */}
                            <div className="card-header">
                              <span className="badge badge-step">步骤 {node.originalIndex + 1}</span>
                              <h3 className="card-title">
                                {node.config?.goal || node.label || '未命名'}
                              </h3>
                            </div>

                            {/* 内容区 */}
                            <div className="card-content">
                              <p className="step-desc">{node.config?.prompt || node.config?.description || ''}</p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* 深色粗线分隔 */}
                      <div className="step-divider step-divider-heavy"></div>

                      {/* 卡片底部 - 模型信息栏（整个组只显示一次）*/}
                      {(firstNode.config?.provider || firstNode.config?.model) && (
                        <div className="card-footer">
                          <div className="footer-left">
                            <span className="footer-label">由以下 AI 提供支持</span>
                            {firstNode.config?.provider && (
                              <span className="badge badge-brand">
                                {firstNode.config.provider}
                              </span>
                            )}
                            {firstNode.config?.model && (
                              <span className="badge badge-model">
                                {firstNode.config.model}
                              </span>
                            )}
                          </div>
                          <div className="footer-right">
                            <a
                              href={getModelLink(firstNode)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="badge badge-action"
                              title={`去试试`}
                              aria-label="去试试"
                            >
                              去试试 →
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 互动区（评论讨论） */}
          <section className="comments-section">
            <h2 className="section-title">
              <span className="title-icon">💬</span>
              讨论区
            </h2>
            <div className="comments-placeholder">
              <p>评论功能开发中...</p>
              <p className="placeholder-hint">即将支持提问和讨论功能</p>
            </div>
          </section>
        </div>

        {/* 右侧效果预览区（固定） */}
        <aside className="preview-sidebar">
          <div className="preview-sticky">
            <h3 className="preview-title">
              <span className="title-icon">🎨</span>
              执行效果预览
            </h3>

            {executionResult ? (
              <div className="preview-content">
                {/* 如果是图片 */}
                {executionResult.type === 'image' && executionResult.url && (
                  <img
                    src={executionResult.url}
                    alt="执行结果"
                    className="preview-image"
                  />
                )}

                {/* 如果是文本 */}
                {executionResult.type === 'text' && executionResult.content && (
                  <div className="preview-text">
                    <pre>{executionResult.content}</pre>
                  </div>
                )}

                {/* 通用JSON显示 */}
                {!executionResult.type && (
                  <div className="preview-json">
                    <pre>{JSON.stringify(executionResult, null, 2)}</pre>
                  </div>
                )}

                {/* 缩略图 */}
                {workflow.thumbnail && (
                  <img
                    src={workflow.thumbnail}
                    alt="工作流缩略图"
                    className="preview-thumbnail"
                  />
                )}
              </div>
            ) : (
              <div className="preview-placeholder">
                <div className="placeholder-icon">📋</div>
                <p>暂无执行结果</p>
                <p className="placeholder-hint">运行工作流后将显示结果预览</p>
              </div>
            )}

            {/* 推荐区 */}
            <section className="recommendations-section">
              <h3 className="preview-title">
                相关推荐
              </h3>
              <div className="recommendations-list">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="recommendation-card">
                    <div className="rec-content">
                      <h4 className="rec-title">相关工作流 {item}</h4>
                      <div className="rec-stats">
                        <span>★ 4.5</span>
                        <span>•</span>
                        <span>1.2k 使用</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </div>

      {/* 分享弹窗 */}
      {showShareModal && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>分享工作流</h3>
              <button
                className="modal-close"
                onClick={() => setShowShareModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              <button className="share-option" onClick={generateShareCard}>
                <span className="option-icon">🎴</span>
                <div className="option-text">
                  <div className="option-title">生成分享卡片</div>
                  <div className="option-desc">生成精美的图片卡片用于社交分享</div>
                </div>
              </button>

              <button className="share-option" onClick={generateShareCard}>
                <span className="option-icon">🖼️</span>
                <div className="option-text">
                  <div className="option-title">生成海报</div>
                  <div className="option-desc">生成详细的工作流海报</div>
                </div>
              </button>

              <button className="share-option" onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                alert('链接已复制到剪贴板！')
              }}>
                <span className="option-icon">🔗</span>
                <div className="option-text">
                  <div className="option-title">复制链接</div>
                  <div className="option-desc">复制当前页面链接</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
