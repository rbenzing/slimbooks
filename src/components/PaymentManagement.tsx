import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  XCircle, 
  LayoutGrid, 
  Table, 
  Eye, 
  Edit, 
  Trash2 
} from 'lucide-react';
import { PaymentsList } from './payments/PaymentsList';
import { PaymentForm } from './payments/PaymentForm';
import { PaymentViewModal } from './payments/PaymentViewModal';
import { PaginationControls } from './ui/PaginationControls';
import { usePagination } from '@/hooks/usePagination';
import { toast } from 'sonner';
import { 
  themeClasses, 
  getIconColorClasses, 
  getButtonClasses, 
  getStatusColor 
} from '@/utils/themeUtils.util';
import { authenticatedFetch } from '@/utils/apiUtils.util';
import { formatDateSync } from '@/components/ui/FormattedDate';
import { FormattedCurrency } from '@/components/ui/FormattedCurrency';
import { Payment } from '@/types/payment.types';

export const PaymentManagement: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'panel' | 'table'>('table');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/payments');
      const data = await response.json();
      
      
      if (data.success) {
        setPayments(data.data.payments || []);
      } else {
        console.error('API returned success: false. Message:', data.message);
        console.error('Full API response:', data);
        throw new Error(data.message || 'Failed to load payments');
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (!payment) return false;

    const clientName = payment.client_name || '';
    const description = payment.description || '';
    const reference = payment.reference || '';
    const method = payment.method || '';
    const status = payment.status || '';

    const matchesSearch = 
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'all' || method === methodFilter;
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  // Use pagination hook
  const pagination = usePagination({
    data: filteredPayments,
    searchTerm,
    filters: { methodFilter, statusFilter }
  });

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const receivedCount = filteredPayments.filter(p => p.status === 'received').length;
  const pendingCount = filteredPayments.filter(p => p.status === 'pending').length;
  const failedCount = filteredPayments.filter(p => p.status === 'failed').length;

  const handleCreatePayment = () => {
    setEditingPayment(null);
    setShowCreateForm(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setShowCreateForm(true);
  };

  const handleViewPayment = (payment: Payment) => {
    setViewingPayment(payment);
    setIsViewModalOpen(true);
  };

  const handleSavePayment = async (paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const url = editingPayment ? `/api/payments/${editingPayment.id}` : '/api/payments';
      const method = editingPayment ? 'PUT' : 'POST';
      
      const response = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentData })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(editingPayment ? 'Payment updated successfully' : 'Payment created successfully');
        await loadPayments();
        setShowCreateForm(false);
        setEditingPayment(null);
      } else {
        throw new Error(data.message || 'Failed to save payment');
      }
    } catch (error) {
      toast.error('Failed to save payment');
      console.error('Error saving payment:', error);
    }
  };

  const handleDeletePayment = async (id: number) => {
    try {
      const response = await authenticatedFetch(`/api/payments/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Payment deleted successfully');
        await loadPayments();
      } else {
        throw new Error(data.message || 'Failed to delete payment');
      }
    } catch (error) {
      toast.error('Failed to delete payment');
      console.error('Error deleting payment:', error);
    }
  };

  const handleBulkDelete = async (paymentIds: number[]) => {
    try {
      const response = await authenticatedFetch('/api/payments/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payment_ids: paymentIds })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`${data.data.deleted_count} payments deleted successfully`);
        await loadPayments();
      } else {
        throw new Error(data.message || 'Failed to delete payments');
      }
    } catch (error) {
      toast.error('Failed to delete payments');
      console.error('Error deleting payments:', error);
    }
  };

  const handleBulkChangeStatus = async (paymentIds: number[], status: string) => {
    try {
      const updatePromises = paymentIds.map(id => 
        authenticatedFetch(`/api/payments/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ paymentData: { status } })
        })
      );
      
      await Promise.all(updatePromises);
      toast.success(`${paymentIds.length} payments updated to "${status}"`);
      await loadPayments();
    } catch (error) {
      toast.error('Failed to update payment status');
      console.error('Error updating status:', error);
    }
  };

  const handleBulkChangeMethod = async (paymentIds: number[], method: string) => {
    try {
      const updatePromises = paymentIds.map(id => 
        authenticatedFetch(`/api/payments/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ paymentData: { method } })
        })
      );
      
      await Promise.all(updatePromises);
      toast.success(`${paymentIds.length} payments updated to "${method}"`);
      await loadPayments();
    } catch (error) {
      toast.error('Failed to update payment method');
      console.error('Error updating method:', error);
    }
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingPayment(null);
  };

  const renderPanelView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pagination.paginatedData.map((payment) => (
        <div key={payment.id} className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-foreground">{payment.client_name}</h3>
              <p className="text-sm text-muted-foreground">{payment.method?.replace('_', ' ')}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleViewPayment(payment)}
                className="p-1 text-muted-foreground hover:text-white"
                title="View Payment"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleEditPayment(payment)}
                className="p-1 text-muted-foreground hover:text-blue-600"
                title="Edit Payment"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeletePayment(payment.id)}
                className="p-1 text-muted-foreground hover:text-red-600"
                title="Delete Payment"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-medium text-foreground">
                <FormattedCurrency amount={payment.amount} />
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm text-foreground">{formatDateSync(payment.date)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
              </span>
            </div>

            {payment.reference && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Reference</span>
                <span className="text-sm text-foreground truncate max-w-32">{payment.reference}</span>
              </div>
            )}

            {payment.description && (
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">{payment.description}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  if (showCreateForm) {
    return (
      <PaymentForm 
        payment={editingPayment}
        onSave={handleSavePayment}
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
            <h1 className={themeClasses.sectionTitle}>Payments</h1>
            <p className={themeClasses.sectionSubtitle}>Track and manage client payments</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCreatePayment}
              className={getButtonClasses('primary')}
            >
              <Plus className={themeClasses.iconButton} />
              Add Payment
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className={themeClasses.statsGrid}>
          <div className={themeClasses.statCard}>
            <div className={themeClasses.statCardContent}>
              <div>
                <p className={themeClasses.statLabel}>Total Received</p>
                <p className={themeClasses.statValue}>
                  <FormattedCurrency amount={totalAmount} />
                </p>
              </div>
              <DollarSign className={`${themeClasses.iconLarge} ${getIconColorClasses('green')}`} />
            </div>
          </div>
          <div className={themeClasses.statCard}>
            <div className={themeClasses.statCardContent}>
              <div>
                <p className={themeClasses.statLabel}>Received</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{receivedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{failedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
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
                  placeholder="Search payments..."
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="paypal">PayPal</option>
                <option value="other">Other</option>
              </select>
              <select
                className="px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="received">Received</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
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

        {/* Payments Display */}
        {loading ? (
          <div className="bg-card rounded-lg shadow-sm border border-border p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading payments...</p>
            </div>
          </div>
        ) : viewMode === 'panel' ? renderPanelView() : (
          <PaymentsList
            payments={pagination.paginatedData}
            onEditPayment={handleEditPayment}
            onDeletePayment={handleDeletePayment}
            onViewPayment={handleViewPayment}
            onBulkDelete={handleBulkDelete}
            onBulkChangeStatus={handleBulkChangeStatus}
            onBulkChangeMethod={handleBulkChangeMethod}
          />
        )}

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          itemsPerPage={pagination.itemsPerPage}
          totalItems={pagination.totalItems}
          displayStart={pagination.displayStart}
          displayEnd={pagination.displayEnd}
          pageNumbers={pagination.pageNumbers}
          paginationSettings={pagination.paginationSettings}
          onPageChange={pagination.setCurrentPage}
          onItemsPerPageChange={pagination.setItemsPerPage}
          onNextPage={pagination.goToNextPage}
          onPrevPage={pagination.goToPrevPage}
          canGoNext={pagination.canGoNext}
          canGoPrev={pagination.canGoPrev}
          className="mt-6"
          itemType="payments"
        />

        {/* Empty State */}
        {!loading && filteredPayments.length === 0 && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-12">
            <div className="text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No payments found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || methodFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Add your first payment to get started'
                }
              </p>
            </div>
          </div>
        )}

        {/* Payment View Modal */}
        <PaymentViewModal
          payment={viewingPayment}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingPayment(null);
          }}
        />
      </div>
    </div>
  );
};