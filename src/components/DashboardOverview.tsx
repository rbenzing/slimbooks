
import React, { useState, useEffect } from 'react';
import { DollarSign, Users, FileText, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import DashboardChart from './DashboardChart';
import { invoiceOperations, clientOperations, expenseOperations } from '../lib/database';
import { themeClasses, getIconColorClasses, getStatusColor } from '../lib/utils';
import { FormattedCurrency } from '@/components/ui/FormattedCurrency';

type TimePeriod = 'last-week' | 'last-month' | 'last-year' | 'year-to-date' | 'month-to-date';

export const DashboardOverview = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('year-to-date');
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
    allInvoices: [] as any[],
    allExpenses: [] as any[],
    filteredInvoices: [] as any[],
    filteredExpenses: [] as any[]
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (stats.allInvoices.length > 0 || stats.allExpenses.length > 0) {
      filterDataByPeriod();
    }
  }, [selectedPeriod, stats.allInvoices, stats.allExpenses]);

  const loadDashboardData = async () => {
    try {
      const invoices = await invoiceOperations.getAll();
      const clients = await clientOperations.getAll();
      const expenses = await expenseOperations.getAll();

      setStats(prevStats => ({
        ...prevStats,
        totalClients: clients.length,
        allInvoices: invoices,
        allExpenses: expenses,
        filteredInvoices: invoices,
        filteredExpenses: expenses
      }));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const filterDataByPeriod = () => {
    const currentDate = new Date();
    let startDate: Date;
    let endDate: Date = currentDate;

    switch (selectedPeriod) {
      case 'last-week':
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - 7);
        break;
      case 'last-month':
        // Set to first day of last month
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        // Set end date to last day of last month
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0, 23, 59, 59);
        break;
      case 'last-year':
        // Set to January 1st of last year
        startDate = new Date(currentDate.getFullYear() - 1, 0, 1);
        // Set end date to December 31st of last year
        endDate = new Date(currentDate.getFullYear() - 1, 11, 31, 23, 59, 59);
        break;
      case 'year-to-date':
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        break;
      case 'month-to-date':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        break;
      default:
        startDate = new Date(currentDate.getFullYear(), 0, 1);
    }

    // Filter invoices by date range
    const filteredInvoices = stats.allInvoices.filter(invoice => {
      const invoiceDate = new Date(invoice.created_at);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });

    // Filter expenses by date range
    const filteredExpenses = stats.allExpenses.filter(expense => {
      const expenseDate = new Date(expense.created_at);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    // Calculate filtered statistics
    const totalRevenue = filteredInvoices.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.amount) || 0;
      return amount > 0 ? sum + amount : sum;
    }, 0);

    const pendingInvoices = filteredInvoices.filter(invoice => invoice.status === 'pending').length;
    const sentInvoices = filteredInvoices.filter(invoice => invoice.status === 'sent').length;
    const paidInvoices = filteredInvoices.filter(invoice => invoice.status === 'paid').length;
    const overdueInvoices = filteredInvoices.filter(invoice => invoice.status === 'overdue').length;
    const draftInvoices = filteredInvoices.filter(invoice => invoice.status === 'draft').length;

    const creditsRefunds = Math.abs(filteredInvoices.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.amount) || 0;
      return amount < 0 ? sum + amount : sum;
    }, 0));

    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const recentInvoices = filteredInvoices.slice(0, 5);

    setStats(prevStats => ({
      ...prevStats,
      totalRevenue,
      totalInvoices: filteredInvoices.length,
      pendingInvoices,
      sentInvoices,
      paidInvoices,
      overdueInvoices,
      draftInvoices,
      totalExpenses,
      creditsRefunds,
      recentInvoices,
      filteredInvoices,
      filteredExpenses
    }));
  };

  const timePeriodOptions = [
    { value: 'last-week', label: 'Last Week' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'last-year', label: 'Last Year' },
    { value: 'year-to-date', label: 'Year to Date' },
    { value: 'month-to-date', label: 'Month to Date' }
  ];

  return (
    <div className={themeClasses.page}>
      <div className={themeClasses.pageContainer}>
        {/* Header */}
        <div className={`${themeClasses.pageHeader} flex justify-between items-start`}>
          <div>
            <h1 className={themeClasses.pageTitle}>Dashboard</h1>
            <p className={themeClasses.pageSubtitle}>Welcome back! Here's an overview of your business.</p>
          </div>
          <div className="w-48">
            <select
              className={themeClasses.select}
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
            >
              {timePeriodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
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
            <DashboardChart invoices={stats.filteredInvoices} title="Revenue Trend" selectedPeriod={selectedPeriod} />
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
