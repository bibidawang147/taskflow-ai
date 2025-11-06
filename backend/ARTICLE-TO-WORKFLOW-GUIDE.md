# 文章转工作流功能 - 使用指南

## 功能概述

"文章转工作流"功能已全面优化，可以智能地从AI教程文章中提取工作流程，自动生成可视化的工作流配置。

## 优化内容

### 1. 后端AI分析优化 ✅
- **改进的提示词工程**
  - 明确的分类规则（6大类别）
  - 详细的标签要求
  - 质量标准约束
  - 步骤数量控制（3-8个）

- **智能分类映射**
  - 自动标准化分类名称
  - 支持中英文识别
  - 默认兜底分类
  - 确保数据库一致性

### 2. 示例文章系统 ✅
- **5个精选示例**
  - ChatGPT智能写周报（办公效率）
  - Midjourney LOGO设计（设计）
  - GitHub Copilot编程（编程开发）
  - Notion AI知识管理（学习提升）
  - ChatGPT+Excel数据分析（数据分析）

- **API端点**
  - `GET /api/workflows/article-examples` - 获取示例列表
  - `GET /api/workflows/article-examples/:id` - 获取示例详情

## 使用方法

### 方式1: 前端UI使用

1. 访问 `/article-to-workflow` 页面
2. 选择以下任一输入方式：
   - **粘贴文章内容** - 完整的教程文本
   - **粘贴文章URL** - 系统自动抓取
   - **选择示例文章** - 快速测试（推荐）

3. 点击"生成工作流"
4. AI自动分析并生成工作流
5. 可视化编辑器中调整
6. 保存到工作台

### 方式2: API调用

```bash
# 从文章内容生成
curl -X POST http://localhost:3000/api/workflows/generate/from-article \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "文章内容...",
    "title": "文章标题",
    "autoSave": false
  }'

# 从URL生成
curl -X POST http://localhost:3000/api/workflows/generate/from-article \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "url": "https://example.com/article",
    "autoSave": false
  }'
```

### 方式3: 批量生成脚本

使用前面创建的批量处理脚本：

```bash
cd backend

# 从预设文章内容批量生成
npx ts-node scripts/batch-with-content.ts

# 生成示例文章对应的工作流
node -e "
const { ARTICLE_EXAMPLES } = require('./dist/data/article-examples');
const { ArticleAnalysisService } = require('./dist/services/articleAnalysisService');

// 处理第一个示例
const example = ARTICLE_EXAMPLES[0];
ArticleAnalysisService.analyzeArticleAndExtractWorkflow(
  example.title,
  example.content
).then(result => {
  console.log('成功:', result.workflowTitle);
});
"
```

## 生成的工作流质量

### 分类准确性
AI会自动识别并映射到以下6个标准分类：
- **办公效率** - 周报、邮件、PPT、Excel等
- **内容创作** - 文章、视频、文案、博客等
- **设计** - LOGO、海报、UI、图片生成等
- **编程开发** - 代码生成、审查、调试等
- **学习提升** - 知识管理、语言学习、笔记等
- **数据分析** - 数据处理、报表、可视化等

### 标签智能化
自动提取：
- AI工具名称（ChatGPT、Midjourney等）
- 应用场景（写作、设计、编程等）
- 技术特征（提示词、自动化等）

### 步骤结构化
- 3-8个核心步骤
- 明确的节点类型（llm/tool/condition/transform）
- 完整的配置信息
- 可视化工作流图

## 最佳实践

### 文章内容要求
1. **结构清晰** - 使用标题、列表、步骤编号
2. **步骤明确** - 每个步骤有清晰的标题和说明
3. **可操作性强** - 避免纯理论，重视实践
4. **长度适中** - 500-3000字为佳

### 示例好文章结构
```markdown
# 标题: ChatGPT XXX 工作流

## 步骤1: 准备阶段
具体操作说明...

## 步骤2: 执行任务
详细步骤描述...

## 步骤3: 优化结果
优化技巧...

## 效果展示
预期成果...
```

### 提升成功率
- ✅ 包含"步骤"、"流程"、"工作流"等关键词
- ✅ 使用序号（1、2、3）或标题（步骤一、第一步）
- ✅ 说明AI工具的具体使用方法
- ✅ 提供示例或模板
- ❌ 避免过于简短的条目
- ❌ 避免纯概念介绍

## 成本估算

使用阿里云百炼API：
- 每篇文章分析：约 0.01-0.03元
- 生成50个工作流：约 0.5-1.5元
- **非常经济！**

## 故障排查

### 问题1: 生成失败
- 检查API Key配置
- 确认文章内容不为空
- 查看后端日志

### 问题2: 分类不准确
- 在文章中明确提及应用场景
- 使用更标准的分类关键词
- 后端会自动映射常见变体

### 问题3: 步骤提取质量差
- 优化文章结构
- 使用更清晰的标题
- 增加步骤说明详细度

## 下一步优化

可以考虑的改进方向：
1. 前端添加示例文章选择器
2. 支持批量导入多篇文章
3. 工作流质量评分系统
4. 自动标签推荐
5. 用户反馈和迭代优化

## 技术架构

```
用户输入（文章内容/URL）
    ↓
Jina Reader API（URL抓取）
    ↓
阿里云百炼/OpenAI（AI分析）
    ↓
分类标准化映射
    ↓
工作流配置生成
    ↓
可视化编辑器展示
    ↓
保存到数据库
```

## 相关文件

- `src/services/articleAnalysisService.ts` - 核心分析服务
- `src/data/article-examples.ts` - 示例文章数据
- `src/routes/workflows.ts` - API路由
- `scripts/batch-with-content.ts` - 批量处理脚本
- `frontend/src/pages/ArticleWorkflowMVPPage.tsx` - 前端页面

---

功能已优化完成，可以开始使用！如遇问题请查看日志或联系开发团队。
