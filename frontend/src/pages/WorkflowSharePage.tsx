import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui/Toast'
import { useConfirm } from '../components/ui/ConfirmDialog'
import {
  getWorkflowDetail,
  favoriteWorkflow,
  unfavoriteWorkflow,
  checkIsFavorited,
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
  userId?: string // 用户ID
  status?: string // 状态
  visibility?: string // 可见性
  updatedAt?: string // 更新时间
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
  const { showToast } = useToast()
  const { showConfirm } = useConfirm()

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

      const data = await getWorkflowDetail(id) as any

      // 处理 tags: 如果是字符串，转换为数组
      const processedData: Workflow = { ...data }
      if (typeof data.tags === 'string') {
        processedData.tags = data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      }

      setWorkflow(processedData)

      // 检查是否已收藏（只对真实工作流检查）
      try {
        const favorited = await checkIsFavorited(id)
        setIsFavorited(favorited)
      } catch (error) {
        console.warn('检查收藏状态失败:', error)
      }

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

    // 检查是否登录
    const token = localStorage.getItem('token')
    if (!token) {
      const shouldLogin = await showConfirm({ message: '收藏功能需要登录，是否前往登录？' })
      if (shouldLogin) {
        navigate('/login')
      }
      return
    }

    try {
      if (isFavorited) {
        await unfavoriteWorkflow(id)
        setIsFavorited(false)
        // 使用原生提示而不是alert，体验更好
        const notification = document.createElement('div')
        notification.className = 'success-notification'
        notification.textContent = '已取消收藏'
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 2000)
      } else {
        await favoriteWorkflow(id)
        setIsFavorited(true)
        const notification = document.createElement('div')
        notification.className = 'success-notification'
        notification.textContent = '✓ 收藏成功'
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 2000)
      }
    } catch (error: any) {
      console.error('收藏操作失败:', error)
      const errorMsg = error.response?.data?.error || '操作失败，请重试'
      showToast(errorMsg, 'error')
    }
  }

  const handleClone = async () => {
    if (!id) return

    // 检查是否登录
    const token = localStorage.getItem('token')
    if (!token) {
      const shouldLogin = await showConfirm({ message: '添加到工作台需要登录，是否前往登录？' })
      if (shouldLogin) {
        navigate('/login')
      }
      return
    }

    try {
      console.log('🚀 [WorkflowSharePage] 开始克隆工作流，ID:', id)
      const result = await cloneWorkflow(id)
      console.log('✅ [WorkflowSharePage] 克隆成功，返回结果:', result)

      // 将克隆的工作流ID存储到localStorage，以便工作区能自动添加到画布
      localStorage.setItem('newlyClonedWorkflowId', result.workflow.id)
      console.log('📝 [WorkflowSharePage] 已设置localStorage标记:', result.workflow.id)
      console.log('🔍 [WorkflowSharePage] 验证标记:', localStorage.getItem('newlyClonedWorkflowId'))

      // 直接跳转到工作台
      console.log('🔄 [WorkflowSharePage] 克隆成功，直接跳转到工作台...')
      console.log('📌 [WorkflowSharePage] 跳转前最后确认标记:', localStorage.getItem('newlyClonedWorkflowId'))
      navigate('/workspace')
    } catch (error: any) {
      console.error('添加到工作台失败:', error)
      const errorMsg = error.response?.data?.error || '操作失败，请重试'
      showToast(`添加失败：${errorMsg}`, 'error')
    }
  }

  const handleShare = () => {
    setShowShareModal(true)
  }

  const generateShareCard = () => {
    // 生成分享文案
    const shareText = `【推荐工作流】${workflow?.title}\n\n${workflow?.description}\n\n查看详情：${window.location.href}`

    // 复制到剪贴板
    navigator.clipboard.writeText(shareText).then(() => {
      showToast('分享文案已复制到剪贴板！您可以粘贴到任何地方进行分享。', 'success')
      setShowShareModal(false)
    }).catch(() => {
      showToast('复制失败，请手动复制链接', 'error')
    })
  }

  const downloadAsImage = async () => {
    showToast('生成海报功能开发中，将支持自动生成精美的工作流海报、包含步骤预览和二维码、适合社交媒体分享', 'info')
    setShowShareModal(false)
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

  const nodes = Array.isArray(workflow.config?.nodes) ? workflow.config.nodes : []

  console.log('=== WorkflowSharePage Debug ===')
  console.log('Workflow:', workflow)
  console.log('Nodes count:', nodes.length)
  console.log('Nodes:', nodes)

  return (
    <div className="workflow-share-page-douban">
      <div className="douban-workflow-container">
        {/* 返回按钮 */}
        <button className="douban-back-button" onClick={() => navigate('/explore')}>
          ← 返回探索
        </button>

        {/* 工作流卡片 */}
        <div className="douban-workflow-card">
          {/* 标题 */}
          <h1 className="douban-workflow-title">{workflow.title}</h1>

          {/* 作者和统计信息 */}
          <div className="douban-workflow-meta">
            <div className="douban-author-info">
              <span className="douban-author-avatar">
                {workflow.author?.name?.[0] || '匿名'[0]}
              </span>
              <span className="douban-author-name">{workflow.author?.name || '匿名'}</span>
            </div>
            {workflow.rating && (
              <>
                <span className="douban-meta-divider">·</span>
                <span className="douban-rating">
                  ★ {workflow.rating.toFixed(1)}
                </span>
              </>
            )}
            <span className="douban-meta-divider">·</span>
            <span className="douban-meta-text">{workflow._count?.ratings || 0} 条评价</span>
            <span className="douban-meta-divider">·</span>
            <span className="douban-meta-text">{workflow._count?.executions || 0} 次使用</span>
          </div>

          {/* 描述 */}
          {workflow.description && (
            <p className="douban-workflow-description">{workflow.description}</p>
          )}

          {/* 原文链接 */}
          {workflow.sourceUrl && (
            <div className="douban-source-link">
              <span className="source-label">原文链接：</span>
              <a
                href={workflow.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="douban-link"
              >
                {workflow.sourceTitle || workflow.sourceUrl}
              </a>
            </div>
          )}

          {/* 标签 */}
          {workflow.tags && Array.isArray(workflow.tags) && workflow.tags.length > 0 && (
            <div className="douban-tags">
              {workflow.tags.map((tag, index) => (
                <span key={index} className="douban-tag">{tag}</span>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="douban-workflow-actions">
            <button
              className="douban-action-btn primary"
              onClick={handleClone}
            >
              + 添加到工作台
            </button>
            <button
              className={`douban-action-btn ${isFavorited ? 'favorited' : ''}`}
              onClick={handleFavorite}
            >
              {isFavorited ? '★ 已收藏' : '☆ 收藏'}
            </button>
            <button
              className="douban-action-btn"
              onClick={handleShare}
            >
              分享
            </button>
          </div>
        </div>

        {/* 操作步骤 */}
        <div className="douban-workflow-steps">
          <h3 className="douban-section-title">操作步骤</h3>
          {groupStepsByModel(nodes).map((group, groupIndex) => {
            const firstNode = group[0]
            return (
              <div key={`group-${groupIndex}`} className="douban-step-group">
                {group.map((node, indexInGroup) => (
                  <div key={node.id} className="douban-step-item">
                    <div className="douban-step-number">步骤 {node.originalIndex + 1}</div>
                    <div className="douban-step-content">
                      <h4 className="douban-step-title">
                        {node.config?.goal || node.label || '未命名'}
                      </h4>
                      <p className="douban-step-desc">
                        {node.config?.prompt || node.config?.description || ''}
                      </p>
                    </div>
                  </div>
                ))}

                {/* 模型信息 */}
                {(firstNode.config?.provider || firstNode.config?.model) && (
                  <div className="douban-step-footer">
                    <span className="douban-footer-label">使用模型：</span>
                    {firstNode.config?.provider && (
                      <span className="douban-model-badge">
                        {firstNode.config.provider}
                      </span>
                    )}
                    {firstNode.config?.model && (
                      <span className="douban-model-badge">
                        {firstNode.config.model}
                      </span>
                    )}
                    <a
                      href={getModelLink(firstNode)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="douban-try-link"
                    >
                      去试试 →
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 讨论区 */}
        <div className="douban-workflow-discussion">
          <h3 className="douban-section-title">讨论</h3>
          <div className="douban-discussion-placeholder">
            <p>暂无讨论</p>
            <p className="placeholder-hint">讨论功能开发中...</p>
          </div>
        </div>
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
                <span className="option-icon">📝</span>
                <div className="option-text">
                  <div className="option-title">复制分享文案</div>
                  <div className="option-desc">生成包含标题、描述和链接的分享文案</div>
                </div>
              </button>

              <button className="share-option" onClick={downloadAsImage}>
                <span className="option-icon">🖼️</span>
                <div className="option-text">
                  <div className="option-title">生成分享海报</div>
                  <div className="option-desc">生成精美的工作流海报（开发中）</div>
                </div>
              </button>

              <button className="share-option" onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                const notification = document.createElement('div')
                notification.className = 'success-notification'
                notification.textContent = '✓ 链接已复制'
                document.body.appendChild(notification)
                setTimeout(() => notification.remove(), 2000)
                setShowShareModal(false)
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
