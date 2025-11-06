import { PrismaClient } from '@prisma/client';
import { ArticleAnalysisService } from '../src/services/articleAnalysisService';
import { WorkflowTemplateService } from '../src/services/workflowTemplateService';

const prisma = new PrismaClient();

/**
 * 小规模测试 - 只处理2篇文章
 */
const testArticles = [
  {
    url: 'https://sspai.com/post/80456',
    category: '内容创作',
    description: 'ChatGPT写作技巧'
  },
  {
    url: 'https://platform.openai.com/docs/guides/prompt-engineering',
    category: '办公效率',
    description: 'OpenAI提示词工程'
  }
];

async function testBatchGenerate() {
  console.log('🧪 开始小规模测试（2篇文章）\n');

  // 获取系统用户
  let systemUser = await prisma.user.findFirst({
    where: { email: 'system@workflow.com' }
  });

  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        name: '系统管理员',
        email: 'system@workflow.com',
        password: 'system-account-no-login'
      }
    });
  }

  console.log(`✓ 系统用户: ${systemUser.id}\n`);

  for (let i = 0; i < testArticles.length; i++) {
    const article = testArticles[i];
    console.log(`\n[${i + 1}/${testArticles.length}] ${article.description}`);
    console.log(`URL: ${article.url}\n`);

    try {
      // 抓取文章
      console.log('  1️⃣ 抓取文章内容...');
      const articleData = await ArticleAnalysisService.fetchArticleContent(article.url);
      console.log(`     ✓ 标题: ${articleData.title}`);
      console.log(`     ✓ 内容长度: ${articleData.content.length} 字符\n`);

      // AI分析
      console.log('  2️⃣ AI分析提取工作流...');
      const analysisResult = await ArticleAnalysisService.analyzeArticleAndExtractWorkflow(
        articleData.title,
        articleData.content
      );
      console.log(`     ✓ 工作流标题: ${analysisResult.workflowTitle}`);
      console.log(`     ✓ 分类: ${analysisResult.category}`);
      console.log(`     ✓ 提取步骤: ${analysisResult.steps.length} 个`);
      console.log(`     ✓ 标签: ${analysisResult.tags.join(', ')}\n`);

      // 显示步骤详情
      console.log('     步骤预览:');
      analysisResult.steps.slice(0, 3).forEach((step, idx) => {
        console.log(`       ${idx + 1}. ${step.title} [${step.type}]`);
      });
      if (analysisResult.steps.length > 3) {
        console.log(`       ... 还有 ${analysisResult.steps.length - 3} 个步骤\n`);
      }

      // 生成配置
      console.log('  3️⃣ 生成工作流配置...');
      const workflowConfig = WorkflowTemplateService.generateDynamicWorkflow(
        analysisResult.steps,
        article.url
      );
      console.log(`     ✓ 节点数: ${workflowConfig.nodes.length}`);
      console.log(`     ✓ 连接数: ${workflowConfig.edges.length}\n`);

      // 保存到数据库
      console.log('  4️⃣ 保存到数据库...');
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
          isPublic: true,
          isTemplate: true,
          authorId: systemUser.id,
          version: '1.0.0',
          sourceMeta: {
            originalCategory: article.category,
            extractedAt: new Date().toISOString(),
            stepsCount: analysisResult.steps.length
          }
        }
      });

      console.log(`     ✅ 成功! ID: ${workflow.id}\n`);
      console.log('─'.repeat(60));

      // 等待，避免限流
      if (i < testArticles.length - 1) {
        console.log('⏳ 等待3秒...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

    } catch (error: any) {
      console.error(`\n     ❌ 失败: ${error.message}\n`);
      console.log('─'.repeat(60));
    }
  }

  console.log('\n✅ 测试完成！\n');

  // 显示结果统计
  const total = await prisma.workflow.count();
  console.log(`数据库总工作流: ${total} 个`);
}

testBatchGenerate()
  .catch((e) => {
    console.error('测试失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
