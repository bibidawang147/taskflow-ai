/**
 * 创建详细的测试数据
 * 包含完整的工作流配置和解决方案步骤
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTestData() {
  console.log('🌱 开始生成测试数据...')

  // 1. 获取或创建测试用户
  let testUser = await prisma.user.findFirst({
    where: { email: 'test@example.com' }
  })

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '测试用户',
        password: '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmxO.7BXz3v8rg3lVtJOvmY0xY5K7e' // test123
      }
    })
    console.log('✅ 创建测试用户')
  }

  // 2. 创建详细的工作流数据
  const workflows = [
    {
      title: '小红书爆款文案生成器',
      description: '通过AI分析热门内容,一键生成吸引眼球的小红书文案,包含标题、正文和话题标签',
      category: '内容创作',
      tags: '小红书,文案创作,AI写作',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      difficultyLevel: 'beginner',
      platformTypes: JSON.stringify(['小红书']),
      contentTypes: JSON.stringify(['文案']),
      useScenarios: JSON.stringify(['涨粉', '提高互动率', '节省时间']),
      matchKeywords: JSON.stringify(['小红书', '文案', '标题', '爆款', '写作']),
      rating: 4.9,
      usageCount: 1230,
      config: {
        nodes: [
          { id: '1', type: 'input', label: '输入主题', data: { description: '输入你想写的主题关键词' } },
          { id: '2', type: 'llm', label: 'AI分析热点', data: { prompt: '分析小红书热门话题' } },
          { id: '3', type: 'llm', label: '生成标题', data: { prompt: '生成吸引人的标题' } },
          { id: '4', type: 'llm', label: '生成正文', data: { prompt: '撰写小红书正文' } },
          { id: '5', type: 'tool', label: '提取话题标签', data: { tool: 'extract_hashtags' } },
          { id: '6', type: 'output', label: '输出结果', data: {} }
        ],
        edges: []
      },
      // 添加解决方案步骤
      exampleInput: JSON.stringify({ topic: '减肥健身' }),
      exampleOutput: JSON.stringify({
        title: '30天瘦10斤！这个方法让我从120斤瘦到90斤',
        content: '姐妹们，我终于成功了！分享我的减肥心路历程...',
        hashtags: ['#减肥', '#健身打卡', '#瘦身']
      })
    },
    {
      title: '抖音短视频脚本创作助手',
      description: '根据主题自动生成抖音短视频脚本,包含开头、高潮、结尾和镜头设计',
      category: '内容创作',
      tags: '抖音,视频脚本,短视频',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      difficultyLevel: 'beginner',
      platformTypes: JSON.stringify(['抖音']),
      contentTypes: JSON.stringify(['视频', '文案']),
      useScenarios: JSON.stringify(['涨粉', '提高完播率', '内容创作']),
      matchKeywords: JSON.stringify(['抖音', '视频', '脚本', '短视频', '拍摄']),
      rating: 4.8,
      usageCount: 980,
      config: {
        nodes: [
          { id: '1', type: 'input', label: '输入视频主题' },
          { id: '2', type: 'llm', label: 'AI生成脚本大纲' },
          { id: '3', type: 'llm', label: '细化开头(3秒吸引)' },
          { id: '4', type: 'llm', label: '设计中段内容' },
          { id: '5', type: 'llm', label: '设计结尾钩子' },
          { id: '6', type: 'tool', label: '生成镜头分镜' },
          { id: '7', type: 'output', label: '输出完整脚本' }
        ],
        edges: []
      },
      exampleInput: JSON.stringify({ topic: '职场穿搭技巧' }),
      exampleOutput: JSON.stringify({
        title: '上班族必看！3个穿搭技巧让你秒变气质女神',
        script: {
          opening: '【镜头1】惊讶表情：天呐，这样穿去上班？',
          body: '【镜头2-4】展示3个穿搭技巧',
          ending: '【镜头5】点赞收藏，下期更精彩'
        }
      })
    },
    {
      title: '公众号文章标题优化器',
      description: '输入文章主题,AI生成10个高打开率的标题方案,并分析每个标题的优劣',
      category: '内容创作',
      tags: '公众号,标题优化,文案',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      difficultyLevel: 'beginner',
      platformTypes: JSON.stringify(['公众号']),
      contentTypes: JSON.stringify(['文案']),
      useScenarios: JSON.stringify(['提高打开率', '文案优化', '涨粉']),
      matchKeywords: JSON.stringify(['公众号', '标题', '优化', '文章', '打开率']),
      rating: 4.7,
      usageCount: 756,
      config: {
        nodes: [
          { id: '1', type: 'input', label: '输入文章主题' },
          { id: '2', type: 'llm', label: 'AI分析目标受众' },
          { id: '3', type: 'llm', label: '生成10个标题方案' },
          { id: '4', type: 'tool', label: '标题打分评估' },
          { id: '5', type: 'llm', label: '分析优劣建议' },
          { id: '6', type: 'output', label: '输出标题列表' }
        ],
        edges: []
      },
      exampleInput: JSON.stringify({ topic: '时间管理方法' }),
      exampleOutput: JSON.stringify({
        titles: [
          { text: '震惊！90%的人都不知道的时间管理秘密', score: 8.5 },
          { text: '每天只需15分钟,让你的效率提升3倍', score: 9.2 },
          { text: '从加班狗到时间管理大师，我只用了这3步', score: 9.5 }
        ]
      })
    },
    {
      title: 'B站视频数据分析工具',
      description: '分析B站视频数据,生成详细的优化建议报告,包含播放量、互动率等指标分析',
      category: '数据分析',
      tags: 'B站,数据分析,视频优化',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      difficultyLevel: 'intermediate',
      platformTypes: JSON.stringify(['B站']),
      contentTypes: JSON.stringify(['数据分析']),
      useScenarios: JSON.stringify(['数据分析', '效果优化', '涨粉']),
      matchKeywords: JSON.stringify(['B站', '数据', '分析', '优化', '播放量']),
      rating: 4.6,
      usageCount: 432,
      config: {
        nodes: [
          { id: '1', type: 'input', label: '输入视频链接' },
          { id: '2', type: 'tool', label: '爬取视频数据' },
          { id: '3', type: 'llm', label: 'AI分析数据' },
          { id: '4', type: 'tool', label: '生成可视化图表' },
          { id: '5', type: 'llm', label: '生成优化建议' },
          { id: '6', type: 'output', label: '输出分析报告' }
        ],
        edges: []
      },
      exampleInput: JSON.stringify({ videoUrl: 'https://bilibili.com/video/BV1xx411xxx' }),
      exampleOutput: JSON.stringify({
        stats: { views: 50000, likes: 2300, coins: 890, favorites: 1200 },
        analysis: '互动率偏低，建议优化结尾引导',
        suggestions: ['增加互动提问', '优化封面设计', '调整发布时间']
      })
    },
    {
      title: '小红书图文排版助手',
      description: '一键生成小红书风格的图文排版,支持多种模板和智能配色',
      category: '视觉设计',
      tags: '小红书,图文排版,设计',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      difficultyLevel: 'beginner',
      platformTypes: JSON.stringify(['小红书']),
      contentTypes: JSON.stringify(['图片']),
      useScenarios: JSON.stringify(['提高点击率', '视觉优化', '节省时间']),
      matchKeywords: JSON.stringify(['小红书', '排版', '图片', '设计', '封面']),
      rating: 4.8,
      usageCount: 890,
      config: {
        nodes: [
          { id: '1', type: 'input', label: '输入文案内容' },
          { id: '2', type: 'tool', label: '选择排版模板' },
          { id: '3', type: 'tool', label: 'AI智能配色' },
          { id: '4', type: 'tool', label: '添加贴纸元素' },
          { id: '5', type: 'tool', label: '生成多套方案' },
          { id: '6', type: 'output', label: '输出图片文件' }
        ],
        edges: []
      },
      exampleInput: JSON.stringify({ text: '减肥前后对比', style: '清新' }),
      exampleOutput: JSON.stringify({
        images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
        templates: ['模板A', '模板B', '模板C']
      })
    },
    {
      title: '全平台内容日历生成器',
      description: '根据你的运营目标,自动生成30天的内容发布计划,支持小红书、抖音、公众号等多平台',
      category: '运营工具',
      tags: '内容规划,运营,计划',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      difficultyLevel: 'intermediate',
      platformTypes: JSON.stringify(['通用']),
      contentTypes: JSON.stringify(['综合']),
      useScenarios: JSON.stringify(['效率提升', '系统运营', '涨粉']),
      matchKeywords: JSON.stringify(['内容', '计划', '日历', '运营', '规划']),
      rating: 4.5,
      usageCount: 580,
      config: {
        nodes: [
          { id: '1', type: 'input', label: '输入运营目标' },
          { id: '2', type: 'llm', label: 'AI分析目标' },
          { id: '3', type: 'llm', label: '生成主题列表' },
          { id: '4', type: 'tool', label: '分配发布时间' },
          { id: '5', type: 'llm', label: '细化每日内容' },
          { id: '6', type: 'output', label: '输出日历表格' }
        ],
        edges: []
      },
      exampleInput: JSON.stringify({ goal: '30天涨粉5000', platforms: ['小红书', '抖音'] }),
      exampleOutput: JSON.stringify({
        calendar: [
          { date: 'Day 1', topic: '自我介绍', platform: '小红书' },
          { date: 'Day 2', topic: '干货分享', platform: '抖音' },
          { date: 'Day 3', topic: '互动问答', platform: '小红书' }
        ]
      })
    }
  ]

  // 创建工作流
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
      // 更新已存在的工作流
      await prisma.workflow.update({
        where: { id: existing.id },
        data: workflowData
      })
      console.log(`🔄 更新工作流: ${workflowData.title}`)
    }
  }

  console.log('🎉 测试数据生成完成!')
  console.log(`📊 共创建/更新 ${workflows.length} 个工作流`)
}

seedTestData()
  .catch((e) => {
    console.error('❌ 数据种子失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
