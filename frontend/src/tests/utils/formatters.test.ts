import { describe, it, expect } from 'vitest';
import { formatDate, formatNumber, truncateText, isValidEmail } from '../../utils/formatters';

describe('Formatters', () => {
  describe('formatDate', () => {
    it('应该正确格式化日期对象', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toBe('2024/01/15');
    });

    it('应该正确格式化日期字符串', () => {
      const dateString = '2024-03-20';
      const formatted = formatDate(dateString);
      expect(formatted).toBe('2024/03/20');
    });
  });

  describe('formatNumber', () => {
    it('应该为小数字添加千分位', () => {
      expect(formatNumber(1000)).toBe('1,000');
    });

    it('应该为大数字添加千分位', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('应该正确处理小于1000的数字', () => {
      expect(formatNumber(999)).toBe('999');
    });

    it('应该正确处理0', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('truncateText', () => {
    it('应该截断超过最大长度的文本', () => {
      const text = 'This is a very long text that needs to be truncated';
      const truncated = truncateText(text, 20);
      expect(truncated).toBe('This is a very long ...');
      expect(truncated.length).toBe(23); // 20 + '...'
    });

    it('不应该截断短文本', () => {
      const text = 'Short text';
      const truncated = truncateText(text, 20);
      expect(truncated).toBe('Short text');
    });

    it('应该正确处理等于最大长度的文本', () => {
      const text = '12345678901234567890';
      const truncated = truncateText(text, 20);
      expect(truncated).toBe('12345678901234567890');
    });
  });

  describe('isValidEmail', () => {
    it('应该接受有效的邮箱地址', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
      expect(isValidEmail('name+tag@company.org')).toBe(true);
    });

    it('应该拒绝无效的邮箱地址', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('no@domain')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user @domain.com')).toBe(false);
    });

    it('应该拒绝空字符串', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });
});
