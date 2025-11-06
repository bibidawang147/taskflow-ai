#!/bin/bash

echo "🧪 测试阿里云千问 API 集成"
echo "================================"
echo ""

# 1. 先登录获取 token（使用测试用户）
echo "1️⃣ 获取认证 token..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，请先创建测试用户"
  echo "运行: cd backend && npm run seed"
  exit 1
fi

echo "✅ 登录成功"
echo ""

# 2. 创建测试工作流
echo "2️⃣ 创建测试工作流..."
WORKFLOW_ID=$(curl -s -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "测试阿里云千问",
    "description": "测试工作流执行",
    "category": "测试",
    "tags": [],
    "config": {
      "nodes": [
        {
          "id": "step-1",
          "type": "llm",
          "label": "智能分析",
          "position": { "x": 250, "y": 100 },
          "config": {
            "prompt": "请用一句话介绍阿里云千问大模型的特点。",
            "model": "qwen-plus"
          }
        }
      ],
      "edges": []
    },
    "isPublic": false
  }' | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$WORKFLOW_ID" ]; then
  echo "❌ 创建工作流失败"
  exit 1
fi

echo "✅ 工作流创建成功，ID: $WORKFLOW_ID"
echo ""

# 3. 运行工作流
echo "3️⃣ 运行工作流..."
EXECUTION_ID=$(curl -s -X POST "http://localhost:3000/api/workflows/$WORKFLOW_ID/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "input": {
      "userInput": "测试"
    }
  }' | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$EXECUTION_ID" ]; then
  echo "❌ 运行工作流失败"
  exit 1
fi

echo "✅ 工作流开始执行，执行ID: $EXECUTION_ID"
echo ""

# 4. 等待执行完成并查看结果
echo "4️⃣ 等待执行完成..."
for i in {1..10}; do
  sleep 2

  RESULT=$(curl -s "http://localhost:3000/api/workflows/executions/$EXECUTION_ID" \
    -H "Authorization: Bearer $TOKEN")

  STATUS=$(echo $RESULT | grep -o '"status":"[^"]*' | cut -d'"' -f4)

  echo "   检查状态 ($i/10): $STATUS"

  if [ "$STATUS" = "completed" ]; then
    echo ""
    echo "✅ 执行成功！"
    echo ""
    echo "📋 执行结果："
    echo "================================"
    echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
    exit 0
  elif [ "$STATUS" = "failed" ]; then
    echo ""
    echo "❌ 执行失败"
    echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
    exit 1
  fi
done

echo ""
echo "⏱️  执行超时，请查看后端日志"
echo "运行: tail -f backend.log"
