import prisma from '../utils/database'
import logger from '../utils/logger'

/**
 * 校验兑换码是否有效（不执行兑换）
 */
export async function checkPromoCode(code: string, userId: string) {
  const promo = await prisma.promoCode.findUnique({ where: { code } })

  if (!promo) {
    return { valid: false, error: '无效的兑换码' }
  }

  if (!promo.isActive) {
    return { valid: false, error: '该兑换码已停用' }
  }

  const now = new Date()

  if (promo.startsAt > now) {
    return { valid: false, error: '该兑换码尚未生效' }
  }

  if (promo.expiresAt && promo.expiresAt < now) {
    return { valid: false, error: '该兑换码已过期' }
  }

  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return { valid: false, error: '该兑换码已达到使用上限' }
  }

  // 检查用户是否已使用过
  const existing = await prisma.promoCodeRedemption.findUnique({
    where: { codeId_userId: { codeId: promo.id, userId } }
  })

  if (existing) {
    return { valid: false, error: '你已经使用过这个兑换码了' }
  }

  const planLabel = promo.plan === 'pro' ? 'Pro 会员' : '创作者会员'

  return {
    valid: true,
    data: {
      type: promo.type,
      plan: promo.plan,
      planLabel,
      durationDays: promo.durationDays,
      discountPercent: promo.discountPercent
    }
  }
}

/**
 * 兑换码核心逻辑（事务）
 */
export async function redeemPromoCode(code: string, userId: string) {
  // 先校验
  const check = await checkPromoCode(code, userId)
  if (!check.valid) {
    return { success: false, error: check.error }
  }

  const promo = await prisma.promoCode.findUnique({ where: { code } })
  if (!promo) {
    return { success: false, error: '无效的兑换码' }
  }

  const now = new Date()

  // 获取用户当前活跃订阅，计算叠加时间
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'active',
      expiresAt: { gt: now }
    },
    orderBy: { expiresAt: 'desc' }
  })

  const startedAt = activeSubscription ? activeSubscription.expiresAt : now
  const expiresAt = new Date(startedAt.getTime() + promo.durationDays * 24 * 60 * 60 * 1000)

  // 在事务中执行所有操作
  const result = await prisma.$transaction(async (tx) => {
    // 1. 再次检查 usedCount 防止并发（乐观锁）
    const freshPromo = await tx.promoCode.findUnique({ where: { id: promo.id } })
    if (freshPromo && freshPromo.maxUses !== null && freshPromo.usedCount >= freshPromo.maxUses) {
      throw new Error('该兑换码已达到使用上限')
    }

    // 2. 创建订阅记录
    const subscription = await tx.subscription.create({
      data: {
        userId,
        plan: promo.plan,
        status: 'active',
        source: promo.type === 'invite' ? 'invite_code' : 'promo_code',
        promoCodeId: promo.id,
        startedAt,
        expiresAt
      }
    })

    // 3. 创建兑换记录
    await tx.promoCodeRedemption.create({
      data: {
        codeId: promo.id,
        userId
      }
    })

    // 4. 更新码使用次数
    await tx.promoCode.update({
      where: { id: promo.id },
      data: { usedCount: { increment: 1 } }
    })

    // 4.5 如果此码计入早鸟名额，递增 earlyBirdSold
    if (promo.countsAsEarlyBird) {
      await tx.pricingConfig.update({
        where: { id: 'singleton' },
        data: { earlyBirdSold: { increment: 1 } }
      })
    }

    // 5. 更新用户角色和到期时间（admin 不降级）
    const currentUser = await tx.user.findUnique({ where: { id: userId }, select: { role: true } })
    const ROLE_LEVEL: Record<string, number> = { free: 0, pro: 1, creator: 2, admin: 99 }
    const currentLevel = ROLE_LEVEL[currentUser?.role || 'free'] ?? 0
    const newLevel = ROLE_LEVEL[promo.plan] ?? 0

    if (newLevel > currentLevel) {
      await tx.user.update({
        where: { id: userId },
        data: { role: promo.plan, roleExpiresAt: expiresAt }
      })
    } else if (currentUser?.role !== 'admin') {
      // 非 admin 用户，更新到期时间
      await tx.user.update({
        where: { id: userId },
        data: { roleExpiresAt: expiresAt }
      })
    }

    return subscription
  })

  const planLabel = promo.plan === 'pro' ? 'Pro 会员' : '创作者会员'
  logger.info(`用户 ${userId} 成功兑换码 ${code}，获得 ${planLabel} ${promo.durationDays} 天`)

  return {
    success: true,
    message: `兑换成功！你已获得 ${planLabel} ${promo.durationDays} 天`,
    data: {
      plan: promo.plan,
      planLabel,
      durationDays: promo.durationDays,
      startedAt: result.startedAt.toISOString(),
      expiresAt: result.expiresAt.toISOString()
    }
  }
}

/**
 * 获取用户订阅状态
 */
export async function getUserSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, role: true, roleExpiresAt: true }
  })

  const SUPER_ADMIN_EMAIL = 'bibidawang147@gmail.com'

  if (!user) {
    return null
  }

  const now = new Date()

  // 获取当前活跃订阅
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'active',
      expiresAt: { gt: now }
    },
    orderBy: { expiresAt: 'desc' }
  })

  // 如果角色过期了，当场降级（兜底）
  if (user.role !== 'free' && user.role !== 'admin' && user.roleExpiresAt && user.roleExpiresAt < now && !activeSubscription) {
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'free', roleExpiresAt: null }
    })
    return {
      name: user.name,
      role: 'free',
      isSuperAdmin: user.email === SUPER_ADMIN_EMAIL,
      roleExpiresAt: null,
      daysRemaining: 0,
      activeSubscription: null
    }
  }

  const daysRemaining = user.roleExpiresAt
    ? Math.max(0, Math.ceil((user.roleExpiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
    : 0

  return {
    name: user.name,
    role: user.role,
    isSuperAdmin: user.email === SUPER_ADMIN_EMAIL,
    roleExpiresAt: user.roleExpiresAt?.toISOString() || null,
    daysRemaining,
    activeSubscription: activeSubscription
      ? {
          plan: activeSubscription.plan,
          source: activeSubscription.source,
          startedAt: activeSubscription.startedAt.toISOString(),
          expiresAt: activeSubscription.expiresAt.toISOString()
        }
      : null
  }
}
