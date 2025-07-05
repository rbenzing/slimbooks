
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardChartProps {
  invoices: any[];
}

const DashboardChart: React.FC<DashboardChartProps> = ({ invoices }) => {
  // Generate chart data from invoices
  const generateChartData = () => {
    const monthlyData: { [key: string]: number } = {};
    
    invoices.forEach(invoice => {
      const date = new Date(invoice.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + invoice.amount;
    });

    // Get last 6 months
    const last6Months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      last6Months.push({
        month: monthName,
        revenue: monthlyData[monthKey] || 0
      });
    }

    return last6Months;
  };

  const data = generateChartData();

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Revenue Overview</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" className="dark:stroke-gray-600" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280" 
            className="dark:stroke-gray-400"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            stroke="#6b7280" 
            className="dark:stroke-gray-400"
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--color-background)', 
              border: '1px solid var(--color-border)',
              borderRadius: '0.5rem',
              color: 'var(--color-foreground)'
            }}
            labelStyle={{ color: 'var(--color-foreground)' }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardChart;
