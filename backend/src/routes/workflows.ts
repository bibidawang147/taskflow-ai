import { Router } from 'express'
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth'
import { Response } from 'express'
import prisma from '../utils/database'
import { WorkflowTemplateService } from '../services/workflowTemplateService'
import { ArticleAnalysisService } from '../services/articleAnalysisService'
import { MockArticleAnalysisService } from '../services/mockArticleAnalysisService'
import { WorkflowExecutionService } from '../services/workflowExecutionService'
import { contentAnalysisService, ContentType } from '../services/contentAnalysis.service'
import { fileStorageService } from '../services/fileStorage.service'
import multer from 'multer'

const router = Router()

// 配置文件上传（内存存储）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    // 允许的文件类型
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ]

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`))
    }
  },
})

// 获取公开的工作流列表（不需要认证）
router.get('/', async (req, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const category = req.query.category as string
    const search = req.query.search as string

    const where: any = { isPublic: true }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const workflows = await prisma.workflow.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        category: true,
        tags: true,
        version: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            executions: true,
            ratings: true,
            favorites: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.workflow.count({ where })

    res.status(200).json({
      workflows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取工作流列表错误:', error)
    res.status(500).json({
      error: '获取工作流列表失败'
    })
  }
})

// ==================== 工具管理 ====================
// 注意：这些路由必须放在 /:id 路由之前，否则 /tools 会被当作 id 处理

/**
 * 获取所有可用工具列表
 * GET /api/workflows/tools
 */
router.get('/tools', (_req, res: Response) => {
  try {
    // 延迟加载工具注册表
    const { toolRegistry } = require('../tools')

    const allMetadata = toolRegistry.getAllMetadata()

    res.status(200).json({
      success: true,
      count: allMetadata.length,
      tools: allMetadata
    })
  } catch (error) {
    console.error('获取工具列表错误:', error)
    res.status(500).json({
      success: false,
      error: '获取工具列表失败'
    })
  }
})

/**
 * 获取特定工具的详细信息
 * GET /api/workflows/tools/:toolName
 */
router.get('/tools/:toolName', (req, res: Response) => {
  try {
    const { toolName } = req.params

    // 延迟加载工具注册表
    const { toolRegistry } = require('../tools')

    const metadata = toolRegistry.getMetadata(toolName)

    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: `工具 "${toolName}" 不存在`
      })
    }

    res.status(200).json({
      success: true,
      tool: metadata
    })
  } catch (error) {
    console.error('获取工具详情错误:', error)
    res.status(500).json({
      success: false,
      error: '获取工具详情失败'
    })
  }
})

// 获取当前用户的工作流列表（需要认证）
router.get('/my', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const workflows = await prisma.workflow.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        category: true,
        tags: true,
        isDraft: true,
        isPublic: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        config: true,
        _count: {
          select: {
            executions: true,
            ratings: true,
            favorites: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    res.status(200).json({ workflows })
  } catch (error) {
    console.error('获取用户工作流列表错误:', error)
    res.status(500).json({
      error: '获取工作流列表失败'
    })
  }
})

// 获取工作流详情（不需要认证）
router.get('/:id', async (req, res: Response) => {
  try {
    const { id } = req.params

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        nodes: true,
        ratings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            executions: true,
            favorites: true
          }
        }
      }
    })

    if (!workflow) {
      return res.status(404).json({
        error: '工作流不存在'
      })
    }

    // 检查是否为私有工作流
    if (!workflow.isPublic) {
      return res.status(403).json({
        error: '无权访问此工作流'
      })
    }

    res.status(200).json({
      workflow
    })
  } catch (error) {
    console.error('获取工作流详情错误:', error)
    res.status(500).json({
      error: '获取工作流详情失败'
    })
  }
})

// 创建工作流（需要认证）
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const {
      title,
      description,
      category,
      tags,
      config,
      isPublic = false,
      sourceType,
      sourceUrl,
      sourceContent,
      sourceTitle,
      exampleInput,
      exampleOutput
    } = req.body

    // 如果config中有nodes，同时创建WorkflowNode记录
    const nodes = config?.nodes || []

    const workflow = await prisma.workflow.create({
      data: {
        title,
        description,
        category,
        tags: Array.isArray(tags) ? tags.join(',') : (tags || null),
        config,
        isPublic,
        authorId: userId,
        // 保存原始来源信息
        sourceType: sourceType || null,
        sourceUrl: sourceUrl || null,
        sourceContent: sourceContent || null,
        sourceTitle: sourceTitle || null,
        // 保存示例执行数据
        exampleInput: exampleInput || null,
        exampleOutput: exampleOutput || null,
        // 同时创建节点记录
        nodes: {
          create: nodes.map((node: any) => ({
            id: node.id,
            type: node.type,
            label: node.label,
            position: node.position || { x: 0, y: 0 },
            config: node.config || {}
          }))
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        nodes: true
      }
    })

    res.status(201).json({
      message: '工作流创建成功',
      workflow
    })
  } catch (error) {
    console.error('创建工作流错误:', error)
    res.status(500).json({
      error: '创建工作流失败'
    })
  }
})

// 收藏工作流（需要认证）
router.post('/:id/favorite', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id: workflowId } = req.params

    // 检查工作流是否存在
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    })

    if (!workflow) {
      return res.status(404).json({
        error: '工作流不存在'
      })
    }

    // 检查是否已经收藏
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_workflowId: {
          userId,
          workflowId
        }
      }
    })

    if (existingFavorite) {
      return res.status(400).json({
        error: '已经收藏过此工作流'
      })
    }

    // 创建收藏
    await prisma.favorite.create({
      data: {
        userId,
        workflowId
      }
    })

    res.status(201).json({
      message: '收藏成功'
    })
  } catch (error) {
    console.error('收藏工作流错误:', error)
    res.status(500).json({
      error: '收藏工作流失败'
    })
  }
})

// 取消收藏工作流（需要认证）
router.delete('/:id/favorite', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id: workflowId } = req.params

    // 检查收藏是否存在
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_workflowId: {
          userId,
          workflowId
        }
      }
    })

    if (!favorite) {
      return res.status(404).json({
        error: '未收藏此工作流'
      })
    }

    // 删除收藏
    await prisma.favorite.delete({
      where: {
        id: favorite.id
      }
    })

    res.status(200).json({
      message: '取消收藏成功'
    })
  } catch (error) {
    console.error('取消收藏工作流错误:', error)
    res.status(500).json({
      error: '取消收藏工作流失败'
    })
  }
})

// 克隆工作流到用户账户（需要认证）
router.post('/:id/clone', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id: workflowId } = req.params
    const { customTitle } = req.body // 可选：自定义标题

    // 1. 获取原工作流的完整信息
    const originalWorkflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    if (!originalWorkflow) {
      return res.status(404).json({
        error: '工作流不存在'
      })
    }

    // 2. 检查用户是否已经克隆过（避免重复克隆相同工作流）
    const existingClone = await prisma.workflow.findFirst({
      where: {
        authorId: userId,
        title: {
          contains: originalWorkflow.title
        },
        createdAt: {
          gte: new Date(Date.now() - 60000) // 1分钟内
        }
      }
    })

    if (existingClone) {
      // 如果最近已克隆过，直接返回已有的克隆
      return res.status(200).json({
        message: '工作流已存在',
        workflow: existingClone,
        isExisting: true
      })
    }

    // 3. 生成新的标题
    const clonedTitle = customTitle || `${originalWorkflow.title} (我的副本)`

    // 4. 创建工作流副本
    const clonedWorkflow = await prisma.workflow.create({
      data: {
        title: clonedTitle,
        description: originalWorkflow.description,
        thumbnail: originalWorkflow.thumbnail,
        category: originalWorkflow.category,
        tags: originalWorkflow.tags,
        version: '1.0.0', // 重置版本号
        config: JSON.parse(JSON.stringify(originalWorkflow.config)), // 深拷贝配置
        isPublic: false, // 克隆的工作流默认为私有
        isTemplate: false,
        authorId: userId, // 设置为当前用户
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    res.status(201).json({
      message: '工作流克隆成功',
      workflow: clonedWorkflow,
      originalWorkflow: {
        id: originalWorkflow.id,
        title: originalWorkflow.title,
        author: originalWorkflow.author
      }
    })
  } catch (error) {
    console.error('克隆工作流错误:', error)
    res.status(500).json({
      error: '克隆工作流失败',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 从文章URL或文本生成智能工作流（需要认证）
router.post('/generate/from-article', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { url, content, title, autoSave = true } = req.body

    // 验证输入：必须提供url或content之一
    if (!url && !content) {
      return res.status(400).json({
        error: '必须提供url或content参数'
      })
    }

    let articleData: { title: string; content: string; url?: string; images?: string[] }

    // 如果提供了content，直接使用
    if (content) {
      console.log('使用直接提供的文章内容')
      articleData = {
        title: title || '未命名文章',
        content: content.trim(),
        images: []
      }
    } else {
      // 如果只提供了URL，需要抓取
      // URL格式验证
      try {
        new URL(url)
      } catch {
        return res.status(400).json({
          error: '无效的URL格式'
        })
      }

      console.log('开始抓取文章:', url)

      // 步骤1: 抓取文章内容
      try {
        articleData = await ArticleAnalysisService.fetchArticleContent(url)
        articleData.url = url
        console.log('文章抓取成功:', articleData.title)
      } catch (error: any) {
        console.error('抓取文章失败:', error)
        return res.status(400).json({
          error: '无法抓取文章内容: ' + error.message
        })
      }
    }

    // 步骤2: 使用AI分析文章并提取工作流
    let analysisResult
    try {
      analysisResult = await ArticleAnalysisService.analyzeArticleAndExtractWorkflow(
        articleData.title,
        articleData.content,
        process.env.OPENAI_API_KEY
      )
      console.log('AI分析成功，提取了', analysisResult.steps.length, '个步骤')
    } catch (error: any) {
      console.error('AI分析失败:', error)
      return res.status(500).json({
        error: '文章分析失败: ' + error.message
      })
    }

    // 步骤3: 根据分析结果生成工作流配置
    const workflowConfig = WorkflowTemplateService.generateDynamicWorkflow(
      analysisResult.steps,
      articleData.url || 'direct-content'
    )

    console.log('工作流生成成功，包含', workflowConfig.nodes.length, '个节点')

    // 如果需要自动保存，则创建工作流
    if (autoSave) {
      const workflow = await prisma.workflow.create({
        data: {
          title: analysisResult.workflowTitle,
          description: analysisResult.workflowDescription,
          category: analysisResult.category,
          tags: analysisResult.tags.join(','),
          config: JSON.parse(JSON.stringify(workflowConfig)),
          isPublic: false, // 默认私有
          authorId: userId,
          version: '1.0.0'
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      })

      return res.status(201).json({
        message: '工作流创建成功',
        workflow,
        analysis: {
          articleTitle: articleData.title,
          articleContent: content ? articleData.content : undefined, // 如果是直接文本，返回内容
          sourceUrl: articleData.url,
          stepsExtracted: analysisResult.steps.length,
          category: analysisResult.category,
          tags: analysisResult.tags
        }
      })
    }

    // 如果不自动保存，只返回配置
    res.status(200).json({
      message: '工作流配置生成成功',
      config: workflowConfig,
      metadata: {
        title: analysisResult.workflowTitle,
        description: analysisResult.workflowDescription,
        category: analysisResult.category,
        tags: analysisResult.tags
      },
      analysis: {
        articleTitle: articleData.title,
        articleContent: content ? articleData.content : undefined, // 如果是直接文本，返回内容
        sourceUrl: articleData.url,
        stepsExtracted: analysisResult.steps.length
      }
    })
  } catch (error: any) {
    console.error('生成工作流错误:', error)
    res.status(500).json({
      error: '生成工作流失败: ' + (error.message || '未知错误')
    })
  }
})

// 解析文章内容，返回工作流数据（用于前端预填充）
router.post('/parse-article', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, content, url, images, videos } = req.body

    // 验证输入
    if (type === 'content' && !content) {
      return res.status(400).json({ error: '请提供文章内容' })
    }
    if (type === 'url' && !url) {
      return res.status(400).json({ error: '请提供文章URL' })
    }

    // 记录接收到的媒体信息
    if (images && images.length > 0) {
      console.log(`[解析文章] 接收到 ${images.length} 张粘贴的图片`)
    }
    if (videos && videos.length > 0) {
      console.log(`[解析文章] 接收到 ${videos.length} 个粘贴的视频`)
    }

    let articleData: { title: string; content: string; url?: string; images?: string[] }

    // 根据类型获取文章内容
    if (type === 'content') {
      console.log('[解析文章] 使用直接提供的内容')
      articleData = {
        title: '未命名文章',
        content: content.trim(),
        images: []
      }
    } else {
      // 验证URL格式
      try {
        new URL(url)
      } catch {
        return res.status(400).json({ error: '无效的URL格式' })
      }

      console.log('[解析文章] 抓取URL:', url)
      try {
        articleData = await ArticleAnalysisService.fetchArticleContent(url)
        articleData.url = url
        console.log('[解析文章] 抓取成功:', articleData.title)
      } catch (error: any) {
        console.error('[解析文章] 抓取失败:', error)
        return res.status(400).json({
          error: '无法抓取文章内容: ' + error.message
        })
      }
    }

    // 提取图片URL
    console.log('[解析文章] 开始处理图片...')
    const extractedImageUrls = articleData.images || []
    if (extractedImageUrls.length > 0) {
      console.log(`[解析文章] 发现${extractedImageUrls.length}张图片`)
    }

    // 使用AI分析文章并提取工作流
    console.log('[解析文章] 开始AI分析...')
    let analysisResult
    try {
      analysisResult = await ArticleAnalysisService.analyzeArticleAndExtractWorkflow(
        articleData.title,
        articleData.content,
        process.env.OPENAI_API_KEY,
        extractedImageUrls
      )
      console.log('[解析文章] AI分析成功，提取了', analysisResult.steps.length, '个步骤')
    } catch (error: any) {
      console.error('[解析文章] AI分析失败:', error)
      return res.status(500).json({
        error: '文章分析失败: ' + error.message
      })
    }

    // 转换为前端需要的格式
    const steps = analysisResult.steps.map((step: any) => {
      // 组合完整的prompt信息
      const promptParts = []

      // 1. 核心prompt（AI生成的详细指令）
      const corePrompt = step.config?.prompt || step.prompt || ''
      if (corePrompt) {
        promptParts.push(corePrompt)
      }

      // 2. 如果没有详细prompt，则组合其他信息
      if (!corePrompt || corePrompt.length < 100) {
        const contextParts = []

        if (step.goal) {
          contextParts.push(`【本步骤目的】\n${step.goal}`)
        }

        if (step.description) {
          contextParts.push(`【操作说明】\n${step.description}`)
        }

        if (step.usedTools && step.usedTools.length > 0) {
          contextParts.push(`【使用工具】\n${step.usedTools.join('、')}`)
        }

        if (step.expectedOutput) {
          contextParts.push(`【预期输出】\n${step.expectedOutput}`)
        }

        if (contextParts.length > 0) {
          promptParts.push(...contextParts)
        }
      }

      const fullPrompt = promptParts.join('\n\n')

      // 处理步骤中的演示图片（使用URL）
      const stepImages: string[] = []

      if (step.demonstrationImages && Array.isArray(step.demonstrationImages)) {
        step.demonstrationImages.forEach((imgRef: string) => {
          // imgRef like "图1", "图2"
          const match = imgRef.match(/图(\d+)/)
          if (match) {
            const imgIndex = parseInt(match[1]) - 1
            if (imgIndex >= 0 && imgIndex < extractedImageUrls.length) {
              stepImages.push(extractedImageUrls[imgIndex])
            }
          }
        })
      }

      return {
        title: step.title || step.goal || step.label || '未命名步骤',
        prompt: fullPrompt,
        model: {
          brand: step.config?.provider || 'OpenAI',
          name: step.config?.model || 'GPT-4',
          url: ''
        },
        alternativeModels: step.config?.alternativeModels || [],
        temperature: step.config?.temperature || 0.7,
        maxTokens: step.config?.maxTokens || 2000,
        demonstrationImages: stepImages,  // 添加演示图片
        tools: step.usedTools || []  // ✅ 添加使用的工具列表
      }
    })

    res.status(200).json({
      title: analysisResult.workflowTitle,
      description: analysisResult.workflowDescription,
      tags: analysisResult.tags || [],
      steps: steps
    })
  } catch (error: any) {
    console.error('[解析文章] 错误:', error)
    res.status(500).json({
      error: '解析文章失败: ' + (error.message || '未知错误')
    })
  }
})

// 🧪 解析文章内容（Mock模式）- 用于测试，无需真实API Key
router.post('/parse-article-mock', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, content, url } = req.body

    console.log('🧪 [Mock模式] 解析文章请求:', { type, hasContent: !!content, url })

    // 验证输入
    if (type === 'content' && !content) {
      return res.status(400).json({ error: '请提供文章内容' })
    }
    if (type === 'url' && !url) {
      return res.status(400).json({ error: '请提供文章URL' })
    }

    let articleData: { title: string; content: string; url?: string; images?: string[] }

    // 根据类型获取文章内容
    if (type === 'content') {
      console.log('🧪 [Mock模式] 使用直接提供的内容，长度:', content.length)
      articleData = {
        title: '未命名文章',
        content: content.trim(),
        images: []
      }
    } else {
      console.log('🧪 [Mock模式] 模拟抓取URL:', url)
      articleData = await MockArticleAnalysisService.fetchArticleContent(url)
      articleData.url = url
      console.log('🧪 [Mock模式] 抓取成功:', articleData.title)
    }

    // 提取图片（Mock模式暂时没有图片）
    const articleImages = articleData.images || []

    // 使用Mock服务分析文章
    console.log('🧪 [Mock模式] 开始AI分析...')
    const analysisResult = await MockArticleAnalysisService.analyzeArticleAndExtractWorkflow(
      articleData.title,
      articleData.content
    )
    console.log('🧪 [Mock模式] AI分析成功，提取了', analysisResult.steps.length, '个步骤')

    // 转换为前端需要的格式
    const steps = analysisResult.steps.map((step: any) => {
      // 组合完整的prompt信息
      const promptParts = []

      // 1. 核心prompt（AI生成的详细指令）
      const corePrompt = step.config?.prompt || step.prompt || ''
      if (corePrompt) {
        promptParts.push(corePrompt)
      }

      // 2. 如果没有详细prompt，则组合其他信息
      if (!corePrompt || corePrompt.length < 100) {
        const contextParts = []

        if (step.goal) {
          contextParts.push(`【本步骤目的】\n${step.goal}`)
        }

        if (step.description) {
          contextParts.push(`【操作说明】\n${step.description}`)
        }

        if (step.usedTools && step.usedTools.length > 0) {
          contextParts.push(`【使用工具】\n${step.usedTools.join('、')}`)
        }

        if (step.expectedOutput) {
          contextParts.push(`【预期输出】\n${step.expectedOutput}`)
        }

        if (contextParts.length > 0) {
          promptParts.push(...contextParts)
        }
      }

      const fullPrompt = promptParts.join('\n\n')

      // 处理步骤中的演示图片（Mock模式使用空数组）
      const stepImages: string[] = []
      // Mock模式暂不支持图片，未来可扩展
      if (step.demonstrationImages && Array.isArray(step.demonstrationImages) && articleImages.length > 0) {
        step.demonstrationImages.forEach((imgRef: string) => {
          // imgRef like "图1", "图2"
          const match = imgRef.match(/图(\d+)/)
          if (match) {
            const imgIndex = parseInt(match[1]) - 1
            if (imgIndex >= 0 && imgIndex < articleImages.length) {
              stepImages.push(articleImages[imgIndex])
            }
          }
        })
      }

      return {
        title: step.title || step.goal || step.label || '未命名步骤',
        prompt: fullPrompt,
        model: {
          brand: step.config?.provider || 'OpenAI',
          name: step.config?.model || 'GPT-4',
          url: ''
        },
        alternativeModels: step.config?.alternativeModels || [],
        temperature: step.config?.temperature || 0.7,
        maxTokens: step.config?.maxTokens || 2000,
        demonstrationImages: stepImages  // 添加演示图片
      }
    })

    res.status(200).json({
      title: analysisResult.workflowTitle,
      description: analysisResult.workflowDescription,
      tags: analysisResult.tags || [],
      steps: steps
    })
  } catch (error: any) {
    console.error('🧪 [Mock模式] 错误:', error)
    res.status(500).json({
      error: '解析文章失败: ' + (error.message || '未知错误')
    })
  }
})

// 🧪 从文章URL或文本生成智能工作流 - 模拟模式（用于测试，无需OpenAI API Key）
router.post('/generate/from-article-mock', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { url, content, title, autoSave = true } = req.body

    // 验证输入：必须提供url或content之一
    if (!url && !content) {
      return res.status(400).json({
        error: '必须提供url或content参数'
      })
    }

    let articleData: { title: string; content: string; url?: string; images?: string[] }

    // 如果提供了content，直接使用
    if (content) {
      console.log('🧪 [测试模式] 使用直接提供的文章内容')
      articleData = {
        title: title || '未命名文章',
        content: content.trim(),
        images: []
      }
    } else {
      // 如果只提供了URL，需要抓取
      // URL格式验证
      try {
        new URL(url)
      } catch {
        return res.status(400).json({
          error: '无效的URL格式'
        })
      }

      console.log('🧪 [测试模式] 开始处理文章:', url)

      // 步骤1: 模拟抓取文章内容
      try {
        articleData = await MockArticleAnalysisService.fetchArticleContent(url)
        articleData.url = url
        console.log('🧪 [测试模式] 文章抓取成功:', articleData.title)
      } catch (error: any) {
        console.error('🧪 [测试模式] 抓取文章失败:', error)
        return res.status(400).json({
          error: '无法抓取文章内容: ' + error.message
        })
      }
    }

    // 步骤2: 模拟AI分析文章并提取工作流
    let analysisResult
    try {
      analysisResult = await MockArticleAnalysisService.analyzeArticleAndExtractWorkflow(
        articleData.title,
        articleData.content
      )
      console.log('🧪 [测试模式] AI分析成功，提取了', analysisResult.steps.length, '个步骤')
    } catch (error: any) {
      console.error('🧪 [测试模式] AI分析失败:', error)
      return res.status(500).json({
        error: '文章分析失败: ' + error.message
      })
    }

    // 步骤3: 根据分析结果生成工作流配置
    const workflowConfig = WorkflowTemplateService.generateDynamicWorkflow(
      analysisResult.steps,
      articleData.url || 'direct-content'
    )

    console.log('🧪 [测试模式] 工作流生成成功，包含', workflowConfig.nodes.length, '个节点')

    // 如果需要自动保存，则创建工作流
    if (autoSave) {
      const workflow = await prisma.workflow.create({
        data: {
          title: `[测试] ${analysisResult.workflowTitle}`,
          description: `${analysisResult.workflowDescription} (模拟模式生成)`,
          category: analysisResult.category,
          tags: analysisResult.tags.join(','),
          config: JSON.parse(JSON.stringify(workflowConfig)),
          isPublic: false, // 默认私有
          authorId: userId,
          version: '1.0.0'
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      })

      return res.status(201).json({
        message: '工作流创建成功（测试模式）',
        workflow,
        analysis: {
          articleTitle: articleData.title,
          articleContent: content ? articleData.content : undefined,
          sourceUrl: articleData.url,
          stepsExtracted: analysisResult.steps.length,
          category: analysisResult.category,
          tags: analysisResult.tags
        },
        testMode: true
      })
    }

    // 如果不自动保存，只返回配置
    res.status(200).json({
      message: '工作流配置生成成功（测试模式）',
      config: workflowConfig,
      metadata: {
        title: analysisResult.workflowTitle,
        description: analysisResult.workflowDescription,
        category: analysisResult.category,
        tags: analysisResult.tags
      },
      analysis: {
        articleTitle: articleData.title,
        articleContent: content ? articleData.content : undefined,
        sourceUrl: articleData.url,
        stepsExtracted: analysisResult.steps.length
      },
      testMode: true
    })
  } catch (error: any) {
    console.error('🧪 [测试模式] 生成工作流错误:', error)
    res.status(500).json({
      error: '生成工作流失败: ' + (error.message || '未知错误')
    })
  }
})

// 🚀 统一的成果逆向生成工作流（支持图片、视频等）
router.post('/generate/from-content', authenticateToken, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { contentType, url, text, autoSave = true } = req.body
    const file = req.file

    // 验证输入：必须提供file、url或text之一
    if (!file && !url && !text) {
      return res.status(400).json({
        error: '必须提供文件、URL或文本内容'
      })
    }

    // 确定内容类型
    let type: ContentType
    let data: string | Buffer
    let filename: string | undefined
    let mimeType: string | undefined

    if (file) {
      // 文件上传
      data = file.buffer
      filename = file.originalname
      mimeType = file.mimetype

      if (mimeType.startsWith('image/')) {
        type = 'image'
      } else if (mimeType.startsWith('video/')) {
        type = 'video'
      } else if (mimeType === 'application/pdf') {
        type = 'pdf'
      } else if (mimeType.includes('presentation')) {
        type = 'ppt'
      } else {
        type = 'code'
      }
    } else if (url) {
      // URL
      type = 'url'
      data = url
    } else {
      // 文本
      type = 'text'
      data = text
      filename = '文本内容'
    }

    // 如果用户指定了contentType，使用用户指定的
    if (contentType) {
      type = contentType as ContentType
    }

    console.log(`开始分析内容，类型: ${type}, 文件名: ${filename || 'N/A'}`)

    // 调用统一的内容分析服务
    let analysisResult
    try {
      analysisResult = await contentAnalysisService.analyzeContent({
        type,
        data,
        filename,
        mimeType,
      })
      console.log('AI分析成功，提取了', analysisResult.steps.length, '个步骤')
    } catch (error: any) {
      console.error('内容分析失败:', error)
      return res.status(500).json({
        error: '内容分析失败: ' + error.message
      })
    }

    // 生成工作流配置
    const workflowConfig = WorkflowTemplateService.generateDynamicWorkflow(
      analysisResult.steps,
      url || filename || 'uploaded-content'
    )

    // 保存文件（如果是上传的文件）
    let savedFilePath: string | undefined
    let savedFileUrl: string | undefined
    let sourceMeta: any = undefined

    if (file) {
      try {
        const category = type === 'image' ? 'images' : type === 'video' ? 'videos' : 'documents'
        const uploadedFile = await fileStorageService.saveFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          category
        )
        savedFilePath = uploadedFile.path
        savedFileUrl = uploadedFile.url

        // 提取文件元数据
        sourceMeta = await fileStorageService.extractMetadata(
          file.buffer,
          file.originalname,
          file.mimetype
        )

        console.log('文件保存成功:', savedFileUrl)
      } catch (error: any) {
        console.error('文件保存失败:', error)
        // 不阻止工作流创建，只是不保存文件
      }
    }

    // 如果需要自动保存，则创建工作流
    if (autoSave) {
      const workflow = await prisma.workflow.create({
        data: {
          title: analysisResult.workflowTitle,
          description: analysisResult.workflowDescription,
          category: analysisResult.category,
          tags: analysisResult.tags.join(','),
          config: JSON.parse(JSON.stringify(workflowConfig)),
          isPublic: false,
          authorId: userId,
          version: '1.0.0',
          // 保存来源信息
          sourceType: type,
          sourceUrl: url || savedFileUrl || null,
          sourceTitle: analysisResult.sourceTitle,
          sourceFilePath: savedFilePath || null,
          sourceMeta: sourceMeta || null,
          sourceContent: type === 'text' ? text : null,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      })

      return res.status(201).json({
        message: '工作流创建成功',
        workflow,
        analysis: {
          sourceType: type,
          sourceTitle: analysisResult.sourceTitle,
          sourceDescription: analysisResult.sourceDescription,
          category: analysisResult.category,
          complexity: analysisResult.complexity,
          estimatedTime: analysisResult.estimatedTime,
          stepsExtracted: analysisResult.steps.length,
          tags: analysisResult.tags,
          fileUrl: savedFileUrl,
        }
      })
    }

    // 如果不自动保存，只返回配置
    res.status(200).json({
      message: '工作流配置生成成功',
      config: workflowConfig,
      metadata: {
        title: analysisResult.workflowTitle,
        description: analysisResult.workflowDescription,
        category: analysisResult.category,
        tags: analysisResult.tags
      },
      analysis: {
        sourceType: type,
        sourceTitle: analysisResult.sourceTitle,
        sourceDescription: analysisResult.sourceDescription,
        complexity: analysisResult.complexity,
        estimatedTime: analysisResult.estimatedTime,
        stepsExtracted: analysisResult.steps.length,
        fileUrl: savedFileUrl,
      }
    })
  } catch (error: any) {
    console.error('生成工作流错误:', error)
    res.status(500).json({
      error: '生成工作流失败: ' + (error.message || '未知错误')
    })
  }
})

// 🧪 统一的成果逆向生成工作流 - Mock模式
router.post('/generate/from-content-mock', authenticateToken, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { contentType, url, text, autoSave = true } = req.body
    const file = req.file

    // 验证输入
    if (!file && !url && !text) {
      return res.status(400).json({
        error: '必须提供文件、URL或文本内容'
      })
    }

    // 确定内容类型
    let type: ContentType
    let filename: string | undefined

    if (file) {
      filename = file.originalname
      const mimeType = file.mimetype

      if (mimeType.startsWith('image/')) {
        type = 'image'
      } else if (mimeType.startsWith('video/')) {
        type = 'video'
      } else if (mimeType === 'application/pdf') {
        type = 'pdf'
      } else {
        type = 'code'
      }
    } else if (url) {
      type = 'url'
    } else {
      type = 'text'
      filename = '文本内容'
    }

    if (contentType) {
      type = contentType as ContentType
    }

    console.log(`🧪 [测试模式] 开始分析内容，类型: ${type}`)

    // 使用Mock分析
    const analysisResult = await contentAnalysisService.analyzeMock({
      type,
      data: text || url || Buffer.from('mock'),
      filename,
      mimeType: file?.mimetype,
    })

    // 生成工作流配置
    const workflowConfig = WorkflowTemplateService.generateDynamicWorkflow(
      analysisResult.steps,
      url || filename || 'mock-content'
    )

    // 如果需要自动保存
    if (autoSave) {
      const workflow = await prisma.workflow.create({
        data: {
          title: `[测试] ${analysisResult.workflowTitle}`,
          description: `${analysisResult.workflowDescription} (Mock模式)`,
          category: analysisResult.category,
          tags: analysisResult.tags.join(','),
          config: JSON.parse(JSON.stringify(workflowConfig)),
          isPublic: false,
          authorId: userId,
          version: '1.0.0',
          sourceType: type,
          sourceTitle: analysisResult.sourceTitle,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      })

      return res.status(201).json({
        message: '工作流创建成功（测试模式）',
        workflow,
        analysis: {
          sourceType: type,
          sourceTitle: analysisResult.sourceTitle,
          category: analysisResult.category,
          complexity: analysisResult.complexity,
          estimatedTime: analysisResult.estimatedTime,
          stepsExtracted: analysisResult.steps.length,
          tags: analysisResult.tags,
        },
        testMode: true
      })
    }

    // 只返回配置
    res.status(200).json({
      message: '工作流配置生成成功（测试模式）',
      config: workflowConfig,
      metadata: {
        title: analysisResult.workflowTitle,
        description: analysisResult.workflowDescription,
        category: analysisResult.category,
        tags: analysisResult.tags
      },
      analysis: {
        sourceType: type,
        sourceTitle: analysisResult.sourceTitle,
        complexity: analysisResult.complexity,
        estimatedTime: analysisResult.estimatedTime,
        stepsExtracted: analysisResult.steps.length,
      },
      testMode: true
    })
  } catch (error: any) {
    console.error('🧪 [测试模式] 生成工作流错误:', error)
    res.status(500).json({
      error: '生成工作流失败: ' + (error.message || '未知错误')
    })
  }
})

// 更新工作流（需要认证）
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params
    const { title, description, category, tags, config, isPublic } = req.body

    // 检查工作流是否存在且用户有权限
    const workflow = await prisma.workflow.findUnique({
      where: { id }
    })

    if (!workflow) {
      return res.status(404).json({
        error: '工作流不存在'
      })
    }

    if (workflow.authorId !== userId) {
      return res.status(403).json({
        error: '无权修改此工作流'
      })
    }

    // 更新工作流
    const updatedWorkflow = await prisma.workflow.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(config !== undefined && { config }),
        ...(isPublic !== undefined && { isPublic })
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    res.status(200).json({
      message: '工作流更新成功',
      workflow: updatedWorkflow
    })
  } catch (error) {
    console.error('更新工作流错误:', error)
    res.status(500).json({
      error: '更新工作流失败'
    })
  }
})

// 删除工作流（需要认证）
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    // 检查工作流是否存在且用户有权限
    const workflow = await prisma.workflow.findUnique({
      where: { id }
    })

    if (!workflow) {
      return res.status(404).json({
        error: '工作流不存在'
      })
    }

    if (workflow.authorId !== userId) {
      return res.status(403).json({
        error: '无权删除此工作流'
      })
    }

    // 删除工作流
    await prisma.workflow.delete({
      where: { id }
    })

    res.status(200).json({
      message: '工作流删除成功'
    })
  } catch (error) {
    console.error('删除工作流错误:', error)
    res.status(500).json({
      error: '删除工作流失败'
    })
  }
})

// 运行工作流（需要认证）
router.post('/:id/execute', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id: workflowId } = req.params
    const { input } = req.body

    // 检查工作流是否存在
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        nodes: true
      }
    })

    if (!workflow) {
      return res.status(404).json({
        error: '工作流不存在'
      })
    }

    // 检查是否有权限运行（公开的或自己的）
    if (!workflow.isPublic && workflow.authorId !== userId) {
      return res.status(403).json({
        error: '无权运行此工作流'
      })
    }

    // 创建执行记录
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        userId,
        input: input || {},
        status: 'running'
      }
    })

    // 异步执行工作流
    ;(async () => {
      const startTime = Date.now()
      try {
        console.log(`开始执行工作流 ${workflowId}，执行ID: ${execution.id}`)

        // 获取工作流配置
        const config = workflow.config as any

        if (!config || !config.nodes) {
          throw new Error('工作流配置无效')
        }

        // 创建执行引擎实例
        const executionService = new WorkflowExecutionService()

        // 定义进度回调函数
        const progressCallback = async (nodeId: string, nodeLabel: string, currentIndex: number, total: number) => {
          try {
            await prisma.workflowExecution.update({
              where: { id: execution.id },
              data: {
                progress: `执行节点 ${currentIndex}/${total}: ${nodeLabel}`,
                status: 'running'
              }
            })
            console.log(`进度: ${currentIndex}/${total} - ${nodeLabel}`)
          } catch (err) {
            console.error('更新进度失败:', err)
          }
        }

        // 执行工作流（传入进度回调）
        const result = await executionService.executeWorkflow(config, input || {}, progressCallback)

        const duration = Date.now() - startTime

        if (result.success) {
          // 执行成功，更新记录（包括节点结果）
          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
              status: 'completed',
              output: result.output,
              nodeResults: result.nodeResults || {},
              duration,
              progress: '执行完成',
              completedAt: new Date()
            }
          })

          // 增加工作流使用次数
          await prisma.workflow.update({
            where: { id: workflowId },
            data: {
              usageCount: {
                increment: 1
              }
            }
          })

          console.log(`工作流 ${workflowId} 执行成功，耗时 ${duration}ms`)
        } else {
          // 执行失败，更新记录
          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
              status: 'failed',
              error: result.error,
              nodeResults: result.nodeResults || {},
              duration,
              progress: '执行失败',
              completedAt: new Date()
            }
          })
          console.error(`工作流 ${workflowId} 执行失败:`, result.error)
        }
      } catch (err: any) {
        console.error('工作流执行过程中出错:', err)
        const duration = Date.now() - startTime
        try {
          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
              status: 'failed',
              error: err.message || '未知错误',
              duration,
              progress: '执行异常',
              completedAt: new Date()
            }
          })
        } catch (updateErr) {
          console.error('更新执行状态失败:', updateErr)
        }
      }
    })()

    res.status(201).json({
      message: '工作流开始执行',
      execution: {
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status,
        input: execution.input,
        startedAt: execution.startedAt
      }
    })
  } catch (error) {
    console.error('执行工作流错误:', error)
    res.status(500).json({
      error: '执行工作流失败'
    })
  }
})

// 获取工作流执行结果（需要认证）
router.get('/executions/:executionId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { executionId } = req.params

    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId }
    })

    if (!execution) {
      return res.status(404).json({
        error: '执行记录不存在'
      })
    }

    // 检查是否有权限查看
    if (execution.userId !== userId) {
      return res.status(403).json({
        error: '无权查看此执行记录'
      })
    }

    res.status(200).json({
      execution: {
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status,
        input: execution.input,
        output: execution.output,
        error: execution.error,
        duration: execution.duration,
        progress: execution.progress,
        nodeResults: execution.nodeResults,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt
      }
    })
  } catch (error) {
    console.error('获取执行结果错误:', error)
    res.status(500).json({
      error: '获取执行结果失败'
    })
  }
})

// 获取可用的工作流模板列表
router.get('/templates', async (req, res: Response) => {
  try {
    const templates = [
      {
        id: 'knowledge-extraction',
        name: '文章知识提取',
        description: '从文章URL提取实体、关系，生成知识图谱',
        category: 'knowledge-extraction',
        icon: '🧠',
        tags: ['知识提取', '文章分析', 'AI'],
        preview: '/templates/knowledge-extraction.png',
        requiredInputs: [
          {
            name: 'url',
            label: '文章URL',
            type: 'text',
            placeholder: 'https://example.com/article'
          }
        ]
      }
      // 未来可以添加更多模板
    ]

    res.status(200).json({
      templates
    })
  } catch (error) {
    console.error('获取模板列表错误:', error)
    res.status(500).json({
      error: '获取模板列表失败'
    })
  }
})

// 获取示例文章列表
router.get('/article-examples', (_req, res: Response) => {
  try {
    const { getArticleExamplesList } = require('../data/article-examples')
    const examples = getArticleExamplesList()

    res.status(200).json({
      examples
    })
  } catch (error) {
    console.error('获取示例文章列表错误:', error)
    res.status(500).json({
      error: '获取示例文章列表失败'
    })
  }
})

// 获取指定示例文章内容
router.get('/article-examples/:id', (req, res: Response) => {
  try {
    const { getArticleExample } = require('../data/article-examples')
    const example = getArticleExample(req.params.id)

    if (!example) {
      return res.status(404).json({
        error: '示例文章不存在'
      })
    }

    res.status(200).json({
      example
    })
  } catch (error) {
    console.error('获取示例文章详情错误:', error)
    res.status(500).json({
      error: '获取示例文章详情失败'
    })
  }
})

// 图片代理下载（用于绕过防盗链）
router.post('/proxy-image', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { url } = req.body

    if (!url) {
      return res.status(400).json({ error: '请提供图片URL' })
    }

    console.log('[图片代理] 下载图片:', url)

    // 使用 Puppeteer 下载图片（绕过防盗链）
    const puppeteer = require('puppeteer')
    let browser = null

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()

      // 设置微信的 referrer
      await page.setExtraHTTPHeaders({
        'Referer': 'https://mp.weixin.qq.com/'
      })

      // 下载图片
      const response = await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000
      })

      if (!response) {
        throw new Error('无法加载图片')
      }

      const buffer = await response.buffer()
      const contentType = response.headers()['content-type'] || 'image/jpeg'

      // 转换为 base64
      const base64 = `data:${contentType};base64,${buffer.toString('base64')}`

      console.log('[图片代理] 成功下载图片，大小:', buffer.length, 'bytes')

      res.status(200).json({
        base64,
        size: buffer.length,
        contentType
      })

    } catch (error: any) {
      console.error('[图片代理] 下载失败:', error.message)
      throw error
    } finally {
      if (browser) {
        await browser.close()
      }
    }

  } catch (error: any) {
    console.error('[图片代理] 错误:', error)
    res.status(500).json({
      error: '图片下载失败: ' + error.message
    })
  }
})

export default router