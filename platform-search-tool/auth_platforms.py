#!/usr/bin/env python3
"""
平台授权脚本 - 批量授权所有平台
使用此脚本提前登录所有平台，授权状态会永久保存
"""

import os
import sys
from pathlib import Path

# 添加MediaCrawler到路径
CRAWLER_DIR = Path(__file__).parent.parent / "crawler" / "MediaCrawler"
os.chdir(CRAWLER_DIR)
sys.path.insert(0, str(CRAWLER_DIR))

def print_banner():
    print("""
╔════════════════════════════════════════════════╗
║       🔐 平台授权工具 - 批量登录所有平台        ║
║      登录一次，永久有效，支持全平台搜索         ║
╚════════════════════════════════════════════════╝
""")

platforms = [
    ('xhs', '小红书', '📒'),
    ('dy', '抖音', '🎵'),
    ('bili', 'B站', '📺'),
    ('ks', '快手', '⚡'),
    ('wb', '微博', '🐦'),
    ('tieba', '贴吧', '💬'),
    ('zhihu', '知乎', '🎓'),
]

def check_auth_status():
    """检查当前授权状态"""
    browser_data = CRAWLER_DIR / "browser_data"
    authorized = []
    unauthorized = []

    for code, name, icon in platforms:
        platform_dir = browser_data / code
        if platform_dir.exists() and any(platform_dir.iterdir()):
            authorized.append((code, name, icon))
        else:
            unauthorized.append((code, name, icon))

    return authorized, unauthorized

def show_status():
    """显示授权状态"""
    authorized, unauthorized = check_auth_status()

    print("\n当前授权状态：")
    print("=" * 50)

    if authorized:
        print("\n✅ 已授权的平台：")
        for code, name, icon in authorized:
            print(f"  {icon} {name} ({code})")

    if unauthorized:
        print("\n⚪ 未授权的平台：")
        for code, name, icon in unauthorized:
            print(f"  {icon} {name} ({code})")

    print("\n" + "=" * 50)
    return authorized, unauthorized

def auth_platform(platform_code, platform_name):
    """授权单个平台"""
    print(f"\n{'='*50}")
    print(f"🔐 开始授权: {platform_name}")
    print(f"{'='*50}")
    print("\n⏳ 正在打开浏览器，请扫码登录...")
    print("💡 登录成功后，浏览器会自动关闭\n")

    try:
        # 设置环境变量
        os.environ['KEYWORDS'] = 'test'
        os.environ['CRAWLER_MAX_NOTES_COUNT'] = '1'

        # 导入main函数
        from main import main
        import asyncio

        # 设置命令行参数
        sys.argv = [
            'main.py',
            '--platform', platform_code,
            '--lt', 'qrcode',
            '--type', 'search'
        ]

        # 运行登录
        asyncio.run(main())

        print(f"\n✅ {platform_name} 授权成功！")
        return True

    except KeyboardInterrupt:
        print(f"\n\n⚠️  {platform_name} 授权已取消")
        return False
    except Exception as e:
        print(f"\n❌ {platform_name} 授权失败: {e}")
        return False

def auth_all():
    """授权所有未授权的平台"""
    print_banner()

    authorized, unauthorized = show_status()

    if not unauthorized:
        print("\n🎉 所有平台都已授权！")
        print("\n现在可以使用Web界面的\"全部平台\"功能进行搜索了。")
        return

    print(f"\n📝 共有 {len(unauthorized)} 个平台需要授权")
    print("💡 建议先授权常用的3个平台：小红书、抖音、B站\n")

    # 询问用户要授权哪些平台
    print("选择授权方式：")
    print("  1. 授权所有未授权的平台")
    print("  2. 选择性授权（推荐）")
    print("  3. 退出")

    choice = input("\n请选择 (1-3): ").strip()

    if choice == '1':
        # 授权所有
        platforms_to_auth = unauthorized
    elif choice == '2':
        # 选择性授权
        print("\n选择要授权的平台（输入编号，用逗号分隔，如：1,2,3）：")
        for i, (code, name, icon) in enumerate(unauthorized, 1):
            print(f"  {i}. {icon} {name}")

        selections = input("\n请输入: ").strip()
        if not selections:
            print("❌ 未选择任何平台")
            return

        try:
            indices = [int(s.strip()) - 1 for s in selections.split(',')]
            platforms_to_auth = [unauthorized[i] for i in indices if 0 <= i < len(unauthorized)]
        except:
            print("❌ 输入格式错误")
            return
    else:
        print("\n👋 已退出")
        return

    if not platforms_to_auth:
        print("❌ 没有选择任何平台")
        return

    # 开始授权
    print(f"\n🚀 开始授权 {len(platforms_to_auth)} 个平台...\n")

    success_count = 0
    for i, (code, name, icon) in enumerate(platforms_to_auth, 1):
        print(f"\n进度: {i}/{len(platforms_to_auth)}")

        if auth_platform(code, name):
            success_count += 1

        if i < len(platforms_to_auth):
            input("\n按Enter继续授权下一个平台...")

    # 最终统计
    print("\n" + "="*50)
    print("🎉 授权完成！")
    print("="*50)
    print(f"\n成功授权: {success_count}/{len(platforms_to_auth)} 个平台")

    if success_count > 0:
        print("\n✅ 授权的平台可以在Web界面中使用了")
        print("💡 访问 http://localhost:8899 开始搜索")

def main():
    """主函数"""
    print_banner()

    print("功能选项：")
    print("  1. 查看授权状态")
    print("  2. 授权新平台")
    print("  3. 清除所有授权")
    print("  4. 退出")

    choice = input("\n请选择 (1-4): ").strip()

    if choice == '1':
        show_status()
    elif choice == '2':
        auth_all()
    elif choice == '3':
        confirm = input("\n⚠️  确定要清除所有授权吗？(yes/no): ").strip().lower()
        if confirm == 'yes':
            browser_data = CRAWLER_DIR / "browser_data"
            if browser_data.exists():
                import shutil
                shutil.rmtree(browser_data)
                print("\n✅ 所有授权已清除")
            else:
                print("\n💡 没有需要清除的授权")
        else:
            print("\n❌ 已取消")
    else:
        print("\n👋 再见！")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 程序已退出")
        sys.exit(0)
