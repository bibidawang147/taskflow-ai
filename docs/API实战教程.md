# 🎯 API 实战教程 - 手把手教你做 API

## 🎉 恭喜！你的 API 已经创建好了！

刚刚我们一起完成了：
1. ✅ 设计数据库表（WorkItem, WorkItemUsage）
2. ✅ 创建控制器（处理业务逻辑）
3. ✅ 创建路由（定义 API 端点）
4. ✅ 注册到服务器

**API 地址**: `http://localhost:8000/api/work-items`

---

## 📖 API 是什么？

```
前端（你的网页）
    ↓ 发送请求
后端 API（你刚做的）
    ↓ 查询数据库
返回数据
    ↓
前端显示
```

**简单来说**：API 就是前端和后端之间沟通的桥梁。

---

## 🚀 测试你的 API

### **第 1 步：登录获取 Token**（2 分钟）

API 需要登录才能使用，所以先登录：

```bash
# 登录（使用之前注册的用户）
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test123@example.com",
    "password": "Test1234"
  }'
```

**返回结果**类似：
```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUz...",  // 👈 复制这个 token！
  "user": { ... }
}
```

**把 token 保存下来！**接下来的请求都需要它。

---

### **第 2 步：创建工作项**（5 分钟）

现在创建一些工作项（对应前端的"文章撰写"、"市场分析"等）：

```bash
# 替换 YOUR_TOKEN 为你刚才复制的 token

# 创建工作项 1：文章撰写
curl -X POST http://localhost:8000/api/work-items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "文章撰写",
    "icon": "📝",
    "category": "text",
    "description": "AI 辅助撰写各类文章"
  }'

# 创建工作项 2：市场分析
curl -X POST http://localhost:8000/api/work-items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "市场分析",
    "icon": "📊",
    "category": "analysis",
    "description": "数据分析和市场调研"
  }'

# 创建工作项 3：代码审查
curl -X POST http://localhost:8000/api/work-items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "代码审查",
    "icon": "🔍",
    "category": "code",
    "description": "代码质量检查"
  }'
```

---

### **第 3 步：查看所有工作项**

```bash
curl http://localhost:8000/api/work-items
```

**返回结果**：
```json
{
  "success": true,
  "data": [
    {
      "id": "xxx",
      "name": "文章撰写",
      "icon": "📝",
      "category": "text",
      "description": "AI 辅助撰写各类文章",
      "createdAt": "2025-10-22T..."
    },
    // ... 更多工作项
  ],
  "count": 3
}
```

---

### **第 4 步：模拟使用记录**（记录你使用了某个工作项）

```bash
# 先获取工作项 ID
curl http://localhost:8000/api/work-items

# 假设"文章撰写"的 ID 是 cm1abc123
# 记录使用（需要 token）
curl -X POST http://localhost:8000/api/work-items/track-usage \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workItemId": "cm1abc123"
  }'
```

**多次调用这个接口**（模拟使用多次）：

```bash
# 使用 for 循环记录 8 次使用
for i in {1..8}; do
  curl -X POST http://localhost:8000/api/work-items/track-usage \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"workItemId": "cm1abc123"}'
  echo "\n第 $i 次记录完成"
done
```

---

### **第 5 步：获取日常工作项**（本周使用 >=5 次的）

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/work-items/daily-work
```

**返回结果**：
```json
{
  "success": true,
  "data": [
    {
      "id": "cm1abc123",
      "name": "文章撰写",
      "icon": "📝",
      "category": "text",
      "weeklyUseCount": 8,  // 👈 本周使用了 8 次
      "workItemKey": "text-cm1abc123"
    }
  ],
  "count": 1
}
```

---

## 🎯 完整流程总结

```
1. 用户登录 → 获取 token
   POST /api/auth/login

2. 创建工作项（初始化数据）
   POST /api/work-items

3. 用户使用工作项时，记录使用
   POST /api/work-items/track-usage

4. 前端请求"日常工作"
   GET /api/work-items/daily-work
   → 返回本周使用 >=5 次的工作项
```

---

## 📊 在 Prisma Studio 中查看数据

打开 **http://localhost:5555**

你会看到：
- **work_items** 表：所有工作项
- **work_item_usage** 表：使用记录

你可以直接在这里：
- 查看数据
- 添加数据
- 删除数据

---

## 🔗 前端如何调用这个 API

在你的 React 前端中：

```typescript
// 1. 获取日常工作项
const getDailyWorkItems = async () => {
  const token = localStorage.getItem('token')

  const response = await fetch('http://localhost:8000/api/work-items/daily-work', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  const data = await response.json()
  console.log('日常工作项：', data.data)
  return data.data
}

// 2. 记录使用
const trackUsage = async (workItemId: string) => {
  const token = localStorage.getItem('token')

  await fetch('http://localhost:8000/api/work-items/track-usage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ workItemId })
  })
}

// 使用示例
useEffect(() => {
  getDailyWorkItems().then(items => {
    setDailyWorkItems(items)
  })
}, [])
```

---

## 🎓 你学会了什么？

### **1. 数据库设计**
- 创建表（Model）
- 定义关联（Relations）
- 更新数据库（prisma db push）

### **2. API 开发**
- 控制器（Controllers）：处理业务逻辑
- 路由（Routes）：定义 API 端点
- 认证（Authentication）：JWT token

### **3. RESTful API**
- `GET /api/work-items` - 获取列表
- `POST /api/work-items` - 创建
- `POST /api/work-items/track-usage` - 自定义操作
- `GET /api/work-items/daily-work` - 自定义查询

### **4. 完整流程**
```
数据库设计 → 创建控制器 → 定义路由 → 测试 API → 前端调用
```

---

## 📝 快速参考

### **所有 API 端点**

```
# 认证
POST   /api/auth/register     注册
POST   /api/auth/login        登录
GET    /api/auth/profile      获取用户信息（需要 token）

# 工作项
GET    /api/work-items                    获取所有工作项
POST   /api/work-items                    创建工作项
POST   /api/work-items/batch              批量创建
POST   /api/work-items/track-usage        记录使用（需要 token）
GET    /api/work-items/daily-work         获取日常工作项（需要 token）
```

### **Token 使用方式**

```bash
# 方式 1：Header
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/xxx

# 方式 2：JavaScript fetch
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

## 🎉 下一步

现在你可以：
1. ✅ 在前端调用这个 API
2. ✅ 把 mock 数据替换成真实 API
3. ✅ 添加更多 API 功能
4. ✅ 学习更复杂的数据库操作

**这就是 API 开发的完整流程！** 🚀

有问题随时问我！
