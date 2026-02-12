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
      config: Record<string, any>
    }>
    edges: Array<{
      id: string
      source: string
      target: string
    }>
  }
}

/** 简单的三步配置模板（输入→LLM→输出） */
const simpleConfig = (inputLabel: string, llmLabel: string, prompt: string) => ({
  nodes: [
    {
      id: 'input-1',
      type: 'input',
      label: inputLabel,
      position: { x: 100, y: 100 },
      config: {
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
      config: {
        prompt,
        provider: 'qwen',
        model: 'qwen-plus',
        temperature: 0.7,
        maxTokens: 2000,
        stepDescription: llmLabel
      }
    },
    {
      id: 'output-1',
      type: 'output',
      label: '输出结果',
      position: { x: 700, y: 100 },
      config: {
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

/**
 * 小红书爆款笔记完整工作流（4步骤，用于演示）
 */
const xiaohongshuFullConfig = {
  nodes: [
    {
      id: 'step-1',
      type: 'llm',
      label: '选题分析与角度挖掘',
      position: { x: 100, y: 100 },
      config: {
        stepDescription: '分析输入主题在小红书平台的热度和最佳切入角度，为后续内容创作提供方向。',
        prompt: `你是一位资深小红书内容策略师，擅长分析平台热门趋势和用户兴趣。

请针对主题「{{input.topic}}」进行选题分析：
{{input.detail ? '补充信息：' + input.detail : ''}}

请输出以下内容：

## 1. 平台热度分析
- 该话题在小红书的搜索热度（高/中/低）
- 相关热门关键词（列出8-10个）
- 目标用户画像（年龄、性别、兴趣标签）

## 2. 竞品笔记分析
- 现有爆款笔记的共同特点
- 高赞笔记的标题套路
- 内容形式偏好（图文/视频/合集）

## 3. 差异化切入角度（推荐3个）
每个角度包含：
- 角度名称
- 为什么这个角度容易火
- 适合的内容形式
- 预估互动率

## 4. 推荐选题方向
给出最终推荐的1个最佳切入角度及理由。`,
        expectedResult: '包含热度分析、竞品分析、3个差异化角度和最终推荐方向的完整选题报告',
        provider: 'qwen',
        model: 'qwen-plus',
        temperature: 0.8,
        maxTokens: 2000
      }
    },
    {
      id: 'step-2',
      type: 'llm',
      label: '爆款标题生成',
      position: { x: 100, y: 250 },
      config: {
        stepDescription: '基于选题分析结果，生成5个不同风格的爆款标题，每个都针对不同的用户心理触发点。',
        prompt: `你是小红书标题优化专家，深谙平台算法和用户点击心理。

基于上一步的选题分析：
{{step-1}}

请生成5个爆款标题方案：

## 标题要求
- 字数控制在15-25字
- 必须包含数字或emoji
- 融入热搜关键词

## 5个标题方案

### 标题1：悬念引导型
- 标题：
- 策略：利用信息差制造好奇心
- 适用场景：

### 标题2：数字清单型
- 标题：
- 策略：用具体数字降低阅读门槛
- 适用场景：

### 标题3：痛点共鸣型
- 标题：
- 策略：直击目标用户痛点
- 适用场景：

### 标题4：对比冲突型
- 标题：
- 策略：用反差吸引注意力
- 适用场景：

### 标题5：个人经验型
- 标题：
- 策略：用真实感建立信任
- 适用场景：

## 最终推荐
从5个标题中选出最佳方案，并说明理由。`,
        expectedResult: '5个不同风格的标题方案（附策略分析）+ 最终推荐标题',
        provider: 'qwen',
        model: 'qwen-plus',
        temperature: 0.9,
        maxTokens: 1500
      }
    },
    {
      id: 'step-3',
      type: 'llm',
      label: '正文内容撰写',
      position: { x: 100, y: 400 },
      config: {
        stepDescription: '根据选题方向和推荐标题，撰写完整的小红书笔记正文，包含开头hook、主体内容和互动结尾。',
        prompt: `你是小红书头部博主，写作风格亲切自然，擅长用口语化表达传递专业内容。

参考前面的分析：
- 选题方向：{{step-1}}
- 标题方案：{{step-2}}

请撰写完整的小红书笔记正文：

## 写作要求
1. 总字数800-1000字
2. 开头3行必须有强hook，让人忍不住往下看
3. 每段不超过3行，善用空行分段
4. 大量使用emoji（每2-3句至少1个）
5. 语气像跟闺蜜/好友聊天，不要书面语
6. 适当使用「姐妹们」「家人们」等小红书特色称呼
7. 融入个人体验感（用第一人称）
8. 关键信息用【】或「」高亮

## 正文结构
### 开头hook（2-3行）
直接抛出最吸引人的结论或痛点

### 正文主体
- 第一部分：问题/背景（为什么要看这篇）
- 第二部分：核心内容/方法/产品推荐
- 第三部分：个人使用体验/效果对比
- 第四部分：注意事项/避坑指南

### 互动结尾
引导点赞、收藏、评论的call-to-action

请直接输出可以发布的完整笔记正文。`,
        expectedResult: '800-1000字的完整小红书笔记正文，含emoji、口语化表达、互动引导',
        provider: 'qwen',
        model: 'qwen-plus',
        temperature: 0.85,
        maxTokens: 3000
      }
    },
    {
      id: 'step-4',
      type: 'llm',
      label: '标签优化与发布建议',
      position: { x: 100, y: 550 },
      config: {
        stepDescription: '生成精准的话题标签、最佳发布时间建议和互动运营策略，助力笔记获得最大曝光。',
        prompt: `你是小红书运营增长专家，精通平台算法和流量分配机制。

基于前面生成的完整内容：
- 选题：{{step-1}}
- 标题：{{step-2}}
- 正文：{{step-3}}

请输出发布优化方案：

## 1. 话题标签（15-20个）
按优先级排列，分为三类：
### 核心标签（5个）- 直接相关的高流量标签
### 长尾标签（5-8个）- 竞争较小但精准的标签
### 热度标签（5-7个）- 蹭当前平台热点的标签

## 2. 封面图建议
- 推荐封面类型（纯文字/实物图/对比图/拼图）
- 封面文案（大字标题）
- 配色建议
- 排版参考方向

## 3. 发布策略
- 最佳发布时间（精确到小时）
- 发布后前30分钟互动策略
- 评论区运营话术（准备3条自评论）
- 是否适合投薯条推广

## 4. 数据预期
- 预估24小时数据范围
- 关键优化指标
- 如果数据不达预期的调整方案

## 5. 最终发布清单
按步骤列出发布前的检查项。`,
        expectedResult: '完整的标签列表 + 封面建议 + 发布时间策略 + 互动运营方案',
        provider: 'qwen',
        model: 'qwen-plus',
        temperature: 0.7,
        maxTokens: 2500
      }
    }
  ],
  edges: [
    { id: 'e1', source: 'step-1', target: 'step-2' },
    { id: 'e2', source: 'step-2', target: 'step-3' },
    { id: 'e3', source: 'step-3', target: 'step-4' }
  ]
}

export const sampleWorkflows: SampleWorkflow[] = [
  // ==================== 副业专区 ====================
  {
    title: '💰 副业项目可行性评估',
    description: '输入副业想法，AI帮你分析市场机会、启动成本、变现路径和风险点',
    category: '副业专区',
    tags: '副业,创业,变现,评估',
    config: simpleConfig('副业想法', '可行性分析', '分析这个副业项目的可行性：{{input.topic}}\n补充：{{input.detail}}\n\n请从以下维度评估：\n1. 市场需求和竞争\n2. 启动成本\n3. 变现模式\n4. 时间投入\n5. 风险和建议')
  },
  {
    title: '🚀 自媒体账号起号方案',
    description: '根据你的定位和特长，生成完整的自媒体账号起号策略和30天行动计划',
    category: '副业专区',
    tags: '自媒体,起号,涨粉,规划',
    config: simpleConfig('账号定位', '起号方案', '为以下自媒体定位制定起号方案：{{input.topic}}\n补充：{{input.detail}}\n\n请输出：\n1. 账号定位和人设\n2. 内容选题方向\n3. 30天发布计划\n4. 涨粉策略\n5. 变现规划')
  },

  // ==================== 内容创作 ====================
  {
    title: '📱 小红书爆款笔记全流程',
    description: '从选题分析到标题生成、正文撰写、标签优化，一键完成完整的小红书爆款笔记创作',
    category: '内容创作',
    tags: '小红书,种草,笔记,爆款,全流程',
    config: xiaohongshuFullConfig
  },
  {
    title: '✍️ 公众号爆文写作助手',
    description: '从选题到成稿，快速生成公众号长文，附排版和发布建议',
    category: '内容创作',
    tags: '公众号,写作,长文,运营',
    config: simpleConfig('文章选题', '撰写文章', '你是资深公众号主编。为"{{input.topic}}"写一篇2000字文章：\n补充：{{input.detail}}\n\n包含：\n1. 3个标题备选\n2. 完整正文\n3. 摘要\n4. 发布时间建议\n5. 朋友圈转发语')
  },

  // ==================== 视频制作 ====================
  {
    title: '🎬 短视频脚本生成器',
    description: '快速生成抖音/视频号短视频脚本，含分镜、台词和拍摄指导',
    category: '视频制作',
    tags: '抖音,短视频,脚本,视频号',
    config: simpleConfig('视频主题', '生成脚本', '你是短视频导演。为"{{input.topic}}"写一个60秒短视频脚本：\n补充：{{input.detail}}\n\n包含：\n1. 开场hook（前3秒）\n2. 分镜表（时间+画面+台词）\n3. BGM建议\n4. 拍摄手法\n5. 字幕贴纸建议')
  },
  {
    title: '🎥 视频选题日历规划',
    description: '根据账号定位，生成一周/一月的视频选题日历和内容规划',
    category: '视频制作',
    tags: '选题,规划,日历,内容',
    config: simpleConfig('账号定位', '选题规划', '为"{{input.topic}}"类型的视频账号规划内容日历：\n补充：{{input.detail}}\n\n请输出：\n1. 一周7个选题\n2. 每个选题的角度和亮点\n3. 最佳发布时间\n4. 预估热度\n5. 系列化建议')
  },

  // ==================== 数据分析 ====================
  {
    title: '📊 电商数据分析报告',
    description: '输入店铺或行业数据，自动生成分析洞察和运营优化建议',
    category: '数据分析',
    tags: '电商,数据,分析,运营',
    config: simpleConfig('数据描述', '数据分析', '作为电商数据分析师，分析以下数据：{{input.topic}}\n补充：{{input.detail}}\n\n请输出：\n1. 关键指标解读\n2. 趋势分析\n3. 问题诊断\n4. 优化建议\n5. 下一步行动计划')
  },
  {
    title: '🔍 竞品对比分析',
    description: '输入竞品信息，生成多维度竞品对比报告和差异化策略',
    category: '数据分析',
    tags: '竞品,对比,分析,策略',
    config: simpleConfig('竞品信息', '竞品分析', '分析以下竞品信息：{{input.topic}}\n补充：{{input.detail}}\n\n请输出：\n1. 竞品对比表\n2. 各竞品优劣势\n3. 市场定位分析\n4. 差异化策略\n5. 定价建议')
  },

  // ==================== 图文设计 ====================
  {
    title: '🎨 电商主图文案策划',
    description: '为商品生成主图文案、卖点提炼和详情页文案结构',
    category: '图文设计',
    tags: '电商,文案,主图,详情页',
    config: simpleConfig('商品信息', '文案策划', '为以下商品策划主图文案：{{input.topic}}\n补充：{{input.detail}}\n\n请输出：\n1. 5张主图文案\n2. 3个核心卖点\n3. 详情页文案结构\n4. 促销标语\n5. 评价引导语')
  },
  {
    title: '🖼️ 社交媒体配图方案',
    description: '根据内容主题，生成配图风格建议、文字排版和色彩搭配方案',
    category: '图文设计',
    tags: '配图,设计,排版,社交媒体',
    config: simpleConfig('内容主题', '配图方案', '为"{{input.topic}}"的社交媒体内容设计配图方案：\n补充：{{input.detail}}\n\n请输出：\n1. 配图风格定义\n2. 色彩搭配建议\n3. 文字排版方案\n4. 3种构图参考描述\n5. 尺寸规格建议')
  },

  // ==================== 效率工具 ====================
  {
    title: '📋 PRD需求文档生成器',
    description: '输入产品想法，自动生成标准PRD文档，含用户故事和验收标准',
    category: '效率工具',
    tags: '产品,PRD,需求,文档',
    config: simpleConfig('产品想法', '生成PRD', '为以下产品想法生成PRD：{{input.topic}}\n补充：{{input.detail}}\n\n包含：\n1. 项目背景和目标\n2. 用户故事\n3. 功能需求（P0/P1/P2）\n4. 验收标准\n5. 里程碑计划')
  },
  {
    title: '📝 会议纪要整理助手',
    description: '输入会议要点或录音文字稿，自动整理成结构化会议纪要',
    category: '效率工具',
    tags: '会议,纪要,整理,效率',
    config: simpleConfig('会议内容', '整理纪要', '整理以下会议内容为结构化纪要：{{input.topic}}\n补充：{{input.detail}}\n\n格式：\n1. 会议概要\n2. 关键决策\n3. 待办事项（责任人+截止时间）\n4. 讨论要点\n5. 下次会议议题')
  }
]
