# 故障排查指南 - "工作流失败"

## 🔍 常见错误及解决方案

### 错误 1: "生成工作流失败"

#### 可能原因 A: 后端未运行

**检查方法:**
```bash
curl http://localhost:3000/api/workflows/templates
```

如果显示 "Connection refused"，说明后端未运行。

**解决方案:**
```bash
cd backend
npm run dev
```

#### 可能原因 B: OpenAI API Key 未配置或无效

**检查方法:**
```bash
cd backend
grep OPENAI_API_KEY .env
```

**解决方案:**
```bash
# 添加或更新 API Key
echo "OPENAI_API_KEY=sk-your-actual-api-key-here" > .env
```

> ⚠️ 确保使用真实的 OpenAI API Key，不是占位符！

#### 可能原因 C: 文章无法访问

某些网站有反爬虫机制或需要登录。

**解决方案:**
- 使用公开可访问的文章
- 尝试不同的 URL
- 推荐测试 URL:
  - `https://example.com` （简单测试）
  - Medium、Dev.to 等公开博客平台的文章

#### 可能原因 D: 网络问题

抓取文章或调用 OpenAI API 时网络超时。

**解决方案:**
- 检查网络连接
- 检查是否需要配置代理
- 尝试使用较短的文章

### 错误 2: "无法抓取文章内容"

**可能原因:**
- URL 格式错误
- 网站不可访问
- 网站有防爬虫机制

**解决方案:**
```bash
# 测试 URL 是否可访问
curl -I "你的文章URL"

# 如果不可访问，换一个 URL
```

### 错误 3: "文章分析失败"

**可能原因:**
- OpenAI API Key 无效
- OpenAI 账号余额不足
- API 调用超时

**解决方案:**
1. 验证 API Key:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

2. 检查 OpenAI 账号余额:
   访问 https://platform.openai.com/usage

### 错误 4: "未登录" 或 "Token无效"

**解决方案:**
1. 重新登录
2. 清除浏览器缓存
3. 检查 localStorage 中是否有 token

## 🔧 完整重启步骤

### 方法 1: 完全重启

```bash
# 1. 停止所有服务（Ctrl+C）

# 2. 重启后端
cd backend
npm run dev

# 3. 重启前端（新终端）
cd frontend
npm run dev

# 4. 测试功能
# 访问 http://localhost:5173
# 登录: test@workflow.com / test123456
# 点击 🧠 文章转工作流
```

### 方法 2: 端口冲突处理

如果端口被占用：

```bash
# 查找占用端口的进程
lsof -i :3000  # 后端
lsof -i :5173  # 前端

# 杀死进程
kill -9 <PID>

# 然后重新启动
```

## 🧪 测试流程

### 1. 基础测试

```bash
cd backend
node test-article-generation.js
```

这会测试:
- ✅ 登录功能
- ✅ API 连接
- ✅ 工作流生成

### 2. 手动测试步骤

1. **打开浏览器**
   - 访问: http://localhost:5173

2. **打开开发者工具**
   - 按 F12 或右键 → 检查
   - 切换到 Console 标签

3. **登录**
   - 邮箱: test@workflow.com
   - 密码: test123456

4. **访问功能页面**
   - 点击顶部导航 "🧠 文章转工作流"

5. **输入测试 URL**
   ```
   https://example.com
   ```

6. **查看错误**
   - 前端: 浏览器 Console
   - 后端: 终端日志

## 📊 后端日志解读

正常流程的日志应该是：

```
开始处理文章: https://...
文章抓取成功: 文章标题
AI分析成功，提取了 X 个步骤
工作流生成成功，包含 Y 个节点
```

如果看到错误，根据错误信息判断：

| 错误关键词 | 可能原因 | 解决方案 |
|-----------|---------|---------|
| "OPENAI" | API Key问题 | 检查 .env 文件 |
| "fetch" / "抓取" | 网络或URL问题 | 换URL或检查网络 |
| "timeout" | 超时 | 检查网络，使用较短文章 |
| "401" / "403" | 认证问题 | 重新登录 |
| "500" | 服务器错误 | 查看详细错误日志 |

## 💡 快速检查清单

在提问前，请确认：

- [ ] 后端正在运行 (http://localhost:3000)
- [ ] 前端正在运行 (http://localhost:5173)
- [ ] 已配置 OPENAI_API_KEY
- [ ] OpenAI API Key 有效且有余额
- [ ] 已登录测试账号
- [ ] 使用的是公开可访问的文章 URL
- [ ] 浏览器控制台没有其他错误

## 🆘 获取更多帮助

如果以上都不能解决，请提供：

1. **浏览器控制台的完整错误**
   - 截图或复制文字

2. **后端终端的日志**
   - 包括错误前后的上下文

3. **使用的测试 URL**

4. **环境信息**
   - Node.js 版本: `node --version`
   - 操作系统
   - 是否使用代理

这样我可以更快地帮你定位问题！
