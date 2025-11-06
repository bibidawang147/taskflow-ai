import { Router } from 'express'
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth'
import { Response } from 'express'
import prisma from '../utils/database'

const router = Router()

// 获取用户的工作台布局
router.get('/layout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }

    const layout = await prisma.workspaceLayout.findUnique({
      where: { userId },
      select: {
        layout: true,
        zoom: true,
        snapshot: true,
        updatedAt: true
      }
    })

    if (!layout) {
      return res.status(200).json({
        layout: null,
        message: '未找到保存的布局'
      })
    }

    res.status(200).json(layout)
  } catch (error) {
    console.error('获取工作台布局错误:', error)
    res.status(500).json({
      error: '获取工作台布局失败'
    })
  }
})

// 保存用户的工作台布局
router.post('/layout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { layout, zoom, snapshot } = req.body

    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }

    if (!layout) {
      return res.status(400).json({
        error: '布局数据不能为空'
      })
    }

    const workspaceLayout = await prisma.workspaceLayout.upsert({
      where: { userId },
      create: {
        userId,
        layout,
        zoom: zoom || 1.0,
        snapshot: snapshot || null
      },
      update: {
        layout,
        zoom: zoom || 1.0,
        snapshot: snapshot || null
      }
    })

    res.status(200).json({
      message: '工作台布局保存成功',
      layout: workspaceLayout
    })
  } catch (error) {
    console.error('保存工作台布局错误:', error)
    res.status(500).json({
      error: '保存工作台布局失败'
    })
  }
})

// 重置工作台布局为默认值
router.delete('/layout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }

    await prisma.workspaceLayout.deleteMany({
      where: { userId }
    })

    res.status(200).json({
      message: '工作台布局已重置'
    })
  } catch (error) {
    console.error('重置工作台布局错误:', error)
    res.status(500).json({
      error: '重置工作台布局失败'
    })
  }
})

// 导出完整的工作台数据（包括布局、状态等）
router.get('/export', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }

    const layout = await prisma.workspaceLayout.findUnique({
      where: { userId }
    })

    res.status(200).json({
      exportedAt: new Date().toISOString(),
      userId,
      layout: layout?.layout || null,
      zoom: layout?.zoom || 1.0,
      snapshot: layout?.snapshot || null
    })
  } catch (error) {
    console.error('导出工作台数据错误:', error)
    res.status(500).json({
      error: '导出工作台数据失败'
    })
  }
})

export default router
