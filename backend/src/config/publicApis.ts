/**
 * 公共API配置库
 * 这些API不需要付费，可以直接使用
 */

export interface ApiConfig {
  name: string
  description: string
  baseUrl: string
  method: 'GET' | 'POST'
  headers?: Record<string, string>
  requiresAuth: boolean
  examples: Array<{
    name: string
    endpoint: string
    params?: Record<string, any>
  }>
}

/**
 * 免费公共API库
 */
export const PUBLIC_APIS: Record<string, ApiConfig> = {
  // ==================== 内容和数据 ====================

  /**
   * JSONPlaceholder - 模拟REST API
   * 用于测试HTTP请求、数据获取等场景
   */
  jsonplaceholder: {
    name: 'JSONPlaceholder',
    description: '免费的REST API测试服务，提供模拟数据',
    baseUrl: 'https://jsonplaceholder.typicode.com',
    method: 'GET',
    requiresAuth: false,
    examples: [
      {
        name: '获取文章列表',
        endpoint: '/posts'
      },
      {
        name: '获取单篇文章',
        endpoint: '/posts/1'
      },
      {
        name: '获取用户信息',
        endpoint: '/users'
      },
      {
        name: '获取评论',
        endpoint: '/comments',
        params: { postId: 1 }
      }
    ]
  },

  /**
   * 随机用户生成器
   * 用于生成测试用户数据
   */
  randomuser: {
    name: 'Random User Generator',
    description: '生成随机用户数据',
    baseUrl: 'https://randomuser.me/api',
    method: 'GET',
    requiresAuth: false,
    examples: [
      {
        name: '生成1个随机用户',
        endpoint: '/',
        params: { results: 1 }
      },
      {
        name: '生成10个随机用户',
        endpoint: '/',
        params: { results: 10 }
      }
    ]
  },

  /**
   * 随机名言API
   * 用于内容生成、灵感启发
   */
  quotable: {
    name: 'Quotable Quotes',
    description: '随机名言、格言API',
    baseUrl: 'https://api.quotable.io',
    method: 'GET',
    requiresAuth: false,
    examples: [
      {
        name: '获取随机名言',
        endpoint: '/random'
      },
      {
        name: '搜索名言',
        endpoint: '/quotes',
        params: { query: 'success' }
      }
    ]
  },

  // ==================== 新闻和内容 ====================

  /**
   * NewsAPI.org
   * 免费层级：100次请求/天
   * 需要API key但可以快速注册
   */
  newsapi: {
    name: 'NewsAPI',
    description: '全球新闻API（免费100次/天）',
    baseUrl: 'https://newsapi.org/v2',
    method: 'GET',
    headers: {
      'X-Api-Key': process.env.NEWSAPI_KEY || 'demo-key'
    },
    requiresAuth: true,
    examples: [
      {
        name: '头条新闻',
        endpoint: '/top-headlines',
        params: { country: 'us', category: 'technology' }
      },
      {
        name: '搜索新闻',
        endpoint: '/everything',
        params: { q: 'AI', language: 'en' }
      }
    ]
  },

  // ==================== 图片和媒体 ====================

  /**
   * Unsplash - 免费高质量图片
   */
  unsplash: {
    name: 'Unsplash',
    description: '免费高质量图片API',
    baseUrl: 'https://api.unsplash.com',
    method: 'GET',
    headers: {
      'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY || 'demo'}`
    },
    requiresAuth: true,
    examples: [
      {
        name: '搜索图片',
        endpoint: '/search/photos',
        params: { query: 'nature', per_page: 10 }
      },
      {
        name: '随机图片',
        endpoint: '/photos/random'
      }
    ]
  },

  /**
   * Lorem Picsum - 占位图片
   */
  picsum: {
    name: 'Lorem Picsum',
    description: '随机占位图片服务',
    baseUrl: 'https://picsum.photos',
    method: 'GET',
    requiresAuth: false,
    examples: [
      {
        name: '随机图片 800x600',
        endpoint: '/800/600'
      },
      {
        name: '指定ID的图片',
        endpoint: '/id/237/800/600'
      }
    ]
  },

  // ==================== 工具类 ====================

  /**
   * IP地理位置查询
   */
  ipapi: {
    name: 'IP API',
    description: '免费IP地理位置查询',
    baseUrl: 'http://ip-api.com/json',
    method: 'GET',
    requiresAuth: false,
    examples: [
      {
        name: '查询当前IP',
        endpoint: '/'
      },
      {
        name: '查询指定IP',
        endpoint: '/8.8.8.8'
      }
    ]
  },

  /**
   * 天气API
   */
  openweather: {
    name: 'OpenWeather',
    description: '天气数据API（免费1000次/天）',
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    method: 'GET',
    requiresAuth: true,
    examples: [
      {
        name: '当前天气',
        endpoint: '/weather',
        params: {
          q: 'Shanghai',
          appid: process.env.OPENWEATHER_KEY || 'demo',
          units: 'metric'
        }
      }
    ]
  },

  // ==================== 内容分析 ====================

  /**
   * 维基百科API
   */
  wikipedia: {
    name: 'Wikipedia API',
    description: '维基百科内容查询',
    baseUrl: 'https://en.wikipedia.org/w/api.php',
    method: 'GET',
    requiresAuth: false,
    examples: [
      {
        name: '搜索条目',
        endpoint: '/',
        params: {
          action: 'query',
          list: 'search',
          srsearch: 'Artificial Intelligence',
          format: 'json'
        }
      },
      {
        name: '获取页面内容',
        endpoint: '/',
        params: {
          action: 'query',
          prop: 'extracts',
          titles: 'Artificial_Intelligence',
          format: 'json',
          explaintext: true
        }
      }
    ]
  },

  // ==================== 本地服务 ====================

  /**
   * 小红书爬虫（你已有的）
   */
  xiaohongshu: {
    name: '小红书笔记搜索',
    description: '使用本地爬虫服务搜索小红书内容',
    baseUrl: 'http://localhost:3000/api/crawler',
    method: 'POST',
    requiresAuth: false,
    examples: [
      {
        name: '搜索笔记',
        endpoint: '/xiaohongshu/notes',
        params: {
          keyword: '{{input}}',
          maxCount: 10
        }
      }
    ]
  }
}

/**
 * 工具类型到API的映射
 */
export const TOOL_TO_API_MAPPING: Record<string, string[]> = {
  // SEO和关键词研究
  'keyword-research': ['xiaohongshu', 'wikipedia'],
  'seo-analysis': ['xiaohongshu'],

  // 内容获取
  'fetch-content': ['jsonplaceholder', 'newsapi', 'wikipedia'],
  'get-news': ['newsapi'],
  'get-quotes': ['quotable'],

  // 图片获取
  'get-images': ['unsplash', 'picsum'],

  // 数据生成
  'generate-data': ['randomuser', 'jsonplaceholder'],

  // 工具类
  'get-location': ['ipapi'],
  'get-weather': ['openweather'],

  // 内容搜索
  'search-content': ['xiaohongshu', 'wikipedia', 'newsapi']
}

/**
 * 根据关键词推荐API
 */
export function recommendApiByKeywords(description: string): ApiConfig | null {
  const desc = description.toLowerCase()

  // 小红书相关
  if (desc.includes('小红书') || desc.includes('笔记') || desc.includes('xhs')) {
    return PUBLIC_APIS.xiaohongshu
  }

  // SEO/关键词相关
  if (desc.includes('seo') || desc.includes('关键词') || desc.includes('keyword')) {
    return PUBLIC_APIS.xiaohongshu // 用小红书热搜代替SEO工具
  }

  // 新闻相关
  if (desc.includes('新闻') || desc.includes('news') || desc.includes('资讯')) {
    return PUBLIC_APIS.newsapi
  }

  // 图片相关
  if (desc.includes('图片') || desc.includes('image') || desc.includes('图像')) {
    return PUBLIC_APIS.picsum
  }

  // 天气相关
  if (desc.includes('天气') || desc.includes('weather')) {
    return PUBLIC_APIS.openweather
  }

  // 维基百科
  if (desc.includes('百科') || desc.includes('知识') || desc.includes('wikipedia')) {
    return PUBLIC_APIS.wikipedia
  }

  // 数据获取
  if (desc.includes('数据') || desc.includes('data') || desc.includes('fetch')) {
    return PUBLIC_APIS.jsonplaceholder
  }

  // 名言
  if (desc.includes('名言') || desc.includes('quote') || desc.includes('格言')) {
    return PUBLIC_APIS.quotable
  }

  return null
}

/**
 * 构建完整的API请求配置
 */
export function buildApiRequest(
  apiKey: string,
  exampleName?: string,
  customParams?: Record<string, any>
): {
  url: string
  method: string
  headers?: Record<string, string>
  params?: Record<string, any>
} {
  const api = PUBLIC_APIS[apiKey]
  if (!api) {
    throw new Error(`Unknown API: ${apiKey}`)
  }

  // 找到指定的示例
  const example = exampleName
    ? api.examples.find(e => e.name === exampleName)
    : api.examples[0]

  if (!example) {
    throw new Error(`No example found for API: ${apiKey}`)
  }

  return {
    url: api.baseUrl + example.endpoint,
    method: api.method,
    headers: api.headers,
    params: customParams || example.params
  }
}
