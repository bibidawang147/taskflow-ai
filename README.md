# 工作流平台 (Workflow Platform)

一个类似 Coze/Dify 的 AI 工作流平台，允许用户通过可视化界面创建、管理和执行 AI 工作流。

## 技术栈

### 前端
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS** - 样式框架
- **React Router** - 路由管理
- **@xyflow/react** - 工作流可视化编辑器
- **Axios** - HTTP 客户端
- **Lucide React** - 图标库

### 后端
- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** + **PostgreSQL** - 数据库
- **JWT** + **bcryptjs** - 认证和密码加密
- **express-validator** - 数据验证
- **helmet** + **cors** - 安全中间件

### 数据库设计
- Users (用户)
- Workflows (工作流)
- WorkflowNodes (工作流节点)
- WorkflowExecutions (执行历史)
- Tools (工具)
- Comments (评论)
- Ratings (评分)
- Favorites (收藏)

## 项目结构

```
workflow-platform/
├── frontend/          # React 前端应用
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   │   ├── WorkflowEditor/  # 工作流编辑器
│   │   │   ├── Layout.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/           # 页面组件
│   │   ├── contexts/        # React 上下文
│   │   ├── services/        # API 服务
│   │   ├── types/           # TypeScript 类型
│   │   └── hooks/           # 自定义 Hooks
│   └── package.json
├── backend/           # Node.js 后端 API
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── routes/          # 路由
│   │   ├── middleware/      # 中间件
│   │   ├── utils/           # 工具函数
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma    # 数据库模型
│   └── package.json
├── shared/            # 前后端共享代码
└── docs/              # 文档
```

## 已实现功能

### ✅ 基础架构
- [x] 项目目录结构搭建
- [x] 前端 React + TypeScript + Vite 环境配置
- [x] 后端 Node.js + Express + TypeScript 环境配置
- [x] Prisma + PostgreSQL 数据库设计

### ✅ 用户认证系统
- [x] JWT 令牌认证
- [x] 用户注册/登录接口
- [x] 密码加密和验证
- [x] 前端认证状态管理
- [x] 受保护路由

### ✅ 工作流编辑器
- [x] 可视化节点编辑器 (基于 React Flow)
- [x] 支持多种节点类型：
  - 输入节点 (Input)
  - LLM 节点 (AI 模型)
  - 工具节点 (Tools)
  - 条件节点 (Condition)
  - 输出节点 (Output)
- [x] 拖拽式节点连接
- [x] 节点配置面板
- [x] 工具栏和节点管理

### ✅ 基础页面
- [x] 首页 - 搜索和快速入口
- [x] 用户登录/注册页面
- [x] 工作空间 (待开发详细功能)
- [x] 探索页面 (待开发详细功能)
- [x] 工作流市场 (待开发详细功能)

## 开发指南

### 环境要求
- Node.js 18+
- PostgreSQL 14+
- npm 或 yarn

### 安装和运行

1. **克隆项目**
```bash
git clone <repository-url>
cd workflow-platform
```

2. **安装依赖**
```bash
# 前端
cd frontend
npm install

# 后端
cd ../backend
npm install
```

3. **配置环境变量**

后端 `.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
DATABASE_URL="postgresql://username:password@localhost:5432/workflow_platform"
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-claude-api-key
```

前端 `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

4. **数据库设置**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

5. **启动开发服务器**
```bash
# 后端 (端口 5000)
cd backend
npm run dev

# 前端 (端口 3000)
cd frontend
npm run dev
```

## 下一步开发计划

### 第二阶段：核心功能完善
- [ ] 工作流保存和加载
- [ ] 工作流执行引擎
- [ ] LLM API 集成 (OpenAI, Claude)
- [ ] 文件上传和处理
- [ ] 工作空间详细功能

### 第三阶段：市场和社区
- [ ] 工作流市场展示
- [ ] 搜索和筛选系统
- [ ] 评论和评分系统
- [ ] 个性化推荐算法

### 第四阶段：优化和扩展
- [ ] 性能优化
- [ ] UI/UX 优化
- [ ] 更多工具集成
- [ ] 移动端适配
- [ ] 实时协作

## API 接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息

### 工作流接口
- `GET /api/workflows` - 获取工作流列表
- `GET /api/workflows/:id` - 获取工作流详情
- `POST /api/workflows` - 创建工作流

### 用户接口
- `GET /api/users/workflows` - 获取用户的工作流
- `GET /api/users/executions` - 获取执行历史

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License