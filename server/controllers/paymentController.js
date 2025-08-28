// Payment controller for Slimbooks
// Handles all payment-related business logic

import { db } from '../models/index.js';
import { 
  AppError, 
  NotFoundError, 
  ValidationError,
  asyncHandler
} from '../middleware/index.js';

/**
 * Get all payments
 */
export const getAllPayments = asyncHandler(async (req, res) => {
  const { status, method, date_from, date_to, limit = 50, offset = 0 } = req.query;
  
  let query = 'SELECT * FROM payments';
  const conditions = [];
  const params = [];
  
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  
  if (method) {
    conditions.push('method = ?');
    params.push(method);
  }
  
  if (date_from) {
    conditions.push('date >= ?');
    params.push(date_from);
  }
  
  if (date_to) {
    conditions.push('date <= ?');
    params.push(date_to);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const payments = db.prepare(query).all(...params);
  
  res.json({
    success: true,
    data: { payments },
    message: 'Payments retrieved successfully'
  });
});

/**
 * Get payment by ID
 */
export const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
  
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }
  
  res.json({
    success: true,
    data: payment,
    message: 'Payment retrieved successfully'
  });
});

/**
 * Create new payment
 */
export const createPayment = asyncHandler(async (req, res) => {
  const { paymentData } = req.body;
  
  // Validate required fields
  if (!paymentData.date || !paymentData.client_name || !paymentData.amount || !paymentData.method) {
    throw new ValidationError('Date, client name, amount, and payment method are required');
  }
  
  // Validate amount
  const amount = parseFloat(paymentData.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new ValidationError('Amount must be a positive number');
  }
  
  // Insert payment
  const insertPayment = db.prepare(`
    INSERT INTO payments (date, client_name, invoice_id, amount, method, reference, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = insertPayment.run(
    paymentData.date,
    paymentData.client_name,
    paymentData.invoice_id || null,
    amount,
    paymentData.method,
    paymentData.reference || null,
    paymentData.description || null,
    paymentData.status || 'received'
  );
  
  const newPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid);
  
  res.status(201).json({
    success: true,
    data: newPayment,
    message: 'Payment created successfully'
  });
});

/**
 * Update payment
 */
export const updatePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentData } = req.body;
  
  // Check if payment exists
  const existingPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
  if (!existingPayment) {
    throw new NotFoundError('Payment not found');
  }
  
  // Validate amount if provided
  if (paymentData.amount !== undefined) {
    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new ValidationError('Amount must be a positive number');
    }
  }
  
  // Update payment
  const updatePaymentStmt = db.prepare(`
    UPDATE payments 
    SET date = COALESCE(?, date),
        client_name = COALESCE(?, client_name),
        invoice_id = COALESCE(?, invoice_id),
        amount = COALESCE(?, amount),
        method = COALESCE(?, method),
        reference = COALESCE(?, reference),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        updated_at = datetime('now')
    WHERE id = ?
  `);
  
  updatePaymentStmt.run(
    paymentData.date || null,
    paymentData.client_name || null,
    paymentData.invoice_id || null,
    paymentData.amount || null,
    paymentData.method || null,
    paymentData.reference || null,
    paymentData.description || null,
    paymentData.status || null,
    id
  );
  
  const updatedPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
  
  res.json({
    success: true,
    data: updatedPayment,
    message: 'Payment updated successfully'
  });
});

/**
 * Delete payment
 */
export const deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }
  
  db.prepare('DELETE FROM payments WHERE id = ?').run(id);
  
  res.json({
    success: true,
    message: 'Payment deleted successfully'
  });
});

/**
 * Bulk delete payments
 */
export const bulkDeletePayments = asyncHandler(async (req, res) => {
  const { payment_ids } = req.body;
  
  if (!payment_ids || !Array.isArray(payment_ids) || payment_ids.length === 0) {
    throw new ValidationError('Payment IDs array is required');
  }
  
  const placeholders = payment_ids.map(() => '?').join(',');
  const query = `DELETE FROM payments WHERE id IN (${placeholders})`;
  
  const result = db.prepare(query).run(...payment_ids);
  
  res.json({
    success: true,
    data: { deleted_count: result.changes },
    message: `${result.changes} payment(s) deleted successfully`
  });
});

/**
 * Get payment statistics
 */
export const getPaymentStats = asyncHandler(async (req, res) => {
  const { date_from, date_to } = req.query;
  
  let conditions = [];
  let params = [];
  
  if (date_from) {
    conditions.push('date >= ?');
    params.push(date_from);
  }
  
  if (date_to) {
    conditions.push('date <= ?');
    params.push(date_to);
  }
  
  const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  
  // Total payments
  const totalPayments = db.prepare(`
    SELECT COUNT(*) as count, SUM(amount) as total_amount 
    FROM payments${whereClause}
  `).get(...params);
  
  // Payments by method
  const paymentsByMethod = db.prepare(`
    SELECT method, COUNT(*) as count, SUM(amount) as total_amount 
    FROM payments${whereClause}
    GROUP BY method
    ORDER BY total_amount DESC
  `).all(...params);
  
  // Payments by status
  const paymentsByStatus = db.prepare(`
    SELECT status, COUNT(*) as count, SUM(amount) as total_amount 
    FROM payments${whereClause}
    GROUP BY status
    ORDER BY total_amount DESC
  `).all(...params);
  
  res.json({
    success: true,
    data: {
      total: totalPayments,
      by_method: paymentsByMethod,
      by_status: paymentsByStatus
    },
    message: 'Payment statistics retrieved successfully'
  });
});