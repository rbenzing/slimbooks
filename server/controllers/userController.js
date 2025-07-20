// User controller for Slimbooks
// Handles all user-related business logic

import bcrypt from 'bcryptjs';
import { db } from '../models/index.js';
import { authConfig } from '../config/index.js';
import { 
  AppError, 
  NotFoundError, 
  ValidationError,
  asyncHandler,
  generateToken,
  updateLoginAttempts
} from '../middleware/index.js';

/**
 * Get all users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = db.prepare(`
    SELECT id, name, email, username, role, email_verified,
           last_login, failed_login_attempts, account_locked_until, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
  `).all();
  
  res.json({ success: true, data: users });
});

/**
 * Get user by ID
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = db.prepare(`
    SELECT id, name, email, username, role, email_verified,
           last_login, failed_login_attempts, account_locked_until, created_at, updated_at
    FROM users
    WHERE id = ?
  `).get(id);

  if (!user) {
    throw new NotFoundError('User');
  }

  res.json({ success: true, data: user });
});

/**
 * Get user by email
 */
export const getUserByEmail = asyncHandler(async (req, res) => {
  const { email } = req.params;
  
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    throw new NotFoundError('User');
  }

  res.json({ success: true, data: user });
});

/**
 * Get user by Google ID
 */
export const getUserByGoogleId = asyncHandler(async (req, res) => {
  const { googleId } = req.params;
  
  const user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(decodeURIComponent(googleId));

  if (!user) {
    throw new NotFoundError('User');
  }

  res.json({ success: true, data: user });
});

/**
 * Create new user
 */
export const createUser = asyncHandler(async (req, res) => {
  const { userData } = req.body;

  if (!userData || !userData.email || !userData.name) {
    throw new ValidationError('Invalid user data - name and email are required');
  }

  // Check if user already exists
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(userData.email);
  if (existingUser) {
    throw new ValidationError('User with this email already exists');
  }

  // Get next ID
  const counterResult = db.prepare('SELECT value FROM counters WHERE name = ?').get('users');
  const nextId = (counterResult?.value || 0) + 1;
  db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(nextId, 'users');

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO users (
      id, name, email, username, password_hash, role, email_verified,
      google_id, last_login, failed_login_attempts, account_locked_until, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    nextId,
    userData.name,
    userData.email,
    userData.username || userData.email,
    userData.password_hash || null,
    userData.role || 'user',
    userData.email_verified ? 1 : 0,
    userData.google_id || null,
    userData.last_login || null,
    userData.failed_login_attempts || 0,
    userData.account_locked_until || null,
    now,
    now
  );

  res.status(201).json({ 
    success: true, 
    data: { id: nextId },
    message: 'User created successfully'
  });
});

/**
 * Update user
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userData } = req.body;

  if (!id || !userData) {
    throw new ValidationError('Invalid parameters');
  }

  // Check if user exists
  const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existingUser) {
    throw new NotFoundError('User');
  }

  // Build dynamic update query
  const updateFields = [];
  const values = [];
  
  Object.keys(userData).forEach(key => {
    if (userData[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      values.push(userData[key]);
    }
  });
  
  if (updateFields.length === 0) {
    throw new ValidationError('No fields to update');
  }
  
  updateFields.push('updated_at = datetime("now")');
  values.push(id);

  const stmt = db.prepare(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`);
  const result = stmt.run(values);

  res.json({ 
    success: true, 
    data: { changes: result.changes },
    message: 'User updated successfully'
  });
});

/**
 * Delete user
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if user exists
  const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existingUser) {
    throw new NotFoundError('User');
  }
  
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const result = stmt.run(id);

  res.json({ 
    success: true, 
    data: { changes: result.changes },
    message: 'User deleted successfully'
  });
});

/**
 * Update user login attempts
 */
export const updateUserLoginAttempts = asyncHandler(async (req, res) => {
  const { userId, attempts, lockedUntil } = req.body;

  if (!userId || typeof attempts !== 'number') {
    throw new ValidationError('Invalid parameters - userId and attempts are required');
  }

  const stmt = db.prepare('UPDATE users SET failed_login_attempts = ?, account_locked_until = ? WHERE id = ?');
  const result = stmt.run(attempts, lockedUntil || null, userId);

  res.json({ success: true, data: result });
});

/**
 * Update user last login
 */
export const updateUserLastLogin = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  const now = new Date().toISOString();
  const stmt = db.prepare('UPDATE users SET last_login = ? WHERE id = ?');
  const result = stmt.run(now, userId);

  res.json({ success: true, data: result });
});

/**
 * Update user login attempts by ID (alternative endpoint)
 */
export const updateLoginAttemptsByUserId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { attempts, lockedUntil } = req.body;

  const stmt = db.prepare(`
    UPDATE users
    SET failed_login_attempts = ?, account_locked_until = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(attempts, lockedUntil || null, id);
  res.json({ success: true });
});

/**
 * Update user last login by ID (alternative endpoint)
 */
export const updateLastLoginByUserId = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const stmt = db.prepare(`
    UPDATE users
    SET last_login = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(id);
  res.json({ success: true });
});

/**
 * Verify user email
 */
export const verifyUserEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const stmt = db.prepare(`
    UPDATE users
    SET email_verified = 1, updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(id);
  res.json({ success: true, message: 'Email verified successfully' });
});


