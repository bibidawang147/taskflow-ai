import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import prisma from '../utils/database'
import { hashPassword, comparePassword } from '../utils/password'
import { generateToken } from '../utils/jwt'
import { createError } from '../middleware/errorHandler'
import { creditService } from '../services/credit.service'

export const register = async (req: Request, res: Response) => {
  try {
    // 验证请求数据
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入数据无效',
        details: errors.array()
      })
    }

    const { name, email, password } = req.body

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(409).json({
        error: '该邮箱已被注册'
      })
    }

    // 哈希密码
    const hashedPassword = await hashPassword(password)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true
      }
    })

    // 初始化用户余额（赠送新用户积分）
    await creditService.initializeUserBalance(user.id)

    // 生成JWT令牌
    const token = generateToken(user.id)

    res.status(201).json({
      message: '注册成功，已赠送 50000 积分',
      user,
      token
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({
      error: '注册失败，请稍后重试'
    })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    // 验证请求数据
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入数据无效',
        details: errors.array()
      })
    }

    const { email, password } = req.body

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({
        error: '邮箱或密码错误'
      })
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        error: '邮箱或密码错误'
      })
    }

    // 生成JWT令牌
    const token = generateToken(user.id)

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user

    res.status(200).json({
      message: '登录成功',
      user: userWithoutPassword,
      token
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({
      error: '登录失败，请稍后重试'
    })
  }
}

export const getProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            workflows: true,
            executions: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      })
    }

    res.status(200).json({
      user
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({
      error: '获取用户信息失败'
    })
  }
}