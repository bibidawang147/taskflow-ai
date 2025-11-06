/**
 * 示例文章模板
 * 用于"文章转工作流"功能的快速测试和演示
 */

export interface ArticleExample {
  id: string
  title: string
  category: string
  content: string
  tags: string[]
}

export const ARTICLE_EXAMPLES: ArticleExample[] = [
  {
    id: 'chatgpt-weekly-report',
    title: 'ChatGPT智能写周报 - 3分钟完成高质量周报',
    category: '办公效率',
    tags: ['ChatGPT', '周报', '办公自动化'],
    content: `# ChatGPT智能写周报 - 3分钟完成高质量周报

## 步骤1: 整理本周工作内容
收集本周完成的主要任务、项目进展和关键数据。包括：
- 完成的具体任务清单
- 项目里程碑进展
- 量化的工作成果（如完成数量、提升百分比等）
- 遇到的重要问题和解决方案

## 步骤2: 使用结构化提示词
打开ChatGPT，使用以下提示词模板：
"你是一个专业的职场助手。请根据以下工作内容，生成一份结构化的周报。要求：1)使用专业简洁的语言 2)突出量化成果 3)分为本周完成、下周计划、问题与建议三部分。工作内容：[粘贴你整理的内容]"

## 步骤3: AI生成初稿
ChatGPT会生成包含以下部分的周报：
- 本周工作总结（按重要性排序）
- 核心成果展示（数据化呈现）
- 下周工作计划
- 遇到的问题和建议

## 步骤4: 人工优化
检查AI生成的内容：
- 补充具体数据和细节
- 调整语气和措辞
- 添加或删除不合适的内容
- 确保符合公司周报格式

## 步骤5: 格式美化和发送
使用Markdown或公司指定格式进行排版，确保：
- 标题层级清晰
- 使用列表和表格增强可读性
- 重点内容加粗或高亮
- 最后检查无错别字

## 效果
使用这个流程，可以将原本需要30-60分钟的周报撰写时间压缩到3-5分钟，且质量更高、结构更清晰。`
  },

  {
    id: 'midjourney-logo-design',
    title: 'Midjourney LOGO设计完整流程',
    category: '设计',
    tags: ['Midjourney', 'LOGO设计', 'AI绘画', '品牌设计'],
    content: `# Midjourney LOGO设计完整流程

## 第1步: 明确设计需求
在开始之前，确定：
- 品牌名称和定位
- 目标受众和行业特征
- 风格偏好（极简/复古/现代/抽象等）
- 色彩倾向
- 使用场景（网站/APP/印刷品等）

## 第2步: 撰写提示词
构建LOGO专用提示词，核心要素：
- 设计风格: "minimalist", "modern", "vintage"
- 图形元素: "geometric shapes", "abstract", "letter mark"
- 色彩要求: "monochrome", "vibrant colors", "blue and white"
- 技术参数: "vector style", "flat design", "simple"

完整示例：
/imagine minimalist logo design for tech startup, letter "A" incorporated, geometric shapes, blue gradient, modern, clean, vector style, white background --v 6 --s 250

## 第3步: 批量生成多个方案
使用不同的提示词变体生成多组设计：
- 改变风格关键词（minimalist → vintage）
- 调整色彩方案
- 尝试不同的图形元素
- 使用--seed参数保持一致性
建议生成20-30个初步方案

## 第4步: 筛选和细化
从生成的方案中选择3-5个最佳设计：
- 使用U1-U4进行高清放大
- 使用V1-V4生成变体探索更多可能
- 使用Vary (Region) 调整局部细节
- 使用Remix模式微调

## 第5步: 导出和矢量化
将选定的设计导出处理：
- 从Midjourney下载高分辨率PNG
- 使用Adobe Illustrator或Vectorizer.AI转换为矢量
- 调整路径和锚点
- 优化为SVG/EPS格式

## 第6步: 实际应用测试
在不同场景测试LOGO效果：
- 放大缩小测试（从favicon到海报）
- 黑白版本测试
- 不同背景色测试
- 印刷品模拟
- 响应式设计适配

## 专业提示
- 保持简洁，避免过度复杂
- 确保可识别度和辨识度
- 考虑商标注册的独特性
- 准备多个尺寸规格
- 建立完整的品牌视觉规范

通过这个流程，即使没有专业设计背景，也能使用Midjourney创作出专业级的LOGO设计。`
  },

  {
    id: 'github-copilot-coding',
    title: 'GitHub Copilot 高效编码实战',
    category: '编程开发',
    tags: ['GitHub Copilot', 'AI编程', '代码生成', '效率工具'],
    content: `# GitHub Copilot 高效编码实战

## 步骤1: 写清晰的函数注释
Copilot的建议质量取决于上下文，所以要：
- 用自然语言描述函数功能
- 说明输入参数和返回值
- 列出主要的处理步骤
- 提及关键的边界条件

示例：
// 函数: 计算两个日期之间的工作日数量
// 输入: startDate (Date), endDate (Date)
// 输出: 工作日数量 (number)
// 说明: 排除周末(周六日)和中国法定节假日
function calculateWorkdays(startDate: Date, endDate: Date): number {

## 步骤2: 分步引导生成
不要期望一次生成完整函数，而是：
- 先让Copilot生成函数签名
- 逐步添加注释，生成对应代码
- 每完成一个逻辑块，验证后再继续
- 使用Tab接受建议，Option+]切换选项

## 步骤3: 利用测试驱动开发
先写测试用例，让Copilot补全实现：

describe('calculateWorkdays', () => {
  it('same day should return 0', () => {
    // Copilot会自动补全测试代码
  })

  it('should exclude weekends', () => {
    // 继续补全更多测试
  })
})

## 步骤4: 代码审查和优化
Copilot生成的代码需要检查：
- 边界条件处理是否完整
- 错误处理是否妥当
- 性能是否可以优化
- 代码风格是否一致
- 类型定义是否准确

## 步骤5: 使用Inline Chat重构
按Cmd+I调出内联对话，使用自然语言：
- "优化这段代码的性能"
- "添加完整的错误处理"
- "重构为更函数式的写法"
- "添加详细的TypeScript类型"

## 步骤6: 建立项目上下文
提升建议质量的技巧：
- 打开相关文件提供上下文
- 使用一致的命名规范
- 维护清晰的代码结构
- 编写示例代码作为参考

## 实战效果对比
传统方式编写一个REST API端点：30分钟
使用Copilot优化流程：
- 写接口注释和类型定义: 3分钟
- Copilot生成路由代码: 1分钟
- 补全业务逻辑: 5分钟
- 添加错误处理和测试: 5分钟
总计：14分钟，效率提升50%+

## 核心原则
GitHub Copilot是智能助手而非替代品，最佳实践是：
- 开发者负责架构和逻辑设计
- Copilot负责样板代码和重复性工作
- 人工负责最终审查和优化
- 持续学习和调整使用习惯`
  },

  {
    id: 'notion-ai-knowledge',
    title: 'Notion AI 知识管理工作流',
    category: '学习提升',
    tags: ['Notion AI', '知识管理', '笔记整理', '学习'],
    content: `# Notion AI 知识管理工作流

## 步骤1: 收集原始信息
将各类信息源导入Notion：
- 网页内容(Web Clipper)
- PDF文档
- 会议记录
- 阅读笔记
- 零散想法

## 步骤2: AI自动总结
使用Notion AI提取关键信息：
- 选中文本，点击"Summary"
- 生成核心要点列表
- 提取关键数据和结论
- 识别重要概念和术语

## 步骤3: 知识分类整理
让AI帮助组织内容：
- 使用"Categorize"功能自动分类
- 生成合适的标签
- 创建知识图谱连接
- 建立笔记索引

## 步骤4: 深度加工
利用AI增强笔记价值：
- "Explain"复杂概念
- "Brainstorm"相关应用场景
- "Generate action items"生成行动清单
- "Create study guide"制作学习指南

## 步骤5: 定期回顾
建立定期回顾机制：
- 使用Database视图追踪笔记
- AI生成每周学习总结
- 识别知识盲点
- 推荐复习重点

## 步骤6: 知识应用和输出
将学习成果转化为产出：
- AI辅助写文章或报告
- 生成演讲大纲
- 制作培训材料
- 分享学习心得

## 高效技巧
- 使用模板标准化笔记格式
- 善用Database关联知识
- 设置提醒定期回顾
- 建立个人知识体系

通过这套流程，Notion AI可以帮你将碎片化信息转化为系统化知识。`
  },

  {
    id: 'chatgpt-data-analysis',
    title: 'ChatGPT + Excel 数据分析自动化',
    category: '数据分析',
    tags: ['ChatGPT', 'Excel', '数据分析', '自动化'],
    content: `# ChatGPT + Excel 数据分析自动化

## 步骤1: 准备数据集
整理Excel数据表：
- 确保表头清晰规范
- 去除空行和异常值
- 统一数据格式
- 导出为CSV格式

## 步骤2: 上传数据到ChatGPT
使用ChatGPT Code Interpreter：
- 上传CSV文件
- 描述数据集内容和分析目标
- 说明需要的图表类型

## 步骤3: 生成分析代码
让ChatGPT编写Python分析代码：
- 数据清洗和预处理
- 统计描述分析
- 趋势和相关性分析
- 可视化图表生成

## 步骤4: 解读分析结果
ChatGPT会：
- 生成可视化图表
- 提供数据洞察
- 指出异常和趋势
- 给出业务建议

## 步骤5: 生成分析报告
自动化输出：
- 结构化分析报告
- 数据表格和图表
- 关键发现总结
- 行动建议清单

## 步骤6: 导入Excel深化分析
将结果导回Excel：
- 粘贴分析数据
- 使用Excel进行格式美化
- 添加交互式Dashboard
- 设置自动更新

## 实用案例
销售数据分析提示词：
"我有一份销售数据CSV，包含日期、产品、销量、金额列。请帮我：1)计算每月销售趋势 2)识别畅销产品Top10 3)分析季节性规律 4)生成可视化图表 5)给出提升建议。"

## 效率对比
传统Excel分析：2-3小时
ChatGPT辅助：15-30分钟

这个流程特别适合非技术人员进行专业级数据分析。`
  }
]

/**
 * 根据ID获取示例文章
 */
export function getArticleExample(id: string): ArticleExample | undefined {
  return ARTICLE_EXAMPLES.find(example => example.id === id)
}

/**
 * 获取所有示例文章的简要列表
 */
export function getArticleExamplesList() {
  return ARTICLE_EXAMPLES.map(example => ({
    id: example.id,
    title: example.title,
    category: example.category,
    tags: example.tags
  }))
}
