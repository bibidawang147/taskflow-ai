import axios from 'axios';
import { ArticleAnalysisService, WorkflowStep } from './articleAnalysisService';

export type ContentType = 'url' | 'text' | 'image' | 'video' | 'pdf' | 'ppt' | 'code';
export type OutputCategory = 'design' | 'development' | 'marketing' | 'data-analysis' | 'content-creation' | 'product' | 'other';

export interface ContentAnalysisRequest {
  type: ContentType;
  data: string | Buffer; // URL字符串、文本内容、或文件Buffer
  filename?: string;
  mimeType?: string;
}

export interface ContentAnalysisResult {
  sourceType: ContentType;
  sourceTitle: string;
  sourceDescription?: string;
  workflowTitle: string;
  workflowDescription: string;
  category: OutputCategory;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTime?: string;
  steps: WorkflowStep[];
  tags: string[];
  suggestedNodeTypes?: { [stepNumber: number]: 'input' | 'llm' | 'tool' | 'condition' | 'output' };
}

/**
 * 统一的内容分析服务
 * 支持文章、图片、视频等多种成果类型的逆向工作流生成
 */
export class ContentAnalysisService {
  private alibabaApiKey: string;
  private alibabaBaseUrl: string;
  private visionModel: string;

  constructor() {
    // 优先使用阿里云百炼配置
    this.alibabaApiKey = process.env.ALIBABA_API_KEY || process.env.QWEN_API_KEY || '';
    this.alibabaBaseUrl = process.env.ALIBABA_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    this.visionModel = process.env.ALIBABA_VISION_MODEL || 'qwen-vl-plus';

    if (!this.alibabaApiKey) {
      console.warn('未配置阿里云API Key，图片分析功能将不可用');
    }
  }

  /**
   * 统一入口：分析任意类型的内容
   */
  async analyzeContent(request: ContentAnalysisRequest): Promise<ContentAnalysisResult> {
    switch (request.type) {
      case 'url':
      case 'text':
        return this.analyzeTextContent(request);

      case 'image':
        return this.analyzeImage(request);

      case 'video':
        return this.analyzeVideo(request);

      case 'pdf':
      case 'ppt':
      case 'code':
        return this.analyzeDocument(request);

      default:
        throw new Error(`不支持的内容类型: ${request.type}`);
    }
  }

  /**
   * 分析文本/URL内容（复用现有的ArticleAnalysisService）
   */
  private async analyzeTextContent(request: ContentAnalysisRequest): Promise<ContentAnalysisResult> {
    let title: string;
    let content: string;

    if (request.type === 'url' && typeof request.data === 'string') {
      // 从URL抓取内容
      const articleData = await ArticleAnalysisService.fetchArticleContent(request.data);
      title = articleData.title;
      content = articleData.content;
    } else {
      // 直接使用文本内容
      title = request.filename || '未命名文本';
      content = request.data.toString();
    }

    // 使用AI分析
    const result = await ArticleAnalysisService.analyzeArticleAndExtractWorkflow(title, content);

    return {
      sourceType: request.type,
      sourceTitle: title,
      sourceDescription: content.slice(0, 200),
      workflowTitle: result.workflowTitle,
      workflowDescription: result.workflowDescription,
      category: this.mapCategoryToOutput(result.category),
      complexity: this.estimateComplexity(result.steps.length),
      estimatedTime: this.estimateTime(result.steps.length),
      steps: result.steps,
      tags: result.tags,
    };
  }

  /**
   * 分析图片内容（使用阿里云通义千问视觉模型 qwen-vl-plus）
   */
  private async analyzeImage(request: ContentAnalysisRequest): Promise<ContentAnalysisResult> {
    if (!this.alibabaApiKey) {
      throw new Error('未配置阿里云API Key，无法使用图片分析功能');
    }

    const base64Image = this.bufferToBase64(request.data, request.mimeType || 'image/jpeg');

    const systemPrompt = `你是一个工作流逆向工程专家。用户会给你一张图片（可能是设计稿、数据图表、产品截图、营销素材等），你需要分析这个成果，推断出完成它需要的详细工作流程步骤。`;

    const userPrompt = `请仔细分析这张图片，识别它是什么类型的成果，然后推断出完成这个成果需要的详细工作流程。

请返回JSON格式：
{
  "sourceTitle": "成果标题或简短描述",
  "sourceDescription": "成果的详细描述",
  "workflowTitle": "完成这个成果的工作流标题",
  "workflowDescription": "工作流简短描述",
  "category": "design|development|marketing|data-analysis|content-creation|product|other",
  "complexity": "simple|medium|complex",
  "estimatedTime": "预估总耗时（如'2-4小时'）",
  "steps": [
    {
      "stepNumber": 1,
      "title": "步骤标题",
      "description": "详细描述要做什么",
      "type": "llm|tool|condition|transform",
      "config": {
        "prompt": "如果是AI步骤，这里是提示词",
        "tool": "如果是工具步骤，这里是工具名称"
      }
    }
  ],
  "tags": ["标签1", "标签2", "标签3"]
}

注意：
1. 仔细观察图片的内容、风格、细节
2. 步骤要具体、可执行、有逻辑顺序
3. type字段：llm(AI处理)、tool(工具调用)、condition(条件判断)、transform(数据转换)
4. 至少提取3-8个步骤
5. 标签要准确描述成果的特征

只返回JSON，不要其他内容。`;

    try {
      // 使用阿里云百炼的 OpenAI 兼容模式 API
      const response = await axios.post(
        `${this.alibabaBaseUrl}/chat/completions`,
        {
          model: this.visionModel, // qwen-vl-plus
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                {
                  type: 'image_url',
                  image_url: { url: base64Image },
                },
              ],
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.alibabaApiKey}`,
          },
        }
      );

      const content = response.data.choices[0]?.message?.content || '{}';

      // 提取JSON（通义千问可能返回```json ... ```格式）
      let jsonStr = content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const result = JSON.parse(jsonStr);

      return {
        sourceType: 'image',
        sourceTitle: result.sourceTitle || request.filename || '未命名图片',
        sourceDescription: result.sourceDescription,
        workflowTitle: result.workflowTitle,
        workflowDescription: result.workflowDescription,
        category: result.category || 'other',
        complexity: result.complexity || 'medium',
        estimatedTime: result.estimatedTime,
        steps: result.steps || [],
        tags: result.tags || [],
      };
    } catch (error: any) {
      console.error('图片分析失败:', error.response?.data || error.message);
      throw new Error('图片分析失败: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  /**
   * 分析视频内容
   */
  private async analyzeVideo(request: ContentAnalysisRequest): Promise<ContentAnalysisResult> {
    // 方案1: 使用OpenAI Whisper API转录音频
    // 这里提供一个简化的实现思路

    // 注意: 实际实现需要先提取音频或使用视频处理库
    // 目前返回一个占位实现

    throw new Error('视频分析功能正在开发中。建议先上传视频的文字稿或关键帧截图。');

    // TODO: 完整实现
    // 1. 提取音频轨道
    // 2. 使用Whisper转录
    // 3. 分析文字内容
    // 或者：提取关键帧，使用GPT-4o Vision分析
  }

  /**
   * 分析文档内容（PDF、PPT等）
   */
  private async analyzeDocument(request: ContentAnalysisRequest): Promise<ContentAnalysisResult> {
    // PDF/PPT分析需要额外的库（如pdf-parse, pptx-parser等）
    // 这里提供占位实现

    throw new Error(`${request.type.toUpperCase()}分析功能正在开发中。建议先将内容复制为文本分析。`);

    // TODO: 完整实现
    // 1. 解析PDF/PPT内容
    // 2. 提取文本和图片
    // 3. 分析内容生成工作流
  }

  /**
   * Buffer转Base64（用于图片）
   */
  private bufferToBase64(data: string | Buffer, mimeType: string): string {
    if (typeof data === 'string') {
      // 已经是Base64或URL
      if (data.startsWith('data:')) {
        return data;
      }
      if (data.startsWith('http')) {
        return data; // OpenAI也支持URL
      }
      // 假设是Base64
      return `data:${mimeType};base64,${data}`;
    }

    // Buffer转Base64
    const base64 = data.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * 映射分类到标准输出分类
   */
  private mapCategoryToOutput(category: string): OutputCategory {
    const mapping: { [key: string]: OutputCategory } = {
      '设计': 'design',
      '开发': 'development',
      '营销': 'marketing',
      '数据分析': 'data-analysis',
      '内容创作': 'content-creation',
      '产品': 'product',
    };

    return mapping[category] || 'other';
  }

  /**
   * 估算复杂度
   */
  private estimateComplexity(stepCount: number): 'simple' | 'medium' | 'complex' {
    if (stepCount <= 3) return 'simple';
    if (stepCount <= 6) return 'medium';
    return 'complex';
  }

  /**
   * 估算时间
   */
  private estimateTime(stepCount: number): string {
    if (stepCount <= 3) return '1-2小时';
    if (stepCount <= 6) return '2-4小时';
    if (stepCount <= 10) return '4-8小时';
    return '1-2天';
  }

  /**
   * Mock分析（用于测试，不消耗API credits）
   */
  async analyzeMock(request: ContentAnalysisRequest): Promise<ContentAnalysisResult> {
    return {
      sourceType: request.type,
      sourceTitle: request.filename || '测试成果',
      sourceDescription: '这是一个Mock分析结果',
      workflowTitle: `完成${request.filename || '这个成果'}的工作流`,
      workflowDescription: '从成果逆向生成的工作流',
      category: 'other',
      complexity: 'medium',
      estimatedTime: '2-4小时',
      steps: [
        {
          stepNumber: 1,
          title: '需求分析',
          description: '分析目标和需求',
          type: 'llm',
          config: { prompt: '分析项目需求和目标' },
        },
        {
          stepNumber: 2,
          title: '方案设计',
          description: '设计解决方案',
          type: 'llm',
          config: { prompt: '设计实现方案' },
        },
        {
          stepNumber: 3,
          title: '执行实施',
          description: '按照方案执行',
          type: 'tool',
          config: { tool: 'execution-tool' },
        },
        {
          stepNumber: 4,
          title: '审核优化',
          description: '审核结果并优化',
          type: 'llm',
          config: { prompt: '审核并提出优化建议' },
        },
      ],
      tags: ['测试', 'Mock', request.type],
    };
  }
}

export const contentAnalysisService = new ContentAnalysisService();
