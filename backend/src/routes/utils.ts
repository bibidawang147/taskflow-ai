import { Router, Request, Response } from 'express'
import axios from 'axios'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const router = Router()

// 确保上传目录存在
const uploadsDir = path.join(__dirname, '../../uploads')
const imagesDir = path.join(uploadsDir, 'images')
const videosDir = path.join(uploadsDir, 'videos')
const documentsDir = path.join(uploadsDir, 'documents')

;[uploadsDir, imagesDir, videosDir, documentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// 配置 multer 存储 - 媒体文件
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVideo = file.mimetype.startsWith('video/')
    cb(null, isVideo ? videosDir : imagesDir)
  },
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(8).toString('hex')
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${hash}${ext}`)
  }
})

// 配置 multer 存储 - 文档文件
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsDir)
  },
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(8).toString('hex')
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${hash}${ext}`)
  }
})

// 媒体文件过滤器
const mediaFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime']

  if ([...allowedImageTypes, ...allowedVideoTypes].includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('不支持的文件类型，仅支持 JPG、PNG、GIF、WebP 图片和 MP4、WebM 视频'))
  }
}

// 文档文件过滤器
const documentFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedDocumentTypes = [
    // PDF
    'application/pdf',
    // Word
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Excel
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // PowerPoint
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text
    'text/plain',
    'text/markdown',
    'text/csv',
    // Others
    'application/rtf',
    'application/zip',
    'application/x-zip-compressed'
  ]

  if (allowedDocumentTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('不支持的文件类型，支持 PDF、Word、Excel、PPT、TXT、Markdown、CSV、RTF、ZIP'))
  }
}

const uploadMedia = multer({
  storage: mediaStorage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
})

const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB for documents
  }
})

/**
 * 获取网页标题
 * GET /api/utils/fetch-title?url=xxx
 */
router.get('/fetch-title', async (req: Request, res: Response) => {
  try {
    const { url } = req.query

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: '缺少 url 参数' })
    }

    // 验证URL格式
    try {
      new URL(url)
    } catch {
      return res.status(400).json({ error: '无效的 URL 格式' })
    }

    // 获取网页内容
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      maxRedirects: 3,
      responseType: 'text'
    })

    const html = response.data

    // 提取标题
    let title = ''

    // 尝试匹配 <title> 标签
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) {
      title = titleMatch[1].trim()
    }

    // 如果没有 title，尝试匹配 og:title
    if (!title) {
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
      if (ogTitleMatch) {
        title = ogTitleMatch[1].trim()
      }
    }

    // 解码 HTML 实体
    title = title
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')

    // 截断过长的标题
    if (title.length > 100) {
      title = title.substring(0, 100) + '...'
    }

    res.json({
      title: title || new URL(url).hostname,
      url
    })
  } catch (error: any) {
    console.error('获取网页标题失败:', error.message)

    // 返回域名作为备用标题
    try {
      const url = req.query.url as string
      const hostname = new URL(url).hostname
      res.json({
        title: hostname,
        url,
        fallback: true
      })
    } catch {
      res.status(500).json({ error: '获取网页标题失败' })
    }
  }
})

/**
 * 上传媒体文件（图片/视频）
 * POST /api/utils/upload-media
 */
router.post('/upload-media', uploadMedia.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const file = req.file
    const isVideo = file.mimetype.startsWith('video/')
    const category = isVideo ? 'videos' : 'images'

    const fileUrl = `/uploads/${category}/${file.filename}`

    res.json({
      success: true,
      url: fileUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      type: isVideo ? 'video' : 'image'
    })
  } catch (error: any) {
    console.error('文件上传失败:', error.message)
    res.status(500).json({ error: '文件上传失败: ' + error.message })
  }
})

/**
 * 上传文档文件
 * POST /api/utils/upload-document
 */
router.post('/upload-document', uploadDocument.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const file = req.file
    const fileUrl = `/uploads/documents/${file.filename}`

    // 获取文件扩展名作为文档类型
    const ext = path.extname(file.originalname).toLowerCase().slice(1)
    const docTypeMap: Record<string, string> = {
      'pdf': 'PDF',
      'doc': 'Word',
      'docx': 'Word',
      'xls': 'Excel',
      'xlsx': 'Excel',
      'ppt': 'PPT',
      'pptx': 'PPT',
      'txt': '文本',
      'md': 'Markdown',
      'csv': 'CSV',
      'rtf': 'RTF',
      'zip': 'ZIP'
    }

    res.json({
      success: true,
      url: fileUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      docType: docTypeMap[ext] || ext.toUpperCase()
    })
  } catch (error: any) {
    console.error('文档上传失败:', error.message)
    res.status(500).json({ error: '文档上传失败: ' + error.message })
  }
})

export default router
