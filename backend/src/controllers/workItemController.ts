import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 扩展 Request 类型，添加用户信息
interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
  }
}

/**
 * 获取日常工作项（本周使用 >= 5次的工作项）
 */
export const getDailyWorkItems = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }

    // 计算一周前的时间
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // 获取本周所有使用记录
    const usageRecords = await prisma.workItemUsage.findMany({
      where: {
        userId,
        usedAt: { gte: weekAgo }
      },
      select: {
        workItemId: true
      }
    })

    // 统计每个工作项的使用次数
    const countMap: Record<string, number> = {}
    usageRecords.forEach(record => {
      countMap[record.workItemId] = (countMap[record.workItemId] || 0) + 1
    })

    // 筛选使用次数 >= 5 的工作项
    const DAILY_WORK_THRESHOLD = 5
    const frequentWorkItemIds = Object.entries(countMap)
      .filter(([_, count]) => count >= DAILY_WORK_THRESHOLD)
      .map(([id, _]) => id)

    if (frequentWorkItemIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0,
        message: '本周暂无频繁使用的工作项'
      })
    }

    // 获取完整的工作项信息
    const workItems = await prisma.workItem.findMany({
      where: {
        id: { in: frequentWorkItemIds }
      }
    })

    // 组合数据
    const result = workItems.map(item => ({
      id: item.id,
      name: item.name,
      icon: item.icon,
      category: item.category,
      description: item.description,
      weeklyUseCount: countMap[item.id] || 0,
      workItemKey: `${item.category}-${item.id}`
    }))
    .sort((a, b) => b.weeklyUseCount - a.weeklyUseCount)
    .slice(0, 12) // 最多返回 12 个

    res.json({
      success: true,
      data: result,
      count: result.length
    })

  } catch (error) {
    console.error('获取日常工作项失败:', error)
    res.status(500).json({
      success: false,
      error: '获取日常工作项失败'
    })
  }
}

/**
 * 记录工作项使用
 */
export const trackWorkItemUsage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const { workItemId } = req.body

    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }

    if (!workItemId) {
      return res.status(400).json({ error: '缺少 workItemId 参数' })
    }

    // 检查工作项是否存在
    const workItem = await prisma.workItem.findUnique({
      where: { id: workItemId }
    })

    if (!workItem) {
      return res.status(404).json({ error: '工作项不存在' })
    }

    // 创建使用记录
    const usage = await prisma.workItemUsage.create({
      data: {
        userId,
        workItemId,
        usedAt: new Date()
      }
    })

    res.status(201).json({
      success: true,
      data: usage,
      message: '使用记录已保存'
    })

  } catch (error) {
    console.error('记录使用失败:', error)
    res.status(500).json({
      success: false,
      error: '记录使用失败'
    })
  }
}

/**
 * 获取所有工作项
 */
export const getAllWorkItems = async (req: Request, res: Response) => {
  try {
    const workItems = await prisma.workItem.findMany({
      orderBy: { name: 'asc' }
    })

    res.json({
      success: true,
      data: workItems,
      count: workItems.length
    })

  } catch (error) {
    console.error('获取工作项失败:', error)
    res.status(500).json({
      success: false,
      error: '获取工作项失败'
    })
  }
}

/**
 * 创建工作项
 */
export const createWorkItem = async (req: Request, res: Response) => {
  try {
    const { name, icon, category, description } = req.body

    // 数据验证
    if (!name || !icon || !category) {
      return res.status(400).json({
        error: '缺少必需字段',
        required: ['name', 'icon', 'category']
      })
    }

    const workItem = await prisma.workItem.create({
      data: {
        name,
        icon,
        category,
        description: description || null
      }
    })

    res.status(201).json({
      success: true,
      data: workItem,
      message: '工作项创建成功'
    })

  } catch (error) {
    console.error('创建工作项失败:', error)
    res.status(500).json({
      success: false,
      error: '创建工作项失败'
    })
  }
}

/**
 * 批量创建工作项（用于初始化数据）
 */
export const batchCreateWorkItems = async (req: Request, res: Response) => {
  try {
    const { items } = req.body

    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: 'items 必须是数组'
      })
    }

    const created = await prisma.workItem.createMany({
      data: items
    })

    res.status(201).json({
      success: true,
      count: created.count,
      message: `成功创建 ${created.count} 个工作项`
    })

  } catch (error) {
    console.error('批量创建工作项失败:', error)
    res.status(500).json({
      success: false,
      error: '批量创建工作项失败'
    })
  }
}
