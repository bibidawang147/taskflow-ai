import { Router, Response } from 'express'
import { authenticateToken, optionalAuthenticateToken, AuthenticatedRequest } from '../middleware/auth'
import { requireRole } from '../middleware/requireRole'
import {
  getPricingInfo,
  getPricingConfig,
  purchaseSubscription,
  activateSubscription,
  updatePricingConfig,
  listPendingSubscriptions
} from '../services/pricing.service'
import { getUserSubscription } from '../services/promo.service'

const router = Router()

// ==================== 公开路由 ====================

/**
 * GET /api/pricing
 * 获取当前定价信息（公开，可选认证用于续费计算）
 */
router.get('/', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await getPricingInfo(req.user?.id)
    return res.json(result)
  } catch (error) {
    console.error('获取定价信息失败:', error)
    return res.status(500).json({ error: '获取定价信息失败' })
  }
})

// ==================== 需要登录的路由 ====================

/**
 * POST /api/pricing/purchase
 * 创建购买订单
 */
router.post('/purchase', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { plan, promoCode } = req.body

    if (!plan || plan !== 'pro') {
      return res.status(400).json({ error: '当前仅支持 Pro 方案' })
    }

    const result = await purchaseSubscription({
      userId: req.user!.id,
      plan,
      promoCode: promoCode || undefined
    })

    if (!result.success) {
      return res.status(400).json(result)
    }

    return res.json(result)
  } catch (error: any) {
    console.error('创建订单失败:', error)
    return res.status(400).json({ success: false, error: error.message || '创建订单失败' })
  }
})

/**
 * GET /api/pricing/user-subscription
 * 获取用户详细订阅信息（含续费状态）
 */
router.get('/user-subscription', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [subscription, pricing] = await Promise.all([
      getUserSubscription(req.user!.id),
      getPricingInfo(req.user!.id)
    ])
    return res.json({ subscription, pricing })
  } catch (error) {
    console.error('获取订阅详情失败:', error)
    return res.status(500).json({ error: '获取订阅详情失败' })
  }
})

// ==================== 管理员路由 ====================

/**
 * POST /api/pricing/admin/activate/:id
 * 管理员确认支付
 */
router.post(
  '/admin/activate/:id',
  authenticateToken,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await activateSubscription(req.params.id, req.user!.id)
      if (!result.success) {
        return res.status(400).json(result)
      }
      return res.json(result)
    } catch (error) {
      console.error('激活订阅失败:', error)
      return res.status(500).json({ error: '激活订阅失败' })
    }
  }
)

/**
 * GET /api/pricing/admin/config
 * 获取定价配置
 */
router.get(
  '/admin/config',
  authenticateToken,
  requireRole('admin'),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const config = await getPricingConfig()
      return res.json(config)
    } catch (error) {
      console.error('获取定价配置失败:', error)
      return res.status(500).json({ error: '获取定价配置失败' })
    }
  }
)

/**
 * PATCH /api/pricing/admin/config
 * 更新定价配置
 */
router.patch(
  '/admin/config',
  authenticateToken,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const config = await updatePricingConfig(req.body)
      return res.json({ success: true, config })
    } catch (error) {
      console.error('更新定价配置失败:', error)
      return res.status(500).json({ error: '更新定价配置失败' })
    }
  }
)

/**
 * GET /api/pricing/admin/orders
 * 获取订单列表
 */
router.get(
  '/admin/orders',
  authenticateToken,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await listPendingSubscriptions({
        status: req.query.status as string || 'pending',
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
      })
      return res.json(result)
    } catch (error) {
      console.error('获取订单列表失败:', error)
      return res.status(500).json({ error: '获取订单列表失败' })
    }
  }
)

export default router
