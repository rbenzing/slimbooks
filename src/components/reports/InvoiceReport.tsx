
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Save, Calendar } from 'lucide-react';
import { getStatusColor, themeClasses, getButtonClasses } from '@/lib/utils';
import { DateRange, ReportType } from '../ReportsManagement';
import { reportOperations } from '../../lib/database';
import { formatDateSync, formatDateRangeSync } from '@/utils/dateFormatting';

interface InvoiceReportProps {
  onBack: () => void;
  onSave: (reportData: any, reportType: ReportType, dateRange: DateRange) => void;
}

export const InvoiceReport: React.FC<InvoiceReportProps> = ({ onBack, onSave }) => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    preset: 'this-month'
  });

  useEffect(() => {
    generateReportData();
  }, [dateRange.start, dateRange.end]);

  const generateReportData = async () => {
    setLoading(true);
    try {
      const data = await reportOperations.generateInvoiceData(dateRange.start, dateRange.end);
      setReportData(data);
    } catch (error) {
      console.error('Error generating invoice report data:', error);
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
      onSave(reportData, 'invoice', dateRange);
    }
  };

  if (loading) {
    return (
      <div className={themeClasses.page}>
        <div className={themeClasses.pageContainer}>
          <div className="flex items-center">
            <button onClick={onBack} className={`flex items-center ${themeClasses.mutedText} hover:text-foreground mr-4`}>
              <ArrowLeft className={`${themeClasses.iconSmall} mr-1`} />
              Back to Reports
            </button>
            <h1 className={themeClasses.pageTitle}>Generating Invoice Report...</h1>
          </div>
          <div className={`${themeClasses.card} p-12 text-center`}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className={`mt-4 ${themeClasses.mutedText}`}>Please wait while we generate your report...</p>
          </div>
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
              <h1 className={themeClasses.pageTitle}>Invoice Report</h1>
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
            Report Date Range
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </div>

        {reportData && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className={themeClasses.statCard}>
                <h3 className={`${themeClasses.statLabel} mb-2`}>Total Invoices</h3>
                <p className={`${themeClasses.statValue} text-blue-600 dark:text-blue-400`}>{reportData.totalCount}</p>
              </div>
              <div className={themeClasses.statCard}>
                <h3 className={`${themeClasses.statLabel} mb-2`}>Total Amount</h3>
                <p className={themeClasses.statValue}>{formatCurrency(reportData.totalAmount)}</p>
              </div>
              <div className={themeClasses.statCard}>
                <h3 className={`${themeClasses.statLabel} mb-2`}>Paid Amount</h3>
                <p className={`${themeClasses.statValue} text-green-600 dark:text-green-400`}>{formatCurrency(reportData.paidAmount)}</p>
              </div>
              <div className={themeClasses.statCard}>
                <h3 className={`${themeClasses.statLabel} mb-2`}>Pending Amount</h3>
                <p className={`${themeClasses.statValue} text-yellow-600 dark:text-yellow-400`}>{formatCurrency(reportData.pendingAmount)}</p>
              </div>
              <div className={themeClasses.statCard}>
                <h3 className={`${themeClasses.statLabel} mb-2`}>Overdue Amount</h3>
                <p className={`${themeClasses.statValue} text-red-600 dark:text-red-400`}>{formatCurrency(reportData.overdueAmount || 0)}</p>
              </div>
            </div>

            {/* Status Breakdown and Client Breakdown - Two Column Layout */}
            <div className={themeClasses.contentGrid}>
              {/* Status Breakdown */}
              <div className={themeClasses.card}>
                <div className={themeClasses.cardHeader}>
                  <h3 className={themeClasses.cardTitle}>Invoices by Status</h3>
                </div>
                <div className={themeClasses.cardContent}>
                  <div className="space-y-4">
                    {Object.entries(reportData.invoicesByStatus).map(([status, amount]) => {
                      const percentage = reportData.totalAmount > 0 ? ((amount as number) / reportData.totalAmount * 100) : 0;
                      return (
                        <div key={status} className="flex justify-between items-center py-2">
                          <span className={`${themeClasses.bodyText} font-medium capitalize flex-1`}>{status}</span>
                          <div className="flex items-center space-x-4 min-w-0">
                            <span className={`font-semibold ${themeClasses.bodyText}`}>{formatCurrency(amount as number)}</span>
                            <span className={`${themeClasses.mutedText} text-sm min-w-[3rem] text-right`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Client Breakdown */}
              <div className={themeClasses.card}>
                <div className={themeClasses.cardHeader}>
                  <h3 className={themeClasses.cardTitle}>Top Clients by Revenue</h3>
                </div>
                <div className={themeClasses.cardContent}>
                  <div className="space-y-4">
                    {Object.entries(reportData.invoicesByClient || {}).slice(0, 5).map(([client, amount]) => {
                      const percentage = reportData.totalAmount > 0 ? ((amount as number) / reportData.totalAmount * 100) : 0;
                      return (
                        <div key={client} className="flex justify-between items-center py-2">
                          <span className={`${themeClasses.bodyText} font-medium flex-1`}>{client}</span>
                          <div className="flex items-center space-x-4 min-w-0">
                            <span className={`font-semibold ${themeClasses.bodyText}`}>{formatCurrency(amount as number)}</span>
                            <span className={`${themeClasses.mutedText} text-sm min-w-[3rem] text-right`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Invoice List */}
            <div className={themeClasses.card}>
              <div className={themeClasses.cardHeader}>
                <h3 className={themeClasses.cardTitle}>Detailed Invoice List</h3>
              </div>
              <div className={themeClasses.cardContent}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={themeClasses.tableHeader}>
                      <tr>
                        <th className={themeClasses.tableHeaderCell}>Invoice #</th>
                        <th className={themeClasses.tableHeaderCell}>Client</th>
                        <th className={themeClasses.tableHeaderCell}>Amount</th>
                        <th className={themeClasses.tableHeaderCell}>Status</th>
                        <th className={themeClasses.tableHeaderCell}>Due Date</th>
                        <th className={themeClasses.tableHeaderCell}>Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reportData.invoices.map((invoice: any) => (
                        <tr key={invoice.id} className={themeClasses.tableRow}>
                          <td className={`${themeClasses.tableCell} font-medium`}>
                            {invoice.invoice_number}
                          </td>
                          <td className={themeClasses.tableCell}>{invoice.client_name}</td>
                          <td className={`${themeClasses.tableCell} font-medium`}>
                            {formatCurrency(invoice.amount)}
                          </td>
                          <td className={themeClasses.tableCell}>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className={themeClasses.tableCell}>
                          {formatDateSync(invoice.due_date)}
                        </td>
                        <td className={themeClasses.tableCell}>
                          {formatDateSync(invoice.created_at)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </>
      )}
      </div>
    </div>
  );
};
