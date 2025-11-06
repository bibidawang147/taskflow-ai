#!/bin/bash

# 阿里云服务器一键部署脚本
# 用法: ./aliyun-setup.sh

set -e

echo "=========================================="
echo "🚀 阿里云服务器 PostgreSQL 数据库部署"
echo "=========================================="
echo ""

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ 无法检测操作系统"
    exit 1
fi

echo "✅ 检测到操作系统: $OS"
echo ""

# 1. 安装 Docker
echo "📦 步骤 1/5: 安装 Docker..."
if ! command -v docker &> /dev/null; then
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        echo "安装 Docker (Ubuntu/Debian)..."
        curl -fsSL https://get.docker.com | sh
        systemctl start docker
        systemctl enable docker
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        echo "安装 Docker (CentOS/RHEL)..."
        yum install -y docker
        systemctl start docker
        systemctl enable docker
    else
        echo "❌ 不支持的操作系统: $OS"
        exit 1
    fi
    echo "✅ Docker 安装完成"
else
    echo "✅ Docker 已安装"
fi

docker --version
echo ""

# 2. 安装 Docker Compose
echo "📦 步骤 2/5: 安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "下载 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose 安装完成"
else
    echo "✅ Docker Compose 已安装"
fi

docker-compose --version
echo ""

# 3. 创建工作目录
echo "📁 步骤 3/5: 创建工作目录..."
WORK_DIR="/root/workflow-db"
mkdir -p $WORK_DIR
mkdir -p $WORK_DIR/backups
echo "✅ 工作目录创建完成: $WORK_DIR"
echo ""

# 4. 创建 docker-compose.yml
echo "⚙️  步骤 4/5: 创建数据库配置..."
cat > $WORK_DIR/docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: workflow-postgres
    environment:
      POSTGRES_DB: workflow_platform
      POSTGRES_USER: workflow_user
      POSTGRES_PASSWORD: WorkflowSecure2024!@#
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    command: postgres -c shared_buffers=256MB -c max_connections=200
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U workflow_user"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    image: redis:7-alpine
    container_name: workflow-redis
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  postgres_data:
  redis_data:
EOF

echo "✅ 配置文件创建完成"
echo ""

# 5. 启动服务
echo "🚀 步骤 5/5: 启动数据库服务..."
cd $WORK_DIR
docker-compose up -d

echo ""
echo "⏳ 等待服务启动（约10秒）..."
sleep 10
echo ""

# 6. 检查服务状态
echo "=========================================="
echo "📊 服务状态检查"
echo "=========================================="
docker-compose ps
echo ""

# 7. 测试连接
echo "🔍 测试数据库连接..."
if docker exec workflow-postgres pg_isready -U workflow_user > /dev/null 2>&1; then
    echo "✅ PostgreSQL 连接成功"
else
    echo "⚠️  PostgreSQL 连接失败，请检查日志"
fi

if docker exec workflow-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis 连接成功"
else
    echo "⚠️  Redis 连接失败，请检查日志"
fi

echo ""
echo "=========================================="
echo "🎉 部署完成！"
echo "=========================================="
echo ""
echo "📝 重要信息："
echo "   数据库地址: localhost:5432"
echo "   数据库名称: workflow_platform"
echo "   用户名: workflow_user"
echo "   密码: WorkflowSecure2024!@#"
echo "   Redis地址: localhost:6379"
echo ""
echo "📁 配置目录: $WORK_DIR"
echo "💾 备份目录: $WORK_DIR/backups"
echo ""
echo "🔧 常用命令："
echo "   查看日志: cd $WORK_DIR && docker-compose logs -f"
echo "   停止服务: cd $WORK_DIR && docker-compose down"
echo "   重启服务: cd $WORK_DIR && docker-compose restart"
echo "   查看状态: cd $WORK_DIR && docker-compose ps"
echo ""
echo "⚠️  安全提醒："
echo "   1. 建议修改默认密码（编辑 $WORK_DIR/docker-compose.yml）"
echo "   2. 配置防火墙，不要开放 5432 和 6379 端口到外网"
echo "   3. 定期备份数据库"
echo ""
echo "📚 下一步："
echo "   1. 在本地项目运行: npm run db:generate"
echo "   2. 在本地项目运行: npm run db:push"
echo "   3. 启动后端服务: npm run dev"
echo ""
echo "=========================================="
