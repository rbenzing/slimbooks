// Error handling middleware for Slimbooks
// Centralized error handling and logging

import { Request, Response, NextFunction } from 'express';
import { Server } from 'http';
import { Database } from 'better-sqlite3';
import { loggingConfig } from '../config/index.js';

interface SQLiteError extends Error {
  code: string;
  errno?: number;
}

interface MulterError extends Error {
  code: string;
  field?: string;
}

interface JWTError extends Error {
  name: 'JsonWebTokenError' | 'TokenExpiredError';
}

interface ParseError extends Error {
  type: 'entity.parse.failed';
}

interface ErrorLogInfo {
  timestamp: string;
  method: string;
  url: string;
  ip: string | undefined;
  userAgent?: string;
  error: {
    message: string;
    stack: string | undefined;
    type: any;
    statusCode: any;
  };
}

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly type?: string;

  constructor(message: string, statusCode = 500, isOperational = true) {
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
  public readonly type: string = 'DATABASE_ERROR';
  public readonly originalError: Error | null;

  constructor(message: string, originalError: Error | null = null) {
    super(message, 500);
    this.originalError = originalError;
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  public readonly type: string = 'VALIDATION_ERROR';
  public readonly details: unknown;

  constructor(message: string, details: unknown = null) {
    super(message, 400);
    this.details = details;
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  public readonly type: string = 'AUTHENTICATION_ERROR';

  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  public readonly type: string = 'AUTHORIZATION_ERROR';

  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  public readonly type: string = 'NOT_FOUND_ERROR';

  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  public readonly type: string = 'RATE_LIMIT_ERROR';

  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

/**
 * Main error handling middleware
 * Should be the last middleware in the chain
 */
export const errorHandler = (
  err: Error | AppError | SQLiteError | MulterError | JWTError | ParseError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details
  logError(err, req);
  
  // Handle different types of errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      type: err.type,
      timestamp: err.timestamp,
      ...(loggingConfig.level === 'debug' && { stack: err.stack }),
      ...('details' in err && err.details ? { details: err.details } : {})
    });
    return;
  }
  
  // Handle SQLite errors
  if ('code' in err && typeof err.code === 'string' && err.code.startsWith('SQLITE_')) {
    handleSQLiteError(err as SQLiteError, res);
    return;
  }
  
  // Handle validation errors from express-validator
  if ('type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body',
      type: 'PARSE_ERROR'
    });
    return;
  }
  
  // Handle multer errors (file upload)
  if ('code' in err && err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      error: 'File size too large',
      type: 'FILE_SIZE_ERROR'
    });
    return;
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      type: 'JWT_ERROR'
    });
    return;
  }
  
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
      type: 'JWT_EXPIRED_ERROR'
    });
    return;
  }
  
  // Handle unexpected errors
  console.error('Unexpected error:', err);
  
  res.status(500).json({
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
const handleSQLiteError = (err: SQLiteError, res: Response): void => {
  console.error('SQLite error:', err);
  
  switch (err.code) {
    case 'SQLITE_CONSTRAINT_UNIQUE':
      res.status(409).json({
        success: false,
        error: 'Resource already exists',
        type: 'DUPLICATE_ERROR'
      });
      break;
      
    case 'SQLITE_CONSTRAINT_FOREIGNKEY':
      res.status(400).json({
        success: false,
        error: 'Invalid reference to related resource',
        type: 'FOREIGN_KEY_ERROR'
      });
      break;
      
    case 'SQLITE_CONSTRAINT_NOTNULL':
      res.status(400).json({
        success: false,
        error: 'Required field is missing',
        type: 'NULL_CONSTRAINT_ERROR'
      });
      break;
      
    default:
      res.status(500).json({
        success: false,
        error: 'Database operation failed',
        type: 'DATABASE_ERROR'
      });
      break;
  }
};

/**
 * Log error details
 */
const logError = (err: Error, req: Request): void => {
  const userAgent = req.get('User-Agent');
  const errorInfo: ErrorLogInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    ...(userAgent && { userAgent }),
    error: {
      message: err.message,
      stack: err.stack,
      type: 'type' in err ? (err as any).type : err.name,
      statusCode: 'statusCode' in err ? (err as any).statusCode : undefined
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
export const asyncHandler = <T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) => {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
};

/**
 * Request timeout handler
 */
export const timeoutHandler = (timeout = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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
export const gracefulShutdown = (server: Server, db?: Database): void => {
  const shutdown = (signal: string): void => {
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