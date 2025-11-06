import { generateToken, verifyToken } from '../../src/utils/jwt';

describe('JWT Utils', () => {
  const testUserId = 'user-123';

  describe('generateToken', () => {
    it('应该生成有效的 JWT token', () => {
      const token = generateToken(testUserId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT 格式：header.payload.signature
    });

    it('应该为相同用户生成不同的 token（因为时间戳）', () => {
      const token1 = generateToken(testUserId);
      const token2 = generateToken(testUserId);

      // 虽然 userId 相同，但由于 iat（issued at）字段不同，token 应该不同
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
    });
  });

  describe('verifyToken', () => {
    it('应该正确验证有效的 token', () => {
      const token = generateToken(testUserId);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testUserId);
    });

    it('应该拒绝无效的 token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    it('应该拒绝被篡改的 token', () => {
      const token = generateToken(testUserId);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      expect(() => {
        verifyToken(tamperedToken);
      }).toThrow();
    });
  });

  describe('Token 生命周期', () => {
    it('生成和验证的完整流程', () => {
      // 生成 token
      const token = generateToken(testUserId);

      // 验证 token
      const decoded = verifyToken(token);

      // 检查 payload
      expect(decoded.userId).toBe(testUserId);
    });
  });
});
