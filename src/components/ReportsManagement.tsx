
import React, { useState, useEffect } from 'react';
import { BarChart, TrendingUp, FileText, Download, Calendar, Trash2 } from 'lucide-react';
import { ProfitLossReport } from './reports/ProfitLossReport';
import { ExpenseReport } from './reports/ExpenseReport';
import { InvoiceReport } from './reports/InvoiceReport';
import { ClientReport } from './reports/ClientReport';
import { reportOperations } from '../lib/database';
import { themeClasses } from '../lib/utils';
import { toast } from 'sonner';
import { formatDate, formatDateRange } from '@/utils/dateFormatting';

export type ReportType = 'profit-loss' | 'expense' | 'invoice' | 'client';

export interface DateRange {
  start: string;
  end: string;
  preset: 'custom' | 'this-month' | 'last-month' | 'this-quarter' | 'last-quarter' | 'this-year' | 'last-year';
}

interface Report {
  id: number;
  name: string;
  type: ReportType;
  date_range_start: string;
  date_range_end: string;
  data: any;
  created_at: string;
}

export const ReportsManagement: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [savedReports, setSavedReports] = useState<Report[]>([]);

  useEffect(() => {
    loadSavedReports();
  }, []);

  const loadSavedReports = () => {
    const reports = reportOperations.getAll();
    setSavedReports(reports);
  };

  const reportTypes = [
    {
      id: 'profit-loss' as ReportType,
      name: 'Profit & Loss',
      description: 'Revenue, expenses, and net income overview',
      icon: TrendingUp,
      color: 'bg-green-600 dark:bg-green-500'
    },
    {
      id: 'expense' as ReportType,
      name: 'Expense Report',
      description: 'Detailed breakdown of company expenses',
      icon: FileText,
      color: 'bg-red-600 dark:bg-red-500'
    },
    {
      id: 'invoice' as ReportType,
      name: 'Invoice Report',
      description: 'Invoice status and payment tracking',
      icon: BarChart,
      color: 'bg-blue-600 dark:bg-blue-500'
    },
    {
      id: 'client' as ReportType,
      name: 'Client Report',
      description: 'Client activity and revenue analysis',
      icon: FileText,
      color: 'bg-purple-600 dark:bg-purple-500'
    }
  ];

  const handleSaveReport = (reportData: any, reportType: ReportType, dateRange: DateRange) => {
    try {
      const reportName = `${reportTypes.find(r => r.id === reportType)?.name} - ${formatDateRange(dateRange)}`;
      reportOperations.create({
        name: reportName,
        type: reportType,
        date_range_start: dateRange.start,
        date_range_end: dateRange.end,
        data: reportData
      });
      toast.success('Report saved successfully');
      loadSavedReports();
    } catch (error) {
      toast.error('Failed to save report');
      console.error('Error saving report:', error);
    }
  };

  const handleDeleteReport = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        reportOperations.delete(id);
        toast.success('Report deleted successfully');
        loadSavedReports();
      } catch (error) {
        toast.error('Failed to delete report');
        console.error('Error deleting report:', error);
      }
    }
  };

  const getFormattedDateRange = (dateRange: DateRange) => {
    return formatDateRange(dateRange.start, dateRange.end);
  };

  const renderReport = () => {
    switch (selectedReport) {
      case 'profit-loss':
        return <ProfitLossReport onBack={() => setSelectedReport(null)} onSave={handleSaveReport} />;
      case 'expense':
        return <ExpenseReport onBack={() => setSelectedReport(null)} onSave={handleSaveReport} />;
      case 'invoice':
        return <InvoiceReport onBack={() => setSelectedReport(null)} onSave={handleSaveReport} />;
      case 'client':
        return <ClientReport onBack={() => setSelectedReport(null)} onSave={handleSaveReport} />;
      default:
        return null;
    }
  };

  if (selectedReport) {
    return renderReport();
  }

  return (
    <div className={themeClasses.page}>
      <div className={themeClasses.pageContainer}>
        {/* Header */}
        <div className={themeClasses.pageHeader}>
          <h1 className={themeClasses.pageTitle}>Reports</h1>
          <p className={themeClasses.pageSubtitle}>Generate insights from your business data</p>
        </div>

        {/* Report Types Grid */}
        <div className={themeClasses.cardsGrid}>
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <div
                key={report.id}
                className={themeClasses.cardHover}
                onClick={() => setSelectedReport(report.id)}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${report.color}`}>
                    <Icon className={`${themeClasses.iconMedium} text-white`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`${themeClasses.cardTitle} mb-2`}>{report.name}</h3>
                    <p className={`${themeClasses.mutedText} mb-4`}>{report.description}</p>
                    <button className="flex items-center text-primary hover:text-primary/80 font-medium">
                      Generate Report
                      <BarChart className={`${themeClasses.iconSmall} ml-1`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Saved Reports */}
        <div className={themeClasses.card}>
          <div className={themeClasses.cardHeader}>
            <h3 className={themeClasses.cardTitle}>Saved Reports</h3>
          </div>
          <div>
            {savedReports.length > 0 ? (
              <div className="space-y-4">
                {savedReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <h4 className={`font-medium ${themeClasses.bodyText}`}>{report.name}</h4>
                      <p className={themeClasses.smallText}>
                        Created: {formatDate(report.created_at)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-primary hover:text-primary/80 p-2">
                        <Download className={themeClasses.iconSmall} />
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id, report.name)}
                        className="text-destructive hover:text-destructive/80 p-2"
                      >
                        <Trash2 className={themeClasses.iconSmall} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className={`${themeClasses.iconLarge} ${themeClasses.mutedText} mx-auto mb-4`} />
                <p className={themeClasses.mutedText}>No saved reports. Generate your first report above.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
