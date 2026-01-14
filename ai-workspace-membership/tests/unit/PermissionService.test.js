/**
 * PermissionService 单元测试
 */

const db = require('../../config/database');
const PermissionService = require('../../services/PermissionService');

describe('PermissionService', () => {
  beforeEach(() => {
    db.clearMockData();
  });

  describe('canAccessWorkflow', () => {
    it('should allow access to free workflow for everyone', async () => {
      const userId = testHelpers.generateUUID();
      const workflowId = testHelpers.generateUUID();

      // 设置工作流为免费（level=1）
      db.setMockQueryOneResult({
        id: workflowId,
        level: 1,
        status: 'approved',
        creator_id: 'other-user'
      });

      // 设置用户为免费用户
      db.setMockQueryOneResult(null);

      const result = await PermissionService.canAccessWorkflow(userId, workflowId);

      expect(result.canAccess).toBe(true);
    });

    it('should deny pro workflow access for free user', async () => {
      const userId = testHelpers.generateUUID();
      const workflowId = testHelpers.generateUUID();

      // 设置工作流为Pro免费（level=2）
      db.setMockQueryOneResult({
        id: workflowId,
        level: 2,
        status: 'approved',
        creator_id: 'other-user'
      });

      // 设置用户为免费用户
      db.setMockQueryOneResult(null);

      const result = await PermissionService.canAccessWorkflow(userId, workflowId);

      expect(result.canAccess).toBe(false);
      expect(result.reason).toContain('Pro');
    });

    it('should allow pro workflow access for pro user', async () => {
      const userId = testHelpers.generateUUID();
      const workflowId = testHelpers.generateUUID();

      // 设置工作流为Pro免费（level=2）
      db.setMockQueryOneResult({
        id: workflowId,
        level: 2,
        status: 'approved',
        creator_id: 'other-user'
      });

      // 设置用户为Pro会员
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 0,
        status: 'active',
        expires_at: new Date(Date.now() + 86400000)
      });

      const result = await PermissionService.canAccessWorkflow(userId, workflowId);

      expect(result.canAccess).toBe(true);
    });

    it('should allow creator to access their own workflow', async () => {
      const userId = testHelpers.generateUUID();
      const workflowId = testHelpers.generateUUID();

      // 设置工作流为付费（level=3），但创作者是当前用户
      db.setMockQueryOneResult({
        id: workflowId,
        level: 3,
        price: 9.99,
        status: 'approved',
        creator_id: userId
      });

      const result = await PermissionService.canAccessWorkflow(userId, workflowId);

      expect(result.canAccess).toBe(true);
      expect(result.isCreator).toBe(true);
    });

    it('should deny paid workflow access without purchase', async () => {
      const userId = testHelpers.generateUUID();
      const workflowId = testHelpers.generateUUID();

      // 设置工作流为付费（level=3）
      db.setMockQueryOneResult({
        id: workflowId,
        level: 3,
        price: 9.99,
        status: 'approved',
        creator_id: 'other-user'
      });

      // 设置用户为Pro会员
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 0,
        status: 'active',
        expires_at: new Date(Date.now() + 86400000)
      });

      // 没有购买记录
      db.setMockQueryOneResult(null);

      const result = await PermissionService.canAccessWorkflow(userId, workflowId);

      expect(result.canAccess).toBe(false);
      expect(result.requiresPurchase).toBe(true);
      expect(result.price).toBe(9.99);
    });

    it('should allow paid workflow access with valid purchase', async () => {
      const userId = testHelpers.generateUUID();
      const workflowId = testHelpers.generateUUID();

      // 设置工作流为付费（level=3）
      db.setMockQueryOneResult({
        id: workflowId,
        level: 3,
        price: 9.99,
        status: 'approved',
        creator_id: 'other-user'
      });

      // 设置用户为Pro会员
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 0,
        status: 'active',
        expires_at: new Date(Date.now() + 86400000)
      });

      // 有购买记录
      db.setMockQueryOneResult({
        id: testHelpers.generateUUID(),
        user_id: userId,
        workflow_id: workflowId,
        status: 'completed'
      });

      const result = await PermissionService.canAccessWorkflow(userId, workflowId);

      expect(result.canAccess).toBe(true);
      expect(result.hasPurchased).toBe(true);
    });
  });

  describe('canPublishWorkflow', () => {
    it('should deny publishing for free user', async () => {
      const userId = testHelpers.generateUUID();

      // 设置用户为免费用户
      db.setMockQueryOneResult(null);

      const result = await PermissionService.canPublishWorkflow(userId);

      expect(result.canPublish).toBe(false);
      expect(result.reason).toContain('创作者');
    });

    it('should allow publishing for creator', async () => {
      const userId = testHelpers.generateUUID();

      // 设置用户为创作者
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 1,
        status: 'active',
        expires_at: new Date(Date.now() + 86400000)
      });

      const result = await PermissionService.canPublishWorkflow(userId);

      expect(result.canPublish).toBe(true);
    });
  });

  describe('canSetPaidWorkflow', () => {
    it('should deny setting paid workflow for non-creator', async () => {
      const userId = testHelpers.generateUUID();

      // 设置用户为Pro但非创作者
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 0,
        status: 'active',
        expires_at: new Date(Date.now() + 86400000)
      });

      const result = await PermissionService.canSetPaidWorkflow(userId);

      expect(result.canSetPaid).toBe(false);
    });

    it('should allow setting paid workflow for creator level 3+', async () => {
      const userId = testHelpers.generateUUID();

      // 设置用户为创作者
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 1,
        status: 'active',
        expires_at: new Date(Date.now() + 86400000)
      });

      // 设置创作者等级
      db.setMockQueryOneResult({ level: 3 });

      const result = await PermissionService.canSetPaidWorkflow(userId);

      expect(result.canSetPaid).toBe(true);
    });

    it('should deny setting paid workflow for creator below level 3', async () => {
      const userId = testHelpers.generateUUID();

      // 设置用户为创作者
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 1,
        status: 'active',
        expires_at: new Date(Date.now() + 86400000)
      });

      // 设置创作者等级为2
      db.setMockQueryOneResult({ level: 2 });

      const result = await PermissionService.canSetPaidWorkflow(userId);

      expect(result.canSetPaid).toBe(false);
      expect(result.requiredLevel).toBe(3);
    });
  });

  describe('getWorkflowAccessLevel', () => {
    it('should return level 1 for free user', async () => {
      const userId = testHelpers.generateUUID();

      // 设置用户为免费用户
      db.setMockQueryOneResult(null);

      const level = await PermissionService.getWorkflowAccessLevel(userId);

      expect(level).toBe(1);
    });

    it('should return level 2 for pro user', async () => {
      const userId = testHelpers.generateUUID();

      // 设置用户为Pro会员
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 0,
        status: 'active',
        expires_at: new Date(Date.now() + 86400000)
      });

      const level = await PermissionService.getWorkflowAccessLevel(userId);

      expect(level).toBe(2);
    });

    it('should return level 3 for creator', async () => {
      const userId = testHelpers.generateUUID();

      // 设置用户为创作者
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 1,
        status: 'active',
        expires_at: new Date(Date.now() + 86400000)
      });

      const level = await PermissionService.getWorkflowAccessLevel(userId);

      expect(level).toBe(3);
    });
  });
});
