// Main database model module for Slimbooks
// Exports database instance and initialization functions

import { initializeDatabase } from '../config/database.js';
import { createTables } from './schema.js';
import { initializeCounters, initializeAdminUser, initializeSampleData, addSampleInvoices } from './seedData.js';

// Initialize database instance
export const db = initializeDatabase();

/**
 * Initialize the complete database setup
 * @param {boolean} includeSampleData - Whether to include sample data (for development)
 */
export const initializeCompleteDatabase = async (includeSampleData = false) => {
  try {
    console.log('🚀 Initializing database...');
    
    // Create tables
    createTables(db);

    // Database schema is now optimized - no migrations needed
    
    // Initialize counters
    initializeCounters(db);
    
    // Initialize admin user
    await initializeAdminUser(db);
    
    // Add sample data if requested (typically for development)
    if (includeSampleData && process.env.NODE_ENV !== 'production') {
      initializeSampleData(db);
      addSampleInvoices(db);
    }
    
    console.log('✅ Database initialization completed successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Export individual functions for specific use cases
export {
  createTables,
  initializeCounters,
  initializeAdminUser,
  initializeSampleData,
  addSampleInvoices
};
