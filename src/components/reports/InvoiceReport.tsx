
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Save, Calendar } from 'lucide-react';
import { DateRange, ReportType } from '../ReportsManagement';
import { invoiceOperations } from '../../lib/database';

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
  }, [dateRange]);

  const generateReportData = () => {
    setLoading(true);
    try {
      const allInvoices = invoiceOperations.getAll();
      const invoices = allInvoices.filter(invoice => {
        const invoiceDate = new Date(invoice.created_at);
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        return invoiceDate >= start && invoiceDate <= end;
      });

      const invoicesByStatus = invoices.reduce((acc, invoice) => {
        acc[invoice.status] = (acc[invoice.status] || 0) + invoice.amount;
        return acc;
      }, {} as Record<string, number>);

      const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
      const paidAmount = invoices
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.amount, 0);
      const pendingAmount = invoices
        .filter(invoice => invoice.status === 'sent')
        .reduce((sum, invoice) => sum + invoice.amount, 0);

      setReportData({
        invoices,
        invoicesByStatus,
        totalAmount,
        paidAmount,
        pendingAmount,
        totalCount: invoices.length
      });
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
      onSave(reportData, 'invoice', dateRange);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Generating Invoice Report...</h1>
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
            <h1 className="text-2xl font-bold text-gray-900">Invoice Report</h1>
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
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Invoices</h3>
              <p className="text-3xl font-bold text-blue-600">{reportData.totalCount}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Amount</h3>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(reportData.totalAmount)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Paid Amount</h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(reportData.paidAmount)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Amount</h3>
              <p className="text-3xl font-bold text-yellow-600">{formatCurrency(reportData.pendingAmount)}</p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Invoices by Status</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(reportData.invoicesByStatus).map(([status, amount]) => (
                  <div key={status} className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium capitalize">{status}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(amount as number)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Detailed Invoice List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.invoices.map((invoice: any) => (
                    <tr key={invoice.id}>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">{invoice.client_name}</td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
