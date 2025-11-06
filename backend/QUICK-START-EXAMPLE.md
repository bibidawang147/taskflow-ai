# 快速开始 - 文章转工作流示例

## 方式1: 前端测试（最简单）

1. 启动后端服务：
```bash
cd backend
npm run dev
```

2. 启动前端服务：
```bash
cd frontend
npm run dev
```

3. 访问 `http://localhost:5173/article-to-workflow`

4. 粘贴以下示例文章：

````markdown
# ChatGPT智能周报生成工作流

## 步骤1: 整理本周工作
列出本周完成的任务：
- 完成的项目
- 解决的问题
- 关键数据成果

## 步骤2: 构建提示词
打开ChatGPT，使用结构化提示：
"你是专业助手，请根据以下内容生成周报，要求：1)专业简洁 2)突出数据 3)分三部分"

## 步骤3: AI生成初稿
ChatGPT会自动生成：
- 本周工作总结
- 核心成果展示
- 下周工作计划

## 步骤4: 人工优化
检查并补充：
- 具体数据细节
- 调整语气措辞
- 符合公司格式

## 步骤5: 格式美化
使用Markdown排版，确保：
- 层级清晰
- 重点突出
- 无错别字
````

5. 点击"生成工作流"，等待AI分析

6. 查看生成的可视化工作流

7. 点击"保存工作流"，即可在工作台使用

## 方式2: API测试

```bash
# 测试示例文章API
curl http://localhost:3000/api/workflows/article-examples

# 获取第一个示例
curl http://localhost:3000/api/workflows/article-examples/chatgpt-weekly-report

# 使用示例文章生成工作流
curl -X POST http://localhost:3000/api/workflows/generate/from-article \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @- <<EOF
{
  "content": "$(curl -s http://localhost:3000/api/workflows/article-examples/chatgpt-weekly-report | jq -r '.example.content')",
  "title": "ChatGPT智能周报"
}
EOF
```

## 方式3: 批量生成测试

使用预设的批量脚本：

```bash
cd backend

# 从3个高质量示例文章生成工作流
npx ts-node scripts/batch-with-content.ts
```

预期输出：
```
✅ 完成! 成功生成 3/3 个工作流

数据库总工作流: 36 个
```

## 验证结果

检查生成的工作流：

```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const workflows = await prisma.workflow.findMany({
    where: { sourceType: 'manual' },
    select: {
      title: true,
      category: true,
      tags: true,
      config: true
    },
    orderBy: { createdAt: 'desc' },
    take: 3
  });

  workflows.forEach((w, idx) => {
    console.log(\`\${idx + 1}. \${w.title}\`);
    console.log(\`   分类: \${w.category}\`);
    console.log(\`   标签: \${w.tags}\`);
    console.log(\`   节点数: \${w.config.nodes.length}\n\`);
  });

  await prisma.\$disconnect();
}

check();
"
```

预期输出：
```
1. GitHub Copilot高效编程工作流
   分类: 编程开发
   标签: AI编程助手,GitHub Copilot,代码生成...
   节点数: 9

2. Midjourney AI绘画完整工作流
   分类: 设计
   标签: AI绘画,Midjourney,提示词工程...
   节点数: 8

3. ChatGPT提示词优化工作流程
   分类: 内容创作
   标签: 提示词工程,AI写作优化...
   节点数: 10
```

## 成功标志

如果看到以下情况，说明功能正常：

✅ AI正确识别文章分类（办公效率/内容创作/设计/编程开发/学习提升/数据分析）
✅ 提取3-8个合理的工作流步骤
✅ 生成的标签包含AI工具名称
✅ 可视化编辑器正常显示工作流图
✅ 能够成功保存到数据库

## 常见问题

**Q: 生成的分类不对？**
A: 现在有智能映射，会自动标准化。如果还是不对，可以在文章中明确提及应用场景。

**Q: 步骤太少或太多？**
A: AI已优化为3-8步。文章结构清晰会生成更好的结果。

**Q: 生成失败？**
A: 检查：
1. 阿里云API Key是否配置（.env文件中的ALIBABA_API_KEY）
2. 文章内容是否为空
3. 查看backend控制台日志

## 下一步

功能已完成优化，你现在可以：

1. **自己提供文章内容** - 粘贴任何AI教程文章
2. **批量生成工作流** - 使用batch-with-content.ts脚本
3. **前端直接使用** - ArticleWorkflowMVPPage页面
4. **继续扩展** - 添加更多示例文章到article-examples.ts

## 数据概况

当前系统中已有：
- 种子工作流：20个（手动创建的模板）
- 测试工作流：3个（从示例文章生成）
- 示例文章：5个（可快速测试）

你的内容将增加更多实用的工作流！
