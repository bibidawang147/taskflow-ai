# AI 代理和积分系统文档

## 概述

本系统实现了统一的 AI 代理服务和积分计费系统，支持多个 AI 提供商，包括：

- **OpenAI** (GPT-4o, GPT-4o Mini, GPT-3.5 Turbo 等)
- **Anthropic** (Claude 3.5 Sonnet, Claude 3.5 Haiku 等)
- **豆包** (字节跳动)
- **通义千问** (阿里云)
- **智谱 AI** (GLM-4, GLM-3 等)

## 核心特性

### ✨ 用户友好
- 无需用户配置 API Key，开箱即用
- 注册即送 50,000 积分（约 ¥50 额度）
- 免费用户每日 10,000 积分免费额度
- 按实际使用量计费，无订阅费

### 💰 积分系统
- 1000 coins = ¥1 人民币
- 优先使用每日免费额度
- 会员享受折扣（Pro: 85折，Enterprise: 7折）
- 支持充值套餐和赠送

### 🎯 多等级会员

| 等级 | 每日免费额度 | 可用模型 | 折扣 |
|------|------------|---------|------|
| Free | 10,000 coins | GPT-4o Mini, Claude Haiku, 豆包, 千问 | 无 |
| Pro | 50,000 coins | 所有模型 | 85折 |
| Enterprise | 200,000 coins | 所有模型 | 7折 |

## API 接口文档

### 1. 积分管理

#### 1.1 获取余额
```http
GET /api/credit/balance
Authorization: Bearer <token>
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "coins": 45000,
    "freeQuota": 10000,
    "usedToday": 3200,
    "remainingQuota": 6800,
    "quotaResetAt": "2024-10-25T00:00:00.000Z",
    "totalRecharged": 100.00,
    "totalConsumed": 55000
  }
}
```

#### 1.2 获取使用统计
```http
GET /api/credit/usage-stats?days=7
Authorization: Bearer <token>
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "totalCost": 12500,
    "totalTokens": 850000,
    "requestCount": 156,
    "byModel": [
      {
        "provider": "openai",
        "model": "gpt-4o-mini",
        "count": 120,
        "cost": 8000,
        "tokens": 600000
      }
    ],
    "recentLogs": [...]
  }
}
```

#### 1.3 获取充值套餐
```http
GET /api/credit/plans
Authorization: Bearer <token>
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    { "amount": 10, "coins": 10000, "bonus": 0 },
    { "amount": 50, "coins": 55000, "bonus": 5000 },
    { "amount": 100, "coins": 120000, "bonus": 20000 },
    { "amount": 500, "coins": 650000, "bonus": 150000 }
  ]
}
```

#### 1.4 创建充值订单
```http
POST /api/credit/recharge
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50,
  "paymentMethod": "wechat"
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "orderNo": "RCH172973456781234",
    "amount": 50,
    "coins": 50000,
    "bonusCoins": 5000,
    "totalCoins": 55000
  },
  "message": "订单创建成功"
}
```

#### 1.5 升级会员等级
```http
POST /api/credit/upgrade-tier
Authorization: Bearer <token>
Content-Type: application/json

{
  "tier": "pro"
}
```

### 2. AI 服务

#### 2.1 获取可用模型列表
```http
GET /api/ai/models
Authorization: Bearer <token>
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "userTier": "free",
    "models": {
      "openai": [
        {
          "modelId": "gpt-4o-mini",
          "modelName": "GPT-4o Mini",
          "description": "经济实惠的小型模型，适合大多数任务",
          "inputPrice": 1,
          "outputPrice": 4,
          "category": "text",
          "maxTokens": 128000,
          "features": {
            "vision": true,
            "functionCalling": true,
            "streaming": true
          }
        }
      ],
      "anthropic": [...],
      "doubao": [...],
      "qwen": [...],
      "zhipu": [...]
    },
    "totalCount": 14
  }
}
```

#### 2.2 AI 对话
```http
POST /api/ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": "你好，请介绍一下你自己"
    }
  ],
  "temperature": 0.7,
  "maxTokens": 2000,
  "workflowId": "workflow_123",
  "executionId": "execution_456"
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "content": "你好！我是一个 AI 助手...",
    "usage": {
      "inputTokens": 15,
      "outputTokens": 85,
      "totalTokens": 100
    },
    "cost": 4,
    "finishReason": "stop"
  }
}
```

**错误响应示例：**
```json
{
  "success": false,
  "message": "积分不足，请充值",
  "code": "INSUFFICIENT_CREDIT"
}
```

```json
{
  "success": false,
  "message": "您的会员等级 (free) 无法使用此模型，请升级会员",
  "code": "TIER_REQUIRED"
}
```

## 模型定价

### OpenAI 模型

| 模型 | 输入价格 | 输出价格 | 等级要求 |
|------|---------|---------|---------|
| GPT-4o | 15 coins/1K | 60 coins/1K | Pro+ |
| GPT-4o Mini | 1 coins/1K | 4 coins/1K | Free+ |
| GPT-4 Turbo | 30 coins/1K | 90 coins/1K | Pro+ |
| GPT-3.5 Turbo | 3 coins/1K | 6 coins/1K | Free+ |

### Anthropic Claude 模型

| 模型 | 输入价格 | 输出价格 | 等级要求 |
|------|---------|---------|---------|
| Claude 3.5 Sonnet | 20 coins/1K | 80 coins/1K | Pro+ |
| Claude 3.5 Haiku | 5 coins/1K | 20 coins/1K | Free+ |
| Claude 3 Opus | 45 coins/1K | 180 coins/1K | Enterprise |

### 国内模型

| 模型 | 输入价格 | 输出价格 | 等级要求 |
|------|---------|---------|---------|
| 豆包 Pro 32K | 0.5 coins/1K | 2 coins/1K | Free+ |
| 豆包 Lite 4K | 0.3 coins/1K | 0.6 coins/1K | Free+ |
| 通义千问 Max | 2 coins/1K | 8 coins/1K | Free+ |
| 通义千问 Plus | 1 coins/1K | 4 coins/1K | Free+ |
| 通义千问 Turbo | 0.4 coins/1K | 0.8 coins/1K | Free+ |
| GLM-4 | 3 coins/1K | 12 coins/1K | Free+ |
| GLM-3 Turbo | 0.5 coins/1K | 2 coins/1K | Free+ |

## 费用计算示例

### 示例 1：免费用户使用 GPT-4o Mini

**场景：**
- 用户等级：Free
- 输入：1000 tokens
- 输出：2000 tokens

**计算：**
```
输入费用 = (1000 / 1000) × 1 = 1 coins
输出费用 = (2000 / 1000) × 4 = 8 coins
总费用 = 1 + 8 = 9 coins

由于有每日免费额度，此次调用优先使用免费额度，不扣除付费积分
```

### 示例 2：Pro 用户使用 Claude 3.5 Sonnet

**场景：**
- 用户等级：Pro (85折)
- 输入：3000 tokens
- 输出：5000 tokens

**计算：**
```
输入费用 = (3000 / 1000) × 20 = 60 coins
输出费用 = (5000 / 1000) × 80 = 400 coins
折前总费用 = 60 + 400 = 460 coins
折后总费用 = 460 × 0.85 = 391 coins
```

## 快速开始

### 1. 环境配置

复制 `.env.example` 为 `.env` 并配置 API Keys：

```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，填入你的 API Keys
```

### 2. 初始化数据库

```bash
npx prisma db push
npx ts-node src/scripts/seed-model-pricing.ts
```

### 3. 启动服务

```bash
npm run dev
```

### 4. 测试 API

使用提供的测试文件：

```bash
# 编辑 test-api.http 文件，替换为你的 token
# 使用 VS Code REST Client 插件或其他工具测试
```

## 前端集成示例

### React 示例

```typescript
import axios from 'axios';

// 获取余额
const getBalance = async () => {
  const response = await axios.get('/api/credit/balance', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// AI 对话
const chat = async (messages: Array<{role: string, content: string}>) => {
  try {
    const response = await axios.post('/api/ai/chat', {
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data.data.content;
  } catch (error: any) {
    if (error.response?.data?.code === 'INSUFFICIENT_CREDIT') {
      // 引导用户充值
      showRechargeModal();
    } else if (error.response?.data?.code === 'TIER_REQUIRED') {
      // 引导用户升级
      showUpgradeModal();
    }
    throw error;
  }
};
```

## 注意事项

### 安全性
1. 所有 API Keys 应存储在服务器端，不要暴露给前端
2. 使用 HTTPS 保护 API 通信
3. 实现请求签名验证（支付回调）
4. 定期轮换密钥

### 性能优化
1. 使用 Redis 缓存模型定价配置
2. 实现请求队列避免并发问题
3. 监控 API 调用频率和成本

### 成本控制
1. 设置单次请求的 maxTokens 限制
2. 实现用户级别的 rate limiting
3. 监控异常消费行为
4. 定期分析成本数据

## 后续扩展

### 计划功能
- [ ] 流式响应支持
- [ ] 图像生成 API
- [ ] Embedding 向量化
- [ ] 订阅套餐
- [ ] 企业批量购买
- [ ] 使用报表和分析
- [ ] API 调用日志查询

## 技术支持

如有问题，请查看：
- [GitHub Issues](https://github.com/your-repo/issues)
- [开发文档](../README.md)
- [常见问题](./FAQ.md)
