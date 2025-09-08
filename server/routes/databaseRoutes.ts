// Database routes - handles database backup and restore operations
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import * as databaseController from '../controllers/databaseController.js';

const router: Router = Router();

// Export database
router.get('/export', requireAuth, requireAdmin, databaseController.exportDatabase);

// Import database
router.post('/import', requireAuth, requireAdmin, databaseController.importDatabase);

export default router;