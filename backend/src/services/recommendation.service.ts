/**
 * 推荐算法服务
 * 基于用户意图和历史行为,计算工作流推荐
 */

import prisma from '../utils/database'
import { UserIntent } from './intentRecognition.service'

export interface MatchReason {
  label: string
  icon: string
  color: 'green' | 'blue' | 'gold' | 'orange'
}

export interface ScoreBreakdown {
  tagMatch: number
  scenarioMatch: number
  popularity: number
  personalized: number
}

export interface WorkflowRecommendation {
  workflow: {
    id: string
    title: string
    description: string | null
    thumbnail: string | null
    rating: number | null
    usageCount: number
    difficultyLevel: string
    tags: string | null
    category: string | null
  }
  relevanceScore: number
  scoreBreakdown: ScoreBreakdown
  matchReasons: MatchReason[]
  displayType: 'highlight' | 'normal' | 'suggested'
  position: number
  logId?: string
}

export interface RecommendationOptions {
  minRelevance?: number
  maxResults?: number
  excludeWorkflowIds?: string[]
  personalizedBoost?: boolean
}

export class RecommendationService {
  /**
   * 计算推荐工作流
   */
  async calculateRecommendations(
    intentId: string,
    userId: string,
    sessionId: string,
    options: RecommendationOptions = {}
  ): Promise<WorkflowRecommendation[]> {

    const {
      minRelevance = 0.6,
      maxResults = 6,
      excludeWorkflowIds = [],
      personalizedBoost = true
    } = options

    // 获取用户意图
    const userIntent = await prisma.userIntent.findUnique({
      where: { id: intentId }
    })

    if (!userIntent) {
      throw new Error('意图不存在')
    }

    const intent: UserIntent = {
      platformType: userIntent.platformType || undefined,
      contentType: userIntent.contentType || undefined,
      goal: userIntent.goal || undefined,
      skillLevel: userIntent.skillLevel as any || 'beginner',
      urgency: userIntent.urgency as any || 'flexible',
      keywords: userIntent.keywords ? JSON.parse(userIntent.keywords) : [],
      confidence: userIntent.confidence
    }

    // 1. 获取候选工作流
    const candidateWorkflows = await this.getCandidateWorkflows(intent, excludeWorkflowIds)

    // 2. 计算每个工作流的评分
    const scoredWorkflows = await Promise.all(
      candidateWorkflows.map(async (workflow) => {
        // 2.1 标签匹配度
        const tagMatchScore = this.calculateTagMatch(workflow, intent)

        // 2.2 场景相似度 (简化版,不使用embedding)
        const scenarioScore = this.calculateScenarioMatch(workflow, intent)

        // 2.3 热度评分
        const popularityScore = this.calculatePopularity(workflow)

        // 2.4 个性化调整
        let personalizedMultiplier = 1.0
        if (personalizedBoost) {
          personalizedMultiplier = await this.calculatePersonalizedBoost(workflow.id, userId)
        }

        // 总分计算
        const baseScore =
          tagMatchScore * 0.6 +
          scenarioScore * 0.3 +
          popularityScore * 0.1

        const finalScore = baseScore * personalizedMultiplier

        return {
          workflow,
          relevanceScore: finalScore,
          scoreBreakdown: {
            tagMatch: tagMatchScore,
            scenarioMatch: scenarioScore,
            popularity: popularityScore,
            personalized: personalizedMultiplier
          }
        }
      })
    )

    // 3. 排序和过滤
    const filteredWorkflows = scoredWorkflows
      .filter(w => w.relevanceScore >= minRelevance)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults)

    // 4. 生成匹配理由和显示类型
    const recommendations: WorkflowRecommendation[] = filteredWorkflows.map((item, index) => ({
      workflow: {
        id: item.workflow.id,
        title: item.workflow.title,
        description: item.workflow.description,
        thumbnail: item.workflow.thumbnail,
        rating: item.workflow.rating,
        usageCount: item.workflow.usageCount,
        difficultyLevel: item.workflow.difficultyLevel,
        tags: item.workflow.tags,
        category: item.workflow.category
      },
      relevanceScore: item.relevanceScore,
      scoreBreakdown: item.scoreBreakdown,
      matchReasons: this.generateMatchReasons(item.workflow, intent, item.scoreBreakdown),
      displayType: item.relevanceScore > 0.9 ? 'highlight' :
                   item.relevanceScore > 0.7 ? 'normal' : 'suggested',
      position: index + 1
    }))

    // 5. 记录推荐日志
    await this.logRecommendations(recommendations, userId, sessionId, intentId)

    return recommendations
  }

  /**
   * 获取候选工作流
   */
  private async getCandidateWorkflows(intent: UserIntent, excludeIds: string[]) {
    const whereConditions: any[] = [
      { isPublic: true },
      { isDraft: false }
    ]

    // 构建OR条件
    const orConditions: any[] = []

    // 平台类型匹配
    if (intent.platformType) {
      orConditions.push({
        platformTypes: { contains: intent.platformType }
      })
    }

    // 内容类型匹配
    if (intent.contentType) {
      orConditions.push({
        contentTypes: { contains: intent.contentType }
      })
    }

    // 关键词匹配
    if (intent.keywords.length > 0) {
      intent.keywords.forEach(keyword => {
        orConditions.push(
          { title: { contains: keyword } },
          { description: { contains: keyword } },
          { tags: { contains: keyword } },
          { matchKeywords: { contains: keyword } }
        )
      })
    }

    // 如果有筛选条件,添加OR
    if (orConditions.length > 0) {
      whereConditions.push({ OR: orConditions })
    }

    // 排除已推荐的
    if (excludeIds.length > 0) {
      whereConditions.push({
        id: { notIn: excludeIds }
      })
    }

    const workflows = await prisma.workflow.findMany({
      where: {
        AND: whereConditions
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        category: true,
        tags: true,
        rating: true,
        usageCount: true,
        difficultyLevel: true,
        platformTypes: true,
        contentTypes: true,
        useScenarios: true,
        matchKeywords: true,
        clickCount: true,
        importCount: true,
        _count: {
          select: {
            favorites: true,
            ratings: true
          }
        }
      },
      take: 50 // 最多获取50个候选
    })

    return workflows
  }

  /**
   * 计算标签匹配度
   */
  private calculateTagMatch(workflow: any, intent: UserIntent): number {
    let score = 0
    let maxScore = 0

    // 平台匹配 (权重: 0.4)
    maxScore += 0.4
    if (intent.platformType && workflow.platformTypes) {
      try {
        const platforms = JSON.parse(workflow.platformTypes)
        if (platforms.includes(intent.platformType)) {
          score += 0.4
        }
      } catch (e) {
        // fallback: 直接字符串匹配
        if (workflow.platformTypes.includes(intent.platformType)) {
          score += 0.4
        }
      }
    }

    // 内容类型匹配 (权重: 0.3)
    maxScore += 0.3
    if (intent.contentType && workflow.contentTypes) {
      try {
        const types = JSON.parse(workflow.contentTypes)
        if (types.includes(intent.contentType)) {
          score += 0.3
        }
      } catch (e) {
        if (workflow.contentTypes.includes(intent.contentType)) {
          score += 0.3
        }
      }
    }

    // 使用场景匹配 (权重: 0.2)
    maxScore += 0.2
    if (intent.goal && workflow.useScenarios) {
      try {
        const scenarios = JSON.parse(workflow.useScenarios)
        const match = scenarios.some((s: string) =>
          s.toLowerCase().includes(intent.goal!.toLowerCase())
        )
        if (match) score += 0.2
      } catch (e) {
        if (workflow.useScenarios.toLowerCase().includes(intent.goal.toLowerCase())) {
          score += 0.2
        }
      }
    }

    // 技能水平匹配 (权重: 0.1)
    maxScore += 0.1
    if (workflow.difficultyLevel === intent.skillLevel) {
      score += 0.1
    } else if (
      (intent.skillLevel === 'beginner' && workflow.difficultyLevel === 'intermediate') ||
      (intent.skillLevel === 'intermediate' && workflow.difficultyLevel === 'beginner')
    ) {
      score += 0.05 // 部分匹配
    }

    return maxScore > 0 ? score / maxScore : 0
  }

  /**
   * 计算场景相似度 (简化版,不使用embedding)
   */
  private calculateScenarioMatch(workflow: any, intent: UserIntent): number {
    let matchCount = 0
    const totalKeywords = intent.keywords.length

    if (totalKeywords === 0) return 0

    // 在标题、描述、标签中查找关键词
    const searchText = [
      workflow.title,
      workflow.description,
      workflow.tags,
      workflow.matchKeywords
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    intent.keywords.forEach(keyword => {
      if (searchText.includes(keyword.toLowerCase())) {
        matchCount++
      }
    })

    return matchCount / totalKeywords
  }

  /**
   * 计算热度评分
   */
  private calculatePopularity(workflow: any): number {
    // 使用量评分 (归一化到0-1)
    const usageScore = Math.min(1, Math.log(workflow.usageCount + 1) / Math.log(10000))

    // 评分评分
    const ratingScore = workflow.rating ? workflow.rating / 5 : 0

    // 收藏量评分
    const favoriteCount = workflow._count?.favorites || 0
    const favoriteScore = Math.min(1, Math.log(favoriteCount + 1) / Math.log(1000))

    // 推荐后的点击率
    const clickScore = Math.min(1, Math.log(workflow.clickCount + 1) / Math.log(500))

    return (
      usageScore * 0.3 +
      ratingScore * 0.3 +
      favoriteScore * 0.2 +
      clickScore * 0.2
    )
  }

  /**
   * 计算个性化权重调整
   */
  private async calculatePersonalizedBoost(workflowId: string, userId: string): Promise<number> {
    const preference = await prisma.userWorkflowPreference.findUnique({
      where: {
        userId_workflowId: {
          userId,
          workflowId
        }
      }
    })

    if (!preference) return 1.0 // 无历史数据,不调整

    let boost = 1.0

    // 正向行为提权
    if (preference.favoriteCount > 0) boost += 0.3
    if (preference.importCount > 0) boost += 0.2
    if (preference.executeCount > 0) boost += 0.15

    // 负向行为降权
    if (preference.dismissCount > 0) boost -= 0.5

    // 偏好分数调整
    boost += preference.preferenceScore * 0.2

    return Math.max(0.1, Math.min(2.0, boost)) // 限制在0.1-2.0之间
  }

  /**
   * 生成匹配理由标签
   */
  private generateMatchReasons(
    workflow: any,
    intent: UserIntent,
    scoreBreakdown: ScoreBreakdown
  ): MatchReason[] {
    const reasons: MatchReason[] = []

    // 平台匹配
    if (intent.platformType && workflow.platformTypes?.includes(intent.platformType)) {
      reasons.push({
        label: `平台匹配: ${intent.platformType}`,
        icon: '✓',
        color: 'green'
      })
    }

    // 功能匹配
    if (intent.contentType && workflow.contentTypes?.includes(intent.contentType)) {
      reasons.push({
        label: `功能匹配: ${intent.contentType}`,
        icon: '✓',
        color: 'green'
      })
    }

    // 难度适合
    if (workflow.difficultyLevel === intent.skillLevel) {
      const levelMap: Record<string, string> = {
        beginner: '新手友好',
        intermediate: '进阶适用',
        advanced: '专业级'
      }
      reasons.push({
        label: `难度适合: ${levelMap[workflow.difficultyLevel] || workflow.difficultyLevel}`,
        icon: '✓',
        color: 'green'
      })
    }

    // 高评分
    if (workflow.rating && workflow.rating >= 4.5) {
      reasons.push({
        label: `高评分: ⭐${workflow.rating.toFixed(1)}`,
        icon: '🏆',
        color: 'gold'
      })
    }

    // 热门
    if (workflow.usageCount > 500) {
      reasons.push({
        label: `热门工具: ${workflow.usageCount}人使用`,
        icon: '🔥',
        color: 'orange'
      })
    }

    // 如果没有理由,添加一个通用理由
    if (reasons.length === 0) {
      reasons.push({
        label: '相关推荐',
        icon: '💡',
        color: 'blue'
      })
    }

    return reasons
  }

  /**
   * 记录推荐日志
   */
  private async logRecommendations(
    recommendations: WorkflowRecommendation[],
    userId: string,
    sessionId: string,
    intentId: string
  ) {
    const logs = recommendations.map(rec => ({
      userId,
      sessionId,
      conversationId: intentId,
      workflowId: rec.workflow.id,
      relevanceScore: rec.relevanceScore,
      tagMatchScore: rec.scoreBreakdown.tagMatch,
      scenarioScore: rec.scoreBreakdown.scenarioMatch,
      popularityScore: rec.scoreBreakdown.popularity,
      personalizedScore: rec.scoreBreakdown.personalized,
      position: rec.position,
      displayType: rec.displayType,
      matchReasons: JSON.stringify(rec.matchReasons.map(r => r.label))
    }))

    const createdLogs = await prisma.recommendationLog.createMany({
      data: logs
    })

    // 将logId添加到推荐结果中
    const savedLogs = await prisma.recommendationLog.findMany({
      where: {
        userId,
        sessionId,
        conversationId: intentId
      },
      orderBy: { position: 'asc' },
      take: recommendations.length
    })

    savedLogs.forEach((log, index) => {
      if (recommendations[index]) {
        recommendations[index].logId = log.id
      }
    })
  }

  /**
   * 记录用户反馈
   */
  async recordFeedback(
    recommendationLogId: string,
    action: 'clicked' | 'favorited' | 'imported' | 'dismissed'
  ) {
    // 更新推荐日志
    await prisma.recommendationLog.update({
      where: { id: recommendationLogId },
      data: {
        userAction: action,
        actionAt: new Date()
      }
    })

    // 获取推荐日志详情
    const log = await prisma.recommendationLog.findUnique({
      where: { id: recommendationLogId }
    })

    if (!log) return

    // 更新用户偏好
    await this.updateUserPreference(log.userId, log.workflowId, action)

    // 更新工作流统计
    if (action === 'clicked') {
      await prisma.workflow.update({
        where: { id: log.workflowId },
        data: { clickCount: { increment: 1 } }
      })
    } else if (action === 'imported') {
      await prisma.workflow.update({
        where: { id: log.workflowId },
        data: { importCount: { increment: 1 } }
      })
    }
  }

  /**
   * 更新用户偏好
   */
  private async updateUserPreference(
    userId: string,
    workflowId: string,
    action: string
  ) {
    // 查找或创建偏好记录
    let preference = await prisma.userWorkflowPreference.findUnique({
      where: {
        userId_workflowId: { userId, workflowId }
      }
    })

    if (!preference) {
      preference = await prisma.userWorkflowPreference.create({
        data: { userId, workflowId }
      })
    }

    // 更新行为计数
    const updates: any = {}

    switch (action) {
      case 'clicked':
        updates.viewCount = { increment: 1 }
        break
      case 'favorited':
        updates.favoriteCount = { increment: 1 }
        break
      case 'imported':
        updates.importCount = { increment: 1 }
        break
      case 'dismissed':
        updates.dismissCount = { increment: 1 }
        break
    }

    await prisma.userWorkflowPreference.update({
      where: { id: preference.id },
      data: updates
    })

    // 重新计算偏好分数
    await this.recalculatePreferenceScore(preference.id)
  }

  /**
   * 重新计算偏好分数
   */
  private async recalculatePreferenceScore(preferenceId: string) {
    const pref = await prisma.userWorkflowPreference.findUnique({
      where: { id: preferenceId }
    })

    if (!pref) return

    // 偏好分数公式
    const score =
      pref.viewCount * 0.05 +
      pref.favoriteCount * 0.3 +
      pref.importCount * 0.4 +
      pref.executeCount * 0.5 -
      pref.dismissCount * 0.8

    // 归一化到-1到1之间
    const normalizedScore = Math.max(-1, Math.min(1, score / 10))

    await prisma.userWorkflowPreference.update({
      where: { id: preferenceId },
      data: { preferenceScore: normalizedScore }
    })
  }
}

export const recommendationService = new RecommendationService()
