const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  // 获取最新创建的工作流
  const latestWorkflow = await prisma.workflow.findFirst({
    where: {
      authorId: 'cmi8au14m00009k2c14xlobed' // test@example.com 的用户ID
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      title: true,
      description: true,
      isDraft: true,
      isPublic: true,
      config: true,
      createdAt: true
    }
  });

  if (!latestWorkflow) {
    console.log('❌ 没有找到工作流');
    return;
  }

  console.log('📋 最新创建的工作流:');
  console.log('- ID:', latestWorkflow.id);
  console.log('- 标题:', latestWorkflow.title);
  console.log('- 描述:', latestWorkflow.description);
  console.log('- isDraft:', latestWorkflow.isDraft);
  console.log('- isPublic:', latestWorkflow.isPublic);
  console.log('- 创建时间:', latestWorkflow.createdAt);
  console.log('- 有 config:', !!latestWorkflow.config);

  if (latestWorkflow.config) {
    const config = latestWorkflow.config;
    console.log('- config.nodes 数量:', config.nodes?.length || 0);

    if (config.nodes && config.nodes.length > 0) {
      console.log('\n节点详情:');
      config.nodes.forEach((node, i) => {
        console.log(`\n节点 ${i + 1}:`);
        console.log('  - id:', node.id);
        console.log('  - type:', node.type);
        console.log('  - label:', node.label);
        console.log('  - 有 config:', !!node.config);

        if (node.config) {
          console.log('  - config.goal:', node.config.goal);
          console.log('  - config.prompt 长度:', node.config.prompt?.length || 0);
          console.log('  - config.prompt 前50字:', node.config.prompt?.substring(0, 50));
        }
      });
    }
  }

  await prisma.$disconnect();
})();
