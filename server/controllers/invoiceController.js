// Invoice controller for Slimbooks
// Handles all invoice-related business logic

import { invoiceService } from '../services/InvoiceService.js';
import {
  AppError,
  NotFoundError,
  ValidationError,
  asyncHandler
} from '../middleware/index.js';

/**
 * Get all invoices
 */
export const getAllInvoices = asyncHandler(async (req, res) => {
  const { status, client_id, limit = 50, offset = 0 } = req.query;
  
  const filters = { status, client_id };
  const results = await invoiceService.getAllInvoices(filters, limit, offset);
  
  res.json({ 
    success: true, 
    data: results
  });
});

/**
 * Get invoice by ID
 */
export const getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const invoice = await invoiceService.getInvoiceById(id);

  if (!invoice) {
    throw new NotFoundError('Invoice');
  }

  res.json({ success: true, data: invoice });
});

/**
 * Get public invoice by ID with secure token validation
 * Security features:
 * - Cryptographically secure tokens
 * - Token expiration (24 hours)
 * - Rate limiting
 * - Consistent error responses (no information disclosure)
 */
export const getPublicInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { token } = req.query;

  // Consistent error response to prevent information disclosure
  const unauthorizedResponse = () => {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired invoice link'
    });
  };

  try {
    const invoiceData = await invoiceService.getPublicInvoiceById(id, token);
    res.json({ success: true, data: invoiceData });
  } catch (error) {
    // Don't leak error details for security
    return unauthorizedResponse();
  }
});

/**
 * Generate secure public token for invoice
 * Creates a JWT token with 24-hour expiration
 */
export const generatePublicInvoiceToken = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const tokenData = await invoiceService.generatePublicInvoiceToken(id);
    res.json({
      success: true,
      data: tokenData
    });
  } catch (error) {
    if (error.message === 'Invoice not found') {
      throw new NotFoundError('Invoice');
    }
    throw new AppError(error.message, 500);
  }
});

/**
 * Create new invoice
 */
export const createInvoice = asyncHandler(async (req, res) => {
  const { invoiceData } = req.body;

  if (!invoiceData) {
    throw new ValidationError('Invoice data is required');
  }

  try {
    const invoiceId = await invoiceService.createInvoice(invoiceData);
    
    res.status(201).json({ 
      success: true, 
      data: { id: invoiceId },
      message: 'Invoice created successfully'
    });
  } catch (error) {
    throw new ValidationError(error.message);
  }
});

/**
 * Update invoice
 */
export const updateInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { invoiceData } = req.body;

  if (!id || !invoiceData) {
    throw new ValidationError('Invalid parameters');
  }

  try {
    const changes = await invoiceService.updateInvoice(id, invoiceData);
    
    res.json({ 
      success: true, 
      data: { changes },
      message: 'Invoice updated successfully'
    });
  } catch (error) {
    if (error.message === 'Invoice not found') {
      throw new NotFoundError('Invoice');
    }
    throw new ValidationError(error.message);
  }
});

/**
 * Delete invoice
 */
export const deleteInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const changes = await invoiceService.deleteInvoice(id);
    
    res.json({ 
      success: true, 
      data: { changes },
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Invoice not found') {
      throw new NotFoundError('Invoice');
    }
    throw new ValidationError(error.message);
  }
});

/**
 * Get invoice statistics
 */
export const getInvoiceStats = asyncHandler(async (req, res) => {
  const stats = await invoiceService.getInvoiceStats();
  res.json({ success: true, data: stats });
});

/**
 * Update invoice status
 */
export const updateInvoiceStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const changes = await invoiceService.updateInvoiceStatus(id, status);
    
    res.json({ 
      success: true, 
      data: { changes },
      message: `Invoice status updated to ${status}`
    });
  } catch (error) {
    if (error.message === 'Invoice not found') {
      throw new NotFoundError('Invoice');
    }
    throw new ValidationError(error.message);
  }
});

/**
 * Mark invoice as sent
 */
export const markInvoiceAsSent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email_sent_at } = req.body;

  const changes = await invoiceService.markInvoiceAsSent(id, email_sent_at);

  res.json({ 
    success: true, 
    data: { changes },
    message: 'Invoice marked as sent'
  });
});

/**
 * Get overdue invoices
 */
export const getOverdueInvoices = asyncHandler(async (req, res) => {
  const overdueInvoices = await invoiceService.getOverdueInvoices();
  res.json({ success: true, data: overdueInvoices });
});
