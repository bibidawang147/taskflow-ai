const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser() {
  const email = 'user@test.com';
  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('账号已存在');
    console.log('邮箱:', email);
    console.log('密码:', password);
    await prisma.$disconnect();
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: '普通用户',
    },
  });

  // 创建免费会员信息
  await prisma.membership.create({
    data: {
      userId: user.id,
      type: 'free',
      isCreator: false,
      status: 'active',
    },
  });

  console.log('✅ 普通用户账号创建成功！');
  console.log('');
  console.log('账号信息：');
  console.log('邮箱:', email);
  console.log('密码:', password);
  console.log('身份: Free用户');

  await prisma.$disconnect();
}

createUser().catch(console.error);
