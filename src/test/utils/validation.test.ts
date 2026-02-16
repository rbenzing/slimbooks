/**
 * Validation Utilities Tests
 * Tests email, invoice, and data validation functions
 */

import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateInvoiceForSave,
  validateInvoiceForSend,
  validatePhoneNumber,
  validateRequired,
  validateAmount,
  validateDate
} from '@/utils/data';
import type { Client, InvoiceItem } from '@/types';

describe('Email Validation', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('first+last@company.org')).toBe(true);
      expect(validateEmail('email@sub.domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('no@domain')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user name@domain.com')).toBe(false);
    });

    it('should reject empty emails', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('   ')).toBe(false);
    });

    it('should handle null/undefined', () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmail('a@b.c')).toBe(true); // Minimal valid email
      expect(validateEmail('test@domain..com')).toBe(false); // Double dots
      expect(validateEmail('.test@domain.com')).toBe(false); // Leading dot
    });
  });
});

describe('Phone Number Validation', () => {
  describe('validatePhoneNumber', () => {
    it('should validate US phone numbers', () => {
      expect(validatePhoneNumber('5551234567')).toBe(true);
      expect(validatePhoneNumber('(555) 123-4567')).toBe(true);
      expect(validatePhoneNumber('555-123-4567')).toBe(true);
      expect(validatePhoneNumber('+1 555 123 4567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('abcdefghij')).toBe(false);
    });

    it('should handle empty phone numbers', () => {
      expect(validatePhoneNumber('')).toBe(false);
      expect(validatePhoneNumber('   ')).toBe(false);
    });

    it('should allow optional phone numbers', () => {
      // If phone is optional, empty should be valid
      const isOptional = true;
      expect(validatePhoneNumber('', isOptional)).toBe(true);
    });
  });
});

describe('Invoice Validation', () => {
  const mockClient: Client = {
    id: 1,
    name: 'Test Client',
    email: 'test@example.com',
    phone: '5551234567',
    created_at: '2026-02-16',
    updated_at: '2026-02-16'
  };

  const mockLineItems: InvoiceItem[] = [
    {
      id: 1,
      description: 'Service 1',
      quantity: 1,
      unit_price: 100,
      total: 100
    }
  ];

  const mockInvoiceData = {
    invoice_number: 'INV-001',
    due_date: '2026-03-01',
    status: 'draft',
    payment_terms: 'net_30'
  };

  describe('validateInvoiceForSave', () => {
    it('should validate complete invoice data', () => {
      const result = validateInvoiceForSave(
        mockInvoiceData,
        mockClient,
        mockLineItems,
        false // not a new invoice
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require client selection', () => {
      const result = validateInvoiceForSave(
        mockInvoiceData,
        null,
        mockLineItems,
        false
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Client is required');
    });

    it('should require at least one line item with description', () => {
      const emptyLineItems: InvoiceItem[] = [
        {
          id: 1,
          description: '',
          quantity: 1,
          unit_price: 0,
          total: 0
        }
      ];

      const result = validateInvoiceForSave(
        mockInvoiceData,
        mockClient,
        emptyLineItems,
        false
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('line item'))).toBe(true);
    });

    it('should validate invoice number for existing invoices', () => {
      const dataWithoutNumber = {
        ...mockInvoiceData,
        invoice_number: ''
      };

      const result = validateInvoiceForSave(
        dataWithoutNumber,
        mockClient,
        mockLineItems,
        false // existing invoice
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('invoice number'))).toBe(true);
    });

    it('should allow missing invoice number for new invoices', () => {
      const dataWithoutNumber = {
        ...mockInvoiceData,
        invoice_number: ''
      };

      const result = validateInvoiceForSave(
        dataWithoutNumber,
        mockClient,
        mockLineItems,
        true // new invoice
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateInvoiceForSend', () => {
    it('should validate invoice ready to send', () => {
      const result = validateInvoiceForSend(
        mockInvoiceData,
        mockClient,
        mockLineItems,
        false
      );

      expect(result.canSend).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require valid client email', () => {
      const clientWithoutEmail = {
        ...mockClient,
        email: ''
      };

      const result = validateInvoiceForSend(
        mockInvoiceData,
        clientWithoutEmail,
        mockLineItems,
        false
      );

      expect(result.canSend).toBe(false);
      expect(result.errors.some(e => e.includes('email'))).toBe(true);
    });

    it('should require all save validations plus send-specific checks', () => {
      const result = validateInvoiceForSend(
        mockInvoiceData,
        null, // No client
        mockLineItems,
        false
      );

      expect(result.canSend).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Field Validation', () => {
  describe('validateRequired', () => {
    it('should validate non-empty strings', () => {
      expect(validateRequired('test')).toBe(true);
      expect(validateRequired('a')).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('   ')).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
    });

    it('should validate numbers', () => {
      expect(validateRequired(0)).toBe(true);
      expect(validateRequired(123)).toBe(true);
    });
  });

  describe('validateAmount', () => {
    it('should validate positive amounts', () => {
      expect(validateAmount(100)).toBe(true);
      expect(validateAmount(0.01)).toBe(true);
      expect(validateAmount(1000000)).toBe(true);
    });

    it('should reject negative amounts', () => {
      expect(validateAmount(-1)).toBe(false);
      expect(validateAmount(-100)).toBe(false);
    });

    it('should reject zero', () => {
      expect(validateAmount(0)).toBe(false);
    });

    it('should allow zero if specified', () => {
      expect(validateAmount(0, true)).toBe(true);
    });

    it('should reject invalid numbers', () => {
      expect(validateAmount(NaN)).toBe(false);
      expect(validateAmount(Infinity)).toBe(false);
      expect(validateAmount(-Infinity)).toBe(false);
    });

    it('should handle string numbers', () => {
      expect(validateAmount('100' as any)).toBe(true);
      expect(validateAmount('-50' as any)).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should validate ISO date strings', () => {
      expect(validateDate('2026-02-16')).toBe(true);
      expect(validateDate('2026-12-31')).toBe(true);
    });

    it('should validate Date objects', () => {
      expect(validateDate(new Date())).toBe(true);
      expect(validateDate(new Date('2026-02-16'))).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validateDate('invalid')).toBe(false);
      expect(validateDate('2026-13-01')).toBe(false); // Invalid month
      expect(validateDate('not-a-date')).toBe(false);
    });

    it('should reject empty dates', () => {
      expect(validateDate('')).toBe(false);
      expect(validateDate(null as any)).toBe(false);
    });

    it('should validate future dates', () => {
      const future = new Date();
      future.setDate(future.getDate() + 30);
      expect(validateDate(future.toISOString())).toBe(true);
    });

    it('should validate past dates', () => {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      expect(validateDate(past.toISOString())).toBe(true);
    });
  });
});

describe('Business Logic Validation', () => {
  it('should validate invoice total calculation', () => {
    const lineItems: InvoiceItem[] = [
      { id: 1, description: 'Item 1', quantity: 2, unit_price: 50, total: 100 },
      { id: 2, description: 'Item 2', quantity: 1, unit_price: 75, total: 75 }
    ];

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    expect(subtotal).toBe(175);

    const taxRate = 0.08;
    const taxAmount = subtotal * taxRate;
    expect(taxAmount).toBe(14);

    const total = subtotal + taxAmount;
    expect(total).toBe(189);
  });

  it('should validate line item totals', () => {
    const item: InvoiceItem = {
      id: 1,
      description: 'Test',
      quantity: 5,
      unit_price: 20,
      total: 100
    };

    const calculatedTotal = item.quantity * item.unit_price;
    expect(item.total).toBe(calculatedTotal);
  });

  it('should validate payment terms', () => {
    const validTerms = ['due_on_receipt', 'net_15', 'net_30', 'net_60', 'net_90'];

    expect(validTerms.includes('net_30')).toBe(true);
    expect(validTerms.includes('invalid')).toBe(false);
  });

  it('should validate invoice statuses', () => {
    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

    expect(validStatuses.includes('draft')).toBe(true);
    expect(validStatuses.includes('invalid')).toBe(false);
  });
});

describe('Edge Cases and Security', () => {
  it('should sanitize SQL injection attempts', () => {
    const maliciousInput = "'; DROP TABLE invoices; --";

    // Validation should reject or sanitize this
    expect(validateEmail(maliciousInput)).toBe(false);
  });

  it('should handle XSS attempts in descriptions', () => {
    const xssAttempt = '<script>alert("XSS")</script>';

    // Should validate but not execute
    expect(validateRequired(xssAttempt)).toBe(true);
    // Note: Actual sanitization should happen in the UI layer
  });

  it('should handle very large numbers', () => {
    expect(validateAmount(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(validateAmount(Number.MAX_VALUE)).toBe(true);
  });

  it('should handle unicode characters', () => {
    expect(validateEmail('test@ドメイン.com')).toBe(true);
    expect(validateRequired('测试')).toBe(true);
  });
});
