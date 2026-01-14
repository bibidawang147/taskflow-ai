/**
 * UserService 单元测试
 */

const db = require('../../config/database');
const UserService = require('../../services/UserService');

describe('UserService', () => {
  beforeEach(() => {
    db.clearMockData();
  });

  describe('getUserIdentity', () => {
    it('should return free user identity when no membership exists', async () => {
      const userId = testHelpers.generateUUID();

      // 设置mock返回null（无会员记录）
      db.setMockQueryOneResult(null);

      const identity = await UserService.getUserIdentity(userId);

      expect(identity).toEqual({
        userId,
        isFree: true,
        isPro: false,
        isCreator: false,
        membershipType: 'free',
        creatorLevel: null
      });
    });

    it('should return pro user identity with active membership', async () => {
      const userId = testHelpers.generateUUID();

      // 设置mock返回Pro会员
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 0,
        status: 'active',
        expires_at: new Date(Date.now() + 86400000) // 明天过期
      });

      const identity = await UserService.getUserIdentity(userId);

      expect(identity.isPro).toBe(true);
      expect(identity.isFree).toBe(false);
      expect(identity.isCreator).toBe(false);
      expect(identity.membershipType).toBe('pro');
    });

    it('should return creator identity when is_creator is true', async () => {
      const userId = testHelpers.generateUUID();

      // 设置mock返回创作者
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 1,
        status: 'active',
        expires_at: new Date(Date.now() + 86400000)
      });

      // 设置创作者等级
      db.setMockQueryOneResult({ level: 5 });

      const identity = await UserService.getUserIdentity(userId);

      expect(identity.isPro).toBe(true);
      expect(identity.isCreator).toBe(true);
      expect(identity.creatorLevel).toBe(5);
    });

    it('should return free identity when pro membership is expired', async () => {
      const userId = testHelpers.generateUUID();

      // 设置mock返回已过期的Pro会员
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 0,
        status: 'active',
        expires_at: new Date(Date.now() - 86400000) // 昨天已过期
      });

      const identity = await UserService.getUserIdentity(userId);

      expect(identity.isPro).toBe(false);
      expect(identity.isFree).toBe(true);
    });
  });

  describe('isFreeUser', () => {
    it('should return true for user without membership', async () => {
      const userId = testHelpers.generateUUID();
      db.setMockQueryOneResult(null);

      const result = await UserService.isFreeUser(userId);

      expect(result).toBe(true);
    });

    it('should return false for pro user', async () => {
      const userId = testHelpers.generateUUID();
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 0,
        status: 'active',
        expires_at: new Date(Date.now() + 86400000)
      });

      const result = await UserService.isFreeUser(userId);

      expect(result).toBe(false);
    });
  });

  describe('isProUser', () => {
    it('should return false for free user', async () => {
      const userId = testHelpers.generateUUID();
      db.setMockQueryOneResult(null);

      const result = await UserService.isProUser(userId);

      expect(result).toBe(false);
    });

    it('should return true for active pro membership', async () => {
      const userId = testHelpers.generateUUID();
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 0,
        status: 'active',
        expires_at: new Date(Date.now() + 86400000)
      });

      const result = await UserService.isProUser(userId);

      expect(result).toBe(true);
    });
  });

  describe('isCreator', () => {
    it('should return false for non-creator', async () => {
      const userId = testHelpers.generateUUID();
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 0,
        status: 'active'
      });

      const result = await UserService.isCreator(userId);

      expect(result).toBe(false);
    });

    it('should return true for creator', async () => {
      const userId = testHelpers.generateUUID();
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 1,
        status: 'active'
      });

      const result = await UserService.isCreator(userId);

      expect(result).toBe(true);
    });
  });

  describe('checkCreatorEligibility', () => {
    it('should return not eligible for free user', async () => {
      const userId = testHelpers.generateUUID();

      // 第一次查询：会员信息（null = free用户）
      db.setMockQueryOneResult(null);

      const result = await UserService.checkCreatorEligibility(userId);

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('需要Pro会员才能申请创作者');
    });

    it('should return not eligible when less than 3 approved workflows', async () => {
      const userId = testHelpers.generateUUID();

      // Pro会员
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 0,
        status: 'active',
        expires_at: new Date(Date.now() + 86400000)
      });

      // 只有2个通过审核的工作流
      db.setMockQueryOneResult({ count: 2 });

      const result = await UserService.checkCreatorEligibility(userId);

      expect(result.eligible).toBe(false);
      expect(result.approvedWorkflows).toBe(2);
      expect(result.requiredWorkflows).toBe(3);
    });

    it('should return eligible when all conditions met', async () => {
      const userId = testHelpers.generateUUID();

      // Pro会员
      db.setMockQueryOneResult({
        type: 'pro',
        is_creator: 0,
        status: 'active',
        expires_at: new Date(Date.now() + 86400000)
      });

      // 3个通过审核的工作流
      db.setMockQueryOneResult({ count: 3 });

      const result = await UserService.checkCreatorEligibility(userId);

      expect(result.eligible).toBe(true);
      expect(result.approvedWorkflows).toBe(3);
    });
  });
});
