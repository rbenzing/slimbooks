// Client controller for Slimbooks
// Handles all client-related business logic

import { db } from '../models/index.js';
import {
  AppError,
  NotFoundError,
  ValidationError,
  asyncHandler
} from '../middleware/index.js';
import { validateClientData } from '../utils/validation.js';

/**
 * Get all clients
 */
export const getAllClients = asyncHandler(async (req, res) => {
  const clients = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
  res.json({ success: true, data: clients });
});

/**
 * Get client by ID
 */
export const getClientById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);

  if (!client) {
    throw new NotFoundError('Client');
  }

  res.json({ success: true, data: client });
});

/**
 * Create new client
 */
export const createClient = asyncHandler(async (req, res) => {
  const { clientData } = req.body;

  if (!clientData) {
    throw new ValidationError('Client data is required');
  }

  // Validate client data using production-ready validation
  const { validated, errors } = validateClientData(clientData);

  if (errors.length > 0) {
    throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
  }

  // Check if client with same email already exists
  const existingClient = db.prepare('SELECT id FROM clients WHERE email = ?').get(validated.email);
  if (existingClient) {
    throw new ValidationError('Client with this email already exists');
  }

  // Get next ID
  const counterResult = db.prepare('SELECT value FROM counters WHERE name = ?').get('clients');
  const nextId = (counterResult?.value || 0) + 1;
  db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(nextId, 'clients');

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO clients (id, name, first_name, last_name, email, phone, company, address, city, state, zipCode, country, stripe_customer_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    nextId,
    validated.name,
    validated.first_name,
    validated.last_name,
    validated.email,
    validated.phone || '',
    validated.company || '',
    validated.address || '',
    validated.city || '',
    validated.state || '',
    validated.zipCode || '',
    validated.country,
    validated.stripe_customer_id,
    now,
    now
  );

  res.status(201).json({ 
    success: true, 
    data: { id: nextId },
    message: 'Client created successfully'
  });
});

/**
 * Update client
 */
export const updateClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { clientData } = req.body;

  if (!id || !clientData) {
    throw new ValidationError('Invalid parameters');
  }

  // Check if client exists
  const existingClient = db.prepare('SELECT id FROM clients WHERE id = ?').get(id);
  if (!existingClient) {
    throw new NotFoundError('Client');
  }

  // If email is being updated, check for duplicates
  if (clientData.email) {
    const emailExists = db.prepare('SELECT id FROM clients WHERE email = ? AND id != ?').get(clientData.email, id);
    if (emailExists) {
      throw new ValidationError('Another client with this email already exists');
    }
  }

  // Build dynamic update query
  const updateFields = [];
  const values = [];
  
  Object.keys(clientData).forEach(key => {
    if (clientData[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      values.push(clientData[key]);
    }
  });
  
  if (updateFields.length === 0) {
    throw new ValidationError('No fields to update');
  }
  
  updateFields.push('updated_at = datetime("now")');
  values.push(id);

  const stmt = db.prepare(`UPDATE clients SET ${updateFields.join(', ')} WHERE id = ?`);
  const result = stmt.run(values);

  res.json({ 
    success: true, 
    data: { changes: result.changes },
    message: 'Client updated successfully'
  });
});

/**
 * Delete client
 */
export const deleteClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if client exists
  const existingClient = db.prepare('SELECT id FROM clients WHERE id = ?').get(id);
  if (!existingClient) {
    throw new NotFoundError('Client');
  }
  
  // Check if client has associated invoices
  const invoiceCount = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE client_id = ?').get(id);
  if (invoiceCount.count > 0) {
    throw new ValidationError(`Cannot delete client with ${invoiceCount.count} associated invoices`);
  }
  
  // Check if client has associated templates
  const templateCount = db.prepare('SELECT COUNT(*) as count FROM templates WHERE client_id = ?').get(id);
  if (templateCount.count > 0) {
    throw new ValidationError(`Cannot delete client with ${templateCount.count} associated templates`);
  }
  
  const stmt = db.prepare('DELETE FROM clients WHERE id = ?');
  const result = stmt.run(id);

  res.json({ 
    success: true, 
    data: { changes: result.changes },
    message: 'Client deleted successfully'
  });
});

/**
 * Get client statistics
 */
export const getClientStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if client exists
  const client = db.prepare('SELECT id, name FROM clients WHERE id = ?').get(id);
  if (!client) {
    throw new NotFoundError('Client');
  }
  
  // Get invoice statistics
  const invoiceStats = db.prepare(`
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
  `).get(id);
  
  // Get template count
  const templateCount = db.prepare('SELECT COUNT(*) as count FROM templates WHERE client_id = ?').get(id);
  
  // Get recent invoices
  const recentInvoices = db.prepare(`
    SELECT id, invoice_number, total_amount, status, due_date, created_at
    FROM invoices 
    WHERE client_id = ? 
    ORDER BY created_at DESC 
    LIMIT 5
  `).all(id);
  
  const stats = {
    client: client,
    invoices: {
      ...invoiceStats,
      recent: recentInvoices
    },
    templates: {
      count: templateCount.count
    }
  };

  res.json({ success: true, data: stats });
});

/**
 * Search clients
 */
export const searchClients = asyncHandler(async (req, res) => {
  const { q, limit = 10, offset = 0 } = req.query;
  
  if (!q || q.trim().length < 2) {
    throw new ValidationError('Search query must be at least 2 characters long');
  }
  
  const searchTerm = `%${q.trim()}%`;
  
  const clients = db.prepare(`
    SELECT * FROM clients 
    WHERE name LIKE ? OR email LIKE ? OR company LIKE ?
    ORDER BY name ASC
    LIMIT ? OFFSET ?
  `).all(searchTerm, searchTerm, searchTerm, parseInt(limit), parseInt(offset));
  
  const totalCount = db.prepare(`
    SELECT COUNT(*) as count FROM clients 
    WHERE name LIKE ? OR email LIKE ? OR company LIKE ?
  `).get(searchTerm, searchTerm, searchTerm);

  res.json({ 
    success: true, 
    data: {
      clients,
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
 * Get clients with invoice summaries
 */
export const getClientsWithInvoiceSummary = asyncHandler(async (req, res) => {
  const clients = db.prepare(`
    SELECT 
      c.*,
      COUNT(i.id) as invoice_count,
      SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END) as total_paid,
      SUM(CASE WHEN i.status IN ('sent', 'overdue') THEN i.total_amount ELSE 0 END) as total_outstanding
    FROM clients c
    LEFT JOIN invoices i ON c.id = i.client_id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all();

  res.json({ success: true, data: clients });
});
