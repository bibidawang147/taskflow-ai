# StoragePage 拖拽避让功能说明

## 功能概述

在 StoragePage (`http://localhost:3000/storage`) 页面实现了智能的拖拽避让系统，支持容器和卡片的实时避让。

## 访问路径

**http://localhost:3000/storage**

## 核心特性

### 1. 元素类型

StoragePage 包含三种元素类型：

- **容器（Container）**：可以包含其他元素的容器，有边框和标题
- **工作流卡片（Workflow）**：工作流卡片，尺寸固定为 220x120
- **AI工具卡片（AI Tool）**：AI工具卡片，尺寸固定为 220x120

### 2. 智能避让规则

#### 拖拽容器时
- **所有同级元素**（包括其他容器和卡片）都会自动避让
- 避让范围：同一父容器内的所有元素

#### 拖拽卡片时（工作流或AI工具）
- **只有同级的卡片**会避让
- **容器不会移动**
- 避让范围：仅限同级的工作流卡片和AI工具卡片

### 3. 避让算法特点

- **实时避让**：在拖拽过程中（mousemove）实时计算和应用避让
- **最优方向**：选择重叠最小的方向进行避让
- **连锁避让**：支持最多2轮迭代，处理连锁反应
- **平滑过渡**：被避让的元素应该有平滑的移动动画（需要CSS支持）
- **智能判断**：根据元素类型自动决定避让策略

## 使用方法

### 1. 启用/禁用避让功能

页面顶部有一个"智能避让"按钮：
- 🧲 **紫色背景** = 避让功能已启用
- ⭕ **灰色背景** = 避让功能已禁用

### 2. 拖拽测试

1. **测试容器避让**：
   - 点击"新建容器"创建容器
   - 拖拽容器，观察所有同级元素的避让效果

2. **测试卡片避让**：
   - 从左侧库拖拽工作流到画布
   - 拖拽工作流卡片，观察只有卡片避让，容器不动

3. **禁用避让测试**：
   - 点击"智能避让"按钮禁用
   - 拖拽元素时不再有避让效果

## 技术实现

### 核心文件

1. **storageAvoidanceUtils.ts**
   - 碰撞检测函数 `doRectsOverlap`
   - 重叠计算 `calculateOverlap`
   - 避让方向计算 `calculateAvoidanceDirection`
   - 实时避让 `calculateRealTimeAvoidance`
   - 智能避让 `calculateSmartAvoidance`

2. **StoragePage.tsx**
   - 集成避让逻辑到 `handleWindowMouseMove`
   - 避让功能开关状态 `isAvoidanceEnabled`
   - UI控制按钮

### 关键代码

#### 避让逻辑（在 handleWindowMouseMove 中）

```typescript
// 如果启用避让功能，计算并应用避让位置
if (isAvoidanceEnabled) {
  const avoidancePositions = calculateSmartAvoidance(draft, itemId)

  // 应用避让位置
  for (const [avoidItemId, newPos] of Object.entries(avoidancePositions)) {
    const avoidItem = draft[avoidItemId]
    if (avoidItem) {
      draft[avoidItemId] = {
        ...avoidItem,
        position: newPos
      }
    }
  }
}
```

#### 避让判断规则

```typescript
export function shouldAvoid(
  draggingItem: CanvasItem,
  item: CanvasItem
): boolean {
  // 不和自己比较
  if (draggingItem.id === item.id) {
    return false
  }

  // 必须在同一个父容器中
  if (draggingItem.parentId !== item.parentId) {
    return false
  }

  // 拖拽容器时：所有同级元素都避让
  if (draggingItem.type === 'container') {
    return true
  }

  // 拖拽卡片时：只有卡片避让，容器不动
  if (draggingItem.type === 'workflow' || draggingItem.type === 'ai-tool') {
    return item.type === 'workflow' || item.type === 'ai-tool'
  }

  return false
}
```

### 数据结构

```typescript
type CanvasItem = WorkflowCanvasItem | AIToolCanvasItem | ContainerCanvasItem

interface ContainerCanvasItem {
  id: string
  type: 'container'
  name: string
  parentId: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  collapsed: boolean
  childrenIds: string[]
  color: string
}

interface WorkflowCanvasItem {
  id: string
  type: 'workflow'
  workflowId: string
  parentId: string
  position: { x: number; y: number }
}
```

## 配置参数

### 避让间隙
```typescript
const gap = 20  // 元素之间的间隙（像素）
```

### 迭代次数
```typescript
const maxIterations = 2  // 最多2轮连锁避让
```

## 与 WorkspacePage 的区别

虽然之前在 WorkspacePage.tsx 中也实现了避让功能，但那个页面目前没有对应的路由。**正确的实现是在 StoragePage.tsx 中**。

两个实现的区别：
- **StoragePage**：真实的工作流画布页面，有容器系统
- **WorkspacePage**：未使用的组件，数据结构更简单

## 测试建议

1. **基础测试**：
   - 访问 `http://localhost:3000/storage`
   - 创建几个容器
   - 从左侧拖拽工作流到画布

2. **容器避让测试**：
   - 拖拽容器，观察所有元素的避让
   - 测试嵌套容器的情况

3. **卡片避让测试**：
   - 拖拽工作流卡片
   - 确认只有卡片避让，容器不动

4. **功能开关测试**：
   - 启用和禁用避让功能
   - 观察行为差异

5. **边界测试**：
   - 拖拽到画布边缘
   - 多个元素密集排列时的避让
   - 连锁避让效果

## 已知限制

1. **平滑动画**：需要在元素样式中添加 CSS transition 才能有平滑效果
2. **性能**：大量元素时可能有性能影响
3. **边界处理**：元素可能被推到画布外（需要添加边界限制）

## 未来优化方向

1. **添加CSS过渡动画**：为被避让的元素添加平滑移动效果
2. **边界约束**：确保避让后的元素不会超出父容器
3. **性能优化**：使用空间索引优化碰撞检测
4. **视觉反馈**：高亮显示正在被避让的元素
5. **可配置参数**：允许用户调整避让间隙和敏感度

## 问题排查

如果避让功能不工作，检查：
1. 是否点击了"智能避让"按钮启用功能
2. 浏览器控制台是否有错误
3. 元素是否在同一个父容器中
4. 元素类型是否正确设置
