import { WorkflowStep } from './articleAnalysisService'
import { WorkflowConfigGenerator } from './workflowConfigGenerator'

/**
 * 工作流模板生成器
 */
export class WorkflowTemplateService {
  /**
   * 根据文章分析结果生成动态工作流
   * 使用智能配置生成器，生成真正可执行的节点配置
   */
  static generateDynamicWorkflow(steps: WorkflowStep[], articleUrl?: string) {
    console.log('🔧 使用智能配置生成器生成工作流...')

    // 使用智能配置生成器生成可执行的节点配置
    const { nodes, edges } = WorkflowConfigGenerator.generateExecutableConfig(steps)

    console.log(`✅ 生成了 ${nodes.length} 个节点，${edges.length} 条边`)

    return { nodes, edges }
  }

  /**
   * 生成文章知识提取工作流（向后兼容）
   * @param articleUrl 文章URL
   * @returns 工作流配置
   */
  static generateKnowledgeExtractionWorkflow(articleUrl?: string) {
    const nodes: WorkflowNode[] = [
      // 1. 输入节点
      {
        id: 'input-1',
        type: 'input',
        label: '文章URL输入',
        position: { x: 100, y: 100 },
        config: {
          fields: [
            {
              name: 'url',
              label: '文章URL',
              type: 'text',
              required: true,
              defaultValue: articleUrl || '',
              placeholder: '请输入文章URL'
            }
          ]
        }
      },

      // 2. 网页抓取节点
      {
        id: 'tool-scraper',
        type: 'tool',
        label: '抓取文章内容',
        position: { x: 100, y: 250 },
        config: {
          toolType: 'web-scraper',
          description: '从URL抓取网页内容',
          inputMapping: {
            url: '{{input-1.url}}'
          },
          // 使用 Jina Reader API 或类似服务
          apiEndpoint: 'https://r.jina.ai/',
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      },

      // 3. 内容清洗节点
      {
        id: 'tool-cleaner',
        type: 'tool',
        label: '清洗文本内容',
        position: { x: 100, y: 400 },
        config: {
          toolType: 'text-processor',
          description: '清理HTML标签，提取纯文本',
          inputMapping: {
            content: '{{tool-scraper.content}}'
          },
          operations: [
            'remove_html',
            'normalize_whitespace',
            'remove_urls',
            'trim'
          ]
        }
      },

      // 4. 实体提取AI节点
      {
        id: 'llm-entity',
        type: 'llm',
        label: '提取关键实体',
        position: { x: 100, y: 550 },
        config: {
          model: 'gpt-4o',
          provider: 'openai',
          temperature: 0.3,
          maxTokens: 2000,
          systemPrompt: `你是一个专业的知识提取专家。请从给定的文章中提取关键实体。

实体类型包括：
- 人物 (Person)
- 组织 (Organization)
- 地点 (Location)
- 时间 (Time)
- 事件 (Event)
- 概念 (Concept)
- 技术 (Technology)
- 产品 (Product)

请以JSON格式返回，格式如下：
{
  "entities": [
    {
      "text": "实体名称",
      "type": "实体类型",
      "description": "简短描述"
    }
  ]
}`,
          userPrompt: '请从以下文章中提取关键实体：\n\n{{tool-cleaner.output}}',
          outputFormat: 'json'
        }
      },

      // 5. 关系提取AI节点
      {
        id: 'llm-relation',
        type: 'llm',
        label: '提取实体关系',
        position: { x: 400, y: 550 },
        config: {
          model: 'gpt-4o',
          provider: 'openai',
          temperature: 0.3,
          maxTokens: 2000,
          systemPrompt: `你是一个专业的知识图谱构建专家。基于提取的实体，请分析文章中实体之间的关系。

关系类型包括：
- 属于 (belongs_to)
- 创建 (created)
- 位于 (located_in)
- 发生于 (occurred_at)
- 使用 (uses)
- 影响 (affects)
- 导致 (causes)
- 包含 (contains)

请以JSON格式返回，格式如下：
{
  "relationships": [
    {
      "source": "源实体",
      "relation": "关系类型",
      "target": "目标实体",
      "description": "关系描述"
    }
  ]
}`,
          userPrompt: `文章内容：
{{tool-cleaner.output}}

已提取的实体：
{{llm-entity.output}}

请分析这些实体之间的关系。`,
          outputFormat: 'json'
        }
      },

      // 6. 知识整合节点
      {
        id: 'tool-merger',
        type: 'tool',
        label: '整合知识图谱',
        position: { x: 250, y: 700 },
        config: {
          toolType: 'json-merger',
          description: '将实体和关系整合成完整的知识图谱',
          inputMapping: {
            entities: '{{llm-entity.output.entities}}',
            relationships: '{{llm-relation.output.relationships}}',
            metadata: {
              sourceUrl: '{{input-1.url}}',
              extractedAt: '{{$timestamp}}',
              articleTitle: '{{tool-scraper.title}}'
            }
          },
          outputSchema: {
            type: 'knowledge_graph',
            version: '1.0'
          }
        }
      },

      // 7. 输出节点
      {
        id: 'output-1',
        type: 'output',
        label: '知识图谱输出',
        position: { x: 250, y: 850 },
        config: {
          outputFields: [
            {
              name: 'knowledgeGraph',
              source: '{{tool-merger.output}}',
              label: '知识图谱'
            },
            {
              name: 'summary',
              source: '{{tool-cleaner.output}}',
              label: '文章摘要',
              transform: 'truncate:500'
            }
          ],
          format: 'json'
        }
      }
    ]

    // 定义节点之间的连接边
    const edges = [
      { id: 'e1', source: 'input-1', target: 'tool-scraper' },
      { id: 'e2', source: 'tool-scraper', target: 'tool-cleaner' },
      { id: 'e3', source: 'tool-cleaner', target: 'llm-entity' },
      { id: 'e4', source: 'tool-cleaner', target: 'llm-relation' },
      { id: 'e5', source: 'llm-entity', target: 'llm-relation' },
      { id: 'e6', source: 'llm-entity', target: 'tool-merger' },
      { id: 'e7', source: 'llm-relation', target: 'tool-merger' },
      { id: 'e8', source: 'tool-merger', target: 'output-1' }
    ]

    return {
      nodes,
      edges
    }
  }

  /**
   * 根据文章URL生成工作流的元数据
   */
  static generateWorkflowMetadata(articleUrl: string) {
    const hostname = this.extractHostname(articleUrl)

    return {
      title: `知识提取 - ${hostname}`,
      description: `从 ${articleUrl} 自动提取知识图谱，包含实体识别和关系抽取`,
      category: 'knowledge-extraction',
      tags: ['知识提取', '文章分析', 'AI', '知识图谱'],
      thumbnail: '/templates/knowledge-extraction.png'
    }
  }

  /**
   * 从URL中提取主机名
   */
  private static extractHostname(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return 'unknown'
    }
  }
}

/**
 * 工作流节点类型定义（与前端保持一致）
 */
interface WorkflowNode {
  id: string
  type: 'input' | 'llm' | 'tool' | 'condition' | 'output'
  label: string
  position: {
    x: number
    y: number
  }
  config: Record<string, any>
}

interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}
