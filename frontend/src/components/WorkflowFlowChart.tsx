import { useState } from 'react'
import '../styles/workflow-flowchart.css'

interface Parameter {
  name: string
  description: string
  required: boolean
  defaultValue?: string
  type?: string
}

interface WorkflowStep {
  id: string
  number: number
  title: string
  description: string
  icon?: string
  parameters?: Parameter[]
  position?: { x: number; y: number }
}

interface WorkflowFlowChartProps {
  steps: WorkflowStep[]
}

export default function WorkflowFlowChart({ steps }: WorkflowFlowChartProps) {
  // 默认选中第一个节点
  const [selectedStepId, setSelectedStepId] = useState<string | null>(steps[0]?.id || null)

  const selectedStep = steps.find(step => step.id === selectedStepId)

  const handleStepClick = (stepId: string) => {
    setSelectedStepId(stepId === selectedStepId ? null : stepId)
  }

  return (
    <div className="workflow-flowchart-container">
      {/* 流程图区域 */}
      <div className="flowchart-canvas">
        <svg className="flowchart-connections" width="100%" height="100%">
          {/* 绘制连接线 */}
          {steps.map((step, index) => {
            if (index < steps.length - 1) {
              const nextStep = steps[index + 1]
              const x1 = (step.position?.x || (index * 280 + 140))
              const y1 = (step.position?.y || 80)
              const x2 = (nextStep.position?.x || ((index + 1) * 280 + 140))
              const y2 = (nextStep.position?.y || 80)

              // 计算贝塞尔曲线的控制点
              const midX = (x1 + x2) / 2

              return (
                <g key={`connection-${step.id}`}>
                  {/* 主连接线 */}
                  <path
                    d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                    className="connection-line"
                    strokeWidth="2"
                    fill="none"
                  />
                  {/* 箭头 */}
                  <polygon
                    points={`${x2-8},${y2-6} ${x2},${y2} ${x2-8},${y2+6}`}
                    className="connection-arrow"
                  />
                </g>
              )
            }
            return null
          })}
        </svg>

        {/* 流程节点 */}
        <div className="flowchart-nodes">
          {steps.map((step, index) => {
            const x = step.position?.x || (index * 280 + 60)
            const y = step.position?.y || 20
            const isSelected = selectedStepId === step.id

            return (
              <div
                key={step.id}
                className={`flowchart-node ${isSelected ? 'selected' : ''}`}
                style={{
                  left: `${x}px`,
                  top: `${y}px`
                }}
                onClick={() => handleStepClick(step.id)}
              >
                <div className="node-number">{step.number}</div>
                <div className="node-content">
                  {step.icon && <div className="node-icon">{step.icon}</div>}
                  <h3 className="node-title">{step.title}</h3>
                  <p className="node-description">{step.description}</p>
                </div>
                {step.parameters && step.parameters.length > 0 && (
                  <div className="node-badge">
                    {step.parameters.length} 个参数
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 参数配置展示区域 */}
      {selectedStep && selectedStep.parameters && selectedStep.parameters.length > 0 && (
        <div className="parameter-detail-panel">
          <div className="parameter-panel-header-simple">
            <h3 className="parameter-panel-title-simple">
              {selectedStep.title} - 参数配置
            </h3>
            <button
              className="parameter-panel-close"
              onClick={() => setSelectedStepId(null)}
            >
              ✕
            </button>
          </div>
          <div className="parameter-table-wrapper">
            <table className="parameter-table">
              <thead>
                <tr>
                  <th>参数名称</th>
                  <th>说明</th>
                  <th>类型</th>
                  <th>默认值</th>
                  <th>必填</th>
                </tr>
              </thead>
              <tbody>
                {selectedStep.parameters.map((param, index) => (
                  <tr key={index}>
                    <td className="param-name">{param.name}</td>
                    <td className="param-description">{param.description}</td>
                    <td className="param-type">{param.type || '-'}</td>
                    <td className="param-default">
                      {param.defaultValue ? <code>{param.defaultValue}</code> : '-'}
                    </td>
                    <td className="param-required">
                      {param.required ? <span className="required-badge-table">是</span> : '否'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
