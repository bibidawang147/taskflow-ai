# 🤖 AI 集成完全指南

## 📊 **AI 服务对比速查表**

| 服务商 | 注册难度 | 价格 | 质量 | 免费额度 | 推荐指数 |
|--------|----------|------|------|----------|----------|
| **阿里通义千问** | ⭐ 简单 | ¥ 便宜 | ⭐⭐⭐⭐ 好 | 每天 100 万 tokens | ⭐⭐⭐⭐⭐ |
| **讯飞星火** | ⭐ 简单 | ¥ 便宜 | ⭐⭐⭐⭐ 好 | 200 万 tokens | ⭐⭐⭐⭐⭐ |
| **智谱 GLM** | ⭐ 简单 | ¥ 便宜 | ⭐⭐⭐ 中等 | 500 万 tokens | ⭐⭐⭐⭐ |
| **OpenAI GPT** | ⭐⭐⭐ 较难 | $$ 中等 | ⭐⭐⭐⭐⭐ 最好 | $5 | ⭐⭐⭐⭐⭐ |
| **Claude** | ⭐⭐⭐ 较难 | $$ 中等 | ⭐⭐⭐⭐⭐ 最好 | 少 | ⭐⭐⭐⭐ |
| **Ollama（本地）** | ⭐ 简单 | 免费 | ⭐⭐⭐ 中等 | 无限 | ⭐⭐⭐ |

---

## 🎯 **推荐方案**

### **方案 1：新手入门（推荐）** ⭐⭐⭐⭐⭐

```
阿里通义千问（免费额度）
✅ 手机号注册
✅ 免费额度大
✅ 质量不错
✅ 价格便宜
```

**立即开始** → 跳转到 [阿里通义千问教程](#阿里通义千问)

---

### **方案 2：追求质量**

```
OpenAI GPT-4o-mini
✅ 质量最好
✅ 生态完善
❌ 需要国外手机号
❌ 需要信用卡
```

**立即开始** → 跳转到 [OpenAI 教程](#openai-gpt)

---

### **方案 3：完全免费**

```
Ollama（本地运行）
✅ 完全免费
✅ 数据隐私
❌ 需要好电脑
❌ 质量一般
```

**立即开始** → 跳转到 [Ollama 教程](#ollama-本地ai)

---

## 📚 **详细获取教程**

### **阿里通义千问**

#### **第 1 步：注册账号**（3 分钟）

1. 访问：https://dashscope.aliyun.com/
2. 点击右上角「登录/注册」
3. 使用**阿里云账号**登录（手机号即可注册）

#### **第 2 步：实名认证**（5 分钟）

1. 登录后，进入控制台
2. 完成实名认证（支付宝扫码即可）

#### **第 3 步：开通服务**

1. 在控制台点击「开通 DashScope」
2. 选择「按量付费」（有免费额度）
3. 同意协议，开通成功

#### **第 4 步：创建 API Key**

1. 进入「API-KEY 管理」
2. 点击「创建新的 API-KEY」
3. 复制保存密钥：`sk-xxxxxxxxxxxxx`

#### **第 5 步：配置到项目**

编辑 `backend/.env`：

```env
# 阿里通义千问
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxx
DEFAULT_AI_PROVIDER=dashscope
```

#### **第 6 步：测试**

```bash
# 登录获取 token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test123@example.com","password":"Test1234"}'

# 测试 AI 对话
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"你好，请介绍一下你自己"}'
```

**费用说明**：
- 免费额度：每天 100 万 tokens
- 付费价格：¥0.008 / 1000 tokens
- 1 次对话约 1000 tokens ≈ ¥0.008

---

### **讯飞星火**

#### **第 1 步：注册**

1. 访问：https://xinghuo.xfyun.cn/
2. 手机号注册
3. 实名认证

#### **第 2 步：开通服务**

1. 进入「控制台」
2. 选择「星火认知大模型」
3. 创建应用

#### **第 3 步：获取密钥**

1. 在应用中查看 `APPID`、`APISecret`、`APIKey`
2. 保存这三个值

#### **第 4 步：配置**

```env
XUNFEI_APP_ID=xxxxx
XUNFEI_API_SECRET=xxxxx
XUNFEI_API_KEY=xxxxx
```

**免费额度**：200 万 tokens

---

### **OpenAI GPT**

#### **第 1 步：注册账号**

1. 访问：https://platform.openai.com
2. 注册账号（需要国外邮箱或手机号）
3. 验证邮箱

**注意**：
- 需要科学上网
- 部分地区可能无法注册

#### **第 2 步：绑定支付方式**

1. 登录后进入「Billing」
2. 添加信用卡（支持 Visa、MasterCard）
3. 最低充值 $5

#### **第 3 步：创建 API Key**

1. 进入「API keys」页面
2. 点击「Create new secret key」
3. 复制保存：`sk-proj-xxxxxxxxxxxxx`

**重要**：这个 key 只显示一次，一定要保存好！

#### **第 4 步：配置**

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
DEFAULT_AI_PROVIDER=openai
```

#### **第 5 步：测试**

```bash
curl -X POST http://localhost:8000/api/ai/generate-article \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "人工智能的未来",
    "style": "专业",
    "length": "500"
  }'
```

**费用说明**：
- GPT-4o-mini: $0.15 / 1M tokens 输入
- GPT-3.5: $0.50 / 1M tokens 输入
- 新用户送 $5

---

### **Anthropic Claude**

#### **第 1 步：注册**

1. 访问：https://console.anthropic.com
2. 注册账号
3. 验证邮箱

#### **第 2 步：获取 API Key**

1. 进入「API Keys」
2. 创建新密钥
3. 复制保存

#### **第 3 步：配置**

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
DEFAULT_AI_PROVIDER=claude
```

**费用说明**：
- Claude 3 Haiku: $0.25 / 1M tokens 输入
- 更便宜，质量好

---

### **Ollama（本地 AI）**

#### **第 1 步：安装 Ollama**

```bash
# macOS
brew install ollama

# Windows
# 下载安装包：https://ollama.com/download

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

#### **第 2 步：下载模型**

```bash
# 下载 Llama 2（推荐）
ollama pull llama2

# 下载代码专用模型
ollama pull codellama

# 下载中文模型
ollama pull qwen
```

#### **第 3 步：启动服务**

```bash
# 启动 Ollama 服务
ollama serve
```

#### **第 4 步：测试**

```bash
# 命令行测试
ollama run llama2

# HTTP API 测试
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "你好，请介绍一下你自己"
}'
```

#### **第 5 步：集成到项目**

需要修改 `aiService.ts`，添加 Ollama 支持：

```typescript
async chat(messages: ChatMessage[]): Promise<ChatResponse> {
  const response = await axios.post('http://localhost:11434/api/chat', {
    model: 'llama2',
    messages
  })

  return {
    content: response.data.message.content
  }
}
```

**优点**：
- ✅ 完全免费
- ✅ 无限使用
- ✅ 数据隐私

**缺点**：
- ❌ 需要好的电脑（建议 16GB+ 内存）
- ❌ 质量不如 GPT-4
- ❌ 速度较慢

---

## 💰 **成本估算**

### **个人项目（<100 用户）**

**方案**：阿里通义千问免费额度
```
日常使用：500 次对话/天
成本：0 元/月 ✅
```

---

### **小型项目（100-1000 用户）**

**方案**：阿里通义千问 + GPT-3.5 备用
```
日常使用：5000 次对话/天
阿里：¥50/月
OpenAI：¥100/月（备用）
总成本：¥50-150/月
```

---

### **中型项目（1000-10000 用户）**

**方案**：OpenAI GPT-4o-mini
```
日常使用：50000 次对话/天
成本：约 ¥500-1000/月
```

---

## 🔧 **使用示例**

### **示例 1：文章生成**

```bash
curl -X POST http://localhost:8000/api/ai/generate-article \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "如何学习编程",
    "style": "轻松",
    "length": "800"
  }'
```

### **示例 2：代码审查**

```bash
curl -X POST http://localhost:8000/api/ai/review-code \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function add(a, b) { return a + b }",
    "language": "javascript"
  }'
```

### **示例 3：市场分析**

```bash
curl -X POST http://localhost:8000/api/ai/analyze-market \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "industry": "AI 工具",
    "question": "未来发展趋势如何？"
  }'
```

---

## ⚙️ **切换 AI 服务商**

只需要修改 `.env` 文件：

```env
# 使用阿里通义千问
DEFAULT_AI_PROVIDER=dashscope
DASHSCOPE_API_KEY=sk-xxxxx

# 使用 OpenAI
# DEFAULT_AI_PROVIDER=openai
# OPENAI_API_KEY=sk-proj-xxxxx

# 使用 Claude
# DEFAULT_AI_PROVIDER=claude
# ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

## 📊 **监控 AI 使用量**

### **查看用量**

各服务商的控制台都可以查看：

**阿里通义千问**：
- 进入控制台 → 查看用量
- 显示每日使用的 tokens 数量

**OpenAI**：
- https://platform.openai.com/usage
- 显示详细的使用统计

### **设置预算提醒**

1. 在控制台设置每月预算
2. 达到 80% 时发送邮件提醒
3. 避免超支

---

## 🎯 **最佳实践**

### **1. 控制成本**

```typescript
// 在调用前检查用户权限
if (userTier === 'free') {
  // 免费用户：每天 10 次
  if (todayUsageCount >= 10) {
    return res.status(429).json({ error: '今日免费额度已用完' })
  }
}

// 使用更便宜的模型
if (task === 'simple') {
  model = 'gpt-3.5-turbo'  // 便宜
} else {
  model = 'gpt-4o-mini'    // 质量好
}
```

### **2. 缓存结果**

```typescript
// 相同问题，直接返回缓存
const cached = await redis.get(`ai:${questionHash}`)
if (cached) {
  return JSON.parse(cached)
}

const result = await aiService.chat(messages)

// 缓存 1 小时
await redis.setex(`ai:${questionHash}`, 3600, JSON.stringify(result))
```

### **3. 错误处理**

```typescript
try {
  const result = await aiService.chat(messages)
  return result
} catch (error) {
  // 主服务失败，使用备用服务
  console.log('主 AI 服务失败，切换到备用')
  const backupService = new AIService('dashscope')
  return await backupService.chat(messages)
}
```

---

## ✅ **总结**

### **立即开始**（3 步）：

1. **注册阿里通义千问**（5 分钟）
   - 手机号注册即可
   - 免费额度够用

2. **配置 API Key**（1 分钟）
   ```env
   DASHSCOPE_API_KEY=sk-xxxxx
   DEFAULT_AI_PROVIDER=dashscope
   ```

3. **测试 API**（2 分钟）
   ```bash
   curl -X POST http://localhost:8000/api/ai/chat \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message":"你好"}'
   ```

### **成本预期**：

- **学习阶段**：0 元（免费额度）
- **个人项目**：0-50 元/月
- **小型商业**：50-500 元/月
- **中型商业**：500-2000 元/月

---

**推荐路线**：

1. **现在**：用阿里通义千问免费额度学习
2. **上线后**：继续用免费额度测试
3. **有用户后**：看用量决定是否付费
4. **用户多了**：考虑升级到 OpenAI

**现在就开始吧！** 🚀

有问题随时问我！
