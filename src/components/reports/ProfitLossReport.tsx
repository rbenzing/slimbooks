
import React from 'react';
import { ArrowLeft, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { DateRange } from '../ReportsManagement';

interface ProfitLossReportProps {
  dateRange: DateRange;
  onBack: () => void;
}

export const ProfitLossReport: React.FC<ProfitLossReportProps> = ({ dateRange, onBack }) => {
  // Mock data - replace with actual calculations
  const reportData = {
    revenue: {
      invoices: 125000,
      otherIncome: 5000,
      total: 130000
    },
    expenses: {
      officeSupplies: 2500,
      meals: 1200,
      travel: 3500,
      software: 8000,
      marketing: 4500,
      utilities: 1800,
      professional: 12000,
      other: 1500,
      total: 35000
    },
    netIncome: 95000
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
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </button>
      </div>

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
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Office Supplies</span>
                  <span className="font-medium text-gray-900">{formatCurrency(reportData.expenses.officeSupplies)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Meals & Entertainment</span>
                  <span className="font-medium text-gray-900">{formatCurrency(reportData.expenses.meals)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Travel</span>
                  <span className="font-medium text-gray-900">{formatCurrency(reportData.expenses.travel)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Software</span>
                  <span className="font-medium text-gray-900">{formatCurrency(reportData.expenses.software)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Marketing</span>
                  <span className="font-medium text-gray-900">{formatCurrency(reportData.expenses.marketing)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Utilities</span>
                  <span className="font-medium text-gray-900">{formatCurrency(reportData.expenses.utilities)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Professional Services</span>
                  <span className="font-medium text-gray-900">{formatCurrency(reportData.expenses.professional)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Other</span>
                  <span className="font-medium text-gray-900">{formatCurrency(reportData.expenses.other)}</span>
                </div>
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
    </div>
  );
};
