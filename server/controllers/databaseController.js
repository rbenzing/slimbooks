// Database controller for Slimbooks
// PRODUCTION: Limited to essential database operations only
// Import/Export functionality removed for security

import { db } from '../models/index.js';
import {
  AppError,
  asyncHandler
} from '../middleware/index.js';

/**
 * Get database health status (Admin only)
 * PRODUCTION: Replaced dangerous export functionality with health check
 */
export const getDatabaseHealth = asyncHandler(async (req, res) => {
  try {
    // Test basic database connectivity
    const testQuery = db.prepare('SELECT 1 as test').get();

    // Get basic statistics (non-sensitive)
    const stats = {
      clients: db.prepare('SELECT COUNT(*) as count FROM clients').get().count,
      invoices: db.prepare('SELECT COUNT(*) as count FROM invoices').get().count,
      templates: db.prepare('SELECT COUNT(*) as count FROM templates').get().count,
      expenses: db.prepare('SELECT COUNT(*) as count FROM expenses').get().count
    };

    res.json({
      success: true,
      status: 'healthy',
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check error:', error);
    throw new AppError('Database health check failed', 500);
  }
});

/**
 * Get database schema information (Admin only)
 * PRODUCTION: Safe read-only database information
 */
export const getDatabaseInfo = asyncHandler(async (req, res) => {
  try {
    // Get database schema information (safe, read-only)
    const tables = db.prepare(`
      SELECT name, type
      FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();

    const tableInfo = {};
    for (const table of tables) {
      const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
      tableInfo[table.name] = {
        columns: columns.length,
        columnNames: columns.map(col => col.name)
      };
    }

    res.json({
      success: true,
      schema: {
        tables: tables.map(t => t.name),
        tableInfo
      },
      message: 'Database schema information retrieved'
    });
  } catch (error) {
    console.error('Database info error:', error);
    throw new AppError('Failed to retrieve database information', 500);
  }
});

/**
 * PRODUCTION: Database import/export functionality removed for security
 * Use system-level backup/restore procedures instead
 */
export const exportDatabase = asyncHandler(async (req, res) => {
  throw new AppError('Database export functionality has been disabled for security. Please use system-level backup procedures.', 403);
});

export const importDatabase = asyncHandler(async (req, res) => {
  throw new AppError('Database import functionality has been disabled for security. Please use system-level restore procedures.', 403);
});
