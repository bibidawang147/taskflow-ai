#!/bin/bash

echo "🔍 工作流平台诊断工具"
echo "================================"
echo ""

# 检查 Node.js
echo "1️⃣ 检查 Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js 已安装: $(node --version)"
else
    echo "❌ Node.js 未安装"
fi
echo ""

# 检查依赖
echo "2️⃣ 检查依赖安装..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules 存在"
else
    echo "❌ node_modules 不存在，请运行: npm install"
fi
echo ""

# 检查 .env 文件
echo "3️⃣ 检查 .env 配置..."
if [ -f ".env" ]; then
    echo "✅ .env 文件存在"

    if grep -q "OPENAI_API_KEY" .env; then
        echo "✅ OPENAI_API_KEY 已配置"
    else
        echo "⚠️  OPENAI_API_KEY 未配置"
        echo "   请添加: echo 'OPENAI_API_KEY=sk-your-key' >> .env"
    fi
else
    echo "❌ .env 文件不存在"
    echo "   请创建: cp .env.example .env"
fi
echo ""

# 检查数据库
echo "4️⃣ 检查数据库..."
if [ -f "prisma/dev.db" ]; then
    echo "✅ 数据库文件存在"
else
    echo "⚠️  数据库文件不存在，可能需要运行: npx prisma db push"
fi
echo ""

# 检查端口占用
echo "5️⃣ 检查端口 3000..."
if lsof -i:3000 &> /dev/null; then
    echo "⚠️  端口 3000 已被占用"
    echo "   占用进程:"
    lsof -i:3000 | grep LISTEN
else
    echo "✅ 端口 3000 可用"
fi
echo ""

# 编译检查
echo "6️⃣ 检查 TypeScript 编译..."
npx tsc --noEmit 2>&1 | head -10
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "✅ TypeScript 编译通过"
else
    echo "❌ TypeScript 有编译错误（见上方）"
fi
echo ""

echo "================================"
echo "💡 下一步操作建议:"
echo ""
echo "1. 如果端口被占用，停止其他进程或使用其他端口"
echo "2. 如果缺少 .env 配置，请添加 OPENAI_API_KEY"
echo "3. 如果有编译错误，请检查代码"
echo "4. 然后运行: npm run dev"
echo ""
