// 在浏览器控制台运行此代码来调试克隆工作流的问题
// 复制下面的代码到控制台

console.log('=== 克隆工作流调试信息 ===')
console.log('1. localStorage 中的克隆标记:', localStorage.getItem('newlyClonedWorkflowId'))
console.log('2. 当前页面路径:', window.location.pathname)

// 如果你想手动设置一个测试 ID
// localStorage.setItem('newlyClonedWorkflowId', '替换为实际的工作流ID')

// 清除克隆标记
// localStorage.removeItem('newlyClonedWorkflowId')
