// Client Service - Domain-specific service for client operations
// Handles all client-related business logic and database operations

import { databaseService } from './DatabaseService.js';
import { validateClientData } from '../utils/validation.js';

/**
 * Client Service
 * Manages client-related operations with proper validation and security
 */
export class ClientService {
  /**
   * Get all clients
   * @returns {Array} - Array of client records
   */
  async getAllClients() {
    return databaseService.getMany('SELECT * FROM clients ORDER BY created_at DESC');
  }

  /**
   * Get client by ID
   * @param {number} id - Client ID
   * @returns {Object|null} - Client record or null
   */
  async getClientById(id) {
    return databaseService.getOne('SELECT * FROM clients WHERE id = ?', [id]);
  }

  /**
   * Create new client
   * @param {Object} clientData - Client data to create
   * @returns {number} - Created client ID
   */
  async createClient(clientData) {
    if (!clientData) {
      throw new Error('Client data is required');
    }

    // Validate client data using production-ready validation
    const { validated, errors } = validateClientData(clientData);

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Check if client with same email already exists
    const existingClient = databaseService.getOne('SELECT id FROM clients WHERE email = ?', [validated.email]);
    if (existingClient) {
      throw new Error('Client with this email already exists');
    }

    // Get next ID and create client in a transaction
    return databaseService.executeTransaction(() => {
      const nextId = databaseService.getNextId('clients');
      const now = new Date().toISOString();

      const insertData = {
        id: nextId,
        name: validated.name,
        first_name: validated.first_name,
        last_name: validated.last_name,
        email: validated.email,
        phone: validated.phone || '',
        company: validated.company || '',
        address: validated.address || '',
        city: validated.city || '',
        state: validated.state || '',
        zipCode: validated.zipCode || '',
        country: validated.country,
        stripe_customer_id: validated.stripe_customer_id,
        created_at: now,
        updated_at: now
      };

      databaseService.insert('clients', insertData);
      return nextId;
    });
  }

  /**
   * Update client by ID
   * @param {number} id - Client ID
   * @param {Object} clientData - Client data to update
   * @returns {number} - Number of changed rows
   */
  async updateClient(id, clientData) {
    if (!id || !clientData) {
      throw new Error('Invalid parameters');
    }

    // Check if client exists
    const existingClient = databaseService.getOne('SELECT id FROM clients WHERE id = ?', [id]);
    if (!existingClient) {
      throw new Error('Client not found');
    }

    // If email is being updated, check for duplicates
    if (clientData.email) {
      const emailExists = databaseService.getOne('SELECT id FROM clients WHERE email = ? AND id != ?', [clientData.email, id]);
      if (emailExists) {
        throw new Error('Another client with this email already exists');
      }
    }

    // Filter out undefined values
    const updateData = {};
    Object.keys(clientData).forEach(key => {
      if (clientData[key] !== undefined) {
        updateData[key] = clientData[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    return databaseService.updateById('clients', id, updateData);
  }

  /**
   * Delete client by ID
   * @param {number} id - Client ID
   * @returns {number} - Number of deleted rows
   */
  async deleteClient(id) {
    // Check if client exists
    const existingClient = databaseService.getOne('SELECT id FROM clients WHERE id = ?', [id]);
    if (!existingClient) {
      throw new Error('Client not found');
    }

    // Check if client has associated invoices
    const invoiceCount = databaseService.getOne('SELECT COUNT(*) as count FROM invoices WHERE client_id = ?', [id]);
    if (invoiceCount.count > 0) {
      throw new Error(`Cannot delete client with ${invoiceCount.count} associated invoices`);
    }

    // Check if client has associated templates
    const templateCount = databaseService.getOne('SELECT COUNT(*) as count FROM templates WHERE client_id = ?', [id]);
    if (templateCount.count > 0) {
      throw new Error(`Cannot delete client with ${templateCount.count} associated templates`);
    }

    return databaseService.deleteById('clients', id);
  }

  /**
   * Get client statistics
   * @param {number} id - Client ID
   * @returns {Object} - Client statistics
   */
  async getClientStats(id) {
    // Check if client exists
    const client = databaseService.getOne('SELECT id, name FROM clients WHERE id = ?', [id]);
    if (!client) {
      throw new Error('Client not found');
    }

    // Get invoice statistics
    const invoiceStats = databaseService.getOne(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'sent' THEN total_amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END) as total_overdue,
        SUM(CASE WHEN status = 'draft' THEN total_amount ELSE 0 END) as total_draft,
        AVG(total_amount) as average_invoice_amount,
        MAX(total_amount) as highest_invoice_amount,
        MIN(total_amount) as lowest_invoice_amount
      FROM invoices 
      WHERE client_id = ?
    `, [id]);

    // Get template count
    const templateCount = databaseService.getOne('SELECT COUNT(*) as count FROM templates WHERE client_id = ?', [id]);

    // Get recent invoices
    const recentInvoices = databaseService.getMany(`
      SELECT id, invoice_number, total_amount, status, due_date, created_at
      FROM invoices 
      WHERE client_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [id]);

    return {
      client: client,
      invoices: {
        ...invoiceStats,
        recent: recentInvoices
      },
      templates: {
        count: templateCount.count
      }
    };
  }

  /**
   * Search clients
   * @param {string} query - Search query
   * @param {number} limit - Results limit
   * @param {number} offset - Results offset
   * @returns {Object} - Search results with pagination
   */
  async searchClients(query, limit = 10, offset = 0) {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    const searchTerm = `%${query.trim()}%`;

    const clients = databaseService.getMany(`
      SELECT * FROM clients 
      WHERE name LIKE ? OR email LIKE ? OR company LIKE ?
      ORDER BY name ASC
      LIMIT ? OFFSET ?
    `, [searchTerm, searchTerm, searchTerm, parseInt(limit), parseInt(offset)]);

    const totalCount = databaseService.getOne(`
      SELECT COUNT(*) as count FROM clients 
      WHERE name LIKE ? OR email LIKE ? OR company LIKE ?
    `, [searchTerm, searchTerm, searchTerm]);

    return {
      clients,
      pagination: {
        total: totalCount.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount.count > parseInt(offset) + parseInt(limit)
      }
    };
  }

  /**
   * Get clients with invoice summaries
   * @returns {Array} - Clients with invoice statistics
   */
  async getClientsWithInvoiceSummary() {
    return databaseService.getMany(`
      SELECT 
        c.*,
        COUNT(i.id) as invoice_count,
        SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN i.status IN ('sent', 'overdue') THEN i.total_amount ELSE 0 END) as total_outstanding
      FROM clients c
      LEFT JOIN invoices i ON c.id = i.client_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
  }

  /**
   * Check if client exists
   * @param {number} id - Client ID
   * @returns {boolean} - True if client exists
   */
  async clientExists(id) {
    return databaseService.exists('clients', 'id', id);
  }

  /**
   * Check if client email exists
   * @param {string} email - Client email
   * @param {number} excludeId - ID to exclude from check
   * @returns {boolean} - True if email exists
   */
  async emailExists(email, excludeId = null) {
    if (excludeId) {
      const result = databaseService.getOne('SELECT id FROM clients WHERE email = ? AND id != ?', [email, excludeId]);
      return !!result;
    }
    return databaseService.exists('clients', 'email', email);
  }
}

// Export singleton instance
export const clientService = new ClientService();