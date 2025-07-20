// Invoice controller for Slimbooks
// Handles all invoice-related business logic

import { db } from '../models/index.js';
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
  
  let query = `
    SELECT i.*, c.name as client_name, c.email as client_email 
    FROM invoices i 
    LEFT JOIN clients c ON i.client_id = c.id
  `;
  
  const conditions = [];
  const params = [];
  
  if (status) {
    conditions.push('i.status = ?');
    params.push(status);
  }
  
  if (client_id) {
    conditions.push('i.client_id = ?');
    params.push(client_id);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const invoices = db.prepare(query).all(...params);
  
  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) as count FROM invoices i';
  if (conditions.length > 0) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }
  
  const totalCount = db.prepare(countQuery).get(...params.slice(0, -2));
  
  res.json({ 
    success: true, 
    data: {
      invoices,
      pagination: {
        total: totalCount.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount.count > parseInt(offset) + parseInt(limit)
      }
    }
  });
});

/**
 * Get invoice by ID
 */
export const getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const invoice = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email, c.company as client_company,
           c.address as client_address, c.city as client_city, c.state as client_state,
           c.zipCode as client_zipCode, c.country as client_country, c.phone as client_phone
    FROM invoices i 
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = ?
  `).get(id);

  if (!invoice) {
    throw new NotFoundError('Invoice');
  }

  res.json({ success: true, data: invoice });
});

/**
 * Create new invoice
 */
export const createInvoice = asyncHandler(async (req, res) => {
  const { invoiceData } = req.body;

  if (!invoiceData || !invoiceData.invoice_number || !invoiceData.client_id || !invoiceData.amount) {
    throw new ValidationError('Invalid invoice data - invoice_number, client_id, and amount are required');
  }

  // Check if client exists
  const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(invoiceData.client_id);
  if (!client) {
    throw new ValidationError('Client not found');
  }

  // Check if invoice number already exists
  const existingInvoice = db.prepare('SELECT id FROM invoices WHERE invoice_number = ?').get(invoiceData.invoice_number);
  if (existingInvoice) {
    throw new ValidationError('Invoice number already exists');
  }

  // Get next ID
  const counterResult = db.prepare('SELECT value FROM counters WHERE name = ?').get('invoices');
  const nextId = (counterResult?.value || 0) + 1;
  db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(nextId, 'invoices');

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO invoices (
      id, invoice_number, client_id, template_id, amount, tax_amount, total_amount, 
      status, due_date, issue_date, description, items, notes, payment_terms,
      stripe_invoice_id, stripe_payment_intent_id, type, client_name, client_email,
      client_phone, client_address, line_items, tax_rate_id, shipping_amount,
      shipping_rate_id, email_status, email_sent_at, email_error, last_email_attempt,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    nextId,
    invoiceData.invoice_number,
    invoiceData.client_id,
    invoiceData.template_id || null,
    invoiceData.amount,
    invoiceData.tax_amount || 0,
    invoiceData.total_amount || invoiceData.amount,
    invoiceData.status || 'draft',
    invoiceData.due_date,
    invoiceData.issue_date,
    invoiceData.description || '',
    invoiceData.items || null,
    invoiceData.notes || '',
    invoiceData.payment_terms || '',
    invoiceData.stripe_invoice_id || null,
    invoiceData.stripe_payment_intent_id || null,
    invoiceData.type || 'one-time',
    invoiceData.client_name || null,
    invoiceData.client_email || null,
    invoiceData.client_phone || null,
    invoiceData.client_address || null,
    invoiceData.line_items || null,
    invoiceData.tax_rate_id || null,
    invoiceData.shipping_amount || 0,
    invoiceData.shipping_rate_id || null,
    invoiceData.email_status || 'not_sent',
    invoiceData.email_sent_at || null,
    invoiceData.email_error || null,
    invoiceData.last_email_attempt || null,
    now,
    now
  );

  res.status(201).json({ 
    success: true, 
    data: { id: nextId },
    message: 'Invoice created successfully'
  });
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

  // Check if invoice exists
  const existingInvoice = db.prepare('SELECT id FROM invoices WHERE id = ?').get(id);
  if (!existingInvoice) {
    throw new NotFoundError('Invoice');
  }

  // If invoice number is being updated, check for duplicates
  if (invoiceData.invoice_number) {
    const numberExists = db.prepare('SELECT id FROM invoices WHERE invoice_number = ? AND id != ?').get(invoiceData.invoice_number, id);
    if (numberExists) {
      throw new ValidationError('Another invoice with this number already exists');
    }
  }

  // If client_id is being updated, check if client exists
  if (invoiceData.client_id) {
    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(invoiceData.client_id);
    if (!client) {
      throw new ValidationError('Client not found');
    }
  }

  // Build dynamic update query
  const updateFields = [];
  const values = [];
  
  Object.keys(invoiceData).forEach(key => {
    if (invoiceData[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      values.push(invoiceData[key]);
    }
  });
  
  if (updateFields.length === 0) {
    throw new ValidationError('No fields to update');
  }
  
  updateFields.push('updated_at = datetime("now")');
  values.push(id);

  const stmt = db.prepare(`UPDATE invoices SET ${updateFields.join(', ')} WHERE id = ?`);
  const result = stmt.run(values);

  res.json({ 
    success: true, 
    data: { changes: result.changes },
    message: 'Invoice updated successfully'
  });
});

/**
 * Delete invoice
 */
export const deleteInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if invoice exists
  const existingInvoice = db.prepare('SELECT id, status FROM invoices WHERE id = ?').get(id);
  if (!existingInvoice) {
    throw new NotFoundError('Invoice');
  }
  
  // Prevent deletion of paid invoices
  if (existingInvoice.status === 'paid') {
    throw new ValidationError('Cannot delete paid invoices');
  }
  
  const stmt = db.prepare('DELETE FROM invoices WHERE id = ?');
  const result = stmt.run(id);

  res.json({ 
    success: true, 
    data: { changes: result.changes },
    message: 'Invoice deleted successfully'
  });
});

/**
 * Get invoice statistics
 */
export const getInvoiceStats = asyncHandler(async (req, res) => {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_invoices,
      SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as total_paid,
      SUM(CASE WHEN status = 'sent' THEN total_amount ELSE 0 END) as total_pending,
      SUM(CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END) as total_overdue,
      SUM(CASE WHEN status = 'draft' THEN total_amount ELSE 0 END) as total_draft,
      AVG(total_amount) as average_amount,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
      COUNT(CASE WHEN status = 'sent' THEN 1 END) as pending_count,
      COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
      COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count
    FROM invoices
  `).get();

  res.json({ success: true, data: stats });
});

/**
 * Update invoice status
 */
export const updateInvoiceStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(status)) {
    throw new ValidationError('Invalid status');
  }

  // Check if invoice exists
  const existingInvoice = db.prepare('SELECT id FROM invoices WHERE id = ?').get(id);
  if (!existingInvoice) {
    throw new NotFoundError('Invoice');
  }

  const stmt = db.prepare(`
    UPDATE invoices 
    SET status = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  
  const result = stmt.run(status, id);

  res.json({ 
    success: true, 
    data: { changes: result.changes },
    message: `Invoice status updated to ${status}`
  });
});

/**
 * Mark invoice as sent
 */
export const markInvoiceAsSent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email_sent_at } = req.body;

  const stmt = db.prepare(`
    UPDATE invoices 
    SET status = 'sent', email_status = 'sent', email_sent_at = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  
  const result = stmt.run(email_sent_at || new Date().toISOString(), id);

  res.json({ 
    success: true, 
    data: { changes: result.changes },
    message: 'Invoice marked as sent'
  });
});

/**
 * Get overdue invoices
 */
export const getOverdueInvoices = asyncHandler(async (req, res) => {
  const overdueInvoices = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.status IN ('sent', 'overdue') AND i.due_date < date('now')
    ORDER BY i.due_date ASC
  `).all();

  res.json({ success: true, data: overdueInvoices });
});
