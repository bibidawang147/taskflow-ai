import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check workflow
  const workflow = await prisma.workflow.findUnique({
    where: { id: 'demo-workflow-001' },
    select: { 
      id: true, 
      title: true, 
      config: true
    }
  })
  
  console.log('Workflow:', workflow?.title)
  console.log('Has config:', !!workflow?.config)
  
  let nodeIds: string[] = []
  if (workflow?.config) {
    const config = typeof workflow.config === 'string' ? JSON.parse(workflow.config) : workflow.config as any
    console.log('Nodes count:', config.nodes?.length || 0)
    nodeIds = config.nodes?.map((n: any) => n.id) || []
    if (config.nodes?.length > 0) {
      console.log('Nodes:', config.nodes.map((n: any) => n.data?.label || n.label).join(', '))
    }
  }
  
  // Check preparations
  const preparations = await prisma.workflowPreparation.findMany({
    where: { workflowId: 'demo-workflow-001' }
  })
  console.log('Preparations count:', preparations.length)
  
  // Check step details for these nodes
  if (nodeIds.length > 0) {
    const stepDetails = await prisma.workflowStepDetail.findMany({
      where: { nodeId: { in: nodeIds } }
    })
    console.log('Step details count:', stepDetails.length)
    
    if (stepDetails.length > 0) {
      console.log('Step details:')
      for (const sd of stepDetails) {
        console.log(`  - Node ${sd.nodeId}: hasPrompt=${!!sd.promptTemplate}, hasTools=${!!sd.tools}`)
      }
    } else {
      console.log('No step details found for nodes:', nodeIds.join(', '))
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
