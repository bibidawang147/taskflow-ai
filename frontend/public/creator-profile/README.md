# 创作者个人主页

一个功能完整、设计精美的创作者个人主页，使用纯 HTML、CSS 和 JavaScript 构建。

## 项目概览

这是一个现代化的创作者主页项目，展示了创作者的个人信息、作品集、动态、成就等内容。项目采用响应式设计，支持桌面、平板和手机等多种设备。

## 功能特性

### 核心功能

- ✅ **个人资料展示**：头像、用户名、徽章、个性签名
- ✅ **统计数据面板**：作品数、使用量、点赞数、粉丝数等
- ✅ **快速操作**：关注、私信、分享按钮
- ✅ **标签页导航**：作品、动态、关于、收藏四个标签
- ✅ **作品展示**：网格/列表视图切换
- ✅ **数据可视化**：
  - 作品分类分布饼图
  - 发布趋势折线图
  - 技能雷达图
  - 粉丝增长趋势图
  - 使用量趋势柱状图
- ✅ **动态时间线**：展示创作者的最新活动
- ✅ **关于页面**：个人介绍、技能、经验、成就
- ✅ **收藏功能**：分类筛选收藏作品
- ✅ **侧边栏**：标签云、相似创作者推荐

### 交互功能

- ✅ 关注/取消关注
- ✅ 分享链接（支持复制）
- ✅ 粉丝/关注列表弹窗
- ✅ 用户搜索
- ✅ Toast 提示消息
- ✅ 平滑滚动
- ✅ 返回顶部按钮
- ✅ 键盘导航支持（Ctrl/Cmd + 左右箭头切换标签页）
- ✅ 统计数字滚动动画
- ✅ 图表绘制动画

### 响应式设计

- ✅ 桌面端（≥1200px）
- ✅ 平板端（768px - 1199px）
- ✅ 手机端（<768px）
- ✅ 超小屏幕适配（<400px）
- ✅ 横屏模式优化

## 项目结构

```
creator-profile/
├── index.html              # 主页面
├── data/
│   └── creator-data.json   # 示例数据
├── styles/
│   ├── main.css           # 主样式（变量、布局、基础）
│   ├── components.css     # 组件样式（按钮、卡片、模态框等）
│   └── responsive.css     # 响应式样式
├── scripts/
│   ├── main.js           # 主逻辑（数据加载、渲染）
│   ├── tabs.js           # 标签页切换
│   ├── charts.js         # 图表渲染
│   └── interactions.js   # 交互功能
├── assets/
│   ├── images/           # 图片资源
│   └── icons/            # 图标资源
└── README.md             # 项目文档
```

## 快速开始

### 1. 克隆或下载项目

```bash
# 下载项目到本地
cd creator-profile
```

### 2. 启动本地服务器

由于项目使用了 `fetch` API 加载 JSON 数据，需要通过 HTTP 服务器运行。

**方法一：使用 Python（推荐）**

```bash
# Python 3
python -m http.server 8000

# 或 Python 2
python -m SimpleHTTPServer 8000
```

**方法二：使用 Node.js**

```bash
# 首先安装 http-server
npm install -g http-server

# 启动服务器
http-server -p 8000
```

**方法三：使用 VS Code**

安装 "Live Server" 插件，右键点击 `index.html` 选择 "Open with Live Server"。

### 3. 访问页面

在浏览器中打开：`http://localhost:8000`

## 使用说明

### 修改创作者数据

编辑 `data/creator-data.json` 文件来自定义创作者信息：

```json
{
  "profile": {
    "username": "你的名字",
    "avatar": "头像URL",
    "bio": "个性签名",
    ...
  },
  "works": [...],
  "activities": [...],
  ...
}
```

### 自定义主题色

在 `styles/main.css` 中修改 CSS 变量：

```css
:root {
    --color-primary: #2563eb;      /* 主色 */
    --color-success: #10b981;      /* 成功色 */
    --color-warning: #f59e0b;      /* 警告色 */
    --color-error: #ef4444;        /* 错误色 */
    ...
}
```

### 添加新作品

在 `creator-data.json` 的 `works` 数组中添加新对象：

```json
{
  "id": "work_xxx",
  "title": "作品标题",
  "description": "作品描述",
  "coverImage": "封面图片URL",
  "rating": 4.8,
  "usesCount": 1000,
  "updatedAt": "2024-10-30",
  "tags": ["标签1", "标签2"],
  "featured": false
}
```

### 修改图表数据

在 `creator-data.json` 的 `charts` 对象中修改各项数据：

```json
{
  "charts": {
    "categoryDistribution": {
      "工作流": 18,
      "AI工具": 15,
      ...
    },
    "monthlyPublications": [...],
    "followersGrowth": [...],
    "usageTrend": [...]
  }
}
```

## 技术栈

- **HTML5**：语义化标签
- **CSS3**：
  - CSS Grid 和 Flexbox 布局
  - CSS 变量（主题配置）
  - 动画和过渡效果
  - 媒体查询（响应式）
- **JavaScript (ES6+)**：
  - Fetch API（数据加载）
  - DOM 操作
  - 事件处理
  - 模块化组织
- **Chart.js 4.4.0**：数据可视化

## 浏览器支持

- ✅ Chrome (最新版本)
- ✅ Firefox (最新版本)
- ✅ Safari (最新版本)
- ✅ Edge (最新版本)
- ⚠️ IE 11（部分功能不支持）

## 性能优化

- ✅ 图片懒加载
- ✅ 防抖和节流（搜索、滚动事件）
- ✅ CSS 动画使用 `transform` 和 `opacity`
- ✅ 图表响应式调整
- ✅ 代码分模块组织
- ✅ 使用 CDN 加载 Chart.js

## 可访问性

- ✅ 语义化 HTML 标签
- ✅ 合理的标题层级
- ✅ 键盘导航支持
- ✅ 高对比度模式支持
- ✅ 减少动画模式支持
- ✅ WCAG 2.1 AA 标准颜色对比度

## 键盘快捷键

- **ESC**：关闭模态框
- **Ctrl/Cmd + ←**：切换到上一个标签页
- **Ctrl/Cmd + →**：切换到下一个标签页

## 常见问题

### Q: 页面显示空白或数据加载失败？

**A**: 确保通过 HTTP 服务器访问页面，而不是直接打开 HTML 文件。使用上述任一方法启动本地服务器。

### Q: 图表不显示？

**A**:
1. 检查浏览器控制台是否有错误
2. 确保 Chart.js CDN 链接可访问
3. 检查 `creator-data.json` 中的 `charts` 数据格式是否正确

### Q: 如何更换头像和封面图？

**A**: 修改 `creator-data.json` 中的图片 URL，可以使用：
- 本地图片：放在 `assets/images/` 目录，使用相对路径
- 在线图片：使用图片的完整 URL
- 占位图服务：如 `https://picsum.photos/400/300`

### Q: 如何部署到生产环境？

**A**:
1. 将整个项目文件夹上传到 Web 服务器
2. 确保服务器支持静态文件服务
3. 访问 `index.html` 即可

推荐部署平台：
- GitHub Pages
- Netlify
- Vercel
- 阿里云 OSS
- 腾讯云 COS

## 扩展建议

### 功能扩展

- [ ] 添加暗黑模式
- [ ] 集成后端 API
- [ ] 实现真实的关注/收藏功能
- [ ] 添加评论系统
- [ ] 实现搜索功能
- [ ] 添加作品分类筛选
- [ ] 实现无限滚动加载
- [ ] 添加更多图表类型

### 性能优化

- [ ] 使用 Service Worker 实现离线缓存
- [ ] 图片使用 WebP 格式
- [ ] CSS 和 JS 文件压缩
- [ ] 实现虚拟滚动（大量数据时）

### 技术升级

- [ ] 使用 TypeScript
- [ ] 使用 Vue.js 或 React 重构
- [ ] 使用 Tailwind CSS
- [ ] 集成测试框架

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请通过以下方式联系：

- 📧 Email: your-email@example.com
- 💬 GitHub Issues: [项目地址]

## 更新日志

### v1.0.0 (2024-10-30)

- ✨ 初始版本发布
- ✅ 完整的创作者主页功能
- ✅ 响应式设计
- ✅ 数据可视化图表
- ✅ 交互功能
- 📝 完整文档

---

**感谢使用创作者主页项目！** 🎉
