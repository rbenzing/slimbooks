// PDF routes for generating PDFs from invoices and reports
// Handles PDF generation endpoints

import { Router } from 'express';
import {
  generateInvoicePDF,
  generateInvoicePDFWithToken,
  generatePagePDF,
  getPDFServiceStatus,
  initializePDFService,
  testInvoicePageAccess
} from '../controllers/pdfController.js';
import {
  requireAuth,
  requireAdmin,
  validateRequest
} from '../middleware/index.js';
import { param, body, query } from 'express-validator';

const router = Router();

// Validation sets
const validateInvoiceId = [
  param('id').isInt({ min: 1 }).withMessage('Invalid invoice ID')
];

const validateToken = [
  query('token').notEmpty().withMessage('Token is required')
];

const validatePagePDF = [
  body('url').isURL().withMessage('Valid URL is required'),
  body('filename').optional().isString().withMessage('Filename must be a string')
];

// Get PDF service status (requires auth)
router.get('/status', requireAuth, getPDFServiceStatus);

// Initialize PDF service (admin only)
router.post('/initialize', requireAuth, requireAdmin, initializePDFService);

// Generate PDF for invoice with provided token
router.get('/invoice/:id', 
  validateInvoiceId,
  validateToken,
  validateRequest,
  generateInvoicePDF
);

// Generate PDF for invoice with auto-generated token (requires auth)
router.get('/invoice/:id/download', 
  requireAuth,
  validateInvoiceId,
  validateRequest,
  generateInvoicePDFWithToken
);

// Generate PDF for custom page/report (requires auth)
router.post('/page',
  requireAuth,
  validatePagePDF,
  validateRequest,
  generatePagePDF
);

// Test invoice page accessibility (for debugging)
router.get('/test-invoice/:id',
  requireAuth,
  validateInvoiceId,
  validateRequest,
  testInvoicePageAccess
);

export default router;
