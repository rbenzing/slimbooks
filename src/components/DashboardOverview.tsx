
import React, { useState, useEffect } from 'react';
import { DollarSign, Users, FileText, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import DashboardChart from './DashboardChart';
import { invoiceOperations, clientOperations, expenseOperations } from '../lib/database';

export const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalClients: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    totalExpenses: 0,
    recentInvoices: [] as any[],
    allInvoices: [] as any[]
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    try {
      const invoices = invoiceOperations.getAll();
      const clients = clientOperations.getAll();
      const expenses = expenseOperations.getAll();

      const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
      const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
      const overdueInvoices = invoices.filter(inv => {
        const dueDate = new Date(inv.due_date);
        return inv.status === 'pending' && dueDate < new Date();
      }).length;
      
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const recentInvoices = invoices.slice(0, 5);

      setStats({
        totalRevenue,
        totalClients: clients.length,
        totalInvoices: invoices.length,
        pendingInvoices,
        paidInvoices,
        overdueInvoices,
        totalExpenses,
        recentInvoices,
        allInvoices: invoices
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome back! Here's an overview of your business.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalClients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoices</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalInvoices}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">${stats.totalExpenses.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Invoice Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Invoices</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingInvoices}</p>
              </div>
              <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid Invoices</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.paidInvoices}</p>
              </div>
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Invoices</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdueInvoices}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Chart and Recent Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Revenue Trend</h3>
            <DashboardChart invoices={stats.allInvoices} />
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Recent Invoices</h3>
            <div className="space-y-3">
              {stats.recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{invoice.client_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">#{invoice.invoice_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-gray-100">${invoice.amount.toFixed(2)}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : invoice.status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
              {stats.recentInvoices.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No invoices yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
