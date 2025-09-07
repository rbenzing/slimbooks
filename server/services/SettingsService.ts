// Settings Service - Domain-specific service for settings operations
// Handles all settings-related business logic and database operations

import { databaseService } from '../core/DatabaseService.js';
import { Setting, ProjectSettings } from '../types/index.js';

/**
 * Settings Service
 * Manages application settings and project configuration
 */
export class SettingsService {
  /**
   * Get all settings by category
   */
  async getAllSettings(category?: string): Promise<Record<string, any>> {
    let query = 'SELECT key, value, category FROM settings';
    const params: any[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY category, key';

    const results = databaseService.getMany<Setting>(query, params);
    
    const settings: Record<string, any> = {};

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
   */
  async getSettingByKey(key: string): Promise<any> {
    if (!key || typeof key !== 'string') {
      throw new Error('Valid setting key is required');
    }

    const result = databaseService.getOne<{value: string}>('SELECT value FROM settings WHERE key = ?', [key]);
    
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
   */
  async saveSetting(key: string, value: any, category: string = 'general'): Promise<boolean> {
    if (!key || typeof key !== 'string') {
      throw new Error('Setting key is required');
    }

    if (!category || typeof category !== 'string') {
      throw new Error('Setting category is required');
    }
    
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    databaseService.executeQuery(
      'INSERT OR REPLACE INTO settings (key, value, category) VALUES (?, ?, ?)',
      [key, jsonValue, category]
    );
    
    return true;
  }

  /**
   * Update format-related settings (PDF format, date format, currency format, etc.)
   */
  async updateFormatSettings(settings: Record<string, any>): Promise<boolean> {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Format settings object is required');
    }

    const formatCategory = 'format';
    const operations = () => {
      for (const [key, value] of Object.entries(settings)) {
        if (value === undefined) continue;
        
        const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        databaseService.executeQuery(
          'INSERT OR REPLACE INTO settings (key, value, category) VALUES (?, ?, ?)', 
          [key, jsonValue, formatCategory]
        );
      }
    };

    databaseService.executeTransaction(operations);
    return true;
  }

  /**
   * Save multiple settings in a transaction
   */
  async saveMultipleSettings(settings: Record<string, {
    value: any;
    category?: string;
  }>): Promise<boolean> {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Settings object is required');
    }

    const operations = () => {
      for (const [key, data] of Object.entries(settings)) {
        if (!data || typeof data !== 'object') {
          throw new Error(`Invalid setting data for key: ${key}`);
        }

        const { value, category = 'general' } = data;
        const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        databaseService.executeQuery(
          'INSERT OR REPLACE INTO settings (key, value, category) VALUES (?, ?, ?)', 
          [key, jsonValue, category]
        );
      }
    };

    databaseService.executeTransaction(operations);
    return true;
  }

  /**
   * Get project settings with environment defaults
   */
  async getProjectSettings(): Promise<ProjectSettings> {
    // Get all project settings from database
    const dbSettings = databaseService.getMany<ProjectSettings>(
      'SELECT key, value, enabled FROM project_settings'
    );

    // Create settings object with .env defaults
    const projectSettings: ProjectSettings = {
      google_oauth: {
        enabled: false,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        ...(process.env.GOOGLE_CLIENT_SECRET && { client_secret: process.env.GOOGLE_CLIENT_SECRET }),
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
      },
      stripe: {
        enabled: false,
        publishable_key: process.env.STRIPE_PUBLISHABLE_KEY || '',
        ...(process.env.STRIPE_SECRET_KEY && { secret_key: process.env.STRIPE_SECRET_KEY }),
        configured: !!(process.env.STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY)
      },
      email: {
        enabled: false,
        smtp_host: process.env.SMTP_HOST || '',
        smtp_port: parseInt(process.env.SMTP_PORT || '587') || 587,
        smtp_user: process.env.SMTP_USER || '',
        ...(process.env.SMTP_PASS && { smtp_pass: process.env.SMTP_PASS }),
        email_from: process.env.EMAIL_FROM || '',
        configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.EMAIL_FROM)
      },
      security: {
        require_email_verification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
        max_failed_login_attempts: parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || '5') || 5,
        account_lockout_duration: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '1800000') || 1800000
      }
    };

    return projectSettings;
  }

  /**
   * Update project settings
   */
  async updateProjectSettings(settings: Partial<ProjectSettings>): Promise<boolean> {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Settings object is required');
    }

    // Flatten the settings object for database storage
    const flattenSettings = (obj: any, prefix: string = '', parentEnabled: number | null = null): Setting[] => {
      const flattened: Setting[] = [];
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
            enabled: currentEnabled,
            id: 0, // Temporary ID, will be set by database
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
      return flattened;
    };

    const flatSettings = flattenSettings(settings);

    // Use transaction for bulk updates
    const operations = () => {
      for (const setting of flatSettings) {
        databaseService.executeQuery(
          'INSERT OR REPLACE INTO project_settings (key, value, enabled) VALUES (?, ?, ?)', 
          [setting.key, setting.value, setting.enabled]
        );
      }
    };

    databaseService.executeTransaction(operations);
    return true;
  }

  /**
   * Get security setting value
   */
  async getSecuritySetting(settingName: string): Promise<any> {
    if (!settingName || typeof settingName !== 'string') {
      throw new Error('Setting name is required');
    }

    const setting = databaseService.getOne<{value: string}>(
      'SELECT value FROM project_settings WHERE key = ?', 
      [`security.${settingName}`]
    );
    
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
        return parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || '5') || 5;
      case 'account_lockout_duration':
        return parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '1800000') || 1800000;
      default:
        return null;
    }
  }

  /**
   * Delete setting by key
   */
  async deleteSetting(key: string): Promise<boolean> {
    if (!key || typeof key !== 'string') {
      throw new Error('Valid setting key is required');
    }

    const result = databaseService.executeQuery('DELETE FROM settings WHERE key = ?', [key]);
    return result.changes > 0;
  }

  /**
   * Delete settings by category
   */
  async deleteSettingsByCategory(category: string): Promise<number> {
    if (!category || typeof category !== 'string') {
      throw new Error('Valid category is required');
    }

    const result = databaseService.executeQuery('DELETE FROM settings WHERE category = ?', [category]);
    return result.changes;
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    const results = databaseService.getMany<{category: string}>(
      'SELECT DISTINCT category FROM settings ORDER BY category'
    );
    
    return results.map(row => row.category);
  }

  /**
   * Check if setting exists
   */
  async settingExists(key: string): Promise<boolean> {
    if (!key || typeof key !== 'string') {
      return false;
    }

    return databaseService.exists('settings', 'key', key);
  }

  /**
   * Get settings count by category
   */
  async getSettingsCount(category?: string): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM settings';
    const params: any[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    const result = databaseService.getOne<{count: number}>(query, params);
    return result?.count || 0;
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(category?: string): Promise<boolean> {
    let query = 'DELETE FROM settings';
    const params: any[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    databaseService.executeQuery(query, params);
    return true;
  }
}

// Export singleton instance
export const settingsService = new SettingsService();