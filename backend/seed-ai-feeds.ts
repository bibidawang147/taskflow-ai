// 种子脚本：添加测试用的 AI Feeds 数据
// 运行方式: npx ts-node seed-ai-feeds.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sampleFeeds = [
  {
    title: 'OpenAI 发布 GPT-5：下一代人工智能模型的重大突破',
    aiSummary: `OpenAI 今日正式发布了其最新的 GPT-5 模型，这是继 GPT-4 之后的又一次重大技术飞跃。

主要亮点：
• 推理能力提升 3 倍，在数学和编程任务中表现尤为突出
• 支持多达 128K 上下文窗口
• 全新的多模态能力，可以同时处理文本、图像和音频
• 更低的 API 调用成本，相比 GPT-4 降低 40%

该模型已经在多个基准测试中超越了此前的所有模型，包括 Claude 3.5 和 Gemini Ultra。OpenAI 计划在下个月向所有 API 用户开放访问权限。`,
    originalUrl: 'https://openai.com/blog/gpt-5',
    tags: JSON.stringify(['AI', 'OpenAI', 'GPT', 'LLM']),
    sourceName: 'OpenAI Blog',
    author: 'Sam Altman'
  },
  {
    title: 'Cursor AI：重新定义代码编辑器的未来',
    aiSummary: `Cursor 是一款基于 AI 的代码编辑器，它正在改变开发者编写代码的方式。

核心功能：
• 智能代码补全：不仅能预测下一行代码，还能理解整个项目上下文
• AI 对话：直接在编辑器中与 AI 讨论代码问题
• 自动重构：一键重构代码，保持代码整洁
• 多模型支持：集成 GPT-4、Claude 等多个 AI 模型

用户反馈显示，使用 Cursor 后开发效率平均提升 40%。目前已有超过 100 万开发者在使用这款工具。`,
    originalUrl: 'https://cursor.com/features',
    tags: JSON.stringify(['AI', '开发工具', 'IDE', '代码编辑器']),
    sourceName: 'TechCrunch',
    author: 'Sarah Chen'
  },
  {
    title: 'Midjourney V7 发布：AI 图像生成达到照片级真实感',
    aiSummary: `Midjourney 发布了其第 7 版图像生成模型，在真实感和细节方面取得了巨大进步。

新版本特性：
• 照片级真实感：生成的人像几乎无法与真实照片区分
• 精准的光影处理：自然光、人造光的表现更加逼真
• 文字生成能力：终于可以正确生成图像中的文字
• 风格控制：更精细的艺术风格参数调整

V7 版本目前在 Discord 上限量测试，预计下月全面开放。订阅用户可以优先获得访问权限。`,
    originalUrl: 'https://midjourney.com/blog/v7',
    tags: JSON.stringify(['AI', '图像生成', 'Midjourney', '艺术']),
    sourceName: 'Midjourney Blog',
    author: 'David Holz'
  },
  {
    title: '2024 年最值得学习的 10 个 AI 工具',
    aiSummary: `本文盘点了 2024 年最值得开发者和创作者学习的 AI 工具。

精选工具列表：
1. ChatGPT - 对话式 AI 助手
2. Claude - 更安全、更有深度的 AI 对话
3. Midjourney - 顶级 AI 图像生成
4. Cursor - AI 代码编辑器
5. Notion AI - 智能文档助手
6. Descript - AI 视频编辑
7. ElevenLabs - AI 语音合成
8. Runway - AI 视频生成
9. Perplexity - AI 搜索引擎
10. GitHub Copilot - AI 编程助手

每个工具都有详细的使用教程和最佳实践建议。`,
    originalUrl: 'https://www.producthunt.com/stories/top-ai-tools-2024',
    tags: JSON.stringify(['AI', '工具推荐', '效率', '学习资源']),
    sourceName: 'Product Hunt',
    author: 'Ryan Hoover'
  },
  {
    title: 'Anthropic 发布 Claude 4：专注安全的下一代 AI',
    aiSummary: `Anthropic 宣布推出 Claude 4 模型，这是其 Constitutional AI 技术的最新成果。

技术亮点：
• 更强的推理能力，特别是在长文本分析方面
• 200K 上下文窗口，支持阅读整本书籍
• 增强的代码生成能力
• 更好的多语言支持，包括中文
• 显著降低了幻觉问题

Claude 4 在安全性方面进行了大量投入，能够更好地拒绝有害请求，同时保持有用性。API 已向所有开发者开放。`,
    originalUrl: 'https://anthropic.com/news/claude-4',
    tags: JSON.stringify(['AI', 'Anthropic', 'Claude', 'LLM', '安全']),
    sourceName: 'Anthropic',
    author: 'Dario Amodei'
  },
  {
    title: '小红书运营必备：AI 工具提升内容创作效率',
    aiSummary: `本文分享了如何利用 AI 工具提升小红书内容创作效率的实用技巧。

推荐的 AI 工作流：
• 选题规划：使用 ChatGPT 生成热门选题
• 标题优化：AI 分析高互动标题特征
• 文案撰写：Claude 协助撰写种草文案
• 图片生成：Midjourney 制作精美配图
• 数据分析：AI 工具分析内容表现

作者亲测这套流程后，账号粉丝在 3 个月内从 1000 涨到 10 万。文章包含详细的操作步骤和提示词模板。`,
    originalUrl: 'https://mp.weixin.qq.com/s/xiaohongshu-ai',
    tags: JSON.stringify(['小红书', '内容创作', 'AI', '运营技巧']),
    sourceName: '公众号',
    author: '小红书运营达人'
  },
  {
    title: 'Stable Diffusion 3.5 开源发布：本地部署 AI 绘画的最佳选择',
    aiSummary: `Stability AI 开源了 Stable Diffusion 3.5 模型，为本地部署 AI 图像生成提供了新选择。

模型特点：
• 完全开源，可商用
• 支持本地部署，保护数据隐私
• 8GB 显存即可运行基础版本
• 图像质量接近 DALL-E 3
• 支持 ControlNet 等扩展

安装要求：
- NVIDIA GPU，至少 8GB 显存
- Python 3.10+
- PyTorch 2.0+

文章提供了详细的安装教程和常见问题解答。`,
    originalUrl: 'https://stability.ai/blog/sd-3-5',
    tags: JSON.stringify(['AI', '开源', 'Stable Diffusion', '图像生成']),
    sourceName: 'Stability AI',
    author: 'Emad Mostaque'
  },
  {
    title: '如何用 AI 自动化你的工作流程：从入门到精通',
    aiSummary: `本指南详细介绍了如何使用 AI 自动化日常工作流程，适合各个技术水平的读者。

自动化场景：
1. 邮件处理：AI 自动分类、摘要和回复建议
2. 文档整理：智能归档和标签
3. 会议记录：自动转录和要点提取
4. 数据分析：自然语言查询数据库
5. 客服响应：AI 客服机器人

推荐工具组合：
• Zapier + ChatGPT：自动化工作流
• Make (Integromat)：复杂流程编排
• n8n：开源自动化平台

每个场景都配有实际案例和详细配置步骤。`,
    originalUrl: 'https://automation.guide/ai-workflows',
    tags: JSON.stringify(['AI', '自动化', '效率', '工作流']),
    sourceName: 'Automation Guide',
    author: 'Tech Expert'
  }
]

async function main() {
  console.log('开始添加测试数据...')

  for (const feed of sampleFeeds) {
    await prisma.aiFeed.create({
      data: feed
    })
    console.log(`已添加: ${feed.title}`)
  }

  console.log(`\n✅ 成功添加 ${sampleFeeds.length} 条测试数据`)
}

main()
  .catch((e) => {
    console.error('添加数据失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
