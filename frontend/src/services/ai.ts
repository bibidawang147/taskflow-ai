import api from './api';
import {
  AIProvider,
  GroupedModels,
  ChatRequest,
  ChatResponse,
  ProviderInfo,
} from '../types/ai';

export const aiService = {
  /**
   * 获取可用模型列表
   */
  getAvailableModels: async (): Promise<GroupedModels> => {
    const response = await api.get('/ai/models');
    return response.data.data;
  },

  /**
   * AI 对话
   */
  chat: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post('/ai/chat', request);
    return response.data.data;
  },

  /**
   * 测试连接
   */
  testConnection: async (provider: AIProvider): Promise<boolean> => {
    try {
      const response = await api.post('/ai/test-connection', { provider });
      return response.data.data.isConnected;
    } catch (error) {
      return false;
    }
  },

  /**
   * 获取提供商信息
   */
  getProviderInfo: (): ProviderInfo[] => {
    return [
      {
        id: 'openai',
        name: 'OpenAI',
        icon: '🤖',
        description: 'GPT-4, GPT-3.5 等先进模型',
        available: true,
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        icon: '🧠',
        description: 'Claude 系列模型',
        available: true,
      },
      {
        id: 'doubao',
        name: '豆包',
        icon: '🫘',
        description: '字节跳动 AI 模型',
        available: true,
      },
      {
        id: 'qwen',
        name: '通义千问',
        icon: '💬',
        description: '阿里云 AI 模型',
        available: true,
      },
      {
        id: 'zhipu',
        name: '智谱AI',
        icon: '⚡',
        description: 'GLM 系列模型',
        available: true,
      },
    ];
  },

  /**
   * 获取提供商名称
   */
  getProviderName: (provider: AIProvider): string => {
    const providers = aiService.getProviderInfo();
    return providers.find((p) => p.id === provider)?.name || provider;
  },

  /**
   * 获取提供商图标
   */
  getProviderIcon: (provider: AIProvider): string => {
    const providers = aiService.getProviderInfo();
    return providers.find((p) => p.id === provider)?.icon || '🤖';
  },

  /**
   * 估算对话成本
   */
  estimateCost: (
    inputTokens: number,
    outputTokens: number,
    inputPrice: number,
    outputPrice: number
  ): number => {
    const inputCost = Math.ceil((inputTokens / 1000) * inputPrice);
    const outputCost = Math.ceil((outputTokens / 1000) * outputPrice);
    return inputCost + outputCost;
  },

  /**
   * 处理 AI 错误
   */
  handleAIError: (error: any): string => {
    if (error.response?.data?.code === 'INSUFFICIENT_CREDIT') {
      return '积分不足，请充值后继续使用';
    }
    if (error.response?.data?.code === 'TIER_REQUIRED') {
      return error.response.data.message || '需要升级会员才能使用此模型';
    }
    return error.response?.data?.message || '调用失败，请稍后重试';
  },
};
