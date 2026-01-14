/**
 * AI推荐系统API路由
 * 返回工作流的详细解决方案步骤
 */

import { Router, Response } from 'express'
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth'
import prisma from '../utils/database'

const router = Router()

/**
 * 根据关键词生成通用方法论
 * 讲述如何完成这件工作，不提具体工作流
 */
function generateMethodology(keywords: string[], userMessage: string): string {
  let response = ''

  // 小红书文案相关
  if (keywords.includes('小红书') && keywords.includes('文案')) {
    response = `📱 **关于小红书平台：**\n`
    response += `小红书的算法偏好「真实分享」和「高互动内容」，用户更喜欢有实用价值、有情感共鸣的笔记。平台会根据点赞、收藏、评论等互动数据来推荐内容。\n\n`

    response += `✍️ **如何写好小红书文案：**\n\n`
    response += `1. **设计标题钩子**：用数字、痛点或好奇心抓住用户（如"3个方法让你..."）\n`
    response += `2. **开头3秒定胜负**：第一句话要直击痛点或给出价值承诺\n`
    response += `3. **结构化呈现内容**：使用小标题、序号、emoji让内容清晰易读\n`
    response += `4. **提供实用干货**：分享具体可操作的方法，而非泛泛而谈\n`
    response += `5. **配图要吸引人**：封面图要有视觉冲击力，引导用户点击\n`
    response += `6. **结尾引导互动**：用提问、投票等方式增加评论和收藏\n`
    response += `7. **添加话题标签**：选择2-3个相关且有热度的话题标签\n\n`

    response += `❓ **为了给你更精准的建议，我想了解：**\n`
    response += `- 你的目标受众是谁？（年龄段、兴趣方向）\n`
    response += `- 你想写什么主题的内容？（美妆、穿搭、好物推荐等）\n`
    response += `- 你的目标是什么？（涨粉、带货、打造个人IP）`
  }
  // 抖音视频脚本相关
  else if (keywords.includes('抖音') && (keywords.includes('视频') || keywords.includes('脚本'))) {
    response = `📱 **关于抖音平台：**\n`
    response += `抖音的算法看重「完播率」和「互动率」，用户喜欢前3秒就能吸引注意力、节奏紧凑的短视频。平台会根据点赞、评论、转发、完播率来判断内容质量。\n\n`

    response += `🎬 **如何写好短视频脚本：**\n\n`
    response += `1. **前3秒黄金法则**：用冲突、反转或悬念开头抓住用户\n`
    response += `2. **设计三段式结构**：开头钩子（3秒）→ 内容展开（主体）→ 行动引导（结尾）\n`
    response += `3. **控制节奏密度**：每7-10秒要有一个信息点或情绪转折\n`
    response += `4. **设计镜头语言**：列出每个画面的内容、台词、时长、特效\n`
    response += `5. **埋设互动钩子**：在关键位置引导评论（"你觉得呢？"）\n`
    response += `6. **优化字幕文案**：重点信息用字幕强化，提升理解度\n`
    response += `7. **结尾明确引导**：引导点赞、关注或评论区互动\n\n`

    response += `❓ **为了给你更精准的建议，我想了解：**\n`
    response += `- 你想做什么类型的视频？（剧情、知识科普、好物种草等）\n`
    response += `- 视频时长预计多久？（15秒、30秒、1分钟）\n`
    response += `- 你的目标是什么？（涨粉、带货、打造IP）`
  }
  // 公众号标题相关
  else if (keywords.includes('公众号') && keywords.includes('标题')) {
    response = `📱 **关于公众号平台：**\n`
    response += `公众号用户偏好有价值、有深度的内容，标题是决定打开率的关键。好的标题要在订阅号列表中脱颖而出，同时避免过度标题党导致取关。\n\n`

    response += `📝 **如何写好公众号标题：**\n\n`
    response += `1. **提炼核心卖点**：一句话说清文章能解决什么问题\n`
    response += `2. **套用经典公式**：\n`
    response += `   - 数字型：《5个方法让你xxx》\n`
    response += `   - 痛点型：《为什么你总是xxx？》\n`
    response += `   - 好奇型：《xxx背后的真相》\n`
    response += `   - 利益型：《学会这招，立刻xxx》\n`
    response += `3. **控制标题长度**：16-20字最佳，手机端完整显示\n`
    response += `4. **加入具体数字**：数字比笼统描述更有吸引力\n`
    response += `5. **制造适度悬念**：引发好奇但不过度，避免标题党\n`
    response += `6. **包含关键词**：便于搜索和精准触达目标读者\n\n`

    response += `❓ **为了给你更精准的建议，我想了解：**\n`
    response += `- 你的文章主题是什么？（职场、情感、科技等）\n`
    response += `- 你的目标读者是谁？（年龄、职业、兴趣）\n`
    response += `- 文章的核心价值是什么？（解决问题、提供见解、分享故事）`
  }
  // B站数据分析相关
  else if (keywords.includes('B站') && keywords.includes('数据')) {
    response = `📱 **关于B站平台：**\n`
    response += `B站的算法看重「三连率」（点赞+投币+收藏）和「完播率」，这两个指标直接影响推荐量。用户偏好有深度、有价值的中长视频内容。\n\n`

    response += `📊 **如何分析B站视频数据：**\n\n`
    response += `1. **收集核心指标**：播放量、完播率、三连率、评论数、弹幕密度\n`
    response += `2. **分析流量来源**：区分首页推荐、搜索、粉丝订阅的占比\n`
    response += `3. **研究观众画像**：分析年龄、性别、地域等受众特征\n`
    response += `4. **对比历史数据**：找出表现好的视频的共同特征\n`
    response += `5. **识别优化方向**：\n`
    response += `   - 完播率低 → 优化开头和节奏\n`
    response += `   - 三连率低 → 提升内容价值和引导\n`
    response += `   - 推荐量低 → 优化标题、封面、标签\n`
    response += `6. **制定改进计划**：基于数据调整内容策略\n\n`

    response += `❓ **为了给你更精准的建议，我想了解：**\n`
    response += `- 你的视频类型是什么？（知识科普、游戏、vlog等）\n`
    response += `- 目前遇到的主要问题是？（播放量低、互动少、涨粉慢）\n`
    response += `- 你希望重点优化哪个指标？`
  }
  // 图片/排版相关
  else if (keywords.includes('排版') || keywords.includes('图片')) {
    response = `🎨 **关于视觉设计：**\n`
    response += `好的排版能让内容传播效果提升30%以上。用户在移动端浏览时，清晰的视觉层次和舒适的阅读体验是关键，第一眼的视觉冲击决定用户是否继续阅读。\n\n`

    response += `✨ **如何做好图文排版：**\n\n`
    response += `1. **确定视觉风格**：根据品牌调性选择配色和字体\n`
    response += `2. **构建信息层级**：标题→副标题→正文→注释，层次分明\n`
    response += `3. **选择配色方案**：主色（品牌色）+ 2-3个辅助色 + 背景色\n`
    response += `4. **优化留白和间距**：让内容有呼吸感，不要太拥挤\n`
    response += `5. **选配合适素材**：图片、图标、装饰元素要符合主题\n`
    response += `6. **移动端优先**：确保手机上可读性良好\n`
    response += `7. **保持风格统一**：建立视觉识别，强化品牌记忆\n\n`

    response += `❓ **为了给你更精准的建议，我想了解：**\n`
    response += `- 你要设计什么类型的图文？（海报、封面、长图文等）\n`
    response += `- 目标平台是哪里？（小红书、公众号、微博等）\n`
    response += `- 你有品牌色或特定风格要求吗？`
  }
  // 内容规划/日历相关
  else if (keywords.includes('内容') || keywords.includes('计划')) {
    response = `📅 **关于内容运营：**\n`
    response += `系统化的内容规划能让运营效率提升50%以上。提前规划可以保证内容质量稳定、发布节奏连续，同时预留追热点的机动空间。\n\n`

    response += `📝 **如何制定内容计划：**\n\n`
    response += `1. **设定明确目标**：确定涨粉、转化、品牌曝光等核心目标\n`
    response += `2. **分析目标受众**：了解用户画像、需求和内容偏好\n`
    response += `3. **规划内容配比**：\n`
    response += `   - 干货分享 40%：解决用户问题\n`
    response += `   - 案例展示 30%：建立专业形象\n`
    response += `   - 互动内容 20%：提升用户参与\n`
    response += `   - 热点追踪 10%：获取流量\n`
    response += `4. **确定发布节奏**：找出目标用户活跃时段，安排发布时间\n`
    response += `5. **提前准备素材**：至少提前1-2周准备文案、图片、视频\n`
    response += `6. **定期数据复盘**：每周/月分析数据，优化内容策略\n\n`

    response += `❓ **为了给你更精准的建议，我想了解：**\n`
    response += `- 你运营的平台是哪个？（小红书、抖音、公众号等）\n`
    response += `- 你的发布频率是多少？（每天、每周几次）\n`
    response += `- 你的核心目标是什么？（涨粉、变现、品牌建设）`
  }
  // 通用回复
  else {
    response = `我理解你想要完成关于${keywords.join('、')}相关的任务。\n\n`
    response += `📋 **通用工作流程：**\n\n`
    response += `1. **明确目标**：清楚定义你想要达成的具体结果\n`
    response += `2. **收集素材**：准备必要的输入内容和参考资料\n`
    response += `3. **执行创作**：按照规范化的流程进行内容生产\n`
    response += `4. **优化调整**：根据反馈和数据进行迭代改进\n`
    response += `5. **发布上线**：选择合适的时机和渠道发布\n`
    response += `6. **数据复盘**：分析效果，总结经验\n\n`
    response += `💡 如需更详细的指导，请告诉我更具体的需求场景。`
  }

  return response
}

/**
 * POST /api/ai/conversation
 * AI对话流程 - 返回工作流的详细解决方案步骤
 */
router.post('/conversation', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, sessionId } = req.body
    const userId = req.user?.id

    if (!message || !sessionId || !userId) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      })
    }

    // 关键词匹配
    const keywords = ['小红书', '抖音', '公众号', 'B站', '视频', '文案', '数据', '分析', '排版', '图片', '标题', '脚本']
    const matchedKeywords = keywords.filter(k => message.includes(k))

    console.log(`📝 用户消息: ${message}`)
    console.log(`🔍 匹配关键词: ${matchedKeywords.join(', ')}`)

    // 获取推荐工作流(基于关键词)
    const where: any = {
      isPublic: true,
      isDraft: false
    }

    if (matchedKeywords.length > 0) {
      where.OR = matchedKeywords.flatMap(kw => [
        { title: { contains: kw } },
        { description: { contains: kw } },
        { tags: { contains: kw } },
        { matchKeywords: { contains: kw } }
      ])
    }

    const workflows = await prisma.workflow.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        rating: true,
        usageCount: true,
        difficultyLevel: true,
        tags: true,
        config: true,
        platformTypes: true,
        contentTypes: true
      },
      orderBy: { usageCount: 'desc' },
      take: 6
    })

    console.log(`✅ 找到 ${workflows.length} 个匹配的工作流`)

    // 构造AI回复 - 讲述完成任务的通用方法论（不提具体工作流）
    let aiResponse = ''
    let hasSpecificIntent = false // 是否识别到具体需求（有关键词且有匹配的工作流）

    // 根据识别到的关键词生成通用方法论
    if (matchedKeywords.length > 0 && workflows.length > 0) {
      // 识别到具体需求，且找到了相关工作流
      hasSpecificIntent = true
      aiResponse = generateMethodology(matchedKeywords, message)
    } else if (matchedKeywords.length > 0 && workflows.length === 0) {
      // 识别到关键词，但没有匹配的工作流
      aiResponse = `我理解你想要完成关于${matchedKeywords.join('、')}相关的任务。\n\n`
      aiResponse += `不过目前我们的工具库中还没有完全匹配这个需求的工作流。\n\n`
      aiResponse += `你可以尝试：\n`
      aiResponse += `- 换个更具体的描述方式\n`
      aiResponse += `- 或者告诉我你想要解决的具体问题\n\n`
      aiResponse += `我会持续为你寻找最合适的解决方案。`
    } else {
      // 没有识别到具体需求
      aiResponse = `我可以帮你完成各种内容创作和数据分析任务。\n\n`
      aiResponse += `请告诉我更具体的需求，比如：\n\n`
      aiResponse += `- "我想做小红书爆款文案"\n`
      aiResponse += `- "帮我生成抖音视频脚本"\n`
      aiResponse += `- "我要优化公众号标题"\n`
      aiResponse += `- "我需要分析B站视频数据"\n\n`
      aiResponse += `说得越具体，我就能给你更准确的建议！`
    }

    // 保存对话历史
    const conversation = await prisma.conversationHistory.create({
      data: {
        userId,
        sessionId,
        userMessage: message,
        aiResponse,
        messageType: 'text',
        recommendedWorkflowIds: JSON.stringify(workflows.map(w => w.id))
      }
    })

    // 构造推荐结果
    const recommendations = workflows.map((wf, idx) => {
      // 提取平台类型用于匹配理由
      let platforms: string[] = []
      try {
        platforms = wf.platformTypes ? JSON.parse(wf.platformTypes as string) : []
      } catch (e) {
        platforms = []
      }

      // 生成匹配理由
      const matchReasons: any[] = []

      // 平台匹配
      const matchedPlatforms = platforms.filter(p => matchedKeywords.includes(p))
      if (matchedPlatforms.length > 0) {
        matchReasons.push({
          label: `平台匹配: ${matchedPlatforms[0]}`,
          icon: '✓',
          color: 'green'
        })
      }

      // 功能匹配
      const contentMatch = matchedKeywords.find(kw =>
        wf.title.includes(kw) || (wf.description && wf.description.includes(kw))
      )
      if (contentMatch) {
        matchReasons.push({
          label: `功能匹配: ${contentMatch}`,
          icon: '✓',
          color: 'green'
        })
      }

      // 热门推荐
      if (wf.usageCount > 500) {
        matchReasons.push({
          label: `热门工具: ${wf.usageCount}人使用`,
          icon: '🔥',
          color: 'orange'
        })
      }

      // 高评分
      if (wf.rating && wf.rating >= 4.5) {
        matchReasons.push({
          label: `高评分: ⭐${wf.rating}`,
          icon: '🏆',
          color: 'gold'
        })
      }

      // 如果没有匹配理由，添加默认理由
      if (matchReasons.length === 0) {
        matchReasons.push({
          label: '推荐工具',
          icon: '💡',
          color: 'blue'
        })
      }

      return {
        workflow: wf,
        relevanceScore: Math.max(0.5, 0.95 - idx * 0.1),
        matchReasons,
        displayType: idx === 0 ? ('highlight' as const) : ('normal' as const),
        position: idx + 1
      }
    })

    return res.status(200).json({
      success: true,
      data: {
        conversationId: conversation.id,
        aiResponse,
        // 只有识别到具体需求时才返回intentId，否则返回null
        // 这样前端推荐面板就不会更新
        intentData: hasSpecificIntent ? {
          intentId: conversation.id,
          intent: {
            keywords: matchedKeywords
          },
          intentTags: matchedKeywords.map(kw => ({
            label: kw,
            type: 'keyword' as const
          }))
        } : {
          intentId: null,
          intent: null,
          intentTags: []
        },
        recommendations: hasSpecificIntent ? recommendations : [],
        suggestedActions: []
      }
    })
  } catch (error) {
    console.error('对话处理失败:', error)
    return res.status(500).json({
      success: false,
      error: '对话处理失败',
      message: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * POST /api/ai/recommendations
 * 获取推荐工作流（实时更新）
 */
router.post('/recommendations', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { intentId, sessionId, filters = {} } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权'
      })
    }

    // 如果有intentId，从对话历史中获取关键词
    let keywords: string[] = []
    if (intentId) {
      const conversation = await prisma.conversationHistory.findUnique({
        where: { id: intentId },
        select: { intentData: true }
      })

      if (conversation?.intentData) {
        try {
          const intentData = JSON.parse(conversation.intentData as string)
          keywords = intentData.keywords || []
        } catch (e) {
          console.error('解析intentData失败:', e)
        }
      }
    }

    // 构建查询条件
    const where: any = {
      isPublic: true,
      isDraft: false
    }

    if (keywords.length > 0) {
      where.OR = keywords.flatMap(kw => [
        { title: { contains: kw } },
        { description: { contains: kw } },
        { tags: { contains: kw } }
      ])
    }

    const workflows = await prisma.workflow.findMany({
      where,
      orderBy: { usageCount: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        rating: true,
        usageCount: true,
        difficultyLevel: true,
        tags: true,
        platformTypes: true
      },
      take: filters.maxResults || 6
    })

    const recommendations = workflows.map((wf, idx) => ({
      workflow: wf,
      relevanceScore: 0.9 - idx * 0.05,
      matchReasons: [
        { label: '智能推荐', icon: '🎯', color: 'blue' as const }
      ],
      displayType: idx === 0 ? ('highlight' as const) : ('normal' as const),
      position: idx + 1
    }))

    return res.status(200).json({
      success: true,
      data: {
        recommendations,
        totalCount: recommendations.length,
        hasMore: false,
        aiSuggestion: `为你推荐了${recommendations.length}个相关工作流`
      }
    })
  } catch (error) {
    console.error('生成推荐失败:', error)
    return res.status(500).json({
      success: false,
      error: '生成推荐失败'
    })
  }
})

/**
 * POST /api/ai/feedback
 * 收集用户反馈
 */
router.post('/feedback', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recommendationLogId, action } = req.body

    console.log(`📊 用户反馈: ${action} on ${recommendationLogId}`)

    return res.status(200).json({
      success: true,
      message: '感谢你的反馈'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '记录反馈失败'
    })
  }
})

/**
 * GET /api/ai/conversation-history
 * 获取对话历史
 */
router.get('/conversation-history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, limit = 20 } = req.query
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ success: false, error: '未授权' })
    }

    const where: any = { userId }
    if (sessionId) {
      where.sessionId = sessionId
    }

    const conversations = await prisma.conversationHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      select: {
        id: true,
        userMessage: true,
        aiResponse: true,
        messageType: true,
        createdAt: true,
        sessionId: true
      }
    })

    return res.status(200).json({
      success: true,
      data: {
        sessionId: sessionId || null,
        conversations
      }
    })
  } catch (error) {
    console.error('获取对话历史失败:', error)
    return res.status(500).json({
      success: false,
      error: '获取对话历史失败'
    })
  }
})

export default router
