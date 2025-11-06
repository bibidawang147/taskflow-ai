# 阿里云服务器部署指南

## 🎯 部署架构

```
阿里云 ECS
├── Docker PostgreSQL (端口 5432)
├── Docker Redis (端口 6379)
└── Node.js Backend (端口 3000)
```

## 前置要求

- ✅ 阿里云 ECS 服务器
- ✅ 最低配置：1核2GB（推荐 2核4GB）
- ✅ 操作系统：Ubuntu 20.04 / CentOS 7+
- ✅ 已开放端口：22(SSH), 3000(API)

## 快速部署（15分钟）

### 1. 安装 Docker (5分钟)

SSH 登录服务器：
```bash
ssh root@你的服务器IP
```

安装 Docker：
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker

# CentOS
yum install -y docker
systemctl start docker
systemctl enable docker

# 验证安装
docker --version
```

安装 Docker Compose：
```bash
curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### 2. 创建数据库服务 (3分钟)

```bash
# 创建目录
mkdir -p /root/workflow-db
cd /root/workflow-db

# 创建配置文件
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: workflow-postgres
    environment:
      POSTGRES_DB: workflow_platform
      POSTGRES_USER: workflow_user
      POSTGRES_PASSWORD: ChangeThisPassword123!
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

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps
```

### 3. 配置后端连接 (2分钟)

在本地项目的 `.env` 文件中：

```bash
# 如果后端在同一台服务器
DATABASE_URL="postgresql://workflow_user:ChangeThisPassword123!@localhost:5432/workflow_platform?schema=public"

# 如果后端在本地开发机
DATABASE_URL="postgresql://workflow_user:ChangeThisPassword123!@你的服务器IP:5432/workflow_platform?schema=public"

# Redis (可选)
REDIS_URL="redis://localhost:6379"
```

### 4. 初始化数据库 (3分钟)

```bash
# 生成 Prisma Client
npm run db:generate

# 创建数据库表
npm run db:push

# 验证
npx prisma studio
```

### 5. 部署后端 (2分钟)

**方案 A：使用 PM2（推荐）**

```bash
# 在服务器上安装 PM2
npm install -g pm2

# 上传代码到服务器
scp -r . root@你的服务器IP:/root/workflow-backend

# SSH 登录服务器
ssh root@你的服务器IP
cd /root/workflow-backend

# 安装依赖
npm install

# 构建
npm run build

# 启动
pm2 start ecosystem.config.js --env production

# 保存配置（开机自启）
pm2 save
pm2 startup
```

**方案 B：使用 Docker（全容器化）**

```bash
# 在服务器上
cd /root/workflow-db

# 修改 docker-compose.yml，添加 backend 服务
# 然后重启
docker-compose up -d
```

## 🔒 安全配置

### 1. 修改默认密码

```bash
# 编辑配置文件
nano /root/workflow-db/docker-compose.yml

# 修改这一行：
POSTGRES_PASSWORD: 你的强密码

# 重启服务
docker-compose restart postgres
```

### 2. 配置防火墙

```bash
# Ubuntu UFW
ufw allow 22/tcp   # SSH
ufw allow 3000/tcp # Backend API
ufw enable

# 不要开放 5432 和 6379（仅内网访问）
```

### 3. 配置阿里云安全组

登录阿里云控制台 → ECS → 安全组：

**入站规则：**
- 22/tcp - SSH（限制来源IP）
- 3000/tcp - API（或通过 Nginx 80/443）
- ❌ 不要开放 5432 和 6379

## 📊 监控与维护

### 查看服务状态

```bash
# Docker 容器状态
docker-compose ps

# 实时日志
docker-compose logs -f

# 资源使用
docker stats
```

### 数据库备份

```bash
# 手动备份
docker exec workflow-postgres pg_dump -U workflow_user workflow_platform | gzip > backup_$(date +%Y%m%d).sql.gz

# 自动备份（每天凌晨2点）
crontab -e

# 添加这一行：
0 2 * * * cd /root/workflow-db && docker exec workflow-postgres pg_dump -U workflow_user workflow_platform | gzip > backups/backup_$(date +\%Y\%m\%d).sql.gz
```

### 数据恢复

```bash
# 恢复备份
gunzip -c backup_20251103.sql.gz | docker exec -i workflow-postgres psql -U workflow_user workflow_platform
```

### 清理日志

```bash
# 清理 Docker 日志
docker system prune -a --volumes

# 清理旧备份（保留30天）
find /root/workflow-db/backups -name "*.sql.gz" -mtime +30 -delete
```

## 🚀 性能优化

### PostgreSQL 优化

编辑 `docker-compose.yml`，修改 command：

```yaml
command: |
  postgres
  -c shared_buffers=512MB
  -c effective_cache_size=1536MB
  -c maintenance_work_mem=128MB
  -c max_connections=200
  -c random_page_cost=1.1
  -c effective_io_concurrency=200
  -c work_mem=2621kB
```

### 添加数据库索引

```sql
-- 连接数据库
docker exec -it workflow-postgres psql -U workflow_user workflow_platform

-- 创建索引
CREATE INDEX idx_workflows_author_created ON workflows(author_id, created_at DESC);
CREATE INDEX idx_executions_user_started ON workflow_executions(user_id, started_at DESC);
CREATE INDEX idx_usage_logs_created ON usage_logs(created_at DESC);
CREATE INDEX idx_workflows_config_gin ON workflows USING GIN (config);

-- 退出
\q
```

## 🔧 故障排除

### 问题1：无法连接数据库

```bash
# 检查容器状态
docker-compose ps

# 查看日志
docker-compose logs postgres

# 测试连接
docker exec workflow-postgres pg_isready -U workflow_user

# 检查端口
netstat -tlnp | grep 5432
```

### 问题2：容器启动失败

```bash
# 查看详细日志
docker-compose logs -f postgres

# 检查磁盘空间
df -h

# 清理 Docker
docker system prune -a
```

### 问题3：性能慢

```bash
# 检查资源使用
docker stats

# 查看慢查询
docker exec -it workflow-postgres psql -U workflow_user workflow_platform -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# 优化建议
# 1. 增加 shared_buffers
# 2. 添加索引
# 3. 使用连接池
```

## 📈 升级路径

### 当用户增长时

**1. 垂直扩展（简单）**
- 升级服务器配置（2核4GB → 4核8GB）

**2. 水平扩展（复杂）**
- 读写分离（主从复制）
- 负载均衡（Nginx）
- 缓存层（Redis）

**3. 托管服务（省心）**
- 迁移到阿里云 RDS
- 使用阿里云 Redis

## 💰 成本估算

| 配置 | 月成本 | 适用规模 |
|------|--------|----------|
| 1核2GB ECS | ¥30 | 0-1000 用户 |
| 2核4GB ECS | ¥60 | 1000-5000 用户 |
| 4核8GB ECS | ¥120 | 5000-20000 用户 |

**注：** 数据库本身完全免费，只需服务器费用

## 📚 相关命令速查

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f postgres

# 进入数据库
docker exec -it workflow-postgres psql -U workflow_user workflow_platform

# 备份数据库
docker exec workflow-postgres pg_dump -U workflow_user workflow_platform > backup.sql

# 查看容器状态
docker-compose ps

# 资源监控
docker stats
```

## ✅ 部署检查清单

部署完成后，确认以下项目：

- [ ] Docker 和 Docker Compose 已安装
- [ ] PostgreSQL 容器运行中
- [ ] Redis 容器运行中
- [ ] 数据库密码已修改
- [ ] 防火墙规则配置正确
- [ ] 后端可以连接数据库
- [ ] 数据库表已创建
- [ ] 自动备份已配置
- [ ] 监控告警已设置
- [ ] 文档已保存

---

**部署完成！** 🎉

你的 PostgreSQL 数据库现在运行在阿里云服务器上，完全免费且性能强大。

有问题随时查看日志：`docker-compose logs -f`
