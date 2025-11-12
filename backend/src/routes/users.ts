import { Router } from 'express'
import { AuthenticatedRequest } from '../middleware/auth'
import { Response } from 'express'
import prisma from '../utils/database'

const router = Router()

// 获取用户的工作流
router.get('/workflows', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const workflows = await prisma.workflow.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        isPublic: true,
        category: true,
        tags: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            executions: true,
            ratings: true,
            favorites: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // 将 tags 从字符串转换为数组
    const formattedWorkflows = workflows.map(wf => ({
      ...wf,
      tags: wf.tags ? wf.tags.split(',').map((t: string) => t.trim()) : []
    }))

    console.log('🔍 返回用户工作流：', {
      userId,
      count: formattedWorkflows.length,
      workflows: formattedWorkflows.map(w => ({ id: w.id, title: w.title, category: w.category, tags: w.tags }))
    })

    res.status(200).json({
      workflows: formattedWorkflows
    })
  } catch (error) {
    console.error('获取工作流错误:', error)
    res.status(500).json({
      error: '获取工作流失败'
    })
  }
})

// 获取用户的执行历史
router.get('/executions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const executions = await prisma.workflowExecution.findMany({
      where: { userId },
      include: {
        workflow: {
          select: {
            id: true,
            title: true,
            thumbnail: true
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.workflowExecution.count({
      where: { userId }
    })

    res.status(200).json({
      executions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取执行历史错误:', error)
    res.status(500).json({
      error: '获取执行历史失败'
    })
  }
})

// 获取用户收藏的工作流
router.get('/favorites', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        workflow: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            category: true,
            tags: true,
            version: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            },
            _count: {
              select: {
                executions: true,
                ratings: true,
                favorites: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 提取工作流数据
    const workflows = favorites.map(fav => fav.workflow)

    res.status(200).json({
      workflows
    })
  } catch (error) {
    console.error('获取收藏列表错误:', error)
    res.status(500).json({
      error: '获取收藏列表失败'
    })
  }
})

// 获取用户数据统计（所有用户数据概览）
router.get('/data-stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    // 统计各类用户数据
    const [
      workflowsCount,
      executionsCount,
      favoritesCount,
      layoutExists
    ] = await Promise.all([
      // 1. 用户创建的工作流（包括已发布和未发布）
      prisma.workflow.count({
        where: { authorId: userId }
      }),
      // 2. 执行记录
      prisma.workflowExecution.count({
        where: { userId }
      }),
      // 3. 收藏
      prisma.favorite.count({
        where: { userId }
      }),
      // 4. 工作台布局
      prisma.workspaceLayout.findUnique({
        where: { userId }
      })
    ])

    // 按类型分组统计工作流
    const workflowsByStatus = await prisma.workflow.groupBy({
      by: ['isPublic', 'isDraft'],
      where: { authorId: userId },
      _count: true
    })

    // 按状态分组统计执行记录
    const executionsByStatus = await prisma.workflowExecution.groupBy({
      by: ['status'],
      where: { userId },
      _count: true
    })

    res.status(200).json({
      summary: {
        workflows: workflowsCount,
        executions: executionsCount,
        favorites: favoritesCount,
        hasLayout: !!layoutExists
      },
      details: {
        workflowsByStatus,
        executionsByStatus
      }
    })
  } catch (error) {
    console.error('获取用户数据统计错误:', error)
    res.status(500).json({
      error: '获取用户数据统计失败'
    })
  }
})

export default router