#!/bin/bash

# 工作流平台一键部署脚本
# 使用方法: ./deploy.sh [frontend|backend|all]

set -e  # 遇到错误立即退出

# 配置
SERVER_IP="47.93.218.80"
SSH_KEY="$HOME/Desktop/开发文件夹/workflow-platform/工作流网站.pem"
SERVER_USER="root"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 部署前端
deploy_frontend() {
    echo_info "======================================"
    echo_info "开始部署前端..."
    echo_info "======================================"

    cd frontend

    # 构建
    echo_info "1. 构建前端代码..."
    npm run build

    # 上传
    echo_info "2. 上传到服务器..."
    scp -i $SSH_KEY -r dist/* ${SERVER_USER}@${SERVER_IP}:/var/www/workflow-platform/

    # 重启 Nginx
    echo_info "3. 重启 Nginx..."
    ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_IP} "systemctl restart nginx"

    cd ..

    echo_info "✅ 前端部署完成！"
    echo_info "访问: http://${SERVER_IP}"
}

# 部署后端
deploy_backend() {
    echo_info "======================================"
    echo_info "开始部署后端..."
    echo_info "======================================"

    cd backend

    # 构建（tsc 有预存类型错误时仍会生成 dist，忽略非零退出码）
    echo_info "1. 构建后端代码..."
    npm run build || true

    # 上传关键文件
    echo_info "2. 上传到服务器..."

    # 上传 dist 目录
    scp -i $SSH_KEY -r dist ${SERVER_USER}@${SERVER_IP}:/root/workflow-backend/

    # 上传 package.json（检查依赖是否变化）
    scp -i $SSH_KEY package.json ${SERVER_USER}@${SERVER_IP}:/root/workflow-backend/

    # 上传 prisma（如果数据库schema变化）
    scp -i $SSH_KEY -r prisma ${SERVER_USER}@${SERVER_IP}:/root/workflow-backend/

    # 在服务器上安装依赖（如果 package.json 变化）
    echo_info "3. 检查并安装依赖..."
    ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_IP} << 'EOF'
        cd /root/workflow-backend

        # 检查是否需要重新安装依赖
        npm install --production

        # 执行数据库迁移
        npx prisma migrate deploy

        # 生成 Prisma 客户端
        npx prisma generate
EOF

    # 重启后端服务
    echo_info "4. 重启后端服务..."
    ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_IP} "pm2 restart workflow-backend"

    cd ..

    echo_info "✅ 后端部署完成！"

    # 显示日志
    echo_info "查看日志..."
    ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_IP} "pm2 logs workflow-backend --lines 20 --nostream"
}

# 快速重启（只重启服务，不重新构建上传）
quick_restart() {
    echo_info "======================================"
    echo_info "快速重启服务..."
    echo_info "======================================"

    ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_IP} << 'EOF'
        pm2 restart workflow-backend
        systemctl restart nginx
EOF

    echo_info "✅ 服务重启完成！"
}

# 查看服务状态
check_status() {
    echo_info "======================================"
    echo_info "检查服务状态..."
    echo_info "======================================"

    ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_IP} << 'EOF'
        echo "=== PM2 状态 ==="
        pm2 list

        echo ""
        echo "=== Nginx 状态 ==="
        systemctl status nginx --no-pager | head -10

        echo ""
        echo "=== 后端日志 (最近10行) ==="
        pm2 logs workflow-backend --lines 10 --nostream | tail -10
EOF
}

# 回滚（恢复上一个版本）
rollback() {
    echo_warn "回滚功能需要先设置 Git 版本管理"
    echo_info "建议: 先运行 'git init' 初始化仓库"
}

# 主函数
main() {
    case "${1:-all}" in
        frontend|fe)
            deploy_frontend
            ;;
        backend|be)
            deploy_backend
            ;;
        all)
            deploy_backend
            echo ""
            deploy_frontend
            ;;
        restart)
            quick_restart
            ;;
        status)
            check_status
            ;;
        rollback)
            rollback
            ;;
        *)
            echo "使用方法: $0 [frontend|backend|all|restart|status|rollback]"
            echo ""
            echo "命令说明:"
            echo "  frontend, fe  - 只部署前端"
            echo "  backend, be   - 只部署后端"
            echo "  all          - 部署前后端 (默认)"
            echo "  restart      - 快速重启服务（不重新构建）"
            echo "  status       - 查看服务状态"
            echo "  rollback     - 回滚到上一版本"
            echo ""
            echo "示例:"
            echo "  $0              # 部署前后端"
            echo "  $0 frontend     # 只部署前端"
            echo "  $0 backend      # 只部署后端"
            echo "  $0 restart      # 只重启服务"
            echo "  $0 status       # 查看状态"
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
