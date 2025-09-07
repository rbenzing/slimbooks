
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Save, Calendar } from 'lucide-react';
import { reportOperations } from '../../lib/database';
import { themeClasses, getButtonClasses } from '@/utils/themeUtils.util';
import { formatDateRangeSync } from '@/utils/dateFormatting';
import { FormattedCurrency } from '@/components/ui/FormattedCurrency';
import { ClientReportData, ClientReportProps, ReportDateRange } from '@/types';

export const ClientReport: React.FC<ClientReportProps> = ({ onBack, onSave }) => {
  const [reportData, setReportData] = useState<ClientReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<ReportDateRange>({
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
      // Use the updated database function that accepts date range
      const data = await reportOperations.generateClientData(dateRange.start, dateRange.end);
      setReportData(data);
    } catch (error) {
      console.error('Error generating client report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDatePresetChange = (preset: ReportDateRange['preset']) => {
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



  const getFormattedDateRange = () => {
    return formatDateRangeSync(dateRange.start, dateRange.end);
  };

  const handleSave = () => {
    if (reportData) {
      onSave(reportData, 'client', dateRange);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center">
          <button onClick={onBack} className="flex items-center text-muted-foreground hover:text-foreground mr-4">
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Reports
          </button>
          <h1 className="text-2xl font-bold text-foreground">Generating Client Report...</h1>
        </div>
        <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Please wait while we generate your report...</p>
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
              <h1 className={themeClasses.pageTitle}>Client Report</h1>
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
      <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Report Date Range
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Quick Select
            </label>
            <select
              className={`w-full ${themeClasses.select}`}
              value={dateRange.preset}
              onChange={(e) => handleDatePresetChange(e.target.value as ReportDateRange['preset'])}
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
            <label className="block text-sm font-medium text-foreground mb-2">
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
            <label className="block text-sm font-medium text-foreground mb-2">
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
              <h3 className={`${themeClasses.statLabel} mb-2`}>Active Clients</h3>
              <p className={`${themeClasses.statValue} text-blue-600 dark:text-blue-400`}>{reportData.totalClients}</p>
            </div>
            <div className={themeClasses.statCard}>
              <h3 className={`${themeClasses.statLabel} mb-2`}>Total Revenue</h3>
              <p className={themeClasses.statValue}>
                <FormattedCurrency amount={reportData.totalRevenue} />
              </p>
            </div>
            <div className={themeClasses.statCard}>
              <h3 className={`${themeClasses.statLabel} mb-2`}>Paid Revenue</h3>
              <p className={`${themeClasses.statValue} text-green-600 dark:text-green-400`}>
                <FormattedCurrency amount={reportData.totalPaidRevenue} />
              </p>
            </div>
            <div className={themeClasses.statCard}>
              <h3 className={`${themeClasses.statLabel} mb-2`}>Pending Revenue</h3>
              <p className={`${themeClasses.statValue} text-yellow-600 dark:text-yellow-400`}>
                <FormattedCurrency amount={reportData.totalPendingRevenue} />
              </p>
            </div>
            <div className={themeClasses.statCard}>
              <h3 className={`${themeClasses.statLabel} mb-2`}>Overdue Revenue</h3>
              <p className={`${themeClasses.statValue} text-red-600 dark:text-red-400`}>
                <FormattedCurrency amount={reportData.totalOverdueRevenue || 0} />
              </p>
            </div>
          </div>

          {/* Client Details */}
          <div className={themeClasses.card}>
            <div className={themeClasses.cardHeader}>
              <h3 className={themeClasses.cardTitle}>Client Performance</h3>
              <p className={`text-sm ${themeClasses.mutedText}`}>
                Sorted by total revenue (highest first) • Only showing clients with invoices in selected date range
              </p>
            </div>
            <div className={themeClasses.cardContent}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={themeClasses.tableHeader}>
                    <tr>
                      <th className={themeClasses.tableHeaderCell}>Client</th>
                      <th className={themeClasses.tableHeaderCell}>Company</th>
                      <th className={themeClasses.tableHeaderCell}>Invoices</th>
                      <th className={themeClasses.tableHeaderCell}>Total Revenue</th>
                      <th className={themeClasses.tableHeaderCell}>Paid</th>
                      <th className={themeClasses.tableHeaderCell}>Pending</th>
                      <th className={themeClasses.tableHeaderCell}>Overdue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reportData.clients.map((client) => (
                      <tr key={client.id} className={themeClasses.tableRow}>
                        <td className={`${themeClasses.tableCell} font-medium`}>
                          {client.name}
                        </td>
                        <td className={themeClasses.tableCell}>{client.company}</td>
                        <td className={themeClasses.tableCell}>{client.totalInvoices}</td>
                        <td className={`${themeClasses.tableCell} font-medium`}>
                          <FormattedCurrency amount={client.totalRevenue} />
                        </td>
                        <td className={`${themeClasses.tableCell} text-green-600 dark:text-green-400 font-medium`}>
                          <FormattedCurrency amount={client.paidRevenue} />
                        </td>
                        <td className={`${themeClasses.tableCell} text-yellow-600 dark:text-yellow-400 font-medium`}>
                          <FormattedCurrency amount={client.pendingRevenue} />
                        </td>
                        <td className={`${themeClasses.tableCell} text-red-600 dark:text-red-400 font-medium`}>
                          <FormattedCurrency amount={client.overdueRevenue || 0} />
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
