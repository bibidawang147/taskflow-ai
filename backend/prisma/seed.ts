import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始种子数据...')

  // 1. 创建系统管理员用户(用于内置工作流的作者)
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@workflow.com' },
    update: {},
    create: {
      email: 'system@workflow.com',
      name: '系统管理员',
      password: hashedPassword,
      avatar: '🤖',
      tier: 'enterprise'
    }
  })

  console.log(`✅ 系统用户创建完成: ${systemUser.email}`)

  // 2. 创建内置工作流模板
  const builtInWorkflows = [
    {
      title: '📝 智能文章生成器',
      description: '根据主题和关键词自动生成高质量文章,适用于博客、营销文案、新闻稿等场景',
      category: 'content',
      tags: '写作,AI生成,营销',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      config: {
        nodes: [
          {
            id: 'input-1',
            type: 'input',
            label: '输入主题',
            position: { x: 100, y: 100 },
            data: {
              label: '输入主题',
              description: '请输入文章主题和关键词',
              fields: [
                { name: 'topic', label: '文章主题', type: 'text', required: true },
                { name: 'keywords', label: '关键词(逗号分隔)', type: 'text', required: false },
                { name: 'wordCount', label: '字数要求', type: 'number', required: false, defaultValue: 1000 }
              ]
            }
          },
          {
            id: 'llm-1',
            type: 'llm',
            label: '生成文章大纲',
            position: { x: 400, y: 100 },
            data: {
              label: '生成文章大纲',
              provider: 'doubao',
              model: 'doubao-pro-32k',
              prompt: '你是一个专业的内容策划师。请根据主题"{{topic}}"和关键词"{{keywords}}"生成一个详细的文章大纲,包含引言、3-5个主要章节和结论。',
              temperature: 0.7,
              maxTokens: 2000
            }
          },
          {
            id: 'llm-2',
            type: 'llm',
            label: '撰写文章内容',
            position: { x: 700, y: 100 },
            data: {
              label: '撰写文章内容',
              provider: 'doubao',
              model: 'doubao-pro-128k',
              prompt: '根据以下大纲撰写一篇{{wordCount}}字左右的文章:\n\n{{llm-1.output}}\n\n要求:\n1. 语言流畅自然\n2. 逻辑清晰\n3. 包含具体案例和数据\n4. SEO友好',
              temperature: 0.8,
              maxTokens: 4000
            }
          },
          {
            id: 'output-1',
            type: 'output',
            label: '文章输出',
            position: { x: 1000, y: 100 },
            data: {
              label: '文章输出',
              fields: [
                { name: 'article', source: 'llm-2.output' }
              ]
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'input-1', target: 'llm-1' },
          { id: 'e2', source: 'llm-1', target: 'llm-2' },
          { id: 'e3', source: 'llm-2', target: 'output-1' }
        ]
      },
      exampleInput: {
        topic: '人工智能在教育领域的应用',
        keywords: 'AI,个性化学习,智能辅导',
        wordCount: 1500
      },
      exampleOutput: {
        article: '(示例输出: 一篇关于AI教育应用的完整文章...)'
      }
    },
    {
      title: '🎯 智能营销方案生成器',
      description: '为产品或服务自动生成完整的营销方案,包括目标用户分析、营销策略、渠道建议等',
      category: 'marketing',
      tags: '营销,策划,商业',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      config: {
        nodes: [
          {
            id: 'input-1',
            type: 'input',
            label: '产品信息',
            position: { x: 100, y: 100 },
            data: {
              label: '产品信息',
              fields: [
                { name: 'productName', label: '产品名称', type: 'text', required: true },
                { name: 'productDesc', label: '产品描述', type: 'textarea', required: true },
                { name: 'targetMarket', label: '目标市场', type: 'text', required: false },
                { name: 'budget', label: '营销预算', type: 'text', required: false }
              ]
            }
          },
          {
            id: 'llm-1',
            type: 'llm',
            label: '用户画像分析',
            position: { x: 400, y: 50 },
            data: {
              label: '用户画像分析',
              provider: 'doubao',
              model: 'doubao-pro-32k',
              prompt: '作为市场分析专家,请为以下产品分析目标用户画像:\n\n产品:{{productName}}\n描述:{{productDesc}}\n市场:{{targetMarket}}\n\n请输出:\n1. 核心用户群特征\n2. 用户需求和痛点\n3. 购买决策因素',
              temperature: 0.6
            }
          },
          {
            id: 'llm-2',
            type: 'llm',
            label: '营销策略规划',
            position: { x: 400, y: 200 },
            data: {
              label: '营销策略规划',
              provider: 'doubao',
              model: 'doubao-pro-32k',
              prompt: '基于产品"{{productName}}"和预算"{{budget}}",制定营销策略:\n\n用户分析:\n{{llm-1.output}}\n\n请提供:\n1. 营销目标和KPI\n2. 差异化定位\n3. 核心营销信息\n4. 3-5个关键策略',
              temperature: 0.7
            }
          },
          {
            id: 'llm-3',
            type: 'llm',
            label: '渠道和执行计划',
            position: { x: 700, y: 100 },
            data: {
              label: '渠道和执行计划',
              provider: 'doubao',
              model: 'doubao-pro-32k',
              prompt: '整合以下信息,制定营销执行计划:\n\n用户分析:\n{{llm-1.output}}\n\n营销策略:\n{{llm-2.output}}\n\n请输出:\n1. 推荐的营销渠道(线上+线下)\n2. 各渠道执行要点\n3. 时间规划\n4. 效果评估指标',
              temperature: 0.7
            }
          },
          {
            id: 'output-1',
            type: 'output',
            label: '营销方案',
            position: { x: 1000, y: 100 },
            data: {
              label: '营销方案',
              fields: [
                { name: 'userProfile', source: 'llm-1.output' },
                { name: 'strategy', source: 'llm-2.output' },
                { name: 'executionPlan', source: 'llm-3.output' }
              ]
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'input-1', target: 'llm-1' },
          { id: 'e2', source: 'input-1', target: 'llm-2' },
          { id: 'e3', source: 'llm-1', target: 'llm-2' },
          { id: 'e4', source: 'llm-1', target: 'llm-3' },
          { id: 'e5', source: 'llm-2', target: 'llm-3' },
          { id: 'e6', source: 'llm-3', target: 'output-1' }
        ]
      }
    },
    {
      title: '💡 创意故事生成器',
      description: '根据主题、风格和角色设定自动创作创意故事,适用于小说、剧本、儿童故事等',
      category: 'creative',
      tags: '创作,故事,娱乐',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      config: {
        nodes: [
          {
            id: 'input-1',
            type: 'input',
            label: '故事设定',
            position: { x: 100, y: 100 },
            data: {
              label: '故事设定',
              fields: [
                { name: 'theme', label: '故事主题', type: 'text', required: true },
                { name: 'genre', label: '类型', type: 'select', options: ['科幻', '奇幻', '悬疑', '爱情', '冒险', '儿童'], required: true },
                { name: 'characters', label: '主要角色(可选)', type: 'textarea', required: false },
                { name: 'length', label: '故事长度', type: 'select', options: ['短篇(1000字)', '中篇(3000字)', '长篇(5000字+)'], required: true }
              ]
            }
          },
          {
            id: 'llm-1',
            type: 'llm',
            label: '构思故事框架',
            position: { x: 400, y: 100 },
            data: {
              label: '构思故事框架',
              provider: 'doubao',
              model: 'doubao-pro-32k',
              prompt: '你是一位富有创意的编剧。请为以下设定构思故事框架:\n\n主题:{{theme}}\n类型:{{genre}}\n角色:{{characters}}\n\n请输出包含:\n1. 故事背景和世界观\n2. 核心冲突\n3. 主要情节转折点(起、承、转、合)\n4. 结局设定',
              temperature: 0.9
            }
          },
          {
            id: 'llm-2',
            type: 'llm',
            label: '撰写完整故事',
            position: { x: 700, y: 100 },
            data: {
              label: '撰写完整故事',
              provider: 'doubao',
              model: 'doubao-pro-128k',
              prompt: '基于以下故事框架,撰写一个{{length}}的完整故事:\n\n{{llm-1.output}}\n\n创作要求:\n1. 语言生动,富有画面感\n2. 情节紧凑,悬念迭起\n3. 人物刻画鲜明\n4. 符合{{genre}}类型特点',
              temperature: 0.9,
              maxTokens: 8000
            }
          },
          {
            id: 'output-1',
            type: 'output',
            label: '故事输出',
            position: { x: 1000, y: 100 },
            data: {
              label: '故事输出',
              fields: [
                { name: 'framework', source: 'llm-1.output' },
                { name: 'story', source: 'llm-2.output' }
              ]
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'input-1', target: 'llm-1' },
          { id: 'e2', source: 'llm-1', target: 'llm-2' },
          { id: 'e3', source: 'llm-2', target: 'output-1' }
        ]
      }
    },
    {
      title: '🔍 智能数据分析助手',
      description: '上传数据或描述数据特征,自动进行数据分析并生成洞察报告',
      category: 'analysis',
      tags: '数据分析,报告,商业智能',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      config: {
        nodes: [
          {
            id: 'input-1',
            type: 'input',
            label: '数据输入',
            position: { x: 100, y: 100 },
            data: {
              label: '数据输入',
              fields: [
                { name: 'dataDescription', label: '数据描述', type: 'textarea', required: true },
                { name: 'analysisGoal', label: '分析目标', type: 'text', required: true },
                { name: 'dataPoints', label: '关键数据点(可选)', type: 'textarea', required: false }
              ]
            }
          },
          {
            id: 'llm-1',
            type: 'llm',
            label: '数据清洗建议',
            position: { x: 400, y: 50 },
            data: {
              label: '数据清洗建议',
              provider: 'doubao',
              model: 'doubao-pro-32k',
              prompt: '作为数据分析专家,请分析以下数据:\n\n{{dataDescription}}\n\n提供:\n1. 数据质量评估\n2. 需要清洗的问题\n3. 清洗建议',
              temperature: 0.3
            }
          },
          {
            id: 'llm-2',
            type: 'llm',
            label: '数据分析',
            position: { x: 400, y: 200 },
            data: {
              label: '数据分析',
              provider: 'doubao',
              model: 'doubao-pro-32k',
              prompt: '基于数据:\n{{dataDescription}}\n\n分析目标:{{analysisGoal}}\n\n请进行:\n1. 描述性统计分析\n2. 趋势分析\n3. 异常值识别\n4. 相关性分析',
              temperature: 0.3
            }
          },
          {
            id: 'llm-3',
            type: 'llm',
            label: '生成洞察报告',
            position: { x: 700, y: 100 },
            data: {
              label: '生成洞察报告',
              provider: 'doubao',
              model: 'doubao-pro-32k',
              prompt: '综合以下信息生成数据洞察报告:\n\n数据质量:\n{{llm-1.output}}\n\n分析结果:\n{{llm-2.output}}\n\n请输出:\n1. 核心发现(3-5条)\n2. 业务建议\n3. 后续分析方向',
              temperature: 0.4
            }
          },
          {
            id: 'output-1',
            type: 'output',
            label: '分析报告',
            position: { x: 1000, y: 100 },
            data: {
              label: '分析报告',
              fields: [
                { name: 'dataQuality', source: 'llm-1.output' },
                { name: 'analysis', source: 'llm-2.output' },
                { name: 'insights', source: 'llm-3.output' }
              ]
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'input-1', target: 'llm-1' },
          { id: 'e2', source: 'input-1', target: 'llm-2' },
          { id: 'e3', source: 'llm-1', target: 'llm-3' },
          { id: 'e4', source: 'llm-2', target: 'llm-3' },
          { id: 'e5', source: 'llm-3', target: 'output-1' }
        ]
      }
    },
    {
      title: '🎓 智能课程设计助手',
      description: '根据教学目标和学生特点,自动设计完整的课程大纲和教学计划',
      category: 'education',
      tags: '教育,课程设计,教学',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      config: {
        nodes: [
          {
            id: 'input-1',
            type: 'input',
            label: '课程需求',
            position: { x: 100, y: 100 },
            data: {
              label: '课程需求',
              fields: [
                { name: 'subject', label: '课程主题', type: 'text', required: true },
                { name: 'level', label: '学生水平', type: 'select', options: ['初级', '中级', '高级'], required: true },
                { name: 'duration', label: '课程时长', type: 'text', required: true },
                { name: 'objectives', label: '教学目标', type: 'textarea', required: true }
              ]
            }
          },
          {
            id: 'llm-1',
            type: 'llm',
            label: '课程大纲设计',
            position: { x: 400, y: 100 },
            data: {
              label: '课程大纲设计',
              provider: 'doubao',
              model: 'doubao-pro-32k',
              prompt: '作为教学设计专家,请设计课程大纲:\n\n主题:{{subject}}\n学生水平:{{level}}\n时长:{{duration}}\n目标:{{objectives}}\n\n请输出:\n1. 课程总体结构\n2. 各章节主题和要点\n3. 学时分配\n4. 重难点标注',
              temperature: 0.6
            }
          },
          {
            id: 'llm-2',
            type: 'llm',
            label: '教学活动设计',
            position: { x: 700, y: 100 },
            data: {
              label: '教学活动设计',
              provider: 'doubao',
              model: 'doubao-pro-32k',
              prompt: '基于课程大纲:\n{{llm-1.output}}\n\n请为每个章节设计:\n1. 导入活动\n2. 核心教学活动(讲授、讨论、实践等)\n3. 课堂互动形式\n4. 作业和练习',
              temperature: 0.7
            }
          },
          {
            id: 'llm-3',
            type: 'llm',
            label: '评估方案设计',
            position: { x: 700, y: 250 },
            data: {
              label: '评估方案设计',
              provider: 'doubao',
              model: 'doubao-pro-32k',
              prompt: '为课程设计评估方案:\n\n课程大纲:\n{{llm-1.output}}\n\n请提供:\n1. 形成性评估(课堂测验、作业)\n2. 总结性评估(期中/期末考试)\n3. 评分标准和权重\n4. 评估时间安排',
              temperature: 0.5
            }
          },
          {
            id: 'output-1',
            type: 'output',
            label: '完整课程方案',
            position: { x: 1000, y: 100 },
            data: {
              label: '完整课程方案',
              fields: [
                { name: 'outline', source: 'llm-1.output' },
                { name: 'activities', source: 'llm-2.output' },
                { name: 'assessment', source: 'llm-3.output' }
              ]
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'input-1', target: 'llm-1' },
          { id: 'e2', source: 'llm-1', target: 'llm-2' },
          { id: 'e3', source: 'llm-1', target: 'llm-3' },
          { id: 'e4', source: 'llm-2', target: 'output-1' },
          { id: 'e5', source: 'llm-3', target: 'output-1' }
        ]
      }
    }
  ]

  // 批量创建工作流模板
  for (const workflowData of builtInWorkflows) {
    const workflow = await prisma.workflow.upsert({
      where: {
        // 使用唯一的组合来查找
        id: `template-${workflowData.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`
      },
      update: {
        ...workflowData,
        authorId: systemUser.id
      },
      create: {
        id: `template-${workflowData.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
        ...workflowData,
        authorId: systemUser.id
      }
    })

    console.log(`✅ 工作流模板创建完成: ${workflow.title}`)
  }

  // 3. 创建内置工具数据
  const builtInTools = [
    {
      id: 'tool-web-search',
      name: 'Web搜索',
      description: '使用搜索引擎查找互联网上的最新信息',
      category: 'search',
      icon: '🔍',
      isBuiltIn: true,
      configSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词' },
          maxResults: { type: 'number', description: '最大结果数', default: 10 }
        },
        required: ['query']
      },
      apiConfig: {
        endpoint: '/api/tools/web-search',
        method: 'POST'
      }
    },
    {
      id: 'tool-image-gen',
      name: '图像生成',
      description: '使用AI生成图像',
      category: 'image',
      icon: '🎨',
      isBuiltIn: true,
      configSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: '图像描述' },
          size: { type: 'string', enum: ['256x256', '512x512', '1024x1024'], default: '512x512' }
        },
        required: ['prompt']
      },
      apiConfig: {
        endpoint: '/api/tools/image-gen',
        method: 'POST'
      }
    },
    {
      id: 'tool-translator',
      name: '智能翻译',
      description: '多语言翻译工具',
      category: 'text',
      icon: '🌐',
      isBuiltIn: true,
      configSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '待翻译文本' },
          from: { type: 'string', description: '源语言', default: 'auto' },
          to: { type: 'string', description: '目标语言', default: 'zh' }
        },
        required: ['text', 'to']
      },
      apiConfig: {
        endpoint: '/api/tools/translate',
        method: 'POST'
      }
    }
  ]

  for (const toolData of builtInTools) {
    const tool = await prisma.tool.upsert({
      where: { id: toolData.id },
      update: toolData,
      create: toolData
    })
    console.log(`✅ 工具创建完成: ${tool.name}`)
  }

  // 4. 创建工作项数据
  const workItems = [
    { id: 'work-item-article', name: '文章撰写', icon: '📝', category: 'text', description: '撰写各类文章、博客、文案' },
    { id: 'work-item-translate', name: '翻译', icon: '🌐', category: 'text', description: '多语言翻译' },
    { id: 'work-item-summary', name: '内容总结', icon: '📄', category: 'text', description: '提取文本核心要点' },
    { id: 'work-item-code', name: '代码生成', icon: '💻', category: 'code', description: '生成和优化代码' },
    { id: 'work-item-image', name: '图像生成', icon: '🎨', category: 'image', description: 'AI绘图和图像处理' },
    { id: 'work-item-data', name: '数据分析', icon: '📊', category: 'data', description: '数据分析和可视化' },
    { id: 'work-item-plan', name: '方案策划', icon: '📋', category: 'planning', description: '制定各类方案和计划' },
    { id: 'work-item-learn', name: '学习辅导', icon: '🎓', category: 'education', description: '学习资料和辅导' }
  ]

  for (const item of workItems) {
    const workItem = await prisma.workItem.upsert({
      where: { id: item.id },
      update: item,
      create: item
    })
    console.log(`✅ 工作项创建完成: ${workItem.name}`)
  }

  // 5. 创建模型定价数据
  const modelPricings = [
    {
      provider: 'doubao',
      modelId: 'doubao-pro-4k',
      modelName: '豆包 Pro 4K',
      description: '高性价比的通用模型',
      inputPrice: 5,
      outputPrice: 10,
      category: 'text',
      maxTokens: 4096,
      features: { streaming: true, functionCalling: false },
      isActive: true,
      allowedTiers: 'free,pro,enterprise',
      sortOrder: 1
    },
    {
      provider: 'doubao',
      modelId: 'doubao-pro-32k',
      modelName: '豆包 Pro 32K',
      description: '长文本处理模型',
      inputPrice: 8,
      outputPrice: 16,
      category: 'text',
      maxTokens: 32768,
      features: { streaming: true, functionCalling: true },
      isActive: true,
      allowedTiers: 'pro,enterprise',
      sortOrder: 2
    },
    {
      provider: 'doubao',
      modelId: 'doubao-pro-128k',
      modelName: '豆包 Pro 128K',
      description: '超长文本处理模型',
      inputPrice: 15,
      outputPrice: 30,
      category: 'text',
      maxTokens: 131072,
      features: { streaming: true, functionCalling: true },
      isActive: true,
      allowedTiers: 'enterprise',
      sortOrder: 3
    },
    {
      provider: 'openai',
      modelId: 'gpt-4o',
      modelName: 'GPT-4o',
      description: 'OpenAI最新多模态模型',
      inputPrice: 50,
      outputPrice: 100,
      category: 'text',
      maxTokens: 128000,
      features: { streaming: true, functionCalling: true, vision: true },
      isActive: true,
      allowedTiers: 'pro,enterprise',
      sortOrder: 10
    },
    {
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      modelName: 'Claude 3.5 Sonnet',
      description: 'Anthropic最强推理模型',
      inputPrice: 60,
      outputPrice: 120,
      category: 'text',
      maxTokens: 200000,
      features: { streaming: true, functionCalling: true, vision: true },
      isActive: true,
      allowedTiers: 'pro,enterprise',
      sortOrder: 11
    }
  ]

  for (const pricing of modelPricings) {
    const modelPricing = await prisma.modelPricing.upsert({
      where: {
        provider_modelId: {
          provider: pricing.provider,
          modelId: pricing.modelId
        }
      },
      update: pricing,
      create: pricing
    })
    console.log(`✅ 模型定价创建完成: ${modelPricing.modelName}`)
  }

  // 6. 创建定价配置
  const pricingConfig = await prisma.pricingConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      currentTier: 'early_bird',
      earlyBirdPrice: 199,
      growthPrice: 349,
      standardPrice: 499,
      earlyBirdLimit: 500,
      earlyBirdSold: 0,
      renewalDiscount: 0.7,
      renewalWindowDays: 30,
      growthStartAt: new Date('2026-09-01T00:00:00Z'),
      standardStartAt: new Date('2027-03-01T00:00:00Z'),
    }
  })
  console.log(`✅ 定价配置创建完成: ${pricingConfig.currentTier}`)

  console.log('🎉 种子数据创建完成!')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
