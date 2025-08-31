import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, DollarSign, Calendar, User, Search, LayoutGrid, Table, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { invoiceOperations } from '@/lib/database';
import { InvoiceForm } from './InvoiceForm';
import { InvoiceViewModal } from './InvoiceViewModal';
import { PaginationControls } from '../ui/PaginationControls';
import { usePagination } from '@/hooks/usePagination';
import { getStatusColor } from '@/lib/utils';
import { formatDateSync } from '@/components/ui/FormattedDate';
import { FormattedCurrency } from '@/components/ui/FormattedCurrency';
import { createPaymentForInvoice } from '@/utils/paymentHelpers';
import { toast } from 'sonner';

export const InvoicesTab = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'panel' | 'table'>('panel');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const allInvoices = await invoiceOperations.getAll();
      setInvoices(allInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = (invoice.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesClient = clientFilter === 'all' || invoice.client_name === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  const uniqueClients = [...new Set(invoices.map(invoice => invoice.client_name))];

  // Use pagination hook
  const pagination = usePagination({
    data: filteredInvoices,
    searchTerm,
    filters: { statusFilter, clientFilter }
  });

  const totalInvoices = filteredInvoices.length;
  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = filteredInvoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingAmount = filteredInvoices
    .filter(invoice => invoice.status === 'sent')
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const handleSave = async (invoiceData: any) => {
    try {
      if (editingInvoice) {
        await invoiceOperations.update(editingInvoice.id, invoiceData);
      } else {
        // Generate invoice number if not provided
        if (!invoiceData.invoice_number) {
          const invoiceCount = invoices.length + 1;
          invoiceData.invoice_number = `INV-${String(invoiceCount).padStart(4, '0')}`;
        }
        await invoiceOperations.create(invoiceData);
      }
      await loadInvoices();
      setIsFormOpen(false);
      setEditingInvoice(null);
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoiceOperations.delete(id);
        await loadInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const handleEdit = (invoice: any) => {
    navigate(`/invoices/edit/${invoice.id}`);
  };

  const handleView = (invoice: any) => {
    setViewingInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handleCreateNew = () => {
    window.location.href = '/invoices/create';
  };

  const handleMarkAsPaid = async (invoice: any) => {
    try {
      // Create payment and mark invoice as paid
      const success = await createPaymentForInvoice(invoice);
      
      if (success) {
        // Reload invoices to show updated status
        await loadInvoices();
        
        // Close the modal
        setIsViewModalOpen(false);
        setViewingInvoice(null);
      }
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Failed to mark invoice as paid');
    }
  };

  const renderPanelView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pagination.paginatedData.map((invoice) => (
        <div key={invoice.id} className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-foreground">{invoice.invoice_number || `Invoice #${invoice.id}`}</h3>
              <p className="text-sm text-muted-foreground">{invoice.client_name}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleView(invoice)}
                className="p-1 text-muted-foreground hover:text-white"
                title="View Invoice"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleEdit(invoice)}
                className="p-1 text-muted-foreground hover:text-blue-600"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(invoice.id)}
                className="p-1 text-muted-foreground hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 mr-2" />
              <span><FormattedCurrency amount={invoice.amount} /></span>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formatDateSync(invoice.created_at)}</span>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <User className="h-4 w-4 mr-2" />
              <span>{invoice.client_name}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Created {formatDateSync(invoice.created_at)}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status || 'draft')}`}>
                {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Draft'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase">Invoice #</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase">Client</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase">Amount</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase">Status</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase">Created</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pagination.paginatedData.map((invoice) => (
              <tr key={invoice.id}>
                <td className="py-4 px-6 text-sm font-medium text-card-foreground">
                  {invoice.invoice_number || `Invoice #${invoice.id}`}
                </td>
                <td className="py-4 px-6 text-sm text-card-foreground">{invoice.client_name}</td>
                <td className="py-4 px-6 text-sm font-medium text-card-foreground">
                  <FormattedCurrency amount={invoice.amount} />
                </td>
                <td className="py-4 px-6 text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status || 'draft')}`}>
                    {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Draft'}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-card-foreground">
                  {formatDateSync(invoice.created_at)}
                </td>
                <td className="py-4 px-6 text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(invoice)}
                      className="p-1 text-muted-foreground hover:text-white"
                      title="View Invoice"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="p-1 text-muted-foreground hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      className="p-1 text-muted-foreground hover:text-red-600"
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

  return (
    <div>


      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
              <p className="text-2xl font-bold text-blue-600">{totalInvoices}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-foreground">
                <FormattedCurrency amount={totalAmount} />
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">
                <FormattedCurrency amount={paidAmount} />
              </p>
            </div>
            <User className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Amount</p>
              <p className="text-2xl font-bold text-yellow-600">
                <FormattedCurrency amount={pendingAmount} />
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Search, Filters and View Toggle */}
      <div className="bg-card p-6 rounded-lg shadow-sm border border-border mb-6">
        <div className="flex items-center space-x-4">
          {/* Left column - Search and Filters (80%) */}
          <div className="flex-1 flex space-x-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search invoices..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
            </select>
            <select
              className="px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <option value="all">All Clients</option>
              {uniqueClients.map(client => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>
          </div>
          
          {/* Right column - View Toggle (20%) */}
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

      {/* Invoices Display */}
      {viewMode === 'panel' ? renderPanelView() : renderTableView()}

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
        itemType="invoices"
      />

      {filteredInvoices.length === 0 && (
        <div className="col-span-full text-center py-12">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No invoices found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' || clientFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first invoice to get started'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && clientFilter === 'all' && (
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </button>
          )}
        </div>
      )}

      {/* Keep existing InvoiceForm for backward compatibility */}
      <InvoiceForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingInvoice(null);
        }}
        onSave={handleSave}
        invoice={editingInvoice}
      />

      {/* Invoice View Modal */}
      <InvoiceViewModal
        invoice={viewingInvoice}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingInvoice(null);
        }}
        onMarkAsPaid={handleMarkAsPaid}
      />
    </div>
  );
};
