"""
网页爬虫模块 - 用于抓取没有 RSS 的网站
包含多个专用抓取器
"""
import time
import requests
import urllib3
from bs4 import BeautifulSoup
from typing import List, Dict
import config

# 禁用 SSL 警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def fetch_web_sources() -> List[Dict]:
    """
    从所有配置的网页源抓取文章
    """
    all_articles = []

    for source_config in config.WEB_SOURCES:
        print(f"🌐 抓取网页: {source_config['name']}")
        try:
            source_type = source_config.get("type", "list")

            if source_type == "github_trending":
                articles = fetch_github_trending(source_config)
            elif source_type == "discourse_api":
                articles = fetch_discourse_api(source_config)
            elif source_type == "aibase":
                articles = fetch_aibase(source_config)
            elif source_type == "list":
                articles = fetch_list_page(source_config)
            elif source_type == "api":
                # 特殊 API 站点，跳过或特殊处理
                articles = fetch_api_source(source_config)
            elif source_type == "manual":
                # 手动来源，跳过自动抓取
                articles = []
            else:
                articles = fetch_single_page(source_config)

            all_articles.extend(articles)
            print(f"   ✅ 获取 {len(articles)} 篇文章")
        except Exception as e:
            print(f"   ❌ 抓取失败: {e}")

        time.sleep(config.REQUEST_DELAY)

    return all_articles


def fetch_list_page(source_config: Dict) -> List[Dict]:
    """
    抓取列表页面 (如新闻列表)
    """
    articles = []

    # 为特定网站添加额外请求头
    headers = {
        "User-Agent": config.USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }

    # 为特定网站添加 Referer
    url = source_config["url"]
    if "woshipm.com" in url:
        headers["Referer"] = "https://www.woshipm.com/"
    elif "rundown.ai" in url:
        headers["Referer"] = "https://www.rundown.ai/"

    response = requests.get(
        url,
        headers=headers,
        timeout=config.REQUEST_TIMEOUT,
        verify=False
    )
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    selectors = source_config.get("selectors", {})

    max_items = config.MAX_ITEMS_HIGH_PRIORITY if source_config.get("priority") == "high" else config.MAX_ITEMS_PER_SOURCE
    all_items = soup.select(selectors.get("items", "article"))
    items = all_items[:max_items] if max_items > 0 else all_items  # 0 表示不限制

    for item in items:
        title_elem = item.select_one(selectors.get("title", "h2, h3, .title"))
        title = title_elem.get_text(strip=True) if title_elem else "无标题"

        # 处理链接：先尝试子元素，如果选择器为空或找不到，检查 item 本身是否是 <a> 标签
        link_selector = selectors.get("link", "a")
        link = ""

        if link_selector:
            link_elem = item.select_one(link_selector)
            if link_elem:
                link = link_elem.get("href", "")

        # 如果没找到链接，检查 item 本身是否是 <a> 标签
        if not link and item.name == "a":
            link = item.get("href", "")

        # 相对路径转绝对路径
        if link and not link.startswith("http"):
            from urllib.parse import urljoin
            link = urljoin(source_config["url"], link)

        summary_elem = item.select_one(selectors.get("summary", "p, .summary, .desc"))
        summary = summary_elem.get_text(strip=True) if summary_elem else ""

        if title and link:
            articles.append({
                "title": title,
                "url": link,
                "content": summary,
                "author": "",
                "published": "",
                "source_name": source_config["name"],
                "source_icon": source_config.get("icon", ""),
                "tags": source_config.get("tags", []),
                "group": source_config.get("group", "")
            })

    return articles


def fetch_single_page(source_config: Dict) -> List[Dict]:
    """
    抓取单个页面内容
    """
    headers = {"User-Agent": config.USER_AGENT}

    response = requests.get(
        source_config["url"],
        headers=headers,
        timeout=config.REQUEST_TIMEOUT,
        verify=False
    )
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    selectors = source_config.get("selectors", {})

    title_elem = soup.select_one(selectors.get("title", "h1, title"))
    title = title_elem.get_text(strip=True) if title_elem else "无标题"

    content_elem = soup.select_one(selectors.get("content", "article, main, .content"))
    content = ""
    if content_elem:
        for tag in content_elem(["script", "style", "nav", "aside"]):
            tag.decompose()
        content = content_elem.get_text(separator=" ", strip=True)

    return [{
        "title": title,
        "url": source_config["url"],
        "content": content,
        "author": "",
        "published": "",
        "source_name": source_config["name"],
        "source_icon": source_config.get("icon", ""),
        "tags": source_config.get("tags", []),
        "group": source_config.get("group", "")
    }]


def fetch_api_source(source_config: Dict) -> List[Dict]:
    """
    处理需要特殊 API 的网站
    """
    name = source_config["name"]
    source_type = source_config.get("type", "")

    if source_type == "aibase" or "Aibase" in name or "爱邦" in name:
        return fetch_aibase(source_config)
    elif "FutureTools" in name:
        return fetch_futuretools()
    elif "Futurepedia" in name:
        return fetch_futurepedia()
    else:
        print(f"   ⚠️ 未配置 API 抓取器: {name}")
        return []


# ==================== 专用抓取器 ====================

def fetch_aibase(source_config: Dict) -> List[Dict]:
    """
    抓取 Aibase (爱邦) AI 新闻
    https://www.aibase.com/zh/news
    """
    articles = []
    headers = {"User-Agent": config.USER_AGENT}

    try:
        response = requests.get(
            "https://www.aibase.com/zh/news",
            headers=headers,
            timeout=30,
            verify=False
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # 查找所有新闻链接 (格式: /news/23687)
        news_links = soup.find_all('a', href=lambda x: x and '/news/' in x and x.startswith('/news/'))

        seen_urls = set()
        for link in news_links:
            href = link.get('href', '')
            if not href or href in seen_urls:
                continue

            # 获取标题 - 通常在 h3 标签中
            title_elem = link.find('h3') or link.find(['h2', 'h4']) or link
            title = title_elem.get_text(strip=True) if title_elem else ""

            # 清理标题中的 "刚刚.AIbase" 前缀
            if title:
                # 移除常见的前缀模式
                for prefix in ['刚刚.AIbase', '刚刚.', 'AIbase']:
                    if title.startswith(prefix):
                        title = title[len(prefix):].strip()

            if not title or len(title) < 5:
                continue

            full_url = f"https://www.aibase.com{href}"
            seen_urls.add(href)

            articles.append({
                "title": title,
                "url": full_url,
                "content": "",  # 可以后续抓取详情页获取内容
                "author": "",
                "published": "",
                "source_name": source_config.get("name", "Aibase (爱邦)"),
                "source_icon": source_config.get("icon", "https://www.aibase.com/favicon.ico"),
                "tags": source_config.get("tags", ["AI工具", "国内", "资讯"]),
                "group": source_config.get("group", "选品库")
            })

            # 限制数量
            if len(articles) >= 20:
                break

    except Exception as e:
        print(f"Aibase 抓取失败: {e}")

    return articles


def fetch_github_trending(source_config: Dict = None) -> List[Dict]:
    """
    抓取 GitHub Trending
    """
    articles = []
    headers = {"User-Agent": config.USER_AGENT}

    try:
        # 抓取今日 trending
        response = requests.get(
            "https://github.com/trending?since=daily",
            headers=headers,
            timeout=30,
            verify=False
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        repos = soup.select("article.Box-row")[:config.MAX_ITEMS_PER_SOURCE]

        for repo in repos:
            # 仓库名
            name_elem = repo.select_one("h2 a")
            if not name_elem:
                continue

            repo_path = name_elem.get("href", "").strip("/")
            repo_name = repo_path.replace("/", " / ")
            repo_url = f"https://github.com/{repo_path}"

            # 描述
            desc_elem = repo.select_one("p")
            description = desc_elem.get_text(strip=True) if desc_elem else ""

            # 语言
            lang_elem = repo.select_one("[itemprop='programmingLanguage']")
            language = lang_elem.get_text(strip=True) if lang_elem else ""

            # 星标数
            stars_elem = repo.select_one("a[href$='/stargazers']")
            stars = stars_elem.get_text(strip=True) if stars_elem else ""

            # 今日新增星标
            today_stars_elem = repo.select_one(".float-sm-right")
            today_stars = today_stars_elem.get_text(strip=True) if today_stars_elem else ""

            content = f"{description}\n\n语言: {language} | 总星标: {stars} | {today_stars}"

            articles.append({
                "title": f"🔥 {repo_name}",
                "url": repo_url,
                "content": content,
                "author": repo_path.split("/")[0] if "/" in repo_path else "",
                "published": "",
                "source_name": "GitHub Trending",
                "source_icon": "https://github.com/favicon.ico",
                "tags": ["开源", "技术前沿", "代码", language] if language else ["开源", "技术前沿", "代码"],
                "group": "前沿"
            })

    except Exception as e:
        print(f"GitHub Trending 抓取失败: {e}")

    return articles


def fetch_discourse_api(source_config: Dict) -> List[Dict]:
    """
    抓取 Discourse 论坛 (如 Linux.do)
    """
    articles = []
    headers = {"User-Agent": config.USER_AGENT}

    try:
        response = requests.get(
            source_config["url"],
            headers=headers,
            timeout=30,
            verify=False
        )
        response.raise_for_status()
        data = response.json()

        base_url = source_config["url"].replace("/latest.json", "")
        topics = data.get("topic_list", {}).get("topics", [])[:config.MAX_ITEMS_PER_SOURCE]

        for topic in topics:
            # 跳过置顶帖
            if topic.get("pinned"):
                continue

            title = topic.get("title", "")
            topic_id = topic.get("id", "")
            slug = topic.get("slug", "")

            articles.append({
                "title": title,
                "url": f"{base_url}/t/{slug}/{topic_id}",
                "content": "",  # Discourse 需要额外请求获取内容
                "author": "",
                "published": topic.get("created_at", ""),
                "source_name": source_config["name"],
                "source_icon": source_config.get("icon", ""),
                "tags": source_config.get("tags", []),
                "group": source_config.get("group", "")
            })

    except Exception as e:
        print(f"Discourse 抓取失败: {e}")

    return articles


def fetch_futuretools() -> List[Dict]:
    """
    抓取 FutureTools 最新工具
    注意：可能需要分析其 API 或使用 Selenium
    """
    articles = []
    headers = {"User-Agent": config.USER_AGENT}

    try:
        # FutureTools 的页面是 SSR，直接抓取 HTML
        response = requests.get(
            "https://www.futuretools.io/",
            headers=headers,
            timeout=30,
            verify=False
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # 尝试找到工具卡片
        tools = soup.select(".tool-card, [class*='tool'], article")[:config.MAX_ITEMS_PER_SOURCE]

        for tool in tools:
            title_elem = tool.select_one("h2, h3, .title, [class*='name']")
            if not title_elem:
                continue

            title = title_elem.get_text(strip=True)

            link_elem = tool.select_one("a")
            link = ""
            if link_elem:
                link = link_elem.get("href", "")
                if link and not link.startswith("http"):
                    link = f"https://www.futuretools.io{link}"

            desc_elem = tool.select_one("p, .description, [class*='desc']")
            description = desc_elem.get_text(strip=True) if desc_elem else ""

            if title and link:
                articles.append({
                    "title": f"🛠️ {title}",
                    "url": link,
                    "content": description,
                    "author": "",
                    "published": "",
                    "source_name": "FutureTools",
                    "source_icon": "https://www.futuretools.io/favicon.ico",
                    "tags": ["AI工具", "选品库"],
                    "group": "选品库"
                })

    except Exception as e:
        print(f"FutureTools 抓取失败: {e}")

    return articles


def fetch_futurepedia() -> List[Dict]:
    """
    抓取 Futurepedia AI 工具
    """
    articles = []
    headers = {"User-Agent": config.USER_AGENT}

    try:
        response = requests.get(
            "https://www.futurepedia.io/ai-tools",
            headers=headers,
            timeout=30,
            verify=False
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        tools = soup.select("[class*='tool'], article, .card")[:config.MAX_ITEMS_PER_SOURCE]

        for tool in tools:
            title_elem = tool.select_one("h2, h3, .title, [class*='name']")
            if not title_elem:
                continue

            title = title_elem.get_text(strip=True)

            link_elem = tool.select_one("a")
            link = ""
            if link_elem:
                link = link_elem.get("href", "")
                if link and not link.startswith("http"):
                    link = f"https://www.futurepedia.io{link}"

            desc_elem = tool.select_one("p, .description")
            description = desc_elem.get_text(strip=True) if desc_elem else ""

            if title and link:
                articles.append({
                    "title": f"🛠️ {title}",
                    "url": link,
                    "content": description,
                    "author": "",
                    "published": "",
                    "source_name": "Futurepedia",
                    "source_icon": "https://www.futurepedia.io/favicon.ico",
                    "tags": ["AI工具", "选品库"],
                    "group": "选品库"
                })

    except Exception as e:
        print(f"Futurepedia 抓取失败: {e}")

    return articles


def fetch_techmeme() -> List[Dict]:
    """
    抓取 Techmeme 热门新闻
    """
    articles = []
    headers = {"User-Agent": config.USER_AGENT}

    try:
        response = requests.get(
            "https://techmeme.com/",
            headers=headers,
            timeout=30,
            verify=False
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Techmeme 的结构
        items = soup.select(".clus")[:config.MAX_ITEMS_PER_SOURCE]

        for item in items:
            title_elem = item.select_one(".ourh")
            if not title_elem:
                continue

            title = title_elem.get_text(strip=True)

            link_elem = title_elem.find_parent("a") or item.select_one("a")
            link = link_elem.get("href", "") if link_elem else ""

            # 摘要
            summary_elem = item.select_one(".ii")
            summary = summary_elem.get_text(strip=True) if summary_elem else ""

            if title and link:
                articles.append({
                    "title": title,
                    "url": link,
                    "content": summary,
                    "author": "",
                    "published": "",
                    "source_name": "Techmeme",
                    "source_icon": "https://techmeme.com/favicon.ico",
                    "tags": ["科技新闻", "聚合"],
                    "group": "快讯"
                })

    except Exception as e:
        print(f"Techmeme 抓取失败: {e}")

    return articles


def fetch_36kr_newsflash() -> List[Dict]:
    """
    抓取 36氪快讯
    """
    articles = []
    headers = {"User-Agent": config.USER_AGENT}

    try:
        api_url = "https://gateway.36kr.com/api/mis/nav/newsflash/flow"
        payload = {"pageSize": 20, "pageEvent": 0, "pageCallback": ""}

        response = requests.post(api_url, json=payload, headers=headers, timeout=30, verify=False)
        data = response.json()

        for item in data.get("data", {}).get("itemList", [])[:config.MAX_ITEMS_PER_SOURCE]:
            articles.append({
                "title": item.get("title", ""),
                "url": f"https://36kr.com/newsflashes/{item.get('itemId', '')}",
                "content": item.get("description", ""),
                "author": "",
                "published": "",
                "source_name": "36氪快讯",
                "source_icon": "https://36kr.com/favicon.ico",
                "tags": ["科技", "创业", "国内"],
                "group": "快讯"
            })
    except Exception as e:
        print(f"36氪抓取失败: {e}")

    return articles


def fetch_sspai() -> List[Dict]:
    """
    抓取少数派最新文章
    """
    articles = []
    headers = {"User-Agent": config.USER_AGENT}

    try:
        api_url = "https://sspai.com/api/v1/articles?offset=0&limit=20&type=recommend_to_home"

        response = requests.get(api_url, headers=headers, timeout=30, verify=False)
        data = response.json()

        for item in data.get("data", [])[:config.MAX_ITEMS_PER_SOURCE]:
            articles.append({
                "title": item.get("title", ""),
                "url": f"https://sspai.com/post/{item.get('id', '')}",
                "content": item.get("summary", ""),
                "author": item.get("author", {}).get("nickname", ""),
                "published": "",
                "source_name": "少数派",
                "source_icon": "https://sspai.com/favicon.ico",
                "tags": ["效率", "工具", "国内"],
                "group": "教程"
            })
    except Exception as e:
        print(f"少数派抓取失败: {e}")

    return articles


def fetch_producthunt_api() -> List[Dict]:
    """
    抓取 Product Hunt (需要 API Token)
    如果没有 token，使用 RSS 代替
    """
    # Product Hunt 有 RSS，优先用 RSS
    # 这里是备用的 API 方案
    return []
