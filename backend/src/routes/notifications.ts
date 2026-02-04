import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

/**
 * 获取用户通知列表
 * GET /api/notifications
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { page = '1', limit = '20', unreadOnly = 'false', type } = req.query

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const where: any = { userId }
    if (unreadOnly === 'true') {
      where.isRead = false
    }
    if (type) {
      where.type = type
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.updateNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          workflow: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          },
          version: {
            select: {
              id: true,
              version: true,
              changelog: true,
              changeType: true
            }
          }
        }
      }),
      prisma.updateNotification.count({ where }),
      prisma.updateNotification.count({ where: { userId, isRead: false } })
    ])

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('获取通知列表失败:', error)
    res.status(500).json({ error: '获取通知列表失败' })
  }
})

/**
 * 获取未读通知数量（轻量接口）
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const count = await prisma.updateNotification.count({
      where: { userId, isRead: false }
    })

    res.json({ count })
  } catch (error) {
    console.error('获取未读数量失败:', error)
    res.status(500).json({ error: '获取未读数量失败' })
  }
})

/**
 * 标记通知为已读
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    const notification = await prisma.updateNotification.findFirst({
      where: { id, userId }
    })

    if (!notification) {
      return res.status(404).json({ error: '通知不存在' })
    }

    const updated = await prisma.updateNotification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    res.json(updated)
  } catch (error) {
    console.error('标记已读失败:', error)
    res.status(500).json({ error: '标记已读失败' })
  }
})

/**
 * 标记全部通知为已读
 * POST /api/notifications/read-all
 */
router.post('/read-all', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const result = await prisma.updateNotification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    res.json({
      updatedCount: result.count,
      message: '已全部标记为已读'
    })
  } catch (error) {
    console.error('标记全部已读失败:', error)
    res.status(500).json({ error: '标记全部已读失败' })
  }
})

/**
 * 忽略/关闭通知
 * PATCH /api/notifications/:id/dismiss
 */
router.patch('/:id/dismiss', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    const notification = await prisma.updateNotification.findFirst({
      where: { id, userId }
    })

    if (!notification) {
      return res.status(404).json({ error: '通知不存在' })
    }

    const updated = await prisma.updateNotification.update({
      where: { id },
      data: {
        isDismissed: true,
        dismissedAt: new Date(),
        isRead: true,
        readAt: notification.readAt || new Date()
      }
    })

    res.json(updated)
  } catch (error) {
    console.error('忽略通知失败:', error)
    res.status(500).json({ error: '忽略通知失败' })
  }
})

/**
 * 删除通知
 * DELETE /api/notifications/:id
 */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    const notification = await prisma.updateNotification.findFirst({
      where: { id, userId }
    })

    if (!notification) {
      return res.status(404).json({ error: '通知不存在' })
    }

    await prisma.updateNotification.delete({
      where: { id }
    })

    res.json({ message: '通知已删除' })
  } catch (error) {
    console.error('删除通知失败:', error)
    res.status(500).json({ error: '删除通知失败' })
  }
})

/**
 * 获取某工作流的更新通知
 * GET /api/notifications/workflow/:workflowId
 */
router.get('/workflow/:workflowId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { workflowId } = req.params

    const notifications = await prisma.updateNotification.findMany({
      where: { userId, workflowId },
      orderBy: { createdAt: 'desc' },
      include: {
        version: {
          select: {
            id: true,
            version: true,
            changelog: true,
            changeType: true,
            publishedAt: true
          }
        }
      }
    })

    res.json(notifications)
  } catch (error) {
    console.error('获取工作流通知失败:', error)
    res.status(500).json({ error: '获取工作流通知失败' })
  }
})

export default router
