const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function createTestUser() {
  const prisma = new PrismaClient();
  try {
    // 创建或获取测试用户
    let user = await prisma.user.findUnique({
      where: { email: 'test@test.com' }
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash('test123', 10);
      user = await prisma.user.create({
        data: {
          email: 'test@test.com',
          username: 'testuser',
          password: hashedPassword
        }
      });
      console.log('创建测试用户成功');
    } else {
      console.log('测试用户已存在');
    }

    // 生成token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key-here',
      { expiresIn: '7d' }
    );

    console.log('Token:', token);
    await prisma.$disconnect();
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

createTestUser();
