# 内容自动化抓取 & 审核系统

完整的内容自动化工作流：**定时抓取 → AI 摘要 → 人工审核 → 发布**

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        自动化流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌───────────┐    ┌───────────┐    ┌───────────┐              │
│   │  RSS 源   │    │  网页爬虫  │    │  API 接口  │              │
│   │ (feedparser)│   │(BeautifulSoup)│  │ (自定义)  │              │
│   └─────┬─────┘    └─────┬─────┘    └─────┬─────┘              │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          ▼                                      │
│              ┌───────────────────────┐                         │
│              │    AI 摘要生成        │                         │
│              │  (GPT/通义千问/Claude) │                         │
│              └───────────┬───────────┘                         │
│                          ▼                                      │
│              ┌───────────────────────┐                         │
│              │     保存到数据库       │                         │
│              │    (status=pending)    │                         │
│              └───────────┬───────────┘                         │
│                          ▼                                      │
│              ┌───────────────────────┐                         │
│              │     审核页面 (Web)     │  ← 你在这里审核          │
│              │   ✅ 发布  ❌ 拒绝     │                         │
│              └───────────────────────┘                         │
│                                                                 │
│   定时任务: 每天 08:00 / 12:00 / 18:00 / 22:00 自动执行          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 功能特性

### 自动抓取 (Python)
- 📡 **RSS 订阅** - 支持任意 RSS/Atom 源
- 🌐 **网页爬虫** - 针对没有 RSS 的网站
- 🤖 **AI 摘要** - 自动生成中文摘要
- ⏰ **定时任务** - 每天固定时间自动运行
- 🔄 **去重检测** - 自动跳过已抓取的内容

### 审核页面 (Web)
- 📋 **卡片式界面** - 清晰展示待审核内容
- ✅ **一键发布/拒绝** - 快速处理，乐观更新
- ✏️ **摘要编辑** - 可修改 AI 生成的摘要
- 📊 **统计面板** - 实时显示各状态数量
- 🚀 **批量发布** - 一键发布所有内容

## 文件结构

```
content-review/
├── README.md                 # 本文档
└── crawler/                  # Python 抓取脚本
    ├── requirements.txt      # Python 依赖
    ├── config.py            # 配置文件 (信息源、AI 等)
    ├── main.py              # 主程序入口
    ├── rss_fetcher.py       # RSS 抓取模块
    ├── web_scraper.py       # 网页爬虫模块
    ├── ai_summary.py        # AI 摘要模块
    ├── api_client.py        # API 客户端
    └── .env.example         # 环境变量模板

frontend/src/
├── pages/
│   └── ContentReviewPage.tsx    # 审核页面
└── services/
    └── aiFeedsApi.ts            # API 服务

backend/
├── src/routes/
│   └── aiFeeds.ts               # API 路由
└── prisma/
    └── schema.prisma            # 数据库模型
```

## 数据库模型

```prisma
model AiFeed {
  id          String   @id @default(cuid())
  title       String   // 文章标题
  aiSummary   String   // AI 生成的摘要
  originalUrl String   // 原文链接
  tags        String?  // JSON 数组: ["AI", "Tools"]
  status      String   @default("pending") // pending | published | rejected

  // 元数据
  sourceName  String?  // 来源名称
  sourceIcon  String?  // 来源图标 URL
  author      String?  // 原文作者
  imageUrl    String?  // 封面图片 URL

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  publishedAt DateTime? // 发布时间
}
```

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/admin/feeds` | 获取 feeds 列表 |
| GET | `/api/admin/feeds/stats` | 获取统计信息 |
| PATCH | `/api/admin/feeds/:id` | 更新单个 feed |
| PATCH | `/api/admin/feeds/batch` | 批量更新状态 |
| POST | `/api/admin/feeds` | 创建新 feed |
| DELETE | `/api/admin/feeds/:id` | 删除 feed |

### 请求示例

```bash
# 获取待审核内容
curl http://localhost:3000/api/admin/feeds?status=pending

# 发布内容
curl -X PATCH http://localhost:3000/api/admin/feeds/{id} \
  -H "Content-Type: application/json" \
  -d '{"status": "published"}'

# 批量发布
curl -X PATCH http://localhost:3000/api/admin/feeds/batch \
  -H "Content-Type: application/json" \
  -d '{"ids": ["id1", "id2"], "status": "published"}'

# 创建测试数据
curl -X POST http://localhost:3000/api/admin/feeds \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试文章",
    "aiSummary": "这是 AI 生成的摘要",
    "originalUrl": "https://example.com/article",
    "tags": ["AI", "测试"]
  }'
```

## 快速开始

### 1. 确保数据库已更新

```bash
cd backend
npx prisma db push
```

### 2. 添加测试数据

```bash
cd backend
npx ts-node seed-ai-feeds.ts
```

### 3. 启动服务

```bash
# 启动后端
cd backend
npm run dev

# 启动前端
cd frontend
npm run dev
```

### 4. 访问页面

打开浏览器访问: `http://localhost:5173/admin/content-review`

## Python 脚本集成

你的 Python 脚本可以通过 API 将抓取的内容写入数据库：

```python
import requests

def save_feed(title, summary, url, tags=None, source=None):
    response = requests.post(
        'http://localhost:3000/api/admin/feeds',
        json={
            'title': title,
            'aiSummary': summary,
            'originalUrl': url,
            'tags': tags or [],
            'sourceName': source
        }
    )
    return response.json()

# 使用示例
save_feed(
    title="新发现的 AI 工具",
    summary="这个工具可以...",
    url="https://example.com",
    tags=["AI", "工具"],
    source="Hacker News"
)
```

## 界面预览

审核页面包含：
- 顶部：标题 + 刷新按钮 + 全部发布按钮
- 统计面板：待审核/已发布/已拒绝/总计
- 筛选器：可切换查看不同状态的内容
- 卡片网格：每张卡片显示标题、摘要、标签和操作按钮

---

# 快速开始

## 1. 本地测试

### Step 1: 安装 Python 依赖

```bash
cd content-review/crawler
pip install -r requirements.txt
```

### Step 2: 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 AI API Key
```

### Step 3: 配置信息源

编辑 `config.py`，添加你想抓取的 RSS 源和网站。

### Step 4: 启动后端服务

```bash
cd backend
npm run dev
```

### Step 5: 运行抓取脚本

```bash
cd content-review/crawler
python main.py
```

### Step 6: 打开审核页面

访问: http://localhost:5173/admin/content-review

---

## 2. 云服务器部署

### Step 1: 服务器准备

```bash
# 安装 Node.js (推荐 v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 Python 3.10+
sudo apt install -y python3 python3-pip python3-venv

# 安装 PM2 (进程管理)
sudo npm install -g pm2
```

### Step 2: 部署后端

```bash
cd backend
npm install
npx prisma db push

# 使用 PM2 启动
pm2 start npm --name "workflow-backend" -- run start
```

### Step 3: 部署前端

```bash
cd frontend
npm install
npm run build

# 使用 Nginx 提供静态文件服务
sudo cp -r dist/* /var/www/html/
```

### Step 4: 配置 Python 抓取脚本

```bash
cd content-review/crawler

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
nano .env  # 编辑配置
```

### Step 5: 设置定时任务 (Cron)

```bash
# 编辑 crontab
crontab -e

# 添加以下行 (每天 8/12/18/22 点运行)
0 8,12,18,22 * * * cd /path/to/content-review/crawler && /path/to/venv/bin/python main.py >> /var/log/crawler.log 2>&1
```

或者使用守护进程模式：

```bash
# 使用 PM2 运行 Python 守护进程
pm2 start main.py --name "content-crawler" --interpreter python3
```

### Step 6: 配置 Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 3. 添加信息源

### 添加 RSS 源

编辑 `crawler/config.py`：

```python
RSS_FEEDS = [
    {
        "name": "Hacker News",
        "url": "https://hnrss.org/frontpage",
        "icon": "https://news.ycombinator.com/favicon.ico",
        "tags": ["Tech", "Startup"]
    },
    {
        "name": "少数派",
        "url": "https://sspai.com/feed",
        "icon": "https://sspai.com/favicon.ico",
        "tags": ["效率", "工具"]
    },
    # 添加更多...
]
```

### 添加网页爬虫

对于没有 RSS 的网站，在 `config.py` 中配置：

```python
WEB_SOURCES = [
    {
        "name": "36氪",
        "url": "https://36kr.com/newsflashes",
        "type": "list",
        "selectors": {
            "items": ".newsflash-item",
            "title": ".item-title",
            "link": "a",
            "summary": ".item-desc"
        },
        "tags": ["科技", "创业"]
    },
]
```

或者使用内置的专用抓取器 (在 `web_scraper.py` 中)：

```python
# 在 main.py 的 run_crawler() 中取消注释
all_articles.extend(fetch_36kr_newsflash())
all_articles.extend(fetch_sspai())
```

---

## 4. 配置 AI 摘要

### 使用 OpenAI (海外)

```bash
# .env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4o-mini
```

### 使用通义千问 (国内推荐)

```bash
# .env
AI_PROVIDER=dashscope
DASHSCOPE_API_KEY=sk-xxx
```

获取 API Key: https://dashscope.aliyun.com/

### 使用 Claude

```bash
# .env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-xxx
```

---

## 常见问题

### Q: 如何查看抓取日志？

```bash
# 如果使用 PM2
pm2 logs content-crawler

# 如果使用 cron
tail -f /var/log/crawler.log
```

### Q: 如何手动触发一次抓取？

```bash
cd content-review/crawler
python main.py
```

### Q: 如何修改定时时间？

编辑 `config.py` 中的 `SCHEDULE_TIMES`：

```python
SCHEDULE_TIMES = [
    "08:00",
    "20:00",  # 改成你想要的时间
]
```

### Q: 网站被封怎么办？

1. 增加 `REQUEST_DELAY` 延迟
2. 更换 User-Agent
3. 使用代理

---

## 扩展建议

1. **添加认证** - 目前 API 没有认证，生产环境建议添加
2. **键盘快捷键** - 可以添加 j/k 导航，a/r 快速审核
3. **微信推送** - 集成 Server酱 推送新内容通知
4. **更多信息源** - 支持 Twitter/X、Reddit API 等
