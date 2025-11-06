// AI 提供商
export type AIProvider = 'openai' | 'anthropic' | 'doubao' | 'qwen' | 'zhipu';

// 模型信息
export interface AIModel {
  modelId: string;
  modelName: string;
  description: string;
  inputPrice: number;
  outputPrice: number;
  category: 'text' | 'image' | 'embedding';
  maxTokens?: number;
  features?: {
    vision?: boolean;
    functionCalling?: boolean;
    streaming?: boolean;
    jsonMode?: boolean;
  };
}

// 按提供商分组的模型
export interface GroupedModels {
  userTier: string;
  models: {
    [provider: string]: AIModel[];
  };
  totalCount: number;
}

// 对话消息
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// AI 聊天请求
export interface ChatRequest {
  provider: AIProvider;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  workflowId?: string;
  executionId?: string;
}

// AI 聊天响应
export interface ChatResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost: number;
  finishReason?: string;
}

// 提供商信息
export interface ProviderInfo {
  id: AIProvider;
  name: string;
  icon: string;
  description: string;
  available: boolean;
}
