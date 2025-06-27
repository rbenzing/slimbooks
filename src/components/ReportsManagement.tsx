
import React, { useState, useEffect } from 'react';
import { BarChart, TrendingUp, FileText, Download, Calendar, Trash2 } from 'lucide-react';
import { ProfitLossReport } from './reports/ProfitLossReport';
import { ExpenseReport } from './reports/ExpenseReport';
import { InvoiceReport } from './reports/InvoiceReport';
import { ClientReport } from './reports/ClientReport';
import { reportOperations } from '../lib/database';
import { toast } from 'sonner';

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
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    preset: 'this-month'
  });

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
      color: 'bg-green-600'
    },
    {
      id: 'expense' as ReportType,
      name: 'Expense Report',
      description: 'Detailed breakdown of company expenses',
      icon: FileText,
      color: 'bg-red-600'
    },
    {
      id: 'invoice' as ReportType,
      name: 'Invoice Report',
      description: 'Invoice status and payment tracking',
      icon: BarChart,
      color: 'bg-blue-600'
    },
    {
      id: 'client' as ReportType,
      name: 'Client Report',
      description: 'Client activity and revenue analysis',
      icon: FileText,
      color: 'bg-purple-600'
    }
  ];

  const handleDatePresetChange = (preset: DateRange['preset']) => {
    const today = new Date();
    let start: Date;
    let end: Date;

    switch (preset) {
      case 'this-month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case 'last-month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'this-quarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), currentQuarter * 3, 1);
        end = today;
        break;
      case 'last-quarter':
        const lastQuarter = Math.floor(today.getMonth() / 3) - 1;
        const year = lastQuarter < 0 ? today.getFullYear() - 1 : today.getFullYear();
        const quarter = lastQuarter < 0 ? 3 : lastQuarter;
        start = new Date(year, quarter * 3, 1);
        end = new Date(year, (quarter + 1) * 3, 0);
        break;
      case 'this-year':
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
      case 'last-year':
        start = new Date(today.getFullYear() - 1, 0, 1);
        end = new Date(today.getFullYear() - 1, 11, 31);
        break;
      default:
        return;
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      preset
    });
  };

  const handleSaveReport = (reportData: any, reportType: ReportType) => {
    try {
      const reportName = `${reportTypes.find(r => r.id === reportType)?.name} - ${formatDateRange()}`;
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

  const formatDateRange = () => {
    const start = new Date(dateRange.start).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const end = new Date(dateRange.end).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return `${start} - ${end}`;
  };

  const renderReport = () => {
    switch (selectedReport) {
      case 'profit-loss':
        return <ProfitLossReport dateRange={dateRange} onBack={() => setSelectedReport(null)} onSave={handleSaveReport} />;
      case 'expense':
        return <ExpenseReport dateRange={dateRange} onBack={() => setSelectedReport(null)} onSave={handleSaveReport} />;
      case 'invoice':
        return <InvoiceReport dateRange={dateRange} onBack={() => setSelectedReport(null)} onSave={handleSaveReport} />;
      case 'client':
        return <ClientReport dateRange={dateRange} onBack={() => setSelectedReport(null)} onSave={handleSaveReport} />;
      default:
        return null;
    }
  };

  if (selectedReport) {
    return renderReport();
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate insights from your business data</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Date Range</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={dateRange.preset}
              onChange={(e) => handleDatePresetChange(e.target.value as DateRange['preset'])}
            >
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-quarter">This Quarter</option>
              <option value="last-quarter">Last Quarter</option>
              <option value="this-year">This Year</option>
              <option value="last-year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value, preset: 'custom' })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value, preset: 'custom' })}
            />
          </div>
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedReport(report.id)}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${report.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{report.name}</h3>
                  <p className="text-gray-600 mb-4">{report.description}</p>
                  <button className="flex items-center text-blue-600 hover:text-blue-800 font-medium">
                    Generate Report
                    <BarChart className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Saved Reports */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Saved Reports</h3>
        </div>
        <div className="p-6">
          {savedReports.length > 0 ? (
            <div className="space-y-4">
              {savedReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{report.name}</h4>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 p-2">
                      <Download className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteReport(report.id, report.name)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No saved reports. Generate your first report above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
