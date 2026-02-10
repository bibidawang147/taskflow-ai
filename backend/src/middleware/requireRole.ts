import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from './auth'
import prisma from '../utils/database'

/**
 * 角色等级映射（数字越大权限越高）
 */
const ROLE_LEVEL: Record<string, number> = {
  free: 0,
  pro: 1,
  creator: 2,
  admin: 99
}

/**
 * 角色权限中间件
 * requireRole('pro')    → 需要 pro 或以上
 * requireRole('admin')  → 需要 admin
 */
export function requireRole(...roles: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: '未登录' })
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true, roleExpiresAt: true }
      })

      if (!user) {
        return res.status(401).json({ error: '用户不存在' })
      }

      let currentRole = user.role

      // 检查角色是否已过期（兜底，防止定时任务漏掉）
      if (currentRole !== 'free' && currentRole !== 'admin' && user.roleExpiresAt) {
        if (user.roleExpiresAt < new Date()) {
          // 当场降级
          await prisma.user.update({
            where: { id: req.user.id },
            data: { role: 'free', roleExpiresAt: null }
          })
          currentRole = 'free'
        }
      }

      // 检查是否满足所需角色之一
      const userLevel = ROLE_LEVEL[currentRole] ?? 0
      const hasPermission = roles.some(role => {
        const requiredLevel = ROLE_LEVEL[role] ?? 0
        return userLevel >= requiredLevel
      })

      if (!hasPermission) {
        const roleLabels: Record<string, string> = {
          pro: 'Pro 会员',
          creator: '创作者',
          admin: '管理员'
        }
        const needed = roles.map(r => roleLabels[r] || r).join(' 或 ')
        return res.status(403).json({
          error: `需要 ${needed} 权限`,
          requiredRole: roles,
          currentRole
        })
      }

      next()
    } catch (error) {
      console.error('权限检查失败:', error)
      return res.status(500).json({ error: '服务器错误' })
    }
  }
}
