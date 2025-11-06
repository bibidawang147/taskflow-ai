# 🔧 立即修复 "生成工作流失败"

## 问题根源

✅ **已修复的问题：**
- PORT 从 8000 改为 3000 ✓
- CORS 已添加前端地址 5173 ✓

❌ **还需要你做的：**
- 配置真实的 OpenAI API Key

---

## 🚀 3步快速修复

### 第 1 步：获取 OpenAI API Key

1. 访问：https://platform.openai.com/api-keys
2. 点击 "Create new secret key"
3. 复制生成的 key（格式：`sk-proj-...`）

### 第 2 步：配置 API Key

```bash
cd backend

# 方法 A: 使用命令行（推荐）
echo "OPENAI_API_KEY=sk-proj-your-actual-key-here" >> .env.local
source .env.local

# 方法 B: 手动编辑 .env 文件
# 打开 .env 文件，把第10行改成：
# OPENAI_API_KEY=sk-proj-your-actual-key-here
```

### 第 3 步：重启后端

```bash
# 停止当前运行的后端（按 Ctrl+C）

# 重新启动
npm run dev
```

你应该看到：
```
🚀 服务器运行在端口 3000
📊 健康检查: http://localhost:3000/health
```

---

## 🧪 验证修复

### 测试 1: 检查后端是否正常运行

```bash
curl http://localhost:3000/health
```

应该返回：
```json
{"status":"OK","timestamp":"..."}
```

### 测试 2: 运行自动化测试

```bash
cd backend
node test-article-generation.js
```

如果看到 ✅，说明修复成功！

---

## 🎯 现在可以使用了！

1. **打开浏览器**
   - 访问：http://localhost:5173

2. **登录**
   - 邮箱：test@workflow.com
   - 密码：test123456

3. **点击导航栏**
   - 🧠 文章转工作流

4. **输入测试 URL**
   ```
   https://example.com
   ```

5. **点击生成**
   - 等待 10-30 秒
   - 观察进度条
   - 成功后自动跳转！

---

## ❌ 如果还是失败

### 检查清单：

- [ ] OpenAI API Key 是否正确（以 `sk-` 开头）
- [ ] OpenAI 账号是否有余额
- [ ] 后端是否在 3000 端口运行
- [ ] 前端是否在 5173 端口运行
- [ ] 浏览器控制台是否有错误

### 查看详细错误：

**后端日志：**
```bash
cd backend
npm run dev
# 观察终端输出
```

**前端日志：**
- 按 F12 打开开发者工具
- 查看 Console 标签

### 常见错误：

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| "未配置OpenAI API Key" | Key 是占位符 | 替换成真实 key |
| "Network Error" | 后端未运行 | 启动后端 |
| "CORS error" | 端口不匹配 | 已修复，重启后端 |
| "401 Unauthorized" | API Key 无效 | 检查 key 是否正确 |
| "429 Too Many Requests" | 超出配额 | 检查 OpenAI 账号额度 |

---

## 💡 为什么之前失败？

1. **端口不匹配**
   - 后端在 8000，前端期望 3000
   - **已修复** ✅

2. **CORS 限制**
   - 未允许前端端口 5173
   - **已修复** ✅

3. **OpenAI API Key 未配置**
   - 使用占位符 `your-openai-api-key`
   - **需要你配置** ⚠️

---

## 🆘 还需要帮助？

运行诊断脚本：
```bash
cd backend
./diagnose.sh
```

或者直接告诉我：
- 浏览器控制台显示的完整错误
- 后端终端显示的错误日志
- 使用的测试 URL

我会立即帮你解决！💪
