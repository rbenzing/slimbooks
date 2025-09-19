// Invoice validation utilities for ensuring invoices are ready to send

import { Client, LineItem } from '@/types';

interface InvoiceValidationResult {
  isValid: boolean;
  canSend: boolean;
  canPrint: boolean;
  errors: string[];
  warnings: string[];
}

interface InvoiceData {
  invoice_number: string;
  due_date: string;
  status: string;
}

/**
 * Validates if an invoice is ready to be saved
 */
export const validateInvoiceForSave = (
  invoiceData: InvoiceData,
  selectedClient: Client | null,
  lineItems: LineItem[],
  isNewInvoice: boolean = false
): InvoiceValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if client is selected
  if (!selectedClient) {
    errors.push('Please select a client');
  }

  // Check if invoice number exists (only for existing invoices)
  if (!isNewInvoice && (!invoiceData.invoice_number || invoiceData.invoice_number.trim() === '')) {
    errors.push('Invoice number is required');
  }

  // Check if at least one line item exists with description and amount
  const validLineItems = lineItems.filter(item =>
    item.description.trim() !== '' && item.unit_price > 0
  );

  if (validLineItems.length === 0) {
    errors.push('At least one line item with description and amount is required');
  }

  // Check for line items with missing descriptions
  const itemsWithoutDescription = lineItems.filter(item =>
    item.description.trim() === '' && item.unit_price > 0
  );
  if (itemsWithoutDescription.length > 0) {
    warnings.push('Some line items have amounts but no description');
  }

  // Check for line items with zero amounts
  const itemsWithZeroAmount = lineItems.filter(item => 
    item.description.trim() !== '' && item.unit_price > 0
  );
  if (itemsWithZeroAmount.length > 0) {
    warnings.push('Some line items have descriptions but zero amount');
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    canSend: false, // Will be determined by validateInvoiceForSend
    canPrint: isValid,
    errors,
    warnings
  };
};

/**
 * Validates if an invoice is ready to be sent via email
 */
export const validateInvoiceForSend = (
  invoiceData: InvoiceData,
  selectedClient: Client | null,
  lineItems: LineItem[],
  isNewInvoice: boolean = false
): InvoiceValidationResult => {
  // First check basic validation
  const basicValidation = validateInvoiceForSave(invoiceData, selectedClient, lineItems, isNewInvoice);
  
  const errors = [...basicValidation.errors];
  const warnings = [...basicValidation.warnings];

  // Additional checks for sending
  if (selectedClient) {
    // Check if client has email address
    if (!selectedClient.email || selectedClient.email.trim() === '') {
      errors.push('Client must have an email address to send invoice');
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(selectedClient.email)) {
        errors.push('Client email address is not valid');
      }
    }
  }

  // Due date will be auto-defaulted to today when sending, so no need to block here

  const isValid = basicValidation.isValid && errors.length === basicValidation.errors.length;
  const canSend = isValid && errors.length === 0;

  return {
    isValid: basicValidation.isValid,
    canSend,
    canPrint: basicValidation.canPrint,
    errors,
    warnings
  };
};

/**
 * Validates if an invoice can be printed (when client has no email)
 */
export const validateInvoiceForPrint = (
  invoiceData: InvoiceData,
  selectedClient: Client | null,
  lineItems: LineItem[],
  isNewInvoice: boolean = false
): InvoiceValidationResult => {
  const basicValidation = validateInvoiceForSave(invoiceData, selectedClient, lineItems, isNewInvoice);
  
  return {
    ...basicValidation,
    canSend: false,
    canPrint: basicValidation.isValid
  };
};

/**
 * Determines what actions are available for an invoice based on its current state
 */
export const getAvailableInvoiceActions = (
  invoiceData: InvoiceData,
  selectedClient: Client | null,
  lineItems: LineItem[],
  isNewInvoice: boolean = false
): {
  canSave: boolean;
  canSend: boolean;
  canPrint: boolean;
  canDelete: boolean;
  showSendButton: boolean;
  showPrintButton: boolean;
  sendButtonDisabled: boolean;
  printButtonDisabled: boolean;
} => {
  const saveValidation = validateInvoiceForSave(invoiceData, selectedClient, lineItems, isNewInvoice);
  const sendValidation = validateInvoiceForSend(invoiceData, selectedClient, lineItems, isNewInvoice);
  
  const hasClientEmail = selectedClient?.email && selectedClient.email.trim() !== '';
  const isDueDateInFuture = invoiceData.due_date && new Date(invoiceData.due_date) > new Date();
  const isDueDatePast = invoiceData.due_date && new Date(invoiceData.due_date) < new Date();

  return {
    canSave: saveValidation.isValid,
    canSend: sendValidation.canSend,
    canPrint: saveValidation.canPrint,
    canDelete: true, // Can always delete (with confirmation)
    showSendButton: hasClientEmail,
    showPrintButton: !hasClientEmail,
    sendButtonDisabled: !sendValidation.canSend,
    printButtonDisabled: !saveValidation.canPrint
  };
};

/**
 * Gets validation messages for display to user
 */
export const getValidationMessages = (
  invoiceData: InvoiceData,
  selectedClient: Client | null,
  lineItems: LineItem[],
  isNewInvoice: boolean = false
): {
  saveMessages: string[];
  sendMessages: string[];
  printMessages: string[];
} => {
  const saveValidation = validateInvoiceForSave(invoiceData, selectedClient, lineItems, isNewInvoice);
  const sendValidation = validateInvoiceForSend(invoiceData, selectedClient, lineItems, isNewInvoice);
  const printValidation = validateInvoiceForPrint(invoiceData, selectedClient, lineItems, isNewInvoice);

  return {
    saveMessages: [...saveValidation.errors, ...saveValidation.warnings],
    sendMessages: [...sendValidation.errors, ...sendValidation.warnings],
    printMessages: [...printValidation.errors, ...printValidation.warnings]
  };
};

/**
 * Auto-fills missing required fields where possible
 */
export const autoFillInvoiceDefaults = (
  invoiceData: InvoiceData
): InvoiceData => {
  const updatedData = { ...invoiceData };

  // Auto-set due date to today if not set and we're trying to send
  if (!updatedData.due_date || updatedData.due_date.trim() === '') {
    updatedData.due_date = new Date().toISOString().split('T')[0];
  }

  return updatedData;
};

/**
 * Checks if an invoice status allows certain operations
 */
export const getInvoiceStatusPermissions = (status: string, dueDate: string) => {
  const today = new Date();
  const due = new Date(dueDate);
  const isDueDateFuture = due > today;
  const isDueDatePast = due < today;

  switch (status.toLowerCase()) {
    case 'draft':
      return {
        canEdit: true,
        canSave: true,
        canSend: true,
        canDelete: true,
        showDeleteOnly: false
      };
    
    case 'sent':
      return {
        canEdit: true,
        canSave: true,
        canSend: true, // Allow resending
        canDelete: true,
        showDeleteOnly: false
      };
    
    case 'paid':
      return {
        canEdit: true,
        canSave: true,
        canSend: true, // Allow resending receipts
        canDelete: true,
        showDeleteOnly: false
      };
    
    case 'overdue':
      if (isDueDatePast) {
        return {
          canEdit: true,
          canSave: true,
          canSend: true,
          canDelete: true,
          showDeleteOnly: false
        };
      }
      return {
        canEdit: true,
        canSave: true,
        canSend: true,
        canDelete: true,
        showDeleteOnly: false
      };
    
    default:
      return {
        canEdit: true,
        canSave: true,
        canSend: true,
        canDelete: true,
        showDeleteOnly: false
      };
  }
};
