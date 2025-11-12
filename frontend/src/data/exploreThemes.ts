export interface ExploreThemeSubcategory {
  id: string
  name: string
  count: number
  icon: string
}

export interface ExploreThemeWorkflow {
  id: string
  name: string
  description: string
  count: number
  icon: string
  color: string
  tags: string[]
}

export interface ExploreThemeInsight {
  title: string
  value: string
  description: string
}

export interface ExploreTheme {
  id: string
  name: string
  icon: string
  color: string
  description: string
  summary: string
  downloads: number
  rating: number
  subcategories: ExploreThemeSubcategory[]
  workflows: ExploreThemeWorkflow[]
  insights: ExploreThemeInsight[]
}

export const exploreThemes: ExploreTheme[] = [
  {
    id: 'content-writing',
    name: '文案撰写',
    icon: '',
    color: '#8b5cf6',
    description: '针对不同平台的文案创作解决方案',
    summary: '覆盖公众号、小红书、抖音等主流平台的文案创作工具，让每个平台都有最适合的表达方式。',
    downloads: 15600,
    rating: 4.8,
    subcategories: [
      { id: 'wechat-writing', name: '公众号文案', count: 45, icon: '' },
      { id: 'xiaohongshu-writing', name: '小红书文案', count: 38, icon: '' },
      { id: 'douyin-writing', name: '抖音文案', count: 42, icon: '' },
      { id: 'weibo-writing', name: '微博文案', count: 35, icon: '' }
    ],
    workflows: [
      {
        id: 'wechat-article',
        name: '公众号深度文章',
        description: '生成3000-5000字的深度长文，包含标题、开头、正文结构和结尾引导。',
        count: 12,
        icon: '',
        color: '#07c160',
        tags: ['长文写作', 'SEO优化', '阅读体验']
      },
      {
        id: 'xiaohongshu-post',
        name: '小红书种草笔记',
        description: '生成800-1500字的种草内容，配emoji排版和话题标签推荐。',
        count: 15,
        icon: '',
        color: '#ff2442',
        tags: ['种草笔记', '话题推荐', 'emoji排版']
      },
      {
        id: 'douyin-script',
        name: '抖音短视频脚本',
        description: '创作15-60秒的视频脚本，包含分镜、台词和配乐建议。',
        count: 18,
        icon: '',
        color: '#000000',
        tags: ['短视频脚本', '分镜设计', '爆款公式']
      },
      {
        id: 'weibo-post',
        name: '微博热搜文案',
        description: '生成140字精炼文案，配合话题标签和发布时机建议。',
        count: 10,
        icon: '',
        color: '#e6162d',
        tags: ['热点追踪', '话题标签', '发布时机']
      }
    ],
    insights: [
      { title: '平均阅读完成率', value: '78%', description: '使用工具生成的文案平均阅读完成率' },
      { title: '互动率提升', value: '2.4x', description: '相比手工文案的互动数据提升' },
      { title: '创作时间节省', value: '65%', description: '从构思到完成的平均时间节省' }
    ]
  },
  {
    id: 'video-production',
    name: '视频制作',
    icon: '',
    color: '#ef4444',
    description: '针对不同平台的视频创作解决方案',
    summary: '覆盖抖音、快手、B站、视频号等平台的视频制作工具，从脚本到成片一站式搞定。',
    downloads: 23400,
    rating: 4.9,
    subcategories: [
      { id: 'douyin-video', name: '抖音短视频', count: 48, icon: '' },
      { id: 'kuaishou-video', name: '快手短视频', count: 35, icon: '' },
      { id: 'bilibili-video', name: 'B站长视频', count: 42, icon: '' },
      { id: 'wechat-channel', name: '视频号', count: 38, icon: '' }
    ],
    workflows: [
      {
        id: 'douyin-short-video',
        name: '抖音爆款短视频',
        description: '生成15-60秒爆款脚本，包含开头hook、内容节奏和结尾引导。',
        count: 16,
        icon: '',
        color: '#000000',
        tags: ['爆款公式', '节奏把控', '用户留存']
      },
      {
        id: 'kuaishou-video-script',
        name: '快手老铁视频',
        description: '针对快手用户特点，生成接地气的视频脚本和互动话术。',
        count: 12,
        icon: '',
        color: '#ff6600',
        tags: ['老铁经济', '接地气', '强互动']
      },
      {
        id: 'bilibili-long-video',
        name: 'B站知识视频',
        description: '创作5-20分钟的知识类视频大纲，包含章节划分和知识点提炼。',
        count: 14,
        icon: '',
        color: '#00a1d6',
        tags: ['知识分享', '系列内容', '弹幕互动']
      },
      {
        id: 'wechat-channel-video',
        name: '视频号竖屏内容',
        description: '生成1-3分钟的竖屏视频方案，适配微信生态的传播特点。',
        count: 11,
        icon: '',
        color: '#07c160',
        tags: ['竖屏优化', '社交传播', '私域引流']
      }
    ],
    insights: [
      { title: '完播率提升', value: '2.8x', description: '使用脚本工具后的平均完播率提升' },
      { title: '互动率', value: '12.5%', description: '视频平均点赞、评论、转发率' },
      { title: '制作效率', value: '+73%', description: '从脚本到成片的时间效率提升' }
    ]
  },
  {
    id: 'data-analysis',
    name: '数据分析',
    icon: '',
    color: '#3b82f6',
    description: '针对不同业务场景的数据分析解决方案',
    summary: '覆盖电商、用户行为、营销效果、竞品分析等场景的数据分析工具，让数据说话。',
    downloads: 18900,
    rating: 4.7,
    subcategories: [
      { id: 'ecommerce-data', name: '电商数据分析', count: 42, icon: '' },
      { id: 'user-behavior', name: '用户行为分析', count: 38, icon: '' },
      { id: 'marketing-effect', name: '营销效果分析', count: 35, icon: '' },
      { id: 'competitor-analysis', name: '竞品分析', count: 31, icon: '' }
    ],
    workflows: [
      {
        id: 'ecommerce-dashboard',
        name: '电商数据看板',
        description: '自动生成GMV、转化率、客单价等核心指标分析报告和优化建议。',
        count: 15,
        icon: '',
        color: '#ec4899',
        tags: ['销售分析', '转化优化', '用户画像']
      },
      {
        id: 'user-funnel-analysis',
        name: '用户漏斗分析',
        description: '追踪用户从注册到付费的完整路径，找出流失环节和优化点。',
        count: 13,
        icon: '',
        color: '#8b5cf6',
        tags: ['转化漏斗', '流失分析', '留存提升']
      },
      {
        id: 'marketing-roi',
        name: '营销ROI分析',
        description: '统计各渠道投放数据，计算ROI并给出预算分配建议。',
        count: 12,
        icon: '',
        color: '#f59e0b',
        tags: ['渠道对比', 'ROI计算', '预算优化']
      },
      {
        id: 'competitor-monitor',
        name: '竞品监控分析',
        description: '持续追踪竞品动态、价格策略、营销活动，生成对标报告。',
        count: 11,
        icon: '',
        color: '#10b981',
        tags: ['竞品追踪', '价格对比', '策略洞察']
      }
    ],
    insights: [
      { title: '决策效率', value: '+68%', description: '数据驱动决策相比经验决策的效率提升' },
      { title: 'ROI提升', value: '2.3x', description: '通过数据优化后的平均投放ROI提升' },
      { title: '分析时间', value: '-75%', description: '自动化分析相比人工的时间节省' }
    ]
  },
  {
    id: 'customer-service',
    name: '客户服务',
    icon: '',
    color: '#10b981',
    description: '针对不同沟通渠道的客服解决方案',
    summary: '覆盖在线客服、电话客服、邮件客服、社群客服等场景的智能服务工具，提升满意度降低成本。',
    downloads: 12700,
    rating: 4.6,
    subcategories: [
      { id: 'online-chat', name: '在线客服', count: 52, icon: '' },
      { id: 'phone-service', name: '电话客服', count: 38, icon: '' },
      { id: 'email-support', name: '邮件客服', count: 42, icon: '' },
      { id: 'community-service', name: '社群客服', count: 35, icon: '' }
    ],
    workflows: [
      {
        id: 'online-chat-bot',
        name: '在线智能客服',
        description: '7x24小时自动回复常见问题，无缝转接人工客服，降低人力成本。',
        count: 18,
        icon: '',
        color: '#10b981',
        tags: ['智能问答', '自动转接', '多轮对话']
      },
      {
        id: 'phone-script',
        name: '电话客服话术',
        description: '生成标准化通话脚本，包含开场白、解决方案、异议处理和结束语。',
        count: 14,
        icon: '',
        color: '#0ea5e9',
        tags: ['话术模板', '异议处理', '质检标准']
      },
      {
        id: 'email-template',
        name: '邮件服务模板',
        description: '针对售前咨询、售后投诉、退换货等场景生成专业邮件模板。',
        count: 12,
        icon: '',
        color: '#8b5cf6',
        tags: ['模板库', '场景化', '专业表达']
      },
      {
        id: 'community-management',
        name: '社群服务管理',
        description: '微信群、QQ群的自动应答、活跃度管理和用户分层运营方案。',
        count: 15,
        icon: '',
        color: '#22c55e',
        tags: ['群管理', '活跃度', '用户分层']
      }
    ],
    insights: [
      { title: '响应速度', value: '< 3秒', description: '智能客服的平均首次响应时间' },
      { title: '问题解决率', value: '87%', description: '无需转人工即可解决的问题占比' },
      { title: '满意度提升', value: '+32%', description: '使用智能客服后的客户满意度提升' }
    ]
  },
  {
    id: 'design-creation',
    name: '设计创作',
    icon: '',
    color: '#ec4899',
    description: '针对不同设计需求的创作解决方案',
    summary: '覆盖海报、LOGO、UI界面、PPT等设计场景的AI辅助工具，让设计更高效。',
    downloads: 21300,
    rating: 4.8,
    subcategories: [
      { id: 'poster-design', name: '海报设计', count: 45, icon: '' },
      { id: 'logo-creation', name: 'LOGO设计', count: 38, icon: '' },
      { id: 'ui-design', name: 'UI设计', count: 42, icon: '' },
      { id: 'ppt-creation', name: 'PPT制作', count: 48, icon: '' }
    ],
    workflows: [
      {
        id: 'marketing-poster',
        name: '营销海报生成',
        description: '根据活动主题和品牌调性，生成多套营销海报方案和文案建议。',
        count: 16,
        icon: '',
        color: '#ec4899',
        tags: ['营销海报', '品牌调性', '文案配图']
      },
      {
        id: 'brand-logo',
        name: '品牌LOGO创作',
        description: '输入品牌理念和行业特点，生成多款LOGO设计方案和使用规范。',
        count: 13,
        icon: '',
        color: '#f97316',
        tags: ['品牌识别', '多方案', '使用规范']
      },
      {
        id: 'ui-prototype',
        name: 'UI界面原型',
        description: '快速生成APP或网站的UI原型，包含布局、配色和交互说明。',
        count: 14,
        icon: '',
        color: '#8b5cf6',
        tags: ['原型设计', '交互说明', '组件库']
      },
      {
        id: 'business-ppt',
        name: '商业PPT制作',
        description: '根据内容大纲自动生成专业PPT，包含排版、配色和图表建议。',
        count: 17,
        icon: '',
        color: '#3b82f6',
        tags: ['自动排版', '图表美化', '模板库']
      }
    ],
    insights: [
      { title: '设计效率', value: '+5.2x', description: 'AI辅助相比传统设计的效率提升' },
      { title: '方案数量', value: '平均8套', description: '每次需求可生成的设计方案数量' },
      { title: '客户满意度', value: '4.6/5', description: 'AI生成设计的平均客户评分' }
    ]
  },
  {
    id: 'ecommerce-operation',
    name: '电商运营',
    icon: '',
    color: '#f59e0b',
    description: '针对不同电商场景的运营解决方案',
    summary: '覆盖淘宝、京东、拼多多、抖音小店等平台的运营工具,从选品到售后全链路支持。',
    downloads: 19200,
    rating: 4.7,
    subcategories: [
      { id: 'taobao-operation', name: '淘宝运营', count: 48, icon: '' },
      { id: 'jd-operation', name: '京东运营', count: 42, icon: '' },
      { id: 'pdd-operation', name: '拼多多运营', count: 38, icon: '' },
      { id: 'douyin-shop', name: '抖音小店', count: 45, icon: '' }
    ],
    workflows: [
      {
        id: 'product-selection',
        name: '爆款选品分析',
        description: '通过数据分析选出潜力爆款,包含市场趋势、竞品对比和利润测算。',
        count: 14,
        icon: '',
        color: '#f59e0b',
        tags: ['选品分析', '市场趋势', '利润测算']
      },
      {
        id: 'product-detail-optimization',
        name: '商品详情页优化',
        description: '优化商品标题、主图、详情页,提升转化率和搜索排名。',
        count: 16,
        icon: '',
        color: '#fb923c',
        tags: ['详情优化', '转化提升', 'SEO优化']
      },
      {
        id: 'customer-service-template',
        name: '客服话术模板',
        description: '针对售前咨询、议价、催付、售后等场景生成标准化话术。',
        count: 12,
        icon: '',
        color: '#fdba74',
        tags: ['客服话术', '标准化', '转化技巧']
      },
      {
        id: 'promotion-activity',
        name: '促销活动策划',
        description: '设计限时折扣、满减优惠、拼团活动等促销方案及文案。',
        count: 13,
        icon: '',
        color: '#fcd34d',
        tags: ['促销策划', '活动文案', '转化优化']
      }
    ],
    insights: [
      { title: '转化率提升', value: '+45%', description: '使用运营工具后的平均转化率提升' },
      { title: 'ROI', value: '3.2x', description: '平均广告投放回报率' },
      { title: '运营效率', value: '+58%', description: '日常运营工作效率提升' }
    ]
  },
  {
    id: 'knowledge-learning',
    name: '知识学习',
    icon: '',
    color: '#06b6d4',
    description: '针对不同学习场景的辅助工具',
    summary: '覆盖考试备考、技能学习、知识整理、论文写作等场景,让学习更高效。',
    downloads: 14800,
    rating: 4.8,
    subcategories: [
      { id: 'exam-preparation', name: '考试备考', count: 52, icon: '' },
      { id: 'skill-learning', name: '技能学习', count: 45, icon: '' },
      { id: 'note-organization', name: '笔记整理', count: 38, icon: '' },
      { id: 'paper-writing', name: '论文写作', count: 42, icon: '' }
    ],
    workflows: [
      {
        id: 'study-plan',
        name: '智能学习计划',
        description: '根据目标和时间生成个性化学习计划,包含每日任务和复习节奏。',
        count: 15,
        icon: '',
        color: '#06b6d4',
        tags: ['学习规划', '时间管理', '进度追踪']
      },
      {
        id: 'knowledge-summary',
        name: '知识点总结',
        description: '将长篇内容提炼为结构化知识点,生成思维导图和记忆卡片。',
        count: 17,
        icon: '',
        color: '#22d3ee',
        tags: ['知识提炼', '思维导图', '记忆卡片']
      },
      {
        id: 'practice-question',
        name: '练习题生成',
        description: '根据知识点自动生成选择题、填空题、简答题等多种题型。',
        count: 14,
        icon: '',
        color: '#67e8f9',
        tags: ['题目生成', '自测练习', '难度分级']
      },
      {
        id: 'paper-outline',
        name: '论文大纲生成',
        description: '根据研究主题生成论文框架,包含章节划分和要点提示。',
        count: 12,
        icon: '',
        color: '#a5f3fc',
        tags: ['论文框架', '文献引用', '逻辑梳理']
      }
    ],
    insights: [
      { title: '学习效率', value: '+72%', description: '使用工具后的学习效率提升' },
      { title: '知识留存率', value: '85%', description: '通过结构化学习的知识留存率' },
      { title: '时间节省', value: '60%', description: '整理笔记和复习资料的时间节省' }
    ]
  },
  {
    id: 'business-management',
    name: '企业管理',
    icon: '',
    color: '#8b5cf6',
    description: '针对不同管理场景的效率工具',
    summary: '覆盖项目管理、团队协作、财务报表、人事管理等场景,提升企业运营效率。',
    downloads: 16500,
    rating: 4.6,
    subcategories: [
      { id: 'project-management', name: '项目管理', count: 45, icon: '' },
      { id: 'team-collaboration', name: '团队协作', count: 42, icon: '' },
      { id: 'financial-report', name: '财务报表', count: 38, icon: '' },
      { id: 'hr-management', name: '人事管理', count: 35, icon: '' }
    ],
    workflows: [
      {
        id: 'project-plan',
        name: '项目计划生成',
        description: '根据项目目标生成详细计划,包含里程碑、任务分解和资源分配。',
        count: 16,
        icon: '',
        color: '#8b5cf6',
        tags: ['项目规划', '任务分解', '进度管理']
      },
      {
        id: 'meeting-minutes',
        name: '会议纪要整理',
        description: '将会议录音或记录整理为结构化纪要,提取待办事项和决策结果。',
        count: 18,
        icon: '',
        color: '#a78bfa',
        tags: ['会议记录', '待办提取', '决策跟踪']
      },
      {
        id: 'financial-analysis',
        name: '财务数据分析',
        description: '自动生成月度、季度、年度财务报表,包含趋势分析和异常预警。',
        count: 13,
        icon: '',
        color: '#c4b5fd',
        tags: ['财务报表', '趋势分析', '异常预警']
      },
      {
        id: 'recruitment-jd',
        name: '招聘JD生成',
        description: '根据岗位需求生成专业的职位描述,包含职责、要求和福利待遇。',
        count: 11,
        icon: '',
        color: '#ddd6fe',
        tags: ['招聘文案', '岗位描述', '人才画像']
      }
    ],
    insights: [
      { title: '管理效率', value: '+55%', description: '使用管理工具后的工作效率提升' },
      { title: '沟通成本', value: '-48%', description: '团队沟通和协作成本降低' },
      { title: '决策速度', value: '2.5x', description: '基于数据的决策速度提升' }
    ]
  }
]

export const exploreThemeMap: Record<string, ExploreTheme> = Object.fromEntries(
  exploreThemes.map((theme) => [theme.id, theme])
)
