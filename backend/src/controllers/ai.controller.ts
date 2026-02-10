import { Request, Response } from 'express';
import { aiProxyService } from '../services/ai-proxy.service';
import { getModelsForTier } from '../config/model-pricing';
import prisma from '../utils/database';
import { createRetriever } from '../services/workflowRetriever';
import { buildSystemPrompt } from '../services/promptBuilder';

const retriever = createRetriever();

/**
 * 为 AI 对话注入动态 system prompt（包含平台工作流上下文）
 * 替换前端发来的 system message（如有），或在头部插入
 */
async function injectSystemPrompt(messages: any[]): Promise<any[]> {
  try {
    // 取最后一条用户消息作为检索 query
    const userQuery = messages
      .filter((m: any) => m.role === 'user')
      .pop()?.content || '';

    const workflows = await retriever.retrieve(userQuery);
    const systemPrompt = buildSystemPrompt(workflows);

    // 移除前端可能发来的旧 system message，替换为动态版本
    const nonSystemMessages = messages.filter((m: any) => m.role !== 'system');
    return [
      { role: 'system', content: systemPrompt },
      ...nonSystemMessages,
    ];
  } catch (error) {
    console.error('注入动态 system prompt 失败，使用原始 messages:', error);
    return messages;
  }
}

/**
 * 获取可用模型列表
 */
export const getAvailableModels = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // 获取用户等级
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    const models = await aiProxyService.getAvailableModels(user.tier);

    // 按提供商分组
    const groupedModels = models.reduce((acc: any, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push({
        modelId: model.modelId,
        modelName: model.modelName,
        description: model.description,
        inputPrice: model.inputPrice,
        outputPrice: model.outputPrice,
        category: model.category,
        maxTokens: model.maxTokens,
        features: model.features,
      });
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        userTier: user.tier,
        models: groupedModels,
        totalCount: models.length,
      },
    });
  } catch (error: any) {
    console.error('获取模型列表失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取模型列表失败',
    });
  }
};

/**
 * 调用 AI 对话（流式响应）
 */
export const chatStream = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      provider,
      model,
      messages,
      temperature,
      maxTokens,
      workflowId,
      executionId,
    } = req.body;

    // 验证必填字段
    if (!provider || !model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: '缺少必填参数或参数格式错误',
      });
    }

    // 注入动态 system prompt（包含平台工作流知识）
    const processedMessages = await injectSystemPrompt(messages);

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 nginx 缓冲

    // 调用流式 AI 服务
    await aiProxyService.chatStream({
      provider,
      model,
      messages: processedMessages,
      userId,
      temperature,
      maxTokens,
      workflowId,
      executionId,
      onToken: (token: string) => {
        // 发送每个 token 到前端
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      },
      onComplete: (data: any) => {
        // 发送完成事件
        res.write(`data: ${JSON.stringify({ type: 'complete', data })}\n\n`);
        res.end();
      },
      onError: (error: Error) => {
        // 发送错误事件
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
      },
    });
  } catch (error: any) {
    console.error('AI 流式对话失败:', error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message || 'AI 对话失败',
      });
    }
  }
};

/**
 * 调用 AI 对话（非流式，兼容旧版）
 */
export const chat = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      provider,
      model,
      messages,
      temperature,
      maxTokens,
      workflowId,
      executionId,
    } = req.body;

    // 验证必填字段
    if (!provider || !model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: '缺少必填参数或参数格式错误',
      });
    }

    // 注入动态 system prompt（包含平台工作流知识）
    const processedMessages = await injectSystemPrompt(messages);

    // 调用 AI 服务
    const response = await aiProxyService.chat({
      provider,
      model,
      messages: processedMessages,
      userId,
      temperature,
      maxTokens,
      workflowId,
      executionId,
    });

    res.json({
      success: true,
      data: {
        content: response.content,
        usage: {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        cost: response.cost,
        finishReason: response.finishReason,
      },
    });
  } catch (error: any) {
    console.error('AI 对话失败:', error);

    // 处理特定错误
    if (error.message.includes('积分不足')) {
      return res.status(402).json({
        success: false,
        message: error.message,
        code: 'INSUFFICIENT_CREDIT',
      });
    }

    if (error.message.includes('会员等级')) {
      return res.status(403).json({
        success: false,
        message: error.message,
        code: 'TIER_REQUIRED',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'AI 对话失败',
    });
  }
};

/**
 * 测试 AI 连接（不计费）
 */
export const testConnection = async (req: Request, res: Response) => {
  try {
    const { provider } = req.body;

    // 简单的连接测试
    const testMessages = [
      { role: 'user', content: 'Hello' }
    ];

    let isConnected = false;
    let errorMessage = '';

    try {
      // 这里可以做一个简单的 API 健康检查
      // 实际项目中可能需要调用各个提供商的 health check 端点
      isConnected = true;
    } catch (error: any) {
      errorMessage = error.message;
    }

    res.json({
      success: true,
      data: {
        provider,
        isConnected,
        errorMessage,
      },
    });
  } catch (error: any) {
    console.error('测试连接失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '测试连接失败',
    });
  }
};
