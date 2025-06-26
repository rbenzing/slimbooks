
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign } from 'lucide-react';

interface DashboardChartProps {
  invoices: any[];
}

export const DashboardChart: React.FC<DashboardChartProps> = ({ invoices }) => {
  // Generate chart data from invoices
  const generateChartData = () => {
    const now = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      const monthlyInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.created_at);
        return invoiceDate.getMonth() === date.getMonth() && 
               invoiceDate.getFullYear() === date.getFullYear() &&
               invoice.status === 'paid';
      });
      
      const revenue = monthlyInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      
      months.push({
        name: `${monthName} ${year}`,
        revenue: revenue,
        invoices: monthlyInvoices.length
      });
    }
    
    return months;
  };

  const chartData = generateChartData();
  const hasData = chartData.some(month => month.revenue > 0);

  if (!hasData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Revenue Overview</h3>
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <DollarSign className="h-12 w-12 mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">No revenue data yet</p>
          <p className="text-sm text-center">Start creating and receiving payments for invoices to see your revenue trends here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Revenue Overview</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                name === 'revenue' ? `$${value.toLocaleString()}` : value,
                name === 'revenue' ? 'Revenue' : 'Invoices'
              ]}
            />
            <Bar dataKey="revenue" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
