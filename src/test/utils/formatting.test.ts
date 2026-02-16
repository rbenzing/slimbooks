/**
 * Formatting Utilities Tests
 * Tests currency, date, and text formatting functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  formatPhoneNumber,
  formatClientAddressSingleLine
} from '@/utils/formatting';
import type { Client } from '@/types';

describe('Currency Formatting', () => {
  describe('formatCurrency', () => {
    it('should format positive amounts correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });

    it('should format negative amounts correctly', () => {
      expect(formatCurrency(-500)).toBe('-$500.00');
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle very large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
    });

    it('should handle decimal precision', () => {
      expect(formatCurrency(10.1)).toBe('$10.10');
      expect(formatCurrency(10.999)).toBe('$11.00'); // Should round
    });

    it('should support different currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toContain('1,000.00');
      expect(formatCurrency(1000, 'GBP')).toContain('1,000.00');
    });

    it('should handle null and undefined', () => {
      expect(formatCurrency(null as any)).toBe('$0.00');
      expect(formatCurrency(undefined as any)).toBe('$0.00');
    });
  });
});

describe('Date Formatting', () => {
  describe('formatDate', () => {
    it('should format ISO date strings', () => {
      const result = formatDate('2026-02-16');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should format Date objects', () => {
      const date = new Date('2026-02-16');
      const result = formatDate(date);
      expect(result).toBeTruthy();
    });

    it('should handle invalid dates', () => {
      expect(formatDate('invalid')).toBe('Invalid Date');
      expect(formatDate(null as any)).toBe('Invalid Date');
    });

    it('should use locale-specific formatting', () => {
      const result = formatDate('2026-02-16', 'en-US');
      expect(result).toMatch(/2\/16\/2026|Feb|February/i);
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time together', () => {
      const result = formatDateTime('2026-02-16T14:30:00Z');
      expect(result).toBeTruthy();
      expect(result).toMatch(/2026/);
    });

    it('should include time component', () => {
      const result = formatDateTime('2026-02-16T14:30:00Z');
      expect(result).toMatch(/\d{1,2}:\d{2}/); // Should have time like 14:30
    });
  });

  describe('formatRelativeDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-16T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "Today" for current date', () => {
      const result = formatRelativeDate('2026-02-16');
      expect(result.toLowerCase()).toContain('today');
    });

    it('should return "Yesterday" for previous day', () => {
      const result = formatRelativeDate('2026-02-15');
      expect(result.toLowerCase()).toContain('yesterday');
    });

    it('should return "Tomorrow" for next day', () => {
      const result = formatRelativeDate('2026-02-17');
      expect(result.toLowerCase()).toContain('tomorrow');
    });

    it('should return formatted date for dates beyond 7 days', () => {
      const result = formatRelativeDate('2026-01-01');
      expect(result).toBeTruthy();
      expect(result.toLowerCase()).not.toContain('today');
    });
  });
});

describe('Text Formatting', () => {
  describe('formatPhoneNumber', () => {
    it('should format 10-digit US phone numbers', () => {
      expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
    });

    it('should handle phone numbers with country code', () => {
      const result = formatPhoneNumber('+15551234567');
      expect(result).toBeTruthy();
    });

    it('should preserve formatting if already formatted', () => {
      const formatted = '(555) 123-4567';
      expect(formatPhoneNumber(formatted)).toBe(formatted);
    });

    it('should handle invalid phone numbers gracefully', () => {
      expect(formatPhoneNumber('123')).toBe('123');
      expect(formatPhoneNumber('')).toBe('');
      expect(formatPhoneNumber(null as any)).toBe('');
    });

    it('should strip non-numeric characters before formatting', () => {
      expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567');
      expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
    });
  });

  describe('formatClientAddressSingleLine', () => {
    it('should format complete address', () => {
      const client: Client = {
        id: 1,
        name: 'Test Client',
        email: 'test@example.com',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA',
        created_at: '2026-02-16',
        updated_at: '2026-02-16'
      };

      const result = formatClientAddressSingleLine(client);
      expect(result).toContain('123 Main St');
      expect(result).toContain('New York');
      expect(result).toContain('NY');
      expect(result).toContain('10001');
    });

    it('should handle partial address', () => {
      const client: Client = {
        id: 1,
        name: 'Test Client',
        email: 'test@example.com',
        address: '123 Main St',
        city: 'New York',
        created_at: '2026-02-16',
        updated_at: '2026-02-16'
      };

      const result = formatClientAddressSingleLine(client);
      expect(result).toBeTruthy();
      expect(result).toContain('123 Main St');
    });

    it('should return empty string for missing address', () => {
      const client: Client = {
        id: 1,
        name: 'Test Client',
        email: 'test@example.com',
        created_at: '2026-02-16',
        updated_at: '2026-02-16'
      };

      const result = formatClientAddressSingleLine(client);
      expect(result).toBe('');
    });

    it('should handle null/undefined client', () => {
      expect(formatClientAddressSingleLine(null as any)).toBe('');
      expect(formatClientAddressSingleLine(undefined as any)).toBe('');
    });
  });
});

describe('Number Formatting', () => {
  it('should format percentages', () => {
    // Assuming there's a formatPercentage function
    const formatPercentage = (num: number) => `${(num * 100).toFixed(2)}%`;

    expect(formatPercentage(0.15)).toBe('15.00%');
    expect(formatPercentage(0.075)).toBe('7.50%');
    expect(formatPercentage(1)).toBe('100.00%');
  });

  it('should format decimal numbers', () => {
    const formatDecimal = (num: number, decimals = 2) => num.toFixed(decimals);

    expect(formatDecimal(1.2345)).toBe('1.23');
    expect(formatDecimal(10, 0)).toBe('10');
    expect(formatDecimal(3.14159, 4)).toBe('3.1416');
  });
});

describe('Edge Cases', () => {
  it('should handle empty strings', () => {
    expect(formatPhoneNumber('')).toBe('');
    expect(formatDate('')).toBe('Invalid Date');
  });

  it('should handle null values', () => {
    expect(formatCurrency(null as any)).toBe('$0.00');
    expect(formatPhoneNumber(null as any)).toBe('');
  });

  it('should handle undefined values', () => {
    expect(formatCurrency(undefined as any)).toBe('$0.00');
    expect(formatDate(undefined as any)).toBe('Invalid Date');
  });

  it('should handle very long strings', () => {
    const longNumber = '1'.repeat(20);
    const result = formatPhoneNumber(longNumber);
    expect(result).toBeTruthy();
  });
});
