import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import crypto from 'crypto'
import prisma from '../utils/database'
import { hashPassword, comparePassword, validatePassword } from '../utils/password'
import { sendPasswordResetEmail } from '../utils/email'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
import { generateToken } from '../utils/jwt'
import { createError } from '../middleware/errorHandler'
import { creditService } from '../services/credit.service'
import { initializeSampleCanvas } from '../services/workspace.service'
import { useReferralCode } from '../services/referral.service'

const WECHAT_APP_ID = process.env.WECHAT_APP_ID || ''
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET || ''
const WECHAT_REDIRECT_URI = process.env.WECHAT_REDIRECT_URI || ''

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

    const { name, email, password, referralCode } = req.body

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

    // 初始化空白画布
    await initializeSampleCanvas(user.id, [])

    // 如果有邀请码，自动使用
    let referralMessage = ''
    if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
      try {
        const referralResult = await useReferralCode(referralCode.trim().toUpperCase(), user.id)
        if (referralResult.success) {
          referralMessage = '，' + referralResult.message
        }
      } catch (e) {
        // 邀请码失败不影响注册
      }
    }

    // 生成JWT令牌
    const token = generateToken(user.id)

    res.status(201).json({
      message: '注册成功，已赠送 50000 积分' + referralMessage,
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

    // 微信用户没有密码，提示用微信登录
    if (!user.password) {
      return res.status(403).json({
        error: '该账号通过微信登录，请使用微信扫码登录'
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

// ==================== 微信扫码登录 ====================

/**
 * 获取微信授权 URL
 */
export const getWechatAuthUrl = async (req: Request, res: Response) => {
  try {
    if (!WECHAT_APP_ID) {
      return res.status(500).json({ error: '微信登录未配置' })
    }

    const state = crypto.randomBytes(16).toString('hex')
    const url = `https://open.weixin.qq.com/connect/qrconnect?appid=${WECHAT_APP_ID}&redirect_uri=${encodeURIComponent(WECHAT_REDIRECT_URI)}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`

    res.json({ url, state })
  } catch (error) {
    console.error('获取微信授权URL错误:', error)
    res.status(500).json({ error: '获取微信授权链接失败' })
  }
}

/**
 * 微信登录回调 — 用 code 换 token
 */
export const wechatCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: '缺少授权码' })
    }

    // 1. 用 code 换 access_token + openid
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}&code=${code}&grant_type=authorization_code`
    const tokenRes = await fetch(tokenUrl)
    const tokenData = await tokenRes.json() as {
      access_token?: string
      openid?: string
      unionid?: string
      errcode?: number
      errmsg?: string
    }

    if (tokenData.errcode || !tokenData.access_token) {
      console.error('微信换token失败:', tokenData)
      return res.status(400).json({ error: '微信授权失败: ' + (tokenData.errmsg || '未知错误') })
    }

    const { access_token, openid, unionid } = tokenData

    // 2. 获取微信用户信息
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`
    const userInfoRes = await fetch(userInfoUrl)
    const wxUser = await userInfoRes.json() as {
      nickname?: string
      headimgurl?: string
      unionid?: string
      errcode?: number
    }

    const wxNickname = wxUser.nickname || '微信用户'
    const wxAvatar = wxUser.headimgurl || null
    const wxUnionId = unionid || wxUser.unionid || null

    // 3. 查找已有用户（先查 openid，再查 unionid）
    let user = await prisma.user.findUnique({
      where: { wechatOpenId: openid }
    })

    if (!user && wxUnionId) {
      user = await prisma.user.findUnique({
        where: { wechatUnionId: wxUnionId }
      })
      // 如果通过 unionid 找到了但 openid 没绑定，补绑
      if (user && !user.wechatOpenId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { wechatOpenId: openid }
        })
      }
    }

    // 4. 新用户 → 自动注册
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: wxNickname,
          email: `wx_${openid}@wechat.placeholder`,
          password: null,
          avatar: wxAvatar,
          wechatOpenId: openid,
          wechatUnionId: wxUnionId,
        }
      })
      // 初始化积分
      await creditService.initializeUserBalance(user.id)
      // 初始化空白画布
      await initializeSampleCanvas(user.id, [])
    } else {
      // 老用户 → 更新头像和昵称（如果微信端改过）
      await prisma.user.update({
        where: { id: user.id },
        data: {
          avatar: wxAvatar || user.avatar,
          name: user.name === '微信用户' ? wxNickname : user.name,
        }
      })
    }

    // 5. 生成 JWT
    const token = generateToken(user.id)
    const { password: _, ...userWithoutPassword } = user

    res.json({
      message: '微信登录成功',
      user: userWithoutPassword,
      token
    })
  } catch (error) {
    console.error('微信登录回调错误:', error)
    res.status(500).json({ error: '微信登录失败，请稍后重试' })
  }
}

// ==================== 密码重置 ====================

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '输入数据无效', details: errors.array() })
    }

    const { email } = req.body
    const genericResponse = { message: '如果该邮箱已注册，我们已发送密码重置链接，请查收邮件' }

    const user = await prisma.user.findUnique({ where: { email } })

    // 用户不存在或微信用户（无密码）→ 返回相同消息防枚举
    if (!user || !user.password) {
      return res.status(200).json(genericResponse)
    }

    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 小时

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry: expiry }
    })

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`

    try {
      await sendPasswordResetEmail(email, resetUrl)
    } catch (emailError) {
      console.error('发送密码重置邮件失败:', emailError)
    }

    res.status(200).json(genericResponse)
  } catch (error) {
    console.error('忘记密码错误:', error)
    res.status(500).json({ error: '操作失败，请稍后重试' })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '输入数据无效', details: errors.array() })
    }

    const { token, email, password } = req.body
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await prisma.user.findUnique({ where: { email } })

    if (
      !user ||
      !user.resetToken ||
      !user.resetTokenExpiry ||
      user.resetToken !== hashedToken ||
      user.resetTokenExpiry < new Date()
    ) {
      return res.status(400).json({ error: '重置链接无效或已过期，请重新申请' })
    }

    const passwordErrors = validatePassword(password)
    if (passwordErrors.length > 0) {
      return res.status(400).json({ error: passwordErrors[0] })
    }

    const hashedPassword = await hashPassword(password)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      }
    })

    res.status(200).json({ message: '密码重置成功，请使用新密码登录' })
  } catch (error) {
    console.error('重置密码错误:', error)
    res.status(500).json({ error: '重置密码失败，请稍后重试' })
  }
}