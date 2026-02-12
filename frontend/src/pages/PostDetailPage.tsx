import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import communityApi from '../services/communityApi'
import { useToast } from '../components/ui/Toast'
import '../styles/community.css'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    avatar?: string
  }
  replies?: Comment[]
}

interface Post {
  id: string
  title: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  likeCount: number
  commentCount: number
  viewCount: number
  createdAt: string
  isLiked: boolean
  comments: Comment[]
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentContent, setCommentContent] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchPost()
    }
  }, [id])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const data = await communityApi.getPostDetail(id!)
      setPost(data)
    } catch (error) {
      console.error('获取帖子详情失败:', error)
      showToast('加载失败', 'error')
      navigate('/community/posts')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      showToast('请先登录', 'warning')
      navigate('/login')
      return
    }

    try {
      const result = await communityApi.togglePostLike(id!)
      setPost(prev => prev ? {
        ...prev,
        isLiked: result.isLiked,
        likeCount: result.likeCount
      } : null)
    } catch (error) {
      console.error('点赞失败:', error)
      showToast('操作失败，请重试', 'error')
    }
  }

  const handleSubmitComment = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      showToast('请先登录', 'warning')
      navigate('/login')
      return
    }

    if (!commentContent.trim()) {
      showToast('请输入评论内容', 'warning')
      return
    }

    try {
      setSubmitting(true)
      await communityApi.createComment(id!, {
        content: commentContent,
        parentId: replyTo?.id
      })
      setCommentContent('')
      setReplyTo(null)
      // 重新加载帖子
      fetchPost()
    } catch (error) {
      console.error('发布评论失败:', error)
      showToast('发布失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return '刚刚'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (!post) {
    return <div className="error">帖子不存在</div>
  }

  return (
    <div className="post-detail-page-douban">
      <div className="douban-container">
        <button className="douban-back-button" onClick={() => navigate('/community/posts')}>
          ← 返回讨论区
        </button>

        {/* 帖子卡片 */}
        <div className="douban-post-card">
          {/* 标题 */}
          <h1 className="douban-post-title">{post.title}</h1>

          {/* 作者信息 */}
          <div className="douban-post-meta">
            <div className="douban-author-info">
              <span className="douban-author-avatar">{post.author.name[0]}</span>
              <span className="douban-author-name">{post.author.name}</span>
            </div>
            <span className="douban-post-time">{formatRelativeTime(post.createdAt)}</span>
            <span className="douban-post-views">浏览 {post.viewCount}</span>
          </div>

          {/* 内容 */}
          <div className="douban-post-content">
            {post.content.split('\n').map((line, i) => (
              <p key={i}>{line || '\u00A0'}</p>
            ))}
          </div>

          {/* 互动栏 */}
          <div className="douban-post-actions">
            <button
              className={`douban-like-button ${post.isLiked ? 'liked' : ''}`}
              onClick={handleLike}
            >
              {post.isLiked ? '♥' : '♡'} {post.likeCount > 0 ? `赞 ${post.likeCount}` : '赞'}
            </button>
            <span className="douban-action-divider">·</span>
            <span className="douban-comment-count">{post.commentCount} 条回应</span>
          </div>
        </div>

        {/* 评论区 */}
        <div className="douban-comments-section">
          <h3 className="douban-comments-title">全部回应 ({post.commentCount})</h3>

          {/* 发布评论框 */}
          <div className="douban-comment-input">
            {replyTo && (
              <div className="douban-reply-tag">
                回复 @{replyTo.name}
                <button onClick={() => setReplyTo(null)}>×</button>
              </div>
            )}
            <textarea
              placeholder={replyTo ? `回复 @${replyTo.name}...` : '写下你的回应...'}
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            rows={3}
          />
            <button
              className="douban-submit-button"
              onClick={handleSubmitComment}
              disabled={submitting || !commentContent.trim()}
            >
              {submitting ? '发布中...' : '发布回应'}
            </button>
          </div>

          {/* 评论列表 */}
          <div className="douban-comments-list">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div key={comment.id} className="douban-comment-item">
                  <div className="douban-comment-avatar">{comment.user.name[0]}</div>
                  <div className="douban-comment-body">
                    <div className="douban-comment-header">
                      <span className="douban-comment-author">{comment.user.name}</span>
                      <span className="douban-comment-time">{formatRelativeTime(comment.createdAt)}</span>
                    </div>
                    <div className="douban-comment-content">{comment.content}</div>
                    <button
                      className="douban-reply-button"
                      onClick={() => setReplyTo({ id: comment.id, name: comment.user.name })}
                    >
                      回应
                    </button>

                    {/* 回复列表 */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="douban-replies-list">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="douban-reply-item">
                            <div className="douban-comment-avatar small">{reply.user.name[0]}</div>
                            <div className="douban-comment-body">
                              <div className="douban-comment-header">
                                <span className="douban-comment-author">{reply.user.name}</span>
                                <span className="douban-comment-time">{formatRelativeTime(reply.createdAt)}</span>
                              </div>
                              <div className="douban-comment-content">{reply.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="douban-no-comments">还没有人回应，快来抢沙发吧</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
