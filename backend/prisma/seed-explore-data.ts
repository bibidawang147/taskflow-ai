import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始填充探索页面数据...')

  // ============================================
  // 1. 创建用户（创作者）
  // ============================================
  console.log('📝 创建用户...')

  const creators = [
    { email: 'aimaster@workflow.com', name: 'AI工作流大师', avatar: '👨‍💼' },
    { email: 'efficiency@workflow.com', name: '效率提升专家', avatar: '⚡' },
    { email: 'mediamaster@workflow.com', name: '自媒体老司机', avatar: '🎬' },
    { email: 'dataanalyst@workflow.com', name: '数据分析师张三', avatar: '📊' },
    { email: 'ecommerce@workflow.com', name: '电商运营达人', avatar: '🛍️' },
    { email: 'aidev@workflow.com', name: 'AI应用开发者', avatar: '🤖' },
    { email: 'content@workflow.com', name: '品牌内容策划师', avatar: '✍️' },
    { email: 'global@workflow.com', name: '跨境运营顾问', avatar: '🌍' },
    { email: 'video@workflow.com', name: '短视频剪辑师', avatar: '🎥' },
    { email: 'product@workflow.com', name: '产品经理小李', avatar: '💡' },
    { email: 'designer@workflow.com', name: '设计师', avatar: '🎨' },
    { email: 'creator@workflow.com', name: '内容创作者王五', avatar: '📹' },
    { email: 'growth@workflow.com', name: '增长黑客实验室', avatar: '📈' },
  ]

  const password = await bcrypt.hash('password123', 10)
  const createdUsers: any[] = []

  for (const creator of creators) {
    const user = await prisma.user.upsert({
      where: { email: creator.email },
      update: {},
      create: {
        email: creator.email,
        name: creator.name,
        avatar: creator.avatar,
        password,
        tier: 'pro',
      },
    })
    createdUsers.push(user)
    console.log(`  ✓ 创建用户: ${user.name}`)
  }

  // ============================================
  // 2. 创建 AI 模型工具
  // ============================================
  console.log('\n🤖 创建 AI 模型定价配置...')

  const modelPricingData = [
    // OpenAI Models
    {
      provider: 'openai',
      modelId: 'gpt-4',
      modelName: 'GPT-4',
      description: '最强大的GPT模型，支持复杂推理和视觉理解',
      inputPrice: 30,
      outputPrice: 60,
      category: 'text',
      maxTokens: 8192,
      features: { vision: true, functionCalling: true, streaming: true, jsonMode: true },
      isActive: true,
      allowedTiers: 'pro,enterprise',
      sortOrder: 1,
    },
    {
      provider: 'openai',
      modelId: 'gpt-4-turbo',
      modelName: 'GPT-4 Turbo',
      description: '更快更经济的GPT-4版本',
      inputPrice: 10,
      outputPrice: 30,
      category: 'text',
      maxTokens: 128000,
      features: { vision: true, functionCalling: true, streaming: true, jsonMode: true },
      isActive: true,
      allowedTiers: 'free,pro,enterprise',
      sortOrder: 2,
    },
    {
      provider: 'openai',
      modelId: 'gpt-3.5-turbo',
      modelName: 'GPT-3.5 Turbo',
      description: '快速且经济的对话模型',
      inputPrice: 0.5,
      outputPrice: 1.5,
      category: 'text',
      maxTokens: 16385,
      features: { functionCalling: true, streaming: true, jsonMode: true },
      isActive: true,
      allowedTiers: 'free,pro,enterprise',
      sortOrder: 3,
    },
    // Anthropic Claude Models
    {
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      modelName: 'Claude 3.5 Sonnet',
      description: '平衡性能与成本的最佳选择',
      inputPrice: 3,
      outputPrice: 15,
      category: 'text',
      maxTokens: 200000,
      features: { vision: true, functionCalling: true, streaming: true },
      isActive: true,
      allowedTiers: 'free,pro,enterprise',
      sortOrder: 4,
    },
    {
      provider: 'anthropic',
      modelId: 'claude-3-opus-20240229',
      modelName: 'Claude 3 Opus',
      description: '最强大的Claude模型',
      inputPrice: 15,
      outputPrice: 75,
      category: 'text',
      maxTokens: 200000,
      features: { vision: true, streaming: true },
      isActive: true,
      allowedTiers: 'pro,enterprise',
      sortOrder: 5,
    },
    {
      provider: 'anthropic',
      modelId: 'claude-3-haiku-20240307',
      modelName: 'Claude 3 Haiku',
      description: '快速且经济的Claude模型',
      inputPrice: 0.25,
      outputPrice: 1.25,
      category: 'text',
      maxTokens: 200000,
      features: { vision: true, streaming: true },
      isActive: true,
      allowedTiers: 'free,pro,enterprise',
      sortOrder: 6,
    },
    // 豆包 AI
    {
      provider: 'doubao',
      modelId: 'doubao-pro',
      modelName: '豆包 Pro',
      description: '字节跳动专业级对话模型',
      inputPrice: 0.8,
      outputPrice: 2,
      category: 'text',
      maxTokens: 32000,
      features: { streaming: true, functionCalling: true },
      isActive: true,
      allowedTiers: 'free,pro,enterprise',
      sortOrder: 7,
    },
    {
      provider: 'doubao',
      modelId: 'doubao-lite',
      modelName: '豆包 Lite',
      description: '轻量快速的对话模型',
      inputPrice: 0.3,
      outputPrice: 0.6,
      category: 'text',
      maxTokens: 16000,
      features: { streaming: true },
      isActive: true,
      allowedTiers: 'free,pro,enterprise',
      sortOrder: 8,
    },
    // 通义千问
    {
      provider: 'qwen',
      modelId: 'qwen-plus',
      modelName: '通义千问 Plus',
      description: '阿里云强大的中文理解能力',
      inputPrice: 4,
      outputPrice: 12,
      category: 'text',
      maxTokens: 32000,
      features: { streaming: true, functionCalling: true },
      isActive: true,
      allowedTiers: 'free,pro,enterprise',
      sortOrder: 9,
    },
    {
      provider: 'qwen',
      modelId: 'qwen-turbo',
      modelName: '通义千问 Turbo',
      description: '快速响应的中文模型',
      inputPrice: 2,
      outputPrice: 6,
      category: 'text',
      maxTokens: 8000,
      features: { streaming: true },
      isActive: true,
      allowedTiers: 'free,pro,enterprise',
      sortOrder: 10,
    },
    // 智谱 AI
    {
      provider: 'zhipu',
      modelId: 'glm-4',
      modelName: 'GLM-4',
      description: '智谱AI新一代对话模型',
      inputPrice: 100,
      outputPrice: 100,
      category: 'text',
      maxTokens: 128000,
      features: { streaming: true, functionCalling: true, vision: true },
      isActive: true,
      allowedTiers: 'pro,enterprise',
      sortOrder: 11,
    },
    {
      provider: 'zhipu',
      modelId: 'glm-3-turbo',
      modelName: 'GLM-3 Turbo',
      description: '高效的对话模型',
      inputPrice: 5,
      outputPrice: 5,
      category: 'text',
      maxTokens: 128000,
      features: { streaming: true },
      isActive: true,
      allowedTiers: 'free,pro,enterprise',
      sortOrder: 12,
    },
  ]

  for (const model of modelPricingData) {
    await prisma.modelPricing.upsert({
      where: {
        provider_modelId: {
          provider: model.provider,
          modelId: model.modelId,
        },
      },
      update: {},
      create: model,
    })
    console.log(`  ✓ 创建模型: ${model.modelName}`)
  }

  // ============================================
  // 3. 创建工具 (Tools)
  // ============================================
  console.log('\n🛠️  创建工具...')

  const toolsData = [
    {
      name: 'ChatGPT-4',
      description: '强大的对话AI，支持复杂推理和多轮对话',
      category: 'AI对话',
      icon: '🤖',
      configSchema: {},
      apiConfig: { provider: 'openai', model: 'gpt-4' },
      isBuiltIn: true,
      isActive: true,
    },
    {
      name: 'Midjourney',
      description: 'AI图像生成工具',
      category: '图像生成',
      icon: '🎨',
      configSchema: {},
      isBuiltIn: true,
      isActive: true,
    },
    {
      name: 'Claude 3',
      description: 'Anthropic的智能助手',
      category: 'AI助手',
      icon: '🧠',
      configSchema: {},
      apiConfig: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
      isBuiltIn: true,
      isActive: true,
    },
    {
      name: 'Stable Diffusion',
      description: '开源AI图像生成',
      category: '图像生成',
      icon: '🖼️',
      configSchema: {},
      isBuiltIn: true,
      isActive: true,
    },
    {
      name: 'GitHub Copilot',
      description: 'AI编程助手',
      category: '代码助手',
      icon: '💻',
      configSchema: {},
      isBuiltIn: true,
      isActive: true,
    },
    {
      name: 'Notion AI',
      description: '智能写作助手',
      category: '写作助手',
      icon: '📝',
      configSchema: {},
      isBuiltIn: true,
      isActive: true,
    },
    {
      name: 'Canva Magic Write',
      description: '设计辅助工具',
      category: '设计辅助',
      icon: '✨',
      configSchema: {},
      isBuiltIn: true,
      isActive: true,
    },
  ]

  const createdTools = []
  for (const tool of toolsData) {
    const created = await prisma.tool.create({
      data: tool,
    })
    createdTools.push(created)
    console.log(`  ✓ 创建工具: ${tool.name}`)
  }

  // ============================================
  // 4. 创建工作流
  // ============================================
  console.log('\n⚙️  创建工作流...')

  const workflowsData = [
    {
      title: '公众号爆款文章生成器',
      description: '结合热点话题和账号定位，智能生成公众号、百家号等平台的高互动文章',
      category: '自媒体',
      tags: '自媒体,文章写作,热点追踪,多平台输出',
      isPublic: true,
      isTemplate: true,
      authorEmail: 'aimaster@workflow.com',
      thumbnail: '📝',
      config: {
        nodes: [
          { id: 'input-1', type: 'input', label: '输入话题', position: { x: 100, y: 100 } },
          { id: 'llm-1', type: 'llm', label: '生成文章', position: { x: 300, y: 100 } },
          { id: 'output-1', type: 'output', label: '输出结果', position: { x: 500, y: 100 } },
        ],
        edges: [
          { id: 'e1-2', source: 'input-1', target: 'llm-1' },
          { id: 'e2-3', source: 'llm-1', target: 'output-1' },
        ],
      },
      uses: 25600,
      likes: 8900,
    },
    {
      title: '智能客服机器人',
      description: 'AI自动回复客户咨询，提供24小时在线服务',
      category: '电商',
      tags: '电商,客服,自动回复,AI对话',
      isPublic: true,
      isTemplate: true,
      authorEmail: 'ecommerce@workflow.com',
      thumbnail: '🤖',
      config: {
        nodes: [
          { id: 'input-1', type: 'input', label: '客户问题', position: { x: 100, y: 100 } },
          { id: 'llm-1', type: 'llm', label: '智能回复', position: { x: 300, y: 100 } },
          { id: 'output-1', type: 'output', label: '回复内容', position: { x: 500, y: 100 } },
        ],
        edges: [
          { id: 'e1-2', source: 'input-1', target: 'llm-1' },
          { id: 'e2-3', source: 'llm-1', target: 'output-1' },
        ],
      },
      uses: 22100,
      likes: 7800,
    },
    {
      title: '视频脚本一键生成',
      description: '为抖音、快手、小红书等平台提供分镜脚本、镜头说明和文案提示',
      category: '自媒体',
      tags: '自媒体,视频制作,分镜脚本,多平台适配',
      isPublic: true,
      isTemplate: true,
      authorEmail: 'mediamaster@workflow.com',
      thumbnail: '🎬',
      config: {
        nodes: [
          { id: 'input-1', type: 'input', label: '视频主题', position: { x: 100, y: 100 } },
          { id: 'llm-1', type: 'llm', label: '生成脚本', position: { x: 300, y: 100 } },
          { id: 'output-1', type: 'output', label: '脚本内容', position: { x: 500, y: 100 } },
        ],
        edges: [
          { id: 'e1-2', source: 'input-1', target: 'llm-1' },
          { id: 'e2-3', source: 'llm-1', target: 'output-1' },
        ],
      },
      uses: 19800,
      likes: 7200,
    },
    {
      title: 'AI去痕迹内容优化',
      description: '优化AI生成的内容，使其更自然、更符合人类写作风格',
      category: '内容创作',
      tags: '内容创作,文本优化,AI优化',
      isPublic: true,
      isTemplate: true,
      authorEmail: 'aimaster@workflow.com',
      thumbnail: '✨',
      config: {
        nodes: [
          { id: 'input-1', type: 'input', label: 'AI生成内容', position: { x: 100, y: 100 } },
          { id: 'llm-1', type: 'llm', label: '内容优化', position: { x: 300, y: 100 } },
          { id: 'output-1', type: 'output', label: '优化后内容', position: { x: 500, y: 100 } },
        ],
        edges: [
          { id: 'e1-2', source: 'input-1', target: 'llm-1' },
          { id: 'e2-3', source: 'llm-1', target: 'output-1' },
        ],
      },
      uses: 18500,
      likes: 6700,
    },
    {
      title: '数据可视化报表',
      description: '上传数据表即可生成按业务目标拆分的实时仪表盘和监控告警',
      category: '数据分析',
      tags: '数据分析,可视化,多维分析,实时刷新',
      isPublic: true,
      isTemplate: true,
      authorEmail: 'dataanalyst@workflow.com',
      thumbnail: '📊',
      config: {
        nodes: [
          { id: 'input-1', type: 'input', label: '数据输入', position: { x: 100, y: 100 } },
          { id: 'tool-1', type: 'tool', label: '数据处理', position: { x: 300, y: 100 } },
          { id: 'output-1', type: 'output', label: '可视化图表', position: { x: 500, y: 100 } },
        ],
        edges: [
          { id: 'e1-2', source: 'input-1', target: 'tool-1' },
          { id: 'e2-3', source: 'tool-1', target: 'output-1' },
        ],
      },
      uses: 16200,
      likes: 6100,
    },
    {
      title: '会议纪要自动生成',
      description: '会议录音自动转写、提炼行动项并同步到任务系统',
      category: '效率工具',
      tags: '效率工具,会议协作,语音转写,任务分派',
      isPublic: true,
      isTemplate: true,
      authorEmail: 'efficiency@workflow.com',
      thumbnail: '📋',
      config: {
        nodes: [
          { id: 'input-1', type: 'input', label: '会议录音', position: { x: 100, y: 100 } },
          { id: 'llm-1', type: 'llm', label: '转写总结', position: { x: 300, y: 100 } },
          { id: 'output-1', type: 'output', label: '会议纪要', position: { x: 500, y: 100 } },
        ],
        edges: [
          { id: 'e1-2', source: 'input-1', target: 'llm-1' },
          { id: 'e2-3', source: 'llm-1', target: 'output-1' },
        ],
      },
      uses: 14900,
      likes: 5600,
    },
    {
      title: 'OKR 进度驾驶舱',
      description: '整合团队目标、关键结果和执行进展，生成可视化看板与提醒',
      category: '效率工具',
      tags: '效率工具,目标管理,周报同步,提醒推送',
      isPublic: true,
      isTemplate: true,
      authorEmail: 'efficiency@workflow.com',
      thumbnail: '🎯',
      config: {
        nodes: [
          { id: 'input-1', type: 'input', label: 'OKR目标', position: { x: 100, y: 100 } },
          { id: 'tool-1', type: 'tool', label: '进度追踪', position: { x: 300, y: 100 } },
          { id: 'output-1', type: 'output', label: '可视化看板', position: { x: 500, y: 100 } },
        ],
        edges: [
          { id: 'e1-2', source: 'input-1', target: 'tool-1' },
          { id: 'e2-3', source: 'tool-1', target: 'output-1' },
        ],
      },
      uses: 13200,
      likes: 5100,
    },
    {
      title: '知识库构建器',
      description: '整理零散文档、项目经验，生成结构化知识图谱和搜索入口',
      category: '效率工具',
      tags: '效率工具,知识管理,知识沉淀,检索增强',
      isPublic: true,
      isTemplate: true,
      authorEmail: 'efficiency@workflow.com',
      thumbnail: '📚',
      config: {
        nodes: [
          { id: 'input-1', type: 'input', label: '文档输入', position: { x: 100, y: 100 } },
          { id: 'llm-1', type: 'llm', label: '知识整理', position: { x: 300, y: 100 } },
          { id: 'output-1', type: 'output', label: '知识图谱', position: { x: 500, y: 100 } },
        ],
        edges: [
          { id: 'e1-2', source: 'input-1', target: 'llm-1' },
          { id: 'e2-3', source: 'llm-1', target: 'output-1' },
        ],
      },
      uses: 12800,
      likes: 4800,
    },
    {
      title: '商品详情优化器',
      description: '生成高转化标题、卖点拆解、场景文案以及图文建议',
      category: '电商',
      tags: '电商,商品详情,卖点提炼,标题优化',
      isPublic: true,
      isTemplate: true,
      authorEmail: 'ecommerce@workflow.com',
      thumbnail: '🛍️',
      config: {
        nodes: [
          { id: 'input-1', type: 'input', label: '商品信息', position: { x: 100, y: 100 } },
          { id: 'llm-1', type: 'llm', label: '优化文案', position: { x: 300, y: 100 } },
          { id: 'output-1', type: 'output', label: '商品详情', position: { x: 500, y: 100 } },
        ],
        edges: [
          { id: 'e1-2', source: 'input-1', target: 'llm-1' },
          { id: 'e2-3', source: 'llm-1', target: 'output-1' },
        ],
      },
      uses: 11500,
      likes: 4300,
    },
    {
      title: '产品路线图规划器',
      description: '根据目标用户痛点生成季度产品路线图与迭代优先级',
      category: '一人公司',
      tags: '产品管理,需求分析,版本规划,用户反馈',
      isPublic: true,
      isTemplate: true,
      authorEmail: 'product@workflow.com',
      thumbnail: '🗺️',
      config: {
        nodes: [
          { id: 'input-1', type: 'input', label: '用户需求', position: { x: 100, y: 100 } },
          { id: 'llm-1', type: 'llm', label: '规划路线', position: { x: 300, y: 100 } },
          { id: 'output-1', type: 'output', label: '产品路线图', position: { x: 500, y: 100 } },
        ],
        edges: [
          { id: 'e1-2', source: 'input-1', target: 'llm-1' },
          { id: 'e2-3', source: 'llm-1', target: 'output-1' },
        ],
      },
      uses: 10200,
      likes: 3900,
    },
  ]

  const createdWorkflows = []
  for (const wf of workflowsData) {
    const author = createdUsers.find((u) => u.email === wf.authorEmail)
    if (!author) continue

    const workflow = await prisma.workflow.create({
      data: {
        title: wf.title,
        description: wf.description,
        category: wf.category,
        tags: wf.tags,
        isPublic: wf.isPublic,
        isTemplate: wf.isTemplate,
        thumbnail: wf.thumbnail,
        authorId: author.id,
        config: wf.config,
      },
    })

    createdWorkflows.push({ workflow, uses: (wf as any).uses, likes: (wf as any).likes })
    console.log(`  ✓ 创建工作流: ${wf.title}`)
  }

  // ============================================
  // 5. 创建评分和收藏（模拟使用数据）
  // ============================================
  console.log('\n⭐ 创建评分和收藏...')

  for (const { workflow, uses, likes } of createdWorkflows) {
    // 为每个工作流创建一些评分
    const numRatings = Math.min(likes / 100, createdUsers.length)
    for (let i = 0; i < numRatings; i++) {
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)]
      try {
        await prisma.rating.create({
          data: {
            userId: randomUser.id,
            workflowId: workflow.id,
            score: Math.floor(Math.random() * 2) + 4, // 4-5分
            review: '非常好用的工作流！',
          },
        })
      } catch (e) {
        // 忽略重复评分错误
      }
    }

    // 创建收藏
    const numFavorites = Math.min(likes / 200, createdUsers.length)
    for (let i = 0; i < numFavorites; i++) {
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)]
      try {
        await prisma.favorite.create({
          data: {
            userId: randomUser.id,
            workflowId: workflow.id,
          },
        })
      } catch (e) {
        // 忽略重复收藏错误
      }
    }
  }

  console.log('  ✓ 创建了评分和收藏数据')

  // ============================================
  // 6. 创建工作项 (WorkItems)
  // ============================================
  console.log('\n📋 创建工作项...')

  const workItemsData = [
    { name: '文章撰写', icon: '📝', category: 'text', description: '智能文章生成和优化' },
    { name: '视频脚本', icon: '🎬', category: 'text', description: '视频脚本创作' },
    { name: '图片生成', icon: '🎨', category: 'image', description: 'AI图片生成' },
    { name: '数据分析', icon: '📊', category: 'analysis', description: '数据分析和可视化' },
    { name: '客服对话', icon: '💬', category: 'text', description: '智能客服对话' },
    { name: '代码生成', icon: '💻', category: 'code', description: 'AI代码生成' },
    { name: '翻译', icon: '🌐', category: 'text', description: '多语言翻译' },
    { name: '总结摘要', icon: '📄', category: 'text', description: '文本总结和摘要' },
  ]

  for (const item of workItemsData) {
    await prisma.workItem.create({
      data: item,
    })
    console.log(`  ✓ 创建工作项: ${item.name}`)
  }

  // ============================================
  // 7. 为用户创建余额记录
  // ============================================
  console.log('\n💰 创建用户余额...')

  for (const user of createdUsers) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    await prisma.userBalance.create({
      data: {
        userId: user.id,
        coins: user.tier === 'pro' ? 100000 : 10000, // Pro用户给更多积分
        freeQuota: user.tier === 'pro' ? 50000 : 10000,
        usedToday: 0,
        quotaResetAt: tomorrow,
        totalRecharged: 0,
        totalConsumed: 0,
      },
    })
    console.log(`  ✓ 创建用户余额: ${user.name}`)
  }

  console.log('\n✅ 数据填充完成!')
  console.log('\n📊 统计:')
  console.log(`  - 用户: ${createdUsers.length}`)
  console.log(`  - AI模型: ${modelPricingData.length}`)
  console.log(`  - 工具: ${toolsData.length}`)
  console.log(`  - 工作流: ${createdWorkflows.length}`)
  console.log(`  - 工作项: ${workItemsData.length}`)
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
