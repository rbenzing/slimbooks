// Routes index - sets up all API routes
// Provides a single import point for all routes

import { Router } from 'express';
import userRoutes from './userRoutes.js';
import authRoutes from './authRoutes.js';
import clientRoutes from './clientRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import healthRoutes from './healthRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import projectSettingsRoutes from './projectSettingsRoutes.js';
import databaseRoutes from './databaseRoutes.js';
import templateRoutes from './templateRoutes.js';
import counterRoutes from './counterRoutes.js';
import reportRoutes from './reportRoutes.js';
import pdfRoutes from './pdfRoutes.js';
import cronRoutes from './cronRoutes.js';

const router = Router();

// API routes with /api prefix
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/clients', clientRoutes);
router.use('/api/invoices', invoiceRoutes);
router.use('/api/expenses', expenseRoutes);
router.use('/api/payments', paymentRoutes);
router.use('/api/templates', templateRoutes);
router.use('/api/settings', settingsRoutes);
router.use('/api/project-settings', projectSettingsRoutes);
router.use('/api/db', databaseRoutes);
router.use('/api/counters', counterRoutes);
router.use('/api/reports', reportRoutes);
router.use('/api/pdf', pdfRoutes);
router.use('/api/cron', cronRoutes);

// Health check routes
router.use('/api/health', healthRoutes);

export default router;
