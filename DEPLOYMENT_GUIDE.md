# Workflow Platform 部署完成指南

## ✅ 已完成

### 1. GitHub 推送
- ✅ 代码已成功推送到 GitHub: `https://github.com/bibidawang147/-.git`
- ✅ 提交记录：修复 AI Chat 工作流执行显示空白和发布状态问题

### 2. 服务器部署
- ✅ 代码已上传到阿里云服务器：`47.93.218.80`
- ✅ 前端已构建并运行：http://47.93.218.80:5173
- ⚠️ 后端需要配置 API Keys 后才能完全启动

## 🔧 需要完成的配置

### 配置后端 API Keys

连接到服务器：
```bash
ssh -i ~/Desktop/工作流网站.pem root@47.93.218.80
```

编辑 `.env` 文件：
```bash
cd /root/backend
vi .env
```

需要配置的 API Keys：

1. **OpenAI API Key** (必需)
   ```
   OPENAI_API_KEY="sk-your-real-openai-key-here"
   ```
   获取地址：https://platform.openai.com/api-keys

2. **Anthropic API Key** (必需)
   ```
   ANTHROPIC_API_KEY="sk-ant-your-real-anthropic-key-here"
   ```
   获取地址：https://console.anthropic.com/

3. **阿里云 API** (可选)
   ```
   ALIBABA_ACCESS_KEY_ID="your-access-key-id"
   ALIBABA_ACCESS_KEY_SECRET="your-access-key-secret"
   ```

配置完成后重启服务：
```bash
pm2 restart workflow-backend
pm2 logs workflow-backend
```

## 📍 访问地址

- **前端**: http://47.93.218.80:5173
- **后端 API**: http://47.93.218.80:3000
- **健康检查**: http://47.93.218.80:3000/health

## 🔍 服务管理命令

查看服务状态：
```bash
ssh -i ~/Desktop/工作流网站.pem root@47.93.218.80 "pm2 status"
```

查看后端日志：
```bash
ssh -i ~/Desktop/工作流网站.pem root@47.93.218.80 "pm2 logs workflow-backend"
```

查看前端日志：
```bash
ssh -i ~/Desktop/工作流网站.pem root@47.93.218.80 "pm2 logs workflow-frontend"
```

重启服务：
```bash
ssh -i ~/Desktop/工作流网站.pem root@47.93.218.80 "pm2 restart all"
```

停止服务：
```bash
ssh -i ~/Desktop/工作流网站.pem root@47.93.218.80 "pm2 stop all"
```

## 🔄 后续更新部署

当你修改代码后，使用以下脚本快速部署：

```bash
cd /Users/star/Desktop/开发文件夹/workflow-platform

# 1. 提交并推送到 GitHub
git add .
git commit -m "你的提交信息"
git push origin main

# 2. 运行部署脚本（需要先在服务器上配置 git）
./deploy-to-server.sh
```

或手动部署：
```bash
# 打包
tar czf workflow-platform-deploy.tar.gz --exclude='node_modules' --exclude='.git' backend frontend

# 上传
scp -i ~/Desktop/工作流网站.pem workflow-platform-deploy.tar.gz root@47.93.218.80:/root/

# 在服务器上解压并重启
ssh -i ~/Desktop/工作流网站.pem root@47.93.218.80 << 'EOF'
cd /root
tar xzf workflow-platform-deploy.tar.gz
rm workflow-platform-deploy.tar.gz
pm2 restart all
EOF
```

## 📊 数据库管理

当前使用 SQLite 数据库，位于：`/root/backend/dev.db`

运行数据库迁移：
```bash
ssh -i ~/Desktop/工作流网站.pem root@47.93.218.80 "cd /root/backend && npx prisma migrate deploy"
```

查看数据库：
```bash
ssh -i ~/Desktop/工作流网站.pem root@47.93.218.80 "cd /root/backend && npx prisma studio"
```

## ⚠️ 注意事项

1. **安全性**
   - 记得更改 `JWT_SECRET` 为强密码
   - 不要将 API Keys 提交到 GitHub
   - 考虑配置 HTTPS (使用 Nginx + Let's Encrypt)

2. **性能优化**
   - 前端已经构建并优化
   - 考虑使用 Nginx 作为反向代理
   - 可以配置 CDN 加速静态资源

3. **监控**
   - 使用 `pm2 monit` 监控进程
   - 配置日志轮转避免磁盘占满
   - 考虑接入阿里云监控

## 🎉 恭喜！

你的 Workflow Platform 已经成功部署到服务器！

配置好 API Keys 后，就可以完整使用所有功能了：
- ✅ AI Chat 对话生成工作流
- ✅ 工作流创建和管理
- ✅ 工作流执行
- ✅ 社区分享功能

祝你的产品大获成功！🚀
