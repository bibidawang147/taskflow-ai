# 工作流平台 - 完整项目结构分析

## 项目概述

**项目名称**: Workflow Platform (工作流平台)

**项目类型**: 类似 Coze/Dify 的 AI 工作流可视化编辑平台

**技术栈**: 
- 前端：React 19 + TypeScript + Vite + Tailwind CSS
- 后端：Node.js + Express + TypeScript + Prisma ORM
- 数据库：SQLite (开发环境) / PostgreSQL (生产环境)

---

## 目录结构

```
workflow-platform/
├── backend/                      # 后端 API 服务
│   ├── src/
│   │   ├── controllers/          # 控制器层
│   │   │   ├── authController.ts        # 用户认证（注册/登录）
│   │   │   ├── credit.controller.ts     # 积分/余额管理
│   │   │   ├── workItemController.ts    # 工作项管理
│   │   │   ├── aiController.ts          # AI 调用相关
│   │   │   └── ai.controller.ts         # AI 对话控制器
│   │   │
│   │   ├── routes/               # 路由层
│   │   │   ├── auth.ts                  # 认证路由
│   │   │   ├── workflows.ts             # 工作流路由（CRUD）
│   │   │   ├── users.ts                 # 用户相关路由
│   │   │   ├── workItems.ts             # 工作项路由
│   │   │   ├── workspace.ts             # 工作空间路由
│   │   │   ├── ai.ts                    # AI 服务路由
│   │   │   └── credit.ts                # 积分系统路由
│   │   │
│   │   ├── middleware/           # 中间件
│   │   │   ├── auth.ts                  # JWT 认证中间件
│   │   │   └── errorHandler.ts          # 错误处理中间件
│   │   │
│   │   ├── services/             # 业务逻辑服务
│   │   │   ├── credit.service.ts        # 积分系统服务
│   │   │   ├── aiService.ts             # AI 服务
│   │   │   └── ai-proxy.service.ts      # AI 代理服务（多厂商统一接口）
│   │   │
│   │   ├── config/               # 配置文件
│   │   │   └── model-pricing.ts         # 模型定价配置
│   │   │
│   │   ├── utils/                # 工具函数
│   │   │   ├── jwt.ts                   # JWT 生成/验证
│   │   │   ├── password.ts              # 密码加密/验证
│   │   │   └── database.ts              # Prisma 实例
│   │   │
│   │   ├── scripts/              # 脚本
│   │   │   ├── seed-test-user.ts        # 测试用户种子
│   │   │   └── seed-model-pricing.ts    # 模型定价初始化
│   │   │
│   │   └── server.ts             # 服务器入口
│   │
│   ├── prisma/                   # 数据库相关
│   │   ├── schema.prisma         # 数据库模型定义
│   │   └── migrations/           # 数据库迁移历史
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # 前端 React 应用
│   ├── src/
│   │   ├── pages/                # 页面组件
│   │   │   ├── HomePage.tsx              # 首页
│   │   │   ├── DashboardPage.tsx         # 仪表板
│   │   │   ├── ExplorePage.tsx           # 探索页面
│   │   │   ├── StoragePage.tsx           # 存储/工作台页面
│   │   │   ├── WorkspacePage.tsx         # 工作空间
│   │   │   ├── WorkflowEditorPage.tsx    # 工作流编辑器页面
│   │   │   ├── WorkflowDetailPage.tsx    # 工作流详情页
│   │   │   ├── AIChatPage.tsx            # AI 对话页面
│   │   │   ├── RechargePage.tsx          # 充值页面
│   │   │   ├── UsageStatsPage.tsx        # 使用统计页面
│   │   │   ├── MembershipPage.tsx        # 会员等级页面
│   │   │   ├── LoginPage.tsx             # 登录页面
│   │   │   ├── RegisterPage.tsx          # 注册页面
│   │   │   ├── SearchResultPage.tsx      # 搜索结果页面
│   │   │   ├── CategoryPage.tsx          # 分类页面
│   │   │   ├── WorkflowTypePage.tsx      # 工作流类型页面
│   │   │   └── GridDragDemoPage.tsx      # 拖拽系统演示
│   │   │
│   │   ├── components/           # 可复用组件
│   │   │   ├── WorkflowEditor/           # 工作流编辑器组件
│   │   │   │   ├── WorkflowEditor.tsx    # 主编辑器
│   │   │   │   ├── NodeToolbar.tsx       # 节点工具栏
│   │   │   │   └── nodes/
│   │   │   │       └── CustomNode.tsx    # 自定义节点组件
│   │   │   │
│   │   │   ├── GridDragSystem/          # 网格拖拽系统
│   │   │   │   ├── GridDragSystem.tsx   # 核心组件
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── Layout.tsx                # 页面布局容器
│   │   │   ├── ProtectedRoute.tsx        # 受保护的路由
│   │   │   ├── ModelSelector.tsx         # AI 模型选择器
│   │   │   ├── CreditBalance.tsx         # 积分余额显示
│   │   │   ├── WorkflowFlowChart.tsx     # 工作流流程图
│   │   │   ├── WorkflowExecutionModal.tsx # 执行结果模态框
│   │   │   ├── PopularWorkPackageCard.tsx # 热门工作包卡片
│   │   │   ├── WorkPackageDetailModal.tsx # 工作包详情
│   │   │   └── WorkPackageImportModal.tsx # 工作包导入
│   │   │
│   │   ├── services/             # API 服务层
│   │   │   ├── api.ts                   # 基础 API 实例
│   │   │   ├── auth.ts                  # 认证服务
│   │   │   ├── workflowApi.ts           # 工作流 API
│   │   │   ├── workspaceApi.ts          # 工作空间 API
│   │   │   ├── ai.ts                    # AI 服务
│   │   │   ├── chatApi.ts               # 对话 API
│   │   │   └── credit.ts                # 积分服务
│   │   │
│   │   ├── contexts/             # React 上下文
│   │   │   └── AuthContext.tsx          # 身份认证上下文
│   │   │
│   │   ├── hooks/                # 自定义 Hooks
│   │   │   └── （待扩展）
│   │   │
│   │   ├── store/                # 状态管理
│   │   │   └── （待扩展）
│   │   │
│   │   ├── types/                # TypeScript 类型定义
│   │   │   ├── workflow.ts              # 工作流类型
│   │   │   ├── ai.ts                    # AI 相关类型
│   │   │   ├── credit.ts                # 积分类型
│   │   │   └── workPackage.ts           # 工作包类型
│   │   │
│   │   ├── data/                 # 数据和常量
│   │   │   ├── workspaceContainers.ts   # 工作角色和工作类型
│   │   │   ├── exploreThemes.ts         # 探索主题
│   │   │   ├── popularWorkPackages.ts   # 热门工作包数据
│   │   │   └── （其他数据文件）
│   │   │
│   │   ├── utils/                # 工具函数
│   │   │   ├── dragAvoidanceUtils.ts    # 拖拽避让算法
│   │   │   └── storageAvoidanceUtils.ts # 存储避免算法
│   │   │
│   │   ├── styles/               # 全局样式
│   │   │   └── （Tailwind 配置）
│   │   │
│   │   ├── assets/               # 静态资源
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── （其他资源）
│   │   │
│   │   ├── App.tsx               # 主应用组件
│   │   └── main.tsx              # 入口文件
│   │
│   ├── public/                   # 公开资源目录
│   ├── package.json
│   └── vite.config.ts
│
├── shared/                       # 前后端共享代码
│   ├── types/                    # 共享类型定义
│   ├── constants/                # 共享常量
│   └── utils/                    # 共享工具函数
│
├── docs/                         # 项目文档
│   ├── QUICK_START.md           # 快速开始指南
│   ├── BACKEND_GUIDE.md         # 后端开发指南
│   ├── FRONTEND_GUIDE.md        # 前端开发指南
│   ├── AI_CREDIT_SYSTEM.md      # AI 和积分系统文档
│   ├── LOGIN_TEST_GUIDE.md      # 登录测试指南
│   ├── AI集成指南.md             # AI 集成指南
│   └── API实战教程.md            # API 实战教程
│
├── creator-profile/             # 创作者资料相关
│   ├── assets/
│   ├── data/
│   ├── scripts/
│   └── styles/
│
├── README.md                     # 项目主说明文档
├── IMPLEMENTATION_SUMMARY.md     # 实现总结
├── REPO_MAP.md                   # 仓库地图
├── ARCH_NOTES.md                # 架构笔记
└── package.json                  # 根项目文件

```

---

## 核心功能模块详解

### 1. 用户认证系统

**位置**: `/backend/src/controllers/authController.ts`, `/backend/src/routes/auth.ts`

**主要功能**:
- 用户注册 (POST `/api/auth/register`)
- 用户登录 (POST `/api/auth/login`)
- 获取用户信息 (GET `/api/auth/profile`)

**流程**:
1. 用户提交邮箱和密码
2. 后端使用 bcryptjs 加密密码
3. 创建 JWT 令牌
4. 初始化用户余额（新用户赠送 50,000 积分）

**相关数据库模型**: `User`, `UserBalance`

---

### 2. 工作流管理系统

**数据模型**:

```
User (用户)
├── workflows[] - 创建的工作流
├── executions[] - 执行历史
├── comments[] - 评论
├── ratings[] - 评分
└── favorites[] - 收藏

Workflow (工作流)
├── id - 工作流 ID
├── title - 标题
├── description - 描述
├── config - JSON 配置（包含节点和连接）
├── isPublic - 是否公开
├── isTemplate - 是否为模板
├── category - 分类
├── tags - 标签（逗号分隔）
├── nodes[] - 工作流节点
├── executions[] - 执行记录
├── comments[] - 评论
├── ratings[] - 评分
└── favorites[] - 收藏

WorkflowNode (工作流节点)
├── id
├── type - 节点类型 (input/llm/tool/condition/output)
├── label - 节点标签
├── position - 位置坐标 {x, y}
└── config - 节点配置 JSON

WorkflowExecution (工作流执行)
├── id
├── status - 状态 (pending/running/completed/failed)
├── input - 输入数据
├── output - 输出数据
├── error - 错误信息
├── duration - 执行耗时
├── steps[] - 执行步骤详情
└── (关联用户和工作流)

ExecutionStep (执行步骤)
├── stepIndex
├── nodeId/nodeType
├── status
├── input/output
└── duration
```

**工作流编辑器**:

**位置**: `/frontend/src/components/WorkflowEditor/`

**核心文件**:
- `WorkflowEditor.tsx` - 主编辑器组件
- `nodes/CustomNode.tsx` - 自定义节点组件
- `NodeToolbar.tsx` - 节点工具栏

**支持的节点类型**:
1. **Input (输入节点)** - 接收用户输入
2. **LLM (AI 处理)** - 调用 AI 模型处理
3. **Tool (工具)** - 调用外部工具
4. **Condition (条件分支)** - 条件判断
5. **Output (输出)** - 返回结果

**节点配置**:
```typescript
interface CustomNodeConfig {
  placeholder?: string        // 输入占位符
  model?: string             // AI 模型选择
  prompt?: string            // AI 提示词
  toolName?: string          // 工具名称
  parameters?: Record<string, unknown> // 工具参数
  condition?: string         // 条件表达式
  trueOutput?: string        // 真值输出
  falseOutput?: string       // 假值输出
  format?: string            // 输出格式
}
```

**主要 API 端点**:
- `GET /api/workflows` - 获取公开工作流列表
- `GET /api/workflows/:id` - 获取工作流详情
- `POST /api/workflows` - 创建工作流
- `POST /api/workflows/:id/favorite` - 收藏工作流
- `DELETE /api/workflows/:id/favorite` - 取消收藏
- `GET /api/users/workflows` - 获取用户的工作流

---

### 3. AI 积分系统

**位置**: `/backend/src/services/credit.service.ts`, `/backend/src/services/ai-proxy.service.ts`

**核心数据模型**:

```
UserBalance (用户余额)
├── coins - 付费积分 (1000 coins = 1 元)
├── freeQuota - 每日免费额度 (默认 10000)
├── usedToday - 今日已使用
├── quotaResetAt - 额度重置时间
├── totalRecharged - 累计充值
└── totalConsumed - 累计消耗

UsageLog (AI 使用日志)
├── userId
├── provider - 模型提供商 (openai/anthropic/doubao/qwen/zhipu)
├── model - 模型名称
├── inputTokens - 输入 Token 数
├── outputTokens - 输出 Token 数
├── cost - 花费积分
├── status - 执行状态
└── createdAt

RechargeOrder (充值订单)
├── userId
├── orderNo - 订单号
├── amount - 充值金额
├── coins - 获得积分
├── bonusCoins - 赠送积分
├── status - 订单状态
├── paymentMethod - 支付方式
└── paidAt

ModelPricing (模型定价)
├── provider - 提供商
├── modelId - 模型 ID
├── modelName - 显示名称
├── inputPrice - 输入价格 (per 1K tokens)
├── outputPrice - 输出价格 (per 1K tokens)
├── features - 特性配置
├── allowedTiers - 允许的用户等级
└── sortOrder - 排序
```

**支持的 AI 模型** (14 个):

**OpenAI**:
- GPT-4o
- GPT-4o Mini
- GPT-3.5 Turbo
- GPT-4 Turbo

**Anthropic**:
- Claude 3.5 Sonnet
- Claude 3.5 Haiku
- Claude 3 Opus

**国产模型**:
- 豆包 Pro 32K
- 豆包 Lite 4K
- 通义千问 Max
- 通义千问 Plus
- 通义千问 Turbo
- 智谱 GLM-4
- 智谱 GLM-3 Turbo

**主要 API 端点**:
- `GET /api/credit/balance` - 获取余额
- `GET /api/credit/usage-stats` - 使用统计
- `GET /api/credit/plans` - 充值套餐
- `POST /api/credit/recharge` - 创建充值订单
- `POST /api/credit/upgrade-tier` - 升级会员
- `GET /api/ai/models` - 获取可用模型
- `POST /api/ai/chat` - AI 对话
- `POST /api/ai/test-connection` - 测试连接

**积分扣费逻辑**:
1. 优先使用每日免费额度
2. 免费额度不足时使用付费积分
3. 记录详细的使用日志
4. 不同用户等级享受不同折扣

---

### 4. 工作项和工作包系统

**位置**: `/frontend/src/data/workspaceContainers.ts`, `/backend/src/controllers/workItemController.ts`

**数据模型**:

```
WorkItem (工作项)
├── id
├── name - 工作项名称 (如："文章撰写")
├── icon - 图标 (如："📝")
├── category - 分类 (如："text")
└── usageStats[] - 使用统计

WorkItemUsage (使用记录)
├── userId
├── workItemId
└── usedAt

WorkPackage (工作包)
├── id
├── name - 名称
├── category - 分类
├── description - 描述
├── items[] - 包含的工作项
├── stats - 统计信息
└── author - 创建者
```

**工作角色体系** (6 类):

1. **内容创作者** ✍️
   - 小红书运营
   - 抖音脚本策划
   - 公众号写作
   - 知乎创作
   - 快手运营
   - B站UP主

2. **营销专员** 📊
   - 邮件营销
   - 社交媒体推广
   - 广告文案
   - SEO优化
   - 活动策划
   - 品牌运营

3. **数据分析师** 📈
   - 销售数据分析
   - 用户行为分析
   - 财务数据分析
   - 市场调研
   - 竞品分析
   - 报表制作

4. **开发工程师** 💻
   - 代码审查
   - 技术文档
   - 单元测试
   - API 设计
   - 性能优化
   - 架构设计

5. **客服专员** 🎧
   - 售前咨询
   - 售后支持
   - 投诉处理
   - 客户回访
   - 满意度调查
   - 问题解答

6. **商务人员** 💼
   - 商业计划书
   - 项目提案
   - 会议纪要
   - 演讲PPT
   - 合同起草
   - 项目管理

---

### 5. 工作台拖拽系统

**位置**: `/frontend/src/components/GridDragSystem/`, `/frontend/src/utils/dragAvoidanceUtils.ts`

**主要功能**:
- 网格卡片自由拖拽
- 智能避让算法（拖拽时自动让开其他卡片）
- 丝滑的动画过渡
- 拖拽状态实时保存

**核心算法**:
- 拖拽避让：当拖拽元素与其他元素重叠时，自动将其他元素推开
- 存储避免：计算最佳放置位置，避免卡片堆叠

**WorkspaceLayout 数据模型**:
```
WorkspaceLayout
├── userId
├── layout - 卡片布局配置 (JSON)
├── zoom - 缩放比例
└── snapshot - 完整的工作台状态快照
```

---

### 6. 前端页面与路由

**主要页面**:

| 路径 | 页面 | 用途 |
|------|------|------|
| `/` | AIChatPage | AI 对话页面（默认首页） |
| `/dashboard` | DashboardPage | 仪表板 |
| `/home` | HomePage | 首页 |
| `/storage` | StoragePage | 工作台（拖拽系统） |
| `/explore` | ExplorePage | 探索页面 |
| `/explore/theme/:themeId` | ExploreThemeDetailPage | 主题详情 |
| `/workflow/:id` | WorkflowDetailPage | 工作流详情 |
| `/workflow-intro/:id` | WorkflowIntroPage | 工作流介绍 |
| `/tool/:id` | AIToolIntroPage | AI工具介绍 |
| `/category/:category` | CategoryPage | 分类页面 |
| `/workflow-type/:type` | WorkflowTypePage | 工作流类型 |
| `/recharge` | RechargePage | 充值页面 |
| `/usage-stats` | UsageStatsPage | 使用统计 |
| `/membership` | MembershipPage | 会员等级 |
| `/ai-chat` | AIChatPage | AI 对话 |
| `/search` | SearchResultPage | 搜索结果 |
| `/login` | LoginPage | 登录 |
| `/register` | RegisterPage | 注册 |

---

## 关键技术实现

### 1. React Flow 工作流编辑器

**库**: `@xyflow/react` v12.8.6

**实现细节**:
- 自定义节点类型 (CustomNode)
- 节点拖拽和连接
- 节点配置面板
- 实时流程图预览

### 2. JWT 认证

**位置**: `/backend/src/utils/jwt.ts`

**流程**:
1. 生成 JWT token (使用 secret key)
2. 在每个请求中验证 token
3. 中间件提取 user 信息并注入到 request

### 3. Prisma ORM

**特点**:
- 类型安全的数据库操作
- 自动迁移管理
- 关系处理便利

**常用命令**:
```bash
npx prisma migrate dev    # 创建迁移
npx prisma generate      # 生成 Prisma Client
npx prisma studio       # 数据库 UI 管理
```

### 4. 积分计算逻辑

**流程**:
```
用户发起 AI 请求
  ↓
检查免费额度
  ↓
如果足够: 扣除免费额度
如果不足: 扣除付费积分
  ↓
调用 AI 模型 API
  ↓
根据 Token 消耗计算费用
  ↓
记录到 UsageLog
  ↓
返回结果
```

---

## 文件和功能对应关系

### 工作流创建流程

```
前端: WorkflowEditorPage
  ↓ 使用组件
前端: WorkflowEditor (编辑器)
  ↓ 点击保存
前端: workflowApi.ts (调用 API)
  ↓ POST /api/workflows
后端: workflows.ts 路由
  ↓ 调用
后端: WorkflowController (未直接创建，逻辑在路由)
  ↓ 保存到数据库
后端: Prisma ORM
  ↓ 
数据库: workflow 表
```

### AI 对话流程

```
前端: AIChatPage
  ↓ 用户输入 + 选择模型
前端: ai.ts 或 chatApi.ts
  ↓ POST /api/ai/chat
后端: ai.ts 路由
  ↓ 调用
后端: ai.controller.ts
  ↓ 调用
后端: ai-proxy.service.ts (统一的 AI 代理)
  ↓ 根据 provider 选择
OpenAI SDK / Anthropic SDK / 其他
  ↓
获得响应
  ↓ 计算费用
后端: credit.service.ts
  ↓ 扣除积分
后端: Prisma 更新 UserBalance 和 UsageLog
  ↓ 返回结果
前端: 显示结果
```

### 工作包导入流程

```
前端: StoragePage 或其他
  ↓ 点击导入工作包
前端: WorkPackageImportModal
  ↓ 选择工作包
前端: workspaceApi.ts
  ↓ POST /api/workspace/import-package
后端: workspace.ts 路由
  ↓ 
后端: 创建工作项或工作流
  ↓
数据库: 保存关联数据
  ↓ 返回成功
前端: 更新布局状态
  ↓ 显示导入的工作包
```

---

## 项目特色功能

### 1. 智能拖拽避让

- **位置**: `/frontend/src/utils/dragAvoidanceUtils.ts`
- **功能**: 拖拽元素时自动推开其他卡片，实现丝滑的用户体验
- **算法**: 计算重叠区域，根据方向智能调整位置

### 2. 多厂商 AI 支持

- **位置**: `/backend/src/services/ai-proxy.service.ts`
- **功能**: 统一接口支持 OpenAI、Claude、豆包、千问、智谱
- **特点**: 自动计算成本、记录日志、支持提供商切换

### 3. 工作角色和工作类型系统

- **位置**: `/frontend/src/data/workspaceContainers.ts`
- **功能**: 将用户按角色分类，为每个角色预设常用工作
- **用途**: 提高新用户的快速上手能力

### 4. 完整的积分生态

- 新用户注册赠送 50000 积分
- 每日免费额度 10000
- 支持充值和会员等级
- 详细的使用统计和成本分析

---

## 数据库关键关系

```
User (用户中心)
  ├─ 1:N → Workflow (创建的工作流)
  ├─ 1:N → WorkflowExecution (执行历史)
  ├─ 1:N → Comment (评论)
  ├─ 1:N → Rating (评分)
  ├─ 1:N → Favorite (收藏)
  ├─ 1:N → WorkItemUsage (工作项使用)
  ├─ 1:1 → UserBalance (积分余额)
  ├─ 1:N → UsageLog (AI 使用日志)
  ├─ 1:N → RechargeOrder (充值订单)
  └─ 1:1 → WorkspaceLayout (工作台布局)

Workflow (工作流)
  ├─ 1:N → WorkflowNode (节点)
  ├─ 1:N → WorkflowExecution (执行记录)
  ├─ 1:N → Comment (评论)
  ├─ 1:N → Rating (评分)
  └─ 1:N → Favorite (收藏)

WorkflowExecution (执行)
  └─ 1:N → ExecutionStep (执行步骤)
```

---

## 环境配置

### 后端 .env

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
DATABASE_URL="file:./dev.db"  # 开发环境

# AI 模型 API 密钥
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
DOUBAO_API_KEY=xxx
QWEN_API_KEY=xxx
ZHIPU_API_KEY=xxx
```

### 前端 .env

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 开发命令

### 后端

```bash
cd backend
npm install
npx prisma migrate dev      # 数据库迁移
npm run dev                 # 启动开发服务器 (端口 5000)
npx prisma studio         # 打开数据库管理界面
```

### 前端

```bash
cd frontend
npm install
npm run dev                 # 启动开发服务器 (端口 5173)
npm run build              # 构建生产版本
```

---

## 代码规范和最佳实践

### 1. TypeScript 类型定义

所有类型都在 `/frontend/src/types/` 或 `/backend/src/types/` 中定义

### 2. API 调用统一

- 前端使用 `/frontend/src/services/` 中的服务函数
- 不直接在组件中使用 axios

### 3. 数据库操作

- 通过 Prisma ORM 进行所有数据库操作
- 使用类型安全的查询

### 4. 错误处理

- 后端统一错误处理在 `/backend/src/middleware/errorHandler.ts`
- 前端在服务层捕获错误

---

## 项目状态和下一步

### 已完成

✅ 基础架构  
✅ 用户认证系统  
✅ 工作流编辑器 UI  
✅ AI 积分系统  
✅ 多厂商 AI 支持  
✅ 工作项/工作包系统  
✅ 拖拽避让系统  
✅ 大部分页面框架  

### 待完成

- 工作流执行引擎细节完善
- 文件上传和处理
- 实时协作功能
- 移动端适配
- 性能优化
- 更多工具集成

---

## 关键文件位置速查表

| 功能 | 文件位置 |
|------|--------|
| 用户认证 | `/backend/src/controllers/authController.ts` |
| 工作流 CRUD | `/backend/src/routes/workflows.ts` |
| 积分管理 | `/backend/src/services/credit.service.ts` |
| AI 代理 | `/backend/src/services/ai-proxy.service.ts` |
| 工作流编辑器 | `/frontend/src/components/WorkflowEditor/` |
| AI 对话页面 | `/frontend/src/pages/AIChatPage.tsx` |
| 工作台 | `/frontend/src/pages/StoragePage.tsx` |
| 数据库模型 | `/backend/prisma/schema.prisma` |
| 工作角色数据 | `/frontend/src/data/workspaceContainers.ts` |
| 模型定价 | `/backend/src/config/model-pricing.ts` |

---

## 总结

这是一个功能完整的 AI 工作流平台，具有：

1. **完善的用户系统** - 认证、积分、会员等级
2. **灵活的工作流编辑器** - 基于 React Flow 的可视化编辑
3. **多厂商 AI 支持** - 统一接口调用不同 AI 服务
4. **丰富的工作场景** - 6 类工作角色，30+ 种工作类型
5. **先进的 UI 交互** - 智能拖拽避让、丝滑动画
6. **完整的数据模型** - 15+ 个数据表，支持复杂业务

项目采用现代技术栈（React 19、TypeScript、Express、Prisma），代码结构清晰，易于扩展和维护。

