import { PrismaClient } from '@prisma/client';
import { ArticleAnalysisService } from '../src/services/articleAnalysisService';
import { WorkflowTemplateService } from '../src/services/workflowTemplateService';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * 从本地文章内容批量生成工作流
 * 避免网站反爬问题
 */

// 示例：ChatGPT提示词优化文章内容
const sampleArticles = [
  {
    title: 'ChatGPT提示词优化技巧 - 10倍提升输出质量',
    content: `
# ChatGPT提示词优化技巧

使用ChatGPT时,好的提示词可以大幅提升输出质量。以下是一个完整的工作流程:

## 步骤1: 明确目标和上下文
首先清晰定义你想要AI完成的任务。包含:
- 任务类型 (写作/分析/翻译等)
- 目标受众
- 期望的输出格式
- 语气和风格要求

## 步骤2: 提供充分的背景信息
给AI足够的上下文,让它理解你的需求:
- 项目背景
- 相关数据和信息
- 已有的素材
- 特殊要求和限制

## 步骤3: 使用结构化提示词
采用清晰的结构:
- 角色定义: "你是一个专业的..."
- 任务说明: "请帮我..."
- 输出要求: "返回格式为..."
- 示例参考: "类似这样的风格..."

## 步骤4: 迭代优化
根据首次输出调整提示词:
- 如果输出太泛,增加具体要求
- 如果方向偏离,明确核心目标
- 如果格式不对,提供明确示例

## 步骤5: 验证和完善
检查AI输出的质量:
- 内容准确性
- 格式规范性
- 是否符合预期
- 进行必要的人工调整

## 实战示例

坏的提示词: "写一篇关于AI的文章"

好的提示词: "你是一个科技博主,擅长用通俗易懂的方式解释复杂技术。请写一篇800字的文章,向普通用户介绍ChatGPT的原理和应用场景。要求:1)包含3个实际应用案例 2)避免使用专业术语 3)语气轻松友好。"

## 总结

掌握提示词工程可以让你的ChatGPT使用效率提升10倍以上。核心是:明确目标、提供上下文、结构化表达、持续迭代。
    `,
    category: '办公效率',
    tags: ['ChatGPT', '提示词', 'AI工具', '效率']
  },

  {
    title: 'Midjourney AI绘画完整工作流 - 从提示词到成品',
    content: `
# Midjourney AI绘画完整工作流

## 第1步: 明确创作需求
在开始之前,先确定:
- 图片用途 (海报/LOGO/插画等)
- 风格偏好 (写实/卡通/抽象等)
- 色彩要求
- 尺寸比例

## 第2步: 构建基础提示词
核心要素包括:
- 主体描述: "a cute cat"
- 风格定义: "anime style"
- 画质要求: "high quality, detailed"
- 艺术家参考: "by Hayao Miyazaki"

## 第3步: 添加参数优化
使用Midjourney参数:
- --ar 16:9 (设置比例)
- --v 6 (版本选择)
- --s 750 (风格化程度)
- --q 2 (质量参数)

完整示例:
/imagine a cute cat playing piano, anime style, colorful, high quality --ar 16:9 --v 6

## 第4步: 生成并选择
Midjourney会生成4个选项:
- 使用U1-U4放大喜欢的图
- 使用V1-V4生成变体
- 调整提示词重新生成

## 第5步: 精修和调整
对选中的图片:
- 使用Vary Region进行局部修改
- Upscale提高分辨率
- Remix调整细节

## 第6步: 后期处理
导出后可以:
- 在Photoshop中精修
- 使用AI工具去除瑕疵
- 调整色彩和亮度
- 添加文字或其他元素

## 常用提示词模板

人物肖像:
portrait of [描述], [风格], professional photography, studio lighting --ar 2:3

风景场景:
landscape of [场景], [时间], [天气], cinematic, 8k --ar 16:9

产品设计:
product design of [产品], minimalist, white background, professional --ar 1:1

## 技巧总结
1. 使用,分隔关键词
2. 越具体的描述,效果越好
3. 多尝试不同的参数组合
4. 参考优秀作品的提示词
5. 建立自己的提示词库
    `,
    category: '设计',
    tags: ['Midjourney', 'AI绘画', '提示词', '设计']
  },

  {
    title: 'GitHub Copilot高效编程工作流',
    content: `
# GitHub Copilot高效编程工作流

## 步骤1: 写清晰的注释
Copilot根据注释生成代码,所以注释要:
- 描述函数功能
- 说明输入输出
- 列出关键步骤

示例:
// 函数: 计算两个日期之间的工作日数量
// 输入: startDate, endDate (Date对象)
// 输出: 工作日数量 (number)
// 排除周末和法定节假日

## 步骤2: 利用函数命名
好的函数名会触发更准确的建议:
- calculateWorkingDays() ✓
- calc() ✗

## 步骤3: 逐步引导生成
不要一次生成完整函数,而是:
1. 先写函数签名
2. 写第一步的注释,让它生成
3. 写第二步的注释,继续生成
4. 逐步完成整个函数

## 步骤4: 代码审查和优化
Copilot生成的代码需要:
- 检查边界条件
- 验证错误处理
- 优化性能
- 添加单元测试

## 步骤5: 测试驱动开发
先写测试用例:
// 测试: 同一天应返回0
test('same day returns 0', () => {
  // Copilot会自动补全测试代码
})

## 步骤6: 利用Inline Chat
使用Cmd+I调出内联对话:
- "优化这段代码的性能"
- "添加错误处理"
- "重构为TypeScript"

## 实战技巧

1. 善用快捷键
- Tab: 接受建议
- Option+]: 下一个建议
- Option+[: 上一个建议

2. 多文件上下文
打开相关文件,Copilot会参考它们的代码风格

3. 使用示例驱动
写一两个示例,Copilot会延续这个模式

4. 提示词优化
在注释中使用"使用[库名]"明确技术栈

## 效率提升案例

传统方式: 写一个REST API需要30分钟
使用Copilot:
1. 写清晰的路由注释 (2分钟)
2. 生成路由代码 (1分钟)
3. 补全中间件和验证 (5分钟)
4. 添加测试用例 (5分钟)
总计: 13分钟,效率提升2倍+

## 总结
GitHub Copilot是AI助手,不是替代品。核心是:
- 人提供思路和架构
- AI负责重复性代码
- 人最终审查和优化
    `,
    category: '编程开发',
    tags: ['GitHub Copilot', 'AI编程', '效率工具', '开发']
  }
];

async function batchGenerateFromContent() {
  console.log('📝 从本地内容批量生成工作流\n');

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

  let successCount = 0;

  for (let i = 0; i < sampleArticles.length; i++) {
    const article = sampleArticles[i];
    console.log(`\n[${i + 1}/${sampleArticles.length}] ${article.title}\n`);

    try {
      // AI分析
      console.log('  → AI分析提取工作流...');
      const analysisResult = await ArticleAnalysisService.analyzeArticleAndExtractWorkflow(
        article.title,
        article.content
      );
      console.log(`     ✓ 工作流标题: ${analysisResult.workflowTitle}`);
      console.log(`     ✓ 分类: ${analysisResult.category}`);
      console.log(`     ✓ 步骤数: ${analysisResult.steps.length}`);
      console.log(`     ✓ 标签: ${analysisResult.tags.join(', ')}\n`);

      // 生成配置
      const workflowConfig = WorkflowTemplateService.generateDynamicWorkflow(
        analysisResult.steps,
        'manual-content'
      );

      // 保存
      const workflow = await prisma.workflow.create({
        data: {
          title: analysisResult.workflowTitle,
          description: analysisResult.workflowDescription,
          category: analysisResult.category,
          tags: analysisResult.tags.join(','),
          sourceType: 'manual',
          sourceTitle: article.title,
          config: JSON.parse(JSON.stringify(workflowConfig)),
          isPublic: true,
          isTemplate: true,
          authorId: systemUser.id,
          version: '1.0.0',
          sourceMeta: {
            originalCategory: article.category,
            extractedAt: new Date().toISOString(),
            stepsCount: analysisResult.steps.length,
            method: 'manual-content'
          }
        }
      });

      console.log(`     ✅ 成功创建: ${workflow.id}\n`);
      console.log('─'.repeat(60));
      successCount++;

      // 等待
      if (i < sampleArticles.length - 1) {
        console.log('⏳ 等待2秒...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error: any) {
      console.error(`     ❌ 失败: ${error.message}\n`);
    }
  }

  console.log(`\n✅ 完成! 成功生成 ${successCount}/${sampleArticles.length} 个工作流\n`);

  // 统计
  const total = await prisma.workflow.count();
  console.log(`数据库总工作流: ${total} 个`);
}

batchGenerateFromContent()
  .catch((e) => {
    console.error('生成失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
