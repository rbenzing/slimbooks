// Database routes for Slimbooks
// Handles database export/import endpoints

import { Router } from 'express';
import multer from 'multer';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  getDatabaseHealth,
  getDatabaseInfo,
  exportDatabase,
  importDatabase
} from '../controllers/databaseController.js';
import { requireAuth, requireAdmin } from '../middleware/index.js';
import { serverConfig } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Configure multer for database file uploads
const projectRoot = join(__dirname, '..', '..');
const upload = multer({
  dest: resolve(projectRoot, serverConfig.uploadPath),
  limits: {
    fileSize: serverConfig.maxFileSize,
    files: 1,
    fieldSize: 1024 * 1024 // 1MB field size limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/octet-stream',
      'application/x-sqlite3',
      'application/vnd.sqlite3'
    ];

    if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.db')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only database files are allowed.'), false);
    }
  }
});

// Database health check endpoint (Admin only)
router.get('/health', requireAuth, requireAdmin, getDatabaseHealth);

// Database schema information endpoint (Admin only)
router.get('/info', requireAuth, requireAdmin, getDatabaseInfo);

// Database export endpoint (DISABLED for security)
router.get('/export', requireAuth, requireAdmin, exportDatabase);

// Database import endpoint (DISABLED for security)
router.post('/import', requireAuth, requireAdmin, upload.single('database'), importDatabase);

export default router;
