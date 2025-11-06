# Sentry 监控系统设置指南

## 概述

本项目已集成 Sentry 错误监控和性能追踪系统，用于生产环境的实时监控和问题诊断。

## 功能特性

### 后端监控
- ✅ 错误捕获和堆栈跟踪
- ✅ 性能监控和 API 追踪
- ✅ 性能分析 (Profiling)
- ✅ 自动捕获未处理的异常
- ✅ 敏感数据脱敏（密码、token等）

### 前端监控
- ✅ JavaScript 错误捕获
- ✅ 性能监控
- ✅ 用户会话重放 (Session Replay)
- ✅ 浏览器扩展错误过滤
- ✅ 敏感数据脱敏

## 设置步骤

### 1. 创建 Sentry 项目

1. 访问 [Sentry.io](https://sentry.io/) 并注册账号（提供免费套餐）
2. 创建两个项目：
   - **Backend**: 选择 "Node.js" / "Express" 平台
   - **Frontend**: 选择 "React" 平台

### 2. 获取 DSN

创建项目后，Sentry 会提供一个 DSN (Data Source Name)，格式如下：
```
https://examplePublicKey@o0.ingest.sentry.io/0
```

### 3. 配置环境变量

#### 后端配置

编辑 `/backend/.env` 文件，添加：
```bash
SENTRY_DSN=https://your-backend-sentry-dsn@sentry.io/your-project-id
```

#### 前端配置

创建 `/frontend/.env.production` 文件：
```bash
VITE_API_URL=http://47.93.218.80:3000
VITE_SENTRY_DSN=https://your-frontend-sentry-dsn@sentry.io/your-project-id
```

### 4. 部署到服务器

#### 更新后端环境变量

SSH 到服务器：
```bash
ssh -i ~/Desktop/工作流*.pem root@47.93.218.80
```

编辑后端 `.env` 文件：
```bash
cd /root/workflow-backend
nano .env
# 添加 SENTRY_DSN=your-dsn-here
```

重启后端服务：
```bash
pm2 restart workflow-backend
pm2 logs workflow-backend  # 查看日志确认 Sentry 已初始化
```

#### 重新构建并部署前端

在本地构建前端（包含生产环境 Sentry 配置）：
```bash
cd frontend
npm run build
```

上传到服务器：
```bash
scp -i ~/Desktop/工作流*.pem -r dist/* root@47.93.218.80:/usr/share/nginx/html/
```

### 5. 验证配置

#### 测试后端监控

创建测试脚本 `test-sentry.sh`：
```bash
#!/bin/bash
# 触发一个测试错误
curl -X POST http://47.93.218.80:3000/api/test-sentry-error
```

#### 测试前端监控

在浏览器中访问应用，打开控制台运行：
```javascript
// 触发测试错误
throw new Error('Sentry test error from frontend');
```

#### 检查 Sentry 控制台

访问 Sentry.io 控制台，应该能看到：
- Issues 页面显示捕获的错误
- Performance 页面显示性能指标
- Session Replay (如果启用) 显示用户会话

## 配置选项

### 采样率调整

根据流量和预算调整采样率：

**后端** (`backend/src/config/sentry.ts`):
```typescript
tracesSampleRate: 0.1,  // 10% 的请求进行性能追踪
profilesSampleRate: 0.1, // 10% 的请求进行性能分析
```

**前端** (`frontend/src/config/sentry.ts`):
```typescript
tracesSampleRate: 0.1,           // 10% 的页面加载进行追踪
replaysSessionSampleRate: 0.1,   // 10% 的正常会话进行录制
replaysOnErrorSampleRate: 1.0,   // 100% 的错误会话进行录制
```

### 禁用 Session Replay

如果不需要会话重放功能，可以移除相关配置：

```typescript
// 从 integrations 中移除
Sentry.replayIntegration({
  maskAllText: true,
  blockAllMedia: true,
}),
```

## 最佳实践

### 1. 环境隔离
- 开发环境：可以不配置 DSN 或使用单独的开发项目
- 生产环境：使用生产 DSN 并启用所有监控功能

### 2. 敏感数据保护
- 已自动过滤：密码、token、cookie、authorization headers
- 自定义过滤：在 `beforeSend` 钩子中添加

### 3. 错误分组
Sentry 会自动对相似错误进行分组，可以通过：
- Fingerprinting 规则自定义分组
- Release 标记区分不同版本的错误

### 4. 告警设置
在 Sentry 控制台配置：
- Issue Alerts: 新错误或错误频率异常时通知
- Metric Alerts: 性能指标异常时通知
- 通知渠道: Email, Slack, PagerDuty 等

## 成本考虑

Sentry 免费套餐包含：
- 5,000 错误事件/月
- 10,000 性能事件/月
- 50 Session Replays/月

优化建议：
- 使用合理的采样率
- 过滤掉不重要的错误（如网络错误）
- 定期清理已解决的问题

## 故障排查

### Sentry 未初始化
检查日志中是否有 "✅ Sentry initialized successfully" 消息

### 错误未上报
1. 确认 DSN 配置正确
2. 检查网络是否能访问 sentry.io
3. 查看浏览器控制台是否有 Sentry 相关错误

### 性能数据缺失
1. 确认 `tracesSampleRate` 不为 0
2. 检查是否有性能事件配额

## 相关资源

- [Sentry 官方文档](https://docs.sentry.io/)
- [Node.js SDK 文档](https://docs.sentry.io/platforms/node/)
- [React SDK 文档](https://docs.sentry.io/platforms/javascript/guides/react/)
- [性能监控指南](https://docs.sentry.io/product/performance/)
