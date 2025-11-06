import prisma from './src/utils/database'

async function checkExecutableWorkflows() {
  const workflows = await prisma.workflow.findMany({
    select: {
      id: true,
      title: true,
      category: true,
      config: true,
      sourceType: true
    }
  })

  console.log('📊 工作流执行能力统计：')
  console.log('='.repeat(80))

  let executableCount = 0
  let nonExecutableCount = 0
  const executableWorkflows: any[] = []
  const nonExecutableWorkflows: any[] = []

  workflows.forEach(wf => {
    const hasConfig = !!wf.config
    const configObj = wf.config as any
    const hasNodes = hasConfig && configObj.nodes && Array.isArray(configObj.nodes) && configObj.nodes.length > 0
    const hasLLMNode = hasNodes && configObj.nodes.some((n: any) => n.type === 'llm')

    if (hasNodes && hasLLMNode) {
      executableCount++
      executableWorkflows.push({
        title: wf.title,
        category: wf.category,
        nodeCount: configObj.nodes.length,
        hasInput: configObj.nodes.some((n: any) => n.type === 'input'),
        hasOutput: configObj.nodes.some((n: any) => n.type === 'output'),
      })
    } else {
      nonExecutableCount++
      nonExecutableWorkflows.push({
        title: wf.title,
        category: wf.category,
        hasConfig,
        hasNodes,
        reason: !hasConfig ? '无config' : !hasNodes ? 'nodes为空' : '无LLM节点'
      })
    }
  })

  console.log(`\n✅ 可执行工作流 (${executableCount}个)：`)
  console.log('-'.repeat(80))
  executableWorkflows.forEach(wf => {
    console.log(`  📦 ${wf.title}`)
    console.log(`     分类: ${wf.category} | 节点数: ${wf.nodeCount} | 输入: ${wf.hasInput ? '✓' : '✗'} | 输出: ${wf.hasOutput ? '✓' : '✗'}`)
  })

  console.log(`\n❌ 不可执行工作流 (${nonExecutableCount}个)：`)
  console.log('-'.repeat(80))
  nonExecutableWorkflows.slice(0, 10).forEach(wf => {
    console.log(`  📦 ${wf.title}`)
    console.log(`     分类: ${wf.category} | 原因: ${wf.reason}`)
  })

  if (nonExecutableWorkflows.length > 10) {
    console.log(`  ... 还有 ${nonExecutableWorkflows.length - 10} 个不可执行工作流`)
  }

  console.log('\n' + '='.repeat(80))
  console.log(`📈 总计: ${workflows.length} 个工作流`)
  console.log(`   ✅ 可执行: ${executableCount} (${(executableCount/workflows.length*100).toFixed(1)}%)`)
  console.log(`   ❌ 不可执行: ${nonExecutableCount} (${(nonExecutableCount/workflows.length*100).toFixed(1)}%)`)

  await prisma.$disconnect()
}

checkExecutableWorkflows().catch(console.error)
