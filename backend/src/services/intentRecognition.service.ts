/**
 * 意图识别服务
 * 使用LLM分析用户消息,提取结构化的用户意图
 */

import prisma from '../utils/database'
// TODO: 创建llmClient工具
// import { callLLM, LLMProvider } from '../utils/llmClient'

// 临时stub
const callLLM = async (options: any) => {
  return { content: JSON.stringify({}) }
}
type LLMProvider = 'openai' | 'anthropic' | 'doubao'

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface UserIntent {
  platformType?: string // "小红书" | "抖音" | "公众号" | "B站" | "视频号" | "通用"
  contentType?: string // "文案" | "视频" | "图片" | "数据分析" | "综合"
  goal?: string // "涨粉" | "变现" | "品牌建设" | "效率提升" | "学习"
  skillLevel?: 'beginner' | 'intermediate' | 'advanced'
  urgency?: 'quick' | 'deep' | 'flexible'
  keywords: string[]
  confidence: number
  suggestedQuestions?: string[]
}

export interface IntentTag {
  label: string
  type: 'platform' | 'content' | 'goal' | 'level'
  removable?: boolean
}

export class IntentRecognitionService {
  /**
   * 识别用户意图
   */
  async recognizeIntent(
    message: string,
    conversationHistory: ConversationMessage[],
    userId: string,
    sessionId: string
  ): Promise<{ intentId: string; intent: UserIntent; intentTags: IntentTag[] }> {

    // 构建提示词
    const prompt = this.buildPrompt(message, conversationHistory)

    // 调用LLM进行意图识别
    const llmResponse = await callLLM({
      provider: 'doubao' as LLMProvider, // 使用豆包,成本更低
      model: 'doubao-pro-32k',
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.3, // 较低温度,更确定性的输出
      maxTokens: 1000,
      responseFormat: 'json_object' // 要求返回JSON格式
    })

    // 解析LLM响应
    let intent: UserIntent
    try {
      const parsed = JSON.parse(llmResponse.content)
      intent = this.validateIntent(parsed)
    } catch (error) {
      console.error('解析意图失败:', error)
      // 降级到关键词提取
      intent = this.fallbackKeywordExtraction(message)
    }

    // 生成意图标签
    const intentTags = this.generateIntentTags(intent)

    // 保存到数据库
    const userIntent = await prisma.userIntent.create({
      data: {
        userId,
        sessionId,
        platformType: intent.platformType,
        contentType: intent.contentType,
        goal: intent.goal,
        skillLevel: intent.skillLevel,
        urgency: intent.urgency,
        keywords: JSON.stringify(intent.keywords),
        confidence: intent.confidence
      }
    })

    return {
      intentId: userIntent.id,
      intent,
      intentTags
    }
  }

  /**
   * 构建LLM提示词
   */
  private buildPrompt(message: string, history: ConversationMessage[]): string {
    const historyText = history.length > 0
      ? `\n历史对话:\n${history.map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n')}`
      : ''

    return `你是一个工作流推荐系统的意图识别专家。
请分析用户的需求,提取以下维度的信息。

用户当前消息: "${message}"
${historyText}

请以JSON格式返回:
{
  "platformType": "小红书 | 抖音 | 公众号 | B站 | 视频号 | 通用 | null",
  "contentType": "文案 | 视频 | 图片 | 数据分析 | 综合 | null",
  "goal": "涨粉 | 变现 | 品牌建设 | 效率提升 | 学习 | null",
  "skillLevel": "beginner | intermediate | advanced",
  "urgency": "quick | deep | flexible",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "confidence": 0.0-1.0,
  "suggestedQuestions": ["澄清问题1", "澄清问题2"]
}

判断依据:
1. platformType: 从消息中识别提到的平台名称
   - 如果提到"小红书"、"红书" → "小红书"
   - 如果提到"抖音"、"TikTok" → "抖音"
   - 如果提到"公众号"、"微信公众号" → "公众号"
   - 如果提到"B站"、"哔哩哔哩" → "B站"
   - 如果提到"视频号" → "视频号"
   - 如果没有明确平台 → "通用"

2. contentType: 识别用户想做的内容类型
   - 提到"文案"、"写作"、"文章"、"标题" → "文案"
   - 提到"视频"、"剪辑"、"拍摄" → "视频"
   - 提到"图片"、"设计"、"海报"、"封面" → "图片"
   - 提到"数据"、"分析"、"统计" → "数据分析"
   - 如果涉及多种类型 → "综合"

3. goal: 识别用户的核心目标
   - 提到"涨粉"、"增加粉丝"、"吸粉" → "涨粉"
   - 提到"变现"、"赚钱"、"收益" → "变现"
   - 提到"品牌"、"IP"、"影响力" → "品牌建设"
   - 提到"效率"、"节省时间"、"快速" → "效率提升"
   - 提到"学习"、"了解"、"教程" → "学习"

4. skillLevel: 根据用户措辞判断技能水平
   - 如果提到"新手"、"小白"、"不会"、"初学" → "beginner"
   - 如果提到"进阶"、"提升"、"优化" → "intermediate"
   - 如果提到"专业"、"高级"、"深度"、"系统" → "advanced"
   - 默认: "beginner"

5. urgency: 判断时间紧急度
   - 提到"快速"、"急"、"马上"、"立即" → "quick"
   - 提到"深入"、"系统"、"全面"、"详细" → "deep"
   - 其他情况 → "flexible"

6. keywords: 提取3-5个最重要的关键词

7. confidence: 意图识别的置信度
   - 如果用户需求明确、信息完整 → 0.8-1.0
   - 如果用户需求模糊、信息不足 → 0.4-0.7
   - 如果完全无法判断 → 0.0-0.3

8. suggestedQuestions: 如果confidence < 0.7,生成1-2个澄清问题

注意:
- 如果某个维度无法确定,设为null
- keywords必须是数组,至少包含1个关键词
- 所有字段都必须存在
- 确保返回的是有效的JSON格式`
  }

  /**
   * 验证和规范化意图数据
   */
  private validateIntent(parsed: any): UserIntent {
    return {
      platformType: parsed.platformType === 'null' ? undefined : parsed.platformType,
      contentType: parsed.contentType === 'null' ? undefined : parsed.contentType,
      goal: parsed.goal === 'null' ? undefined : parsed.goal,
      skillLevel: parsed.skillLevel || 'beginner',
      urgency: parsed.urgency || 'flexible',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions) ? parsed.suggestedQuestions : undefined
    }
  }

  /**
   * 降级方案: 简单的关键词提取
   */
  private fallbackKeywordExtraction(message: string): UserIntent {
    const keywords: string[] = []

    // 平台关键词
    const platforms = ['小红书', '抖音', '公众号', 'B站', '视频号']
    let platformType: string | undefined

    for (const platform of platforms) {
      if (message.includes(platform)) {
        platformType = platform
        keywords.push(platform)
        break
      }
    }

    // 内容类型关键词
    const contentTypes = ['文案', '视频', '图片', '数据']
    let contentType: string | undefined

    for (const type of contentTypes) {
      if (message.includes(type)) {
        contentType = type
        keywords.push(type)
        break
      }
    }

    // 目标关键词
    const goals = ['涨粉', '变现', '品牌', '效率']
    let goal: string | undefined

    for (const g of goals) {
      if (message.includes(g)) {
        goal = g
        keywords.push(g)
        break
      }
    }

    // 技能水平
    let skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
    if (message.includes('新手') || message.includes('小白')) {
      skillLevel = 'beginner'
    } else if (message.includes('进阶')) {
      skillLevel = 'intermediate'
    } else if (message.includes('专业') || message.includes('高级')) {
      skillLevel = 'advanced'
    }

    return {
      platformType,
      contentType,
      goal,
      skillLevel,
      urgency: 'flexible',
      keywords: keywords.length > 0 ? keywords : ['工作流'],
      confidence: 0.5,
      suggestedQuestions: ['你能描述更详细一些吗?']
    }
  }

  /**
   * 生成意图标签
   */
  private generateIntentTags(intent: UserIntent): IntentTag[] {
    const tags: IntentTag[] = []

    if (intent.platformType) {
      tags.push({
        label: intent.platformType,
        type: 'platform',
        removable: true
      })
    }

    if (intent.contentType && intent.contentType !== '综合') {
      tags.push({
        label: intent.contentType,
        type: 'content',
        removable: true
      })
    }

    if (intent.goal) {
      tags.push({
        label: intent.goal,
        type: 'goal',
        removable: true
      })
    }

    if (intent.skillLevel) {
      const levelMap = {
        beginner: '新手友好',
        intermediate: '进阶',
        advanced: '专业级'
      }
      tags.push({
        label: levelMap[intent.skillLevel],
        type: 'level',
        removable: false
      })
    }

    return tags
  }

  /**
   * 获取智能联想建议
   */
  async getSuggestions(
    input: string,
    sessionId: string
  ): Promise<{ keywords: Array<{ text: string; type: string; score: number }>; scenarios: Array<{ text: string; type: string }> }> {

    // 从数据库中查找相关工作流的关键词
    const workflows = await prisma.workflow.findMany({
      where: {
        isPublic: true,
        OR: [
          { title: { contains: input } },
          { description: { contains: input } },
          { tags: { contains: input } },
          { matchKeywords: { contains: input } }
        ]
      },
      select: {
        title: true,
        tags: true,
        matchKeywords: true,
        platformTypes: true,
        contentTypes: true
      },
      take: 20
    })

    // 提取关键词
    const keywordMap = new Map<string, number>()

    workflows.forEach(wf => {
      // 从标题提取
      const titleWords = wf.title.split(/[\s,，、]+/)
      titleWords.forEach(word => {
        if (word.length >= 2 && word.includes(input)) {
          keywordMap.set(word, (keywordMap.get(word) || 0) + 3)
        }
      })

      // 从tags提取
      if (wf.tags) {
        const tags = wf.tags.split(',')
        tags.forEach(tag => {
          if (tag.includes(input)) {
            keywordMap.set(tag, (keywordMap.get(tag) || 0) + 2)
          }
        })
      }

      // 从matchKeywords提取
      if (wf.matchKeywords) {
        try {
          const keywords = JSON.parse(wf.matchKeywords)
          keywords.forEach((kw: string) => {
            if (kw.includes(input)) {
              keywordMap.set(kw, (keywordMap.get(kw) || 0) + 2)
            }
          })
        } catch (e) {
          // ignore
        }
      }

      // 从平台类型提取
      if (wf.platformTypes) {
        try {
          const platforms = JSON.parse(wf.platformTypes)
          platforms.forEach((p: string) => {
            if (p.includes(input)) {
              keywordMap.set(p, (keywordMap.get(p) || 0) + 1)
            }
          })
        } catch (e) {
          // ignore
        }
      }
    })

    // 排序并返回前10个
    const keywords = Array.from(keywordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([text, count]) => ({
        text,
        type: 'keyword',
        score: Math.min(1, count / 10)
      }))

    // 生成场景建议
    const scenarios = [
      { text: `我想做${input}`, type: 'scenario' },
      { text: `帮我优化${input}`, type: 'scenario' },
      { text: `如何快速生成${input}`, type: 'scenario' }
    ]

    return { keywords, scenarios }
  }
}

export const intentRecognitionService = new IntentRecognitionService()
