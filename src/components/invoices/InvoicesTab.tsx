import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Send,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Edit,
  Trash2
} from 'lucide-react';
import { CreateInvoicePage } from './CreateInvoicePage';
import { invoiceOperations } from '@/lib/database';

interface Invoice {
  id: number;
  invoice_number: string;
  client_name: string;
  amount: number;
  status: string;
  due_date: string;
  description: string;
  type: string;
  created_at: string;
}

const statusConfig = {
  paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  sent: { color: 'bg-blue-100 text-blue-800', icon: Send },
  overdue: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  draft: { color: 'bg-gray-100 text-gray-800', icon: Clock }
};

export const InvoicesTab = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = () => {
    try {
      const allInvoices = invoiceOperations.getAll() as Invoice[];
      setInvoices(allInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const handleDeleteInvoice = (id: number) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        invoiceOperations.delete(id);
        loadInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Error deleting invoice. Please try again.');
      }
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setViewingInvoice(null);
    setShowCreatePage(true);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setEditingInvoice(null);
    setShowCreatePage(true);
  };

  const handleBackToList = () => {
    setShowCreatePage(false);
    setEditingInvoice(null);
    setViewingInvoice(null);
    loadInvoices();
  };

  if (showCreatePage) {
    return (
      <CreateInvoicePage
        onBack={handleBackToList}
        editingInvoice={editingInvoice}
        viewOnly={!!viewingInvoice}
      />
    );
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number.includes(searchTerm) ||
                         invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueCount = filteredInvoices.filter(inv => inv.status === 'overdue').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sent Invoices</h1>
          <p className="text-gray-600">Manage and track your invoice payments</p>
        </div>
        <button 
          onClick={() => setShowCreatePage(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">${totalAmount.toLocaleString()}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collected</p>
              <p className="text-2xl font-bold text-green-600">${paidAmount.toLocaleString()}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-orange-600">${(totalAmount - paidAmount).toLocaleString()}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
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
              placeholder="Search invoices..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => {
                const StatusIcon = statusConfig[invoice.status as keyof typeof statusConfig]?.icon || Clock;
                const statusColor = statusConfig[invoice.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800';
                
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">#{invoice.invoice_number}</div>
                        <div className="text-sm text-gray-500">{invoice.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{invoice.client_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">${invoice.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleViewInvoice(invoice)}
                          className="text-gray-400 hover:text-green-600 transition-colors"
                          title="View Invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditInvoice(invoice)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit Invoice"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredInvoices.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first invoice to get started'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
