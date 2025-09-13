// Invoice numbering utilities that respect user settings

import { invoiceOperations } from '@/lib/database';
import { sqliteService } from '@/services/sqlite.svc';
import type { InvoiceNumberSettings } from '@/types';
import { DEFAULT_INVOICE_NUMBER_SETTINGS, SUGGESTED_INVOICE_PREFIXES } from '@/types';

// Re-export constants for backward compatibility
export { DEFAULT_INVOICE_NUMBER_SETTINGS };

// Get current invoice number settings from SQLite
export const getInvoiceNumberSettings = async (): Promise<InvoiceNumberSettings> => {
  try {
    // Try to access sqliteService if it's already available globally
    if (typeof window !== 'undefined' && (window as unknown as { sqliteService?: { isReady(): boolean; getSetting(key: string): Promise<unknown> } }).sqliteService?.isReady()) {
      const sqliteService = (window as unknown as { sqliteService: { getSetting(key: string): Promise<InvoiceNumberSettings | null> } }).sqliteService;
      const settings = await sqliteService.getSetting('invoice_number_settings');
      if (settings) {
        return {
          prefix: settings.prefix || DEFAULT_INVOICE_NUMBER_SETTINGS.prefix
        };
      }
    }
  } catch (error) {
    console.error('Error loading invoice number settings:', error);
  }
  return DEFAULT_INVOICE_NUMBER_SETTINGS;
};

// Save invoice number settings to SQLite
export const saveInvoiceNumberSettings = async (settings: InvoiceNumberSettings): Promise<void> => {
  try {
    await sqliteService.setSetting('invoice_number_settings', settings, 'invoice');
  } catch (error) {
    console.error('Error saving invoice number settings:', error);
  }
};

// NOTE: Invoice number generation is now handled by the server
// Client-side generation functions have been removed to prevent duplicate numbering

// Note: Invoice number validation is now handled by settingsValidation.ts

// Check if an invoice number already exists
export const isInvoiceNumberUnique = async (invoiceNumber: string, excludeId?: number): Promise<boolean> => {
  const existingInvoices = await invoiceOperations.getAll();
  return !existingInvoices.some(invoice =>
    invoice.invoice_number === invoiceNumber &&
    (excludeId === undefined || invoice.id !== excludeId)
  );
};

// Get a preview of how invoice numbers will look with the given prefix
export const getInvoiceNumberPreview = (prefix: string): string => {
  return `${prefix}-0001`;
};

// Get suggested prefixes
export const getSuggestedPrefixes = (): string[] => {
  return [...SUGGESTED_INVOICE_PREFIXES];
};
