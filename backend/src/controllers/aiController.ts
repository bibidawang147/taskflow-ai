import { Request, Response } from 'express'
import { aiService } from '../services/aiService'

interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
  }
}

/**
 * AI 对话接口
 */
export const chat = async (req: AuthRequest, res: Response) => {
  try {
    const { message, systemPrompt } = req.body

    if (!message) {
      return res.status(400).json({ error: '消息内容不能为空' })
    }

    // 调用 AI 服务
    const response = await aiService.simpleChat(message, systemPrompt)

    res.json({
      success: true,
      data: {
        message: response
      }
    })

  } catch (error) {
    console.error('AI 对话失败:', error)
    res.status(500).json({
      success: false,
      error: 'AI 服务暂时不可用'
    })
  }
}

/**
 * 文章撰写（示例工作流）
 */
export const generateArticle = async (req: AuthRequest, res: Response) => {
  try {
    const { topic, style, length } = req.body

    if (!topic) {
      return res.status(400).json({ error: '请提供文章主题' })
    }

    const systemPrompt = `你是一个专业的内容创作者。请根据用户要求撰写文章。
风格：${style || '专业'}
长度：${length || '中等'}字`

    const userMessage = `请帮我写一篇关于「${topic}」的文章。`

    const article = await aiService.simpleChat(userMessage, systemPrompt)

    res.json({
      success: true,
      data: {
        topic,
        article
      }
    })

  } catch (error) {
    console.error('文章生成失败:', error)
    res.status(500).json({
      success: false,
      error: '文章生成失败'
    })
  }
}

/**
 * 代码审查（示例工作流）
 */
export const reviewCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code, language } = req.body

    if (!code) {
      return res.status(400).json({ error: '请提供代码' })
    }

    const systemPrompt = `你是一个专业的代码审查专家。请仔细审查代码，指出：
1. 潜在的 bug
2. 性能问题
3. 代码规范问题
4. 改进建议`

    const userMessage = `请审查以下 ${language || 'JavaScript'} 代码：

\`\`\`${language || 'javascript'}
${code}
\`\`\`
`

    const review = await aiService.simpleChat(userMessage, systemPrompt)

    res.json({
      success: true,
      data: {
        review
      }
    })

  } catch (error) {
    console.error('代码审查失败:', error)
    res.status(500).json({
      success: false,
      error: '代码审查失败'
    })
  }
}

/**
 * 市场分析（示例工作流）
 */
export const analyzeMarket = async (req: AuthRequest, res: Response) => {
  try {
    const { industry, question } = req.body

    if (!industry || !question) {
      return res.status(400).json({ error: '请提供行业和问题' })
    }

    const systemPrompt = `你是一个专业的市场分析师，精通各行业的市场分析。`

    const userMessage = `关于${industry}行业：${question}`

    const analysis = await aiService.simpleChat(userMessage, systemPrompt)

    res.json({
      success: true,
      data: {
        analysis
      }
    })

  } catch (error) {
    console.error('市场分析失败:', error)
    res.status(500).json({
      success: false,
      error: '市场分析失败'
    })
  }
}
