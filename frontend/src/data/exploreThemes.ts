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
  subcategories: ExploreThemeSubcategory[]
  workflows: ExploreThemeWorkflow[]
  insights: ExploreThemeInsight[]
}

export const exploreThemes: ExploreTheme[] = [
  {
    id: 'self-media',
    name: '自媒体运营',
    icon: '',
    color: '#8b5cf6',
    description: '内容创作、视频制作、运营技巧',
    summary: '帮助内容创作者快速搭建选题策划、脚本撰写、发布分析的一站式工作流。',
    subcategories: [
      { id: 'self-media-hot-article', name: '文章写作', count: 45, icon: '' },
      { id: 'self-media-short-video', name: '视频制作', count: 38, icon: '' },
      { id: 'self-media-graphic-suite', name: '图片设计', count: 52, icon: '' },
      { id: 'self-media-ops-calendar', name: '运营技巧', count: 29, icon: '' }
    ],
    workflows: [
      {
        id: 'self-media-hot-article',
        name: '热点文章创作工坊',
        description: '结合热点话题和账号定位，智能生成公众号、百家号等平台的高互动文章。',
        count: 12,
        icon: '',
        color: '#8b5cf6',
        tags: ['热点追踪', '多平台输出', '排版优化']
      },
      {
        id: 'self-media-short-video',
        name: '短视频脚本工作室',
        description: '为抖音、快手、小红书等平台提供分镜脚本、镜头说明和文案提示。',
        count: 10,
        icon: '',
        color: '#ef4444',
        tags: ['分镜脚本', '多平台适配', '互动设计']
      },
      {
        id: 'self-media-graphic-suite',
        name: '图文排版助手',
        description: '自动生成封面、视觉模板、内容排版建议，提升图文内容呈现效果。',
        count: 9,
        icon: '',
        color: '#10b981',
        tags: ['视觉模板', '封面设计', '品牌统一']
      },
      {
        id: 'self-media-ops-calendar',
        name: '运营活动策划台',
        description: '按周生成选题日历、数据复盘模板和粉丝增长动作清单。',
        count: 14,
        icon: '',
        color: '#f59e0b',
        tags: ['节奏管理', '数据复盘', '增长策划']
      }
    ],
    insights: [
      { title: '周更效率', value: '87%', description: '主题自动拆解后，创作输出的准时率' },
      { title: '涨粉贡献', value: '12.6k', description: '近30天利用运营活动新增粉丝数' },
      { title: '互动提升', value: '2.3x', description: '视频脚本模板带来的平均互动增幅' }
    ]
  },
  {
    id: 'solo-business',
    name: '一人公司',
    icon: '',
    color: '#10b981',
    description: '独立创业、产品开发、商业运营',
    summary: '聚焦小团队或个人创业者的产品打造、增长实操与商业闭环。',
    subcategories: [
      { id: 'solo-product-roadmap', name: '产品开发', count: 34, icon: '' },
      { id: 'solo-launch-kit', name: '市场营销', count: 41, icon: '' },
      { id: 'solo-finance-dashboard', name: '财务管理', count: 22, icon: '' },
      { id: 'solo-automation-suite', name: '流程自动化', count: 56, icon: '' }
    ],
    workflows: [
      {
        id: 'solo-product-roadmap',
        name: '产品路线图规划器',
        description: '根据目标用户痛点生成季度产品路线图与迭代优先级。',
        count: 8,
        icon: '',
        color: '#10b981',
        tags: ['需求分析', '版本规划', '用户反馈']
      },
      {
        id: 'solo-launch-kit',
        name: '冷启动营销套件',
        description: '打包启动邮件、社媒计划、着陆页文案与首批渠道打法。',
        count: 11,
        icon: '',
        color: '#f97316',
        tags: ['冷启动', '渠道组合', '内容脚本']
      },
      {
        id: 'solo-finance-dashboard',
        name: '订阅收入仪表盘',
        description: '实时监控MRR、流失率、现金流并生成风险提示和建议。',
        count: 6,
        icon: '',
        color: '#6366f1',
        tags: ['财务健康', '增长预测', '预算管理']
      },
      {
        id: 'solo-automation-suite',
        name: '自动化交付助手',
        description: '串联AI文档、邮件、客服、开票等流程，构建无人值守作业流。',
        count: 15,
        icon: '',
        color: '#0ea5e9',
        tags: ['工作流编排', '触发自动化', '客户体验']
      }
    ],
    insights: [
      { title: '产品上线周期', value: '14 天', description: '从迭代规划到首版上线的平均时间' },
      { title: '自动化覆盖', value: '68%', description: '日常运营中已被自动化处理的环节比例' },
      { title: '收入增长', value: '31%', description: '近90天订阅收入的平均环比提升' }
    ]
  },
  {
    id: 'work-efficiency',
    name: '工作效率提升',
    icon: '',
    color: '#f59e0b',
    description: '时间管理、任务协作、知识管理',
    summary: '针对团队协同与个人效率的全流程优化工具集。',
    subcategories: [
      { id: 'efficiency-personal-coach', name: '时间管理', count: 28, icon: '' },
      { id: 'efficiency-okr-tracker', name: '任务协同', count: 35, icon: '' },
      { id: 'efficiency-knowledge-hub', name: '知识管理', count: 31, icon: '' },
      { id: 'efficiency-meeting-notes', name: '会议协作', count: 19, icon: '' }
    ],
    workflows: [
      {
        id: 'efficiency-okr-tracker',
        name: 'OKR 进度驾驶舱',
        description: '整合团队目标、关键结果和执行进展，生成可视化看板与提醒。',
        count: 9,
        icon: '',
        color: '#f97316',
        tags: ['目标管理', '周报同步', '提醒推送']
      },
      {
        id: 'efficiency-meeting-notes',
        name: '智能会议纪要',
        description: '会议录音自动转写、提炼行动项并同步到任务系统。',
        count: 12,
        icon: '',
        color: '#10b981',
        tags: ['语音转写', '行动闭环', '任务分派']
      },
      {
        id: 'efficiency-knowledge-hub',
        name: '知识库构建器',
        description: '整理零散文档、项目经验，生成结构化知识图谱和搜索入口。',
        count: 10,
        icon: '',
        color: '#3b82f6',
        tags: ['知识沉淀', '检索增强', '协作文档']
      },
      {
        id: 'efficiency-personal-coach',
        name: '个人效率教练',
        description: '根据工作习惯输出时间分配建议、番茄计划与复盘报告。',
        count: 7,
        icon: '',
        color: '#facc15',
        tags: ['时间盒子', '习惯养成', '效率复盘']
      }
    ],
    insights: [
      { title: '会议缩短', value: '36%', description: '启用纪要助手后会议平均时长缩短' },
      { title: '任务准时率', value: '92%', description: '同步OKR提醒后按时完成任务的占比' },
      { title: '知识复用', value: '4.1x', description: '共享知识库带来的方案复用倍数' }
    ]
  },
  {
    id: 'data-analysis',
    name: '数据分析',
    icon: '',
    color: '#3b82f6',
    description: '数据处理、可视化、商业洞察',
    summary: '面向产品运营与商业决策的智能数据助手集。',
    subcategories: [
      { id: 'data-dashboard-builder', name: '数据可视化', count: 42, icon: '' },
      { id: 'data-auto-report', name: '报表生成', count: 37, icon: '' },
      { id: 'data-forecast-lab', name: '趋势预测', count: 26, icon: '' },
      { id: 'data-cleaning-assistant', name: '数据清洗', count: 33, icon: '' }
    ],
    workflows: [
      {
        id: 'data-dashboard-builder',
        name: '指标看板生成器',
        description: '上传数据表即可生成按业务目标拆分的实时仪表盘和监控告警。',
        count: 11,
        icon: '',
        color: '#3b82f6',
        tags: ['多维分析', '异常告警', '实时刷新']
      },
      {
        id: 'data-auto-report',
        name: '智能分析报告写手',
        description: '自动撰写周报/月报，补充洞察、行动建议和图表说明。',
        count: 8,
        icon: '',
        color: '#0ea5e9',
        tags: ['自动周报', '洞察生成', '可视化']
      },
      {
        id: 'data-forecast-lab',
        name: '预测实验室',
        description: '通过历史数据训练模型，输出区间预测与关键假设分析。',
        count: 7,
        icon: '',
        color: '#a855f7',
        tags: ['时间序列', '场景模拟', '敏感度分析']
      },
      {
        id: 'data-cleaning-assistant',
        name: '数据清洗助手',
        description: '识别缺失值、异常点并生成清洗脚本和数据质量报告。',
        count: 13,
        icon: '',
        color: '#10b981',
        tags: ['数据质量', '自动脚本', '审核追踪']
      }
    ],
    insights: [
      { title: '建模命中率', value: '89%', description: '基于预测实验室生成的模型平均准确率' },
      { title: '报表产出时间', value: '↓ 72%', description: '自动报告相比手工编写节省的时间' },
      { title: '异常响应', value: '≤ 5 分钟', description: '仪表盘异常提醒后的平均响应时间' }
    ]
  },
  {
    id: 'ecommerce',
    name: '电商运营',
    icon: '',
    color: '#ec4899',
    description: '店铺管理、客服、营销推广',
    summary: '覆盖选品、营销、服务、复购的全链路电商工作流。',
    subcategories: [
      { id: 'ecommerce-product-sheet', name: '商品详情', count: 29, icon: '' },
      { id: 'ecommerce-cs-bot', name: '客户服务', count: 44, icon: '' },
      { id: 'ecommerce-campaign-lab', name: '营销推广', count: 51, icon: '' },
      { id: 'ecommerce-retention-engine', name: '用户复购', count: 23, icon: '' }
    ],
    workflows: [
      {
        id: 'ecommerce-cs-bot',
        name: '智能客服剧本',
        description: '针对常见问题、售前售后场景生成多轮对话话术与自动回复策略。',
        count: 14,
        icon: '',
        color: '#ec4899',
        tags: ['多轮对话', '满意度', '自动回复']
      },
      {
        id: 'ecommerce-product-sheet',
        name: '商品详情优化器',
        description: '生成高转化标题、卖点拆解、场景文案以及图文建议。',
        count: 9,
        icon: '',
        color: '#f97316',
        tags: ['详情页', '卖点提炼', '标题优化']
      },
      {
        id: 'ecommerce-campaign-lab',
        name: '大促营销策划室',
        description: '结合节日节奏制定优惠策略、内容节奏与投放预算规划。',
        count: 8,
        icon: '',
        color: '#8b5cf6',
        tags: ['活动策划', '渠道协同', '投放策略']
      },
      {
        id: 'ecommerce-retention-engine',
        name: '客户留存分析引擎',
        description: '识别高价值用户，输出复购关怀、会员权益和召回剧本。',
        count: 12,
        icon: '',
        color: '#22c55e',
        tags: ['用户分层', '复购关怀', '召回策略']
      }
    ],
    insights: [
      { title: '客服满意度', value: '4.8/5', description: '自动客服脚本上线后的顾客评分' },
      { title: '转化率提升', value: '2.6x', description: '商品详情优化后带来的平均转化增幅' },
      { title: '复购贡献', value: '37%', description: '留存引擎带来的复购订单占比提升' }
    ]
  },
  {
    id: 'ai-assistant',
    name: 'AI个人助手',
    icon: '',
    color: '#06b6d4',
    description: '知识整理、任务提醒、学习规划、技能成长',
    summary: '面向个人的智能助理组合，覆盖知识沉淀、目标拆解与成长陪伴。',
    subcategories: [
      { id: 'ai-knowledge-companion', name: '知识管理', count: 52, icon: '' },
      { id: 'ai-task-coach', name: '任务管理', count: 47, icon: '' },
      { id: 'ai-learning-planner', name: '学习规划', count: 36, icon: '' },
      { id: 'ai-skill-mentor', name: '技能学习', count: 41, icon: '' }
    ],
    workflows: [
      {
        id: 'ai-knowledge-companion',
        name: '知识库伴读助手',
        description: '整理会议纪要、读书笔记与灵感片段，生成主题索引与复习提醒。',
        count: 16,
        icon: '',
        color: '#3b82f6',
        tags: ['语义整理', '时序复盘', '检索推荐']
      },
      {
        id: 'ai-task-coach',
        name: '智能任务教练',
        description: '按目标拆解任务，自动生成日程安排、提醒与专注建议。',
        count: 13,
        icon: '',
        color: '#8b5cf6',
        tags: ['目标拆解', '进度提醒', '专注分析']
      },
      {
        id: 'ai-learning-planner',
        name: '学习规划师',
        description: '根据学习目标定制课程节奏、练习题与阶段测评，追踪完成情况。',
        count: 11,
        icon: '',
        color: '#0ea5e9',
        tags: ['学习计划', '阶段测评', '习惯养成']
      },
      {
        id: 'ai-skill-mentor',
        name: '技能成长导师',
        description: '个性化推送技能训练方案、实践练习与反馈建议，持续优化能力图谱。',
        count: 14,
        icon: '',
        color: '#22c55e',
        tags: ['能力评估', '练习辅导', '成长追踪']
      }
    ],
    insights: [
      { title: '知识沉淀率', value: '92%', description: '笔记自动整理后可快速查找到的内容比例' },
      { title: '任务达成度', value: '+37%', description: '任务教练帮助下按时完成目标的提升幅度' },
      { title: '学习坚持天数', value: '21 天', description: '学习规划师驱动的平均连续学习时长' }
    ]
  },
  {
    id: 'global-expansion',
    name: '出海增长',
    icon: '',
    color: '#0ea5e9',
    description: '跨境投放、品牌出海、国际化运营',
    summary: '帮助企业快速适配海外市场，从调研、投放到本地化运营，一套工具完成出海增长闭环。',
    subcategories: [
      { id: 'global-market-research', name: '市场调研', count: 31, icon: '' },
      { id: 'global-creative-lab', name: '创意制作', count: 27, icon: '' },
      { id: 'global-ads-optimizer', name: '广告投放', count: 42, icon: '' },
      { id: 'global-ops-playbook', name: '运营策略', count: 24, icon: '' }
    ],
    workflows: [
      {
        id: 'global-market-research',
        name: '海外市场洞察台',
        description: '自动汇总目标市场数据、竞品情报与用户画像，生成调研报告。',
        count: 9,
        icon: '',
        color: '#0ea5e9',
        tags: ['竞品情报', '用户画像', '趋势分析']
      },
      {
        id: 'global-creative-lab',
        name: '多语种创意工作坊',
        description: '针对不同文化生成广告素材与落地页文案，确保本地化表达。',
        count: 12,
        icon: '',
        color: '#22d3ee',
        tags: ['本地化', '创意迭代', '文案生成']
      },
      {
        id: 'global-ads-optimizer',
        name: '跨境投放指挥塔',
        description: '智能分配预算、监控投放表现并给出优化建议。',
        count: 11,
        icon: '',
        color: '#38bdf8',
        tags: ['预算分配', '实时监控', '投放优化']
      },
      {
        id: 'global-ops-playbook',
        name: '本地化运营手册',
        description: '沉淀客服话术、社媒日历与复购策略，保障出海运营落地。',
        count: 10,
        icon: '',
        color: '#0369a1',
        tags: ['客服协同', '社媒排期', '复购提升']
      }
    ],
    insights: [
      { title: '上线周期', value: '18 天', description: '完成调研到首波广告投放的平均时间' },
      { title: '投放 ROI', value: '3.4x', description: '跨境指挥塔带来的 ROI 提升' },
      { title: '本地化满意度', value: '91%', description: '多语种创意在目标市场的平均评分' }
    ]
  },
  {
    id: 'education-innovation',
    name: '智能教育创新',
    icon: '',
    color: '#f97316',
    description: '课程研发、教学交付、学习运营',
    summary: '面向教育机构与培训团队，串联课程设计、课堂互动与学习成效的智能化方案。',
    subcategories: [
      { id: 'edu-curriculum-lab', name: '课程设计', count: 29, icon: '' },
      { id: 'edu-teaching-assistant', name: '教学交付', count: 33, icon: '' },
      { id: 'edu-learning-ops', name: '学习运营', count: 26, icon: '' },
      { id: 'edu-parent-communication', name: '家校沟通', count: 21, icon: '' }
    ],
    workflows: [
      {
        id: 'edu-curriculum-lab',
        name: '课程创作工作台',
        description: '按教学目标生成课程大纲、教案与练习题组。',
        count: 13,
        icon: '',
        color: '#f97316',
        tags: ['教案设计', '题库生成', '教学目标']
      },
      {
        id: 'edu-teaching-assistant',
        name: '互动课堂助手',
        description: '实时推送互动问题、课堂测验与点评建议。',
        count: 9,
        icon: '',
        color: '#fb7185',
        tags: ['课堂互动', '即时反馈', '教学建议']
      },
      {
        id: 'edu-learning-ops',
        name: '学习轨迹追踪器',
        description: '整合学习数据生成个性化辅导建议与提醒。',
        count: 10,
        icon: '',
        color: '#f59e0b',
        tags: ['学习数据', '个性化辅导', '提醒体系']
      },
      {
        id: 'edu-parent-communication',
        name: '家校沟通中心',
        description: '自动生成学习报告与沟通话术，保持家长同步。',
        count: 8,
        icon: '',
        color: '#ea580c',
        tags: ['学习报告', '成长反馈', '家长沟通']
      }
    ],
    insights: [
      { title: '备课耗时', value: '-58%', description: '课程创作工作台带来的备课时间下降幅度' },
      { title: '课堂互动率', value: '+2.1x', description: '互动课堂助手提升的课堂参与度' },
      { title: '学习完成率', value: '87%', description: '学习轨迹追踪器驱动的平均作业完成率' }
    ]
  }
]

export const exploreThemeMap: Record<string, ExploreTheme> = Object.fromEntries(
  exploreThemes.map((theme) => [theme.id, theme])
)
