import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger';
import { CrawledNote } from './crawler.service';

interface AnalyzedWorkflow {
  title: string;
  description: string;
  category: string;
  tags: string[];
  steps: WorkflowStep[];
  aiTools: string[];
  inputExample: any;
  outputExample: any;
}

interface WorkflowStep {
  order: number;
  action: string;
  tool?: string;
  prompt?: string;
  parameters?: Record<string, any>;
  description: string;
}

class AIAnalyzerService {
  private client: Anthropic | null;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'sk-ant-placeholder-needs-configuration') {
      console.warn('⚠️  ANTHROPIC_API_KEY 未配置，AI分析功能将不可用');
      this.client = null;
    } else {
      this.client = new Anthropic({ apiKey });
    }
  }

  /**
   * 分析小红书笔记，提取工作流
   */
  async analyzeNoteToWorkflow(note: CrawledNote): Promise<AnalyzedWorkflow | null> {
    if (!this.client) {
      logger.warn('AI分析服务未初始化，跳过笔记分析');
      return null;
    }

    try {
      logger.info(`分析笔记: ${note.title}`);

      const prompt = this.buildAnalysisPrompt(note);

      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      // 解析 AI 返回的 JSON
      const workflow = this.parseWorkflowFromResponse(responseText);

      if (workflow) {
        logger.info(`成功提取工作流: ${workflow.title}`);
      }

      return workflow;
    } catch (error) {
      logger.error('AI 分析失败:', error);
      return null;
    }
  }

  /**
   * 批量分析笔记
   */
  async batchAnalyzeNotes(notes: CrawledNote[]): Promise<AnalyzedWorkflow[]> {
    const workflows: AnalyzedWorkflow[] = [];

    for (const note of notes) {
      try {
        const workflow = await this.analyzeNoteToWorkflow(note);
        if (workflow) {
          workflows.push(workflow);
        }
        // 避免频率限制，每次分析后等待 1 秒
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`分析笔记 ${note.noteId} 失败:`, error);
        continue;
      }
    }

    return workflows;
  }

  /**
   * 构建分析提示词
   */
  private buildAnalysisPrompt(note: CrawledNote): string {
    const comments = note.comments?.slice(0, 5).map(c => c.content).join('\n') || '';

    return `你是一个AI工具使用教程分析专家。请分析以下小红书笔记，提取其中的AI工具使用工作流。

# 笔记信息
标题: ${note.title}
描述: ${note.desc}
标签: ${note.tags.join(', ')}
热度: 点赞${note.likedCount} | 收藏${note.collectedCount} | 评论${note.commentCount}

${comments ? `# 用户评论\n${comments}\n` : ''}

# 任务要求
1. 判断这个笔记是否包含AI工具使用教程或工作流
2. 如果包含，提取以下信息：
   - 工作流标题（简洁明了）
   - 工作流描述（1-2句话说明用途）
   - 分类（如：内容创作、办公效率、数据分析、设计、编程等）
   - 标签（3-5个关键词）
   - 使用的AI工具列表
   - 详细步骤（每步包含：序号、操作描述、使用的工具、提示词/参数）
   - 输入示例（什么样的输入）
   - 输出示例（期望得到什么结果）

3. 如果不包含AI工具使用教程，返回 null

# 输出格式
请严格按照以下 JSON 格式返回（不要包含任何其他文字说明）：

{
  "title": "工作流标题",
  "description": "工作流描述",
  "category": "分类",
  "tags": ["标签1", "标签2", "标签3"],
  "aiTools": ["工具1", "工具2"],
  "steps": [
    {
      "order": 1,
      "action": "操作名称",
      "tool": "使用的AI工具（可选）",
      "prompt": "提示词（如果有）",
      "parameters": { "key": "value" },
      "description": "详细说明"
    }
  ],
  "inputExample": "示例输入",
  "outputExample": "示例输出"
}

如果不是AI工具教程，只返回：null`;
  }

  /**
   * 解析 AI 响应中的工作流数据
   */
  private parseWorkflowFromResponse(response: string): AnalyzedWorkflow | null {
    try {
      // 移除可能的 markdown 代码块标记
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }

      jsonStr = jsonStr.trim();

      // 如果是 null 字符串，返回 null
      if (jsonStr === 'null' || jsonStr === 'NULL') {
        return null;
      }

      const workflow = JSON.parse(jsonStr);

      // 验证必要字段
      if (!workflow.title || !workflow.steps || !Array.isArray(workflow.steps)) {
        logger.warn('AI 返回的工作流格式不完整');
        return null;
      }

      return workflow;
    } catch (error) {
      logger.error('解析 AI 响应失败:', error);
      logger.debug('原始响应:', response);
      return null;
    }
  }

  /**
   * 将分析结果转换为 Prisma 工作流格式
   */
  convertToWorkflowData(analyzed: AnalyzedWorkflow, authorId: string) {
    return {
      title: analyzed.title,
      description: analyzed.description,
      category: analyzed.category,
      tags: analyzed.tags.join(','),
      isPublic: true,
      isTemplate: true,
      config: {
        nodes: this.generateNodesFromSteps(analyzed.steps),
        edges: this.generateEdgesFromSteps(analyzed.steps),
      },
      sourceType: 'text' as const,
      sourceContent: JSON.stringify(analyzed),
      exampleInput: analyzed.inputExample,
      exampleOutput: analyzed.outputExample,
      authorId,
    };
  }

  /**
   * 从步骤生成节点
   */
  private generateNodesFromSteps(steps: WorkflowStep[]) {
    const nodes: any[] = [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 100 },
        data: { label: '输入' },
      },
    ];

    steps.forEach((step, index) => {
      const nodeType = step.tool ? 'llm' : 'tool';
      nodes.push({
        id: `step-${step.order}`,
        type: nodeType,
        position: { x: 100, y: 200 + index * 100 },
        data: {
          label: step.action,
          tool: step.tool,
          prompt: step.prompt,
          parameters: step.parameters,
          description: step.description,
        },
      });
    });

    nodes.push({
      id: 'output-1',
      type: 'output',
      position: { x: 100, y: 200 + steps.length * 100 },
      data: { label: '输出' },
    });

    return nodes;
  }

  /**
   * 从步骤生成连接边
   */
  private generateEdgesFromSteps(steps: WorkflowStep[]) {
    const edges = [
      {
        id: 'e-input-step1',
        source: 'input-1',
        target: 'step-1',
      },
    ];

    for (let i = 0; i < steps.length - 1; i++) {
      edges.push({
        id: `e-step${i + 1}-step${i + 2}`,
        source: `step-${i + 1}`,
        target: `step-${i + 2}`,
      });
    }

    edges.push({
      id: `e-step${steps.length}-output`,
      source: `step-${steps.length}`,
      target: 'output-1',
    });

    return edges;
  }
}

export default new AIAnalyzerService();
