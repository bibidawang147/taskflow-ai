import { Router, Response } from 'express'
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth'
import prisma from '../utils/database'
import { permissionService } from '../services/permission.service'

const router = Router()

/**
 * 获取创作者状态和进度
 * GET /api/creator/status
 */
router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const progress = await permissionService.getCreatorProgress(userId)

    res.status(200).json({
      success: true,
      data: progress
    })
  } catch (error) {
    console.error('获取创作者状态错误:', error)
    res.status(500).json({
      success: false,
      error: '获取创作者状态失败'
    })
  }
})

/**
 * 申请成为创作者
 * POST /api/creator/apply
 */
router.post('/apply', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    // 检查是否可以申请
    const canApply = await permissionService.canApplyForCreator(userId)

    if (!canApply.canApply) {
      return res.status(400).json({
        success: false,
        error: canApply.reason,
        currentCount: canApply.currentCount,
        requiredCount: canApply.requiredCount
      })
    }

    // 更新用户状态为待审核
    await prisma.user.update({
      where: { id: userId },
      data: {
        creatorStatus: 'pending',
        creatorAppliedAt: new Date()
      }
    })

    res.status(200).json({
      success: true,
      message: '创作者申请已提交，请等待审核',
      data: {
        status: 'pending',
        appliedAt: new Date()
      }
    })
  } catch (error) {
    console.error('申请创作者错误:', error)
    res.status(500).json({
      success: false,
      error: '申请失败，请稍后重试'
    })
  }
})

/**
 * 审核创作者申请（管理员接口）
 * POST /api/creator/review/:userId
 */
router.post('/review/:userId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.user!.id
    const { userId } = req.params
    const { approved, reason } = req.body

    // TODO: 检查当前用户是否为管理员
    // 暂时简化处理，后续可以添加管理员角色检查

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      })
    }

    if (user.creatorStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: '该用户没有待审核的申请'
      })
    }

    if (approved) {
      // 审核通过
      await prisma.user.update({
        where: { id: userId },
        data: {
          isCreator: true,
          creatorStatus: 'approved',
          creatorApprovedAt: new Date()
        }
      })

      res.status(200).json({
        success: true,
        message: '已批准该用户成为创作者'
      })
    } else {
      // 审核拒绝
      await prisma.user.update({
        where: { id: userId },
        data: {
          creatorStatus: 'rejected'
        }
      })

      res.status(200).json({
        success: true,
        message: '已拒绝该用户的创作者申请'
      })
    }
  } catch (error) {
    console.error('审核创作者申请错误:', error)
    res.status(500).json({
      success: false,
      error: '审核失败'
    })
  }
})

/**
 * 获取待审核的创作者申请列表（管理员接口）
 * GET /api/creator/pending
 */
router.get('/pending', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // TODO: 检查当前用户是否为管理员

    const pendingApplications = await prisma.user.findMany({
      where: {
        creatorStatus: 'pending'
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        tier: true,
        creatorAppliedAt: true,
        _count: {
          select: {
            workflows: {
              where: {
                isPublic: true,
                isDraft: false,
                accessType: 'free'
              }
            }
          }
        }
      },
      orderBy: {
        creatorAppliedAt: 'asc'
      }
    })

    res.status(200).json({
      success: true,
      data: pendingApplications.map(user => ({
        ...user,
        freeWorkflowCount: user._count.workflows
      }))
    })
  } catch (error) {
    console.error('获取待审核申请列表错误:', error)
    res.status(500).json({
      success: false,
      error: '获取列表失败'
    })
  }
})

/**
 * 获取创作者统计数据
 * GET /api/creator/stats
 */
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isCreator: true
      }
    })

    if (!user?.isCreator) {
      return res.status(403).json({
        success: false,
        error: '你还不是创作者'
      })
    }

    // 获取创作者的工作方法统计
    const stats = await prisma.workflow.groupBy({
      by: ['accessType'],
      where: {
        authorId: userId,
        isPublic: true,
        isDraft: false
      },
      _count: true
    })

    // 获取付费工作方法的销售统计
    const salesStats = await prisma.workflowPurchase.aggregate({
      where: {
        workflow: {
          authorId: userId
        }
      },
      _count: true,
      _sum: {
        price: true
      }
    })

    res.status(200).json({
      success: true,
      data: {
        workflowsByType: stats.reduce((acc: any, item) => {
          acc[item.accessType] = item._count
          return acc
        }, { free: 0, member: 0, paid: 0 }),
        totalSales: salesStats._count || 0,
        totalRevenue: salesStats._sum?.price || 0
      }
    })
  } catch (error) {
    console.error('获取创作者统计错误:', error)
    res.status(500).json({
      success: false,
      error: '获取统计失败'
    })
  }
})

export default router
