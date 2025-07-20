// Template controller for Slimbooks
// Handles invoice template management

import { db } from '../models/index.js';
import { 
  AppError, 
  NotFoundError, 
  ValidationError,
  asyncHandler
} from '../middleware/index.js';

/**
 * Get all templates
 */
export const getAllTemplates = asyncHandler(async (req, res) => {
  const templates = db.prepare(`
    SELECT
      t.*,
      c.name as client_name
    FROM templates t
    LEFT JOIN clients c ON t.client_id = c.id
    ORDER BY t.created_at DESC
  `).all();
  
  res.json({ success: true, data: templates });
});

/**
 * Get template by ID
 */
export const getTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const template = db.prepare(`
    SELECT
      t.*,
      c.name as client_name
    FROM templates t
    LEFT JOIN clients c ON t.client_id = c.id
    WHERE t.id = ?
  `).get(id);

  if (!template) {
    throw new NotFoundError('Template not found');
  }

  res.json({ success: true, data: template });
});

/**
 * Create new template
 */
export const createTemplate = asyncHandler(async (req, res) => {
  const { templateData } = req.body;

  if (!templateData) {
    throw new ValidationError('Template data is required');
  }

  // Get next ID
  const counterResult = db.prepare('SELECT value FROM counters WHERE name = ?').get('templates');
  const currentValue = counterResult?.value || 0;
  const nextValue = currentValue + 1;
  db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(nextValue, 'templates');

  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO templates (id, name, client_id, amount, description, frequency, payment_terms,
                          next_invoice_date, is_active, line_items, tax_amount, tax_rate_id,
                          shipping_amount, shipping_rate_id, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    nextValue,
    templateData.name,
    templateData.client_id,
    templateData.amount,
    templateData.description || '',
    templateData.frequency,
    templateData.payment_terms || '',
    templateData.next_invoice_date,
    templateData.is_active ? 1 : 0,
    templateData.line_items || null,
    templateData.tax_amount || 0,
    templateData.tax_rate_id || null,
    templateData.shipping_amount || 0,
    templateData.shipping_rate_id || null,
    templateData.notes || '',
    now,
    now
  );

  res.json({ success: true, result: { lastInsertRowid: nextValue } });
});

/**
 * Update template
 */
export const updateTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { templateData } = req.body;

  if (!id || !templateData) {
    throw new ValidationError('Invalid parameters');
  }

  const fields = Object.keys(templateData).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(templateData), id];

  const stmt = db.prepare(`UPDATE templates SET ${fields}, updated_at = datetime('now') WHERE id = ?`);
  const result = stmt.run(values);

  if (result.changes === 0) {
    throw new NotFoundError('Template not found');
  }

  res.json({ success: true, result: { changes: result.changes } });
});

/**
 * Delete template
 */
export const deleteTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const stmt = db.prepare('DELETE FROM templates WHERE id = ?');
  const result = stmt.run(id);
  
  if (result.changes === 0) {
    throw new NotFoundError('Template not found');
  }
  
  res.json({ success: true, result: { changes: result.changes } });
});
