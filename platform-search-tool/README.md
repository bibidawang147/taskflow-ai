# 🔍 平台搜索工具

个人使用的多平台内容搜索工具，基于MediaCrawler爬虫。

## ✨ 功能特点

- 🎯 支持7大平台：小红书、抖音、B站、快手、微博、贴吧、知乎
- 💻 命令行界面，简单易用
- 📊 结果导出为JSON/CSV格式
- 🔐 安全的二维码登录
- 💾 自动保存登录状态
- 🚀 基于成熟的MediaCrawler框架

## ⚠️ 重要声明

**本工具仅供个人学习研究使用，请勿用于商业用途。**

使用本工具时请注意：
- ✅ 遵守目标平台的服务条款
- ✅ 合理控制爬取频率，避免对服务器造成压力
- ✅ 尊重内容版权，不要传播或商业利用爬取的内容
- ✅ 仅用于个人学习研究，不对外提供服务

## 📦 安装依赖

### 方式1: 使用uv (推荐)

```bash
# 安装uv
pip install uv

# 进入MediaCrawler目录
cd ../crawler/MediaCrawler

# 安装依赖
uv sync

# 安装浏览器
uv run playwright install
```

### 方式2: 使用pip

```bash
cd ../crawler/MediaCrawler
pip install -r requirements.txt
playwright install
```

## 🚀 快速开始

### 方法一：使用启动脚本（最简单）

```bash
./start.sh
```

然后选择"1. 命令行搜索"，按提示操作即可。

### 方法二：直接运行命令行工具

```bash
# 进入MediaCrawler目录
cd ../crawler/MediaCrawler

# 运行搜索工具
uv run python ../../platform-search-tool/search_cli.py
```

### 方法三：直接使用MediaCrawler

```bash
cd ../crawler/MediaCrawler

# 搜索小红书
uv run main.py --platform xhs --lt qrcode --type search

# 搜索抖音
uv run main.py --platform dy --lt qrcode --type search

# 搜索B站
uv run main.py --platform bili --lt qrcode --type search
```

## 📖 使用说明

### 1. 选择平台

运行工具后，会提示选择要搜索的平台：

```
📱 选择要搜索的平台:
  1. 小红书 (xhs)
  2. 抖音 (dy)
  3. B站 (bili)
  4. 快手 (ks)
  5. 微博 (wb)
  6. 贴吧 (tieba)
  7. 知乎 (zhihu)
```

### 2. 输入搜索词

```
🔍 输入搜索关键词: ChatGPT使用技巧
📊 搜索数量 (默认20): 30
```

### 3. 登录平台

首次使用时，会弹出浏览器窗口，需要扫码登录：

- **小红书**: 扫码登录，登录状态会保存
- **抖音**: 扫码登录
- **B站**: 扫码登录或账号密码登录

登录成功后，下次使用无需重复登录。

### 4. 等待爬取

工具会自动：
- 打开浏览器
- 搜索关键词
- 滚动页面加载内容
- 提取数据
- 保存到本地

### 5. 查看结果

搜索完成后，结果保存在：

```
crawler/MediaCrawler/data/
```

文件格式：
- `xhs/` - 小红书数据
- `douyin/` - 抖音数据
- `bilibili/` - B站数据
- 等等...

每个目录下有JSON文件，包含：
- 标题
- 内容
- 作者信息
- 点赞/评论数
- 发布时间
- 原文链接

## 🛠️ 高级配置

### 修改搜索参数

编辑 `crawler/MediaCrawler/config/base_config.py`:

```python
# 搜索关键词
KEYWORDS = "你的关键词"

# 爬取数量
CRAWLER_MAX_NOTES_COUNT = 50

# 是否爬取评论
ENABLE_GET_COMMENTS = True

# 是否爬取二级评论
ENABLE_GET_SUB_COMMENTS = False

# 并发数 (建议为1，避免被限流)
MAX_CONCURRENCY_NUM = 1
```

### 使用代理

如果被限流，可以配置IP代理：

```python
# 启用代理
ENABLE_IP_PROXY = True

# 代理配置
IP_PROXY_POOL_COUNT = 5
```

### 切换数据存储方式

```python
# 可选：json, csv, db, sqlite
SAVE_DATA_OPTION = "json"
```

## 📊 导出数据

### 导出为Excel

搜索完成后，可以使用Python脚本导出：

```python
import json
import pandas as pd

# 读取JSON数据
with open('crawler/MediaCrawler/data/xhs/xhs_notes.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 转换为DataFrame
df = pd.DataFrame(data)

# 导出为Excel
df.to_excel('搜索结果.xlsx', index=False, engine='openpyxl')
```

或者直接在Excel中打开JSON文件（需要Power Query）。

## ❓ 常见问题

### Q: 浏览器无法打开？

A: 确保已安装playwright浏览器：
```bash
uv run playwright install
```

### Q: 登录后仍然显示未登录？

A: 删除cookie缓存重新登录：
```bash
rm -rf crawler/MediaCrawler/browser_data/
```

### Q: 爬取速度慢？

A:
- 减少搜索数量
- 不爬取评论（ENABLE_GET_COMMENTS = False）
- 使用无头模式（HEADLESS = True）

### Q: 被限流怎么办？

A:
- 降低并发数（MAX_CONCURRENCY_NUM = 1）
- 增加请求间隔
- 使用代理IP
- 减少爬取数量

### Q: 数据保存在哪里？

A:
```
crawler/MediaCrawler/data/
  ├── xhs/          # 小红书数据
  ├── douyin/       # 抖音数据
  ├── bilibili/     # B站数据
  └── ...
```

## 📝 使用示例

### 示例1: 搜索小红书笔记

```bash
cd ../crawler/MediaCrawler
export KEYWORDS="Python编程"
export CRAWLER_MAX_NOTES_COUNT=30
uv run main.py --platform xhs --lt qrcode --type search
```

### 示例2: 爬取指定作者

```bash
# 编辑config/base_config.py，设置作者ID
# XHS_CREATOR_IDS = ["作者ID1", "作者ID2"]
uv run main.py --platform xhs --lt qrcode --type creator
```

### 示例3: 爬取指定帖子详情

```bash
# 编辑config/base_config.py，设置笔记ID
# XHS_NOTE_IDS = ["笔记ID1", "笔记ID2"]
uv run main.py --platform xhs --lt qrcode --type detail
```

## 🔗 相关链接

- [MediaCrawler项目](https://github.com/NanmiCoder/MediaCrawler)
- [MediaCrawler文档](../crawler/MediaCrawler/README.md)
- [常见问题](../crawler/MediaCrawler/docs/常见问题.md)

## 📄 许可证

本工具基于MediaCrawler开发，仅供个人学习研究使用。

**再次提醒：请勿将本工具用于商业用途或违反平台服务条款的行为。**

## 💡 技术支持

如有问题，请参考：
1. MediaCrawler官方文档
2. 查看 `crawler/MediaCrawler/docs/常见问题.md`
3. 检查 `crawler/MediaCrawler/config/base_config.py` 配置

---

**祝使用愉快！ 🎉**
