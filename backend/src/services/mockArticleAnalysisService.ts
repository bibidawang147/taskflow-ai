/**
 * Mock 文章分析服务 - 用于测试和演示
 * 不需要真实的 OpenAI API Key
 */

import { WorkflowStep } from './articleAnalysisService'

export class MockArticleAnalysisService {
  /**
   * 模拟从URL抓取文章内容
   */
  static async fetchArticleContent(url: string): Promise<{
    title: string
    content: string
    excerpt: string
  }> {
    console.log('🧪 [测试模式] 模拟抓取文章:', url)

    // 根据URL返回不同的模拟内容
    if (url.includes('blog') || url.includes('write')) {
      return {
        title: '如何写一篇高质量的技术博客',
        content: `
# 如何写一篇高质量的技术博客

写作技术博客是分享知识和建立个人品牌的好方法。以下是完整的写作流程：

## 第1步：选择主题和关键词
首先要确定你要写什么。使用 Google Trends 或关键词工具研究热门话题，找到读者感兴趣的主题。

## 第2步：创建文章大纲
在开始写作前，先列出大纲。包括引言、主要内容点、示例代码、总结等部分。

## 第3步：撰写初稿
按照大纲开始写作。不要追求完美，先把想法写下来。使用清晰的语言，添加代码示例和截图。

## 第4步：优化和编辑
完成初稿后，检查语法错误、逻辑问题。优化标题，使其更吸引人。添加目录和标签。

## 第5步：发布和推广
将文章发布到博客平台。在社交媒体、技术社区分享。收集读者反馈并持续改进。
`,
        excerpt: '这是一篇关于如何写技术博客的教程文章，包含5个详细步骤...'
      }
    } else if (url.includes('data') || url.includes('analysis')) {
      return {
        title: '数据分析的完整流程',
        content: `
# 数据分析的完整流程

## 第1步：定义问题
明确要解决什么业务问题，设定分析目标和成功指标。

## 第2步：收集数据
从数据库、API、CSV文件等来源收集相关数据。

## 第3步：清洗数据
处理缺失值、异常值，标准化数据格式。

## 第4步：探索性分析
使用可视化工具了解数据分布、相关性。

## 第5步：建立模型
选择合适的分析方法或机器学习模型。

## 第6步：生成报告
将分析结果可视化，撰写报告和建议。
`,
        excerpt: '完整的数据分析流程，从问题定义到报告生成...'
      }
    } else if (url.includes('design') || url.includes('product')) {
      return {
        title: '产品设计流程详解',
        content: `
# 产品设计流程详解

## 第1步：用户研究
通过访谈、问卷、数据分析了解用户需求和痛点。

## 第2步：需求分析
整理研究结果，提炼核心功能需求。

## 第3步：创意设计
头脑风暴，绘制草图和线框图。

## 第4步：原型制作
使用 Figma 等工具创建可交互的原型。

## 第5步：用户测试
邀请目标用户测试原型，收集反馈。

## 第6步：迭代优化
根据测试结果改进设计，重复测试直到满意。
`,
        excerpt: '从用户研究到迭代优化的完整产品设计流程...'
      }
    } else {
      // 默认示例
      return {
        title: '通用工作流程示例',
        content: `
# 通用工作流程示例

## 第1步：准备阶段
收集所需的材料和信息，制定计划。

## 第2步：执行阶段
按照计划开始实施，记录关键步骤。

## 第3步：检查阶段
验证结果是否符合预期，发现问题。

## 第4步：优化阶段
根据检查结果进行改进和优化。

## 第5步：总结阶段
记录经验教训，形成文档供未来参考。
`,
        excerpt: '一个通用的5步工作流程...'
      }
    }
  }

  /**
   * 模拟AI分析文章并提取工作流
   */
  static async analyzeArticleAndExtractWorkflow(
    title: string,
    content: string
  ): Promise<{
    workflowTitle: string
    workflowDescription: string
    steps: WorkflowStep[]
    category: string
    tags: string[]
  }> {
    console.log('🧪 [测试模式] 模拟AI分析:', title)

    // 模拟分析延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 根据标题内容生成不同的工作流
    if (title.includes('博客') || title.includes('写作') || title.includes('blog') || title.includes('write')) {
      return {
        workflowTitle: 'SEO友好博客写作工作流',
        workflowDescription: '从关键词研究到发布推广的完整博客创作流程',
        category: 'content-creation',
        tags: ['写作', '博客', 'SEO', '内容营销'],
        steps: [
          {
            stepNumber: 1,
            title: '分析目标关键词以提升搜索排名',
            description: '使用SEO工具深度研究目标关键词和长尾词，分析搜索量、竞争度和用户意图，为后续内容创作提供方向，确保文章能在搜索引擎中获得良好排名',
            type: 'tool',
            config: {
              tool: 'seo-keyword-research',
              searchEngine: 'google'
            }
          },
          {
            stepNumber: 2,
            title: '构建文章结构以组织内容',
            description: '基于关键词研究结果和用户需求，使用AI创建清晰的文章大纲，包括引人入胜的引言、逻辑严密的主体段落和有力的结论，为高质量内容打好框架',
            type: 'llm',
            config: {
              prompt: '根据目标关键词创建一个详细的博客文章大纲，包括引言、主要章节和结论'
            }
          },
          {
            stepNumber: 3,
            title: '生成专业内容以吸引读者',
            description: '按照大纲使用AI撰写完整的博客文章，融入实际案例、代码示例和实用建议，确保内容专业易读，为读者提供真正价值',
            type: 'llm',
            config: {
              prompt: '撰写一篇专业、易读的技术博客文章，包含实际案例和代码示例'
            }
          },
          {
            stepNumber: 4,
            title: '优化SEO元数据以增加曝光',
            description: '使用AI优化文章标题、meta描述、图片alt标签等关键SEO元素，提升搜索引擎可见度，吸引更多点击',
            type: 'llm',
            config: {
              prompt: '优化文章的SEO元素，生成吸引人的标题和描述'
            }
          },
          {
            stepNumber: 5,
            title: '添加相关链接以提升权威性',
            description: '智能插入内部链接（导向站内相关文章）和外部链接（引用权威来源），提升文章的SEO价值和可信度，改善用户体验',
            type: 'transform',
            config: {
              transform: 'add-links',
              internalLinks: true,
              externalLinks: true
            }
          },
          {
            stepNumber: 6,
            title: '发布并推广以扩大影响力',
            description: '将完成的文章发布到博客平台，同时自动分享到Twitter、LinkedIn等社交媒体渠道，最大化内容的传播范围和影响力',
            type: 'tool',
            config: {
              tool: 'publish-and-share',
              platforms: ['blog', 'twitter', 'linkedin']
            }
          }
        ]
      }
    } else if (title.includes('数据') || title.includes('分析') || title.includes('data') || title.includes('analysis')) {
      return {
        workflowTitle: '数据分析工作流',
        workflowDescription: '从数据收集到报告生成的完整分析流程',
        category: 'data-analysis',
        tags: ['数据分析', '数据科学', '可视化', '报告'],
        steps: [
          {
            stepNumber: 1,
            title: '明确业务问题以确定分析方向',
            description: '深入理解业务场景和痛点，设定清晰的分析目标和可量化的成功指标，为后续数据收集和分析工作提供明确方向，确保分析结果能够解决实际业务问题',
            type: 'llm',
            config: {
              prompt: '分析业务需求，明确数据分析的目标和预期输出'
            }
          },
          {
            stepNumber: 2,
            title: '从多源系统采集数据以支撑分析',
            description: '通过API接口、数据库查询、文件导入等方式，从各个业务系统和数据源中收集所需的原始数据，为后续分析提供完整可靠的数据基础',
            type: 'tool',
            config: {
              tool: 'data-collection',
              sources: ['database', 'api', 'csv']
            }
          },
          {
            stepNumber: 3,
            title: '清洗转换数据以保证质量',
            description: '识别并处理数据中的缺失值、异常值和重复项，统一数据格式和单位，确保数据的准确性和一致性，为可靠的分析结果打下坚实基础',
            type: 'transform',
            config: {
              transform: 'data-cleaning',
              operations: ['remove_nulls', 'handle_outliers', 'normalize']
            }
          },
          {
            stepNumber: 4,
            title: '探索数据特征以发现规律',
            description: '运用统计方法和可视化技术，分析数据的分布、相关性和趋势，识别关键模式和异常点，为深度分析提供洞察方向',
            type: 'llm',
            config: {
              prompt: '对数据进行探索性分析，识别模式和趋势'
            }
          },
          {
            stepNumber: 5,
            title: '构建分析模型以提取洞察',
            description: '基于探索性分析的发现，选择合适的统计模型或机器学习算法进行深入挖掘，从数据中提取有价值的业务洞察和预测结果',
            type: 'llm',
            config: {
              prompt: '执行高级数据分析，提取有价值的洞察'
            }
          },
          {
            stepNumber: 6,
            title: '制作可视化报告以呈现成果',
            description: '将分析结果转化为直观的图表、仪表板和报告文档，清晰展示发现的规律、趋势和建议，帮助决策者快速理解并采取行动',
            type: 'tool',
            config: {
              tool: 'visualization',
              chartTypes: ['bar', 'line', 'scatter', 'heatmap']
            }
          }
        ]
      }
    } else if (title.includes('设计') || title.includes('产品') || title.includes('design') || title.includes('product')) {
      return {
        workflowTitle: '产品设计工作流',
        workflowDescription: '从用户研究到迭代优化的完整设计流程',
        category: 'product-design',
        tags: ['产品设计', 'UX', 'UI', '用户体验'],
        steps: [
          {
            stepNumber: 1,
            title: '深入调研用户以洞察真实需求',
            description: '通过一对一访谈、在线问卷、用户行为观察等多种方法，深入了解目标用户的实际需求、使用场景和痛点，为产品设计提供真实可靠的用户洞察',
            type: 'tool',
            config: {
              tool: 'user-research',
              methods: ['interview', 'survey', 'observation']
            }
          },
          {
            stepNumber: 2,
            title: '提炼关键需求以聚焦设计重点',
            description: '系统整理用户研究数据，识别共性问题和核心诉求，按优先级排序功能需求，明确产品的核心价值主张和必备功能，为设计工作建立清晰的方向',
            type: 'llm',
            config: {
              prompt: '分析用户研究数据，提取关键需求和优先级'
            }
          },
          {
            stepNumber: 3,
            title: '构思设计方案以解决用户问题',
            description: '基于需求分析结果进行头脑风暴，探索多种设计可能性，绘制产品草图和交互流程图，形成创新的设计概念和解决方案',
            type: 'llm',
            config: {
              prompt: '基于需求生成创意设计方案和原型草图'
            }
          },
          {
            stepNumber: 4,
            title: '制作交互原型以验证设计思路',
            description: '使用Figma等专业工具，将设计方案转化为高保真可交互原型，完整呈现界面布局、视觉风格和交互细节，为用户测试做好准备',
            type: 'tool',
            config: {
              tool: 'prototyping',
              platform: 'figma'
            }
          },
          {
            stepNumber: 5,
            title: '组织用户测试以收集真实反馈',
            description: '邀请目标用户试用原型产品，观察他们的使用行为和困难点，收集对界面、功能和体验的真实反馈，发现设计中的问题和改进机会',
            type: 'tool',
            config: {
              tool: 'user-testing',
              participants: 5
            }
          },
          {
            stepNumber: 6,
            title: '优化完善设计以提升用户体验',
            description: '深入分析用户测试中发现的问题和建议，调整界面布局、优化交互流程、改进视觉设计，持续迭代直到达到最佳用户体验',
            type: 'llm',
            config: {
              prompt: '分析用户反馈，提出改进建议并优化设计'
            }
          }
        ]
      }
    } else {
      // 通用工作流
      return {
        workflowTitle: '通用工作流程',
        workflowDescription: '适用于多种场景的标准工作流程',
        category: 'general',
        tags: ['通用', '流程', '管理'],
        steps: [
          {
            stepNumber: 1,
            title: '制定详细计划以明确执行路径',
            description: '全面分析任务目标和需求，评估可用资源和潜在风险，制定包含时间节点、资源分配和关键里程碑的详细执行计划，为项目成功奠定基础',
            type: 'llm',
            config: {
              prompt: '分析任务需求，制定执行计划'
            }
          },
          {
            stepNumber: 2,
            title: '按计划实施以推进项目进展',
            description: '严格遵循既定计划，有序推进各项任务的执行，合理调配资源，及时记录关键步骤和决策依据，确保项目按预期方向前进',
            type: 'tool',
            config: {
              tool: 'task-execution'
            }
          },
          {
            stepNumber: 3,
            title: '检验成果质量以确保达标',
            description: '对照既定标准和验收条件，全面检查任务完成情况和成果质量，识别存在的问题和偏差，判断是否满足预期要求',
            type: 'condition',
            config: {
              condition: 'quality_check_passed'
            }
          },
          {
            stepNumber: 4,
            title: '分析问题并优化以提升质量',
            description: '深入分析质量检查中发现的问题和不足，查找根本原因，提出针对性的改进方案和优化措施，持续完善直到达到质量标准',
            type: 'llm',
            config: {
              prompt: '分析问题，提出改进方案'
            }
          },
          {
            stepNumber: 5,
            title: '总结沉淀经验以支持未来改进',
            description: '系统梳理项目全过程的经验教训，记录成功做法和遇到的挑战，形成标准化文档和最佳实践，为后续类似项目提供参考和指导',
            type: 'llm',
            config: {
              prompt: '总结项目经验，生成文档'
            }
          }
        ]
      }
    }
  }
}
