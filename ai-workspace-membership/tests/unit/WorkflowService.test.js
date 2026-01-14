/**
 * WorkflowService 单元测试
 */

const db = require('../../config/database');
const WorkflowService = require('../../services/WorkflowService');

describe('WorkflowService', () => {
  beforeEach(() => {
    db.clearMockData();
  });

  describe('createWorkflow', () => {
    it('should create a workflow with default values', async () => {
      const creatorId = testHelpers.generateUUID();
      const workflowData = {
        title: 'Test Workflow',
        description: 'Test description',
        prompt: 'Test prompt content'
      };

      // Mock insert 返回
      db.setMockQueryResult({ affectedRows: 1, insertId: 1 });

      const result = await WorkflowService.createWorkflow(creatorId, workflowData);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe(workflowData.title);
      expect(result.status).toBe('draft');
      expect(result.level).toBe(1);
    });

    it('should create a workflow with custom level', async () => {
      const creatorId = testHelpers.generateUUID();
      const workflowData = {
        title: 'Pro Workflow',
        description: 'Pro description',
        prompt: 'Pro prompt',
        level: 2
      };

      db.setMockQueryResult({ affectedRows: 1, insertId: 1 });

      const result = await WorkflowService.createWorkflow(creatorId, workflowData);

      expect(result.level).toBe(2);
    });
  });

  describe('updateWorkflow', () => {
    it('should update workflow fields', async () => {
      const workflowId = testHelpers.generateUUID();
      const creatorId = testHelpers.generateUUID();
      const updates = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      // Mock查询现有工作流
      db.setMockQueryOneResult({
        id: workflowId,
        creator_id: creatorId,
        status: 'draft'
      });

      // Mock更新
      db.setMockQueryResult({ affectedRows: 1 });

      const result = await WorkflowService.updateWorkflow(workflowId, creatorId, updates);

      expect(result.success).toBe(true);
    });

    it('should reject update from non-owner', async () => {
      const workflowId = testHelpers.generateUUID();
      const creatorId = testHelpers.generateUUID();
      const otherUserId = testHelpers.generateUUID();

      // Mock查询现有工作流（属于其他用户）
      db.setMockQueryOneResult({
        id: workflowId,
        creator_id: otherUserId,
        status: 'draft'
      });

      await expect(
        WorkflowService.updateWorkflow(workflowId, creatorId, { title: 'Hacked' })
      ).rejects.toThrow();
    });
  });

  describe('submitForReview', () => {
    it('should submit draft workflow for review', async () => {
      const workflowId = testHelpers.generateUUID();
      const creatorId = testHelpers.generateUUID();

      // Mock查询工作流
      db.setMockQueryOneResult({
        id: workflowId,
        creator_id: creatorId,
        status: 'draft',
        title: 'Test',
        description: 'Test',
        prompt: 'Test prompt'
      });

      // Mock更新
      db.setMockQueryResult({ affectedRows: 1 });

      const result = await WorkflowService.submitForReview(workflowId, creatorId);

      expect(result.success).toBe(true);
      expect(result.status).toBe('pending');
    });

    it('should reject submission of incomplete workflow', async () => {
      const workflowId = testHelpers.generateUUID();
      const creatorId = testHelpers.generateUUID();

      // Mock查询不完整的工作流
      db.setMockQueryOneResult({
        id: workflowId,
        creator_id: creatorId,
        status: 'draft',
        title: 'Test',
        description: null,
        prompt: null
      });

      await expect(
        WorkflowService.submitForReview(workflowId, creatorId)
      ).rejects.toThrow();
    });
  });

  describe('reviewWorkflow', () => {
    it('should approve workflow', async () => {
      const workflowId = testHelpers.generateUUID();
      const adminId = testHelpers.generateUUID();

      // Mock查询待审核工作流
      db.setMockQueryOneResult({
        id: workflowId,
        status: 'pending',
        creator_id: testHelpers.generateUUID()
      });

      // Mock更新
      db.setMockQueryResult({ affectedRows: 1 });

      const result = await WorkflowService.reviewWorkflow(workflowId, adminId, 'approve');

      expect(result.success).toBe(true);
      expect(result.status).toBe('approved');
    });

    it('should reject workflow with reason', async () => {
      const workflowId = testHelpers.generateUUID();
      const adminId = testHelpers.generateUUID();

      // Mock查询待审核工作流
      db.setMockQueryOneResult({
        id: workflowId,
        status: 'pending',
        creator_id: testHelpers.generateUUID()
      });

      // Mock更新
      db.setMockQueryResult({ affectedRows: 1 });

      const result = await WorkflowService.reviewWorkflow(
        workflowId,
        adminId,
        'reject',
        '内容不符合规范'
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe('rejected');
    });
  });

  describe('getWorkflowDetail', () => {
    it('should return workflow details', async () => {
      const workflowId = testHelpers.generateUUID();

      db.setMockQueryOneResult({
        id: workflowId,
        title: 'Test Workflow',
        description: 'Test description',
        level: 1,
        status: 'approved',
        usage_count: 100,
        purchase_count: 10
      });

      const result = await WorkflowService.getWorkflowDetail(workflowId);

      expect(result.id).toBe(workflowId);
      expect(result.title).toBe('Test Workflow');
    });

    it('should return null for non-existent workflow', async () => {
      db.setMockQueryOneResult(null);

      const result = await WorkflowService.getWorkflowDetail('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage count', async () => {
      const workflowId = testHelpers.generateUUID();
      const userId = testHelpers.generateUUID();

      // Mock更新
      db.setMockQueryResult({ affectedRows: 1 });
      // Mock插入使用记录
      db.setMockQueryResult({ affectedRows: 1, insertId: 1 });

      const result = await WorkflowService.incrementUsage(workflowId, userId);

      expect(result.success).toBe(true);
    });
  });

  describe('getCreatorWorkflows', () => {
    it('should return paginated list of creator workflows', async () => {
      const creatorId = testHelpers.generateUUID();

      // Mock计数
      db.setMockQueryOneResult({ total: 25 });

      // Mock列表
      db.setMockQueryResult([
        { id: '1', title: 'Workflow 1', status: 'approved' },
        { id: '2', title: 'Workflow 2', status: 'draft' },
        { id: '3', title: 'Workflow 3', status: 'pending' }
      ]);

      const result = await WorkflowService.getCreatorWorkflows(creatorId, {
        page: 1,
        pageSize: 10
      });

      expect(result.total).toBe(25);
      expect(result.workflows).toHaveLength(3);
    });

    it('should filter by status', async () => {
      const creatorId = testHelpers.generateUUID();

      db.setMockQueryOneResult({ total: 10 });
      db.setMockQueryResult([
        { id: '1', title: 'Workflow 1', status: 'approved' }
      ]);

      const result = await WorkflowService.getCreatorWorkflows(creatorId, {
        status: 'approved'
      });

      expect(result.workflows[0].status).toBe('approved');
    });
  });

  describe('setWorkflowPrice', () => {
    it('should set price and update level to 3', async () => {
      const workflowId = testHelpers.generateUUID();
      const creatorId = testHelpers.generateUUID();

      // Mock查询工作流
      db.setMockQueryOneResult({
        id: workflowId,
        creator_id: creatorId,
        status: 'approved',
        level: 2
      });

      // Mock更新
      db.setMockQueryResult({ affectedRows: 1 });

      const result = await WorkflowService.setWorkflowPrice(workflowId, creatorId, 9.99);

      expect(result.success).toBe(true);
      expect(result.price).toBe(9.99);
      expect(result.level).toBe(3);
    });

    it('should reject price setting for non-owner', async () => {
      const workflowId = testHelpers.generateUUID();
      const creatorId = testHelpers.generateUUID();
      const otherUserId = testHelpers.generateUUID();

      db.setMockQueryOneResult({
        id: workflowId,
        creator_id: otherUserId,
        status: 'approved'
      });

      await expect(
        WorkflowService.setWorkflowPrice(workflowId, creatorId, 9.99)
      ).rejects.toThrow();
    });
  });

  describe('deleteWorkflow', () => {
    it('should soft delete workflow', async () => {
      const workflowId = testHelpers.generateUUID();
      const creatorId = testHelpers.generateUUID();

      db.setMockQueryOneResult({
        id: workflowId,
        creator_id: creatorId,
        status: 'draft'
      });

      db.setMockQueryResult({ affectedRows: 1 });

      const result = await WorkflowService.deleteWorkflow(workflowId, creatorId);

      expect(result.success).toBe(true);
    });

    it('should reject deletion of approved workflow with purchases', async () => {
      const workflowId = testHelpers.generateUUID();
      const creatorId = testHelpers.generateUUID();

      db.setMockQueryOneResult({
        id: workflowId,
        creator_id: creatorId,
        status: 'approved',
        purchase_count: 5
      });

      await expect(
        WorkflowService.deleteWorkflow(workflowId, creatorId)
      ).rejects.toThrow();
    });
  });
});
