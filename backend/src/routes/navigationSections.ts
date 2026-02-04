import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// 默认的系统分类
const DEFAULT_SECTIONS = [
  { name: '最近使用', type: 'recent', order: 0, isSystem: true },
  { name: '我的AI工作法', type: 'workflows', order: 1, isSystem: true },
  { name: 'AI工作方法收藏夹', type: 'favorites', order: 2, isSystem: true },
  { name: '工作画布', type: 'canvas', order: 3, isSystem: true },
]

/**
 * 获取所有导航一级分类
 * GET /api/navigation-sections
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    // 获取用户自定义的分类
    const userSections = await prisma.navigationSection.findMany({
      where: {
        OR: [
          { isSystem: true },
          { userId: userId }
        ]
      },
      orderBy: {
        order: 'asc'
      }
    })

    // 如果没有任何分类，初始化默认分类
    if (userSections.length === 0) {
      const createdSections = await prisma.$transaction(
        DEFAULT_SECTIONS.map(section =>
          prisma.navigationSection.create({
            data: section
          })
        )
      )
      return res.json(createdSections)
    }

    res.json(userSections)
  } catch (error) {
    console.error('获取导航分类失败:', error)
    res.status(500).json({ error: '获取导航分类失败' })
  }
})

/**
 * 创建导航一级分类
 * POST /api/navigation-sections
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { name, type = 'custom' } = req.body

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: '分类名称不能为空' })
    }

    // 获取最大 order 值
    const maxOrderSection = await prisma.navigationSection.findFirst({
      where: {
        OR: [
          { isSystem: true },
          { userId: userId }
        ]
      },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const section = await prisma.navigationSection.create({
      data: {
        userId,
        name: name.trim(),
        type,
        order: (maxOrderSection?.order || 0) + 1,
        isSystem: false
      }
    })

    res.status(201).json(section)
  } catch (error) {
    console.error('创建导航分类失败:', error)
    res.status(500).json({ error: '创建导航分类失败' })
  }
})

/**
 * 更新导航一级分类
 * PATCH /api/navigation-sections/:id
 */
router.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params
    const { name, isVisible, order } = req.body

    const section = await prisma.navigationSection.findFirst({
      where: { id }
    })

    if (!section) {
      return res.status(404).json({ error: '分类不存在' })
    }

    // 验证权限
    if (!section.isSystem && section.userId !== userId) {
      return res.status(403).json({ error: '没有权限修改此分类' })
    }

    const updateData: any = {}
    if (name !== undefined && name.trim() !== '') {
      updateData.name = name.trim()
    }
    if (isVisible !== undefined) {
      updateData.isVisible = isVisible
    }
    if (order !== undefined) {
      updateData.order = order
    }

    const updated = await prisma.navigationSection.update({
      where: { id },
      data: updateData
    })

    res.json(updated)
  } catch (error) {
    console.error('更新导航分类失败:', error)
    res.status(500).json({ error: '更新导航分类失败' })
  }
})

/**
 * 删除导航一级分类
 * DELETE /api/navigation-sections/:id
 */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    const section = await prisma.navigationSection.findFirst({
      where: { id }
    })

    if (!section) {
      return res.status(404).json({ error: '分类不存在' })
    }

    // "最近使用" 不允许删除
    if (section.type === 'recent') {
      return res.status(403).json({ error: '"最近使用"分类不可删除' })
    }

    // 验证权限
    if (!section.isSystem && section.userId !== userId) {
      return res.status(403).json({ error: '没有权限删除此分类' })
    }

    await prisma.navigationSection.delete({
      where: { id }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('删除导航分类失败:', error)
    res.status(500).json({ error: '删除导航分类失败' })
  }
})

/**
 * 批量更新分类顺序
 * POST /api/navigation-sections/reorder
 */
router.post('/reorder', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { sectionOrders } = req.body

    if (!Array.isArray(sectionOrders)) {
      return res.status(400).json({ error: '无效的参数格式' })
    }

    await prisma.$transaction(
      sectionOrders.map(({ id, order }: { id: string; order: number }) =>
        prisma.navigationSection.updateMany({
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
