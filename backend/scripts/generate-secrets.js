#!/usr/bin/env node

/**
 * 生成强密钥工具
 * 用于生成 JWT_SECRET, DB_PASSWORD 等
 */

const crypto = require('crypto');

console.log('================================');
console.log('🔐 生成强密钥');
console.log('================================\n');

// JWT Secret（64字节）
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET（复制到 .env）:');
console.log(jwtSecret);
console.log('');

// 数据库密码（32字符，包含特殊字符）
const dbPassword = crypto.randomBytes(24).toString('base64').replace(/[/+=]/g, '');
console.log('DB_PASSWORD（数据库密码）:');
console.log(dbPassword);
console.log('');

// Redis 密码
const redisPassword = crypto.randomBytes(24).toString('base64').replace(/[/+=]/g, '');
console.log('REDIS_PASSWORD（Redis密码）:');
console.log(redisPassword);
console.log('');

// API Secret（通用）
const apiSecret = crypto.randomBytes(32).toString('hex');
console.log('API_SECRET（通用密钥）:');
console.log(apiSecret);
console.log('');

console.log('================================');
console.log('⚠️  安全提示：');
console.log('1. 立即保存这些密钥到安全的地方');
console.log('2. 不要提交到 Git');
console.log('3. 生产环境必须使用不同的密钥');
console.log('4. 定期轮换密钥');
console.log('================================');
