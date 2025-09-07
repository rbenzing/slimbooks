// Cron job controller for scheduled tasks
// Handles cron endpoints for recurring invoices and other scheduled operations

import { Request, Response } from 'express';
import { processRecurringInvoices } from '../utils/recurringProcessor.js';
import { asyncHandler } from '../middleware/index.js';

/**
 * Recurring invoices processing result interface
 */
interface RecurringProcessResult {
  success: boolean;
  processed?: number;
  message?: string;
  error?: string;
}

/**
 * Process recurring invoices - Cron endpoint
 * POST /api/cron/recurring-invoices
 */
export const processRecurringInvoicesCron = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  console.log('Cron job triggered: Processing recurring invoices');
  
  try {
    const result: RecurringProcessResult = await processRecurringInvoices();
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          processed: result.processed || 0,
          timestamp: new Date().toISOString()
        },
        message: result.message || 'Recurring invoices processed successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error('Error processing recurring invoices:', errorMessage);
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Health check for cron endpoints
 * GET /api/cron/health
 */
export const cronHealthCheck = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    },
    message: 'Cron service is running'
  });
});

/**
 * Get cron job status and statistics
 * GET /api/cron/status
 */
export const getCronStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const status = {
    service: 'active',
    lastRun: null as string | null,
    nextRun: null as string | null,
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0
  };

  // In a real implementation, you would track these statistics
  // For now, we'll return basic status information
  
  res.json({
    success: true,
    data: {
      ...status,
      timestamp: new Date().toISOString()
    },
    message: 'Cron status retrieved successfully'
  });
});

/**
 * Manual trigger for recurring invoice processing
 * POST /api/cron/trigger-recurring
 */
export const triggerRecurringInvoices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  console.log('Manual trigger: Processing recurring invoices');
  
  try {
    const result: RecurringProcessResult = await processRecurringInvoices();
    
    res.json({
      success: true,
      data: {
        processed: result.processed || 0,
        timestamp: new Date().toISOString(),
        triggeredBy: 'manual'
      },
      message: result.message || 'Recurring invoices processing triggered manually'
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error('Error in manual recurring invoice trigger:', errorMessage);
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});