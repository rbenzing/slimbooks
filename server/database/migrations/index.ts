// Database Migration System
// Handles running migrations in order and tracking migration state

import type { IDatabase } from '../../types/database.types.js';
import { up as migration001 } from './001_add_deleted_at_to_clients.js';

interface Migration {
  id: string;
  name: string;
  up: (db: IDatabase) => void;
}

/**
 * List of all migrations in order
 */
const migrations: Migration[] = [
  {
    id: '001',
    name: 'add_deleted_at_to_clients',
    up: migration001
  }
];

/**
 * Create migrations tracking table if it doesn't exist
 */
const createMigrationsTable = (db: IDatabase): void => {
  db.executeQuery(`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
};

/**
 * Check if a migration has been applied
 */
const isMigrationApplied = (db: IDatabase, migrationId: string): boolean => {
  try {
    const result = db.getMany('SELECT id FROM migrations WHERE id = ?', [migrationId]);
    return result.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Mark a migration as applied
 */
const markMigrationApplied = (db: IDatabase, migration: Migration): void => {
  db.executeQuery(
    'INSERT INTO migrations (id, name) VALUES (?, ?)',
    [migration.id, migration.name]
  );
};

/**
 * Run all pending migrations
 */
export const runMigrations = (db: IDatabase): void => {
  try {
    console.log('Running database migrations...');
    
    // Create migrations table if it doesn't exist
    createMigrationsTable(db);
    
    let migrationsRun = 0;
    
    // Run each migration if not already applied
    for (const migration of migrations) {
      if (!isMigrationApplied(db, migration.id)) {
        console.log(`Running migration ${migration.id}: ${migration.name}`);
        migration.up(db);
        markMigrationApplied(db, migration);
        migrationsRun++;
      }
    }
    
    if (migrationsRun > 0) {
      console.log(`✓ Applied ${migrationsRun} migration(s)`);
    } else {
      console.log('✓ All migrations up to date');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

/**
 * Get migration status
 */
export const getMigrationStatus = (db: IDatabase): Array<{id: string, name: string, applied: boolean}> => {
  createMigrationsTable(db);
  
  return migrations.map(migration => ({
    id: migration.id,
    name: migration.name,
    applied: isMigrationApplied(db, migration.id)
  }));
};