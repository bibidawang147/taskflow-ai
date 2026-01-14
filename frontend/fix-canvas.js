// 修复画布布局中缺失的 childrenIds
// 在浏览器控制台运行此代码

const fixCanvasLayout = async () => {
  try {
    console.log('🔧 开始修复画布布局...')

    // 1. 获取当前保存的布局
    const response = await fetch('http://localhost:5174/api/workspace/layout', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    const data = await response.json()

    if (!data.snapshot?.canvasItems) {
      console.log('⚠️ 没有找到画布数据')
      return
    }

    const canvasItems = data.snapshot.canvasItems
    console.log('📦 找到 canvasItems，总项目数:', Object.keys(canvasItems).length)

    // 2. 修复根容器的 childrenIds
    const rootContainer = canvasItems['canvas-root']
    if (!rootContainer) {
      console.error('❌ 找不到根容器')
      return
    }

    console.log('🔍 根容器当前 childrenIds:', rootContainer.childrenIds)

    // 找出所有应该在根容器中但不在 childrenIds 中的项目
    const allItems = Object.values(canvasItems)
    const rootChildren = allItems.filter(item =>
      item.id !== 'canvas-root' && item.parentId === 'canvas-root'
    )

    console.log('📋 找到 parentId 为 canvas-root 的项目:', rootChildren.length, '个')
    console.log('详情:', rootChildren.map(item => ({ id: item.id, type: item.type, workflowId: item.workflowId })))

    // 更新根容器的 childrenIds
    const fixedChildrenIds = rootChildren.map(item => item.id)
    rootContainer.childrenIds = fixedChildrenIds

    console.log('✅ 修复后的 childrenIds:', fixedChildrenIds)

    // 3. 保存修复后的布局
    const saveResponse = await fetch('http://localhost:5174/api/workspace/layout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        layout: data.layout || [],
        zoom: data.zoom || 1.0,
        snapshot: {
          ...data.snapshot,
          canvasItems
        }
      })
    })

    const saveResult = await saveResponse.json()
    console.log('💾 保存结果:', saveResult)

    console.log('✨ 修复完成！刷新页面查看效果...')

    // 询问是否刷新
    if (confirm('修复完成！是否刷新页面？')) {
      location.reload()
    }

  } catch (error) {
    console.error('❌ 修复失败:', error)
  }
}

// 运行修复
fixCanvasLayout()
