// Main entry point for Slimbooks server
// Starts the refactored modular server

import { startServer } from './app.js';

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});