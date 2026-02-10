import { Router, Response } from 'express'
import { body, query } from 'express-validator'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'
import { checkPromoCode, redeemPromoCode, getUserSubscription } from '../services/promo.service'

const router = Router()

/**
 * GET /api/promo/check?code=xxx
 * 预校验兑换码是否有效
 */
router.get('/check', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const code = (req.query.code as string || '').trim().toUpperCase()
    if (!code) {
      return res.status(400).json({ error: '请输入兑换码' })
    }

    const result = await checkPromoCode(code, req.user!.id)

    if (!result.valid) {
      return res.status(400).json({ valid: false, error: result.error })
    }

    return res.json({ valid: true, data: result.data })
  } catch (error) {
    console.error('校验兑换码失败:', error)
    return res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * POST /api/promo/redeem
 * 兑换码
 */
router.post(
  '/redeem',
  authenticateToken,
  [body('code').trim().notEmpty().withMessage('请输入兑换码')],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const code = (req.body.code as string).trim().toUpperCase()

      const result = await redeemPromoCode(code, req.user!.id)

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error })
      }

      return res.json(result)
    } catch (error: any) {
      console.error('兑换码失败:', error)
      const msg = error.message || '兑换失败，请重试'
      return res.status(500).json({ success: false, error: msg })
    }
  }
)

/**
 * GET /api/promo/subscription
 * 查询当前会员状态
 */
router.get('/subscription', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await getUserSubscription(req.user!.id)

    if (!result) {
      return res.status(404).json({ error: '用户不存在' })
    }

    return res.json(result)
  } catch (error) {
    console.error('查询订阅状态失败:', error)
    return res.status(500).json({ error: '服务器错误' })
  }
})

export default router
