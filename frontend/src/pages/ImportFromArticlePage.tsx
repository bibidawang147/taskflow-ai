import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/import-article.css'

type InputType = 'content' | 'url'

export default function ImportFromArticlePage() {
  const navigate = useNavigate()
  const [inputType, setInputType] = useState<InputType>('content')
  const [articleContent, setArticleContent] = useState('')
  const [articleUrl, setArticleUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [pastedImages, setPastedImages] = useState<string[]>([])
  const contentEditableRef = useRef<HTMLDivElement>(null)

  // 处理富文本粘贴
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()

    const clipboardData = e.clipboardData

    // 优先处理纯文本（最简单可靠）
    const text = clipboardData.getData('text/plain')
    if (text) {
      setArticleContent(prev => prev + text)
    }

    // 1. 先处理剪贴板中的图片 blob（直接复制图片时）
    const items = clipboardData.items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      // 只处理图片类型
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile()
        if (blob) {
          // 将图片转换为 base64（这样可以绕过防盗链）
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64 = event.target?.result as string
            setPastedImages(prev => [...prev, base64])
            console.log('✅ 从剪贴板捕获图片 blob')
          }
          reader.readAsDataURL(blob)
        }
      }
    }

    // 2. 从 HTML 中提取图片链接（复制网页内容时）
    const html = clipboardData.getData('text/html')
    if (html) {
      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const images = doc.querySelectorAll('img')

        if (images.length > 0) {
          console.log(`📷 检测到 ${images.length} 张图片，尝试通过后端代理下载...`)

          // 遍历所有图片，通过后端代理下载
          images.forEach(async (img) => {
            const src = img.getAttribute('data-src') || img.getAttribute('src')
            if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
              try {
                console.log('🔄 下载图片:', src.substring(0, 50) + '...')

                // 使用后端代理下载图片（绕过防盗链）
                const response = await fetch('http://localhost:3000/api/workflows/proxy-image', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  },
                  body: JSON.stringify({ url: src })
                })

                if (response.ok) {
                  const data = await response.json()
                  setPastedImages(prev => [...prev, data.base64])
                  console.log('✅ 成功下载图片:', src.substring(0, 50) + '...')
                } else {
                  const error = await response.json()
                  console.log('⚠️ 图片下载失败:', error.error)
                }
              } catch (err: any) {
                console.log('⚠️ 无法下载图片:', err.message)
              }
            }
          })
        }
      } catch (err) {
        console.error('解析HTML失败:', err)
      }
    }
  }

  const handleParse = async () => {
    // 验证输入
    if (inputType === 'content' && !articleContent.trim()) {
      setError('请输入文章内容')
      return
    }
    if (inputType === 'url' && !articleUrl.trim()) {
      setError('请输入文章URL')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      // 使用真实的阿里云API进行解析（可能需要1-3分钟，特别是微信公众号文章）
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 180000) // 180秒超时（3分钟）

      const response = await fetch('http://localhost:3000/api/workflows/parse-article', {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: inputType,
          content: inputType === 'content' ? articleContent : undefined,
          url: inputType === 'url' ? articleUrl : undefined
        })
      })

      clearTimeout(timeoutId) // 清理超时定时器

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '解析失败')
      }

      const result = await response.json()

      // 跳转到创建页面，并传递预填充数据
      navigate('/workflow/create', {
        state: {
          prefilled: true,
          data: {
            title: result.title,
            description: result.description,
            tags: result.tags || [],
            steps: result.steps.map((step: any, index: number) => {
              // ✅ 如果有工具信息，转换为 alternativeModels 格式
              const toolsAsModels = (step.tools || []).map((tool: string) => ({
                brand: '',
                name: tool,
                url: ''
              }))

              return {
                id: `step-${Date.now()}-${index}`,
                title: step.title,
                prompt: step.prompt,
                model: {
                  brand: step.model?.brand || 'OpenAI',
                  name: step.model?.name || 'GPT-4',
                  url: ''
                },
                // ✅ 合并从后端提取的工具和可能已有的 alternativeModels
                alternativeModels: [...toolsAsModels, ...(step.alternativeModels || [])],
                temperature: step.temperature || 0.7,
                maxTokens: step.maxTokens || 2000,
                showAdvanced: false,
                demonstrationImages: step.demonstrationImages || []  // 添加演示图片
              }
            }),
            sourceType: 'article',
            sourceUrl: inputType === 'url' ? articleUrl : undefined,
            sourceTitle: result.title,
            sourceContent: inputType === 'content' ? articleContent : undefined
          }
        }
      })
    } catch (err: any) {
      console.error('Parse error:', err)
      if (err.name === 'AbortError') {
        setError('AI分析超时（超过3分钟）。建议：复制文章内容，使用"粘贴文章内容"方式导入')
      } else {
        setError(err.message || '解析文章时出现错误，请重试')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="import-article-container">
      <div className="import-article-content">
        {/* 标题 */}
        <div className="import-header">
          <h1 className="import-title">从文章创建工作流</h1>
          <p className="import-subtitle">
            输入文章内容或URL，AI将自动解析并生成工作流步骤
          </p>
        </div>

        {/* 输入类型选择 */}
        <div className="input-type-selector">
          <label className={`input-type-option ${inputType === 'content' ? 'active' : ''}`}>
            <input
              type="radio"
              name="inputType"
              value="content"
              checked={inputType === 'content'}
              onChange={(e) => setInputType(e.target.value as InputType)}
            />
            <span className="radio-icon"></span>
            <span className="radio-label">粘贴文章内容</span>
            <span style={{marginLeft: '8px', fontSize: '12px', color: '#10b981'}}>✅ 速度更快</span>
          </label>

          <label className={`input-type-option ${inputType === 'url' ? 'active' : ''}`}>
            <input
              type="radio"
              name="inputType"
              value="url"
              checked={inputType === 'url'}
              onChange={(e) => setInputType(e.target.value as InputType)}
            />
            <span className="radio-icon"></span>
            <span className="radio-label">输入文章链接</span>
            <span style={{marginLeft: '8px', fontSize: '12px', color: '#3b82f6'}}>✨ 现已支持微信文章</span>
          </label>
        </div>

        {/* 输入区域 */}
        <div className="input-area">
          {inputType === 'content' ? (
            <div className="textarea-wrapper">
              {/* 微信文章操作提示 */}
              {articleContent.length === 0 && pastedImages.length === 0 && (
                <div style={{
                  padding: '12px 16px',
                  marginBottom: '12px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#0369a1'
                }}>
                  <div style={{fontWeight: '600', marginBottom: '8px'}}>💡 微信文章快速导入（支持图片）：</div>
                  <div style={{lineHeight: '1.6'}}>
                    1. 在微信文章页面按 <kbd style={{padding: '2px 6px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', fontFamily: 'monospace'}}>Ctrl+A</kbd> 全选<br/>
                    2. 按 <kbd style={{padding: '2px 6px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', fontFamily: 'monospace'}}>Ctrl+C</kbd> 复制<br/>
                    3. 回到此处按 <kbd style={{padding: '2px 6px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', fontFamily: 'monospace'}}>Ctrl+V</kbd> 粘贴<br/>
                    4. ✨ <strong>支持粘贴图片</strong>：自动识别文章中的图片
                  </div>
                </div>
              )}
              <textarea
                className="article-textarea"
                placeholder="请粘贴文章内容（支持文本和图片）..."
                value={articleContent}
                onChange={(e) => setArticleContent(e.target.value)}
                onPaste={handlePaste}
                disabled={isLoading}
                style={{
                  minHeight: '300px',
                  resize: 'vertical'
                }}
              />

              {/* 图片预览区域 */}
              {pastedImages.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}>
                  <div style={{fontWeight: '600', marginBottom: '8px', color: '#374151'}}>
                    📷 已识别图片 ({pastedImages.length}张)
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '8px'
                  }}>
                    {pastedImages.map((img, index) => (
                      <div key={index} style={{
                        position: 'relative',
                        paddingTop: '100%',
                        background: '#fff',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: '1px solid #e5e7eb'
                      }}>
                        <img
                          src={img}
                          alt={`图片 ${index + 1}`}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="textarea-footer">
                <span className="char-count">
                  {articleContent.length} 字符
                  {pastedImages.length > 0 && ` · ${pastedImages.length} 张图片`}
                </span>
              </div>
            </div>
          ) : (
            <div className="url-input-wrapper">
              <input
                type="url"
                className="url-input"
                placeholder="https://example.com/article"
                value={articleUrl}
                onChange={(e) => setArticleUrl(e.target.value)}
                disabled={isLoading}
              />
              <div className="url-hint">
                支持公开访问的文章链接，AI将自动抓取并解析内容
              </div>
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="error-message">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm-.5-9h1v5h-1V5zm0 6h1v1h-1v-1z" fill="currentColor"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="action-buttons">
          <button
            className="btn-cancel"
            onClick={() => navigate(-1)}
            disabled={isLoading}
          >
            取消
          </button>
          <button
            className="btn-parse"
            onClick={handleParse}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                <span>解析中...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1v6m0 0L5 4m3 3l3-3m4 7a7 7 0 11-14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>开始解析</span>
              </>
            )}
          </button>
        </div>

        {/* 提示信息 */}
        <div className="info-box">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 7v4m0-6h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div className="info-content">
            <strong>解析说明：</strong>
            <ul>
              <li>AI将深度分析文章，识别工作流步骤、使用工具和目的</li>
              <li>⏱️ 处理时间约30秒-3分钟，请耐心等待</li>
              <li>✨ <strong>现已支持微信公众号文章URL直接抓取</strong>（使用浏览器自动化技术）</li>
              <li>📷 <strong>粘贴内容支持图片识别</strong>：自动提取文章中的图片</li>
              <li>💡 推荐使用"粘贴文章内容"方式，速度更快更稳定</li>
              <li>生成的工作流可能需要手动调整和完善</li>
              <li>建议文章包含明确的步骤说明或操作流程</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
