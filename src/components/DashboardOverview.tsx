
import React, { useState, useEffect } from 'react';
import { DollarSign, Users, FileText, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import DashboardChart from './DashboardChart';
import { invoiceOperations, clientOperations, expenseOperations } from '../lib/database';
import { themeClasses, getIconColorClasses, getStatusColor } from '../lib/utils';
import { FormattedCurrency } from '@/components/ui/FormattedCurrency';

export const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalClients: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    sentInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    draftInvoices: 0,
    totalExpenses: 0,
    creditsRefunds: 0,
    recentInvoices: [] as any[],
    allInvoices: [] as any[]
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const invoices = await invoiceOperations.getAll();
      const clients = await clientOperations.getAll();
      const expenses = await expenseOperations.getAll();

      // Calculate total revenue (excluding negative amounts which might be credits/refunds)
      const totalRevenue = invoices.reduce((sum, invoice) => {
        const amount = parseFloat(invoice.amount) || 0;
        return amount > 0 ? sum + amount : sum;
      }, 0);

      // Map actual database statuses to dashboard categories
      // 'pending' = pending (if we had this status)
      // 'sent' = sent (invoices sent to clients, awaiting payment)
      // 'overdue' = overdue (explicitly marked as overdue)
      // 'paid' = paid (payment received)
      // 'draft' = draft (not yet sent)
      const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length; // if we had pending status
      const sentInvoices = invoices.filter(inv => inv.status === 'sent').length;
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
      const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;
      const draftInvoices = invoices.filter(inv => inv.status === 'draft').length;

      // Calculate credits/refunds (negative amounts)
      const creditsRefunds = Math.abs(invoices.reduce((sum, invoice) => {
        const amount = parseFloat(invoice.amount) || 0;
        return amount < 0 ? sum + amount : sum;
      }, 0));

      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const recentInvoices = invoices.slice(0, 5);

      setStats({
        totalRevenue,
        totalClients: clients.length,
        totalInvoices: invoices.length,
        pendingInvoices,
        sentInvoices,
        paidInvoices,
        overdueInvoices,
        draftInvoices,
        totalExpenses,
        creditsRefunds,
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
                <p className={themeClasses.statValue}>
                  <FormattedCurrency amount={stats.totalRevenue} />
                </p>
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
                <p className={themeClasses.statValue}>
                  <FormattedCurrency amount={stats.totalExpenses} />
                </p>
              </div>
              <TrendingUp className={`${themeClasses.iconLarge} ${getIconColorClasses('red')}`} />
            </div>
          </div>
        </div>

        {/* Invoice Status Cards - 5 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
                <p className={themeClasses.statLabel}>Sent Invoices</p>
                <p className={themeClasses.statValueMedium} style={{color: 'hsl(var(--dashboard-stat-blue-foreground))'}}>{stats.sentInvoices}</p>
              </div>
              <Calendar className={`${themeClasses.iconMedium} ${getIconColorClasses('blue')}`} />
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

          <div className={themeClasses.statCard}>
            <div className={themeClasses.statCardContent}>
              <div>
                <p className={themeClasses.statLabel}>Draft Invoices</p>
                <p className={themeClasses.statValueMedium} style={{color: 'hsl(var(--dashboard-stat-blue-foreground))'}}>{stats.draftInvoices}</p>
              </div>
              <FileText className={`${themeClasses.iconMedium} ${getIconColorClasses('blue')}`} />
            </div>
          </div>

          {stats.creditsRefunds > 0 && (
            <div className={themeClasses.statCard}>
              <div className={themeClasses.statCardContent}>
                <div>
                  <p className={themeClasses.statLabel}>Credits/Refunds</p>
                  <p className={themeClasses.statValueMedium} style={{color: 'hsl(var(--dashboard-stat-purple-foreground))'}}>
                    <FormattedCurrency amount={stats.creditsRefunds} />
                  </p>
                </div>
                <TrendingUp className={`${themeClasses.iconMedium} ${getIconColorClasses('purple')}`} />
              </div>
            </div>
          )}
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
                    <p className={`font-medium ${themeClasses.bodyText}`}>
                      <FormattedCurrency amount={invoice.amount} />
                    </p>
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
