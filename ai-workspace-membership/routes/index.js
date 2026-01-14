/**
 * 路由统一导出
 */

const workflowRoutes = require('./workflows');
const userRoutes = require('./users');
const adminRoutes = require('./admin');
const pointsRoutes = require('./points');
const levelRoutes = require('./levels');
const revenueRoutes = require('./revenue');
const purchaseRoutes = require('./purchases');
const exploreRoutes = require('./explore');
const workspaceRoutes = require('./workspace');
const creatorRoutes = require('./creator');

module.exports = {
  workflowRoutes,
  userRoutes,
  adminRoutes,
  pointsRoutes,
  levelRoutes,
  revenueRoutes,
  purchaseRoutes,
  // 前台路由
  exploreRoutes,
  workspaceRoutes,
  creatorRoutes
};
