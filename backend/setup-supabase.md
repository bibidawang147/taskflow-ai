# Supabase 免费数据库配置指南

## 1. 注册 Supabase（3 分钟）

访问：https://supabase.com

1. 使用 GitHub 账号登录
2. 创建新项目（New Project）
3. 选择离你最近的区域（如 Singapore）
4. 设置数据库密码（记住！）
5. 等待初始化（约 2 分钟）

## 2. 获取连接字符串（1 分钟）

1. 进入项目设置（Settings）
2. 点击 Database
3. 找到 Connection String（URI）
4. 复制连接字符串

示例：
```
postgresql://postgres.xxxxx:密码@aws-0-region.pooler.supabase.com:5432/postgres
```

## 3. 配置后端（1 分钟）

编辑 `.env` 文件：

```bash
# 替换为你的 Supabase 连接字符串
DATABASE_URL="postgresql://postgres.xxxxx:你的密码@aws-0-region.pooler.supabase.com:5432/postgres?pgbouncer=true"

# Prisma 需要直接连接（用于迁移）
DIRECT_URL="postgresql://postgres.xxxxx:你的密码@aws-0-region.pooler.supabase.com:5432/postgres"
```

更新 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## 4. 初始化数据库（1 分钟）

```bash
# 生成 Prisma Client
npm run db:generate

# 创建表（自动迁移）
npm run db:push

# 启动后端
npm run dev
```

## 5. 验证（30 秒）

```bash
# 测试健康检查
curl http://localhost:3000/health

# 查看 Supabase Dashboard
# 应该能看到所有的表已创建
```

## Supabase 免费套餐详情

✅ **包含内容：**
- 500MB PostgreSQL 数据库
- 无限 API 请求
- 2GB 文件存储
- 2GB 带宽/月
- 自动备份（7天）
- 实时功能
- 认证系统
- SSL 加密

⚠️ **限制：**
- 项目闲置 7 天会暂停（访问即恢复）
- 500MB 存储（够用，约 100万条记录）
- 无客服支持（社区支持）

## 监控使用量

1. 进入 Supabase Dashboard
2. 点击 Settings → Billing
3. 查看当前使用情况

## 升级选项（可选）

如果超出免费额度，可升级到 Pro：
- $25/月
- 8GB 存储
- 50GB 带宽
- 无闲置暂停
- 邮件支持

---

## 常见问题

### Q: 数据会丢失吗？
A: 不会，Supabase 有自动备份（7天），而且数据在云端很安全。

### Q: 性能如何？
A: 免费套餐性能足够，响应时间 < 100ms，支持数千用户。

### Q: 可以导出数据吗？
A: 可以，Supabase 提供 pg_dump 工具，随时导出。

### Q: 流量超了怎么办？
A: Supabase 会提醒你，但不会立即停止服务，可以升级或优化。

---

## 成本对比

| 方案 | 月成本 | 年成本 | 适用规模 |
|------|--------|--------|----------|
| SQLite | ¥0 | ¥0 | 开发/测试 |
| Docker + 廉价VPS | ¥30 | ¥360 | 小型应用 |
| Supabase 免费 | ¥0 | ¥0 | 初创/小型 |
| Supabase Pro | ¥175 | ¥2,100 | 中型应用 |
| 阿里云 RDS | ¥260 | ¥3,120 | 企业应用 |

---

**推荐路线：**

1. **开始阶段（0-1000 用户）**
   → Supabase 免费套餐（够用）

2. **成长阶段（1000-10000 用户）**
   → Docker 自建（性价比高）
   或 Supabase Pro（省心）

3. **规模化（10000+ 用户）**
   → 云 RDS + 读写分离（稳定）
