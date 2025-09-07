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
  getExpensesByDateRange
} from '../controllers/index.js';
import {
  requireAuth,
  validateRequest,
  validationSets
} from '../middleware/index.js';

const router: Router = Router();

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

// Update expense
router.put('/:id', 
  validationSets.updateExpense,
  validateRequest,
  updateExpense
);

// Delete expense
router.delete('/:id', 
  validationSets.updateExpense.slice(0, 1), // Just ID validation
  validateRequest,
  deleteExpense
);

// Bulk import expenses
router.post('/bulk-import',
  // TODO: Add validation for bulk import
  // validateRequest,
  async (req: any, res: any) => {
    try {
      const { expenses } = req.body;
      
      if (!expenses || !Array.isArray(expenses)) {
        return res.status(400).json({
          success: false,
          error: 'Expenses array is required'
        });
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < expenses.length; i++) {
        const expenseData = expenses[i];
        try {
          await createExpense({
            body: { expenseData },
            user: req.user
          } as any, {
            status: () => ({ json: () => {} }),
            json: (data: any) => {
              if (data.success) {
                successCount++;
              } else {
                errorCount++;
                errors.push(`Expense ${i + 1}: ${data.message || 'Failed to create'}`);
              }
            }
          } as any, () => {});
        } catch (error) {
          errorCount++;
          errors.push(`Expense ${i + 1}: ${error}`);
        }
      }

      res.json({
        success: true,
        data: {
          imported: successCount,
          failed: errorCount,
          errors
        }
      });
    } catch (error) {
      console.error('Bulk import error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to import expenses'
      });
    }
  }
);

export default router;