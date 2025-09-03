// Database Service - Base abstraction layer for all database operations
// Provides secure, consistent database access patterns

import { db } from '../models/index.js';

/**
 * Base Database Service
 * Provides common database operations with proper error handling and security
 */
export class DatabaseService {
  constructor() {
    if (!db) {
      throw new Error('Database connection not available');
    }
  }

  /**
   * Execute a prepared statement with parameters
   * @param {string} query - SQL query with placeholders
   * @param {Array} params - Parameters for the query
   * @returns {Object} - Result from database
   */
  executeQuery(query, params = []) {
    try {
      const stmt = db.prepare(query);
      return stmt.run(params);
    } catch (error) {
      console.error('Database query execution error:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Get single record with prepared statement
   * @param {string} query - SQL query with placeholders
   * @param {Array} params - Parameters for the query
   * @returns {Object|null} - Single record or null
   */
  getOne(query, params = []) {
    try {
      const stmt = db.prepare(query);
      return stmt.get(params) || null;
    } catch (error) {
      console.error('Database get one error:', error);
      throw new Error(`Database fetch operation failed: ${error.message}`);
    }
  }

  /**
   * Get multiple records with prepared statement
   * @param {string} query - SQL query with placeholders
   * @param {Array} params - Parameters for the query
   * @returns {Array} - Array of records
   */
  getMany(query, params = []) {
    try {
      const stmt = db.prepare(query);
      return stmt.all(params);
    } catch (error) {
      console.error('Database get many error:', error);
      throw new Error(`Database fetch operation failed: ${error.message}`);
    }
  }

  /**
   * Execute transaction with multiple operations
   * @param {Function} operations - Function containing database operations
   * @returns {*} - Result of transaction
   */
  executeTransaction(operations) {
    try {
      return db.transaction(operations)();
    } catch (error) {
      console.error('Database transaction error:', error);
      throw new Error(`Database transaction failed: ${error.message}`);
    }
  }

  /**
   * Insert record and return last insert ID
   * @param {string} table - Table name
   * @param {Object} data - Data to insert
   * @returns {number} - Last insert row ID
   */
  insert(table, data) {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);
    
    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    const result = this.executeQuery(query, values);
    return result.lastInsertRowid;
  }

  /**
   * Update record by ID
   * @param {string} table - Table name
   * @param {number} id - Record ID
   * @param {Object} data - Data to update
   * @returns {number} - Number of changed rows
   */
  updateById(table, id, data) {
    const columns = Object.keys(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const values = [...Object.values(data), id];
    
    const query = `UPDATE ${table} SET ${setClause}, updated_at = datetime('now') WHERE id = ?`;
    const result = this.executeQuery(query, values);
    return result.changes;
  }

  /**
   * Delete record by ID
   * @param {string} table - Table name
   * @param {number} id - Record ID
   * @returns {number} - Number of deleted rows
   */
  deleteById(table, id) {
    const query = `DELETE FROM ${table} WHERE id = ?`;
    const result = this.executeQuery(query, [id]);
    return result.changes;
  }

  /**
   * Get record by ID
   * @param {string} table - Table name
   * @param {number} id - Record ID
   * @returns {Object|null} - Record or null
   */
  getById(table, id) {
    const query = `SELECT * FROM ${table} WHERE id = ?`;
    return this.getOne(query, [id]);
  }

  /**
   * Check if record exists
   * @param {string} table - Table name
   * @param {string} column - Column name
   * @param {*} value - Value to check
   * @returns {boolean} - True if exists
   */
  exists(table, column, value) {
    const query = `SELECT 1 FROM ${table} WHERE ${column} = ? LIMIT 1`;
    return !!this.getOne(query, [value]);
  }

  /**
   * Get next counter value and increment
   * @param {string} counterName - Name of counter
   * @returns {number} - Next counter value
   */
  getNextId(counterName) {
    const result = this.getOne('SELECT value FROM counters WHERE name = ?', [counterName]);
    const nextId = (result?.value || 0) + 1;
    this.executeQuery('INSERT OR REPLACE INTO counters (name, value) VALUES (?, ?)', [counterName, nextId]);
    return nextId;
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();