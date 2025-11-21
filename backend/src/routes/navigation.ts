import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

/**
 * 获取侧边栏导航数据
 * GET /api/navigation/sidebar
 */
router.get('/sidebar', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    // 获取用户导航偏好
    let prefs = await prisma.userNavigationPrefs.findUnique({
      where: { userId }
    })

    // 如果不存在，创建默认偏好
    if (!prefs) {
      prefs = await prisma.userNavigationPrefs.create({
        data: {
          userId,
          collapsedSections: '[]',
          favoriteViewMode: 'grid',
          defaultTab: 'explore',
          recentDaysRange: 7
        }
      })
    }

    const recentDays = prefs.recentDaysRange || 7
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - recentDays)

    // 1. 快速开始 - 模板工作流
    const templates = await prisma.workflow.findMany({
      where: {
        isTemplate: true,
        isPublic: true,
        isDraft: false
      },
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
            executions: true
          }
        }
      },
      orderBy: {
        usageCount: 'desc'
      },
      take: 6
    })

    // 2. 推荐工作流（基于用户最常用的分类）
    const userCategories = await prisma.workflow.groupBy({
      by: ['category'],
      where: {
        authorId: userId,
        category: { not: null }
      },
      _count: true,
      orderBy: {
        _count: {
          category: 'desc'
        }
      },
      take: 3
    })

    const topCategories = userCategories
      .map(c => c.category)
      .filter((c): c is string => c !== null)

    const recommended = await prisma.workflow.findMany({
      where: {
        isPublic: true,
        isDraft: false,
        category: topCategories.length > 0 ? { in: topCategories } : undefined,
        authorId: { not: userId }
      },
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
            executions: true
          }
        }
      },
      orderBy: {
        rating: 'desc'
      },
      take: 6
    })

    // 3. 我的工作流 - 最近使用
    const recentWorkflows = await prisma.workflow.findMany({
      where: {
        authorId: userId,
        executions: {
          some: {
            startedAt: {
              gte: recentDate
            }
          }
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        category: true,
        tags: true,
        isDraft: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            executions: true
          }
        },
        executions: {
          orderBy: {
            startedAt: 'desc'
          },
          take: 1,
          select: {
            startedAt: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 20
    })

    // 4. 草稿箱
    const drafts = await prisma.workflow.findMany({
      where: {
        authorId: userId,
        isDraft: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        category: true,
        tags: true,
        isDraft: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            executions: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // 5. 已发布
    const published = await prisma.workflow.findMany({
      where: {
        authorId: userId,
        isDraft: false
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        category: true,
        tags: true,
        isDraft: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            executions: true,
            favorites: true
          }
        },
        executions: {
          orderBy: {
            startedAt: 'desc'
          },
          take: 1,
          select: {
            startedAt: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // 6. 收藏夹
    const favoriteTags = await prisma.favoriteTag.findMany({
      where: { userId },
      include: {
        tagRelations: {
          include: {
            favorite: {
              include: {
                workflow: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    thumbnail: true,
                    category: true,
                    tags: true,
                    isDraft: true,
                    isPublic: true,
                    createdAt: true,
                    updatedAt: true,
                    authorId: true,
                    author: {
                      select: {
                        id: true,
                        name: true,
                        avatar: true
                      }
                    },
                    _count: {
                      select: {
                        executions: true
                      }
                    },
                    executions: {
                      orderBy: {
                        startedAt: 'desc'
                      },
                      take: 1,
                      select: {
                        startedAt: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    // 未分类的收藏
    const uncategorizedFavorites = await prisma.favorite.findMany({
      where: {
        userId,
        tagRelations: {
          none: {}
        }
      },
      include: {
        workflow: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            category: true,
            tags: true,
            isDraft: true,
            isPublic: true,
            createdAt: true,
            updatedAt: true,
            authorId: true,
            author: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            },
            _count: {
              select: {
                executions: true
              }
            },
            executions: {
              orderBy: {
                startedAt: 'desc'
              },
              take: 1,
              select: {
                startedAt: true
              }
            }
          }
        }
      }
    })

    // 构建收藏夹数据结构
    const favoritesData: any = {
      tags: favoriteTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        icon: tag.icon,
        order: tag.order,
        count: tag.tagRelations.length
      })),
      workflows: {},
      uncategorized: uncategorizedFavorites.map(f => ({
        ...f.workflow,
        source: f.workflow.authorId === userId ? 'own' : 'public'
      }))
    }

    // 按标签组织收藏的工作流
    favoriteTags.forEach(tag => {
      favoritesData.workflows[tag.id] = tag.tagRelations.map(rel => ({
        ...rel.favorite.workflow,
        source: rel.favorite.workflow.authorId === userId ? 'own' : 'public'
      }))
    })

    // 7. AI工具（保持现有功能）
    const aiTools = await prisma.tool.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // 返回完整的导航数据
    res.json({
      quickStart: {
        templates,
        recommended
      },
      myWorkflows: {
        recent: recentWorkflows.map(w => ({
          ...w,
          lastUsed: w.executions[0]?.startedAt || w.updatedAt,
          useCount: w._count.executions
        })),
        drafts: drafts.map(w => ({
          ...w,
          useCount: w._count.executions
        })),
        published: published.map(w => ({
          ...w,
          lastUsed: w.executions[0]?.startedAt || w.updatedAt,
          useCount: w._count.executions,
          favoriteCount: w._count.favorites
        }))
      },
      favorites: favoritesData,
      aiTools,
      preferences: {
        collapsedSections: prefs.collapsedSections ? JSON.parse(prefs.collapsedSections) : [],
        favoriteViewMode: prefs.favoriteViewMode,
        defaultTab: prefs.defaultTab,
        recentDaysRange: prefs.recentDaysRange
      }
    })
  } catch (error) {
    console.error('获取导航数据失败:', error)
    res.status(500).json({ error: '获取导航数据失败' })
  }
})

/**
 * 更新用户导航偏好
 * PATCH /api/navigation/preferences
 */
router.patch('/preferences', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { collapsedSections, favoriteViewMode, defaultTab, recentDaysRange } = req.body

    const updateData: any = {}

    if (collapsedSections !== undefined) {
      updateData.collapsedSections = JSON.stringify(collapsedSections)
    }
    if (favoriteViewMode !== undefined) {
      updateData.favoriteViewMode = favoriteViewMode
    }
    if (defaultTab !== undefined) {
      updateData.defaultTab = defaultTab
    }
    if (recentDaysRange !== undefined) {
      updateData.recentDaysRange = recentDaysRange
    }

    const prefs = await prisma.userNavigationPrefs.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
        collapsedSections: updateData.collapsedSections || '[]',
        favoriteViewMode: updateData.favoriteViewMode || 'grid',
        defaultTab: updateData.defaultTab || 'explore',
        recentDaysRange: updateData.recentDaysRange || 7
      }
    })

    res.json({
      ...prefs,
      collapsedSections: prefs.collapsedSections ? JSON.parse(prefs.collapsedSections) : []
    })
  } catch (error) {
    console.error('更新导航偏好失败:', error)
    res.status(500).json({ error: '更新导航偏好失败' })
  }
})

export default router
