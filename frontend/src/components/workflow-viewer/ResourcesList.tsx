import { FileText, Link as LinkIcon, Download, ExternalLink } from 'lucide-react'
import type { RelatedResource } from '../../types/workflow'

interface ResourcesListProps {
  resources: RelatedResource[]
}

export default function ResourcesList({ resources }: ResourcesListProps) {
  if (resources.length === 0) {
    return null
  }

  const getIcon = (type: RelatedResource['type']) => {
    switch (type) {
      case 'file':
        return <FileText className="w-4 h-4" />
      case 'link':
        return <LinkIcon className="w-4 h-4" />
      default:
        return <LinkIcon className="w-4 h-4" />
    }
  }

  const getActionIcon = (type: RelatedResource['type']) => {
    switch (type) {
      case 'file':
        return <Download className="w-4 h-4" />
      case 'link':
        return <ExternalLink className="w-4 h-4" />
      default:
        return <ExternalLink className="w-4 h-4" />
    }
  }

  return (
    <div className="resources-list">
      {resources.map((resource, index) => (
        <a
          key={index}
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="resources-list-item"
          download={resource.type === 'file' ? true : undefined}
        >
          <div className="resources-list-icon">
            {getIcon(resource.type)}
          </div>
          <div className="resources-list-content">
            <div className="resources-list-title">{resource.title}</div>
            {resource.description && (
              <div className="resources-list-description">
                {resource.description}
              </div>
            )}
          </div>
          <div className="resources-list-action">
            {getActionIcon(resource.type)}
          </div>
        </a>
      ))}
    </div>
  )
}
