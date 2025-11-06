import { createPortal } from 'react-dom'
import { X, CheckCircle, Edit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface WorkflowResultModalProps {
  workflow: any
  analysis?: any
  testMode?: boolean
  onClose: () => void
}

export default function WorkflowResultModal({
  workflow,
  analysis,
  testMode,
  onClose
}: WorkflowResultModalProps) {
  const navigate = useNavigate()

  const handleEditWorkflow = () => {
    navigate(`/workflow-intro/${workflow.id}`)
  }

  // 安全获取节点
  const nodes = workflow?.config?.nodes || []
  const stepNodes = nodes.filter((node: any) =>
    node.data?.nodeType !== 'input' && node.data?.nodeType !== 'output'
  )

  const getNodeTypeColor = (nodeType?: string) => {
    switch (nodeType) {
      case 'llm': return '#3b82f6'
      case 'tool': return '#10b981'
      case 'condition': return '#f59e0b'
      case 'transform': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const getNodeTypeLabel = (nodeType?: string) => {
    switch (nodeType) {
      case 'llm': return 'AI处理'
      case 'tool': return '工具调用'
      case 'condition': return '条件判断'
      case 'transform': return '数据转换'
      default: return '处理节点'
    }
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '2rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#f3f4f6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            zIndex: 1
          }}
        >
          <X size={20} color="#6b7280" />
        </button>

        {/* 成功标题 */}
        <div
          style={{
            padding: '2.5rem 2.5rem 1.5rem',
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '24px 24px 0 0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <CheckCircle size={32} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>
              工作流创建成功！
            </h2>
          </div>
          {testMode && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <span>🧪</span>
              <span>测试模式</span>
            </div>
          )}
        </div>

        {/* 工作流信息 */}
        <div style={{ padding: '2rem 2.5rem' }}>
          {/* 工作流标题和描述 */}
          <div style={{ marginBottom: '2rem' }}>
            <h3
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.75rem'
              }}
            >
              {workflow.title}
            </h3>
            <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: '1.6' }}>
              {workflow.description}
            </p>
          </div>

          {/* 分析信息 */}
          {analysis && (
            <div
              style={{
                marginBottom: '2rem',
                padding: '1.25rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '12px',
                border: '1px solid #bbf7d0'
              }}
            >
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#166534',
                  marginBottom: '0.75rem'
                }}
              >
                📊 分析结果
              </h4>
              <div style={{ fontSize: '13px', color: '#166534', lineHeight: '1.8' }}>
                {analysis.articleTitle && (
                  <div>
                    <strong>文章标题：</strong>{analysis.articleTitle}
                  </div>
                )}
                {analysis.stepsExtracted && (
                  <div>
                    <strong>提取步骤：</strong>{analysis.stepsExtracted} 个
                  </div>
                )}
                {analysis.category && (
                  <div>
                    <strong>分类：</strong>{analysis.category}
                  </div>
                )}
                {analysis.tags && analysis.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <strong>标签：</strong>
                    {analysis.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#dcfce7',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 工作流节点列表 */}
          {stepNodes.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h4
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>🔧</span>
                <span>工作流节点 ({stepNodes.length} 个)</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stepNodes.map((node: any, index: number) => (
                  <div
                    key={node.id}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: getNodeTypeColor(node.data?.nodeType),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '14px',
                        flexShrink: 0
                      }}
                    >
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <h5 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>
                          {node.data?.label || '未命名节点'}
                        </h5>
                        <span
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: getNodeTypeColor(node.data?.nodeType) + '20',
                            color: getNodeTypeColor(node.data?.nodeType),
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}
                        >
                          {getNodeTypeLabel(node.data?.nodeType)}
                        </span>
                      </div>
                      {node.data?.description && (
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
                          {node.data.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              onClick={handleEditWorkflow}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
            >
              <Edit size={18} />
              <span>编辑工作流</span>
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '1rem 1.5rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
