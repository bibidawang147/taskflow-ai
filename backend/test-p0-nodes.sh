#!/bin/bash

# P0 节点功能测试脚本
# 测试 TextTransform, TemplateRenderer, Condition, HTTPRequest 节点

BASE_URL="http://localhost:3000/api"

echo "================================"
echo "🧪 P0 节点功能测试"
echo "================================"
echo ""

# 获取用户 token
echo "📝 步骤 1: 获取测试用户 token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ 获取 token 失败，请先创建测试用户"
  exit 1
fi

echo "✅ Token 获取成功"
echo ""

# ============================================================
# 测试 1: TextTransform 节点 - 文本转换
# ============================================================
echo "================================"
echo "测试 1: TextTransform 节点（文本转换）"
echo "================================"

WORKFLOW_1=$(curl -s -X POST "$BASE_URL/workflows" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "测试-文本转换节点",
    "description": "测试 TextTransform 节点的各种操作",
    "config": {
      "nodes": [
        {
          "id": "input-1",
          "type": "input",
          "label": "输入文本",
          "position": { "x": 100, "y": 100 },
          "config": {}
        },
        {
          "id": "transform-1",
          "type": "textTransform",
          "label": "转大写",
          "position": { "x": 300, "y": 100 },
          "config": {
            "operation": "uppercase",
            "inputVariable": "input.text"
          }
        },
        {
          "id": "output-1",
          "type": "output",
          "label": "输出结果",
          "position": { "x": 500, "y": 100 },
          "config": { "format": "text" }
        }
      ],
      "edges": [
        { "id": "e1", "source": "input-1", "target": "transform-1" },
        { "id": "e2", "source": "transform-1", "target": "output-1" }
      ]
    }
  }')

WORKFLOW_1_ID=$(echo $WORKFLOW_1 | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
echo "工作流 ID: $WORKFLOW_1_ID"

# 执行工作流
echo "执行工作流..."
EXECUTION_1=$(curl -s -X POST "$BASE_URL/workflows/$WORKFLOW_1_ID/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"input": {"text": "hello world"}}')

EXECUTION_1_ID=$(echo $EXECUTION_1 | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
echo "执行 ID: $EXECUTION_1_ID"

# 等待执行完成
sleep 2

# 获取执行结果
RESULT_1=$(curl -s "$BASE_URL/workflows/executions/$EXECUTION_1_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "执行结果:"
echo $RESULT_1 | grep -o '"result":"[^"]*' | sed 's/"result":"//'
echo ""

# ============================================================
# 测试 2: TemplateRenderer 节点 - 模板渲染
# ============================================================
echo "================================"
echo "测试 2: TemplateRenderer 节点（模板渲染）"
echo "================================"

WORKFLOW_2=$(curl -s -X POST "$BASE_URL/workflows" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "测试-模板渲染节点",
    "description": "测试 TemplateRenderer 节点的变量替换功能",
    "config": {
      "nodes": [
        {
          "id": "input-1",
          "type": "input",
          "label": "用户信息",
          "position": { "x": 100, "y": 100 },
          "config": {}
        },
        {
          "id": "template-1",
          "type": "templateRenderer",
          "label": "渲染模板",
          "position": { "x": 300, "y": 100 },
          "config": {
            "template": "你好，{{input.name}}！欢迎来到{{input.city}}。"
          }
        },
        {
          "id": "output-1",
          "type": "output",
          "label": "输出结果",
          "position": { "x": 500, "y": 100 },
          "config": { "format": "text" }
        }
      ],
      "edges": [
        { "id": "e1", "source": "input-1", "target": "template-1" },
        { "id": "e2", "source": "template-1", "target": "output-1" }
      ]
    }
  }')

WORKFLOW_2_ID=$(echo $WORKFLOW_2 | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
echo "工作流 ID: $WORKFLOW_2_ID"

# 执行工作流
echo "执行工作流..."
EXECUTION_2=$(curl -s -X POST "$BASE_URL/workflows/$WORKFLOW_2_ID/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"input": {"name": "张三", "city": "北京"}}')

EXECUTION_2_ID=$(echo $EXECUTION_2 | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
echo "执行 ID: $EXECUTION_2_ID"

# 等待执行完成
sleep 2

# 获取执行结果
RESULT_2=$(curl -s "$BASE_URL/workflows/executions/$EXECUTION_2_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "执行结果:"
echo $RESULT_2 | python3 -m json.tool 2>/dev/null || echo $RESULT_2
echo ""

# ============================================================
# 测试 3: Condition 节点 - 条件判断
# ============================================================
echo "================================"
echo "测试 3: Condition 节点（条件判断）"
echo "================================"

WORKFLOW_3=$(curl -s -X POST "$BASE_URL/workflows" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "测试-条件判断节点",
    "description": "测试 Condition 节点的比较功能",
    "config": {
      "nodes": [
        {
          "id": "input-1",
          "type": "input",
          "label": "输入数字",
          "position": { "x": 100, "y": 100 },
          "config": {}
        },
        {
          "id": "condition-1",
          "type": "condition",
          "label": "判断是否大于10",
          "position": { "x": 300, "y": 100 },
          "config": {
            "variable": "input.number",
            "operator": ">",
            "value": "10",
            "trueOutput": "数字大于10",
            "falseOutput": "数字小于等于10"
          }
        },
        {
          "id": "output-1",
          "type": "output",
          "label": "输出结果",
          "position": { "x": 500, "y": 100 },
          "config": { "format": "text" }
        }
      ],
      "edges": [
        { "id": "e1", "source": "input-1", "target": "condition-1" },
        { "id": "e2", "source": "condition-1", "target": "output-1" }
      ]
    }
  }')

WORKFLOW_3_ID=$(echo $WORKFLOW_3 | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
echo "工作流 ID: $WORKFLOW_3_ID"

# 测试大于10的情况
echo "测试用例 1: 输入 15 (应该输出'数字大于10')"
EXECUTION_3A=$(curl -s -X POST "$BASE_URL/workflows/$WORKFLOW_3_ID/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"input": {"number": 15}}')

EXECUTION_3A_ID=$(echo $EXECUTION_3A | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
sleep 2

RESULT_3A=$(curl -s "$BASE_URL/workflows/executions/$EXECUTION_3A_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "结果: $(echo $RESULT_3A | python3 -m json.tool 2>/dev/null | grep -A 2 'result' | tail -1)"

# 测试小于等于10的情况
echo "测试用例 2: 输入 5 (应该输出'数字小于等于10')"
EXECUTION_3B=$(curl -s -X POST "$BASE_URL/workflows/$WORKFLOW_3_ID/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"input": {"number": 5}}')

EXECUTION_3B_ID=$(echo $EXECUTION_3B | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
sleep 2

RESULT_3B=$(curl -s "$BASE_URL/workflows/executions/$EXECUTION_3B_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "结果: $(echo $RESULT_3B | python3 -m json.tool 2>/dev/null | grep -A 2 'result' | tail -1)"
echo ""

# ============================================================
# 测试 4: HTTPRequest 节点 - HTTP 请求
# ============================================================
echo "================================"
echo "测试 4: HTTPRequest 节点（HTTP请求）"
echo "================================"

WORKFLOW_4=$(curl -s -X POST "$BASE_URL/workflows" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "测试-HTTP请求节点",
    "description": "测试 HTTPRequest 节点调用外部API",
    "config": {
      "nodes": [
        {
          "id": "input-1",
          "type": "input",
          "label": "输入参数",
          "position": { "x": 100, "y": 100 },
          "config": {}
        },
        {
          "id": "http-1",
          "type": "httpRequest",
          "label": "调用API",
          "position": { "x": 300, "y": 100 },
          "config": {
            "method": "GET",
            "url": "https://jsonplaceholder.typicode.com/posts/1",
            "headers": {},
            "timeout": 10000
          }
        },
        {
          "id": "output-1",
          "type": "output",
          "label": "输出结果",
          "position": { "x": 500, "y": 100 },
          "config": { "format": "json" }
        }
      ],
      "edges": [
        { "id": "e1", "source": "input-1", "target": "http-1" },
        { "id": "e2", "source": "http-1", "target": "output-1" }
      ]
    }
  }')

WORKFLOW_4_ID=$(echo $WORKFLOW_4 | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
echo "工作流 ID: $WORKFLOW_4_ID"

# 执行工作流
echo "执行工作流（调用 JSONPlaceholder API）..."
EXECUTION_4=$(curl -s -X POST "$BASE_URL/workflows/$WORKFLOW_4_ID/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"input": {}}')

EXECUTION_4_ID=$(echo $EXECUTION_4 | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
echo "执行 ID: $EXECUTION_4_ID"

# 等待执行完成
sleep 3

# 获取执行结果
RESULT_4=$(curl -s "$BASE_URL/workflows/executions/$EXECUTION_4_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "执行结果:"
echo $RESULT_4 | python3 -m json.tool 2>/dev/null | head -30
echo ""

# ============================================================
# 测试总结
# ============================================================
echo "================================"
echo "✅ P0 节点测试完成"
echo "================================"
echo ""
echo "已测试的节点:"
echo "  1. ✓ TextTransform - 文本转换"
echo "  2. ✓ TemplateRenderer - 模板渲染"
echo "  3. ✓ Condition - 条件判断"
echo "  4. ✓ HTTPRequest - HTTP请求"
echo ""
echo "请检查上述输出，确认所有节点功能正常。"
