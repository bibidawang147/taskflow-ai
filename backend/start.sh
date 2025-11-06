#!/bin/bash

echo "🚀 启动工作流平台后端"
echo "================================"
echo ""

# 检查 .env 配置
if [ -f ".env" ]; then
    if grep -q "your-openai-api-key" .env; then
        echo "⚠️  警告: OpenAI API Key 未配置！"
        echo ""
        echo "请按以下步骤操作："
        echo "1. 访问 https://platform.openai.com/api-keys"
        echo "2. 创建一个新的 API Key"
        echo "3. 运行以下命令（替换成你的真实 key）："
        echo ""
        echo "   sed -i '' 's/your-openai-api-key/sk-proj-your-real-key/' .env"
        echo ""
        read -p "已配置 API Key？输入 y 继续，输入 n 退出: " confirm

        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            echo "❌ 已取消启动"
            exit 1
        fi
    fi
fi

# 检查端口
if lsof -i:3000 &> /dev/null; then
    echo "⚠️  端口 3000 已被占用"
    read -p "是否杀死占用进程并继续？(y/n): " kill_confirm

    if [ "$kill_confirm" = "y" ] || [ "$kill_confirm" = "Y" ]; then
        echo "正在停止占用端口的进程..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null
        sleep 1
        echo "✅ 端口已释放"
    else
        echo "❌ 已取消启动"
        exit 1
    fi
fi

echo ""
echo "✅ 配置检查完成"
echo "🚀 正在启动后端服务..."
echo ""
echo "访问地址: http://localhost:3000"
echo "健康检查: http://localhost:3000/health"
echo ""
echo "按 Ctrl+C 停止服务"
echo "================================"
echo ""

# 启动服务
npm run dev
