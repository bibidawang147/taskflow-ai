# 后端开发知识储备指南

## 🎯 当前状态

✅ **已配置完成：**
- Node.js + Express + TypeScript 环境
- Prisma ORM + SQLite 数据库
- JWT 认证系统
- 基础路由和中间件
- 服务器运行在 http://localhost:8000

## 📚 核心知识体系

### 1. Node.js 基础

#### Express 框架核心概念

```typescript
import express from 'express'
const app = express()

// 中间件
app.use(express.json())  // 解析 JSON
app.use(cors())          // 跨域

// 路由
app.get('/api/users', handler)     // 获取列表
app.get('/api/users/:id', handler) // 获取单个
app.post('/api/users', handler)    // 创建
app.put('/api/users/:id', handler) // 更新
app.delete('/api/users/:id', handler) // 删除

// 错误处理
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message })
})
```

#### 异步编程 (async/await)

```typescript
// ✅ 推荐写法
async function getUser(id: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw new Error('用户不存在')
    return user
  } catch (error) {
    console.error(error)
    throw error
  }
}

// 并行处理
const [users, count] = await Promise.all([
  prisma.user.findMany(),
  prisma.user.count()
])
```

---

### 2. TypeScript 后端开发

#### 类型定义

```typescript
// 请求参数类型
interface CreateWorkItemDTO {
  name: string
  icon: string
  category: string
  description?: string
}

// 响应数据类型
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 扩展 Express Request
import { Request } from 'express'
interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}
```

#### 控制器示例

```typescript
import { Response } from 'express'

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany()
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户失败'
    })
  }
}
```

---

### 3. Prisma ORM 核心操作

#### 基础 CRUD

```typescript
// Create - 创建
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    name: '测试用户',
    password: hashedPassword
  }
})

// Read - 查询
const user = await prisma.user.findUnique({
  where: { id: userId }
})

const users = await prisma.user.findMany({
  where: {
    email: { contains: '@example.com' }
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0
})

// Update - 更新
const updated = await prisma.user.update({
  where: { id: userId },
  data: { name: '新名字' }
})

// Delete - 删除
await prisma.user.delete({
  where: { id: userId }
})
```

#### 关联查询

```typescript
// 包含关联数据
const workflow = await prisma.workflow.findUnique({
  where: { id: workflowId },
  include: {
    author: true,           // 包含作者信息
    nodes: true,            // 包含所有节点
    executions: {           // 包含执行历史（带条件）
      take: 5,
      orderBy: { startedAt: 'desc' }
    }
  }
})

// 嵌套创建
const workflow = await prisma.workflow.create({
  data: {
    title: '新工作流',
    config: {},
    author: {
      connect: { id: userId }  // 关联已存在的用户
    },
    nodes: {
      create: [               // 同时创建节点
        { type: 'input', label: '输入', position: {}, config: {} },
        { type: 'output', label: '输出', position: {}, config: {} }
      ]
    }
  }
})
```

#### 聚合和统计

```typescript
// 计数
const userCount = await prisma.user.count()

// 分组统计
const stats = await prisma.workItemUsage.groupBy({
  by: ['workItemId'],
  where: {
    userId: currentUserId,
    usedAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  },
  _count: {
    _all: true
  },
  orderBy: {
    _count: {
      _all: 'desc'
    }
  }
})

// 聚合函数
const result = await prisma.rating.aggregate({
  where: { workflowId },
  _avg: { score: true },
  _count: true,
  _sum: { score: true }
})
```

---

### 4. RESTful API 设计规范

#### HTTP 方法和状态码

```typescript
// GET - 查询资源
app.get('/api/workflows', async (req, res) => {
  const workflows = await prisma.workflow.findMany()
  res.status(200).json({ data: workflows })  // 200 OK
})

// POST - 创建资源
app.post('/api/workflows', async (req, res) => {
  const workflow = await prisma.workflow.create({ data: req.body })
  res.status(201).json({ data: workflow })   // 201 Created
})

// PUT - 完整更新
app.put('/api/workflows/:id', async (req, res) => {
  const workflow = await prisma.workflow.update({
    where: { id: req.params.id },
    data: req.body
  })
  res.status(200).json({ data: workflow })   // 200 OK
})

// PATCH - 部分更新
app.patch('/api/workflows/:id', async (req, res) => {
  const workflow = await prisma.workflow.update({
    where: { id: req.params.id },
    data: req.body
  })
  res.status(200).json({ data: workflow })
})

// DELETE - 删除资源
app.delete('/api/workflows/:id', async (req, res) => {
  await prisma.workflow.delete({ where: { id: req.params.id } })
  res.status(204).send()                     // 204 No Content
})
```

#### 常用状态码

```typescript
200 OK              // 成功
201 Created         // 创建成功
204 No Content      // 删除成功
400 Bad Request     // 请求参数错误
401 Unauthorized    // 未认证
403 Forbidden       // 无权限
404 Not Found       // 资源不存在
409 Conflict        // 资源冲突（如邮箱已存在）
500 Internal Error  // 服务器错误
```

#### API 命名规范

```typescript
// ✅ 好的命名
GET    /api/workflows              // 获取工作流列表
GET    /api/workflows/:id          // 获取单个工作流
POST   /api/workflows              // 创建工作流
PUT    /api/workflows/:id          // 更新工作流
DELETE /api/workflows/:id          // 删除工作流
GET    /api/workflows/:id/nodes    // 获取工作流的节点

GET    /api/users/me/workflows     // 获取当前用户的工作流
GET    /api/work-items/daily-work  // 获取日常工作项

// ❌ 不好的命名
GET    /api/getWorkflows
POST   /api/createWorkflow
GET    /api/workflow              // 应该用复数
GET    /api/workflows/get/:id    // 不需要动词
```

---

### 5. 身份认证（JWT）

#### 认证流程

```typescript
// 1. 用户注册
export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body

  // 检查邮箱是否已存在
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: '邮箱已被使用' })
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 10)

  // 创建用户
  const user = await prisma.user.create({
    data: { email, name, password: hashedPassword }
  })

  // 生成 JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )

  res.status(201).json({ token, user })
}

// 2. 用户登录
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ error: '邮箱或密码错误' })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return res.status(401).json({ error: '邮箱或密码错误' })
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )

  res.json({ token, user })
}

// 3. 认证中间件
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = decoded as { id: string; email: string }
    next()
  } catch (error) {
    return res.status(403).json({ error: '无效的令牌' })
  }
}

// 4. 使用认证中间件
app.get('/api/users/me', authenticateToken, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id }
  })
  res.json({ data: user })
})
```

---

### 6. 数据验证

```typescript
import { body, param, validationResult } from 'express-validator'

// 定义验证规则
export const validateCreateWorkflow = [
  body('title')
    .trim()
    .notEmpty().withMessage('标题不能为空')
    .isLength({ max: 100 }).withMessage('标题不能超过100字符'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('描述不能超过500字符'),
  body('config')
    .notEmpty().withMessage('配置不能为空')
    .isObject().withMessage('配置必须是对象')
]

// 在路由中使用
router.post('/workflows',
  authenticateToken,
  validateCreateWorkflow,
  handleValidationErrors,
  createWorkflow
)

// 验证错误处理中间件
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}
```

---

## 🚀 实战：为"日常工作"功能开发后端

### Step 1: 设计数据库模型

编辑 `backend/prisma/schema.prisma`，添加：

```prisma
model WorkItem {
  id          String   @id @default(cuid())
  name        String
  icon        String
  category    String
  description String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  usageStats  WorkItemUsage[]

  @@map("work_items")
}

model WorkItemUsage {
  id          String   @id @default(cuid())
  userId      String
  workItemId  String
  usedAt      DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
  workItem    WorkItem @relation(fields: [workItemId], references: [id])

  @@index([userId, workItemId, usedAt])
  @@map("work_item_usage")
}

// 在 User model 中添加
model User {
  // ... 现有字段
  workItemUsage WorkItemUsage[]
}
```

### Step 2: 创建路由文件

`backend/src/routes/workItems.ts`:

```typescript
import express from 'express'
import { authenticateToken } from '../middleware/auth'
import {
  getDailyWorkItems,
  trackWorkItemUsage,
  getAllWorkItems
} from '../controllers/workItemController'

const router = express.Router()

// 获取日常工作项（本周使用 >= 5次）
router.get('/daily-work', authenticateToken, getDailyWorkItems)

// 获取所有工作项
router.get('/', getAllWorkItems)

// 记录工作项使用
router.post('/track-usage', authenticateToken, trackWorkItemUsage)

export default router
```

### Step 3: 创建控制器

`backend/src/controllers/workItemController.ts`:

```typescript
import { Response } from 'express'
import { prisma } from '../utils/database'
import { AuthRequest } from '../types'

// 获取日常工作项
export const getDailyWorkItems = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // 统计本周使用情况
    const usageStats = await prisma.workItemUsage.groupBy({
      by: ['workItemId'],
      where: {
        userId,
        usedAt: { gte: weekAgo }
      },
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          _all: 'desc'
        }
      }
    })

    // 筛选使用次数 >= 5 的工作项
    const frequentWorkItemIds = usageStats
      .filter(stat => stat._count._all >= 5)
      .map(stat => stat.workItemId)

    // 获取完整的工作项信息
    const workItems = await prisma.workItem.findMany({
      where: {
        id: { in: frequentWorkItemIds }
      }
    })

    // 组合数据
    const result = workItems.map(item => {
      const stats = usageStats.find(s => s.workItemId === item.id)
      return {
        ...item,
        weeklyUseCount: stats?._count._all || 0
      }
    }).slice(0, 12) // 最多返回 12 个

    res.json({
      success: true,
      data: result,
      count: result.length
    })

  } catch (error) {
    console.error('获取日常工作项失败:', error)
    res.status(500).json({
      success: false,
      error: '获取日常工作项失败'
    })
  }
}

// 记录工作项使用
export const trackWorkItemUsage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { workItemId } = req.body

    const usage = await prisma.workItemUsage.create({
      data: {
        userId,
        workItemId,
        usedAt: new Date()
      }
    })

    res.status(201).json({
      success: true,
      data: usage
    })

  } catch (error) {
    console.error('记录使用失败:', error)
    res.status(500).json({
      success: false,
      error: '记录使用失败'
    })
  }
}

// 获取所有工作项
export const getAllWorkItems = async (req: Request, res: Response) => {
  try {
    const workItems = await prisma.workItem.findMany({
      orderBy: { name: 'asc' }
    })

    res.json({
      success: true,
      data: workItems
    })

  } catch (error) {
    console.error('获取工作项失败:', error)
    res.status(500).json({
      success: false,
      error: '获取工作项失败'
    })
  }
}
```

### Step 4: 注册路由

在 `backend/src/server.ts` 中添加：

```typescript
import workItemRoutes from './routes/workItems'

// ... 其他代码

app.use('/api/work-items', workItemRoutes)
```

### Step 5: 更新数据库

```bash
cd backend
npx prisma db push
npx prisma generate
```

### Step 6: 测试 API

```bash
# 1. 获取所有工作项
curl http://localhost:8000/api/work-items

# 2. 记录使用（需要登录 token）
curl -X POST http://localhost:8000/api/work-items/track-usage \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"workItemId": "work-item-id"}'

# 3. 获取日常工作项
curl http://localhost:8000/api/work-items/daily-work \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📖 推荐学习资源

### 官方文档
1. **Express.js**: https://expressjs.com/
2. **Prisma**: https://www.prisma.io/docs
3. **TypeScript**: https://www.typescriptlang.org/docs

### 学习路径
1. **第一周**: Express 基础 + RESTful API 设计
2. **第二周**: Prisma ORM + 数据库操作
3. **第三周**: JWT 认证 + 数据验证
4. **第四周**: 实战项目开发

### 调试工具
- **Postman**: API 测试工具
- **Prisma Studio**: 数据库可视化工具（`npm run db:studio`）
- **VS Code REST Client**: 在编辑器中测试 API

---

## 🔧 常用命令

```bash
# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 启动生产服务器
npm start

# 数据库操作
npm run db:push      # 推送 schema 到数据库
npm run db:generate  # 生成 Prisma Client
npm run db:migrate   # 创建迁移
npm run db:studio    # 打开 Prisma Studio
```

---

## ✅ 下一步行动清单

1. [ ] 阅读 `backend/src` 下的所有文件，理解代码结构
2. [ ] 使用 Postman 测试现有的 `/api/auth` 接口
3. [ ] 为"日常工作"功能添加数据库模型
4. [ ] 实现工作项相关的 API 接口
5. [ ] 前端调用后端 API 替换 mock 数据
6. [ ] 学习 Prisma 的高级查询功能
7. [ ] 添加数据验证和错误处理

加油！🚀
