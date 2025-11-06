import axios from 'axios';

/**
 * 视频生成请求参数
 */
export interface VideoGenerationRequest {
  prompt: string;              // 文本提示词
  imageUrl?: string;           // 首帧图片URL（图生视频时使用）
  model?: string;              // 模型名称
  duration?: number;           // 视频时长（秒），如 5 或 10
  resolution?: '480p' | '720p' | '1080p';  // 视频分辨率
  fps?: number;                // 帧率，默认24
  seed?: number;               // 随机种子
  audioUrl?: string;           // 音频URL（音画同步，仅 wanx2.5 支持）
}

/**
 * 视频生成响应
 */
export interface VideoGenerationResponse {
  taskId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  videoUrl?: string;           // 视频URL（24小时有效）
  duration?: number;           // 实际视频时长
  error?: string;
  usage?: {
    totalTokens?: number;
  };
}

/**
 * 阿里云通义万相视频生成服务
 */
export class VideoGenerationService {
  private apiKey: string;
  private apiUrl: string;
  private textToVideoModel: string;
  private imageToVideoModel: string;

  constructor() {
    this.apiKey = process.env.ALIBABA_API_KEY || '';
    this.apiUrl = process.env.ALIBABA_VIDEO_API_URL ||
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis';
    this.textToVideoModel = process.env.ALIBABA_VIDEO_TEXT_MODEL || 'wanx2.1-t2v-turbo';
    this.imageToVideoModel = process.env.ALIBABA_VIDEO_IMAGE_MODEL || 'wanx-i2v-v1';

    if (!this.apiKey) {
      console.warn('未配置阿里云 API Key，视频生成功能不可用');
    }
  }

  /**
   * 生成视频（异步，自动轮询直到完成）
   */
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    if (!this.apiKey) {
      throw new Error('未配置阿里云 API Key');
    }

    // 根据是否有图片选择模型
    const model = request.imageUrl
      ? (request.model || this.imageToVideoModel)
      : (request.model || this.textToVideoModel);

    // 1. 创建任务
    const taskId = await this.createTask(request, model);

    // 2. 轮询获取结果（最多等待5分钟）
    const maxAttempts = 150; // 150次 * 2秒 = 300秒（5分钟）
    let attempts = 0;

    while (attempts < maxAttempts) {
      const result = await this.getTaskResult(taskId);

      if (result.status === 'SUCCEEDED') {
        return result;
      }

      if (result.status === 'FAILED') {
        throw new Error(result.error || '视频生成失败');
      }

      // 等待2秒后继续轮询
      await this.sleep(2000);
      attempts++;

      // 每30秒输出一次进度
      if (attempts % 15 === 0) {
        console.log(`视频生成中... (已等待 ${attempts * 2} 秒)`);
      }
    }

    throw new Error('视频生成超时（超过5分钟）');
  }

  /**
   * 创建视频生成任务
   */
  private async createTask(
    request: VideoGenerationRequest,
    model: string
  ): Promise<string> {
    try {
      const requestBody: any = {
        model,
        input: {
          prompt: request.prompt,
        },
        parameters: {
          duration: request.duration || 5,
          resolution: this.mapResolution(request.resolution || '720p'),
          fps: request.fps || 24,
        },
      };

      // 如果是图生视频，添加首帧图片
      if (request.imageUrl) {
        requestBody.input.image_url = request.imageUrl;
      }

      // 如果有音频，添加音频URL（仅 wanx2.5 支持）
      if (request.audioUrl) {
        requestBody.input.audio_url = request.audioUrl;
      }

      // 如果有种子，添加种子
      if (request.seed) {
        requestBody.parameters.seed = request.seed;
      }

      const response = await axios.post(
        this.apiUrl,
        requestBody,
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

      console.log(`视频生成任务已创建: ${taskId}`);
      return taskId;
    } catch (error: any) {
      console.error('创建视频生成任务失败:', error.response?.data || error.message);
      throw new Error(
        '创建视频生成任务失败: ' +
        (error.response?.data?.message || error.message)
      );
    }
  }

  /**
   * 获取任务结果
   */
  async getTaskResult(taskId: string): Promise<VideoGenerationResponse> {
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
        const videoUrl = data.output?.video_url;
        return {
          taskId,
          status: 'SUCCEEDED',
          videoUrl,
          duration: data.output?.duration,
          usage: {
            totalTokens: 1, // 视频按次计费
          },
        };
      }

      if (status === 'FAILED') {
        return {
          taskId,
          status: 'FAILED',
          error: data.output?.message || data.message || '任务失败',
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
   * 映射分辨率
   */
  private mapResolution(resolution: string): string {
    // 阿里云要求大写 P
    const map: { [key: string]: string } = {
      '480p': '480P',
      '720p': '720P',
      '1080p': '1080P',
      '480P': '480P',
      '720P': '720P',
      '1080P': '1080P',
    };
    return map[resolution] || '720P';
  }

  /**
   * 辅助函数：延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 快速文生视频（同步接口）
   */
  async generateTextToVideo(prompt: string, options?: {
    duration?: number;
    resolution?: '480p' | '720p' | '1080p';
  }): Promise<string> {
    const result = await this.generateVideo({
      prompt,
      duration: options?.duration,
      resolution: options?.resolution,
    });

    if (!result.videoUrl) {
      throw new Error('视频生成失败：未返回视频URL');
    }

    return result.videoUrl;
  }

  /**
   * 快速图生视频（同步接口）
   */
  async generateImageToVideo(
    imageUrl: string,
    prompt: string,
    options?: {
      duration?: number;
      resolution?: '480p' | '720p' | '1080p';
      audioUrl?: string;
    }
  ): Promise<string> {
    const result = await this.generateVideo({
      prompt,
      imageUrl,
      duration: options?.duration,
      resolution: options?.resolution,
      audioUrl: options?.audioUrl,
    });

    if (!result.videoUrl) {
      throw new Error('视频生成失败：未返回视频URL');
    }

    return result.videoUrl;
  }
}

// 导出单例
export const videoGenerationService = new VideoGenerationService();
