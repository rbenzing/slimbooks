// PDF Controller for generating PDFs from invoices and reports
// Uses Puppeteer to capture public invoice URLs

import pdfGeneratorService from '../services/pdfGenerator.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { db } from '../models/index.js';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/index.js';

/**
 * Generate PDF for an invoice
 */
export const generateInvoicePDF = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { token } = req.query;

  if (!id) {
    throw new ValidationError('Invoice ID is required');
  }

  if (!token) {
    throw new ValidationError('Token is required');
  }

  // Verify the invoice exists and belongs to the authenticated user
  const invoice = db.prepare(`
    SELECT i.*, c.name as client_name 
    FROM invoices i 
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = ?
  `).get(id);

  if (!invoice) {
    throw new NotFoundError('Invoice');
  }

  try {
    // Generate PDF using the public invoice URL
    const pdfBuffer = await pdfGeneratorService.generateInvoicePDF(id, token);

    // Set response headers for PDF download
    const filename = `Invoice-${invoice.invoice_number || id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the PDF buffer
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
});

/**
 * Generate PDF for a report or custom page
 */
export const generatePagePDF = asyncHandler(async (req, res) => {
  const { url, filename } = req.body;

  if (!url) {
    throw new ValidationError('URL is required');
  }

  // Validate that the URL is from our domain (security measure)
  const allowedDomains = [
    'localhost:4173',
    'localhost:3002',
    process.env.CLIENT_URL,
    process.env.SERVER_URL
  ].filter(Boolean);

  const urlObj = new URL(url);
  const isAllowedDomain = allowedDomains.some(domain => 
    urlObj.host === domain || url.startsWith('http://localhost') || url.startsWith('https://localhost')
  );

  if (!isAllowedDomain) {
    throw new ValidationError('URL not allowed');
  }

  try {
    const pdfBuffer = await pdfGeneratorService.generatePagePDF(url);

    const pdfFilename = filename || 'document.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating page PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
});

/**
 * Get PDF service status
 */
export const getPDFServiceStatus = asyncHandler(async (req, res) => {
  const status = pdfGeneratorService.getStatus();
  
  res.json({
    success: true,
    data: {
      service: 'PDF Generator',
      ...status,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * Initialize PDF service (admin only)
 */
export const initializePDFService = asyncHandler(async (req, res) => {
  try {
    await pdfGeneratorService.initialize();
    
    res.json({
      success: true,
      message: 'PDF service initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing PDF service:', error);
    throw new Error('Failed to initialize PDF service');
  }
});

/**
 * Generate secure invoice token for PDF generation
 */
export const generateInvoiceToken = (invoiceId) => {
  const tokenPayload = {
    invoiceId: parseInt(invoiceId),
    type: 'public_invoice',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  return jwt.sign(tokenPayload, authConfig.jwtSecret);
};

/**
 * Generate PDF with auto-generated token (for internal use)
 * Applies user settings for optimal PDF output
 */
export const generateInvoicePDFWithToken = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ValidationError('Invoice ID is required');
  }

  // Verify the invoice exists and belongs to the authenticated user
  const invoice = db.prepare(`
    SELECT i.*, c.name as client_name
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = ?
  `).get(id);

  if (!invoice) {
    throw new NotFoundError('Invoice');
  }

  try {
    // Generate token automatically
    const token = generateInvoiceToken(id);

    // Get user settings for PDF generation
    const pdfOptions = await getPDFOptionsFromSettings();

    // Generate PDF using the public invoice URL with user settings
    const pdfBuffer = await pdfGeneratorService.generateInvoicePDF(id, token, pdfOptions);

    // Set response headers for PDF download
    const filename = `Invoice-${invoice.invoice_number || id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    // Ensure binary transfer
    res.setHeader('Content-Transfer-Encoding', 'binary');

    // Send the PDF buffer as binary data
    res.end(pdfBuffer, 'binary');

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
});

/**
 * Test invoice page accessibility (for debugging PDF issues)
 */
export const testInvoicePageAccess = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Generate token
    const token = generateInvoiceToken(id);
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:8080';
    const invoiceUrl = `${baseUrl}/invoice/${id}?token=${token}`;

    console.log(`Testing invoice page access: ${invoiceUrl}`);

    // Test if we can fetch the page
    const response = await fetch(invoiceUrl);
    const content = await response.text();

    res.json({
      success: true,
      data: {
        url: invoiceUrl,
        status: response.status,
        statusText: response.statusText,
        contentLength: content.length,
        contentPreview: content.substring(0, 500),
        hasInvoiceContent: content.includes('bg-card'),
        hasReactRoot: content.includes('root'),
        hasScripts: content.includes('<script')
      }
    });

  } catch (error) {
    console.error('Error testing invoice page access:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to access invoice page'
    });
  }
});

/**
 * Get PDF generation options based on user settings
 */
async function getPDFOptionsFromSettings() {
  try {
    // Get appearance settings for PDF format preference
    const appearanceSettings = db.prepare(`
      SELECT value FROM settings WHERE key = ? AND category = ?
    `).get('pdf_format', 'appearance');

    // Get company settings for branding
    const companySettings = db.prepare(`
      SELECT value FROM settings WHERE key = ? AND category = ?
    `).get('company_settings', 'company');

    // Default PDF options
    const options = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    };

    // Apply format preference if set
    if (appearanceSettings?.value) {
      try {
        const formatSetting = JSON.parse(appearanceSettings.value);
        if (formatSetting.format) {
          options.format = formatSetting.format;
        }
      } catch (e) {
        // Use default if parsing fails
      }
    }

    // Apply company-specific settings if needed
    if (companySettings?.value) {
      try {
        const company = JSON.parse(companySettings.value);
        // Could add company-specific PDF options here
        // e.g., letterhead margins, custom page size, etc.
      } catch (e) {
        // Use defaults if parsing fails
      }
    }

    return options;
  } catch (error) {
    console.error('Error getting PDF settings:', error);
    // Return defaults if settings can't be loaded
    return {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    };
  }
}
