import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

/**
 * 获取所有工作流分类（系统分类 + 用户自定义分类）
 * GET /api/workflow-categories
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    // 获取系统分类和用户自定义分类
    const categories = await prisma.workflowCategory.findMany({
      where: {
        OR: [
          { isSystem: true },
          { userId: userId }
        ]
      },
      include: {
        _count: {
          select: {
            workflowRelations: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    res.json(
      categories.map(category => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        description: category.description,
        order: category.order,
        isSystem: category.isSystem,
        count: category._count.workflowRelations,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }))
    )
  } catch (error) {
    console.error('获取分类列表失败:', error)
    res.status(500).json({ error: '获取分类列表失败' })
  }
})

/**
 * 创建工作流分类
 * POST /api/workflow-categories
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { name, icon, description } = req.body

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: '分类名称不能为空' })
    }

    // 获取当前用户分类的最大 order 值
    const maxOrderCategory = await prisma.workflowCategory.findFirst({
      where: {
        OR: [
          { isSystem: true },
          { userId: userId }
        ]
      },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const category = await prisma.workflowCategory.create({
      data: {
        userId,
        name: name.trim(),
        icon: icon || null,
        description: description || null,
        order: (maxOrderCategory?.order || 0) + 1,
        isSystem: false
      }
    })

    res.status(201).json({
      id: category.id,
      name: category.name,
      icon: category.icon,
      description: category.description,
      order: category.order,
      isSystem: category.isSystem,
      count: 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    })
  } catch (error) {
    console.error('创建分类失败:', error)
    res.status(500).json({ error: '创建分类失败' })
  }
})

/**
 * 更新工作流分类
 * PATCH /api/workflow-categories/:id
 */
router.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params
    const { name, icon, description, order } = req.body

    // 查找分类
    const category = await prisma.workflowCategory.findFirst({
      where: { id }
    })

    if (!category) {
      return res.status(404).json({ error: '分类不存在' })
    }

    // 验证权限：系统分类任何人都可以修改名称和图标，用户分类只有创建者可以修改
    if (!category.isSystem && category.userId !== userId) {
      return res.status(403).json({ error: '没有权限修改此分类' })
    }

    const updateData: any = {}
    if (name !== undefined && name.trim() !== '') {
      updateData.name = name.trim()
    }
    if (icon !== undefined) {
      updateData.icon = icon
    }
    if (description !== undefined) {
      updateData.description = description
    }
    if (order !== undefined && !category.isSystem) {
      // 系统分类不允许修改顺序
      updateData.order = order
    }

    const updated = await prisma.workflowCategory.update({
      where: { id },
      data: updateData
    })

    res.json({
      id: updated.id,
      name: updated.name,
      icon: updated.icon,
      description: updated.description,
      order: updated.order,
      isSystem: updated.isSystem,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    })
  } catch (error) {
    console.error('更新分类失败:', error)
    res.status(500).json({ error: '更新分类失败' })
  }
})

/**
 * 删除工作流分类
 * DELETE /api/workflow-categories/:id
 */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    // 查找分类
    const category = await prisma.workflowCategory.findFirst({
      where: { id }
    })

    if (!category) {
      return res.status(404).json({ error: '分类不存在' })
    }

    // 验证权限：系统分类任何登录用户可以删除，用户分类只有创建者可以删除
    if (!category.isSystem && category.userId !== userId) {
      return res.status(403).json({ error: '没有权限删除此分类' })
    }

    // 删除分类（关联的 workflowRelations 会自动级联删除）
    await prisma.workflowCategory.delete({
      where: { id }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('删除分类失败:', error)
    res.status(500).json({ error: '删除分类失败' })
  }
})

/**
 * 批量更新分类顺序
 * POST /api/workflow-categories/reorder
 */
router.post('/reorder', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { categoryOrders } = req.body

    if (!Array.isArray(categoryOrders)) {
      return res.status(400).json({ error: '无效的参数格式' })
    }

    // 批量更新顺序
    await prisma.$transaction(
      categoryOrders.map(({ id, order }: { id: string; order: number }) =>
        prisma.workflowCategory.updateMany({
          where: {
            id,
            OR: [
              { isSystem: true },
              { userId: userId }
            ]
          },
          data: { order }
        })
      )
    )

    res.json({ success: true })
  } catch (error) {
    console.error('更新分类顺序失败:', error)
    res.status(500).json({ error: '更新分类顺序失败' })
  }
})

export default router
