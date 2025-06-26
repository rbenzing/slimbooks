
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp
} from 'lucide-react';
import { clientOperations, invoiceOperations } from '@/lib/database';
import { DashboardChart } from './DashboardChart';

export const DashboardOverview = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeInvoices: 0,
    overdueCount: 0,
    monthlyRevenue: 0,
    paidInvoices: 0
  });

  useEffect(() => {
    const allClients = clientOperations.getAll();
    const allInvoices = invoiceOperations.getAll();
    
    setClients(allClients);
    setInvoices(allInvoices);

    // Calculate stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const activeInvoices = allInvoices.filter(inv => inv.status !== 'paid');
    const overdueInvoices = allInvoices.filter(inv => {
      const dueDate = new Date(inv.due_date);
      return inv.status !== 'paid' && dueDate < now;
    });

    const paidThisMonth = allInvoices.filter(inv => {
      const createdDate = new Date(inv.created_at);
      return inv.status === 'paid' && 
             createdDate.getMonth() === currentMonth && 
             createdDate.getFullYear() === currentYear;
    });

    const monthlyRevenue = paidThisMonth.reduce((sum, inv) => sum + inv.amount, 0);

    setStats({
      totalClients: allClients.length,
      activeInvoices: activeInvoices.length,
      overdueCount: overdueInvoices.length,
      monthlyRevenue,
      paidInvoices: paidThisMonth.length
    });
  }, []);

  const statsData = [
    { 
      name: 'Total Clients', 
      value: stats.totalClients.toString(), 
      change: '+2 this month', 
      icon: Users, 
      color: 'bg-blue-500' 
    },
    { 
      name: 'Active Invoices', 
      value: stats.activeInvoices.toString(), 
      change: `${stats.overdueCount} overdue`, 
      icon: FileText, 
      color: 'bg-green-500' 
    },
    { 
      name: 'Monthly Revenue', 
      value: `$${stats.monthlyRevenue.toLocaleString()}`, 
      change: `${stats.paidInvoices} invoices paid`, 
      icon: DollarSign, 
      color: 'bg-purple-500' 
    },
    { 
      name: 'Growth Rate', 
      value: '18%', 
      change: 'Year over year', 
      icon: TrendingUp, 
      color: 'bg-orange-500' 
    },
  ];

  // Recent activity from invoices
  const recentActivity = invoices.slice(0, 4).map(invoice => ({
    type: invoice.status === 'paid' ? 'invoice' : invoice.status === 'overdue' ? 'overdue' : 'invoice',
    client: invoice.client_name,
    action: invoice.status === 'paid' 
      ? `Invoice ${invoice.invoice_number} paid`
      : invoice.status === 'overdue'
      ? `Invoice ${invoice.invoice_number} overdue`
      : `Invoice ${invoice.invoice_number} sent`,
    time: new Date(invoice.created_at).toLocaleDateString(),
    status: invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'warning' : 'info'
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{stat.value}</dd>
                      <dd className="text-sm text-gray-600">{stat.change}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <DashboardChart invoices={invoices} />

        {/* Recent Activity */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-400' :
                    activity.status === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.client}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
