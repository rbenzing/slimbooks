// Payment routes for Slimbooks API
// Handles all payment-related endpoints

import { Router } from 'express';
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentStats,
  bulkDeletePayments
} from '../controllers/index.js';
import {
  requireAuth,
  validateRequest,
  validationSets
} from '../middleware/index.js';

const router: Router = Router();

// All payment routes require authentication
router.use(requireAuth);

// GET /api/payments - Get all payments with optional filtering
router.get('/', getAllPayments);

// GET /api/payments/stats - Get payment statistics
router.get('/stats', getPaymentStats);

// POST /api/payments - Create a new payment
router.post('/',
  validationSets.createPayment,
  validateRequest,
  createPayment
);

// POST /api/payments/bulk-delete - Bulk delete payments
router.post('/bulk-delete',
  validationSets.bulkDeletePayments,
  validateRequest,
  bulkDeletePayments
);

// POST /api/payments/bulk-import - Bulk import payments
router.post('/bulk-import',
  // TODO: Add validation for bulk import
  // validateRequest,
  async (req: any, res: any) => {
    try {
      const { payments } = req.body;
      
      if (!payments || !Array.isArray(payments)) {
        return res.status(400).json({
          success: false,
          error: 'Payments array is required'
        });
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < payments.length; i++) {
        const paymentData = payments[i];
        try {
          await createPayment({
            body: { paymentData },
            user: req.user
          } as any, {
            status: () => ({ json: () => {} }),
            json: (data: any) => {
              if (data.success) {
                successCount++;
              } else {
                errorCount++;
                errors.push(`Payment ${i + 1}: ${data.message || 'Failed to create'}`);
              }
            }
          } as any, () => {});
        } catch (error) {
          errorCount++;
          errors.push(`Payment ${i + 1}: ${error}`);
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
        error: 'Failed to import payments'
      });
    }
  }
);

// GET /api/payments/:id - Get payment by ID
router.get('/:id', getPaymentById);

// PUT /api/payments/:id - Update payment
router.put('/:id',
  validationSets.updatePayment,
  validateRequest,
  updatePayment
);

// DELETE /api/payments/:id - Delete payment
router.delete('/:id', deletePayment);

export default router;