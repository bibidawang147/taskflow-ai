import prisma from './src/utils/database'

async function checkOneWorkflow() {
  const workflow = await prisma.workflow.findFirst({
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      config: true,
      sourceType: true,
      tags: true
    }
  })

  if (!workflow) {
    console.log('没有找到工作流')
    return
  }

  console.log('📦 工作流详情：')
  console.log('='.repeat(60))
  console.log('标题:', workflow.title)
  console.log('描述:', workflow.description)
  console.log('分类:', workflow.category)
  console.log('标签:', workflow.tags)
  console.log('来源:', workflow.sourceType)
  console.log('\n📋 Config结构:')
  console.log(JSON.stringify(workflow.config, null, 2))

  await prisma.$disconnect()
}

checkOneWorkflow().catch(console.error)
