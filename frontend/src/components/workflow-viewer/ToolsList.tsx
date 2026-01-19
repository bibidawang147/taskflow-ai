import { ExternalLink, Wrench } from 'lucide-react'
import type { StepTool } from '../../types/workflow'

interface ToolsListProps {
  tools: StepTool[]
}

export default function ToolsList({ tools }: ToolsListProps) {
  if (tools.length === 0) {
    return null
  }

  return (
    <div className="tools-list">
      {tools.map((tool, index) => (
        <div key={index} className="tools-list-item">
          <div className="tools-list-icon">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="tools-list-content">
            <div className="tools-list-name">
              {tool.url ? (
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tools-list-link"
                >
                  {tool.name}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              ) : (
                tool.name
              )}
            </div>
            {tool.description && (
              <div className="tools-list-description">
                {tool.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
