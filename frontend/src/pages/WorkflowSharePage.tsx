import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

// 生成假工作流数据
function generateFakeWorkflowData(fakeId: string): Workflow {
  // 解析假ID获取工作包和工作项信息
  // 格式: fake-pkg-1-item-1
  const match = fakeId.match(/fake-(.*)-item-(\d+)/)
  const packageId = match?.[1] || 'pkg-1'
  const itemId = parseInt(match?.[2] || '1')

  // 根据不同的工作项生成不同的内容
  const workflowTemplates: Record<string, any> = {
    'fake-pkg-1-item-1': {
      title: '热点选题挖掘',
      description: '实时追踪热点，挖掘高流量选题方向，帮助你快速发现爆款内容机会',
      nodes: [
        {
          id: 'step1',
          type: 'llm',
          label: '全网热点监测',
          config: {
            goal: '实时监测全网热点话题',
            provider: 'OpenAI',
            model: 'GPT-4',
            prompt: '请帮我分析当前全网（微博、抖音、小红书、知乎）的热点话题。要求：\n1. 列出TOP10热门话题\n2. 分析每个话题的热度趋势\n3. 评估话题的持续时间\n4. 给出内容创作建议'
          }
        },
        {
          id: 'step2',
          type: 'llm',
          label: '用户需求分析',
          config: {
            goal: '深度挖掘用户痛点和需求',
            provider: 'Anthropic',
            model: 'Claude-3.5-Sonnet',
            prompt: '基于热点话题，分析目标用户的核心需求和痛点。要求：\n1. 用户画像描述\n2. 核心痛点TOP5\n3. 期望解决方案\n4. 内容消费习惯'
          }
        },
        {
          id: 'step3',
          type: 'llm',
          label: '选题方向推荐',
          config: {
            goal: '生成高潜力选题方向',
            provider: 'OpenAI',
            model: 'GPT-4',
            prompt: '综合热点分析和用户需求，推荐5个具体的选题方向。每个选题包含：\n1. 选题标题\n2. 流量潜力评分（1-10分）\n3. 竞争难度评估\n4. 内容角度建议\n5. 最佳发布时间'
          }
        }
      ],
      tags: ['选题挖掘', '热点分析', '内容创作', 'AI辅助'],
      author: { name: 'AI工作流大师', avatar: '👨‍💼' },
      rating: 4.9,
      _count: { ratings: 256, executions: 1520 }
    },
    'fake-pkg-1-item-2': {
      title: '爆款标题生成',
      description: '一键生成10+吸睛标题，提升点击率，让你的内容脱颖而出',
      nodes: [
        {
          id: 'step1',
          type: 'llm',
          label: '标题模板分析',
          config: {
            goal: '分析爆款标题的成功模式',
            provider: 'OpenAI',
            model: 'GPT-4',
            prompt: '请分析以下内容主题，提取适用的爆款标题模板类型：\n1. 悬念式标题\n2. 数字型标题\n3. 问题式标题\n4. 对比式标题\n5. 痛点式标题\n\n为每种类型提供适配该主题的具体模板。'
          }
        },
        {
          id: 'step2',
          type: 'llm',
          label: '批量标题生成',
          config: {
            goal: '生成多个标题候选',
            provider: 'OpenAI',
            model: 'GPT-4',
            prompt: '基于标题模板，为该内容生成15个标题候选。要求：\n1. 覆盖5种不同类型\n2. 每个标题20-30字\n3. 包含关键词\n4. 具有吸引力和争议性\n5. 符合平台规范'
          }
        },
        {
          id: 'step3',
          type: 'llm',
          label: '标题优化评分',
          config: {
            goal: '评估和优化标题质量',
            provider: 'Anthropic',
            model: 'Claude-3.5-Sonnet',
            prompt: '对生成的标题进行评分和优化。评分维度：\n1. 吸引力（1-10分）\n2. 清晰度（1-10分）\n3. 相关度（1-10分）\n4. 点击率预估\n\n为TOP10标题提供优化建议。'
          }
        }
      ],
      tags: ['标题生成', '点击率优化', '内容营销', 'AI写作'],
      author: { name: 'AI工作流大师', avatar: '👨‍💼' },
      rating: 4.8,
      _count: { ratings: 342, executions: 2180 }
    },
    'fake-pkg-1-item-3': {
      title: '长文章智能创作',
      description: '自动生成结构完整、逻辑清晰的长文，支持多平台风格适配',
      nodes: [
        {
          id: 'step1',
          type: 'llm',
          label: '文章大纲设计',
          config: {
            goal: '构建文章结构框架',
            provider: 'Anthropic',
            model: 'Claude-3.5-Sonnet',
            prompt: '根据选题和标题，设计文章大纲。要求：\n1. 开头：3种引入方式（故事/数据/问题）\n2. 正文：5-7个核心要点\n3. 每个要点的子论点\n4. 结尾：总结+行动建议\n5. 预估字数分配'
          }
        },
        {
          id: 'step2',
          type: 'llm',
          label: '内容撰写',
          config: {
            goal: '按大纲生成完整内容',
            provider: 'OpenAI',
            model: 'GPT-4',
            prompt: '根据大纲，撰写完整文章。要求：\n1. 总字数2000-3000字\n2. 语言通俗易懂\n3. 观点有理有据\n4. 包含案例和数据\n5. 段落层次清晰'
          }
        },
        {
          id: 'step3',
          type: 'llm',
          label: '内容润色优化',
          config: {
            goal: '提升文章可读性和吸引力',
            provider: 'Anthropic',
            model: 'Claude-3.5-Sonnet',
            prompt: '对文章进行润色优化：\n1. 检查语言流畅度\n2. 优化过渡衔接\n3. 增强表达力\n4. 添加金句\n5. 检查错别字'
          }
        },
        {
          id: 'step4',
          type: 'llm',
          label: 'SEO关键词植入',
          config: {
            goal: '优化搜索引擎排名',
            provider: 'OpenAI',
            model: 'GPT-3.5-Turbo',
            prompt: '在文章中自然植入SEO关键词：\n1. 提取核心关键词\n2. 分析关键词密度\n3. 自然融入文章\n4. 优化标题和小标题\n5. 生成meta描述'
          }
        }
      ],
      tags: ['长文创作', 'SEO优化', '内容写作', 'AI助手'],
      author: { name: 'AI工作流大师', avatar: '👨‍💼' },
      rating: 4.9,
      _count: { ratings: 428, executions: 3240 }
    }
  }

  // 获取对应的模板，如果没有则使用默认模板
  const template = workflowTemplates[fakeId] || {
    title: '工作流演示',
    description: '这是一个工作流演示，展示完整的工作流程',
    nodes: [
      {
        id: 'step1',
        type: 'llm',
        label: '第一步',
        config: {
          goal: '完成第一个任务',
          provider: 'OpenAI',
          model: 'GPT-4',
          prompt: '这是第一步的提示词内容'
        }
      }
    ],
    tags: ['演示', 'AI工作流'],
    author: { name: 'AI工作流大师', avatar: '👨‍💼' },
    rating: 4.5,
    _count: { ratings: 100, executions: 500 }
  }

  return {
    id: fakeId,
    title: template.title,
    description: template.description,
    userId: 'fake-user',
    status: 'published' as const,
    visibility: 'public' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
    config: {
      nodes: template.nodes
    },
    tags: template.tags,
    author: template.author,
    rating: template.rating,
    _count: template._count
  }
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

      // 如果是假ID，生成假数据
      if (id.startsWith('fake-')) {
        console.log('检测到假ID，生成假数据')
        const fakeWorkflow = generateFakeWorkflowData(id)
        setWorkflow(fakeWorkflow)
        setLoading(false)
        return
      }

      const data = await getWorkflowDetail(id) as any
      console.log('获取到的工作流数据:', data)

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

    // 如果是假ID（演示工作流），显示提示
    if (id.startsWith('fake-')) {
      alert('这是演示工作流 🎬\n\n演示工作流仅用于预览，无法收藏。\n\n请浏览其他真实的工作流进行收藏！')
      return
    }

    // 检查是否登录
    const token = localStorage.getItem('token')
    if (!token) {
      const shouldLogin = window.confirm('收藏功能需要登录，是否前往登录？')
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
      alert(errorMsg)
    }
  }

  const handleClone = async () => {
    if (!id) return

    // 如果是假ID（演示工作流），显示提示
    if (id.startsWith('fake-')) {
      alert('这是演示工作流 🎬\n\n演示工作流仅用于预览，无法添加到工作台。\n\n请浏览其他真实的工作流进行添加！')
      return
    }

    // 检查是否登录
    const token = localStorage.getItem('token')
    if (!token) {
      const shouldLogin = window.confirm('添加到工作台需要登录，是否前往登录？')
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
      alert(`添加失败：${errorMsg}`)
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
      alert('分享文案已复制到剪贴板！\n\n您可以粘贴到任何地方进行分享。')
      setShowShareModal(false)
    }).catch(() => {
      alert('复制失败，请手动复制链接')
    })
  }

  const downloadAsImage = async () => {
    alert('生成海报功能开发中...\n\n将支持：\n- 自动生成精美的工作流海报\n- 包含步骤预览和二维码\n- 适合社交媒体分享')
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
    <div className="workflow-share-page-douban">
      <div className="douban-workflow-container">
        {/* 返回按钮 */}
        <button className="douban-back-button" onClick={() => navigate('/explore')}>
          ← 返回探索
        </button>

        {/* 工作流卡片 */}
        <div className="douban-workflow-card">
          {/* 演示工作流标记 */}
          {id?.startsWith('fake-') && (
            <div className="demo-badge">
              🎬 演示工作流（仅供预览）
            </div>
          )}

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
