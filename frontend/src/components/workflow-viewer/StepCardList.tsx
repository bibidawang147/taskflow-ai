import { forwardRef } from 'react'
import StepCard from './StepCard'
import type { WorkflowNode, WorkflowStepDetail } from '../../types/workflow'

interface StepCardListProps {
  steps: (WorkflowNode & { stepDetail?: WorkflowStepDetail })[]
  activeStepId: string | null
  completedSteps: Set<string>
  expandedCards: Set<string>
  onToggleExpand: (stepId: string) => void
  onComplete: (stepId: string) => void
  onStepClick: (stepId: string) => void
  registerCardRef: (stepId: string, el: HTMLDivElement | null) => void
}

export default function StepCardList({
  steps,
  activeStepId,
  completedSteps,
  expandedCards,
  onToggleExpand,
  onComplete,
  onStepClick,
  registerCardRef
}: StepCardListProps) {
  if (steps.length === 0) {
    return (
      <div className="step-card-list-empty">
        <p className="text-gray-500">暂无操作步骤</p>
      </div>
    )
  }

  return (
    <div className="step-card-list">
      {steps.map((step, index) => (
        <StepCard
          key={step.id}
          ref={(el) => registerCardRef(step.id, el)}
          step={step}
          stepIndex={index + 1}
          isActive={step.id === activeStepId}
          isCompleted={completedSteps.has(step.id)}
          isExpanded={expandedCards.has(step.id)}
          onToggleExpand={() => onToggleExpand(step.id)}
          onComplete={() => onComplete(step.id)}
          onClick={() => onStepClick(step.id)}
        />
      ))}
    </div>
  )
}
