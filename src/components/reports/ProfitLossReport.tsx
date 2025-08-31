
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, TrendingUp, TrendingDown, Save, Calendar } from 'lucide-react';
import { DateRange, ReportType } from '../ReportsManagement';
import { reportOperations } from '../../lib/database';
import { themeClasses, getButtonClasses } from '../../lib/utils';
import { formatDateRangeSync } from '@/utils/dateFormatting';
import { FormattedCurrency, useCurrencyFormatter } from '@/components/ui/FormattedCurrency';
import { pdfService } from '@/services/pdf.svc';

interface ProfitLossReportProps {
  onBack: () => void;
  onSave: (reportData: any, reportType: ReportType, dateRange: DateRange) => void;
}

export const ProfitLossReport: React.FC<ProfitLossReportProps> = ({ onBack, onSave }) => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [accountingMethod, setAccountingMethod] = useState<'cash' | 'accrual'>('accrual');
  const [breakdownPeriod, setBreakdownPeriod] = useState<'monthly' | 'quarterly'>('quarterly');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      start: `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-${String(startOfMonth.getDate()).padStart(2, '0')}`,
      end: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      preset: 'this-month'
    };
  });

  const { formatAmountSync } = useCurrencyFormatter();

  useEffect(() => {
    generateReportData();
  }, [dateRange.start, dateRange.end, accountingMethod, breakdownPeriod]);

  const generateReportData = async () => {
    setLoading(true);
    try {
      const data = await reportOperations.generateProfitLossData(dateRange.start, dateRange.end, accountingMethod, dateRange.preset, breakdownPeriod);
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
      case 'this-quarter': {
        const currentQuarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), currentQuarter * 3, 1);
        end = today;
        break;
      }
      case 'last-quarter': {
        const lastQuarter = Math.floor(today.getMonth() / 3) - 1;
        const year = lastQuarter < 0 ? today.getFullYear() - 1 : today.getFullYear();
        const quarter = lastQuarter < 0 ? 3 : lastQuarter;
        start = new Date(year, quarter * 3, 1);
        end = new Date(year, (quarter + 1) * 3, 0);
        break;
      }
      case 'this-year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      case 'last-year':
        start = new Date(today.getFullYear() - 1, 0, 1);
        end = new Date(today.getFullYear() - 1, 11, 31);
        break;
      default:
        return;
    }

    setDateRange({
      start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
      end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`,
      preset
    });
  };



  const getFormattedDateRange = () => {
    return formatDateRangeSync(dateRange.start, dateRange.end);
  };

  const handleSave = () => {
    if (reportData) {
      onSave(reportData, 'profit-loss', dateRange);
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      // Create a URL for the current report view
      const currentUrl = `${window.location.origin}/reports/profit-loss?start=${dateRange.start}&end=${dateRange.end}&method=${accountingMethod}`;
      const reportName = `Profit-Loss-Report-${getFormattedDateRange()}`;

      await pdfService.downloadReportPDF(currentUrl, reportName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
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
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className={getButtonClasses('secondary')}
            >
              <Download className={themeClasses.iconButton} />
              {isExportingPDF ? 'Generating...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className={themeClasses.card}>
          <h3 className={`${themeClasses.cardTitle} mb-4 flex items-center`}>
            <Calendar className={`${themeClasses.iconSmall} mr-2`} />
            Report Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className={`block text-sm font-medium ${themeClasses.bodyText} mb-2`}>
                Quick Select
              </label>
              <select
                className={`w-full ${themeClasses.select}`}
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
                className={`w-full ${themeClasses.select}`}
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
            <div>
              <label className={`block text-sm font-medium ${themeClasses.bodyText} mb-2`}>
                Breakdown View
              </label>
              <select
                className={`w-full ${themeClasses.select}`}
                value={breakdownPeriod}
                onChange={(e) => setBreakdownPeriod(e.target.value as 'monthly' | 'quarterly')}
              >
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
              </select>
              <p className={`text-xs ${themeClasses.mutedText} mt-1`}>
                Show breakdown by period for multi-month ranges
              </p>
            </div>
          </div>
        </div>

        {reportData && (
          <>
            {/* Summary Cards */}
            <div className={themeClasses.statsGridThree}>
              <div className={themeClasses.statCard}>
                <div className={themeClasses.statCardContent}>
                  <div>
                    <p className={themeClasses.statLabel}>Total Revenue</p>
                    <p className={`${themeClasses.statValueMedium} text-green-600 dark:text-green-400`}>
                      <FormattedCurrency amount={reportData.revenue.total} />
                    </p>
                  </div>
                  <TrendingUp className={`${themeClasses.iconLarge} text-green-600 dark:text-green-400`} />
                </div>
              </div>
              <div className={themeClasses.statCard}>
                <div className={themeClasses.statCardContent}>
                  <div>
                    <p className={themeClasses.statLabel}>Total Expenses</p>
                    <p className={`${themeClasses.statValueMedium} text-red-600 dark:text-red-400`}>
                      <FormattedCurrency amount={reportData.expenses.total} />
                    </p>
                  </div>
                  <TrendingDown className={`${themeClasses.iconLarge} text-red-600 dark:text-red-400`} />
                </div>
              </div>
              <div className={themeClasses.statCard}>
                <div className={themeClasses.statCardContent}>
                  <div>
                    <p className={themeClasses.statLabel}>Net Income</p>
                    <p className={`${themeClasses.statValueMedium} ${reportData.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      <FormattedCurrency amount={reportData.netIncome} />
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

            {/* P&L Report - Clean Table Format */}
            <div className={themeClasses.card}>
              <div className={themeClasses.cardHeader}>
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  Profit and Loss
                </h3>
                <div className={`${themeClasses.mutedText} mt-1`}>
                  <p>Income Statement</p>
                  <p>For {getFormattedDateRange()}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm">
                  <thead>
                    <tr className="border-b-2 border-blue-600">
                      <th className="text-left py-3 px-2 min-w-[200px]"></th>
                      {reportData.hasBreakdown && reportData.periodColumns?.map((period: any, index: number) => (
                        <th key={index} className="text-center py-3 px-2 font-medium text-blue-600 dark:text-blue-400 min-w-[80px]">
                          {period.label}
                        </th>
                      ))}
                      <th className="text-center py-3 px-2 font-bold text-blue-600 dark:text-blue-400 min-w-[100px]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {/* Income (Billed) */}
                    <tr>
                      <td className="py-2 px-2 font-bold text-gray-900 dark:text-gray-100">Income (Billed)*</td>
                      <td colSpan={reportData.hasBreakdown ? reportData.periodColumns?.length + 1 : 1}></td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 pl-4 text-gray-700 dark:text-gray-300">Sales</td>
                      {reportData.hasBreakdown && reportData.periodColumns?.map((period: any, index: number) => (
                        <td key={index} className="py-1 px-2 text-right text-gray-900 dark:text-gray-100">
                          {formatAmountSync(period.revenue)}
                        </td>
                      ))}
                      <td className="py-1 px-2 text-right text-gray-900 dark:text-gray-100">
                        {formatAmountSync(reportData.revenue.total)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 pl-8 text-gray-600 dark:text-gray-400">Invoice</td>
                      {reportData.hasBreakdown && reportData.periodColumns?.map((period: any, index: number) => (
                        <td key={index} className="py-1 px-2 text-right text-gray-700 dark:text-gray-300">
                          {formatAmountSync(period.revenue)}
                        </td>
                      ))}
                      <td className="py-1 px-2 text-right text-gray-700 dark:text-gray-300">
                        {formatAmountSync(reportData.revenue.invoices)}
                      </td>
                    </tr>

                    {/* Cost of Goods Sold - placeholder row */}
                    <tr>
                      <td className="py-1 px-2 pl-4 text-gray-600 dark:text-gray-400">🧾 Cost of Goods Sold</td>
                      {reportData.hasBreakdown && reportData.periodColumns?.map((period: any, index: number) => (
                        <td key={index} className="py-1 px-2 text-right text-gray-700 dark:text-gray-300">
                          {formatAmountSync(0)}
                        </td>
                      ))}
                      <td className="py-1 px-2 text-right text-gray-700 dark:text-gray-300">
                        {formatAmountSync(0)}
                      </td>
                    </tr>

                    {/* Gross Profit */}
                    <tr className="font-semibold">
                      <td className="py-2 px-2 font-bold text-gray-900 dark:text-gray-100">Gross Profit</td>
                      {reportData.hasBreakdown && reportData.periodColumns?.map((period: any, index: number) => (
                        <td key={index} className={`py-2 px-2 text-right font-semibold ${
                          period.revenue >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatAmountSync(period.revenue)}
                        </td>
                      ))}
                      <td className={`py-2 px-2 text-right font-semibold ${
                        reportData.revenue.total >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatAmountSync(reportData.revenue.total)}
                      </td>
                    </tr>

                    {/* Gross Margin */}
                    <tr>
                      <td className="py-1 px-2 text-green-600 dark:text-green-400">Gross Margin</td>
                      {reportData.hasBreakdown && reportData.periodColumns?.map((period: any, index: number) => (
                        <td key={index} className="py-1 px-2 text-right text-green-600 dark:text-green-400">
                          {period.revenue > 0 ? '100.00%' : '0.00%'}
                        </td>
                      ))}
                      <td className="py-1 px-2 text-right text-green-600 dark:text-green-400">
                        {reportData.revenue.total > 0 ? '100.00%' : '0.00%'}
                      </td>
                    </tr>

                    {/* Less Expenses */}
                    <tr>
                      <td className="py-3 px-2 font-bold text-gray-900 dark:text-gray-100" colSpan={reportData.hasBreakdown ? reportData.periodColumns?.length + 2 : 2}>
                        Less Expenses
                      </td>
                    </tr>

                    {/* Expense Categories with Icons */}
                    {Object.entries(reportData.expenses).map(([category, amount]) => {
                      if (category === 'total') return null;
                      
                      // Map category icons similar to PDF
                      const categoryIcons: { [key: string]: string } = {
                        'Car & Truck': '🚛',
                        'Employee Benefits': '💼', 
                        'Office Expenses': '📄',
                        'Other Expenses': '📋',
                        'Utilities': '💡',
                        'Software': '💻',
                        'Travel': '✈️',
                        'Meals': '🍽️',
                        'Marketing': '📢',
                        'Equipment': '🔧',
                        'Professional Services': '👔'
                      };

                      const icon = categoryIcons[category] || '📋';

                      return (
                        <tr key={category}>
                          <td className="py-1 px-2 pl-4 text-gray-700 dark:text-gray-300">
                            <span className="inline-flex items-center">
                              <span className="mr-2">{icon}</span>
                              {category}
                            </span>
                          </td>
                          {reportData.hasBreakdown && reportData.periodColumns?.map((period: any, index: number) => (
                            <td key={index} className="py-1 px-2 text-right text-gray-900 dark:text-gray-100">
                              {formatAmountSync(period.expensesByCategory[category] || 0)}
                            </td>
                          ))}
                          <td className="py-1 px-2 text-right text-gray-900 dark:text-gray-100">
                            {formatAmountSync(amount as number)}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Total Expenses */}
                    <tr className="font-semibold border-t border-gray-300">
                      <td className="py-2 px-2 font-bold text-gray-900 dark:text-gray-100">Total Expenses</td>
                      {reportData.hasBreakdown && reportData.periodColumns?.map((period: any, index: number) => (
                        <td key={index} className="py-2 px-2 text-right font-semibold text-gray-900 dark:text-gray-100">
                          {formatAmountSync(period.expenses)}
                        </td>
                      ))}
                      <td className="py-2 px-2 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {formatAmountSync(reportData.expenses.total)}
                      </td>
                    </tr>

                    {/* Net Profit */}
                    <tr className="border-t-2 border-gray-400 font-bold">
                      <td className="py-3 px-2 font-bold text-gray-900 dark:text-gray-100">Net Profit</td>
                      {reportData.hasBreakdown && reportData.periodColumns?.map((period: any, index: number) => (
                        <td key={index} className={`py-3 px-2 text-right font-bold ${
                          period.netIncome >= 0 
                            ? 'text-green-700 dark:text-green-400' 
                            : 'text-red-700 dark:text-red-400'
                        }`}>
                          {formatAmountSync(period.netIncome)}
                        </td>
                      ))}
                      <td className={`py-3 px-2 text-right font-bold ${
                        reportData.netIncome >= 0 
                          ? 'text-green-700 dark:text-green-400' 
                          : 'text-red-700 dark:text-red-400'
                      }`}>
                        {formatAmountSync(reportData.netIncome)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Currency Note */}
                <div className="mt-4 text-right pr-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">USD</p>
                </div>
              </div>
            </div>
        </>
      )}
      </div>
    </div>
  );
};
