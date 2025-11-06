#!/bin/bash
#
# 小红书爬虫快速启动脚本
# 使用方式: ./crawler/quick-start.sh

set -e  # 遇到错误立即退出

echo "================================"
echo "🕷️  小红书AI教程爬虫系统"
echo "================================"
echo ""

# 检查 Python
echo "1️⃣  检查 Python 环境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 未安装"
    exit 1
fi
echo "✅ Python $(python3 --version)"
echo ""

# 检查依赖
echo "2️⃣  检查 Python 依赖..."
cd crawler/MediaCrawler

if python3 -c "import playwright" 2>/dev/null; then
    echo "✅ Playwright 已安装"
else
    echo "⚙️  安装 Python 依赖（首次运行需要几分钟）..."
    # 跳过 matplotlib 和 wordcloud（不影响核心功能）
    grep -v -E "wordcloud|matplotlib" requirements.txt | python3 -m pip install -r /dev/stdin
fi
echo ""

# 安装 Playwright 浏览器
echo "3️⃣  检查 Playwright 浏览器..."
if ! python3 -m playwright install --dry-run chromium 2>/dev/null; then
    echo "⚙️  安装 Chromium 浏览器..."
    python3 -m playwright install chromium
else
    echo "✅ Chromium 浏览器已安装"
fi
echo ""

# 回到项目根目录
cd ../..

# 检查环境变量
echo "4️⃣  检查环境变量..."
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  警告: ANTHROPIC_API_KEY 未设置"
    echo "   AI 分析功能将无法使用"
    echo "   请在 backend/.env 中配置"
else
    echo "✅ ANTHROPIC_API_KEY 已配置"
fi
echo ""

echo "================================"
echo "✅ 环境检查完成！"
echo "================================"
echo ""
echo "📚 使用方式:"
echo ""
echo "1. 通过 API 调用（推荐）:"
echo "   启动后端: cd backend && npm run dev"
echo "   调用接口: POST http://localhost:3000/api/crawler/crawl-and-analyze"
echo ""
echo "2. 直接运行 Python 爬虫:"
echo "   cd crawler/MediaCrawler"
echo "   python3 main.py"
echo ""
echo "📖 完整文档: CRAWLER_GUIDE.md"
echo ""
