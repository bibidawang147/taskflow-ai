import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 小红书爆款笔记创作全流程 - 完整数据（使用 guideBlocks 格式）
const xiaohongshuWorkflow = {
  id: 'wf_2x8k9m3n5p7q',
  title: '小红书爆款笔记创作全流程',
  description: '从选题到发布的完整小红书内容创作工作流，包含AI辅助写作、图片处理、数据分析等环节',
  category: 'content-creation',
  tags: '小红书,内容创作,AI写作,爆款笔记',
  difficultyLevel: 'intermediate',
  isPublic: true,
  isDraft: false,
  isTemplate: true,
  usageCount: 3240,
  nodes: [
    {
      id: 'demo-step-1',
      type: 'step',
      label: '热点选题分析',
      position: { x: 100, y: 100 },
      config: {},
      stepDetail: {
        stepDescription: '使用数据工具分析当前小红书热门话题和趋势，找到适合自己领域的爆款选题方向',
        expectedResult: '确定 3-5 个潜力选题，每个选题有明确的目标人群和痛点',
        guideBlocks: [
          { id: 'g1-1', type: 'text', text: '首先，打开新红数据平台，查看你所在领域的热门话题趋势：' },
          { id: 'g1-2', type: 'tool', tool: { name: '新红数据', url: 'https://xh.newrank.cn', description: '小红书数据分析平台，查看热门话题和达人数据' } },
          { id: 'g1-3', type: 'text', text: '同时，可以使用蝉妈妈分析竞品达人的爆款内容：' },
          { id: 'g1-4', type: 'tool', tool: { name: '蝉妈妈', url: 'https://www.chanmama.com', description: '达人数据和热门内容分析工具' } },
          { id: 'g1-5', type: 'text', text: '收集好热点数据后，使用下面的提示词让 AI 帮你分析选题：' },
          { id: 'g1-6', type: 'prompt', prompt: `你是一位小红书运营专家。请帮我分析以下领域的热门选题：

【我的领域】：{{领域}}
【目标人群】：{{目标人群}}
【近期热点】：{{热点关键词}}

请输出：
1. 5个潜力选题（标题+简述）
2. 每个选题的目标受众画像
3. 预估的互动潜力（高/中/低）
4. 内容切入角度建议` },
          { id: 'g1-7', type: 'tool', tool: { name: 'ChatGPT', url: 'https://chat.openai.com', description: '辅助分析和头脑风暴' } },
          { id: 'g1-8', type: 'text', text: '参考以下选题方法论文档，掌握爆款选题的核心逻辑：' },
          { id: 'g1-9', type: 'resource', resource: { title: '小红书选题指南 PDF', type: 'file', url: '#', description: '30页选题方法论', content: `# 小红书爆款选题方法论

## 一、选题三要素
1. **痛点明确**：解决用户真实问题
2. **场景具体**：让用户产生代入感
3. **价值清晰**：用户能获得什么

## 二、热门选题公式
- 数字 + 痛点：「3个方法让你...」
- 身份 + 场景：「打工人必看的...」
- 对比 + 反差：「月薪3k vs 月薪3w的...」
- 时间 + 结果：「坚持30天，我...」

## 三、选题自检清单
□ 是否有明确的目标人群？
□ 是否解决真实痛点？
□ 是否有差异化角度？
□ 是否容易引发共鸣？` } },
          { id: 'g1-10', type: 'resource', resource: { title: '爆款选题案例库', type: 'link', url: '#', description: '100+ 真实爆款案例分析', content: `# 爆款选题案例库

## 美妆护肤类
1. 「黄黑皮逆袭！这5支口红让我白了2个度」- 点赞 12.3w
2. 「烂脸3年终于好了！分享我的修复全过程」- 点赞 8.7w

## 穿搭类
1. 「小个子穿搭｜155cm 也能穿出大长腿」- 点赞 15.2w
2. 「通勤穿搭｜30套一周不重样的上班look」- 点赞 9.1w

## 职场成长类
1. 「入职3个月，我是如何拿到年度优秀的」- 点赞 6.8w
2. 「离职前，领导教会我的5件事」- 点赞 11.3w` } },
          { id: 'g1-11', type: 'media', media: { type: 'image', url: 'https://picsum.photos/seed/xhs1/800/600', caption: '新红数据热门话题分析界面' } }
        ]
      }
    },
    {
      id: 'demo-step-2',
      type: 'step',
      label: '竞品笔记拆解',
      position: { x: 300, y: 100 },
      config: {},
      stepDetail: {
        stepDescription: '找到同领域的爆款笔记，分析其标题、封面、正文结构、评论区互动等要素',
        expectedResult: '完成 5 篇竞品笔记的详细拆解，提取可复用的内容模板',
        guideBlocks: [
          { id: 'g2-1', type: 'text', text: '打开小红书 App，搜索你选定的关键词，筛选出点赞过万的爆款笔记：' },
          { id: 'g2-2', type: 'tool', tool: { name: '小红书 App', url: 'https://www.xiaohongshu.com', description: '搜索和收藏竞品笔记' } },
          { id: 'g2-3', type: 'text', text: '找到 5 篇优质竞品后，使用 Notion 模板来记录拆解结果：' },
          { id: 'g2-4', type: 'tool', tool: { name: 'Notion', url: 'https://notion.so', description: '整理拆解笔记和内容模板' } },
          { id: 'g2-5', type: 'resource', resource: { title: '爆款笔记拆解模板', type: 'link', url: 'https://notion.so', description: 'Notion 模板，直接复制使用', content: `# 爆款笔记拆解模板

## 基本信息
- 笔记链接：
- 发布时间：
- 数据表现：点赞 / 收藏 / 评论

## 标题分析
- 标题原文：
- 使用技巧：□数字 □情绪词 □悬念 □对比
- 可借鉴点：

## 封面分析
- 封面类型：□纯文字 □人物 □产品 □对比图
- 色彩搭配：
- 文字排版：

## 正文结构
- 开头 hook（前3行）：
- 内容框架：
- 金句摘录：
- 结尾引导：

## 评论区运营
- 置顶评论：
- 作者互动方式：
- 热门评论特点：` } },
          { id: 'g2-6', type: 'text', text: '复制下面的提示词，让 AI 帮你快速拆解笔记：' },
          { id: 'g2-7', type: 'prompt', prompt: `请帮我拆解这篇小红书爆款笔记：

【笔记标题】：{{标题}}
【笔记正文】：{{正文内容}}
【点赞数】：{{点赞}}  【收藏数】：{{收藏}}  【评论数】：{{评论}}

请从以下维度分析：
1. 标题技巧（数字、情绪词、悬念等）
2. 开头 hook（前3行如何吸引注意力）
3. 正文结构（总分总/列表/故事等）
4. 金句提炼（可复用的表达）
5. 评论区运营（作者如何互动）
6. 可借鉴的点和改进建议` },
          { id: 'g2-8', type: 'media', media: { type: 'image', url: 'https://picsum.photos/seed/notion1/800/600', caption: 'Notion 竞品拆解模板示例' } }
        ]
      }
    },
    {
      id: 'demo-step-3',
      type: 'step',
      label: 'AI 生成初稿',
      position: { x: 500, y: 100 },
      config: {},
      stepDetail: {
        stepDescription: '基于选题和竞品分析结果，使用 AI 工具生成笔记初稿',
        expectedResult: '生成一篇 800-1200 字的小红书笔记初稿，包含标题、正文、标签',
        guideBlocks: [
          { id: 'g3-1', type: 'text', text: '整理好前两步的选题和竞品分析结果，准备好以下信息：\n• 确定的选题方向\n• 目标人群画像\n• 核心痛点\n• 参考的爆款风格' },
          { id: 'g3-2', type: 'text', text: '推荐使用 Claude 生成长文，效果更自然：' },
          { id: 'g3-3', type: 'tool', tool: { name: 'Claude', url: 'https://claude.ai', description: '长文生成效果更好，语言更自然' } },
          { id: 'g3-4', type: 'text', text: '也可以使用 ChatGPT 快速迭代多个版本：' },
          { id: 'g3-5', type: 'tool', tool: { name: 'ChatGPT', url: 'https://chat.openai.com', description: '快速迭代和优化，支持多轮对话修改' } },
          { id: 'g3-6', type: 'text', text: '使用下面这个经过优化的提示词模板：' },
          { id: 'g3-7', type: 'prompt', prompt: `你是一位小红书爆款写手，请帮我撰写一篇笔记：

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

字数控制在 800-1000 字` },
          { id: 'g3-8', type: 'text', text: '想要更多场景化的提示词？查看这个 Prompt 库：' },
          { id: 'g3-9', type: 'resource', resource: { title: '小红书文案 Prompt 库', type: 'link', url: '#', description: '50+ 场景化 Prompt 模板', content: `# 小红书文案 Prompt 库

## 种草测评类
你是一位真诚的产品测评博主，请帮我写一篇{{产品}}的种草笔记...

## 教程干货类
你是一位{{领域}}专家，请帮我写一篇新手教程...

## 经验分享类
你是一位有{{X年}}经验的{{身份}}，请分享关于{{主题}}的个人经历...

## 好物推荐类
你是一位生活方式博主，请帮我写一篇{{场景}}好物推荐...

## 避坑指南类
你是一位踩过坑的过来人，请帮我写一篇{{主题}}避坑指南...` } },
          { id: 'g3-10', type: 'media', media: { type: 'image', url: 'https://picsum.photos/seed/claude1/800/600', caption: 'Claude 生成内容示例' } }
        ]
      }
    },
    {
      id: 'demo-step-4',
      type: 'step',
      label: '封面图片制作',
      position: { x: 700, y: 100 },
      config: {},
      stepDetail: {
        stepDescription: '使用 Canva 或其他设计工具制作吸引眼球的封面图片',
        expectedResult: '完成 1 张主封面 + 3-5 张内页图片，尺寸 3:4，风格统一',
        guideBlocks: [
          { id: 'g4-1', type: 'text', text: '封面是决定用户是否点击的关键！打开 Canva 选择小红书封面模板：' },
          { id: 'g4-2', type: 'tool', tool: { name: 'Canva', url: 'https://www.canva.com', description: '在线设计工具，有大量小红书专用模板' } },
          { id: 'g4-3', type: 'resource', resource: { title: 'Canva 小红书模板合集', type: 'link', url: 'https://www.canva.com/templates/?query=xiaohongshu', description: '100+ 免费模板，直接套用修改', content: `# 小红书封面模板推荐

## 按风格分类

### 清新文艺风
- 低饱和度配色
- 手写字体
- 简约排版

### 高级感风格
- 黑白金配色
- 无衬线字体
- 留白设计

### 活力元气风
- 高饱和度撞色
- 可爱字体
- 贴纸装饰

## 封面设计要点
1. 尺寸：3:4 竖版
2. 文字要大、要少
3. 重点信息放中上位置
4. 颜色不超过3种` } },
          { id: 'g4-4', type: 'text', text: '如果需要快速美化图片，可以用美图秀秀：' },
          { id: 'g4-5', type: 'tool', tool: { name: '美图秀秀', url: 'https://www.meitu.com', description: '快速美化图片、添加滤镜和贴纸' } },
          { id: 'g4-6', type: 'text', text: '想要独特的 AI 生成配图？使用 Midjourney：' },
          { id: 'g4-7', type: 'tool', tool: { name: 'Midjourney', url: 'https://midjourney.com', description: 'AI 生成高质量配图' } },
          { id: 'g4-8', type: 'prompt', prompt: `【Midjourney 封面生成提示词】

小红书{{主题}}封面，{{风格}}风格，
主色调{{颜色}}，包含文字"{{标题关键词}}"，
简洁大气，高级感，3:4比例

--ar 3:4 --v 6` },
          { id: 'g4-9', type: 'resource', resource: { title: '配色方案推荐', type: 'link', url: '#', description: '2024 流行色彩搭配', content: `# 小红书爆款配色方案

## 高点击率配色

### 奶油杏色系
- 主色：#F5E6D3
- 辅色：#E8D4C4
- 强调：#C9A88C

### 莫兰迪蓝
- 主色：#B4C7D9
- 辅色：#8BA7C1
- 强调：#5C7A94

### 薄荷绿
- 主色：#C5E8D5
- 辅色：#9DD5BE
- 强调：#6BBF99

### 脏粉色
- 主色：#E8C4C4
- 辅色：#D4A5A5
- 强调：#BC8F8F

## 配色原则
1. 主色占60%，辅色30%，强调色10%
2. 饱和度不要太高
3. 文字颜色要与背景形成对比` } },
          { id: 'g4-10', type: 'text', text: '参考这些封面风格找灵感：' },
          { id: 'g4-11', type: 'media', media: { type: 'image', url: 'https://picsum.photos/seed/cover1/600/800', caption: '清新风格封面示例' } },
          { id: 'g4-12', type: 'media', media: { type: 'image', url: 'https://picsum.photos/seed/cover2/600/800', caption: '数据可视化封面示例' } }
        ]
      }
    },
    {
      id: 'demo-step-5',
      type: 'step',
      label: '内容优化润色',
      position: { x: 900, y: 100 },
      config: {},
      stepDetail: {
        stepDescription: '对 AI 生成的初稿进行人工润色，增加个人风格和真实感',
        expectedResult: '完成终稿，确保内容原创度高、符合平台调性、没有敏感词',
        guideBlocks: [
          { id: 'g5-1', type: 'text', text: 'AI 生成的内容需要润色才能发布。首先，检查是否有敏感词：' },
          { id: 'g5-2', type: 'tool', tool: { name: '零克查词', url: 'https://www.lingke.pro', description: '小红书敏感词检测工具，一键检测违规词' } },
          { id: 'g5-3', type: 'resource', resource: { title: '小红书违禁词清单', type: 'file', url: '#', description: '2024 最新版违禁词列表', content: `# 小红书违禁词清单（2024）

## 绝对禁用词
- 最、第一、顶级、极致
- 国家级、世界级
- 100%、绝对、肯定

## 医疗相关禁用词
- 治疗、治愈、药效
- 消炎、杀菌、抗病毒
- 处方、医生推荐

## 化妆品禁用词
- 速效、立竿见影
- 永久、根除
- 医学级、药妆

## 金融相关禁用词
- 稳赚、保本、零风险
- 高收益、躺赚
- 内部消息

## 替换建议
- 最好的 → 我用过很不错的
- 100%有效 → 亲测有效
- 治疗 → 改善/缓解` } },
          { id: 'g5-4', type: 'text', text: '然后，使用下面的提示词让 AI 帮你优化文案风格：' },
          { id: 'g5-5', type: 'prompt', prompt: `请帮我优化这篇小红书笔记，使其更加口语化和有个人特色：

【原文】：
{{原文内容}}

优化要求：
1. 将书面语改为口语化表达
2. 增加 emoji 和网络热词
3. 确保开头有足够吸引力
4. 检查是否有敏感词或违规内容
5. 优化句子长度，每段不超过3行
6. 保持真实感，像在和朋友聊天` },
          { id: 'g5-6', type: 'text', text: '最后，自己通读一遍，加入个人经历和真实感受，让内容更有温度。' }
        ]
      }
    },
    {
      id: 'demo-step-6',
      type: 'step',
      label: '发布与数据追踪',
      position: { x: 1100, y: 100 },
      config: {},
      stepDetail: {
        stepDescription: '选择最佳发布时间，发布笔记并持续追踪数据表现',
        expectedResult: '笔记成功发布，建立数据追踪表，72小时内完成初始数据分析',
        guideBlocks: [
          { id: 'g6-1', type: 'text', text: '发布前，按照这个清单做最后检查：' },
          { id: 'g6-2', type: 'resource', resource: { title: '发布前检查清单', type: 'file', url: '#', description: '确保不遗漏任何细节', content: `# 发布前检查清单

## 内容检查
□ 标题是否包含关键词
□ 标题是否在20字以内
□ 开头3行是否有吸引力
□ 正文是否有错别字
□ 是否包含敏感词

## 图片检查
□ 封面图片是否清晰
□ 图片尺寸是否为3:4
□ 图片数量是否在6-9张
□ 图片顺序是否合理

## 标签检查
□ 是否添加了相关标签
□ 标签是否有热度
□ 话题是否正确

## 发布设置
□ 定位是否设置（如适用）
□ 发布时间是否在黄金时段
  - 早7:00-9:00
  - 中午12:00-14:00
  - 晚20:00-22:00` } },
          { id: 'g6-3', type: 'text', text: '发布后，打开创作服务平台查看实时数据：' },
          { id: 'g6-4', type: 'tool', tool: { name: '小红书创作服务平台', url: 'https://creator.xiaohongshu.com', description: '官方数据后台，查看笔记表现' } },
          { id: 'g6-5', type: 'text', text: '使用新红数据追踪更详细的数据指标：' },
          { id: 'g6-6', type: 'tool', tool: { name: '新红数据', url: 'https://xh.newrank.cn', description: '详细数据分析，对比行业均值' } },
          { id: 'g6-7', type: 'text', text: '下载这个 Excel 模板，记录和分析你的笔记数据：' },
          { id: 'g6-8', type: 'resource', resource: { title: '数据追踪 Excel 模板', type: 'file', url: '#', description: '自动计算增长率和转化漏斗', content: `# 数据追踪模板说明

## 追踪时间节点
- 发布后 1 小时
- 发布后 24 小时
- 发布后 72 小时
- 发布后 7 天

## 核心指标
| 指标 | 1h | 24h | 72h | 7d |
|------|-----|------|------|-----|
| 曝光量 | | | | |
| 点击率 | | | | |
| 点赞数 | | | | |
| 收藏数 | | | | |
| 评论数 | | | | |
| 涨粉数 | | | | |

## 数据分析要点
1. 点击率 < 5% → 优化封面和标题
2. 互动率 < 3% → 优化内容和引导
3. 收藏/点赞 > 1 → 内容有干货价值` } },
          { id: 'g6-9', type: 'resource', resource: { title: '最佳发布时间研究', type: 'link', url: '#', description: '基于10万篇笔记分析的发布时间建议', content: `# 小红书最佳发布时间研究

## 数据来源
分析了 10 万篇小红书笔记的发布时间与互动数据

## 总体最佳时段

### 工作日
- 早高峰：7:00-9:00 ⭐⭐⭐⭐
- 午休时：12:00-14:00 ⭐⭐⭐⭐⭐
- 晚高峰：20:00-22:00 ⭐⭐⭐⭐⭐

### 周末
- 上午：9:00-11:00 ⭐⭐⭐⭐
- 下午：14:00-17:00 ⭐⭐⭐⭐⭐
- 晚上：19:00-21:00 ⭐⭐⭐⭐

## 分品类建议
- 美妆护肤：晚 20:00-22:00
- 穿搭时尚：午 12:00-13:00
- 美食探店：午 11:00-12:00
- 职场成长：早 7:00-8:00
- 母婴育儿：晚 21:00-22:00` } },
          { id: 'g6-10', type: 'media', media: { type: 'image', url: 'https://picsum.photos/seed/data1/800/600', caption: '创作服务平台数据页面' } }
        ]
      }
    }
  ],
  edges: [
    { id: 'e1-2', source: 'demo-step-1', target: 'demo-step-2' },
    { id: 'e2-3', source: 'demo-step-2', target: 'demo-step-3' },
    { id: 'e3-4', source: 'demo-step-3', target: 'demo-step-4' },
    { id: 'e4-5', source: 'demo-step-4', target: 'demo-step-5' },
    { id: 'e5-6', source: 'demo-step-5', target: 'demo-step-6' }
  ],
  preparations: [
    { id: 'prep1', name: '注册小红书账号', description: '确保账号已完成实名认证，建议使用企业号获得更多功能', link: 'https://www.xiaohongshu.com', order: 0 },
    { id: 'prep2', name: '准备 AI 工具账号', description: '需要 ChatGPT 或 Claude 账号，用于内容生成', link: 'https://chat.openai.com', order: 1 },
    { id: 'prep3', name: '安装图片处理工具', description: '推荐使用 Canva 或美图秀秀进行封面设计', link: 'https://www.canva.com', order: 2 }
  ]
}

async function main() {
  console.log('🚀 开始创建小红书工作流（使用 guideBlocks 格式）...')

  // 1. 首先确保有一个官方用户
  let officialUser = await prisma.user.findFirst({
    where: { email: 'official@lingji.ai' }
  })

  if (!officialUser) {
    console.log('📝 创建官方用户...')
    const hashedPassword = '$2b$10$K8Y8Y8Y8Y8Y8Y8Y8Y8Y8YOzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'
    officialUser = await prisma.user.create({
      data: {
        id: 'official',
        email: 'official@lingji.ai',
        name: '瓴积AI官方',
        password: hashedPassword,
        avatar: '/avatars/official.png'
      }
    })
    console.log('✅ 官方用户创建成功:', officialUser.id)
  } else {
    console.log('✅ 官方用户已存在:', officialUser.id)
  }

  // 2. 清理已存在的数据
  console.log('🧹 清理已存在的数据...')

  const existingNodeIds = xiaohongshuWorkflow.nodes.map(n => n.id)
  await prisma.workflowStepDetail.deleteMany({
    where: { nodeId: { in: existingNodeIds } }
  })

  await prisma.workflowNode.deleteMany({
    where: { id: { in: existingNodeIds } }
  })

  await prisma.workflowPreparation.deleteMany({
    where: { workflowId: xiaohongshuWorkflow.id }
  })

  const existingWorkflow = await prisma.workflow.findUnique({
    where: { id: xiaohongshuWorkflow.id }
  })

  if (existingWorkflow) {
    console.log('⚠️ 工作流已存在，删除旧数据...')
    await prisma.workflow.delete({
      where: { id: xiaohongshuWorkflow.id }
    })
  }

  console.log('✅ 清理完成')

  // 3. 创建工作流
  console.log('📝 创建工作流...')
  const workflow = await prisma.workflow.create({
    data: {
      id: xiaohongshuWorkflow.id,
      title: xiaohongshuWorkflow.title,
      description: xiaohongshuWorkflow.description,
      category: xiaohongshuWorkflow.category,
      tags: xiaohongshuWorkflow.tags,
      difficultyLevel: xiaohongshuWorkflow.difficultyLevel,
      isPublic: xiaohongshuWorkflow.isPublic,
      isDraft: xiaohongshuWorkflow.isDraft,
      isTemplate: xiaohongshuWorkflow.isTemplate,
      usageCount: xiaohongshuWorkflow.usageCount,
      authorId: officialUser.id,
      config: {
        edges: xiaohongshuWorkflow.edges
      }
    }
  })
  console.log('✅ 工作流创建成功:', workflow.id)

  // 4. 创建节点和步骤详情
  console.log('📝 创建工作流节点...')
  for (const nodeData of xiaohongshuWorkflow.nodes) {
    const node = await prisma.workflowNode.create({
      data: {
        id: nodeData.id,
        type: nodeData.type,
        label: nodeData.label,
        position: nodeData.position,
        config: nodeData.config,
        workflowId: workflow.id
      }
    })

    // 创建步骤详情 - 使用 guideBlocks 字段
    await prisma.workflowStepDetail.create({
      data: {
        nodeId: node.id,
        stepDescription: nodeData.stepDetail.stepDescription,
        expectedResult: nodeData.stepDetail.expectedResult,
        // ✅ 直接存储完整的 guideBlocks JSON
        guideBlocks: JSON.stringify(nodeData.stepDetail.guideBlocks)
      }
    })

    console.log(`  ✅ 节点 "${nodeData.label}" 创建成功 (${nodeData.stepDetail.guideBlocks.length} 个引导块)`)
  }

  // 5. 创建前置准备项
  console.log('📝 创建前置准备项...')
  for (const prep of xiaohongshuWorkflow.preparations) {
    await prisma.workflowPreparation.create({
      data: {
        id: prep.id,
        workflowId: workflow.id,
        name: prep.name,
        description: prep.description,
        link: prep.link,
        order: prep.order
      }
    })
    console.log(`  ✅ 准备项 "${prep.name}" 创建成功`)
  }

  console.log('\n🎉 小红书工作流创建完成!')
  console.log(`   ID: ${workflow.id}`)
  console.log(`   标题: ${workflow.title}`)
  console.log(`   节点数: ${xiaohongshuWorkflow.nodes.length}`)
  console.log(`   准备项数: ${xiaohongshuWorkflow.preparations.length}`)
  console.log(`   存储格式: guideBlocks (完整保留顺序和内容)`)
}

main()
  .catch((e) => {
    console.error('❌ 创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
