import { useNavigate } from 'react-router-dom'
import '../styles/import-success-modal.css'

interface ImportSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  workPackageName: string
  itemCount: number
}

export default function ImportSuccessModal({
  isOpen,
  onClose,
  workPackageName,
  itemCount
}: ImportSuccessModalProps) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleGoToWorkspace = () => {
    onClose()
    navigate('/workspace')
  }

  const handleContinueExplore = () => {
    onClose()
  }

  return (
    <div className="import-modal-overlay" onClick={handleContinueExplore}>
      <div className="import-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="import-modal-header">
          <div className="import-success-icon">✓</div>
          <h2 className="import-modal-title">导入成功</h2>
        </div>

        <div className="import-modal-body">
          <p className="import-modal-message">
            已成功导入「<strong>{workPackageName}</strong>」到工作台
          </p>
          <p className="import-modal-detail">
            包含 {itemCount} 个工作流，已添加到画布中
          </p>
        </div>

        <div className="import-modal-actions">
          <button
            type="button"
            className="import-modal-button import-modal-button--secondary"
            onClick={handleContinueExplore}
          >
            继续探索工作流
          </button>
          <button
            type="button"
            className="import-modal-button import-modal-button--primary"
            onClick={handleGoToWorkspace}
          >
            进入工作台查看
          </button>
        </div>
      </div>
    </div>
  )
}
