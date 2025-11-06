# 小红书爬虫快速开始 🚀

恭喜！小红书AI教程爬虫系统已经安装完成。

## ✅ 已完成的配置

### 1. Python 环境
- ✅ Python 3.13.7
- ✅ Playwright 1.55.0
- ✅ 所有爬虫依赖已安装
- ✅ Chromium 浏览器已下载

### 2. Node.js 服务
- ✅ 爬虫服务 (`backend/src/services/crawler.service.ts`)
- ✅ AI 分析服务 (`backend/src/services/ai-analyzer.service.ts`)
- ✅ API 路由 (`/api/crawler/*`)

### 3. 爬虫配置
- ✅ MediaCrawler 已克隆
- ✅ 配置文件已创建 (`crawler/xhs_crawler_config.py`)

## 🎯 立即开始

### 方式一：通过 API（推荐）

1. **启动后端服务**
```bash
cd backend
npm run dev
```

2. **调用爬虫API**
```bash
curl -X POST http://localhost:3000/api/crawler/crawl-and-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "ChatGPT使用技巧,AI办公",
    "maxCount": 10,
    "userId": "你的用户ID"
  }'
```

3. **查看结果**
- 爬取的笔记会被AI分析
- 自动转换为工作流
- 保存到数据库的 `workflows` 表

### 方式二：直接运行 Python 爬虫

```bash
cd crawler/MediaCrawler
python3 main.py
```

首次运行会打开浏览器，需要扫码登录小红书。

## 📋 可用的 API 端点

### 1. 检查环境
```bash
GET http://localhost:3000/api/crawler/check-environment
```

### 2. 只爬取数据
```bash
POST http://localhost:3000/api/crawler/xiaohongshu
{
  "keywords": "AI工具教程",
  "maxCount": 20
}
```

### 3. 爬取并分析（完整流程）
```bash
POST http://localhost:3000/api/crawler/crawl-and-analyze
{
  "keywords": "Midjourney教程,AI设计",
  "maxCount": 15,
  "userId": "clxxxxx"
}
```

### 4. 分析单条笔记
```bash
POST http://localhost:3000/api/crawler/analyze-note
{
  "noteId": "xxx",
  "title": "...",
  "desc": "..."
}
```

## 🔥 推荐搜索关键词

### 办公效率
- `AI办公工具`
- `ChatGPT提升效率`
- `Excel+AI`
- `AI写周报`

### 内容创作
- `ChatGPT写作技巧`
- `AI文案生成`
- `小红书AI爆款`
- `AI剪辑视频`

### 设计类
- `Midjourney教程`
- `AI作图技巧`
- `Stable Diffusion`
- `AI设计工具`

### 编程类
- `Cursor使用教程`
- `GitHub Copilot`
- `AI代码助手`

## 📊 数据流程

```
1. 用户发起请求
   ↓
2. 爬取小红书笔记（标题、内容、图片、评论等）
   ↓
3. Claude AI 分析笔记
   - 识别是否为 AI 工具教程
   - 提取使用步骤
   - 识别 AI 工具列表
   - 提取提示词和参数
   ↓
4. 转换为工作流格式
   - 生成节点（输入/LLM/工具/输出）
   - 生成连接关系
   - 添加示例数据
   ↓
5. 保存到数据库
   - 作为公开模板（isPublic: true）
   - 自动分类和打标签
```

## 🎬 首次使用提示

**首次运行需要登录小红书：**

1. 运行爬虫时会自动打开浏览器窗口
2. 扫描二维码登录小红书账号
3. 通过滑动验证码（如果出现）
4. 登录成功后，状态会自动保存
5. 下次运行无需重新登录

**登录状态保存位置：**
- `crawler/MediaCrawler/xhs_user_data_dir/`

## ⚙️ 配置调整

编辑 `crawler/xhs_crawler_config.py` 可以调整：

```python
# 搜索关键词
KEYWORDS = "AI工具使用,ChatGPT教程,AI工作流"

# 爬取数量（每个关键词）
CRAWLER_MAX_NOTES_COUNT = 20

# 评论数量（每条笔记）
CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES = 5

# 爬取间隔（秒）
CRAWLER_MAX_SLEEP_SEC = 3

# 无头模式（登录后可开启）
HEADLESS = False
```

## 💰 成本估算

使用 Claude 3.5 Sonnet 分析：
- 每条笔记分析：~0.01-0.05 RMB
- 10 条笔记：~0.1-0.5 RMB
- 建议小批量测试，设置合理的 maxCount

## ⚠️ 注意事项

1. **合规使用**
   - 仅用于学习研究
   - 遵守小红书使用条款
   - 控制爬取频率
   - 不得用于商业用途

2. **环境变量**
   - 需要在 `backend/.env` 中配置 `ANTHROPIC_API_KEY`
   - 否则 AI 分析功能无法使用

3. **首次登录**
   - 保持 `HEADLESS = False`
   - 登录成功后可改为 `True`（无头模式）

## 🐛 故障排除

### 问题：爬虫启动失败
```bash
# 检查依赖
pip3 list | grep playwright

# 重新安装
pip3 install playwright --upgrade
python3 -m playwright install chromium
```

### 问题：AI 分析失败
```bash
# 检查环境变量
echo $ANTHROPIC_API_KEY

# 查看后端日志
tail -f backend/logs/app-*.log
```

### 问题：登录超时
- 手动设置 `HEADLESS = False`
- 确保网络正常
- 尝试更换网络或使用代理

## 📂 相关文件

```
crawler/
├── MediaCrawler/              # 爬虫主体
├── xhs_crawler_config.py      # 爬虫配置
└── quick-start.sh             # 快速启动脚本

backend/src/
├── services/
│   ├── crawler.service.ts     # 爬虫服务
│   └── ai-analyzer.service.ts # AI 分析服务
└── routes/
    └── crawler.routes.ts      # API 路由
```

## 📚 完整文档

详细使用说明请查看：`CRAWLER_GUIDE.md`

---

## 🎉 现在开始吧！

```bash
# 1. 启动后端
cd backend && npm run dev

# 2. 调用爬虫（新终端）
curl -X POST http://localhost:3000/api/crawler/crawl-and-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "ChatGPT使用技巧",
    "maxCount": 5,
    "userId": "你的用户ID"
  }'
```

祝你爬取愉快！🎊
