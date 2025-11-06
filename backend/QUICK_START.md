# ⚡ 快速启动指南

## 5分钟部署到生产环境

### 1. 生成密钥 (30秒)

```bash
node scripts/generate-secrets.js
```

复制输出的密钥备用。

### 2. 配置环境变量 (2分钟)

```bash
cp .env.production.example .env.docker
nano .env.docker
```

**必须修改：**
```bash
JWT_SECRET=<刚才生成的JWT_SECRET>
DB_PASSWORD=<刚才生成的DB_PASSWORD>
REDIS_PASSWORD=<刚才生成的REDIS_PASSWORD>
ALLOWED_ORIGINS=https://your-domain.com
```

### 3. 启动服务 (2分钟)

```bash
# 启动所有服务
docker-compose --env-file .env.docker up -d

# 等待服务就绪（约30秒）
docker-compose ps

# 初始化数据库
docker-compose exec backend npx prisma migrate deploy
```

### 4. 验证 (30秒)

```bash
# 健康检查
curl http://localhost:3000/health

# 预期输出：{"status":"OK","timestamp":"..."}
```

## ✅ 完成！

您的后端现在运行在：
- API：http://localhost:3000
- PostgreSQL：localhost:5432
- Redis：localhost:6379

## 下一步

### 配置 Nginx（推荐）

```bash
# 安装 Nginx
sudo apt install nginx

# 创建配置
sudo nano /etc/nginx/sites-available/workflow-api

# 添加以下内容：
server {
    listen 80;
    server_name api.your-domain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 启用配置
sudo ln -s /etc/nginx/sites-available/workflow-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 配置 SSL（Let's Encrypt）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
```

### 监控

```bash
# 查看日志
docker-compose logs -f backend

# 查看资源使用
docker stats

# 健康检查
watch -n 5 'curl -s http://localhost:3000/health | jq'
```

## 常用命令

```bash
# 重启服务
docker-compose restart backend

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down

# 备份数据库
docker-compose exec postgres pg_dump -U workflow_user workflow_platform | gzip > backup.sql.gz

# 进入容器
docker-compose exec backend sh
```

## 故障排除

### 端口被占用？

编辑 `.env.docker`：
```bash
PORT=3001  # 改成其他端口
```

### 数据库连接失败？

检查 PostgreSQL 是否启动：
```bash
docker-compose ps postgres
docker-compose logs postgres
```

### 502 错误？

等待后端完全启动（约10秒）：
```bash
docker-compose logs -f backend
```

## 需要帮助？

查看完整文档：[DEPLOYMENT.md](./DEPLOYMENT.md)
