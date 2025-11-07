# 工作流平台 - 项目架构文档

> AI 驱动的智能工作流平台 - 完整架构与功能说明

**版本**: v1.0.0
**更新时间**: 2025-01-07
**作者**: bibidawang147

---

## 📋 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [核心功能](#核心功能)
- [数据库设计](#数据库设计)
- [API 接口](#api-接口)
- [前端页面](#前端页面)
- [工作流引擎](#工作流引擎)
- [AI 集成](#ai-集成)
- [部署架构](#部署架构)
- [开发指南](#开发指南)

---

## 🎯 项目概述

### 简介

工作流平台是一个基于 AI 的智能工作流创建、管理和执行平台，帮助用户自动化日常工作任务。

### 核心价值

- **智能创建**：通过 AI 对话或文章导入自动生成工作流
- **可视化编辑**：拖拽式工作流编辑器，所见即所得
- **多场景支持**：覆盖自媒体、电商、数据分析、效率工具等多个场景
- **即开即用**：提供丰富的工作流模板和工作包
- **灵活执行**：支持手动执行和 API 调用

### 目标用户

- 自媒体创作者
- 电商运营人员
- 产品经理
- 数据分析师
- 独立开发者
- 企业团队

---

## 🛠 技术栈

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 类型系统 |
| Vite | 5.x | 构建工具 |
| React Router | 6.x | 路由管理 |
| ReactFlow | 11.x | 工作流可视化 |
| TailwindCSS | 3.x | CSS 框架 |
| Axios | 1.x | HTTP 客户端 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 20.x | 运行时 |
| Express | 4.x | Web 框架 |
| TypeScript | 5.x | 类型系统 |
| Prisma | 5.x | ORM 数据库 |
| PostgreSQL | 15.x | 数据库 |
| JWT | 9.x | 身份认证 |
| bcryptjs | 2.x | 密码加密 |

### AI 集成

| 服务商 | 模型 | 用途 |
|--------|------|------|
| OpenAI | GPT-4, GPT-3.5 | 文本生成、对话 |
| Anthropic | Claude 3.5 | 智能分析、推理 |
| 字节豆包 | Doubao Pro | 中文场景优化 |
| 阿里通义 | Qwen Plus | 中文理解 |
| 智谱 AI | GLM-4 | 多模态能力 |

### 开发工具

- **版本管理**: Git + GitHub
- **包管理**: npm
- **代码规范**: ESLint + Prettier
- **测试框架**: Jest
- **API 测试**: REST Client
- **部署**: 阿里云 ECS

---

## 📁 项目结构

```
workflow-platform/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   │   ├── HomePage.tsx              # 首页
│   │   │   ├── ExplorePage.tsx           # 探索页
│   │   │   ├── WorkspacePage.tsx         # 工作台
│   │   │   ├── StoragePage.tsx           # 存储库
│   │   │   ├── AIChatPage.tsx            # AI 对话
│   │   │   ├── WorkflowCreatePage.tsx    # 创建工作流
│   │   │   ├── ImportFromArticlePage.tsx # 文章导入
│   │   │   ├── WorkflowSharePage.tsx     # 工作流详情
│   │   │   ├── LoginPage.tsx             # 登录
│   │   │   └── RegisterPage.tsx          # 注册
│   │   ├── components/      # 通用组件
│   │   │   ├── Layout.tsx               # 布局组件
│   │   │   ├── WorkflowEditor/          # 工作流编辑器
│   │   │   ├── WorkflowExecutionModal.tsx # 执行模态框
│   │   │   ├── CreditBalance.tsx        # 积分余额
│   │   │   └── ModelSelector.tsx        # 模型选择器
│   │   ├── services/        # API 服务
│   │   │   ├── api.ts                   # 基础 API
│   │   │   ├── auth.ts                  # 认证服务
│   │   │   ├── workflowApi.ts          # 工作流 API
│   │   │   ├── aiApi.ts                # AI API
│   │   │   ├── workspaceApi.ts         # 工作台 API
│   │   │   └── credit.ts               # 积分 API
│   │   ├── contexts/        # React Context
│   │   │   └── AuthContext.tsx         # 认证上下文
│   │   ├── types/           # TypeScript 类型
│   │   ├── data/            # 静态数据
│   │   │   ├── exploreThemes.ts        # 探索主题
│   │   │   └── popularWorkPackages.ts  # 工作包
│   │   └── styles/          # 样式文件
│   ├── public/              # 静态资源
│   └── package.json
│
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── server.ts                    # 应用入口
│   │   ├── routes/                      # 路由
│   │   │   ├── auth.ts                 # 认证路由
│   │   │   ├── users.ts                # 用户路由
│   │   │   ├── workflows.ts            # 工作流路由
│   │   │   ├── ai.ts                   # AI 路由
│   │   │   ├── workspace.ts            # 工作台路由
│   │   │   ├── workItems.ts            # 工作项路由
│   │   │   └── credit.ts               # 积分路由
│   │   ├── controllers/                 # 控制器
│   │   ├── services/                    # 业务逻辑
│   │   │   ├── aiService.ts            # AI 服务
│   │   │   ├── workflowExecutionService.ts # 工作流执行
│   │   │   ├── articleAnalysisService.ts   # 文章分析
│   │   │   ├── contentAnalysis.service.ts  # 内容分析
│   │   │   └── credit.service.ts       # 积分服务
│   │   ├── middleware/                  # 中间件
│   │   │   ├── auth.ts                 # 认证中间件
│   │   │   └── errorHandler.ts         # 错误处理
│   │   ├── utils/                       # 工具函数
│   │   │   ├── jwt.ts                  # JWT 工具
│   │   │   ├── password.ts             # 密码工具
│   │   │   └── logger.ts               # 日志工具
│   │   └── types/                       # 类型定义
│   ├── prisma/                          # Prisma ORM
│   │   ├── schema.prisma               # 数据库模型
│   │   └── seed-explore-data.ts        # 种子数据
│   └── package.json
│
├── crawler/                  # 爬虫工具
│   ├── MediaCrawler/        # 小红书爬虫
│   └── quick-start.sh       # 快速启动脚本
│
├── docs/                     # 文档
│   ├── QUICK_START.md       # 快速开始
│   ├── API实战教程.md        # API 教程
│   └── AI集成指南.md         # AI 集成
│
├── .gitignore               # Git 忽略配置
├── package.json             # 根项目配置
└── README.md                # 项目说明
```

---

## ⚙️ 核心功能

### 1. 用户系统

#### 功能特性
- ✅ 用户注册（邮箱 + 密码）
- ✅ 用户登录（JWT 认证）
- ✅ 用户信息管理
- ✅ 用户等级（Free / Pro / Enterprise）
- ✅ 积分余额系统

#### 技术实现
- JWT Token 认证
- bcryptjs 密码加密
- 用户会话管理
- 权限控制中间件

---

### 2. 工作流管理

#### 创建方式

**方式 1: AI 对话创建**
- 用户描述需求
- AI 分析意图
- 自动生成工作流配置
- 支持多轮对话优化

**方式 2: 文章导入创建**
- 粘贴文章内容（支持富文本）
- AI 分析文章结构
- 自动识别图片和视频
- 生成对应工作流

**方式 3: 手动创建**
- 拖拽式编辑器
- 节点连线
- 参数配置
- 实时预览

**方式 4: 模板克隆**
- 浏览公开工作流
- 一键克隆到个人空间
- 自定义修改

#### 工作流类型

| 类型 | 说明 | 示例 |
|------|------|------|
| 公开工作流 | 所有人可见可用 | 爆款文章生成器 |
| 私有工作流 | 仅创建者可见 | 个人定制流程 |
| 模板工作流 | 官方提供的模板 | 客服机器人模板 |
| 草稿工作流 | 未发布的工作流 | 开发中的流程 |

#### 工作流状态管理

```typescript
interface Workflow {
  id: string
  title: string
  description: string
  isPublic: boolean     // 是否公开
  isTemplate: boolean   // 是否为模板
  isDraft: boolean      // 是否为草稿
  category: string      // 分类
  tags: string          // 标签
  config: JSON          // 工作流配置
  usageCount: number    // 使用次数
  rating: number        // 评分
  author: User          // 作者
}
```

---

### 3. 工作台功能

#### 核心特性

**存储库视图（StoragePage）**
- 📂 我创建的工作流
- ⭐ 我收藏的工作流
- 🎨 拖拽式画布布局
- 📦 容器分组管理
- 🔍 搜索和筛选
- ⚡ 快速执行

**工作台视图（WorkspacePage）**
- 🗂️ 自由画布布局
- 📌 卡片拖拽避让
- 🔗 工作流快速访问
- 💾 布局自动保存
- 📤 工作台数据导出

#### 交互体验

```typescript
// 拖拽避让算法
- 拖动卡片时自动避让其他卡片
- 智能寻找最近的可用位置
- 平滑的动画过渡
- 支持缩放和平移

// 布局持久化
- 自动保存到数据库
- 刷新后恢复状态
- 支持多设备同步
```

---

### 4. 探索与发现

#### 探索页面结构

**热门排行榜**
- 工作流排行（按使用量、点赞数）
- 创作者排行（按作品数、粉丝数）
- AI 工具排行（按评分、使用量）

**爆款工作包**
- 自媒体爆款内容创作套装
- 电商运营增长套餐
- AI 模型工具库
- 数据分析师必备工具集
- AI 图片处理专业包
- 视频创作全能套装
- 产品经理全套工具包
- 增长实验加速器

**热门主题**
- 自媒体运营（文章写作、视频制作、图片设计、运营技巧）
- 一人公司（产品开发、市场营销、财务管理、流程自动化）
- 工作效率提升（时间管理、任务协同、知识管理、会议协作）
- 数据分析（数据可视化、报表生成、趋势预测、数据清洗）
- 电商运营（商品详情、客户服务、营销推广、用户复购）
- AI 个人助手（知识管理、任务管理、学习规划、技能学习）
- 出海增长（市场调研、创意制作、广告投放、运营策略）
- 智能教育创新（课程设计、教学交付、学习运营、家校沟通）

---

### 5. AI 对话创建

#### 对话流程

```
用户输入 → AI 分析意图 → 生成工作流配置 → 用户确认 → 保存工作流
```

#### 支持的场景

1. **任务描述**
   ```
   用户: "帮我写一篇关于人工智能的文章"
   AI: 创建文章生成工作流
   ```

2. **复杂需求**
   ```
   用户: "我需要一个自动回复客户咨询的系统"
   AI: 创建智能客服工作流（包含问题识别、话术匹配、自动回复）
   ```

3. **多轮对话优化**
   ```
   用户: "能不能加上 SEO 优化？"
   AI: 在工作流中添加 SEO 优化节点
   ```

#### AI 模型选择

- **GPT-4**: 复杂推理、高质量输出
- **Claude 3.5**: 长文本理解、逻辑分析
- **豆包 Pro**: 中文场景优化
- **通义千问**: 中文理解、快速响应

---

### 6. 文章导入功能

#### 支持的内容类型

| 内容类型 | 识别能力 | 说明 |
|---------|---------|------|
| 纯文本 | ✅ | 自动提取标题、段落 |
| 富文本 HTML | ✅ | 保留格式、样式 |
| 图片 | ✅ | 自动下载、预览 |
| 视频 | ✅ | 识别链接、封面 |
| 嵌入式内容 | ✅ | iframe、embed |

#### 工作流程

1. **粘贴内容**
   - 支持 Ctrl+V 快捷粘贴
   - 自动解析 HTML 结构

2. **内容分析**
   - 提取文章标题
   - 分析文章结构
   - 识别媒体资源

3. **工作流生成**
   - AI 分析文章类型
   - 生成对应工作流节点
   - 预填充参数

4. **用户确认**
   - 预览工作流
   - 修改参数
   - 保存工作流

---

### 7. 工作流执行

#### 执行方式

**手动执行**
- 在工作流详情页点击"执行"
- 填写输入参数
- 实时查看执行进度
- 查看执行结果

**API 执行**
```bash
POST /api/workflows/:id/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "input": {
    "topic": "人工智能的发展趋势"
  }
}
```

#### 执行状态

```typescript
enum ExecutionStatus {
  PENDING = 'pending',      // 等待执行
  RUNNING = 'running',      // 执行中
  COMPLETED = 'completed',  // 已完成
  FAILED = 'failed'         // 失败
}
```

#### 执行历史

- 查看所有执行记录
- 筛选执行状态
- 查看输入输出
- 错误日志追踪

---

### 8. 积分系统

#### 积分机制

**获取积分**
- 注册赠送: 1000 积分
- 每日签到: 100 积分
- 邀请好友: 500 积分
- 充值购买: 1 元 = 1000 积分

**消耗积分**
- AI 对话: 按 token 计费
- 工作流执行: 根据节点类型
- 图片生成: 每张 50-200 积分
- 视频生成: 每个 200-1000 积分

#### 用户等级

| 等级 | 免费额度 | 专属功能 | 价格 |
|------|---------|---------|------|
| Free | 10000 积分/天 | 基础功能 | 免费 |
| Pro | 50000 积分/天 | 高级模型、优先队列 | ¥99/月 |
| Enterprise | 无限制 | 私有部署、API 接入 | 定制 |

---

### 9. 收藏与评分

#### 收藏功能

```typescript
// 收藏工作流
POST /api/workflows/:id/favorite

// 取消收藏
DELETE /api/workflows/:id/favorite

// 获取收藏列表
GET /api/users/favorites
```

#### 评分系统

- 1-5 星评分
- 评论反馈
- 统计平均评分
- 展示在工作流详情

---

## 🗄️ 数据库设计

### 核心数据表

#### User（用户表）

```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  password    String
  avatar      String?
  tier        String   @default("free") // free, pro, enterprise
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workflows   Workflow[]       // 创建的工作流
  executions  WorkflowExecution[]  // 执行历史
  favorites   Favorite[]       // 收藏
  balance     UserBalance?     // 积分余额

  @@map("users")
}
```

#### Workflow（工作流表）

```prisma
model Workflow {
  id          String   @id @default(cuid())
  title       String
  description String?
  thumbnail   String?
  isPublic    Boolean  @default(false)
  isTemplate  Boolean  @default(false)
  isDraft     Boolean  @default(true)
  category    String?
  tags        String?
  config      Json     // 工作流配置
  version     String   @default("1.0.0")
  usageCount  Int      @default(0)
  rating      Float?

  // 原始来源信息（用于逆向生成）
  sourceType     String?
  sourceUrl      String?
  sourceContent  String?

  // 示例数据
  exampleInput  Json?
  exampleOutput Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  authorId    String
  author      User     @relation(fields: [authorId], references: [id])

  nodes       WorkflowNode[]
  executions  WorkflowExecution[]
  comments    Comment[]
  ratings     Rating[]
  favorites   Favorite[]

  @@map("workflows")
}
```

#### WorkflowNode（工作流节点表）

```prisma
model WorkflowNode {
  id          String   @id @default(cuid())
  type        String   // input, llm, tool, condition, output
  label       String
  position    Json     // 节点位置
  config      Json     // 节点配置

  workflowId  String
  workflow    Workflow @relation(fields: [workflowId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("workflow_nodes")
}
```

#### WorkflowExecution（工作流执行表）

```prisma
model WorkflowExecution {
  id          String   @id @default(cuid())
  status      String   // pending, running, completed, failed
  input       Json?
  output      Json?
  error       String?
  duration    Int?     // 执行时长(毫秒)
  progress    String?  // 当前执行进度
  nodeResults Json?    // 每个节点的执行结果

  startedAt   DateTime @default(now())
  completedAt DateTime?

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  workflowId  String
  workflow    Workflow @relation(fields: [workflowId], references: [id])

  steps       ExecutionStep[]

  @@map("workflow_executions")
}
```

#### Favorite（收藏表）

```prisma
model Favorite {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  workflowId  String
  workflow    Workflow @relation(fields: [workflowId], references: [id])

  @@unique([userId, workflowId])
  @@map("favorites")
}
```

#### UserBalance（用户积分表）

```prisma
model UserBalance {
  id            String   @id @default(cuid())
  userId        String   @unique
  coins         Int      @default(0)      // 积分余额
  freeQuota     Int      @default(10000)  // 每日免费额度
  usedToday     Int      @default(0)      // 今日已用
  quotaResetAt  DateTime                  // 额度重置时间
  totalRecharged Float   @default(0)      // 累计充值
  totalConsumed  Int     @default(0)      // 累计消耗

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id])

  @@map("user_balance")
}
```

#### WorkspaceLayout（工作台布局表）

```prisma
model WorkspaceLayout {
  id          String   @id @default(cuid())
  userId      String   @unique
  layout      Json     // 卡片布局配置
  zoom        Float    @default(1.0)
  snapshot    Json?    // 完整状态快照

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])

  @@map("workspace_layouts")
}
```

### 数据库关系图

```
User (1) ──< (N) Workflow
User (1) ──< (N) WorkflowExecution
User (1) ──< (N) Favorite
User (1) ──── (1) UserBalance
User (1) ──── (1) WorkspaceLayout

Workflow (1) ──< (N) WorkflowNode
Workflow (1) ──< (N) WorkflowExecution
Workflow (1) ──< (N) Favorite
Workflow (1) ──< (N) Rating
Workflow (1) ──< (N) Comment

WorkflowExecution (1) ──< (N) ExecutionStep
```

---

## 🔌 API 接口

### 认证相关

```
POST   /api/auth/register          # 用户注册
POST   /api/auth/login             # 用户登录
GET    /api/auth/me                # 获取当前用户信息
```

### 用户相关

```
GET    /api/users/workflows        # 获取用户创建的工作流
GET    /api/users/favorites        # 获取用户收藏的工作流
GET    /api/users/executions       # 获取用户执行历史
```

### 工作流相关

```
GET    /api/workflows              # 获取公开工作流列表
GET    /api/workflows/my           # 获取我的工作流
GET    /api/workflows/:id          # 获取工作流详情
POST   /api/workflows              # 创建工作流
PUT    /api/workflows/:id          # 更新工作流
DELETE /api/workflows/:id          # 删除工作流
POST   /api/workflows/:id/clone    # 克隆工作流
POST   /api/workflows/:id/execute  # 执行工作流
POST   /api/workflows/:id/favorite # 收藏工作流
DELETE /api/workflows/:id/favorite # 取消收藏
```

### AI 相关

```
POST   /api/ai/chat                # AI 对话
POST   /api/ai/analyze-article     # 分析文章生成工作流
POST   /api/ai/analyze-content     # 分析内容（图片、视频等）
POST   /api/ai/generate-workflow   # 生成工作流配置
```

### 工作台相关

```
GET    /api/workspace/layout       # 获取工作台布局
POST   /api/workspace/layout       # 保存工作台布局
DELETE /api/workspace/layout       # 重置工作台布局
GET    /api/workspace/export       # 导出工作台数据
```

### 积分相关

```
GET    /api/credit/balance         # 获取积分余额
POST   /api/credit/recharge        # 充值积分
GET    /api/credit/usage-logs      # 获取使用日志
```

### 接口认证

所有需要认证的接口都需要在 Header 中携带 JWT Token：

```bash
Authorization: Bearer <token>
```

### 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 🎨 前端页面

### 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | HomePage | 首页（搜索入口） |
| `/explore` | ExplorePage | 探索页（主题、工作包） |
| `/explore/theme/:id` | ExploreThemeDetailPage | 主题详情 |
| `/workspace` | WorkspacePage | 我的工作台 |
| `/storage` | StoragePage | 存储库 |
| `/ai-chat` | AIChatPage | AI 对话创建 |
| `/workflow/create` | WorkflowCreatePage | 创建工作流 |
| `/workflow/import-from-article` | ImportFromArticlePage | 从文章导入 |
| `/workflow/:id` | WorkflowSharePage | 工作流详情 |
| `/login` | LoginPage | 登录 |
| `/register` | RegisterPage | 注册 |
| `/membership` | MembershipPage | 会员充值 |
| `/usage-stats` | UsageStatsPage | 使用统计 |

### 页面功能详解

#### 1. 首页（HomePage）

**功能**：
- 🔍 全局搜索框（AI 对话式）
- ⚡ 快捷入口（内容创作、电商工作流、个人助手）
- 📜 最近对话历史

**设计要点**：
- 简洁的搜索体验
- 引导用户快速开始
- 展示历史记录方便回访

#### 2. 探索页（ExplorePage）

**功能**：
- 📊 热门排行榜
  - 工作流排行
  - 创作者排行
  - AI 工具排行
- 🎁 爆款工作包
- 🏷️ 热门主题

**设计要点**：
- 数据驱动的推荐
- 趋势标识（↑↓）
- 一键导入工作包

#### 3. 工作台（WorkspacePage）

**功能**：
- 🗂️ 自由画布布局
- 📌 卡片拖拽
- 🎯 智能避让
- 💾 自动保存
- 📤 导出功能

**设计要点**：
- 类似 Figma 的画布体验
- 流畅的拖拽动画
- 实时保存不丢失

#### 4. 存储库（StoragePage）

**功能**：
- 📂 我创建的工作流
- ⭐ 我收藏的工作流
- 🎨 拖拽式布局
- 📦 容器分组
- ⚡ 快速执行

**设计要点**：
- 类似 Notion 的数据库视图
- 支持拖拽排序
- 一键执行工作流

#### 5. AI 对话（AIChatPage）

**功能**：
- 💬 多轮对话
- 🤖 智能理解需求
- 🔄 生成工作流
- ✏️ 实时编辑
- 💾 保存工作流

**设计要点**：
- ChatGPT 式的对话体验
- 流式输出
- 工作流实时预览

#### 6. 工作流详情（WorkflowSharePage）

**功能**：
- 📝 工作流信息展示
- 🔄 流程图可视化
- ⭐ 收藏/评分
- 🚀 执行工作流
- 📋 克隆工作流
- 💬 评论区

**设计要点**：
- 清晰的信息层级
- 交互式流程图
- 社交互动元素

---

## 🔧 工作流引擎

### 节点类型

#### 1. Input Node（输入节点）

```typescript
{
  type: 'input',
  config: {
    fields: [
      { name: 'topic', label: '主题', type: 'text', required: true },
      { name: 'keywords', label: '关键词', type: 'text', required: false }
    ]
  }
}
```

#### 2. LLM Node（大语言模型节点）

```typescript
{
  type: 'llm',
  config: {
    model: 'gpt-4',
    provider: 'openai',
    prompt: '请根据主题 {{topic}} 和关键词 {{keywords}} 写一篇文章',
    temperature: 0.7,
    maxTokens: 2000
  }
}
```

#### 3. Tool Node（工具节点）

```typescript
{
  type: 'tool',
  config: {
    toolType: 'http-request',
    method: 'POST',
    url: 'https://api.example.com/analyze',
    body: {
      text: '{{input.content}}'
    }
  }
}
```

#### 4. Condition Node（条件节点）

```typescript
{
  type: 'condition',
  config: {
    condition: 'input.length > 100',
    trueOutput: 'node-3',
    falseOutput: 'node-4'
  }
}
```

#### 5. Output Node（输出节点）

```typescript
{
  type: 'output',
  config: {
    fields: [
      { name: 'result', label: '结果', type: 'text' },
      { name: 'metadata', label: '元数据', type: 'json' }
    ]
  }
}
```

### 执行引擎

```typescript
class WorkflowExecutionEngine {
  async execute(workflow: Workflow, input: any): Promise<ExecutionResult> {
    // 1. 验证输入
    const validatedInput = this.validateInput(workflow, input)

    // 2. 创建执行记录
    const execution = await this.createExecution(workflow, validatedInput)

    // 3. 按拓扑顺序执行节点
    const sortedNodes = this.topologicalSort(workflow.nodes)

    for (const node of sortedNodes) {
      try {
        // 执行节点
        const result = await this.executeNode(node, execution)

        // 保存节点结果
        await this.saveNodeResult(execution, node, result)

        // 更新进度
        await this.updateProgress(execution, node)

      } catch (error) {
        // 处理错误
        await this.handleError(execution, node, error)
        throw error
      }
    }

    // 4. 返回结果
    return this.getExecutionResult(execution)
  }
}
```

### 变量系统

工作流支持变量引用：

```typescript
// 引用输入变量
{{input.topic}}

// 引用前置节点输出
{{node.llm-1.output.content}}

// 使用函数
{{uppercase(input.title)}}
{{length(input.keywords)}}
```

---

## 🤖 AI 集成

### 模型配置

```typescript
interface AIModel {
  provider: string      // openai, anthropic, doubao, qwen, zhipu
  modelId: string       // gpt-4, claude-3-5-sonnet, doubao-pro
  inputPrice: number    // 每1K tokens输入价格（积分）
  outputPrice: number   // 每1K tokens输出价格（积分）
  maxTokens: number     // 最大token数
  features: {
    vision: boolean             // 支持图片
    functionCalling: boolean    // 支持函数调用
    streaming: boolean          // 支持流式输出
    jsonMode: boolean          // 支持JSON输出
  }
}
```

### 支持的模型

#### OpenAI

- **GPT-4**: 最强推理能力
- **GPT-4 Turbo**: 更快更经济
- **GPT-3.5 Turbo**: 快速响应

#### Anthropic

- **Claude 3.5 Sonnet**: 平衡性能与成本
- **Claude 3 Opus**: 最强能力
- **Claude 3 Haiku**: 快速经济

#### 国内模型

- **豆包 Pro**: 字节跳动
- **通义千问 Plus**: 阿里云
- **GLM-4**: 智谱 AI

### AI 服务调用

```typescript
class AIService {
  async chat(params: ChatParams): Promise<ChatResponse> {
    const { model, messages, temperature, maxTokens } = params

    // 1. 检查积分余额
    await this.checkBalance(params.userId)

    // 2. 调用 AI 模型
    const response = await this.callModel(model, messages, {
      temperature,
      max_tokens: maxTokens
    })

    // 3. 计算消耗
    const cost = this.calculateCost(model, response.usage)

    // 4. 扣除积分
    await this.deductBalance(params.userId, cost)

    // 5. 记录日志
    await this.logUsage(params.userId, model, response.usage, cost)

    return response
  }
}
```

### 积分计费

```typescript
// 示例：GPT-4 计费
输入：1000 tokens = 30 积分
输出：1000 tokens = 60 积分

// 一次对话消耗
输入：500 tokens = 15 积分
输出：800 tokens = 48 积分
总计：63 积分 ≈ 0.063 元
```

---

## 🚀 部署架构

### 生产环境架构

```
┌─────────────────┐
│   Nginx Proxy   │  # 反向代理 + SSL
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼────┐ ┌─▼──────┐
│Frontend│ │Backend │  # 应用层
│(React) │ │(Node.js)│
└────────┘ └───┬────┘
               │
        ┌──────┴──────┐
        │             │
    ┌───▼────┐   ┌───▼────┐
    │PostgreSQL│ │  Redis │  # 数据层
    │   DB    │ │  Cache │
    └─────────┘ └────────┘
```

### 服务器配置

**阿里云 ECS**
- CPU: 2核
- 内存: 4GB
- 磁盘: 40GB SSD
- 带宽: 5Mbps
- 操作系统: Ubuntu 22.04

### 部署流程

1. **前端部署**
   ```bash
   cd frontend
   npm run build
   # 将 dist 目录部署到 Nginx
   ```

2. **后端部署**
   ```bash
   cd backend
   npm run build
   # 使用 PM2 管理进程
   pm2 start dist/server.js
   ```

3. **数据库迁移**
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma db seed
   ```

4. **Nginx 配置**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # 前端静态文件
       location / {
           root /var/www/frontend/dist;
           try_files $uri $uri/ /index.html;
       }

       # 后端 API
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### 环境变量配置

**后端 .env**
```bash
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/workflow"

# JWT
JWT_SECRET="your-secret-key"

# AI 服务
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
DOUBAO_API_KEY="..."
QWEN_API_KEY="..."

# 端口
PORT=3000
```

**前端 .env**
```bash
VITE_API_URL="https://api.your-domain.com"
```

---

## 👨‍💻 开发指南

### 本地开发环境

#### 前置要求

- Node.js >= 20.x
- PostgreSQL >= 15.x
- npm >= 10.x

#### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/bibidawang147/-.git
   cd workflow-platform
   ```

2. **安装依赖**
   ```bash
   # 安装后端依赖
   cd backend
   npm install

   # 安装前端依赖
   cd ../frontend
   npm install
   ```

3. **配置环境变量**
   ```bash
   # 复制环境变量模板
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env

   # 编辑配置文件
   vim backend/.env
   vim frontend/.env
   ```

4. **初始化数据库**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **启动开发服务器**
   ```bash
   # 终端1：启动后端
   cd backend
   npm run dev

   # 终端2：启动前端
   cd frontend
   npm run dev
   ```

6. **访问应用**
   - 前端: http://localhost:5173
   - 后端: http://localhost:3000

### 代码规范

#### TypeScript 规范

```typescript
// ✅ 好的实践
interface User {
  id: string
  name: string
  email: string
}

const getUser = async (id: string): Promise<User> => {
  return await prisma.user.findUnique({ where: { id } })
}

// ❌ 避免
const getUser = async (id) => {
  return await prisma.user.findUnique({ where: { id } })
}
```

#### React 组件规范

```typescript
// ✅ 函数组件 + TypeScript
interface UserCardProps {
  user: User
  onEdit: (id: string) => void
}

export default function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <div>
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user.id)}>编辑</button>
    </div>
  )
}
```

#### API 路由规范

```typescript
// ✅ RESTful 风格
router.get('/api/workflows', authenticateToken, async (req, res) => {
  try {
    const workflows = await prisma.workflow.findMany()
    res.json({ workflows })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})
```

### Git 提交规范

```bash
# 格式
<type>(<scope>): <subject>

# 类型
feat:     新功能
fix:      修复 bug
docs:     文档更新
style:    代码格式调整
refactor: 重构
test:     测试相关
chore:    构建/工具相关

# 示例
feat(workflow): 添加工作流收藏功能
fix(auth): 修复登录token过期问题
docs: 更新 API 文档
```

### 测试

#### 运行测试

```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test
```

#### 测试覆盖率

```bash
npm test -- --coverage
```

---

## 📚 相关文档

- [快速开始](./docs/QUICK_START.md)
- [API 实战教程](./docs/API实战教程.md)
- [AI 集成指南](./docs/AI集成指南.md)
- [部署指南](./部署指南.md)
- [数据库迁移](./backend/database-decision.md)

---

## 🔗 相关链接

- **GitHub**: https://github.com/bibidawang147/-
- **官方网站**: (待部署)
- **API 文档**: (待完善)

---

## 📝 更新日志

### v1.0.0 (2025-01-07)

**新功能**
- ✨ 完整的用户系统（注册、登录、认证）
- ✨ 工作流创建、编辑、执行
- ✨ AI 对话创建工作流
- ✨ 文章导入创建工作流
- ✨ 工作台拖拽布局
- ✨ 存储库管理
- ✨ 探索页（主题、工作包）
- ✨ 积分系统
- ✨ 收藏和评分功能

**技术实现**
- 🔧 前端：React + TypeScript + Vite
- 🔧 后端：Node.js + Express + Prisma
- 🔧 数据库：PostgreSQL
- 🔧 AI：集成 5+ 大模型服务商

---

## 👥 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 License

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

## 📧 联系方式

- **Email**: bibidawang147@gmail.com
- **GitHub**: [@bibidawang147](https://github.com/bibidawang147)

---

**最后更新**: 2025-01-07
**文档版本**: v1.0.0
