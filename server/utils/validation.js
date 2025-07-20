/**
 * Production-ready validation utilities for optimized database schema
 * Ensures data integrity and security at the application layer
 */

/**
 * Validate and sanitize client data
 * @param {Object} clientData - Raw client data
 * @returns {Object} - Validated and sanitized client data
 */
export const validateClientData = (clientData) => {
  const errors = [];
  const validated = {};

  // Name validation - either full name OR first+last name required
  if (clientData.name) {
    validated.name = validateString(clientData.name, 2, 100, 'Name');
    if (!validated.name) errors.push('Name must be between 2 and 100 characters');
  }

  if (clientData.first_name) {
    validated.first_name = validateString(clientData.first_name, 1, 50, 'First name');
    if (!validated.first_name) errors.push('First name must be between 1 and 50 characters');
  }

  if (clientData.last_name) {
    validated.last_name = validateString(clientData.last_name, 1, 50, 'Last name');
    if (!validated.last_name) errors.push('Last name must be between 1 and 50 characters');
  }

  // Ensure we have either full name or first+last name
  const hasFullName = validated.name && validated.name.length >= 2;
  const hasFirstLastName = validated.first_name && validated.last_name;
  
  if (!hasFullName && !hasFirstLastName) {
    errors.push('Either full name or both first and last name are required');
  }

  // If we have first+last but no full name, create it
  if (!hasFullName && hasFirstLastName) {
    validated.name = `${validated.first_name} ${validated.last_name}`.trim();
  }

  // Email validation (required)
  validated.email = validateEmail(clientData.email);
  if (!validated.email) errors.push('Valid email address is required');

  // Optional fields
  validated.phone = clientData.phone ? validatePhone(clientData.phone) : null;
  validated.company = clientData.company ? validateString(clientData.company, 1, 100, 'Company') : null;
  validated.address = clientData.address ? validateString(clientData.address, 1, 255, 'Address') : null;
  validated.city = clientData.city ? validateString(clientData.city, 1, 50, 'City') : null;
  validated.state = clientData.state ? validateString(clientData.state, 1, 50, 'State') : null;
  validated.zipCode = clientData.zipCode ? validateZipCode(clientData.zipCode) : null;
  validated.country = validateCountryCode(clientData.country);
  validated.stripe_customer_id = clientData.stripe_customer_id ? 
    validateString(clientData.stripe_customer_id, 1, 50, 'Stripe customer ID') : null;

  return { validated, errors };
};

/**
 * Validate and sanitize invoice data
 * @param {Object} invoiceData - Raw invoice data
 * @returns {Object} - Validated and sanitized invoice data
 */
export const validateInvoiceData = (invoiceData) => {
  const errors = [];
  const validated = {};

  // Required fields
  validated.invoice_number = validateString(invoiceData.invoice_number, 3, 50, 'Invoice number');
  if (!validated.invoice_number) errors.push('Invoice number must be between 3 and 50 characters');

  validated.client_id = validateInteger(invoiceData.client_id, 'Client ID');
  if (!validated.client_id) errors.push('Valid client ID is required');

  validated.amount = validateDecimal(invoiceData.amount, 'Amount');
  if (validated.amount === null || validated.amount < 0) errors.push('Amount must be a positive number');

  validated.tax_amount = validateDecimal(invoiceData.tax_amount || 0, 'Tax amount');
  if (validated.tax_amount === null || validated.tax_amount < 0) errors.push('Tax amount must be non-negative');

  validated.total_amount = validateDecimal(invoiceData.total_amount, 'Total amount');
  if (validated.total_amount === null || validated.total_amount < 0) errors.push('Total amount must be positive');

  validated.shipping_amount = validateDecimal(invoiceData.shipping_amount || 0, 'Shipping amount');
  if (validated.shipping_amount === null || validated.shipping_amount < 0) errors.push('Shipping amount must be non-negative');

  // Validate total calculation
  const calculatedTotal = validated.amount + validated.tax_amount + validated.shipping_amount;
  if (Math.abs(calculatedTotal - validated.total_amount) > 0.01) {
    errors.push('Total amount must equal amount + tax + shipping');
  }

  validated.status = validateInvoiceStatus(invoiceData.status);
  validated.type = validateInvoiceType(invoiceData.type);
  validated.email_status = validateEmailStatus(invoiceData.email_status);

  validated.due_date = validateDate(invoiceData.due_date, 'Due date');
  if (!validated.due_date) errors.push('Valid due date is required');

  validated.issue_date = validateDate(invoiceData.issue_date, 'Issue date');
  if (!validated.issue_date) errors.push('Valid issue date is required');

  // Ensure due date is not before issue date
  if (validated.due_date && validated.issue_date && validated.due_date < validated.issue_date) {
    errors.push('Due date cannot be before issue date');
  }

  // Optional fields
  validated.template_id = invoiceData.template_id ? validateInteger(invoiceData.template_id, 'Template ID') : null;
  validated.description = invoiceData.description || null;
  validated.notes = invoiceData.notes || null;
  validated.payment_terms = invoiceData.payment_terms ? 
    validateString(invoiceData.payment_terms, 1, 100, 'Payment terms') : null;

  // JSON fields
  validated.items = validateJSON(invoiceData.items, 'Items');
  validated.line_items = validateJSON(invoiceData.line_items, 'Line items');

  // Stripe fields
  validated.stripe_invoice_id = invoiceData.stripe_invoice_id ? 
    validateString(invoiceData.stripe_invoice_id, 1, 50, 'Stripe invoice ID') : null;
  validated.stripe_payment_intent_id = invoiceData.stripe_payment_intent_id ? 
    validateString(invoiceData.stripe_payment_intent_id, 1, 50, 'Stripe payment intent ID') : null;

  // Client info (denormalized)
  validated.client_name = invoiceData.client_name ? 
    validateString(invoiceData.client_name, 1, 100, 'Client name') : null;
  validated.client_email = invoiceData.client_email ? validateEmail(invoiceData.client_email) : null;
  validated.client_phone = invoiceData.client_phone ? validatePhone(invoiceData.client_phone) : null;
  validated.client_address = invoiceData.client_address ? 
    validateString(invoiceData.client_address, 1, 255, 'Client address') : null;

  // Tax and shipping IDs
  validated.tax_rate_id = invoiceData.tax_rate_id ? 
    validateString(invoiceData.tax_rate_id, 1, 50, 'Tax rate ID') : null;
  validated.shipping_rate_id = invoiceData.shipping_rate_id ? 
    validateString(invoiceData.shipping_rate_id, 1, 50, 'Shipping rate ID') : null;

  // Email fields
  validated.email_sent_at = invoiceData.email_sent_at ? validateDateTime(invoiceData.email_sent_at) : null;
  validated.email_error = invoiceData.email_error ? 
    validateString(invoiceData.email_error, 1, 500, 'Email error') : null;
  validated.last_email_attempt = invoiceData.last_email_attempt ? 
    validateDateTime(invoiceData.last_email_attempt) : null;

  return { validated, errors };
};

/**
 * Validate and sanitize user data
 * @param {Object} userData - Raw user data
 * @returns {Object} - Validated and sanitized user data
 */
export const validateUserData = (userData) => {
  const errors = [];
  const validated = {};

  // Required fields
  validated.name = validateString(userData.name, 2, 100, 'Name');
  if (!validated.name) errors.push('Name must be between 2 and 100 characters');

  validated.email = validateEmail(userData.email);
  if (!validated.email) errors.push('Valid email address is required');

  validated.username = validateUsername(userData.username);
  if (!validated.username) errors.push('Username must be 3-50 characters, alphanumeric and underscore only');

  // Optional fields
  validated.password_hash = userData.password_hash || null;
  validated.role = validateUserRole(userData.role);
  validated.email_verified = Boolean(userData.email_verified);
  validated.google_id = userData.google_id ? 
    validateString(userData.google_id, 1, 50, 'Google ID') : null;
  validated.failed_login_attempts = Math.max(0, parseInt(userData.failed_login_attempts) || 0);
  validated.last_login = userData.last_login ? validateDateTime(userData.last_login) : null;
  validated.account_locked_until = userData.account_locked_until ? 
    validateDateTime(userData.account_locked_until) : null;

  return { validated, errors };
};

// =====================================================
// CORE VALIDATION FUNCTIONS
// =====================================================

const validateString = (value, minLength = 1, maxLength = 255, fieldName = 'Field') => {
  if (!value) return null;
  const str = String(value).trim();
  if (str.length < minLength || str.length > maxLength) {
    return null;
  }
  return str;
};

const validateEmail = (email) => {
  if (!email) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleanEmail = String(email).trim().toLowerCase();
  if (!emailRegex.test(cleanEmail) || cleanEmail.length > 255) {
    return null;
  }
  return cleanEmail;
};

const validateUsername = (username) => {
  if (!username) return null;
  const usernameRegex = /^[A-Za-z0-9_]{3,50}$/;
  const cleanUsername = String(username).trim();
  if (!usernameRegex.test(cleanUsername)) {
    return null;
  }
  return cleanUsername;
};

const validatePhone = (phone) => {
  if (!phone) return null;
  const phoneRegex = /^[0-9+\-() ]{3,20}$/;
  const cleanPhone = String(phone).trim();
  if (!phoneRegex.test(cleanPhone)) {
    return null;
  }
  return cleanPhone;
};

const validateZipCode = (zipCode) => {
  if (!zipCode) return null;
  const cleanZip = String(zipCode).trim();
  if (cleanZip.length < 3 || cleanZip.length > 10) {
    return null;
  }
  return cleanZip;
};

const validateCountryCode = (country) => {
  if (!country) return 'US';
  const cleanCountry = String(country).trim().toUpperCase();
  if (cleanCountry.length !== 2) {
    return 'US';
  }
  return cleanCountry;
};

const validateInteger = (value, fieldName = 'Field') => {
  const num = parseInt(value);
  if (isNaN(num) || num <= 0) {
    return null;
  }
  return num;
};

const validateDecimal = (value, fieldName = 'Field') => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return null;
  }
  return Math.round(num * 100) / 100; // Round to 2 decimal places
};

const validateDate = (dateString, fieldName = 'Date') => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch (error) {
    return null;
  }
};

const validateDateTime = (dateString, fieldName = 'DateTime') => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  } catch (error) {
    return null;
  }
};

const validateJSON = (jsonString, fieldName = 'JSON') => {
  if (!jsonString) return null;
  try {
    JSON.parse(jsonString);
    return jsonString;
  } catch (error) {
    return null;
  }
};

const validateInvoiceStatus = (status) => {
  const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'];
  const cleanStatus = (status || 'draft').toLowerCase();
  return validStatuses.includes(cleanStatus) ? cleanStatus : 'draft';
};

const validateInvoiceType = (type) => {
  const validTypes = ['one-time', 'recurring', 'subscription'];
  const cleanType = (type || 'one-time').toLowerCase();
  return validTypes.includes(cleanType) ? cleanType : 'one-time';
};

const validateEmailStatus = (status) => {
  const validStatuses = ['not_sent', 'sent', 'failed', 'bounced'];
  const cleanStatus = (status || 'not_sent').toLowerCase();
  return validStatuses.includes(cleanStatus) ? cleanStatus : 'not_sent';
};

const validateUserRole = (role) => {
  const validRoles = ['admin', 'user', 'viewer'];
  const cleanRole = (role || 'user').toLowerCase();
  return validRoles.includes(cleanRole) ? cleanRole : 'user';
};
