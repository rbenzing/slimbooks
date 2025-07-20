// Error handling middleware for Slimbooks
// Centralized error handling and logging

import { loggingConfig } from '../config/index.js';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Database error class
 */
export class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500);
    this.type = 'DATABASE_ERROR';
    this.originalError = originalError;
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.type = 'VALIDATION_ERROR';
    this.details = details;
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.type = 'AUTHENTICATION_ERROR';
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.type = 'AUTHORIZATION_ERROR';
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.type = 'NOT_FOUND_ERROR';
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.type = 'RATE_LIMIT_ERROR';
  }
}

/**
 * Main error handling middleware
 * Should be the last middleware in the chain
 */
export const errorHandler = (err, req, res, next) => {
  // Log error details
  logError(err, req);
  
  // Handle different types of errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      type: err.type,
      timestamp: err.timestamp,
      ...(loggingConfig.level === 'debug' && { stack: err.stack }),
      ...(err.details && { details: err.details })
    });
  }
  
  // Handle SQLite errors
  if (err.code && err.code.startsWith('SQLITE_')) {
    return handleSQLiteError(err, res);
  }
  
  // Handle validation errors from express-validator
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body',
      type: 'PARSE_ERROR'
    });
  }
  
  // Handle multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File size too large',
      type: 'FILE_SIZE_ERROR'
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      type: 'JWT_ERROR'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      type: 'JWT_EXPIRED_ERROR'
    });
  }
  
  // Handle unexpected errors
  console.error('Unexpected error:', err);
  
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    type: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

/**
 * Handle SQLite specific errors
 */
const handleSQLiteError = (err, res) => {
  console.error('SQLite error:', err);
  
  switch (err.code) {
    case 'SQLITE_CONSTRAINT_UNIQUE':
      return res.status(409).json({
        success: false,
        error: 'Resource already exists',
        type: 'DUPLICATE_ERROR'
      });
      
    case 'SQLITE_CONSTRAINT_FOREIGNKEY':
      return res.status(400).json({
        success: false,
        error: 'Invalid reference to related resource',
        type: 'FOREIGN_KEY_ERROR'
      });
      
    case 'SQLITE_CONSTRAINT_NOTNULL':
      return res.status(400).json({
        success: false,
        error: 'Required field is missing',
        type: 'NULL_CONSTRAINT_ERROR'
      });
      
    default:
      return res.status(500).json({
        success: false,
        error: 'Database operation failed',
        type: 'DATABASE_ERROR'
      });
  }
};

/**
 * Log error details
 */
const logError = (err, req) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    error: {
      message: err.message,
      stack: err.stack,
      type: err.type || err.name,
      statusCode: err.statusCode
    }
  };
  
  if (loggingConfig.enableErrorLogging) {
    console.error('Error occurred:', JSON.stringify(errorInfo, null, 2));
  }
  
  // TODO: Implement file logging or external logging service
  // writeToLogFile('error.log', errorInfo);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
};

/**
 * Request timeout handler
 */
export const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        const error = new AppError('Request timeout', 408);
        next(error);
      }
    }, timeout);
    
    res.on('finish', () => {
      clearTimeout(timer);
    });
    
    next();
  };
};

/**
 * Graceful shutdown handler
 */
export const gracefulShutdown = (server, db) => {
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    server.close((err) => {
      if (err) {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('HTTP server closed.');
      
      // Close database connection
      if (db && typeof db.close === 'function') {
        try {
          db.close();
          console.log('Database connection closed.');
        } catch (dbErr) {
          console.error('Error closing database:', dbErr);
        }
      }
      
      console.log('Graceful shutdown completed.');
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};
