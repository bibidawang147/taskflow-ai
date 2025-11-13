# 域名部署完整指南

## 📋 准备工作

在开始部署前，请确保您有：
- ✅ 已购买的域名（例如：yourdomain.com）
- ✅ 服务器访问权限（当前服务器：47.93.218.80）
- ✅ 域名管理后台访问权限（用于配置DNS）

## 🚀 部署步骤

### 第一步：配置域名DNS

登录您的域名服务商（如阿里云、腾讯云、Cloudflare等），添加以下DNS记录：

**主域名解析：**
```
类型: A
主机记录: @
记录值: 47.93.218.80
TTL: 600
```

**WWW子域名解析：**
```
类型: A
主机记录: www
记录值: 47.93.218.80
TTL: 600
```

**验证DNS生效：**
```bash
# 在本地终端执行
ping yourdomain.com
# 应该返回 47.93.218.80
```

⏰ **注意：DNS解析可能需要5-30分钟才能生效**

---

### 第二步：运行自动部署脚本

我已经为您准备了自动化部署脚本，它会：
- ✅ 配置Nginx支持您的域名
- ✅ 申请Let's Encrypt免费SSL证书
- ✅ 配置HTTPS自动跳转
- ✅ 设置SSL证书自动续期

**运行部署脚本：**

```bash
# 1. 上传脚本到服务器
scp -i ~/Desktop/工作流*.pem /tmp/deploy-domain.sh root@47.93.218.80:/tmp/

# 2. SSH连接到服务器
ssh -i ~/Desktop/工作流*.pem root@47.93.218.80

# 3. 运行部署脚本（替换yourdomain.com为您的实际域名）
chmod +x /tmp/deploy-domain.sh
/tmp/deploy-domain.sh yourdomain.com
```

---

### 第三步：更新后端CORS配置

编辑后端环境变量文件：

```bash
# 在服务器上执行
cd /root/workflow-backend
vi .env
```

添加或更新以下配置：
```env
# 允许的CORS源
CORS_ORIGIN=https://yourdomain.com

# 如果需要支持多个域名
# CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

重启后端服务：
```bash
pm2 restart workflow-backend
```

---

### 第四步：验证部署

1. **访问您的网站：**
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```

2. **检查SSL证书：**
   - 点击浏览器地址栏的锁图标
   - 查看证书详情
   - 确认证书由 Let's Encrypt 颁发

3. **测试API功能：**
   - 尝试登录
   - 测试工作流执行
   - 确认所有功能正常

---

## 🔧 手动配置（如果自动脚本失败）

### 方案A：使用Certbot自动配置

```bash
# 1. 安装Certbot
yum install -y certbot python3-certbot-nginx

# 2. 申请SSL证书（Certbot会自动修改Nginx配置）
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 3. 测试自动续期
certbot renew --dry-run
```

### 方案B：手动配置Nginx

创建配置文件 `/etc/nginx/conf.d/yourdomain.conf`：

```nginx
# HTTP - 重定向到HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL证书
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/workflow-platform;
    index index.html;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

测试并重启Nginx：
```bash
nginx -t
systemctl reload nginx
```

---

## 📊 部署后检查清单

- [ ] DNS解析正确（ping域名返回正确IP）
- [ ] HTTP访问自动跳转到HTTPS
- [ ] SSL证书有效（浏览器显示绿色锁）
- [ ] 网站首页正常加载
- [ ] 登录功能正常
- [ ] API调用正常
- [ ] 图片和静态资源加载正常
- [ ] 移动端访问正常

---

## 🔒 SSL证书管理

### 查看证书信息
```bash
certbot certificates
```

### 手动续期证书
```bash
certbot renew
systemctl reload nginx
```

### 自动续期配置
脚本已自动配置，每天凌晨3点检查并续期：
```bash
# 查看定时任务
crontab -l | grep certbot
```

---

## ⚠️  常见问题

### 1. DNS未生效
**症状：** ping域名无法解析或解析到错误的IP
**解决：** 等待5-30分钟，或联系域名服务商确认配置

### 2. SSL证书申请失败
**症状：** certbot报错 "Failed to verify"
**解决：**
- 确认DNS已生效
- 确认80端口开放
- 检查防火墙规则

### 3. 网站可以访问但API报错
**症状：** CORS错误
**解决：**
- 检查后端.env中的CORS_ORIGIN配置
- 重启后端服务: `pm2 restart workflow-backend`

### 4. HTTP无法重定向到HTTPS
**症状：** 访问http://域名 没有跳转
**解决：**
- 检查Nginx配置
- 运行 `nginx -t` 测试配置
- 查看Nginx错误日志: `tail -f /var/log/nginx/error.log`

---

## 📞 需要帮助？

如果遇到问题，请提供以下信息：

```bash
# 收集诊断信息
echo "=== Nginx配置测试 ==="
nginx -t

echo "=== Nginx运行状态 ==="
systemctl status nginx

echo "=== SSL证书状态 ==="
certbot certificates

echo "=== 后端运行状态 ==="
pm2 list

echo "=== DNS解析测试 ==="
nslookup yourdomain.com
```

---

## 🎉 部署成功后

恭喜！您的工作流平台现在已经可以通过域名访问了！

**下一步建议：**
1. 📝 配置网站备案（如果在中国大陆）
2. 📊 添加网站统计（如Google Analytics）
3. 🔍 提交网站到搜索引擎
4. 💾 设置定期备份
5. 📧 配置邮件通知
6. 🚀 优化CDN加速（可选）

---

**最后更新**: 2025-01-13
**服务器IP**: 47.93.218.80
**部署脚本**: /tmp/deploy-domain.sh
