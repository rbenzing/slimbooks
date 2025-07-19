// Security middleware for Slimbooks server
// Implements rate limiting, input validation, and security headers

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, param, query, validationResult } from 'express-validator';

// Rate limiting configurations
export const createGeneralRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs, // 15 minutes default
    max, // limit each IP to max requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

export const createLoginRateLimit = (windowMs = 15 * 60 * 1000, max = 5) => {
  return rateLimit({
    windowMs, // 15 minutes default
    max, // limit each IP to max login attempts per windowMs
    message: {
      error: 'Too many login attempts from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    skipSuccessfulRequests: true, // Don't count successful requests
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many login attempts from this IP, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Security headers configuration
export const createSecurityHeaders = (corsOrigin = 'http://localhost:8080') => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for compatibility
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  });
};

// Input validation middleware
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

// Common validation rules
export const validationRules = {
  // User validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters'),
  
  name: body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  
  // Database query validation
  sql: body('sql')
    .custom((value) => {
      // Block dangerous SQL operations
      const dangerousPatterns = [
        /DROP\s+TABLE/i,
        /DELETE\s+FROM/i,
        /TRUNCATE/i,
        /ALTER\s+TABLE/i,
        /CREATE\s+TABLE/i,
        /UPDATE.*SET/i
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          throw new Error('SQL operation not allowed');
        }
      }
      return true;
    }),
  
  // ID validation
  id: param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  
  // Invoice validation
  invoiceNumber: body('invoice_number')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Invoice number must be between 1 and 50 characters'),
  
  amount: body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  
  // Client validation
  clientName: body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Client name must be between 1 and 100 characters'),
  
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
  
  // File upload validation
  fileSize: (maxSize = 10 * 1024 * 1024) => (req, res, next) => {
    if (req.file && req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`
      });
    }
    next();
  }
};

// SQL injection protection for dynamic queries
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

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    originalSend.call(this, data);
  };
  
  next();
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
};

// Authentication middleware
export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  // TODO: Implement JWT verification here
  // For now, just pass through
  next();
};

// Admin role middleware
export const requireAdmin = (req, res, next) => {
  // TODO: Implement admin role check
  // For now, just pass through
  next();
};

// CORS configuration
export const createCorsOptions = (origin = 'http://localhost:8080') => {
  return {
    origin: origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 hours
  };
};
