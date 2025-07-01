
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, TrendingUp, TrendingDown, Save, Calendar } from 'lucide-react';
import { DateRange, ReportType } from '../ReportsManagement';
import { reportOperations } from '../../lib/database';

interface ProfitLossReportProps {
  onBack: () => void;
  onSave: (reportData: any, reportType: ReportType, dateRange: DateRange) => void;
}

export const ProfitLossReport: React.FC<ProfitLossReportProps> = ({ onBack, onSave }) => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    preset: 'this-month'
  });

  useEffect(() => {
    generateReportData();
  }, [dateRange]);

  const generateReportData = () => {
    setLoading(true);
    try {
      const data = reportOperations.generateProfitLossData(dateRange.start, dateRange.end);
      setReportData(data);
    } catch (error) {
      console.error('Error generating report data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateRange = () => {
    const start = new Date(dateRange.start).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const end = new Date(dateRange.end).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return `${start} - ${end}`;
  };

  const handleSave = () => {
    if (reportData) {
      onSave(reportData, 'profit-loss', dateRange);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center">
          <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Reports
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Generating Report...</h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Please wait while we generate your report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Reports
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profit & Loss Report</h1>
            <p className="text-gray-600">{formatDateRange()}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Report
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Report Date Range
        </h3>
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

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.revenue.total)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.expenses.total)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Income</p>
                  <p className={`text-2xl font-bold ${reportData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(reportData.netIncome)}
                  </p>
                </div>
                {reportData.netIncome >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </div>
          </div>

          {/* Detailed Report */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Detailed Breakdown</h3>
            </div>
            <div className="p-6">
              <div className="space-y-8">
                {/* Revenue Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Invoice Revenue</span>
                      <span className="font-medium text-gray-900">{formatCurrency(reportData.revenue.invoices)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Other Income</span>
                      <span className="font-medium text-gray-900">{formatCurrency(reportData.revenue.otherIncome)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between items-center py-2">
                        <span className="font-semibold text-gray-900">Total Revenue</span>
                        <span className="font-bold text-green-600">{formatCurrency(reportData.revenue.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Expenses</h4>
                  <div className="space-y-3">
                    {Object.entries(reportData.expenses).map(([category, amount]) => {
                      if (category === 'total') return null;
                      return (
                        <div key={category} className="flex justify-between items-center py-2">
                          <span className="text-gray-700">{category}</span>
                          <span className="font-medium text-gray-900">{formatCurrency(amount as number)}</span>
                        </div>
                      );
                    })}
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between items-center py-2">
                        <span className="font-semibold text-gray-900">Total Expenses</span>
                        <span className="font-bold text-red-600">{formatCurrency(reportData.expenses.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Income */}
                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xl font-bold text-gray-900">Net Income</span>
                    <span className={`text-xl font-bold ${reportData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(reportData.netIncome)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
