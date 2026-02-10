import { Worker, Queue } from 'bullmq'
import { createRedisConnection } from '../queues/redis.config'
import prisma from '../utils/database'
import logger from '../utils/logger'
import { getPricingConfig, resolveCurrentTier } from '../services/pricing.service'

const QUEUE_NAME = 'subscription-expiry'

// 创建队列
const subscriptionQueue = new Queue(QUEUE_NAME, {
  connection: createRedisConnection()
})

// 添加每日凌晨 2:00 执行的定时任务
async function setupRecurringJob() {
  // 先清除旧的重复任务
  const repeatableJobs = await subscriptionQueue.getRepeatableJobs()
  for (const job of repeatableJobs) {
    await subscriptionQueue.removeRepeatableByKey(job.key)
  }

  // 添加新的定时任务：每天凌晨 2:00
  await subscriptionQueue.add(
    'check-expired-subscriptions',
    {},
    {
      repeat: {
        pattern: '0 2 * * *' // cron: 每天凌晨 2:00
      },
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 50 }
    }
  )

  logger.info('订阅过期检查定时任务已设置（每天凌晨 2:00）')

  // 每小时检查定价阶段是否需要自动切换
  await subscriptionQueue.add(
    'check-pricing-tier',
    {},
    {
      repeat: {
        pattern: '0 * * * *' // 每小时整点
      },
      removeOnComplete: { count: 5 },
      removeOnFail: { count: 20 }
    }
  )

  logger.info('定价阶段自动检查任务已设置（每小时）')
}

// 创建 Worker
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    // 定价阶段检查任务
    if (job.name === 'check-pricing-tier') {
      try {
        const config = await getPricingConfig()
        const effectiveTier = resolveCurrentTier(config)
        if (effectiveTier !== config.currentTier) {
          await prisma.pricingConfig.update({
            where: { id: 'singleton' },
            data: { currentTier: effectiveTier }
          })
          logger.info(`定价阶段已从 ${config.currentTier} 切换到 ${effectiveTier}`)
        }
      } catch (err) {
        logger.error('定价阶段检查失败:', err)
      }
      return
    }

    // 过期订阅检查任务
    logger.info('开始检查过期订阅...')

    const now = new Date()

    // 查询所有已过期但仍标记为 active 的订阅
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        expiresAt: { lt: now }
      },
      include: { user: { select: { id: true, name: true, role: true } } }
    })

    let processedCount = 0

    for (const sub of expiredSubscriptions) {
      try {
        // 将订阅标记为过期
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'expired' }
        })

        // 检查该用户是否还有其他活跃订阅
        const otherActiveSub = await prisma.subscription.findFirst({
          where: {
            userId: sub.userId,
            status: 'active',
            expiresAt: { gt: now },
            id: { not: sub.id }
          },
          orderBy: { expiresAt: 'desc' }
        })

        if (!otherActiveSub) {
          // 没有其他活跃订阅，降级为 free
          await prisma.user.update({
            where: { id: sub.userId },
            data: { role: 'free', roleExpiresAt: null }
          })
          logger.info(`用户 ${sub.user.name}(${sub.userId}) 会员已过期，降级为 free`)
        } else {
          // 有其他活跃订阅，更新为最高等级
          await prisma.user.update({
            where: { id: sub.userId },
            data: {
              role: otherActiveSub.plan,
              roleExpiresAt: otherActiveSub.expiresAt
            }
          })
        }

        processedCount++
      } catch (err) {
        logger.error(`处理过期订阅 ${sub.id} 失败:`, err)
      }
    }

    logger.info(`过期订阅检查完成，共处理 ${processedCount} 条`)
  },
  {
    connection: createRedisConnection(),
    concurrency: 1
  }
)

worker.on('completed', (job) => {
  logger.debug(`订阅检查任务完成: ${job.id}`)
})

worker.on('failed', (job, err) => {
  logger.error(`订阅检查任务失败: ${job?.id}`, err)
})

// 启动定时任务
setupRecurringJob().catch(err => {
  logger.error('设置订阅过期定时任务失败:', err)
})

export { subscriptionQueue, worker as subscriptionWorker }
