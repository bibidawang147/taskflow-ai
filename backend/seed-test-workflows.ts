import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始创建测试工作流...')

  // 获取第一个用户作为作者
  const user = await prisma.user.findFirst()
  if (!user) {
    console.error('❌ 没有找到用户，请先创建用户')
    return
  }

  console.log('✅ 使用用户:', user.name, user.id)

  // 工作流 1: 小红书文案创作
  const workflow1 = await prisma.workflow.create({
    data: {
      title: '小红书爆款文案生成器',
      description: '一键生成小红书风格的种草文案，包含标题、正文、话题标签',
      category: '内容创作',
      tags: '小红书,文案,营销',
      isPublic: true,
      isDraft: false,
      authorId: user.id,
      version: '1.0.0',
      config: {
        nodes: [
          {
            id: 'node-1',
            type: 'ai',
            label: '分析产品特点',
            config: {
              goal: '分析产品特点',
              prompt: '请分析以下产品的核心特点、目标用户和使用场景：\n\n产品名称：{product_name}\n产品描述：{product_description}\n\n请从以下维度分析：\n1. 核心卖点（3-5个）\n2. 目标用户画像\n3. 使用场景\n4. 情感价值',
              provider: 'OpenAI',
              model: 'GPT-4',
              temperature: 0.7,
              maxTokens: 2000,
              alternativeModels: [
                { brand: '', name: 'ChatGPT', url: '' }
              ]
            },
            position: { x: 100, y: 100 }
          },
          {
            id: 'node-2',
            type: 'ai',
            label: '生成吸睛标题',
            config: {
              goal: '生成吸睛标题',
              prompt: '基于上一步的产品分析，生成5个小红书风格的标题，要求：\n\n1. 包含emoji表情\n2. 使用数字、感叹号等符号\n3. 制造好奇心和紧迫感\n4. 突出核心卖点\n5. 字数控制在20字以内\n\n示例风格：\n❤️ 真香！这款xx让我省了3000块！\n🔥 姐妹们冲！xx好用到尖叫\n💰 学生党必看！平价xx也能高级感满满',
              provider: 'OpenAI',
              model: 'GPT-4',
              temperature: 0.9,
              maxTokens: 1500,
              alternativeModels: [
                { brand: '', name: 'ChatGPT', url: '' }
              ]
            },
            position: { x: 100, y: 250 }
          },
          {
            id: 'node-3',
            type: 'ai',
            label: '撰写正文内容',
            config: {
              goal: '撰写正文内容',
              prompt: '使用选定的标题，撰写小红书正文内容，要求：\n\n1. 开头：用亲切的语气引入话题\n2. 正文：分3-4个小段落介绍产品优势\n3. 每段加上合适的emoji\n4. 使用"姐妹们"、"宝子们"等亲切称呼\n5. 结尾：引导互动（点赞、收藏、评论）\n6. 总字数300-500字\n\n风格要求：\n- 真实、接地气\n- 多用短句\n- 适当夸张但不虚假',
              provider: 'OpenAI',
              model: 'GPT-4',
              temperature: 0.8,
              maxTokens: 2000,
              alternativeModels: [
                { brand: '', name: 'ChatGPT', url: '' }
              ]
            },
            position: { x: 100, y: 400 }
          },
          {
            id: 'node-4',
            type: 'ai',
            label: '生成话题标签',
            config: {
              goal: '生成话题标签',
              prompt: '基于完整文案，生成10-15个相关话题标签，包括：\n\n1. 产品相关标签（3-4个）\n2. 品类标签（2-3个）\n3. 场景标签（2-3个）\n4. 热门话题标签（3-4个）\n\n格式：#标签名称\n\n示例：\n#好物分享 #种草推荐 #学生党必备 #平价好物 #护肤心得',
              provider: 'OpenAI',
              model: 'GPT-4',
              temperature: 0.7,
              maxTokens: 1000,
              alternativeModels: [
                { brand: '', name: 'ChatGPT', url: '' }
              ]
            },
            position: { x: 100, y: 550 }
          }
        ]
      }
    }
  })

  console.log('✅ 创建工作流 1:', workflow1.title)

  // 工作流 2: 产品需求文档生成
  const workflow2 = await prisma.workflow.create({
    data: {
      title: 'PRD产品需求文档生成',
      description: '快速生成规范的产品需求文档，包含背景、目标、功能列表、交互流程',
      category: '产品设计',
      tags: 'PRD,产品,需求文档',
      isPublic: true,
      isDraft: false,
      authorId: user.id,
      version: '1.0.0',
      config: {
        nodes: [
          {
            id: 'node-1',
            type: 'ai',
            label: '整理需求背景',
            config: {
              goal: '整理需求背景',
              prompt: '请根据以下信息整理需求背景：\n\n需求描述：{requirement_description}\n目标用户：{target_users}\n业务目标：{business_goals}\n\n请输出规范的需求背景章节，包括：\n1. 需求来源\n2. 用户痛点\n3. 业务价值\n4. 竞品分析（简要）',
              provider: 'OpenAI',
              model: 'GPT-4',
              temperature: 0.6,
              maxTokens: 2000,
              alternativeModels: []
            },
            position: { x: 100, y: 100 }
          },
          {
            id: 'node-2',
            type: 'ai',
            label: '定义产品目标',
            config: {
              goal: '定义产品目标',
              prompt: '基于需求背景，明确产品目标：\n\n1. 用户目标（从用户角度）\n2. 产品目标（从产品角度）\n3. 商业目标（从业务角度）\n4. 成功指标（可量化的KPI）\n\n每个目标使用SMART原则描述（具体、可衡量、可达成、相关性、时限性）',
              provider: 'OpenAI',
              model: 'GPT-4',
              temperature: 0.5,
              maxTokens: 1500,
              alternativeModels: []
            },
            position: { x: 100, y: 250 }
          },
          {
            id: 'node-3',
            type: 'ai',
            label: '设计功能列表',
            config: {
              goal: '设计功能列表',
              prompt: '根据产品目标，设计详细的功能列表：\n\n请按优先级（P0/P1/P2）分类列出功能点：\n\nP0（核心功能 - 必须有）：\n- 功能名称\n- 功能描述\n- 用户价值\n\nP1（重要功能 - 应该有）：\n- ...\n\nP2（增强功能 - 可以有）：\n- ...\n\n每个功能包括：功能名称、详细描述、用户故事、验收标准',
              provider: 'OpenAI',
              model: 'GPT-4',
              temperature: 0.6,
              maxTokens: 2500,
              alternativeModels: []
            },
            position: { x: 100, y: 400 }
          },
          {
            id: 'node-4',
            type: 'ai',
            label: '绘制交互流程',
            config: {
              goal: '绘制交互流程',
              prompt: '为核心功能设计交互流程：\n\n使用文字描述的方式，输出主要用户路径和交互流程：\n\n1. 用户进入场景\n2. 触发操作\n3. 系统响应\n4. 异常处理\n5. 完成/退出\n\n对于复杂流程，使用Mermaid流程图语法描述。',
              provider: 'OpenAI',
              model: 'GPT-4',
              temperature: 0.5,
              maxTokens: 2000,
              alternativeModels: []
            },
            position: { x: 100, y: 550 }
          },
          {
            id: 'node-5',
            type: 'ai',
            label: '补充技术说明',
            config: {
              goal: '补充技术说明',
              prompt: '为PRD添加技术相关说明：\n\n1. 技术约束和限制\n2. 数据字段定义\n3. 接口要求（如需要）\n4. 性能要求\n5. 安全性要求\n6. 兼容性要求\n\n注意：这部分应该给技术团队足够的上下文，但不涉及具体技术实现方案。',
              provider: 'OpenAI',
              model: 'GPT-4',
              temperature: 0.5,
              maxTokens: 1500,
              alternativeModels: []
            },
            position: { x: 100, y: 700 }
          }
        ]
      }
    }
  })

  console.log('✅ 创建工作流 2:', workflow2.title)

  // 工作流 3: 客户邮件回复
  const workflow3 = await prisma.workflow.create({
    data: {
      title: '专业客户邮件回复助手',
      description: '根据客户邮件内容生成专业、得体的回复，适用于售前咨询、售后服务等场景',
      category: '客户服务',
      tags: '邮件,客服,沟通',
      isPublic: true,
      isDraft: false,
      authorId: user.id,
      version: '1.0.0',
      config: {
        nodes: [
          {
            id: 'node-1',
            type: 'ai',
            label: '分析邮件意图',
            config: {
              goal: '分析邮件意图',
              prompt: '请分析以下客户邮件的核心意图和情绪：\n\n客户邮件：\n{customer_email}\n\n请识别：\n1. 邮件类型（咨询/投诉/反馈/求助）\n2. 客户情绪（满意/中性/不满/愤怒）\n3. 核心诉求（1-3点）\n4. 紧急程度（高/中/低）\n5. 需要重点回应的问题',
              provider: 'OpenAI',
              model: 'GPT-4',
              temperature: 0.3,
              maxTokens: 1000,
              alternativeModels: []
            },
            position: { x: 100, y: 100 }
          },
          {
            id: 'node-2',
            type: 'ai',
            label: '组织回复要点',
            config: {
              goal: '组织回复要点',
              prompt: '基于邮件分析，组织回复要点：\n\n1. 开场语（感谢/致歉/问候）\n2. 核心内容（逐一回应客户诉求）\n3. 解决方案或建议\n4. 后续跟进计划\n5. 结束语（期待/祝福）\n\n注意根据客户情绪调整语气：\n- 满意：保持专业，适度亲切\n- 中性：正式专业\n- 不满：诚恳致歉，积极解决\n- 愤怒：高度重视，紧急处理',
              provider: 'OpenAI',
              model: 'GPT-4',
              temperature: 0.4,
              maxTokens: 1500,
              alternativeModels: []
            },
            position: { x: 100, y: 250 }
          },
          {
            id: 'node-3',
            type: 'ai',
            label: '撰写邮件正文',
            config: {
              goal: '撰写邮件正文',
              prompt: '根据回复要点，撰写完整的邮件回复：\n\n要求：\n1. 使用专业、礼貌的商务语言\n2. 结构清晰，分段明确\n3. 回应所有客户关切\n4. 提供明确的解决方案或时间表\n5. 语气真诚，避免模板化\n\n邮件格式：\n- 称呼\n- 正文（3-5段）\n- 签名\n\n请直接输出可发送的邮件内容。',
              provider: 'OpenAI',
              model: 'GPT-4',
              temperature: 0.5,
              maxTokens: 2000,
              alternativeModels: []
            },
            position: { x: 100, y: 400 }
          }
        ]
      }
    }
  })

  console.log('✅ 创建工作流 3:', workflow3.title)

  // 工作流 4: 短视频脚本
  const workflow4 = await prisma.workflow.create({
    data: {
      title: '抖音短视频脚本创作',
      description: '生成抖音、快手等短视频平台的爆款脚本，包含分镜、台词、音乐建议',
      category: '短视频',
      tags: '抖音,短视频,脚本',
      isPublic: true,
      isDraft: false,
      authorId: user.id,
      version: '1.0.0',
      config: {
        nodes: [
          {
            id: 'node-1',
            type: 'ai',
            label: '确定视频主题',
            config: {
              goal: '确定视频主题',
              prompt: '基于以下信息确定视频主题和核心创意：\n\n内容方向：{content_direction}\n目标受众：{target_audience}\n视频时长：{duration}秒\n\n请输出：\n1. 视频主题（一句话概括）\n2. 核心创意点（3个）\n3. 情绪基调（搞笑/感动/惊喜/知识等）\n4. 预期效果（涨粉/带货/品宣等）',
              provider: 'OpenAI',
              model: 'GPT-4',
              temperature: 0.8,
              maxTokens: 1000,
              alternativeModels: []
            },
            position: { x: 100, y: 100 }
          },
          {
            id: 'node-2',
            type: 'ai',
            label: '设计黄金3秒',
            config: {
              goal: '设计黄金3秒',
              prompt: '设计视频开头的黄金3秒，要求：\n\n1. 画面：第一个镜头的视觉冲击\n2. 台词：开场第一句话（制造悬念/提出问题/展示结果）\n3. 音效：背景音乐或音效建议\n\n目标：在3秒内抓住用户注意力，降低划走率\n\n示例：\n- "你绝对想不到..." \n- "这个方法让我..."\n- 直接展示震撼画面',
              provider: 'OpenAI',
              model: 'GPT-4',
              temperature: 0.9,
              maxTokens: 800,
              alternativeModels: []
            },
            position: { x: 100, y: 250 }
          },
          {
            id: 'node-3',
            type: 'ai',
            label: '编写分镜脚本',
            config: {
              goal: '编写分镜脚本',
              prompt: '编写详细的分镜脚本（按时长分段）：\n\n格式：\n【第1镜】（0-3秒）\n- 画面：...\n- 台词：...\n- 字幕：...\n- 音效：...\n\n【第2镜】（3-8秒）\n...\n\n要求：\n1. 每个镜头3-5秒\n2. 画面清晰可执行\n3. 台词口语化\n4. 节奏紧凑，有起承转合',
              provider: 'OpenAI',
              model: 'GPT-4',
              temperature: 0.7,
              maxTokens: 2500,
              alternativeModels: []
            },
            position: { x: 100, y: 400 }
          },
          {
            id: 'node-4',
            type: 'ai',
            label: '优化结尾引导',
            config: {
              goal: '优化结尾引导',
              prompt: '优化视频结尾，增加互动引导：\n\n1. 结尾台词（制造期待/引导点赞关注）\n2. 结尾字幕（CTA行动号召）\n3. BGM淡出建议\n\n示例：\n- "关注我，下期更精彩"\n- "你学会了吗？点赞收藏不迷路"\n- "评论区告诉我你的想法"\n\n要求：自然不生硬，符合视频整体调性',
              provider: 'OpenAI',
              model: 'GPT-4',
              temperature: 0.7,
              maxTokens: 1000,
              alternativeModels: []
            },
            position: { x: 100, y: 550 }
          }
        ]
      }
    }
  })

  console.log('✅ 创建工作流 4:', workflow4.title)

  console.log('\n🎉 完成！共创建了 4 个测试工作流')
  console.log('\n工作流列表：')
  console.log('1.', workflow1.title, '(ID:', workflow1.id, ')')
  console.log('2.', workflow2.title, '(ID:', workflow2.id, ')')
  console.log('3.', workflow3.title, '(ID:', workflow3.id, ')')
  console.log('4.', workflow4.title, '(ID:', workflow4.id, ')')
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
