# 🧪 模拟模式快速开始指南

## 什么是模拟模式？

模拟模式让你可以**无需 OpenAI API 密钥**就能测试"文章转工作流"功能！

---

## 🚀 3步快速体验

### 1. 启动服务

```bash
# 终端1: 启动后端
cd backend
npm run dev

# 终端2: 启动前端
cd frontend
npm run dev
```

### 2. 访问页面并启用模拟模式

1. 打开浏览器 → `http://localhost:5173`
2. 登录测试账号:
   - 邮箱: `test@workflow.com`
   - 密码: `test123456`
3. 点击导航栏 **🧠 文章转工作流**
4. ✅ 勾选 **"🧪 测试模式已启用"**

### 3. 输入测试URL生成工作流

选择任意一个测试URL：

```
博客写作: https://example.com/how-to-write-blog
数据分析: https://example.com/data-analysis-guide
产品设计: https://example.com/product-design
通用流程: https://example.com/generic
```

点击 **智能生成工作流** → 等待1-2秒 → 完成！✨

---

## 📊 测试结果

运行 `./test-mock-api.sh` 进行API测试：

```bash
✅ 测试案例1: 博客写作工作流 - 成功
✅ 测试案例2: 数据分析工作流 - 成功
✅ 测试案例3: 产品设计工作流 - 成功
✅ 测试案例4: 通用工作流 - 成功
```

---

## 🎯 关键特性

| 特性 | 模拟模式 | 真实模式 |
|-----|---------|---------|
| API密钥 | ❌ 不需要 | ✅ 需要 |
| 速度 | 🚀 1-2秒 | ⏱️ 10-30秒 |
| 成本 | 💰 免费 | 💸 消耗积分 |
| 用途 | 测试/演示 | 生产环境 |

---

## 📚 详细文档

查看完整测试指南: [MOCK_MODE_TEST_GUIDE.md](./MOCK_MODE_TEST_GUIDE.md)

---

## 🎉 功能已完成

- ✅ 后端模拟API端点 (`/api/workflows/generate/from-article-mock`)
- ✅ 前端模拟模式开关（黄色高亮）
- ✅ 4种预设工作流模板
- ✅ 完整测试脚本和文档

**祝你使用愉快！** 🚀
