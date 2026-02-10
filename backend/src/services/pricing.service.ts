import prisma from '../utils/database'
import logger from '../utils/logger'

const ROLE_LEVEL: Record<string, number> = { free: 0, pro: 1, creator: 2, admin: 99 }

// ==================== 定价配置 ====================

/**
 * 获取定价配置（单例，不存在则自动创建）
 */
export async function getPricingConfig() {
  let config = await prisma.pricingConfig.findUnique({ where: { id: 'singleton' } })
  if (!config) {
    config = await prisma.pricingConfig.create({
      data: {
        id: 'singleton',
        currentTier: 'early_bird',
        earlyBirdPrice: 199,
        growthPrice: 349,
        standardPrice: 499,
        earlyBirdLimit: 500,
        earlyBirdSold: 0,
        renewalDiscount: 0.7,
        renewalWindowDays: 30,
        growthStartAt: new Date('2026-09-01T00:00:00Z'),
        standardStartAt: new Date('2027-03-01T00:00:00Z'),
      }
    })
  }
  return config
}

/**
 * 确定当前实际生效的定价阶段（纯函数）
 * 优先级：标准价时间 > 成长价时间 > 早鸟售罄 > 早鸟
 */
export function resolveCurrentTier(config: {
  earlyBirdSold: number
  earlyBirdLimit: number
  growthStartAt: Date
  standardStartAt: Date
}): 'early_bird' | 'growth' | 'standard' {
  const now = new Date()
  if (now >= config.standardStartAt) return 'standard'
  if (now >= config.growthStartAt) return 'growth'
  if (config.earlyBirdSold >= config.earlyBirdLimit) return 'growth'
  return 'early_bird'
}

/**
 * 根据阶段获取对应价格
 */
export function getTierPrice(config: {
  earlyBirdPrice: number
  growthPrice: number
  standardPrice: number
}, tier: string): number {
  switch (tier) {
    case 'early_bird': return config.earlyBirdPrice
    case 'growth': return config.growthPrice
    case 'standard': return config.standardPrice
    default: return config.standardPrice
  }
}

// ==================== 公开接口 ====================

/**
 * 获取定价信息（公开接口，可选传 userId 来计算续费资格）
 */
export async function getPricingInfo(userId?: string) {
  const config = await getPricingConfig()
  const effectiveTier = resolveCurrentTier(config)
  const currentPrice = getTierPrice(config, effectiveTier)

  const result: any = {
    currentTier: effectiveTier,
    currentPrice,
    originalPrice: config.standardPrice,
    earlyBirdRemaining: Math.max(0, config.earlyBirdLimit - config.earlyBirdSold),
    earlyBirdLimit: config.earlyBirdLimit,
    earlyBirdSold: config.earlyBirdSold,
    prices: {
      early_bird: config.earlyBirdPrice,
      growth: config.growthPrice,
      standard: config.standardPrice,
    },
    renewalDiscount: config.renewalDiscount,
    renewal: null,
  }

  // 已登录用户：计算续费资格
  if (userId) {
    const now = new Date()
    const activeSubscription = await prisma.subscription.findFirst({
      where: { userId, status: 'active', expiresAt: { gt: now } },
      orderBy: { expiresAt: 'desc' }
    })

    if (activeSubscription) {
      const daysUntilExpiry = Math.ceil(
        (activeSubscription.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )
      const canRenew = daysUntilExpiry <= config.renewalWindowDays
      const renewalPrice = canRenew
        ? Math.round(currentPrice * config.renewalDiscount)
        : null

      result.renewal = {
        canRenew,
        daysUntilExpiry,
        renewalPrice,
        currentSubscriptionExpiresAt: activeSubscription.expiresAt.toISOString(),
      }
    }
  }

  return result
}

// ==================== 购买流程 ====================

/**
 * 创建购买订单（pending 状态，等待管理员确认支付）
 */
export async function purchaseSubscription(params: {
  userId: string
  plan: string
  promoCode?: string
}) {
  const { userId, plan, promoCode } = params
  const config = await getPricingConfig()
  const effectiveTier = resolveCurrentTier(config)
  const currentPrice = getTierPrice(config, effectiveTier)

  // 检查是否有未完成的 pending 订单
  const pendingOrder = await prisma.subscription.findFirst({
    where: { userId, status: 'pending', source: 'purchase' }
  })
  if (pendingOrder) {
    return {
      success: false,
      error: '你有一笔待确认的订单，请等待管理员确认或联系客服'
    }
  }

  const now = new Date()

  // 计算续费资格
  const activeSubscription = await prisma.subscription.findFirst({
    where: { userId, status: 'active', expiresAt: { gt: now } },
    orderBy: { expiresAt: 'desc' }
  })

  let isRenewal = false
  let renewalDiscountRate: number | null = null
  let renewalPrice = currentPrice

  if (activeSubscription) {
    const daysUntilExpiry = Math.ceil(
      (activeSubscription.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    )
    if (daysUntilExpiry <= config.renewalWindowDays) {
      isRenewal = true
      renewalDiscountRate = config.renewalDiscount
      renewalPrice = Math.round(currentPrice * config.renewalDiscount)
    }
  }

  // 计算优惠码折扣
  let promoDiscountPrice = currentPrice
  let promoCodeId: string | null = null

  if (promoCode) {
    const promo = await prisma.promoCode.findUnique({ where: { code: promoCode } })
    if (promo && promo.isActive && promo.discountPercent) {
      const validNow = new Date()
      const isValid =
        promo.isActive &&
        promo.startsAt <= validNow &&
        (!promo.expiresAt || promo.expiresAt > validNow) &&
        (promo.maxUses === null || promo.usedCount < promo.maxUses)

      if (isValid) {
        promoDiscountPrice = Math.round(currentPrice * (1 - promo.discountPercent / 100))
        promoCodeId = promo.id
      }
    }
  }

  // 取更优价格（不叠加）
  let finalAmount: number
  let usedRenewalDiscount = false
  let usedPromoCode = false

  if (isRenewal && renewalPrice <= promoDiscountPrice) {
    finalAmount = renewalPrice
    usedRenewalDiscount = true
  } else if (promoCodeId && promoDiscountPrice < currentPrice) {
    finalAmount = promoDiscountPrice
    usedPromoCode = true
  } else {
    finalAmount = currentPrice
  }

  // 事务：创建订单 + 早鸟配额
  const subscription = await prisma.$transaction(async (tx) => {
    // 早鸟配额检查 & 递增
    if (effectiveTier === 'early_bird') {
      const freshConfig = await tx.pricingConfig.findUnique({ where: { id: 'singleton' } })
      if (freshConfig && freshConfig.earlyBirdSold >= freshConfig.earlyBirdLimit) {
        throw new Error('早鸟名额已售罄')
      }
      await tx.pricingConfig.update({
        where: { id: 'singleton' },
        data: { earlyBirdSold: { increment: 1 } }
      })
    }

    // 计算订阅时段
    const startedAt = activeSubscription && isRenewal
      ? activeSubscription.expiresAt
      : now
    const expiresAt = new Date(startedAt.getTime() + 365 * 24 * 60 * 60 * 1000)

    const sub = await tx.subscription.create({
      data: {
        userId,
        plan,
        status: 'pending',
        source: 'purchase',
        promoCodeId: usedPromoCode ? promoCodeId : null,
        startedAt,
        expiresAt,
        amount: finalAmount,
        priceTier: effectiveTier,
        originalPrice: currentPrice,
        paidAmount: finalAmount,
        isRenewal,
        renewalDiscount: usedRenewalDiscount ? renewalDiscountRate : null,
        paymentMethod: 'wechat',
      }
    })

    // 使用了优惠码则递增
    if (usedPromoCode && promoCodeId) {
      await tx.promoCode.update({
        where: { id: promoCodeId },
        data: { usedCount: { increment: 1 } }
      })
    }

    return sub
  })

  logger.info(`用户 ${userId} 创建购买订单 ${subscription.id}，金额 ¥${finalAmount}，阶段 ${effectiveTier}`)

  return {
    success: true,
    data: {
      subscriptionId: subscription.id,
      plan,
      priceTier: effectiveTier,
      originalPrice: currentPrice,
      paidAmount: finalAmount,
      isRenewal,
      usedPromoCode,
      usedRenewalDiscount,
      startedAt: subscription.startedAt.toISOString(),
      expiresAt: subscription.expiresAt.toISOString(),
      status: 'pending',
    }
  }
}

// ==================== 管理员操作 ====================

/**
 * 管理员确认支付，激活订阅
 */
export async function activateSubscription(subscriptionId: string, adminUserId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { user: { select: { id: true, role: true, roleExpiresAt: true } } }
  })

  if (!sub) {
    return { success: false, error: '订单不存在' }
  }

  if (sub.status !== 'pending') {
    return { success: false, error: `订单状态为 ${sub.status}，无法激活` }
  }

  await prisma.$transaction(async (tx) => {
    // 1. 激活订阅
    await tx.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'active' }
    })

    // 2. 更新用户角色（只升不降，admin 不动）
    const currentLevel = ROLE_LEVEL[sub.user.role] ?? 0
    const newLevel = ROLE_LEVEL[sub.plan] ?? 0

    if (newLevel > currentLevel) {
      await tx.user.update({
        where: { id: sub.userId },
        data: { role: sub.plan, roleExpiresAt: sub.expiresAt }
      })
    } else if (sub.user.role !== 'admin') {
      // 同级别续费：延长到期时间
      const currentExpiry = sub.user.roleExpiresAt
      if (!currentExpiry || sub.expiresAt > currentExpiry) {
        await tx.user.update({
          where: { id: sub.userId },
          data: { roleExpiresAt: sub.expiresAt }
        })
      }
    }
  })

  logger.info(`管理员 ${adminUserId} 确认订单 ${subscriptionId} 支付成功`)

  return { success: true, message: '订阅已激活' }
}

/**
 * 管理员更新定价配置
 */
export async function updatePricingConfig(updates: {
  earlyBirdPrice?: number
  growthPrice?: number
  standardPrice?: number
  earlyBirdLimit?: number
  renewalDiscount?: number
  renewalWindowDays?: number
  growthStartAt?: string
  standardStartAt?: string
}) {
  const data: any = {}
  if (updates.earlyBirdPrice !== undefined) data.earlyBirdPrice = updates.earlyBirdPrice
  if (updates.growthPrice !== undefined) data.growthPrice = updates.growthPrice
  if (updates.standardPrice !== undefined) data.standardPrice = updates.standardPrice
  if (updates.earlyBirdLimit !== undefined) data.earlyBirdLimit = updates.earlyBirdLimit
  if (updates.renewalDiscount !== undefined) data.renewalDiscount = updates.renewalDiscount
  if (updates.renewalWindowDays !== undefined) data.renewalWindowDays = updates.renewalWindowDays
  if (updates.growthStartAt) data.growthStartAt = new Date(updates.growthStartAt)
  if (updates.standardStartAt) data.standardStartAt = new Date(updates.standardStartAt)

  const config = await prisma.pricingConfig.update({
    where: { id: 'singleton' },
    data
  })

  logger.info(`定价配置已更新: ${JSON.stringify(updates)}`)
  return config
}

/**
 * 获取订单列表（管理员用）
 */
export async function listPendingSubscriptions(params: {
  status?: string
  page?: number
  pageSize?: number
}) {
  const { status = 'pending', page = 1, pageSize = 20 } = params

  const where: any = { source: 'purchase' }
  if (status && status !== 'all') where.status = status

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        promoCode: { select: { code: true, discountPercent: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.subscription.count({ where })
  ])

  return {
    subscriptions: subscriptions.map(s => ({
      id: s.id,
      user: s.user,
      plan: s.plan,
      status: s.status,
      priceTier: s.priceTier,
      originalPrice: s.originalPrice,
      paidAmount: s.paidAmount,
      isRenewal: s.isRenewal,
      renewalDiscount: s.renewalDiscount,
      promoCode: s.promoCode?.code || null,
      startedAt: s.startedAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}
