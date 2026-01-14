/**
 * 批量分类 AiFeed 内容
 * 分类规则：
 * - tool: 工具推荐 (AI工具、产品发布、开源项目)
 * - news: 行业动态 (公司新闻、融资、政策、市场分析)
 * - method: 工作方法 (教程、实践指南、技巧分享)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 分类规则
const TOOL_PATTERNS = [
  /发布|推出|上线|更新|升级|launch|release|新品|首发/i,
  /工具|tool|app|应用|软件|插件|extension|平台/i,
  /github|开源|开放|免费|体验|试用/i,
  /ai\s*(工具|助手|产品|模型)|gpt|claude|gemini|llama|deepseek/i,
]

const NEWS_PATTERNS = [
  /融资|投资|收购|并购|估值|ipo|上市/i,
  /openai|anthropic|google|meta|microsoft|字节|阿里|百度|腾讯|华为/i,
  /政策|监管|法规|合规|安全|风险|争议|版权/i,
  /市场|行业|报告|趋势|预测|分析|研究|调研/i,
  /裁员|招聘|人事|ceo|创始人|高管/i,
]

const METHOD_PATTERNS = [
  /教程|指南|入门|学习|课程|tutorial|guide|how.?to/i,
  /实践|实战|案例|经验|分享|总结|心得|复盘/i,
  /技巧|方法|策略|优化|提升|改进|最佳实践/i,
  /开发|编程|代码|实现|构建|搭建|部署/i,
  /框架|架构|设计|模式|原理|源码|解析/i,
]

// 来源权重
const SOURCE_WEIGHTS: Record<string, { tool: number; news: number; method: number }> = {
  'Product Hunt': { tool: 3, news: 0, method: 0 },
  'Aibase (爱邦)': { tool: 2, news: 1, method: 0 },
  'AIG123': { tool: 3, news: 0, method: 0 },
  'FutureTools': { tool: 3, news: 0, method: 0 },
  'Futurepedia': { tool: 3, news: 0, method: 0 },
  'TechCrunch': { tool: 1, news: 2, method: 0 },
  '量子位': { tool: 1, news: 2, method: 0 },
  '机器之心': { tool: 1, news: 2, method: 0 },
  'Hacker News': { tool: 0, news: 2, method: 1 },
  'The Rundown AI': { tool: 1, news: 2, method: 0 },
  '掘金': { tool: 0, news: 0, method: 3 },
  'WaytoAGI': { tool: 0, news: 0, method: 2 },
}

// 分组权重
const GROUP_WEIGHTS: Record<string, { tool: number; news: number; method: number }> = {
  '选品库': { tool: 3, news: 0, method: 0 },
  '快讯': { tool: 0, news: 2, method: 0 },
  '教程': { tool: 0, news: 0, method: 3 },
  '前沿': { tool: 0, news: 2, method: 1 },
}

function classify(title: string, group: string | null, sourceName: string | null, aiSummary: string | null): string {
  const text = `${title} ${aiSummary || ''}`.toLowerCase()

  // 计算各分类得分
  let toolScore = TOOL_PATTERNS.filter(p => p.test(text)).length
  let newsScore = NEWS_PATTERNS.filter(p => p.test(text)).length
  let methodScore = METHOD_PATTERNS.filter(p => p.test(text)).length

  // 应用来源权重
  if (sourceName && SOURCE_WEIGHTS[sourceName]) {
    const weights = SOURCE_WEIGHTS[sourceName]
    toolScore += weights.tool
    newsScore += weights.news
    methodScore += weights.method
  }

  // 应用分组权重
  if (group && GROUP_WEIGHTS[group]) {
    const weights = GROUP_WEIGHTS[group]
    toolScore += weights.tool
    newsScore += weights.news
    methodScore += weights.method
  }

  // 返回得分最高的分类
  const scores = { tool: toolScore, news: newsScore, method: methodScore }
  const maxScore = Math.max(...Object.values(scores))

  if (maxScore === 0) {
    // 默认根据来源分组判断
    if (group === '选品库') return 'tool'
    if (group === '快讯' || group === '前沿') return 'news'
    if (group === '教程') return 'method'
    return 'news' // 默认为动态
  }

  const entries = Object.entries(scores) as [string, number][]
  return entries.find(([_, score]) => score === maxScore)![0]
}

async function main() {
  console.log('🚀 开始分类 AiFeed 内容...\n')

  // 获取所有未分类的内容
  const feeds = await prisma.aiFeed.findMany({
    where: {
      category: null
    },
    select: {
      id: true,
      title: true,
      group: true,
      sourceName: true,
      aiSummary: true,
    }
  })

  console.log(`📊 找到 ${feeds.length} 条未分类内容\n`)

  // 统计
  const stats = { tool: 0, news: 0, method: 0 }

  // 批量更新
  for (const feed of feeds) {
    const category = classify(feed.title, feed.group, feed.sourceName, feed.aiSummary)
    stats[category as keyof typeof stats]++

    await prisma.aiFeed.update({
      where: { id: feed.id },
      data: { category }
    })
  }

  console.log('✅ 分类完成!\n')
  console.log('📈 分类统计:')
  console.log(`   🔧 工具推荐 (tool): ${stats.tool} 篇`)
  console.log(`   📰 行业动态 (news): ${stats.news} 篇`)
  console.log(`   📚 工作方法 (method): ${stats.method} 篇`)
  console.log(`   📊 总计: ${feeds.length} 篇`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
