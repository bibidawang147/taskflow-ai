"""
配置文件 - 信息源和 API 配置
完整 30 个网站
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ==================== API 配置 ====================

# 后端 API 地址 (你的工作流平台)
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")

# AI 服务配置 (选择其中一个)
AI_PROVIDER = os.getenv("AI_PROVIDER", "openai")  # openai / dashscope / anthropic

# OpenAI 配置
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# 通义千问配置 (国内推荐)
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "")

# ==================== 信息源配置 ====================
# 完整 30 个网站，分为 4 组

# ============ 第一组：直接对标与选品库 (你的货源) - 7个 ============
# 用途：每天必看。直接参考它们的分类、介绍和排版

RSS_GROUP_1_PRODUCT = [
    {
        "name": "Product Hunt",
        "url": "https://www.producthunt.com/feed",
        "icon": "https://www.producthunt.com/favicon.ico",
        "tags": ["新品首发", "AI工具", "Startup"],
        "priority": "high",
        "group": "选品库"
    },
]

WEB_GROUP_1_PRODUCT = [
    {
        "name": "Aibase (爱邦)",
        "url": "https://www.aibase.com/zh/news",
        "type": "aibase",  # 特殊处理
        "icon": "https://www.aibase.com/favicon.ico",
        "tags": ["AI工具", "国内", "资讯"],
        "priority": "high",
        "group": "选品库"
    },
    {
        "name": "FutureTools",
        "url": "https://www.futuretools.io/",
        "type": "api",
        "icon": "https://www.futuretools.io/favicon.ico",
        "tags": ["AI工具", "选品库", "核心对标"],
        "priority": "high",
        "group": "选品库"
    },
    {
        "name": "Futurepedia",
        "url": "https://www.futurepedia.io/ai-tools",
        "type": "api",
        "icon": "https://www.futurepedia.io/favicon.ico",
        "tags": ["AI工具", "选品库", "竞品"],
        "priority": "high",
        "group": "选品库"
    },
    {
        "name": "AI-Bot.cn",
        "url": "https://ai-bot.cn/",
        "type": "list",
        "selectors": {
            "items": ".tool-item",
            "title": ".tool-title",
            "link": "a",
            "summary": ".tool-desc"
        },
        "icon": "https://ai-bot.cn/favicon.ico",
        "tags": ["AI工具", "国内"],
        "priority": "medium",
        "group": "选品库"
    },
    {
        "name": "AIG123",
        "url": "https://www.aig123.com/",
        "type": "list",
        "icon": "https://www.aig123.com/favicon.ico",
        "tags": ["AI工具", "老牌库"],
        "priority": "low",
        "group": "选品库"
    },
    {
        "name": "Sanhua (散花)",
        "url": "https://sanhua.himrr.com/",
        "type": "list",
        "icon": "https://sanhua.himrr.com/favicon.ico",
        "tags": ["AI工具", "小众库"],
        "priority": "low",
        "group": "选品库"
    },
]

# ============ 第二组：快讯与流量素材 (你的喇叭) - 8个 ============
# 用途：资讯最快、最热。适合 AI 改写成日报引流

RSS_GROUP_2_NEWS = [
    {
        "name": "TechCrunch",
        "url": "https://techcrunch.com/category/artificial-intelligence/feed/",
        "icon": "https://techcrunch.com/favicon.ico",
        "tags": ["AI新闻", "硅谷", "权威"],
        "priority": "high",
        "group": "快讯"
    },
    {
        "name": "量子位",
        "url": "https://www.qbitai.com/feed",
        "icon": "https://www.qbitai.com/favicon.ico",
        "tags": ["AI新闻", "国内", "学术"],
        "priority": "high",
        "group": "快讯"
    },
    {
        "name": "机器之心",
        "url": "https://www.jiqizhixin.com/rss",
        "icon": "https://www.jiqizhixin.com/favicon.ico",
        "tags": ["AI新闻", "国内", "技术"],
        "priority": "high",
        "group": "快讯"
    },
]

WEB_GROUP_2_NEWS = [
    {
        "name": "The Rundown AI",
        "url": "https://www.rundown.ai/",
        "type": "newsletter",
        "icon": "https://www.rundown.ai/favicon.ico",
        "tags": ["AI简报", "每日必读"],
        "priority": "high",
        "group": "快讯"
    },
    {
        "name": "X (Twitter)",
        "url": "https://x.com/home",
        "type": "manual",  # 需要手动或特殊处理
        "icon": "https://x.com/favicon.ico",
        "tags": ["社交媒体", "情报"],
        "priority": "high",
        "group": "快讯"
    },
    {
        "name": "Techmeme",
        "url": "https://techmeme.com/",
        "type": "list",
        "selectors": {
            "items": ".clus",
            "title": ".ourh",
            "link": "a",
            "summary": ".ii"
        },
        "icon": "https://techmeme.com/favicon.ico",
        "tags": ["科技新闻", "聚合"],
        "priority": "medium",
        "group": "快讯"
    },
    {
        "name": "NewsNow",
        "url": "https://newsnow.busiyi.world/c/hottest",
        "type": "api",
        "icon": "https://newsnow.busiyi.world/favicon.ico",
        "tags": ["新闻聚合", "全球监控"],
        "priority": "medium",
        "group": "快讯"
    },
    {
        "name": "UpJourney",
        "url": "https://upjourney.com/newsletter-ty",
        "type": "manual",
        "icon": "https://upjourney.com/favicon.ico",
        "tags": ["Newsletter", "列表源"],
        "priority": "low",
        "group": "快讯"
    },
]

# ============ 第三组：硬核教程与深度内容 (你的会员价值) - 7个 ============
# 用途：解决复杂问题。制作工作包、避坑指南、付费教程

RSS_GROUP_3_TUTORIAL = [
    {
        "name": "The Batch (吴恩达)",
        "url": "https://www.deeplearning.ai/the-batch/feed/",
        "icon": "https://www.deeplearning.ai/favicon.ico",
        "tags": ["AI教程", "深度学习", "权威"],
        "priority": "high",
        "group": "教程"
    },
    {
        "name": "掘金",
        "url": "https://juejin.cn/rss",
        "icon": "https://juejin.cn/favicon.ico",
        "tags": ["AI教程", "开发者", "国内"],
        "priority": "medium",
        "group": "教程"
    },
]

WEB_GROUP_3_TUTORIAL = [
    {
        "name": "Linux.do",
        "url": "https://linux.do/latest.json",
        "type": "discourse_api",
        "icon": "https://linux.do/favicon.ico",
        "tags": ["极客", "Prompt", "技术"],
        "priority": "high",
        "group": "教程"
    },
    {
        "name": "WaytoAGI",
        "url": "https://www.waytoagi.com/zh",
        "type": "single",
        "icon": "https://www.waytoagi.com/favicon.ico",
        "tags": ["AI知识", "入门"],
        "priority": "medium",
        "group": "教程"
    },
    {
        "name": "YouTube",
        "url": "https://www.youtube.com/",
        "type": "manual",  # 需要手动或特殊处理
        "icon": "https://www.youtube.com/favicon.ico",
        "tags": ["视频教程", "AI Workflow"],
        "priority": "medium",
        "group": "教程"
    },
    {
        "name": "Reddit",
        "url": "https://www.reddit.com/",
        "type": "manual",
        "icon": "https://www.reddit.com/favicon.ico",
        "tags": ["社区", "真实案例"],
        "priority": "medium",
        "group": "教程"
    },
    {
        "name": "人人都是产品经理",
        "url": "https://www.woshipm.com/",
        "type": "list",
        "icon": "https://www.woshipm.com/favicon.ico",
        "tags": ["产品", "PM视角"],
        "priority": "low",
        "group": "教程"
    },
]

# ============ 第四组：技术源头与未来趋势 (你的护城河) - 8个 ============
# 用途：非常前沿。做趋势分析，比大众早 2 周发现机会

RSS_GROUP_4_FRONTIER = [
    {
        "name": "Hacker News",
        "url": "https://hnrss.org/frontpage",
        "icon": "https://news.ycombinator.com/favicon.ico",
        "tags": ["技术前沿", "硅谷", "高质量"],
        "priority": "high",
        "group": "前沿"
    },
    {
        "name": "MIT Tech Review",
        "url": "https://www.technologyreview.com/feed/",
        "icon": "https://www.technologyreview.com/favicon.ico",
        "tags": ["技术前沿", "深度", "权威"],
        "priority": "high",
        "group": "前沿"
    },
    {
        "name": "a16z Future",
        "url": "https://future.com/feed/",
        "icon": "https://future.com/favicon.ico",
        "tags": ["VC视角", "趋势", "投资"],
        "priority": "medium",
        "group": "前沿"
    },
    {
        "name": "Latent Space",
        "url": "https://www.latent.space/feed",
        "icon": "https://www.latent.space/favicon.ico",
        "tags": ["技术前沿", "工程师", "深度"],
        "priority": "high",
        "group": "前沿"
    },
    {
        "name": "Hugging Face",
        "url": "https://huggingface.co/blog/feed.xml",
        "icon": "https://huggingface.co/favicon.ico",
        "tags": ["开源模型", "技术前沿"],
        "priority": "medium",
        "group": "前沿"
    },
    {
        "name": "Stratechery",
        "url": "https://stratechery.com/feed/",
        "icon": "https://stratechery.com/favicon.ico",
        "tags": ["商业战略", "深度分析"],
        "priority": "medium",
        "group": "前沿"
    },
]

WEB_GROUP_4_FRONTIER = [
    {
        "name": "GitHub Trending",
        "url": "https://github.com/trending",
        "type": "github_trending",
        "icon": "https://github.com/favicon.ico",
        "tags": ["开源", "技术前沿", "代码"],
        "priority": "high",
        "group": "前沿"
    },
    {
        "name": "AI Reading Hub",
        "url": "https://www.aireadinghub.com/",
        "type": "list",
        "icon": "https://www.aireadinghub.com/favicon.ico",
        "tags": ["聚合流", "泛阅读"],
        "priority": "low",
        "group": "前沿"
    },
]

# 合并所有 RSS 源
RSS_FEEDS = (
    RSS_GROUP_1_PRODUCT +
    RSS_GROUP_2_NEWS +
    RSS_GROUP_3_TUTORIAL +
    RSS_GROUP_4_FRONTIER
)

# 合并所有网页源
WEB_SOURCES = (
    WEB_GROUP_1_PRODUCT +
    WEB_GROUP_2_NEWS +
    WEB_GROUP_3_TUTORIAL +
    WEB_GROUP_4_FRONTIER
)

# ==================== 抓取设置 ====================

# 每个源最多抓取多少条 (设为 0 或 None 表示不限制)
MAX_ITEMS_PER_SOURCE = 0  # 不限制数量，抓取全部

# 高优先级源抓取更多 (已废弃，统一不限制)
MAX_ITEMS_HIGH_PRIORITY = 0

# 内容新鲜度：只抓取过去 N 小时内发布的内容
CONTENT_FRESHNESS_HOURS = 24  # 24小时内的内容

# 抓取间隔（秒），避免被封
REQUEST_DELAY = 2

# 请求超时时间（秒）
REQUEST_TIMEOUT = 30

# User-Agent
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# ==================== 定时任务配置 ====================

# 每天抓取时间：零点运行，抓取前一天 00:00 - 23:59 的全部内容
SCHEDULE_TIMES = [
    "00:00",  # 每天零点运行，抓取过去24小时的内容
]

# ==================== AI 摘要配置 ====================

# 摘要提示词
SUMMARY_PROMPT = """你是一个专业的 AI 产品编辑。请阅读以下内容，生成一个简洁但信息丰富的中文摘要。

要求：
1. 摘要长度在 100-200 字之间
2. 如果是 AI 工具/产品，突出其核心功能、适用场景、独特卖点
3. 如果是新闻/资讯，突出核心事件、影响和关键数据
4. 如果是教程，突出解决什么问题、适合谁、关键步骤
5. 使用简洁的语言，适合快速阅读
6. 如果是英文内容，请翻译成中文

标题：{title}
内容：{content}

请直接输出摘要内容，不要加任何前缀。"""

# 分组标签提示词（用于自动打标签）
TAG_PROMPT = """根据以下内容，从下列标签中选择 2-4 个最相关的标签：

可选标签：
- AI工具, AI新闻, AI教程, 技术前沿
- GPT, Claude, 开源模型, 图像生成, 视频生成, 语音合成
- 效率工具, 写作助手, 编程助手, 设计工具
- 创业, 投资, 商业模式
- 国内, 国外, 硅谷

内容：{content}

请只输出标签，用英文逗号分隔，如：AI工具, 效率工具, GPT"""

# ==================== 过滤配置 ====================

# 关键词过滤（标题或内容包含这些词的会被标记）
HIGHLIGHT_KEYWORDS = [
    "GPT-5", "GPT5", "Claude 4", "Gemini 2",
    "OpenAI", "Anthropic", "Google AI",
    "开源", "免费", "重大更新",
    "融资", "收购", "估值"
]

# 排除关键词（包含这些词的不抓取）
EXCLUDE_KEYWORDS = [
    "招聘", "广告", "赞助"
]
