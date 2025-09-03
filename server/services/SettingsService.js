// Settings Service - Domain-specific service for settings operations
// Handles all settings-related business logic and database operations

import { databaseService } from './DatabaseService.js';

/**
 * Settings Service
 * Manages application settings and project configuration
 */
export class SettingsService {
  /**
   * Get all settings by category
   * @param {string} category - Settings category (optional)
   * @returns {Object} - Settings object
   */
  async getAllSettings(category = null) {
    let query = 'SELECT key, value, category FROM settings';
    let params = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY category, key';

    const results = databaseService.getMany(query, params);
    const settings = {};

    results.forEach(row => {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    });

    return settings;
  }

  /**
   * Get individual setting by key
   * @param {string} key - Setting key
   * @returns {*} - Setting value or null
   */
  async getSettingByKey(key) {
    const result = databaseService.getOne('SELECT value FROM settings WHERE key = ?', [key]);
    
    if (result?.value) {
      try {
        return JSON.parse(result.value);
      } catch {
        return result.value;
      }
    }
    
    return null;
  }

  /**
   * Save individual setting
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   * @param {string} category - Setting category
   * @returns {boolean} - Success status
   */
  async saveSetting(key, value, category = 'general') {
    if (!key) {
      throw new Error('Setting key is required');
    }
    
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    databaseService.executeQuery(
      'INSERT OR REPLACE INTO settings (key, value, category) VALUES (?, ?, ?)',
      [key, jsonValue, category]
    );
    
    return true;
  }

  /**
   * Save multiple settings in a transaction
   * @param {Object} settings - Settings object with key -> {value, category} mappings
   * @returns {boolean} - Success status
   */
  async saveMultipleSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Settings object is required');
    }

    const operations = () => {
      for (const [key, data] of Object.entries(settings)) {
        const { value, category = 'general' } = data;
        const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
        databaseService.executeQuery('INSERT OR REPLACE INTO settings (key, value, category) VALUES (?, ?, ?)', 
          [key, jsonValue, category]);
      }
    };

    databaseService.executeTransaction(operations);
    return true;
  }

  /**
   * Get project settings with environment defaults
   * @returns {Object} - Complete project settings
   */
  async getProjectSettings() {
    // Get all project settings from database
    const dbSettings = databaseService.getMany('SELECT key, value, enabled FROM project_settings');

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

    return projectSettings;
  }

  /**
   * Update project settings
   * @param {Object} settings - Project settings object
   * @returns {boolean} - Success status
   */
  async updateProjectSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Settings object is required');
    }

    // Flatten the settings object for database storage
    const flattenSettings = (obj, prefix = '', parentEnabled = null) => {
      const flattened = [];
      const currentEnabled = obj.enabled !== undefined ? (obj.enabled ? 1 : 0) : parentEnabled;
      
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (key === 'enabled') {
          // Skip enabled flag as it's handled as metadata
          continue;
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recursively flatten nested objects
          flattened.push(...flattenSettings(value, fullKey, currentEnabled));
        } else {
          // Store primitive values with their enabled status
          flattened.push({
            key: fullKey,
            value: JSON.stringify(value),
            enabled: currentEnabled
          });
        }
      }
      return flattened;
    };

    const flatSettings = flattenSettings(settings);

    // Use transaction for bulk updates
    const operations = () => {
      for (const setting of flatSettings) {
        databaseService.executeQuery('INSERT OR REPLACE INTO project_settings (key, value, enabled) VALUES (?, ?, ?)', 
          [setting.key, setting.value, setting.enabled]);
      }
    };

    databaseService.executeTransaction(operations);
    return true;
  }

  /**
   * Get security setting value
   * @param {string} settingName - Security setting name
   * @returns {*} - Setting value with fallback to environment
   */
  async getSecuritySetting(settingName) {
    const setting = databaseService.getOne('SELECT value FROM project_settings WHERE key = ?', [`security.${settingName}`]);
    
    if (setting) {
      try {
        return JSON.parse(setting.value);
      } catch {
        return setting.value;
      }
    }
    
    // Fallback to environment variables
    switch (settingName) {
      case 'require_email_verification':
        return process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
      case 'max_failed_login_attempts':
        return parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS) || 5;
      case 'account_lockout_duration':
        return parseInt(process.env.ACCOUNT_LOCKOUT_DURATION) || 1800000;
      default:
        return null;
    }
  }
}

// Export singleton instance
export const settingsService = new SettingsService();