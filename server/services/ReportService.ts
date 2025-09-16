// Report Service - Domain-specific service for report management operations
// Handles all report-related business logic and database operations

import { databaseService } from '../core/DatabaseService.js';

export interface ReportData {
  name: string;
  type: string;
  date_range_start?: string;
  date_range_end?: string;
  data?: any;
}

export interface DatabaseReport {
  id: number;
  name: string;
  type: string;
  date_range_start: string;
  date_range_end: string;
  data: string | null;
  created_at: string;
}

/**
 * Report Management Service
 * Handles report lifecycle management, data processing, and CRUD operations
 */
export class ReportService {
  /**
   * Get all reports ordered by creation date
   */
  async getAllReports(): Promise<DatabaseReport[]> {
    return databaseService.getMany<DatabaseReport>(`
      SELECT id, name, type, date_range_start, date_range_end, data, created_at
      FROM reports
      ORDER BY created_at DESC
    `);
  }

  /**
   * Get report by ID with parsed data field
   */
  async getReportById(id: number): Promise<DatabaseReport | null> {
    if (!id || typeof id !== 'number') {
      throw new Error('Valid report ID is required');
    }

    const report = databaseService.getOne<DatabaseReport>(`
      SELECT id, name, type, date_range_start, date_range_end, data, created_at
      FROM reports
      WHERE id = ?
    `, [id]);

    if (!report) {
      return null;
    }

    // Parse JSON data field if it exists
    const parsedReport: any = { ...report };
    if (report.data) {
      try {
        parsedReport.data = JSON.parse(report.data);
      } catch (e) {
        console.warn('Failed to parse report data:', e);
        // Keep original data if parsing fails
      }
    }

    return parsedReport;
  }

  /**
   * Create new report
   */
  async createReport(reportData: ReportData): Promise<{ id: number; changes: number }> {
    if (!reportData || !reportData.name || !reportData.type) {
      throw new Error('Report name and type are required');
    }

    // Get next ID from counter service
    const nextId = databaseService.getNextId('reports');
    const now = new Date().toISOString();

    const result = databaseService.executeQuery(`
      INSERT INTO reports (id, name, type, date_range_start, date_range_end, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      nextId,
      reportData.name,
      reportData.type,
      reportData.date_range_start || '',
      reportData.date_range_end || '',
      reportData.data ? JSON.stringify(reportData.data) : null,
      now
    ]);

    return {
      id: nextId,
      changes: result.changes
    };
  }

  /**
   * Update existing report
   */
  async updateReport(id: number, reportData: ReportData): Promise<{ id: number; changes: number }> {
    if (!id || typeof id !== 'number') {
      throw new Error('Valid report ID is required');
    }

    if (!reportData) {
      throw new Error('Report data is required');
    }

    const result = databaseService.executeQuery(`
      UPDATE reports
      SET name = ?, type = ?, date_range_start = ?, date_range_end = ?, data = ?
      WHERE id = ?
    `, [
      reportData.name,
      reportData.type,
      reportData.date_range_start || '',
      reportData.date_range_end || '',
      reportData.data ? JSON.stringify(reportData.data) : null,
      id
    ]);

    if (result.changes === 0) {
      throw new Error('Report not found');
    }

    return {
      id: id,
      changes: result.changes
    };
  }

  /**
   * Delete report by ID
   */
  async deleteReport(id: number): Promise<{ id: number; changes: number }> {
    if (!id || typeof id !== 'number') {
      throw new Error('Valid report ID is required');
    }

    const result = databaseService.executeQuery('DELETE FROM reports WHERE id = ?', [id]);

    if (result.changes === 0) {
      throw new Error('Report not found');
    }

    return {
      id: id,
      changes: result.changes
    };
  }

  /**
   * Check if report exists
   */
  async reportExists(id: number): Promise<boolean> {
    if (!id || typeof id !== 'number') {
      return false;
    }

    return databaseService.exists('reports', 'id', id);
  }

  /**
   * Get reports by type
   */
  async getReportsByType(type: string): Promise<DatabaseReport[]> {
    if (!type || typeof type !== 'string') {
      throw new Error('Valid report type is required');
    }

    return databaseService.getMany<DatabaseReport>(`
      SELECT id, name, type, date_range_start, date_range_end, data, created_at
      FROM reports
      WHERE type = ?
      ORDER BY created_at DESC
    `, [type]);
  }

  /**
   * Get reports within date range
   */
  async getReportsByDateRange(startDate: string, endDate: string): Promise<DatabaseReport[]> {
    if (!startDate || !endDate) {
      throw new Error('Valid date range is required');
    }

    return databaseService.getMany<DatabaseReport>(`
      SELECT id, name, type, date_range_start, date_range_end, data, created_at
      FROM reports
      WHERE created_at >= ? AND created_at <= ?
      ORDER BY created_at DESC
    `, [startDate, endDate]);
  }

  /**
   * Get report count
   */
  async getReportCount(): Promise<number> {
    const result = databaseService.getOne<{count: number}>(
      'SELECT COUNT(*) as count FROM reports'
    );
    return result?.count || 0;
  }

  /**
   * Get report count by type
   */
  async getReportCountByType(type: string): Promise<number> {
    if (!type || typeof type !== 'string') {
      throw new Error('Valid report type is required');
    }

    const result = databaseService.getOne<{count: number}>(
      'SELECT COUNT(*) as count FROM reports WHERE type = ?',
      [type]
    );
    return result?.count || 0;
  }
}

// Export singleton instance
export const reportService = new ReportService();