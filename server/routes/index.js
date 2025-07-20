// Routes index - sets up all API routes
// Provides a single import point for all routes

import { Router } from 'express';
import userRoutes from './userRoutes.js';
import authRoutes from './authRoutes.js';
import clientRoutes from './clientRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import healthRoutes from './healthRoutes.js';

const router = Router();

// Health check routes (no /api prefix needed)
router.use('/health', healthRoutes);

// API routes with /api prefix
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/clients', clientRoutes);
router.use('/api/invoices', invoiceRoutes);
router.use('/api/expenses', expenseRoutes);

// Legacy health check route (for backward compatibility)
router.use('/api/health', healthRoutes);

export default router;
