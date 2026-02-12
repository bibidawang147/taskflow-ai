#!/bin/bash

# 部署脚本 - 本地构建前端后上传到服务器
SERVER="root@47.93.218.80"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KEY="$SCRIPT_DIR/工作流网站.pem"

echo "🚀 开始部署到服务器..."

# 1. 本地构建前端
echo "🎨 步骤 1/3: 本地构建前端..."
cd "$SCRIPT_DIR/frontend"
npm run build
if [ $? -ne 0 ]; then
  echo "❌ 前端构建失败"
  exit 1
fi
echo "✅ 前端构建完成"

# 2. 上传构建产物到服务器
echo "📤 步骤 2/3: 上传前端到服务器..."
scp -i "$KEY" -r "$SCRIPT_DIR/frontend/dist" "$SERVER:/root/frontend/dist-new"
if [ $? -ne 0 ]; then
  echo "❌ 上传失败"
  exit 1
fi
echo "✅ 上传完成"

# 3. 切换目录并重启服务
echo "🔄 步骤 3/3: 切换版本并重启服务..."
ssh -i "$KEY" $SERVER << 'EOF'
cd /root/frontend
rm -rf dist-old
mv dist dist-old
mv dist-new dist

pm2 restart workflow-frontend
pm2 save

echo "✅ 服务重启完成"
EOF

echo ""
echo "🎉 部署完成！"
echo "📍 前端地址: http://47.93.218.80:5173"
echo ""
echo "💡 查看服务状态: ssh -i \"$KEY\" $SERVER \"pm2 status\""
echo "💡 如需回滚: ssh -i \"$KEY\" $SERVER \"cd /root/frontend && rm -rf dist && mv dist-old dist && pm2 restart workflow-frontend\""
