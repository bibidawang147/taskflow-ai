import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import prisma from '../utils/database';
import { CreditService } from './credit.service';

// AI 请求接口
export interface AIRequest {
  provider: 'openai' | 'anthropic' | 'doubao' | 'qwen' | 'zhipu';
  model: string;
  messages: Array<{ role: string; content: string | any }>;  // 支持多模态内容
  userId: string;
  workflowId?: string;
  executionId?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// AI 流式请求接口
export interface AIStreamRequest extends AIRequest {
  onToken: (token: string) => void;
  onComplete: (data: any) => void;
  onError: (error: Error) => void;
}

// AI 响应接口
export interface AIResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  finishReason?: string;
}

export class AIProxyService {
  private openai: OpenAI | null;
  private anthropic: Anthropic | null;
  private creditService: CreditService;

  constructor() {
    // 初始化各个 AI 服务客户端（可选）
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder-needs-configuration') {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.warn('⚠️  OPENAI_API_KEY 未配置，OpenAI 功能将不可用');
      this.openai = null;
    }

    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'sk-ant-placeholder-needs-configuration') {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } else {
      console.warn('⚠️  ANTHROPIC_API_KEY 未配置，Anthropic 功能将不可用');
      this.anthropic = null;
    }

    this.creditService = new CreditService();
  }

  /**
   * 统一的 AI 调用接口
   */
  async chat(request: AIRequest): Promise<AIResponse> {
    try {
      // 1. 检查用户积分
      const hasCredit = await this.creditService.checkCredit(request.userId);
      if (!hasCredit) {
        throw new Error('积分不足，请充值');
      }

      // 2. 获取模型定价
      const pricing = await this.getModelPricing(request.provider, request.model);
      if (!pricing) {
        throw new Error(`模型 ${request.provider}:${request.model} 未找到定价信息`);
      }

      // 3. 检查用户等级是否允许使用该模型
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      const allowedTiers = pricing.allowedTiers.split(',');
      if (!allowedTiers.includes(user.tier)) {
        throw new Error(`您的会员等级 (${user.tier}) 无法使用此模型，请升级会员`);
      }

      // 4. 路由到对应的提供商
      let response: AIResponse;

      switch (request.provider) {
        case 'openai':
          response = await this.callOpenAI(request, pricing);
          break;
        case 'anthropic':
          response = await this.callAnthropic(request, pricing);
          break;
        case 'doubao':
          response = await this.callDoubao(request, pricing);
          break;
        case 'qwen':
          response = await this.callQwen(request, pricing);
          break;
        case 'zhipu':
          response = await this.callZhipu(request, pricing);
          break;
        default:
          throw new Error(`不支持的 AI 提供商: ${request.provider}`);
      }

      // 5. 扣除积分并记录日志
      await this.creditService.deductCredit({
        userId: request.userId,
        cost: response.cost,
        provider: request.provider,
        model: request.model,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        totalTokens: response.totalTokens,
        workflowId: request.workflowId,
        executionId: request.executionId,
        status: 'success',
      });

      return response;
    } catch (error: any) {
      // 记录失败日志（不扣费）
      await this.creditService.logUsage({
        userId: request.userId,
        provider: request.provider,
        model: request.model,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        cost: 0,
        workflowId: request.workflowId,
        executionId: request.executionId,
        status: 'failed',
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * 流式 AI 调用接口
   */
  async chatStream(request: AIStreamRequest): Promise<void> {
    try {
      // 1. 检查用户积分
      const hasCredit = await this.creditService.checkCredit(request.userId);
      if (!hasCredit) {
        request.onError(new Error('积分不足，请充值'));
        return;
      }

      // 2. 获取模型定价
      const pricing = await this.getModelPricing(request.provider, request.model);
      if (!pricing) {
        request.onError(new Error(`模型 ${request.provider}:${request.model} 未找到定价信息`));
        return;
      }

      // 3. 检查用户等级
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (!user) {
        request.onError(new Error('用户不存在'));
        return;
      }

      const allowedTiers = pricing.allowedTiers.split(',');
      if (!allowedTiers.includes(user.tier)) {
        request.onError(new Error(`您的会员等级 (${user.tier}) 无法使用此模型，请升级会员`));
        return;
      }

      // 4. 路由到对应的提供商（目前只支持 qwen 流式）
      if (request.provider === 'qwen') {
        await this.callQwenStream(request, pricing);
      } else {
        request.onError(new Error(`提供商 ${request.provider} 暂不支持流式响应`));
      }
    } catch (error: any) {
      console.error('[Stream] 调用失败:', error);
      request.onError(error);
    }
  }

  /**
   * 调用 OpenAI API
   */
  private async callOpenAI(request: AIRequest, pricing: any): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client is not initialized. Please configure OPENAI_API_KEY.');
    }

    const completion = await this.openai.chat.completions.create({
      model: request.model,
      messages: request.messages as any,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
    });

    const inputTokens = completion.usage?.prompt_tokens ?? 0;
    const outputTokens = completion.usage?.completion_tokens ?? 0;
    const totalTokens = completion.usage?.total_tokens ?? 0;

    // 计算费用
    const cost = this.calculateCost(inputTokens, outputTokens, pricing);

    return {
      content: completion.choices[0]?.message?.content ?? '',
      inputTokens,
      outputTokens,
      totalTokens,
      cost,
      finishReason: completion.choices[0]?.finish_reason ?? undefined,
    };
  }

  /**
   * 调用 Anthropic Claude API
   */
  private async callAnthropic(request: AIRequest, pricing: any): Promise<AIResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic client is not initialized. Please configure ANTHROPIC_API_KEY.');
    }

    const message = await this.anthropic.messages.create({
      model: request.model,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
      messages: request.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    });

    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;
    const totalTokens = inputTokens + outputTokens;

    const cost = this.calculateCost(inputTokens, outputTokens, pricing);

    const content = message.content
      .filter((block) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    return {
      content,
      inputTokens,
      outputTokens,
      totalTokens,
      cost,
      finishReason: message.stop_reason ?? undefined,
    };
  }

  /**
   * 调用豆包 API（字节跳动）
   */
  private async callDoubao(request: AIRequest, pricing: any): Promise<AIResponse> {
    try {
      console.log(`[Doubao API] 开始调用, model: ${request.model}, messages: ${request.messages.length}`);

      const response = await axios.post(
        'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 1500,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`,
          },
          timeout: 90000,
        }
      );

      console.log(`[Doubao API] 调用成功, status: ${response.status}`);

      const data = response.data;
      const inputTokens = data.usage?.prompt_tokens ?? 0;
      const outputTokens = data.usage?.completion_tokens ?? 0;
      const totalTokens = data.usage?.total_tokens ?? 0;

      const cost = this.calculateCost(inputTokens, outputTokens, pricing);

      return {
        content: data.choices[0]?.message?.content ?? '',
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        finishReason: data.choices[0]?.finish_reason,
      };
    } catch (error: any) {
      console.error('[Doubao API] 调用失败:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('AI服务响应超时，请稍后重试');
      }

      if (error.response?.data?.error) {
        throw new Error(`AI服务错误: ${error.response.data.error.message || error.response.data.error}`);
      }

      throw new Error(`调用AI服务失败: ${error.message}`);
    }
  }

  /**
   * 调用通义千问 API（使用OpenAI兼容模式）
   */
  private async callQwen(request: AIRequest, pricing: any): Promise<AIResponse> {
    // 使用阿里云百炼的 OpenAI 兼容模式
    const baseUrl = process.env.ALIBABA_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const apiKey = process.env.ALIBABA_API_KEY || process.env.QWEN_API_KEY;

    if (!apiKey) {
      throw new Error('未配置阿里云API Key (ALIBABA_API_KEY 或 QWEN_API_KEY)');
    }

    try {
      console.log(`[Qwen API] 开始调用, model: ${request.model}, messages: ${request.messages.length}`);

      const response = await axios.post(
        `${baseUrl}/chat/completions`,
        {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 1500, // 减少最大token数，加快响应
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          timeout: 90000, // 增加到90秒超时
        }
      );

      console.log(`[Qwen API] 调用成功, status: ${response.status}`);

      const data = response.data;
      const inputTokens = data.usage?.prompt_tokens ?? 0;
      const outputTokens = data.usage?.completion_tokens ?? 0;
      const totalTokens = data.usage?.total_tokens ?? 0;

      const cost = this.calculateCost(inputTokens, outputTokens, pricing);

      return {
        content: data.choices[0]?.message?.content ?? '',
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        finishReason: data.choices[0]?.finish_reason,
      };
    } catch (error: any) {
      console.error('[Qwen API] 调用失败:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });

      // 处理超时错误
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('AI服务响应超时，请稍后重试');
      }

      // 处理API错误
      if (error.response?.data?.error) {
        throw new Error(`AI服务错误: ${error.response.data.error.message || error.response.data.error}`);
      }

      throw new Error(`调用AI服务失败: ${error.message}`);
    }
  }

  /**
   * 调用通义千问 API（流式响应）
   */
  private async callQwenStream(request: AIStreamRequest, pricing: any): Promise<void> {
    const baseUrl = process.env.ALIBABA_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const apiKey = process.env.ALIBABA_API_KEY || process.env.QWEN_API_KEY;

    if (!apiKey) {
      throw new Error('未配置阿里云API Key');
    }

    try {
      console.log(`[Qwen Stream] 开始调用, model: ${request.model}, messages: ${request.messages.length}`);

      const response = await axios.post(
        `${baseUrl}/chat/completions`,
        {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 1500,
          stream: true,  // 启用流式响应
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          responseType: 'stream',  // 接收流式数据
          timeout: 120000,  // 2分钟超时
        }
      );

      let fullContent = '';
      let inputTokens = 0;
      let outputTokens = 0;

      // 处理流式数据
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';

              if (content) {
                fullContent += content;
                request.onToken(content);  // 发送token到前端
              }

              // 更新token使用情况
              if (parsed.usage) {
                inputTokens = parsed.usage.prompt_tokens || 0;
                outputTokens = parsed.usage.completion_tokens || 0;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      });

      response.data.on('end', async () => {
        try {
          const totalTokens = inputTokens + outputTokens;
          const cost = this.calculateCost(inputTokens, outputTokens, pricing);

          // 扣除积分
          await this.creditService.deductCredit({
            userId: request.userId,
            cost,
            provider: request.provider,
            model: request.model,
            inputTokens,
            outputTokens,
            totalTokens,
            workflowId: request.workflowId,
            executionId: request.executionId,
            status: 'success',
          });

          console.log(`[Qwen Stream] 调用完成, tokens: ${totalTokens}, cost: ${cost}`);

          request.onComplete({
            content: fullContent,
            usage: { inputTokens, outputTokens, totalTokens },
            cost,
          });
        } catch (error: any) {
          request.onError(error);
        }
      });

      response.data.on('error', (error: Error) => {
        console.error('[Qwen Stream] 流错误:', error);
        request.onError(error);
      });

    } catch (error: any) {
      console.error('[Qwen Stream] 调用失败:', error.message);

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('AI服务响应超时，请稍后重试');
      }

      throw new Error(`调用AI服务失败: ${error.message}`);
    }
  }

  /**
   * 调用智谱 AI API
   */
  private async callZhipu(request: AIRequest, pricing: any): Promise<AIResponse> {
    try {
      console.log(`[Zhipu API] 开始调用, model: ${request.model}, messages: ${request.messages.length}`);

      const response = await axios.post(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 1500,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
          },
          timeout: 90000,
        }
      );

      console.log(`[Zhipu API] 调用成功, status: ${response.status}`);

      const data = response.data;
      const inputTokens = data.usage?.prompt_tokens ?? 0;
      const outputTokens = data.usage?.completion_tokens ?? 0;
      const totalTokens = data.usage?.total_tokens ?? 0;

      const cost = this.calculateCost(inputTokens, outputTokens, pricing);

      return {
        content: data.choices[0]?.message?.content ?? '',
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        finishReason: data.choices[0]?.finish_reason,
      };
    } catch (error: any) {
      console.error('[Zhipu API] 调用失败:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('AI服务响应超时，请稍后重试');
      }

      if (error.response?.data?.error) {
        throw new Error(`AI服务错误: ${error.response.data.error.message || error.response.data.error}`);
      }

      throw new Error(`调用AI服务失败: ${error.message}`);
    }
  }

  /**
   * 计算费用
   */
  private calculateCost(inputTokens: number, outputTokens: number, pricing: any): number {
    // pricing.inputPrice 和 outputPrice 是每 1K tokens 的价格
    const inputCost = Math.ceil((inputTokens / 1000) * pricing.inputPrice);
    const outputCost = Math.ceil((outputTokens / 1000) * pricing.outputPrice);
    return inputCost + outputCost;
  }

  /**
   * 获取模型定价
   */
  private async getModelPricing(provider: string, modelId: string) {
    return await prisma.modelPricing.findUnique({
      where: {
        provider_modelId: {
          provider,
          modelId,
        },
      },
    });
  }

  /**
   * 获取所有可用模型列表
   */
  async getAvailableModels(userTier: string = 'free') {
    const models = await prisma.modelPricing.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    // 过滤用户等级可用的模型
    return models.filter(model => {
      const allowedTiers = model.allowedTiers.split(',');
      return allowedTiers.includes(userTier);
    });
  }
}

export const aiProxyService = new AIProxyService();
