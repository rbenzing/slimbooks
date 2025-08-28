// Cron job controller for scheduled tasks
// Handles cron endpoints for recurring invoices and other scheduled operations

import { processRecurringInvoices } from '../utils/recurringProcessor.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Process recurring invoices - Cron endpoint
 * POST /api/cron/recurring-invoices
 */
export const processRecurringInvoicesCron = asyncHandler(async (req, res) => {
  console.log('Cron job triggered: Processing recurring invoices');
  
  const result = await processRecurringInvoices();
  
  if (result.success) {
    res.json({
      success: true,
      data: {
        processed: result.processed,
        timestamp: new Date().toISOString()
      },
      message: result.message
    });
  } else {
    res.status(500).json({
      success: false,
      error: result.error,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Health check for cron endpoints
 * GET /api/cron/health
 */
export const cronHealthCheck = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    message: 'Cron service is running'
  });
});