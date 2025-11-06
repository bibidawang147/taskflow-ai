# 快速开始 - AI 代理和积分系统

## 🎯 5分钟快速部署

### 步骤 1：配置环境变量

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件，**至少配置一个 AI 提供商的 API Key**：

```env
# 必填
JWT_SECRET=your-secret-key-here

# 至少配置一个 AI 提供商
OPENAI_API_KEY=sk-your-openai-key        # 推荐：最稳定
# 或
ANTHROPIC_API_KEY=sk-ant-your-key        # Claude 系列
# 或
DOUBAO_API_KEY=your-doubao-key           # 国内：豆包
QWEN_API_KEY=your-qwen-key               # 国内：通义千问
ZHIPU_API_KEY=your-zhipu-key             # 国内：智谱AI
```

### 步骤 2：初始化数据库

```bash
# 推送数据库 schema
npx prisma db push

# 导入模型定价配置
npx ts-node src/scripts/seed-model-pricing.ts
```

### 步骤 3：启动后端服务

```bash
npm run dev
```

服务将运行在 http://localhost:5000

### 步骤 4：测试 API

#### 方式 1：使用 REST Client（推荐）

1. 安装 VS Code 插件：[REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
2. 打开 `backend/test-credit-api.http`
3. 点击 "Send Request" 运行测试

#### 方式 2：使用 curl

```bash
# 1. 注册用户（自动获得 50000 积分）
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试用户",
    "email": "test@example.com",
    "password": "password123"
  }'

# 2. 保存返回的 token
TOKEN="your_token_here"

# 3. 查看余额
curl http://localhost:5000/api/credit/balance \
  -H "Authorization: Bearer $TOKEN"

# 4. 调用 AI
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "你好"}
    ]
  }'
```

## 📊 功能验证清单

测试以下功能确保系统正常运行：

- [ ] ✅ 用户注册成功，获得 50000 积分
- [ ] ✅ 查询余额，看到积分和每日免费额度
- [ ] ✅ 获取模型列表，看到所有可用模型
- [ ] ✅ 调用 AI 对话（免费模型），成功返回
- [ ] ✅ 再次查询余额，看到使用记录增加
- [ ] ✅ 查看使用统计，看到详细的消费记录

## 🔧 常见问题

### Q1: API 调用失败，提示 "模型未找到定价信息"

**原因：** 模型定价配置未导入

**解决：**
```bash
npx ts-node src/scripts/seed-model-pricing.ts
```

### Q2: AI 调用失败，提示 API Key 错误

**原因：**
1. `.env` 文件中未配置对应的 API Key
2. API Key 格式错误

**解决：**
1. 检查 `.env` 文件是否正确配置
2. 验证 API Key 是否有效
3. 重启服务使环境变量生效

### Q3: 提示 "积分不足"

**原因：**
1. 免费额度用完
2. 付费积分不足

**解决：**
```bash
# 方案1：升级到 Pro 获得更多免费额度
curl -X POST http://localhost:5000/api/credit/upgrade-tier \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tier": "pro"}'

# 方案2：模拟充值（测试环境）
# 先创建订单
ORDER_NO=$(curl -X POST http://localhost:5000/api/credit/recharge \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50, "paymentMethod": "test"}' \
  | jq -r '.data.orderNo')

# 然后确认支付
curl -X POST http://localhost:5000/api/credit/payment-callback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"orderNo\": \"$ORDER_NO\", \"paymentId\": \"test_123\"}"
```

### Q4: 提示 "会员等级无法使用此模型"

**原因：** 免费用户尝试使用 Pro 或 Enterprise 专属模型

**解决：**
```bash
# 升级到对应等级
curl -X POST http://localhost:5000/api/credit/upgrade-tier \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tier": "pro"}'

# 或使用免费用户可用的模型：
# - gpt-4o-mini
# - gpt-3.5-turbo
# - claude-3-5-haiku
# - doubao-pro-32k
# - qwen-max
# - glm-4
```

## 🎨 前端集成示例

### React + TypeScript

创建 API 服务：

```typescript
// services/aiService.ts
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const aiService = {
  // 获取可用模型
  async getModels() {
    const { data } = await axios.get(`${API_BASE}/ai/models`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return data.data;
  },

  // AI 对话
  async chat(provider: string, model: string, messages: any[]) {
    const { data } = await axios.post(`${API_BASE}/ai/chat`, {
      provider,
      model,
      messages,
      temperature: 0.7,
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return data.data;
  },

  // 获取余额
  async getBalance() {
    const { data } = await axios.get(`${API_BASE}/credit/balance`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return data.data;
  }
};
```

使用示例：

```typescript
// components/ChatBot.tsx
import { useState, useEffect } from 'react';
import { aiService } from '../services/aiService';

export function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    const data = await aiService.getBalance();
    setBalance(data);
  };

  const sendMessage = async (content: string) => {
    setLoading(true);
    try {
      const newMessages = [...messages, { role: 'user', content }];
      setMessages(newMessages);

      const response = await aiService.chat(
        'openai',
        'gpt-4o-mini',
        newMessages
      );

      setMessages([...newMessages, {
        role: 'assistant',
        content: response.content
      }]);

      // 刷新余额
      await loadBalance();
    } catch (error: any) {
      if (error.response?.data?.code === 'INSUFFICIENT_CREDIT') {
        alert('积分不足，请充值');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>余额: {balance?.coins} coins</div>
      <div>今日剩余: {balance?.remainingQuota} coins</div>
      {/* 聊天界面 */}
    </div>
  );
}
```

## 📈 性能优化建议

### 1. 使用 Redis 缓存

```bash
# 安装 Redis
brew install redis  # macOS
# 或
sudo apt install redis  # Ubuntu

# 启动 Redis
redis-server
```

在 `.env` 中配置：
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 2. 启用请求队列

建议在生产环境使用 BullMQ 处理 AI 请求队列，避免并发冲突。

### 3. 监控和日志

使用 Winston 记录详细日志，Prometheus + Grafana 监控系统性能。

## 🚀 部署到生产环境

### 环境变量清单

生产环境必须配置：

```env
NODE_ENV=production
JWT_SECRET=强密码-至少32位-随机字符串
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# 至少一个 AI 提供商
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# 可选：支付集成
STRIPE_SECRET_KEY=...
WECHAT_APP_ID=...
ALIPAY_APP_ID=...
```

### 数据库迁移

```bash
# 使用 PostgreSQL（推荐生产环境）
# 1. 修改 prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# 2. 运行迁移
npx prisma migrate deploy

# 3. 导入定价配置
npx ts-node src/scripts/seed-model-pricing.ts
```

### Docker 部署（可选）

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "start"]
```

```bash
# 构建和运行
docker build -t workflow-platform .
docker run -p 5000:5000 --env-file .env workflow-platform
```

## 📞 获取帮助

- 📖 [完整 API 文档](./AI_CREDIT_SYSTEM.md)
- 🐛 [报告问题](https://github.com/your-repo/issues)
- 💬 [讨论区](https://github.com/your-repo/discussions)

## 下一步

✅ 系统已经可以正常运行！

接下来你可以：
1. 集成到工作流执行引擎
2. 开发前端界面
3. 添加支付集成
4. 部署到生产环境
5. 配置监控和告警

祝你开发顺利！🎉
