"""
RSS 抓取模块 - 从 RSS 源获取文章
"""
import time
import ssl
import urllib.request
import urllib3
import feedparser
import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
import config

# 禁用 SSL 警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 创建不验证 SSL 证书的上下文 (解决 macOS 证书问题)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE


def parse_publish_date(date_str: str) -> Optional[datetime]:
    """
    解析各种格式的发布日期
    """
    if not date_str:
        return None

    try:
        # 尝试标准 RFC 2822 格式 (RSS 常用)
        return parsedate_to_datetime(date_str)
    except:
        pass

    # 尝试其他常见格式
    formats = [
        "%Y-%m-%dT%H:%M:%S%z",      # ISO 8601
        "%Y-%m-%dT%H:%M:%SZ",       # ISO 8601 UTC
        "%Y-%m-%d %H:%M:%S",        # 简单格式
        "%Y-%m-%d",                 # 只有日期
        "%d %b %Y %H:%M:%S %z",     # RSS 格式变体
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            # 如果没有时区信息，假设为 UTC
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except:
            continue

    return None


def is_within_freshness(pub_date: Optional[datetime], hours: int = 24) -> bool:
    """
    检查发布时间是否在新鲜度范围内
    """
    if not pub_date:
        # 如果没有发布时间，默认包含（避免漏掉内容）
        return True

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=hours)

    return pub_date >= cutoff


def fetch_rss_feeds() -> List[Dict]:
    """
    从所有配置的 RSS 源抓取文章
    """
    all_articles = []

    for feed_config in config.RSS_FEEDS:
        print(f"📡 抓取 RSS: {feed_config['name']}")
        try:
            articles = fetch_single_rss(feed_config)
            all_articles.extend(articles)
            print(f"   ✅ 获取 {len(articles)} 篇文章")
        except Exception as e:
            print(f"   ❌ 抓取失败: {e}")

        # 避免请求过快
        time.sleep(config.REQUEST_DELAY)

    return all_articles


def fetch_single_rss(feed_config: Dict) -> List[Dict]:
    """
    抓取单个 RSS 源
    """
    articles = []

    # 使用 requests 先获取内容，绕过 SSL 验证
    try:
        headers = {"User-Agent": config.USER_AGENT}
        response = requests.get(
            feed_config["url"],
            headers=headers,
            timeout=config.REQUEST_TIMEOUT,
            verify=False  # 跳过 SSL 验证
        )
        response.raise_for_status()
        feed = feedparser.parse(response.content)
    except requests.exceptions.RequestException as e:
        # 如果 requests 失败，回退到 feedparser 直接解析
        feed = feedparser.parse(
            feed_config["url"],
            request_headers={"User-Agent": config.USER_AGENT}
        )

    if feed.bozo and feed.bozo_exception:
        # 忽略某些非致命错误
        if not feed.entries:
            raise Exception(f"RSS 解析错误: {feed.bozo_exception}")

    # 获取新鲜度配置
    freshness_hours = getattr(config, 'CONTENT_FRESHNESS_HOURS', 24)

    # 处理每篇文章 - 不限制数量，按时间过滤
    for entry in feed.entries:
        # 解析发布时间
        pub_date_str = entry.get("published", "") or entry.get("updated", "")
        pub_date = parse_publish_date(pub_date_str)

        # 检查是否在新鲜度范围内
        if not is_within_freshness(pub_date, freshness_hours):
            continue  # 跳过过期内容

        article = {
            "title": entry.get("title", "无标题"),
            "url": entry.get("link", ""),
            "content": _extract_content(entry),
            "author": entry.get("author", ""),
            "published": pub_date_str,
            "published_at": pub_date.isoformat() if pub_date else None,
            "source_name": feed_config["name"],
            "source_icon": feed_config.get("icon", ""),
            "tags": feed_config.get("tags", []),
            "group": feed_config.get("group", "")
        }
        articles.append(article)

    return articles


def _extract_content(entry: Dict) -> str:
    """
    从 RSS entry 中提取正文内容
    """
    # 尝试不同的内容字段
    content = ""

    # 优先使用 content 字段
    if "content" in entry and entry.content:
        content = entry.content[0].get("value", "")

    # 其次使用 summary
    elif "summary" in entry:
        content = entry.summary

    # 最后使用 description
    elif "description" in entry:
        content = entry.description

    # 清理 HTML 标签
    if content:
        soup = BeautifulSoup(content, "html.parser")
        content = soup.get_text(separator=" ", strip=True)

    return content


def fetch_full_article(url: str) -> Optional[str]:
    """
    抓取文章完整内容 (当 RSS 只提供摘要时使用)
    """
    try:
        headers = {"User-Agent": config.USER_AGENT}
        response = requests.get(url, headers=headers, timeout=config.REQUEST_TIMEOUT)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # 移除脚本和样式
        for tag in soup(["script", "style", "nav", "header", "footer", "aside"]):
            tag.decompose()

        # 尝试找到文章主体
        article = soup.find("article") or soup.find("main") or soup.find("body")

        if article:
            return article.get_text(separator=" ", strip=True)

        return soup.get_text(separator=" ", strip=True)
    except Exception as e:
        print(f"获取完整文章失败: {e}")
        return None
