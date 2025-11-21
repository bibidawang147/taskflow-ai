/**
 * 步骤检测和解析工具
 * 用于识别AI回答中的步骤式解决方案，并生成工作流数据
 */

export interface DetectedStep {
  stepNumber: number
  title: string
  content: string
  rawText: string
}

export interface StepDetectionResult {
  hasSteps: boolean
  steps: DetectedStep[]
  rawStepsText: string
}

/**
 * 检测文本中是否包含步骤式解决方案
 */
export function detectStepsInText(text: string): StepDetectionResult {
  const lines = text.split('\n')
  const steps: DetectedStep[] = []

  // 步骤模式匹配规则（更严格，避免误匹配）
  const stepPatterns = [
    // Markdown粗体格式：**第一步：xxx** 或 **第一步 xxx**
    /^\*\*第([一二三四五六七八九十百]+)步[：:、]?\s*(.+?)\*\*/,
    // Markdown粗体格式：**步骤1：xxx**（必须包含"步骤"关键词）
    /^\*\*步骤\s*(\d+)[、.．。：:]\s*(.+?)\*\*/,
    // 纯文本：第一步：xxx 或 第一步 xxx（必须以"第"开头）
    /^第([一二三四五六七八九十百]+)步[：:、]?\s*(.+)/,
    // 纯文本：步骤1. xxx（必须包含"步骤"关键词）
    /^步骤\s*(\d+)[、.．。：:]\s*(.+)/,
    // 英文：Step 1: xxx（必须包含"Step"关键词）
    /^Step\s*(\d+)[、.．。：:]\s*(.+)/i,
    // Markdown标题：## 步骤1. xxx（必须包含"步骤"关键词）
    /^##\s*步骤\s*(\d+)[、.．。：:]\s*(.+)/,
    // Markdown标题：## 第一步：xxx
    /^##\s*第([一二三四五六七八九十百]+)步[：:、]?\s*(.+)/,
  ]

  let currentStep: DetectedStep | null = null
  let stepNumber = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // 检查是否匹配步骤模式
    let matched = false
    for (const pattern of stepPatterns) {
      const match = line.match(pattern)
      if (match) {
        // 保存上一个步骤
        if (currentStep) {
          steps.push(currentStep)
        }

        // 解析步骤编号
        const numStr = match[1]
        const parsedNum = parseChineseNumber(numStr) || parseInt(numStr, 10)
        stepNumber = parsedNum

        // 提取标题和内容（去除可能的Markdown标记）
        let titleAndContent = match[2].trim()
        // 去除尾部的 **
        titleAndContent = titleAndContent.replace(/\*\*$/, '')

        currentStep = {
          stepNumber,
          title: titleAndContent,
          content: '',
          rawText: line
        }
        matched = true
        break
      }
    }

    // 如果不是新步骤且当前有步骤在收集，则追加内容
    if (!matched && currentStep && line) {
      // 累积步骤的内容
      currentStep.content += (currentStep.content ? '\n' : '') + line
      currentStep.rawText += '\n' + line
    }
  }

  // 保存最后一个步骤
  if (currentStep) {
    steps.push(currentStep)
  }

  // 至少需要3个步骤才算有效（避免误判）
  const hasSteps = steps.length >= 3

  console.log('🔍 步骤检测详情：', {
    输入文本行数: lines.length,
    检测到的步骤数: steps.length,
    步骤详情: steps.map(s => ({
      编号: s.stepNumber,
      标题: s.title,
      内容长度: s.content.length
    })),
    判定结果: hasSteps ? '✅ 有效' : '❌ 无效（少于2步）'
  })

  return {
    hasSteps,
    steps,
    rawStepsText: steps.map(s => s.rawText).join('\n\n')
  }
}

/**
 * 将中文数字转换为阿拉伯数字
 */
function parseChineseNumber(chinese: string): number | null {
  const chineseNums: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15
  }

  // 直接匹配
  if (chineseNums[chinese]) {
    return chineseNums[chinese]
  }

  // 处理"十X"格式
  if (chinese.startsWith('十') && chinese.length > 1) {
    const unit = chinese.substring(1)
    if (chineseNums[unit]) {
      return 10 + chineseNums[unit]
    }
  }

  return null
}

/**
 * 将检测到的步骤转换为工作流数据结构
 */
export function convertStepsToWorkflowData(
  steps: DetectedStep[],
  originalQuestion: string
) {
  const workflowSteps = steps.map((step, index) => {
    // 提取步骤标题（去除多余的标点和格式）
    let title = step.title
    // 如果标题太长，截取前50个字符
    if (title.length > 50) {
      const firstLine = title.split('\n')[0]
      title = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine
    }

    // 构建提示词：包含标题和详细内容
    const prompt = step.content
      ? `${step.title}\n\n${step.content}`.trim()
      : step.title

    return {
      id: `step_${Date.now()}_${index}_${Math.random()}`,
      title: title,
      prompt: prompt,
      model: {
        brand: 'OpenAI',
        name: 'GPT-4',
        url: ''
      },
      alternativeModels: [
        { brand: '', name: 'ChatGPT', url: '' }
      ],
      advancedSettings: {
        temperature: 0.7,
        maxTokens: 2000
      },
      showAdvanced: false,
      demonstrationImages: []
    }
  })

  // 生成工作流标题
  const workflowTitle = generateWorkflowTitle(originalQuestion, steps)

  // 生成工作流描述
  const workflowDescription = generateWorkflowDescription(originalQuestion, steps)

  return {
    title: workflowTitle,
    description: workflowDescription,
    tags: extractTagsFromSteps(steps),
    steps: workflowSteps,
    category: 'general',
    isPublic: true,
    associatedSolutions: [],
    associatedThemes: [],
    sourceType: 'ai-chat',
    sourceContent: steps.map(s => s.rawText).join('\n\n')
  }
}

/**
 * 生成工作流标题
 */
function generateWorkflowTitle(question: string, steps: DetectedStep[]): string {
  // 尝试从问题中提取关键词
  const questionCleaned = question
    .replace(/^(请问|怎么|如何|怎样|帮我|帮忙|能不能|可以|可否)/g, '')
    .trim()

  // 限制长度
  if (questionCleaned.length > 30) {
    return questionCleaned.substring(0, 30) + '...'
  }

  return questionCleaned || `${steps.length}步工作流程`
}

/**
 * 生成工作流描述
 */
function generateWorkflowDescription(question: string, steps: DetectedStep[]): string {
  const stepTitles = steps.map((s, i) => `${i + 1}. ${s.title}`).join('\n')
  return `根据问题"${question}"自动生成的工作流程，包含${steps.length}个步骤：\n\n${stepTitles}`
}

/**
 * 从步骤中提取标签
 */
function extractTagsFromSteps(steps: DetectedStep[]): string[] {
  const tags: string[] = []
  const keywordMap: Record<string, string> = {
    '文案': '文案创作',
    '写作': '内容创作',
    '文章': '内容创作',
    '小红书': '社交媒体',
    '抖音': '短视频',
    '公众号': '微信营销',
    '设计': '设计',
    '海报': '设计',
    '图片': '图像处理',
    '数据': '数据分析',
    '分析': '数据分析',
    'SEO': 'SEO优化',
    '优化': '优化',
    '邮件': '邮件营销',
    '客服': '客户服务',
  }

  const allText = steps.map(s => s.title + ' ' + s.content).join(' ')

  for (const [keyword, tag] of Object.entries(keywordMap)) {
    if (allText.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag)
    }
  }

  // 至少返回一个默认标签
  if (tags.length === 0) {
    tags.push('AI生成')
  }

  return tags.slice(0, 5) // 最多5个标签
}
