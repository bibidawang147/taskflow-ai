import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始创建社群测试数据...')

  // 1. 创建测试用户
  const hashedPassword = await bcrypt.hash('test123', 10)

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@test.com' },
    update: {},
    create: {
      email: 'user1@test.com',
      name: 'AI工作流大师',
      password: hashedPassword,
      avatar: null
    }
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@test.com' },
    update: {},
    create: {
      email: 'user2@test.com',
      name: '自媒体老司机',
      password: hashedPassword,
      avatar: null
    }
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'user3@test.com' },
    update: {},
    create: {
      email: 'user3@test.com',
      name: '效率提升专家',
      password: hashedPassword,
      avatar: null
    }
  })

  console.log('✅ 测试用户创建完成')

  // 2. 创建公开工作流
  const workflows = [
    {
      title: '公众号爆款文章生成器',
      description: '智能分析热门话题，自动生成高质量公众号文章，助你快速涨粉',
      category: '自媒体',
      tags: '公众号,文案生成,AI写作',
      authorId: user1.id
    },
    {
      title: '小红书笔记优化助手',
      description: '分析小红书热门笔记，优化你的标题和内容，提升曝光率',
      category: '自媒体',
      tags: '小红书,笔记优化,涨粉',
      authorId: user2.id
    },
    {
      title: '抖音视频脚本生成',
      description: '根据你的主题自动生成抖音短视频脚本，包含开头、正文和结尾',
      category: '自媒体',
      tags: '抖音,短视频,脚本',
      authorId: user1.id
    },
    {
      title: 'AI客服智能回复',
      description: '自动识别客户问题，生成专业的回复内容，提升客服效率',
      category: '电商',
      tags: '客服,智能回复,效率',
      authorId: user3.id
    },
    {
      title: '数据报表自动生成',
      description: '连接数据源，自动生成专业的数据分析报表和可视化图表',
      category: '数据分析',
      tags: '数据分析,报表,可视化',
      authorId: user3.id
    },
    {
      title: '营销文案批量生成',
      description: '根据产品特点批量生成多个营销文案版本，节省创作时间',
      category: '营销',
      tags: '营销,文案,批量',
      authorId: user2.id
    },
    {
      title: '图片批量处理工具',
      description: '批量调整图片大小、添加水印、格式转换，提升工作效率',
      category: '效率工具',
      tags: '图片处理,批量,效率',
      authorId: user3.id
    },
    {
      title: 'SEO关键词优化',
      description: '分析搜索引擎数据，推荐最优关键词组合，提升网站排名',
      category: '营销',
      tags: 'SEO,关键词,优化',
      authorId: user1.id
    },
    {
      title: 'Excel数据清洗',
      description: '自动识别和处理Excel中的重复数据、格式错误等问题',
      category: '数据分析',
      tags: 'Excel,数据清洗,自动化',
      authorId: user3.id
    }
  ]

  for (const wf of workflows) {
    await prisma.workflow.create({
      data: {
        ...wf,
        isPublic: true,
        isDraft: false,
        config: {
          nodes: [],
          edges: []
        },
        usageCount: Math.floor(Math.random() * 10000) + 1000,
        rating: 4.5 + Math.random() * 0.5
      }
    })
  }

  console.log('✅ 公开工作流创建完成')

  // 3. 创建讨论帖
  const posts = [
    {
      title: '怎么写小红书文案？',
      content: `最近在做小红书运营，发现写文案真的太难了！大家有什么好的方法吗？

我目前的问题：
1. 标题总是起不好，不够吸引人
2. 内容写得太平淡，缺乏互动
3. 不知道该用什么emoji

有经验的朋友能分享一下吗？`,
      authorId: user2.id,
      tags: '["小红书", "文案", "运营"]'
    },
    {
      title: '分享一个AI写作的小技巧',
      content: `今天发现一个超实用的AI写作技巧，分享给大家：

1. 先用AI生成大纲
2. 针对每个小节再次提问细化
3. 最后人工润色和调整语气

这样生成的内容既有逻辑，又不会太机械。大家试试看！`,
      authorId: user1.id,
      tags: '["AI写作", "技巧", "分享"]'
    },
    {
      title: '公众号涨粉太难了，有什么办法吗？',
      content: `做公众号半年了，粉丝才200多人，每天新增个位数...

试过的方法：
- 互推（效果一般）
- 发红包（来得快走得也快）
- 原创内容（阅读量低）

大家有什么涨粉的好方法吗？求指教！`,
      authorId: user2.id,
      tags: '["公众号", "涨粉", "运营"]'
    },
    {
      title: '推荐几个提升工作效率的工具',
      content: `作为一个效率控，分享我常用的几个工具：

1. Notion - 知识管理
2. Figma - 设计协作
3. ChatGPT - AI助手
4. Obsidian - 笔记整理

你们还用什么好工具？`,
      authorId: user3.id,
      tags: '["工具", "效率", "推荐"]'
    },
    {
      title: '如何用AI提升内容创作效率？',
      content: `分享一下我的AI内容创作流程：

第一步：用AI生成创意大纲
第二步：人工筛选和调整
第三步：AI辅助完善细节
第四步：最终人工审核和优化

这个流程让我的创作效率提升了3倍！`,
      authorId: user1.id,
      tags: '["AI", "内容创作", "效率"]'
    },
    {
      title: '抖音算法最新变化，大家注意了！',
      content: `最近发现抖音算法有新变化：

1. 更重视完播率
2. 点赞权重降低
3. 评论互动更重要

大家做短视频的时候要注意调整策略了！`,
      authorId: user2.id,
      tags: '["抖音", "算法", "短视频"]'
    }
  ]

  for (const post of posts) {
    const createdPost = await prisma.post.create({
      data: {
        ...post,
        viewCount: Math.floor(Math.random() * 500) + 50,
        likeCount: Math.floor(Math.random() * 50) + 5,
        commentCount: Math.floor(Math.random() * 20) + 2
      }
    })

    // 为每个帖子创建一些评论
    await prisma.comment.create({
      data: {
        content: '感谢分享！这个方法我试试',
        userId: user3.id,
        postId: createdPost.id
      }
    })
  }

  console.log('✅ 讨论帖创建完成')
  console.log('🎉 社群测试数据创建完成！')
}

main()
  .catch((e) => {
    console.error('❌ 创建测试数据失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
