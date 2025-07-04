import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, DollarSign, Calendar, User } from 'lucide-react';
import { invoiceOperations } from '@/lib/database';
import { InvoiceForm } from './InvoiceForm';
import { InvoiceViewModal } from './InvoiceViewModal';

export const InvoicesTab = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = () => {
    const allInvoices = invoiceOperations.getAll();
    setInvoices(allInvoices);
  };

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

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sent Invoices</h2>
          <p className="text-gray-600">Manage your invoices and track payments</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </button>
      </div>

      {/* Invoices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{invoice.invoice_number || `Invoice #${invoice.id}`}</h3>
                <p className="text-sm text-gray-600">{invoice.client_name}</p>
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
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="h-4 w-4 mr-2" />
                <span>${invoice.amount.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{new Date(invoice.created_at).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2" />
                <span>{invoice.client_name}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Created {new Date(invoice.created_at).toLocaleDateString()}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Draft'}
                </span>
              </div>
            </div>
          </div>
        ))}

        {invoices.length === 0 && (
          <div className="col-span-full text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
            <p className="text-gray-600 mb-4">Create your first invoice to get started</p>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </button>
          </div>
        )}
      </div>

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
