import { Router, Response } from 'express'
import { body } from 'express-validator'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'
import { requireRole } from '../middleware/requireRole'
import { generatePromoCodes, listPromoCodes, deactivatePromoCode } from '../services/adminPromo.service'
import prisma from '../utils/database'

const router = Router()

// 超级管理员邮箱（拥有全部权限）
const SUPER_ADMIN_EMAIL = 'bibidawang147@gmail.com'

const isSuperAdmin = (email: string) => email === SUPER_ADMIN_EMAIL

// 所有管理员路由都需要认证 + admin 角色
router.use(authenticateToken)
router.use(requireRole('admin'))

/**
 * POST /api/admin/promo/generate
 * 批量生成兑换码
 */
router.post(
  '/generate',
  [
    body('count').isInt({ min: 1, max: 1000 }).withMessage('数量需在1-1000之间'),
    body('type').isIn(['invite', 'discount', 'gift', 'annual']).withMessage('无效的码类型'),
    body('plan').isIn(['pro', 'creator']).withMessage('无效的会员等级'),
    body('durationDays').isInt({ min: 1 }).withMessage('有效天数至少为1')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await generatePromoCodes({
        count: req.body.count,
        type: req.body.type,
        plan: req.body.plan,
        durationDays: req.body.durationDays,
        maxUsesPerCode: req.body.maxUsesPerCode ?? 1,
        expiresAt: req.body.expiresAt || null,
        description: req.body.description || '',
        prefix: req.body.prefix || 'LJINVITE',
        createdBy: req.user!.id,
        countsAsEarlyBird: req.body.countsAsEarlyBird ?? false
      })

      return res.json({ success: true, ...result })
    } catch (error: any) {
      console.error('生成兑换码失败:', error)
      return res.status(500).json({ success: false, error: error.message || '生成失败' })
    }
  }
)

/**
 * GET /api/admin/promo/list
 * 查看码列表
 */
router.get('/list', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await listPromoCodes({
      type: req.query.type as string | undefined,
      batchId: req.query.batchId as string | undefined,
      isActive: req.query.isActive === undefined ? undefined : req.query.isActive === 'true',
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20
    })

    return res.json(result)
  } catch (error) {
    console.error('查询码列表失败:', error)
    return res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * PATCH /api/admin/promo/:id/deactivate
 * 停用码
 */
router.patch('/:id/deactivate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await deactivatePromoCode(req.params.id)

    if (!result.success) {
      return res.status(404).json(result)
    }

    return res.json(result)
  } catch (error) {
    console.error('停用码失败:', error)
    return res.status(500).json({ error: '服务器错误' })
  }
})

// ==================== 用户管理 ====================

/**
 * GET /api/admin/promo/users
 * 查看用户列表（分页 + 搜索）
 */
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const search = (req.query.search as string || '').trim()
    const role = req.query.role as string | undefined

    const where: any = {}

    // 搜索：按名称或邮箱模糊匹配
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ]
    }

    // 按角色筛选
    if (role && role !== 'all') {
      where.role = role
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          roleExpiresAt: true,
          tier: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              workflows: true,
              executions: true,
              favorites: true,
              redemptions: true,
              subscriptions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.user.count({ where })
    ])

    // 获取用户积分信息
    const userIds = users.map(u => u.id)
    const balances = await prisma.userBalance.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, coins: true, totalRecharged: true, totalConsumed: true }
    })
    const balanceMap = new Map(balances.map(b => [b.userId, b]))

    const currentUserEmail = req.user!.email || ''
    const currentIsSuperAdmin = isSuperAdmin(currentUserEmail)

    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      role: u.role,
      isSuperAdmin: isSuperAdmin(u.email),
      roleExpiresAt: u.roleExpiresAt?.toISOString() || null,
      tier: u.tier,
      createdAt: u.createdAt.toISOString(),
      stats: {
        workflows: u._count.workflows,
        executions: u._count.executions,
        favorites: u._count.favorites,
        redemptions: u._count.redemptions,
        subscriptions: u._count.subscriptions
      },
      balance: balanceMap.get(u.id) ? {
        coins: balanceMap.get(u.id)!.coins,
        totalRecharged: balanceMap.get(u.id)!.totalRecharged,
        totalConsumed: balanceMap.get(u.id)!.totalConsumed
      } : null
    }))

    return res.json({
      users: formattedUsers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      currentUserIsSuperAdmin: currentIsSuperAdmin
    })
  } catch (error) {
    console.error('查询用户列表失败:', error)
    return res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * PATCH /api/admin/promo/users/:id/role
 * 修改用户角色
 */
router.patch(
  '/users/:id/role',
  [body('role').isIn(['free', 'pro', 'creator', 'admin']).withMessage('无效的角色')],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params
      const { role: newRole, durationDays } = req.body
      const currentEmail = req.user!.email || ''
      const currentIsSuperAdmin = isSuperAdmin(currentEmail)

      const targetUser = await prisma.user.findUnique({ where: { id } })
      if (!targetUser) {
        return res.status(404).json({ error: '用户不存在' })
      }

      // 超级管理员不能被任何人修改角色
      if (isSuperAdmin(targetUser.email)) {
        return res.status(403).json({ error: '无法修改超级管理员' })
      }

      // 普通管理员：不能修改其他管理员，不能把人设为管理员
      if (!currentIsSuperAdmin) {
        if (targetUser.role === 'admin') {
          return res.status(403).json({ error: '权限不足，无法修改管理员' })
        }
        if (newRole === 'admin') {
          return res.status(403).json({ error: '权限不足，只有超级管理员可以设置管理员' })
        }
      }

      const updateData: any = { role: newRole }

      if (newRole === 'free') {
        updateData.roleExpiresAt = null
      } else if (newRole !== 'admin' && durationDays) {
        updateData.roleExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      }

      await prisma.user.update({
        where: { id },
        data: updateData
      })

      return res.json({ success: true, message: `用户角色已更新为 ${newRole}` })
    } catch (error) {
      console.error('修改用户角色失败:', error)
      return res.status(500).json({ error: '服务器错误' })
    }
  }
)

/**
 * DELETE /api/admin/promo/users/:id
 * 删除用户（级联删除所有关联数据）
 */
router.delete('/users/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const adminId = req.user!.id
    const currentEmail = req.user!.email || ''
    const currentIsSuperAdmin = isSuperAdmin(currentEmail)

    if (id === adminId) {
      return res.status(400).json({ error: '不能删除自己' })
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    // 超级管理员不能被任何人删除
    if (isSuperAdmin(user.email)) {
      return res.status(403).json({ error: '无法删除超级管理员' })
    }

    // 普通管理员不能删除其他管理员
    if (!currentIsSuperAdmin && user.role === 'admin') {
      return res.status(403).json({ error: '权限不足，只有超级管理员可以删除管理员' })
    }

    await prisma.user.delete({ where: { id } })

    return res.json({ success: true, message: `用户 ${user.name} 已删除` })
  } catch (error) {
    console.error('删除用户失败:', error)
    return res.status(500).json({ error: '删除用户失败' })
  }
})

/**
 * GET /api/admin/promo/stats
 * 管理后台概览数据
 */
router.get('/stats', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      totalUsers,
      proUsers,
      creatorUsers,
      totalCodes,
      usedCodes,
      totalSubscriptions,
      activeSubscriptions
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'pro' } }),
      prisma.user.count({ where: { role: 'creator' } }),
      prisma.promoCode.count(),
      prisma.promoCode.count({ where: { usedCount: { gt: 0 } } }),
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'active', expiresAt: { gt: new Date() } } })
    ])

    return res.json({
      users: { total: totalUsers, pro: proUsers, creator: creatorUsers, free: totalUsers - proUsers - creatorUsers },
      codes: { total: totalCodes, used: usedCodes, unused: totalCodes - usedCodes },
      subscriptions: { total: totalSubscriptions, active: activeSubscriptions }
    })
  } catch (error) {
    console.error('获取管理后台统计失败:', error)
    return res.status(500).json({ error: '服务器错误' })
  }
})

export default router
