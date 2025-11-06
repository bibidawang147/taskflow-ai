import dotenv from 'dotenv';

// 加载测试环境变量
dotenv.config({ path: '.env.test' });

// 设置必需的环境变量（如果未设置）
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
}
if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = '7d';
}

// 禁用 Sentry 在测试环境中
process.env.SENTRY_DSN = '';

// 设置测试超时
jest.setTimeout(10000);

// 全局测试钩子
beforeAll(async () => {
  // 测试前的全局设置
  console.log('🧪 Starting test suite...');
});

afterAll(async () => {
  // 测试后的清理
  console.log('✅ Test suite completed');
});
