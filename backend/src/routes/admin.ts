import { Router, Response, NextFunction } from 'express'
import prisma from '../utils/database'
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth'

const router = Router()

// ==================== 管理员中间件 ====================

const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '未登录' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return res.status(403).json({ error: '需要管理员权限' })
    }

    next()
  } catch (error) {
    console.error('管理员验证错误:', error)
    res.status(500).json({ error: '验证失败' })
  }
}

// ==================== 数据概览 ====================

/**
 * 获取管理后台统计数据
 * GET /api/admin/stats
 */
router.get('/stats', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 并行查询所有统计数据
    const [
      totalUsers,
      proUsers,
      creators,
      totalWorkflows,
      publicWorkflows,
      totalInviteCodes,
      usedInviteCodes,
      recentUsers,
      recentWorkflows
    ] = await Promise.all([
      // 用户总数
      prisma.user.count(),
      // Pro 会员数
      prisma.user.count({ where: { tier: 'pro' } }),
      // 创作者数
      prisma.user.count({ where: { isCreator: true } }),
      // 工作流总数
      prisma.workflow.count(),
      // 公开工作流数
      prisma.workflow.count({ where: { isPublic: true } }),
      // 邀请码总数
      prisma.inviteCode.count(),
      // 已使用的邀请码数
      prisma.inviteCodeUsage.count(),
      // 最近7天新增用户
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      // 最近7天新增工作流
      prisma.workflow.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      })
    ])

    res.json({
      users: {
        total: totalUsers,
        pro: proUsers,
        creators: creators,
        recentNew: recentUsers
      },
      workflows: {
        total: totalWorkflows,
        public: publicWorkflows,
        recentNew: recentWorkflows
      },
      inviteCodes: {
        total: totalInviteCodes,
        used: usedInviteCodes
      }
    })
  } catch (error) {
    console.error('获取统计数据错误:', error)
    res.status(500).json({ error: '获取统计数据失败' })
  }
})

// ==================== 邀请码管理 ====================

/**
 * 生成邀请码
 * POST /api/admin/invite-codes
 */
router.post('/invite-codes', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { type, count = 1, maxUses = 1, expiresInDays, note } = req.body

    if (!type || !['beta_tester', 'creator'].includes(type)) {
      return res.status(400).json({ error: '无效的邀请码类型' })
    }

    if (count < 1 || count > 100) {
      return res.status(400).json({ error: '生成数量需在 1-100 之间' })
    }

    // 生成邀请码
    const prefix = type === 'beta_tester' ? 'BETA' : 'CREATOR'
    const codes: string[] = []

    for (let i = 0; i < count; i++) {
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
      codes.push(`${prefix}-${randomPart}`)
    }

    // 计算过期时间
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    // 批量创建邀请码
    const createdCodes = await prisma.$transaction(
      codes.map(code =>
        prisma.inviteCode.create({
          data: {
            code,
            type,
            maxUses: maxUses || null,
            expiresAt,
            note,
            createdBy: userId
          }
        })
      )
    )

    res.json({
      message: `成功生成 ${count} 个邀请码`,
      codes: createdCodes
    })
  } catch (error) {
    console.error('生成邀请码错误:', error)
    res.status(500).json({ error: '生成邀请码失败' })
  }
})

/**
 * 获取邀请码列表
 * GET /api/admin/invite-codes
 */
router.get('/invite-codes', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, isActive, page = 1, limit = 50 } = req.query

    const where: any = {}
    if (type) where.type = type
    if (isActive !== undefined) where.isActive = isActive === 'true'

    const [total, codes] = await Promise.all([
      prisma.inviteCode.count({ where }),
      prisma.inviteCode.findMany({
        where,
        include: {
          usages: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      })
    ])

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      codes
    })
  } catch (error) {
    console.error('获取邀请码列表错误:', error)
    res.status(500).json({ error: '获取邀请码列表失败' })
  }
})

/**
 * 禁用/启用邀请码
 * PATCH /api/admin/invite-codes/:id
 */
router.patch('/invite-codes/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { isActive, note } = req.body

    const updateData: any = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (note !== undefined) updateData.note = note

    const code = await prisma.inviteCode.update({
      where: { id },
      data: updateData
    })

    res.json({ message: '更新成功', code })
  } catch (error) {
    console.error('更新邀请码错误:', error)
    res.status(500).json({ error: '更新邀请码失败' })
  }
})

/**
 * 删除邀请码
 * DELETE /api/admin/invite-codes/:id
 */
router.delete('/invite-codes/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    await prisma.inviteCode.delete({ where: { id } })

    res.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除邀请码错误:', error)
    res.status(500).json({ error: '删除邀请码失败' })
  }
})

// ==================== 用户管理 ====================

/**
 * 获取用户列表
 * GET /api/admin/users
 */
router.get('/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, tier, isCreator, page = 1, limit = 20 } = req.query

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } }
      ]
    }
    if (tier) where.tier = tier
    if (isCreator !== undefined) where.isCreator = isCreator === 'true'

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          tier: true,
          isAdmin: true,
          isCreator: true,
          creatorStatus: true,
          createdAt: true,
          _count: {
            select: {
              workflows: true,
              executions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      })
    ])

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      users
    })
  } catch (error) {
    console.error('获取用户列表错误:', error)
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

/**
 * 更新用户信息（管理员操作）
 * PATCH /api/admin/users/:id
 */
router.patch('/users/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { tier, isCreator, isAdmin } = req.body

    const updateData: any = {}
    if (tier !== undefined) updateData.tier = tier
    if (isCreator !== undefined) {
      updateData.isCreator = isCreator
      if (isCreator) {
        updateData.creatorStatus = 'approved'
        updateData.creatorApprovedAt = new Date()
      }
    }
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        tier: true,
        isAdmin: true,
        isCreator: true,
        creatorStatus: true
      }
    })

    res.json({ message: '更新成功', user })
  } catch (error) {
    console.error('更新用户错误:', error)
    res.status(500).json({ error: '更新用户失败' })
  }
})

// ==================== 使用邀请码（用户端） ====================

/**
 * 使用邀请码
 * POST /api/admin/use-invite-code
 * 注意：这个接口是给普通用户使用的，不需要管理员权限
 */
router.post('/use-invite-code', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { code } = req.body

    if (!code) {
      return res.status(400).json({ error: '请输入邀请码' })
    }

    // 查找邀请码
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        usages: {
          where: { userId }
        }
      }
    })

    if (!inviteCode) {
      return res.status(404).json({ error: '邀请码不存在' })
    }

    if (!inviteCode.isActive) {
      return res.status(400).json({ error: '邀请码已禁用' })
    }

    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
      return res.status(400).json({ error: '邀请码已过期' })
    }

    if (inviteCode.maxUses && inviteCode.usedCount >= inviteCode.maxUses) {
      return res.status(400).json({ error: '邀请码已达到使用上限' })
    }

    if (inviteCode.usages.length > 0) {
      return res.status(400).json({ error: '你已经使用过此邀请码' })
    }

    // 根据邀请码类型执行不同操作
    let grantedTier: string | null = null
    let grantedTierDays: number | null = null
    let grantedCreator = false
    let message = ''

    if (inviteCode.type === 'beta_tester') {
      // 内测邀请：授予1个月Pro会员
      grantedTier = 'pro'
      grantedTierDays = 30
      message = '邀请码使用成功！已获得 1 个月 Pro 会员体验'

      await prisma.user.update({
        where: { id: userId },
        data: { tier: 'pro' }
      })
    } else if (inviteCode.type === 'creator') {
      // 创作者邀请：直接成为创作者
      grantedCreator = true
      message = '邀请码使用成功！已成为创作者'

      await prisma.user.update({
        where: { id: userId },
        data: {
          isCreator: true,
          creatorStatus: 'approved',
          creatorApprovedAt: new Date()
        }
      })
    }

    // 记录使用
    await prisma.$transaction([
      prisma.inviteCodeUsage.create({
        data: {
          inviteCodeId: inviteCode.id,
          userId,
          grantedTier,
          grantedTierDays,
          grantedCreator
        }
      }),
      prisma.inviteCode.update({
        where: { id: inviteCode.id },
        data: { usedCount: { increment: 1 } }
      })
    ])

    res.json({
      success: true,
      message,
      granted: {
        tier: grantedTier,
        tierDays: grantedTierDays,
        creator: grantedCreator
      }
    })
  } catch (error) {
    console.error('使用邀请码错误:', error)
    res.status(500).json({ error: '使用邀请码失败' })
  }
})

export default router
