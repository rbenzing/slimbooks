// Database controller for Slimbooks
// Handles database export/import operations

import { readFileSync, existsSync, copyFileSync, unlinkSync } from 'fs';
import { getDatabasePath } from '../config/database.js';
import { db } from '../models/index.js';
import { 
  AppError, 
  ValidationError,
  asyncHandler
} from '../middleware/index.js';

/**
 * Export database file
 */
export const exportDatabase = asyncHandler(async (req, res) => {
  try {
    const dbPath = getDatabasePath();
    
    if (!existsSync(dbPath)) {
      throw new AppError('Database file not found', 404);
    }

    // Read the database file
    const dbBuffer = readFileSync(dbPath);

    // Set headers for file download
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="slimbooks-backup-${timestamp}.db"`);
    res.setHeader('Content-Length', dbBuffer.length);

    // Send the database file
    res.send(dbBuffer);
  } catch (error) {
    console.error('Database export error:', error);
    throw new AppError('Failed to export database', 500);
  }
});

/**
 * Import database file
 */
export const importDatabase = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      throw new ValidationError('No database file provided');
    }

    const dbPath = getDatabasePath();

    // Close current database connection
    db.close();

    // Backup current database
    const backupPath = dbPath + '.backup.' + Date.now();
    if (existsSync(dbPath)) {
      copyFileSync(dbPath, backupPath);
    }

    try {
      // Replace database file with uploaded file
      copyFileSync(req.file.path, dbPath);

      // Clean up uploaded file
      unlinkSync(req.file.path);

      // Reinitialize database connection
      const Database = (await import('better-sqlite3')).default;
      const newDb = new Database(dbPath);
      newDb.pragma('journal_mode = WAL');
      newDb.pragma('foreign_keys = ON');

      res.json({ success: true, message: 'Database imported successfully' });
    } catch (importError) {
      // Restore backup if import failed
      if (existsSync(backupPath)) {
        copyFileSync(backupPath, dbPath);
      }
      throw importError;
    } finally {
      // Clean up backup file
      if (existsSync(backupPath)) {
        unlinkSync(backupPath);
      }
    }
  } catch (error) {
    console.error('Database import error:', error);
    throw new AppError('Failed to import database', 500);
  }
});
