// Payment controller for Slimbooks
// Handles all payment-related business logic

import { paymentService } from '../services/PaymentService.js';
import { 
  AppError, 
  NotFoundError, 
  ValidationError,
  asyncHandler
} from '../middleware/index.js';

/**
 * Get all payments
 */
export const getAllPayments = asyncHandler(async (req, res) => {
  const { status, method, date_from, date_to, limit = 50, offset = 0 } = req.query;
  
  const filters = { status, method, date_from, date_to };
  const results = await paymentService.getAllPayments(filters, limit, offset);
  
  res.json({ 
    success: true, 
    data: results
  });
});

/**
 * Get payment by ID
 */
export const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const payment = await paymentService.getPaymentById(id);

  if (!payment) {
    throw new NotFoundError('Payment');
  }

  res.json({ success: true, data: payment });
});

/**
 * Create new payment
 */
export const createPayment = asyncHandler(async (req, res) => {
  const { paymentData } = req.body;

  if (!paymentData) {
    throw new ValidationError('Payment data is required');
  }

  try {
    const paymentId = await paymentService.createPayment(paymentData);
    
    res.status(201).json({ 
      success: true, 
      data: { id: paymentId },
      message: 'Payment created successfully'
    });
  } catch (error) {
    throw new ValidationError(error.message);
  }
});

/**
 * Update payment
 */
export const updatePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentData } = req.body;

  if (!id || !paymentData) {
    throw new ValidationError('Invalid parameters');
  }

  try {
    const changes = await paymentService.updatePayment(id, paymentData);
    
    res.json({ 
      success: true, 
      data: { changes },
      message: 'Payment updated successfully'
    });
  } catch (error) {
    if (error.message === 'Payment not found') {
      throw new NotFoundError('Payment');
    }
    throw new ValidationError(error.message);
  }
});

/**
 * Delete payment
 */
export const deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const changes = await paymentService.deletePayment(id);
    
    res.json({ 
      success: true, 
      data: { changes },
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Payment not found') {
      throw new NotFoundError('Payment');
    }
    throw new AppError(error.message, 500);
  }
});

/**
 * Bulk delete payments
 */
export const bulkDeletePayments = asyncHandler(async (req, res) => {
  const { payment_ids } = req.body;

  try {
    const changes = await paymentService.bulkDeletePayments(payment_ids);
    
    res.json({ 
      success: true, 
      data: { changes },
      message: `${changes} payments deleted successfully`
    });
  } catch (error) {
    throw new ValidationError(error.message);
  }
});

/**
 * Get payment statistics
 */
export const getPaymentStats = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  
  const stats = await paymentService.getPaymentStats(year, month);

  res.json({ 
    success: true, 
    data: stats
  });
});