// Utility helper functions for Slimbooks
// Common utility functions used across the application

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Format date to ISO string
 * @param {Date|string} date - Date to format
 * @returns {string} ISO date string
 */
export const formatDate = (date) => {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return new Date(date).toISOString();
  return date.toISOString();
};

/**
 * Generate unique invoice number
 * @param {number} counter - Current counter value
 * @param {string} prefix - Prefix for invoice number
 * @returns {string} Generated invoice number
 */
export const generateInvoiceNumber = (counter, prefix = 'INV') => {
  const year = new Date().getFullYear();
  const paddedCounter = String(counter).padStart(3, '0');
  return `${prefix}-${year}-${paddedCounter}`;
};

/**
 * Calculate invoice total
 * @param {number} amount - Base amount
 * @param {number} taxAmount - Tax amount
 * @param {number} shippingAmount - Shipping amount
 * @returns {number} Total amount
 */
export const calculateInvoiceTotal = (amount = 0, taxAmount = 0, shippingAmount = 0) => {
  return Number((amount + taxAmount + shippingAmount).toFixed(2));
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize string for database storage
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Generate random string
 * @param {number} length - Length of string to generate
 * @returns {string} Random string
 */
export const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Parse JSON safely
 * @param {string} jsonString - JSON string to parse
 * @param {any} defaultValue - Default value if parsing fails
 * @returns {any} Parsed JSON or default value
 */
export const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Stringify JSON safely
 * @param {any} obj - Object to stringify
 * @param {string} defaultValue - Default value if stringifying fails
 * @returns {string} JSON string or default value
 */
export const safeJsonStringify = (obj, defaultValue = '{}') => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Deep clone object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Check if object is empty
 * @param {object} obj - Object to check
 * @returns {boolean} True if object is empty
 */
export const isEmpty = (obj) => {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  return Object.keys(obj).length === 0;
};

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert string to slug
 * @param {string} str - String to convert
 * @returns {string} Slug string
 */
export const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Get file extension from filename
 * @param {string} filename - Filename
 * @returns {string} File extension
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate pagination info
 * @param {number} total - Total number of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {object} Pagination info
 */
export const getPaginationInfo = (total, page = 1, limit = 10) => {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const offset = (currentPage - 1) * limit;
  
  return {
    total,
    totalPages,
    currentPage,
    limit,
    offset,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};
