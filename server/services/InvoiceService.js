// Invoice Service - Domain-specific service for invoice operations
// Handles all invoice-related business logic and database operations

import { databaseService } from './DatabaseService.js';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/index.js';

/**
 * Invoice Service
 * Manages invoice-related operations with proper validation and security
 */
export class InvoiceService {
  /**
   * Get all invoices with filtering and pagination
   * @param {Object} filters - Filter options (status, client_id)
   * @param {number} limit - Results limit
   * @param {number} offset - Results offset
   * @returns {Object} - Invoices with pagination info
   */
  async getAllInvoices(filters = {}, limit = 50, offset = 0) {
    const { status, client_id } = filters;
    
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
    
    const invoices = databaseService.getMany(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM invoices i';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const totalCount = databaseService.getOne(countQuery, params.slice(0, -2));
    
    return {
      invoices,
      pagination: {
        total: totalCount.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount.count > parseInt(offset) + parseInt(limit)
      }
    };
  }

  /**
   * Get invoice by ID with client details
   * @param {number} id - Invoice ID
   * @returns {Object|null} - Invoice with client details or null
   */
  async getInvoiceById(id) {
    return databaseService.getOne(`
      SELECT i.*, c.name as client_name, c.email as client_email, c.company as client_company,
             c.address as client_address, c.city as client_city, c.state as client_state,
             c.zipCode as client_zipCode, c.country as client_country, c.phone as client_phone
      FROM invoices i 
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = ?
    `, [id]);
  }

  /**
   * Get public invoice by ID with secure token validation
   * @param {number} id - Invoice ID
   * @param {string} token - Security token
   * @returns {Object} - Invoice with settings for public display
   */
  async getPublicInvoiceById(id, token) {
    if (!token || !id) {
      throw new Error('Invalid or expired invoice link');
    }

    try {
      // Verify the token using JWT with expiration
      const decoded = jwt.verify(token, authConfig.jwtSecret);

      // Validate token payload
      if (!decoded.invoiceId || !decoded.type || decoded.type !== 'public_invoice') {
        throw new Error('Invalid or expired invoice link');
      }

      // Ensure token is for the requested invoice
      if (decoded.invoiceId !== parseInt(id)) {
        throw new Error('Invalid or expired invoice link');
      }

      // Get invoice with client details
      const invoice = await this.getInvoiceById(id);
      if (!invoice) {
        throw new Error('Invalid or expired invoice link');
      }

      // Get company settings for public display
      const companySettings = databaseService.getOne(`
        SELECT value FROM settings WHERE key = ? AND category = ?
      `, ['company_settings', 'company']);

      const currencySettings = databaseService.getOne(`
        SELECT value FROM settings WHERE key = ? AND category = ?
      `, ['currency_settings', 'currency']);

      const invoiceTemplate = databaseService.getOne(`
        SELECT value FROM settings WHERE key = ? AND category = ?
      `, ['invoice_template', 'appearance']);

      // Include settings in the response for public display
      return {
        ...invoice,
        companySettings: companySettings ? JSON.parse(companySettings.value) : null,
        currencySettings: currencySettings ? JSON.parse(currencySettings.value) : null,
        invoiceTemplate: invoiceTemplate || 'modern-blue'
      };

    } catch (error) {
      throw new Error('Invalid or expired invoice link');
    }
  }

  /**
   * Generate secure public token for invoice
   * @param {number} id - Invoice ID
   * @returns {Object} - Token and public URL
   */
  async generatePublicInvoiceToken(id) {
    // Verify invoice exists
    const invoice = databaseService.getOne(`
      SELECT i.id, i.invoice_number
      FROM invoices i
      WHERE i.id = ?
    `, [id]);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Generate secure token with expiration
    const tokenPayload = {
      invoiceId: parseInt(id),
      type: 'public_invoice',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    const token = jwt.sign(tokenPayload, authConfig.jwtSecret);

    return {
      token,
      expiresIn: '24h',
      publicUrl: `${process.env.CLIENT_URL}/invoice/${id}?token=${token}`
    };
  }

  /**
   * Create new invoice
   * @param {Object} invoiceData - Invoice data to create
   * @returns {number} - Created invoice ID
   */
  async createInvoice(invoiceData) {
    if (!invoiceData || !invoiceData.invoice_number || !invoiceData.client_id || !invoiceData.amount) {
      throw new Error('Invalid invoice data - invoice_number, client_id, and amount are required');
    }

    // Check if client exists
    const clientExists = databaseService.exists('clients', 'id', invoiceData.client_id);
    if (!clientExists) {
      throw new Error('Client not found');
    }

    // Check if invoice number already exists
    const invoiceExists = databaseService.exists('invoices', 'invoice_number', invoiceData.invoice_number);
    if (invoiceExists) {
      throw new Error('Invoice number already exists');
    }

    // Create invoice in a transaction
    return databaseService.executeTransaction(() => {
      const nextId = databaseService.getNextId('invoices');
      const now = new Date().toISOString();

      const insertData = {
        id: nextId,
        invoice_number: invoiceData.invoice_number,
        client_id: invoiceData.client_id,
        template_id: invoiceData.template_id || null,
        amount: invoiceData.amount,
        tax_amount: invoiceData.tax_amount || 0,
        total_amount: invoiceData.total_amount || invoiceData.amount,
        status: invoiceData.status || 'draft',
        due_date: invoiceData.due_date,
        issue_date: invoiceData.issue_date,
        description: invoiceData.description || '',
        items: invoiceData.items || null,
        notes: invoiceData.notes || '',
        payment_terms: invoiceData.payment_terms || '',
        stripe_invoice_id: invoiceData.stripe_invoice_id || null,
        stripe_payment_intent_id: invoiceData.stripe_payment_intent_id || null,
        type: invoiceData.type || 'one-time',
        client_name: invoiceData.client_name || null,
        client_email: invoiceData.client_email || null,
        client_phone: invoiceData.client_phone || null,
        client_address: invoiceData.client_address || null,
        line_items: invoiceData.line_items || null,
        tax_rate_id: invoiceData.tax_rate_id || null,
        shipping_amount: invoiceData.shipping_amount || 0,
        shipping_rate_id: invoiceData.shipping_rate_id || null,
        email_status: invoiceData.email_status || 'not_sent',
        email_sent_at: invoiceData.email_sent_at || null,
        email_error: invoiceData.email_error || null,
        last_email_attempt: invoiceData.last_email_attempt || null,
        created_at: now,
        updated_at: now
      };

      databaseService.insert('invoices', insertData);
      return nextId;
    });
  }

  /**
   * Update invoice by ID
   * @param {number} id - Invoice ID
   * @param {Object} invoiceData - Invoice data to update
   * @returns {number} - Number of changed rows
   */
  async updateInvoice(id, invoiceData) {
    if (!id || !invoiceData) {
      throw new Error('Invalid parameters');
    }

    // Check if invoice exists
    const invoiceExists = databaseService.exists('invoices', 'id', id);
    if (!invoiceExists) {
      throw new Error('Invoice not found');
    }

    // If invoice number is being updated, check for duplicates
    if (invoiceData.invoice_number) {
      const numberExists = databaseService.getOne('SELECT id FROM invoices WHERE invoice_number = ? AND id != ?', [invoiceData.invoice_number, id]);
      if (numberExists) {
        throw new Error('Another invoice with this number already exists');
      }
    }

    // If client_id is being updated, check if client exists
    if (invoiceData.client_id) {
      const clientExists = databaseService.exists('clients', 'id', invoiceData.client_id);
      if (!clientExists) {
        throw new Error('Client not found');
      }
    }

    // Filter out undefined values
    const updateData = {};
    Object.keys(invoiceData).forEach(key => {
      if (invoiceData[key] !== undefined) {
        updateData[key] = invoiceData[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    return databaseService.updateById('invoices', id, updateData);
  }

  /**
   * Delete invoice by ID
   * @param {number} id - Invoice ID
   * @returns {number} - Number of deleted rows
   */
  async deleteInvoice(id) {
    // Check if invoice exists and get status
    const invoice = databaseService.getOne('SELECT id, status FROM invoices WHERE id = ?', [id]);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Prevent deletion of paid invoices
    if (invoice.status === 'paid') {
      throw new Error('Cannot delete paid invoices');
    }

    return databaseService.deleteById('invoices', id);
  }

  /**
   * Get invoice statistics
   * @returns {Object} - Invoice statistics
   */
  async getInvoiceStats() {
    return databaseService.getOne(`
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
    `);
  }

  /**
   * Update invoice status
   * @param {number} id - Invoice ID
   * @param {string} status - New status
   * @returns {number} - Number of changed rows
   */
  async updateInvoiceStatus(id, status) {
    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    // Check if invoice exists
    const invoiceExists = databaseService.exists('invoices', 'id', id);
    if (!invoiceExists) {
      throw new Error('Invoice not found');
    }

    return databaseService.executeQuery(`
      UPDATE invoices 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [status, id]).changes;
  }

  /**
   * Mark invoice as sent
   * @param {number} id - Invoice ID
   * @param {string} emailSentAt - Timestamp when email was sent
   * @returns {number} - Number of changed rows
   */
  async markInvoiceAsSent(id, emailSentAt = null) {
    const sentAt = emailSentAt || new Date().toISOString();
    
    return databaseService.executeQuery(`
      UPDATE invoices 
      SET status = 'sent', email_status = 'sent', email_sent_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [sentAt, id]).changes;
  }

  /**
   * Get overdue invoices
   * @returns {Array} - Array of overdue invoices
   */
  async getOverdueInvoices() {
    return databaseService.getMany(`
      SELECT i.*, c.name as client_name, c.email as client_email
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.status IN ('sent', 'overdue') AND i.due_date < date('now')
      ORDER BY i.due_date ASC
    `);
  }

  /**
   * Check if invoice exists
   * @param {number} id - Invoice ID
   * @returns {boolean} - True if invoice exists
   */
  async invoiceExists(id) {
    return databaseService.exists('invoices', 'id', id);
  }

  /**
   * Check if invoice number exists
   * @param {string} invoiceNumber - Invoice number
   * @param {number} excludeId - ID to exclude from check
   * @returns {boolean} - True if invoice number exists
   */
  async invoiceNumberExists(invoiceNumber, excludeId = null) {
    if (excludeId) {
      const result = databaseService.getOne('SELECT id FROM invoices WHERE invoice_number = ? AND id != ?', [invoiceNumber, excludeId]);
      return !!result;
    }
    return databaseService.exists('invoices', 'invoice_number', invoiceNumber);
  }

  /**
   * Get invoices by client ID
   * @param {number} clientId - Client ID
   * @returns {Array} - Array of invoices for the client
   */
  async getInvoicesByClientId(clientId) {
    return databaseService.getMany(`
      SELECT i.*, c.name as client_name, c.email as client_email
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.client_id = ?
      ORDER BY i.created_at DESC
    `, [clientId]);
  }

  /**
   * Get recent invoices
   * @param {number} limit - Number of invoices to return
   * @returns {Array} - Array of recent invoices
   */
  async getRecentInvoices(limit = 10) {
    return databaseService.getMany(`
      SELECT i.*, c.name as client_name, c.email as client_email
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      ORDER BY i.created_at DESC
      LIMIT ?
    `, [limit]);
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService();