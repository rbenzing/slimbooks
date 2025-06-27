
import React, { useState, useEffect } from 'react';
import { Plus, Search, Receipt, DollarSign, Calendar, FileText } from 'lucide-react';
import { ExpenseForm } from './expenses/ExpenseForm';
import { ExpensesList } from './expenses/ExpensesList';
import { expenseOperations } from '../lib/database';
import { toast } from 'sonner';

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
  updated_at: string;
}

export const ExpenseManagement: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = () => {
    const allExpenses = expenseOperations.getAll();
    setExpenses(allExpenses);
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const pendingCount = filteredExpenses.filter(exp => exp.status === 'pending').length;
  const approvedCount = filteredExpenses.filter(exp => exp.status === 'approved').length;
  const reimbursedCount = filteredExpenses.filter(exp => exp.status === 'reimbursed').length;

  const handleCreateExpense = () => {
    setEditingExpense(null);
    setShowCreateForm(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowCreateForm(true);
  };

  const handleSaveExpense = (expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingExpense) {
        expenseOperations.update(editingExpense.id, expenseData);
        toast.success('Expense updated successfully');
      } else {
        expenseOperations.create(expenseData);
        toast.success('Expense created successfully');
      }
      loadExpenses();
      setShowCreateForm(false);
      setEditingExpense(null);
    } catch (error) {
      toast.error('Failed to save expense');
      console.error('Error saving expense:', error);
    }
  };

  const handleDeleteExpense = (id: number) => {
    try {
      expenseOperations.delete(id);
      toast.success('Expense deleted successfully');
      loadExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
      console.error('Error deleting expense:', error);
    }
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingExpense(null);
  };

  if (showCreateForm) {
    return (
      <ExpenseForm 
        expense={editingExpense}
        onSave={handleSaveExpense}
        onCancel={handleCloseForm}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">Track and manage company expenses</p>
        </div>
        <button 
          onClick={handleCreateExpense}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">${totalExpenses.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            </div>
            <Receipt className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reimbursed</p>
              <p className="text-2xl font-bold text-blue-600">{reimbursedCount}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex space-x-4 flex-1">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Meals & Entertainment">Meals & Entertainment</option>
            <option value="Travel">Travel</option>
            <option value="Software">Software</option>
            <option value="Marketing">Marketing</option>
            <option value="Other">Other</option>
          </select>
          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="reimbursed">Reimbursed</option>
          </select>
        </div>
      </div>

      {/* Expenses List */}
      <ExpensesList 
        expenses={filteredExpenses}
        onEditExpense={handleEditExpense}
        onDeleteExpense={handleDeleteExpense}
      />

      {/* Empty State */}
      {filteredExpenses.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Add your first expense to get started'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
