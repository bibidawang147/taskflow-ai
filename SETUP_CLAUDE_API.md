# 配置 Claude API

如果你想使用 AI 分析功能（将小红书教程自动转换为工作流），需要配置 Claude API Key。

## 获取 API Key

1. 访问 https://console.anthropic.com/
2. 注册/登录账号
3. 进入 API Keys 页面
4. 创建新的 API Key

## 配置

编辑 `backend/.env` 文件，替换这一行：

```bash
# 修改前
ANTHROPIC_API_KEY=your-claude-api-key

# 修改后（填入你的真实 key）
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxx
```

## 测试 AI 分析

配置后，使用完整流程：

```bash
curl -X POST http://localhost:3000/api/crawler/crawl-and-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "ChatGPT使用技巧",
    "maxCount": 3,
    "userId": "你的用户ID"
  }'
```

## 替代方案：使用通义千问

你的 `.env` 已经配置了阿里云通义千问的 API Key。

如果想使用通义千问（更便宜），我可以帮你修改代码支持它。
