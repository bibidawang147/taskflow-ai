import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 使用演示用户作为作者
const DEMO_USER_ID = 'cmgqgqoao00009kkjufo1rlhd';

const seedWorkflows = [
  // 办公效率类 (5个)
  {
    title: 'ChatGPT智能写周报',
    description: '使用ChatGPT快速生成结构化周报，包含本周工作总结、下周计划和数据分析',
    category: '办公效率',
    tags: ['ChatGPT', '周报', '办公自动化', '文档生成'],
    difficulty: 'beginner',
    estimatedTime: 5,
    aiTools: ['ChatGPT'],
    steps: [
      {
        order: 1,
        title: '整理本周工作内容',
        description: '列出本周完成的主要任务、项目进展、数据成果',
        toolsUsed: [],
        tips: '可以从日历、任务管理工具中导出关键信息'
      },
      {
        order: 2,
        title: '使用ChatGPT生成周报',
        description: '将工作内容输入ChatGPT，使用prompt: "请根据以下内容生成一份结构化周报，包含：1.本周工作总结 2.重点成果 3.遇到的问题 4.下周计划"',
        toolsUsed: ['ChatGPT'],
        tips: '可以要求ChatGPT调整语气、补充数据分析'
      },
      {
        order: 3,
        title: '优化和调整',
        description: '根据ChatGPT生成的初稿，进行个性化调整和数据补充',
        toolsUsed: [],
        tips: '保留真实数据，调整表述方式'
      }
    ],
    inputExample: '本周完成：1. 完成用户系统开发 2. 修复10个bug 3. 上线新功能',
    outputExample: '# 本周工作总结\n\n## 一、核心工作完成情况\n1. 用户系统开发...\n\n## 二、重点成果\n...',
    tips: '建议先准备好关键数据和成果，让AI生成框架后再补充细节',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },
  {
    title: 'AI邮件助手 - 专业邮件快速撰写',
    description: '使用ChatGPT生成各类专业邮件，包括商务洽谈、会议邀请、跟进邮件等',
    category: '办公效率',
    tags: ['ChatGPT', '邮件', '商务沟通'],
    difficulty: 'beginner',
    estimatedTime: 3,
    aiTools: ['ChatGPT'],
    steps: [
      {
        order: 1,
        title: '明确邮件目的',
        description: '确定邮件类型（商务洽谈/会议邀请/感谢信/跟进等）和核心诉求',
        toolsUsed: [],
        tips: '列出3-5个关键信息点'
      },
      {
        order: 2,
        title: '使用ChatGPT生成邮件',
        description: 'Prompt模板："请帮我撰写一封[邮件类型]给[收件人]，目的是[具体目的]，语气[正式/友好]，包含以下要点：[列出要点]"',
        toolsUsed: ['ChatGPT'],
        tips: '可以指定语气风格：正式、友好、简洁等'
      },
      {
        order: 3,
        title: '个性化调整',
        description: '检查并调整细节，添加个人化内容',
        toolsUsed: [],
        tips: '保留AI的结构，添加真实细节和个人色彩'
      }
    ],
    inputExample: '目的：邀请客户参加产品发布会，时间12月10日，地点上海，提供晚宴',
    outputExample: '尊敬的XX先生/女士：\n\n我司将于12月10日在上海举办新品发布会...',
    tips: '对于重要邮件，建议生成2-3个版本后选择最优',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },
  {
    title: 'Excel数据分析 + AI洞察',
    description: '将Excel数据导入ChatGPT进行智能分析，生成可视化建议和业务洞察',
    category: '办公效率',
    tags: ['ChatGPT', 'Excel', '数据分析'],
    difficulty: 'intermediate',
    estimatedTime: 15,
    aiTools: ['ChatGPT', 'Excel'],
    steps: [
      {
        order: 1,
        title: '准备数据',
        description: '将Excel数据整理为清晰的格式，复制需要分析的数据表',
        toolsUsed: ['Excel'],
        tips: '保留表头，数据不超过100行效果最佳'
      },
      {
        order: 2,
        title: 'ChatGPT数据分析',
        description: 'Prompt："我有以下数据[粘贴数据]，请分析：1.关键趋势 2.异常值 3.业务建议 4.可视化方案"',
        toolsUsed: ['ChatGPT'],
        tips: 'GPT-4有更好的数据理解能力'
      },
      {
        order: 3,
        title: '生成图表',
        description: '根据ChatGPT建议在Excel中创建图表，或让AI生成Python代码自动绘图',
        toolsUsed: ['Excel', 'ChatGPT'],
        tips: '可以让ChatGPT生成Excel公式或VBA代码'
      }
    ],
    inputExample: '月度销售数据：1月100万，2月120万，3月95万...',
    outputExample: '分析结果：\n1. 趋势：整体上升但3月出现下滑\n2. 建议：调查3月下滑原因...',
    tips: 'Code Interpreter功能可以直接上传Excel文件进行分析',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },
  {
    title: 'AI会议纪要生成器',
    description: '将会议录音/文字转换为结构化会议纪要，包含决议事项、待办任务和责任人',
    category: '办公效率',
    tags: ['ChatGPT', '会议', '纪要', '语音转文字'],
    difficulty: 'intermediate',
    estimatedTime: 10,
    aiTools: ['ChatGPT', 'Whisper', '讯飞听见'],
    steps: [
      {
        order: 1,
        title: '语音转文字',
        description: '使用讯飞听见、Whisper或录音笔将会议录音转为文字稿',
        toolsUsed: ['讯飞听见', 'Whisper'],
        tips: '建议使用专业工具，准确率更高'
      },
      {
        order: 2,
        title: 'ChatGPT提炼纪要',
        description: 'Prompt："请将以下会议内容整理为纪要，包含：1.会议主题 2.讨论要点 3.决议事项 4.待办任务（含责任人和截止时间）"',
        toolsUsed: ['ChatGPT'],
        tips: '对于长文本，可以分段处理'
      },
      {
        order: 3,
        title: '格式化输出',
        description: '将纪要导出为Word/PDF，发送给参会人员',
        toolsUsed: [],
        tips: '可以让ChatGPT直接生成Markdown格式'
      }
    ],
    inputExample: '会议录音文本：大家好，今天讨论新项目进度...',
    outputExample: '# 会议纪要\n\n时间：2024-11-04\n主题：项目进度讨论\n\n## 决议事项\n1. ...',
    tips: '重要会议建议人工复核，确保关键信息准确',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },
  {
    title: 'PPT大纲 + AI辅助设计',
    description: '使用ChatGPT生成PPT大纲和内容，配合Gamma/Tome快速制作演示文稿',
    category: '办公效率',
    tags: ['ChatGPT', 'PPT', '演示', 'Gamma'],
    difficulty: 'intermediate',
    estimatedTime: 20,
    aiTools: ['ChatGPT', 'Gamma', 'Canva'],
    steps: [
      {
        order: 1,
        title: '生成PPT大纲',
        description: 'Prompt："我需要制作一个关于[主题]的PPT，受众是[目标人群]，时长[X分钟]，请生成详细大纲"',
        toolsUsed: ['ChatGPT'],
        tips: '说明PPT目的、受众、时长等关键信息'
      },
      {
        order: 2,
        title: '扩充每页内容',
        description: '针对每页让ChatGPT生成详细内容、数据支撑和视觉建议',
        toolsUsed: ['ChatGPT'],
        tips: '要求ChatGPT提供图表类型建议'
      },
      {
        order: 3,
        title: 'AI设计工具生成',
        description: '使用Gamma.app或Tome将大纲一键生成精美PPT，或手动在PowerPoint中制作',
        toolsUsed: ['Gamma', 'PowerPoint'],
        tips: 'Gamma可以直接从文本生成完整PPT'
      }
    ],
    inputExample: '主题：2024年度销售总结，受众：管理层，时长：15分钟',
    outputExample: '大纲：\n1. 封面\n2. 年度概览\n3. 关键数据\n4. 成功案例\n5. 挑战与应对\n6. 2025展望',
    tips: 'Gamma.app可以免费使用，效果接近专业设计',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },

  // 内容创作类 (5个)
  {
    title: '小红书爆款文案生成',
    description: '使用AI生成小红书风格的种草文案，包含标题、正文和话题标签',
    category: '内容创作',
    tags: ['ChatGPT', '小红书', '文案', '种草'],
    difficulty: 'beginner',
    estimatedTime: 10,
    aiTools: ['ChatGPT', 'Notion AI'],
    steps: [
      {
        order: 1,
        title: '确定产品卖点',
        description: '列出产品的3-5个核心卖点和目标用户痛点',
        toolsUsed: [],
        tips: '关注用户真实需求，而非产品功能'
      },
      {
        order: 2,
        title: 'AI生成文案',
        description: 'Prompt："请生成一篇小红书种草文案，产品：[产品名]，卖点：[列出卖点]，风格：真诚分享，包含emoji，字数300字左右"',
        toolsUsed: ['ChatGPT'],
        tips: '要求添加emoji和换行，提升可读性'
      },
      {
        order: 3,
        title: '优化标题和标签',
        description: '生成3-5个吸引眼球的标题选项，添加热门话题标签',
        toolsUsed: ['ChatGPT'],
        tips: '标题要包含数字、痛点或好处'
      }
    ],
    inputExample: '产品：便携榨汁杯，卖点：300ml小巧、USB充电、清洗方便',
    outputExample: '🍹健身党必备！这个榨汁杯改变了我的早餐\n\n姐妹们！之前每天早上都懒得做果汁...',
    tips: '多生成几个版本，选择最自然的表达',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },
  {
    title: 'YouTube视频脚本创作',
    description: '使用AI生成YouTube视频脚本，包含开场、正文、转场和结尾话术',
    category: '内容创作',
    tags: ['ChatGPT', 'YouTube', '视频脚本', '短视频'],
    difficulty: 'intermediate',
    estimatedTime: 20,
    aiTools: ['ChatGPT', 'Claude'],
    steps: [
      {
        order: 1,
        title: '确定视频选题',
        description: '明确视频主题、时长、目标观众和核心价值',
        toolsUsed: [],
        tips: '参考同类热门视频，找差异化角度'
      },
      {
        order: 2,
        title: '生成脚本大纲',
        description: 'Prompt："请为[主题]YouTube视频生成脚本大纲，时长[X分钟]，包含：开场钩子、3-5个要点、转场话术、CTA结尾"',
        toolsUsed: ['ChatGPT'],
        tips: '开场3秒钩子非常关键'
      },
      {
        order: 3,
        title: '扩展详细脚本',
        description: '对每个部分让AI生成详细话术，包含停顿、语气提示',
        toolsUsed: ['ChatGPT'],
        tips: '要求标注重点词和停顿位置'
      },
      {
        order: 4,
        title: '优化和排练',
        description: '朗读脚本，调整不自然的表达，添加个人风格',
        toolsUsed: [],
        tips: '计时排练，确保时长符合预期'
      }
    ],
    inputExample: '主题：5个提高专注力的方法，时长：8分钟，目标：职场人士',
    outputExample: '【0:00 开场】\n大家好！你是不是经常工作时走神，一天下来效率超低？\n\n【0:15 引入】\n今天分享5个我亲测有效的专注力提升方法...',
    tips: '可以让AI生成B-roll镜头建议和字幕文案',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },
  {
    title: 'AI博客文章快速写作',
    description: '使用ChatGPT完成从选题、大纲到成文的完整博客创作流程',
    category: '内容创作',
    tags: ['ChatGPT', '博客', 'SEO', '写作'],
    difficulty: 'intermediate',
    estimatedTime: 30,
    aiTools: ['ChatGPT', 'Jasper', 'Copy.ai'],
    steps: [
      {
        order: 1,
        title: 'SEO选题研究',
        description: '让ChatGPT分析关键词，生成10个相关主题建议',
        toolsUsed: ['ChatGPT'],
        tips: '可以结合Google Trends验证热度'
      },
      {
        order: 2,
        title: '生成文章大纲',
        description: 'Prompt："请为[主题]生成博客大纲，包含引言、3-5个小标题、结论，目标读者：[人群]"',
        toolsUsed: ['ChatGPT'],
        tips: '要求包含关键词和内链建议'
      },
      {
        order: 3,
        title: '逐段生成内容',
        description: '针对每个小节让AI扩展为300-500字段落，保持风格一致',
        toolsUsed: ['ChatGPT'],
        tips: '分段生成比一次性生成质量更高'
      },
      {
        order: 4,
        title: 'SEO优化',
        description: '优化标题、添加内外链、生成meta描述',
        toolsUsed: ['ChatGPT'],
        tips: '让AI生成3个SEO友好的标题选项'
      }
    ],
    inputExample: '关键词：ChatGPT提示词技巧，目标：AI初学者',
    outputExample: '# 10个ChatGPT提示词技巧，让AI输出质量提升10倍\n\n你是否发现...',
    tips: 'ChatGPT生成的内容需要人工润色和事实核查',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },
  {
    title: '社交媒体配图 + AI生成',
    description: '使用Midjourney/Stable Diffusion生成社交媒体配图',
    category: '内容创作',
    tags: ['Midjourney', 'Stable Diffusion', '配图', '设计'],
    difficulty: 'intermediate',
    estimatedTime: 15,
    aiTools: ['Midjourney', 'Stable Diffusion', 'ChatGPT'],
    steps: [
      {
        order: 1,
        title: '确定视觉风格',
        description: '根据内容主题确定配图风格：扁平化/插画/3D/摄影等',
        toolsUsed: [],
        tips: '保持品牌视觉一致性'
      },
      {
        order: 2,
        title: 'ChatGPT生成提示词',
        description: 'Prompt："请为[主题]的社交媒体配图生成Midjourney提示词，风格：[风格]，元素：[元素]"',
        toolsUsed: ['ChatGPT'],
        tips: '包含风格、颜色、构图等细节'
      },
      {
        order: 3,
        title: 'AI工具生成图片',
        description: '在Midjourney或SD中使用提示词生成，选择最佳结果',
        toolsUsed: ['Midjourney', 'Stable Diffusion'],
        tips: '多生成几张，选择最符合的'
      },
      {
        order: 4,
        title: '后期调整',
        description: '使用Canva或Figma添加文字、调整尺寸',
        toolsUsed: ['Canva', 'Figma'],
        tips: '不同平台有不同尺寸要求'
      }
    ],
    inputExample: '主题：时间管理技巧，风格：简约扁平化，色调：蓝色系',
    outputExample: 'Midjourney提示词：minimalist flat design illustration of time management, clock and calendar elements, blue color scheme, clean composition --ar 16:9',
    tips: 'Midjourney V6对中文提示词支持更好',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },
  {
    title: '短视频脚本批量生成',
    description: '批量生成抖音/快手短视频脚本，包含黄金3秒和完整剧本',
    category: '内容创作',
    tags: ['ChatGPT', '短视频', '抖音', '剧本'],
    difficulty: 'beginner',
    estimatedTime: 15,
    aiTools: ['ChatGPT', 'Notion AI'],
    steps: [
      {
        order: 1,
        title: '确定账号定位',
        description: '明确账号类型（知识分享/搞笑/美食/教程等）和目标用户',
        toolsUsed: [],
        tips: '分析同类账号的爆款视频'
      },
      {
        order: 2,
        title: '批量生成选题',
        description: 'Prompt："为[账号类型]生成20个短视频选题，每个包含标题和亮点"',
        toolsUsed: ['ChatGPT'],
        tips: '筛选出最有潜力的5-10个'
      },
      {
        order: 3,
        title: '生成详细脚本',
        description: '对每个选题生成：黄金3秒钩子 + 主体内容 + 结尾CTA，格式化输出',
        toolsUsed: ['ChatGPT'],
        tips: '注明镜头切换和字幕'
      }
    ],
    inputExample: '账号类型：职场干货，目标用户：打工人',
    outputExample: '【0-3秒】老板最讨厌员工做的3件事\n【主体】第一：工作邮件回复慢...\n【结尾】关注我，每天分享职场干货',
    tips: '定期更新热点选题库，保持内容新鲜度',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },

  // 设计类 (3个)
  {
    title: 'Midjourney LOGO设计全流程',
    description: '使用Midjourney生成品牌LOGO，从概念到成品的完整流程',
    category: '设计',
    tags: ['Midjourney', 'LOGO', '品牌设计'],
    difficulty: 'advanced',
    estimatedTime: 30,
    aiTools: ['Midjourney', 'ChatGPT', 'Vectorizer.ai'],
    steps: [
      {
        order: 1,
        title: '品牌分析',
        description: '确定品牌定位、目标用户、行业属性和视觉风格偏好',
        toolsUsed: [],
        tips: '收集3-5个喜欢的参考LOGO'
      },
      {
        order: 2,
        title: 'ChatGPT生成提示词',
        description: 'Prompt："请为[品牌]生成Midjourney LOGO提示词，行业：[行业]，风格：[风格]，要求：简洁、可识别、适合小尺寸"',
        toolsUsed: ['ChatGPT'],
        tips: '强调minimalist, vector, clean等关键词'
      },
      {
        order: 3,
        title: 'Midjourney生成',
        description: '使用提示词生成多个版本，参数：--v 6 --s 250',
        toolsUsed: ['Midjourney'],
        tips: '尝试不同seed值获得更多变化'
      },
      {
        order: 4,
        title: '矢量化和精修',
        description: '使用Vectorizer.ai转为矢量格式，在AI/Figma中精修',
        toolsUsed: ['Vectorizer.ai', 'Adobe Illustrator'],
        tips: '调整细节，确保各尺寸下都清晰'
      }
    ],
    inputExample: '品牌：科技教育平台，风格：现代简约，颜色：蓝紫渐变',
    outputExample: 'minimalist tech education logo, abstract book and circuit elements, blue purple gradient, vector style, clean design, white background --v 6',
    tips: 'LOGO需要多轮迭代，不要期望一次成功',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },
  {
    title: 'AI海报设计 - Canva + Midjourney',
    description: '结合Midjourney生成主视觉和Canva排版，快速完成海报设计',
    category: '设计',
    tags: ['Midjourney', 'Canva', '海报', '平面设计'],
    difficulty: 'intermediate',
    estimatedTime: 20,
    aiTools: ['Midjourney', 'Canva', 'ChatGPT'],
    steps: [
      {
        order: 1,
        title: '确定海报主题',
        description: '明确海报用途、尺寸、核心信息和视觉风格',
        toolsUsed: [],
        tips: '列出必须包含的文字信息'
      },
      {
        order: 2,
        title: 'Midjourney生成主视觉',
        description: '生成海报背景或主要图形元素',
        toolsUsed: ['Midjourney'],
        tips: '使用--ar参数控制比例，如--ar 2:3'
      },
      {
        order: 3,
        title: 'Canva排版',
        description: '在Canva中导入AI图片，添加文字、图标和装饰元素',
        toolsUsed: ['Canva'],
        tips: 'Canva模板可以加速设计'
      },
      {
        order: 4,
        title: '导出和优化',
        description: '导出高清PDF/PNG，检查文字可读性',
        toolsUsed: ['Canva'],
        tips: '打印海报要使用300dpi'
      }
    ],
    inputExample: '活动：新年促销，尺寸：A3，风格：喜庆现代',
    outputExample: 'Chinese new year sale poster background, red and gold color, modern minimalist, festive elements, high quality --ar 2:3',
    tips: '主视觉不要太复杂，留白足够放文字',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },
  {
    title: 'AI UI设计 - Figma插件辅助',
    description: '使用AI插件加速UI设计，包括配色、图标、文案生成',
    category: '设计',
    tags: ['Figma', 'UI设计', 'ChatGPT', '配色'],
    difficulty: 'advanced',
    estimatedTime: 40,
    aiTools: ['Figma', 'ChatGPT', 'Galileo AI'],
    steps: [
      {
        order: 1,
        title: 'ChatGPT生成设计方案',
        description: 'Prompt："请为[产品]生成UI设计方案，包括：布局建议、配色方案、关键页面列表"',
        toolsUsed: ['ChatGPT'],
        tips: '提供产品定位和目标用户信息'
      },
      {
        order: 2,
        title: '使用Galileo AI生成界面',
        description: '输入文字描述，让AI生成初版UI设计',
        toolsUsed: ['Galileo AI'],
        tips: '生成的设计可作为灵感参考'
      },
      {
        order: 3,
        title: 'Figma精修',
        description: '在Figma中调整布局、替换图标、优化细节',
        toolsUsed: ['Figma'],
        tips: '使用Figma AI插件生成占位文案'
      },
      {
        order: 4,
        title: '生成设计规范',
        description: '让ChatGPT帮助整理颜色值、字号、间距等设计规范',
        toolsUsed: ['ChatGPT'],
        tips: '建立Design Token确保一致性'
      }
    ],
    inputExample: '产品：健身APP首页，风格：活力现代，色调：橙色系',
    outputExample: '配色方案：\n主色：#FF6B35 活力橙\n辅色：#004E89 深蓝\n背景：#F7F7F7 浅灰\n\n布局：上下结构...',
    tips: 'AI生成的UI需要符合可用性原则，不能盲目使用',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },

  // 编程类 (4个)
  {
    title: 'GitHub Copilot 加速编码',
    description: '使用GitHub Copilot提升编码效率，包括代码补全、函数生成、测试编写',
    category: '编程开发',
    tags: ['GitHub Copilot', '代码补全', '效率'],
    difficulty: 'intermediate',
    estimatedTime: 10,
    aiTools: ['GitHub Copilot', 'VS Code'],
    steps: [
      {
        order: 1,
        title: '安装和配置Copilot',
        description: '在VS Code中安装Copilot插件，登录GitHub账号激活',
        toolsUsed: ['GitHub Copilot', 'VS Code'],
        tips: '学生和开源贡献者可免费使用'
      },
      {
        order: 2,
        title: '使用注释引导',
        description: '写清晰的注释描述需求，Copilot会自动生成代码',
        toolsUsed: ['GitHub Copilot'],
        tips: '注释要具体，包含输入输出示例'
      },
      {
        order: 3,
        title: '快速生成测试',
        description: '在测试文件中写函数名，Copilot会建议测试用例',
        toolsUsed: ['GitHub Copilot'],
        tips: '多看几个建议，选择最合适的'
      }
    ],
    inputExample: '// 函数：计算数组中所有偶数的和',
    outputExample: 'function sumEvenNumbers(arr: number[]): number {\n  return arr.filter(n => n % 2 === 0).reduce((sum, n) => sum + n, 0);\n}',
    tips: 'Copilot生成的代码要review，不能直接使用',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },
  {
    title: 'ChatGPT代码审查助手',
    description: '使用ChatGPT审查代码，发现潜在bug、性能问题和安全隐患',
    category: '编程开发',
    tags: ['ChatGPT', '代码审查', 'Code Review'],
    difficulty: 'intermediate',
    estimatedTime: 15,
    aiTools: ['ChatGPT', 'Claude'],
    steps: [
      {
        order: 1,
        title: '准备代码片段',
        description: '复制需要审查的代码（建议不超过200行）',
        toolsUsed: [],
        tips: '包含必要的上下文信息'
      },
      {
        order: 2,
        title: 'ChatGPT审查',
        description: 'Prompt："请审查以下代码，指出：1.潜在bug 2.性能问题 3.安全隐患 4.可读性改进 5.最佳实践建议"',
        toolsUsed: ['ChatGPT'],
        tips: 'GPT-4对代码理解更准确'
      },
      {
        order: 3,
        title: '逐项优化',
        description: '根据建议逐项修改代码，让AI生成改进版本',
        toolsUsed: ['ChatGPT'],
        tips: '重要逻辑改动要人工double check'
      }
    ],
    inputExample: 'function processData(data) { /* 代码 */ }',
    outputExample: '审查结果：\n1. Bug：未检查data是否为null\n2. 性能：多次遍历可合并\n3. 建议：添加类型注解',
    tips: '对于关键代码，结合人工code review效果最佳',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },
  {
    title: 'AI Debug调试助手',
    description: '使用ChatGPT分析错误日志，快速定位和解决bug',
    category: '编程开发',
    tags: ['ChatGPT', 'Debug', '错误排查'],
    difficulty: 'beginner',
    estimatedTime: 10,
    aiTools: ['ChatGPT', 'Claude'],
    steps: [
      {
        order: 1,
        title: '收集错误信息',
        description: '复制完整的错误堆栈、相关代码和运行环境信息',
        toolsUsed: [],
        tips: '包含错误发生的上下文'
      },
      {
        order: 2,
        title: 'AI诊断',
        description: 'Prompt："我遇到以下错误[粘贴错误]，相关代码：[代码]，请帮我分析原因和解决方案"',
        toolsUsed: ['ChatGPT'],
        tips: '说明已经尝试过的解决方法'
      },
      {
        order: 3,
        title: '测试方案',
        description: '按照AI建议尝试修复，记录结果',
        toolsUsed: [],
        tips: '一次只改一处，便于定位有效方案'
      }
    ],
    inputExample: 'TypeError: Cannot read property \'length\' of undefined at processArray',
    outputExample: '原因：processArray收到了undefined而非数组\n解决：\n1. 添加参数验证\n2. 检查调用处...',
    tips: '复杂bug建议结合断点调试',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },
  {
    title: 'Cursor AI全栈开发',
    description: '使用Cursor IDE的AI功能加速全栈项目开发',
    category: '编程开发',
    tags: ['Cursor', 'AI编程', '全栈开发'],
    difficulty: 'advanced',
    estimatedTime: 60,
    aiTools: ['Cursor', 'ChatGPT'],
    steps: [
      {
        order: 1,
        title: '项目初始化',
        description: '使用Cursor的Cmd+K生成项目架构和配置文件',
        toolsUsed: ['Cursor'],
        tips: '描述清楚技术栈和项目需求'
      },
      {
        order: 2,
        title: 'AI生成功能模块',
        description: '使用Cmd+K选中文件，描述需求让AI生成代码',
        toolsUsed: ['Cursor'],
        tips: 'Cursor能理解整个项目上下文'
      },
      {
        order: 3,
        title: 'AI重构和优化',
        description: '选中代码，使用AI进行重构、性能优化',
        toolsUsed: ['Cursor'],
        tips: 'Cursor可以帮你重命名、抽取函数等'
      },
      {
        order: 4,
        title: '自动测试生成',
        description: '让Cursor为函数生成单元测试',
        toolsUsed: ['Cursor'],
        tips: '测试覆盖率要人工review'
      }
    ],
    inputExample: '需求：创建一个用户认证API',
    outputExample: 'Cursor生成：\n- src/routes/auth.ts\n- src/middleware/auth.ts\n- src/utils/jwt.ts\n- tests/auth.test.ts',
    tips: 'Cursor配合Claude模型效果最佳',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },

  // 学习提升类 (3个)
  {
    title: 'AI知识总结 - 长文档提炼',
    description: '使用AI快速总结长篇文章、论文、书籍的核心要点',
    category: '学习提升',
    tags: ['ChatGPT', 'Claude', '知识总结', '学习'],
    difficulty: 'beginner',
    estimatedTime: 10,
    aiTools: ['ChatGPT', 'Claude', 'Notion AI'],
    steps: [
      {
        order: 1,
        title: '准备材料',
        description: '复制文章/PDF文本，或上传文件（Claude支持PDF）',
        toolsUsed: [],
        tips: 'Claude 100K上下文可处理更长文档'
      },
      {
        order: 2,
        title: 'AI提炼要点',
        description: 'Prompt："请总结以下文章的：1.核心观点 2.关键论据 3.实践建议 4.可行动清单"',
        toolsUsed: ['ChatGPT', 'Claude'],
        tips: '可以要求生成思维导图结构'
      },
      {
        order: 3,
        title: '知识卡片化',
        description: '将总结整理为Anki卡片或Notion笔记',
        toolsUsed: ['Notion', 'Anki'],
        tips: '用自己的话改写，加深记忆'
      }
    ],
    inputExample: '15000字的深度文章',
    outputExample: '核心观点：\n1. ...\n2. ...\n\n关键论据：\n- ...\n\n可行动清单：\n✓ ...',
    tips: 'AI总结要对照原文验证准确性',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },
  {
    title: 'ChatGPT辅助英语学习',
    description: '使用ChatGPT进行口语练习、作文批改、单词记忆',
    category: '学习提升',
    tags: ['ChatGPT', '英语学习', '口语', '写作'],
    difficulty: 'beginner',
    estimatedTime: 20,
    aiTools: ['ChatGPT', 'ChatGPT Voice'],
    steps: [
      {
        order: 1,
        title: '口语模拟对话',
        description: 'Prompt："Let\'s have a conversation about [topic]. Please correct my grammar and suggest better expressions."',
        toolsUsed: ['ChatGPT'],
        tips: '使用语音模式练习发音'
      },
      {
        order: 2,
        title: '作文批改',
        description: '写完英文作文后让ChatGPT批改语法、用词和结构',
        toolsUsed: ['ChatGPT'],
        tips: '要求给出具体改进建议'
      },
      {
        order: 3,
        title: '单词例句生成',
        description: '输入生词，让AI生成多个实用例句和记忆技巧',
        toolsUsed: ['ChatGPT'],
        tips: '要求生成适合自己水平的例句'
      }
    ],
    inputExample: 'Topic: My weekend plans',
    outputExample: 'ChatGPT: What are you planning to do this weekend?\nYou: I will go shopping... (AI会纠正并建议)',
    tips: '每天坚持20分钟对话练习，效果显著',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  },
  {
    title: 'AI思维导图生成',
    description: '使用ChatGPT生成思维导图结构，配合工具可视化',
    category: '学习提升',
    tags: ['ChatGPT', '思维导图', 'Xmind', '知识管理'],
    difficulty: 'beginner',
    estimatedTime: 10,
    aiTools: ['ChatGPT', 'Xmind', 'Markmap'],
    steps: [
      {
        order: 1,
        title: '确定主题',
        description: '明确思维导图的中心主题和目的（学习/头脑风暴/项目规划等）',
        toolsUsed: [],
        tips: '主题要聚焦，不宜过大'
      },
      {
        order: 2,
        title: 'AI生成结构',
        description: 'Prompt："请为[主题]生成思维导图大纲，包含3-5个主分支，每个分支下2-4个子节点"',
        toolsUsed: ['ChatGPT'],
        tips: '要求输出Markdown或文本格式'
      },
      {
        order: 3,
        title: '可视化',
        description: '将结构导入Xmind、Markmap或其他工具生成可视化导图',
        toolsUsed: ['Xmind', 'Markmap'],
        tips: 'Markmap可以直接从Markdown生成'
      }
    ],
    inputExample: '主题：产品经理必备技能',
    outputExample: '中心：产品经理必备技能\n- 需求分析\n  - 用户调研\n  - 数据分析\n- 原型设计\n...',
    tips: 'AI生成的结构可作为起点，根据需要调整',
    sourceType: 'manual',
    sourceUrl: null,
    authorId: 'system'
  }
];

async function seed() {
  console.log('🌱 开始添加种子工作流数据...');

  // 确保存在系统用户
  let systemUser = await prisma.user.findFirst({
    where: { email: 'system@workflow.com' }
  });

  if (!systemUser) {
    console.log('创建系统用户...');
    systemUser = await prisma.user.create({
      data: {
        name: '系统管理员',
        email: 'system@workflow.com',
        password: 'system-account-no-login'
      }
    });
    console.log(`✓ 系统用户已创建: ${systemUser.id}`);
  } else {
    console.log(`✓ 使用已有系统用户: ${systemUser.id}`);
  }

  const SYSTEM_USER_ID = systemUser.id;

  for (const workflow of seedWorkflows) {
    try {
      await prisma.workflow.create({
        data: {
          title: workflow.title,
          description: workflow.description,
          category: workflow.category,
          tags: workflow.tags.join(','),
          sourceType: workflow.sourceType || 'manual',
          sourceUrl: workflow.sourceUrl,
          sourceTitle: workflow.title,
          authorId: SYSTEM_USER_ID,
          isPublic: true,
          isTemplate: true,
          config: {
            nodes: [],
            edges: []
          },
          sourceMeta: {
            difficulty: workflow.difficulty,
            estimatedTime: workflow.estimatedTime,
            aiTools: workflow.aiTools,
            steps: workflow.steps,
            tips: workflow.tips
          },
          exampleInput: workflow.inputExample ? { text: workflow.inputExample } : undefined,
          exampleOutput: workflow.outputExample ? { text: workflow.outputExample } : undefined
        },
      });
      console.log(`✓ 已添加: ${workflow.title}`);
    } catch (error) {
      console.error(`✗ 添加失败: ${workflow.title}`, error);
    }
  }

  console.log('\n✅ 种子数据添加完成！');
  console.log(`共添加 ${seedWorkflows.length} 个工作流`);
}

seed()
  .catch((e) => {
    console.error('错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
