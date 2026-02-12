import crypto from 'crypto'
import prisma from '../utils/database'
import logger from '../utils/logger'

// 排除容易混淆的字符：0/O、1/I/L
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/**
 * 生成随机码（8位大写字母数字）
 */
function generateRandomCode(length = 8): string {
  const bytes = crypto.randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += CHARSET[bytes[i] % CHARSET.length]
  }
  return result
}

/**
 * 批量生成兑换码
 */
export async function generatePromoCodes(params: {
  count: number
  type: string
  plan: string
  durationDays: number
  maxUsesPerCode?: number | null
  expiresAt?: string | null
  description?: string
  prefix?: string
  createdBy: string
  countsAsEarlyBird?: boolean
}) {
  const {
    count,
    type,
    plan,
    durationDays,
    maxUsesPerCode = 1,
    expiresAt,
    description,
    prefix = 'LJCODE',
    createdBy,
    countsAsEarlyBird = false
  } = params

  const batchId = `batch-${Date.now()}`
  const codes: string[] = []

  // 生成唯一码
  const existingCodes = new Set(
    (await prisma.promoCode.findMany({ select: { code: true } })).map(c => c.code)
  )

  for (let i = 0; i < count; i++) {
    let code: string
    let attempts = 0
    do {
      code = `${prefix}-${generateRandomCode()}`
      attempts++
      if (attempts > 100) throw new Error('生成唯一码失败，请重试')
    } while (existingCodes.has(code))
    existingCodes.add(code)
    codes.push(code)
  }

  // 批量插入
  const data = codes.map(code => ({
    code,
    type,
    plan,
    durationDays,
    maxUses: maxUsesPerCode,
    isActive: true,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    description: description || null,
    createdBy,
    batchId,
    countsAsEarlyBird
  }))

  await prisma.promoCode.createMany({ data })

  logger.info(`管理员 ${createdBy} 生成了 ${count} 个兑换码，批次: ${batchId}`)

  return {
    batchId,
    count: codes.length,
    codes
  }
}

/**
 * 查询码列表（分页 + 筛选）
 */
export async function listPromoCodes(params: {
  type?: string
  batchId?: string
  isActive?: boolean
  page?: number
  pageSize?: number
}) {
  const { type, batchId, isActive, page = 1, pageSize = 20 } = params

  const where: any = {}
  if (type) where.type = type
  if (batchId) where.batchId = batchId
  if (isActive !== undefined) where.isActive = isActive

  const [codes, total] = await Promise.all([
    prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { redemptions: true } }
      }
    }),
    prisma.promoCode.count({ where })
  ])

  return {
    codes: codes.map(c => ({
      id: c.id,
      code: c.code,
      type: c.type,
      plan: c.plan,
      durationDays: c.durationDays,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      isActive: c.isActive,
      startsAt: c.startsAt.toISOString(),
      expiresAt: c.expiresAt?.toISOString() || null,
      description: c.description,
      batchId: c.batchId,
      countsAsEarlyBird: c.countsAsEarlyBird,
      createdAt: c.createdAt.toISOString(),
      redemptionCount: c._count.redemptions
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

/**
 * 停用码
 */
export async function deactivatePromoCode(id: string) {
  const code = await prisma.promoCode.findUnique({ where: { id } })
  if (!code) {
    return { success: false, error: '码不存在' }
  }

  await prisma.promoCode.update({
    where: { id },
    data: { isActive: false }
  })

  logger.info(`兑换码 ${code.code} 已被停用`)
  return { success: true }
}
