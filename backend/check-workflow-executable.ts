import prisma from './src/utils/database'

async function checkWorkflows() {
  const workflows = await prisma.workflow.findMany({
    select: {
      id: true,
      title: true,
      category: true,
      config: true,
      sourceType: true
    },
    take: 10
  })

  console.log('📊 检查工作流执行能力：')
  console.log('='.repeat(60))

  workflows.forEach(wf => {
    const hasConfig = !!wf.config
    const configKeys = hasConfig ? Object.keys(wf.config as any) : []
    const hasNodes = hasConfig && (wf.config as any).nodes && (wf.config as any).nodes.length > 0

    console.log(`
📦 ${wf.title}
   - ID: ${wf.id}
   - 分类: ${wf.category}
   - 来源: ${wf.sourceType || '未知'}
   - 有config: ${hasConfig ? '✅' : '❌'}
   - config字段: ${configKeys.join(', ') || '无'}
   - 有nodes: ${hasNodes ? '✅' : '❌'}
   - nodes数量: ${hasNodes ? (wf.config as any).nodes.length : 0}
   - 可执行: ${hasNodes ? '✅ 是' : '❌ 否'}
    `)
  })

  // 统计
  const total = await prisma.workflow.count()
  const allWorkflows = await prisma.workflow.findMany({
    select: { config: true }
  })
  const withConfig = allWorkflows.filter(wf => wf.config !== null).length

  console.log('='.repeat(60))
  console.log(`📈 总计: ${total} 个工作流，${withConfig} 个有config配置`)

  await prisma.$disconnect()
}

checkWorkflows().catch(console.error)
