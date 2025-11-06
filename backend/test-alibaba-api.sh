#!/bin/bash

# 测试阿里云百炼 API Key
API_KEY="sk-9f74ae6c017b46249f8081cc4296b5a3"
BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"

echo "测试阿里云百炼 API Key..."
echo "================================"

curl -X POST "${BASE_URL}/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_KEY}" \
  -d '{
    "model": "qwen-turbo",
    "messages": [
      {
        "role": "user",
        "content": "你好，请回复：API连接成功"
      }
    ],
    "max_tokens": 50,
    "temperature": 0.7
  }'

echo ""
echo "================================"
echo "测试完成！"
