// Authentication controller for Slimbooks
// Handles login, registration, password reset, and email verification

import bcrypt from 'bcryptjs';
import { authConfig } from '../config/index.js';
import { authService } from '../services/AuthService.js';
import { 
  AppError, 
  NotFoundError, 
  ValidationError,
  AuthenticationError,
  asyncHandler,
  generateToken
} from '../middleware/index.js';


/**
 * User login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  // Get user for authentication
  const user = await authService.getUserForAuthentication(email);
  
  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Check if account is locked
  if (authService.isAccountLocked(user)) {
    throw new AuthenticationError('Account is temporarily locked due to too many failed login attempts');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  
  if (!isValidPassword) {
    // Update failed login attempts
    await authService.updateLoginAttempts(user.id, false);
    throw new AuthenticationError('Invalid email or password');
  }

  // Reset failed login attempts and update last login
  await authService.updateLoginAttempts(user.id, true);

  // Check if email verification is required
  const requireEmailVerification = await authService.isEmailVerificationRequired();
  if (requireEmailVerification && !user.email_verified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required',
      requires_email_verification: true,
      message: 'Please verify your email address before logging in'
    });
  }

  // Generate JWT token
  const token = generateToken(user);

  // Remove sensitive data from response
  const { password_hash, two_factor_secret, backup_codes, ...userResponse } = user;

  res.json({
    success: true,
    data: {
      user: userResponse,
      token
    },
    requires_email_verification: false,
    message: 'Login successful'
  });
});

/**
 * User registration
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ValidationError('Name, email, and password are required');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, authConfig.bcryptRounds);

  // Create user using service
  const userId = await authService.createUser({
    name,
    email,
    password_hash: hashedPassword,
    role: 'user',
    email_verified: 0
  });

  // Get the new user for response
  const newUser = await authService.getUserById(userId);
  const token = generateToken(newUser);

  res.status(201).json({
    success: true,
    data: {
      user: newUser,
      token
    },
    message: 'Registration successful'
  });
});

/**
 * Request password reset
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ValidationError('Email is required');
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    // Don't reveal if user exists or not for security
    return res.json({ 
      success: true, 
      message: 'If an account with that email exists, we have sent a password reset link.' 
    });
  }

  // Generate password reset token
  const tokenPayload = {
    email: user.email,
    userId: user.id,
    type: 'password_reset',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + Math.floor(authConfig.passwordResetExpiry / 1000)
  };

  const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

  // TODO: Send password reset email here
  // For now, we'll just return success

  res.json({
    success: true,
    message: 'If an account with that email exists, we have sent a password reset link.',
    // In development, include the token for testing
    ...(process.env.NODE_ENV === 'development' && { token })
  });
});

/**
 * Reset password with token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new ValidationError('Token and password are required');
  }

  // Verify the token
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());

    if (payload.exp && Date.now() > payload.exp * 1000) {
      throw new ValidationError('Reset token has expired');
    }

    if (payload.type !== 'password_reset') {
      throw new ValidationError('Invalid token type');
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ? AND id = ?').get(payload.email, payload.userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, authConfig.bcryptRounds);

    // Update user password and reset failed attempts
    const stmt = db.prepare(`
      UPDATE users
      SET password_hash = ?, failed_login_attempts = 0, account_locked_until = NULL, updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(hashedPassword, user.id);

    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (tokenError) {
    throw new ValidationError('Invalid or expired token');
  }
});

/**
 * Verify email with token
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ValidationError('Token is required');
  }

  // Verify the token
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());

    if (payload.exp && Date.now() > payload.exp * 1000) {
      throw new ValidationError('Token has expired');
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(payload.email);

    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.email_verified) {
      return res.json({ 
        success: true, 
        message: 'Email already verified' 
      });
    }

    // Update user as verified
    const stmt = db.prepare(`
      UPDATE users
      SET email_verified = 1, updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(user.id);

    res.json({ 
      success: true, 
      message: 'Email verified successfully' 
    });
  } catch (tokenError) {
    throw new ValidationError('Invalid or expired token');
  }
});

/**
 * Refresh JWT token
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ValidationError('Token is required');
  }

  try {
    // Verify the current token (even if expired, we can still decode it)
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.userId) {
      throw new AuthenticationError('Invalid token');
    }

    // Get fresh user data
    const user = db.prepare('SELECT id, name, email, username, role, email_verified FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      throw new NotFoundError('User');
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      throw new AuthenticationError('Account is locked');
    }

    // Generate new token
    const newToken = generateToken(user);

    res.json({
      success: true,
      data: {
        user,
        token: newToken
      },
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    throw new AuthenticationError('Token refresh failed');
  }
});

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  // User is attached to request by auth middleware
  const user = req.user;

  if (!user) {
    throw new AuthenticationError('User not authenticated');
  }

  res.json({
    success: true,
    data: user
  });
});

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const { name, email } = req.body;

  if (!user) {
    throw new AuthenticationError('User not authenticated');
  }

  const updateData = {};
  
  if (name) updateData.name = name;
  if (email && email !== user.email) {
    // Check if email is already taken
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, user.id);
    if (existingUser) {
      throw new ValidationError('Email is already taken');
    }
    updateData.email = email;
    updateData.email_verified = 0; // Reset email verification if email changed
  }

  if (Object.keys(updateData).length === 0) {
    throw new ValidationError('No fields to update');
  }

  // Build update query
  const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updateData), user.id];

  const stmt = db.prepare(`UPDATE users SET ${fields}, updated_at = datetime('now') WHERE id = ?`);
  stmt.run(values);

  // Get updated user data
  const updatedUser = db.prepare('SELECT id, name, email, username, role, email_verified FROM users WHERE id = ?').get(user.id);

  res.json({
    success: true,
    data: updatedUser,
    message: 'Profile updated successfully'
  });
});

/**
 * Change password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const user = req.user;
  const { currentPassword, newPassword } = req.body;

  if (!user) {
    throw new AuthenticationError('User not authenticated');
  }

  if (!currentPassword || !newPassword) {
    throw new ValidationError('Current password and new password are required');
  }

  // Get user with password hash
  const userWithPassword = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id);
  
  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, userWithPassword.password_hash);
  
  if (!isValidPassword) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, authConfig.bcryptRounds);

  // Update password
  const stmt = db.prepare(`
    UPDATE users
    SET password_hash = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(hashedPassword, user.id);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});
