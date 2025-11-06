import { useCallback, useMemo, useState } from 'react'
import WorkflowEditor, {
  type WorkflowEditorEdge,
  type WorkflowEditorNode,
  type WorkflowEditorState
} from '../components/WorkflowEditor/WorkflowEditor'
import type { WorkflowEdge, WorkflowNode as StoredWorkflowNode } from '../types/workflow'
import { CustomNodeData, CustomNodeType } from '../components/WorkflowEditor/nodes/CustomNode'
import { api } from '../services/api'

interface WorkflowConfig {
  nodes: StoredWorkflowNode[]
  edges: WorkflowEdge[]
}

interface WorkflowMeta {
  title: string
  description: string
}

interface ParsedStep {
  title: string
  description: string
}

interface GenerateResult {
  config: WorkflowConfig
  meta: WorkflowMeta
  runContext: string
  info?: {
    analysisTitle?: string
    stepsExtracted?: number
    tags?: string[]
  }
}

interface RunStepResult {
  id: string
  label: string
  type: CustomNodeType
  output: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const snippet = (value: string, max = 160) => {
  const text = value.trim()
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

const normalizeLine = (line: string) => line.replace(/\s+/g, ' ').trim()

const parseArticleSteps = (rawArticle: string): ParsedStep[] => {
  const lines = rawArticle
    .split(/\n+/)
    .map((line) => normalizeLine(line))
    .filter(Boolean)

  const steps: ParsedStep[] = []
  let draftStep: ParsedStep | null = null

  const flushDraft = () => {
    if (!draftStep) return
    const title = draftStep.title || `步骤 ${steps.length + 1}`
    steps.push({
      title: title.slice(0, 60),
      description: draftStep.description.trim()
    })
    draftStep = null
  }

  for (const line of lines) {
    const numberedMatch = line.match(/^(\d+)[\.\、\)]\s*(.+)$/)
    const bulletMatch = line.match(/^[\-\*\•]\s+(.+)$/)
    const zhStepMatch = line.match(/^第([一二三四五六七八九十百千万]+)步[:：\s]+(.+)$/)

    if (numberedMatch || bulletMatch || zhStepMatch) {
      flushDraft()
      const titleCandidate =
        numberedMatch?.[2] ?? bulletMatch?.[1] ?? zhStepMatch?.[2] ?? `步骤 ${steps.length + 1}`
      draftStep = {
        title: normalizeLine(titleCandidate),
        description: ''
      }
      continue
    }

    // Treat headings as new steps when they are short.
    if (line.length <= 40 && /[：:；;]$/.test(line)) {
      flushDraft()
      draftStep = {
        title: line.replace(/[：:；;]$/, ''),
        description: ''
      }
      continue
    }

    if (!draftStep) {
      draftStep = {
        title: line.length <= 40 ? line : `步骤 ${steps.length + 1}`,
        description: line.length <= 40 ? '' : line
      }
      if (line.length <= 40) {
        continue
      }
    } else {
      draftStep.description = draftStep.description
        ? `${draftStep.description}\n${line}`
        : line
    }
  }

  flushDraft()

  if (steps.length === 0) {
    const paragraphs = rawArticle
      .split(/\n{2,}/)
      .map((paragraph) => normalizeLine(paragraph))
      .filter(Boolean)

    return paragraphs.slice(0, 4).map((para, index) => ({
      title: `步骤 ${index + 1}`,
      description: para
    }))
  }

  return steps.slice(0, 8)
}

const detectNodeType = (step: ParsedStep, index: number): CustomNodeType => {
  const text = `${step.title} ${step.description}`.toLowerCase()
  if (text.includes('判断') || text.includes('if') || text.includes('条件')) {
    return 'condition'
  }
  if (text.includes('工具') || text.includes('检索') || text.includes('抓取')) {
    return 'tool'
  }
  if (text.includes('输出') || text.includes('结果') || text.includes('展示')) {
    return index % 2 === 0 ? 'llm' : 'tool'
  }
  return index % 2 === 0 ? 'llm' : 'tool'
}

const buildWorkflowFromArticle = (article: string): GenerateResult => {
  const cleanedArticle = article.trim()
  const steps = parseArticleSteps(cleanedArticle)

  const articleTitleCandidate =
    cleanedArticle.split('\n').find((line) => normalizeLine(line).length > 0) ?? '文章工作流'
  const workflowTitle = snippet(normalizeLine(articleTitleCandidate), 32)

  const summary = steps
    .map((step, index) => `${index + 1}. ${step.title}`)
    .slice(0, 5)
    .join(' / ')

  const nodes: StoredWorkflowNode[] = []
  const edges: WorkflowEdge[] = []

  nodes.push({
    id: 'input-1',
    type: 'input',
    label: '文章输入',
    position: { x: 160, y: 60 },
    config: {
      placeholder: '在这里传入文章内容或核心字段'
    }
  })

  let previousNodeId = 'input-1'

  steps.forEach((step, index) => {
    const type = detectNodeType(step, index)
    const nodeId = `step-${index + 1}`
    const position = {
      x: 160 + ((index % 2) === 0 ? 0 : 260),
      y: 180 + index * 140
    }

    const nodeConfig: Record<string, unknown> = (() => {
      if (type === 'llm') {
        return {
          model: 'gpt-4o-mini',
          prompt: `根据文章内容执行「${step.title}」这一步。\n\n${snippet(step.description || '请结合文章上下文完成本步骤。', 240)}`
        }
      }
      if (type === 'tool') {
        return {
          toolName: step.title,
          parameters: {
            note: snippet(step.description || '无额外说明', 160)
          }
        }
      }
      if (type === 'condition') {
        return {
          condition: snippet(step.description || `检查 ${step.title}`, 160),
          trueOutput: '继续执行',
          falseOutput: '结束流程'
        }
      }
      return {}
    })()

    nodes.push({
      id: nodeId,
      type,
      label: step.title,
      position,
      config: nodeConfig
    })

    edges.push({
      id: `${previousNodeId}-${nodeId}`,
      source: previousNodeId,
      target: nodeId
    })

    previousNodeId = nodeId
  })

  nodes.push({
    id: 'output-1',
    type: 'output',
    label: '结果输出',
    position: {
      x: 160,
      y: 180 + steps.length * 140
    },
    config: {
      format: 'markdown'
    }
  })

  edges.push({
    id: `${previousNodeId}-output-1`,
    source: previousNodeId,
    target: 'output-1'
  })

  return {
    config: { nodes, edges },
    meta: {
      title: workflowTitle || '文章工作流',
      description: summary || '根据文章提取的多步骤工作流'
    },
    runContext: cleanedArticle
  }
}

const ensureEditorNodeData = (node: WorkflowEditorNode): CustomNodeData => {
  const base: CustomNodeData = {
    type: 'input',
    label: '未命名节点',
    config: {}
  }
  return {
    ...base,
    ...((node.data as Partial<CustomNodeData> | undefined) ?? {})
  }
}

const workflowConfigToEditorState = (config: WorkflowConfig) => {
  const nodes: WorkflowEditorNode[] = config.nodes.map((node) => ({
    id: node.id,
    type: 'custom',
    position: node.position ?? { x: 120, y: 120 },
    data: {
      type: node.type,
      label: node.label,
      config: node.config ?? {}
    }
  }))

  const edges: WorkflowEditorEdge[] = config.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle
  }))

  return { nodes, edges }
}

const editorStateToWorkflowConfig = (state: WorkflowEditorState): WorkflowConfig => ({
  nodes: state.nodes.map((node) => {
    const data = ensureEditorNodeData(node)
    return {
      id: node.id,
      type: data.type,
      label: data.label,
      position: node.position ?? { x: 0, y: 0 },
      config: data.config ?? {}
    }
  }),
  edges: state.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle
  }))
})

const simulateWorkflowRun = (config: WorkflowConfig, article: string) => {
  const sortedNodes = [...config.nodes].sort(
    (a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0)
  )

  let context = article.trim() || '（未提供文章内容，使用占位示例。）'
  const steps: RunStepResult[] = []

  for (const node of sortedNodes) {
    const type = node.type as CustomNodeType
    let output = context

    switch (type) {
      case 'input':
        output = `输入数据预览：\n${snippet(context, 220)}`
        context = context || output
        break
      case 'llm': {
        const prompt = typeof node.config?.prompt === 'string' ? node.config.prompt : node.label
        output = `【LLM 模拟执行：${node.label}】\n`
        output += `意图提示：${snippet(prompt || '请补充提示内容。', 120)}\n`
        output += `生成结果：${snippet(context, 240)}`
        context = output
        break
      }
      case 'tool': {
        const toolName =
          typeof node.config?.toolName === 'string' && node.config.toolName
            ? node.config.toolName
            : node.label
        output = `工具「${toolName}」完成处理。\n关键输入：${snippet(context, 200)}`
        const note =
          typeof node.config?.parameters?.note === 'string'
            ? node.config.parameters.note
            : ''
        if (note) {
          output += `\n附加说明：${snippet(note, 120)}`
        }
        context = output
        break
      }
      case 'condition': {
        const conditionText =
          (typeof node.config?.condition === 'string' && node.config.condition) ||
          node.label
        const conditionMet = context.length % 2 === 0
        output = `条件判断「${conditionText}」结果：${conditionMet ? '满足' : '不满足'}`
        output += `，将${conditionMet ? '继续执行后续步骤' : '保持当前结果' }。`
        context = conditionMet ? `${context}\n【通过：${conditionText}】` : context
        break
      }
      case 'output': {
        const format = typeof node.config?.format === 'string' ? node.config.format : 'text'
        output = `最终输出 (${format})：\n${snippet(context, 400)}`
        context = output
        break
      }
      default:
        output = snippet(context, 180)
    }

    steps.push({
      id: node.id,
      label: node.label,
      type,
      output
    })
  }

  const finalOutput = steps[steps.length - 1]?.output ?? snippet(context, 400)
  return { steps, finalOutput }
}

export default function ArticleWorkflowMVPPage() {
  const [articleDraft, setArticleDraft] = useState('')
  const [generateError, setGenerateError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const [workflowMeta, setWorkflowMeta] = useState<WorkflowMeta>({
    title: '',
    description: ''
  })
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig | null>(null)
  const [editorNodes, setEditorNodes] = useState<WorkflowEditorNode[] | undefined>()
  const [editorEdges, setEditorEdges] = useState<WorkflowEditorEdge[] | undefined>()
  const [runContext, setRunContext] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [saveMessage, setSaveMessage] = useState('')
  const [savedWorkflowId, setSavedWorkflowId] = useState<string | null>(null)

  const [isRunning, setIsRunning] = useState(false)
  const [runResults, setRunResults] = useState<RunStepResult[]>([])
  const [runError, setRunError] = useState('')
  const [finalOutput, setFinalOutput] = useState('')
  const [generationInfo, setGenerationInfo] = useState<GenerateResult['info']>()

  const workflowSteps = useMemo(() => {
    if (!workflowConfig) return []
    return workflowConfig.nodes.filter(
      (node) => node.type !== 'input' && node.type !== 'output'
    )
  }, [workflowConfig])

  const resetRuntimeState = () => {
    setRunResults([])
    setRunError('')
    setFinalOutput('')
  }

  const isLikelyUrl = useMemo(() => {
    if (!articleDraft.trim()) return false
    try {
      const url = new URL(articleDraft.trim())
      return !!url.protocol && !!url.host
    } catch {
      return false
    }
  }, [articleDraft])

  const generateWorkflowFromBackend = useCallback(
    async (input: { url?: string; content?: string; title?: string }): Promise<GenerateResult> => {
      const attemptRequest = async (endpoint: string) => {
        const response = await api.post(endpoint, { ...input, autoSave: false })
        return response.data
      }

      try {
        const data = await attemptRequest('/api/workflows/generate/from-article')
        if (data?.config) {
          return {
            config: data.config,
            meta: {
              title: data.metadata?.title ?? data.analysis?.articleTitle ?? '文章工作流',
              description:
                data.metadata?.description ??
                `来源文章：${data.analysis?.articleTitle ?? (input.url || '直接输入')}`
            },
            runContext:
              data.analysis?.articleContent ??
              data.analysis?.articleTitle ??
              data.metadata?.description ??
              input.content ??
              `文章链接：${input.url}`,
            info: {
              analysisTitle: data.analysis?.articleTitle,
              stepsExtracted: data.analysis?.stepsExtracted,
              tags: data.analysis?.tags ?? data.metadata?.tags
            }
          }
        }

        if (data?.workflow?.config) {
          return {
            config: data.workflow.config,
            meta: {
              title: data.workflow.title ?? '文章工作流',
              description: data.workflow.description ?? `文章链接：${input.url || '直接输入'}`
            },
            runContext:
              data.analysis?.articleContent ??
              data.analysis?.articleTitle ??
              data.workflow.description ??
              input.content ??
              `文章链接：${input.url}`,
            info: {
              analysisTitle: data.analysis?.articleTitle,
              stepsExtracted: data.analysis?.stepsExtracted,
              tags: data.analysis?.tags
            }
          }
        }

        throw new Error('未获取到工作流配置')
      } catch (errorPrimary: any) {
        console.warn('智能生成失败，尝试使用模拟模式:', errorPrimary)
        try {
          const data = await attemptRequest('/api/workflows/generate/from-article-mock')
          if (data?.config ?? data?.workflow?.config) {
            const config: WorkflowConfig = data.config ?? data.workflow.config
            return {
              config,
              meta: {
                title:
                  data.metadata?.title ??
                  data.workflow?.title ??
                  `模拟工作流：${data.analysis?.articleTitle ?? (input.url || '直接输入')}`,
                description:
                  data.metadata?.description ??
                  data.workflow?.description ??
                  `来源文章：${data.analysis?.articleTitle ?? (input.url || '直接输入')}`
              },
              runContext:
                data.analysis?.articleContent ??
                data.analysis?.articleTitle ??
                data.metadata?.description ??
                input.content ??
                `文章链接：${input.url}`,
              info: {
                analysisTitle: data.analysis?.articleTitle,
                stepsExtracted: data.analysis?.stepsExtracted,
                tags: data.analysis?.tags ?? data.metadata?.tags
              }
            }
          }
          throw new Error('模拟模式也未返回工作流配置')
        } catch (fallbackError) {
          console.error('模拟模式生成失败:', fallbackError)
          throw fallbackError
        }
      }
    },
    []
  )

  const handleGenerate = async () => {
    const content = articleDraft.trim()
    if (!content) {
      setGenerateError('请先粘贴或输入文章内容')
      return
    }

    setGenerateError('')
    setIsGenerating(true)
    resetRuntimeState()

    try {
      await sleep(200)
      let result: GenerateResult

      // 统一使用后端AI生成，无论是URL还是文本
      if (isLikelyUrl) {
        // URL输入
        result = await generateWorkflowFromBackend({ url: content })
      } else {
        // 文本输入 - 提取标题（第一行）
        const lines = content.split('\n').filter(line => line.trim())
        const title = lines[0]?.trim() || '未命名文章'
        result = await generateWorkflowFromBackend({ content, title })
      }

      setWorkflowMeta(result.meta)
      setWorkflowConfig(result.config)
      const editorState = workflowConfigToEditorState(result.config)
      setEditorNodes(editorState.nodes)
      setEditorEdges(editorState.edges)
      setRunContext(result.runContext)
      setSavedWorkflowId(null)
      setSaveStatus('idle')
      setSaveMessage('')
      setGenerationInfo(result.info)
    } catch (error) {
      console.error('生成工作流失败', error)
      setGenerateError('生成工作流失败，请稍后重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditorChange = useCallback((state: WorkflowEditorState) => {
    setWorkflowConfig(editorStateToWorkflowConfig(state))
  }, [])

  const handleMetaChange = (field: keyof WorkflowMeta, value: string) => {
    setWorkflowMeta((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!workflowConfig) {
      setSaveStatus('error')
      setSaveMessage('请先生成并调整工作流')
      return
    }

    if (!workflowMeta.title.trim()) {
      setSaveStatus('error')
      setSaveMessage('工作流需要一个名称')
      return
    }

    setIsSaving(true)
    setSaveStatus('idle')
    setSaveMessage('')

    try {
      // 准备示例输出数据（如果已经运行过）
      const exampleOutput = runResults.length > 0
        ? {
            steps: runResults,
            finalOutput: finalOutput
          }
        : null

      const payload = {
        title: workflowMeta.title.trim(),
        description: workflowMeta.description.trim(),
        category: 'article-to-workflow',
        tags: ['article', 'workflow'],
        config: workflowConfig,
        isPublic: false,
        // 保存原始来源信息
        sourceType: isLikelyUrl ? 'url' : 'text',
        sourceUrl: isLikelyUrl ? articleDraft.trim() : null,
        sourceContent: !isLikelyUrl ? articleDraft.trim() : null,
        sourceTitle: generationInfo?.analysisTitle || workflowMeta.title,
        // 保存示例数据
        exampleInput: { content: runContext || articleDraft.trim() },
        exampleOutput: exampleOutput
      }

      const response = await api.post('/api/workflows', payload)
      const workflowId = response.data?.workflow?.id as string | undefined

      setSaveStatus('success')
      setSaveMessage('工作流保存成功')
      if (workflowId) {
        setSavedWorkflowId(workflowId)
      }
    } catch (error: any) {
      console.error('保存工作流失败', error)
      setSaveStatus('error')
      const detail =
        error?.response?.data?.error ??
        error?.message ??
        '保存失败，请确认已登录并稍后重试'
      setSaveMessage(detail)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRun = async () => {
    if (!workflowConfig) {
      setRunError('请先生成工作流')
      return
    }

    setIsRunning(true)
    setRunError('')
    setRunResults([])
    setFinalOutput('')

    try {
      await sleep(400)
      const simulation = simulateWorkflowRun(
        workflowConfig,
        runContext || articleDraft || workflowMeta.description
      )
      setRunResults(simulation.steps)
      setFinalOutput(simulation.finalOutput)
    } catch (error) {
      console.error('运行工作流失败', error)
      setRunError('运行失败，请重试')
    } finally {
      setIsRunning(false)
    }
  }

  const handleReset = () => {
    setArticleDraft('')
    setWorkflowConfig(null)
    setWorkflowMeta({ title: '', description: '' })
    setEditorNodes(undefined)
    setEditorEdges(undefined)
    setGenerateError('')
    setSaveStatus('idle')
    setSaveMessage('')
    setSavedWorkflowId(null)
    setRunContext('')
    resetRuntimeState()
    setGenerationInfo(undefined)
  }

  const getNodeTypeColor = (type: CustomNodeType) => {
    switch (type) {
      case 'input':
        return 'bg-emerald-100 text-emerald-700'
      case 'llm':
        return 'bg-indigo-100 text-indigo-700'
      case 'tool':
        return 'bg-sky-100 text-sky-700'
      case 'condition':
        return 'bg-amber-100 text-amber-700'
      case 'output':
        return 'bg-rose-100 text-rose-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  // 计算当前步骤
  const currentStep = !workflowConfig ? 1 : savedWorkflowId ? 4 : runResults.length > 0 ? 3 : 2

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* 步骤指示器 */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[
              { num: 1, label: '输入内容' },
              { num: 2, label: '生成预览' },
              { num: 3, label: '调整优化' },
              { num: 4, label: '保存使用' }
            ].map((step, index) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      currentStep >= step.num
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {step.num}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      currentStep >= step.num ? 'text-violet-600' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < 3 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-all ${
                      currentStep > step.num ? 'bg-violet-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <section className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">文章转工作流</h1>
            <p className="text-sm text-slate-500">
              粘贴文章内容或文章链接，AI自动分析并生成可复用的工作流程。
            </p>
          </div>

          <textarea
            value={articleDraft}
            onChange={(e) => setArticleDraft(e.target.value)}
            rows={10}
            placeholder="支持两种输入方式：&#10;1. 直接粘贴文章内容（建议包含结构化的步骤或段落）&#10;2. 粘贴文章链接，系统将自动解析内容生成工作流"
            className="w-full rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 px-4 py-3 text-sm text-slate-800"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-slate-400">
              {isLikelyUrl ? '识别到 URL，将尝试从链接生成步骤。' : `当前字数：${articleDraft.trim().length}`}
            </span>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
              >
                重置
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGenerating ? '生成中…' : '生成工作流'}
              </button>
            </div>
          </div>

          {generateError && <p className="text-sm text-rose-500">{generateError}</p>}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">基础信息</h2>
                {savedWorkflowId && (
                  <span className="text-xs text-emerald-600">
                    已保存 ID：{savedWorkflowId}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    工作流名称
                  </label>
                  <input
                    type="text"
                    value={workflowMeta.title}
                    onChange={(e) => handleMetaChange('title', e.target.value)}
                    placeholder="例如：SEO 文章生成工作流"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    工作流说明
                  </label>
                  <textarea
                    value={workflowMeta.description}
                    onChange={(e) => handleMetaChange('description', e.target.value)}
                    rows={3}
                    placeholder="简要描述工作流目标和核心步骤。"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !workflowConfig}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-950 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? '保存中…' : '保存工作流'}
                </button>
                <button
                  type="button"
                  onClick={handleRun}
                  disabled={isRunning || !workflowConfig}
                  className="px-4 py-2 rounded-lg border border-violet-200 text-violet-600 text-sm font-medium hover:bg-violet-50 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isRunning ? '运行中…' : '运行模拟'}
                </button>
              </div>

              {saveStatus !== 'idle' && (
                <div className="space-y-3">
                  <div
                    className={`text-sm ${
                      saveStatus === 'success' ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {saveMessage}
                  </div>
                  {saveStatus === 'success' && savedWorkflowId && (
                    <div className="flex flex-col gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        工作流已保存成功！
                      </div>
                      <p className="text-xs text-emerald-700">
                        您可以在"我的工作台"中查看和使用这个工作流，处理新的文章内容。
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => (window.location.href = `/workflow-intro/${savedWorkflowId}`)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
                        >
                          查看工作流详情
                        </button>
                        <button
                          type="button"
                          onClick={() => (window.location.href = '/storage')}
                          className="px-3 py-1.5 rounded-lg border border-emerald-600 text-emerald-600 text-xs font-medium hover:bg-emerald-50"
                        >
                          前往我的工作台
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3 px-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">可视化编辑</h2>
                  <p className="text-xs text-slate-400">
                    左侧工具栏可新增节点，右侧面板可配置节点参数。
                  </p>
                </div>
              </div>
              <div className="h-[540px] w-full rounded-xl overflow-hidden border border-slate-200">
                <WorkflowEditor
                  initialNodes={editorNodes}
                  initialEdges={editorEdges}
                  onWorkflowChange={handleEditorChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">模拟运行结果</h2>
              {runError && <p className="text-sm text-rose-500">{runError}</p>}
              {generationInfo?.analysisTitle && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                  来源文章：{generationInfo.analysisTitle}
                  {generationInfo.stepsExtracted != null && (
                    <span className="ml-2">
                      (提取步骤 {generationInfo.stepsExtracted} 个)
                    </span>
                  )}
                  {generationInfo.tags && generationInfo.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {generationInfo.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {runResults.length === 0 && !runError && (
                <p className="text-sm text-slate-400">
                  点击“运行模拟”即可查看每个节点的执行结果。
                </p>
              )}
              <div className="space-y-3">
                {runResults.map((step) => (
                  <div key={step.id} className="rounded-xl border border-slate-200 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${getNodeTypeColor(
                          step.type
                        )}`}
                      >
                        {step.type.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{step.label}</span>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs text-slate-600 leading-relaxed">
                      {step.output}
                    </pre>
                  </div>
                ))}
              </div>
              {finalOutput && (
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                  <h3 className="text-sm font-semibold text-violet-800 mb-2">最终输出</h3>
                  <pre className="whitespace-pre-wrap text-xs text-violet-700 leading-relaxed">
                    {finalOutput}
                  </pre>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">步骤概览</h2>
              {workflowSteps.length === 0 ? (
                <p className="text-sm text-slate-400">生成后会列出核心步骤信息。</p>
              ) : (
                <div className="space-y-3">
                  {workflowSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className="rounded-xl border border-slate-200 px-4 py-3 space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">#{index + 1}</span>
                        <span className="text-sm font-medium text-slate-700">{step.label}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        类型：{step.type.toUpperCase()}
                      </div>
                      {step.config && (
                        <pre className="whitespace-pre-wrap text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                          {JSON.stringify(step.config, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
