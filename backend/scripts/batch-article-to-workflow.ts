import { PrismaClient } from '@prisma/client';
import { ArticleAnalysisService, WorkflowStep } from '../src/services/articleAnalysisService';
import { WorkflowTemplateService } from '../src/services/workflowTemplateService';

const prisma = new PrismaClient();

/**
 * 批量从文章生成工作流
 * 用于初期平台内容建设
 */

// 优质AI教程文章列表
const articleUrls = [
  // ChatGPT 实战教程
  {
    url: 'https://www.lennysnewsletter.com/p/how-to-use-chatgpt-to-10x-your-productivity',
    category: '办公效率',
    description: 'ChatGPT提升生产力'
  },

  // Midjourney 教程
  {
    url: 'https://docs.midjourney.com/docs/quick-start',
    category: '设计',
    description: 'Midjourney快速入门'
  },

  // GitHub Copilot 使用指南
  {
    url: 'https://github.blog/2023-06-20-how-to-write-better-prompts-for-github-copilot/',
    category: '编程开发',
    description: 'GitHub Copilot提示词优化'
  },

  // AI写作工具
  {
    url: 'https://www.notion.so/blog/ai-writing-assistant',
    category: '内容创作',
    description: 'Notion AI写作助手'
  },

  // Stable Diffusion 教程
  {
    url: 'https://stable-diffusion-art.com/beginners-guide/',
    category: '设计',
    description: 'Stable Diffusion新手指南'
  },

  // Claude AI 使用技巧
  {
    url: 'https://www.anthropic.com/news/100k-context-windows',
    category: '办公效率',
    description: 'Claude长文本处理'
  },

  // AI数据分析
  {
    url: 'https://openai.com/blog/chatgpt-plugins',
    category: '数据分析',
    description: 'ChatGPT插件数据分析'
  },

  // AI代码审查
  {
    url: 'https://github.blog/2023-03-22-github-copilot-x-the-ai-powered-developer-experience/',
    category: '编程开发',
    description: 'GitHub Copilot X开发体验'
  },

  // DALL-E 图像生成
  {
    url: 'https://help.openai.com/en/articles/6654000-best-practices-for-prompt-engineering-with-openai-api',
    category: '设计',
    description: 'OpenAI API提示词工程'
  },

  // Notion AI 工作流
  {
    url: 'https://www.notion.so/help/guides/automate-notion-with-ai',
    category: '办公效率',
    description: 'Notion AI自动化'
  },

  // 中文资源 - 少数派AI文章
  {
    url: 'https://sspai.com/post/80456',
    category: '内容创作',
    description: 'ChatGPT写作技巧'
  },

  // AI视频制作
  {
    url: 'https://runwayml.com/ai-magic-tools/',
    category: '内容创作',
    description: 'Runway AI视频工具'
  },

  // AI PPT生成
  {
    url: 'https://gamma.app/docs/How-to-use-Gamma-AI',
    category: '办公效率',
    description: 'Gamma AI演示文稿'
  },

  // AI英语学习
  {
    url: 'https://www.fluentu.com/blog/english/ai-english-learning/',
    category: '学习提升',
    description: 'AI英语学习方法'
  },

  // AI思维导图
  {
    url: 'https://www.xmind.net/blog/en/ai-mind-mapping/',
    category: '学习提升',
    description: 'XMind AI思维导图'
  }
];

async function batchGenerateWorkflows() {
  console.log('🚀 开始批量生成工作流...\n');

  // 确保存在系统用户
  let systemUser = await prisma.user.findFirst({
    where: { email: 'system@workflow.com' }
  });

  if (!systemUser) {
    console.log('创建系统用户...');
    systemUser = await prisma.user.create({
      data: {
        name: '系统管理员',
        email: 'system@workflow.com',
        password: 'system-account-no-login'
      }
    });
    console.log(`✓ 系统用户已创建: ${systemUser.id}\n`);
  } else {
    console.log(`✓ 使用已有系统用户: ${systemUser.id}\n`);
  }

  let successCount = 0;
  let failCount = 0;
  const results: any[] = [];

  for (let i = 0; i < articleUrls.length; i++) {
    const article = articleUrls[i];
    console.log(`\n[${i + 1}/${articleUrls.length}] 处理文章: ${article.description}`);
    console.log(`URL: ${article.url}`);

    try {
      // 步骤1: 抓取文章内容
      console.log('  → 抓取文章内容...');
      const articleData = await ArticleAnalysisService.fetchArticleContent(article.url);
      console.log(`  ✓ 文章标题: ${articleData.title}`);

      // 步骤2: AI分析提取工作流
      console.log('  → AI分析中...');
      const analysisResult = await ArticleAnalysisService.analyzeArticleAndExtractWorkflow(
        articleData.title,
        articleData.content
      );
      console.log(`  ✓ 提取了 ${analysisResult.steps.length} 个步骤`);

      // 步骤3: 生成工作流配置
      const workflowConfig = WorkflowTemplateService.generateDynamicWorkflow(
        analysisResult.steps,
        article.url
      );

      // 步骤4: 保存到数据库
      console.log('  → 保存到数据库...');
      const workflow = await prisma.workflow.create({
        data: {
          title: analysisResult.workflowTitle,
          description: analysisResult.workflowDescription,
          category: analysisResult.category,
          tags: analysisResult.tags.join(','),
          sourceType: 'web',
          sourceUrl: article.url,
          sourceTitle: articleData.title,
          config: JSON.parse(JSON.stringify(workflowConfig)),
          isPublic: true,  // 公开分享
          isTemplate: true, // 标记为模板
          authorId: systemUser.id,
          version: '1.0.0',
          sourceMeta: {
            originalCategory: article.category,
            originalDescription: article.description,
            extractedAt: new Date().toISOString(),
            stepsCount: analysisResult.steps.length
          }
        }
      });

      console.log(`  ✅ 成功创建工作流: ${workflow.title} (ID: ${workflow.id})`);

      successCount++;
      results.push({
        status: 'success',
        url: article.url,
        workflowId: workflow.id,
        title: workflow.title
      });

      // 避免API限流，等待2秒
      if (i < articleUrls.length - 1) {
        console.log('  ⏳ 等待2秒...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error: any) {
      console.error(`  ❌ 处理失败: ${error.message}`);
      failCount++;
      results.push({
        status: 'failed',
        url: article.url,
        error: error.message
      });

      // 失败后也等待，避免连续失败导致封禁
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // 生成总结报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 批量生成完成！');
  console.log('='.repeat(60));
  console.log(`✅ 成功: ${successCount} 个`);
  console.log(`❌ 失败: ${failCount} 个`);
  console.log(`📝 总计: ${articleUrls.length} 个\n`);

  // 输出成功的工作流列表
  if (successCount > 0) {
    console.log('成功创建的工作流:');
    results
      .filter(r => r.status === 'success')
      .forEach((r, idx) => {
        console.log(`  ${idx + 1}. ${r.title} (ID: ${r.workflowId})`);
      });
  }

  // 输出失败的URL
  if (failCount > 0) {
    console.log('\n失败的URL:');
    results
      .filter(r => r.status === 'failed')
      .forEach((r, idx) => {
        console.log(`  ${idx + 1}. ${r.url}`);
        console.log(`     错误: ${r.error}`);
      });
  }

  // 按分类统计
  console.log('\n按分类统计:');
  const workflows = await prisma.workflow.groupBy({
    by: ['category'],
    _count: { category: true }
  });
  workflows.sort((a, b) => b._count.category - a._count.category).forEach(w => {
    console.log(`  ${w.category.padEnd(15)} : ${w._count.category} 个`);
  });

  const total = await prisma.workflow.count();
  console.log(`\n总工作流数: ${total} 个`);
}

// 执行脚本
batchGenerateWorkflows()
  .catch((e) => {
    console.error('批量生成失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
