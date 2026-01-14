/**
 * 数据库模块Mock
 * 用于单元测试，模拟数据库操作
 */

// 存储mock数据
const mockData = {
  users: new Map(),
  memberships: new Map(),
  workflows: new Map(),
  creator_stats: new Map(),
  points_records: [],
  revenue_records: [],
  workflow_usage: [],
  workflow_purchases: [],
  incentive_pools: new Map(),
  creator_applications: new Map()
};

// Mock查询结果
let mockQueryResults = [];
let mockQueryOneResult = null;

/**
 * 设置下一次query的返回值
 */
function setMockQueryResult(result) {
  mockQueryResults.push(result);
}

/**
 * 设置下一次queryOne的返回值
 */
function setMockQueryOneResult(result) {
  mockQueryOneResult = result;
}

/**
 * 清除所有mock数据
 */
function clearMockData() {
  mockData.users.clear();
  mockData.memberships.clear();
  mockData.workflows.clear();
  mockData.creator_stats.clear();
  mockData.points_records = [];
  mockData.revenue_records = [];
  mockData.workflow_usage = [];
  mockData.workflow_purchases = [];
  mockData.incentive_pools.clear();
  mockData.creator_applications.clear();
  mockQueryResults = [];
  mockQueryOneResult = null;
}

/**
 * 添加mock用户
 */
function addMockUser(user) {
  mockData.users.set(user.id, user);
}

/**
 * 添加mock会员
 */
function addMockMembership(membership) {
  mockData.memberships.set(membership.user_id, membership);
}

/**
 * 添加mock工作流
 */
function addMockWorkflow(workflow) {
  mockData.workflows.set(workflow.id, workflow);
}

/**
 * 添加mock创作者统计
 */
function addMockCreatorStats(stats) {
  mockData.creator_stats.set(stats.user_id, stats);
}

/**
 * Mock query 方法
 */
async function query(sql, params = []) {
  // 如果有预设的返回值，使用预设值
  if (mockQueryResults.length > 0) {
    return mockQueryResults.shift();
  }

  // 否则尝试根据SQL解析返回数据
  const sqlLower = sql.toLowerCase();

  // SELECT FROM users
  if (sqlLower.includes('select') && sqlLower.includes('from users')) {
    return Array.from(mockData.users.values());
  }

  // SELECT FROM memberships
  if (sqlLower.includes('select') && sqlLower.includes('from memberships')) {
    return Array.from(mockData.memberships.values());
  }

  // SELECT FROM workflows
  if (sqlLower.includes('select') && sqlLower.includes('from workflows')) {
    return Array.from(mockData.workflows.values());
  }

  // SELECT FROM creator_stats
  if (sqlLower.includes('select') && sqlLower.includes('from creator_stats')) {
    return Array.from(mockData.creator_stats.values());
  }

  // INSERT/UPDATE/DELETE - 返回affected rows
  if (sqlLower.includes('insert') || sqlLower.includes('update') || sqlLower.includes('delete')) {
    return { affectedRows: 1, insertId: 1 };
  }

  return [];
}

/**
 * Mock queryOne 方法
 */
async function queryOne(sql, params = []) {
  // 如果有预设的返回值，使用预设值
  if (mockQueryOneResult !== null) {
    const result = mockQueryOneResult;
    mockQueryOneResult = null;
    return result;
  }

  const sqlLower = sql.toLowerCase();

  // 查询用户
  if (sqlLower.includes('from users') && params.length > 0) {
    return mockData.users.get(params[0]) || null;
  }

  // 查询会员
  if (sqlLower.includes('from memberships') && params.length > 0) {
    return mockData.memberships.get(params[0]) || null;
  }

  // 查询工作流
  if (sqlLower.includes('from workflows') && params.length > 0) {
    return mockData.workflows.get(params[0]) || null;
  }

  // 查询创作者统计
  if (sqlLower.includes('from creator_stats') && params.length > 0) {
    return mockData.creator_stats.get(params[0]) || null;
  }

  // COUNT查询
  if (sqlLower.includes('count(*)')) {
    return { total: 0, count: 0 };
  }

  return null;
}

/**
 * Mock事务
 */
async function beginTransaction() {
  return {
    query: async (sql, params) => query(sql, params),
    queryOne: async (sql, params) => queryOne(sql, params),
    commit: async () => {},
    rollback: async () => {}
  };
}

module.exports = {
  query,
  queryOne,
  beginTransaction,
  // Mock辅助方法
  setMockQueryResult,
  setMockQueryOneResult,
  clearMockData,
  addMockUser,
  addMockMembership,
  addMockWorkflow,
  addMockCreatorStats,
  mockData
};
