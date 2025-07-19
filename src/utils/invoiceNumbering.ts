// Invoice numbering utilities that respect user settings

import { invoiceOperations } from '@/lib/database';
import { sqliteService } from '@/lib/sqlite-service';

export interface InvoiceNumberSettings {
  prefix: string;
}

// Default invoice number settings
export const DEFAULT_INVOICE_NUMBER_SETTINGS: InvoiceNumberSettings = {
  prefix: 'INV'
};

// Get current invoice number settings from SQLite
export const getInvoiceNumberSettings = (): InvoiceNumberSettings => {
  try {
    // Try to access sqliteService if it's already available globally
    if (typeof window !== 'undefined' && (window as any).sqliteService && (window as any).sqliteService.isReady()) {
      const settings = (window as any).sqliteService.getSetting('invoice_number_settings');
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
export const saveInvoiceNumberSettings = (settings: InvoiceNumberSettings): void => {
  try {
    sqliteService.setSetting('invoice_number_settings', settings, 'invoice');
  } catch (error) {
    console.error('Error saving invoice number settings:', error);
  }
};

// Generate a new invoice number using the current settings
export const generateInvoiceNumber = async (): Promise<string> => {
  const settings = getInvoiceNumberSettings();
  const existingInvoices = await invoiceOperations.getAll();

  // Find the highest number for the current prefix
  let maxNumber = 0;
  const prefixPattern = new RegExp(`^${settings.prefix}-?(\\d+)$`, 'i');

  existingInvoices.forEach(invoice => {
    if (invoice.invoice_number) {
      const match = invoice.invoice_number.match(prefixPattern);
      if (match) {
        const number = parseInt(match[1], 10);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    }
  });

  // Generate the next number
  const nextNumber = maxNumber + 1;
  return `${settings.prefix}-${String(nextNumber).padStart(4, '0')}`;
};

// Generate a temporary invoice number for new invoices (before saving)
export const generateTemporaryInvoiceNumber = (): string => {
  const settings = getInvoiceNumberSettings();
  return `${settings.prefix}-${Date.now()}`;
};

// Validate an invoice number format
export const validateInvoiceNumber = (invoiceNumber: string): boolean => {
  if (!invoiceNumber || invoiceNumber.trim() === '') {
    return false;
  }
  
  // Allow any format, but it should not be empty
  return invoiceNumber.trim().length > 0;
};

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
  return [
    'INV',
    'INVOICE',
    'BILL',
    'REC',
    'RECEIPT'
  ];
};
