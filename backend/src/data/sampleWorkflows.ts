/**
 * 新用户示例工作流数据
 * 注册时自动创建，让用户看到 AI 工作方法库有内容可参考
 */

export interface SampleWorkflow {
  title: string
  description: string
  category: string
  tags: string
  config: {
    nodes: Array<{
      id: string
      type: string
      label: string
      position: { x: number; y: number }
      data: Record<string, any>
    }>
    edges: Array<{
      id: string
      source: string
      target: string
    }>
  }
}

export const sampleWorkflows: SampleWorkflow[] = [
  // ==================== 自媒体创业 ====================
  {
    title: '📱 小红书爆款笔记生成器',
    description: '输入产品或主题，自动生成小红书风格的种草笔记，包含标题、正文、标签和封面建议',
    category: '自媒体',
    tags: '小红书,种草,自媒体,内容创作',
    config: {
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          label: '笔记主题',
          position: { x: 100, y: 100 },
          data: {
            label: '笔记主题',
            description: '输入你想写的小红书笔记主题',
            fields: [
              { name: 'topic', label: '产品/主题', type: 'text', required: true },
              { name: 'targetAudience', label: '目标人群', type: 'text', required: false },
              { name: 'style', label: '笔记风格', type: 'select', options: ['种草测评', '经验分享', '教程攻略', '好物推荐'], required: true }
            ]
          }
        },
        {
          id: 'llm-1',
          type: 'llm',
          label: '生成爆款标题',
          position: { x: 400, y: 50 },
          data: {
            label: '生成爆款标题',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '你是小红书爆款标题专家。请为"{{topic}}"生成5个小红书风格标题，要求：\n1. 使用emoji表情\n2. 包含数字或对比\n3. 制造好奇心或FOMO\n4. 风格：{{style}}\n5. 目标人群：{{targetAudience}}',
            temperature: 0.8
          }
        },
        {
          id: 'llm-2',
          type: 'llm',
          label: '撰写笔记正文',
          position: { x: 400, y: 200 },
          data: {
            label: '撰写笔记正文',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '根据标题方向：\n{{llm-1.output}}\n\n请撰写一篇小红书笔记正文，要求：\n1. 800字以内\n2. 分段清晰，多用emoji\n3. 口语化表达，像朋友聊天\n4. 包含个人体验感受\n5. 结尾引导互动（点赞收藏关注）\n6. 附上15-20个相关标签',
            temperature: 0.8,
            maxTokens: 2000
          }
        },
        {
          id: 'output-1',
          type: 'output',
          label: '完整笔记',
          position: { x: 700, y: 100 },
          data: {
            label: '完整笔记',
            fields: [
              { name: 'titles', source: 'llm-1.output' },
              { name: 'content', source: 'llm-2.output' }
            ]
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'input-1', target: 'llm-1' },
        { id: 'e2', source: 'input-1', target: 'llm-2' },
        { id: 'e3', source: 'llm-1', target: 'llm-2' },
        { id: 'e4', source: 'llm-2', target: 'output-1' }
      ]
    }
  },
  {
    title: '🎬 短视频脚本创作助手',
    description: '快速生成抖音/视频号短视频脚本，包含分镜、台词、BGM建议和拍摄指导',
    category: '自媒体',
    tags: '抖音,短视频,脚本,视频号',
    config: {
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          label: '视频主题',
          position: { x: 100, y: 100 },
          data: {
            label: '视频主题',
            fields: [
              { name: 'topic', label: '视频主题', type: 'text', required: true },
              { name: 'duration', label: '时长', type: 'select', options: ['15秒', '30秒', '60秒', '3分钟'], required: true },
              { name: 'platform', label: '发布平台', type: 'select', options: ['抖音', '视频号', 'B站', '小红书'], required: true }
            ]
          }
        },
        {
          id: 'llm-1',
          type: 'llm',
          label: '创意构思',
          position: { x: 400, y: 100 },
          data: {
            label: '创意构思',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '你是短视频创意导演。为"{{topic}}"构思一个{{duration}}的{{platform}}短视频：\n\n1. 开场hook（前3秒吸引注意力）\n2. 核心创意点\n3. 情绪节奏（起承转合）\n4. 结尾引导（关注/评论/转发）',
            temperature: 0.9
          }
        },
        {
          id: 'llm-2',
          type: 'llm',
          label: '生成分镜脚本',
          position: { x: 700, y: 100 },
          data: {
            label: '生成分镜脚本',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '基于创意：\n{{llm-1.output}}\n\n生成详细分镜脚本，每个镜头包含：\n- 时间：xx秒-xx秒\n- 画面描述\n- 台词/旁白\n- 拍摄手法（特写/全景/跟拍等）\n- BGM节奏建议\n- 字幕/贴纸建议',
            temperature: 0.7,
            maxTokens: 3000
          }
        },
        {
          id: 'output-1',
          type: 'output',
          label: '完整脚本',
          position: { x: 1000, y: 100 },
          data: {
            label: '完整脚本',
            fields: [
              { name: 'concept', source: 'llm-1.output' },
              { name: 'script', source: 'llm-2.output' }
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
    title: '✍️ 公众号长文写作工作流',
    description: '从选题到成稿的完整公众号文章创作流程，自动生成大纲、正文和排版建议',
    category: '自媒体',
    tags: '公众号,写作,长文,自媒体运营',
    config: {
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          label: '文章选题',
          position: { x: 100, y: 100 },
          data: {
            label: '文章选题',
            fields: [
              { name: 'topic', label: '文章主题', type: 'text', required: true },
              { name: 'angle', label: '切入角度', type: 'text', required: false },
              { name: 'wordCount', label: '目标字数', type: 'number', required: false, defaultValue: 2000 },
              { name: 'tone', label: '文风', type: 'select', options: ['专业严谨', '轻松幽默', '故事叙事', '干货分享'], required: true }
            ]
          }
        },
        {
          id: 'llm-1',
          type: 'llm',
          label: '生成文章大纲',
          position: { x: 400, y: 50 },
          data: {
            label: '生成文章大纲',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '你是资深公众号主编。为"{{topic}}"生成一篇{{wordCount}}字文章的大纲：\n\n文风：{{tone}}\n切入角度：{{angle}}\n\n要求：\n1. 标题要有吸引力（提供3个备选）\n2. 开头要有钩子\n3. 正文分3-5个小节\n4. 每节有明确的要点\n5. 结尾要有行动呼吁',
            temperature: 0.7
          }
        },
        {
          id: 'llm-2',
          type: 'llm',
          label: '撰写完整文章',
          position: { x: 400, y: 200 },
          data: {
            label: '撰写完整文章',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '根据大纲撰写完整的公众号文章：\n\n{{llm-1.output}}\n\n要求：\n1. 总字数约{{wordCount}}字\n2. {{tone}}的文风\n3. 段落分明，适合手机阅读\n4. 适当使用金句和案例\n5. 关键观点加粗标记',
            temperature: 0.8,
            maxTokens: 4000
          }
        },
        {
          id: 'llm-3',
          type: 'llm',
          label: '排版和摘要建议',
          position: { x: 700, y: 100 },
          data: {
            label: '排版和摘要建议',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '为以下公众号文章提供发布建议：\n\n{{llm-2.output}}\n\n请提供：\n1. 摘要/副标题（显示在文章列表中）\n2. 封面图建议\n3. 推荐发布时间\n4. 3个适合的话题标签\n5. 朋友圈转发语',
            temperature: 0.6
          }
        },
        {
          id: 'output-1',
          type: 'output',
          label: '完整文章包',
          position: { x: 1000, y: 100 },
          data: {
            label: '完整文章包',
            fields: [
              { name: 'outline', source: 'llm-1.output' },
              { name: 'article', source: 'llm-2.output' },
              { name: 'publishGuide', source: 'llm-3.output' }
            ]
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'input-1', target: 'llm-1' },
        { id: 'e2', source: 'input-1', target: 'llm-2' },
        { id: 'e3', source: 'llm-1', target: 'llm-2' },
        { id: 'e4', source: 'llm-2', target: 'llm-3' },
        { id: 'e5', source: 'llm-3', target: 'output-1' }
      ]
    }
  },

  // ==================== 电商 ====================
  {
    title: '🛒 电商爆款商品文案生成器',
    description: '为电商商品自动生成标题、卖点提炼、详情页文案和主图文案',
    category: '电商',
    tags: '电商,文案,商品,淘宝,拼多多',
    config: {
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          label: '商品信息',
          position: { x: 100, y: 100 },
          data: {
            label: '商品信息',
            fields: [
              { name: 'productName', label: '商品名称', type: 'text', required: true },
              { name: 'productFeatures', label: '产品特点/卖点', type: 'textarea', required: true },
              { name: 'targetPrice', label: '价格区间', type: 'text', required: false },
              { name: 'platform', label: '销售平台', type: 'select', options: ['淘宝/天猫', '京东', '拼多多', '抖音小店', '小红书商城'], required: true }
            ]
          }
        },
        {
          id: 'llm-1',
          type: 'llm',
          label: '提炼核心卖点',
          position: { x: 400, y: 50 },
          data: {
            label: '提炼核心卖点',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '你是电商运营专家。分析以下商品信息，提炼核心卖点：\n\n商品：{{productName}}\n特点：{{productFeatures}}\n平台：{{platform}}\n价格：{{targetPrice}}\n\n请输出：\n1. 3个核心卖点（每个一句话）\n2. 目标用户画像\n3. 竞品差异化优势\n4. 情感触发点',
            temperature: 0.6
          }
        },
        {
          id: 'llm-2',
          type: 'llm',
          label: '生成商品标题',
          position: { x: 400, y: 200 },
          data: {
            label: '生成商品标题',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '基于卖点分析：\n{{llm-1.output}}\n\n为{{platform}}生成5个商品标题：\n1. 包含核心关键词\n2. 符合平台搜索习惯\n3. 突出卖点和差异化\n4. 字数控制在平台限制内\n5. 包含营销词（限时/爆款/新品等）',
            temperature: 0.7
          }
        },
        {
          id: 'llm-3',
          type: 'llm',
          label: '生成详情页文案',
          position: { x: 700, y: 100 },
          data: {
            label: '生成详情页文案',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '基于卖点：\n{{llm-1.output}}\n\n商品标题：\n{{llm-2.output}}\n\n生成商品详情页文案结构：\n1. 主图文案（5张主图的文案）\n2. 促销信息栏\n3. 产品亮点展示（图文并茂的描述）\n4. 使用场景描述\n5. 用户好评引导\n6. 售后保障说明',
            temperature: 0.7,
            maxTokens: 3000
          }
        },
        {
          id: 'output-1',
          type: 'output',
          label: '完整商品文案',
          position: { x: 1000, y: 100 },
          data: {
            label: '完整商品文案',
            fields: [
              { name: 'sellingPoints', source: 'llm-1.output' },
              { name: 'titles', source: 'llm-2.output' },
              { name: 'detailCopy', source: 'llm-3.output' }
            ]
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'input-1', target: 'llm-1' },
        { id: 'e2', source: 'llm-1', target: 'llm-2' },
        { id: 'e3', source: 'llm-1', target: 'llm-3' },
        { id: 'e4', source: 'llm-2', target: 'llm-3' },
        { id: 'e5', source: 'llm-3', target: 'output-1' }
      ]
    }
  },
  {
    title: '📊 电商竞品分析工作流',
    description: '输入竞品信息，自动生成竞品对比分析报告，帮助优化定价和营销策略',
    category: '电商',
    tags: '竞品分析,电商运营,市场调研,策略',
    config: {
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          label: '竞品信息',
          position: { x: 100, y: 100 },
          data: {
            label: '竞品信息',
            fields: [
              { name: 'myProduct', label: '我的产品描述', type: 'textarea', required: true },
              { name: 'competitors', label: '竞品信息（名称、价格、卖点）', type: 'textarea', required: true },
              { name: 'category', label: '所属品类', type: 'text', required: true }
            ]
          }
        },
        {
          id: 'llm-1',
          type: 'llm',
          label: '竞品对比分析',
          position: { x: 400, y: 50 },
          data: {
            label: '竞品对比分析',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '作为电商市场分析师，分析以下竞品信息：\n\n我的产品：{{myProduct}}\n竞品信息：{{competitors}}\n品类：{{category}}\n\n请输出：\n1. 竞品对比表（价格、卖点、评分、销量预估）\n2. 各竞品优劣势分析\n3. 市场定位图（高端/中端/低端）\n4. 价格带分布',
            temperature: 0.4
          }
        },
        {
          id: 'llm-2',
          type: 'llm',
          label: '策略建议',
          position: { x: 400, y: 200 },
          data: {
            label: '策略建议',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '基于竞品分析：\n{{llm-1.output}}\n\n我的产品：{{myProduct}}\n\n提供以下策略建议：\n1. 差异化定位策略\n2. 定价建议（含促销策略）\n3. 卖点提炼建议\n4. 营销渠道建议\n5. 短期（1月）和中期（3月）运营计划',
            temperature: 0.5
          }
        },
        {
          id: 'output-1',
          type: 'output',
          label: '分析报告',
          position: { x: 700, y: 100 },
          data: {
            label: '分析报告',
            fields: [
              { name: 'analysis', source: 'llm-1.output' },
              { name: 'strategy', source: 'llm-2.output' }
            ]
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'input-1', target: 'llm-1' },
        { id: 'e2', source: 'input-1', target: 'llm-2' },
        { id: 'e3', source: 'llm-1', target: 'llm-2' },
        { id: 'e4', source: 'llm-2', target: 'output-1' }
      ]
    }
  },
  {
    title: '💬 智能客服话术生成器',
    description: '针对常见客服场景，自动生成专业且有温度的回复话术和FAQ',
    category: '电商',
    tags: '客服,话术,电商,售后',
    config: {
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          label: '客服场景',
          position: { x: 100, y: 100 },
          data: {
            label: '客服场景',
            fields: [
              { name: 'productInfo', label: '商品/店铺简介', type: 'textarea', required: true },
              { name: 'scenario', label: '客服场景', type: 'select', options: ['售前咨询', '售后问题', '退换货', '催发货', '差评挽回'], required: true },
              { name: 'customerMessage', label: '客户消息（可选）', type: 'textarea', required: false }
            ]
          }
        },
        {
          id: 'llm-1',
          type: 'llm',
          label: '生成话术库',
          position: { x: 400, y: 100 },
          data: {
            label: '生成话术库',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '你是金牌电商客服培训师。\n\n店铺信息：{{productInfo}}\n场景：{{scenario}}\n客户消息：{{customerMessage}}\n\n请生成该场景下的话术库：\n1. 开场白（3种风格）\n2. 常见问题回复（5-8个Q&A）\n3. 异议处理话术（价格贵/质量担忧/犹豫不决）\n4. 促成成交话术\n5. 结束语和关怀语\n\n要求：专业但有温度，符合平台客服规范',
            temperature: 0.7,
            maxTokens: 3000
          }
        },
        {
          id: 'output-1',
          type: 'output',
          label: '话术库',
          position: { x: 700, y: 100 },
          data: {
            label: '话术库',
            fields: [
              { name: 'scripts', source: 'llm-1.output' }
            ]
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'input-1', target: 'llm-1' },
        { id: 'e2', source: 'llm-1', target: 'output-1' }
      ]
    }
  },

  // ==================== 产品开发 ====================
  {
    title: '📋 PRD需求文档生成器',
    description: '输入产品想法，自动生成标准的产品需求文档（PRD），包含用户故事、功能列表和验收标准',
    category: '产品开发',
    tags: '产品经理,PRD,需求文档,产品设计',
    config: {
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          label: '产品想法',
          position: { x: 100, y: 100 },
          data: {
            label: '产品想法',
            fields: [
              { name: 'productIdea', label: '产品/功能描述', type: 'textarea', required: true },
              { name: 'targetUsers', label: '目标用户', type: 'text', required: true },
              { name: 'problemToSolve', label: '解决什么问题', type: 'textarea', required: true },
              { name: 'scope', label: '版本范围', type: 'select', options: ['MVP最小可行产品', 'V1.0完整版', '迭代优化'], required: true }
            ]
          }
        },
        {
          id: 'llm-1',
          type: 'llm',
          label: '用户故事和功能分析',
          position: { x: 400, y: 50 },
          data: {
            label: '用户故事和功能分析',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '作为高级产品经理，分析以下产品需求：\n\n产品描述：{{productIdea}}\n目标用户：{{targetUsers}}\n核心问题：{{problemToSolve}}\n版本范围：{{scope}}\n\n请输出：\n1. 用户角色定义（2-3种）\n2. 核心用户故事（User Story格式：作为...我希望...以便于...）\n3. 功能列表（按优先级P0/P1/P2分级）\n4. 非功能性需求（性能、安全、兼容性）',
            temperature: 0.5
          }
        },
        {
          id: 'llm-2',
          type: 'llm',
          label: '生成PRD文档',
          position: { x: 400, y: 200 },
          data: {
            label: '生成PRD文档',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '基于需求分析：\n{{llm-1.output}}\n\n生成标准PRD文档，包含以下章节：\n\n1. 概述（背景、目标、指标）\n2. 用户画像\n3. 功能需求（每个功能含描述、交互说明、验收标准）\n4. 信息架构\n5. 页面流程\n6. 数据需求\n7. 里程碑计划\n8. 风险评估',
            temperature: 0.5,
            maxTokens: 4000
          }
        },
        {
          id: 'llm-3',
          type: 'llm',
          label: '技术评审要点',
          position: { x: 700, y: 200 },
          data: {
            label: '技术评审要点',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '基于PRD：\n{{llm-2.output}}\n\n从技术视角提供评审要点：\n1. 技术方案建议\n2. 技术风险和难点\n3. 工时预估（前端/后端/测试）\n4. 需要确认的技术问题\n5. 建议的技术栈',
            temperature: 0.4
          }
        },
        {
          id: 'output-1',
          type: 'output',
          label: '完整PRD',
          position: { x: 1000, y: 100 },
          data: {
            label: '完整PRD',
            fields: [
              { name: 'analysis', source: 'llm-1.output' },
              { name: 'prd', source: 'llm-2.output' },
              { name: 'techReview', source: 'llm-3.output' }
            ]
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'input-1', target: 'llm-1' },
        { id: 'e2', source: 'llm-1', target: 'llm-2' },
        { id: 'e3', source: 'llm-2', target: 'llm-3' },
        { id: 'e4', source: 'llm-2', target: 'output-1' },
        { id: 'e5', source: 'llm-3', target: 'output-1' }
      ]
    }
  },
  {
    title: '🧪 用户调研问卷设计器',
    description: '根据调研目的自动设计用户调研问卷，包含问题设计、逻辑跳转和分析框架',
    category: '产品开发',
    tags: '用户调研,问卷,产品研究,用户体验',
    config: {
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          label: '调研目标',
          position: { x: 100, y: 100 },
          data: {
            label: '调研目标',
            fields: [
              { name: 'researchGoal', label: '调研目的', type: 'textarea', required: true },
              { name: 'productContext', label: '产品/功能背景', type: 'textarea', required: true },
              { name: 'targetRespondents', label: '目标受访者', type: 'text', required: true },
              { name: 'questionnaireLength', label: '问卷长度', type: 'select', options: ['简短(5-10题)', '中等(10-20题)', '详细(20-30题)'], required: true }
            ]
          }
        },
        {
          id: 'llm-1',
          type: 'llm',
          label: '设计问卷',
          position: { x: 400, y: 100 },
          data: {
            label: '设计问卷',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '你是用户研究专家。请设计调研问卷：\n\n目的：{{researchGoal}}\n背景：{{productContext}}\n受访者：{{targetRespondents}}\n长度：{{questionnaireLength}}\n\n问卷设计要求：\n1. 问题从易到难，从一般到具体\n2. 混合题型（单选、多选、量表、开放题）\n3. 避免引导性问题\n4. 包含筛选题和验证题\n5. 注明必填/选填\n6. 提供逻辑跳转说明',
            temperature: 0.6,
            maxTokens: 3000
          }
        },
        {
          id: 'llm-2',
          type: 'llm',
          label: '分析框架',
          position: { x: 700, y: 100 },
          data: {
            label: '分析框架',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '为以下问卷设计数据分析框架：\n\n{{llm-1.output}}\n\n请提供：\n1. 关键指标定义\n2. 数据分析方法（定量+定性）\n3. 交叉分析维度\n4. 预期产出（图表类型建议）\n5. 结论输出模板',
            temperature: 0.5
          }
        },
        {
          id: 'output-1',
          type: 'output',
          label: '调研方案',
          position: { x: 1000, y: 100 },
          data: {
            label: '调研方案',
            fields: [
              { name: 'questionnaire', source: 'llm-1.output' },
              { name: 'analysisFramework', source: 'llm-2.output' }
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
    title: '🚀 产品发布上线检查清单',
    description: '产品上线前的全方位检查，自动生成测试用例、上线清单和回滚方案',
    category: '产品开发',
    tags: '产品上线,测试,质量保障,项目管理',
    config: {
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          label: '上线信息',
          position: { x: 100, y: 100 },
          data: {
            label: '上线信息',
            fields: [
              { name: 'featureDescription', label: '上线功能描述', type: 'textarea', required: true },
              { name: 'affectedModules', label: '影响的模块/页面', type: 'textarea', required: true },
              { name: 'releaseType', label: '发布类型', type: 'select', options: ['新功能上线', '功能优化', 'Bug修复', '性能优化'], required: true }
            ]
          }
        },
        {
          id: 'llm-1',
          type: 'llm',
          label: '生成测试用例',
          position: { x: 400, y: 50 },
          data: {
            label: '生成测试用例',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '为以下功能生成测试用例：\n\n功能描述：{{featureDescription}}\n影响模块：{{affectedModules}}\n发布类型：{{releaseType}}\n\n请输出：\n1. 核心功能测试用例（正常流程）\n2. 边界条件测试\n3. 异常场景测试\n4. 兼容性测试要点\n5. 性能测试要点\n\n格式：编号 | 测试项 | 步骤 | 预期结果 | 优先级',
            temperature: 0.4,
            maxTokens: 3000
          }
        },
        {
          id: 'llm-2',
          type: 'llm',
          label: '上线检查清单',
          position: { x: 400, y: 200 },
          data: {
            label: '上线检查清单',
            provider: 'qwen',
            model: 'qwen-plus',
            prompt: '基于功能信息：\n功能：{{featureDescription}}\n模块：{{affectedModules}}\n\n生成上线检查清单：\n\n【上线前】\n- 代码审查\n- 数据库变更\n- 配置变更\n- 灰度策略\n\n【上线中】\n- 部署步骤\n- 验证项目\n- 监控指标\n\n【上线后】\n- 线上验证\n- 数据观察\n- 用户反馈\n\n【回滚方案】\n- 回滚条件\n- 回滚步骤\n- 回滚验证',
            temperature: 0.3
          }
        },
        {
          id: 'output-1',
          type: 'output',
          label: '上线方案',
          position: { x: 700, y: 100 },
          data: {
            label: '上线方案',
            fields: [
              { name: 'testCases', source: 'llm-1.output' },
              { name: 'checklist', source: 'llm-2.output' }
            ]
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'input-1', target: 'llm-1' },
        { id: 'e2', source: 'input-1', target: 'llm-2' },
        { id: 'e3', source: 'llm-1', target: 'output-1' },
        { id: 'e4', source: 'llm-2', target: 'output-1' }
      ]
    }
  }
]
