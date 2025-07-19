
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, TrendingUp, TrendingDown, Save, Calendar } from 'lucide-react';
import { DateRange, ReportType } from '../ReportsManagement';
import { reportOperations } from '../../lib/database';
import { themeClasses, getButtonClasses } from '../../lib/utils';
import { formatDateRangeSync } from '@/utils/dateFormatting';

interface ProfitLossReportProps {
  onBack: () => void;
  onSave: (reportData: any, reportType: ReportType, dateRange: DateRange) => void;
}

export const ProfitLossReport: React.FC<ProfitLossReportProps> = ({ onBack, onSave }) => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [accountingMethod, setAccountingMethod] = useState<'cash' | 'accrual'>('accrual');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    preset: 'this-month'
  });

  useEffect(() => {
    generateReportData();
  }, [dateRange.start, dateRange.end, accountingMethod]);

  const generateReportData = async () => {
    setLoading(true);
    try {
      const data = await reportOperations.generateProfitLossData(dateRange.start, dateRange.end, accountingMethod);
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

  const formatCurrency = (amount: number | undefined | null) => {
    const safeAmount = amount || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(safeAmount);
  };

  const getFormattedDateRange = () => {
    return formatDateRangeSync(dateRange.start, dateRange.end);
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
    <div className={themeClasses.page}>
      <div className={themeClasses.pageContainer}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className={`flex items-center ${themeClasses.mutedText} hover:text-foreground mr-4`}
            >
              <ArrowLeft className={`${themeClasses.iconSmall} mr-1`} />
              Back to Reports
            </button>
            <div>
              <h1 className={themeClasses.pageTitle}>Profit & Loss Report</h1>
              <p className={themeClasses.pageSubtitle}>{getFormattedDateRange()}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className={getButtonClasses('primary')}
            >
              <Save className={themeClasses.iconButton} />
              Save Report
            </button>
            <button className={getButtonClasses('secondary')}>
              <Download className={themeClasses.iconButton} />
              Export PDF
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className={themeClasses.card}>
          <h3 className={`${themeClasses.cardTitle} mb-4 flex items-center`}>
            <Calendar className={`${themeClasses.iconSmall} mr-2`} />
            Report Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={`block text-sm font-medium ${themeClasses.bodyText} mb-2`}>
                Quick Select
              </label>
              <select
                className={themeClasses.select}
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
              <label className={`block text-sm font-medium ${themeClasses.bodyText} mb-2`}>
                Start Date
              </label>
              <input
                type="date"
                className={themeClasses.dateInput}
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value, preset: 'custom' })}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${themeClasses.bodyText} mb-2`}>
                End Date
              </label>
              <input
                type="date"
                className={themeClasses.dateInput}
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value, preset: 'custom' })}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${themeClasses.bodyText} mb-2`}>
                Accounting Method
              </label>
              <select
                className={themeClasses.select}
                value={accountingMethod}
                onChange={(e) => setAccountingMethod(e.target.value as 'cash' | 'accrual')}
              >
                <option value="accrual">Accrual (All Invoices)</option>
                <option value="cash">Cash (Paid Only)</option>
              </select>
              <p className={`text-xs ${themeClasses.mutedText} mt-1`}>
                {accountingMethod === 'accrual'
                  ? 'Includes all invoices as revenue'
                  : 'Only counts paid invoices as revenue'}
              </p>
            </div>
          </div>
        </div>

        {reportData && (
          <>
            {/* Accounting Method Indicator */}
            <div className={`${themeClasses.card} mb-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-sm font-medium ${themeClasses.bodyText}`}>
                    Accounting Method: <span className="font-semibold capitalize">{accountingMethod}</span>
                  </h4>
                  <p className={`text-xs ${themeClasses.mutedText}`}>
                    {accountingMethod === 'accrual'
                      ? 'Revenue includes all invoices (draft, sent, paid, overdue)'
                      : 'Revenue includes only paid invoices'}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  accountingMethod === 'accrual'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {accountingMethod === 'accrual' ? 'Accrual Basis' : 'Cash Basis'}
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className={themeClasses.statsGridThree}>
              <div className={themeClasses.statCard}>
                <div className={themeClasses.statCardContent}>
                  <div>
                    <p className={themeClasses.statLabel}>Total Revenue</p>
                    <p className={`${themeClasses.statValueMedium} text-green-600 dark:text-green-400`}>{formatCurrency(reportData.revenue.total)}</p>
                  </div>
                  <TrendingUp className={`${themeClasses.iconLarge} text-green-600 dark:text-green-400`} />
                </div>
              </div>
              <div className={themeClasses.statCard}>
                <div className={themeClasses.statCardContent}>
                  <div>
                    <p className={themeClasses.statLabel}>Total Expenses</p>
                    <p className={`${themeClasses.statValueMedium} text-red-600 dark:text-red-400`}>{formatCurrency(reportData.expenses.total)}</p>
                  </div>
                  <TrendingDown className={`${themeClasses.iconLarge} text-red-600 dark:text-red-400`} />
                </div>
              </div>
              <div className={themeClasses.statCard}>
                <div className={themeClasses.statCardContent}>
                  <div>
                    <p className={themeClasses.statLabel}>Net Income</p>
                    <p className={`${themeClasses.statValueMedium} ${reportData.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(reportData.netIncome)}
                    </p>
                  </div>
                  {reportData.netIncome >= 0 ? (
                    <TrendingUp className={`${themeClasses.iconLarge} text-green-600 dark:text-green-400`} />
                  ) : (
                    <TrendingDown className={`${themeClasses.iconLarge} text-red-600 dark:text-red-400`} />
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Report */}
            <div className={themeClasses.card}>
              <div className={themeClasses.cardHeader}>
                <h3 className={themeClasses.cardTitle}>Detailed Breakdown</h3>
              </div>
              <div className={themeClasses.cardContent}>
                <div className="space-y-8">
                  {/* Revenue Section */}
                  <div>
                    <h4 className={`text-lg font-semibold ${themeClasses.bodyText} mb-4`}>Revenue</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2">
                        <span className={`${themeClasses.mutedText} flex-1`}>Invoice Revenue</span>
                        <div className="flex items-center space-x-4 min-w-0">
                          <span className={`font-medium ${themeClasses.bodyText}`}>{formatCurrency(reportData.revenue.invoices)}</span>
                          <span className={`${themeClasses.mutedText} text-sm min-w-[3rem] text-right`}>
                            {reportData.revenue.total > 0 ? ((reportData.revenue.invoices / reportData.revenue.total) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className={`${themeClasses.mutedText} flex-1`}>Other Income</span>
                        <div className="flex items-center space-x-4 min-w-0">
                          <span className={`font-medium ${themeClasses.bodyText}`}>{formatCurrency(reportData.revenue.otherIncome)}</span>
                          <span className={`${themeClasses.mutedText} text-sm min-w-[3rem] text-right`}>
                            {reportData.revenue.total > 0 ? ((reportData.revenue.otherIncome / reportData.revenue.total) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-border pt-2">
                        <div className="flex justify-between items-center py-2">
                          <span className={`font-semibold ${themeClasses.bodyText} flex-1`}>Total Revenue</span>
                          <div className="flex items-center space-x-4 min-w-0">
                            <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(reportData.revenue.total)}</span>
                            <span className={`${themeClasses.mutedText} text-sm min-w-[3rem] text-right`}>100%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div>
                    <h4 className={`text-lg font-semibold ${themeClasses.bodyText} mb-4`}>Expenses</h4>
                    <div className="space-y-3">
                      {Object.entries(reportData.expenses).map(([category, amount]) => {
                        if (category === 'total') return null;
                        const percentage = reportData.expenses.total > 0 ? ((amount as number) / reportData.expenses.total * 100) : 0;
                        return (
                          <div key={category} className="flex justify-between items-center py-2">
                            <span className={`${themeClasses.mutedText} flex-1`}>{category}</span>
                            <div className="flex items-center space-x-4 min-w-0">
                              <span className={`font-medium ${themeClasses.bodyText}`}>{formatCurrency(amount as number)}</span>
                              <span className={`${themeClasses.mutedText} text-sm min-w-[3rem] text-right`}>
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="border-t border-border pt-2">
                        <div className="flex justify-between items-center py-2">
                          <span className={`font-semibold ${themeClasses.bodyText} flex-1`}>Total Expenses</span>
                          <div className="flex items-center space-x-4 min-w-0">
                            <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(reportData.expenses.total)}</span>
                            <span className={`${themeClasses.mutedText} text-sm min-w-[3rem] text-right`}>100%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Net Income */}
                  <div className="border-t-2 border-border pt-4">
                    <div className="flex justify-between items-center py-2">
                      <span className={`text-xl font-bold ${themeClasses.bodyText} flex-1`}>Net Income</span>
                      <div className="flex items-center space-x-4 min-w-0">
                        <span className={`text-xl font-bold ${reportData.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(reportData.netIncome)}
                        </span>
                        <span className={`${themeClasses.mutedText} text-sm min-w-[3rem] text-right`}>
                          {reportData.revenue.total > 0 ? ((reportData.netIncome / reportData.revenue.total) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </>
      )}
      </div>
    </div>
  );
};
