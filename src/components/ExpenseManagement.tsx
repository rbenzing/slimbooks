
import React, { useState, useEffect } from 'react';
import { Plus, Search, Receipt, DollarSign, Calendar, FileText, Upload, LayoutGrid, Table, Eye, Edit, Trash2 } from 'lucide-react';
import { ExpenseForm } from './expenses/ExpenseForm';
import { ExpensesList } from './expenses/ExpensesList';
import { ExpenseImportExport } from './expenses/ExpenseImportExport';
import { ExpenseViewModal } from './expenses/ExpenseViewModal';
import { expenseOperations } from '../lib/database';
import { toast } from 'sonner';
import { themeClasses, getIconColorClasses, getButtonClasses, getStatusColor } from '../lib/utils';
import { formatDateSync } from '@/components/ui/FormattedDate';
import { FormattedCurrency } from '@/components/ui/FormattedCurrency';

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
  const [showImportExport, setShowImportExport] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'panel' | 'table'>('table');

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const allExpenses = await expenseOperations.getAll();
      // Ensure all expenses have required fields
      const validExpenses = allExpenses.filter(expense =>
        expense &&
        typeof expense.merchant === 'string' &&
        typeof expense.description === 'string'
      );
      setExpenses(validExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Failed to load expenses');
      setExpenses([]); // Set empty array as fallback
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    if (!expense) return false;

    const merchant = expense.merchant || '';
    const description = expense.description || '';
    const category = expense.category || '';
    const status = expense.status || '';

    const matchesSearch = merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

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

  const handleViewExpense = (expense: Expense) => {
    setViewingExpense(expense);
    setIsViewModalOpen(true);
  };

  const handleSaveExpense = async (expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingExpense) {
        await expenseOperations.update(editingExpense.id, expenseData);
        toast.success('Expense updated successfully');
      } else {
        await expenseOperations.create(expenseData);
        toast.success('Expense created successfully');
      }
      await loadExpenses();
      setShowCreateForm(false);
      setEditingExpense(null);
    } catch (error) {
      toast.error('Failed to save expense');
      console.error('Error saving expense:', error);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await expenseOperations.delete(id);
      toast.success('Expense deleted successfully');
      await loadExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
      console.error('Error deleting expense:', error);
    }
  };

  const handleBulkDelete = async (expenseIds: number[]) => {
    try {
      const result = await expenseOperations.bulkDelete(expenseIds);
      toast.success(`${result.changes} expenses deleted successfully`);
      await loadExpenses();
    } catch (error) {
      toast.error('Failed to delete expenses');
      console.error('Error deleting expenses:', error);
    }
  };

  const handleBulkCategorize = async (expenseIds: number[], category: string) => {
    try {
      const result = await expenseOperations.bulkUpdateCategory(expenseIds, category);
      toast.success(`${result.changes} expenses categorized as "${category}"`);
      await loadExpenses();
    } catch (error) {
      toast.error('Failed to update expense categories');
      console.error('Error updating categories:', error);
    }
  };

  const handleBulkChangeMerchant = async (expenseIds: number[], merchant: string) => {
    try {
      const result = await expenseOperations.bulkUpdateMerchant(expenseIds, merchant);
      toast.success(`${result.changes} expenses updated to merchant "${merchant}"`);
      await loadExpenses();
    } catch (error) {
      toast.error('Failed to update expense merchants');
      console.error('Error updating merchants:', error);
    }
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingExpense(null);
  };

  const renderPanelView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredExpenses.map((expense) => (
        <div key={expense.id} className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-foreground">{expense.merchant}</h3>
              <p className="text-sm text-muted-foreground">{expense.category}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleViewExpense(expense)}
                className="p-1 text-muted-foreground hover:text-white"
                title="View Expense"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleEditExpense(expense)}
                className="p-1 text-muted-foreground hover:text-blue-600"
                title="Edit Expense"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteExpense(expense.id)}
                className="p-1 text-muted-foreground hover:text-red-600"
                title="Delete Expense"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-medium text-foreground">
                <FormattedCurrency amount={expense.amount} />
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm text-foreground">{formatDateSync(expense.date)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
              </span>
            </div>

            {expense.description && (
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">{expense.description}</p>
              </div>
            )}

            {expense.receipt_url && (
              <div className="flex items-center text-sm text-blue-600">
                <Receipt className="h-4 w-4 mr-1" />
                <span>Receipt attached</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

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
    <div className={themeClasses.page}>
      <div className={themeClasses.pageContainer}>
        {/* Header */}
        <div className={themeClasses.sectionHeader}>
          <div>
            <h1 className={themeClasses.sectionTitle}>Expenses</h1>
            <p className={themeClasses.sectionSubtitle}>Track and manage company expenses</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowImportExport(true)}
              className={getButtonClasses('secondary')}
            >
              <Upload className={themeClasses.iconButton} />
              Import/Export
            </button>
            <button
              onClick={handleCreateExpense}
              className={getButtonClasses('primary')}
            >
              <Plus className={themeClasses.iconButton} />
              Add Expense
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className={themeClasses.statsGrid}>
          <div className={themeClasses.statCard}>
            <div className={themeClasses.statCardContent}>
              <div>
                <p className={themeClasses.statLabel}>Total Expenses</p>
                <p className={themeClasses.statValue}>
                  <FormattedCurrency amount={totalExpenses} />
                </p>
              </div>
              <DollarSign className={`${themeClasses.iconLarge} ${getIconColorClasses('blue')}`} />
            </div>
          </div>
          <div className={themeClasses.statCard}>
            <div className={themeClasses.statCardContent}>
              <div>
                <p className={themeClasses.statLabel}>Pending</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{pendingCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedCount}</p>
              </div>
              <Receipt className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reimbursed</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{reimbursedCount}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <div className="flex justify-between items-center">
            {/* Left section - Search and Filters (80%) */}
            <div className="flex space-x-4 flex-1 mr-6">
              <div className="flex-1 relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
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
                className="px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="reimbursed">Reimbursed</option>
              </select>
            </div>

            {/* Right section - View Toggle (20%) */}
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('panel')}
                className={`p-2 rounded-lg border ${
                  viewMode === 'panel'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground'
                }`}
                title="Panel View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg border ${
                  viewMode === 'table'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground'
                }`}
                title="Table View"
              >
                <Table className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expenses Display */}
        {viewMode === 'panel' ? renderPanelView() : (
          <ExpensesList
            expenses={filteredExpenses}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            onViewExpense={handleViewExpense}
            onBulkDelete={handleBulkDelete}
            onBulkCategorize={handleBulkCategorize}
            onBulkChangeMerchant={handleBulkChangeMerchant}
            categories={Array.from(new Set(expenses.map(e => e.category).filter(Boolean)))}
          />
        )}

        {/* Empty State */}
        {filteredExpenses.length === 0 && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-12">
            <div className="text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No expenses found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Add your first expense to get started'
                }
              </p>
            </div>
          </div>
        )}

        {/* Import/Export Modal */}
        {showImportExport && (
          <ExpenseImportExport
            onClose={() => setShowImportExport(false)}
            onImportComplete={loadExpenses}
          />
        )}

        {/* Expense View Modal */}
        <ExpenseViewModal
          expense={viewingExpense}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingExpense(null);
          }}
        />
      </div>
    </div>
  );
};
