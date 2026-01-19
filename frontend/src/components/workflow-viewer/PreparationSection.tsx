import { ExternalLink, CheckCircle2, Circle } from 'lucide-react'
import { useState } from 'react'
import type { WorkflowPreparation } from '../../types/workflow'

interface PreparationSectionProps {
  preparations: WorkflowPreparation[]
}

export default function PreparationSection({ preparations }: PreparationSectionProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const allChecked = checkedItems.size === preparations.length

  if (preparations.length === 0) {
    return null
  }

  return (
    <div className="preparation-section">
      <div className="preparation-header">
        <h2 className="preparation-title">前置准备</h2>
        <span className="preparation-count">
          {checkedItems.size}/{preparations.length} 已完成
        </span>
      </div>

      <div className="preparation-list">
        {preparations.map((prep) => {
          const isChecked = checkedItems.has(prep.id)

          return (
            <div
              key={prep.id}
              className={`preparation-item ${isChecked ? 'is-checked' : ''}`}
              onClick={() => toggleItem(prep.id)}
            >
              <div className="preparation-checkbox">
                {isChecked ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300" />
                )}
              </div>

              <div className="preparation-content">
                <div className="preparation-name">
                  {prep.name}
                </div>
                {prep.description && (
                  <div className="preparation-description">
                    {prep.description}
                  </div>
                )}
              </div>

              {prep.link && (
                <a
                  href={prep.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="preparation-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          )
        })}
      </div>

      {allChecked && (
        <div className="preparation-complete-message">
          准备工作已完成，可以开始执行工作流
        </div>
      )}
    </div>
  )
}
