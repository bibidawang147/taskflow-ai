#!/bin/bash

# 部署到阿里云服务器脚本
# 用法: ./deploy-to-aliyun.sh your-server-ip

set -e

if [ -z "$1" ]; then
  echo "用法: ./deploy-to-aliyun.sh <服务器IP>"
  echo "示例: ./deploy-to-aliyun.sh 47.100.123.456"
  exit 1
fi

SERVER_IP=$1
REMOTE_PATH="/root/workflow-platform"

echo "================================"
echo "🚀 部署到阿里云服务器"
echo "服务器: $SERVER_IP"
echo "================================"
echo ""

# 1. 创建远程目录
echo "📁 创建远程目录..."
ssh root@$SERVER_IP "mkdir -p $REMOTE_PATH/backend"

# 2. 上传必要文件
echo "📤 上传配置文件..."

# 上传 Docker 配置
scp docker-compose.dev.yml root@$SERVER_IP:$REMOTE_PATH/backend/docker-compose.yml
scp .env.example root@$SERVER_IP:$REMOTE_PATH/backend/.env.example

# 上传脚本
scp -r scripts root@$SERVER_IP:$REMOTE_PATH/backend/

echo ""
echo "✅ 文件上传完成！"
echo ""
echo "================================"
echo "接下来的步骤："
echo "================================"
echo ""
echo "1. SSH 登录服务器:"
echo "   ssh root@$SERVER_IP"
echo ""
echo "2. 进入目录:"
echo "   cd $REMOTE_PATH/backend"
echo ""
echo "3. 配置环境变量:"
echo "   cp .env.example .env"
echo "   nano .env"
echo ""
echo "4. 启动服务:"
echo "   docker-compose up -d"
echo ""
echo "5. 查看日志:"
echo "   docker-compose logs -f"
echo ""
echo "================================"
