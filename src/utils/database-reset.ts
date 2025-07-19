// Utility to reset the database for testing
export const resetDatabase = () => {
  // Clear the SQLite database from localStorage
  localStorage.removeItem('slimbooks_sqlite_db');
  localStorage.removeItem('slimbooks_migration_completed');
  
  console.log('Database reset. Please refresh the page to reinitialize.');
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).resetDatabase = resetDatabase;
}
