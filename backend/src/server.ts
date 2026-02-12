// 加载环境变量
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'

// Sentry 必须在创建路由之前初始化
import { initSentry } from './config/sentry'
import Sentry from './config/sentry'

import authRoutes from './routes/auth'
import workflowRoutes from './routes/workflows'
import userRoutes from './routes/users'
import workItemRoutes from './routes/workItems'
import aiRoutes from './routes/ai'
import aiRecommendationRoutes from './routes/aiRecommendation'
import creditRoutes from './routes/credit'
import workspaceRoutes from './routes/workspace'
import crawlerRoutes from './routes/crawler.routes'
import queueRoutes from './routes/queue'
import navigationRoutes from './routes/navigation'
import favoritesRoutes from './routes/favorites'
import communityRoutes from './routes/community'
import chatsRoutes from './routes/chats'
import promoRoutes from './routes/promo'
import adminPromoRoutes from './routes/adminPromo'
import pricingRoutes from './routes/pricing'
import { errorHandler } from './middleware/errorHandler'
import { authenticateToken } from './middleware/auth'
import logger, { stream } from './utils/logger'

// 初始化 Sentry（必须在创建 Express app 之前）
initSentry()

// 初始化工具注册表
import { initializeTools } from './tools'
initializeTools()

// 启动 BullMQ Worker
import './workers/workflow.worker'
import './workers/subscription.worker'
import './workers/embedding.worker'
logger.info('🚀 BullMQ Worker 已启动')

const app = express()
const PORT = process.env.PORT || 3000

// 信任代理（因为应用在 Nginx 后面）
app.set('trust proxy', 1)

// 安全中间件
app.use(helmet())

// CORS 配置
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'];


app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如移动应用、Postman等）
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24小时
}))

// 限流配置 - 开发环境放宽限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: process.env.NODE_ENV === 'production' ? 5000 : 10000, // 开发环境10000次，生产环境5000次
  standardHeaders: true, // 返回 RateLimit-* 头
  legacyHeaders: false, // 禁用 X-RateLimit-* 头
  // 开发环境跳过限流
  skip: (req) => process.env.NODE_ENV !== 'production',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后再试'
    })
  }
})
app.use(limiter)

// 日志 - 使用 Winston 流
app.use(morgan('combined', { stream }))

// 解析JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Sentry 请求和追踪处理（必须在所有路由之前）
// Sentry 会自动捕获所有未处理的错误

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() })
})

// 静态文件服务（提供上传的文件）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/users', authenticateToken, userRoutes)
app.use('/api/workflows', workflowRoutes)
app.use('/api/work-items', workItemRoutes)
app.use('/api/workspace', workspaceRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/ai', aiRecommendationRoutes) // AI推荐系统路由
app.use('/api/credit', creditRoutes)
app.use('/api/crawler', crawlerRoutes)
app.use('/api/queue', queueRoutes)
app.use('/api/navigation', navigationRoutes)
app.use('/api/favorites', favoritesRoutes)
app.use('/api/community', communityRoutes) // 社群功能路由
app.use('/api/chats', chatsRoutes) // AI对话会话管理
app.use('/api/promo', promoRoutes) // 邀请码/优惠码
app.use('/api/admin/promo', adminPromoRoutes) // 管理员-码管理
app.use('/api/pricing', pricingRoutes) // 定价+购买+订单管理

// 错误处理
app.use(errorHandler)

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' })
})

const server = app.listen(PORT, async () => {
  logger.info('================================')
  logger.info(`🚀 Workflow Platform Backend`)
  logger.info(`================================`)
  logger.info(`Environment: ${process.env.NODE_ENV}`)
  logger.info(`Port: ${PORT}`)
  logger.info(`Health Check: http://localhost:${PORT}/health`)
  logger.info(`Log Level: ${process.env.LOG_LEVEL || 'info'}`)
  logger.info('================================')

  // 启动时检测：如果还没有 embedding 数据，自动触发全量生成
  try {
    const { enqueueBulkEmbeddingJob } = await import('./queues/embedding.queue')
    const prisma = (await import('./utils/database')).default
    const embeddingCount = await prisma.workflowEmbedding.count()
    const workflowCount = await prisma.workflow.count({ where: { isPublic: true, isDraft: false } })
    if (workflowCount > 0 && embeddingCount < workflowCount * 0.5) {
      logger.info(`Embedding coverage: ${embeddingCount}/${workflowCount}, triggering bulk generation...`)
      await enqueueBulkEmbeddingJob()
    } else {
      logger.info(`Embedding coverage: ${embeddingCount}/${workflowCount}, skip bulk generation`)
    }
  } catch (err) {
    logger.warn('Auto embedding generation check failed (non-blocking):', err)
  }
})

// 设置服务器超时时间为 5 分钟（300秒），以支持长时间的 AI 对话
server.timeout = 300000
server.keepAliveTimeout = 305000
server.headersTimeout = 306000

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server')
  process.exit(0)
})

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  Sentry.captureException(error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  Sentry.captureException(reason)
  process.exit(1)
})