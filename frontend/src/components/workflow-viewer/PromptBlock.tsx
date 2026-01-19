import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'

interface PromptBlockProps {
  content: string
  language?: string
}

export default function PromptBlock({ content, language = 'text' }: PromptBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [content])

  // 检测是否包含变量占位符 {{variable}}
  const renderContent = () => {
    const parts = content.split(/(\{\{[^}]+\}\})/g)

    return parts.map((part, index) => {
      if (part.match(/^\{\{[^}]+\}\}$/)) {
        // 变量占位符
        const varName = part.slice(2, -2)
        return (
          <span key={index} className="prompt-variable">
            {varName}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className="prompt-block">
      <div className="prompt-block-header">
        <span className="prompt-block-label">提示词</span>
        <button
          className="prompt-block-copy-btn"
          onClick={handleCopy}
          title={copied ? '已复制' : '复制到剪贴板'}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>复制</span>
            </>
          )}
        </button>
      </div>
      <pre className="prompt-block-content">
        <code>{renderContent()}</code>
      </pre>
    </div>
  )
}
