import { Router, Response } from 'express'
import { AuthenticatedRequest, authenticateToken, optionalAuthenticateToken } from '../middleware/auth'
import prisma from '../utils/database'

const router = Router()

// ==================== 工作流广场相关API ====================

// 获取工作流广场列表（支持筛选和排序）
router.get('/workflows', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 9 // 默认3x3=9个
    const category = req.query.category as string
    const sort = req.query.sort as string || 'latest' // latest, hot, recommended
    const search = req.query.search as string

    const where: any = {
      isPublic: true,
      isDraft: false
    }

    if (category && category !== '全部') {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ]
    }

    // 排序逻辑
    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'hot') {
      orderBy = { usageCount: 'desc' }
    } else if (sort === 'recommended') {
      orderBy = [
        { rating: 'desc' },
        { usageCount: 'desc' }
      ]
    }

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          category: true,
          tags: true,
          usageCount: true,
          rating: true,
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
              likes: true,
              comments: true,
              favorites: true
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.workflow.count({ where })
    ])

    // 如果用户已登录，查询点赞状态
    let userLikes: string[] = []
    if (req.user?.id) {
      const likes = await prisma.workflowLike.findMany({
        where: {
          userId: req.user.id,
          workflowId: { in: workflows.map(w => w.id) }
        },
        select: { workflowId: true }
      })
      userLikes = likes.map(l => l.workflowId)
    }

    const workflowsWithStats = workflows.map(w => ({
      ...w,
      stats: {
        likes: w._count.likes,
        comments: w._count.comments,
        views: w.usageCount,
        copies: w._count.favorites
      },
      isLiked: userLikes.includes(w.id),
      _count: undefined
    }))

    res.json({
      workflows: workflowsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('获取工作流广场列表失败:', error)
    res.status(500).json({ error: '获取工作流列表失败' })
  }
})

// 点赞/取消点赞工作流
router.post('/workflows/:id/like', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workflowId = req.params.id
    const userId = req.user!.id

    // 检查工作流是否存在
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    })

    if (!workflow) {
      return res.status(404).json({ error: '工作流不存在' })
    }

    // 检查是否已点赞
    const existingLike = await prisma.workflowLike.findUnique({
      where: {
        userId_workflowId: {
          userId,
          workflowId
        }
      }
    })

    if (existingLike) {
      // 取消点赞
      await prisma.workflowLike.delete({
        where: { id: existingLike.id }
      })

      const likeCount = await prisma.workflowLike.count({
        where: { workflowId }
      })

      return res.json({
        message: '已取消点赞',
        isLiked: false,
        likeCount
      })
    } else {
      // 添加点赞
      await prisma.workflowLike.create({
        data: {
          userId,
          workflowId
        }
      })

      const likeCount = await prisma.workflowLike.count({
        where: { workflowId }
      })

      return res.json({
        message: '点赞成功',
        isLiked: true,
        likeCount
      })
    }
  } catch (error: any) {
    console.error('点赞操作失败:', error)
    res.status(500).json({ error: '操作失败' })
  }
})

// 复制工作流到"我的工作台"
router.post('/workflows/:id/copy', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workflowId = req.params.id
    const userId = req.user!.id

    // 查找原工作流
    const originalWorkflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        nodes: true
      }
    })

    if (!originalWorkflow) {
      return res.status(404).json({ error: '工作流不存在' })
    }

    // 创建副本
    const copiedWorkflow = await prisma.workflow.create({
      data: {
        title: `${originalWorkflow.title} (副本)`,
        description: originalWorkflow.description,
        thumbnail: originalWorkflow.thumbnail,
        category: originalWorkflow.category,
        tags: originalWorkflow.tags,
        config: originalWorkflow.config as any,
        isPublic: false,
        isDraft: false,
        authorId: userId,
        nodes: {
          create: originalWorkflow.nodes.map(node => ({
            type: node.type,
            label: node.label,
            position: node.position as any,
            config: node.config as any
          }))
        }
      }
    })

    res.json({
      message: '复制成功',
      workflow: copiedWorkflow
    })
  } catch (error: any) {
    console.error('复制工作流失败:', error)
    res.status(500).json({ error: '复制失败' })
  }
})

// ==================== 讨论区相关API ====================

// 获取讨论帖列表
router.get('/posts', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 6
    const sort = req.query.sort as string || 'latest' // latest, hot
    const search = req.query.search as string

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } }
      ]
    }

    // 排序逻辑
    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'hot') {
      orderBy = [
        { likeCount: 'desc' },
        { commentCount: 'desc' }
      ]
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          tags: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          _count: {
            select: {
              comments: true,
              likes: true
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.post.count({ where })
    ])

    // 如果用户已登录，查询点赞状态
    let userLikes: string[] = []
    if (req.user?.id) {
      const likes = await prisma.postLike.findMany({
        where: {
          userId: req.user.id,
          postId: { in: posts.map(p => p.id) }
        },
        select: { postId: true }
      })
      userLikes = likes.map(l => l.postId)
    }

    const postsWithStats = posts.map(p => ({
      ...p,
      contentPreview: p.content.length > 100 ? p.content.substring(0, 100) + '...' : p.content,
      isLiked: userLikes.includes(p.id)
    }))

    res.json({
      posts: postsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('获取讨论帖列表失败:', error)
    res.status(500).json({ error: '获取帖子列表失败' })
  }
})

// 获取帖子详情
router.get('/posts/:id', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = req.params.id

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        comments: {
          where: { parentId: null }, // 只获取顶级评论
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!post) {
      return res.status(404).json({ error: '帖子不存在' })
    }

    // 增加浏览量
    await prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } }
    })

    // 检查用户是否点赞
    let isLiked = false
    if (req.user?.id) {
      const like = await prisma.postLike.findUnique({
        where: {
          userId_postId: {
            userId: req.user.id,
            postId
          }
        }
      })
      isLiked = !!like
    }

    res.json({
      ...post,
      isLiked
    })
  } catch (error: any) {
    console.error('获取帖子详情失败:', error)
    res.status(500).json({ error: '获取帖子详情失败' })
  }
})

// 发布新帖
router.post('/posts', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, tags } = req.body
    const userId = req.user!.id

    if (!title || !content) {
      return res.status(400).json({ error: '标题和内容不能为空' })
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        tags: tags ? JSON.stringify(tags) : null,
        authorId: userId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    res.status(201).json({
      message: '发布成功',
      post
    })
  } catch (error: any) {
    console.error('发布帖子失败:', error)
    res.status(500).json({ error: '发布失败' })
  }
})

// 点赞/取消点赞帖子
router.post('/posts/:id/like', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = req.params.id
    const userId = req.user!.id

    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return res.status(404).json({ error: '帖子不存在' })
    }

    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    })

    if (existingLike) {
      // 取消点赞
      await Promise.all([
        prisma.postLike.delete({
          where: { id: existingLike.id }
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } }
        })
      ])

      return res.json({
        message: '已取消点赞',
        isLiked: false,
        likeCount: post.likeCount - 1
      })
    } else {
      // 添加点赞
      await Promise.all([
        prisma.postLike.create({
          data: {
            userId,
            postId
          }
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } }
        })
      ])

      return res.json({
        message: '点赞成功',
        isLiked: true,
        likeCount: post.likeCount + 1
      })
    }
  } catch (error: any) {
    console.error('点赞操作失败:', error)
    res.status(500).json({ error: '操作失败' })
  }
})

// 发布评论
router.post('/posts/:id/comments', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = req.params.id
    const { content, parentId } = req.body
    const userId = req.user!.id

    if (!content) {
      return res.status(400).json({ error: '评论内容不能为空' })
    }

    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return res.status(404).json({ error: '帖子不存在' })
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        postId,
        parentId: parentId || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    // 更新帖子评论计数
    await prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } }
    })

    res.status(201).json({
      message: '评论成功',
      comment
    })
  } catch (error: any) {
    console.error('发布评论失败:', error)
    res.status(500).json({ error: '评论失败' })
  }
})

export default router
