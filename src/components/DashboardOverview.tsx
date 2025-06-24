
import React from 'react';
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp,
  Calendar,
  AlertCircle
} from 'lucide-react';

const stats = [
  { name: 'Total Clients', value: '24', change: '+2 this month', icon: Users, color: 'bg-blue-500' },
  { name: 'Active Invoices', value: '12', change: '3 overdue', icon: FileText, color: 'bg-green-500' },
  { name: 'Monthly Revenue', value: '$24,580', change: '+12% from last month', icon: DollarSign, color: 'bg-purple-500' },
  { name: 'Growth Rate', value: '18%', change: 'Year over year', icon: TrendingUp, color: 'bg-orange-500' },
];

const recentActivity = [
  { type: 'invoice', client: 'Acme Corp', action: 'Invoice #1001 paid', time: '2 hours ago', status: 'success' },
  { type: 'client', client: 'TechStart Inc', action: 'New client added', time: '4 hours ago', status: 'info' },
  { type: 'overdue', client: 'Design Studio', action: 'Invoice #998 overdue', time: '1 day ago', status: 'warning' },
  { type: 'invoice', client: 'Global Solutions', action: 'Invoice #1002 sent', time: '2 days ago', status: 'info' },
];

export const DashboardOverview = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
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

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
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
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="font-medium">Add New Client</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-green-600 mr-3" />
                  <span className="font-medium">Create Invoice</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="font-medium">Schedule Recurring</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button className="w-full flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
                  <span className="font-medium text-orange-800">Review Overdue (3)</span>
                </div>
                <span className="text-orange-400">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
