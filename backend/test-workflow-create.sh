#!/bin/bash

# 创建工作流测试脚本
BASE_URL="http://localhost:3000/api"

echo "1. 登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

echo "登录响应: $LOGIN_RESPONSE"
echo ""

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ 无法获取 token"
  exit 1
fi

echo "✅ Token: ${TOKEN:0:50}..."
echo ""

echo "2. 创建简单工作流..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/workflows" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "简单测试工作流",
    "description": "用于测试新节点的简单工作流",
    "config": {
      "nodes": [
        {
          "id": "input-1",
          "type": "input",
          "label": "输入节点",
          "position": {"x": 100, "y": 100},
          "config": {}
        },
        {
          "id": "output-1",
          "type": "output",
          "label": "输出节点",
          "position": {"x": 300, "y": 100},
          "config": {"format": "text"}
        }
      ],
      "edges": [
        {"id": "e1", "source": "input-1", "target": "output-1"}
      ]
    }
  }')

echo "创建工作流响应:"
echo $CREATE_RESPONSE | python3 -m json.tool
