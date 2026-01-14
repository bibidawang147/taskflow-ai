const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const workflows = await prisma.workflow.findMany({
    where: {
      title: {
        in: [
          '小红书爆款文案生成器',
          'PRD产品需求文档生成',
          '专业客户邮件回复助手',
          '抖音短视频脚本创作'
        ]
      }
    },
    select: {
      id: true,
      title: true,
      authorId: true,
      isDraft: true,
      isPublic: true,
      config: true
    }
  });

  console.log('找到的工作流数量:', workflows.length);
  workflows.forEach(wf => {
    console.log('---');
    console.log('标题:', wf.title);
    console.log('作者ID:', wf.authorId);
    console.log('草稿状态:', wf.isDraft);
    console.log('公开状态:', wf.isPublic);
    console.log('有config:', !!wf.config);
    if (wf.config && wf.config.nodes) {
      console.log('config节点数量:', wf.config.nodes.length);
    }
  });

  // 检查当前用户
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  console.log('\n所有用户:');
  users.forEach(u => {
    console.log('- ID:', u.id, '名称:', u.name, '邮箱:', u.email);
  });

  await prisma.$disconnect();
})();
