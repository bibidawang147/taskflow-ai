import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Send, Loader2, Play, Download, Image as ImageIcon, Video, FileText, Trash2 } from 'lucide-react'

// 执行结果类型
interface ExecutionResult {
  type: 'text' | 'image' | 'video' | 'file'
  content: string
  caption?: string
  timestamp: string
}

// 执行历史记录
interface ExecutionHistory {
  id: string
  input: string
  results: ExecutionResult[]
  timestamp: string
}

// 工作流/工具定义
interface WorkflowOrTool {
  id: string
  name: string
  summary?: string
  description?: string
  category?: string
  tags?: string[]
  model?: string // 模型产品
  prompt?: string // 原始 prompt
  systemPrompt?: string // 系统提示词
}

interface WorkflowExecutionModalProps {
  item: WorkflowOrTool
  onClose: () => void
}

const WorkflowExecutionModal: React.FC<WorkflowExecutionModalProps> = ({ item, onClose }) => {
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistory[]>([])

  // 临时修改的状态（不保存到原始数据）
  const [tempModel, setTempModel] = useState(item.model || '')
  const [tempPrompt, setTempPrompt] = useState(item.prompt || item.systemPrompt || '')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const historyEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到历史记录底部
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [executionHistory])

  // 检测是否有未保存的修改
  useEffect(() => {
    const modelChanged = tempModel !== (item.model || '')
    const promptChanged = tempPrompt !== (item.prompt || item.systemPrompt || '')
    setHasUnsavedChanges(modelChanged || promptChanged)
  }, [tempModel, tempPrompt, item])

  // 保存修改到原始数据
  const handleSaveChanges = () => {
    // 这里应该调用API保存到后端，现在只是临时保存到item对象
    // 实际应用中需要调用API: await saveWorkflowConfig(item.id, { model: tempModel, prompt: tempPrompt })
    item.model = tempModel
    if (item.systemPrompt !== undefined) {
      item.systemPrompt = tempPrompt
    } else {
      item.prompt = tempPrompt
    }
    setHasUnsavedChanges(false)
  }

  // 执行工作流（使用当前的临时配置）
  const handleExecute = async () => {
    if (!tempPrompt.trim() || isExecuting) return

    setIsExecuting(true)
    const currentPrompt = tempPrompt

    // 模拟执行延迟
    setTimeout(() => {
      // 模拟生成多种类型的结果（使用当前的临时配置）
      const mockResults: ExecutionResult[] = [
        {
          type: 'text',
          content: `工作流执行完成！\n\n使用模型: ${tempModel || '未指定'}\n执行 Prompt: "${currentPrompt.substring(0, 100)}${currentPrompt.length > 100 ? '...' : ''}"\n\n已成功处理您的请求。`,
          timestamp: new Date().toISOString()
        }
      ]

      // 根据输入内容决定返回什么类型的结果
      if (currentPrompt.includes('图片') || currentPrompt.includes('图像') || currentPrompt.includes('生成')) {
        mockResults.push({
          type: 'image',
          content: `https://picsum.photos/seed/${Date.now()}/800/600`,
          caption: '生成的示例图片',
          timestamp: new Date().toISOString()
        })
      }

      if (currentPrompt.includes('视频')) {
        mockResults.push({
          type: 'video',
          content: 'https://www.w3schools.com/html/mov_bbb.mp4',
          caption: '生成的示例视频',
          timestamp: new Date().toISOString()
        })
      }

      const newHistory: ExecutionHistory = {
        id: Date.now().toString(),
        input: currentPrompt,
        results: mockResults,
        timestamp: new Date().toISOString()
      }

      setExecutionHistory(prev => [...prev, newHistory])
      setIsExecuting(false)
    }, 2000)
  }


  const handleClearHistory = () => {
    if (confirm('确定要清空所有执行历史吗？')) {
      setExecutionHistory([])
    }
  }

  // 处理关闭弹窗
  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('您有未保存的修改，关闭后将丢失这些修改。确定要关闭吗？')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  const handleDownloadResult = (result: ExecutionResult) => {
    // 简单的下载实现
    const a = document.createElement('a')
    a.href = result.content
    a.download = `result-${Date.now()}.${result.type === 'image' ? 'png' : result.type === 'video' ? 'mp4' : 'txt'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(8px)',
        padding: '2rem'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '1000px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 主面板 - 操作和历史 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* 顶部工具栏 */}
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Play size={20} style={{ color: '#8b5cf6' }} />
              <div>
                <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '1.125rem' }}>{item.name}</span>
                {item.category && (
                  <span style={{
                    marginLeft: '0.75rem',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '9999px',
                    fontWeight: '500'
                  }}>
                    {item.category}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {executionHistory.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#6b7280',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <Trash2 size={16} />
                  清空历史
                </button>
              )}
              <button
                onClick={handleClose}
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* 模型选择 - 最上面一行 */}
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                flexShrink: 0
              }}>
                模型产品:
              </label>
              <select
                value={tempModel}
                onChange={(e) => setTempModel(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#1f2937',
                  border: '2px solid #e5e7eb',
                  fontWeight: '500',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  cursor: 'pointer'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <option value="">请选择模型</option>
                <option value="GPT-4">GPT-4</option>
                <option value="GPT-4 Turbo">GPT-4 Turbo</option>
                <option value="GPT-3.5 Turbo">GPT-3.5 Turbo</option>
                <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                <option value="Claude 3 Opus">Claude 3 Opus</option>
                <option value="Claude 3 Haiku">Claude 3 Haiku</option>
                <option value="Gemini Pro">Gemini Pro</option>
                <option value="Gemini Ultra">Gemini Ultra</option>
                <option value="文心一言 4.0">文心一言 4.0</option>
                <option value="通义千问">通义千问</option>
                <option value="讯飞星火">讯飞星火</option>
              </select>
              {hasUnsavedChanges && (
                <span style={{
                  fontSize: '0.75rem',
                  color: '#f59e0b',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  ⚠️ 未保存
                </span>
              )}
            </div>
          </div>

          {/* 历史记录列表区域 - 预览 */}
          <div
            className="custom-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              backgroundColor: '#f9fafb',
              minHeight: 0,
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y'
            } as React.CSSProperties}
          >
            {executionHistory.length === 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#9ca3af',
                textAlign: 'center',
                gap: '1rem'
              }}>
                <Play size={48} style={{ opacity: 0.5 }} />
                <div>
                  <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    开始执行工作流
                  </p>
                  <p style={{ fontSize: '0.875rem' }}>
                    在下方输入框中输入指令，然后点击执行按钮
                  </p>
                </div>
              </div>
            )}

            {executionHistory.map((history) => (
              <div
                key={history.id}
                style={{
                  marginBottom: '2rem',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* 输入指令 */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Send size={16} style={{ color: '#8b5cf6' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                      输入指令
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }}>
                      {new Date(history.timestamp).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    color: '#1f2937',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {history.input}
                  </div>
                </div>

                {/* 执行结果 */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <FileText size={16} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                      执行结果
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {history.results.map((result, idx) => (
                      <div key={idx}>
                        {result.type === 'text' && (
                          <div style={{
                            padding: '1rem',
                            backgroundColor: '#ecfdf5',
                            border: '1px solid #d1fae5',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            color: '#065f46',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}>
                            {result.content}
                          </div>
                        )}
                        {result.type === 'image' && (
                          <div style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            overflow: 'hidden'
                          }}>
                            <img
                              src={result.content}
                              alt={result.caption || '生成的图片'}
                              style={{ width: '100%', display: 'block' }}
                            />
                            {result.caption && (
                              <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#f9fafb',
                                borderTop: '1px solid #e5e7eb',
                                fontSize: '0.813rem',
                                color: '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}>
                                <span>{result.caption}</span>
                                <button
                                  onClick={() => handleDownloadResult(result)}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    color: '#6b7280',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem'
                                  }}
                                >
                                  <Download size={14} />
                                  下载
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {result.type === 'video' && (
                          <div style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            overflow: 'hidden'
                          }}>
                            <video
                              controls
                              style={{ width: '100%', display: 'block' }}
                              src={result.content}
                            />
                            {result.caption && (
                              <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#f9fafb',
                                borderTop: '1px solid #e5e7eb',
                                fontSize: '0.813rem',
                                color: '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}>
                                <span>{result.caption}</span>
                                <button
                                  onClick={() => handleDownloadResult(result)}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    color: '#6b7280',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem'
                                  }}
                                >
                                  <Download size={14} />
                                  下载
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div ref={historyEndRef} />
          </div>

          {/* Prompt 输入区域 */}
          <div style={{
            padding: '1.5rem',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: 'white'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                原始 Prompt
              </label>
              <textarea
                ref={inputRef}
                className="custom-scrollbar"
                value={tempPrompt}
                onChange={(e) => setTempPrompt(e.target.value)}
                placeholder="请输入或编辑 Prompt..."
                disabled={isExecuting}
                onWheel={(e) => {
                  // 允许在 textarea 内部滚动
                  e.stopPropagation()
                }}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  minHeight: '120px',
                  maxHeight: '300px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                  transition: 'border-color 0.2s',
                  overflowY: 'scroll',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y'
                } as React.CSSProperties}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* 两个按钮：运行和保存修改 */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleExecute}
                disabled={!tempPrompt.trim() || isExecuting}
                style={{
                  flex: 1,
                  padding: '0.875rem 1.5rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: !tempPrompt.trim() || isExecuting ? '#e5e7eb' : '#8b5cf6',
                  color: 'white',
                  cursor: !tempPrompt.trim() || isExecuting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  fontSize: '0.938rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (tempPrompt.trim() && !isExecuting) {
                    e.currentTarget.style.backgroundColor = '#7c3aed'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (tempPrompt.trim() && !isExecuting) {
                    e.currentTarget.style.backgroundColor = '#8b5cf6'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                {isExecuting ? (
                  <>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    执行中...
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    运行
                  </>
                )}
              </button>

              <button
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges}
                style={{
                  flex: 1,
                  padding: '0.875rem 1.5rem',
                  borderRadius: '12px',
                  border: !hasUnsavedChanges ? '2px solid #e5e7eb' : '2px solid #8b5cf6',
                  backgroundColor: 'white',
                  color: !hasUnsavedChanges ? '#9ca3af' : '#8b5cf6',
                  cursor: !hasUnsavedChanges ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  fontSize: '0.938rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (hasUnsavedChanges) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasUnsavedChanges) {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                💾 保存修改
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* 自定义滚动条样式 */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #c1c1c1 #f1f1f1;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 5px;
          margin: 4px 0;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 5px;
          border: 2px solid #f1f1f1;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #8b5cf6;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: #7c3aed;
        }
      `}</style>
    </div>,
    document.body
  )
}

export default WorkflowExecutionModal
