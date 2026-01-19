import { useState } from 'react'
import type { WorkflowPreparation } from '../../types/workflow'

interface PreparationItem {
  id?: string
  name: string
  description?: string
  link?: string
}

interface PreparationsEditorProps {
  preparations: PreparationItem[]
  onChange: (preparations: PreparationItem[]) => void
  disabled?: boolean
}

export default function PreparationsEditor({
  preparations,
  onChange,
  disabled = false
}: PreparationsEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const addPreparation = () => {
    const newPrep: PreparationItem = {
      id: `temp_${Date.now()}`,
      name: '',
      description: '',
      link: ''
    }
    onChange([...preparations, newPrep])
    setEditingId(newPrep.id!)
  }

  const updatePreparation = (index: number, field: keyof PreparationItem, value: string) => {
    const updated = [...preparations]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const removePreparation = (index: number) => {
    const updated = preparations.filter((_, i) => i !== index)
    onChange(updated)
  }

  const movePreparation = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === preparations.length - 1)
    ) {
      return
    }
    const updated = [...preparations]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]]
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">前置准备</h3>
        <button
          type="button"
          onClick={addPreparation}
          disabled={disabled}
          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加准备项
        </button>
      </div>

      {preparations.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">暂无前置准备项</p>
          <p className="text-xs text-gray-400">点击上方按钮添加（如：VPN环境、账号准备等）</p>
        </div>
      ) : (
        <div className="space-y-3">
          {preparations.map((prep, index) => (
            <div
              key={prep.id || index}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* 排序控制 */}
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => movePreparation(index, 'up')}
                    disabled={disabled || index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="上移"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => movePreparation(index, 'down')}
                    disabled={disabled || index === preparations.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="下移"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* 序号 */}
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>

                {/* 内容 */}
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={prep.name}
                    onChange={(e) => updatePreparation(index, 'name', e.target.value)}
                    placeholder="准备项名称（如：VPN环境）"
                    disabled={disabled}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                  <input
                    type="text"
                    value={prep.description || ''}
                    onChange={(e) => updatePreparation(index, 'description', e.target.value)}
                    placeholder="说明（可选）"
                    disabled={disabled}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                  <input
                    type="url"
                    value={prep.link || ''}
                    onChange={(e) => updatePreparation(index, 'link', e.target.value)}
                    placeholder="相关链接（可选）"
                    disabled={disabled}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {/* 删除按钮 */}
                <button
                  type="button"
                  onClick={() => removePreparation(index)}
                  disabled={disabled}
                  className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="删除"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
