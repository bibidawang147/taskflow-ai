#!/bin/bash

echo "测试注册功能..."
echo "================================"

curl -X POST http://47.93.218.80/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"testuser$(date +%s)\",\"email\":\"test$(date +%s)@example.com\",\"password\":\"Test123456\"}"

echo ""
echo "================================"
