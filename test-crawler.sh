#!/bin/bash
# 测试爬虫脚本

echo "🧪 测试小红书爬虫..."
echo ""

# 测试只爬取数据（不需要 AI 分析）
curl -X POST http://localhost:3000/api/crawler/xiaohongshu \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "ChatGPT使用技巧",
    "maxCount": 2
  }'

echo ""
echo ""
echo "✅ 如果看到数据返回，说明爬虫工作正常！"
