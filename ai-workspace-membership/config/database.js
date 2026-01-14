/**
 * 数据库连接配置
 * 使用 mysql2/promise 实现异步操作
 */

const mysql = require('mysql2/promise');

// 数据库连接池配置
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_workspace',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // 启用 JSON 类型支持
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      return JSON.parse(field.string());
    }
    return next();
  }
};

// 创建连接池
const pool = mysql.createPool(poolConfig);

/**
 * 获取数据库连接
 * @returns {Promise<mysql.PoolConnection>}
 */
async function getConnection() {
  return pool.getConnection();
}

/**
 * 执行查询
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数
 * @returns {Promise<Array>}
 */
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * 执行单条查询，返回第一行
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数
 * @returns {Promise<Object|null>}
 */
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

/**
 * 开始事务
 * @returns {Promise<{connection: mysql.PoolConnection, commit: Function, rollback: Function}>}
 */
async function beginTransaction() {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  return {
    connection,
    query: async (sql, params = []) => {
      const [rows] = await connection.execute(sql, params);
      return rows;
    },
    queryOne: async (sql, params = []) => {
      const [rows] = await connection.execute(sql, params);
      return rows[0] || null;
    },
    commit: async () => {
      await connection.commit();
      connection.release();
    },
    rollback: async () => {
      await connection.rollback();
      connection.release();
    }
  };
}

/**
 * 测试数据库连接
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

/**
 * 关闭连接池
 */
async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  getConnection,
  query,
  queryOne,
  beginTransaction,
  testConnection,
  closePool
};
