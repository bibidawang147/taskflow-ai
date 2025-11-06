#!/bin/bash

# 文章转工作流 - 模拟模式 API 测试脚本

echo "====================================="
echo "🧪 文章转工作流 - 模拟模式测试"
echo "====================================="
echo ""

# API基础URL
API_BASE_URL="http://localhost:3000/api"

# 测试账号
EMAIL="test@workflow.com"
PASSWORD="test123456"

echo "步骤1: 登录获取Token..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# 提取token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败！请检查测试账号是否存在"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ 登录成功！Token: ${TOKEN:0:20}..."
echo ""

# 测试案例1: 博客写作
echo "====================================="
echo "测试案例1: 博客写作工作流"
echo "====================================="
echo "URL: https://example.com/how-to-write-blog"
echo ""

RESPONSE1=$(curl -s -X POST "$API_BASE_URL/workflows/generate/from-article-mock" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"url":"https://example.com/how-to-write-blog","autoSave":true}')

# 检查是否成功
if echo "$RESPONSE1" | grep -q "工作流创建成功"; then
  echo "✅ 测试案例1: 成功"
  echo "工作流标题: $(echo $RESPONSE1 | grep -o '"title":"[^"]*' | head -1 | sed 's/"title":"//')"
  echo "步骤数量: $(echo $RESPONSE1 | grep -o '"stepsExtracted":[0-9]*' | sed 's/"stepsExtracted"://')"
  echo "分类: $(echo $RESPONSE1 | grep -o '"category":"[^"]*' | head -1 | sed 's/"category":"//')"
else
  echo "❌ 测试案例1: 失败"
  echo "Response: $RESPONSE1"
fi
echo ""

# 测试案例2: 数据分析
echo "====================================="
echo "测试案例2: 数据分析工作流"
echo "====================================="
echo "URL: https://example.com/data-analysis-guide"
echo ""

RESPONSE2=$(curl -s -X POST "$API_BASE_URL/workflows/generate/from-article-mock" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"url":"https://example.com/data-analysis-guide","autoSave":true}')

if echo "$RESPONSE2" | grep -q "工作流创建成功"; then
  echo "✅ 测试案例2: 成功"
  echo "工作流标题: $(echo $RESPONSE2 | grep -o '"title":"[^"]*' | head -1 | sed 's/"title":"//')"
  echo "步骤数量: $(echo $RESPONSE2 | grep -o '"stepsExtracted":[0-9]*' | sed 's/"stepsExtracted"://')"
  echo "分类: $(echo $RESPONSE2 | grep -o '"category":"[^"]*' | head -1 | sed 's/"category":"//')"
else
  echo "❌ 测试案例2: 失败"
  echo "Response: $RESPONSE2"
fi
echo ""

# 测试案例3: 产品设计
echo "====================================="
echo "测试案例3: 产品设计工作流"
echo "====================================="
echo "URL: https://example.com/product-design-process"
echo ""

RESPONSE3=$(curl -s -X POST "$API_BASE_URL/workflows/generate/from-article-mock" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"url":"https://example.com/product-design-process","autoSave":true}')

if echo "$RESPONSE3" | grep -q "工作流创建成功"; then
  echo "✅ 测试案例3: 成功"
  echo "工作流标题: $(echo $RESPONSE3 | grep -o '"title":"[^"]*' | head -1 | sed 's/"title":"//')"
  echo "步骤数量: $(echo $RESPONSE3 | grep -o '"stepsExtracted":[0-9]*' | sed 's/"stepsExtracted"://')"
  echo "分类: $(echo $RESPONSE3 | grep -o '"category":"[^"]*' | head -1 | sed 's/"category":"//')"
else
  echo "❌ 测试案例3: 失败"
  echo "Response: $RESPONSE3"
fi
echo ""

# 测试案例4: 通用工作流
echo "====================================="
echo "测试案例4: 通用工作流"
echo "====================================="
echo "URL: https://example.com/generic-workflow"
echo ""

RESPONSE4=$(curl -s -X POST "$API_BASE_URL/workflows/generate/from-article-mock" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"url":"https://example.com/generic-workflow","autoSave":true}')

if echo "$RESPONSE4" | grep -q "工作流创建成功"; then
  echo "✅ 测试案例4: 成功"
  echo "工作流标题: $(echo $RESPONSE4 | grep -o '"title":"[^"]*' | head -1 | sed 's/"title":"//')"
  echo "步骤数量: $(echo $RESPONSE4 | grep -o '"stepsExtracted":[0-9]*' | sed 's/"stepsExtracted"://')"
  echo "分类: $(echo $RESPONSE4 | grep -o '"category":"[^"]*' | head -1 | sed 's/"category":"//')"
else
  echo "❌ 测试案例4: 失败"
  echo "Response: $RESPONSE4"
fi
echo ""

echo "====================================="
echo "🎉 测试完成！"
echo "====================================="
echo ""
echo "查看生成的工作流:"
echo "1. 访问 http://localhost:5173"
echo "2. 登录账号: test@workflow.com"
echo "3. 查看工作流列表"
echo ""
