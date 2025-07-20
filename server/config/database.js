// Database configuration and setup for Slimbooks
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Initialize and configure the SQLite database
 * @returns {Database} Configured database instance
 */
export const initializeDatabase = () => {
  // Get database path from environment or use default
  const dbPath = process.env.DB_PATH || './data/slimbooks.db';

  // Create data directory if it doesn't exist
  const dataDir = dirname(dbPath);
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(dbPath);

  // Enable foreign keys and WAL mode for better performance and data integrity
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  console.log('SQLite database initialized at:', dbPath);

  return db;
};

/**
 * Database configuration options
 */
export const dbConfig = {
  // WAL mode for better concurrency
  journalMode: 'WAL',
  // Enable foreign key constraints
  foreignKeys: true,
  // Connection timeout
  timeout: 5000,
  // Enable verbose logging in development
  verbose: process.env.NODE_ENV === 'development' ? console.log : null
};

/**
 * Get database file path
 * @returns {string} Database file path
 */
export const getDatabasePath = () => {
  return process.env.DB_PATH || './data/slimbooks.db';
};
