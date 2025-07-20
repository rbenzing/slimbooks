// Settings controller for Slimbooks
// Handles application settings and project configuration

import { db } from '../models/index.js';
import { 
  AppError, 
  NotFoundError, 
  ValidationError,
  asyncHandler
} from '../middleware/index.js';

/**
 * Get all settings or filter by category
 */
export const getAllSettings = asyncHandler(async (req, res) => {
  const { category } = req.query;
  let query = 'SELECT key, value, category FROM settings';
  let params = [];

  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  }

  query += ' ORDER BY category, key';

  const results = db.prepare(query).all(params);
  const settings = {};

  results.forEach(row => {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  });

  res.json({ success: true, settings });
});

/**
 * Get individual setting by key
 */
export const getSettingByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  
  if (result?.value) {
    try {
      const parsedValue = JSON.parse(result.value);
      res.json({ success: true, value: parsedValue });
    } catch {
      res.json({ success: true, value: result.value });
    }
  } else {
    res.json({ success: true, value: null });
  }
});

/**
 * Save individual setting
 */
export const saveSetting = asyncHandler(async (req, res) => {
  const { key, value, category = 'general' } = req.body;
  
  if (!key) {
    throw new ValidationError('Setting key is required');
  }
  
  const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
  db.prepare('INSERT OR REPLACE INTO settings (key, value, category) VALUES (?, ?, ?)').run(key, jsonValue, category);
  
  res.json({ success: true });
});

/**
 * Save multiple settings at once
 */
export const saveMultipleSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    throw new ValidationError('Settings object is required');
  }

  // Use a transaction for bulk updates
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, category) VALUES (?, ?, ?)');
  const transaction = db.transaction((settingsData) => {
    for (const [key, data] of Object.entries(settingsData)) {
      const { value, category = 'general' } = data;
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      stmt.run(key, jsonValue, category);
    }
  });

  transaction(settings);
  res.json({ success: true });
});

/**
 * Get project configuration (combines .env defaults with database overrides)
 */
export const getProjectSettings = asyncHandler(async (req, res) => {
  // Get all project settings from database
  const dbSettings = db.prepare('SELECT key, value, enabled FROM project_settings').all();

  // Create settings object with .env defaults
  const projectSettings = {
    google_oauth: {
      enabled: false,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    },
    stripe: {
      enabled: false,
      publishable_key: process.env.STRIPE_PUBLISHABLE_KEY || '',
      configured: !!(process.env.STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY)
    },
    email: {
      enabled: false,
      smtp_host: process.env.SMTP_HOST || '',
      smtp_port: process.env.SMTP_PORT || 587,
      smtp_user: process.env.SMTP_USER || '',
      email_from: process.env.EMAIL_FROM || '',
      configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    },
    security: {
      require_email_verification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
      max_failed_login_attempts: parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS) || 5,
      account_lockout_duration: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION) || 1800000
    }
  };

  // Apply database overrides
  dbSettings.forEach(setting => {
    const keys = setting.key.split('.');
    let current = projectSettings;

    // Navigate to the nested property
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    // Set the value and enabled status
    const lastKey = keys[keys.length - 1];
    try {
      const parsedValue = JSON.parse(setting.value);
      current[lastKey] = parsedValue;
    } catch {
      current[lastKey] = setting.value;
    }

    // Set enabled status if it exists
    if (setting.enabled !== null) {
      current.enabled = setting.enabled === 1;
    }
  });

  res.json({ success: true, settings: projectSettings });
});

/**
 * Update project settings
 */
export const updateProjectSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    throw new ValidationError('Settings object is required');
  }

  // Flatten the settings object for database storage
  const flattenSettings = (obj, prefix = '') => {
    const flattened = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (key === 'enabled') {
        // Handle enabled flag separately
        continue;
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattened.push(...flattenSettings(value, fullKey));
      } else {
        flattened.push({
          key: fullKey,
          value: JSON.stringify(value),
          enabled: obj.enabled !== undefined ? (obj.enabled ? 1 : 0) : null
        });
      }
    }
    return flattened;
  };

  const flatSettings = flattenSettings(settings);

  // Use transaction for bulk updates
  const stmt = db.prepare('INSERT OR REPLACE INTO project_settings (key, value, enabled) VALUES (?, ?, ?)');
  const transaction = db.transaction((settingsData) => {
    for (const setting of settingsData) {
      stmt.run(setting.key, setting.value, setting.enabled);
    }
  });

  transaction(flatSettings);
  res.json({ success: true });
});
