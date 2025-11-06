# -*- coding: utf-8 -*-
# 小红书爬虫配置文件 - 用于工作流平台

import sys
import os

# 添加 MediaCrawler 到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'MediaCrawler'))

# 导入基础配置
from config.base_config import *

# 覆盖关键配置
PLATFORM = "xhs"  # 小红书平台

# 搜索关键词 - 专注于 AI 工具使用教程
KEYWORDS = "AI工具使用,ChatGPT教程,AI工作流,Midjourney教程,AI实战,AI办公技巧"

# 爬虫类型 - 关键词搜索
CRAWLER_TYPE = "search"

# 登录方式 - 二维码扫码登录
LOGIN_TYPE = "qrcode"

# 使用 CDP 模式 - 更好的反检测
ENABLE_CDP_MODE = False  # 暂时关闭,使用标准模式的登录状态
CDP_HEADLESS = False  # 显示浏览器，便于首次登录

# 数据保存格式 - JSON，便于后续处理
SAVE_DATA_OPTION = "json"

# 爬取数量控制（实用配置）
CRAWLER_MAX_NOTES_COUNT = 20  # 每个关键词爬 20 条（文本数据很小，放心使用）
CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES = 5  # 每条笔记爬取5条评论

# 启用评论爬取
ENABLE_GET_COMMENTS = True

# 不启用二级评论（加快速度）
ENABLE_GET_SUB_COMMENTS = False

# 不下载媒体文件（节省时间和空间）
ENABLE_GET_MEIDAS = False

# 爬取间隔（秒）- 避免被封
CRAWLER_MAX_SLEEP_SEC = 3

# 并发数
MAX_CONCURRENCY_NUM = 1

# 保存登录状态
SAVE_LOGIN_STATE = True

# 无头模式关闭（首次需要登录）
HEADLESS = False

# 小红书排序方式 - 热门优先
SORT_TYPE = "popularity_descending"

print(f"✓ 配置加载成功")
print(f"✓ 平台: {PLATFORM}")
print(f"✓ 关键词: {KEYWORDS}")
print(f"✓ 爬取数量: {CRAWLER_MAX_NOTES_COUNT}")
