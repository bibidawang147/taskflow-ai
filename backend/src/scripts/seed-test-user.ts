import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

async function seedTestUser() {
  console.log('🌱 开始创建测试用户...');

  try {
    // 检查测试用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    if (existingUser) {
      console.log('✅ 测试用户已存在');
      console.log('📧 邮箱: test@example.com');
      console.log('🔑 密码: 123456');
      return;
    }

    // 创建测试用户
    const hashedPassword = await hashPassword('123456');

    const user = await prisma.user.create({
      data: {
        name: '测试用户',
        email: 'test@example.com',
        password: hashedPassword,
        tier: 'pro', // 专业版，可以体验更多功能
      },
    });

    console.log('✅ 用户创建成功:', user.name);

    // 初始化用户余额
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    await prisma.userBalance.create({
      data: {
        userId: user.id,
        coins: 100000, // 10万积分，足够测试
        freeQuota: 50000, // 专业版每日免费额度 5万
        usedToday: 15000, // 模拟已使用了一些
        quotaResetAt: tomorrow,
        totalRecharged: 100, // 模拟充值过 ¥100
        totalConsumed: 25000, // 模拟总消耗 2.5万积分
      },
    });

    console.log('✅ 用户余额初始化成功');

    // 创建一些模拟的使用记录，让统计页面有数据
    const models = [
      { provider: 'openai', model: 'gpt-4o-mini' },
      { provider: 'openai', model: 'gpt-4o' },
      { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
      { provider: 'doubao', model: 'doubao-pro-32k' },
      { provider: 'qwen', model: 'qwen-max' },
    ];

    const now = new Date();
    const usageLogs = [];

    // 创建过去7天的使用记录
    for (let i = 0; i < 20; i++) {
      const randomModel = models[Math.floor(Math.random() * models.length)];
      const inputTokens = Math.floor(Math.random() * 1000) + 100;
      const outputTokens = Math.floor(Math.random() * 2000) + 200;
      const cost = Math.floor(Math.random() * 200) + 50;

      const daysAgo = Math.floor(Math.random() * 7);
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - daysAgo);

      usageLogs.push({
        userId: user.id,
        provider: randomModel.provider,
        model: randomModel.model,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        cost,
        requestType: 'chat',
        status: 'success',
        createdAt: timestamp,
      });
    }

    await prisma.usageLog.createMany({
      data: usageLogs,
    });

    console.log(`✅ 创建了 ${usageLogs.length} 条使用记录`);

    // 创建一些充值订单记录
    await prisma.rechargeOrder.create({
      data: {
        userId: user.id,
        orderNo: `TEST${Date.now()}`,
        amount: 100,
        coins: 120000, // 10万积分 + 2万赠送
        paymentMethod: 'wechat',
        status: 'completed',
      },
    });

    console.log('✅ 创建了充值订单记录');

    console.log('\n🎉 测试用户创建完成！\n');
    console.log('=================================');
    console.log('📧 邮箱: test@example.com');
    console.log('🔑 密码: 123456');
    console.log('👤 用户名: 测试用户');
    console.log('⭐ 会员等级: 专业版 (Pro)');
    console.log('💰 积分余额: 100,000 coins');
    console.log('🎁 每日免费额度: 50,000 coins');
    console.log('📊 已有使用记录: 20 条');
    console.log('=================================\n');
    console.log('现在你可以用这个账号登录并体验所有功能了！');
    console.log('访问: http://localhost:3000/login\n');
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestUser()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
