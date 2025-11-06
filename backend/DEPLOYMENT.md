# 🚀 Workflow Platform 后端部署指南

## 目录

1. [快速开始](#快速开始)
2. [Docker 部署](#docker-部署)
3. [生产环境配置](#生产环境配置)
4. [数据库迁移](#数据库迁移)
5. [监控与维护](#监控与维护)
6. [故障排除](#故障排除)

---

## 快速开始

### 开发环境启动

```bash
# 1. 安装依赖
npm install

# 2. 生成 Prisma Client
npm run db:generate

# 3. 初始化数据库
npm run db:push

# 4. 启动开发服务器
npm run dev
```

访问：http://localhost:3000/health

---

## Docker 部署

### 前提条件

- Docker 20.10+
- Docker Compose 2.0+

### 步骤

#### 1. 准备环境变量

```bash
# 复制配置文件
cp .env.production.example .env.docker

# 生成强密钥
node scripts/generate-secrets.js

# 编辑 .env.docker，填入生成的密钥
nano .env.docker
```

**必须配置的变量：**
```bash
NODE_ENV=production
JWT_SECRET=<生成的64字节密钥>
DB_PASSWORD=<强密码>
REDIS_PASSWORD=<强密码>
ALLOWED_ORIGINS=https://your-domain.com
ALIBABA_API_KEY=<你的API KEY>
```

#### 2. 启动服务

```bash
# 启动所有服务（PostgreSQL + Redis + Backend）
docker-compose --env-file .env.docker up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
```

#### 3. 初始化数据库

```bash
# 进入后端容器
docker-compose exec backend sh

# 运行迁移
npx prisma migrate deploy

# 退出
exit
```

#### 4. 验证部署

```bash
# 健康检查
curl http://localhost:3000/health

# 预期输出
{
  "status": "OK",
  "timestamp": "2025-11-03T..."
}
```

---

## 生产环境配置

### 推荐架构

```
Internet
    ↓
Nginx (反向代理 + SSL)
    ↓
Backend (Docker/PM2)
    ↓
PostgreSQL (RDS)
    ↓
Redis (缓存)
```

### Nginx 配置示例

```nginx
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件
    location /uploads {
        alias /var/www/workflow-platform/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### PM2 部署（非 Docker）

```bash
# 安装 PM2
npm install -g pm2

# 构建
npm run build

# 启动
pm2 start ecosystem.config.js --env production

# 查看状态
pm2 status

# 查看日志
pm2 logs workflow-backend

# 监控
pm2 monit

# 保存配置（开机自启）
pm2 save
pm2 startup
```

---

## 数据库迁移

### 从 SQLite 迁移到 PostgreSQL

查看详细指南：[scripts/migrate-to-postgres.md](./scripts/migrate-to-postgres.md)

### 创建新迁移

```bash
# 修改 schema.prisma 后
npx prisma migrate dev --name your_migration_name

# 生产环境部署迁移
npx prisma migrate deploy
```

### 数据备份

```bash
# 手动备份
docker-compose exec postgres pg_dump -U workflow_user workflow_platform | gzip > backup_$(date +%Y%m%d).sql.gz

# 或使用脚本（自动每天备份）
docker-compose up -d backup
```

### 数据恢复

```bash
# 使用备份脚本
docker-compose exec backup sh /backup.sh restore /backups/backup_20251103.sql.gz
```

---

## 监控与维护

### 日志管理

日志文件位置：`./logs/`

- `combined-<date>.log` - 所有日志
- `error-<date>.log` - 错误日志
- `http-<date>.log` - HTTP 请求日志

```bash
# 查看实时日志
tail -f logs/combined-$(date +%Y-%m-%d).log

# 查看错误日志
tail -f logs/error-$(date +%Y-%m-%d).log

# 查看 Docker 日志
docker-compose logs -f backend
```

### 健康检查

```bash
# 基本健康检查
curl http://localhost:3000/health

# 数据库连接检查
docker-compose exec postgres pg_isready -U workflow_user

# Redis 检查
docker-compose exec redis redis-cli ping
```

### 性能监控

```bash
# Docker 资源使用
docker stats

# PM2 监控
pm2 monit

# 数据库性能
docker-compose exec postgres psql -U workflow_user -d workflow_platform -c "SELECT * FROM pg_stat_activity;"
```

### 日志清理

```bash
# 清理30天前的日志
find logs/ -name "*.log" -mtime +30 -delete

# 清理旧备份（保留7天）
find backups/ -name "*.sql.gz" -mtime +7 -delete
```

---

## 故障排除

### 问题1：容器无法启动

```bash
# 检查日志
docker-compose logs backend

# 常见原因：
# - 端口占用：修改 .env.docker 中的 PORT
# - 数据库未就绪：等待 postgres 健康检查通过
# - 环境变量错误：检查 .env.docker 配置
```

### 问题2：数据库连接失败

```bash
# 检查 PostgreSQL 状态
docker-compose ps postgres

# 测试连接
docker-compose exec backend sh -c "npx prisma db pull"

# 检查连接字符串
echo $DATABASE_URL
```

### 问题3：502 Bad Gateway

```bash
# 检查后端是否运行
curl http://localhost:3000/health

# 检查 Nginx 配置
nginx -t

# 查看 Nginx 日志
tail -f /var/log/nginx/error.log
```

### 问题4：内存溢出

```bash
# 增加 Node.js 内存限制
NODE_OPTIONS="--max-old-space-size=2048" npm start

# 或在 ecosystem.config.js 中配置
node_args: '--max-old-space-size=2048'

# Docker 中限制内存
docker-compose up -d --scale backend=1 --memory="1g"
```

### 问题5：日志文件过大

```bash
# 配置日志轮转（已自动配置）
# winston-daily-rotate-file 会自动清理旧日志

# 手动清理
rm logs/*.log
```

---

## 安全检查清单

- [ ] JWT_SECRET 使用强随机密钥（64字节）
- [ ] 数据库密码强度足够（20+字符）
- [ ] CORS 配置正确的域名
- [ ] 环境变量不要提交到 Git
- [ ] HTTPS 证书配置正确
- [ ] 定期更新依赖包：`npm audit fix`
- [ ] 防火墙规则配置正确
- [ ] 定时备份数据库
- [ ] 日志不包含敏感信息
- [ ] Rate Limiting 配置合理

---

## 性能优化建议

1. **启用 Redis 缓存**（即将支持）
2. **使用 CDN 加速静态资源**
3. **开启 gzip 压缩**（Nginx 配置）
4. **数据库查询优化**（添加索引）
5. **使用连接池**（Prisma 自动管理）
6. **PM2 集群模式**（多核CPU）

---

## 相关文档

- [数据库迁移指南](./scripts/migrate-to-postgres.md)
- [API 文档](#) (待添加)
- [架构设计文档](#) (待添加)

---

## 技术支持

遇到问题？

1. 查看日志：`docker-compose logs -f`
2. 检查健康状态：`curl http://localhost:3000/health`
3. 查看本文档的[故障排除](#故障排除)部分

---

**最后更新：** 2025-11-03
**版本：** 1.0.0
