# AI工作台会员体系需求文档

## 项目概述

本项目旨在构建一个完整的会员体系和创作者激励系统，支持用户消费内容和创作内容，通过积分、等级和收益分成机制激励优质内容创作。

---

## 一、用户类型体系

### 1.1 三类用户定义

| 用户类型 | 获得方式 | 定位 |
|---------|---------|-----|
| **Free会员** | 注册即可 | 纯消费者 |
| **Pro会员（非创作者）** | 付费开通 | 消费者 + 有限创作者 |
| **创作者** | Pro会员发布3个工作流成功上架后可申请 | 消费者 + 完整创作者 |

### 1.2 关键规则
- 创作者必须是Pro会员（身份不是递进，而是叠加）
- Pro会员（非创作者）的积分可累积，申请创作者后直接继承
- Free会员无法申请创作者

---

## 二、工作流等级体系

### 2.1 三级工作流定义

| 等级 | 名称 | 发布权限 | 使用权限 | 收益来源 |
|-----|-----|---------|---------|---------|
| **1级** | 免费工作流 | Pro会员、创作者 | 所有人免费 | 无现金收益，仅积分 |
| **2级** | Pro免费工作流 | Pro会员、创作者 | 仅Pro用户免费，Free用户不可见不可用 | 激励池分成 + 积分 |
| **3级** | 付费工作流 | 仅创作者 | Free原价/Pro五折购买 | 销售分成（60%-90%）+ 积分 |

### 2.2 购买规则细节

**付费工作流购买价格：**
- Free用户：原价购买
- Pro用户：5折购买
- 创作者本人：免费（自己的工作流）
- 其他创作者：5折购买（其他创作者的工作流）

---

## 三、核心业务规则

### 3.1 发布权限与限制

**发布权限：**
- Free会员：不能发布任何工作流
- Pro会员（非创作者）：可发布1级（免费）和2级（Pro免费）工作流
- 创作者：可发布所有等级（1级、2级、3级）工作流

**在架数量限制：**
- Pro会员（非创作者）：最多3个工作流在架，可以下架后替换新的
- 创作者：无限制

**审核要求：**
- 所有工作流发布都需要经过平台审核
- 审核通过后才能上架
- Pro会员非创作者和创作者的审核流程相同

### 3.2 消费权限

| 功能 | Free会员 | Pro会员 | 创作者 |
|-----|----------|---------|--------|
| 查看prompt | 前30-50字 | 完整 | 完整 |
| AI助手 | ✓ | ✓ | ✓ |
| 使用免费工作流 | ✓ | ✓ | ✓ |
| 使用Pro免费工作流 | ✗ | ✓ | ✓ |
| 购买付费工作流 | ✓（原价） | ✓（5折） | ✓（5折，自己免费） |
| 一键复制工作流 | ✗ | ✓ | ✓ |

### 3.3 创作权限

| 功能 | Free会员 | Pro会员（非创作者） | 创作者 |
|-----|----------|-------------------|--------|
| 创建容器/工作流 | ✓ | ✓ | ✓ |
| AI转工作流次数 | 5次/月 | 200次/月 | 200次/月 |
| 发布工作流 | ✗ | ✓ | ✓ |
| 在架数量限制 | - | 最多3个（可替换） | 无限制 |
| 可发布等级 | - | 免费、Pro免费 | 免费、Pro免费、付费 |
| 创建合辑 | ✗ | ✗ | ✓（只能编辑自己的） |

### 3.4 创作者申请条件

**必须同时满足：**
1. 当前是Pro会员
2. 已发布至少3个工作流
3. 这3个工作流已审核通过并成功上架

---

## 四、积分与等级系统

### 4.1 积分获取规则（优化版）

**发布工作流：**
- 发布免费工作流：+1分
- 发布Pro免费工作流：+2分
- 发布付费工作流：+3分

**使用激励：**
- 工作流被使用1次：+0.001分
- 付费工作流被购买1次：+0.5分

**适用范围：**
- 所有等级工作流（免费、Pro免费、付费）的使用都计入积分
- Pro会员（非创作者）的积分可累积，申请创作者后直接使用

### 4.2 创作者等级升级规则

**升级条件：必须同时满足3个维度**
1. 累计积分达标
2. 最低作品数达标
3. 最低总使用次数达标

**升级门槛表：**

| 从 | 到 | 累计积分 | 最低作品数 | 最低总使用次数 |
|---|---|---------|-----------|--------------|
| LV1 | LV2 | 50 | 5个 | 5,000次 |
| LV2 | LV3 | 150 | 10个 | 20,000次 |
| LV3 | LV4 | 300 | 15个 | 50,000次 |
| LV4 | LV5 | 500 | 20个 | 100,000次 |
| LV5 | LV6 | 800 | 30个 | 200,000次 |
| LV6 | LV7 | 1,200 | 40个 | 400,000次 |
| LV7 | LV8 | 1,800 | 50个 | 700,000次 |
| LV8 | LV9 | 2,600 | 60个 | 1,200,000次 |
| LV9 | LV10 | 3,600 | 80个 | 2,000,000次 |

**说明：**
- 三个条件缺一不可，必须全部满足才能升级
- 新申请的创作者默认从LV1开始
- 等级只影响付费工作流的销售分成比例

### 4.3 等级影响范围

**唯一影响：** 付费工作流的销售分成比例

**不影响：**
- 审核速度
- Pro免费工作流激励分成
- 发布权限
- 其他任何权益

---

## 五、收益分成机制

### 5.1 Pro免费工作流使用激励

#### 5.1.1 激励池来源

```
激励池 = 上月所有Pro会员收益（新开 + 续费）× 20%
```

**特殊情况：** 如果上月Pro会员收益为0，激励池为0

#### 5.1.2 激励池分配比例

```
非创作者池 = 激励池 × 25%
创作者池 = 激励池 × 75%
```

#### 5.1.3 收益计算公式

**Pro会员（非创作者）收益：**
```
单人收益 = 非创作者池 / 所有非创作者Pro工作流总使用次数 × 该非创作者Pro工作流被使用次数
```

**创作者收益：**
```
单人收益 = 创作者池 / 所有创作者Pro工作流总使用次数 × 该创作者Pro工作流被使用次数
```

#### 5.1.4 边界情况处理

- 如果某月没有非创作者发布Pro免费工作流，25%池子**轮空**，不参与分配
- 如果某月没有创作者发布Pro免费工作流，75%池子**轮空**，不参与分配
- 轮空的池子不累积到下月，下个月重新计算

#### 5.1.5 计算示例

```
假设：
- 上月Pro会员总收益 = 100万元
- 激励池 = 20万元
- 非创作者池 = 5万元，创作者池 = 15万元

场景1：非创作者A
- 其Pro工作流被使用 1,000次
- 全平台非创作者Pro工作流总使用 10,000次
- 非创作者A收益 = 5万 / 10,000 × 1,000 = 5,000元

场景2：创作者B
- 其Pro工作流被使用 5,000次
- 全平台创作者Pro工作流总使用 50,000次
- 创作者B收益 = 15万 / 50,000 × 5,000 = 15,000元
```

### 5.2 付费工作流销售分成

#### 5.2.1 分成比例表（按创作者等级）

| 等级 | 创作者分成 | 平台分成 |
|-----|-----------|---------|
| LV1 | 60% | 40% |
| LV2 | 63% | 37% |
| LV3 | 66% | 34% |
| LV4 | 69% | 31% |
| LV5 | 72% | 28% |
| LV6 | 75% | 25% |
| LV7 | 78% | 22% |
| LV8 | 81% | 19% |
| LV9 | 85% | 15% |
| LV10 | 90% | 10% |

#### 5.2.2 计算公式

```
创作者收益 = 实际成交价 × 创作者分成比例
平台收益 = 实际成交价 × 平台分成比例
```

**注意：** 
- 实际成交价根据购买者身份不同而不同（Free原价、Pro五折）
- 分成基于实际成交价，不是标价

#### 5.2.3 示例

```
创作者定价：100元

场景1：Free用户购买
- 实际成交价：100元
- LV5创作者获得：100 × 72% = 72元
- 平台获得：100 × 28% = 28元

场景2：Pro用户购买
- 实际成交价：50元（5折）
- LV5创作者获得：50 × 72% = 36元
- 平台获得：50 × 28% = 14元
```

---

## 六、技术实施要求

### 6.1 推荐技术栈

**后端：**
- Node.js + Express 或 Python + Django/Flask 或 Java + Spring Boot
- 数据库：MySQL 8.0+ 或 PostgreSQL 13+
- 缓存：Redis（可选，用于会话和计数）
- 定时任务：node-cron 或 APScheduler

**前端：**
- React + TypeScript 或 Vue 3 + TypeScript
- UI框架：Ant Design 或 Element Plus
- 状态管理：Redux/Zustand 或 Pinia

### 6.2 核心模块划分

```
services/
├── UserService.js          # 用户管理和身份判断
├── PermissionService.js    # 权限检查
├── WorkflowService.js      # 工作流CRUD和发布
├── PointsService.js        # 积分管理
├── LevelService.js         # 等级管理和升级判断
├── RevenueService.js       # 收益计算和分配
├── PaymentService.js       # 支付和分成处理
└── AuditService.js         # 审核流程
```

### 6.3 关键API接口清单

**用户相关：**
- `POST /api/users/register` - 注册
- `POST /api/users/login` - 登录
- `GET /api/users/profile` - 获取用户信息
- `POST /api/users/upgrade-to-pro` - 升级Pro会员
- `POST /api/users/apply-creator` - 申请创作者
- `GET /api/users/permissions` - 获取当前用户权限

**工作流相关：**
- `GET /api/workflows` - 工作流列表（支持筛选等级）
- `GET /api/workflows/:id` - 工作流详情
- `POST /api/workflows` - 创建工作流
- `PUT /api/workflows/:id` - 更新工作流
- `POST /api/workflows/:id/publish` - 发布/提交审核
- `DELETE /api/workflows/:id` - 下架工作流
- `POST /api/workflows/:id/use` - 使用工作流（记录使用）
- `POST /api/workflows/:id/purchase` - 购买付费工作流
- `POST /api/workflows/:id/copy` - 一键复制工作流

**创作者相关：**
- `GET /api/creator/stats` - 创作者统计（积分、等级、收益）
- `GET /api/creator/revenue` - 收益明细
- `GET /api/creator/works` - 我的作品列表
- `POST /api/creator/collections` - 创建合辑
- `GET /api/creator/level-progress` - 等级进度

**管理后台：**
- `GET /api/admin/workflows/pending` - 待审核工作流
- `POST /api/admin/workflows/:id/approve` - 审核通过
- `POST /api/admin/workflows/:id/reject` - 审核拒绝
- `GET /api/admin/users` - 用户列表
- `GET /api/admin/revenue/stats` - 收益统计
- `POST /api/admin/revenue/distribute` - 手动触发收益分配

---

## 七、数据库设计要点

### 7.1 核心表结构

**users 表（用户表）**
```sql
- id (主键)
- username
- email
- password_hash
- created_at
- updated_at
```

**memberships 表（会员关系表）**
```sql
- id (主键)
- user_id (外键 → users.id)
- type (枚举: 'free', 'pro', 'creator')
- status (枚举: 'active', 'expired', 'cancelled')
- started_at
- expires_at
- created_at
- updated_at
```

**workflows 表（工作流表）**
```sql
- id (主键)
- creator_id (外键 → users.id)
- title
- description
- prompt (完整prompt内容)
- level (枚举: 1, 2, 3)
- price (DECIMAL，仅level=3时有值)
- status (枚举: 'draft', 'pending', 'approved', 'rejected', 'archived')
- published_at
- created_at
- updated_at
```

**workflow_usage 表（工作流使用记录表）**
```sql
- id (主键)
- workflow_id (外键 → workflows.id)
- user_id (外键 → users.id)
- used_at
```

**workflow_purchases 表（工作流购买记录表）**
```sql
- id (主键)
- workflow_id (外键 → workflows.id)
- buyer_id (外键 → users.id)
- original_price (原价)
- actual_price (实际支付价格)
- creator_revenue (创作者收益)
- platform_revenue (平台收益)
- purchased_at
```

**creator_stats 表（创作者统计表）**
```sql
- id (主键)
- user_id (外键 → users.id，唯一)
- level (1-10)
- total_points (累计积分)
- work_count (作品数量)
- total_usage (总使用次数)
- updated_at
```

**points_records 表（积分记录表）**
```sql
- id (主键)
- user_id (外键 → users.id)
- points (可正可负)
- reason (枚举: 'publish_free', 'publish_pro', 'publish_paid', 'usage', 'purchase')
- related_id (关联的工作流ID或购买ID)
- created_at
```

**revenue_records 表（收益记录表）**
```sql
- id (主键)
- user_id (外键 → users.id)
- amount (DECIMAL)
- type (枚举: 'pro_incentive', 'paid_sale')
- source (来源说明，如 '2024年1月Pro工作流激励')
- period (周期，如 '2024-01')
- status (枚举: 'pending', 'paid', 'cancelled')
- created_at
- paid_at
```

**collections 表（合辑表，仅创作者可用）**
```sql
- id (主键)
- creator_id (外键 → users.id)
- title
- description
- created_at
- updated_at
```

**collection_items 表（合辑内容表）**
```sql
- id (主键)
- collection_id (外键 → collections.id)
- workflow_id (外键 → workflows.id)
- order (排序)
- added_at
```

### 7.2 关键索引

```sql
-- 用户查询优化
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_memberships_user_type ON memberships(user_id, type);

-- 工作流查询优化
CREATE INDEX idx_workflows_creator_status ON workflows(creator_id, status);
CREATE INDEX idx_workflows_level_status ON workflows(level, status);

-- 使用记录查询优化
CREATE INDEX idx_workflow_usage_workflow ON workflow_usage(workflow_id);
CREATE INDEX idx_workflow_usage_user ON workflow_usage(user_id);
CREATE INDEX idx_workflow_usage_date ON workflow_usage(used_at);

-- 创作者统计查询优化
CREATE INDEX idx_creator_stats_user ON creator_stats(user_id);
CREATE INDEX idx_creator_stats_level ON creator_stats(level);

-- 收益查询优化
CREATE INDEX idx_revenue_records_user_period ON revenue_records(user_id, period);
CREATE INDEX idx_revenue_records_type_period ON revenue_records(type, period);
```

---

## 八、实施阶段规划

### 阶段1：数据库设计与搭建
- 设计完整的表结构
- 生成建表SQL
- 创建测试数据

### 阶段2：用户身份与权限模块
- 实现用户身份判断
- 实现权限检查函数
- 创作者申请逻辑

### 阶段3：工作流发布与审核
- 工作流CRUD
- 发布限制检查
- 审核流程

### 阶段4：积分系统
- 积分获取规则实现
- 积分记录和查询
- Pro会员积分转移

### 阶段5：等级系统
- 等级升级判断
- 多维度门槛检查
- 等级变更记录

### 阶段6：Pro免费工作流收益分配
- 激励池计算
- 月度分配算法
- 定时任务
- 边界情况处理

### 阶段7：付费工作流购买与分成
- 购买流程
- 价格计算
- 分成处理
- 支付集成

### 阶段8：管理后台
- 审核界面
- 用户管理
- 收益报表

### 阶段9：前台用户界面
- 工作方法广场
- 个人工作台
- 创作者中心

### 阶段10：测试与优化
- 单元测试
- 集成测试
- 性能优化

---

## 九、关键业务场景流程

### 9.1 用户成长路径

```
注册 → Free会员 
  ↓
付费 → Pro会员（非创作者）
  ↓
发布3个工作流上架 → 申请创作者 
  ↓
获得创作者身份 → 持续创作 → 积累积分 → 等级提升 → 获得更高分成
```

### 9.2 工作流发布流程

```
创建工作流 → 选择等级 → 设置价格（如果是付费）→ 提交审核 → 等待审核
  ↓
审核通过 → 上架 → 用户可见可用
  ↓
审核拒绝 → 修改后重新提交
```

### 9.3 Pro免费工作流收益流程

```
每月1号凌晨：
1. 计算上月Pro会员总收益
2. 计算激励池（20%）
3. 统计所有Pro免费工作流使用次数
4. 分别计算非创作者池（25%）和创作者池（75%）
5. 按公式分配给每个创作者
6. 写入revenue_records表
7. 发送通知
```

### 9.4 付费工作流购买流程

```
用户选择购买 → 计算价格（根据用户身份）→ 调用支付接口 → 支付成功
  ↓
创作者收益分成 → 平台收益分成 → 写入revenue_records → 写入workflow_purchases
  ↓
购买者获得使用权 → 记录积分（+0.5分给创作者）
```

---

## 十、注意事项与边界情况

### 10.1 重要规则
1. 所有涉及金额的字段使用DECIMAL类型，不使用FLOAT
2. 所有时间使用UTC存储，显示时转换为用户时区
3. 收益分配需要幂等性，避免重复分配
4. 所有状态变更需要记录操作日志

### 10.2 边界情况处理
1. Pro会员过期后，已发布的工作流如何处理？
   - 建议：保持在架，但不能新发布
   
2. 创作者身份取消后（如Pro会员过期），已有等级和积分如何处理？
   - 建议：保留数据，恢复Pro会员后自动恢复创作者身份
   
3. 工作流被下架后，历史使用记录和收益如何处理？
   - 建议：历史数据保留，不影响已产生的收益
   
4. 用户购买后，工作流创作者提价，是否影响已购买用户？
   - 建议：不影响，已购买用户永久有效

5. 激励池为0时的处理？
   - 建议：跳过当月分配，在用户界面提示"本月无收益"

### 10.3 安全考虑
1. 密码使用bcrypt加密
2. API需要JWT或Session认证
3. 敏感操作（支付、分成）需要二次验证
4. 防止刷积分：同一用户对同一工作流的使用记录需要防重
5. 防止刷收益：需要检测异常使用模式

---

## 十一、可选的未来扩展功能

1. **质量加成系统**
   - 单作品使用量突破10万：+10分
   - 连续3个月月活TOP 100：+50分

2. **社交功能**
   - 创作者主页
   - 关注/粉丝系统
   - 作品评论和评分

3. **推荐算法**
   - 基于用户行为的个性化推荐
   - 热门工作流排行

4. **数据分析**
   - 创作者数据看板
   - 收益趋势分析
   - 用户行为分析

---

**文档版本：** 1.0  
**最后更新：** 2024-12-19  
**维护者：** AI工作台产品团队
