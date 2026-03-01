import { Router, Response } from 'express'
import { AuthenticatedRequest, optionalAuthenticateToken } from '../middleware/auth'
import prisma from '../utils/database'
import logger from '../utils/logger'

const router = Router()

// POST /api/events — 接收单个事件
router.post('/', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, event, properties, page, referrer, timestamp } = req.body

    if (!sessionId || !event) {
      return res.status(400).json({ error: 'sessionId and event are required' })
    }

    await prisma.userEvent.create({
      data: {
        userId: req.user?.id || null,
        sessionId,
        event,
        properties: properties ? JSON.stringify(properties) : null,
        page: page || null,
        referrer: referrer || null,
        timestamp: new Date(timestamp || Date.now()),
      }
    })

    res.status(201).json({ ok: true })
  } catch (error) {
    // 追踪失败绝不影响用户体验
    logger.error('Failed to record event:', error)
    res.status(200).json({ ok: true })
  }
})

// POST /api/events/batch — 接收批量事件
router.post('/batch', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { events } = req.body

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'events array is required' })
    }

    // 限制单次最多50条
    const batch = events.slice(0, 50)

    const data = batch.map((evt: any) => ({
      userId: req.user?.id || null,
      sessionId: evt.sessionId || 'unknown',
      event: evt.event || 'unknown',
      properties: evt.properties ? JSON.stringify(evt.properties) : null,
      page: evt.page || null,
      referrer: evt.referrer || null,
      timestamp: new Date(evt.timestamp || Date.now()),
    }))

    await prisma.userEvent.createMany({ data })

    res.status(201).json({ ok: true, count: data.length })
  } catch (error) {
    logger.error('Failed to record batch events:', error)
    res.status(200).json({ ok: true })
  }
})

export default router
