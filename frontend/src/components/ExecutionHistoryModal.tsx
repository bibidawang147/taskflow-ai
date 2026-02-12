import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  getExecutionHistory,
  favoriteExecution,
  unfavoriteExecution,
  deleteExecutionHistory,
  reExecuteWorkflow,
  updateExecutionNotes,
  type ExecutionHistory
} from '../services/workflowApi'
import { useToast } from './ui/Toast'
import { useConfirm } from './ui/ConfirmDialog'
import '../styles/execution-history-modal.css'

interface ExecutionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  workflowId?: string // 如果提供，只显示该工作流的历史
}

export default function ExecutionHistoryModal({
  isOpen,
  onClose,
  workflowId
}: ExecutionHistoryModalProps) {
  const { showToast } = useToast()
  const { showConfirm } = useConfirm()
  const [executions, setExecutions] = useState<ExecutionHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'failed'>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'duration'>('createdAt')
  const [selectedExecution, setSelectedExecution] = useState<ExecutionHistory | null>(null)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesInput, setNotesInput] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen, filterStatus, sortBy, workflowId])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const params: any = {
        sortBy,
        sortOrder: 'desc',
        limit: 50
      }

      if (workflowId) {
        params.workflowId = workflowId
      }

      if (filterStatus !== 'all') {
        params.status = filterStatus
      }

      const response = await getExecutionHistory(params)
      setExecutions(response.executions)
    } catch (error) {
      console.error('加载执行历史失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFavorite = async (executionId: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await unfavoriteExecution(executionId)
      } else {
        await favoriteExecution(executionId)
      }
      loadHistory()
    } catch (error) {
      console.error('收藏操作失败:', error)
      showToast('操作失败，请重试', 'error')
    }
  }

  const handleDelete = async (executionId: string) => {
    if (!await showConfirm({ message: '确定要删除这条执行记录吗？' })) return

    try {
      await deleteExecutionHistory(executionId)
      loadHistory()
    } catch (error) {
      console.error('删除失败:', error)
      showToast('删除失败，请重试', 'error')
    }
  }

  const handleReExecute = async (executionId: string) => {
    try {
      await reExecuteWorkflow(executionId)
      showToast('重新执行成功！', 'success')
      loadHistory()
    } catch (error) {
      console.error('重新执行失败:', error)
      showToast('重新执行失败，请重试', 'error')
    }
  }

  const handleSaveNotes = async (executionId: string) => {
    try {
      await updateExecutionNotes(executionId, notesInput)
      setEditingNotes(null)
      setNotesInput('')
      loadHistory()
    } catch (error) {
      console.error('保存备注失败:', error)
      showToast('保存失败，请重试', 'error')
    }
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}min`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`

    return date.toLocaleDateString('zh-CN')
  }

  if (!isOpen) return null

  return createPortal(
    <div className="execution-history-overlay" onClick={onClose}>
      <div className="execution-history-modal" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="execution-history-header">
          <div>
            <h2 className="execution-history-title">
              📊 执行历史记录
            </h2>
            <p className="execution-history-subtitle">
              查看、管理和重新执行工作流历史记录
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 筛选和排序 */}
        <div className="execution-history-filters">
          <div className="filter-group">
            <label>状态:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">全部</option>
              <option value="completed">执行完成</option>
              <option value="failed">执行未完成</option>
            </select>
          </div>

          <div className="filter-group">
            <label>排序:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="filter-select"
            >
              <option value="createdAt">执行时间</option>
              <option value="duration">执行时长</option>
            </select>
          </div>
        </div>

        {/* 执行历史列表 */}
        <div className="execution-history-list">
          {loading ? (
            <div className="execution-history-loading">加载中...</div>
          ) : executions.length === 0 ? (
            <div className="execution-history-empty">
              <div className="empty-icon">📭</div>
              <p>暂无执行记录</p>
            </div>
          ) : (
            executions.map((execution) => (
              <div key={execution.id} className="execution-item">
                <div className="execution-item-header">
                  <div className="execution-item-info">
                    <h3 className="execution-item-title">
                      {execution.workflowTitle}
                    </h3>
                    <div className="execution-item-meta">
                      <span className={`status-badge status-${execution.status}`}>
                        {execution.status === 'completed' ? '执行完成' :
                         execution.status === 'failed' ? '执行未完成' :
                         execution.status === 'running' ? '⟳ 运行中' : '⋯ 等待中'}
                      </span>
                      <span className="execution-time">{formatDate(execution.startedAt)}</span>
                      <span className="execution-duration">⏱ {formatDuration(execution.duration)}</span>
                    </div>
                  </div>

                  <div className="execution-item-actions">
                    <button
                      className={`action-icon-btn ${execution.isFavorite ? 'favorited' : ''}`}
                      onClick={() => handleFavorite(execution.id, execution.isFavorite || false)}
                      title={execution.isFavorite ? '取消收藏' : '收藏'}
                    >
                      {execution.isFavorite ? '★' : '☆'}
                    </button>
                    <button
                      className="action-icon-btn"
                      onClick={() => setSelectedExecution(
                        selectedExecution?.id === execution.id ? null : execution
                      )}
                      title="查看详情"
                    >
                      {selectedExecution?.id === execution.id ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* 展开的详情 */}
                {selectedExecution?.id === execution.id && (
                  <div className="execution-item-details">
                    {/* 输入 */}
                    <div className="execution-detail-section">
                      <h4 className="detail-section-title">📥 输入参数</h4>
                      <pre className="detail-content">
                        {JSON.stringify(execution.input, null, 2)}
                      </pre>
                    </div>

                    {/* 输出 */}
                    {execution.output && (
                      <div className="execution-detail-section">
                        <h4 className="detail-section-title">📤 输出结果</h4>
                        <pre className="detail-content">
                          {JSON.stringify(execution.output, null, 2)}
                        </pre>
                        <button
                          className="copy-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(execution.output, null, 2))
                            showToast('已复制到剪贴板', 'success')
                          }}
                        >
                          📋 复制输出
                        </button>
                      </div>
                    )}

                    {/* 错误信息 */}
                    {execution.error && (
                      <div className="execution-detail-section error-section">
                        <h4 className="detail-section-title">⚠️ 错误信息</h4>
                        <pre className="detail-content error-content">
                          {execution.error}
                        </pre>
                      </div>
                    )}

                    {/* 备注 */}
                    <div className="execution-detail-section">
                      <h4 className="detail-section-title">📝 备注</h4>
                      {editingNotes === execution.id ? (
                        <div className="notes-edit">
                          <textarea
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                            placeholder="添加备注..."
                            className="notes-textarea"
                          />
                          <div className="notes-actions">
                            <button
                              className="save-notes-btn"
                              onClick={() => handleSaveNotes(execution.id)}
                            >
                              保存
                            </button>
                            <button
                              className="cancel-notes-btn"
                              onClick={() => {
                                setEditingNotes(null)
                                setNotesInput('')
                              }}
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="notes-display">
                          <p className="notes-text">
                            {execution.notes || '暂无备注'}
                          </p>
                          <button
                            className="edit-notes-btn"
                            onClick={() => {
                              setEditingNotes(execution.id)
                              setNotesInput(execution.notes || '')
                            }}
                          >
                            ✏️ 编辑备注
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="execution-actions">
                      <button
                        className="execution-action-btn rerun-btn"
                        onClick={() => handleReExecute(execution.id)}
                      >
                        🔄 重新执行
                      </button>
                      <button
                        className="execution-action-btn delete-btn"
                        onClick={() => handleDelete(execution.id)}
                      >
                        🗑️ 删除记录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
