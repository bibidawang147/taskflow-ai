import { useState } from 'react'
import { ChevronRight, Copy, Check, ExternalLink } from 'lucide-react'

interface ExpandableBlockProps {
  title: string
  resourceType: string
  description?: string
  content?: string
  url?: string
  type: 'tool' | 'resource' | 'prompt'
}

const ExpandableBlock = ({
  title,
  resourceType,
  description,
  content,
  url,
  type
}: ExpandableBlockProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (content) {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className={`expandable-block expandable-block--${type} ${isExpanded ? 'expandable-block--expanded' : ''}`}>
      <div
        className="expandable-block-header"
        onClick={(e) => {
          e.stopPropagation()
          setIsExpanded(!isExpanded)
        }}
      >
        <div className="expandable-block-info">
          <div className="expandable-block-title-row">
            <span className="expandable-block-type-tag">{resourceType}</span>
            <span className="expandable-block-title">{title}</span>
          </div>
          {description && !isExpanded && (
            <span className="expandable-block-desc">{description}</span>
          )}
        </div>
        <span className={`expandable-block-arrow ${isExpanded ? 'expandable-block-arrow--expanded' : ''}`}>
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>

      {isExpanded && (
        <div className="expandable-block-content">
          <div className="expandable-block-detail-header">
            <span className="expandable-block-detail-label">资源详情</span>
            <span className="expandable-block-detail-type">{resourceType}</span>
          </div>

          {content && (
            <div className="expandable-block-body">
              <pre className="expandable-block-text">{content}</pre>
            </div>
          )}

          <div className="expandable-block-actions">
            {content && (
              <button className="expandable-block-btn" onClick={handleCopy}>
                {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {isCopied ? '已复制' : '复制'}
              </button>
            )}
            {url && url !== '#' && (
              <button className="expandable-block-btn expandable-block-btn--primary" onClick={handleOpen}>
                <ExternalLink className="w-3 h-3" />
                打开
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpandableBlock
