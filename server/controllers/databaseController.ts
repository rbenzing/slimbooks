// Database controller - handles database backup and restore operations
import { Request, Response } from 'express';
import { createReadStream, createWriteStream, existsSync, unlinkSync, statSync } from 'fs';
import { copyFile } from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { getDatabasePath } from '../config/database.js';

// Configure multer for file uploads
const upload = multer({
  dest: 'temp/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only database files
    if (file.originalname.match(/\.(db|sqlite|sqlite3)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only database files (.db, .sqlite, .sqlite3) are allowed'));
    }
  }
});

// Export database
export const exportDatabase = async (req: Request, res: Response): Promise<void> => {
  try {
    const dbPath = getDatabasePath();
    
    if (!existsSync(dbPath)) {
      res.status(404).json({
        success: false,
        error: 'Database file not found'
      });
      return;
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename=slimbooks-export.db');
    res.setHeader('Content-Length', statSync(dbPath).size);

    // Stream the database file to the response
    const fileStream = createReadStream(dbPath);
    fileStream.pipe(res);

    fileStream.on('error', (error: Error) => {
      console.error('Database export stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to export database'
        });
      }
    });

    fileStream.on('end', () => {
      console.log('Database export completed successfully');
    });

  } catch (error) {
    console.error('Database export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export database'
    });
  }
};

// Import database
export const importDatabase = [
  upload.single('database'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No database file provided'
        });
        return;
      }

      const uploadedFilePath = req.file.path;
      const dbPath = getDatabasePath();
      
      // Create backup of current database
      const backupPath = `${dbPath}.backup-${Date.now()}`;
      
      try {
        if (existsSync(dbPath)) {
          await copyFile(dbPath, backupPath);
          console.log('Current database backed up to:', backupPath);
        }

        // Replace current database with uploaded file
        await copyFile(uploadedFilePath, dbPath);
        console.log('Database imported successfully from:', req.file.originalname);

        // Clean up uploaded file
        unlinkSync(uploadedFilePath);

        res.json({
          success: true,
          message: 'Database imported successfully'
        });

      } catch (importError) {
        // If import fails, restore backup
        if (existsSync(backupPath)) {
          await copyFile(backupPath, dbPath);
          console.log('Database restored from backup due to import failure');
        }
        throw importError;
      } finally {
        // Clean up backup file after successful import (optional)
        // Keep backup for safety - could implement cleanup job later
      }

    } catch (error) {
      console.error('Database import error:', error);
      
      // Clean up uploaded file if it exists
      if (req.file?.path && existsSync(req.file.path)) {
        unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import database'
      });
    }
  }
];