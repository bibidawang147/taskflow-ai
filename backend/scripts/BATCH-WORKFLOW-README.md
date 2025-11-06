# 批量文章转工作流 - 使用指南

## 功能说明

这个脚本可以批量从优质AI教程文章中提取工作流，用于平台初期内容建设。

## 工作流程

1. **抓取文章** - 使用 Jina Reader API 获取干净的文章内容
2. **AI分析** - 使用阿里云百炼/OpenAI分析文章，提取工作流步骤
3. **生成配置** - 将提取的步骤转换为工作流配置
4. **保存数据库** - 自动保存到数据库，标记为公开模板

## 使用方法

### 方式1: 直接运行（使用内置文章列表）

```bash
cd backend
npx ts-node scripts/batch-article-to-workflow.ts
```

### 方式2: 自定义文章列表

1. 编辑 `article-sources.json` 添加文章URL
2. 运行脚本（未来版本支持从JSON读取）

## 文章来源推荐

### 中文资源
- **少数派** (sspai.com) - 高质量AI工具教程
- **知乎专栏** - AI实战经验分享
- **掘金** - 技术类AI应用
- **机器之心** - AI前沿应用

### 英文资源
- **Lenny's Newsletter** - 产品和AI应用
- **Stable Diffusion Art** - AI绘画教程
- **GitHub Blog** - 开发工具AI应用
- **Product Hunt** - 最新AI工具

### 官方文档
- OpenAI Platform Docs
- Anthropic (Claude) Docs
- Midjourney Docs
- GitHub Copilot Docs
- Notion AI Help Center

## 成本估算

每篇文章处理成本（使用阿里云百炼）：
- 文章抓取：免费（Jina Reader）
- AI分析：约 0.01-0.03 元/文章
- **15篇文章总成本：约 0.15-0.45 元**

## 注意事项

### 1. API配置
确保配置了以下环境变量（二选一）：
```bash
# 推荐：阿里云百炼（便宜）
ALIBABA_API_KEY=your_key
ALIBABA_DEFAULT_MODEL=qwen-plus

# 或者：OpenAI
OPENAI_API_KEY=your_key
```

### 2. 频率控制
- 脚本内置了2秒间隔，避免API限流
- 建议分批次处理，每批5-10篇
- 失败后会自动等待1秒

### 3. 文章质量
选择包含以下特征的文章：
- ✅ 有明确的步骤或流程
- ✅ 结构清晰，逻辑性强
- ✅ 实战导向，可操作性强
- ❌ 避免纯理论文章
- ❌ 避免过于简短的文章

### 4. 结果验证
生成后建议：
- 检查数据库中的工作流
- 验证步骤是否合理
- 前端预览效果
- 必要时手动调整

## 脚本输出

运行时会显示：
```
[1/15] 处理文章: ChatGPT提升生产力
  → 抓取文章内容...
  ✓ 文章标题: How to use ChatGPT to 10x...
  → AI分析中...
  ✓ 提取了 6 个步骤
  → 保存到数据库...
  ✅ 成功创建工作流: ChatGPT智能周报生成 (ID: xxx)
  ⏳ 等待2秒...

📊 批量生成完成！
✅ 成功: 12 个
❌ 失败: 3 个
📝 总计: 15 个
```

## 后续优化

可以考虑：
1. 从 article-sources.json 读取配置
2. 支持增量更新（跳过已处理的URL）
3. 添加工作流质量评分
4. 自动分类优化
5. 支持更多数据源（RSS、API等）

## 数据维护

生成后的工作流：
- 标记为 `isTemplate: true`（模板）
- 标记为 `isPublic: true`（公开）
- 作者为系统用户
- 包含 `sourceUrl` 和 `sourceMeta`

可以后续：
- 人工审核和优化
- 添加示例输入输出
- 补充标签和分类
- 设置推荐权重

## 问题排查

### 问题1: 文章抓取失败
- 检查URL是否有效
- 某些网站可能禁止抓取
- 尝试使用其他文章源

### 问题2: AI分析超时
- 文章可能过长
- API响应慢
- 考虑分批处理

### 问题3: 提取步骤质量差
- 文章本身结构不清晰
- 尝试调整AI提示词
- 人工补充和优化

## 示例：添加新文章

编辑脚本中的 `articleUrls` 数组：

```typescript
{
  url: 'https://example.com/ai-tutorial',
  category: '办公效率',
  description: '简短描述'
}
```

## 成功案例

预期可生成的工作流类型：
- ChatGPT写作助手
- Midjourney设计流程
- GitHub Copilot开发加速
- Notion AI组织知识
- Claude文档分析
- ...等

---

**提示**: 这是平台初期的过渡方案，长期建议建立UGC社区，让用户分享工作流。
