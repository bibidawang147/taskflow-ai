/**
 * 智能工作流配置生成器
 * 根据步骤描述，生成实际可执行的节点配置
 */

import { WorkflowStep } from './articleAnalysisService'

export interface NodeConfig {
  id: string
  type: string
  label: string
  position: { x: number; y: number }
  config: any
}

export interface EdgeConfig {
  id: string
  source: string
  target: string
}

export class WorkflowConfigGenerator {
  /**
   * 将步骤转换为可执行的节点配置
   */
  static generateExecutableConfig(steps: WorkflowStep[]): {
    nodes: NodeConfig[]
    edges: EdgeConfig[]
  } {
    const nodes: NodeConfig[] = []
    const edges: EdgeConfig[] = []

    // 添加输入节点
    nodes.push({
      id: 'input-1',
      type: 'input',
      label: '工作流输入',
      position: { x: 100, y: 200 },
      config: {
        placeholder: '请输入相关信息...',
        description: '工作流的初始输入'
      }
    })

    let previousNodeId = 'input-1'
    let yPos = 200

    // 处理每个步骤
    steps.forEach((step, index) => {
      const nodeId = `step-${step.stepNumber}`
      const xPos = 100 + (index + 1) * 300

      // 根据步骤类型生成节点配置
      const nodeConfig = this.generateNodeConfig(step, nodeId, xPos, yPos, previousNodeId)

      if (nodeConfig) {
        nodes.push(nodeConfig)

        // 创建边连接
        edges.push({
          id: `e${index + 1}`,
          source: previousNodeId,
          target: nodeId
        })

        previousNodeId = nodeId
      }
    })

    // 添加输出节点
    const outputNodeId = 'output-1'
    nodes.push({
      id: outputNodeId,
      type: 'output',
      label: '工作流输出',
      position: { x: 100 + (steps.length + 1) * 300, y: 200 },
      config: {
        format: 'json',
        description: '工作流的最终输出'
      }
    })

    edges.push({
      id: `e${steps.length + 1}`,
      source: previousNodeId,
      target: outputNodeId
    })

    return { nodes, edges }
  }

  /**
   * 根据步骤类型和描述生成具体的节点配置
   */
  private static generateNodeConfig(
    step: WorkflowStep,
    nodeId: string,
    x: number,
    y: number,
    previousNodeId: string
  ): NodeConfig | null {
    const baseNode = {
      id: nodeId,
      label: step.title,
      position: { x, y }
    }

    switch (step.type) {
      case 'llm':
        return this.generateLLMNodeConfig(baseNode, step, previousNodeId)

      case 'tool':
        return this.generateToolNodeConfig(baseNode, step, previousNodeId)

      case 'transform':
        return this.generateTransformNodeConfig(baseNode, step, previousNodeId)

      case 'condition':
        return this.generateConditionNodeConfig(baseNode, step, previousNodeId)

      default:
        return this.generateLLMNodeConfig(baseNode, step, previousNodeId)
    }
  }

  /**
   * 生成LLM节点配置
   */
  private static generateLLMNodeConfig(
    baseNode: any,
    step: WorkflowStep,
    previousNodeId: string
  ): NodeConfig {
    // 根据步骤描述生成实际可执行的prompt
    const prompt = this.generateExecutablePrompt(step)

    return {
      ...baseNode,
      type: 'llm',
      config: {
        model: 'qwen-plus',
        systemPrompt: '你是一个专业的AI助手，擅长帮助用户完成各种任务。请根据输入内容生成高质量的输出。',
        userPrompt: prompt,
        temperature: 0.7,
        maxTokens: 2000
      }
    }
  }

  /**
   * 生成Tool节点配置
   */
  private static generateToolNodeConfig(
    baseNode: any,
    step: WorkflowStep,
    previousNodeId: string
  ): NodeConfig {
    // 根据步骤描述判断使用哪个工具
    const toolConfig = this.determineToolFromDescription(step.description, step.config)

    return {
      ...baseNode,
      type: 'tool',
      config: toolConfig
    }
  }

  /**
   * 生成Transform节点配置
   */
  private static generateTransformNodeConfig(
    baseNode: any,
    step: WorkflowStep,
    previousNodeId: string
  ): NodeConfig {
    const description = step.description.toLowerCase()

    // 根据描述判断需要什么数据转换
    if (description.includes('清洗') || description.includes('处理缺失值')) {
      return {
        ...baseNode,
        type: 'tool',
        config: {
          toolName: 'data_transform',
          parameters: {
            operation: 'filter',
            data: `{{${previousNodeId}}}`,
            config: {
              condition: {
                field: 'value',
                operator: '!=',
                value: null
              }
            }
          }
        }
      }
    } else if (description.includes('格式化') || description.includes('转换')) {
      return {
        ...baseNode,
        type: 'tool',
        config: {
          toolName: 'data_transform',
          parameters: {
            operation: 'map',
            data: `{{${previousNodeId}}}`,
            config: {
              fields: {
                output: 'value'
              }
            }
          }
        }
      }
    } else {
      // 默认使用文本处理
      return {
        ...baseNode,
        type: 'tool',
        config: {
          toolName: 'text_processing',
          parameters: {
            operation: 'format',
            text: `{{${previousNodeId}}}`,
            config: {}
          }
        }
      }
    }
  }

  /**
   * 生成Condition节点配置
   */
  private static generateConditionNodeConfig(
    baseNode: any,
    step: WorkflowStep,
    previousNodeId: string
  ): NodeConfig {
    return {
      ...baseNode,
      type: 'condition',
      config: {
        condition: `{{${previousNodeId}}}`,
        operator: 'contains',
        value: 'success',
        trueOutput: '条件满足，继续执行',
        falseOutput: '条件不满足，需要重新处理'
      }
    }
  }

  /**
   * 根据步骤描述生成可执行的prompt
   */
  private static generateExecutablePrompt(step: WorkflowStep): string {
    const description = step.description.toLowerCase()
    const title = step.title.toLowerCase()

    // SEO和关键词相关
    if (title.includes('关键词') || description.includes('seo') || description.includes('搜索')) {
      return `分析以下主题，生成适合的SEO关键词和内容策略：

主题：{{input}}

请提供：
1. 主要关键词（3-5个）
2. 长尾关键词（5-10个）
3. 内容创作建议
4. SEO优化要点

输出格式为JSON：
{
  "mainKeywords": [...],
  "longTailKeywords": [...],
  "contentSuggestions": "...",
  "seoTips": "..."
}`
    }

    // 大纲和结构相关
    if (title.includes('大纲') || title.includes('结构') || description.includes('章节')) {
      return `根据以下信息，创建一个详细的内容大纲：

主题信息：{{input}}
前一步输出：{{step-${step.stepNumber - 1}}}

请生成包含以下部分的大纲：
1. 引言（吸引读者注意）
2. 主要内容（3-5个核心章节）
3. 实例说明（具体案例）
4. 总结和行动建议

输出格式为Markdown格式的大纲。`
    }

    // 内容生成相关
    if (title.includes('生成') || title.includes('撰写') || title.includes('创作')) {
      return `根据以下大纲和要求，撰写完整的内容：

大纲：{{step-${step.stepNumber - 1}}}

要求：
1. 内容专业、易读
2. 包含实际案例和示例
3. 结构清晰，逻辑连贯
4. 长度适中（800-1500字）

请直接输出文章内容，使用Markdown格式。`
    }

    // 优化相关
    if (title.includes('优化') || description.includes('改进') || description.includes('提升')) {
      return `优化以下内容，使其更加完善：

原始内容：{{step-${step.stepNumber - 1}}}

优化方向：
1. 语言表达更加流畅
2. 逻辑结构更加清晰
3. 添加更多实用细节
4. 增强可读性和吸引力

请输出优化后的完整内容。`
    }

    // 分析相关
    if (title.includes('分析') || description.includes('理解') || description.includes('识别')) {
      return `深入分析以下内容：

内容：{{input}}
前一步输出：{{step-${step.stepNumber - 1}}}

分析要点：
1. ${step.description}
2. 提取关键信息
3. 识别模式和趋势
4. 提出具体建议

输出格式为结构化的分析报告。`
    }

    // 默认通用prompt
    return `根据以下信息完成任务：

任务：${step.title}
描述：${step.description}

输入：{{input}}
前一步输出：{{step-${step.stepNumber - 1}}}

请提供详细、专业的输出结果。`
  }

  /**
   * 根据描述判断使用哪个工具
   * 使用真实的免费公共API
   */
  private static determineToolFromDescription(
    description: string,
    stepConfig: any
  ): any {
    const desc = description.toLowerCase()

    // 小红书搜索（SEO/关键词研究的替代）
    if (desc.includes('seo') || desc.includes('关键词') || desc.includes('搜索') || desc.includes('热搜') || desc.includes('小红书')) {
      return {
        toolName: 'http_request',
        parameters: {
          url: 'http://localhost:3000/api/crawler/xiaohongshu/notes',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            keyword: '{{input}}',
            maxCount: 10
          }
        }
      }
    }

    // 新闻资讯获取
    if (desc.includes('新闻') || desc.includes('资讯') || desc.includes('news')) {
      return {
        toolName: 'http_request',
        parameters: {
          url: 'https://newsapi.org/v2/everything',
          method: 'GET',
          params: {
            q: '{{input}}',
            language: 'en',
            sortBy: 'publishedAt',
            apiKey: process.env.NEWSAPI_KEY || 'demo'
          }
        }
      }
    }

    // 图片获取
    if (desc.includes('图片') || desc.includes('image') || desc.includes('图像')) {
      return {
        toolName: 'http_request',
        parameters: {
          url: 'https://picsum.photos/800/600',
          method: 'GET',
          responseType: 'blob'
        }
      }
    }

    // 名言警句
    if (desc.includes('名言') || desc.includes('格言') || desc.includes('quote')) {
      return {
        toolName: 'http_request',
        parameters: {
          url: 'https://api.quotable.io/random',
          method: 'GET'
        }
      }
    }

    // 维基百科搜索
    if (desc.includes('百科') || desc.includes('知识') || desc.includes('wikipedia') || desc.includes('查询')) {
      return {
        toolName: 'http_request',
        parameters: {
          url: 'https://en.wikipedia.org/w/api.php',
          method: 'GET',
          params: {
            action: 'query',
            list: 'search',
            srsearch: '{{input}}',
            format: 'json',
            utf8: 1
          }
        }
      }
    }

    // 数据清洗和转换
    if (desc.includes('数据') || desc.includes('清洗') || desc.includes('转换') || desc.includes('过滤')) {
      return {
        toolName: 'data_transform',
        parameters: {
          operation: 'map',
          data: '{{input}}',
          config: {
            fields: {
              result: 'data'
            }
          }
        }
      }
    }

    // 文本处理
    if (desc.includes('文本') || desc.includes('格式化') || desc.includes('拼接') || desc.includes('分割')) {
      return {
        toolName: 'text_processing',
        parameters: {
          operation: 'format',
          text: '{{input}}',
          config: {}
        }
      }
    }

    // 获取测试数据
    if (desc.includes('获取') || desc.includes('fetch') || desc.includes('数据')) {
      return {
        toolName: 'http_request',
        parameters: {
          url: 'https://jsonplaceholder.typicode.com/posts',
          method: 'GET',
          params: {
            _limit: 10
          }
        }
      }
    }

    // 发布和保存（保存为本地文件）
    if (desc.includes('发布') || desc.includes('保存') || desc.includes('输出')) {
      return {
        toolName: 'text_processing',
        parameters: {
          operation: 'format',
          text: '{{input}}',
          config: {
            outputFormat: 'markdown'
          }
        }
      }
    }

    // 默认：获取模拟数据
    return {
      toolName: 'http_request',
      parameters: {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        method: 'GET'
      }
    }
  }
}
