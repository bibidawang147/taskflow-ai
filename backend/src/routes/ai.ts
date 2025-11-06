import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAvailableModels,
  chat,
  chatStream,
  testConnection,
} from '../controllers/ai.controller';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * GET /api/ai/models
 * 获取用户可用的模型列表
 */
router.get('/models', getAvailableModels);

/**
 * POST /api/ai/chat/stream
 * AI 对话接口（流式响应）
 * Body: {
 *   provider: string,
 *   model: string,
 *   messages: Array<{role: string, content: string}>,
 *   temperature?: number,
 *   maxTokens?: number,
 *   workflowId?: string,
 *   executionId?: string
 * }
 */
router.post('/chat/stream', chatStream);

/**
 * POST /api/ai/chat
 * AI 对话接口（非流式，兼容旧版）
 * Body: {
 *   provider: string,
 *   model: string,
 *   messages: Array<{role: string, content: string}>,
 *   temperature?: number,
 *   maxTokens?: number,
 *   workflowId?: string,
 *   executionId?: string
 * }
 */
router.post('/chat', chat);

/**
 * POST /api/ai/test-connection
 * 测试 AI 服务连接
 * Body: { provider: string }
 */
router.post('/test-connection', testConnection);

export default router;
