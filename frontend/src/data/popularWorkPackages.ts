import { WorkPackage } from '../types/workPackage'

export const popularWorkPackages: WorkPackage[] = [
  {
    id: 'pkg-1',
    name: '自媒体爆款内容创作套装',
    description: '一站式自媒体内容创作解决方案，包含文章生成、视频脚本、图片处理等全套工具',
    category: 'text',
    icon: '',
    color: '#f59e0b',
    tags: ['自媒体', '内容创作', '爆款文案', '视频脚本'],
    author: {
      name: 'AI工作流大师',
      avatar: ''
    },
    stats: {
      downloads: 12580,
      rating: 4.9,
      reviews: 856
    },
    items: [
      {
        id: 1,
        name: '公众号爆款文章生成',
        description: '一键生成10万+爆款文章',
        icon: '',
        difficulty: '简单',
        tools: [
          { id: 1, name: 'GPT-4 文章生成器', type: 'AI工具', description: '智能生成爆款文章', icon: '', version: 'v3.0' },
          { id: 2, name: '标题优化器', type: 'AI工具', description: '优化文章标题吸引力', icon: '', version: 'v2.1' },
          { id: 3, name: 'SEO关键词工具', type: '工作流', description: '自动优化SEO关键词', icon: '', version: 'v1.8' }
        ]
      },
      {
        id: 2,
        name: '短视频脚本创作',
        description: '抖音、小红书短视频脚本',
        icon: '',
        difficulty: '简单',
        tools: [
          { id: 1, name: '视频脚本生成器', type: 'AI工具', description: '智能生成视频脚本', icon: '', version: 'v2.5' },
          { id: 2, name: '分镜头设计', type: '工作流', description: '自动设计分镜头', icon: '', version: 'v1.3' }
        ]
      },
      {
        id: 3,
        name: '配图快速生成',
        description: 'AI生成文章配图',
        icon: '',
        difficulty: '中等',
        tools: [
          { id: 1, name: 'Midjourney 助手', type: 'AI工具', description: 'AI绘图生成配图', icon: '', version: 'v6.0' },
          { id: 2, name: '图片尺寸优化', type: '软件', description: '批量调整图片尺寸', icon: '', version: 'v1.2' }
        ]
      }
    ],
    createdAt: '2025-01-15',
    updatedAt: '2025-01-20'
  },
  {
    id: 'pkg-2',
    name: '产品经理全套工具包',
    description: '从需求分析到产品上线，产品经理必备的完整工具链',
    category: 'product',
    icon: '',
    color: '#10b981',
    tags: ['产品管理', '需求分析', '原型设计', '数据分析'],
    author: {
      name: '产品经理小李',
      avatar: ''
    },
    stats: {
      downloads: 9850,
      rating: 4.8,
      reviews: 623
    },
    items: [
      {
        id: 1,
        name: '竞品深度分析',
        description: '全方位竞品分析报告',
        icon: '',
        difficulty: '中等',
        tools: [
          { id: 1, name: '竞品分析工作流', type: '工作流', description: '完整竞品分析流程', icon: '', version: 'v2.0' },
          { id: 2, name: 'AI数据分析助手', type: 'AI工具', description: '智能数据分析', icon: '', version: 'v3.1' },
          { id: 3, name: '报告生成器', type: 'AI工具', description: '自动生成分析报告', icon: '', version: 'v2.3' }
        ]
      },
      {
        id: 2,
        name: 'PRD文档撰写',
        description: '专业PRD文档快速生成',
        icon: '',
        difficulty: '高级',
        tools: [
          { id: 1, name: 'PRD模板库', type: '工作流', description: '多种PRD模板', icon: '', version: 'v1.5' },
          { id: 2, name: '需求整理助手', type: 'AI工具', description: 'AI整理需求', icon: '', version: 'v2.0' }
        ]
      },
      {
        id: 3,
        name: '用户调研分析',
        description: '用户需求挖掘与分析',
        icon: '',
        difficulty: '中等',
        tools: [
          { id: 1, name: '问卷设计器', type: '软件', description: '专业问卷设计', icon: '', version: 'v2.1' },
          { id: 2, name: '数据分析工具', type: '工作流', description: '调研数据分析', icon: '', version: 'v1.8' }
        ]
      },
      {
        id: 4,
        name: '原型快速设计',
        description: '产品原型快速输出',
        icon: '',
        difficulty: '中等',
        tools: [
          { id: 1, name: 'Figma 模板库', type: '软件', description: '丰富原型模板', icon: '', version: 'v3.0' }
        ]
      }
    ],
    createdAt: '2025-01-10',
    updatedAt: '2025-01-18'
  },
  {
    id: 'pkg-3',
    name: '数据分析师必备工具集',
    description: '从数据采集到可视化报告，数据分析全流程工具',
    category: 'analysis',
    icon: '',
    color: '#ef4444',
    tags: ['数据分析', '可视化', '报表生成', 'BI工具'],
    author: {
      name: '数据分析师张三',
      avatar: ''
    },
    stats: {
      downloads: 8420,
      rating: 4.7,
      reviews: 512
    },
    items: [
      {
        id: 1,
        name: '数据可视化大屏',
        description: '专业数据可视化展示',
        icon: '',
        difficulty: '中等',
        tools: [
          { id: 1, name: 'ECharts 模板', type: '软件', description: '丰富图表模板', icon: '', version: 'v5.4' },
          { id: 2, name: 'BI仪表盘', type: '工作流', description: '交互式仪表盘', icon: '', version: 'v2.0' }
        ]
      },
      {
        id: 2,
        name: '自动化报表生成',
        description: '定时自动生成报表',
        icon: '',
        difficulty: '简单',
        tools: [
          { id: 1, name: '报表自动化', type: '工作流', description: '自动生成周报月报', icon: '', version: 'v1.9' },
          { id: 2, name: 'Excel 插件', type: '软件', description: 'Excel增强插件', icon: '', version: 'v3.2' }
        ]
      },
      {
        id: 3,
        name: '业务趋势预测',
        description: 'AI预测业务趋势',
        icon: '',
        difficulty: '高级',
        tools: [
          { id: 1, name: '预测模型', type: 'AI工具', description: 'AI趋势预测', icon: '', version: 'v1.5' }
        ]
      }
    ],
    createdAt: '2025-01-08',
    updatedAt: '2025-01-16'
  },
  {
    id: 'pkg-4',
    name: '电商运营增长套餐',
    description: '电商店铺运营从选品到客服的全套解决方案',
    category: 'marketing',
    icon: '',
    color: '#8b5cf6',
    tags: ['电商运营', '客服', '营销', '数据分析'],
    author: {
      name: '电商运营达人',
      avatar: ''
    },
    stats: {
      downloads: 10250,
      rating: 4.8,
      reviews: 741
    },
    items: [
      {
        id: 1,
        name: '智能客服机器人',
        description: 'AI自动回复客户咨询',
        icon: '',
        difficulty: '简单',
        tools: [
          { id: 1, name: '客服话术库', type: 'AI工具', description: '智能客服对话', icon: '', version: 'v3.0' },
          { id: 2, name: '自动回复工作流', type: '工作流', description: '自动化客服流程', icon: '', version: 'v2.1' }
        ]
      },
      {
        id: 2,
        name: '商品描述生成',
        description: '自动生成商品详情页',
        icon: '',
        difficulty: '简单',
        tools: [
          { id: 1, name: '商品文案生成器', type: 'AI工具', description: 'AI生成商品文案', icon: '', version: 'v2.5' }
        ]
      },
      {
        id: 3,
        name: '营销活动策划',
        description: '节日营销活动方案',
        icon: '',
        difficulty: '中等',
        tools: [
          { id: 1, name: '活动策划模板', type: '工作流', description: '多种活动模板', icon: '', version: 'v1.7' },
          { id: 2, name: '海报设计工具', type: '软件', description: '快速制作活动海报', icon: '', version: 'v2.0' }
        ]
      }
    ],
    createdAt: '2025-01-12',
    updatedAt: '2025-01-19'
  },
  {
    id: 'pkg-5',
    name: 'AI图片处理专业包',
    description: '专业图片处理工具集，从基础编辑到AI生成',
    category: 'image',
    icon: '',
    color: '#06b6d4',
    tags: ['图片处理', 'AI绘图', '设计', '美化'],
    author: {
      name: '设计师',
      avatar: ''
    },
    stats: {
      downloads: 11200,
      rating: 4.9,
      reviews: 892
    },
    items: [
      {
        id: 1,
        name: 'AI智能抠图',
        description: '一键移除图片背景',
        icon: '',
        difficulty: '简单',
        tools: [
          { id: 1, name: 'Remove.bg', type: 'AI工具', description: '智能背景移除', icon: '', version: 'v2.0' },
          { id: 2, name: '批量抠图工作流', type: '工作流', description: '批量处理图片', icon: '', version: 'v1.5' }
        ]
      },
      {
        id: 2,
        name: 'AI绘画创作',
        description: '文字生成精美图片',
        icon: '',
        difficulty: '高级',
        tools: [
          { id: 1, name: 'Midjourney', type: 'AI工具', description: 'AI绘画工具', icon: '', version: 'v6.0' },
          { id: 2, name: 'Stable Diffusion', type: 'AI工具', description: '开源AI绘画', icon: '', version: 'v3.0' }
        ]
      },
      {
        id: 3,
        name: '图片风格转换',
        description: '艺术风格一键转换',
        icon: '',
        difficulty: '中等',
        tools: [
          { id: 1, name: '风格迁移工具', type: 'AI工具', description: '图片风格转换', icon: '', version: 'v2.3' }
        ]
      }
    ],
    createdAt: '2025-01-14',
    updatedAt: '2025-01-21'
  },
  {
    id: 'pkg-6',
    name: '视频创作全能套装',
    description: '从脚本到成片，视频创作一站式解决方案',
    category: 'video',
    icon: '',
    color: '#8b5cf6',
    tags: ['视频制作', '剪辑', '特效', '字幕'],
    author: {
      name: '内容创作者王五',
      avatar: ''
    },
    stats: {
      downloads: 7850,
      rating: 4.6,
      reviews: 445
    },
    items: [
      {
        id: 1,
        name: '智能视频剪辑',
        description: 'AI自动剪辑视频',
        icon: '',
        difficulty: '中等',
        tools: [
          { id: 1, name: '剪映专业版', type: '软件', description: '专业视频剪辑', icon: '', version: 'v3.5' },
          { id: 2, name: 'AI剪辑助手', type: 'AI工具', description: 'AI智能剪辑', icon: '', version: 'v2.0' }
        ]
      },
      {
        id: 2,
        name: '自动字幕生成',
        description: '语音识别自动上字幕',
        icon: '',
        difficulty: '简单',
        tools: [
          { id: 1, name: '字幕工作流', type: '工作流', description: '自动生成字幕', icon: '', version: 'v2.1' },
          { id: 2, name: '语音识别', type: 'AI工具', description: '高精度语音转文字', icon: '', version: 'v3.0' }
        ]
      },
      {
        id: 3,
        name: 'AI配音合成',
        description: '真人级AI配音',
        icon: '',
        difficulty: '中等',
        tools: [
          { id: 1, name: 'TTS语音合成', type: 'AI工具', description: 'AI语音合成', icon: '', version: 'v4.0' }
        ]
      }
    ],
    createdAt: '2025-01-11',
    updatedAt: '2025-01-17'
  },
  {
    id: 'pkg-7',
    name: 'AI模型工具库',
    description: '集成多个主流AI模型提供商，支持文本生成、对话、图片生成等多种能力',
    category: 'ai',
    icon: '🤖',
    color: '#ec4899',
    tags: ['AI模型', '对话', '文本生成', '图片生成'],
    author: {
      name: 'AI平台',
      avatar: ''
    },
    stats: {
      downloads: 15680,
      rating: 4.9,
      reviews: 1243
    },
    items: [
      {
        id: 1,
        name: 'OpenAI 模型',
        description: 'GPT系列强大的语言模型',
        icon: '🤖',
        difficulty: '简单',
        tools: [
          {
            id: 1,
            name: 'GPT-4',
            type: 'AI模型',
            description: '最强大的GPT模型，支持复杂推理',
            icon: '🧠',
            version: 'v4.0',
            modelId: 'gpt-4',
            provider: 'openai',
            inputPrice: 30,
            outputPrice: 60,
            maxTokens: 8192,
            features: {
              vision: true,
              functionCalling: true,
              streaming: true,
              jsonMode: true
            }
          },
          {
            id: 2,
            name: 'GPT-4 Turbo',
            type: 'AI模型',
            description: '更快更经济的GPT-4版本',
            icon: '⚡',
            version: 'v4.0',
            modelId: 'gpt-4-turbo',
            provider: 'openai',
            inputPrice: 10,
            outputPrice: 30,
            maxTokens: 128000,
            features: {
              vision: true,
              functionCalling: true,
              streaming: true,
              jsonMode: true
            }
          },
          {
            id: 3,
            name: 'GPT-3.5 Turbo',
            type: 'AI模型',
            description: '快速且经济的对话模型',
            icon: '💬',
            version: 'v3.5',
            modelId: 'gpt-3.5-turbo',
            provider: 'openai',
            inputPrice: 0.5,
            outputPrice: 1.5,
            maxTokens: 16385,
            features: {
              functionCalling: true,
              streaming: true,
              jsonMode: true
            }
          }
        ]
      },
      {
        id: 2,
        name: 'Anthropic Claude',
        description: 'Claude系列智能对话模型',
        icon: '🧠',
        difficulty: '简单',
        tools: [
          {
            id: 1,
            name: 'Claude 3.5 Sonnet',
            type: 'AI模型',
            description: '平衡性能与成本的最佳选择',
            icon: '🎵',
            version: 'v3.5',
            modelId: 'claude-3-5-sonnet-20241022',
            provider: 'anthropic',
            inputPrice: 3,
            outputPrice: 15,
            maxTokens: 200000,
            features: {
              vision: true,
              functionCalling: true,
              streaming: true
            }
          },
          {
            id: 2,
            name: 'Claude 3 Opus',
            type: 'AI模型',
            description: '最强大的Claude模型',
            icon: '👑',
            version: 'v3.0',
            modelId: 'claude-3-opus-20240229',
            provider: 'anthropic',
            inputPrice: 15,
            outputPrice: 75,
            maxTokens: 200000,
            features: {
              vision: true,
              streaming: true
            }
          },
          {
            id: 3,
            name: 'Claude 3 Haiku',
            type: 'AI模型',
            description: '快速且经济的Claude模型',
            icon: '🌸',
            version: 'v3.0',
            modelId: 'claude-3-haiku-20240307',
            provider: 'anthropic',
            inputPrice: 0.25,
            outputPrice: 1.25,
            maxTokens: 200000,
            features: {
              vision: true,
              streaming: true
            }
          }
        ]
      },
      {
        id: 3,
        name: '豆包 AI',
        description: '字节跳动的AI模型服务',
        icon: '🫘',
        difficulty: '简单',
        tools: [
          {
            id: 1,
            name: '豆包 Pro',
            type: 'AI模型',
            description: '专业级对话模型',
            icon: '💼',
            version: 'v1.0',
            modelId: 'doubao-pro',
            provider: 'doubao',
            inputPrice: 0.8,
            outputPrice: 2,
            maxTokens: 32000,
            features: {
              streaming: true,
              functionCalling: true
            }
          },
          {
            id: 2,
            name: '豆包 Lite',
            type: 'AI模型',
            description: '轻量快速的对话模型',
            icon: '⚡',
            version: 'v1.0',
            modelId: 'doubao-lite',
            provider: 'doubao',
            inputPrice: 0.3,
            outputPrice: 0.6,
            maxTokens: 16000,
            features: {
              streaming: true
            }
          }
        ]
      },
      {
        id: 4,
        name: '通义千问',
        description: '阿里云的通义千问AI模型',
        icon: '💬',
        difficulty: '简单',
        tools: [
          {
            id: 1,
            name: '通义千问 Plus',
            type: 'AI模型',
            description: '强大的中文理解能力',
            icon: '🇨🇳',
            version: 'v2.0',
            modelId: 'qwen-plus',
            provider: 'qwen',
            inputPrice: 4,
            outputPrice: 12,
            maxTokens: 32000,
            features: {
              streaming: true,
              functionCalling: true
            }
          },
          {
            id: 2,
            name: '通义千问 Turbo',
            type: 'AI模型',
            description: '快速响应的中文模型',
            icon: '⚡',
            version: 'v2.0',
            modelId: 'qwen-turbo',
            provider: 'qwen',
            inputPrice: 2,
            outputPrice: 6,
            maxTokens: 8000,
            features: {
              streaming: true
            }
          }
        ]
      },
      {
        id: 5,
        name: '智谱 AI',
        description: '智谱AI的GLM系列模型',
        icon: '⚡',
        difficulty: '简单',
        tools: [
          {
            id: 1,
            name: 'GLM-4',
            type: 'AI模型',
            description: '新一代对话模型',
            icon: '🌟',
            version: 'v4.0',
            modelId: 'glm-4',
            provider: 'zhipu',
            inputPrice: 100,
            outputPrice: 100,
            maxTokens: 128000,
            features: {
              streaming: true,
              functionCalling: true,
              vision: true
            }
          },
          {
            id: 2,
            name: 'GLM-3 Turbo',
            type: 'AI模型',
            description: '高效的对话模型',
            icon: '💨',
            version: 'v3.0',
            modelId: 'glm-3-turbo',
            provider: 'zhipu',
            inputPrice: 5,
            outputPrice: 5,
            maxTokens: 128000,
            features: {
              streaming: true
            }
          }
        ]
      }
    ],
    createdAt: '2025-01-22',
    updatedAt: '2025-01-22'
  },
  {
    id: 'pkg-8',
    name: '增长实验加速器',
    description: '驱动全渠道增长实验，从洞察、执行到复盘的一站式套件',
    category: 'growth',
    icon: '',
    color: '#2563eb',
    tags: ['增长实验', '用户留存', '渠道分析', 'A/B 测试'],
    author: {
      name: '增长黑客实验室',
      avatar: ''
    },
    stats: {
      downloads: 9320,
      rating: 4.8,
      reviews: 688
    },
    items: [
      {
        id: 1,
        name: '增长洞察雷达',
        description: '自动汇总渠道数据并识别增长机会',
        icon: '',
        difficulty: '中等',
        tools: [
          { id: 1, name: '渠道数据看板', type: '工作流', description: '统一拉通多渠道数据', icon: '', version: 'v2.4' },
          { id: 2, name: '增长机会分析器', type: 'AI工具', description: '智能识别增长机会', icon: '', version: 'v1.6' }
        ]
      },
      {
        id: 2,
        name: '实验计划生成器',
        description: '自动输出实验假设、指标与计划排期',
        icon: '',
        difficulty: '简单',
        tools: [
          { id: 1, name: 'A/B 测试模板库', type: '工作流', description: '标准化实验模版', icon: '', version: 'v1.9' },
          { id: 2, name: '实验排期助手', type: 'AI工具', description: '自动生成实验时间表', icon: '', version: 'v1.3' }
        ]
      },
      {
        id: 3,
        name: '复盘洞察工作坊',
        description: '聚合实验数据并沉淀复盘报告',
        icon: '',
        difficulty: '中等',
        tools: [
          { id: 1, name: '实验数据自动汇总', type: '工作流', description: '自动生成实验数据报表', icon: '', version: 'v2.2' },
          { id: 2, name: '复盘报告生成器', type: 'AI工具', description: '智能生成复盘总结', icon: '', version: 'v1.4' }
        ]
      }
    ],
    createdAt: '2025-01-18',
    updatedAt: '2025-01-23'
  }
]
