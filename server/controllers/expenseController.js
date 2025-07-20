// Expense controller for Slimbooks
// Handles all expense-related business logic

import { db } from '../models/index.js';
import { 
  AppError, 
  NotFoundError, 
  ValidationError,
  asyncHandler
} from '../middleware/index.js';

/**
 * Get all expenses
 */
export const getAllExpenses = asyncHandler(async (req, res) => {
  const { status, category, date_from, date_to, limit = 50, offset = 0 } = req.query;
  
  let query = 'SELECT * FROM expenses';
  const conditions = [];
  const params = [];
  
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  
  if (category) {
    conditions.push('category = ?');
    params.push(category);
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
  
  const expenses = db.prepare(query).all(...params);
  
  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) as count FROM expenses';
  if (conditions.length > 0) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }
  
  const totalCount = db.prepare(countQuery).get(...params.slice(0, -2));
  
  res.json({ 
    success: true, 
    data: {
      expenses,
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
 * Get expense by ID
 */
export const getExpenseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);

  if (!expense) {
    throw new NotFoundError('Expense');
  }

  res.json({ success: true, data: expense });
});

/**
 * Create new expense
 */
export const createExpense = asyncHandler(async (req, res) => {
  const { expenseData } = req.body;

  if (!expenseData || !expenseData.date || !expenseData.merchant || !expenseData.category || !expenseData.amount) {
    throw new ValidationError('Invalid expense data - date, merchant, category, and amount are required');
  }

  // Validate amount is positive
  if (expenseData.amount <= 0) {
    throw new ValidationError('Amount must be positive');
  }

  // Get next ID
  const counterResult = db.prepare('SELECT value FROM counters WHERE name = ?').get('expenses');
  const nextId = (counterResult?.value || 0) + 1;
  db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(nextId, 'expenses');

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO expenses (id, date, merchant, category, amount, description, receipt_url, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    nextId,
    expenseData.date,
    expenseData.merchant,
    expenseData.category,
    expenseData.amount,
    expenseData.description || '',
    expenseData.receipt_url || null,
    expenseData.status || 'pending',
    now,
    now
  );

  res.status(201).json({ 
    success: true, 
    data: { id: nextId },
    message: 'Expense created successfully'
  });
});

/**
 * Update expense
 */
export const updateExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { expenseData } = req.body;

  if (!id || !expenseData) {
    throw new ValidationError('Invalid parameters');
  }

  // Check if expense exists
  const existingExpense = db.prepare('SELECT id FROM expenses WHERE id = ?').get(id);
  if (!existingExpense) {
    throw new NotFoundError('Expense');
  }

  // Validate amount if provided
  if (expenseData.amount !== undefined && expenseData.amount <= 0) {
    throw new ValidationError('Amount must be positive');
  }

  // Build dynamic update query
  const updateFields = [];
  const values = [];
  
  Object.keys(expenseData).forEach(key => {
    if (expenseData[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      values.push(expenseData[key]);
    }
  });
  
  if (updateFields.length === 0) {
    throw new ValidationError('No fields to update');
  }
  
  updateFields.push('updated_at = datetime("now")');
  values.push(id);

  const stmt = db.prepare(`UPDATE expenses SET ${updateFields.join(', ')} WHERE id = ?`);
  const result = stmt.run(values);

  res.json({ 
    success: true, 
    data: { changes: result.changes },
    message: 'Expense updated successfully'
  });
});

/**
 * Delete expense
 */
export const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if expense exists
  const existingExpense = db.prepare('SELECT id FROM expenses WHERE id = ?').get(id);
  if (!existingExpense) {
    throw new NotFoundError('Expense');
  }
  
  const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
  const result = stmt.run(id);

  res.json({ 
    success: true, 
    data: { changes: result.changes },
    message: 'Expense deleted successfully'
  });
});

/**
 * Get expense statistics
 */
export const getExpenseStats = asyncHandler(async (req, res) => {
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
      COUNT(*) as total_expenses,
      SUM(amount) as total_amount,
      AVG(amount) as average_amount,
      COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
      SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount
    FROM expenses ${dateFilter}
  `).get(...params);
  
  // Get category breakdown
  const categoryStats = db.prepare(`
    SELECT 
      category,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      AVG(amount) as average_amount
    FROM expenses ${dateFilter}
    GROUP BY category
    ORDER BY total_amount DESC
  `).all(...params);
  
  // Get monthly trends (last 12 months)
  const monthlyTrends = db.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      COUNT(*) as count,
      SUM(amount) as total_amount
    FROM expenses
    WHERE date >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
  `).all();

  res.json({ 
    success: true, 
    data: {
      summary: stats,
      categories: categoryStats,
      monthlyTrends
    }
  });
});

/**
 * Get expense categories
 */
export const getExpenseCategories = asyncHandler(async (req, res) => {
  const categories = db.prepare(`
    SELECT 
      category,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      MAX(date) as last_used
    FROM expenses
    GROUP BY category
    ORDER BY count DESC
  `).all();

  res.json({ success: true, data: categories });
});

/**
 * Update expense status
 */
export const updateExpenseStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    throw new ValidationError('Invalid status. Must be pending, approved, or rejected');
  }

  // Check if expense exists
  const existingExpense = db.prepare('SELECT id FROM expenses WHERE id = ?').get(id);
  if (!existingExpense) {
    throw new NotFoundError('Expense');
  }

  const stmt = db.prepare(`
    UPDATE expenses 
    SET status = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  
  const result = stmt.run(status, id);

  res.json({ 
    success: true, 
    data: { changes: result.changes },
    message: `Expense status updated to ${status}`
  });
});

/**
 * Bulk update expense status
 */
export const bulkUpdateExpenseStatus = asyncHandler(async (req, res) => {
  const { expense_ids, status } = req.body;

  if (!expense_ids || !Array.isArray(expense_ids) || expense_ids.length === 0) {
    throw new ValidationError('expense_ids must be a non-empty array');
  }

  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    throw new ValidationError('Invalid status. Must be pending, approved, or rejected');
  }

  // Validate all expense IDs exist
  const placeholders = expense_ids.map(() => '?').join(',');
  const existingExpenses = db.prepare(`SELECT id FROM expenses WHERE id IN (${placeholders})`).all(...expense_ids);
  
  if (existingExpenses.length !== expense_ids.length) {
    throw new ValidationError('One or more expense IDs not found');
  }

  // Update all expenses
  const stmt = db.prepare(`
    UPDATE expenses 
    SET status = ?, updated_at = datetime('now')
    WHERE id IN (${placeholders})
  `);
  
  const result = stmt.run(status, ...expense_ids);

  res.json({ 
    success: true, 
    data: { changes: result.changes },
    message: `${result.changes} expenses updated to ${status}`
  });
});

/**
 * Get expenses by date range
 */
export const getExpensesByDateRange = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    throw new ValidationError('start_date and end_date are required');
  }

  const expenses = db.prepare(`
    SELECT * FROM expenses
    WHERE date BETWEEN ? AND ?
    ORDER BY date DESC, created_at DESC
  `).all(start_date, end_date);

  const summary = db.prepare(`
    SELECT 
      COUNT(*) as count,
      SUM(amount) as total_amount,
      AVG(amount) as average_amount
    FROM expenses
    WHERE date BETWEEN ? AND ?
  `).get(start_date, end_date);

  res.json({ 
    success: true, 
    data: {
      expenses,
      summary
    }
  });
});
