/**
 * Jest 测试环境配置
 */

// 设置测试超时时间
jest.setTimeout(30000);

// 模拟数据库模块
jest.mock('../config/database', () => require('./mocks/database'));

// 全局测试辅助函数
global.testHelpers = {
  /**
   * 生成测试用UUID
   */
  generateUUID() {
    return 'test-' + Math.random().toString(36).substring(2, 15);
  },

  /**
   * 创建测试用户数据
   */
  createTestUser(overrides = {}) {
    return {
      id: this.generateUUID(),
      username: 'testuser_' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password_hash: '$2b$10$test',
      status: 'active',
      created_at: new Date(),
      ...overrides
    };
  },

  /**
   * 创建测试会员数据
   */
  createTestMembership(userId, overrides = {}) {
    return {
      id: this.generateUUID(),
      user_id: userId,
      type: 'free',
      is_creator: 0,
      status: 'active',
      started_at: new Date(),
      expires_at: null,
      ...overrides
    };
  },

  /**
   * 创建测试工作流数据
   */
  createTestWorkflow(creatorId, overrides = {}) {
    return {
      id: this.generateUUID(),
      creator_id: creatorId,
      title: 'Test Workflow ' + Date.now(),
      description: 'Test description',
      prompt: 'Test prompt content',
      level: 1,
      price: null,
      status: 'draft',
      usage_count: 0,
      purchase_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  },

  /**
   * 创建测试创作者统计数据
   */
  createTestCreatorStats(userId, overrides = {}) {
    return {
      id: this.generateUUID(),
      user_id: userId,
      level: 1,
      total_points: 0,
      work_count: 0,
      total_usage: 0,
      total_purchases: 0,
      total_revenue: 0,
      pending_revenue: 0,
      withdrawn_revenue: 0,
      ...overrides
    };
  },

  /**
   * 等待指定时间
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// 在所有测试之前运行
beforeAll(async () => {
  // 可以在这里进行全局初始化
  console.log('Test suite starting...');
});

// 在所有测试之后运行
afterAll(async () => {
  // 清理工作
  console.log('Test suite completed.');
});

// 每个测试之前运行
beforeEach(() => {
  // 重置所有mock
  jest.clearAllMocks();
});
