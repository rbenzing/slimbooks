// Expense controller for Slimbooks
// Handles all expense-related business logic

import { expenseService } from '../services/ExpenseService.js';
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
  
  const filters = { status, category, date_from, date_to };
  const results = await expenseService.getAllExpenses(filters, limit, offset);
  
  res.json({ 
    success: true, 
    data: results
  });
});

/**
 * Get expense by ID
 */
export const getExpenseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const expense = await expenseService.getExpenseById(id);

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

  if (!expenseData) {
    throw new ValidationError('Expense data is required');
  }

  try {
    const expenseId = await expenseService.createExpense(expenseData);
    
    res.status(201).json({ 
      success: true, 
      data: { id: expenseId },
      message: 'Expense created successfully'
    });
  } catch (error) {
    throw new ValidationError(error.message);
  }
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

  try {
    const changes = await expenseService.updateExpense(id, expenseData);
    
    res.json({ 
      success: true, 
      data: { changes },
      message: 'Expense updated successfully'
    });
  } catch (error) {
    if (error.message === 'Expense not found') {
      throw new NotFoundError('Expense');
    }
    throw new ValidationError(error.message);
  }
});

/**
 * Delete expense
 */
export const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const changes = await expenseService.deleteExpense(id);
    
    res.json({ 
      success: true, 
      data: { changes },
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Expense not found') {
      throw new NotFoundError('Expense');
    }
    throw new AppError(error.message, 500);
  }
});

/**
 * Get expense statistics
 */
export const getExpenseStats = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  
  const stats = await expenseService.getExpenseStats(year, month);

  res.json({ 
    success: true, 
    data: stats
  });
});

/**
 * Get expense categories
 */
export const getExpenseCategories = asyncHandler(async (req, res) => {
  const categories = await expenseService.getExpenseCategories();
  res.json({ success: true, data: categories });
});

/**
 * Update expense status
 */
export const updateExpenseStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const changes = await expenseService.updateExpenseStatus(id, status);
    
    res.json({ 
      success: true, 
      data: { changes },
      message: `Expense status updated to ${status}`
    });
  } catch (error) {
    if (error.message === 'Expense not found') {
      throw new NotFoundError('Expense');
    }
    throw new ValidationError(error.message);
  }
});

/**
 * Bulk update expense status
 */
export const bulkUpdateExpenseStatus = asyncHandler(async (req, res) => {
  const { expense_ids, status } = req.body;

  try {
    const changes = await expenseService.bulkUpdateExpenseStatus(expense_ids, status);
    
    res.json({ 
      success: true, 
      data: { changes },
      message: `${changes} expenses updated to ${status}`
    });
  } catch (error) {
    throw new ValidationError(error.message);
  }
});

/**
 * Get expenses by date range
 */
export const getExpensesByDateRange = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  try {
    const results = await expenseService.getExpensesByDateRange(start_date, end_date);
    res.json({ 
      success: true, 
      data: results
    });
  } catch (error) {
    throw new ValidationError(error.message);
  }
});

/**
 * Bulk import expenses from CSV data
 */
export const bulkImportExpenses = asyncHandler(async (req, res) => {
  const { expenses: expenseList } = req.body;

  try {
    const results = await expenseService.bulkImportExpenses(expenseList);
    
    res.json({
      success: true,
      data: results,
      message: `Bulk import completed: ${results.imported} imported, ${results.failed} failed`
    });
  } catch (error) {
    if (error.message.includes('Bulk import failed')) {
      throw new AppError(error.message, 500);
    }
    throw new ValidationError(error.message);
  }
});

/**
 * Bulk delete expenses
 */
export const bulkDeleteExpenses = asyncHandler(async (req, res) => {
  const { expense_ids } = req.body;

  try {
    const changes = await expenseService.bulkDeleteExpenses(expense_ids);
    
    res.json({ 
      success: true, 
      data: { changes },
      message: `${changes} expenses deleted successfully`
    });
  } catch (error) {
    throw new ValidationError(error.message);
  }
});

/**
 * Bulk update expense category
 */
export const bulkUpdateExpenseCategory = asyncHandler(async (req, res) => {
  const { expense_ids, category } = req.body;

  try {
    const changes = await expenseService.bulkUpdateExpenseCategory(expense_ids, category);
    
    res.json({ 
      success: true, 
      data: { changes },
      message: `${changes} expenses updated to category "${category}"`
    });
  } catch (error) {
    throw new ValidationError(error.message);
  }
});

/**
 * Bulk update expense merchant
 */
export const bulkUpdateExpenseMerchant = asyncHandler(async (req, res) => {
  const { expense_ids, merchant } = req.body;

  try {
    const changes = await expenseService.bulkUpdateExpenseMerchant(expense_ids, merchant);
    
    res.json({ 
      success: true, 
      data: { changes },
      message: `${changes} expenses updated to merchant "${merchant}"`
    });
  } catch (error) {
    throw new ValidationError(error.message);
  }
});
