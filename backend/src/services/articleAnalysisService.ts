import axios from 'axios'
import puppeteer from 'puppeteer'

/**
 * 文章分析服务
 * 从URL抓取文章内容，并使用AI分析提取工作流
 */
export class ArticleAnalysisService {
  /**
   * 从URL抓取文章内容
   */
  static async fetchArticleContent(url: string): Promise<{
    title: string
    content: string
    excerpt: string
    images?: string[]
  }> {
    // 🎯 检测微信文章链接，使用 Puppeteer 进行抓取
    if (url.includes('mp.weixin.qq.com')) {
      console.log('[抓取文章] 检测到微信文章，使用 Puppeteer 浏览器抓取...')
      return await this.fetchWeixinArticleWithPuppeteer(url)
    }

    try {
      // 使用 Jina Reader API 来获取干净的文章内容
      const jinaUrl = `https://r.jina.ai/${url}`

      console.log('[抓取文章] 使用 Jina Reader API...')
      const response = await axios.get(jinaUrl, {
        headers: {
          'Accept': 'application/json',
          'X-Return-Format': 'markdown'
        },
        timeout: 90000  // 增加到90秒，微信公众号文章需要更长时间
      })
      console.log('[抓取文章] Jina API 响应成功')

      // 如果返回的是JSON格式
      if (response.data && typeof response.data === 'object') {
        const content = response.data.content || response.data.text || ''
        const images = ArticleAnalysisService.extractImagesFromContent(content)

        // ✅ 验证内容是否为空
        if (!content || content.trim().length < 100) {
          console.log('[抓取文章] Jina返回内容过短或为空，尝试直接抓取')
          throw new Error('Jina返回内容为空')
        }

        console.log(`[抓取文章] 成功抓取 ${content.length} 字符`)
        return {
          title: response.data.title || '未命名文章',
          content: content,
          excerpt: response.data.description || '',
          images: images
        }
      }

      // 如果返回的是纯文本
      const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)

      // ✅ 验证内容是否为空
      if (!text || text.trim().length < 100) {
        console.log('[抓取文章] Jina返回纯文本过短或为空，尝试直接抓取')
        throw new Error('Jina返回内容为空')
      }

      const images = ArticleAnalysisService.extractImagesFromContent(text)
      console.log(`[抓取文章] 成功抓取 ${text.length} 字符`)

      return {
        title: this.extractTitle(text),
        content: text,
        excerpt: text.slice(0, 200),
        images: images
      }
    } catch (error: any) {
      console.error('[抓取文章] Jina API 失败:', error.message)

      // 如果Jina API失败，尝试直接获取
      try {
        console.log('[抓取文章] 尝试直接抓取...')
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 30000
        })
        console.log('[抓取文章] 直接抓取成功')

        const html = response.data
        const title = this.extractTitleFromHtml(html)
        const content = this.stripHtml(html)

        return {
          title,
          content,
          excerpt: content.slice(0, 200)
        }
      } catch (fallbackError: any) {
        console.error('[抓取文章] 直接抓取也失败:', fallbackError.message)
        throw new Error(`无法抓取文章内容。原因: ${fallbackError.message}。建议：复制文章内容后使用"粘贴文章内容"方式`)
      }
    }
  }

  /**
   * 使用AI分析文章并提取工作流步骤
   */
  static async analyzeArticleAndExtractWorkflow(
    title: string,
    content: string,
    apiKey?: string,
    images?: string[]
  ): Promise<{
    workflowTitle: string
    workflowDescription: string
    steps: WorkflowStep[]
    category: string
    tags: string[]
  }> {
    // 截取内容（避免超过token限制和提高响应速度）
    const truncatedContent = content.slice(0, 5000)

    // 构建图片列表说明
    const imagesList = images && images.length > 0
      ? `\n\n文章中的图片列表（共${images.length}张）：\n${images.map((img, i) => `图${i + 1}: ${img}`).join('\n')}`
      : ''

    const prompt = `你是一个专业的AI工作流程提取专家。

🎯 **核心任务：提取（Extract），而不是概括（Summarize）或改写（Rewrite）**

你的任务是从文章中**完整地、详细地提取**原有的内容，特别是：
- 提示词（Prompt）必须完整复制原文，一字不落
- 操作步骤的描述要保留所有细节
- 参数设置、注意事项都要提取出来

⚠️ 禁止简化、禁止概括、禁止改写！原文有多详细，你的提取就应该有多详细！

---

文章标题：${title}

文章内容：
${truncatedContent}${imagesList}

---

请仔细阅读文章，完整提取工作流程信息，返回JSON格式：

{
  "workflowTitle": "简洁有吸引力的工作流标题（不超过30字）",
  "workflowDescription": "工作流详细描述（80-150字），必须包含：1)最终目标是什么 2)使用了哪些工具/AI 3)适用场景 4)核心价值",
  "mainTools": ["文章中使用的主要工具/软件/AI模型"],
  "category": "准确的分类（必须从以下选择一个）：办公效率 | 内容创作 | 设计 | 编程开发 | 学习提升 | 数据分析",
  "tags": ["必须包含所有提到的工具名", "应用场景", "技术特征", "目标领域"],
  "steps": [
    {
      "stepNumber": 1,
      "title": "步骤标题（动词开头，简洁有力）",
      "goal": "这一步要达成什么目的/解决什么问题（必填，从原文提取，20-50字）",
      "description": "⚠️ 详细操作说明（从原文完整提取！包含具体步骤、工具使用、参数设置、注意事项、技巧等所有细节，不要简化）",
      "usedTools": ["本步骤使用的具体工具/软件/AI"],
      "expectedOutput": "这一步的预期产出/结果（从原文提取）",
      "demonstrationImages": ["如果文章中有步骤演示截图，填写图片序号，如: 图1, 图2"],
      "type": "llm|tool|condition|transform",
      "config": {
        "prompt": "⚠️⚠️⚠️ 最重要！如果原文有提示词，必须完整复制，逐字逐句，一个字都不能少！包括所有角色设定、任务描述、输出要求、注意事项等！",
        "tool": "如果是工具步骤，写明具体工具名称",
        "provider": "AI提供商（OpenAI/Anthropic/Google/Alibaba）",
        "model": "具体模型名称（GPT-4/Claude-3.5/Gemini-Pro/Qwen-Plus）"
      }
    }
  ]
}

## 🔍 工具识别要求（最重要）：
- **仔细阅读全文**，识别所有提到的工具、软件、AI模型、平台
- 常见工具包括但不限于：
  - AI工具：ChatGPT, Claude, Gemini, 通义千问, 文心一言, Midjourney, Stable Diffusion, DALL-E
  - 办公软件：Word, Excel, PPT, Notion, 飞书, 钉钉
  - 设计工具：Figma, Photoshop, Canva
  - 开发工具：GitHub Copilot, Cursor, VS Code
  - 社交平台：小红书, 抖音, 知乎, 微信公众号
- **mainTools字段必须填写**，列出2-5个核心工具
- **每个步骤的usedTools必须填写**，说明该步骤用到的具体工具
- **tags中必须包含所有工具名称**

## 📝 步骤目的提取要求（非常重要）：
- **goal字段是必填的**，每个步骤都必须明确说明目的
- goal要回答："这一步为什么要做？要达到什么效果？"
- 示例：
  ✅ 好的goal: "通过分析竞品笔记，找出高互动率的内容特征和话题方向"
  ❌ 不好的goal: "分析竞品" （太简略，没说明目的）
- **expectedOutput也是必填的**，说明这步完成后会得到什么
- 示例：
  ✅ "得到一份包含10个高热度话题的清单，每个话题标注预估互动量"
  ❌ "话题清单" （太简略）

## 📋 描述详细度要求：
⚠️ **核心原则：尽可能保留原文的完整信息，不要过度简化**

- **workflowDescription**：
  - 优先从文章开头、摘要、介绍部分提取
  - 如果原文有详细说明，尽量保留完整表述（80-200字）
  - 必须包含：最终目标、使用工具、适用场景、核心价值

- **每个步骤的description**（🔴 极其重要）：
  - 📖 **从原文完整提取，不要遗漏任何细节**
  - 不要只写"使用ChatGPT生成内容"这种简略描述

  **必须包含的内容（如果原文有的话）：**
  1. **具体操作步骤**：第一步做什么、第二步做什么、点哪里、选什么
  2. **参数设置**：温度设置、token数量、模型选择等
  3. **技巧提示** ⚠️：
     - 原文中提到的任何"技巧"、"小技巧"、"Pro Tip"、"提示"
     - "如果...可以..."、"建议..."、"最好..."
     - "经验分享"、"避坑指南"
  4. **注意事项** ⚠️：
     - "注意"、"⚠️"、"重要"、"千万不要"
     - "常见错误"、"容易踩坑的地方"
     - "要避免..."、"不要..."
  5. **示例**：如果原文有示例输入输出，完整提取
  6. **预期结果**：这一步完成后应该看到什么

  **提取原则：宁可多不可少，保留所有有用信息**

## 分类规则：
- **办公效率**：周报、邮件、会议纪要、PPT、Excel、时间管理、文档处理等
- **内容创作**：文章写作、视频脚本、社交媒体内容、博客、文案、SEO等
- **设计**：LOGO、海报、UI设计、图片生成、视频剪辑等
- **编程开发**：代码生成、代码审查、调试、自动化脚本、API开发等
- **学习提升**：知识总结、语言学习、思维导图、笔记整理、阅读理解等
- **数据分析**：数据处理、报表生成、可视化、趋势分析、数据清洗等

## 标签要求（3-8个）：
1. **工具类标签**（必须）：文章提到的所有工具名称
2. **应用场景标签**：具体做什么用（如"小红书运营"、"论文写作"）
3. **技术特征标签**：如"提示词工程"、"自动化"、"多轮对话"
4. **目标用户标签**：如"新媒体运营"、"产品经理"、"程序员"

## type字段选择标准：
- "llm": 需要AI理解、生成、分析的步骤（写作、总结、翻译、创意等）
- "tool": 使用具体工具/软件的步骤（搜索、API调用、软件操作）
- "condition": 需要判断/检查的步骤（质量审核、条件分支、数据验证）
- "transform": 数据处理/转换步骤（格式转换、内容整理、数据清洗）

## config.prompt 提示词提取要求（🔴🔴🔴 最高优先级）：
⚠️ **铁律：只要是提示词，就原封不动地复制粘贴！**

**识别提示词的关键词：**
- "提示词"、"Prompt"、"指令"、"Prompts"
- "输入以下内容"、"复制这段话"、"粘贴以下文本"
- "在ChatGPT中输入"、"发送给AI"、"让AI执行"
- 代码块中包含的对话指令
- 引用块中的AI指令

**提取步骤：**
1. **寻找原文中的提示词段落**
   - 从头到尾扫描文章，找到所有标注为"提示词"或类似含义的段落
   - 注意：提示词可能分散在多个地方

2. **完整复制，一字不改**
   - 使用Ctrl+C/Ctrl+V的心态：看到什么就复制什么
   - 包括所有的：
     * 角色设定（"你是..."）
     * 任务描述（"请..."、"帮我..."）
     * 输入占位符（[用户输入]、{变量}）
     * 输出要求（"要求："、"格式："）
     * 注意事项（"注意："、"不要..."）
     * 示例（"示例："、"例如："）
   - 保留原文的：换行、缩进、编号、标点符号、emoji

3. **绝对禁止的操作：**
   - ❌ 概括：不能把300字的prompt概括成"生成文案"
   - ❌ 改写：不能改变任何用词
   - ❌ 优化：不能"改进"原文的prompt
   - ❌ 简化：不能删除"看起来不重要"的部分
   - ❌ 翻译：如果原文是中文就保持中文，是英文就保持英文

4. **如果找不到明确标注的prompt：**
   - 从文章的操作描述中还原完整指令
   - 至少包含200字的详细内容

**示例对比：**

❌ 错误提取（太简略）：
   生成小红书文案

✅ 正确提取（完整详细）：
   你是一位专业的小红书文案策划师，有5年新媒体运营经验。请根据以下主题创作一篇小红书笔记：[用户输入主题]。

   要求：
   1. 标题：15-20字，必须包含1-2个数字和2-3个emoji，使用疑问句或感叹句
   2. 正文：800-1000字，分5-7段，每段2-3句话
   3. 语言风格：口语化、接地气，使用"姐妹们"、"真的绝了"等小红书常用语
   4. 话题标签：文末添加5-8个相关话题，包括热门话题和精准长尾话题
   5. 互动引导：结尾引导点赞收藏，如"觉得有用的姐妹记得点赞收藏哦"

   输出格式：标题、正文（分段）、话题标签

**关键：如果原文有详细的prompt，必须原样复制，一个字都不能少！**

## 📸 图片识别要求：
- 如果文章中提供了图片列表，仔细分析每张图片的描述和位置
- 在demonstrationImages字段中填写对应的图片序号（如["图1", "图3"]）
- 优先匹配步骤演示、界面截图、操作示意图
- 如果某个步骤没有对应图片，demonstrationImages可以为空数组[]

## 质量检查清单：
✅ workflowDescription是否说明了使用的工具
✅ mainTools字段是否已填写
✅ 每个步骤的goal字段是否清晰说明目的
✅ 每个步骤的usedTools是否已标注
✅ 每个步骤的expectedOutput是否已说明
✅ tags是否包含所有工具名称
✅ 步骤之间是否逻辑连贯
✅ 所有字段是否都有实际内容（不能为空）

只返回JSON，不要任何其他文字。确保JSON格式正确可解析。`

    try {
      // 优先使用阿里云百炼API，如果没有配置则使用OpenAI
      const alibabaApiKey = process.env.ALIBABA_API_KEY
      const alibabaBaseUrl = process.env.ALIBABA_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
      const alibabaModel = process.env.ALIBABA_DEFAULT_MODEL || 'qwen-plus'

      const openaiApiKey = apiKey || process.env.OPENAI_API_KEY

      let apiUrl: string
      let apiKeyToUse: string
      let modelToUse: string
      let headers: any

      if (alibabaApiKey) {
        // 使用阿里云百炼API
        console.log('使用阿里云百炼API进行分析')
        apiUrl = `${alibabaBaseUrl}/chat/completions`
        apiKeyToUse = alibabaApiKey
        modelToUse = alibabaModel
        headers = {
          'Authorization': `Bearer ${apiKeyToUse}`,
          'Content-Type': 'application/json'
        }
      } else if (openaiApiKey) {
        // 使用OpenAI API
        console.log('使用OpenAI API进行分析')
        apiUrl = 'https://api.openai.com/v1/chat/completions'
        apiKeyToUse = openaiApiKey
        modelToUse = 'gpt-4o'
        headers = {
          'Authorization': `Bearer ${apiKeyToUse}`,
          'Content-Type': 'application/json'
        }
      } else {
        throw new Error('未配置AI API Key（需要ALIBABA_API_KEY或OPENAI_API_KEY）')
      }

      // 构建请求体
      const requestBody: any = {
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的工作流程分析专家，擅长从文章中提取和抽象工作流程。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      }

      // 只为OpenAI添加response_format参数（阿里云不支持此参数）
      if (!alibabaApiKey && openaiApiKey) {
        requestBody.response_format = { type: 'json_object' }
      }

      console.log(`发送AI请求，模型: ${modelToUse}，内容长度: ${truncatedContent.length}字符`)

      const response = await axios.post(
        apiUrl,
        requestBody,
        {
          headers,
          timeout: 120000 // 增加到120秒
        }
      )

      console.log('AI响应成功')

      let rawContent = response.data.choices[0].message.content

      // 清理 JSON 字符串（移除可能的 markdown 代码块标记）
      rawContent = rawContent.trim()
      if (rawContent.startsWith('```json')) {
        rawContent = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (rawContent.startsWith('```')) {
        rawContent = rawContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      // 尝试解析 JSON
      let result
      try {
        result = JSON.parse(rawContent)
      } catch (parseError: any) {
        console.error('JSON 解析失败，原始内容前500字符：', rawContent.substring(0, 500))
        console.error('JSON 解析失败，错误位置附近：', rawContent.substring(Math.max(0, 4260 - 100), 4260 + 100))
        console.error('解析错误：', parseError.message)

        // 尝试修复常见的 JSON 问题（多层修复策略）
        try {
          let fixed = rawContent

          // 策略1: 移除所有尾部逗号（数组和对象）
          fixed = fixed.replace(/,(\s*[}\]])/g, '$1')

          // 策略2: 修复多余的逗号（连续逗号）
          fixed = fixed.replace(/,\s*,/g, ',')

          // 策略3: 移除控制字符和不可见字符
          fixed = fixed.replace(/[\x00-\x1F\x7F-\x9F]/g, '')

          // 策略4: 修复字符串中的未转义引号
          // 注意：这个比较复杂，暂时跳过

          // 策略5: 确保数组元素之间有逗号
          // 检测模式：} { 之间缺少逗号
          fixed = fixed.replace(/\}\s*\{/g, '},{')

          // 策略6: 移除 JSON 前后的非JSON字符
          const jsonStart = fixed.indexOf('{')
          const jsonEnd = fixed.lastIndexOf('}')
          if (jsonStart !== -1 && jsonEnd !== -1) {
            fixed = fixed.substring(jsonStart, jsonEnd + 1)
          }

          console.log('尝试修复后的JSON前500字符：', fixed.substring(0, 500))
          result = JSON.parse(fixed)
          console.log('✅ JSON 修复成功')
        } catch (fixError: any) {
          console.error('JSON 修复失败：', fixError.message)

          // 最后的容错：返回一个基本的结构，避免完全失败
          console.log('⚠️ 使用降级方案：返回基本结构')
          result = {
            workflowTitle: title,
            workflowDescription: '由于AI返回格式问题，自动生成的基本工作流',
            steps: [
              {
                title: '步骤1',
                prompt: '请根据文章内容完成此步骤',
                model: { brand: 'OpenAI', name: 'GPT-4' },
                usedTools: []
              }
            ],
            category: 'other',
            tags: []
          }
          console.log('使用降级结果')
        }
      }

      // 标准化分类（确保与数据库分类一致）
      const normalizedCategory = ArticleAnalysisService.normalizeCategory(result.category)

      return {
        workflowTitle: result.workflowTitle || title,
        workflowDescription: result.workflowDescription || '从文章中提取的工作流',
        steps: result.steps || [],
        category: normalizedCategory,
        tags: result.tags || []
      }
    } catch (error: any) {
      console.error('AI分析失败:', error.message)
      throw new Error('文章分析失败: ' + error.message)
    }
  }

  /**
   * 标准化分类名称
   */
  private static normalizeCategory(category: string): string {
    if (!category) return '办公效率'

    const categoryMap: Record<string, string> = {
      // 办公效率相关
      '办公效率': '办公效率',
      '办公自动化': '办公效率',
      '效率工具': '办公效率',
      '时间管理': '办公效率',
      'office': '办公效率',
      'productivity': '办公效率',

      // 内容创作相关
      '内容创作': '内容创作',
      '写作': '内容创作',
      '文案': '内容创作',
      '自媒体': '内容创作',
      '视频制作': '内容创作',
      'content': '内容创作',
      'writing': '内容创作',

      // 设计相关
      '设计': '设计',
      'UI设计': '设计',
      '平面设计': '设计',
      '图像生成': '设计',
      'AI绘画': '设计',
      'design': '设计',

      // 编程开发相关
      '编程开发': '编程开发',
      '软件开发': '编程开发',
      '代码生成': '编程开发',
      'coding': '编程开发',
      'development': '编程开发',
      'programming': '编程开发',

      // 学习提升相关
      '学习提升': '学习提升',
      '知识管理': '学习提升',
      '学习': '学习提升',
      '教育': '学习提升',
      'learning': '学习提升',
      'education': '学习提升',

      // 数据分析相关
      '数据分析': '数据分析',
      '数据处理': '数据分析',
      '数据科学': '数据分析',
      'data': '数据分析',
      'analytics': '数据分析'
    }

    // 尝试精确匹配
    const lowerCategory = category.toLowerCase()
    for (const [key, value] of Object.entries(categoryMap)) {
      if (lowerCategory.includes(key.toLowerCase())) {
        return value
      }
    }

    // 默认返回办公效率
    return '办公效率'
  }

  /**
   * 从文本中提取标题
   */
  private static extractTitle(text: string): string {
    const lines = text.split('\n').filter(line => line.trim())
    return lines[0]?.trim() || '未命名文章'
  }

  /**
   * 从HTML中提取标题
   */
  private static extractTitleFromHtml(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    return titleMatch?.[1]?.trim() || '未命名文章'
  }

  /**
   * 移除HTML标签
   */
  private static stripHtml(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * 从内容中提取图片URL
   */
  static extractImagesFromContent(content: string): string[] {
    const images: string[] = []

    // 提取Markdown格式的图片: ![alt](url)
    const markdownImageRegex = /!\[.*?\]\((https?:\/\/[^\)]+)\)/g
    let match
    while ((match = markdownImageRegex.exec(content)) !== null) {
      images.push(match[1])
    }

    // 提取HTML img标签: <img src="url">
    const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/gi
    while ((match = htmlImageRegex.exec(content)) !== null) {
      const imgUrl = match[1]
      // 确保是完整URL
      if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
        images.push(imgUrl)
      }
    }

    // 去重
    return [...new Set(images)]
  }

  /**
   * 🌟 使用 Puppeteer 抓取微信文章内容
   * 通过真实浏览器访问，绕过反爬虫机制
   */
  static async fetchWeixinArticleWithPuppeteer(url: string): Promise<{
    title: string
    content: string
    excerpt: string
    images?: string[]
  }> {
    let browser = null
    try {
      console.log('[Puppeteer] 启动浏览器...')

      // 启动 Puppeteer 浏览器
      browser = await puppeteer.launch({
        headless: true, // 无头模式
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      })

      const page = await browser.newPage()

      // 设置 User-Agent，模拟真实用户
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

      // 设置视口大小
      await page.setViewport({ width: 1920, height: 1080 })

      console.log('[Puppeteer] 访问微信文章:', url)

      // 访问页面，等待加载完成
      await page.goto(url, {
        waitUntil: 'networkidle2', // 等待网络空闲
        timeout: 60000 // 60秒超时
      })

      console.log('[Puppeteer] 页面加载完成，开始提取内容...')

      // 等待文章内容加载（微信文章的主要内容容器）
      await page.waitForSelector('#js_content', { timeout: 10000 })

      // 提取文章信息（在浏览器环境中执行）
      const articleData = await page.evaluate(() => {
        // 在浏览器环境中，document对象可用
        const doc = (globalThis as any).document

        const titleElement = doc.querySelector('#activity-name') ||
                            doc.querySelector('h1') ||
                            doc.querySelector('.rich_media_title')
        const title = titleElement?.textContent?.trim() || '未命名文章'

        // 提取正文内容（微信文章的主要内容区域）
        const contentElement = doc.querySelector('#js_content')
        let content = ''

        if (contentElement) {
          // 获取文本内容，保留段落结构
          const paragraphs = contentElement.querySelectorAll('p, section')
          content = Array.from(paragraphs)
            .map((p: any) => p.textContent?.trim())
            .filter((text: any) => text && text.length > 0)
            .join('\n\n')
        }

        // 如果上面的方法没有获取到内容，尝试获取整个内容区域的文本
        if (!content || content.length < 100) {
          content = contentElement?.textContent?.trim() || ''
        }

        // 提取图片
        const images: string[] = []
        const imgElements = contentElement?.querySelectorAll('img')
        imgElements?.forEach((img: any) => {
          const src = img.getAttribute('data-src') || img.getAttribute('src')
          if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
            images.push(src)
          }
        })

        return {
          title,
          content,
          images: [...new Set(images)] // 去重
        }
      })

      console.log(`[Puppeteer] 成功提取: 标题="${articleData.title.substring(0, 20)}...", 内容长度=${articleData.content.length}字符, 图片=${articleData.images.length}张`)

      // 验证内容是否为空
      if (!articleData.content || articleData.content.length < 100) {
        throw new Error('抓取的内容过短或为空，可能是页面加载不完整')
      }

      return {
        title: articleData.title,
        content: articleData.content,
        excerpt: articleData.content.slice(0, 200),
        images: articleData.images
      }

    } catch (error: any) {
      console.error('[Puppeteer] 抓取失败:', error.message)
      throw new Error(`无法抓取微信文章: ${error.message}`)
    } finally {
      // 确保浏览器关闭
      if (browser) {
        await browser.close()
        console.log('[Puppeteer] 浏览器已关闭')
      }
    }
  }

}

export interface WorkflowStep {
  stepNumber: number
  title: string
  description: string
  type: 'llm' | 'tool' | 'condition' | 'transform'
  config: {
    prompt?: string
    tool?: string
    condition?: string
    [key: string]: any
  }
}
