# 工作流平台 - 快速索引指南

## 新增文档导航

本项目现已生成 3 份详细的项目分析文档:

### 1. **PROJECT_STRUCTURE_ANALYSIS.md** - 总体项目结构分析
   - 项目概览和技术栈
   - 完整的目录树结构
   - 各模块功能说明
   - 关键文件速查表
   - **适合**: 快速了解项目整体架构

### 2. **WORKFLOW_AND_CONTENT_GUIDE.md** - 工作流和内容创作功能详解
   - 工作流生命周期详解
   - 5 种节点类型详细配置
   - 工作流 API 完整参考
   - 工作流执行引擎流程
   - 内容创作相关功能
   - 工作包和工作项系统
   - **适合**: 深入理解工作流和内容创作实现

### 3. **README.md** - 原始项目说明 (已有)
   - 快速开始指南
   - 已实现功能列表
   - 开发指南
   - **适合**: 入门和快速参考

---

## 快速查找指南

### 按功能查找

#### 认证和用户管理
- **文件**: `/backend/src/controllers/authController.ts`, `/backend/src/routes/auth.ts`
- **功能**: 注册、登录、用户信息获取
- **API**: POST /api/auth/register, POST /api/auth/login

#### 工作流管理
- **编辑器**: `/frontend/src/components/WorkflowEditor/`
- **API**: `/backend/src/routes/workflows.ts`
- **数据模型**: `Workflow`, `WorkflowNode`, `WorkflowExecution`
- **文档**: `WORKFLOW_AND_CONTENT_GUIDE.md` - 第 1-3 章

#### AI 和积分系统
- **AI 代理**: `/backend/src/services/ai-proxy.service.ts`
- **积分管理**: `/backend/src/services/credit.service.ts`
- **模型定价**: `/backend/src/config/model-pricing.ts`
- **支持模型**: 14 个 (OpenAI 4 个, Anthropic 3 个, 国产模型 7 个)

#### 工作项和工作包
- **工作项数据**: `/frontend/src/data/workspaceContainers.ts`
- **工作包数据**: `/frontend/src/data/popularWorkPackages.ts`
- **工作台**: `/frontend/src/pages/StoragePage.tsx`
- **功能**: 预制工作流、工作角色、智能推荐

#### 拖拽系统
- **核心代码**: `/frontend/src/components/GridDragSystem/`
- **算法**: `/frontend/src/utils/dragAvoidanceUtils.ts`
- **特性**: 智能避让、丝滑动画、状态保存

#### 内容管理
- **评论**: `/backend/prisma/schema.prisma` - Comment 模型
- **评分**: Rating 模型
- **收藏**: Favorite 模型
- **API**: 分别对应 `/api/workflows/:id/comments`, `/ratings`, `/favorite`

---

### 按技术栈查找

#### React 组件
```
/frontend/src/
├── pages/               # 25+ 页面
├── components/          # UI 组件库
└── hooks/              # 自定义 Hooks (待完善)
```

#### TypeScript 类型
```
/frontend/src/types/
├── workflow.ts         # 工作流类型
├── ai.ts              # AI 相关
├── credit.ts          # 积分相关
└── workPackage.ts     # 工作包类型
```

#### 后端路由
```
/backend/src/routes/
├── auth.ts            # 用户认证
├── workflows.ts       # 工作流 CRUD
├── users.ts           # 用户相关
├── ai.ts              # AI 服务
├── credit.ts          # 积分管理
├── workItems.ts       # 工作项
└── workspace.ts       # 工作空间
```

#### 数据库模型
```
/backend/prisma/schema.prisma
- 核心: User, Workflow, WorkflowNode, WorkflowExecution
- AI: ModelPricing, UsageLog, UserBalance
- 社区: Comment, Rating, Favorite
- 工作: WorkItem, WorkItemUsage
- 布局: WorkspaceLayout
```

---

### 按页面查找

| 页面路径 | 文件 | 功能 |
|---------|------|------|
| `/` | AIChatPage.tsx | AI 对话 (默认首页) |
| `/storage` | StoragePage.tsx | 工作台拖拽系统 |
| `/explore` | ExplorePage.tsx | 工作流市场探索 |
| `/workflow/:id` | WorkflowDetailPage.tsx | 工作流详情 |
| `/ai-chat` | AIChatPage.tsx | AI 对话页面 |
| `/recharge` | RechargePage.tsx | 充值页面 |
| `/usage-stats` | UsageStatsPage.tsx | 使用统计 |
| `/membership` | MembershipPage.tsx | 会员等级 |
| `/login` | LoginPage.tsx | 登录页 |
| `/register` | RegisterPage.tsx | 注册页 |

---

### 按数据库关系查找

```
用户体系:
  User ──1:N──> Workflow (创建)
  User ──1:N──> WorkflowExecution (执行)
  User ──1:1──> UserBalance (积分)
  User ──1:1──> WorkspaceLayout (布局)

工作流体系:
  Workflow ──1:N──> WorkflowNode (节点)
  Workflow ──1:N──> WorkflowExecution (执行记录)
  Workflow ──1:N──> Comment (评论)
  Workflow ──1:N──> Rating (评分)
  Workflow ──1:N──> Favorite (收藏)

执行体系:
  WorkflowExecution ──1:N──> ExecutionStep (步骤)

AI 体系:
  User ──1:N──> UsageLog (使用记录)
  User ──1:N──> RechargeOrder (充值订单)
  ModelPricing (配置 14 个模型)

工作体系:
  User ──1:N──> WorkItemUsage (使用记录)
  WorkItem ──1:N──> WorkItemUsage (统计)
```

---

## API 端点速查

### 认证 API
```
POST   /api/auth/register          # 用户注册
POST   /api/auth/login             # 用户登录
GET    /api/auth/profile           # 获取用户信息
```

### 工作流 API
```
GET    /api/workflows              # 获取列表 (带分页、搜索、筛选)
GET    /api/workflows/:id          # 获取详情
POST   /api/workflows              # 创建工作流
PUT    /api/workflows/:id          # 更新工作流
DELETE /api/workflows/:id          # 删除工作流
POST   /api/workflows/:id/favorite # 收藏
DELETE /api/workflows/:id/favorite # 取消收藏
```

### 用户 API
```
GET    /api/users/workflows        # 获取用户的工作流
GET    /api/users/executions       # 获取执行历史
GET    /api/users/favorites        # 获取收藏列表
```

### AI API
```
GET    /api/ai/models              # 获取可用模型列表
POST   /api/ai/chat                # AI 对话 (自动计算成本和扣费)
POST   /api/ai/test-connection     # 测试 API 连接
```

### 积分 API
```
GET    /api/credit/balance         # 获取余额
GET    /api/credit/usage-stats     # 使用统计
GET    /api/credit/plans           # 充值套餐
POST   /api/credit/recharge        # 创建充值订单
POST   /api/credit/upgrade-tier    # 升级会员
```

### 工作项 API
```
GET    /api/work-items             # 获取工作项列表
POST   /api/work-items/:id/use     # 记录使用
GET    /api/work-items/stats       # 使用统计
```

### 工作空间 API
```
GET    /api/workspace/layout       # 获取布局
POST   /api/workspace/layout       # 保存布局
POST   /api/workspace/import-package # 导入工作包
```

---

## 核心业务流程

### 1. 用户注册流程
```
用户输入 → 注册页面 → authService.register() 
→ POST /api/auth/register 
→ 检查邮箱/密码 
→ 创建 User 
→ 初始化 UserBalance (50000 coins) 
→ 生成 JWT token 
→ 返回用户信息
```

### 2. AI 对话流程
```
用户输入 + 选择模型 
→ AIChatPage → ai.ts (post /api/ai/chat) 
→ ai.controller.ts 
→ ai-proxy.service.ts (统一处理) 
→ 调用 AI SDK (OpenAI/Anthropic/其他) 
→ 计算成本 (credit.service.ts) 
→ 检查余额 
→ 扣费 
→ 记录 UsageLog 
→ 返回结果 + 成本信息
```

### 3. 工作流执行流程
```
前端 WorkflowEditor 
→ 点击运行 
→ POST /api/workflows/:id/execute 
→ 后端解析节点和边 
→ 按拓扑序执行各节点 
→ Input: 获取用户输入 
→ LLM: 调用 AI (扣费) 
→ Tool: 调用工具 
→ Condition: 分支判断 
→ Output: 收集结果 
→ 计算总成本 
→ 返回 WorkflowExecution
```

### 4. 工作包导入流程
```
用户发现工作包 
→ WorkPackageImportModal 
→ POST /api/workspace/import-package 
→ 创建 WorkItem 关联 
→ 更新 WorkspaceLayout 
→ 初始化工作流模板 
→ 返回更新的布局 
→ 前端刷新显示
```

---

## 数据库初始化

### 创建测试账户
```bash
cd backend
npm run build
node dist/scripts/seed-test-user.js
# 或
ts-node src/scripts/seed-test-user.ts
```

### 初始化模型定价
```bash
ts-node src/scripts/seed-model-pricing.ts
```

### 数据库迁移
```bash
npx prisma migrate dev
npx prisma generate
npx prisma studio  # 打开 UI 管理界面
```

---

## 环境变量配置

### 后端 (.env)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
DOUBAO_API_KEY=xxx
QWEN_API_KEY=xxx
ZHIPU_API_KEY=xxx
```

### 前端 (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 常见任务指南

### 添加新的 AI 模型
1. 更新 `/backend/src/config/model-pricing.ts`
2. 在 `ModelPricing` 表中插入记录
3. 在 `/backend/src/services/ai-proxy.service.ts` 添加处理逻辑
4. 前端自动从 API 获取

### 创建新的工作流节点类型
1. 定义类型: `/frontend/src/types/workflow.ts`
2. 创建组件: `/frontend/src/components/WorkflowEditor/nodes/`
3. 注册到编辑器: `WorkflowEditor.tsx` 中的 `nodeTypes`
4. 后端处理: `/backend/src/routes/workflows.ts` 执行逻辑

### 添加工作项
1. 更新数据: `/frontend/src/data/workspaceContainers.ts`
2. 创建 WorkItem: `POST /api/work-items`
3. 关联到工作角色

### 新增工作包
1. 定义数据: `/frontend/src/data/popularWorkPackages.ts`
2. 关联工作项和工作流
3. 创建导入模板

---

## 调试技巧

### 后端调试
```bash
# 启用详细日志
NODE_ENV=development npm run dev

# 打开 Prisma Studio
npx prisma studio

# 检查数据库
sqlite3 prisma/dev.db
```

### 前端调试
```bash
# 开启 React DevTools
npm run dev

# 检查 API 请求
浏览器 DevTools > Network 标签

# 查看应用状态
React DevTools 浏览器扩展
```

### 常见问题

**数据库连接失败**
- 检查 DATABASE_URL 配置
- 确保 SQLite 或 PostgreSQL 服务运行

**API 请求 401**
- 检查 JWT token 是否有效
- 验证 VITE_API_URL 配置

**模型 API 失败**
- 检查 API 密钥是否正确
- 验证 API 余额和限额

---

## 贡献指南

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 在 `/services` 中编写 API 调用代码
- 在 `/types` 中定义类型

### 提交 PR
1. 创建 feature 分支
2. 编写清晰的提交信息
3. 更新相关文档
4. 提交 Pull Request

---

## 文件大小和项目统计

- **前端页面**: 25+ 页面
- **后端路由**: 7 个路由组
- **数据库模型**: 15+ 个表
- **支持 AI 模型**: 14 个
- **工作角色**: 6 个
- **工作类型**: 30+ 个

---

## 下一步计划

- [ ] 完善工作流执行引擎
- [ ] 添加更多工具集成
- [ ] 文件上传和处理
- [ ] 实时协作功能
- [ ] 移动端优化
- [ ] 更多内容创作模板
- [ ] 自定义工具开发平台

---

## 获取更多帮助

- 查看完整项目文档: `/docs/` 目录
- 快速开始: `/docs/QUICK_START.md`
- 后端指南: `/docs/BACKEND_GUIDE.md`
- 前端指南: `/docs/FRONTEND_GUIDE.md`
- AI 集成: `/docs/AI_CREDIT_SYSTEM.md`

---

## 文档版本

- **更新时间**: 2024-10-31
- **项目版本**: 1.0.0
- **文档覆盖范围**: 核心功能已覆盖
- **示例代码**: 均可运行

---

**快速链接**: 
- [主项目分析](PROJECT_STRUCTURE_ANALYSIS.md)
- [工作流详解](WORKFLOW_AND_CONTENT_GUIDE.md)
- [原始说明](README.md)
- [项目文档](docs/)

