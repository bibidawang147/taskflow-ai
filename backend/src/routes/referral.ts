import { Router, Response } from 'express'
import { body } from 'express-validator'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'
import { getReferralCode, useReferralCode } from '../services/referral.service'

const router = Router()

/**
 * GET /api/referral/my-code
 * 获取当前用户的专属邀请码
 */
router.get('/my-code', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await getReferralCode(req.user!.id)
    return res.json(result)
  } catch (error: any) {
    console.error('获取邀请码失败:', error)
    return res.status(500).json({ error: error.message || '服务器错误' })
  }
})

/**
 * POST /api/referral/use
 * 使用邀请码
 */
router.post(
  '/use',
  authenticateToken,
  [body('code').trim().notEmpty().withMessage('请输入邀请码')],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const code = (req.body.code as string).trim().toUpperCase()
      const result = await useReferralCode(code, req.user!.id)

      if (!result.success) {
        return res.status(400).json(result)
      }

      return res.json(result)
    } catch (error: any) {
      console.error('使用邀请码失败:', error)
      return res.status(500).json({ success: false, error: error.message || '使用失败，请重试' })
    }
  }
)

export default router
