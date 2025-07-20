// Health check routes for Slimbooks API
// Provides system health and status information

import { Router } from 'express';
import { db } from '../models/index.js';
import { serverConfig } from '../config/index.js';

const router = Router();

/**
 * Basic health check
 */
router.get('/', (req, res) => {
  try {
    // Test database connection
    const dbTest = db.prepare('SELECT 1 as test').get();
    
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString(),
      environment: serverConfig.nodeEnv
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Detailed health check
 */
router.get('/detailed', (req, res) => {
  try {
    // Test database connection and get basic stats
    const dbTest = db.prepare('SELECT 1 as test').get();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get();
    const invoiceCount = db.prepare('SELECT COUNT(*) as count FROM invoices').get();
    const expenseCount = db.prepare('SELECT COUNT(*) as count FROM expenses').get();
    
    // System information
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: serverConfig.nodeEnv,
      version: '1.0.0',
      database: {
        status: 'connected',
        counts: {
          users: userCount.count,
          clients: clientCount.count,
          invoices: invoiceCount.count,
          expenses: expenseCount.count
        }
      },
      system: {
        uptime: Math.floor(uptime),
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024)
        },
        node_version: process.version,
        platform: process.platform
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        status: 'disconnected'
      }
    });
  }
});

/**
 * Readiness check (for container orchestration)
 */
router.get('/ready', (req, res) => {
  try {
    // Test database connection
    const dbTest = db.prepare('SELECT 1 as test').get();
    
    res.json({ 
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Liveness check (for container orchestration)
 */
router.get('/live', (req, res) => {
  res.json({ 
    alive: true,
    timestamp: new Date().toISOString()
  });
});

export default router;
