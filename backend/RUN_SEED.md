# 🚀 数据库填充执行指南

## 快速开始

### 1️⃣ 运行填充脚本

```bash
cd backend
npx ts-node prisma/seed-explore-data.ts
```

### 2️⃣ 查看填充的数据

使用 Prisma Studio 可视化查看:

```bash
cd backend
npx prisma studio
```

浏览器会自动打开 `http://localhost:5555`

---

## 📊 将要填充的数据

### 数据统计
- ✅ **13个用户**（创作者）
- ✅ **12个AI模型**（GPT-4, Claude, 豆包, 通义千问, GLM等）
- ✅ **7个工具**（ChatGPT-4, Midjourney, Stable Diffusion等）
- ✅ **10个工作流**（热门工作流排行榜）
- ✅ **8个工作项**（文章撰写, 视频脚本, 图片生成等）
- ✅ **评分和收藏**（自动生成）
- ✅ **用户余额**（Pro用户10万积分，Free用户1万积分）

### 重点数据

#### 🔥 热门工作流（前5名）
1. **公众号爆款文章生成器** - 25,600使用 | 8,900点赞
2. **智能客服机器人** - 22,100使用 | 7,800点赞
3. **视频脚本一键生成** - 19,800使用 | 7,200点赞
4. **AI去痕迹内容优化** - 18,500使用 | 6,700点赞
5. **数据可视化报表** - 16,200使用 | 6,100点赞

#### 🤖 AI模型
- GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- 豆包 Pro, 豆包 Lite
- 通义千问 Plus, 通义千问 Turbo
- GLM-4, GLM-3 Turbo

#### 👥 创作者
- AI工作流大师 👨‍💼
- 效率提升专家 ⚡
- 自媒体老司机 🎬
- 数据分析师张三 📊
- 电商运营达人 🛍️
- 增长黑客实验室 📈
- 等等...

---

## 🔑 测试账号

所有用户的登录凭证:
- **邮箱**: 见下表
- **密码**: `password123`

| 邮箱 | 用户名 | 等级 |
|------|--------|------|
| aimaster@workflow.com | AI工作流大师 | Pro |
| efficiency@workflow.com | 效率提升专家 | Pro |
| mediamaster@workflow.com | 自媒体老司机 | Pro |
| dataanalyst@workflow.com | 数据分析师张三 | Pro |
| ecommerce@workflow.com | 电商运营达人 | Pro |

---

## 📋 详细数据列表

完整的数据列表请查看: [SEED_DATA_LIST.md](./SEED_DATA_LIST.md)

---

## 🔄 重新填充数据

如果需要清空数据库重新填充:

```bash
cd backend

# 方法1: 重置数据库（会删除所有数据）
npx prisma migrate reset

# 然后重新填充
npx ts-node prisma/seed-explore-data.ts
```

或者

```bash
# 方法2: 手动清空表再填充
# 先在Prisma Studio或数据库客户端中删除相关表的数据
# 然后运行填充脚本
npx ts-node prisma/seed-explore-data.ts
```

---

## ✅ 验证数据

填充成功后，你应该能看到:

```
🌱 开始填充探索页面数据...
📝 创建用户...
  ✓ 创建用户: AI工作流大师
  ✓ 创建用户: 效率提升专家
  ...

🤖 创建 AI 模型定价配置...
  ✓ 创建模型: GPT-4
  ✓ 创建模型: Claude 3.5 Sonnet
  ...

🛠️  创建工具...
  ✓ 创建工具: ChatGPT-4
  ✓ 创建工具: Midjourney
  ...

⚙️  创建工作流...
  ✓ 创建工作流: 公众号爆款文章生成器
  ✓ 创建工作流: 智能客服机器人
  ...

⭐ 创建评分和收藏...
  ✓ 创建了评分和收藏数据

📋 创建工作项...
  ✓ 创建工作项: 文章撰写
  ✓ 创建工作项: 视频脚本
  ...

💰 创建用户余额...
  ✓ 创建用户余额: AI工作流大师
  ...

✅ 数据填充完成!

📊 统计:
  - 用户: 13
  - AI模型: 12
  - 工具: 7
  - 工作流: 10
  - 工作项: 8
```

---

## 🎯 下一步

填充完成后，你可以:

1. **启动前端查看探索页面**
   ```bash
   cd frontend
   npm run dev
   ```
   访问 `http://localhost:5173/explore`

2. **测试登录**
   使用任意测试账号登录（密码: password123）

3. **查看工作流排行榜**
   浏览热门工作流、创作者排行、AI工具排行

4. **测试工作流**
   尝试使用热门工作流模板

---

## ❓ 常见问题

### Q: 运行脚本时报错 "Cannot find module"
A: 确保已安装所有依赖:
```bash
cd backend
npm install
```

### Q: 数据库连接错误
A: 检查 `.env` 文件中的 `DATABASE_URL` 是否正确配置

### Q: 脚本运行成功但看不到数据
A: 使用 Prisma Studio 检查数据:
```bash
npx prisma studio
```

### Q: 想要修改填充的数据
A: 编辑 `prisma/seed-explore-data.ts` 文件，修改相应的数据数组

---

## 📞 支持

如遇到问题，请检查:
1. 数据库是否正常运行
2. 环境变量是否正确配置
3. 依赖包是否完整安装
4. Prisma schema 是否已同步

---

**最后更新**: 2025-01-04
