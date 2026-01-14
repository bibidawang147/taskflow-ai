/**
 * AI推荐系统测试数据种子脚本
 * 创建示例工作流,包含推荐所需的元数据
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedAIRecommendation() {
  console.log('🌱 开始生成AI推荐系统测试数据...')

  // 1. 获取或创建测试用户
  let testUser = await prisma.user.findFirst({
    where: { email: 'test@example.com' }
  })

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '测试用户',
        password: '$2b$10$xLVLQ5pZ1Y9KY.JZHx9QZeXCZ1Y9KY.JZHx9QZeXCZ1Y9KY' // 密码: test123
      }
    })
    console.log('✅ 创建测试用户')
  }

  // 2. 创建示例工作流
  const workflows = [
    {
      title: '小红书爆款文案生成套装',
      description: '一键生成吸引眼球的小红书文案,包含标题、正文和话题标签推荐',
      category: '内容创作',
      tags: '文案创作,小红书,AI辅助',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      difficultyLevel: 'beginner',
      platformTypes: JSON.stringify(['小红书']),
      contentTypes: JSON.stringify(['文案']),
      useScenarios: JSON.stringify(['涨粉', '提高互动率', '节省时间']),
      matchKeywords: JSON.stringify(['小红书', '文案', '标题', '爆款', '标签']),
      combinationIds: JSON.stringify([]),
      rating: 4.9,
      usageCount: 1230,
      config: {
        nodes: [],
        edges: []
      }
    },
    {
      title: '小红书封面设计工具集',
      description: '快速生成高点击率封面图,支持多种模板和智能配色',
      category: '视觉设计',
      tags: '视觉设计,小红书,快速生成',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      difficultyLevel: 'beginner',
      platformTypes: JSON.stringify(['小红书']),
      contentTypes: JSON.stringify(['图片']),
      useScenarios: JSON.stringify(['提高点击率', '视觉优化']),
      matchKeywords: JSON.stringify(['小红书', '封面', '设计', '图片']),
      combinationIds: JSON.stringify([]),
      rating: 4.8,
      usageCount: 890,
      config: {
        nodes: [],
        edges: []
      }
    },
    {
      title: '抖音短视频脚本创作助手',
      description: '根据主题生成吸引人的短视频脚本,包含开头、高潮和结尾设计',
      category: '内容创作',
      tags: '视频创作,抖音,脚本',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      difficultyLevel: 'intermediate',
      platformTypes: JSON.stringify(['抖音']),
      contentTypes: JSON.stringify(['视频', '文案']),
      useScenarios: JSON.stringify(['涨粉', '提高完播率']),
      matchKeywords: JSON.stringify(['抖音', '视频', '脚本', '短视频']),
      combinationIds: JSON.stringify([]),
      rating: 4.7,
      usageCount: 750,
      config: {
        nodes: [],
        edges: []
      }
    },
    {
      title: '公众号文章标题优化器',
      description: '输入文章主题,生成10个高打开率的标题方案',
      category: '内容创作',
      tags: '文案创作,公众号,标题优化',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      difficultyLevel: 'beginner',
      platformTypes: JSON.stringify(['公众号']),
      contentTypes: JSON.stringify(['文案']),
      useScenarios: JSON.stringify(['提高打开率', '文案优化']),
      matchKeywords: JSON.stringify(['公众号', '标题', '优化', '文章']),
      combinationIds: JSON.stringify([]),
      rating: 4.6,
      usageCount: 620,
      config: {
        nodes: [],
        edges: []
      }
    },
    {
      title: 'B站视频数据分析工具',
      description: '分析视频表现数据,生成优化建议报告',
      category: '数据分析',
      tags: '数据分析,B站,视频优化',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      difficultyLevel: 'advanced',
      platformTypes: JSON.stringify(['B站']),
      contentTypes: JSON.stringify(['数据分析']),
      useScenarios: JSON.stringify(['数据分析', '效果优化']),
      matchKeywords: JSON.stringify(['B站', '数据', '分析', '优化']),
      combinationIds: JSON.stringify([]),
      rating: 4.5,
      usageCount: 430,
      config: {
        nodes: [],
        edges: []
      }
    },
    {
      title: '通用内容日历生成器',
      description: '根据目标制定30天内容发布计划',
      category: '运营工具',
      tags: '内容规划,运营,计划',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      difficultyLevel: 'intermediate',
      platformTypes: JSON.stringify(['通用']),
      contentTypes: JSON.stringify(['综合']),
      useScenarios: JSON.stringify(['效率提升', '系统运营']),
      matchKeywords: JSON.stringify(['内容', '计划', '日历', '运营']),
      combinationIds: JSON.stringify([]),
      rating: 4.4,
      usageCount: 580,
      config: {
        nodes: [],
        edges: []
      }
    }
  ]

  for (const workflowData of workflows) {
    const existing = await prisma.workflow.findFirst({
      where: {
        title: workflowData.title,
        authorId: testUser.id
      }
    })

    if (!existing) {
      await prisma.workflow.create({
        data: {
          ...workflowData,
          authorId: testUser.id
        }
      })
      console.log(`✅ 创建工作流: ${workflowData.title}`)
    } else {
      console.log(`⏭️  跳过已存在的工作流: ${workflowData.title}`)
    }
  }

  console.log('🎉 AI推荐系统测试数据生成完成!')
}

seedAIRecommendation()
  .catch((e) => {
    console.error('❌ 数据种子失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
