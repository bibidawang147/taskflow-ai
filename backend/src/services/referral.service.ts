import prisma from '../utils/database'

const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8
const MAX_USES = 200
const REFERRAL_PREFIX = 'LJ'

function generateCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return `${REFERRAL_PREFIX}-${code}`
}

/**
 * 获取或生成用户的专属邀请码，同时返回已使用次数
 */
export async function getReferralCode(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true }
  })

  if (!user) {
    throw new Error('用户不存在')
  }

  let referralCode = user.referralCode

  // 如果没有邀请码，生成一个
  if (!referralCode) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = generateCode()
      const existing = await prisma.user.findUnique({ where: { referralCode: code } })
      if (!existing) {
        referralCode = code
        break
      }
    }
    if (!referralCode) {
      throw new Error('生成邀请码失败，请重试')
    }

    await prisma.user.update({
      where: { id: userId },
      data: { referralCode }
    })
  }

  // 查询已使用次数：通过该邀请码注册并获得订阅的用户数
  const usedCount = await prisma.subscription.count({
    where: {
      source: 'referral',
      // 通过 paymentId 存储 referrerId 来追踪
      paymentId: userId
    }
  })

  return {
    code: referralCode,
    usedCount,
    maxUses: MAX_USES
  }
}

const ROLE_LEVEL: Record<string, number> = { free: 0, pro: 1, creator: 2, admin: 99 }

/**
 * 使用邀请码：新用户获得30天PRO，邀请人增加7天
 */
export async function useReferralCode(code: string, newUserId: string) {
  // 查找邀请码所属用户
  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true, role: true, roleExpiresAt: true }
  })

  if (!referrer) {
    return { success: false, error: '无效的邀请码' }
  }

  // 不能用自己的邀请码
  if (referrer.id === newUserId) {
    return { success: false, error: '不能使用自己的邀请码' }
  }

  // 检查使用次数
  const usedCount = await prisma.subscription.count({
    where: { source: 'referral', paymentId: referrer.id }
  })
  if (usedCount >= MAX_USES) {
    return { success: false, error: '该邀请码已达到使用上限' }
  }

  // 检查新用户是否已经用过该邀请码（通过 referral source 且 paymentMethod 存 referrer.referralCode）
  const alreadyUsed = await prisma.subscription.findFirst({
    where: {
      userId: newUserId,
      source: 'referral',
      paymentId: referrer.id
    }
  })
  if (alreadyUsed) {
    return { success: false, error: '你已经使用过该邀请码' }
  }

  const now = new Date()
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

  await prisma.$transaction(async (tx) => {
    // === 新用户获得30天PRO ===
    const newUserActiveSub = await tx.subscription.findFirst({
      where: { userId: newUserId, status: 'active', expiresAt: { gt: now } },
      orderBy: { expiresAt: 'desc' }
    })
    const newUserStart = newUserActiveSub ? newUserActiveSub.expiresAt : now
    const newUserExpires = new Date(newUserStart.getTime() + THIRTY_DAYS)

    await tx.subscription.create({
      data: {
        userId: newUserId,
        plan: 'pro',
        status: 'active',
        source: 'referral',
        startedAt: newUserStart,
        expiresAt: newUserExpires,
        paymentId: referrer.id // 用 paymentId 存 referrerId 以追踪
      }
    })

    // 更新新用户角色
    const newUser = await tx.user.findUnique({ where: { id: newUserId }, select: { role: true } })
    const currentLevel = ROLE_LEVEL[newUser?.role || 'free'] ?? 0
    if (currentLevel < ROLE_LEVEL['pro']) {
      await tx.user.update({
        where: { id: newUserId },
        data: { role: 'pro', roleExpiresAt: newUserExpires }
      })
    } else if (newUser?.role !== 'admin') {
      await tx.user.update({
        where: { id: newUserId },
        data: { roleExpiresAt: newUserExpires }
      })
    }

    // === 邀请人增加7天 ===
    const referrerActiveSub = await tx.subscription.findFirst({
      where: { userId: referrer.id, status: 'active', expiresAt: { gt: now } },
      orderBy: { expiresAt: 'desc' }
    })
    const referrerStart = referrerActiveSub ? referrerActiveSub.expiresAt : now
    const referrerExpires = new Date(referrerStart.getTime() + SEVEN_DAYS)

    await tx.subscription.create({
      data: {
        userId: referrer.id,
        plan: 'pro',
        status: 'active',
        source: 'referral',
        startedAt: referrerStart,
        expiresAt: referrerExpires,
        paymentId: referrer.id
      }
    })

    // 更新邀请人角色
    const referrerLevel = ROLE_LEVEL[referrer.role || 'free'] ?? 0
    if (referrerLevel < ROLE_LEVEL['pro']) {
      await tx.user.update({
        where: { id: referrer.id },
        data: { role: 'pro', roleExpiresAt: referrerExpires }
      })
    } else if (referrer.role !== 'admin') {
      // 延长到期时间
      await tx.user.update({
        where: { id: referrer.id },
        data: { roleExpiresAt: referrerExpires }
      })
    }
  })

  return {
    success: true,
    message: '邀请码使用成功！你已获得 Pro 会员 30 天'
  }
}
