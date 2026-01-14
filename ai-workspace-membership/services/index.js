/**
 * 服务层统一导出
 */

const UserService = require('./UserService');
const PermissionService = require('./PermissionService');
const WorkflowService = require('./WorkflowService');
const PointsService = require('./PointsService');
const LevelService = require('./LevelService');
const RevenueService = require('./RevenueService');
const PurchaseService = require('./PurchaseService');
const AdminService = require('./AdminService');

module.exports = {
  UserService,
  PermissionService,
  WorkflowService,
  PointsService,
  LevelService,
  RevenueService,
  PurchaseService,
  AdminService
};
