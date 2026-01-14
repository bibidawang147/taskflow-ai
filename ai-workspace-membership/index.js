/**
 * AI工作台会员体系模块
 *
 * 用法示例:
 *
 * const membership = require('./ai-workspace-membership');
 *
 * // 获取服务
 * const { UserService, PermissionService, WorkflowService, PointsService, LevelService, RevenueService, PurchaseService } = membership.services;
 *
 * // 使用路由
 * app.use('/api/workflows', membership.routes.workflowRoutes);
 * app.use('/api/users', membership.routes.userRoutes);
 * app.use('/api/admin', membership.routes.adminRoutes);
 * app.use('/api/points', membership.routes.pointsRoutes);
 * app.use('/api/levels', membership.routes.levelRoutes);
 * app.use('/api/revenue', membership.routes.revenueRoutes);
 * app.use('/api/purchases', membership.routes.purchaseRoutes);
 * app.use('/api/explore', membership.routes.exploreRoutes);
 * app.use('/api/workspace', membership.routes.workspaceRoutes);
 * app.use('/api/creator', membership.routes.creatorRoutes);
 *
 * // 启动定时任务
 * membership.jobs.monthlyRevenue.start();
 *
 * // 使用中间件
 * app.use('/api/protected', membership.middleware.requireAuth);
 * app.use('/api/pro-only', membership.middleware.requirePro);
 * app.use('/api/creator-only', membership.middleware.requireCreator);
 *
 * // 检查权限
 * app.post('/api/workflows/:id/copy', async (req, res) => {
 *   await PermissionService.requirePermission(req.userId, 'copyWorkflow');
 *   // ... 复制逻辑
 * });
 */

const services = require('./services');
const routes = require('./routes');
const middleware = require('./middleware');
const constants = require('./config/constants');
const database = require('./config/database');
const jobs = {
  monthlyRevenue: require('./jobs/monthlyRevenue')
};

module.exports = {
  services,
  routes,
  middleware,
  constants,
  database,
  jobs,

  // 便捷访问
  UserService: services.UserService,
  PermissionService: services.PermissionService,
  WorkflowService: services.WorkflowService,
  PointsService: services.PointsService,
  LevelService: services.LevelService,
  RevenueService: services.RevenueService,
  PurchaseService: services.PurchaseService,
  AdminService: services.AdminService
};
