import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from './auth'
import prisma from '../utils/database'

/**
 * 各角色功能用量限额
 */
const USAGE_LIMITS: Record<string, Record<string, number>> = {
  free: {
    ai_convert: 5,     // 每月 5 次
    publish: 0,         // 不可发布
    replicate: 0        // 不可复制
  },
  pro: {
    ai_convert: 200,    // 每月 200 次
    publish: 90,        // 每天 3 个（按月 90）
    replicate: 999      // 不限
  },
  creator: {
    ai_convert: 999,
    publish: 999,
    replicate: 999
  },
  admin: {
    ai_convert: 999,
    publish: 999,
    replicate: 999
  }
}

/**
 * 获取下次重置时间（下月1号 00:00 UTC）
 */
function getNextResetDate(): Date {
  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return next
}

/**
 * 用量检查中间件
 * 使用方式: checkUsage('ai_convert')
 */
export function checkUsage(feature: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: '未登录' })
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true }
      })

      const role = user?.role || 'free'
      const limit = USAGE_LIMITS[role]?.[feature] ?? 0

      // 无限使用
      if (limit >= 999) {
        return next()
      }

      // 完全不可用
      if (limit === 0) {
        const featureLabels: Record<string, string> = {
          ai_convert: 'AI 转工作流',
          publish: '发布工作流',
          replicate: '一键复制工作流'
        }
        return res.status(403).json({
          error: `${featureLabels[feature] || feature} 需要升级 Pro 会员`,
          requiredRole: 'pro',
          currentRole: role
        })
      }

      const now = new Date()

      // 获取或创建用量记录
      let usage = await prisma.usageLimit.findUnique({
        where: { userId_feature: { userId: req.user.id, feature } }
      })

      if (!usage) {
        usage = await prisma.usageLimit.create({
          data: {
            userId: req.user.id,
            feature,
            usedCount: 0,
            resetAt: getNextResetDate()
          }
        })
      }

      // 如果已过重置时间，重置计数
      if (usage.resetAt < now) {
        usage = await prisma.usageLimit.update({
          where: { id: usage.id },
          data: {
            usedCount: 0,
            resetAt: getNextResetDate()
          }
        })
      }

      // 检查是否超出限额
      if (usage.usedCount >= limit) {
        return res.status(429).json({
          error: `本月使用次数已达上限（${limit}次），请升级会员`,
          used: usage.usedCount,
          limit,
          resetAt: usage.resetAt.toISOString()
        })
      }

      // 用量+1
      await prisma.usageLimit.update({
        where: { id: usage.id },
        data: { usedCount: { increment: 1 } }
      })

      next()
    } catch (error) {
      console.error('用量检查失败:', error)
      return res.status(500).json({ error: '服务器错误' })
    }
  }
}
