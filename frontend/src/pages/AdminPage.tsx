import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAdminStats,
  getInviteCodes,
  createInviteCodes,
  updateInviteCode,
  deleteInviteCode,
  getAdminUsers,
  updateAdminUser,
  type AdminStats,
  type InviteCode,
  type AdminUser
} from '../services/adminApi'
import { useToast } from '../components/ui/Toast'
import { useConfirm } from '../components/ui/ConfirmDialog'
import '../styles/admin.css'

type TabType = 'overview' | 'inviteCodes' | 'users'

export default function AdminPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { showConfirm } = useConfirm()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 统计数据
  const [stats, setStats] = useState<AdminStats | null>(null)

  // 邀请码
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [inviteCodesTotal, setInviteCodesTotal] = useState(0)
  const [codeTypeFilter, setCodeTypeFilter] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    type: 'beta_tester' as 'beta_tester' | 'creator',
    count: 5,
    maxUses: 1,
    expiresInDays: 30,
    note: ''
  })

  // 用户
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(1)

  // 加载统计数据
  const loadStats = async () => {
    try {
      const data = await getAdminStats()
      setStats(data)
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('需要管理员权限')
        setTimeout(() => navigate('/'), 2000)
      } else {
        setError('加载数据失败')
      }
    }
  }

  // 加载邀请码
  const loadInviteCodes = async () => {
    try {
      const data = await getInviteCodes({
        type: codeTypeFilter || undefined,
        limit: 100
      })
      setInviteCodes(data.codes)
      setInviteCodesTotal(data.total)
    } catch (err) {
      console.error('加载邀请码失败:', err)
    }
  }

  // 加载用户
  const loadUsers = async () => {
    try {
      const data = await getAdminUsers({
        search: userSearch || undefined,
        page: userPage,
        limit: 20
      })
      setUsers(data.users)
      setUsersTotal(data.total)
    } catch (err) {
      console.error('加载用户失败:', err)
    }
  }

  // 初始加载
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await loadStats()
      setLoading(false)
    }
    init()
  }, [])

  // 切换 Tab 时加载数据
  useEffect(() => {
    if (activeTab === 'inviteCodes') {
      loadInviteCodes()
    } else if (activeTab === 'users') {
      loadUsers()
    }
  }, [activeTab, codeTypeFilter, userSearch, userPage])

  // 创建邀请码
  const handleCreateCodes = async () => {
    try {
      const result = await createInviteCodes(createForm)
      showToast(result.message, 'success')
      setShowCreateModal(false)
      loadInviteCodes()
      loadStats()
    } catch (err: any) {
      showToast(err.response?.data?.error || '创建失败', 'error')
    }
  }

  // 切换邀请码状态
  const handleToggleCode = async (code: InviteCode) => {
    try {
      await updateInviteCode(code.id, { isActive: !code.isActive })
      loadInviteCodes()
    } catch (err) {
      showToast('操作失败', 'error')
    }
  }

  // 删除邀请码
  const handleDeleteCode = async (code: InviteCode) => {
    const confirmed = await showConfirm({ message: `确定删除邀请码 ${code.code}？`, type: 'danger' })
    if (!confirmed) return
    try {
      await deleteInviteCode(code.id)
      loadInviteCodes()
      loadStats()
    } catch (err) {
      showToast('删除失败', 'error')
    }
  }

  // 更新用户
  const handleUpdateUser = async (user: AdminUser, field: string, value: any) => {
    try {
      await updateAdminUser(user.id, { [field]: value })
      loadUsers()
      loadStats()
    } catch (err) {
      showToast('操作失败', 'error')
    }
  }

  // 复制邀请码
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    showToast('已复制到剪贴板', 'success')
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-error">{error}</div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>管理后台</h1>
        <button className="btn-back" onClick={() => navigate('/')}>
          返回首页
        </button>
      </header>

      <nav className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          数据概览
        </button>
        <button
          className={`tab-btn ${activeTab === 'inviteCodes' ? 'active' : ''}`}
          onClick={() => setActiveTab('inviteCodes')}
        >
          邀请码管理
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          用户管理
        </button>
      </nav>

      <main className="admin-content">
        {/* 数据概览 */}
        {activeTab === 'overview' && stats && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.users.total}</div>
                <div className="stat-label">用户总数</div>
                <div className="stat-sub">+{stats.users.recentNew} 近7天</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.users.pro}</div>
                <div className="stat-label">Pro 会员</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.users.creators}</div>
                <div className="stat-label">创作者</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.workflows.total}</div>
                <div className="stat-label">工作流总数</div>
                <div className="stat-sub">+{stats.workflows.recentNew} 近7天</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.workflows.public}</div>
                <div className="stat-label">公开工作流</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.inviteCodes.used}/{stats.inviteCodes.total}</div>
                <div className="stat-label">邀请码使用</div>
              </div>
            </div>
          </div>
        )}

        {/* 邀请码管理 */}
        {activeTab === 'inviteCodes' && (
          <div className="invite-codes-section">
            <div className="section-header">
              <div className="filter-group">
                <select
                  value={codeTypeFilter}
                  onChange={(e) => setCodeTypeFilter(e.target.value)}
                >
                  <option value="">全部类型</option>
                  <option value="beta_tester">内测邀请</option>
                  <option value="creator">创作者邀请</option>
                </select>
              </div>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                生成邀请码
              </button>
            </div>

            <div className="codes-table">
              <table>
                <thead>
                  <tr>
                    <th>邀请码</th>
                    <th>类型</th>
                    <th>使用情况</th>
                    <th>过期时间</th>
                    <th>备注</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {inviteCodes.map(code => (
                    <tr key={code.id} className={!code.isActive ? 'inactive' : ''}>
                      <td>
                        <span className="code-text">{code.code}</span>
                        <button className="btn-copy" onClick={() => copyCode(code.code)}>
                          复制
                        </button>
                      </td>
                      <td>
                        <span className={`type-badge ${code.type}`}>
                          {code.type === 'beta_tester' ? '内测' : '创作者'}
                        </span>
                      </td>
                      <td>
                        {code.usedCount}/{code.maxUses || '∞'}
                        {code.usages.length > 0 && (
                          <div className="usage-info">
                            {code.usages.map(u => u.user.name).join(', ')}
                          </div>
                        )}
                      </td>
                      <td>
                        {code.expiresAt
                          ? new Date(code.expiresAt).toLocaleDateString()
                          : '永不'}
                      </td>
                      <td>{code.note || '-'}</td>
                      <td>
                        <span className={`status-badge ${code.isActive ? 'active' : 'inactive'}`}>
                          {code.isActive ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-action"
                          onClick={() => handleToggleCode(code)}
                        >
                          {code.isActive ? '禁用' : '启用'}
                        </button>
                        <button
                          className="btn-action btn-danger"
                          onClick={() => handleDeleteCode(code)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {inviteCodes.length === 0 && (
                <div className="empty-state">暂无邀请码</div>
              )}
            </div>
          </div>
        )}

        {/* 用户管理 */}
        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <div className="search-group">
                <input
                  type="text"
                  placeholder="搜索用户名或邮箱"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value)
                    setUserPage(1)
                  }}
                />
              </div>
              <div className="page-info">
                共 {usersTotal} 个用户
              </div>
            </div>

            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>用户</th>
                    <th>邮箱</th>
                    <th>等级</th>
                    <th>创作者</th>
                    <th>管理员</th>
                    <th>工作流</th>
                    <th>注册时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-info">
                          {user.avatar && (
                            <img src={user.avatar} alt="" className="user-avatar" />
                          )}
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <select
                          value={user.tier}
                          onChange={(e) => handleUpdateUser(user, 'tier', e.target.value)}
                        >
                          <option value="free">免费</option>
                          <option value="pro">Pro</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={user.isCreator}
                          onChange={(e) => handleUpdateUser(user, 'isCreator', e.target.checked)}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={user.isAdmin}
                          onChange={(e) => handleUpdateUser(user, 'isAdmin', e.target.checked)}
                        />
                      </td>
                      <td>{user._count.workflows}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn-action"
                          onClick={() => navigate(`/workspace?userId=${user.id}`)}
                        >
                          查看
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {usersTotal > 20 && (
              <div className="pagination">
                <button
                  disabled={userPage === 1}
                  onClick={() => setUserPage(p => p - 1)}
                >
                  上一页
                </button>
                <span>第 {userPage} 页</span>
                <button
                  disabled={userPage * 20 >= usersTotal}
                  onClick={() => setUserPage(p => p + 1)}
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 创建邀请码弹窗 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>生成邀请码</h2>
            <div className="form-group">
              <label>邀请码类型</label>
              <select
                value={createForm.type}
                onChange={(e) => setCreateForm({
                  ...createForm,
                  type: e.target.value as 'beta_tester' | 'creator'
                })}
              >
                <option value="beta_tester">内测邀请（送1个月Pro）</option>
                <option value="creator">创作者邀请（直接成为创作者）</option>
              </select>
            </div>
            <div className="form-group">
              <label>生成数量</label>
              <input
                type="number"
                min="1"
                max="100"
                value={createForm.count}
                onChange={(e) => setCreateForm({
                  ...createForm,
                  count: Number(e.target.value)
                })}
              />
            </div>
            <div className="form-group">
              <label>每个码可用次数（0=无限）</label>
              <input
                type="number"
                min="0"
                value={createForm.maxUses}
                onChange={(e) => setCreateForm({
                  ...createForm,
                  maxUses: Number(e.target.value)
                })}
              />
            </div>
            <div className="form-group">
              <label>有效天数（0=永久）</label>
              <input
                type="number"
                min="0"
                value={createForm.expiresInDays}
                onChange={(e) => setCreateForm({
                  ...createForm,
                  expiresInDays: Number(e.target.value)
                })}
              />
            </div>
            <div className="form-group">
              <label>备注（可选）</label>
              <input
                type="text"
                placeholder="如：给 XXX 用的"
                value={createForm.note}
                onChange={(e) => setCreateForm({
                  ...createForm,
                  note: e.target.value
                })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button className="btn-primary" onClick={handleCreateCodes}>
                生成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
