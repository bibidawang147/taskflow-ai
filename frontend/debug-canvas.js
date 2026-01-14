// 在浏览器控制台运行此代码来调试画布状态
// 复制下面的代码到控制台

console.log('=== 画布调试信息 ===')

// 检查 localStorage 中保存的数据
const checkSavedLayout = async () => {
  try {
    const response = await fetch('http://localhost:5174/api/workspace/layout', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    const data = await response.json()
    console.log('1. 保存的画布布局:', data)
    console.log('2. canvasItems:', data.snapshot?.canvasItems)
    console.log('3. 根容器:', data.snapshot?.canvasItems?.['canvas-root'])
    console.log('4. 根容器的 childrenIds:', data.snapshot?.canvasItems?.['canvas-root']?.childrenIds)

    // 列出所有工作流卡片
    if (data.snapshot?.canvasItems) {
      const workflowCards = Object.values(data.snapshot.canvasItems).filter(item => item.type === 'workflow')
      console.log('5. 工作流卡片总数:', workflowCards.length)
      console.log('6. 工作流卡片详情:', workflowCards)
    }
  } catch (error) {
    console.error('获取保存的布局失败:', error)
  }
}

checkSavedLayout()

// 手动清除保存的布局（如果需要重置）
window.clearCanvasLayout = async () => {
  try {
    await fetch('http://localhost:5174/api/workspace/layout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        layout: [],
        zoom: 1.0,
        snapshot: {
          canvasItems: {
            'canvas-root': {
              id: 'canvas-root',
              type: 'container',
              name: '工作流画布',
              parentId: '',
              position: { x: 0, y: 0 },
              size: { width: 3200, height: 1800 },
              collapsed: false,
              childrenIds: [],
              color: 'rgba(139, 92, 246, 0.15)'
            }
          }
        }
      })
    })
    console.log('✅ 画布布局已重置')
    location.reload()
  } catch (error) {
    console.error('重置画布布局失败:', error)
  }
}

console.log('提示：运行 clearCanvasLayout() 可以重置画布布局')
