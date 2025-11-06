# 快速开始 - 文章转工作流

## 🚀 5分钟上手指南

### 第一步：配置 OpenAI API Key

```bash
cd backend
echo "OPENAI_API_KEY=sk-your-openai-api-key-here" >> .env
```

> ⚠️ 没有 API Key？访问 [OpenAI Platform](https://platform.openai.com/api-keys) 获取

### 第二步：启动服务

**启动后端：**
```bash
cd backend
npm install  # 首次运行需要
npm run dev
```

后端运行在 `http://localhost:3000`

**启动前端：**
```bash
cd frontend
npm install  # 首次运行需要
npm run dev
```

前端运行在 `http://localhost:5173`

### 第三步：登录测试账号

打开浏览器访问 `http://localhost:5173`

登录信息：
- 📧 邮箱：`test@workflow.com`
- 🔑 密码：`test123456`

### 第四步：生成工作流

1. 点击顶部导航栏的 **🧠 文章转工作流**

2. 输入一个教程文章的 URL，例如：
   ```
   https://medium.com/@yourfavoritearticle
   或任何包含明确步骤的文章
   ```

3. 点击 **🤖 智能生成工作流**

4. 等待 10-30 秒，观看进度条：
   - 🌐 抓取文章内容...
   - 📖 分析文章结构...
   - 🔍 提取工作流步骤...
   - ⚙️ 生成工作流节点...
   - ✅ 工作流创建成功！

5. 自动跳转到工作流详情页，查看生成的节点和连接

## 🎯 推荐测试文章类型

### ⭐⭐⭐⭐⭐ 最佳效果
- "如何写作..."
- "XX的5个步骤"
- "完整指南：..."
- "从零开始学..."

### 📝 示例搜索关键词
- "how to write a blog post"
- "data analysis tutorial"
- "design process steps"
- "如何做数据分析"
- "写作流程"

## 🔍 验证是否成功

✅ **成功标志：**
- 看到进度条完成
- 自动跳转到工作流页面
- 可以看到多个节点（通常 5-10 个）
- 节点之间有连接线

❌ **常见错误：**
- "未配置OpenAI API Key" → 检查 .env 文件
- "无法抓取文章内容" → 换一个 URL
- "文章分析失败" → 检查网络和 API Key

## 💡 提示

- 第一次生成可能需要更长时间
- 选择结构清晰、有明确步骤的文章效果最好
- 生成后可以在工作流编辑器中调整
- 测试账号有 50,000 积分，足够多次测试

## 📚 完整文档

查看完整文档：`ARTICLE_TO_WORKFLOW.md`

## 🆘 遇到问题？

1. 检查后端控制台的日志输出
2. 检查前端浏览器控制台的错误
3. 确认 OpenAI API Key 有效
4. 尝试使用不同的文章 URL

---

**准备好了吗？开始体验 AI 驱动的智能工作流生成吧！** 🎉
