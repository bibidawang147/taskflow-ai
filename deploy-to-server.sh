#!/bin/bash

# 部署脚本
SERVER="root@47.93.218.80"
KEY="~/Desktop/工作流网站.pem"
DEPLOY_DIR="/root/workflow-platform"

echo "🚀 开始部署到服务器..."

# 1. 连接到服务器，拉取最新代码
echo "📥 步骤 1/5: 拉取最新代码..."
ssh -i "$KEY" $SERVER << 'EOF'
cd /root/workflow-platform
git pull origin main
echo "✅ 代码拉取完成"
EOF

# 2. 安装后端依赖并构建
echo "📦 步骤 2/5: 安装后端依赖..."
ssh -i "$KEY" $SERVER << 'EOF'
cd /root/workflow-platform/backend
npm install --production
npx prisma generate
echo "✅ 后端依赖安装完成"
EOF

# 3. 运行数据库迁移
echo "🗄️  步骤 3/5: 运行数据库迁移..."
ssh -i "$KEY" $SERVER << 'EOF'
cd /root/workflow-platform/backend
npx prisma migrate deploy
echo "✅ 数据库迁移完成"
EOF

# 4. 构建前端
echo "🎨 步骤 4/5: 构建前端..."
ssh -i "$KEY" $SERVER << 'EOF'
cd /root/workflow-platform/frontend
npm install
npm run build
echo "✅ 前端构建完成"
EOF

# 5. 重启服务
echo "🔄 步骤 5/5: 重启服务..."
ssh -i "$KEY" $SERVER << 'EOF'
# 重启后端服务
pm2 restart workflow-backend || pm2 start /root/workflow-platform/backend/dist/server.js --name workflow-backend

# 重启前端服务 (如果使用 pm2 serve)
pm2 restart workflow-frontend || pm2 serve /root/workflow-platform/frontend/dist 5173 --name workflow-frontend --spa

# 保存 PM2 配置
pm2 save

echo "✅ 服务重启完成"
EOF

echo ""
echo "🎉 部署完成！"
echo "📍 后端地址: http://47.93.218.80:3000"
echo "📍 前端地址: http://47.93.218.80:5173"
echo ""
echo "💡 查看服务状态: ssh -i \"$KEY\" $SERVER \"pm2 status\""
echo "💡 查看后端日志: ssh -i \"$KEY\" $SERVER \"pm2 logs workflow-backend\""
echo "💡 查看前端日志: ssh -i \"$KEY\" $SERVER \"pm2 logs workflow-frontend\""
