// Authentication middleware for Slimbooks
// Handles JWT verification, role-based access control, and session management

import jwt from 'jsonwebtoken';
import { authConfig } from '../config/index.js';
import { db } from '../models/index.js';

/**
 * Middleware to require authentication
 * Verifies JWT token and attaches user to request
 */
export const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // TODO: Implement JWT verification when JWT is fully implemented
    // For now, we'll use a simple token validation
    try {
      const decoded = jwt.verify(token, authConfig.jwtSecret);

      // Get user from database
      const user = db.prepare('SELECT id, name, email, username, role, email_verified FROM users WHERE id = ?').get(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token - user not found'
        });
      }
      
      // Check if user account is locked
      if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
        return res.status(423).json({
          success: false,
          error: 'Account is temporarily locked'
        });
      }
      
      // Attach user to request
      req.user = user;
      next();
      
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication service error'
    });
  }
};

/**
 * Middleware to require admin role
 * Must be used after requireAuth
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  
  next();
};

/**
 * Middleware to require specific role
 * @param {string|Array} roles - Required role(s)
 */
export const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
    
    next();
  };
};

/**
 * Middleware to require email verification
 * Must be used after requireAuth
 */
export const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  if (!req.user.email_verified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required'
    });
  }
  
  next();
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, authConfig.jwtSecret);
        const user = db.prepare('SELECT id, name, email, username, role, email_verified FROM users WHERE id = ?').get(decoded.userId);
        
        if (user && (!user.account_locked_until || new Date(user.account_locked_until) <= new Date())) {
          req.user = user;
        }
      } catch (jwtError) {
        // Invalid token, but that's okay for optional auth
        console.log('Optional auth: Invalid token provided');
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue without authentication
  }
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
export const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: Math.floor(authConfig.accessTokenExpiry / 1000) // Convert ms to seconds
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, authConfig.jwtSecret);
};

/**
 * Check if user account is locked
 * @param {Object} user - User object
 * @returns {boolean} True if account is locked
 */
export const isAccountLocked = (user) => {
  return user.account_locked_until && new Date(user.account_locked_until) > new Date();
};

/**
 * Update user login attempts and lock account if necessary
 * @param {number} userId - User ID
 * @param {boolean} success - Whether login was successful
 */
export const updateLoginAttempts = (userId, success = false) => {
  try {
    if (success) {
      // Reset failed attempts on successful login
      const stmt = db.prepare(`
        UPDATE users 
        SET failed_login_attempts = 0, account_locked_until = NULL, last_login = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `);
      stmt.run(userId);
    } else {
      // Increment failed attempts
      const user = db.prepare('SELECT failed_login_attempts FROM users WHERE id = ?').get(userId);
      const newAttempts = (user?.failed_login_attempts || 0) + 1;
      
      let lockedUntil = null;
      if (newAttempts >= authConfig.maxLoginAttempts) {
        lockedUntil = new Date(Date.now() + authConfig.lockoutDuration).toISOString();
      }
      
      const stmt = db.prepare(`
        UPDATE users 
        SET failed_login_attempts = ?, account_locked_until = ?, updated_at = datetime('now')
        WHERE id = ?
      `);
      stmt.run(newAttempts, lockedUntil, userId);
    }
  } catch (error) {
    console.error('Error updating login attempts:', error);
  }
};
