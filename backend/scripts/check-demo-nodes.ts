import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check workflow nodes
  const nodes = await prisma.workflowNode.findMany({
    where: { workflowId: 'demo-workflow-001' },
    include: { stepDetail: true }
  })
  
  console.log('Workflow nodes count:', nodes.length)
  
  if (nodes.length > 0) {
    console.log('Nodes:')
    for (const node of nodes) {
      console.log(`  - ${node.id}: ${node.label}`)
      console.log(`    hasStepDetail: ${!!node.stepDetail}`)
      if (node.stepDetail) {
        console.log(`    hasPrompt: ${!!node.stepDetail.promptTemplate}`)
        console.log(`    hasTools: ${!!node.stepDetail.tools}`)
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
