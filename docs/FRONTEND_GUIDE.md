# 前端使用指南

## 🎯 概述

前端已完成 AI 积分系统的完整集成，包括：
- 积分余额管理
- 模型选择和 AI 对话
- 充值系统
- 会员升级
- 使用统计

## 📦 新增页面

### 1. AI 对话页面 `/ai-chat`

**功能：**
- 选择不同的 AI 模型
- 实时对话测试
- 查看消耗和 Token 使用情况
- 支持多轮对话

**使用方法：**
1. 登录后访问 `/ai-chat`
2. 右侧选择 AI 模型
3. 下方输入框输入消息
4. Enter 发送，Shift+Enter 换行

### 2. 充值页面 `/recharge`

**功能：**
- 查看当前余额和免费额度
- 选择充值套餐
- 模拟支付流程

**套餐：**
- ¥10 → 10,000 coins
- ¥50 → 55,000 coins (送 5,000)
- ¥100 → 120,000 coins (送 20,000)
- ¥500 → 650,000 coins (送 150,000)

### 3. 使用统计页面 `/usage-stats`

**功能：**
- 总消耗积分
- 总请求次数和 Token 使用
- 按模型分类统计
- 最近使用记录
- 可选择时间范围（7天/30天/90天）

### 4. 会员升级页面 `/membership`

**功能：**
- 查看三种会员等级对比
- 详细功能对比表
- 一键升级会员

**会员等级：**
- **免费版**：10,000 coins/天，基础模型
- **专业版** (¥99/月)：50,000 coins/天，所有模型，85折
- **企业版** (¥999/月)：200,000 coins/天，所有模型，7折

## 🧩 新增组件

### 1. CreditBalance 组件

**位置：** `src/components/CreditBalance.tsx`

**用途：**
- 显示用户积分余额
- 显示每日免费额度
- 显示累计消耗

**使用方法：**

```tsx
import { CreditBalance, CreditBalanceMini } from '../components/CreditBalance';

// 完整版（卡片形式）
<CreditBalance onRechargeClick={() => navigate('/recharge')} />

// 紧凑版（导航栏）
<CreditBalance compact onRechargeClick={() => navigate('/recharge')} />

// 迷你版
<CreditBalanceMini />
```

### 2. ModelSelector 组件

**位置：** `src/components/ModelSelector.tsx`

**用途：**
- 选择 AI 提供商和模型
- 显示模型价格和特性
- 根据用户等级筛选可用模型

**使用方法：**

```tsx
import { ModelSelector } from '../components/ModelSelector';
import { AIProvider, AIModel } from '../types/ai';

function MyComponent() {
  const [selectedModel, setSelectedModel] = useState<{
    provider: AIProvider;
    model: AIModel;
  } | null>(null);

  const handleModelChange = (provider: AIProvider, model: AIModel) => {
    setSelectedModel({ provider, model });
  };

  return (
    <>
      {/* 完整模式 */}
      <ModelSelector
        value={selectedModel ? {
          provider: selectedModel.provider,
          model: selectedModel.model.modelId
        } : undefined}
        onChange={handleModelChange}
      />

      {/* 紧凑模式 */}
      <ModelSelector
        compact
        value={...}
        onChange={handleModelChange}
      />
    </>
  );
}
```

## 🔌 API 服务使用

### AI 服务

**位置：** `src/services/ai.ts`

```typescript
import { aiService } from '../services/ai';

// 获取可用模型
const models = await aiService.getAvailableModels();

// AI 对话
const response = await aiService.chat({
  provider: 'openai',
  model: 'gpt-4o-mini',
  messages: [
    { role: 'user', content: '你好' }
  ],
  temperature: 0.7,
  maxTokens: 2000,
});

console.log(response.content);       // AI 回复内容
console.log(response.cost);          // 消耗积分
console.log(response.usage);         // Token 使用情况

// 错误处理
try {
  const response = await aiService.chat(...);
} catch (error) {
  const errorMessage = aiService.handleAIError(error);
  alert(errorMessage);
}
```

### 积分服务

**位置：** `src/services/credit.ts`

```typescript
import { creditService } from '../services/credit';

// 获取余额
const balance = await creditService.getBalance();
console.log(balance.coins);           // 付费积分
console.log(balance.remainingQuota);  // 剩余免费额度

// 获取使用统计
const stats = await creditService.getUsageStats(7); // 最近7天
console.log(stats.totalCost);         // 总消耗
console.log(stats.requestCount);      // 请求次数
console.log(stats.byModel);           // 按模型统计

// 获取充值套餐
const plans = await creditService.getRechargePlans();

// 创建充值订单
const order = await creditService.createRechargeOrder(50, 'wechat');

// 升级会员
await creditService.upgradeTier('pro');

// 工具函数
creditService.formatCoins(1500);      // "1.5K"
creditService.getTierInfo('pro');     // 获取会员信息
```

## 🎨 导航栏更新

**位置：** `src/components/Layout.tsx`

导航栏已添加：
- 余额显示（点击跳转充值页）
- AI 对话链接
- 使用统计链接
- 会员链接
- 用户菜单（退出登录）

## 🚀 快速开始

### 1. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端将运行在 http://localhost:3000

### 2. 配置环境变量

创建 `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. 测试流程

1. **注册账号**
   - 访问 `/register`
   - 注册成功后自动获得 50,000 积分

2. **测试 AI 对话**
   - 访问 `/ai-chat`
   - 选择模型（如 GPT-4o Mini）
   - 输入消息测试

3. **查看余额**
   - 导航栏右上角显示余额
   - 点击可跳转充值页面

4. **查看统计**
   - 访问 `/usage-stats`
   - 查看详细的使用情况

5. **升级会员**
   - 访问 `/membership`
   - 选择会员等级升级（演示环境无需支付）

## 💡 开发建议

### 在工作流中集成 AI

如果要在工作流编辑器中使用 AI：

```typescript
import { aiService } from '../services/ai';
import { ModelSelector } from '../components/ModelSelector';

// 在 LLM 节点配置中
function LLMNodeConfig({ nodeId, data }) {
  const [selectedModel, setSelectedModel] = useState(null);

  const handleExecute = async (input: string) => {
    try {
      const response = await aiService.chat({
        provider: selectedModel.provider,
        model: selectedModel.model.modelId,
        messages: [{ role: 'user', content: input }],
        workflowId: workflowId,        // 关联工作流
        executionId: executionId,      // 关联执行记录
      });

      return response.content;
    } catch (error) {
      const message = aiService.handleAIError(error);
      throw new Error(message);
    }
  };

  return (
    <div>
      <ModelSelector
        compact
        value={selectedModel}
        onChange={setSelectedModel}
      />

      <button onClick={() => handleExecute('测试输入')}>
        执行
      </button>
    </div>
  );
}
```

### 错误处理最佳实践

```typescript
import { aiService } from '../services/ai';

async function callAI() {
  try {
    const response = await aiService.chat({...});
    return response;
  } catch (error: any) {
    // 统一的错误处理
    const message = aiService.handleAIError(error);

    // 根据错误类型做不同处理
    if (error.response?.data?.code === 'INSUFFICIENT_CREDIT') {
      // 引导用户充值
      if (window.confirm('积分不足，是否前往充值？')) {
        navigate('/recharge');
      }
    } else if (error.response?.data?.code === 'TIER_REQUIRED') {
      // 引导用户升级
      if (window.confirm('需要升级会员，是否前往升级？')) {
        navigate('/membership');
      }
    } else {
      alert(message);
    }
  }
}
```

### 余额实时更新

```typescript
import { creditService } from '../services/credit';
import { useEffect, useState } from 'react';

function MyComponent() {
  const [balance, setBalance] = useState(null);

  // 定期刷新余额
  useEffect(() => {
    const loadBalance = async () => {
      const data = await creditService.getBalance();
      setBalance(data);
    };

    loadBalance();

    // 每30秒刷新一次
    const interval = setInterval(loadBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  // AI 调用后立即刷新
  const handleAICall = async () => {
    await aiService.chat({...});

    // 重新获取余额
    const data = await creditService.getBalance();
    setBalance(data);
  };
}
```

## 📊 类型定义

所有类型定义位于：
- `src/types/ai.ts` - AI 相关类型
- `src/types/credit.ts` - 积分相关类型

**常用类型：**

```typescript
// AI 相关
import {
  AIProvider,        // 'openai' | 'anthropic' | 'doubao' | 'qwen' | 'zhipu'
  AIModel,           // 模型信息
  ChatMessage,       // 对话消息
  ChatRequest,       // 对话请求
  ChatResponse,      // 对话响应
  GroupedModels,     // 分组的模型列表
} from '../types/ai';

// 积分相关
import {
  UserBalance,       // 用户余额
  UsageStats,        // 使用统计
  RechargePlan,      // 充值套餐
  RechargeOrder,     // 充值订单
  UserTier,          // 'free' | 'pro' | 'enterprise'
} from '../types/credit';
```

## 🎯 下一步

前端已经完成！你可以：

1. **启动测试**
   - 启动后端：`cd backend && npm run dev`
   - 启动前端：`cd frontend && npm run dev`
   - 注册账号并测试所有功能

2. **在工作流中集成**
   - 使用 ModelSelector 让用户选择模型
   - 使用 aiService.chat() 调用 AI
   - 自动扣费和记录

3. **定制化**
   - 修改配色方案
   - 调整充值套餐
   - 添加更多功能

4. **部署**
   - 构建生产版本：`npm run build`
   - 部署到服务器

## ⚠️ 注意事项

1. **环境变量**
   - 确保 `VITE_API_URL` 正确配置
   - 开发环境：`http://localhost:5000/api`
   - 生产环境：你的实际 API 地址

2. **认证状态**
   - 组件会自动检查登录状态
   - 未登录用户部分功能不可见

3. **错误处理**
   - 所有 API 调用都应该 try-catch
   - 使用 aiService.handleAIError() 处理 AI 错误
   - 积分不足和权限不足要给出明确提示

4. **性能优化**
   - 余额数据可以缓存
   - 避免频繁调用 API
   - 使用 React.memo 优化重渲染

祝你使用愉快！🎉
