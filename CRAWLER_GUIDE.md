# 小红书爬虫使用指南

本项目集成了小红书内容爬虫，可以自动抓取AI工具使用教程并转换为工作流。

## 功能特性

✅ 自动爬取小红书笔记（关键词搜索）
✅ AI分析提取工作流步骤
✅ 自动转换为平台工作流格式
✅ 保存到数据库
✅ 支持批量处理

## 安装步骤

### 1. Python 环境（已安装）
```bash
python3 --version  # 需要 Python 3.8+
```

### 2. 安装 Python 依赖（正在进行中...）
```bash
cd crawler/MediaCrawler
python3 -m pip install -r requirements.txt
```

### 3. 安装 Playwright 浏览器
```bash
cd crawler/MediaCrawler
python3 -m playwright install chromium
```

## 使用方法

### 方式一：API 调用（推荐）

#### 1. 检查环境
```bash
curl http://localhost:3000/api/crawler/check-environment
```

#### 2. 爬取并分析（一键完成）
```bash
curl -X POST http://localhost:3000/api/crawler/crawl-and-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "ChatGPT使用技巧,AI办公工具",
    "maxCount": 10,
    "userId": "你的用户ID"
  }'
```

响应示例：
```json
{
  "success": true,
  "crawled": 10,
  "analyzed": 7,
  "saved": 7,
  "workflows": [
    {
      "id": "xxx",
      "title": "使用ChatGPT快速写周报",
      "description": "3步完成高质量周报撰写",
      "category": "办公效率"
    }
  ]
}
```

#### 3. 只爬取不分析
```bash
curl -X POST http://localhost:3000/api/crawler/xiaohongshu \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "Midjourney教程",
    "maxCount": 5
  }'
```

### 方式二：Python 直接运行

```bash
cd crawler/MediaCrawler

# 修改配置
export KEYWORDS="AI工具使用,ChatGPT教程"
export CRAWLER_MAX_NOTES_COUNT=20

# 运行爬虫
python3 main.py
```

## 配置说明

### 关键配置项（`crawler/xhs_crawler_config.py`）

```python
# 平台
PLATFORM = "xhs"  # 小红书

# 搜索关键词（重要！）
KEYWORDS = "AI工具使用,ChatGPT教程,AI工作流"

# 爬取数量
CRAWLER_MAX_NOTES_COUNT = 20  # 每个关键词20条

# 登录方式
LOGIN_TYPE = "qrcode"  # 二维码登录

# 反检测
ENABLE_CDP_MODE = True  # 使用真实浏览器

# 数据格式
SAVE_DATA_OPTION = "json"  # 保存为JSON
```

### 推荐搜索关键词

**内容创作类：**
- ChatGPT写作技巧
- AI文案生成
- 小红书AI爆款
- Midjourney教程

**办公效率类：**
- AI办公工具
- ChatGPT提升效率
- AI数据分析
- Excel+AI

**设计类：**
- Midjourney关键词
- AI设计工具
- Stable Diffusion
- AI作图

**编程类：**
- Cursor使用教程
- GitHub Copilot
- AI编程助手

## 工作流程

```
1. 用户发起爬取请求（API或命令行）
   ↓
2. MediaCrawler 爬取小红书笔记
   - 笔记标题、描述、内容
   - 图片、标签、评论
   - 点赞/收藏/分享数
   ↓
3. AI 分析笔记内容
   - 识别是否为AI工具教程
   - 提取使用步骤
   - 识别AI工具列表
   - 提取提示词和参数
   ↓
4. 转换为工作流格式
   - 生成节点（输入/LLM/工具/输出）
   - 生成连接关系
   - 添加示例数据
   ↓
5. 保存到数据库
   - 作为公开模板
   - 自动分类和打标签
```

## 首次使用

**首次运行需要登录小红书：**

1. 运行爬虫时会自动打开浏览器
2. 扫描二维码登录小红书
3. 通过滑动验证（如果有）
4. 登录信息会自动保存，下次无需重新登录

**提示：**
- 保持 `HEADLESS = False`（首次）
- 登录成功后可改为 `True`（无头模式）
- 登录状态保存在 `xhs_user_data_dir` 目录

## API 端点

### 1. 检查环境
```
GET /api/crawler/check-environment
```

### 2. 爬取小红书
```
POST /api/crawler/xiaohongshu
Body: {
  "keywords": string,
  "maxCount": number (optional, default: 20)
}
```

### 3. 爬取并分析（推荐）
```
POST /api/crawler/crawl-and-analyze
Body: {
  "keywords": string,
  "maxCount": number (optional),
  "userId": string
}
```

### 4. 分析单条笔记
```
POST /api/crawler/analyze-note
Body: { ...noteData }
```

## 数据输出

### 爬取的原始数据
保存位置：`crawler/MediaCrawler/data/xhs/`

### 生成的工作流
保存到数据库 `workflows` 表：
- `sourceType`: "text"
- `sourceContent`: 原始笔记数据
- `isTemplate`: true
- `isPublic`: true

## 注意事项

⚠️ **合法合规使用**
- 仅用于学习研究
- 遵守小红书使用条款
- 控制爬取频率（默认间隔3秒）
- 不得用于商业用途

⚠️ **技术限制**
- 需要手动登录（首次）
- 可能遇到验证码
- IP可能被限制（需要代理）
- API调用有限额（Claude）

⚠️ **成本控制**
- 每个笔记分析消耗 ~0.01-0.05 RMB（Claude API）
- 建议小批量测试
- 设置合理的 `maxCount`

## 故障排除

### 问题1：爬虫启动失败
```bash
# 检查 Python 环境
python3 --version

# 重新安装依赖
cd crawler/MediaCrawler
pip3 install -r requirements.txt
```

### 问题2：浏览器无法打开
```bash
# 安装 Playwright 浏览器
python3 -m playwright install chromium
```

### 问题3：登录失败
- 手动设置 `HEADLESS = False`
- 打开浏览器手动过验证码
- 检查网络连接

### 问题4：AI 分析失败
- 检查 `ANTHROPIC_API_KEY` 环境变量
- 检查 API 额度
- 查看日志 `backend/logs/`

## 后续优化

🔮 **计划功能：**
- [ ] 支持更多平台（B站、知乎、抖音）
- [ ] 增量爬取（避免重复）
- [ ] 工作流相似度去重
- [ ] 定时自动爬取
- [ ] 用户评分和筛选
- [ ] 工作流标签自动分类

## 相关文件

```
crawler/
├── MediaCrawler/          # 爬虫主体（Git 子模块）
├── xhs_crawler_config.py  # 爬虫配置

backend/src/
├── services/
│   ├── crawler.service.ts    # 爬虫服务
│   └── ai-analyzer.service.ts  # AI 分析服务
└── routes/
    └── crawler.routes.ts     # API 路由
```

## 技术栈

- **爬虫**: MediaCrawler (Python + Playwright)
- **AI 分析**: Claude 3.5 Sonnet
- **后端**: Node.js + TypeScript
- **数据库**: PostgreSQL (Prisma)

---

有问题？查看日志：
- 后端日志：`backend/logs/app-*.log`
- 爬虫日志：运行时输出
