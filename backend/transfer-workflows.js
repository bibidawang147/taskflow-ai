const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  // 获取最新创建的测试用户
  const testUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  });

  if (!testUser) {
    console.log('❌ 测试用户不存在');
    return;
  }

  console.log('✅ 找到测试用户:', testUser.name, testUser.email);

  // 更新这4个工作流的作者为测试用户
  const result = await prisma.workflow.updateMany({
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
    data: {
      authorId: testUser.id
    }
  });

  console.log('✅ 已更新', result.count, '个工作流的所有者');
  console.log('\n📝 登录信息:');
  console.log('邮箱:', testUser.email);
  console.log('密码: password123');

  await prisma.$disconnect();
})();
