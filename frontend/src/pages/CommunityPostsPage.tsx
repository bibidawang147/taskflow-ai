import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import communityApi from '../services/communityApi'
import '../styles/community.css'

interface Post {
  id: string
  title: string
  contentPreview: string
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
}

export default function CommunityPostsPage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'latest' | 'hot'>('latest')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchPosts()
  }, [sort, page])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const data = await communityApi.getPosts({
        page,
        limit: 20,
        sort,
        search: searchQuery || undefined
      })
      setPosts(data.posts || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('获取帖子失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchPosts()
  }

  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录')
      navigate('/login')
      return
    }

    try {
      const result = await communityApi.togglePostLike(postId)
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: result.isLiked,
            likeCount: result.likeCount
          }
        }
        return p
      }))
    } catch (error) {
      console.error('点赞失败:', error)
      alert('操作失败，请重试')
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

  return (
    <div className="community-page">
      <div className="community-container">
        <button className="back-button" onClick={() => navigate('/community')}>
          ← 返回社群
        </button>

        <section className="section-block">
          <header className="panel-header">
            <div className="panel-header__main">
              <h2>讨论区</h2>
              <span className="subtitle">分享经验，交流想法，共同成长</span>
            </div>
            <button
              className="primary-button primary-button--solid"
              onClick={() => navigate('/community/posts/new')}
            >
              + 发布新帖
            </button>
          </header>

          {/* 筛选和搜索栏 */}
          <div className="filter-section">
            <div className="filter-tabs">
              <button
                className={`filter-tab ${sort === 'latest' ? 'active' : ''}`}
                onClick={() => setSort('latest')}
              >
                最新
              </button>
              <button
                className={`filter-tab ${sort === 'hot' ? 'active' : ''}`}
                onClick={() => setSort('hot')}
              >
                最热
              </button>
            </div>

            <div className="search-box">
              <input
                type="text"
                placeholder="搜索讨论..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch}>搜索</button>
            </div>
          </div>

          {/* 帖子列表 */}
          {loading ? (
            <div className="loading-state">加载中...</div>
          ) : (
            <>
              <div className="post-list">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="post-item"
                    onClick={() => navigate(`/community/posts/${post.id}`)}
                  >
                    <h3 className="post-item__title">{post.title}</h3>
                    <p className="post-item__preview">{post.contentPreview}</p>
                    <div className="post-item__meta">
                      <span className="meta-author">{post.author.name}</span>
                      <span className="meta-divider">·</span>
                      <span className="meta-time">{formatRelativeTime(post.createdAt)}</span>
                      <span className="meta-divider">·</span>
                      <button
                        className={`meta-like-btn ${post.isLiked ? 'liked' : ''}`}
                        onClick={(e) => handleLike(post.id, e)}
                      >
                        {post.isLiked ? '♥' : '♡'} {post.likeCount}
                      </button>
                      <span className="meta-divider">·</span>
                      <span className="meta-stat">{post.commentCount} 回应</span>
                      <span className="meta-divider">·</span>
                      <span className="meta-stat">{post.viewCount} 浏览</span>
                    </div>
                  </article>
                ))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ← 上一页
                  </button>
                  <span className="pagination-info">第 {page} / {totalPages} 页</span>
                  <button
                    className="pagination-btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    下一页 →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
