import express from 'express'
import { authenticateToken } from '../middleware/auth'
import {
  getDailyWorkItems,
  trackWorkItemUsage,
  getAllWorkItems,
  createWorkItem,
  batchCreateWorkItems
} from '../controllers/workItemController'

const router = express.Router()

// 获取日常工作项（本周使用 >= 5次）- 需要登录
router.get('/daily-work', authenticateToken, getDailyWorkItems)

// 获取所有工作项 - 公开接口
router.get('/', getAllWorkItems)

// 创建工作项 - 公开接口（实际项目中可能需要权限控制）
router.post('/', createWorkItem)

// 批量创建工作项 - 用于初始化数据
router.post('/batch', batchCreateWorkItems)

// 记录工作项使用 - 需要登录
router.post('/track-usage', authenticateToken, trackWorkItemUsage)

export default router
