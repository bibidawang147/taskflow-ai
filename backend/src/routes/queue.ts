import { Router, Response } from 'express'
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth'
import { getQueueStats, getJobStatus, cancelJob, retryFailedJob } from '../queues/workflow.queue'
import logger from '../utils/logger'

const router = Router()

// 获取队列统计信息（需要认证）
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await getQueueStats()

    res.status(200).json({
      success: true,
      stats
    })
  } catch (error: any) {
    logger.error('获取队列统计失败:', error)
    res.status(500).json({
      success: false,
      error: '获取队列统计失败'
    })
  }
})

// 获取任务状态（需要认证）
router.get('/job/:jobId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId } = req.params
    const jobStatus = await getJobStatus(jobId)

    if (!jobStatus) {
      return res.status(404).json({
        success: false,
        error: '任务不存在'
      })
    }

    res.status(200).json({
      success: true,
      job: jobStatus
    })
  } catch (error: any) {
    logger.error('获取任务状态失败:', error)
    res.status(500).json({
      success: false,
      error: '获取任务状态失败'
    })
  }
})

// 取消任务（需要认证）
router.post('/job/:jobId/cancel', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId } = req.params
    const success = await cancelJob(jobId)

    if (!success) {
      return res.status(404).json({
        success: false,
        error: '任务不存在或无法取消'
      })
    }

    res.status(200).json({
      success: true,
      message: '任务已取消'
    })
  } catch (error: any) {
    logger.error('取消任务失败:', error)
    res.status(500).json({
      success: false,
      error: '取消任务失败'
    })
  }
})

// 重试失败的任务（需要认证）
router.post('/job/:jobId/retry', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId } = req.params
    const success = await retryFailedJob(jobId)

    if (!success) {
      return res.status(404).json({
        success: false,
        error: '任务不存在或未失败'
      })
    }

    res.status(200).json({
      success: true,
      message: '任务已重新加入队列'
    })
  } catch (error: any) {
    logger.error('重试任务失败:', error)
    res.status(500).json({
      success: false,
      error: '重试任务失败'
    })
  }
})

export default router
