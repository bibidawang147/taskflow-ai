# 🔐 登录测试指南

## ✅ 正确的测试账号

```
📧 邮箱: test@example.com
🔑 密码: 123456
```

## 🌐 正确的URL

### ❌ 错误 - 不要访问这个
```
http://localhost:3000
```
这是后端API，不是前端界面！

### ✅ 正确 - 访问这个
```
http://localhost:5173
```
这才是前端界面！

## 📝 登录步骤

1. 打开浏览器
2. 访问：`http://localhost:5173`
3. 点击"登录"或访问：`http://localhost:5173/login`
4. 输入邮箱：`test@example.com`
5. 输入密码：`123456`
6. 点击"登录"按钮
7. 登录成功！

## 🧪 测试"文章转工作流"

登录成功后：

1. 点击导航栏 **🧠 文章转工作流**
2. ✅ **勾选"🧪 测试模式已启用"**（黄色框）
3. 输入测试URL：`https://example.com/blog-writing`
4. 点击"智能生成工作流"
5. 等待1-2秒
6. 自动跳转到工作流编辑器
7. 看到生成的工作流节点！✨

## 🚨 常见问题

### 问题：登录失败

**原因：** 可能访问了错误的URL（3000端口）

**解决：**
1. 关闭所有浏览器标签
2. 重新打开 `http://localhost:5173`
3. 确认地址栏显示 5173 不是 3000
4. 重新登录

### 问题：页面显示404

**原因：** 访问了后端API端口

**解决：** 确保访问 `http://localhost:5173` 而不是3000

## 🎯 快速测试命令

如果想用命令行测试登录：

```bash
curl -X POST 'http://localhost:3000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"123456"}'
```

应该返回登录成功的JSON！
