import { useEffect, useMemo, useRef, useState } from 'react'
import { Send, Loader2, Sparkles, Bot, User, Plus, Play, X, FileText, Image, Download } from 'lucide-react'
import type { ChatMessage, AIModel, AIProvider } from '../types/ai'

type WorkflowCard = {
  id: string
  title: string
  description: string
  category: string
  author?: string
}

type ExecutionResult =
  | { type: 'text'; content: string }
  | { type: 'image'; content: string; caption?: string }

const baseWorkflows: WorkflowCard[] = [
  {
    id: 'wf-animated-image',
    title: '编辑动画图片',
    description: '为静态图片添加动画效果，输出 GIF 或视频。',
    category: '图像处理',
    author: '张小明'
  },
  {
    id: 'wf-article',
    title: '文章生成器',
    description: '根据主题自动生成结构完整的文章。',
    category: '内容创作',
    author: '李华'
  },
  {
    id: 'wf-image',
    title: '图片生成器',
    description: '使用 AI 快速生成灵感图或产品图。',
    category: '图像处理',
    author: '王小红'
  }
]

const recommended: WorkflowCard[] = [
  {
    id: 'wf-email',
    title: '营销邮件助手',
    description: '快速写出个性化营销邮件，提高转化率。',
    category: '营销推广'
  },
  {
    id: 'wf-analysis',
    title: '数据洞察分析',
    description: '根据报表快速生成分析结论与策略建议。',
    category: '数据分析'
  }
]

const defaultModel: { provider: AIProvider; model: AIModel } = {
  provider: 'openai',
  model: {
    modelId: 'gpt-3.5-turbo',
    modelName: 'ChatGPT',
    description: 'OpenAI GPT-3.5 Turbo',
    inputPrice: 0.5,
    outputPrice: 1.5,
    category: 'text',
    maxTokens: 16385
  }
}

export function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workflows, setWorkflows] = useState<WorkflowCard[]>(baseWorkflows)
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowCard | null>(baseWorkflows[0] ?? null)
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [model] = useState(defaultModel)

  const recommendedWorkflows = useMemo(() => recommended, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim()) {
      return
    }

    const userMessage: ChatMessage = { role: 'user', content: inputValue.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setLoading(true)
    setError(null)

    setTimeout(() => {
      const reply: ChatMessage = {
        role: 'assistant',
        content: `好的，我已记录您的需求：「${userMessage.content}」。\n\n建议尝试 ${
          selectedWorkflow?.title ?? '任意一个工作流'
        }。`
      }
      setMessages((prev) => [...prev, reply])
      setLoading(false)
    }, 800)
  }

  const handleAddWorkflow = (workflow: WorkflowCard) => {
    setWorkflows((prev) => {
      if (prev.find((wf) => wf.id === workflow.id)) {
        return prev
      }
      return [...prev, workflow]
    })
    setSelectedWorkflow(workflow)
    setShowLibrary(false)
  }

  const handleExecuteWorkflow = () => {
    if (!selectedWorkflow || isExecuting) return
    setIsExecuting(true)
    setExecutionResults([])

    setTimeout(() => {
      const result: ExecutionResult[] = [
        {
          type: 'text',
          content: `工作流「${selectedWorkflow.title}」已完成。\n\n输出内容基于最近一次对话的需求。`
        }
      ]

      if (selectedWorkflow.category.includes('图像')) {
        result.push({
          type: 'image',
          content: `https://picsum.photos/seed/${selectedWorkflow.id}-${Date.now()}/600/360`,
          caption: '示例图片结果'
        })
      }

      setExecutionResults(result)
      setIsExecuting(false)
    }, 1200)
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">AI 工作台</h1>
          <p className="text-xs text-slate-500">
            使用 {model.model.modelName} （{model.provider}）协助完成任务
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:text-violet-600"
          onClick={() => setShowLibrary((prev) => !prev)}
        >
          <Sparkles className="h-4 w-4 text-violet-500" />
          浏览推荐工作流
        </button>
      </header>

      <main className="grid flex-1 gap-4 overflow-hidden px-4 pb-4 pt-3 lg:grid-cols-[1.05fr_1fr_1fr]">
        {/* 会话面板 */}
        <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">AI 对话</h2>
              <p className="text-xs text-slate-500">输入需求获取建议</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMessages([])
                setExecutionResults([])
                setError(null)
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
              title="清空对话"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                <Bot className="h-8 w-8 text-violet-500" />
                <p className="font-medium text-slate-800">还没有对话，尝试告诉我你的需求</p>
              </div>
            )}

            {messages.map((message, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  {message.role === 'user' ? (
                    <>
                      <User className="h-3.5 w-3.5 text-violet-600" />
                      <span>我</span>
                    </>
                  ) : (
                    <>
                      <Bot className="h-3.5 w-3.5 text-indigo-600" />
                      <span>AI 助手</span>
                    </>
                  )}
                </div>
                <div
                  className={`inline-block max-w-[90%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow ${
                    message.role === 'user'
                      ? 'bg-violet-500 text-white shadow-violet-400/60'
                      : 'bg-slate-100 text-slate-800 shadow-slate-200'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs text-violet-600">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                正在思考...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="mx-5 mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
              {error}
            </div>
          )}

          <footer className="border-t border-slate-200 px-5 py-3">
            <div className="flex items-end gap-2">
              <textarea
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                rows={2}
                placeholder="描述你想完成的任务..."
                className="h-[72px] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !inputValue.trim()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow transition hover:from-violet-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </footer>
        </section>

        {/* 工作流工具箱 */}
        <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">工作流工具箱</h2>
              <p className="text-xs text-slate-500">选择后即可执行</p>
            </div>
            <button
              type="button"
              onClick={() => setShowLibrary(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
            >
              <Plus className="h-4 w-4" />
              添加
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {workflows.map((workflow) => {
              const active = selectedWorkflow?.id === workflow.id
              return (
                <article
                  key={workflow.id}
                  className={`rounded-xl border px-4 py-3 text-sm transition hover:shadow ${
                    active ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <header className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{workflow.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">{workflow.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWorkflows((prev) => prev.filter((wf) => wf.id !== workflow.id))}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-100 hover:text-rose-500"
                      title="移除"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </header>
                  <footer className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{workflow.category}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedWorkflow(workflow)}
                      className="text-indigo-600 transition hover:text-indigo-500"
                    >
                      {active ? '已选中' : '设为当前'}
                    </button>
                  </footer>
                </article>
              )
            })}

            {workflows.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                <Sparkles className="h-8 w-8 text-indigo-500" />
                <p className="font-medium text-slate-800">还没有工作流，点击上方按钮添加</p>
              </div>
            )}
          </div>

          <footer className="border-t border-slate-200 px-5 py-3">
            <button
              type="button"
              onClick={handleExecuteWorkflow}
              disabled={!selectedWorkflow || isExecuting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow transition hover:from-indigo-600 hover:to-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isExecuting ? '执行中...' : selectedWorkflow ? '执行工作流' : '选择工作流'}
            </button>
          </footer>
        </section>

        {/* 执行结果 */}
        <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">执行结果</h2>
            <p className="text-xs text-slate-500">查看生成的内容</p>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {executionResults.length === 0 && !isExecuting && (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                <FileText className="h-8 w-8 text-emerald-500" />
                <p className="font-medium text-slate-800">执行结果会显示在这里</p>
              </div>
            )}

            {isExecuting && (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-600">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                正在执行工作流...
              </div>
            )}

            {executionResults.map((result, idx) => {
              if (result.type === 'text') {
                return (
                  <article
                    key={`text-${idx}`}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <header className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <FileText className="h-4 w-4 text-emerald-500" />
                      文本结果
                    </header>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{result.content}</p>
                  </article>
                )
              }

              return (
                <article
                  key={`image-${idx}`}
                  className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <header className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Image className="h-4 w-4 text-emerald-500" />
                    图片结果
                  </header>
                  <img src={result.content} alt={result.caption ?? '生成结果'} className="w-full rounded-lg border" />
                  {result.caption && <p className="text-xs text-slate-500">{result.caption}</p>}
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-300"
                  >
                    <Download className="h-3.5 w-3.5" />
                    下载图片
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      </main>

      {/* 推荐工作流抽屉 */}
      {showLibrary && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">推荐工作流</h3>
                <p className="text-xs text-slate-500">点击即可添加到工具箱</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLibrary(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="grid max-h-[60vh] gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
              {recommendedWorkflows.map((workflow) => (
                <button
                  key={workflow.id}
                  type="button"
                  onClick={() => handleAddWorkflow(workflow)}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-900">{workflow.title}</h4>
                      <span className="text-[10px] font-semibold text-violet-500">{workflow.category}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{workflow.description}</p>
                  </div>
                  {workflow.author && (
                    <p className="text-[11px] text-slate-400">推荐人：{workflow.author}</p>
                  )}
                  <span className="inline-flex items-center gap-1 self-start rounded-full bg-violet-50 px-3 py-1 text-[10px] font-medium text-violet-600">
                    <Sparkles className="h-3 w-3" />
                    点击添加
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIChatPage

