import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Play,
  Loader2,
  Send,
  Zap,
  Settings,
  FileText,
  GitBranch
} from 'lucide-react'
import type { WorkflowNode } from '../types/workflow'

interface StepData {
  node: WorkflowNode
  stepIndex: number
  status: 'pending' | 'active' | 'completed'
  userInput?: string
  result?: any
}

interface StepByStepExecutionModalProps {
  workflow: {
    id: string
    title: string
    description?: string
    config: {
      nodes: WorkflowNode[]
      edges: any[]
    }
  }
  onClose: () => void
}

const StepByStepExecutionModal: React.FC<StepByStepExecutionModalProps> = ({
  workflow,
  onClose
}) => {
  const [steps, setSteps] = useState<StepData[]>(() =>
    workflow.config.nodes.map((node, index) => ({
      node,
      stepIndex: index,
      status: index === 0 ? 'active' : 'pending'
    }))
  )

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isExecuting, setIsExecuting] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]))

  const stepRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 获取节点图标
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'input':
        return <Send size={18} />
      case 'llm':
        return <Zap size={18} />
      case 'tool':
        return <Settings size={18} />
      case 'condition':
        return <GitBranch size={18} />
      case 'output':
        return <FileText size={18} />
      default:
        return <Circle size={18} />
    }
  }

  // 获取节点颜色
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'input':
        return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }
      case 'llm':
        return { bg: '#e9d5ff', border: '#8b5cf6', text: '#6b21a8' }
      case 'tool':
        return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' }
      case 'condition':
        return { bg: '#fce7f3', border: '#ec4899', text: '#9f1239' }
      case 'output':
        return { bg: '#d1fae5', border: '#10b981', text: '#065f46' }
      default:
        return { bg: '#f3f4f6', border: '#6b7280', text: '#374151' }
    }
  }

  // 处理步骤完成
  const handleStepComplete = async (stepIndex: number, userInput?: string) => {
    setIsExecuting(true)

    // 模拟执行延迟
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 更新当前步骤状态
    setSteps(prev => prev.map((step, idx) => {
      if (idx === stepIndex) {
        return {
          ...step,
          status: 'completed',
          userInput,
          result: {
            type: 'text',
            content: `步骤 ${stepIndex + 1} 执行成功！\n\n节点类型: ${step.node.type}\n节点标签: ${step.node.label}${userInput ? `\n用户输入: ${userInput}` : ''}`
          }
        }
      }
      return step
    }))

    // 如果不是最后一步，激活下一步
    if (stepIndex < steps.length - 1) {
      setTimeout(() => {
        setSteps(prev => prev.map((step, idx) => {
          if (idx === stepIndex + 1) {
            return { ...step, status: 'active' }
          }
          return step
        }))
        setCurrentStepIndex(stepIndex + 1)
        setExpandedSteps(prev => new Set([...prev, stepIndex + 1]))
        setIsExecuting(false)
      }, 300)
    } else {
      setIsExecuting(false)
    }
  }

  // 切换步骤展开/折叠
  const toggleStepExpanded = (stepIndex: number) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(stepIndex)) {
        newSet.delete(stepIndex)
      } else {
        newSet.add(stepIndex)
      }
      return newSet
    })
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '2px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'white',
          flexShrink: 0,
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Play size={24} style={{ color: '#8b5cf6' }} />
              <h2 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937'
              }}>
                {workflow.title}
              </h2>
            </div>
            {workflow.description && (
              <p style={{
                margin: '0.5rem 0 0 2.25rem',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                {workflow.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
              e.currentTarget.style.color = '#1f2937'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#6b7280'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* 进度指示器 */}
        <div style={{
          padding: '1rem 2rem',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
              进度:
            </span>
            <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                backgroundColor: '#8b5cf6',
                width: `${((steps.filter(s => s.status === 'completed').length) / steps.length) * 100}%`,
                transition: 'width 0.5s ease-in-out'
              }} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#8b5cf6' }}>
              {steps.filter(s => s.status === 'completed').length} / {steps.length}
            </span>
          </div>
        </div>

        {/* 步骤列表 - 可滚动区域 */}
        <div
          ref={scrollContainerRef}
          style={{
            flex: '1 1 0',
            overflowY: 'auto',
            padding: '2rem',
            backgroundColor: '#f9fafb'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {steps.map((step, index) => {
              const isExpanded = expandedSteps.has(index)
              const colors = getNodeColor(step.node.type)
              const isCompleted = step.status === 'completed'
              const isActive = step.status === 'active'
              const isPending = step.status === 'pending'

              return (
                <div
                  key={step.node.id}
                  ref={(el) => {
                    if (el) stepRefs.current.set(index, el)
                  }}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    border: `2px solid ${isActive ? colors.border : isCompleted ? '#10b981' : '#e5e7eb'}`,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease-in-out',
                    opacity: isPending ? 0.6 : 1,
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isActive ? '0 8px 24px rgba(139, 92, 246, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* 步骤头部 */}
                  <div
                    style={{
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      cursor: isCompleted || isActive ? 'pointer' : 'default',
                      backgroundColor: isCompleted ? '#f0fdf4' : isActive ? colors.bg : 'white'
                    }}
                    onClick={() => {
                      if (isCompleted || isActive) {
                        toggleStepExpanded(index)
                      }
                    }}
                  >
                    {/* 状态图标 */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isCompleted ? '#dcfce7' : isActive ? colors.bg : '#f3f4f6',
                      color: isCompleted ? '#16a34a' : isActive ? colors.text : '#9ca3af',
                      flexShrink: 0
                    }}>
                      {isCompleted ? (
                        <CheckCircle2 size={24} />
                      ) : isActive ? (
                        getNodeIcon(step.node.type)
                      ) : (
                        <Circle size={24} />
                      )}
                    </div>

                    {/* 步骤信息 */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: '#6b7280',
                          letterSpacing: '0.05em'
                        }}>
                          步骤 {index + 1}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: colors.bg,
                          color: colors.text,
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          {step.node.type.toUpperCase()}
                        </span>
                      </div>
                      <h3 style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#1f2937'
                      }}>
                        {step.node.label}
                      </h3>
                    </div>

                    {/* 展开/折叠图标 */}
                    {(isCompleted || isActive) && (
                      <div style={{
                        color: '#9ca3af',
                        transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(0deg)'
                      }}>
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </div>
                    )}
                  </div>

                  {/* 步骤内容（展开时显示） */}
                  {isExpanded && (isActive || isCompleted) && (
                    <div
                      style={{
                        padding: '1.5rem',
                        borderTop: '1px solid #e5e7eb',
                        backgroundColor: 'white'
                      }}>
                      {/* 节点配置信息 */}
                      {step.node.config && Object.keys(step.node.config).length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <h4 style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.5rem'
                          }}>
                            节点配置
                          </h4>
                          <div
                            style={{
                              padding: '1rem',
                              backgroundColor: '#f9fafb',
                              borderRadius: '8px',
                              fontSize: '0.813rem',
                              color: '#6b7280',
                              fontFamily: 'monospace'
                            }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {JSON.stringify(step.node.config, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* 用户输入区域（仅当前激活步骤） */}
                      {isActive && !isCompleted && (
                        <StepInputArea
                          step={step}
                          onComplete={(input) => handleStepComplete(index, input)}
                          isExecuting={isExecuting}
                        />
                      )}

                      {/* 执行结果（已完成的步骤） */}
                      {isCompleted && step.result && (
                        <div style={{ marginTop: '1rem' }}>
                          <h4 style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                            执行结果
                          </h4>
                          <div
                            style={{
                              padding: '1rem',
                              backgroundColor: '#ecfdf5',
                              border: '1px solid #d1fae5',
                              borderRadius: '8px',
                              fontSize: '0.875rem',
                              color: '#065f46',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word'
                            }}>
                            {step.result.content}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 完成提示 */}
          {steps.every(s => s.status === 'completed') && (
            <div style={{
              marginTop: '2rem',
              padding: '2rem',
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '2px solid #10b981',
              textAlign: 'center'
            }}>
              <CheckCircle2 size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
              <h3 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#065f46'
              }}>
                工作流执行完成！
              </h3>
              <p style={{
                margin: 0,
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                所有步骤已成功完成
              </p>
              <button
                onClick={onClose}
                style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem 2rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#10b981',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.938rem',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
              >
                关闭
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// 步骤输入区域组件
interface StepInputAreaProps {
  step: StepData
  onComplete: (input?: string) => void
  isExecuting: boolean
}

const StepInputArea: React.FC<StepInputAreaProps> = ({ step, onComplete, isExecuting }) => {
  const [userInput, setUserInput] = useState('')

  const handleSubmit = () => {
    if (step.node.type === 'input' && !userInput.trim()) return
    onComplete(userInput.trim() || undefined)
  }

  return (
    <div>
      {/* 根据节点类型显示不同的输入界面 */}
      {step.node.type === 'input' && (
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            请输入内容
          </label>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="请输入您的内容..."
            disabled={isExecuting}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              fontSize: '0.875rem',
              minHeight: '100px',
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
          />
        </div>
      )}

      {/* 完成按钮 */}
      <button
        onClick={handleSubmit}
        disabled={isExecuting || (step.node.type === 'input' && !userInput.trim())}
        style={{
          marginTop: '1rem',
          width: '100%',
          padding: '0.875rem',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: isExecuting || (step.node.type === 'input' && !userInput.trim())
            ? '#e5e7eb'
            : '#8b5cf6',
          color: 'white',
          cursor: isExecuting || (step.node.type === 'input' && !userInput.trim())
            ? 'not-allowed'
            : 'pointer',
          fontSize: '0.938rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!isExecuting && !(step.node.type === 'input' && !userInput.trim())) {
            e.currentTarget.style.backgroundColor = '#7c3aed'
          }
        }}
        onMouseLeave={(e) => {
          if (!isExecuting && !(step.node.type === 'input' && !userInput.trim())) {
            e.currentTarget.style.backgroundColor = '#8b5cf6'
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
            <CheckCircle2 size={20} />
            完成此步骤
          </>
        )}
      </button>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default StepByStepExecutionModal
