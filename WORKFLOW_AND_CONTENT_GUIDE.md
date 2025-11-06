# 工作流平台 - 工作流管理与内容创作功能详解

## 工作流创建和管理功能详解

### 1. 工作流生命周期

#### 1.1 工作流状态流转

```
创建 (Draft)
  ↓
编辑 (Editing)
  ↓
保存 (Saved)
  ↓
发布 (Published)
  ↓
执行 (Executing)
  ↓
完成 (Completed) / 失败 (Failed)
```

#### 1.2 工作流属性

```typescript
interface Workflow {
  id: string                    // 唯一标识
  title: string                 // 工作流名称
  description?: string          // 描述
  thumbnail?: string            // 缩略图
  isPublic: boolean             // 是否公开 (影响市场可见性)
  isTemplate: boolean           // 是否为模板 (可供他人复用)
  category?: string             // 分类 (如: content_creation, marketing)
  tags: string[]                // 标签 (逗号分隔或数组)
  version: string               // 版本号 (如: 1.0.0)
  
  config: {
    nodes: WorkflowNode[]       // 工作流节点数组
    edges: WorkflowEdge[]       // 节点连接数组
  }
  
  authorId: string              // 创建者 ID
  author: User                  // 创建者信息
  
  createdAt: DateTime           // 创建时间
  updatedAt: DateTime           // 最后修改时间
  
  // 关联数据
  nodes: WorkflowNode[]         // 节点详情
  executions: WorkflowExecution[]  // 执行记录
  comments: Comment[]           // 评论
  ratings: Rating[]             // 评分
  favorites: Favorite[]         // 收藏
  
  // 统计数据
  _count?: {
    executions: number          // 执行次数
    ratings: number             // 评分数
    favorites: number           // 收藏数
  }
}
```

---

### 2. 工作流节点系统详解

#### 2.1 节点类型和配置

##### Input Node (输入节点)
**用途**: 接收用户或外部输入

```typescript
{
  id: 'input_1',
  type: 'input',
  label: '用户输入',
  position: { x: 100, y: 100 },
  config: {
    placeholder: '请输入您的文章主题...',
    dataType: 'text',           // text, number, file, json
    required: true,             // 是否必须
    validation?: {              // 验证规则
      minLength: 10,
      maxLength: 500,
      pattern: '^[a-zA-Z0-9]+$'
    }
  }
}
```

##### LLM Node (AI 处理节点)
**用途**: 调用 AI 模型进行处理

```typescript
{
  id: 'llm_1',
  type: 'llm',
  label: 'AI 文章生成',
  position: { x: 300, y: 100 },
  config: {
    provider: 'openai',         // 提供商: openai, anthropic, doubao, qwen, zhipu
    model: 'gpt-4o',            // 具体模型
    prompt: `你是一个专业的内容写手...
             主题: {{input_1}}  // 使用模板变量
             要求: ...`,
    temperature: 0.7,           // 创意度 (0-1)
    maxTokens: 2000,            // 最大输出
    systemPrompt?: '...',       // 系统提示
    topP?: 0.95                 // 核取样
  }
}
```

##### Tool Node (工具节点)
**用途**: 调用第三方工具或 API

```typescript
{
  id: 'tool_1',
  type: 'tool',
  label: '文本检测',
  position: { x: 500, y: 100 },
  config: {
    toolName: 'text-checker',
    toolVersion: '1.0',
    parameters: {
      input: '{{llm_1}}',      // 引用上游节点输出
      checkType: 'grammar',
      language: 'zh-CN'
    }
  }
}
```

##### Condition Node (条件分支)
**用途**: 根据条件分支执行不同路径

```typescript
{
  id: 'condition_1',
  type: 'condition',
  label: '质量检查',
  position: { x: 700, y: 100 },
  config: {
    condition: '{{tool_1.score}} > 80',  // 条件表达式
    trueOutput: 'approval',              // 真值标签
    falseOutput: 'revision',             // 假值标签
    operator: '>'                        // >, <, ==, !=, >=, <=, contains
  }
}
```

##### Output Node (输出节点)
**用途**: 返回最终结果

```typescript
{
  id: 'output_1',
  type: 'output',
  label: '最终文章',
  position: { x: 900, y: 100 },
  config: {
    format: 'markdown',         // markdown, html, json, plain
    outputType: 'text',         // 输出类型
    displayName: '生成的文章'   // 显示名称
  }
}
```

#### 2.2 节点连接 (Edge)

```typescript
interface WorkflowEdge {
  id: string                    // 边 ID
  source: string                // 源节点 ID
  target: string                // 目标节点 ID
  sourceHandle?: string         // 源句柄 (多输出时)
  targetHandle?: string         // 目标句柄 (多输入时)
  label?: string                // 边标签 (条件分支时使用)
  animated?: boolean            // 是否动画
}

// 例如:
{
  id: 'e1-2',
  source: 'input_1',
  target: 'llm_1'
},
{
  id: 'e2-3',
  source: 'llm_1',
  target: 'tool_1'
},
{
  id: 'e3-4-true',
  source: 'condition_1',
  target: 'output_1',
  label: 'approval'             // 条件分支标签
}
```

---

### 3. 工作流 API 详解

#### 3.1 创建工作流

**端点**: `POST /api/workflows`

**请求体**:
```typescript
{
  title: "AI 文章生成工作流",
  description: "用 AI 自动生成高质量文章",
  category: "content_creation",
  tags: ["ai", "writing", "content"],
  isPublic: true,              // 是否公开到市场
  isTemplate: true,            // 是否为模板供他人使用
  
  config: {
    nodes: [
      { id: 'input_1', type: 'input', ... },
      { id: 'llm_1', type: 'llm', ... },
      { id: 'output_1', type: 'output', ... }
    ],
    edges: [
      { id: 'e1-2', source: 'input_1', target: 'llm_1' },
      { id: 'e2-3', source: 'llm_1', target: 'output_1' }
    ]
  }
}
```

**响应**:
```typescript
{
  message: "工作流创建成功",
  workflow: {
    id: "clxxxxx",
    title: "AI 文章生成工作流",
    authorId: "user_id",
    author: {
      id: "user_id",
      name: "用户名",
      avatar: "avatar_url"
    },
    // ... 其他字段
    createdAt: "2024-10-31T08:30:00Z",
    updatedAt: "2024-10-31T08:30:00Z"
  }
}
```

#### 3.2 获取工作流列表

**端点**: `GET /api/workflows`

**查询参数**:
```typescript
{
  page?: number              // 页码 (默认 1)
  limit?: number             // 每页数量 (默认 20)
  category?: string          // 按分类筛选
  search?: string            // 按关键词搜索
  sort?: 'latest' | 'popular' // 排序方式
  author?: string            // 按作者筛选
  tags?: string              // 按标签筛选 (逗号分隔)
}
```

**响应**:
```typescript
{
  workflows: [
    {
      id: "clxxxxx",
      title: "AI 文章生成工作流",
      description: "...",
      thumbnail: "url",
      category: "content_creation",
      tags: ["ai", "writing"],
      version: "1.0.0",
      createdAt: "2024-10-31T08:30:00Z",
      author: {
        id: "user_id",
        name: "用户名",
        avatar: "avatar_url"
      },
      _count: {
        executions: 150,
        ratings: 45,
        favorites: 89
      }
    }
    // ... 更多工作流
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 256,
    pages: 13
  }
}
```

#### 3.3 获取工作流详情

**端点**: `GET /api/workflows/:id`

**响应**: 返回完整的工作流信息，包括所有节点、评论、评分

#### 3.4 更新工作流

**端点**: `PUT /api/workflows/:id`

```typescript
{
  title?: string,
  description?: string,
  config?: WorkflowConfig,    // 更新节点和连接
  isPublic?: boolean,
  isTemplate?: boolean,
  category?: string,
  tags?: string[]
}
```

#### 3.5 删除工作流

**端点**: `DELETE /api/workflows/:id`

#### 3.6 工作流收藏

**收藏工作流**: `POST /api/workflows/:id/favorite`

**取消收藏**: `DELETE /api/workflows/:id/favorite`

**获取收藏列表**: `GET /api/users/favorites`

---

### 4. 前端工作流编辑器实现

#### 4.1 编辑器核心组件

**文件**: `/frontend/src/components/WorkflowEditor/WorkflowEditor.tsx`

**主要功能**:

```typescript
export default function WorkflowEditor() {
  // 节点状态
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  
  // 边状态
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  
  // 处理新增连接
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds => addEdge(connection, eds))
    },
    [setEdges]
  )
  
  // 保存工作流
  const handleSave = async () => {
    const config = { nodes, edges }
    await workflowApi.createWorkflow({
      title,
      description,
      config,
      category,
      tags
    })
  }
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
    >
      <Background />
      <Controls />
      <MiniMap />
      <NodeToolbar />
    </ReactFlow>
  )
}
```

#### 4.2 自定义节点组件

**文件**: `/frontend/src/components/WorkflowEditor/nodes/CustomNode.tsx`

```typescript
export default function CustomNode({ data, selected }: NodeProps) {
  const nodeData = data as CustomNodeData
  
  // 根据节点类型渲染不同样式
  const getNodeStyle = () => {
    switch (nodeData.type) {
      case 'input':
        return 'bg-blue-100 border-blue-500'
      case 'llm':
        return 'bg-purple-100 border-purple-500'
      case 'tool':
        return 'bg-orange-100 border-orange-500'
      case 'condition':
        return 'bg-yellow-100 border-yellow-500'
      case 'output':
        return 'bg-green-100 border-green-500'
    }
  }
  
  return (
    <div className={`p-4 rounded-lg border-2 ${getNodeStyle()}`}>
      <div className="flex items-center gap-2">
        {getNodeIcon()}
        <span className="font-semibold">{nodeData.label}</span>
      </div>
      
      {/* 输入/输出句柄 */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      
      {/* 配置面板 */}
      {selected && <ConfigPanel data={nodeData.config} />}
    </div>
  )
}
```

#### 4.3 节点工具栏

**文件**: `/frontend/src/components/WorkflowEditor/NodeToolbar.tsx`

**功能**:
- 添加节点
- 删除节点
- 编辑节点配置
- 测试工作流
- 保存草稿

---

### 5. 工作流执行流程

#### 5.1 执行引擎流程

```
用户执行工作流
  ↓
前端: 调用 POST /api/workflows/:id/execute
  ↓
后端: 创建 WorkflowExecution 记录
  ↓
后端: 解析工作流配置 (节点和边)
  ↓
后端: 按拓扑排序执行节点
  ↓
对于每个节点:
  ├─ 准备输入数据 (从前驱节点获取)
  ├─ 根据类型执行:
  │  ├─ Input: 使用用户输入
  │  ├─ LLM: 调用 AI API
  │  ├─ Tool: 调用外部工具
  │  ├─ Condition: 计算条件表达式
  │  └─ Output: 收集结果
  ├─ 记录 ExecutionStep
  └─ 继续到下一个节点
  ↓
后端: 更新 WorkflowExecution 状态
  ↓
计算总成本和消耗
  ↓
扣除用户积分
  ↓
返回执行结果
  ↓
前端: 显示结果
```

#### 5.2 执行数据结构

```typescript
interface WorkflowExecution {
  id: string
  workflowId: string
  userId: string
  
  status: 'pending' | 'running' | 'completed' | 'failed'
  input: Record<string, any>     // 用户输入
  output: Record<string, any>    // 最终输出
  error?: string                 // 错误信息
  
  duration: number               // 总耗时 (ms)
  startedAt: DateTime
  completedAt?: DateTime
  
  // 执行步骤详情
  steps: ExecutionStep[]
  
  // 成本统计
  costInfo?: {
    inputTokens: number
    outputTokens: number
    cost: number                 // 消耗的积分
    costBreakdown: Array<{       // 各步骤成本
      stepId: string
      nodeType: string
      cost: number
    }>
  }
}

interface ExecutionStep {
  id: string
  executionId: string
  stepIndex: number              // 执行顺序
  nodeId: string
  nodeType: string
  
  status: 'pending' | 'running' | 'completed' | 'failed'
  input: any
  output: any
  error?: string
  
  duration?: number              // 单步耗时
  startedAt: DateTime
  completedAt?: DateTime
}
```

---

## 内容和文章相关功能

### 1. 工作项系统（文章创作相关）

#### 1.1 工作项类型

**内容创作类工作项**:

```typescript
const contentCreationWorkItems = [
  {
    id: 1,
    name: '文章撰写',
    type: 'article',
    icon: '📝',
    description: '专业的文章内容创作',
    category: 'text'
  },
  {
    id: 2,
    name: '小红书笔记',
    type: 'xiaohongshu',
    icon: '📱',
    description: '小红书平台内容创作',
    category: 'social_media'
  },
  {
    id: 3,
    name: '抖音脚本',
    type: 'douyin_script',
    icon: '🎬',
    description: '短视频脚本策划',
    category: 'video'
  },
  {
    id: 4,
    name: '公众号文章',
    type: 'wechat_article',
    icon: '📰',
    description: '微信公众号内容',
    category: 'long_form'
  },
  {
    id: 5,
    name: '知乎回答',
    type: 'zhihu_answer',
    icon: '💡',
    description: '知乎问答内容',
    category: 'qa'
  }
]
```

#### 1.2 工作项使用记录

```typescript
interface WorkItemUsage {
  id: string
  userId: string
  workItemId: string
  usedAt: DateTime
}

// 数据库关系
User 1:N WorkItemUsage
WorkItem 1:N WorkItemUsage
```

**API 端点**:
- `GET /api/work-items` - 获取工作项列表
- `POST /api/work-items/:id/use` - 记录工作项使用
- `GET /api/work-items/usage-stats` - 获取使用统计

---

### 2. 工作包系统（预制的工作流包）

#### 2.1 工作包数据结构

**位置**: `/frontend/src/data/popularWorkPackages.ts`

```typescript
interface WorkPackage {
  id: string                           // 唯一 ID
  name: string                         // 工作包名称
  description: string                  // 描述
  category: string                     // 分类 (content_creation, marketing 等)
  icon: string                         // 图标
  color: string                        // 颜色代码
  coverImage?: string                  // 封面图片
  
  tags: string[]                       // 标签
  difficulty: 'easy' | 'medium' | 'hard'  // 难度级别
  
  author: {
    name: string
    avatar: string
  }
  
  stats: {
    downloads: number                  // 下载数
    rating: number                     // 评分 (1-5)
    reviews: number                    // 评论数
  }
  
  items: WorkPackageItem[]             // 包含的工作项
  workflows: WorkflowTemplate[]        // 包含的工作流模板
  
  createdAt: string
  updatedAt: string
}

interface WorkPackageItem {
  id: number
  name: string
  description: string
  icon: string
  tools: WorkPackageTool[]
}

interface WorkPackageTool {
  id: number
  name: string
  type: string
  description: string
  icon: string
  modelId?: string                    // AI 模型 ID
  provider?: string                   // 模型提供商
}
```

#### 2.2 工作包数据示例

```typescript
const popularWorkPackages: WorkPackage[] = [
  {
    id: 'package-ai-article',
    name: 'AI 文章生成工作包',
    description: '使用 AI 快速生成高质量文章的完整工作流',
    category: 'content_creation',
    icon: '📝',
    color: '#3B82F6',
    
    tags: ['AI', '写作', '内容创作'],
    difficulty: 'easy',
    
    author: {
      name: '官方团队',
      avatar: 'avatar_url'
    },
    
    stats: {
      downloads: 2340,
      rating: 4.8,
      reviews: 156
    },
    
    items: [
      {
        id: 1,
        name: '主题输入',
        description: '输入文章主题',
        icon: '📌',
        tools: []
      },
      {
        id: 2,
        name: 'AI 生成',
        description: '使用 GPT-4 生成文章',
        icon: '🤖',
        tools: [
          {
            id: 1,
            name: 'GPT-4',
            type: 'llm',
            description: 'OpenAI 的 GPT-4 模型',
            icon: '🧠',
            provider: 'openai',
            modelId: 'gpt-4o'
          }
        ]
      }
    ],
    
    workflows: [
      // 预定义的工作流模板
    ]
  }
]
```

#### 2.3 工作包导入流程

**前端**: `WorkPackageImportModal.tsx`

```typescript
const handleImport = async (packageId: string) => {
  try {
    // 1. 调用 API 导入工作包
    const response = await workspaceApi.importPackage(packageId)
    
    // 2. 更新本地状态
    setWorkspaceLayout(response.layout)
    
    // 3. 显示导入成功提示
    showSuccess('工作包导入成功')
    
    // 4. 刷新工作台布局
    refreshWorkspace()
  } catch (error) {
    showError('导入失败: ' + error.message)
  }
}
```

**后端**: `POST /api/workspace/import-package`

```typescript
router.post('/import-package', authenticateToken, async (req, res) => {
  const { packageId } = req.body
  const userId = req.user!.id
  
  // 1. 查询工作包
  const workPackage = getWorkPackageById(packageId)
  
  // 2. 为用户创建对应的工作项
  for (const item of workPackage.items) {
    await createUserWorkItem(userId, item)
  }
  
  // 3. 创建或更新工作台布局
  const layout = await updateWorkspaceLayout(userId, workPackage)
  
  // 4. 返回结果
  res.json({ success: true, layout })
})
```

---

### 3. 工作角色和工作类型系统

#### 3.1 内容创作者的工作场景

**数据文件**: `/frontend/src/data/workspaceContainers.ts`

```typescript
{
  id: 'content_creator',
  name: '内容创作者',
  icon: '✍️',
  description: '专注内容创作与自媒体运营',
  jobs: [
    {
      id: 'xiaohongshu',
      name: '小红书运营',
      description: '小红书内容创作与运营'
      // 关联的工作包和工作流
    },
    {
      id: 'douyin_script',
      name: '抖音脚本策划',
      description: '短视频脚本策划与创作'
    },
    {
      id: 'wechat_article',
      name: '公众号写作',
      description: '微信公众号文章创作'
      // 这个工作类型的典型工作流:
      // 1. 主题选择 → 2. AI 生成初稿 → 3. 内容检查 → 4. 人工修改 → 5. 发布
    },
    {
      id: 'zhihu_writing',
      name: '知乎创作',
      description: '知乎问答与文章创作'
    },
    {
      id: 'kuaishou',
      name: '快手运营',
      description: '快手短视频运营'
    },
    {
      id: 'bilibili',
      name: 'B站UP主',
      description: 'B站视频创作与运营'
    }
  ]
}
```

#### 3.2 典型的公众号写作工作流

```
工作流: 公众号高效写作系统
├─ 节点 1: 主题输入
│  └─ 用户输入文章主题
│
├─ 节点 2: AI 初稿生成
│  └─ 使用 Claude 3.5 生成 2000 字初稿
│  └─ 成本: ~1500 coins
│
├─ 节点 3: SEO 优化
│  └─ 工具: SEO 检查器
│  └─ 添加关键词、优化标题
│
├─ 节点 4: 质量检查
│  └─ 条件: 内容质量 > 80 分
│     ├─ True: 转发布节点
│     └─ False: 人工审核
│
├─ 节点 5: 发布
│  └─ 输出: Markdown 格式文章
│
└─ 执行成本统计
   ├─ AI 成本: 1500 coins
   ├─ 工具费用: 200 coins
   └─ 总计: 1700 coins (约 1.7 元)
```

---

### 4. 内容管理功能（评论、评分、收藏）

#### 4.1 评论系统

```typescript
interface Comment {
  id: string
  content: string
  createdAt: DateTime
  updatedAt: DateTime
  
  userId: string
  user: User                     // 评论者信息
  
  workflowId: string
  workflow: Workflow             // 关联的工作流
  
  // 回复功能
  parentId?: string              // 父评论 ID (回复时)
  parent?: Comment               // 父评论
  replies: Comment[]             // 该评论的回复列表
}
```

**API 端点**:
- `POST /api/workflows/:id/comments` - 添加评论
- `GET /api/workflows/:id/comments` - 获取评论列表
- `DELETE /api/comments/:id` - 删除评论

#### 4.2 评分系统

```typescript
interface Rating {
  id: string
  score: number                  // 1-5 分
  review?: string                // 评语
  createdAt: DateTime
  updatedAt: DateTime
  
  userId: string
  user: User
  
  workflowId: string
  workflow: Workflow
  
  // 数据库约束: 一个用户只能对一个工作流评分一次
  @@unique([userId, workflowId])
}
```

**API 端点**:
- `POST /api/workflows/:id/ratings` - 添加评分
- `GET /api/workflows/:id/ratings` - 获取评分列表
- `PUT /api/ratings/:id` - 更新评分
- `DELETE /api/ratings/:id` - 删除评分

#### 4.3 收藏系统

```typescript
interface Favorite {
  id: string
  createdAt: DateTime
  
  userId: string
  user: User
  
  workflowId: string
  workflow: Workflow
  
  // 数据库约束: 一个用户只能收藏一个工作流一次
  @@unique([userId, workflowId])
}
```

**API 端点**:
- `POST /api/workflows/:id/favorite` - 收藏
- `DELETE /api/workflows/:id/favorite` - 取消收藏
- `GET /api/users/favorites` - 获取用户收藏列表

---

### 5. 搜索和发现功能

#### 5.1 工作流搜索

**API**: `GET /api/workflows?search=关键词&category=分类&tags=标签`

**搜索范围**:
- 标题 (title)
- 描述 (description)
- 标签 (tags)

**搜索过滤**:
- 按分类 (category)
- 按标签 (tags)
- 按作者 (author)
- 按评分 (ratings)
- 按日期 (createdAt)

#### 5.2 推荐系统

**推荐策略**:
1. **热门推荐**: 按执行次数降序
2. **评分推荐**: 按平均评分降序
3. **收藏推荐**: 按收藏数降序
4. **新品推荐**: 按发布时间降序
5. **相关推荐**: 基于相同标签和分类

**前端实现**: 
- `/frontend/src/pages/ExplorePage.tsx` - 探索页面
- `/frontend/src/pages/SearchResultPage.tsx` - 搜索结果页

---

## 文章和内容创作的完整流程示例

### 从工作包导入到生成文章的完整流程

```
1. 用户浏览市场
   ↓
2. 发现 "AI 文章生成工作包"
   ↓
3. 点击导入
   ├─ 前端显示 WorkPackageImportModal
   ├─ 显示工作包详情和预览
   └─ 用户确认导入
   ↓
4. 后端导入处理
   ├─ 创建工作项关联
   ├─ 更新工作台布局
   └─ 初始化工作流模板
   ↓
5. 用户进入工作台 (StoragePage)
   ├─ 看到导入的工作包卡片
   ├─ 拖拽卡片组织布局
   └─ 点击开始
   ↓
6. 打开工作流编辑器
   ├─ 加载预定义的工作流
   ├─ 编辑参数 (主题、风格等)
   └─ 运行工作流
   ↓
7. 工作流执行
   ├─ Step 1: 接收主题输入
   ├─ Step 2: 调用 GPT-4o 生成文章
   │  └─ 消耗 1500 coins
   ├─ Step 3: 检查语法和质量
   │ └─ 消耗 200 coins
   ├─ Step 4: 格式化输出
   └─ 总成本: 1700 coins
   ↓
8. 显示结果
   ├─ 前端显示生成的文章
   ├─ 显示成本统计
   └─ 提供复制、下载、编辑选项
   ↓
9. 用户编辑和发布
   ├─ 在工作台中进一步编辑
   ├─ 复制文本到其他平台
   └─ 保存为草稿或发布
```

---

## 总结

这个工作流平台提供了一套完整的内容创作和工作流管理系统:

### 核心特性:

1. **灵活的工作流编辑**: 支持 5 种节点类型，可搭建任意业务流程
2. **预制工作包**: 快速导入行业最佳实践工作流
3. **多工作角色**: 针对不同职位预设工作类型
4. **AI 集成**: 支持多个 AI 模型，成本透明计算
5. **完整的内容管理**: 评论、评分、收藏功能
6. **社区功能**: 发现、搜索、推荐工作流

### 文件速查:

| 功能 | 文件 |
|------|------|
| 工作流编辑 | `/frontend/src/components/WorkflowEditor/` |
| 工作包数据 | `/frontend/src/data/popularWorkPackages.ts` |
| 工作角色 | `/frontend/src/data/workspaceContainers.ts` |
| 工作台 | `/frontend/src/pages/StoragePage.tsx` |
| 工作流路由 | `/backend/src/routes/workflows.ts` |
| 数据模型 | `/backend/prisma/schema.prisma` |

