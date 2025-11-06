import axios from 'axios';

/**
 * 图片生成请求参数
 */
export interface ImageGenerationRequest {
  prompt: string;              // 文本提示词
  negativePrompt?: string;     // 负面提示词（不想生成的内容）
  model?: string;              // 模型名称，默认 wanx-v1
  size?: string;               // 图片尺寸，如 '1024*1024'
  n?: number;                  // 生成图片数量，默认1
  style?: string;              // 风格标签，如 '<watercolor>'
  seed?: number;               // 随机种子，用于复现
}

/**
 * 图片生成响应
 */
export interface ImageGenerationResponse {
  taskId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  images?: Array<{
    url: string;              // 图片URL（24小时有效）
    width: number;
    height: number;
  }>;
  error?: string;
  usage?: {
    totalTokens?: number;
  };
}

/**
 * 阿里云通义万相图片生成服务
 */
export class ImageGenerationService {
  private apiKey: string;
  private apiUrl: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.ALIBABA_API_KEY || '';
    this.apiUrl = process.env.ALIBABA_IMAGE_API_URL ||
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';
    this.defaultModel = process.env.ALIBABA_IMAGE_MODEL || 'wanx-v1';

    if (!this.apiKey) {
      console.warn('未配置阿里云 API Key，图片生成功能不可用');
    }
  }

  /**
   * 生成图片（异步，自动轮询直到完成）
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.apiKey) {
      throw new Error('未配置阿里云 API Key');
    }

    // 1. 创建任务
    const taskId = await this.createTask(request);

    // 2. 轮询获取结果（最多等待2分钟）
    const maxAttempts = 60; // 60次 * 2秒 = 120秒
    let attempts = 0;

    while (attempts < maxAttempts) {
      const result = await this.getTaskResult(taskId);

      if (result.status === 'SUCCEEDED') {
        return result;
      }

      if (result.status === 'FAILED') {
        throw new Error(result.error || '图片生成失败');
      }

      // 等待2秒后继续轮询
      await this.sleep(2000);
      attempts++;
    }

    throw new Error('图片生成超时（超过2分钟）');
  }

  /**
   * 创建图片生成任务
   */
  private async createTask(request: ImageGenerationRequest): Promise<string> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: request.model || this.defaultModel,
          input: {
            prompt: request.prompt,
            negative_prompt: request.negativePrompt,
          },
          parameters: {
            size: request.size || '1024*1024',
            n: request.n || 1,
            seed: request.seed,
            style: request.style,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-DashScope-Async': 'enable', // 启用异步模式
          },
        }
      );

      const taskId = response.data.output?.task_id;
      if (!taskId) {
        throw new Error('创建任务失败：未返回 task_id');
      }

      console.log(`图片生成任务已创建: ${taskId}`);
      return taskId;
    } catch (error: any) {
      console.error('创建图片生成任务失败:', error.response?.data || error.message);
      throw new Error(
        '创建图片生成任务失败: ' +
        (error.response?.data?.message || error.message)
      );
    }
  }

  /**
   * 获取任务结果
   */
  async getTaskResult(taskId: string): Promise<ImageGenerationResponse> {
    try {
      const response = await axios.get(
        `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const data = response.data;
      const status = data.output?.task_status;

      if (status === 'SUCCEEDED') {
        const results = data.output?.results || [];
        return {
          taskId,
          status: 'SUCCEEDED',
          images: results.map((item: any) => ({
            url: item.url,
            width: parseInt(data.output?.task_metrics?.WIDTH || '1024'),
            height: parseInt(data.output?.task_metrics?.HEIGHT || '1024'),
          })),
          usage: {
            totalTokens: data.usage?.image_count || 1,
          },
        };
      }

      if (status === 'FAILED') {
        return {
          taskId,
          status: 'FAILED',
          error: data.output?.message || '任务失败',
        };
      }

      // PENDING 或 RUNNING
      return {
        taskId,
        status: status === 'RUNNING' ? 'RUNNING' : 'PENDING',
      };
    } catch (error: any) {
      console.error('获取任务结果失败:', error.response?.data || error.message);
      throw new Error(
        '获取任务结果失败: ' +
        (error.response?.data?.message || error.message)
      );
    }
  }

  /**
   * 辅助函数：延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 快速生成图片（同步接口，适合简单场景）
   */
  async generateImageQuick(prompt: string, options?: {
    size?: string;
    n?: number;
    style?: string;
  }): Promise<string[]> {
    const result = await this.generateImage({
      prompt,
      size: options?.size,
      n: options?.n,
      style: options?.style,
    });

    return result.images?.map(img => img.url) || [];
  }
}

// 导出单例
export const imageGenerationService = new ImageGenerationService();
