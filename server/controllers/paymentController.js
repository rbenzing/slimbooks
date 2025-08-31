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
  
  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) as count FROM payments';
  if (conditions.length > 0) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }
  
  const totalCount = db.prepare(countQuery).get(...params.slice(0, -2));
  
  res.json({ 
    success: true, 
    data: {
      payments,
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
 * Get payment by ID
 */
export const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);

  if (!payment) {
    throw new NotFoundError('Payment');
  }

  res.json({ success: true, data: payment });
});

/**
 * Create new payment
 */
export const createPayment = asyncHandler(async (req, res) => {
  const { paymentData } = req.body;

  if (!paymentData || !paymentData.date || !paymentData.client_name || !paymentData.amount || !paymentData.method) {
    throw new ValidationError('Invalid payment data - date, client_name, amount, and method are required');
  }

  // Validate amount is positive
  if (paymentData.amount <= 0) {
    throw new ValidationError('Amount must be positive');
  }

  // Get next ID
  const counterResult = db.prepare('SELECT value FROM counters WHERE name = ?').get('payments');
  const nextId = (counterResult?.value || 0) + 1;
  db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(nextId, 'payments');

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO payments (id, date, client_name, invoice_id, amount, method, reference, description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    nextId,
    paymentData.date,
    paymentData.client_name,
    paymentData.invoice_id || null,
    paymentData.amount,
    paymentData.method,
    paymentData.reference || null,
    paymentData.description || '',
    paymentData.status || 'received',
    now,
    now
  );

  res.status(201).json({ 
    success: true, 
    data: { id: nextId },
    message: 'Payment created successfully'
  });
});

/**
 * Update payment
 */
export const updatePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentData } = req.body;

  if (!id || !paymentData) {
    throw new ValidationError('Invalid parameters');
  }

  // Check if payment exists
  const existingPayment = db.prepare('SELECT id FROM payments WHERE id = ?').get(id);
  if (!existingPayment) {
    throw new NotFoundError('Payment');
  }

  // Validate amount if provided
  if (paymentData.amount !== undefined && paymentData.amount <= 0) {
    throw new ValidationError('Amount must be positive');
  }

  // Build dynamic update query
  const updateFields = [];
  const values = [];
  
  Object.keys(paymentData).forEach(key => {
    if (paymentData[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      values.push(paymentData[key]);
    }
  });
  
  if (updateFields.length === 0) {
    throw new ValidationError('No fields to update');
  }
  
  updateFields.push('updated_at = datetime("now")');
  values.push(id);

  const stmt = db.prepare(`UPDATE payments SET ${updateFields.join(', ')} WHERE id = ?`);
  const result = stmt.run(values);

  res.json({ 
    success: true, 
    data: { changes: result.changes },
    message: 'Payment updated successfully'
  });
});

/**
 * Delete payment
 */
export const deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if payment exists
  const existingPayment = db.prepare('SELECT id FROM payments WHERE id = ?').get(id);
  if (!existingPayment) {
    throw new NotFoundError('Payment');
  }
  
  const stmt = db.prepare('DELETE FROM payments WHERE id = ?');
  const result = stmt.run(id);

  res.json({ 
    success: true, 
    data: { changes: result.changes },
    message: 'Payment deleted successfully'
  });
});

/**
 * Bulk delete payments
 */
export const bulkDeletePayments = asyncHandler(async (req, res) => {
  const { payment_ids } = req.body;

  if (!payment_ids || !Array.isArray(payment_ids) || payment_ids.length === 0) {
    throw new ValidationError('payment_ids must be a non-empty array');
  }

  if (payment_ids.length > 500) {
    throw new ValidationError('Maximum 500 payments can be deleted at once');
  }

  // Validate all payment IDs exist
  const placeholders = payment_ids.map(() => '?').join(',');
  const existingPayments = db.prepare(`SELECT id FROM payments WHERE id IN (${placeholders})`).all(...payment_ids);
  
  if (existingPayments.length !== payment_ids.length) {
    throw new ValidationError('One or more payment IDs not found');
  }

  // Delete all payments
  const stmt = db.prepare(`DELETE FROM payments WHERE id IN (${placeholders})`);
  const result = stmt.run(...payment_ids);

  res.json({ 
    success: true, 
    data: { changes: result.changes },
    message: `${result.changes} payments deleted successfully`
  });
});

/**
 * Get payment statistics
 */
export const getPaymentStats = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  
  let dateFilter = '';
  const params = [];
  
  if (year) {
    if (month) {
      dateFilter = "WHERE strftime('%Y-%m', date) = ?";
      params.push(`${year}-${month.padStart(2, '0')}`);
    } else {
      dateFilter = "WHERE strftime('%Y', date) = ?";
      params.push(year);
    }
  }
  
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_payments,
      SUM(amount) as total_amount,
      AVG(amount) as average_amount,
      COUNT(CASE WHEN status = 'received' THEN 1 END) as received_count,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
      COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_count,
      SUM(CASE WHEN status = 'received' THEN amount ELSE 0 END) as received_amount,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount
    FROM payments ${dateFilter}
  `).get(...params);
  
  // Get method breakdown
  const methodStats = db.prepare(`
    SELECT 
      method,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      AVG(amount) as average_amount
    FROM payments ${dateFilter}
    GROUP BY method
    ORDER BY total_amount DESC
  `).all(...params);
  
  // Get monthly trends (last 12 months)
  const monthlyTrends = db.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      COUNT(*) as count,
      SUM(amount) as total_amount
    FROM payments
    WHERE date >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
  `).all();

  res.json({ 
    success: true, 
    data: {
      summary: stats,
      methods: methodStats,
      monthlyTrends
    }
  });
});