import { Router, Request, Response } from 'express';
import crawlerService from '../services/crawler.service';
import aiAnalyzerService from '../services/ai-analyzer.service';
import prisma from '../utils/database';
import logger from '../utils/logger';

const router = Router();

/**
 * 检查爬虫环境
 */
router.get('/check-environment', async (req: Request, res: Response) => {
  try {
    const result = await crawlerService.checkEnvironment();
    res.json(result);
  } catch (error) {
    logger.error('检查爬虫环境失败:', error);
    res.status(500).json({
      ready: false,
      message: error instanceof Error ? error.message : '未知错误',
    });
  }
});

/**
 * 爬取小红书数据
 * POST /api/crawler/xiaohongshu
 * Body: { keywords: string, maxCount?: number }
 */
router.post('/xiaohongshu', async (req: Request, res: Response) => {
  try {
    const { keywords, maxCount = 20 } = req.body;

    if (!keywords || typeof keywords !== 'string') {
      return res.status(400).json({
        success: false,
        error: '请提供搜索关键词',
      });
    }

    logger.info(`开始爬取小红书，关键词: ${keywords}`);

    // 执行爬虫
    const result = await crawlerService.crawlXiaohongshu(keywords, maxCount);

    if (!result.success || !result.data) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      count: result.data.length,
      data: result.data,
    });
  } catch (error) {
    logger.error('爬取小红书数据失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
});

/**
 * 爬取并分析，生成工作流
 * POST /api/crawler/crawl-and-analyze
 * Body: { keywords: string, maxCount?: number, userId: string }
 */
router.post('/crawl-and-analyze', async (req: Request, res: Response) => {
  try {
    const { keywords, maxCount = 20, userId } = req.body;

    if (!keywords || !userId) {
      return res.status(400).json({
        success: false,
        error: '请提供关键词和用户ID',
      });
    }

    logger.info(`开始爬取并分析，关键词: ${keywords}`);

    // 1. 爬取数据
    const crawlResult = await crawlerService.crawlXiaohongshu(keywords, maxCount);

    if (!crawlResult.success || !crawlResult.data) {
      return res.status(500).json({
        success: false,
        error: '爬取数据失败',
        details: crawlResult.error,
      });
    }

    logger.info(`爬取到 ${crawlResult.data.length} 条笔记`);

    // 2. AI 分析转换为工作流
    const workflows = await aiAnalyzerService.batchAnalyzeNotes(crawlResult.data);

    logger.info(`成功提取 ${workflows.length} 个工作流`);

    // 3. 保存到数据库
    const savedWorkflows = [];
    for (const workflow of workflows) {
      try {
        const workflowData = aiAnalyzerService.convertToWorkflowData(workflow, userId);

        const saved = await prisma.workflow.create({
          data: workflowData,
        });

        savedWorkflows.push(saved);
        logger.info(`保存工作流: ${saved.title}`);
      } catch (error) {
        logger.error(`保存工作流失败:`, error);
      }
    }

    res.json({
      success: true,
      crawled: crawlResult.data.length,
      analyzed: workflows.length,
      saved: savedWorkflows.length,
      workflows: savedWorkflows.map(w => ({
        id: w.id,
        title: w.title,
        description: w.description,
        category: w.category,
      })),
    });
  } catch (error) {
    logger.error('爬取分析流程失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
});

/**
 * 只分析已爬取的数据（用于测试）
 * POST /api/crawler/analyze-note
 * Body: { noteId, title, desc, ... }
 */
router.post('/analyze-note', async (req: Request, res: Response) => {
  try {
    const note = req.body;

    const workflow = await aiAnalyzerService.analyzeNoteToWorkflow(note);

    if (!workflow) {
      return res.json({
        success: true,
        isAITutorial: false,
        message: '该笔记不包含AI工具教程',
      });
    }

    res.json({
      success: true,
      isAITutorial: true,
      workflow,
    });
  } catch (error) {
    logger.error('分析笔记失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
});

export default router;
