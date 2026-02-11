import { Router } from 'express'
import { body } from 'express-validator'
import { register, login, getProfile, getWechatAuthUrl, wechatCallback, forgotPassword, resetPassword } from '../controllers/authController'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// 注册验证规则
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('用户名长度必须在2-50个字符之间'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码长度至少8位')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含大小写字母和数字')
]

// 登录验证规则
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
]

// 用户注册
router.post('/register', registerValidation, register)

// 用户登录
router.post('/login', loginValidation, login)

// 获取用户信息
router.get('/profile', authenticateToken, getProfile)

// 微信扫码登录
router.get('/wechat/url', getWechatAuthUrl)
router.get('/wechat/callback', wechatCallback)

// 忘记密码验证规则
const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址')
]

// 重置密码验证规则
const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('重置令牌不能为空'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码长度至少8位')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含大小写字母和数字')
]

// 忘记密码（发送重置邮件）
router.post('/forgot-password', forgotPasswordValidation, forgotPassword)

// 重置密码
router.post('/reset-password', resetPasswordValidation, resetPassword)

export default router