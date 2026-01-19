import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 先删除已存在的演示数据
  await prisma.workflowStepDetail.deleteMany({
    where: { nodeId: { startsWith: 'demo-step-' } }
  })
  await prisma.workflowNode.deleteMany({
    where: { workflowId: 'demo-workflow-001' }
  })
  await prisma.workflowPreparation.deleteMany({
    where: { workflowId: 'demo-workflow-001' }
  })
  await prisma.workflow.deleteMany({
    where: { id: 'demo-workflow-001' }
  })

  // 获取一个用户作为作者
  const user = await prisma.user.findFirst()
  if (!user) {
    throw new Error('没有找到用户，请先创建用户')
  }

  // 创建演示工作流
  const workflow = await prisma.workflow.create({
    data: {
      id: 'demo-workflow-001',
      title: '小红书爆款笔记创作全流程',
      description: '从选题到发布的完整小红书内容创作工作流，包含AI辅助写作、图片处理、数据分析等环节',
      isPublic: true,
      isDraft: false,
      category: 'content-creation',
      tags: '小红书,内容创作,AI写作,爆款笔记',
      difficultyLevel: 'intermediate',
      config: {
        edges: [
          { source: 'demo-step-1', target: 'demo-step-2' },
          { source: 'demo-step-2', target: 'demo-step-3' },
          { source: 'demo-step-3', target: 'demo-step-4' },
          { source: 'demo-step-4', target: 'demo-step-5' },
          { source: 'demo-step-5', target: 'demo-step-6' }
        ]
      },
      version: '1.0.0',
      authorId: user.id
    }
  })

  // 创建前置准备
  await prisma.workflowPreparation.createMany({
    data: [
      {
        workflowId: workflow.id,
        name: '注册小红书账号',
        description: '确保账号已完成实名认证，建议使用企业号获得更多功能',
        link: 'https://www.xiaohongshu.com',
        order: 1
      },
      {
        workflowId: workflow.id,
        name: '准备 AI 工具账号',
        description: '需要 ChatGPT 或 Claude 账号，用于内容生成',
        link: 'https://chat.openai.com',
        order: 2
      },
      {
        workflowId: workflow.id,
        name: '安装图片处理工具',
        description: '推荐使用 Canva 或美图秀秀进行封面设计',
        link: 'https://www.canva.com',
        order: 3
      }
    ]
  })

  // 创建步骤节点
  const steps = [
    { id: 'demo-step-1', label: '热点选题分析', x: 100 },
    { id: 'demo-step-2', label: '竞品笔记拆解', x: 300 },
    { id: 'demo-step-3', label: 'AI 生成初稿', x: 500 },
    { id: 'demo-step-4', label: '封面图片制作', x: 700 },
    { id: 'demo-step-5', label: '内容优化润色', x: 900 },
    { id: 'demo-step-6', label: '发布与数据追踪', x: 1100 }
  ]

  for (const step of steps) {
    await prisma.workflowNode.create({
      data: {
        id: step.id,
        workflowId: workflow.id,
        type: 'step',
        label: step.label,
        position: { x: step.x, y: 100 },
        config: {}
      }
    })
  }

  // 创建步骤详情
  const stepDetails = [
    {
      nodeId: 'demo-step-1',
      stepDescription: '使用数据工具分析当前小红书热门话题和趋势，找到适合自己领域的爆款选题方向',
      expectedResult: '确定 3-5 个潜力选题，每个选题有明确的目标人群和痛点',
      tools: JSON.stringify([
        { name: '新红数据', url: 'https://xh.newrank.cn', description: '小红书数据分析平台' },
        { name: '蝉妈妈', url: 'https://www.chanmama.com', description: '达人数据和热门内容分析' },
        { name: 'ChatGPT', url: 'https://chat.openai.com', description: '辅助分析和头脑风暴' }
      ]),
      promptTemplate: `你是一位小红书运营专家。请帮我分析以下领域的热门选题：

【我的领域】：{{领域}}
【目标人群】：{{目标人群}}
【近期热点】：{{热点关键词}}

请输出：
1. 5个潜力选题（标题+简述）
2. 每个选题的目标受众画像
3. 预估的互动潜力（高/中/低）
4. 内容切入角度建议`,
      demonstrationMedia: JSON.stringify([
        { type: 'image', url: 'https://picsum.photos/seed/xhs1/800/600', caption: '新红数据热门话题分析界面' },
        { type: 'image', url: 'https://picsum.photos/seed/xhs2/800/600', caption: 'AI 选题分析结果示例' }
      ]),
      relatedResources: JSON.stringify([
        { title: '小红书选题指南 PDF', type: 'file', url: '#', description: '30页选题方法论' },
        { title: '爆款选题案例库', type: 'link', url: '#', description: '100+真实爆款案例' }
      ])
    },
    {
      nodeId: 'demo-step-2',
      stepDescription: '找到同领域的爆款笔记，分析其标题、封面、正文结构、评论区互动等要素',
      expectedResult: '完成 5 篇竞品笔记的详细拆解，提取可复用的内容模板',
      tools: JSON.stringify([
        { name: '小红书 App', url: 'https://www.xiaohongshu.com', description: '搜索和收藏竞品笔记' },
        { name: 'Notion', url: 'https://notion.so', description: '整理拆解笔记' }
      ]),
      promptTemplate: `请帮我拆解这篇小红书爆款笔记：

【笔记标题】：{{标题}}
【笔记正文】：{{正文内容}}
【点赞数】：{{点赞}}  【收藏数】：{{收藏}}  【评论数】：{{评论}}

请从以下维度分析：
1. 标题技巧（数字、情绪词、悬念等）
2. 开头 hook（前3行如何吸引注意力）
3. 正文结构（总分总/列表/故事等）
4. 金句提炼（可复用的表达）
5. 评论区运营（作者如何互动）
6. 可借鉴的点和改进建议`,
      demonstrationMedia: JSON.stringify([
        { type: 'image', url: 'https://picsum.photos/seed/notion1/800/600', caption: 'Notion 竞品拆解模板' }
      ]),
      relatedResources: JSON.stringify([
        { title: '爆款笔记拆解模板', type: 'link', url: '#', description: 'Notion 模板' }
      ])
    },
    {
      nodeId: 'demo-step-3',
      stepDescription: '基于选题和竞品分析结果，使用 AI 工具生成笔记初稿',
      expectedResult: '生成一篇 800-1200 字的小红书笔记初稿，包含标题、正文、标签',
      tools: JSON.stringify([
        { name: 'Claude', url: 'https://claude.ai', description: '长文生成效果更好' },
        { name: 'ChatGPT', url: 'https://chat.openai.com', description: '快速迭代和优化' }
      ]),
      promptTemplate: `你是一位小红书爆款写手，请帮我撰写一篇笔记：

【选题】：{{选题}}
【目标人群】：{{目标人群}}
【核心痛点】：{{痛点}}
【参考风格】：{{竞品笔记特点}}

要求：
1. 标题：使用数字+情绪词+具体场景，控制在20字以内
2. 正文：
   - 开头3行必须有强 hook
   - 使用短句、分段、emoji 增加可读性
   - 包含 3-5 个实用干货点
   - 结尾引导互动（提问/投票）
3. 提供 5 个备选标题
4. 推荐 10 个相关标签

字数控制在 800-1000 字`,
      demonstrationMedia: JSON.stringify([
        { type: 'image', url: 'https://picsum.photos/seed/claude1/800/600', caption: 'Claude 生成内容示例' },
        { type: 'image', url: 'https://picsum.photos/seed/preview1/800/600', caption: '生成的笔记效果预览' }
      ]),
      relatedResources: JSON.stringify([
        { title: '小红书文案 Prompt 库', type: 'link', url: '#', description: '50+ 场景化 Prompt' }
      ])
    },
    {
      nodeId: 'demo-step-4',
      stepDescription: '使用 Canva 或其他设计工具制作吸引眼球的封面图片',
      expectedResult: '完成 1 张主封面 + 3-5 张内页图片，尺寸 3:4，风格统一',
      tools: JSON.stringify([
        { name: 'Canva', url: 'https://www.canva.com', description: '在线设计工具，有大量模板' },
        { name: '美图秀秀', url: 'https://www.meitu.com', description: '快速美化图片' },
        { name: 'Midjourney', url: 'https://midjourney.com', description: 'AI 生成配图' }
      ]),
      promptTemplate: `【Midjourney 封面生成提示词】

小红书{{主题}}封面，{{风格}}风格，
主色调{{颜色}}，包含文字"{{标题关键词}}"，
简洁大气，高级感，3:4比例

--ar 3:4 --v 6`,
      demonstrationMedia: JSON.stringify([
        { type: 'image', url: 'https://picsum.photos/seed/cover1/600/800', caption: '清新风格封面' },
        { type: 'image', url: 'https://picsum.photos/seed/cover2/600/800', caption: '数据可视化封面' },
        { type: 'image', url: 'https://picsum.photos/seed/cover3/600/800', caption: '人物场景封面' }
      ]),
      relatedResources: JSON.stringify([
        { title: 'Canva 小红书模板合集', type: 'link', url: '#', description: '100+ 免费模板' },
        { title: '配色方案推荐', type: 'link', url: '#', description: '流行色彩搭配' }
      ])
    },
    {
      nodeId: 'demo-step-5',
      stepDescription: '对 AI 生成的初稿进行人工润色，增加个人风格和真实感',
      expectedResult: '完成终稿，确保内容原创度高、符合平台调性、没有敏感词',
      tools: JSON.stringify([
        { name: '零克查词', url: 'https://www.lingke.pro', description: '小红书敏感词检测' },
        { name: 'Grammarly', url: 'https://www.grammarly.com', description: '语法检查（英文内容）' }
      ]),
      promptTemplate: `请帮我优化这篇小红书笔记，使其更加口语化和有个人特色：

【原文】：
{{原文内容}}

优化要求：
1. 将书面语改为口语化表达
2. 增加 emoji 和网络热词
3. 确保开头有足够吸引力
4. 检查是否有敏感词或违规内容
5. 优化句子长度，每段不超过3行`,
      demonstrationMedia: JSON.stringify([]),
      relatedResources: JSON.stringify([
        { title: '小红书违禁词清单', type: 'file', url: '#', description: '2024最新版' }
      ])
    },
    {
      nodeId: 'demo-step-6',
      stepDescription: '选择最佳发布时间，发布笔记并持续追踪数据表现',
      expectedResult: '笔记成功发布，建立数据追踪表，72小时内完成初始数据分析',
      tools: JSON.stringify([
        { name: '小红书创作服务平台', url: 'https://creator.xiaohongshu.com', description: '官方数据后台' },
        { name: '新红数据', url: 'https://xh.newrank.cn', description: '详细数据分析' }
      ]),
      promptTemplate: `【发布检查清单】

□ 标题是否包含关键词
□ 封面图片是否清晰吸引人
□ 正文是否有错别字
□ 标签是否相关且热门
□ 定位是否设置（如适用）
□ 发布时间是否在黄金时段（早7-9点/中午12-14点/晚20-22点）

【数据追踪模板】
| 指标 | 1小时 | 24小时 | 72小时 |
|------|-------|--------|--------|
| 曝光 |       |        |        |
| 点赞 |       |        |        |
| 收藏 |       |        |        |
| 评论 |       |        |        |
| 涨粉 |       |        |        |`,
      demonstrationMedia: JSON.stringify([
        { type: 'image', url: 'https://picsum.photos/seed/data1/800/600', caption: '创作服务平台数据页面' }
      ]),
      relatedResources: JSON.stringify([
        { title: '数据追踪 Excel 模板', type: 'file', url: '#', description: '自动计算增长率' },
        { title: '最佳发布时间研究', type: 'link', url: '#', description: '基于10万篇笔记分析' }
      ])
    }
  ]

  for (const detail of stepDetails) {
    await prisma.workflowStepDetail.create({
      data: detail
    })
  }

  console.log('✅ 演示工作流创建成功！')
  console.log('📍 访问地址: http://localhost:5173/workflow/view/demo-workflow-001')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
