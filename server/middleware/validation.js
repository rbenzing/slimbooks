// Validation middleware for Slimbooks
// Handles input validation, sanitization, and validation rules

import { body, param, query, validationResult } from 'express-validator';
import { validationConfig } from '../config/index.js';

/**
 * Middleware to check validation results
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Common validation rules
 */
export const validationRules = {
  // User validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address')
    .isLength({ max: validationConfig.maxFieldLengths.email })
    .withMessage(`Email must be less than ${validationConfig.maxFieldLengths.email} characters`),
  
  password: body('password')
    .isLength({ 
      min: validationConfig.password.minLength, 
      max: validationConfig.password.maxLength 
    })
    .withMessage(`Password must be between ${validationConfig.password.minLength} and ${validationConfig.password.maxLength} characters`),
  
  name: body('name')
    .trim()
    .isLength({ min: 1, max: validationConfig.maxFieldLengths.name })
    .withMessage(`Name must be between 1 and ${validationConfig.maxFieldLengths.name} characters`)
    .escape(),
  
  // ID validation
  id: param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  
  // Invoice validation
  invoiceNumber: body('invoice_number')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Invoice number must be between 1 and 50 characters')
    .escape(),
  
  amount: body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  
  // Client validation
  clientName: body('name')
    .trim()
    .isLength({ min: 1, max: validationConfig.maxFieldLengths.name })
    .withMessage(`Client name must be between 1 and ${validationConfig.maxFieldLengths.name} characters`)
    .escape(),
  
  clientEmail: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  
  // Settings validation
  settingsKey: body('key')
    .trim()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Settings key must contain only alphanumeric characters, dots, hyphens, and underscores'),
  
  // Date validation
  date: body('date')
    .isISO8601()
    .withMessage('Date must be in ISO 8601 format'),
  
  // Description validation
  description: body('description')
    .optional()
    .trim()
    .isLength({ max: validationConfig.maxFieldLengths.description })
    .withMessage(`Description must be less than ${validationConfig.maxFieldLengths.description} characters`)
    .escape(),
  
  // Notes validation
  notes: body('notes')
    .optional()
    .trim()
    .isLength({ max: validationConfig.maxFieldLengths.notes })
    .withMessage(`Notes must be less than ${validationConfig.maxFieldLengths.notes} characters`)
    .escape(),
  
  // Phone validation
  phone: body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Must be a valid phone number'),
  
  // Status validation
  status: body('status')
    .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .withMessage('Status must be one of: draft, sent, paid, overdue, cancelled'),
  
  // Role validation
  role: body('role')
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  
  // Category validation (for expenses)
  category: body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters')
    .escape(),
  
  // Merchant validation (for expenses)
  merchant: body('merchant')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Merchant must be between 1 and 100 characters')
    .escape()
};

/**
 * Validation rule sets for different endpoints
 */
export const validationSets = {
  // User validation sets
  createUser: [
    validationRules.name,
    validationRules.email,
    validationRules.password,
    validationRules.role
  ],
  
  updateUser: [
    validationRules.id,
    body('name').optional().trim().isLength({ min: 1, max: 100 }).escape(),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['user', 'admin'])
  ],
  
  // Client validation sets
  createClient: [
    validationRules.clientName,
    validationRules.clientEmail,
    body('phone').optional().trim().escape(),
    body('company').optional().trim().isLength({ max: 100 }).escape(),
    body('address').optional().trim().isLength({ max: 200 }).escape()
  ],
  
  updateClient: [
    validationRules.id,
    body('name').optional().trim().isLength({ min: 1, max: 100 }).escape(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().escape(),
    body('company').optional().trim().isLength({ max: 100 }).escape()
  ],
  
  // Invoice validation sets
  createInvoice: [
    validationRules.invoiceNumber,
    body('client_id').isInt({ min: 1 }).withMessage('Client ID must be a positive integer'),
    validationRules.amount,
    body('tax_amount').optional().isFloat({ min: 0 }).withMessage('Tax amount must be positive'),
    body('due_date').isISO8601().withMessage('Due date must be in ISO 8601 format'),
    body('issue_date').isISO8601().withMessage('Issue date must be in ISO 8601 format'),
    validationRules.description,
    validationRules.status
  ],
  
  updateInvoice: [
    validationRules.id,
    body('amount').optional().isFloat({ min: 0 }),
    body('tax_amount').optional().isFloat({ min: 0 }),
    body('due_date').optional().isISO8601(),
    body('issue_date').optional().isISO8601(),
    body('status').optional().isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
  ],
  
  // Expense validation sets
  createExpense: [
    validationRules.date,
    validationRules.merchant,
    validationRules.category,
    validationRules.amount,
    validationRules.description,
    body('status').optional().isIn(['pending', 'approved', 'rejected'])
  ],
  
  updateExpense: [
    validationRules.id,
    body('date').optional().isISO8601(),
    body('merchant').optional().trim().isLength({ min: 1, max: 100 }).escape(),
    body('category').optional().trim().isLength({ min: 1, max: 50 }).escape(),
    body('amount').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['pending', 'approved', 'rejected'])
  ],
  
  // Payment validation sets
  getPayments: [
    query('status').optional().isIn(['received', 'pending', 'failed', 'refunded']),
    query('method').optional().trim().isLength({ max: 50 }),
    query('date_from').optional().isISO8601(),
    query('date_to').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  
  getPaymentById: [
    validationRules.id
  ],
  
  createPayment: [
    body('paymentData.date').isISO8601().withMessage('Date must be in ISO 8601 format'),
    body('paymentData.client_name').trim().isLength({ min: 1, max: 100 }).withMessage('Client name is required and must be less than 100 characters').escape(),
    body('paymentData.amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('paymentData.method').isIn(['cash', 'check', 'bank_transfer', 'credit_card', 'paypal', 'other']).withMessage('Invalid payment method'),
    body('paymentData.invoice_id').optional().isInt({ min: 1 }).withMessage('Invoice ID must be a positive integer'),
    body('paymentData.reference').optional().trim().isLength({ max: 100 }).escape(),
    body('paymentData.description').optional().trim().isLength({ max: 500 }).escape(),
    body('paymentData.status').optional().isIn(['received', 'pending', 'failed', 'refunded'])
  ],
  
  updatePayment: [
    validationRules.id,
    body('paymentData.date').optional().isISO8601(),
    body('paymentData.client_name').optional().trim().isLength({ min: 1, max: 100 }).escape(),
    body('paymentData.amount').optional().isFloat({ min: 0.01 }),
    body('paymentData.method').optional().isIn(['cash', 'check', 'bank_transfer', 'credit_card', 'paypal', 'other']),
    body('paymentData.invoice_id').optional().isInt({ min: 1 }),
    body('paymentData.reference').optional().trim().isLength({ max: 100 }).escape(),
    body('paymentData.description').optional().trim().isLength({ max: 500 }).escape(),
    body('paymentData.status').optional().isIn(['received', 'pending', 'failed', 'refunded'])
  ],
  
  deletePayment: [
    validationRules.id
  ],
  
  getPaymentStats: [
    query('date_from').optional().isISO8601(),
    query('date_to').optional().isISO8601()
  ],
  
  bulkDeletePayments: [
    body('payment_ids').isArray({ min: 1 }).withMessage('Payment IDs array is required'),
    body('payment_ids.*').isInt({ min: 1 }).withMessage('All payment IDs must be positive integers')
  ],
  
  // Authentication validation sets
  login: [
    validationRules.email,
    validationRules.password
  ],
  
  register: [
    validationRules.name,
    validationRules.email,
    validationRules.password
  ],
  
  forgotPassword: [
    validationRules.email
  ],
  
  resetPassword: [
    body('token').notEmpty().withMessage('Reset token is required'),
    validationRules.password
  ]
};

/**
 * File upload validation middleware
 * @param {number} maxSize - Maximum file size in bytes
 */
export const validateFileUpload = (maxSize = validationConfig.maxFileSize) => {
  return (req, res, next) => {
    if (req.file && req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`
      });
    }
    
    if (req.file && !validationConfig.allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only database files are allowed.'
      });
    }
    
    next();
  };
};

/**
 * SQL injection protection for dynamic queries
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object} Sanitized query and parameters
 */
export const sanitizeSQL = (query, params = []) => {
  // Basic SQL injection protection
  // In production, use parameterized queries exclusively
  const sanitizedParams = params.map(param => {
    if (typeof param === 'string') {
      return param.replace(/['"\\]/g, '');
    }
    return param;
  });
  
  return { query, params: sanitizedParams };
};
