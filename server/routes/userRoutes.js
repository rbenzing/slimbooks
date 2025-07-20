// User routes for Slimbooks API
// Handles all user-related endpoints

import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  getUserByEmail,
  getUserByGoogleId,
  createUser,
  updateUser,
  deleteUser,
  updateUserLoginAttempts,
  updateUserLastLogin,
  updateLoginAttemptsByUserId,
  updateLastLoginByUserId,
  verifyUserEmail
} from '../controllers/index.js';
import {
  requireAuth,
  requireAdmin,
  validateRequest,
  validationSets
} from '../middleware/index.js';

const router = Router();

// Check if admin user exists (public endpoint for initialization)
router.get('/admin-exists', async (req, res) => {
  try {
    const { db } = await import('../models/index.js');
    const adminUser = db.prepare('SELECT id FROM users WHERE email = ? AND role = ?').get('admin@slimbooks.app', 'admin');
    res.json({
      success: true,
      exists: !!adminUser,
      adminConfigured: !!adminUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      exists: false,
      adminConfigured: false
    });
  }
});

// Get all users (admin only)
router.get('/',
  requireAuth,
  requireAdmin,
  getAllUsers
);

// Get user by ID (admin only)
router.get('/:id', 
  requireAuth, 
  requireAdmin, 
  validationSets.updateUser.slice(0, 1), // Just ID validation
  validateRequest,
  getUserById
);

// Get user by email (public for admin check, otherwise admin only)
router.get('/email/:email', async (req, res, next) => {
  const { email } = req.params;

  // Allow public access for admin user check during initialization
  if (email === 'admin@slimbooks.app') {
    try {
      const { db } = await import('../models/index.js');
      const user = db.prepare('SELECT id, name, email, username, password_hash, role, email_verified, failed_login_attempts, account_locked_until, last_login, created_at, updated_at FROM users WHERE email = ?').get(email);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          exists: false
        });
      }

      res.json({
        success: true,
        data: user,
        exists: true
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        exists: false
      });
    }
  } else {
    // For all other emails, require authentication and admin privileges
    requireAuth(req, res, (err) => {
      if (err) return next(err);
      requireAdmin(req, res, (err) => {
        if (err) return next(err);
        getUserByEmail(req, res, next);
      });
    });
  }
});

// Get user by Google ID (admin only)
router.get('/google/:googleId', 
  requireAuth, 
  requireAdmin, 
  getUserByGoogleId
);

// Create new user (admin only)
router.post('/', 
  requireAuth, 
  requireAdmin, 
  validationSets.createUser,
  validateRequest,
  createUser
);

// Alternative create user endpoint (legacy support)
router.post('/create', 
  requireAuth, 
  requireAdmin, 
  validationSets.createUser,
  validateRequest,
  createUser
);

// Update user (admin only)
router.put('/:id', 
  requireAuth, 
  requireAdmin, 
  validationSets.updateUser,
  validateRequest,
  updateUser
);

// Delete user (admin only)
router.delete('/:id', 
  requireAuth, 
  requireAdmin, 
  validationSets.updateUser.slice(0, 1), // Just ID validation
  validateRequest,
  deleteUser
);

// Update user login attempts (internal use)
router.post('/update-login-attempts', 
  updateUserLoginAttempts
);

// Update user last login (internal use)
router.post('/update-last-login', 
  updateUserLastLogin
);

// Update user login attempts by ID (public for login process)
router.put('/:id/login-attempts',
  updateLoginAttemptsByUserId
);

// Update user last login by ID (public for login process)
router.put('/:id/last-login',
  updateLastLoginByUserId
);

// Verify user email (admin only)
router.put('/:id/verify-email', 
  requireAuth, 
  requireAdmin, 
  verifyUserEmail
);



export default router;
