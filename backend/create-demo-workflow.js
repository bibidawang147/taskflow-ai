const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createDemoWorkflow() {
  try {
    // 获取第一个用户
    const admin = await prisma.user.findFirst()

    if (!admin) {
      console.error('未找到用户')
      return
    }

    console.log('使用用户:', admin.name, '(', admin.email, ')')

    const demoWorkflow = {
      title: '🚀 AI智能文章生成完整工作流',
      description: '从需求分析到最终发布的完整AI文章生成流程，包含SEO优化、质量检测和多语言支持',
      thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      category: '内容创作',
      tags: 'AI写作,内容生成,SEO优化,质量检测,多语言',
      version: '2.0.0',
      rating: 4.8,
      usageCount: 1250,
      authorId: admin.id,
      config: {
        nodes: [
          {
            id: 'step-1',
            type: '需求分析',
            label: '需求理解与分析',
            config: {
              goal: '深入理解用户需求，提取核心关键词和写作方向',
              provider: 'OpenAI',
              model: 'GPT-4',
              prompt: `请分析以下写作需求，提取关键信息：

输入内容：{user_input}

请输出以下内容：
1. 核心主题（1-2句话）
2. 目标受众（具体描述）
3. 文章类型（科普/教程/评测/观点等）
4. 关键词列表（5-8个）
5. 写作风格建议（专业/通俗/幽默等）
6. 预计篇幅（字数范围）

输出格式：JSON`,
              parameters: {
                temperature: 0.3,
                max_tokens: 800,
                top_p: 0.9
              }
            },
            position: { x: 100, y: 100 }
          },
          {
            id: 'step-2',
            type: '内容规划',
            label: '文章大纲生成',
            config: {
              goal: '基于需求分析结果，生成详细的文章大纲结构',
              provider: 'Anthropic',
              model: 'Claude-3-Sonnet',
              prompt: `根据需求分析结果生成文章大纲：

需求分析：{step1_output}

请生成包含以下部分的详细大纲：
1. 引人入胜的标题（3个备选）
2. 开篇引言（吸引读者注意）
3. 主体内容（3-5个主要章节，每章节包含2-3个小节）
4. 实际案例或示例（至少2个）
5. 总结与行动建议
6. 相关资源推荐

每个章节都要注明：
- 核心观点
- 预计字数
- 关键论据`,
              parameters: {
                temperature: 0.7,
                max_tokens: 1500
              }
            },
            position: { x: 100, y: 250 }
          },
          {
            id: 'step-3',
            type: '内容生成',
            label: 'AI 智能写作',
            config: {
              goal: '根据大纲生成完整、高质量的文章内容',
              provider: 'OpenAI',
              model: 'GPT-4-Turbo',
              prompt: `请根据以下大纲撰写完整文章：

大纲：{step2_output}

写作要求：
1. 语言流畅自然，逻辑严密
2. 每个段落3-5句话，段落间过渡自然
3. 使用具体数据和案例支撑观点
4. 适当使用比喻、类比等修辞手法
5. 保持客观中立，避免过度主观
6. 文章结构清晰，使用小标题分隔
7. 字数控制在 {word_count} 字左右

输出格式：Markdown`,
              parameters: {
                temperature: 0.8,
                max_tokens: 4000,
                presence_penalty: 0.3,
                frequency_penalty: 0.3
              }
            },
            position: { x: 100, y: 400 }
          },
          {
            id: 'step-4',
            type: 'SEO优化',
            label: 'SEO 优化与关键词布局',
            config: {
              goal: '对文章进行SEO优化，提升搜索引擎排名',
              provider: 'OpenAI',
              model: 'GPT-3.5-Turbo',
              prompt: `对以下文章进行SEO优化：

原文：{step3_output}

优化内容：
1. 标题优化
   - 包含主关键词
   - 控制在 60 字符内
   - 具有吸引力和点击欲望

2. Meta描述（150-160字）
   - 包含核心关键词
   - 概括文章价值
   - 包含行动号召

3. 关键词密度优化
   - 主关键词密度 2-3%
   - 长尾关键词自然融入
   - 避免关键词堆砌

4. 内部链接建议（3-5个）

5. 图片 Alt 文本建议（5个）

6. URL Slug 建议

输出格式：JSON（包含优化后的文章和SEO元数据）`,
              parameters: {
                temperature: 0.4,
                max_tokens: 2000
              }
            },
            position: { x: 100, y: 550 }
          },
          {
            id: 'step-5',
            type: '质量检测',
            label: '多维度质量检测',
            config: {
              goal: '全面检测文章质量，提供改进建议',
              provider: 'Anthropic',
              model: 'Claude-3-Opus',
              prompt: `请对以下文章进行全面质量检测：

文章内容：{step4_output}

检测维度：

1. 内容质量（权重 30%）
   - 信息准确性
   - 内容深度
   - 观点独特性
   - 实用价值

2. 语言表达（权重 25%）
   - 语法正确性
   - 用词准确性
   - 句式多样性
   - 表达流畅度

3. 逻辑结构（权重 20%）
   - 论证充分性
   - 逻辑连贯性
   - 结构完整性
   - 过渡自然性

4. 可读性（权重 15%）
   - 段落长度
   - 句子复杂度
   - 专业术语使用
   - 排版清晰度

5. SEO友好度（权重 10%）
   - 关键词布局
   - 标题吸引力
   - 元数据完整性

请为每个维度打分（1-10分）并给出：
- 总体评分
- 具体问题列表
- 改进建议（优先级排序）
- 优秀亮点

输出格式：JSON`,
              parameters: {
                temperature: 0.2,
                max_tokens: 2000
              }
            },
            position: { x: 100, y: 700 }
          },
          {
            id: 'step-6',
            type: '内容优化',
            label: '基于检测反馈优化',
            config: {
              goal: '根据质量检测结果，对文章进行针对性优化',
              provider: 'OpenAI',
              model: 'GPT-4',
              prompt: `根据质量检测报告优化文章：

原文：{step4_output}
检测报告：{step5_output}

优化要求：
1. 修复所有标记的问题
2. 实施所有高优先级改进建议
3. 保持文章原有风格和核心观点
4. 优化后总评分应提升至 8.5+ 分

请输出：
- 优化后的完整文章（Markdown格式）
- 修改说明列表
- 预期提升效果`,
              parameters: {
                temperature: 0.7,
                max_tokens: 4000
              }
            },
            position: { x: 100, y: 850 }
          },
          {
            id: 'step-7',
            type: '多语言扩展',
            label: '多语言版本生成（可选）',
            config: {
              goal: '将文章翻译为其他语言版本，扩大受众范围',
              provider: 'OpenAI',
              model: 'GPT-4',
              prompt: `将以下文章翻译为 {target_language}：

原文：{step6_output}

翻译要求：
1. 准确传达原文含义
2. 符合目标语言的表达习惯
3. 保持专业术语的准确性
4. 适应目标文化背景
5. 保留原文的格式和结构

请输出：
- 翻译后的完整文章
- 文化适配说明
- 关键术语对照表`,
              parameters: {
                temperature: 0.3,
                max_tokens: 4000
              }
            },
            position: { x: 100, y: 1000 }
          },
          {
            id: 'step-8',
            type: '发布准备',
            label: '发布素材准备',
            config: {
              goal: '准备发布所需的各种素材和配置',
              provider: 'OpenAI',
              model: 'GPT-3.5-Turbo',
              prompt: `为文章准备发布素材：

文章：{step6_output}

请生成：

1. 社交媒体文案（每个平台 3 个版本）
   - Twitter/X (280字符以内)
   - LinkedIn (专业风格)
   - Facebook (亲民风格)
   - 微信公众号导语

2. 邮件推广文案
   - 主题行（3个备选）
   - 邮件正文（简短版）
   - CTA按钮文案

3. 封面图文字建议
   - 主标题（大字）
   - 副标题（小字）
   - 视觉元素建议

4. 标签和分类建议
   - 主要标签（5-8个）
   - 分类目录
   - 相关主题标签

输出格式：JSON`,
              parameters: {
                temperature: 0.8,
                max_tokens: 2000
              }
            },
            position: { x: 100, y: 1150 }
          }
        ],
        edges: [
          { id: 'e1', source: 'step-1', target: 'step-2' },
          { id: 'e2', source: 'step-2', target: 'step-3' },
          { id: 'e3', source: 'step-3', target: 'step-4' },
          { id: 'e4', source: 'step-4', target: 'step-5' },
          { id: 'e5', source: 'step-5', target: 'step-6' },
          { id: 'e6', source: 'step-6', target: 'step-7' },
          { id: 'e7', source: 'step-6', target: 'step-8' }
        ]
      },
      exampleInput: {
        text: '写一篇关于AI在医疗诊断中应用的文章，目标读者是医疗行业从业者'
      },
      exampleOutput: {
        type: 'text',
        content: '# AI赋能医疗诊断：从辅助到精准的革命性跨越\n\n在现代医疗体系中，人工智能正在重塑疾病诊断的格局...\n\n（完整文章内容）'
      }
    }

    const created = await prisma.workflow.create({
      data: demoWorkflow
    })

    console.log('✅ 演示工作流创建成功！')
    console.log('工作流ID:', created.id)
    console.log('访问链接:', `http://localhost:5173/workflow-intro/${created.id}`)
    console.log('\n包含步骤：')
    created.config.nodes.forEach((node, i) => {
      console.log(`${i + 1}. ${node.label}`)
    })
  } catch (error) {
    console.error('创建失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDemoWorkflow()
