#!/usr/bin/env python3
"""
命令行搜索工具 - 直接使用MediaCrawler
更简单直接的搜索方式
"""

import os
import sys
from pathlib import Path

# 添加MediaCrawler到路径
CRAWLER_DIR = Path(__file__).parent.parent / "crawler" / "MediaCrawler"
os.chdir(CRAWLER_DIR)
sys.path.insert(0, str(CRAWLER_DIR))

def print_banner():
    """打印欢迎信息"""
    print("""
╔═══════════════════════════════════════════╗
║     🔍 平台搜索工具 - 命令行版本           ║
║     支持: 小红书/抖音/B站/快手等           ║
╚═══════════════════════════════════════════╝
""")

def get_platform_choice():
    """选择平台"""
    platforms = {
        '1': ('xhs', '小红书'),
        '2': ('dy', '抖音'),
        '3': ('bili', 'B站'),
        '4': ('ks', '快手'),
        '5': ('wb', '微博'),
        '6': ('tieba', '贴吧'),
        '7': ('zhihu', '知乎'),
    }

    print("\n📱 选择要搜索的平台:")
    for key, (code, name) in platforms.items():
        print(f"  {key}. {name} ({code})")

    choice = input("\n请输入编号 (1-7): ").strip()

    if choice in platforms:
        return platforms[choice]
    else:
        print("❌ 无效选择，默认使用小红书")
        return platforms['1']

def get_search_params():
    """获取搜索参数"""
    keyword = input("\n🔍 输入搜索关键词: ").strip()
    if not keyword:
        print("❌ 关键词不能为空")
        sys.exit(1)

    try:
        count = input("📊 搜索数量 (默认20): ").strip()
        count = int(count) if count else 20
    except ValueError:
        count = 20

    return keyword, count

def run_crawler(platform_code, keyword, count):
    """运行爬虫"""
    print(f"\n🚀 开始搜索: 平台={platform_code}, 关键词={keyword}, 数量={count}")
    print("📁 数据将保存到: crawler/MediaCrawler/data/")
    print("\n⏳ 正在启动浏览器...")

    # 设置环境变量
    os.environ['KEYWORDS'] = keyword
    os.environ['CRAWLER_MAX_NOTES_COUNT'] = str(count)

    # 导入并运行main
    try:
        from main import main
        import asyncio

        # 修改命令行参数
        sys.argv = [
            'main.py',
            '--platform', platform_code,
            '--lt', 'qrcode',  # 二维码登录
            '--type', 'search',
            '--save_data_option', 'json'  # 保存为JSON
        ]

        # 运行主程序
        asyncio.run(main())

    except KeyboardInterrupt:
        print("\n\n⚠️  搜索已取消")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ 搜索失败: {e}")
        sys.exit(1)

def main():
    """主函数"""
    print_banner()

    # 选择平台
    platform_code, platform_name = get_platform_choice()
    print(f"✅ 已选择: {platform_name}")

    # 获取搜索参数
    keyword, count = get_search_params()

    # 运行爬虫
    run_crawler(platform_code, keyword, count)

    print("\n\n✅ 搜索完成!")
    print(f"📁 结果已保存到: {CRAWLER_DIR}/data/")
    print("💡 提示: 可以使用Excel或其他工具打开JSON文件查看结果")

if __name__ == "__main__":
    main()
