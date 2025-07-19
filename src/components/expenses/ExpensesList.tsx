
import React from 'react';
import { Edit, Receipt, Eye, Trash2 } from 'lucide-react';
import { getStatusColor } from '@/lib/utils';
import { formatDate } from '@/utils/dateFormatting';

interface Expense {
  id: number;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  description: string;
  receipt_url?: string;
  status: 'pending' | 'approved' | 'reimbursed';
  created_at: string;
}

interface ExpensesListProps {
  expenses: Expense[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: number) => void;
  onViewExpense: (expense: Expense) => void;
}

export const ExpensesList: React.FC<ExpensesListProps> = ({ expenses, onEditExpense, onDeleteExpense, onViewExpense }) => {

  // Using imported formatDate function

  const handleDelete = (id: number, merchant: string) => {
    if (window.confirm(`Are you sure you want to delete the expense from ${merchant}?`)) {
      onDeleteExpense(id);
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Merchant
              </th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Category
              </th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Amount
              </th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Receipt
              </th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-muted/50">
                <td className="py-4 px-6 text-sm text-foreground">
                  {formatDate(expense.date)}
                </td>
                <td className="py-4 px-6">
                  <div>
                    <div className="text-sm font-medium text-foreground">{expense.merchant}</div>
                    {expense.description && (
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {expense.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-foreground">
                  {expense.category}
                </td>
                <td className="py-4 px-6 text-sm font-medium text-foreground">
                  ${expense.amount.toFixed(2)}
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                    {expense.status ? expense.status.charAt(0).toUpperCase() + expense.status.slice(1) : 'Draft'}
                  </span>
                </td>
                <td className="py-4 px-6">
                  {expense.receipt_url ? (
                    <button className="text-blue-600 hover:text-blue-800">
                      <Receipt className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="text-muted-foreground text-sm">None</span>
                  )}
                </td>
                <td className="py-4 px-6">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEditExpense(expense)}
                      className="p-1 text-muted-foreground hover:text-blue-600"
                      title="Edit expense"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onViewExpense(expense)}
                      className="p-1 text-muted-foreground hover:text-white"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id, expense.merchant)}
                      className="p-1 text-muted-foreground hover:text-red-600"
                      title="Delete expense"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
