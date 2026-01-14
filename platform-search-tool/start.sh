#!/bin/bash
# 平台搜索工具 - 快速启动脚本

cd "$(dirname "$0")"

echo "🔍 平台搜索工具 - 快速启动"
echo "================================"
echo ""
echo "选择启动方式:"
echo "  1. 命令行搜索 (推荐，简单直接)"
echo "  2. Web界面搜索 (开发中)"
echo "  3. 直接使用MediaCrawler"
echo ""

read -p "请选择 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 启动命令行搜索工具..."
        cd ../crawler/MediaCrawler

        # 检查依赖
        if ! command -v uv &> /dev/null; then
            echo "⚠️  uv未安装，尝试使用python..."
            python3 ../../platform-search-tool/search_cli.py
        else
            uv run python ../../platform-search-tool/search_cli.py
        fi
        ;;
    2)
        echo ""
        echo "🌐 启动Web搜索界面..."
        python3 search_server.py
        ;;
    3)
        echo ""
        echo "📂 进入MediaCrawler目录..."
        cd ../crawler/MediaCrawler
        echo ""
        echo "💡 使用示例:"
        echo "  uv run main.py --platform xhs --lt qrcode --type search"
        echo ""
        exec $SHELL
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac
