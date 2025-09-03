// Payment Service - Domain-specific service for payment operations
// Handles all payment-related business logic and database operations

import { databaseService } from './DatabaseService.js';

/**
 * Payment Service
 * Manages payment-related operations with proper validation and security
 */
export class PaymentService {
  /**
   * Get all payments with filtering and pagination
   * @param {Object} filters - Filter options (status, method, date_from, date_to)
   * @param {number} limit - Results limit
   * @param {number} offset - Results offset
   * @returns {Object} - Payments with pagination info
   */
  async getAllPayments(filters = {}, limit = 50, offset = 0) {
    const { status, method, date_from, date_to } = filters;
    
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
    
    const payments = databaseService.getMany(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM payments';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const totalCount = databaseService.getOne(countQuery, params.slice(0, -2));
    
    return {
      payments,
      pagination: {
        total: totalCount.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount.count > parseInt(offset) + parseInt(limit)
      }
    };
  }

  /**
   * Get payment by ID
   * @param {number} id - Payment ID
   * @returns {Object|null} - Payment record or null
   */
  async getPaymentById(id) {
    return databaseService.getOne('SELECT * FROM payments WHERE id = ?', [id]);
  }

  /**
   * Create new payment
   * @param {Object} paymentData - Payment data to create
   * @returns {number} - Created payment ID
   */
  async createPayment(paymentData) {
    if (!paymentData || !paymentData.date || !paymentData.client_name || !paymentData.amount || !paymentData.method) {
      throw new Error('Invalid payment data - date, client_name, amount, and method are required');
    }

    // Validate amount is positive
    if (paymentData.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Create payment in a transaction
    return databaseService.executeTransaction(() => {
      const nextId = databaseService.getNextId('payments');
      const now = new Date().toISOString();

      const insertData = {
        id: nextId,
        date: paymentData.date,
        client_name: paymentData.client_name,
        invoice_id: paymentData.invoice_id || null,
        amount: paymentData.amount,
        method: paymentData.method,
        reference: paymentData.reference || null,
        description: paymentData.description || '',
        status: paymentData.status || 'received',
        created_at: now,
        updated_at: now
      };

      databaseService.insert('payments', insertData);
      return nextId;
    });
  }

  /**
   * Update payment by ID
   * @param {number} id - Payment ID
   * @param {Object} paymentData - Payment data to update
   * @returns {number} - Number of changed rows
   */
  async updatePayment(id, paymentData) {
    if (!id || !paymentData) {
      throw new Error('Invalid parameters');
    }

    // Check if payment exists
    const paymentExists = databaseService.exists('payments', 'id', id);
    if (!paymentExists) {
      throw new Error('Payment not found');
    }

    // Validate amount if provided
    if (paymentData.amount !== undefined && paymentData.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Filter out undefined values
    const updateData = {};
    Object.keys(paymentData).forEach(key => {
      if (paymentData[key] !== undefined) {
        updateData[key] = paymentData[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    return databaseService.updateById('payments', id, updateData);
  }

  /**
   * Delete payment by ID
   * @param {number} id - Payment ID
   * @returns {number} - Number of deleted rows
   */
  async deletePayment(id) {
    // Check if payment exists
    const paymentExists = databaseService.exists('payments', 'id', id);
    if (!paymentExists) {
      throw new Error('Payment not found');
    }

    return databaseService.deleteById('payments', id);
  }

  /**
   * Bulk delete payments
   * @param {Array} paymentIds - Array of payment IDs to delete
   * @returns {number} - Number of deleted rows
   */
  async bulkDeletePayments(paymentIds) {
    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      throw new Error('payment_ids must be a non-empty array');
    }

    if (paymentIds.length > 500) {
      throw new Error('Maximum 500 payments can be deleted at once');
    }

    // Validate all payment IDs exist
    const placeholders = paymentIds.map(() => '?').join(',');
    const existingPayments = databaseService.getMany(`SELECT id FROM payments WHERE id IN (${placeholders})`, paymentIds);
    
    if (existingPayments.length !== paymentIds.length) {
      throw new Error('One or more payment IDs not found');
    }

    // Delete all payments
    return databaseService.executeQuery(`DELETE FROM payments WHERE id IN (${placeholders})`, paymentIds).changes;
  }

  /**
   * Get payment statistics
   * @param {string} year - Filter by year (optional)
   * @param {string} month - Filter by month (optional)
   * @returns {Object} - Payment statistics
   */
  async getPaymentStats(year = null, month = null) {
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
    
    const stats = databaseService.getOne(`
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
    `, params);
    
    // Get method breakdown
    const methodStats = databaseService.getMany(`
      SELECT 
        method,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount
      FROM payments ${dateFilter}
      GROUP BY method
      ORDER BY total_amount DESC
    `, params);
    
    // Get monthly trends (last 12 months)
    const monthlyTrends = databaseService.getMany(`
      SELECT 
        strftime('%Y-%m', date) as month,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM payments
      WHERE date >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `);

    return {
      summary: stats,
      methods: methodStats,
      monthlyTrends
    };
  }

  /**
   * Get payments by invoice ID
   * @param {number} invoiceId - Invoice ID
   * @returns {Array} - Array of payments for the invoice
   */
  async getPaymentsByInvoiceId(invoiceId) {
    return databaseService.getMany('SELECT * FROM payments WHERE invoice_id = ? ORDER BY date DESC', [invoiceId]);
  }

  /**
   * Get payments by client name
   * @param {string} clientName - Client name
   * @returns {Array} - Array of payments for the client
   */
  async getPaymentsByClientName(clientName) {
    return databaseService.getMany('SELECT * FROM payments WHERE client_name LIKE ? ORDER BY date DESC', [`%${clientName}%`]);
  }

  /**
   * Get payments by date range
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Object} - Payments and summary for date range
   */
  async getPaymentsByDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      throw new Error('start_date and end_date are required');
    }

    const payments = databaseService.getMany(`
      SELECT * FROM payments
      WHERE date BETWEEN ? AND ?
      ORDER BY date DESC, created_at DESC
    `, [startDate, endDate]);

    const summary = databaseService.getOne(`
      SELECT 
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount
      FROM payments
      WHERE date BETWEEN ? AND ?
    `, [startDate, endDate]);

    return {
      payments,
      summary
    };
  }

  /**
   * Get recent payments
   * @param {number} limit - Number of payments to return
   * @returns {Array} - Array of recent payments
   */
  async getRecentPayments(limit = 10) {
    return databaseService.getMany(`
      SELECT * FROM payments
      ORDER BY date DESC, created_at DESC
      LIMIT ?
    `, [limit]);
  }

  /**
   * Get total payments amount
   * @param {Object} filters - Optional filters (status, method, date_from, date_to)
   * @returns {number} - Total amount
   */
  async getTotalPaymentsAmount(filters = {}) {
    const { status, method, date_from, date_to } = filters;
    
    let query = 'SELECT SUM(amount) as total FROM payments';
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
    
    const result = databaseService.getOne(query, params);
    return result?.total || 0;
  }

  /**
   * Update payment status
   * @param {number} id - Payment ID
   * @param {string} status - New status
   * @returns {number} - Number of changed rows
   */
  async updatePaymentStatus(id, status) {
    const validStatuses = ['received', 'pending', 'failed', 'refunded'];
    if (!status || !validStatuses.includes(status)) {
      throw new Error('Invalid status. Must be received, pending, failed, or refunded');
    }

    // Check if payment exists
    const paymentExists = databaseService.exists('payments', 'id', id);
    if (!paymentExists) {
      throw new Error('Payment not found');
    }

    return databaseService.executeQuery(`
      UPDATE payments 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [status, id]).changes;
  }

  /**
   * Check if payment exists
   * @param {number} id - Payment ID
   * @returns {boolean} - True if payment exists
   */
  async paymentExists(id) {
    return databaseService.exists('payments', 'id', id);
  }

  /**
   * Get payment methods statistics
   * @returns {Array} - Array of payment methods with usage statistics
   */
  async getPaymentMethodsStats() {
    return databaseService.getMany(`
      SELECT 
        method,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount,
        MAX(date) as last_used
      FROM payments
      GROUP BY method
      ORDER BY count DESC
    `);
  }

  /**
   * Search payments by reference or description
   * @param {string} query - Search query
   * @param {number} limit - Results limit
   * @param {number} offset - Results offset
   * @returns {Object} - Search results with pagination
   */
  async searchPayments(query, limit = 10, offset = 0) {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    const searchTerm = `%${query.trim()}%`;

    const payments = databaseService.getMany(`
      SELECT * FROM payments 
      WHERE reference LIKE ? OR description LIKE ? OR client_name LIKE ?
      ORDER BY date DESC
      LIMIT ? OFFSET ?
    `, [searchTerm, searchTerm, searchTerm, parseInt(limit), parseInt(offset)]);

    const totalCount = databaseService.getOne(`
      SELECT COUNT(*) as count FROM payments 
      WHERE reference LIKE ? OR description LIKE ? OR client_name LIKE ?
    `, [searchTerm, searchTerm, searchTerm]);

    return {
      payments,
      pagination: {
        total: totalCount.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount.count > parseInt(offset) + parseInt(limit)
      }
    };
  }
}

// Export singleton instance
export const paymentService = new PaymentService();