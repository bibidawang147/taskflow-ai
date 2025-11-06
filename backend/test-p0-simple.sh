#!/bin/bash

# 简化的 P0 节点测试脚本
BASE_URL="http://localhost:3000/api"

echo "🧪 P0 节点简单测试"
echo ""

# 1. 获取 token
echo "1. 登录获取 token..."
LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

TOKEN=$(echo $LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败"
  echo "响应: $LOGIN"
  exit 1
fi

echo "✅ 登录成功"
echo ""

# 2. 测试文本转换节点
echo "================================"
echo "测试: TextTransform 节点"
echo "================================"

curl -s -X POST "$BASE_URL/workflows" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @- <<'EOF' | python3 -m json.tool
{
  "title": "文本转换测试",
  "description": "测试 TextTransform 节点",
  "config": {
    "nodes": [
      {
        "id": "input-1",
        "type": "input",
        "label": "输入",
        "position": {"x": 100, "y": 100},
        "config": {}
      },
      {
        "id": "transform-1",
        "type": "textTransform",
        "label": "转大写",
        "position": {"x": 300, "y": 100},
        "config": {
          "operation": "uppercase",
          "inputVariable": "input.text"
        }
      },
      {
        "id": "output-1",
        "type": "output",
        "label": "输出",
        "position": {"x": 500, "y": 100},
        "config": {"format": "text"}
      }
    ],
    "edges": [
      {"id": "e1", "source": "input-1", "target": "transform-1"},
      {"id": "e2", "source": "transform-1", "target": "output-1"}
    ]
  }
}
EOF

echo ""
echo ""

# 3. 获取所有工作流
echo "================================"
echo "获取工作流列表"
echo "================================"
curl -s "$BASE_URL/workflows" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
