// Expense routes for Slimbooks API
// Handles all expense-related endpoints

import { Router } from 'express';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getExpenseCategories,
  updateExpenseStatus,
  bulkUpdateExpenseStatus,
  getExpensesByDateRange,
  bulkImportExpenses,
  bulkDeleteExpenses,
  bulkUpdateExpenseCategory,
  bulkUpdateExpenseMerchant
} from '../controllers/index.js';
import {
  requireAuth,
  validateRequest,
  validationSets
} from '../middleware/index.js';

const router = Router();

// All expense routes require authentication
router.use(requireAuth);

// Get all expenses
router.get('/', getAllExpenses);

// Get expense statistics
router.get('/stats', getExpenseStats);

// Get expense categories
router.get('/categories', getExpenseCategories);

// Get expenses by date range
router.get('/date-range', getExpensesByDateRange);

// Get expense by ID
router.get('/:id', 
  validationSets.updateExpense.slice(0, 1), // Just ID validation
  validateRequest,
  getExpenseById
);

// Create new expense
router.post('/', 
  validationSets.createExpense,
  validateRequest,
  createExpense
);

// Bulk import expenses
router.post('/bulk-import', 
  bulkImportExpenses
);

// Bulk delete expenses
router.post('/bulk-delete', 
  bulkDeleteExpenses
);

// Bulk update expense category
router.post('/bulk-category', 
  bulkUpdateExpenseCategory
);

// Bulk update expense merchant
router.post('/bulk-merchant', 
  bulkUpdateExpenseMerchant
);

// Bulk update expense status
router.post('/bulk-status', 
  bulkUpdateExpenseStatus
);

// Update expense
router.put('/:id', 
  validationSets.updateExpense,
  validateRequest,
  updateExpense
);

// Update expense status
router.patch('/:id/status', 
  validationSets.updateExpense.slice(0, 1), // Just ID validation
  validateRequest,
  updateExpenseStatus
);

// Delete expense
router.delete('/:id', 
  validationSets.updateExpense.slice(0, 1), // Just ID validation
  validateRequest,
  deleteExpense
);

export default router;
