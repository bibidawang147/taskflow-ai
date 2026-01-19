import { useState, useCallback, useEffect, useMemo } from 'react'

export interface ExecutionState {
  activeStepId: string | null
  completedSteps: Set<string>
  expandedCards: Set<string>
}

interface UseWorkflowExecutionOptions {
  workflowId: string
  stepIds: string[]
  persistProgress?: boolean
}

interface UseWorkflowExecutionReturn {
  // 状态
  activeStepId: string | null
  completedSteps: Set<string>
  expandedCards: Set<string>

  // 计算属性
  currentStepIndex: number
  totalSteps: number
  progressPercentage: number
  isAllCompleted: boolean

  // 操作方法
  setActiveStep: (stepId: string | null) => void
  completeStep: (stepId: string) => void
  uncompleteStep: (stepId: string) => void
  toggleCardExpand: (stepId: string) => void
  expandCard: (stepId: string) => void
  collapseCard: (stepId: string) => void
  expandAllCards: () => void
  collapseAllCards: () => void
  goToNextStep: () => void
  goToPreviousStep: () => void
  goToStep: (stepId: string) => void
  resetProgress: () => void
}

const STORAGE_KEY_PREFIX = 'workflow_progress_'

export function useWorkflowExecution({
  workflowId,
  stepIds,
  persistProgress = true
}: UseWorkflowExecutionOptions): UseWorkflowExecutionReturn {
  // 从 localStorage 恢复进度
  const loadSavedProgress = useCallback((): Partial<ExecutionState> => {
    if (!persistProgress) return {}

    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${workflowId}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          activeStepId: parsed.activeStepId || null,
          completedSteps: new Set(parsed.completedSteps || []),
          expandedCards: new Set(parsed.expandedCards || [])
        }
      }
    } catch (e) {
      console.error('Failed to load saved progress:', e)
    }
    return {}
  }, [workflowId, persistProgress])

  // 初始化状态
  const [activeStepId, setActiveStepId] = useState<string | null>(() => {
    const saved = loadSavedProgress()
    return saved.activeStepId ?? (stepIds.length > 0 ? stepIds[0] : null)
  })

  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => {
    const saved = loadSavedProgress()
    return saved.completedSteps ?? new Set()
  })

  const [expandedCards, setExpandedCards] = useState<Set<string>>(() => {
    const saved = loadSavedProgress()
    // 默认展开当前活动步骤
    const initial = saved.expandedCards ?? new Set()
    if (activeStepId && !initial.has(activeStepId)) {
      initial.add(activeStepId)
    }
    return initial
  })

  // 保存进度到 localStorage
  useEffect(() => {
    if (!persistProgress) return

    const data = {
      activeStepId,
      completedSteps: Array.from(completedSteps),
      expandedCards: Array.from(expandedCards)
    }

    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${workflowId}`, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save progress:', e)
    }
  }, [workflowId, activeStepId, completedSteps, expandedCards, persistProgress])

  // 计算属性
  const currentStepIndex = useMemo(() => {
    if (!activeStepId) return -1
    return stepIds.indexOf(activeStepId)
  }, [activeStepId, stepIds])

  const totalSteps = stepIds.length

  const progressPercentage = useMemo(() => {
    if (totalSteps === 0) return 0
    return Math.round((completedSteps.size / totalSteps) * 100)
  }, [completedSteps.size, totalSteps])

  const isAllCompleted = useMemo(() => {
    return totalSteps > 0 && completedSteps.size === totalSteps
  }, [completedSteps.size, totalSteps])

  // 操作方法
  const setActiveStep = useCallback((stepId: string | null) => {
    setActiveStepId(stepId)
    // 自动展开活动步骤卡片
    if (stepId) {
      setExpandedCards(prev => {
        const next = new Set(prev)
        next.add(stepId)
        return next
      })
    }
  }, [])

  const completeStep = useCallback((stepId: string) => {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      next.add(stepId)
      return next
    })
  }, [])

  const uncompleteStep = useCallback((stepId: string) => {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      next.delete(stepId)
      return next
    })
  }, [])

  const toggleCardExpand = useCallback((stepId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }, [])

  const expandCard = useCallback((stepId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      next.add(stepId)
      return next
    })
  }, [])

  const collapseCard = useCallback((stepId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      next.delete(stepId)
      return next
    })
  }, [])

  const expandAllCards = useCallback(() => {
    setExpandedCards(new Set(stepIds))
  }, [stepIds])

  const collapseAllCards = useCallback(() => {
    setExpandedCards(new Set())
  }, [])

  const goToNextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      const nextStepId = stepIds[currentStepIndex + 1]
      setActiveStep(nextStepId)
    }
  }, [currentStepIndex, totalSteps, stepIds, setActiveStep])

  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevStepId = stepIds[currentStepIndex - 1]
      setActiveStep(prevStepId)
    }
  }, [currentStepIndex, stepIds, setActiveStep])

  const goToStep = useCallback((stepId: string) => {
    if (stepIds.includes(stepId)) {
      setActiveStep(stepId)
    }
  }, [stepIds, setActiveStep])

  const resetProgress = useCallback(() => {
    setActiveStepId(stepIds.length > 0 ? stepIds[0] : null)
    setCompletedSteps(new Set())
    setExpandedCards(new Set(stepIds.length > 0 ? [stepIds[0]] : []))

    if (persistProgress) {
      try {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${workflowId}`)
      } catch (e) {
        console.error('Failed to remove saved progress:', e)
      }
    }
  }, [workflowId, stepIds, persistProgress])

  return {
    // 状态
    activeStepId,
    completedSteps,
    expandedCards,

    // 计算属性
    currentStepIndex,
    totalSteps,
    progressPercentage,
    isAllCompleted,

    // 操作方法
    setActiveStep,
    completeStep,
    uncompleteStep,
    toggleCardExpand,
    expandCard,
    collapseCard,
    expandAllCards,
    collapseAllCards,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetProgress
  }
}

export default useWorkflowExecution
