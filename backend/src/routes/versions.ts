import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

/**
 * 获取工作流版本历史
 * GET /api/workflows/:workflowId/versions
 */
router.get('/:workflowId/versions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workflowId } = req.params

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { id: true, currentVersion: true, authorId: true }
    })

    if (!workflow) {
      return res.status(404).json({ error: '工作流不存在' })
    }

    const versions = await prisma.workflowVersion.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        version: true,
        title: true,
        changelog: true,
        changeType: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true
      }
    })

    res.json({
      currentVersion: workflow.currentVersion,
      versions
    })
  } catch (error) {
    console.error('获取版本历史失败:', error)
    res.status(500).json({ error: '获取版本历史失败' })
  }
})

/**
 * 获取特定版本详情
 * GET /api/workflows/:workflowId/versions/:versionId
 */
router.get('/:workflowId/versions/:versionId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workflowId, versionId } = req.params

    const version = await prisma.workflowVersion.findFirst({
      where: { id: versionId, workflowId }
    })

    if (!version) {
      return res.status(404).json({ error: '版本不存在' })
    }

    res.json(version)
  } catch (error) {
    console.error('获取版本详情失败:', error)
    res.status(500).json({ error: '获取版本详情失败' })
  }
})

/**
 * 创建新版本（草稿）
 * POST /api/workflows/:workflowId/versions
 */
router.post('/:workflowId/versions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { workflowId } = req.params
    const { version, changelog, changeType = 'minor' } = req.body

    // 验证工作流所有权
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, authorId: userId }
    })

    if (!workflow) {
      return res.status(404).json({ error: '工作流不存在或无权限' })
    }

    // 自动生成版本号
    let newVersion = version
    if (!newVersion) {
      const latestVersion = await prisma.workflowVersion.findFirst({
        where: { workflowId },
        orderBy: { createdAt: 'desc' },
        select: { version: true }
      })

      if (latestVersion) {
        const parts = latestVersion.version.split('.').map(Number)
        if (changeType === 'major') {
          parts[0]++
          parts[1] = 0
          parts[2] = 0
        } else if (changeType === 'minor') {
          parts[1]++
          parts[2] = 0
        } else {
          parts[2]++
        }
        newVersion = parts.join('.')
      } else {
        newVersion = '1.0.0'
      }
    }

    // 检查版本号是否已存在
    const existingVersion = await prisma.workflowVersion.findFirst({
      where: { workflowId, version: newVersion }
    })

    if (existingVersion) {
      return res.status(400).json({ error: '版本号已存在' })
    }

    // 创建版本快照
    const workflowVersion = await prisma.workflowVersion.create({
      data: {
        workflowId,
        version: newVersion,
        title: workflow.title,
        description: workflow.description,
        config: workflow.config as any,
        changelog,
        changeType,
        isPublished: false
      }
    })

    res.status(201).json({
      version: workflowVersion,
      message: '版本创建成功'
    })
  } catch (error) {
    console.error('创建版本失败:', error)
    res.status(500).json({ error: '创建版本失败' })
  }
})

/**
 * 发布版本
 * POST /api/workflows/:workflowId/versions/:versionId/publish
 */
router.post('/:workflowId/versions/:versionId/publish', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { workflowId, versionId } = req.params
    const { notifySubscribers = true, notificationMessage } = req.body

    // 验证工作流所有权
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, authorId: userId }
    })

    if (!workflow) {
      return res.status(404).json({ error: '工作流不存在或无权限' })
    }

    // 获取版本
    const version = await prisma.workflowVersion.findFirst({
      where: { id: versionId, workflowId }
    })

    if (!version) {
      return res.status(404).json({ error: '版本不存在' })
    }

    if (version.isPublished) {
      return res.status(400).json({ error: '该版本已发布' })
    }

    // 使用事务更新版本和工作流
    const result = await prisma.$transaction(async (tx) => {
      // 更新版本状态
      const publishedVersion = await tx.workflowVersion.update({
        where: { id: versionId },
        data: {
          isPublished: true,
          publishedAt: new Date()
        }
      })

      // 更新工作流当前版本
      await tx.workflow.update({
        where: { id: workflowId },
        data: {
          currentVersion: version.version,
          version: version.version,
          lastPublishedAt: new Date()
        }
      })

      let notificationsCount = 0

      // 发送通知给收藏了该工作流的用户
      if (notifySubscribers) {
        const favorites = await tx.favorite.findMany({
          where: { workflowId },
          select: { userId: true }
        })

        // 排除作者本人
        const subscriberIds = favorites
          .map(f => f.userId)
          .filter(id => id !== userId)

        if (subscriberIds.length > 0) {
          const notificationType = version.changeType === 'major' ? 'major_update' : 'workflow_update'
          const notificationTitle = `${workflow.title} 发布了新版本 v${version.version}`
          const message = notificationMessage || version.changelog || `${workflow.title} 更新到了 v${version.version}`

          // 批量创建通知
          await tx.updateNotification.createMany({
            data: subscriberIds.map(subscriberId => ({
              userId: subscriberId,
              workflowId,
              versionId,
              type: notificationType,
              title: notificationTitle,
              message
            }))
            // skipDuplicates: true  // Commented out due to TypeScript error
          })

          notificationsCount = subscriberIds.length
        }
      }

      return { publishedVersion, notificationsCount }
    })

    res.json({
      version: result.publishedVersion,
      notificationsCount: result.notificationsCount,
      message: '版本发布成功'
    })
  } catch (error) {
    console.error('发布版本失败:', error)
    res.status(500).json({ error: '发布版本失败' })
  }
})

/**
 * 删除草稿版本
 * DELETE /api/workflows/:workflowId/versions/:versionId
 */
router.delete('/:workflowId/versions/:versionId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { workflowId, versionId } = req.params

    // 验证工作流所有权
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, authorId: userId }
    })

    if (!workflow) {
      return res.status(404).json({ error: '工作流不存在或无权限' })
    }

    // 获取版本
    const version = await prisma.workflowVersion.findFirst({
      where: { id: versionId, workflowId }
    })

    if (!version) {
      return res.status(404).json({ error: '版本不存在' })
    }

    if (version.isPublished) {
      return res.status(400).json({ error: '已发布的版本不能删除' })
    }

    await prisma.workflowVersion.delete({
      where: { id: versionId }
    })

    res.json({ message: '版本已删除' })
  } catch (error) {
    console.error('删除版本失败:', error)
    res.status(500).json({ error: '删除版本失败' })
  }
})

/**
 * 回滚到特定版本
 * POST /api/workflows/:workflowId/versions/:versionId/rollback
 */
router.post('/:workflowId/versions/:versionId/rollback', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { workflowId, versionId } = req.params

    // 验证工作流所有权
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, authorId: userId }
    })

    if (!workflow) {
      return res.status(404).json({ error: '工作流不存在或无权限' })
    }

    // 获取版本
    const version = await prisma.workflowVersion.findFirst({
      where: { id: versionId, workflowId }
    })

    if (!version) {
      return res.status(404).json({ error: '版本不存在' })
    }

    // 恢复工作流到该版本的配置
    const updatedWorkflow = await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        title: version.title,
        description: version.description,
        config: version.config as any
      }
    })

    res.json({
      workflow: updatedWorkflow,
      message: `已回滚到版本 v${version.version}`
    })
  } catch (error) {
    console.error('回滚版本失败:', error)
    res.status(500).json({ error: '回滚版本失败' })
  }
})

export default router
