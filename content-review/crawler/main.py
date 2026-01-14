#!/usr/bin/env python3
"""
主程序 - 自动化内容抓取和 AI 摘要生成

逐个网站顺序抓取，确保每个网站都被完整处理

使用方法:
    # 立即运行一次（完整抓取所有30个网站）
    python main.py

    # 以守护进程方式运行 (定时任务)
    python main.py --daemon

    # 只抓取指定分组
    python main.py --group 选品库
    python main.py --group 快讯
    python main.py --group 教程
    python main.py --group 前沿
"""
import argparse
import time
from datetime import datetime
import schedule

from rss_fetcher import fetch_single_rss
from web_scraper import (
    fetch_aibase, fetch_github_trending, fetch_discourse_api,
    fetch_list_page, fetch_single_page, fetch_futuretools,
    fetch_futurepedia, fetch_techmeme
)
from ai_summary import generate_summary
from api_client import api_client
import config


def fetch_source(source_config: dict) -> list:
    """
    根据配置抓取单个数据源
    """
    source_type = source_config.get("type", "rss")
    name = source_config["name"]

    try:
        # RSS 源
        if source_type == "rss":
            return fetch_single_rss(source_config)

        # 网页源 - 根据类型调用不同的抓取器
        elif source_type == "aibase":
            return fetch_aibase(source_config)
        elif source_type == "github_trending":
            return fetch_github_trending(source_config)
        elif source_type == "discourse_api":
            return fetch_discourse_api(source_config)
        elif source_type == "list":
            return fetch_list_page(source_config)
        elif source_type == "api":
            if "FutureTools" in name:
                return fetch_futuretools()
            elif "Futurepedia" in name:
                return fetch_futurepedia()
            elif "Techmeme" in name:
                return fetch_techmeme()
            else:
                print(f"      ⚠️ 未配置 API 抓取器")
                return []
        elif source_type == "single":
            return fetch_single_page(source_config)
        elif source_type == "manual":
            # 手动来源，跳过
            return []
        elif source_type == "newsletter":
            # Newsletter 类型，尝试作为单页抓取
            return fetch_single_page(source_config)
        else:
            print(f"      ⚠️ 未知类型: {source_type}")
            return []

    except Exception as e:
        print(f"      ❌ 抓取异常: {e}")
        return []


def process_and_save_articles(articles: list, source_name: str, stats: dict) -> dict:
    """
    处理文章列表：生成摘要并保存到数据库
    """
    if not articles:
        return stats

    # 先检查重复
    urls = [a.get("url", "") for a in articles if a.get("url")]
    api_client.preload_duplicates(urls)

    new_articles = []
    for article in articles:
        url = article.get("url", "")
        if url and not api_client.is_duplicate(url):
            new_articles.append(article)
        else:
            stats["skipped"] += 1

    if not new_articles:
        print(f"      全部为重复内容，跳过")
        return stats

    print(f"      新内容: {len(new_articles)} 篇，开始处理...")

    for i, article in enumerate(new_articles, 1):
        title_preview = article['title'][:40] + "..." if len(article['title']) > 40 else article['title']
        print(f"        [{i}/{len(new_articles)}] {title_preview}")

        # 生成 AI 摘要
        try:
            summary = generate_summary(article["title"], article.get("content", ""))
        except Exception as e:
            print(f"          ⚠️ 摘要失败: {e}")
            summary = article.get("content", "")[:200] if article.get("content") else "暂无摘要"

        # 保存到数据库
        feed_data = {
            "title": article["title"],
            "aiSummary": summary,
            "originalUrl": article["url"],
            "tags": article.get("tags", []),
            "sourceName": article.get("source_name", source_name),
            "sourceIcon": article.get("source_icon", ""),
            "author": article.get("author", ""),
            "group": article.get("group", ""),
            "priority": article.get("priority", "medium")
        }

        result = api_client.create_feed(feed_data)
        if result:
            stats["new"] += 1
        else:
            stats["failed"] += 1

        # 避免 AI API 限流
        time.sleep(1)

    return stats


def run_crawler(target_group: str = None):
    """
    执行完整的抓取流程 - 逐个网站顺序抓取
    """
    print("\n" + "=" * 70)
    print(f"🚀 开始抓取 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📅 抓取范围: 过去 {config.CONTENT_FRESHNESS_HOURS} 小时内的内容")
    if target_group:
        print(f"🎯 目标分组: {target_group}")
    print("=" * 70)

    # 清空去重缓存
    api_client.clear_cache()

    stats = {"total": 0, "new": 0, "skipped": 0, "failed": 0}

    # 构建完整的数据源列表（按分组组织）
    all_sources = []

    # 第一组：选品库 (保留正常工作的)
    group1_sources = [
        {"name": "Product Hunt", "url": "https://www.producthunt.com/feed", "type": "rss", "icon": "https://www.producthunt.com/favicon.ico", "tags": ["新品首发", "AI工具"], "group": "选品库", "priority": "high"},
        {"name": "Aibase (爱邦)", "url": "https://www.aibase.com/zh/news", "type": "aibase", "icon": "https://www.aibase.com/favicon.ico", "tags": ["AI工具", "国内"], "group": "选品库", "priority": "high"},
        {"name": "AIG123", "url": "https://www.aig123.com/", "type": "list", "selectors": {"items": ".url-body a.card", "title": ".text-sm strong", "link": ""}, "icon": "https://www.aig123.com/favicon.png", "tags": ["AI工具", "国内"], "group": "选品库", "priority": "medium"},
    ]

    # 第二组：快讯 (保留正常工作的)
    group2_sources = [
        {"name": "TechCrunch", "url": "https://techcrunch.com/category/artificial-intelligence/feed/", "type": "rss", "icon": "https://techcrunch.com/favicon.ico", "tags": ["AI新闻", "硅谷"], "group": "快讯", "priority": "high"},
        {"name": "量子位", "url": "https://www.qbitai.com/feed", "type": "rss", "icon": "https://www.qbitai.com/favicon.ico", "tags": ["AI新闻", "国内"], "group": "快讯", "priority": "high"},
        {"name": "机器之心", "url": "https://www.jiqizhixin.com/rss", "type": "rss", "icon": "https://www.jiqizhixin.com/favicon.ico", "tags": ["AI新闻", "国内"], "group": "快讯", "priority": "high"},
        {"name": "The Rundown AI", "url": "https://www.rundown.ai/articles", "type": "list", "selectors": {"items": "a.hp-latest_card", "title": "p.body-m.is-article-card", "link": ""}, "icon": "https://www.rundown.ai/favicon.ico", "tags": ["AI简报", "硅谷"], "group": "快讯", "priority": "high"},
    ]

    # 第三组：教程 (保留正常工作的)
    group3_sources = [
        {"name": "掘金", "url": "https://juejin.cn/rss", "type": "rss", "icon": "https://juejin.cn/favicon.ico", "tags": ["开发者", "国内"], "group": "教程", "priority": "medium"},
        {"name": "WaytoAGI", "url": "https://www.waytoagi.com/zh/blog", "type": "list", "selectors": {"items": "a[href*='/blog/news-']", "title": ".text-lg.font-bold", "link": ""}, "icon": "https://www.waytoagi.com/favicon.ico", "tags": ["AI知识库", "国内"], "group": "教程", "priority": "high"},
    ]

    # 第四组：前沿 (保留正常工作的)
    group4_sources = [
        {"name": "Hacker News", "url": "https://hnrss.org/frontpage", "type": "rss", "icon": "https://news.ycombinator.com/favicon.ico", "tags": ["技术前沿", "硅谷"], "group": "前沿", "priority": "high"},
    ]

    # 按分组组织
    groups = {
        "选品库": group1_sources,
        "快讯": group2_sources,
        "教程": group3_sources,
        "前沿": group4_sources,
    }

    # 如果指定了分组，只抓取该分组
    if target_group and target_group in groups:
        groups = {target_group: groups[target_group]}

    # 逐个分组、逐个网站抓取
    for group_name, sources in groups.items():
        print(f"\n{'='*60}")
        print(f"📁 【{group_name}】- 共 {len(sources)} 个网站")
        print("=" * 60)

        for idx, source in enumerate(sources, 1):
            source_name = source["name"]
            source_type = source.get("type", "rss")

            print(f"\n  [{idx}/{len(sources)}] 🌐 {source_name}")
            print(f"      类型: {source_type} | URL: {source['url'][:50]}...")

            # 跳过手动类型
            if source_type == "manual":
                print(f"      ⏭️ 手动来源，跳过自动抓取")
                continue

            # 抓取
            start_time = time.time()
            articles = fetch_source(source)
            fetch_time = time.time() - start_time

            print(f"      📥 抓取到 {len(articles)} 篇 (耗时 {fetch_time:.1f}s)")
            stats["total"] += len(articles)

            if articles:
                # 处理并保存
                stats = process_and_save_articles(articles, source_name, stats)

            # 网站间间隔，避免请求过快
            print(f"      ⏳ 等待 {config.REQUEST_DELAY}s...")
            time.sleep(config.REQUEST_DELAY)

    # 输出统计
    print("\n" + "=" * 70)
    print("📊 抓取完成统计:")
    print(f"   抓取总量: {stats['total']} 篇")
    print(f"   新增入库: {stats['new']} 篇")
    print(f"   跳过重复: {stats['skipped']} 篇")
    print(f"   保存失败: {stats['failed']} 篇")
    print("=" * 70)

    # 获取当前待审核数量
    current_stats = api_client.get_stats()
    print(f"\n📬 当前待审核: {current_stats.get('pending', 0)} 篇")
    by_group = current_stats.get('byGroup', {})
    if by_group:
        print("   按分组:")
        for group, count in by_group.items():
            print(f"     - {group}: {count} 篇")

    by_source = current_stats.get('bySource', {})
    if by_source:
        print("\n   按来源:")
        for group, sources in by_source.items():
            print(f"     【{group}】")
            for source, count in sources.items():
                print(f"       - {source}: {count} 篇")

    print(f"\n🔗 审核地址: {config.API_BASE_URL.replace(':3000', ':5173')}/admin/content-review")

    return stats


def run_daemon():
    """
    以守护进程方式运行，执行定时任务
    """
    print("🕐 守护进程启动，定时任务:")
    for t in config.SCHEDULE_TIMES:
        print(f"   - 每天 {t}")
        schedule.every().day.at(t).do(run_crawler)

    # 启动时先运行一次
    print("\n📌 启动时执行一次...")
    run_crawler()

    print("\n⏳ 等待下次执行...")
    while True:
        schedule.run_pending()
        time.sleep(60)


def main():
    parser = argparse.ArgumentParser(description="自动化内容抓取工具 - 逐个网站顺序抓取")
    parser.add_argument("--daemon", action="store_true", help="以守护进程方式运行")
    parser.add_argument("--group", type=str, help="只抓取指定分组 (选品库/快讯/教程/前沿)")

    args = parser.parse_args()

    if args.daemon:
        run_daemon()
    else:
        run_crawler(target_group=args.group)


if __name__ == "__main__":
    main()
