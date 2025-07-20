// Counter routes for Slimbooks
// Handles ID counter management endpoints

import { Router } from 'express';
import { requireAuth } from '../middleware/index.js';
import { db } from '../models/index.js';

const router = Router();

// All counter routes require authentication
router.use(requireAuth);

// Get next ID for a counter
router.get('/:counterName/next', async (req, res) => {
  try {
    const { counterName } = req.params;
    
    // Validate counter name
    const validCounters = ['clients', 'invoices', 'expenses', 'templates', 'reports'];
    if (!validCounters.includes(counterName)) {
      return res.status(400).json({
        success: false,
        error: `Invalid counter name. Valid counters: ${validCounters.join(', ')}`
      });
    }

    // Get current counter value
    const counterResult = db.prepare('SELECT value FROM counters WHERE name = ?').get(counterName);
    const nextId = (counterResult?.value || 0) + 1;
    
    // Update counter
    db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(nextId, counterName);
    
    res.json({
      success: true,
      nextId: nextId
    });
  } catch (error) {
    console.error('Error getting next counter ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get next counter ID'
    });
  }
});

// Get current counter value
router.get('/:counterName', async (req, res) => {
  try {
    const { counterName } = req.params;
    
    const counterResult = db.prepare('SELECT value FROM counters WHERE name = ?').get(counterName);
    
    if (!counterResult) {
      return res.status(404).json({
        success: false,
        error: 'Counter not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        name: counterName,
        value: counterResult.value
      }
    });
  } catch (error) {
    console.error('Error getting counter:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get counter'
    });
  }
});

// Reset counter (admin only)
router.put('/:counterName/reset', async (req, res) => {
  try {
    const { counterName } = req.params;
    const { value = 0 } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    // Update counter
    const result = db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(value, counterName);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Counter not found'
      });
    }
    
    res.json({
      success: true,
      message: `Counter ${counterName} reset to ${value}`
    });
  } catch (error) {
    console.error('Error resetting counter:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset counter'
    });
  }
});

export default router;
