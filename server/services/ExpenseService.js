// Expense Service - Domain-specific service for expense operations
// Handles all expense-related business logic and database operations

import { databaseService } from './DatabaseService.js';

/**
 * Expense Service
 * Manages expense-related operations with proper validation and security
 */
export class ExpenseService {
  /**
   * Get all expenses with filtering and pagination
   * @param {Object} filters - Filter options (status, category, date_from, date_to)
   * @param {number} limit - Results limit
   * @param {number} offset - Results offset
   * @returns {Object} - Expenses with pagination info
   */
  async getAllExpenses(filters = {}, limit = 50, offset = 0) {
    const { status, category, date_from, date_to } = filters;
    
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
    
    const expenses = databaseService.getMany(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM expenses';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const totalCount = databaseService.getOne(countQuery, params.slice(0, -2));
    
    return {
      expenses,
      pagination: {
        total: totalCount.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount.count > parseInt(offset) + parseInt(limit)
      }
    };
  }

  /**
   * Get expense by ID
   * @param {number} id - Expense ID
   * @returns {Object|null} - Expense record or null
   */
  async getExpenseById(id) {
    return databaseService.getOne('SELECT * FROM expenses WHERE id = ?', [id]);
  }

  /**
   * Create new expense
   * @param {Object} expenseData - Expense data to create
   * @returns {number} - Created expense ID
   */
  async createExpense(expenseData) {
    if (!expenseData || !expenseData.date || !expenseData.merchant || !expenseData.category || !expenseData.amount) {
      throw new Error('Invalid expense data - date, merchant, category, and amount are required');
    }

    // Validate amount is positive
    if (expenseData.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Create expense in a transaction
    return databaseService.executeTransaction(() => {
      const nextId = databaseService.getNextId('expenses');
      const now = new Date().toISOString();

      const insertData = {
        id: nextId,
        date: expenseData.date,
        merchant: expenseData.merchant,
        category: expenseData.category,
        amount: expenseData.amount,
        description: expenseData.description || '',
        receipt_url: expenseData.receipt_url || null,
        status: expenseData.status || 'pending',
        created_at: now,
        updated_at: now
      };

      databaseService.insert('expenses', insertData);
      return nextId;
    });
  }

  /**
   * Update expense by ID
   * @param {number} id - Expense ID
   * @param {Object} expenseData - Expense data to update
   * @returns {number} - Number of changed rows
   */
  async updateExpense(id, expenseData) {
    if (!id || !expenseData) {
      throw new Error('Invalid parameters');
    }

    // Check if expense exists
    const expenseExists = databaseService.exists('expenses', 'id', id);
    if (!expenseExists) {
      throw new Error('Expense not found');
    }

    // Validate amount if provided
    if (expenseData.amount !== undefined && expenseData.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Filter out undefined values
    const updateData = {};
    Object.keys(expenseData).forEach(key => {
      if (expenseData[key] !== undefined) {
        updateData[key] = expenseData[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    return databaseService.updateById('expenses', id, updateData);
  }

  /**
   * Delete expense by ID
   * @param {number} id - Expense ID
   * @returns {number} - Number of deleted rows
   */
  async deleteExpense(id) {
    // Check if expense exists
    const expenseExists = databaseService.exists('expenses', 'id', id);
    if (!expenseExists) {
      throw new Error('Expense not found');
    }

    return databaseService.deleteById('expenses', id);
  }

  /**
   * Get expense statistics
   * @param {string} year - Filter by year (optional)
   * @param {string} month - Filter by month (optional)
   * @returns {Object} - Expense statistics
   */
  async getExpenseStats(year = null, month = null) {
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
        COUNT(*) as total_expenses,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount
      FROM expenses ${dateFilter}
    `, params);
    
    // Get category breakdown
    const categoryStats = databaseService.getMany(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount
      FROM expenses ${dateFilter}
      GROUP BY category
      ORDER BY total_amount DESC
    `, params);
    
    // Get monthly trends (last 12 months)
    const monthlyTrends = databaseService.getMany(`
      SELECT 
        strftime('%Y-%m', date) as month,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM expenses
      WHERE date >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `);

    return {
      summary: stats,
      categories: categoryStats,
      monthlyTrends
    };
  }

  /**
   * Get expense categories
   * @returns {Array} - Array of expense categories with statistics
   */
  async getExpenseCategories() {
    return databaseService.getMany(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        MAX(date) as last_used
      FROM expenses
      GROUP BY category
      ORDER BY count DESC
    `);
  }

  /**
   * Update expense status
   * @param {number} id - Expense ID
   * @param {string} status - New status
   * @returns {number} - Number of changed rows
   */
  async updateExpenseStatus(id, status) {
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      throw new Error('Invalid status. Must be pending, approved, or rejected');
    }

    // Check if expense exists
    const expenseExists = databaseService.exists('expenses', 'id', id);
    if (!expenseExists) {
      throw new Error('Expense not found');
    }

    return databaseService.executeQuery(`
      UPDATE expenses 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [status, id]).changes;
  }

  /**
   * Bulk update expense status
   * @param {Array} expenseIds - Array of expense IDs
   * @param {string} status - New status
   * @returns {number} - Number of changed rows
   */
  async bulkUpdateExpenseStatus(expenseIds, status) {
    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      throw new Error('expense_ids must be a non-empty array');
    }

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      throw new Error('Invalid status. Must be pending, approved, or rejected');
    }

    // Validate all expense IDs exist
    const placeholders = expenseIds.map(() => '?').join(',');
    const existingExpenses = databaseService.getMany(`SELECT id FROM expenses WHERE id IN (${placeholders})`, expenseIds);
    
    if (existingExpenses.length !== expenseIds.length) {
      throw new Error('One or more expense IDs not found');
    }

    // Update all expenses
    return databaseService.executeQuery(`
      UPDATE expenses 
      SET status = ?, updated_at = datetime('now')
      WHERE id IN (${placeholders})
    `, [status, ...expenseIds]).changes;
  }

  /**
   * Get expenses by date range
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Object} - Expenses and summary for date range
   */
  async getExpensesByDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      throw new Error('start_date and end_date are required');
    }

    const expenses = databaseService.getMany(`
      SELECT * FROM expenses
      WHERE date BETWEEN ? AND ?
      ORDER BY date DESC, created_at DESC
    `, [startDate, endDate]);

    const summary = databaseService.getOne(`
      SELECT 
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount
      FROM expenses
      WHERE date BETWEEN ? AND ?
    `, [startDate, endDate]);

    return {
      expenses,
      summary
    };
  }

  /**
   * Bulk import expenses from array
   * @param {Array} expenseList - Array of expense objects
   * @returns {Object} - Import results
   */
  async bulkImportExpenses(expenseList) {
    if (!expenseList || !Array.isArray(expenseList) || expenseList.length === 0) {
      throw new Error('expenses must be a non-empty array');
    }

    if (expenseList.length > 1000) {
      throw new Error('Maximum 1000 expenses can be imported at once');
    }

    const results = {
      imported: 0,
      failed: 0,
      errors: []
    };

    // Helper function to convert date formats to ISO 8601
    const convertToISODate = (dateStr) => {
      if (!dateStr) return null;
      
      // If already in ISO format, return as is
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}T/)) {
        return dateStr;
      }
      
      // Convert YYYY-MM-DD to YYYY-MM-DDTHH:MM:SS.sssZ
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr + 'T00:00:00.000Z';
      }
      
      // Try to parse other date formats
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return null;
      }
      
      return date.toISOString();
    };

    // Process in transaction
    return databaseService.executeTransaction(() => {
      let nextId = databaseService.getNextId('expenses');

      for (const expense of expenseList) {
        try {
          // Validate required fields
          if (!expense.date || !expense.merchant || !expense.category || !expense.amount) {
            results.failed++;
            results.errors.push({
              expense,
              error: 'Missing required fields: date, merchant, category, and amount are required'
            });
            continue;
          }

          // Convert and validate date
          const isoDate = convertToISODate(expense.date);
          if (!isoDate) {
            results.failed++;
            results.errors.push({
              expense,
              error: `Invalid date format: ${expense.date}`
            });
            continue;
          }

          // Validate amount is positive
          const amount = parseFloat(expense.amount);
          if (isNaN(amount) || amount <= 0) {
            results.failed++;
            results.errors.push({
              expense,
              error: `Invalid amount: must be a positive number, got ${expense.amount}`
            });
            continue;
          }

          // Set defaults and validate lengths
          const merchant = (expense.merchant || expense.description || 'Unknown Merchant').slice(0, 100);
          let category = (expense.category || 'Other').slice(0, 50);
          const description = (expense.description || '').slice(0, 500);
          const status = expense.status || 'pending';

          const now = new Date().toISOString();

          // Insert expense
          const insertData = {
            id: nextId,
            date: isoDate,
            merchant,
            category,
            amount,
            description,
            receipt_url: null,
            status,
            created_at: now,
            updated_at: now
          };

          databaseService.insert('expenses', insertData);

          results.imported++;
          nextId++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            expense,
            error: error.message
          });
        }
      }

      // Update counter to current nextId - 1 (since we incremented after each insert)
      databaseService.executeQuery('INSERT OR REPLACE INTO counters (name, value) VALUES (?, ?)', ['expenses', nextId - 1]);

      return results;
    });
  }

  /**
   * Bulk delete expenses
   * @param {Array} expenseIds - Array of expense IDs to delete
   * @returns {number} - Number of deleted rows
   */
  async bulkDeleteExpenses(expenseIds) {
    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      throw new Error('expense_ids must be a non-empty array');
    }

    if (expenseIds.length > 500) {
      throw new Error('Maximum 500 expenses can be deleted at once');
    }

    // Validate all expense IDs exist
    const placeholders = expenseIds.map(() => '?').join(',');
    const existingExpenses = databaseService.getMany(`SELECT id FROM expenses WHERE id IN (${placeholders})`, expenseIds);
    
    if (existingExpenses.length !== expenseIds.length) {
      throw new Error('One or more expense IDs not found');
    }

    // Delete all expenses
    return databaseService.executeQuery(`DELETE FROM expenses WHERE id IN (${placeholders})`, expenseIds).changes;
  }

  /**
   * Bulk update expense category
   * @param {Array} expenseIds - Array of expense IDs
   * @param {string} category - New category
   * @returns {number} - Number of changed rows
   */
  async bulkUpdateExpenseCategory(expenseIds, category) {
    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      throw new Error('expense_ids must be a non-empty array');
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      throw new Error('category must be a non-empty string');
    }

    if (category.length > 50) {
      throw new Error('category must be 50 characters or less');
    }

    if (expenseIds.length > 500) {
      throw new Error('Maximum 500 expenses can be updated at once');
    }

    // Validate all expense IDs exist
    const placeholders = expenseIds.map(() => '?').join(',');
    const existingExpenses = databaseService.getMany(`SELECT id FROM expenses WHERE id IN (${placeholders})`, expenseIds);
    
    if (existingExpenses.length !== expenseIds.length) {
      throw new Error('One or more expense IDs not found');
    }

    // Update all expenses
    return databaseService.executeQuery(`
      UPDATE expenses 
      SET category = ?, updated_at = datetime('now')
      WHERE id IN (${placeholders})
    `, [category.trim(), ...expenseIds]).changes;
  }

  /**
   * Bulk update expense merchant
   * @param {Array} expenseIds - Array of expense IDs
   * @param {string} merchant - New merchant
   * @returns {number} - Number of changed rows
   */
  async bulkUpdateExpenseMerchant(expenseIds, merchant) {
    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      throw new Error('expense_ids must be a non-empty array');
    }

    if (!merchant || typeof merchant !== 'string' || merchant.trim().length === 0) {
      throw new Error('merchant must be a non-empty string');
    }

    if (merchant.length > 100) {
      throw new Error('merchant must be 100 characters or less');
    }

    if (expenseIds.length > 500) {
      throw new Error('Maximum 500 expenses can be updated at once');
    }

    // Validate all expense IDs exist
    const placeholders = expenseIds.map(() => '?').join(',');
    const existingExpenses = databaseService.getMany(`SELECT id FROM expenses WHERE id IN (${placeholders})`, expenseIds);
    
    if (existingExpenses.length !== expenseIds.length) {
      throw new Error('One or more expense IDs not found');
    }

    // Update all expenses
    return databaseService.executeQuery(`
      UPDATE expenses 
      SET merchant = ?, updated_at = datetime('now')
      WHERE id IN (${placeholders})
    `, [merchant.trim(), ...expenseIds]).changes;
  }

  /**
   * Check if expense exists
   * @param {number} id - Expense ID
   * @returns {boolean} - True if expense exists
   */
  async expenseExists(id) {
    return databaseService.exists('expenses', 'id', id);
  }
}

// Export singleton instance
export const expenseService = new ExpenseService();