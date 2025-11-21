import { Router } from 'express'
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth'
import { Response } from 'express'
import prisma from '../utils/database'

const router = Router()

// 获取用户的所有对话会话
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }

    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        messages: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // 将JSON字段转换为数组
    const formattedSessions = sessions.map(session => ({
      ...session,
      messages: Array.isArray(session.messages) ? session.messages : JSON.parse(session.messages as string),
    }))

    res.json(formattedSessions)
  } catch (error) {
    console.error('获取对话会话列表失败:', error)
    res.status(500).json({ error: '获取对话会话列表失败' })
  }
})

// 获取单个对话会话
router.get('/:sessionId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }
    const { sessionId } = req.params

    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      select: {
        id: true,
        title: true,
        messages: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!session) {
      return res.status(404).json({ error: '对话会话不存在' })
    }

    // 将JSON字段转换为数组
    const formattedSession = {
      ...session,
      messages: Array.isArray(session.messages) ? session.messages : JSON.parse(session.messages as string),
    }

    res.json(formattedSession)
  } catch (error) {
    console.error('获取对话会话失败:', error)
    res.status(500).json({ error: '获取对话会话失败' })
  }
})

// 创建新对话会话
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }
    const { title = '新对话' } = req.body

    const session = await prisma.chatSession.create({
      data: {
        userId,
        title,
        messages: [],
      },
      select: {
        id: true,
        title: true,
        messages: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // 将JSON字段转换为数组
    const formattedSession = {
      ...session,
      messages: Array.isArray(session.messages) ? session.messages : JSON.parse(session.messages as string),
    }

    res.json(formattedSession)
  } catch (error) {
    console.error('创建对话会话失败:', error)
    res.status(500).json({ error: '创建对话会话失败' })
  }
})

// 更新对话会话
router.put('/:sessionId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }
    const { sessionId } = req.params
    const { title, messages } = req.body

    // 验证会话所有权
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    })

    if (!existingSession) {
      return res.status(404).json({ error: '对话会话不存在或无权限' })
    }

    // 构建更新数据
    const updateData: any = {}
    if (title !== undefined) {
      updateData.title = title
    }
    if (messages !== undefined) {
      updateData.messages = messages
    }

    const session = await prisma.chatSession.update({
      where: { id: sessionId },
      data: updateData,
      select: {
        id: true,
        title: true,
        messages: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // 将JSON字段转换为数组
    const formattedSession = {
      ...session,
      messages: Array.isArray(session.messages) ? session.messages : JSON.parse(session.messages as string),
    }

    res.json(formattedSession)
  } catch (error) {
    console.error('更新对话会话失败:', error)
    res.status(500).json({ error: '更新对话会话失败' })
  }
})

// 保存消息到对话会话
router.post('/:sessionId/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }
    const { sessionId } = req.params
    const message = req.body

    // 验证会话所有权
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    })

    if (!existingSession) {
      return res.status(404).json({ error: '对话会话不存在或无权限' })
    }

    // 获取现有消息
    const currentMessages = Array.isArray(existingSession.messages)
      ? existingSession.messages
      : JSON.parse(existingSession.messages as string)

    // 添加新消息
    const updatedMessages = [...currentMessages, message]

    // 更新会话
    const session = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        messages: updatedMessages,
      },
      select: {
        id: true,
        title: true,
        messages: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // 将JSON字段转换为数组
    const formattedSession = {
      ...session,
      messages: Array.isArray(session.messages) ? session.messages : JSON.parse(session.messages as string),
    }

    res.json(formattedSession)
  } catch (error) {
    console.error('保存消息失败:', error)
    res.status(500).json({ error: '保存消息失败' })
  }
})

// 删除对话会话
router.delete('/:sessionId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }
    const { sessionId } = req.params

    // 验证会话所有权
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    })

    if (!existingSession) {
      return res.status(404).json({ error: '对话会话不存在或无权限' })
    }

    await prisma.chatSession.delete({
      where: { id: sessionId },
    })

    res.json({ success: true, message: '对话会话已删除' })
  } catch (error) {
    console.error('删除对话会话失败:', error)
    res.status(500).json({ error: '删除对话会话失败' })
  }
})

export default router
