/**
 * PointsService 单元测试
 */

const db = require('../../config/database');
const PointsService = require('../../services/PointsService');

describe('PointsService', () => {
  beforeEach(() => {
    db.clearMockData();
  });

  describe('addPoints', () => {
    it('should add points for workflow approval', async () => {
      const userId = testHelpers.generateUUID();

      // Mock事务
      const mockTx = {
        query: jest.fn().mockResolvedValue({ affectedRows: 1 }),
        queryOne: jest.fn().mockResolvedValue({ total_points: 100 }),
        commit: jest.fn(),
        rollback: jest.fn()
      };
      db.beginTransaction = jest.fn().mockResolvedValue(mockTx);

      const result = await PointsService.addPoints(userId, 'workflow_approved', {
        workflowId: testHelpers.generateUUID()
      });

      expect(result.success).toBe(true);
      expect(result.points).toBe(100); // 工作流通过审核奖励100积分
      expect(mockTx.commit).toHaveBeenCalled();
    });

    it('should add points for workflow usage', async () => {
      const userId = testHelpers.generateUUID();

      const mockTx = {
        query: jest.fn().mockResolvedValue({ affectedRows: 1 }),
        queryOne: jest.fn().mockResolvedValue({ total_points: 5 }),
        commit: jest.fn(),
        rollback: jest.fn()
      };
      db.beginTransaction = jest.fn().mockResolvedValue(mockTx);

      const result = await PointsService.addPoints(userId, 'workflow_used', {
        workflowId: testHelpers.generateUUID()
      });

      expect(result.success).toBe(true);
      expect(result.points).toBe(5); // 工作流被使用奖励5积分
    });

    it('should add points for workflow purchase', async () => {
      const userId = testHelpers.generateUUID();

      const mockTx = {
        query: jest.fn().mockResolvedValue({ affectedRows: 1 }),
        queryOne: jest.fn().mockResolvedValue({ total_points: 200 }),
        commit: jest.fn(),
        rollback: jest.fn()
      };
      db.beginTransaction = jest.fn().mockResolvedValue(mockTx);

      const result = await PointsService.addPoints(userId, 'workflow_purchased', {
        workflowId: testHelpers.generateUUID(),
        price: 19.99
      });

      expect(result.success).toBe(true);
      expect(result.points).toBeGreaterThan(0);
    });
  });

  describe('getPointsBalance', () => {
    it('should return current points balance', async () => {
      const userId = testHelpers.generateUUID();

      db.setMockQueryOneResult({ total_points: 500 });

      const balance = await PointsService.getPointsBalance(userId);

      expect(balance).toBe(500);
    });

    it('should return 0 for user without stats', async () => {
      const userId = testHelpers.generateUUID();

      db.setMockQueryOneResult(null);

      const balance = await PointsService.getPointsBalance(userId);

      expect(balance).toBe(0);
    });
  });

  describe('getPointsHistory', () => {
    it('should return paginated points history', async () => {
      const userId = testHelpers.generateUUID();

      // Mock计数
      db.setMockQueryOneResult({ total: 50 });

      // Mock历史记录
      db.setMockQueryResult([
        { id: '1', type: 'workflow_approved', points: 100, created_at: new Date() },
        { id: '2', type: 'workflow_used', points: 5, created_at: new Date() },
        { id: '3', type: 'workflow_purchased', points: 200, created_at: new Date() }
      ]);

      const result = await PointsService.getPointsHistory(userId, {
        page: 1,
        pageSize: 10
      });

      expect(result.total).toBe(50);
      expect(result.records).toHaveLength(3);
    });

    it('should filter by type', async () => {
      const userId = testHelpers.generateUUID();

      db.setMockQueryOneResult({ total: 10 });
      db.setMockQueryResult([
        { id: '1', type: 'workflow_approved', points: 100, created_at: new Date() }
      ]);

      const result = await PointsService.getPointsHistory(userId, {
        type: 'workflow_approved'
      });

      expect(result.records[0].type).toBe('workflow_approved');
    });
  });

  describe('calculatePointsForEvent', () => {
    it('should return correct points for workflow_approved', () => {
      const points = PointsService.calculatePointsForEvent('workflow_approved');
      expect(points).toBe(100);
    });

    it('should return correct points for workflow_used', () => {
      const points = PointsService.calculatePointsForEvent('workflow_used');
      expect(points).toBe(5);
    });

    it('should return correct points for workflow_purchased based on price', () => {
      const points = PointsService.calculatePointsForEvent('workflow_purchased', { price: 10 });
      expect(points).toBe(100); // 价格 * 10
    });

    it('should return correct points for incentive_distribution', () => {
      const points = PointsService.calculatePointsForEvent('incentive_distribution', { amount: 50 });
      expect(points).toBe(50);
    });

    it('should return 0 for unknown event type', () => {
      const points = PointsService.calculatePointsForEvent('unknown_event');
      expect(points).toBe(0);
    });
  });

  describe('getPointsStats', () => {
    it('should return points statistics', async () => {
      const userId = testHelpers.generateUUID();

      // Mock总积分
      db.setMockQueryOneResult({ total_points: 1000 });

      // Mock各类型统计
      db.setMockQueryResult([
        { type: 'workflow_approved', total: 500 },
        { type: 'workflow_used', total: 300 },
        { type: 'workflow_purchased', total: 200 }
      ]);

      const result = await PointsService.getPointsStats(userId);

      expect(result.totalPoints).toBe(1000);
      expect(result.breakdown).toBeDefined();
    });
  });

  describe('deductPoints', () => {
    it('should deduct points successfully', async () => {
      const userId = testHelpers.generateUUID();

      const mockTx = {
        query: jest.fn().mockResolvedValue({ affectedRows: 1 }),
        queryOne: jest.fn().mockResolvedValue({ total_points: 500 }),
        commit: jest.fn(),
        rollback: jest.fn()
      };
      db.beginTransaction = jest.fn().mockResolvedValue(mockTx);

      const result = await PointsService.deductPoints(userId, 100, 'point_redemption', {
        reason: '积分兑换'
      });

      expect(result.success).toBe(true);
      expect(result.deducted).toBe(100);
    });

    it('should fail when insufficient points', async () => {
      const userId = testHelpers.generateUUID();

      const mockTx = {
        queryOne: jest.fn().mockResolvedValue({ total_points: 50 }),
        rollback: jest.fn()
      };
      db.beginTransaction = jest.fn().mockResolvedValue(mockTx);

      await expect(
        PointsService.deductPoints(userId, 100, 'point_redemption')
      ).rejects.toThrow('积分不足');
    });
  });

  describe('getMonthlyPointsSummary', () => {
    it('should return monthly summary', async () => {
      const userId = testHelpers.generateUUID();
      const year = 2024;
      const month = 1;

      db.setMockQueryResult([
        { type: 'workflow_approved', total: 300, count: 3 },
        { type: 'workflow_used', total: 150, count: 30 },
        { type: 'incentive_distribution', total: 100, count: 1 }
      ]);

      const result = await PointsService.getMonthlyPointsSummary(userId, year, month);

      expect(result.year).toBe(year);
      expect(result.month).toBe(month);
      expect(result.breakdown).toBeDefined();
      expect(result.totalEarned).toBeGreaterThan(0);
    });
  });
});
