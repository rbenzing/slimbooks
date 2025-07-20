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
  verifyUserEmail,
  enableUser2FA,
  disableUser2FA
} from '../controllers/index.js';
import {
  requireAuth,
  requireAdmin,
  validateRequest,
  validationSets
} from '../middleware/index.js';

const router = Router();

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

// Get user by email (admin only)
router.get('/email/:email', 
  requireAuth, 
  requireAdmin, 
  getUserByEmail
);

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

// Update user login attempts by ID (admin only)
router.put('/:id/login-attempts', 
  requireAuth, 
  requireAdmin, 
  updateLoginAttemptsByUserId
);

// Update user last login by ID (admin only)
router.put('/:id/last-login', 
  requireAuth, 
  requireAdmin, 
  updateLastLoginByUserId
);

// Verify user email (admin only)
router.put('/:id/verify-email', 
  requireAuth, 
  requireAdmin, 
  verifyUserEmail
);

// Enable user 2FA (admin only)
router.put('/:id/2fa/enable', 
  requireAuth, 
  requireAdmin, 
  enableUser2FA
);

// Disable user 2FA (admin only)
router.put('/:id/2fa/disable', 
  requireAuth, 
  requireAdmin, 
  disableUser2FA
);

export default router;
