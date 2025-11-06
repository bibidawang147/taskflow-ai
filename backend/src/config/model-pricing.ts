/**
 * 模型定价配置
 *
 * 价格单位：coins (1000 coins = 1 元人民币)
 * 价格是每 1K tokens 的费用
 */

export interface ModelPricingConfig {
  provider: string;
  modelId: string;
  modelName: string;
  description: string;
  inputPrice: number;   // 每1K tokens 输入价格 (文本模型) 或每次调用价格 (图片/视频模型)
  outputPrice: number;  // 每1K tokens 输出价格 (文本模型) 或每次调用价格 (图片/视频模型)
  category: 'text' | 'image' | 'video' | 'embedding';
  maxTokens?: number;
  features?: {
    vision?: boolean;
    functionCalling?: boolean;
    streaming?: boolean;
    jsonMode?: boolean;
    textToImage?: boolean;
    textToVideo?: boolean;
    imageToVideo?: boolean;
  };
  isActive: boolean;
  allowedTiers: string;  // 逗号分隔的等级列表
  sortOrder: number;
}

export const MODEL_PRICING_CONFIG: ModelPricingConfig[] = [
  // ==================== OpenAI 模型 ====================
  {
    provider: 'openai',
    modelId: 'gpt-4o',
    modelName: 'GPT-4o',
    description: 'OpenAI 最新的旗舰模型，支持视觉和函数调用',
    inputPrice: 15,      // ¥0.015/1K tokens
    outputPrice: 60,     // ¥0.06/1K tokens
    category: 'text',
    maxTokens: 128000,
    features: {
      vision: true,
      functionCalling: true,
      streaming: true,
      jsonMode: true,
    },
    isActive: true,
    allowedTiers: 'pro,enterprise',
    sortOrder: 1,
  },
  {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    modelName: 'GPT-4o Mini',
    description: '经济实惠的小型模型，适合大多数任务',
    inputPrice: 1,       // ¥0.001/1K tokens
    outputPrice: 4,      // ¥0.004/1K tokens
    category: 'text',
    maxTokens: 128000,
    features: {
      vision: true,
      functionCalling: true,
      streaming: true,
      jsonMode: true,
    },
    isActive: true,
    allowedTiers: 'free,pro,enterprise',
    sortOrder: 2,
  },
  {
    provider: 'openai',
    modelId: 'gpt-4-turbo',
    modelName: 'GPT-4 Turbo',
    description: 'GPT-4 的高性能版本',
    inputPrice: 30,
    outputPrice: 90,
    category: 'text',
    maxTokens: 128000,
    features: {
      vision: true,
      functionCalling: true,
      streaming: true,
    },
    isActive: true,
    allowedTiers: 'pro,enterprise',
    sortOrder: 3,
  },
  {
    provider: 'openai',
    modelId: 'gpt-3.5-turbo',
    modelName: 'GPT-3.5 Turbo',
    description: '快速且经济的对话模型',
    inputPrice: 3,
    outputPrice: 6,
    category: 'text',
    maxTokens: 16385,
    features: {
      functionCalling: true,
      streaming: true,
    },
    isActive: true,
    allowedTiers: 'free,pro,enterprise',
    sortOrder: 4,
  },

  // ==================== Anthropic Claude 模型 ====================
  {
    provider: 'anthropic',
    modelId: 'claude-3-5-sonnet-20241022',
    modelName: 'Claude 3.5 Sonnet',
    description: 'Anthropic 最强大的模型，擅长复杂推理',
    inputPrice: 20,
    outputPrice: 80,
    category: 'text',
    maxTokens: 200000,
    features: {
      vision: true,
      streaming: true,
    },
    isActive: true,
    allowedTiers: 'pro,enterprise',
    sortOrder: 5,
  },
  {
    provider: 'anthropic',
    modelId: 'claude-3-5-haiku-20241022',
    modelName: 'Claude 3.5 Haiku',
    description: '快速响应的轻量级模型',
    inputPrice: 5,
    outputPrice: 20,
    category: 'text',
    maxTokens: 200000,
    features: {
      streaming: true,
    },
    isActive: true,
    allowedTiers: 'free,pro,enterprise',
    sortOrder: 6,
  },
  {
    provider: 'anthropic',
    modelId: 'claude-3-opus-20240229',
    modelName: 'Claude 3 Opus',
    description: '最高性能的 Claude 3 模型',
    inputPrice: 45,
    outputPrice: 180,
    category: 'text',
    maxTokens: 200000,
    features: {
      vision: true,
      streaming: true,
    },
    isActive: true,
    allowedTiers: 'enterprise',
    sortOrder: 7,
  },

  // ==================== 豆包（字节跳动）====================
  {
    provider: 'doubao',
    modelId: 'doubao-pro-32k',
    modelName: '豆包 Pro 32K',
    description: '字节跳动的高性能对话模型',
    inputPrice: 0.5,     // 非常便宜
    outputPrice: 2,
    category: 'text',
    maxTokens: 32768,
    features: {
      streaming: true,
    },
    isActive: true,
    allowedTiers: 'free,pro,enterprise',
    sortOrder: 8,
  },
  {
    provider: 'doubao',
    modelId: 'doubao-lite-4k',
    modelName: '豆包 Lite 4K',
    description: '轻量级快速响应模型',
    inputPrice: 0.3,
    outputPrice: 0.6,
    category: 'text',
    maxTokens: 4096,
    features: {
      streaming: true,
    },
    isActive: true,
    allowedTiers: 'free,pro,enterprise',
    sortOrder: 9,
  },

  // ==================== 通义千问（阿里）====================
  {
    provider: 'qwen',
    modelId: 'qwen-max',
    modelName: '通义千问 Max',
    description: '阿里云通义千问最强模型',
    inputPrice: 2,
    outputPrice: 8,
    category: 'text',
    maxTokens: 8192,
    features: {
      streaming: true,
      functionCalling: true,
    },
    isActive: true,
    allowedTiers: 'free,pro,enterprise',
    sortOrder: 10,
  },
  {
    provider: 'qwen',
    modelId: 'qwen-plus',
    modelName: '通义千问 Plus',
    description: '平衡性能与成本的模型',
    inputPrice: 1,
    outputPrice: 4,
    category: 'text',
    maxTokens: 8192,
    features: {
      streaming: true,
    },
    isActive: true,
    allowedTiers: 'free,pro,enterprise',
    sortOrder: 11,
  },
  {
    provider: 'qwen',
    modelId: 'qwen-turbo',
    modelName: '通义千问 Turbo',
    description: '快速响应的经济型模型',
    inputPrice: 0.4,
    outputPrice: 0.8,
    category: 'text',
    maxTokens: 8192,
    features: {
      streaming: true,
    },
    isActive: true,
    allowedTiers: 'free,pro,enterprise',
    sortOrder: 12,
  },

  // ==================== 智谱 AI ====================
  {
    provider: 'zhipu',
    modelId: 'glm-4',
    modelName: 'GLM-4',
    description: '智谱 AI 的第四代对话模型',
    inputPrice: 3,
    outputPrice: 12,
    category: 'text',
    maxTokens: 128000,
    features: {
      streaming: true,
      functionCalling: true,
    },
    isActive: true,
    allowedTiers: 'free,pro,enterprise',
    sortOrder: 13,
  },
  {
    provider: 'zhipu',
    modelId: 'glm-3-turbo',
    modelName: 'GLM-3 Turbo',
    description: '高性价比的快速模型',
    inputPrice: 0.5,
    outputPrice: 2,
    category: 'text',
    maxTokens: 128000,
    features: {
      streaming: true,
    },
    isActive: true,
    allowedTiers: 'free,pro,enterprise',
    sortOrder: 14,
  },

  // ==================== 阿里云图片生成模型 ====================
  {
    provider: 'alibaba',
    modelId: 'wanx-v1',
    modelName: '通义万相 V1',
    description: '阿里云文生图模型，生成写实图像和摄影级视觉效果',
    inputPrice: 40,      // 每张图片约 ¥0.04
    outputPrice: 0,
    category: 'image',
    features: {
      textToImage: true,
    },
    isActive: true,
    allowedTiers: 'free,pro,enterprise',
    sortOrder: 15,
  },
  {
    provider: 'alibaba',
    modelId: 'wanx2.1-t2i-turbo',
    modelName: '通义万相 V2 Turbo',
    description: '阿里云文生图 V2 Turbo，速度更快',
    inputPrice: 40,
    outputPrice: 0,
    category: 'image',
    features: {
      textToImage: true,
    },
    isActive: true,
    allowedTiers: 'free,pro,enterprise',
    sortOrder: 16,
  },
  {
    provider: 'alibaba',
    modelId: 'qwen-image',
    modelName: '通义千问图片生成',
    description: '擅长渲染复杂的中英文文本',
    inputPrice: 40,
    outputPrice: 0,
    category: 'image',
    features: {
      textToImage: true,
    },
    isActive: true,
    allowedTiers: 'free,pro,enterprise',
    sortOrder: 17,
  },

  // ==================== 阿里云视频生成模型 ====================
  {
    provider: 'alibaba',
    modelId: 'wanx2.1-t2v-turbo',
    modelName: '通义万相 2.1 极速版',
    description: '文生视频极速版（5秒/10秒无声视频）',
    inputPrice: 800,     // 每个视频约 ¥0.80
    outputPrice: 0,
    category: 'video',
    features: {
      textToVideo: true,
    },
    isActive: true,
    allowedTiers: 'free,pro,enterprise',
    sortOrder: 18,
  },
  {
    provider: 'alibaba',
    modelId: 'wan2.2-t2v-plus',
    modelName: '通义万相 2.2 专业版',
    description: '文生视频专业版，稳定性与成功率提升（无声视频）',
    inputPrice: 1200,    // 每个视频约 ¥1.20
    outputPrice: 0,
    category: 'video',
    features: {
      textToVideo: true,
    },
    isActive: true,
    allowedTiers: 'pro,enterprise',
    sortOrder: 19,
  },
  {
    provider: 'alibaba',
    modelId: 'wan2.5-t2v-preview',
    modelName: '通义万相 2.5 Preview',
    description: '最新版本，支持自动配音或自定义音频（有声视频）',
    inputPrice: 1500,    // 每个视频约 ¥1.50
    outputPrice: 0,
    category: 'video',
    features: {
      textToVideo: true,
    },
    isActive: true,
    allowedTiers: 'pro,enterprise',
    sortOrder: 20,
  },
  {
    provider: 'alibaba',
    modelId: 'wanx-i2v-v1',
    modelName: '通义万相图生视频',
    description: '基于首帧图像和提示词生成视频（3-10秒）',
    inputPrice: 1000,    // 每个视频约 ¥1.00
    outputPrice: 0,
    category: 'video',
    features: {
      imageToVideo: true,
    },
    isActive: true,
    allowedTiers: 'pro,enterprise',
    sortOrder: 21,
  },
  {
    provider: 'alibaba',
    modelId: 'AnimateAnyone',
    modelName: '舞动人像',
    description: '基于人物图片和动作模板生成人物动作视频',
    inputPrice: 800,
    outputPrice: 0,
    category: 'video',
    features: {
      imageToVideo: true,
    },
    isActive: true,
    allowedTiers: 'pro,enterprise',
    sortOrder: 22,
  },
];

/**
 * 获取模型定价
 */
export function getModelPrice(provider: string, modelId: string) {
  return MODEL_PRICING_CONFIG.find(
    config => config.provider === provider && config.modelId === modelId
  );
}

/**
 * 获取某个等级可用的模型
 */
export function getModelsForTier(tier: string) {
  return MODEL_PRICING_CONFIG.filter(config => {
    const allowedTiers = config.allowedTiers.split(',');
    return config.isActive && allowedTiers.includes(tier);
  });
}

/**
 * 按提供商分组
 */
export function groupModelsByProvider() {
  const groups: Record<string, ModelPricingConfig[]> = {};

  MODEL_PRICING_CONFIG.forEach(config => {
    if (!groups[config.provider]) {
      groups[config.provider] = [];
    }
    groups[config.provider].push(config);
  });

  return groups;
}
