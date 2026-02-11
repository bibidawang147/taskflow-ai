/**
 * 新用户示例工作流数据
 * 注册时自动创建，让用户看到 AI 工作方法库有内容
 * category 必须匹配前端 workflowCategories.ts 中的分类名称
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

/** 简单的两节点配置模板 */
const simpleConfig = (inputLabel: string, llmLabel: string, prompt: string) => ({
  nodes: [
    {
      id: 'input-1',
      type: 'input',
      label: inputLabel,
      position: { x: 100, y: 100 },
      data: {
        label: inputLabel,
        fields: [
          { name: 'topic', label: '主题', type: 'text', required: true },
          { name: 'detail', label: '补充说明', type: 'textarea', required: false }
        ]
      }
    },
    {
      id: 'llm-1',
      type: 'llm',
      label: llmLabel,
      position: { x: 400, y: 100 },
      data: {
        label: llmLabel,
        provider: 'qwen',
        model: 'qwen-plus',
        prompt,
        temperature: 0.7
      }
    },
    {
      id: 'output-1',
      type: 'output',
      label: '输出结果',
      position: { x: 700, y: 100 },
      data: {
        label: '输出结果',
        fields: [{ name: 'result', source: 'llm-1.output' }]
      }
    }
  ],
  edges: [
    { id: 'e1', source: 'input-1', target: 'llm-1' },
    { id: 'e2', source: 'llm-1', target: 'output-1' }
  ]
})

export const sampleWorkflows: SampleWorkflow[] = [
  // ==================== 副业专区 ====================
  {
    title: '💰 副业项目可行性评估',
    description: '输入副业想法，AI帮你分析市场机会、启动成本、变现路径和风险点',
    category: '副业专区',
    tags: '副业,创业,变现,评估',
    config: simpleConfig('副业想法', '可行性分析', '分析这个副业项目的可行性：{{topic}}\n补充：{{detail}}\n\n请从以下维度评估：\n1. 市场需求和竞争\n2. 启动成本\n3. 变现模式\n4. 时间投入\n5. 风险和建议')
  },
  {
    title: '🚀 自媒体账号起号方案',
    description: '根据你的定位和特长，生成完整的自媒体账号起号策略和30天行动计划',
    category: '副业专区',
    tags: '自媒体,起号,涨粉,规划',
    config: simpleConfig('账号定位', '起号方案', '为以下自媒体定位制定起号方案：{{topic}}\n补充：{{detail}}\n\n请输出：\n1. 账号定位和人设\n2. 内容选题方向\n3. 30天发布计划\n4. 涨粉策略\n5. 变现规划')
  },

  // ==================== 内容创作 ====================
  {
    title: '📱 小红书爆款笔记生成',
    description: '输入主题，自动生成小红书风格种草笔记，含标题、正文和标签',
    category: '内容创作',
    tags: '小红书,种草,笔记,爆款',
    config: simpleConfig('笔记主题', '生成笔记', '你是小红书爆款写手。为"{{topic}}"写一篇种草笔记：\n补充：{{detail}}\n\n要求：\n1. 5个爆款标题备选\n2. 800字正文，多用emoji\n3. 口语化，像朋友聊天\n4. 结尾引导互动\n5. 15个相关标签')
  },
  {
    title: '✍️ 公众号爆文写作助手',
    description: '从选题到成稿，快速生成公众号长文，附排版和发布建议',
    category: '内容创作',
    tags: '公众号,写作,长文,运营',
    config: simpleConfig('文章选题', '撰写文章', '你是资深公众号主编。为"{{topic}}"写一篇2000字文章：\n补充：{{detail}}\n\n包含：\n1. 3个标题备选\n2. 完整正文\n3. 摘要\n4. 发布时间建议\n5. 朋友圈转发语')
  },

  // ==================== 视频制作 ====================
  {
    title: '🎬 短视频脚本生成器',
    description: '快速生成抖音/视频号短视频脚本，含分镜、台词和拍摄指导',
    category: '视频制作',
    tags: '抖音,短视频,脚本,视频号',
    config: simpleConfig('视频主题', '生成脚本', '你是短视频导演。为"{{topic}}"写一个60秒短视频脚本：\n补充：{{detail}}\n\n包含：\n1. 开场hook（前3秒）\n2. 分镜表（时间+画面+台词）\n3. BGM建议\n4. 拍摄手法\n5. 字幕贴纸建议')
  },
  {
    title: '🎥 视频选题日历规划',
    description: '根据账号定位，生成一周/一月的视频选题日历和内容规划',
    category: '视频制作',
    tags: '选题,规划,日历,内容',
    config: simpleConfig('账号定位', '选题规划', '为"{{topic}}"类型的视频账号规划内容日历：\n补充：{{detail}}\n\n请输出：\n1. 一周7个选题\n2. 每个选题的角度和亮点\n3. 最佳发布时间\n4. 预估热度\n5. 系列化建议')
  },

  // ==================== 数据分析 ====================
  {
    title: '📊 电商数据分析报告',
    description: '输入店铺或行业数据，自动生成分析洞察和运营优化建议',
    category: '数据分析',
    tags: '电商,数据,分析,运营',
    config: simpleConfig('数据描述', '数据分析', '作为电商数据分析师，分析以下数据：{{topic}}\n补充：{{detail}}\n\n请输出：\n1. 关键指标解读\n2. 趋势分析\n3. 问题诊断\n4. 优化建议\n5. 下一步行动计划')
  },
  {
    title: '🔍 竞品对比分析',
    description: '输入竞品信息，生成多维度竞品对比报告和差异化策略',
    category: '数据分析',
    tags: '竞品,对比,分析,策略',
    config: simpleConfig('竞品信息', '竞品分析', '分析以下竞品信息：{{topic}}\n补充：{{detail}}\n\n请输出：\n1. 竞品对比表\n2. 各竞品优劣势\n3. 市场定位分析\n4. 差异化策略\n5. 定价建议')
  },

  // ==================== 图文设计 ====================
  {
    title: '🎨 电商主图文案策划',
    description: '为商品生成主图文案、卖点提炼和详情页文案结构',
    category: '图文设计',
    tags: '电商,文案,主图,详情页',
    config: simpleConfig('商品信息', '文案策划', '为以下商品策划主图文案：{{topic}}\n补充：{{detail}}\n\n请输出：\n1. 5张主图文案\n2. 3个核心卖点\n3. 详情页文案结构\n4. 促销标语\n5. 评价引导语')
  },
  {
    title: '🖼️ 社交媒体配图方案',
    description: '根据内容主题，生成配图风格建议、文字排版和色彩搭配方案',
    category: '图文设计',
    tags: '配图,设计,排版,社交媒体',
    config: simpleConfig('内容主题', '配图方案', '为"{{topic}}"的社交媒体内容设计配图方案：\n补充：{{detail}}\n\n请输出：\n1. 配图风格定义\n2. 色彩搭配建议\n3. 文字排版方案\n4. 3种构图参考描述\n5. 尺寸规格建议')
  },

  // ==================== 效率工具 ====================
  {
    title: '📋 PRD需求文档生成器',
    description: '输入产品想法，自动生成标准PRD文档，含用户故事和验收标准',
    category: '效率工具',
    tags: '产品,PRD,需求,文档',
    config: simpleConfig('产品想法', '生成PRD', '为以下产品想法生成PRD：{{topic}}\n补充：{{detail}}\n\n包含：\n1. 项目背景和目标\n2. 用户故事\n3. 功能需求（P0/P1/P2）\n4. 验收标准\n5. 里程碑计划')
  },
  {
    title: '📝 会议纪要整理助手',
    description: '输入会议要点或录音文字稿，自动整理成结构化会议纪要',
    category: '效率工具',
    tags: '会议,纪要,整理,效率',
    config: simpleConfig('会议内容', '整理纪要', '整理以下会议内容为结构化纪要：{{topic}}\n补充：{{detail}}\n\n格式：\n1. 会议概要\n2. 关键决策\n3. 待办事项（责任人+截止时间）\n4. 讨论要点\n5. 下次会议议题')
  }
]
