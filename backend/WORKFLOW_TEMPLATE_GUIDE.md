# 工作流模板系统使用指南

## 概述

本系统支持创建和发布内置工作流模板,用户可以基于这些模板快速创建自己的工作流。

## 已创建的内置模板

我们已经创建了以下 5 个高质量工作流模板:

### 1. 📝 智能文章生成器
- **分类**: content (内容创作)
- **功能**: 根据主题和关键词自动生成高质量文章
- **适用场景**: 博客、营销文案、新闻稿
- **节点流程**: 输入主题 → 生成大纲 → 撰写内容 → 输出文章

### 2. 🎯 智能营销方案生成器
- **分类**: marketing (营销)
- **功能**: 为产品或服务自动生成完整营销方案
- **包含内容**: 目标用户分析、营销策略、渠道建议
- **节点流程**: 输入产品信息 → 用户画像分析 + 营销策略规划 → 渠道执行计划 → 输出方案

### 3. 💡 创意故事生成器
- **分类**: creative (创作)
- **功能**: 根据主题、风格和角色设定自动创作创意故事
- **适用场景**: 小说、剧本、儿童故事
- **节点流程**: 输入故事设定 → 构思框架 → 撰写故事 → 输出

### 4. 🔍 智能数据分析助手
- **分类**: analysis (分析)
- **功能**: 自动进行数据分析并生成洞察报告
- **包含内容**: 数据质量评估、趋势分析、业务建议
- **节点流程**: 输入数据 → 清洗建议 + 数据分析 → 洞察报告 → 输出

### 5. 🎓 智能课程设计助手
- **分类**: education (教育)
- **功能**: 根据教学目标和学生特点设计完整课程
- **包含内容**: 课程大纲、教学活动、评估方案
- **节点流程**: 输入需求 → 课程大纲 → 教学活动 + 评估方案 → 输出

## 种子数据组成

种子数据脚本 (`prisma/seed.ts`) 创建了以下内容:

### 1. 系统用户
- **邮箱**: system@workflow.com
- **密码**: admin123
- **用途**: 内置工作流和模板的作者

### 2. 工作流模板 (5个)
- 所有模板都设置了 `isTemplate: true`
- 所有模板都设置了 `isPublic: true` (公开可见)
- 所有模板都设置了 `isDraft: false` (已发布)

### 3. 内置工具 (3个)
- 🔍 Web搜索
- 🎨 图像生成
- 🌐 智能翻译

### 4. 工作项 (8个)
- 📝 文章撰写
- 🌐 翻译
- 📄 内容总结
- 💻 代码生成
- 🎨 图像生成
- 📊 数据分析
- 📋 方案策划
- 🎓 学习辅导

### 5. 模型定价 (5个)
- 豆包 Pro 4K/32K/128K
- GPT-4o
- Claude 3.5 Sonnet

## 如何使用种子数据

### 首次运行
```bash
npm run db:seed
```

### 验证数据
```bash
node verify-seed-data.js
```

### 重新运行(清空后重建)
如果需要清空现有数据并重新创建:
```bash
# 重置数据库
npx prisma db push --force-reset

# 重新运行种子脚本
npm run db:seed
```

## 如何添加更多模板

### 方式 1: 修改种子脚本
在 `prisma/seed.ts` 的 `builtInWorkflows` 数组中添加新的模板对象:

```typescript
{
  title: '您的模板标题',
  description: '模板描述',
  category: '分类',
  tags: '标签1,标签2',
  isPublic: true,
  isTemplate: true,
  isDraft: false,
  config: {
    nodes: [
      // 节点定义
    ],
    edges: [
      // 连接定义
    ]
  },
  exampleInput: {
    // 示例输入
  },
  exampleOutput: {
    // 示例输出
  }
}
```

然后重新运行 `npm run db:seed`

### 方式 2: 通过 API 创建
使用 POST /api/workflows 接口创建工作流,并确保设置:
```json
{
  "isTemplate": true,
  "isPublic": true,
  "isDraft": false
}
```

### 方式 3: 在前端创建后标记为模板
1. 在前端创建工作流
2. 发布工作流
3. 通过数据库或 API 将工作流标记为模板:
```sql
UPDATE workflows SET is_template = true WHERE id = 'your-workflow-id';
```

## 模板的特点

### 数据库字段
- `isTemplate`: true - 标记为模板
- `isPublic`: true - 公开可见
- `isDraft`: false - 已发布状态
- `authorId`: 系统用户ID

### 前端展示
模板工作流可以在以下位置展示:
- 模板市场/工作流商店
- 创建工作流时的模板选择
- 探索页面的推荐模板

### API 查询
获取所有模板:
```javascript
const templates = await prisma.workflow.findMany({
  where: {
    isTemplate: true,
    isPublic: true,
    isDraft: false
  }
})
```

按分类获取模板:
```javascript
const templates = await prisma.workflow.findMany({
  where: {
    isTemplate: true,
    category: 'content'
  }
})
```

## 用户如何使用模板

用户可以通过以下方式使用模板:

1. **克隆模板**: 复制模板创建自己的工作流实例
2. **直接执行**: 某些模板可以直接执行(只需提供输入)
3. **自定义修改**: 基于模板修改节点和配置

## 模板配置说明

每个工作流模板的 `config` 字段包含:

### nodes (节点数组)
```typescript
{
  id: string,           // 唯一标识
  type: string,         // 节点类型: input, llm, tool, condition, output
  label: string,        // 显示名称
  position: {x, y},     // 画布位置
  data: {
    label: string,      // 节点标签
    // type 特定的配置
  }
}
```

### edges (连接数组)
```typescript
{
  id: string,           // 唯一标识
  source: string,       // 源节点ID
  target: string        // 目标节点ID
}
```

## 注意事项

1. **ID 规范**: 种子数据中的工作流 ID 使用格式 `template-{标题-slug}`
2. **幂等性**: 种子脚本使用 `upsert` 操作,可以安全地多次运行
3. **系统用户**: 不要删除 `system@workflow.com` 用户,它是所有内置模板的作者
4. **模板不可编辑**: 建议在前端限制用户直接编辑模板,只能克隆后编辑

## 推荐工作流

如果想要某些工作流在首页展示,可以:
1. 添加 `featured` 字段到 schema (可选)
2. 或通过 `usageCount` 和 `rating` 排序显示热门模板

## 下一步

1. ✅ 种子数据已创建
2. 🔄 在前端添加模板市场页面
3. 🔄 实现模板克隆功能
4. 🔄 添加模板搜索和筛选
5. 🔄 显示模板使用统计

---

**最后更新**: 2025-01-13
**维护者**: 系统管理员
