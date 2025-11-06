# 从 SQLite 迁移到 PostgreSQL

## 快速迁移步骤

### 1. 启动 PostgreSQL 和 Redis

```bash
# 创建 .env.docker 文件
cp .env.production.example .env.docker

# 编辑配置（设置强密码）
nano .env.docker

# 启动服务
docker-compose up -d postgres redis

# 等待服务健康
docker-compose ps
```

### 2. 运行数据库迁移

```bash
# 生成 Prisma Client（PostgreSQL）
npm run db:generate

# 创建数据库表
npm run db:push

# 或使用迁移（推荐生产环境）
npx prisma migrate deploy
```

### 3. 迁移现有数据（如果有）

#### 方案 A：使用 Prisma Studio 手动导出导入
```bash
# 1. 从 SQLite 导出数据
npm run db:studio

# 2. 手动复制数据到 PostgreSQL
```

#### 方案 B：使用脚本迁移（推荐）
```bash
node scripts/migrate-data.js
```

### 4. 验证迁移

```bash
# 连接到 PostgreSQL
docker-compose exec postgres psql -U workflow_user -d workflow_platform

# 检查表
\dt

# 检查数据
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM workflows;

# 退出
\q
```

### 5. 启动后端服务

```bash
# 使用 Docker
docker-compose up -d backend

# 或本地运行
npm run build
npm start

# 检查健康状态
curl http://localhost:3000/health
```

## 配置说明

### PostgreSQL 连接字符串格式

```
postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库]?schema=public
```

示例：
```
# 本地开发
DATABASE_URL=postgresql://workflow_user:password@localhost:5432/workflow_platform

# Docker 内部
DATABASE_URL=postgresql://workflow_user:password@postgres:5432/workflow_platform

# 云服务（阿里云 RDS）
DATABASE_URL=postgresql://workflow_user:password@rm-xxxxx.mysql.rds.aliyuncs.com:5432/workflow_platform
```

### 性能优化配置

在 PostgreSQL 中添加索引：

```sql
-- 工作流查询优化
CREATE INDEX idx_workflows_author_created ON workflows(author_id, created_at DESC);
CREATE INDEX idx_workflows_public ON workflows(is_public) WHERE is_public = true;

-- 执行历史优化
CREATE INDEX idx_executions_user_started ON workflow_executions(user_id, started_at DESC);
CREATE INDEX idx_executions_workflow ON workflow_executions(workflow_id, started_at DESC);

-- 日志查询优化
CREATE INDEX idx_usage_logs_user_created ON usage_logs(user_id, created_at DESC);
CREATE INDEX idx_usage_logs_created ON usage_logs(created_at DESC);

-- JSON 字段优化（GIN 索引）
CREATE INDEX idx_workflows_config_gin ON workflows USING GIN (config);
CREATE INDEX idx_workflows_tags_gin ON workflows USING GIN (to_tsvector('simple', tags));
```

## 常见问题

### Q: 如何回滚到 SQLite？

A: 修改 `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

然后运行：
```bash
npm run db:generate
npm run db:push
```

### Q: 性能对比如何？

A: PostgreSQL 在以下方面明显优于 SQLite：
- 并发写入：10-100倍提升
- 复杂查询：2-5倍提升
- JSON 查询：5-10倍提升
- 全文搜索：原生支持，性能优秀

### Q: 成本如何？

A:
- 自建（Docker）：免费
- 阿里云 RDS：¥0.36/小时（2核4GB）≈ ¥260/月
- 腾讯云：¥0.35/小时（2核4GB）≈ ¥252/月
- AWS RDS：$0.034/小时（db.t3.small）≈ $25/月

## 生产环境最佳实践

1. **使用连接池**
   ```typescript
   // Prisma 自动管理连接池
   // 可在 schema.prisma 配置
   ```

2. **定时备份**
   ```bash
   # 已在 docker-compose.yml 配置自动备份
   # 每天自动备份，保留7天
   ```

3. **监控**
   ```bash
   # 使用 pg_stat_statements 扩展
   docker-compose exec postgres psql -U workflow_user -d workflow_platform -c "CREATE EXTENSION pg_stat_statements;"
   ```

4. **只读副本**（可选）
   - 用于报表查询
   - 减轻主库压力

5. **分区表**（大数据量）
   ```sql
   -- 按月分区日志表
   CREATE TABLE usage_logs_2025_11 PARTITION OF usage_logs
   FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
   ```
