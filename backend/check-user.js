const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      include: {
        balance: true,
      },
    });

    if (user) {
      console.log('✅ 用户存在:');
      console.log('ID:', user.id);
      console.log('邮箱:', user.email);
      console.log('用户名:', user.name);
      console.log('会员等级:', user.tier);
      console.log('密码哈希存在:', !!user.password);
      console.log('余额信息:', user.balance ? `${user.balance.coins} coins` : '未初始化');
    } else {
      console.log('❌ 用户不存在');
    }
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
