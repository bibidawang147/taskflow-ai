#!/bin/bash
# 批量爬取脚本 - 适合建立工作流库

echo "🚀 批量爬取小红书AI教程"
echo "================================"
echo ""

# 定义关键词数组
KEYWORDS=(
  "ChatGPT使用技巧"
  "AI办公工具"
  "Midjourney教程"
  "AI文案生成"
  "AI数据分析"
  "Cursor编程"
  "AI设计工具"
  "通义千问使用"
  "AI视频剪辑"
  "AI写作助手"
)

echo "📊 爬取计划："
echo "- 关键词数量: ${#KEYWORDS[@]}"
echo "- 每个关键词: 20 条笔记"
echo "- 预计总数: $((${#KEYWORDS[@]} * 20)) 条"
echo "- 预计空间: ~$((${#KEYWORDS[@]} * 20 * 5 / 1024)) MB"
echo "- 预计时间: ~$((${#KEYWORDS[@]} * 3)) 分钟"
echo ""
read -p "按回车开始，或 Ctrl+C 取消..."

for keyword in "${KEYWORDS[@]}"; do
  echo ""
  echo "📝 正在爬取: $keyword"

  curl -s -X POST http://localhost:3000/api/crawler/crawl-and-analyze \
    -H "Content-Type: application/json" \
    -d "{
      \"keywords\": \"$keyword\",
      \"maxCount\": 20,
      \"userId\": \"crawler-batch\"
    }" | jq '.saved' 2>/dev/null || echo "需要安装 jq: brew install jq"

  echo "⏳ 等待 5 秒（避免频率限制）..."
  sleep 5
done

echo ""
echo "================================"
echo "✅ 批量爬取完成！"
echo "📂 数据位置: crawler/MediaCrawler/data/xhs/"
echo "🗄️ 数据库: workflows 表"
