import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, DollarSign, Calendar, User, Search, LayoutGrid, Table } from 'lucide-react';
import { invoiceOperations } from '@/lib/database';
import { InvoiceForm } from './InvoiceForm';
import { InvoiceViewModal } from './InvoiceViewModal';

export const InvoicesTab = () => {
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

  const loadInvoices = () => {
    const allInvoices = invoiceOperations.getAll();
    setInvoices(allInvoices);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = (invoice.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesClient = clientFilter === 'all' || invoice.client_name === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  const uniqueClients = [...new Set(invoices.map(invoice => invoice.client_name))];

  const totalInvoices = filteredInvoices.length;
  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = filteredInvoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingAmount = filteredInvoices
    .filter(invoice => invoice.status === 'sent')
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const handleSave = (invoiceData: any) => {
    try {
      if (editingInvoice) {
        invoiceOperations.update(editingInvoice.id, invoiceData);
      } else {
        // Generate invoice number if not provided
        if (!invoiceData.invoice_number) {
          const invoiceCount = invoices.length + 1;
          invoiceData.invoice_number = `INV-${String(invoiceCount).padStart(4, '0')}`;
        }
        invoiceOperations.create(invoiceData);
      }
      loadInvoices();
      setIsFormOpen(false);
      setEditingInvoice(null);
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      invoiceOperations.delete(id);
      loadInvoices();
    }
  };

  const handleEdit = (invoice: any) => {
    setEditingInvoice(invoice);
    window.location.href = `/invoices/edit/${invoice.id}`;
  };

  const handleView = (invoice: any) => {
    setViewingInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handleCreateNew = () => {
    window.location.href = '/invoices/create';
  };

  const renderPanelView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredInvoices.map((invoice) => (
        <div key={invoice.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{invoice.invoice_number || `Invoice #${invoice.id}`}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.client_name}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleView(invoice)}
                className="p-1 text-gray-400 hover:text-blue-600"
                title="View Invoice"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleEdit(invoice)}
                className="p-1 text-gray-400 hover:text-blue-600"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(invoice.id)}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <DollarSign className="h-4 w-4 mr-2" />
              <span>${invoice.amount.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{new Date(invoice.created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <User className="h-4 w-4 mr-2" />
              <span>{invoice.client_name}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Created {new Date(invoice.created_at).toLocaleDateString()}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                invoice.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Draft'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Invoice #</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Client</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {invoice.invoice_number || `Invoice #${invoice.id}`}
                </td>
                <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100">{invoice.client_name}</td>
                <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                  ${invoice.amount.toFixed(2)}
                </td>
                <td className="py-4 px-6 text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    invoice.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Draft'}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(invoice.created_at).toLocaleDateString()}
                </td>
                <td className="py-4 px-6 text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(invoice)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="View Invoice"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Sent Invoices</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your invoices and track payments</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoices</p>
              <p className="text-2xl font-bold text-blue-600">{totalInvoices}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${totalAmount.toFixed(2)}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">${paidAmount.toFixed(2)}</p>
            </div>
            <User className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Amount</p>
              <p className="text-2xl font-bold text-yellow-600">${pendingAmount.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Search, Filters and View Toggle */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center space-x-4">
          {/* Left column - Search and Filters (80%) */}
          <div className="flex-1 flex space-x-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
            </select>
            <select 
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
              title="Panel View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg border ${
                viewMode === 'table' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
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

      {filteredInvoices.length === 0 && (
        <div className="col-span-full text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No invoices found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || statusFilter !== 'all' || clientFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Create your first invoice to get started'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && clientFilter === 'all' && (
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
      />
    </div>
  );
};
