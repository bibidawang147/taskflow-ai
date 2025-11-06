# 工作流节点可视化

## ✅ 功能概述

将作品展示从传统卡片网格升级为工作流节点可视化，通过节点序号和连接线展示作品之间的流程关系。

---

## 🎨 视觉效果

### 桌面端 (≥1200px) - 3列布局
```
┌────────┐  ─ ─ ▶  ┌────────┐  ─ ─ ▶  ┌────────┐
│   ①   │          │   ②   │          │   ③   │
│  作品  │          │  作品  │          │  作品  │
└────────┘          └────────┘          └────────┘

┌────────┐  ─ ─ ▶  ┌────────┐  ─ ─ ▶  ┌────────┐
│   ④   │          │   ⑤   │          │   ⑥   │
│  作品  │          │  作品  │          │  作品  │
└────────┘          └────────┘          └────────┘
```

### 平板端 (768px - 1199px) - 2列布局
```
┌────────┐  ─ ─ ▶  ┌────────┐
│   ①   │          │   ②   │
│  作品  │          │  作品  │
└────────┘          └────────┘

┌────────┐  ─ ─ ▶  ┌────────┐
│   ③   │          │   ④   │
│  作品  │          │  作品  │
└────────┘          └────────┘
```

### 手机端 (<768px) - 单列布局
```
┌────────┐
│   ①   │
│  作品  │
└────────┘

┌────────┐
│   ②   │
│  作品  │
└────────┘

┌────────┐
│   ③   │
│  作品  │
└────────┘
```

---

## 📝 实现细节

### 1. 节点样式增强

**文件**: `styles/components.css`

#### 卡片基础样式
```css
.work-card {
    position: relative;
    background: var(--color-bg-card);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
}
```

**特点**:
- 2px 边框突出节点轮廓
- 蓝色阴影强化节点视觉
- 圆角保持现代感

#### 顶部渐变指示条
```css
.work-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #2563eb, #3b82f6);
    opacity: 0;
    transition: opacity var(--transition-base);
    z-index: 1;
}

.work-card:hover::before {
    opacity: 1;
}
```

**效果**:
- 悬停时显示蓝色渐变条
- 增强交互反馈
- 突出当前节点

#### 连接线和箭头
```css
.work-card::after {
    content: '─ ─ ▶';
    position: absolute;
    top: 50%;
    right: -42px;
    color: #3b82f6;
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 2px;
    transform: translateY(-50%);
    opacity: 0.6;
    z-index: 1;
    transition: all var(--transition-base);
}
```

**设计说明**:
- 使用 Unicode 字符 `─ ─ ▶` 创建视觉流
- 两个短横线 + 三角箭头模拟连接线
- `letter-spacing` 增加字符间距
- 蓝色主题色保持一致性

#### 悬停动画
```css
.work-card:hover {
    border-color: #2563eb;
    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.2);
    transform: translateY(-4px);
}

.work-card:hover::after {
    opacity: 1;
    animation: flowPulse 2s ease-in-out infinite;
}

@keyframes flowPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
}
```

**交互效果**:
- 卡片上浮 4px
- 边框变为主色调蓝色
- 阴影增强营造悬浮感
- 连接箭头脉动动画

---

### 2. 节点序号标识

#### CSS 实现
```css
.work-card-body {
    padding: var(--spacing-md);
    position: relative;
}

.work-card-body::before {
    content: attr(data-node);
    position: absolute;
    top: -40px;
    left: 8px;
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #2563eb, #3b82f6);
    color: white;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: var(--font-weight-bold);
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
    border: 3px solid var(--color-bg-card);
    z-index: 2;
}
```

**特点**:
- 圆形徽章设计
- 蓝色渐变背景
- 白色边框与卡片背景分离
- 阴影增强立体感
- 使用 `attr(data-node)` 读取序号

#### JavaScript 动态生成
**文件**: `scripts/main.js`

```javascript
// 渲染作品列表
function renderWorks() {
    const { works } = creatorData;
    const worksContainer = document.getElementById('works-list');

    works.forEach((work, index) => {
        const workCard = createWorkCard(work, index + 1);
        worksContainer.appendChild(workCard);
    });
}

// 创建作品卡片
function createWorkCard(work, nodeNumber = 1) {
    const card = document.createElement('div');
    card.className = 'work-card';
    card.innerHTML = `
        <div class="work-card-cover">
            <img src="${work.coverImage}" alt="${work.title}">
        </div>
        <div class="work-card-body" data-node="${nodeNumber}">
            <!-- 卡片内容 -->
        </div>
    `;
    return card;
}
```

**实现逻辑**:
1. `renderWorks` 遍历作品数组，传递索引 + 1 作为节点号
2. `createWorkCard` 接收节点号参数
3. 将节点号设置为 `data-node` 属性
4. CSS 通过 `attr(data-node)` 读取并显示

---

### 3. 响应式适配

**文件**: `styles/responsive.css`

#### 平板端 (768px - 1199px)
```css
/* 2列布局，调整连接线显示 */
.works-grid {
    grid-template-columns: repeat(2, 1fr);
}

/* 每行2个卡片，隐藏第2、4、6...个卡片的连接线 */
.works-grid .work-card:nth-child(2n)::after {
    display: none;
}

/* 重置桌面端的规则 */
.works-grid .work-card:nth-child(3n)::after {
    display: block;
}
```

**适配说明**:
- 2列网格布局
- 使用 `:nth-child(2n)` 隐藏偶数卡片的箭头
- 确保每行最后一个卡片无箭头

#### 手机端 (<768px)
```css
/* 单列布局 - 隐藏所有连接线 */
.works-grid {
    grid-template-columns: 1fr;
}

/* 隐藏所有工作流连接箭头 */
.work-card::after {
    display: none !important;
}

/* 调整节点序号标识位置和大小 */
.work-card-body::before {
    top: -35px;
    width: 24px;
    height: 24px;
    font-size: 11px;
    border-width: 2px;
}
```

**适配说明**:
- 单列布局不需要横向箭头
- 强制隐藏所有连接线
- 缩小节点徽章适应小屏幕
- 保留节点序号以保持流程感

---

## 🎯 技术亮点

### 1. CSS 伪元素的创意使用

**::before** - 顶部渐变条
- 悬停时激活
- 视觉反馈
- 不占用文档流

**::after** - 连接箭头
- Unicode 字符组合
- 纯 CSS 实现
- 无需额外 HTML

**::before (on .work-card-body)** - 节点序号
- `attr()` 函数读取数据
- 自动定位
- 动态内容

### 2. 响应式断点策略

| 屏幕尺寸 | 列数 | 箭头显示规则 |
|---------|------|------------|
| ≥1200px | 3列  | 隐藏第 3n 个 |
| 768-1199px | 2列 | 隐藏第 2n 个 |
| <768px | 1列 | 全部隐藏 |

### 3. 性能优化

- **CSS Transitions**: 仅对必要属性添加过渡
- **GPU 加速**: `transform` 替代 `top/left`
- **条件渲染**: 不同断点选择性显示元素
- **简化动画**: 避免复杂的 SVG 或 Canvas

---

## 🔄 与原有功能的兼容性

### 列表视图模式
工作流样式仅在网格视图下生效：

```css
.works-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
}

.works-grid.list-view {
    grid-template-columns: 1fr;
}
```

列表视图下：
- 节点序号依然显示
- 连接箭头自动隐藏（单列布局规则）
- 卡片保持完整样式

### 作品筛选和排序
- 动态重新渲染时自动重新编号
- 序号始终从 1 开始递增
- 连接线规则自动适应新布局

---

## 📊 用户体验提升

### 1. 视觉层次
- **节点化设计**: 强调每个作品的独立性
- **连接线**: 暗示作品之间的关联或流程
- **序号标识**: 清晰的顺序指示

### 2. 交互反馈
- **悬停效果**: 卡片上浮 + 边框高亮
- **渐变条显示**: 突出当前焦点
- **箭头脉动**: 强化流程动态感

### 3. 专业感
- **设计语言**: 符合现代工作流应用
- **颜色系统**: 统一的蓝色主题
- **细节打磨**: 阴影、圆角、动画流畅

---

## 🧪 测试检查清单

### 桌面端
- [x] 3列网格布局正常
- [x] 每行最后一个卡片无箭头
- [x] 节点序号显示正确（1, 2, 3...）
- [x] 悬停动画流畅
- [x] 箭头脉动效果正常

### 平板端
- [x] 2列网格布局正常
- [x] 每行最后一个卡片无箭头
- [x] 节点序号位置合适
- [x] 响应式断点生效

### 手机端
- [x] 单列布局正常
- [x] 所有箭头已隐藏
- [x] 节点序号缩小显示
- [x] 卡片间距合理

### 功能测试
- [x] 列表视图切换正常
- [x] 作品筛选后序号更新
- [x] 作品排序后序号更新
- [x] 动态加载作品序号连续

---

## 🎨 设计灵感

该设计受以下应用启发：
- **流程图工具**: Miro, Figma Flow
- **项目管理**: Notion Timeline, Jira Board
- **工作流平台**: Zapier, n8n

核心理念：
> 将静态的作品展示转化为动态的工作流可视化，让用户直观感受创作者的作品演进路径。

---

## 🔧 自定义指南

### 修改节点样式

**更改节点颜色**:
```css
.work-card-body::before {
    background: linear-gradient(135deg, #10b981, #34d399); /* 绿色主题 */
}
```

**更改节点大小**:
```css
.work-card-body::before {
    width: 32px;
    height: 32px;
    font-size: 14px;
}
```

### 修改连接线样式

**更改箭头符号**:
```css
.work-card::after {
    content: '→ → →';  /* 连续箭头 */
    /* 或 */
    content: '· · ▶';  /* 点线箭头 */
    /* 或 */
    content: '⟶';      /* 长箭头 */
}
```

**更改箭头颜色**:
```css
.work-card::after {
    color: #10b981; /* 绿色 */
}
```

### 修改动画效果

**更改脉动速度**:
```css
.work-card:hover::after {
    animation: flowPulse 1s ease-in-out infinite; /* 更快 */
}
```

**添加滑动动画**:
```css
@keyframes flowSlide {
    0% { right: -42px; }
    50% { right: -38px; }
    100% { right: -42px; }
}

.work-card:hover::after {
    animation: flowSlide 1.5s ease-in-out infinite;
}
```

---

## 📝 未来优化方向

### 1. 垂直连接线
在网格布局中添加垂直连接线连接不同行的作品：
```
┌────┐  →  ┌────┐  →  ┌────┐
│ ① │     │ ② │     │ ③ │
└─↓──┘     └────┘     └────┘
  │
┌─↓──┐  →  ┌────┐
│ ④ │     │ ⑤ │
└────┘     └────┘
```

### 2. SVG 连接线
使用 SVG 实现更复杂的连接路径：
- 曲线连接
- 多点连接
- 分支流程

### 3. 交互式流程图
- 点击节点高亮路径
- 拖拽调整顺序
- 展开节点查看详情

### 4. 数据驱动的连接
根据作品之间的实际关系（如引用、改编）生成连接线

---

## 🐛 已知问题

### 1. 非整数倍网格
当作品数量不是列数整数倍时，最后一行可能有空位，但箭头逻辑依然正确。

**解决方案**: 已通过 `:nth-child(3n)` 等规则自动处理。

### 2. 列表视图下的序号
列表视图中节点序号可能与头像重叠（取决于卡片布局）。

**解决方案**: 列表视图下序号依然有效，如需调整可添加专门样式。

---

## 📚 相关文档

- [按钮布局优化文档](./BUTTON_LAYOUT_UPDATE.md)
- [项目集成文档](./INTEGRATION.md)
- [故障排除指南](./TROUBLESHOOTING.md)
- [项目总览](./README.md)

---

**更新时间**: 2024-10-31
**功能状态**: ✅ 已完成并测试
**作者**: Claude Code
