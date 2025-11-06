import { hashPassword, comparePassword, validatePassword } from '../../src/utils/password';

describe('Password Utils', () => {
  describe('validatePassword', () => {
    it('应该接受有效的密码', () => {
      const password = 'ValidPass123';
      const errors = validatePassword(password);
      expect(errors).toHaveLength(0);
    });

    it('应该拒绝太短的密码', () => {
      const password = 'Short1';
      const errors = validatePassword(password);
      expect(errors).toContain('密码长度至少8位');
    });

    it('应该拒绝没有大写字母的密码', () => {
      const password = 'lowercase123';
      const errors = validatePassword(password);
      expect(errors).toContain('密码必须包含至少一个大写字母');
    });

    it('应该拒绝没有小写字母的密码', () => {
      const password = 'UPPERCASE123';
      const errors = validatePassword(password);
      expect(errors).toContain('密码必须包含至少一个小写字母');
    });

    it('应该拒绝没有数字的密码', () => {
      const password = 'NoNumbers';
      const errors = validatePassword(password);
      expect(errors).toContain('密码必须包含至少一个数字');
    });

    it('应该返回所有验证错误', () => {
      const password = 'bad';
      const errors = validatePassword(password);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('密码长度至少8位');
    });
  });

  describe('hashPassword and comparePassword', () => {
    it('应该正确哈希密码', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('应该为相同密码生成不同的哈希', async () => {
      const password = 'TestPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('应该正确验证密码', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('应该拒绝错误的密码', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword123';
      const hash = await hashPassword(password);

      const isValid = await comparePassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });
});
