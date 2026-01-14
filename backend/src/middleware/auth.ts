import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
  }
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: '访问令牌缺失' })
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET 未配置')
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string }

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      return res.status(401).json({ error: '用户不存在' })
    }

    req.user = user
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: '无效的访问令牌' })
    }
    return res.status(500).json({ error: '服务器错误' })
  }
}

// 可选认证中间件：如果有token就验证，没有token就跳过
export const optionalAuthenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    // 如果没有token，跳过认证继续执行
    if (!token) {
      return next()
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET 未配置')
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as { userId: string }

      // 验证用户是否存在
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true }
      })

      if (user) {
        req.user = user
      }
    } catch (error) {
      // token无效，继续执行但不设置user
      console.log('可选认证token验证失败，继续执行:', error)
    }

    next()
  } catch (error) {
    console.error('可选认证中间件错误:', error)
    return res.status(500).json({ error: '服务器错误' })
  }
}