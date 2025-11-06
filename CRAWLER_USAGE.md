# 🚀 爬虫使用指南

## 📊 空间占用真相

```
你的剩余空间：6.7GB

爬取 1000 条笔记（文本）：
├─ JSON 数据：~5MB
├─ 数据库：~1MB
├─ 浏览器缓存：~200MB（一次性）
└─ 总计：~206MB (占用 3%)

爬取 10,000 条笔记：
└─ 总计：~250MB (占用不到 4%)
```

**结论：6.7GB 够爬几万条，完全不用担心！**

---

## 🎯 三种使用模式

### 模式1️⃣：快速测试（2-5条）
```bash
# 测试爬虫是否工作
./test-crawler.sh

预计：<1MB，1分钟
```

### 模式2️⃣：单次采集（20-50条）
```bash
curl -X POST http://localhost:3000/api/crawler/crawl-and-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "ChatGPT使用技巧,AI办公工具",
    "maxCount": 50,
    "userId": "你的ID"
  }'

预计：~250KB，5分钟
```

### 模式3️⃣：批量建库（200-1000条）
```bash
# 自动爬取多个关键词
./test-crawler-batch.sh

覆盖领域：
- 办公效率（ChatGPT、AI工具）
- 内容创作（文案、视频）
- 设计类（Midjourney、AI作图）
- 编程类（Cursor、Copilot）
- 数据分析（AI分析工具）

预计：10个关键词 × 20条 = 200条
占用：~1MB，30分钟
```

---

## 📈 推荐采集策略

### 阶段一：快速启动（第1天）
```
目标：50-100个工作流
操作：运行批量脚本1次
结果：覆盖基础场景
```

### 阶段二：丰富内容（第1周）
```
目标：200-500个工作流
操作：每天爬1-2个新领域
策略：根据用户反馈补充
```

### 阶段三：持续更新（长期）
```
目标：保持新鲜度
操作：每周爬取热门关键词
频率：每周 50-100 条新增
```

---

## 🔧 实用命令

### 查看已爬取数据
```bash
# 查看 JSON 文件
ls -lh crawler/MediaCrawler/data/xhs/

# 查看数据库工作流数量
sqlite3 backend/prisma/dev.db "SELECT COUNT(*) FROM workflows WHERE sourceType='text';"
```

### 清理旧数据
```bash
# 只保留最近30天的 JSON
find crawler/MediaCrawler/data/xhs/*.json -mtime +30 -delete

# 压缩备份
tar -czf data_backup_$(date +%Y%m).tar.gz crawler/MediaCrawler/data/xhs/
```

### 监控空间使用
```bash
# 查看爬虫数据占用
du -sh crawler/MediaCrawler/data/

# 查看总空间
df -h
```

---

## 💰 成本估算（如果用 AI 分析）

### 使用 Claude API
```
每条笔记分析：~0.01-0.05 RMB
50 条：~0.5-2.5 RMB
200 条：~2-10 RMB
1000 条：~10-50 RMB
```

### 使用通义千问（更便宜）
```
每条笔记分析：~0.002-0.01 RMB
50 条：~0.1-0.5 RMB
200 条：~0.4-2 RMB
1000 条：~2-10 RMB
```

**建议：先测试 5-10 条，确认效果后再批量。**

---

## 🎯 关键词推荐库

### 办公效率（10个）
```
ChatGPT办公技巧
AI写周报
Excel+AI
AI邮件助手
AI会议纪要
AI翻译工具
AI时间管理
AI项目管理
AI数据分析
AI PPT制作
```

### 内容创作（10个）
```
AI文案生成
小红书AI爆款
AI视频脚本
AI短视频剪辑
AI配音工具
AI字幕生成
AI文章改写
AI SEO优化
AI营销文案
AI自媒体工具
```

### 设计类（10个）
```
Midjourney教程
AI logo设计
AI海报生成
Stable Diffusion
AI插画工具
AI UI设计
AI配色方案
AI图片修复
AI抠图工具
AI设计素材
```

### 编程类（10个）
```
Cursor使用教程
GitHub Copilot
AI代码助手
AI代码审查
AI debug工具
AI代码注释
AI测试用例
AI API生成
AI SQL查询
AI正则表达式
```

### 学习提升（10个）
```
AI学习计划
AI知识总结
AI笔记整理
AI思维导图
AI英语学习
AI论文写作
AI课程助手
AI阅读理解
AI记忆训练
AI技能学习
```

---

## ⚡ 快速开始

```bash
# 1. 启动后端
cd backend && npm run dev

# 2A. 快速测试（2条）
./test-crawler.sh

# 2B. 批量采集（200条）
./test-crawler-batch.sh
```

---

## 📚 相关文档

- `STORAGE_CALCULATOR.md` - 详细空间计算
- `CRAWLER_GUIDE.md` - 完整技术文档
- `CRAWLER_QUICK_START.md` - 快速开始指南

---

**记住：文本数据极小，放心爬！你的 6.7GB 够爬几万条！** 🎉
