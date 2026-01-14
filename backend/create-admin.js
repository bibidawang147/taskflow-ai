const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@workflow.com';
  const password = 'Admin123456';
  const hashedPassword = await bcrypt.hash(password, 10);

  // 检查是否已存在
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('管理员账号已存在');
    console.log('邮箱:', email);
    console.log('密码:', password);
    await prisma.$disconnect();
    return;
  }

  // 创建用户
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: '超级管理员',
    },
  });

  // 创建会员信息（Pro会员 + 创作者）
  await prisma.membership.create({
    data: {
      userId: user.id,
      type: 'pro',
      isCreator: true,
      status: 'active',
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 一年后
    },
  });

  // 创建创作者统计
  await prisma.creatorStats.create({
    data: {
      userId: user.id,
      level: 10,
      totalPoints: 10000,
      workCount: 100,
      totalUsage: 1000000,
    },
  });

  console.log('✅ 超级管理员账号创建成功！');
  console.log('');
  console.log('账号信息：');
  console.log('邮箱:', email);
  console.log('密码:', password);
  console.log('角色: 超级管理员 + Pro会员 + LV10创作者');

  await prisma.$disconnect();
}

createAdmin().catch(console.error);
