import IORedis from 'ioredis'
import logger from '../utils/logger'

// Redis 连接配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // BullMQ 要求
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  }
}

// 创建 Redis 连接
export const createRedisConnection = () => {
  const connection = new IORedis(redisConfig)

  connection.on('connect', () => {
    logger.info('✅ Redis 连接成功')
  })

  connection.on('error', (err) => {
    logger.error('❌ Redis 连接错误:', err)
  })

  connection.on('ready', () => {
    logger.info('🚀 Redis 准备就绪')
  })

  return connection
}

// 导出配置用于 BullMQ
export default redisConfig
