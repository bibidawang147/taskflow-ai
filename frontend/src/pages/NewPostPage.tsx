import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import communityApi from '../services/communityApi'
import '../styles/community.css'

export default function NewPostPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleSubmit = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录')
      navigate('/login')
      return
    }

    if (!title.trim()) {
      alert('请输入标题')
      return
    }

    if (!content.trim()) {
      alert('请输入内容')
      return
    }

    try {
      setSubmitting(true)
      const result = await communityApi.createPost({
        title: title.trim(),
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined
      })

      alert('发布成功！')
      navigate(`/community/posts/${result.post.id}`)
    } catch (error) {
      console.error('发布失败:', error)
      alert('发布失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="new-post-page-douban">
      <div className="douban-community-container">
        <button className="douban-back-button" onClick={() => navigate('/community/posts')}>
          ← 返回讨论区
        </button>

        <div className="douban-page-header">
          <h1 className="douban-page-title">发布新帖</h1>
        </div>

        <div className="douban-new-post-form">
          <div className="douban-form-group">
            <label htmlFor="title">标题 *</label>
            <input
              id="title"
              type="text"
              placeholder="输入帖子标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <div className="douban-char-count">{title.length} / 100</div>
          </div>

          <div className="douban-form-group">
            <label htmlFor="content">内容 *</label>
            <textarea
              id="content"
              placeholder="分享你的想法、经验或问题..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
            />
            <div className="douban-char-count">{content.length} 字</div>
          </div>

          <div className="douban-form-group">
            <label htmlFor="tags">标签（选填）</label>
            <div className="douban-tag-input">
              <input
                id="tags"
                type="text"
                placeholder="输入标签后按回车添加..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <button type="button" onClick={handleAddTag}>添加</button>
            </div>
            {tags.length > 0 && (
              <div className="douban-tags">
                {tags.map((tag) => (
                  <span key={tag} className="douban-tag">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="douban-form-actions">
            <button
              className="douban-cancel-btn"
              onClick={() => navigate('/community/posts')}
            >
              取消
            </button>
            <button
              className="douban-submit-btn"
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || !content.trim()}
            >
              {submitting ? '发布中...' : '发布帖子'}
            </button>
          </div>
        </div>

        <div className="douban-post-tips">
          <h3>发帖小贴士</h3>
          <ul>
            <li>标题要简洁明了，能够准确概括帖子内容</li>
            <li>内容尽量详细，提供足够的背景信息</li>
            <li>使用合适的标签，方便其他用户找到你的帖子</li>
            <li>保持友善和尊重，营造良好的社区氛围</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
