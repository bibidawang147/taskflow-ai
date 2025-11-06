#!/bin/bash
# 带引导的爬虫测试

echo "🚀 小红书爬虫测试"
echo "================================"
echo ""
echo "⚠️  重要提示："
echo ""
echo "1️⃣  浏览器会自动打开（请不要关闭！）"
echo "2️⃣  会显示小红书登录二维码"
echo "3️⃣  用手机小红书 APP 扫码登录"
echo "4️⃣  登录成功后会自动开始爬取"
echo "5️⃣  爬取完成前保持浏览器打开"
echo ""
echo "⏱️  预计耗时：2-3 分钟"
echo ""
read -p "准备好了吗？按回车开始..."

echo ""
echo "🔄 启动中..."
echo ""

curl -X POST http://localhost:3000/api/crawler/xiaohongshu \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "ChatGPT使用技巧",
    "maxCount": 2
  }' | jq '.' 2>/dev/null || cat

echo ""
echo ""
echo "✅ 测试完成！"
echo ""
echo "📂 如果成功，数据在："
echo "   - JSON: crawler/MediaCrawler/data/xhs/"
echo "   - 数据库: workflows 表"
