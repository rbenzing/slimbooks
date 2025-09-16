// Database Service Layer
// Provides high-level database service operations built on the abstract database interface

import type { IDatabase, QueryOptions, ServiceOptions } from '../types/database.types.js';
import { db } from '../database/index.js';

/**
 * Base Database Service
 * Provides common database operations with proper error handling and business logic
 * This replaces the old Database.ts core service
 */
export class DatabaseService {
  protected database: IDatabase;

  constructor(dbInstance: IDatabase = db) {
    this.database = dbInstance;
  }

  /**
   * Execute a query with parameters
   */
  public executeQuery(query: string, params: unknown[] = []) {
    return this.database.executeQuery(query, params);
  }

  /**
   * Get single record with prepared statement
   */
  public getOne<T = Record<string, unknown>>(query: string, params: unknown[] = []): T | null {
    return this.database.getOne<T>(query, params);
  }

  /**
   * Get multiple records with prepared statement
   */
  public getMany<T = Record<string, unknown>>(query: string, params: unknown[] = []): T[] {
    return this.database.getMany<T>(query, params);
  }

  /**
   * Get records with pagination and filtering
   */
  public getPaginated<T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
    options: ServiceOptions = {}
  ) {
    const { limit = 50, offset = 0, page, sort, filters, includeDeleted = false } = options;

    let finalQuery = query;
    const finalParams = [...params];
    
    // Add soft delete filter if not explicitly including deleted records
    if (!includeDeleted && !query.toLowerCase().includes('where')) {
      finalQuery += ' WHERE deleted_at IS NULL';
    } else if (!includeDeleted && query.toLowerCase().includes('where')) {
      finalQuery += ' AND deleted_at IS NULL';
    }
    
    // Apply additional filters
    if (filters && Object.keys(filters).length > 0) {
      const filterConditions = Object.entries(filters)
        .map(([key, value]) => {
          if (value === null || value === undefined) {
            return `${key} IS NULL`;
          }
          finalParams.push(value);
          return `${key} = ?`;
        });
      
      const whereClause = query.toLowerCase().includes('where') ? ' AND ' : ' WHERE ';
      finalQuery += whereClause + filterConditions.join(' AND ');
    }
    
    const queryOptions: QueryOptions = {
      limit,
      offset
    };
    
    if (page) queryOptions.page = page;
    if (sort) queryOptions.sort = sort;
    
    return this.database.getWithPagination<T>(finalQuery, finalParams, queryOptions);
  }

  /**
   * Execute operations within a transaction
   */
  public withTransaction<T>(callback: () => T): T {
    return this.database.transaction(callback);
  }

  /**
   * Soft delete a record (if table has deleted_at column)
   */
  public softDelete(table: string, id: number): boolean {
    try {
      const result = this.executeQuery(
        `UPDATE ${table} SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
        [id]
      );
      return result.changes > 0;
    } catch (error) {
      // If deleted_at column doesn't exist, fall back to hard delete
      console.warn(`Soft delete failed for ${table}, attempting hard delete:`, error);
      return this.hardDelete(table, id);
    }
  }

  /**
   * Hard delete a record
   */
  public hardDelete(table: string, id: number): boolean {
    const result = this.executeQuery(`DELETE FROM ${table} WHERE id = ?`, [id]);
    return result.changes > 0;
  }

  /**
   * Update a record with automatic timestamp
   */
  public updateRecord(table: string, id: number, data: Record<string, unknown>): boolean {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    if (keys.length === 0) {
      throw new Error('No data provided for update');
    }
    
    // Add updated_at timestamp
    keys.push('updated_at');
    values.push(new Date().toISOString());
    
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    
    values.push(id);
    
    const result = this.executeQuery(query, values);
    return result.changes > 0;
  }

  /**
   * Insert a record with automatic timestamps
   */
  public insertRecord(table: string, data: Record<string, unknown>): number {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    // Add timestamps
    const now = new Date().toISOString();
    keys.push('created_at', 'updated_at');
    values.push(now, now);
    
    const placeholders = keys.map(() => '?').join(', ');
    const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    
    const result = this.executeQuery(query, values);
    return result.lastInsertRowid;
  }

  /**
   * Get next sequence value for a counter
   */
  public getNextSequence(counterName: string): number {
    return this.withTransaction(() => {
      // Get current value
      const counter = this.getOne<{ value: number }>(
        'SELECT value FROM counters WHERE name = ?',
        [counterName]
      );
      
      if (!counter) {
        // Create counter if it doesn't exist
        this.executeQuery(
          'INSERT INTO counters (name, value, created_at, updated_at) VALUES (?, 1, datetime(\'now\'), datetime(\'now\'))',
          [counterName]
        );
        return 1;
      }
      
      // Increment counter
      const nextValue = counter.value + 1;
      this.executeQuery(
        'UPDATE counters SET value = ?, updated_at = datetime(\'now\') WHERE name = ?',
        [nextValue, counterName]
      );
      
      return nextValue;
    });
  }

  /**
   * Get the next ID for a table (legacy method for compatibility)
   */
  public getNextId(table: string): number {
    return this.getNextSequence(table);
  }

  /**
   * Update a record by ID (legacy method for compatibility)
   */
  public updateById(table: string, id: number, data: Record<string, unknown>): boolean {
    return this.updateRecord(table, id, data);
  }

  /**
   * Delete a record by ID (legacy method for compatibility)
   */
  public deleteById(table: string, id: number): boolean {
    return this.softDelete(table, id);
  }

  /**
   * Check if a table exists
   */
  public tableExists(tableName: string): boolean {
    return this.database.tableExists(tableName);
  }

  /**
   * Check if a record exists with specific criteria
   */
  public exists(table: string, column: string, value: unknown): boolean {
    const result = this.getOne(`SELECT 1 FROM ${table} WHERE ${column} = ?`, [value]);
    return result !== null;
  }

  /**
   * Execute operations within a transaction (alias for withTransaction)
   */
  public executeTransaction<T>(callback: () => T): T {
    return this.withTransaction(callback);
  }

  /**
   * Get database health information
   */
  getHealth() {
    return {
      isConnected: this.database.isConnected(),
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance for backward compatibility
export const databaseService = new DatabaseService();