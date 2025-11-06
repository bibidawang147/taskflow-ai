const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testPassword() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    if (!user) {
      console.log('❌ 用户不存在');
      return;
    }

    console.log('用户信息:');
    console.log('- 邮箱:', user.email);
    console.log('- 用户名:', user.name);
    console.log('- 密码哈希:', user.password);

    // 测试密码
    const testPassword = '123456';
    const isValid = await bcrypt.compare(testPassword, user.password);

    console.log('\n密码测试:');
    console.log('- 测试密码:', testPassword);
    console.log('- 验证结果:', isValid ? '✅ 正确' : '❌ 错误');

    if (!isValid) {
      console.log('\n🔧 重置密码为 123456...');
      const newHash = await bcrypt.hash('123456', 10);
      await prisma.user.update({
        where: { email: 'test@example.com' },
        data: { password: newHash },
      });
      console.log('✅ 密码已重置');
    }
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();
