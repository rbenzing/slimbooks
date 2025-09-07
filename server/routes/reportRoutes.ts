// Report routes for Slimbooks
// Handles report generation and management endpoints

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/index.js';
import { reportService, ReportData } from '../services/ReportService.js';

const router: Router = Router();

// All report routes require authentication
router.use(requireAuth);

// Get all reports
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const reports = await reportService.getAllReports();

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
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const reportId = parseInt(id!);

    if (isNaN(reportId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid report ID'
      });
      return;
    }

    const report = await reportService.getReportById(reportId);

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Report not found'
      });
      return;
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
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportData }: { reportData: ReportData } = req.body;

    if (!reportData || !reportData.name || !reportData.type) {
      res.status(400).json({
        success: false,
        error: 'Report name and type are required'
      });
      return;
    }

    const result = await reportService.createReport(reportData);

    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create report'
    });
  }
});

// Update report
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reportData }: { reportData: ReportData } = req.body;
    const reportId = parseInt(id!);

    if (isNaN(reportId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid report ID'
      });
      return;
    }

    if (!reportData) {
      res.status(400).json({
        success: false,
        error: 'Report data is required'
      });
      return;
    }

    const result = await reportService.updateReport(reportId, reportData);

    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update report'
    });
  }
});

// Delete report
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const reportId = parseInt(id!);

    if (isNaN(reportId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid report ID'
      });
      return;
    }
    
    const result = await reportService.deleteReport(reportId);
    
    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete report'
    });
  }
});

export default router;