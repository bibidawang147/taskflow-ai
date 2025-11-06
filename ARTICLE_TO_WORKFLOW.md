# 文章转工作流功能文档 (智能版)

## 功能概述

**这是一个 AI 驱动的智能工作流生成工具！**

用户只需输入文章 URL，系统会：

1. 🌐 **抓取文章内容** - 自动获取网页正文
2. 📖 **AI 分析文章** - 使用 GPT-4o 理解文章内容
3. 🔍 **识别工作流程** - 自动提取文章中描述的步骤和流程
4. 🎯 **生成工作流** - 将步骤转化为可执行的工作流节点
5. ⚙️ **智能配置** - 自动设置每个节点的类型和参数
6. 🔗 **建立连接** - 创建节点间的逻辑关系

**关键特性：每篇文章生成的工作流都是不同的！**

### 示例

| 文章类型 | 生成的工作流 |
|---------|-------------|
| "如何写一篇SEO友好的博客" | 博客创作工作流（关键词研究 → 大纲撰写 → 内容生成 → SEO优化） |
| "数据分析的5个步骤" | 数据分析工作流（数据收集 → 清洗 → 分析 → 可视化 → 报告） |
| "产品设计流程" | 产品设计工作流（需求调研 → 原型设计 → 用户测试 → 迭代） |

## 技术实现

### 后端实现

#### 1. 文章分析服务 (`backend/src/services/articleAnalysisService.ts`)

**核心服务** - 负责抓取和AI分析

主要功能：
- `fetchArticleContent(url)` - 使用 Jina Reader API 抓取文章
- `analyzeArticleAndExtractWorkflow()` - 使用 GPT-4o 分析文章并提取工作流

AI 提示词策略：
```
系统会要求 AI 分析文章并返回：
- workflowTitle: 工作流标题
- workflowDescription: 工作流描述
- steps: 步骤数组（每个步骤包含标题、描述、类型、配置）
- category: 分类
- tags: 标签
```

#### 2. 工作流模板服务 (`backend/src/services/workflowTemplateService.ts`)

**动态生成器** - 根据 AI 分析结果生成工作流

主要方法：
```typescript
// 🆕 根据分析结果动态生成工作流
WorkflowTemplateService.generateDynamicWorkflow(steps: WorkflowStep[], url?: string)

// 向后兼容的静态模板
WorkflowTemplateService.generateKnowledgeExtractionWorkflow(url?: string)
```

节点类型映射：
- `llm` → AI处理节点（写作、分析、总结等）
- `tool` → 工具调用节点（API、数据处理等）
- `condition` → 条件判断节点
- `transform` → 数据转换节点

#### 3. API端点 (`backend/src/routes/workflows.ts`)

**POST /api/workflows/generate/from-article** 🆕 智能版本

执行流程：
1. 验证 URL 格式
2. 调用 `ArticleAnalysisService.fetchArticleContent()` 抓取文章
3. 调用 `ArticleAnalysisService.analyzeArticleAndExtractWorkflow()` AI分析
4. 调用 `WorkflowTemplateService.generateDynamicWorkflow()` 生成工作流
5. 保存到数据库并返回

请求参数：
```json
{
  "url": "https://example.com/article",
  "autoSave": true
}
```

返回数据：
```json
{
  "message": "工作流创建成功",
  "workflow": { ... },
  "analysis": {
    "articleTitle": "文章标题",
    "stepsExtracted": 5,
    "category": "content-creation",
    "tags": ["写作", "SEO"]
  }
}
```

**GET /api/workflows/templates**
- 获取可用的工作流模板列表
- 无需认证

### 前端实现

#### 页面：`ArticleToWorkflowPage` (`frontend/src/pages/ArticleToWorkflowPage.tsx`)

🆕 功能特点：
- ✨ 精美的渐变紫色背景
- 📝 实时 URL 格式验证
- 📊 5步进度条显示（抓取 → 分析 → 提取 → 生成 → 完成）
- ⚡ 详细错误提示
- 🤖 AI 智能分析动画
- 📋 示例和使用说明

导航入口：
- 顶部导航栏：**🧠 文章转工作流**
- 路由：`/article-to-workflow`

## 使用方法

### 前置要求

**必须配置 OpenAI API Key！**

在 `backend/.env` 文件中添加：
```bash
OPENAI_API_KEY=sk-your-api-key-here
```

### 用户使用流程

1. **登录账户**
   - 邮箱：`test@workflow.com`
   - 密码：`test123456`

2. **访问功能页面**
   - 点击顶部导航栏的 **🧠 文章转工作流**

3. **输入文章 URL**
   - 例如：`https://www.zhihu.com/question/xxxxx`
   - 例如：`https://medium.com/@author/article-title`
   - 例如：任何包含流程/步骤的教程文章

4. **点击生成按钮**
   - 等待 AI 分析（通常需要 10-30 秒）
   - 观看进度条：抓取 → 分析 → 提取 → 生成 → 完成

5. **查看生成的工作流**
   - 自动跳转到工作流详情页
   - 可以看到 AI 提取的所有步骤节点
   - 可以在编辑器中调整和优化

### 开发者集成

如果需要在其他页面添加快速入口，可以使用：

```tsx
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()

// 跳转到文章转工作流页面
navigate('/article-to-workflow')
```

或者直接调用API：

```typescript
import axios from 'axios'

const response = await axios.post(
  'http://localhost:3000/api/workflows/generate/from-article',
  {
    url: 'https://example.com/article',
    autoSave: true
  },
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
)

const workflow = response.data.workflow
```

## 测试 URL 推荐

### 适合测试的文章类型

1. **教程类文章** ⭐⭐⭐⭐⭐
   - "如何写作"、"如何设计"、"如何分析数据"等
   - 特点：有明确的步骤和流程

2. **方法论文章** ⭐⭐⭐⭐⭐
   - "XX的5个步骤"、"XX工作流程"、"XX最佳实践"
   - 特点：结构清晰，步骤明确

3. **指南类文章** ⭐⭐⭐⭐
   - "新手指南"、"完全指南"、"入门教程"
   - 特点：从头到尾的流程说明

4. **案例研究** ⭐⭐⭐
   - "我们如何实现XX"、"XX的实施过程"
   - 特点：包含实际操作步骤

### 测试 URL 示例

```
# 中文示例（如果可访问）
https://www.zhihu.com/question/...（任何包含步骤的回答）

# 英文示例
https://medium.com/...（教程类文章）
https://dev.to/...（技术教程）

# 通用示例
任何包含"How to"、"步骤"、"流程"、"方法"的文章
```

### 不适合的文章类型

- ❌ 纯新闻报道（缺少流程步骤）
- ❌ 纯理论文章（没有可执行步骤）
- ❌ 列表式文章（如"10个技巧"，但没有流程关系）

## 数据流示例

### 示例 1: 博客写作教程

**输入 URL:**
```
https://example.com/how-to-write-seo-blog
```

**文章内容摘要:**
"如何写一篇SEO友好的博客：1. 关键词研究 2. 创建大纲 3. 撰写初稿 4. 优化标题和描述 5. 添加内链外链 6. 发布和推广"

**AI 分析结果:**
```json
{
  "workflowTitle": "SEO友好博客写作工作流",
  "workflowDescription": "从关键词研究到发布推广的完整博客创作流程",
  "category": "content-creation",
  "tags": ["SEO", "写作", "博客", "内容营销"],
  "steps": [
    {
      "stepNumber": 1,
      "title": "关键词研究",
      "description": "使用SEO工具研究目标关键词和相关长尾词",
      "type": "tool",
      "config": { "tool": "seo-keyword-research" }
    },
    {
      "stepNumber": 2,
      "title": "创建文章大纲",
      "description": "基于关键词构建结构化的文章大纲",
      "type": "llm",
      "config": { "prompt": "根据关键词创建博客文章大纲..." }
    },
    {
      "stepNumber": 3,
      "title": "撰写文章正文",
      "description": "根据大纲撰写完整的博客内容",
      "type": "llm",
      "config": { "prompt": "撰写SEO优化的博客正文..." }
    },
    {
      "stepNumber": 4,
      "title": "优化元数据",
      "description": "生成SEO友好的标题和meta描述",
      "type": "llm",
      "config": { "prompt": "优化文章标题和描述..." }
    },
    {
      "stepNumber": 5,
      "title": "添加链接",
      "description": "插入相关的内部链接和外部权威链接",
      "type": "transform",
      "config": { "transform": "add-links" }
    }
  ]
}
```

**生成的工作流:**
- 📥 输入节点（接收主题）
- 🔍 关键词研究节点（工具）
- 📝 大纲生成节点（AI）
- ✍️ 正文撰写节点（AI）
- 🏷️ 元数据优化节点（AI）
- 🔗 链接添加节点（转换）
- 📤 输出节点（完整博客）

### 示例 2: 数据分析流程

**输入 URL:**
```
https://example.com/data-analysis-5-steps
```

**生成的工作流步骤:**
1. 数据收集 (tool)
2. 数据清洗 (transform)
3. 探索性分析 (llm)
4. 深度分析 (llm)
5. 可视化报告 (tool)
6. 结论总结 (llm)

## 扩展性

### 添加新的工作流模板

在 `WorkflowTemplateService` 中添加新的静态方法：

```typescript
static generateCustomWorkflow(params: any) {
  // 自定义工作流逻辑
  const nodes = [...]
  const edges = [...]
  return { nodes, edges }
}
```

### 自定义实体类型

修改 `llm-entity` 节点的 `systemPrompt`，添加或修改实体类型。

### 集成其他AI模型

修改节点配置中的 `model` 和 `provider` 字段：
- OpenAI: gpt-4o, gpt-3.5-turbo
- Anthropic: claude-3.5-sonnet
- 豆包: doubao-pro
- 通义千问: qwen-max
- 智谱: glm-4

## 注意事项 ⚠️

1. **必须配置 OpenAI API Key** 🔑
   - 在 `backend/.env` 中配置 `OPENAI_API_KEY`
   - AI 分析需要调用 GPT-4o 模型

2. **认证要求** 🔐
   - 必须登录才能使用
   - 测试账号：`test@workflow.com` / `test123456`

3. **处理时间** ⏱️
   - 通常需要 10-30 秒
   - 取决于文章长度和网络速度

4. **文章要求** 📝
   - 最适合有明确步骤流程的文章
   - 文章应该是可访问的公开内容
   - 建议文章长度在 500-5000 字

5. **AI 成本** 💰
   - 每次分析消耗用户积分
   - 使用 GPT-4o 模型（成本较高）
   - 测试账号有 50,000 积分

6. **生成质量** 🎯
   - AI 提取的准确度取决于文章质量
   - 结构清晰的文章效果更好
   - 生成后可手动调整优化

## 未来改进方向 🚀

### 短期（1-2周）
- [ ] 优化 AI 提示词，提高提取准确度
- [ ] 添加更多示例文章和模板
- [ ] 支持文章预览功能
- [ ] 改进错误提示和用户引导

### 中期（1个月）
- [ ] 支持上传 PDF、Word 文档
- [ ] 添加工作流评分和反馈机制
- [ ] 支持批量文章处理
- [ ] 提供工作流可视化编辑器集成

### 长期（3个月+）
- [ ] 支持多语言文章（中英日韩等）
- [ ] 建立工作流模板市场
- [ ] AI 自动优化和建议
- [ ] 工作流版本控制和协作
- [ ] 支持从视频、音频提取工作流

## 故障排查 🔧

### 常见问题

**Q: "未配置OpenAI API Key"错误**
```bash
# 解决方案：
cd backend
echo "OPENAI_API_KEY=sk-your-api-key" >> .env
npm run dev  # 重启后端
```

**Q: URL验证失败**
- ✅ 确保URL格式正确：`https://example.com/article`
- ✅ URL必须包含协议（http:// 或 https://）
- ❌ 不要使用相对路径

**Q: "无法抓取文章内容"**
- 检查目标网站是否可访问
- 某些网站可能有防爬虫机制
- 尝试使用其他文章URL

**Q: "文章分析失败"**
- 检查 OpenAI API Key 是否有效
- 检查网络连接
- 查看后端控制台的详细错误信息

**Q: 生成的工作流步骤太少或不准确**
- 文章内容可能不够清晰
- 尝试使用结构更清晰的教程类文章
- 生成后可在编辑器中手动调整

**Q: 处理时间过长**
- 正常情况 10-30 秒
- 文章太长可能需要更久
- 检查网络连接和 OpenAI API 响应速度

### 调试技巧

查看后端日志：
```bash
cd backend
npm run dev

# 会显示：
# "开始处理文章: https://..."
# "文章抓取成功: 文章标题"
# "AI分析成功，提取了 5 个步骤"
# "工作流生成成功，包含 7 个节点"
```

## 技术栈 💻

- **后端**: Express.js + TypeScript + Prisma
- **前端**: React + TypeScript + React Router
- **AI模型**: GPT-4o (OpenAI)
- **网页抓取**: Jina Reader API
- **数据库**: SQLite (Prisma)
- **HTTP客户端**: Axios

## 总结 🎉

这是一个 **AI 驱动的智能工作流生成工具**，它能够：

✅ 自动抓取文章内容
✅ AI 理解文章结构
✅ 智能提取工作流步骤
✅ 动态生成可视化节点
✅ 支持多种节点类型
✅ 可视化编辑和调整

每篇文章生成的工作流都是独一无二的！🚀
