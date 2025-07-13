
import React, { useState, useEffect } from 'react';
import { DollarSign, Users, FileText, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import DashboardChart from './DashboardChart';
import { invoiceOperations, clientOperations, expenseOperations } from '../lib/database';
import { themeClasses, getIconColorClasses, getStatusColor } from '../lib/utils';

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
    <div className={themeClasses.page}>
      <div className={themeClasses.pageContainer}>
        {/* Header */}
        <div className={themeClasses.pageHeader}>
          <h1 className={themeClasses.pageTitle}>Dashboard</h1>
          <p className={themeClasses.pageSubtitle}>Welcome back! Here's an overview of your business.</p>
        </div>

        {/* Stats Grid */}
        <div className={themeClasses.statsGrid}>
          <div className={themeClasses.statCard}>
            <div className={themeClasses.statCardContent}>
              <div>
                <p className={themeClasses.statLabel}>Total Revenue</p>
                <p className={themeClasses.statValue}>${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className={`${themeClasses.iconLarge} ${getIconColorClasses('green')}`} />
            </div>
          </div>

          <div className={themeClasses.statCard}>
            <div className={themeClasses.statCardContent}>
              <div>
                <p className={themeClasses.statLabel}>Total Clients</p>
                <p className={themeClasses.statValue}>{stats.totalClients}</p>
              </div>
              <Users className={`${themeClasses.iconLarge} ${getIconColorClasses('blue')}`} />
            </div>
          </div>

          <div className={themeClasses.statCard}>
            <div className={themeClasses.statCardContent}>
              <div>
                <p className={themeClasses.statLabel}>Total Invoices</p>
                <p className={themeClasses.statValue}>{stats.totalInvoices}</p>
              </div>
              <FileText className={`${themeClasses.iconLarge} ${getIconColorClasses('purple')}`} />
            </div>
          </div>

          <div className={themeClasses.statCard}>
            <div className={themeClasses.statCardContent}>
              <div>
                <p className={themeClasses.statLabel}>Total Expenses</p>
                <p className={themeClasses.statValue}>${stats.totalExpenses.toFixed(2)}</p>
              </div>
              <TrendingUp className={`${themeClasses.iconLarge} ${getIconColorClasses('red')}`} />
            </div>
          </div>
        </div>

        {/* Invoice Status Cards */}
        <div className={themeClasses.statsGridThree}>
          <div className={themeClasses.statCard}>
            <div className={themeClasses.statCardContent}>
              <div>
                <p className={themeClasses.statLabel}>Pending Invoices</p>
                <p className={themeClasses.statValueMedium} style={{color: 'hsl(var(--dashboard-stat-yellow-foreground))'}}>{stats.pendingInvoices}</p>
              </div>
              <Calendar className={`${themeClasses.iconMedium} ${getIconColorClasses('yellow')}`} />
            </div>
          </div>

          <div className={themeClasses.statCard}>
            <div className={themeClasses.statCardContent}>
              <div>
                <p className={themeClasses.statLabel}>Paid Invoices</p>
                <p className={themeClasses.statValueMedium} style={{color: 'hsl(var(--dashboard-stat-green-foreground))'}}>{stats.paidInvoices}</p>
              </div>
              <FileText className={`${themeClasses.iconMedium} ${getIconColorClasses('green')}`} />
            </div>
          </div>

          <div className={themeClasses.statCard}>
            <div className={themeClasses.statCardContent}>
              <div>
                <p className={themeClasses.statLabel}>Overdue Invoices</p>
                <p className={themeClasses.statValueMedium} style={{color: 'hsl(var(--dashboard-stat-red-foreground))'}}>{stats.overdueInvoices}</p>
              </div>
              <AlertCircle className={`${themeClasses.iconMedium} ${getIconColorClasses('red')}`} />
            </div>
          </div>
        </div>

        {/* Chart and Recent Invoices */}
        <div className={themeClasses.contentGrid}>
          <div className={themeClasses.card}>
            <DashboardChart invoices={stats.allInvoices} title="Revenue Trend" />
          </div>

          <div className={themeClasses.card}>
            <h3 className={themeClasses.cardTitle}>Recent Invoices</h3>
            <div className="space-y-3 mt-4">
              {stats.recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className={`font-medium ${themeClasses.bodyText}`}>{invoice.client_name}</p>
                    <p className={themeClasses.smallText}>#{invoice.invoice_number}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${themeClasses.bodyText}`}>${invoice.amount.toFixed(2)}</p>
                    <span className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
              {stats.recentInvoices.length === 0 && (
                <p className={`${themeClasses.mutedText} text-center py-4`}>No invoices yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
