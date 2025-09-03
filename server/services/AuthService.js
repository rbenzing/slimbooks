// Auth Service - Domain-specific service for authentication operations
// Handles all user authentication business logic and database operations

import { databaseService } from './DatabaseService.js';
import { settingsService } from './SettingsService.js';

/**
 * Authentication Service
 * Manages user authentication, login attempts, and account security
 */
export class AuthService {
  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Object|null} - User object or null
   */
  async getUserByEmail(email) {
    return databaseService.getOne('SELECT * FROM users WHERE email = ?', [email]);
  }

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Object|null} - User object or null
   */
  async getUserById(userId) {
    return databaseService.getOne('SELECT id, name, email, username, role, email_verified FROM users WHERE id = ?', [userId]);
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {number} - New user ID
   */
  async createUser(userData) {
    const { name, email, username, password_hash, role = 'user', email_verified = 0 } = userData;
    
    // Check if user already exists
    if (databaseService.exists('users', 'email', email)) {
      throw new Error('User with this email already exists');
    }

    // Get next user ID from counter
    const nextId = databaseService.getNextId('users');
    
    // Create user
    const now = new Date().toISOString();
    databaseService.executeQuery(`
      INSERT INTO users (
        id, name, email, username, password_hash, role, email_verified,
        failed_login_attempts, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [nextId, name, email, username || email, password_hash, role, email_verified, 0, now, now]);

    return nextId;
  }

  /**
   * Update user login attempts and lock account if necessary
   * @param {number} userId - User ID
   * @param {boolean} success - Whether login was successful
   * @returns {boolean} - Success status
   */
  async updateLoginAttempts(userId, success = false) {
    if (success) {
      // Reset failed attempts on successful login
      databaseService.executeQuery(`
        UPDATE users 
        SET failed_login_attempts = 0, account_locked_until = NULL, last_login = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `, [userId]);
      return true;
    }

    // Increment failed attempts
    const user = databaseService.getOne('SELECT failed_login_attempts FROM users WHERE id = ?', [userId]);
    const newAttempts = (user?.failed_login_attempts || 0) + 1;
    
    // Get current lockout settings
    const maxAttempts = await settingsService.getSecuritySetting('max_failed_login_attempts');
    const lockoutDuration = await settingsService.getSecuritySetting('account_lockout_duration');
    
    let lockedUntil = null;
    if (newAttempts >= maxAttempts) {
      lockedUntil = new Date(Date.now() + lockoutDuration).toISOString();
    }
    
    databaseService.executeQuery(`
      UPDATE users 
      SET failed_login_attempts = ?, account_locked_until = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [newAttempts, lockedUntil, userId]);

    return true;
  }

  /**
   * Check if user account is locked
   * @param {Object} user - User object
   * @returns {boolean} - True if account is locked
   */
  isAccountLocked(user) {
    return user.account_locked_until && new Date(user.account_locked_until) > new Date();
  }

  /**
   * Check if email verification is required
   * @returns {boolean} - True if email verification is required
   */
  async isEmailVerificationRequired() {
    return await settingsService.getSecuritySetting('require_email_verification');
  }

  /**
   * Verify user email
   * @param {number} userId - User ID
   * @returns {boolean} - Success status
   */
  async verifyUserEmail(userId) {
    const changes = databaseService.updateById('users', userId, { 
      email_verified: 1,
      email_verified_at: new Date().toISOString()
    });
    return changes > 0;
  }

  /**
   * Update user password
   * @param {number} userId - User ID
   * @param {string} passwordHash - New password hash
   * @returns {boolean} - Success status
   */
  async updateUserPassword(userId, passwordHash) {
    const changes = databaseService.updateById('users', userId, { 
      password_hash: passwordHash,
      password_updated_at: new Date().toISOString()
    });
    return changes > 0;
  }

  /**
   * Get user with security info (for authentication)
   * @param {string} email - User email
   * @returns {Object|null} - User with security info or null
   */
  async getUserForAuthentication(email) {
    return databaseService.getOne(`
      SELECT id, name, email, username, password_hash, role, email_verified, 
             failed_login_attempts, account_locked_until, last_login
      FROM users WHERE email = ?
    `, [email]);
  }

  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {boolean} - Success status
   */
  async updateUserProfile(userId, profileData) {
    const allowedFields = ['name', 'username', 'email'];
    const updateData = {};
    
    // Filter to only allowed fields
    for (const field of allowedFields) {
      if (profileData[field] !== undefined) {
        updateData[field] = profileData[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Check email uniqueness if email is being updated
    if (updateData.email) {
      const existingUser = databaseService.getOne('SELECT id FROM users WHERE email = ? AND id != ?', [updateData.email, userId]);
      if (existingUser) {
        throw new Error('Email is already in use');
      }
    }

    const changes = databaseService.updateById('users', userId, updateData);
    return changes > 0;
  }

  /**
   * Get all users (admin only)
   * @param {Object} options - Query options
   * @returns {Array} - Array of users
   */
  async getAllUsers(options = {}) {
    const { limit = 100, offset = 0 } = options;
    
    return databaseService.getMany(`
      SELECT id, name, email, username, role, email_verified, 
             failed_login_attempts, account_locked_until, created_at, last_login
      FROM users 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);
  }

  /**
   * Delete user (admin only)
   * @param {number} userId - User ID
   * @returns {boolean} - Success status
   */
  async deleteUser(userId) {
    // Don't allow deletion of the last admin
    const adminCount = databaseService.getOne("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const userToDelete = databaseService.getById('users', userId);
    
    if (userToDelete?.role === 'admin' && adminCount.count <= 1) {
      throw new Error('Cannot delete the last administrator');
    }

    const changes = databaseService.deleteById('users', userId);
    return changes > 0;
  }
}

// Export singleton instance
export const authService = new AuthService();