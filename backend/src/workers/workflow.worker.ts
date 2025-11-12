import { Worker, Job } from 'bullmq'
import redisConfig from '../queues/redis.config'
import { WorkflowJobData } from '../queues/workflow.queue'
import { WorkflowExecutionService } from '../services/workflowExecutionService'
import prisma from '../utils/database'
import logger from '../utils/logger'

// 创建工作流执行 Worker
export const workflowWorker = new Worker<WorkflowJobData>(
  'workflow-execution',
  async (job: Job<WorkflowJobData>) => {
    const { executionId, workflowId, userId, config, input } = job.data
    const startTime = Date.now()

    try {
      logger.info(`🚀 Worker 开始处理任务: ${job.id}, 工作流: ${workflowId}`)

      // 更新任务进度为 0%
      await job.updateProgress({
        percent: 0,
        message: '开始执行工作流'
      })

      // 验证配置
      if (!config || !config.nodes) {
        throw new Error('工作流配置无效')
      }

      // 创建执行引擎实例
      const executionService = new WorkflowExecutionService()

      // 定义进度回调函数
      const progressCallback = async (
        nodeId: string,
        nodeLabel: string,
        currentIndex: number,
        total: number
      ) => {
        try {
          const percent = Math.round((currentIndex / total) * 100)

          // 更新 BullMQ 任务进度
          await job.updateProgress({
            percent,
            currentNode: nodeLabel,
            nodeIndex: currentIndex,
            totalNodes: total,
            message: `执行节点 ${currentIndex}/${total}: ${nodeLabel}`
          })

          // 更新数据库执行记录
          await prisma.workflowExecution.update({
            where: { id: executionId },
            data: {
              progress: `执行节点 ${currentIndex}/${total}: ${nodeLabel}`,
              status: 'running'
            }
          })

          logger.info(`⏳ 任务 ${job.id} 进度: ${percent}% - ${nodeLabel}`)
        } catch (err) {
          logger.error('更新进度失败:', err)
        }
      }

      // 执行工作流
      const result = await executionService.executeWorkflow(
        config,
        input || {},
        progressCallback
      )

      const duration = Date.now() - startTime

      if (result.success) {
        // 执行成功
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            status: 'completed',
            output: result.output,
            nodeResults: result.nodeResults || {},
            duration,
            progress: '执行完成',
            completedAt: new Date()
          }
        })

        // 增加工作流使用次数
        await prisma.workflow.update({
          where: { id: workflowId },
          data: {
            usageCount: {
              increment: 1
            }
          }
        })

        logger.info(`✅ 工作流 ${workflowId} 执行成功，耗时 ${duration}ms`)

        // 返回成功结果
        return {
          success: true,
          executionId,
          workflowId,
          output: result.output,
          duration
        }
      } else {
        // 执行失败
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            status: 'failed',
            error: result.error,
            nodeResults: result.nodeResults || {},
            duration,
            progress: '执行失败',
            completedAt: new Date()
          }
        })

        logger.error(`❌ 工作流 ${workflowId} 执行失败:`, result.error)

        // 抛出错误以便 BullMQ 记录
        throw new Error(result.error || '工作流执行失败')
      }
    } catch (err: any) {
      logger.error('❌ Worker 处理任务时出错:', err)
      const duration = Date.now() - startTime

      // 更新数据库状态
      try {
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            status: 'failed',
            error: err.message || '未知错误',
            duration,
            progress: '执行异常',
            completedAt: new Date()
          }
        })
      } catch (updateErr) {
        logger.error('更新执行状态失败:', updateErr)
      }

      // 重新抛出错误，让 BullMQ 处理重试逻辑
      throw err
    }
  },
  {
    connection: redisConfig,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'), // 并发处理5个任务
    limiter: {
      max: 10, // 每个时间窗口最多处理10个任务
      duration: 1000 // 时间窗口1秒
    }
  }
)

// Worker 事件监听
workflowWorker.on('completed', (job) => {
  logger.info(`✅ Worker 完成任务: ${job.id}`)
})

workflowWorker.on('failed', (job, err) => {
  logger.error(`❌ Worker 任务失败: ${job?.id}, 错误: ${err.message}`)
})

workflowWorker.on('error', (err) => {
  logger.error('❌ Worker 错误:', err)
})

workflowWorker.on('stalled', (jobId) => {
  logger.warn(`⚠️  任务停滞: ${jobId}`)
})

// 优雅关闭
export const closeWorkflowWorker = async () => {
  await workflowWorker.close()
  logger.info('🔒 Worker 已关闭')
}

logger.info(`🔧 工作流 Worker 已启动，并发数: ${process.env.WORKER_CONCURRENCY || 5}`)
