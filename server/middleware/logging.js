// Logging middleware for Slimbooks
// Handles request logging, performance monitoring, and audit trails

import { loggingConfig } from '../config/index.js';

/**
 * Request logging middleware
 * Logs all incoming requests with timing information
 */
export const requestLogger = (req, res, next) => {
  if (!loggingConfig.enableRequestLogging) {
    return next();
  }
  
  const start = Date.now();
  const originalSend = res.send;
  
  // Capture request details
  const requestInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length'),
    referer: req.get('Referer')
  };
  
  // Override res.send to capture response details
  res.send = function(data) {
    const duration = Date.now() - start;
    const responseSize = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data || '', 'utf8');
    
    // Log request completion
    logRequest({
      ...requestInfo,
      statusCode: res.statusCode,
      duration,
      responseSize
    });
    
    // Call original send method
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Log request details
 */
const logRequest = (info) => {
  const { timestamp, method, url, ip, statusCode, duration, responseSize } = info;
  
  // Color code based on status
  const statusColor = getStatusColor(statusCode);
  const durationColor = getDurationColor(duration);
  
  console.log(
    `${timestamp} ${statusColor}${statusCode}\x1b[0m ${method} ${url} ` +
    `${durationColor}${duration}ms\x1b[0m ${formatBytes(responseSize)} ${ip}`
  );
  
  // Log slow requests
  if (duration > 1000) {
    console.warn(`⚠️  Slow request detected: ${method} ${url} took ${duration}ms`);
  }
  
  // TODO: Write to log file if file logging is enabled
  // writeToAccessLog(info);
};

/**
 * Get color code for HTTP status
 */
const getStatusColor = (status) => {
  if (status >= 500) return '\x1b[31m'; // Red
  if (status >= 400) return '\x1b[33m'; // Yellow
  if (status >= 300) return '\x1b[36m'; // Cyan
  if (status >= 200) return '\x1b[32m'; // Green
  return '\x1b[0m'; // Default
};

/**
 * Get color code for request duration
 */
const getDurationColor = (duration) => {
  if (duration > 1000) return '\x1b[31m'; // Red (slow)
  if (duration > 500) return '\x1b[33m';  // Yellow (moderate)
  return '\x1b[32m'; // Green (fast)
};

/**
 * Format bytes to human readable format
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Security audit logging middleware
 * Logs security-related events
 */
export const securityLogger = (event, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    level: 'SECURITY'
  };
  
  console.log(`🔒 SECURITY: ${event}`, details);
  
  // TODO: Send to security monitoring system
  // sendToSecurityMonitoring(logEntry);
};

/**
 * Database operation logging middleware
 * Logs database queries and operations
 */
export const dbLogger = (operation, table, details = {}) => {
  if (loggingConfig.level !== 'debug') {
    return;
  }
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    table,
    details
  };
  
  console.log(`📊 DB: ${operation} on ${table}`, details);
};

/**
 * Performance monitoring middleware
 * Tracks application performance metrics
 */
export const performanceMonitor = () => {
  const metrics = {
    requests: 0,
    totalDuration: 0,
    slowRequests: 0,
    errors: 0
  };
  
  // Log metrics every 5 minutes
  setInterval(() => {
    if (metrics.requests > 0) {
      const avgDuration = metrics.totalDuration / metrics.requests;
      console.log(`📈 Performance metrics (5min): ${metrics.requests} requests, ` +
                 `avg ${avgDuration.toFixed(2)}ms, ${metrics.slowRequests} slow, ${metrics.errors} errors`);
      
      // Reset metrics
      Object.keys(metrics).forEach(key => metrics[key] = 0);
    }
  }, 5 * 60 * 1000);
  
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      metrics.requests++;
      metrics.totalDuration += duration;
      
      if (duration > 1000) {
        metrics.slowRequests++;
      }
      
      if (res.statusCode >= 400) {
        metrics.errors++;
      }
    });
    
    next();
  };
};

/**
 * User activity logging
 * Logs user actions for audit trails
 */
export const userActivityLogger = (action, userId, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    details,
    level: 'USER_ACTIVITY'
  };
  
  console.log(`👤 USER: ${action} by user ${userId}`, details);
  
  // TODO: Store in audit log table
  // storeUserActivity(logEntry);
};

/**
 * API endpoint usage tracking
 * Tracks which endpoints are being used
 */
export const endpointTracker = () => {
  const endpointStats = new Map();
  
  // Log endpoint usage every hour
  setInterval(() => {
    if (endpointStats.size > 0) {
      console.log('📊 Endpoint usage (1hr):');
      const sorted = Array.from(endpointStats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      sorted.forEach(([endpoint, count]) => {
        console.log(`  ${endpoint}: ${count} requests`);
      });
      
      endpointStats.clear();
    }
  }, 60 * 60 * 1000);
  
  return (req, res, next) => {
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    endpointStats.set(endpoint, (endpointStats.get(endpoint) || 0) + 1);
    next();
  };
};

/**
 * Error rate monitoring
 * Tracks error rates and alerts on high error rates
 */
export const errorRateMonitor = () => {
  const errorWindow = [];
  const windowSize = 100; // Track last 100 requests
  const errorThreshold = 0.1; // Alert if error rate > 10%
  
  return (req, res, next) => {
    res.on('finish', () => {
      const isError = res.statusCode >= 400;
      errorWindow.push(isError);
      
      // Keep window size
      if (errorWindow.length > windowSize) {
        errorWindow.shift();
      }
      
      // Check error rate
      if (errorWindow.length >= windowSize) {
        const errorCount = errorWindow.filter(Boolean).length;
        const errorRate = errorCount / windowSize;
        
        if (errorRate > errorThreshold) {
          console.warn(`🚨 High error rate detected: ${(errorRate * 100).toFixed(1)}% (${errorCount}/${windowSize})`);
          
          // TODO: Send alert to monitoring system
          // sendErrorRateAlert(errorRate);
        }
      }
    });
    
    next();
  };
};

/**
 * Health check logging
 * Logs system health information
 */
export const healthLogger = () => {
  const logHealth = () => {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    console.log(`💚 Health check: Uptime ${Math.floor(uptime)}s, ` +
               `Memory ${formatBytes(memUsage.heapUsed)}/${formatBytes(memUsage.heapTotal)}`);
  };
  
  // Log health every 10 minutes
  setInterval(logHealth, 10 * 60 * 1000);
  
  // Log initial health
  logHealth();
};
