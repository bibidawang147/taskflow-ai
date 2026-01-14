import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

/**
 * 创建收藏标签
 * POST /api/favorites/tags
 */
router.post('/tags', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { name, color, icon } = req.body

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: '标签名称不能为空' })
    }

    // 获取当前用户标签的最大order值
    const maxOrderTag = await prisma.favoriteTag.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const tag = await prisma.favoriteTag.create({
      data: {
        userId,
        name: name.trim(),
        color: color || null,
        icon: icon || null,
        order: (maxOrderTag?.order || 0) + 1
      }
    })

    res.status(201).json(tag)
  } catch (error) {
    console.error('创建标签失败:', error)
    res.status(500).json({ error: '创建标签失败' })
  }
})

/**
 * 获取所有收藏标签
 * GET /api/favorites/tags
 */
router.get('/tags', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const tags = await prisma.favoriteTag.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            tagRelations: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    res.json(
      tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        icon: tag.icon,
        order: tag.order,
        count: tag._count.tagRelations,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt
      }))
    )
  } catch (error) {
    console.error('获取标签列表失败:', error)
    res.status(500).json({ error: '获取标签列表失败' })
  }
})

/**
 * 更新收藏标签
 * PATCH /api/favorites/tags/:id
 */
router.patch('/tags/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params
    const { name, color, icon, order } = req.body

    // 验证标签所有权
    const tag = await prisma.favoriteTag.findFirst({
      where: { id, userId }
    })

    if (!tag) {
      return res.status(404).json({ error: '标签不存在' })
    }

    const updateData: any = {}
    if (name !== undefined && name.trim() !== '') {
      updateData.name = name.trim()
    }
    if (color !== undefined) {
      updateData.color = color
    }
    if (icon !== undefined) {
      updateData.icon = icon
    }
    if (order !== undefined) {
      updateData.order = order
    }

    const updated = await prisma.favoriteTag.update({
      where: { id },
      data: updateData
    })

    res.json(updated)
  } catch (error) {
    console.error('更新标签失败:', error)
    res.status(500).json({ error: '更新标签失败' })
  }
})

/**
 * 删除收藏标签
 * DELETE /api/favorites/tags/:id
 */
router.delete('/tags/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    // 验证标签所有权
    const tag = await prisma.favoriteTag.findFirst({
      where: { id, userId }
    })

    if (!tag) {
      return res.status(404).json({ error: '标签不存在' })
    }

    // 删除标签（关联的tagRelations会自动级联删除）
    await prisma.favoriteTag.delete({
      where: { id }
    })

    res.json({ message: '标签已删除' })
  } catch (error) {
    console.error('删除标签失败:', error)
    res.status(500).json({ error: '删除标签失败' })
  }
})

/**
 * 为收藏添加标签
 * POST /api/favorites/:favoriteId/tags
 */
router.post('/:favoriteId/tags', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { favoriteId } = req.params
    const { tagIds } = req.body

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({ error: '标签ID列表不能为空' })
    }

    // 验证收藏所有权
    const favorite = await prisma.favorite.findFirst({
      where: { id: favoriteId, userId }
    })

    if (!favorite) {
      return res.status(404).json({ error: '收藏不存在' })
    }

    // 验证所有标签都属于当前用户
    const tags = await prisma.favoriteTag.findMany({
      where: {
        id: { in: tagIds },
        userId
      }
    })

    if (tags.length !== tagIds.length) {
      return res.status(400).json({ error: '部分标签不存在或无权限' })
    }

    // 创建标签关联（使用upsert避免重复）
    const relations = await Promise.all(
      tagIds.map(tagId =>
        prisma.favoriteTagRelation.upsert({
          where: {
            favoriteId_tagId: {
              favoriteId,
              tagId
            }
          },
          create: {
            favoriteId,
            tagId
          },
          update: {}
        })
      )
    )

    res.json(relations)
  } catch (error) {
    console.error('添加标签失败:', error)
    res.status(500).json({ error: '添加标签失败' })
  }
})

/**
 * 移除收藏的标签
 * DELETE /api/favorites/:favoriteId/tags/:tagId
 */
router.delete('/:favoriteId/tags/:tagId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { favoriteId, tagId } = req.params

    // 验证收藏所有权
    const favorite = await prisma.favorite.findFirst({
      where: { id: favoriteId, userId }
    })

    if (!favorite) {
      return res.status(404).json({ error: '收藏不存在' })
    }

    // 删除关联
    await prisma.favoriteTagRelation.deleteMany({
      where: {
        favoriteId,
        tagId
      }
    })

    res.json({ message: '标签已移除' })
  } catch (error) {
    console.error('移除标签失败:', error)
    res.status(500).json({ error: '移除标签失败' })
  }
})

/**
 * 批量更新标签顺序
 * POST /api/favorites/tags/reorder
 */
router.post('/tags/reorder', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { tagOrders } = req.body // [{ id: string, order: number }]

    if (!Array.isArray(tagOrders)) {
      return res.status(400).json({ error: '参数格式错误' })
    }

    // 验证所有标签都属于当前用户
    const tagIds = tagOrders.map(t => t.id)
    const tags = await prisma.favoriteTag.findMany({
      where: {
        id: { in: tagIds },
        userId
      }
    })

    if (tags.length !== tagIds.length) {
      return res.status(400).json({ error: '部分标签不存在或无权限' })
    }

    // 批量更新顺序
    await Promise.all(
      tagOrders.map(({ id, order }) =>
        prisma.favoriteTag.update({
          where: { id },
          data: { order }
        })
      )
    )

    res.json({ message: '顺序已更新' })
  } catch (error) {
    console.error('更新顺序失败:', error)
    res.status(500).json({ error: '更新顺序失败' })
  }
})

export default router
