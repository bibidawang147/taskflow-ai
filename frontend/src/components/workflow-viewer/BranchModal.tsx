import { useEffect, useCallback } from 'react'
import { X, ArrowRight } from 'lucide-react'

interface BranchOption {
  label: string
  targetNodeId: string
  description?: string
}

interface BranchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (targetNodeId: string) => void
  options: BranchOption[]
  title?: string
}

export default function BranchModal({
  isOpen,
  onClose,
  onSelect,
  options,
  title = '选择下一步'
}: BranchModalProps) {
  // 键盘快捷键：数字键选择分支
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    // ESC 关闭
    if (e.key === 'Escape') {
      onClose()
      return
    }

    // 数字键选择
    const num = parseInt(e.key)
    if (num >= 1 && num <= options.length) {
      e.preventDefault()
      onSelect(options[num - 1].targetNodeId)
    }
  }, [isOpen, onClose, onSelect, options])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="branch-modal-overlay" onClick={onClose}>
      <div
        className="branch-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="branch-modal-header">
          <h3 className="branch-modal-title">{title}</h3>
          <button
            className="branch-modal-close"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="branch-modal-content">
          <p className="branch-modal-hint">
            选择要执行的分支，或按数字键快速选择
          </p>

          <div className="branch-modal-options">
            {options.map((option, index) => (
              <button
                key={option.targetNodeId}
                className="branch-modal-option"
                onClick={() => onSelect(option.targetNodeId)}
              >
                <div className="branch-option-number">
                  {index + 1}
                </div>
                <div className="branch-option-content">
                  <div className="branch-option-label">
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="branch-option-description">
                      {option.description}
                    </div>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 branch-option-arrow" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
