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

const router = Router();

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