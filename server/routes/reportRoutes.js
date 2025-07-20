// Report routes for Slimbooks
// Handles report generation and management endpoints

import { Router } from 'express';
import { requireAuth } from '../middleware/index.js';
import { db } from '../models/index.js';

const router = Router();

// All report routes require authentication
router.use(requireAuth);

// Get all reports
router.get('/', async (req, res) => {
  try {
    const reports = db.prepare(`
      SELECT id, name, type, date_range_start, date_range_end, data, created_at
      FROM reports
      ORDER BY created_at DESC
    `).all();

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reports'
    });
  }
});

// Get report by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const report = db.prepare(`
      SELECT id, name, type, date_range_start, date_range_end, data, created_at
      FROM reports
      WHERE id = ?
    `).get(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Parse JSON data field if it exists
    if (report.data) {
      try {
        report.data = JSON.parse(report.data);
      } catch (e) {
        console.warn('Failed to parse report data:', e);
      }
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get report'
    });
  }
});

// Create new report
router.post('/', async (req, res) => {
  try {
    const { reportData } = req.body;

    if (!reportData || !reportData.name || !reportData.type) {
      return res.status(400).json({
        success: false,
        error: 'Report name and type are required'
      });
    }

    // Get next ID
    const counterResult = db.prepare('SELECT value FROM counters WHERE name = ?').get('reports');
    const nextId = (counterResult?.value || 0) + 1;
    db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(nextId, 'reports');

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO reports (id, name, type, date_range_start, date_range_end, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      nextId,
      reportData.name,
      reportData.type,
      reportData.date_range_start || '',
      reportData.date_range_end || '',
      reportData.data ? JSON.stringify(reportData.data) : null,
      now
    );

    res.json({
      success: true,
      result: {
        id: nextId,
        changes: result.changes
      }
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create report'
    });
  }
});

// Update report
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reportData } = req.body;

    if (!reportData) {
      return res.status(400).json({
        success: false,
        error: 'Report data is required'
      });
    }

    const stmt = db.prepare(`
      UPDATE reports
      SET name = ?, type = ?, date_range_start = ?, date_range_end = ?, data = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      reportData.name,
      reportData.type,
      reportData.date_range_start || '',
      reportData.date_range_end || '',
      reportData.data ? JSON.stringify(reportData.data) : null,
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json({
      success: true,
      result: {
        id: parseInt(id),
        changes: result.changes
      }
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report'
    });
  }
});

// Delete report
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = db.prepare('DELETE FROM reports WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      result: {
        id: parseInt(id),
        changes: result.changes
      }
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report'
    });
  }
});

export default router;
