
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { invoiceOperations, clientOperations } from '@/lib/database';
import { ClientSelector } from './ClientSelector';
import { useFormNavigation } from '@/hooks/useFormNavigation';

export const EditInvoicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: '',
    status: 'draft',
    due_date: '',
    description: '',
    notes: ''
  });
  const [isDirty, setIsDirty] = useState(false);

  const { confirmNavigation, NavigationGuard } = useFormNavigation({
    isDirty,
    isEnabled: true,
    entityType: 'invoice'
  });

  useEffect(() => {
    if (id) {
      // Load invoice data
      const invoiceData = invoiceOperations.getById(parseInt(id));
      if (invoiceData) {
        setInvoice(invoiceData);
        setFormData({
          amount: invoiceData.amount?.toString() || '',
          status: invoiceData.status || 'draft',
          due_date: invoiceData.due_date || '',
          description: invoiceData.description || '',
          notes: invoiceData.notes || ''
        });

        // Find and set the client
        const allClients = clientOperations.getAll();
        setClients(allClients);
        const client = allClients.find(c => c.id === invoiceData.client_id);
        if (client) {
          setSelectedClient(client);
        }
      }
      setLoading(false);
    }
  }, [id]);

  // Track form changes
  useEffect(() => {
    if (invoice) {
      const hasChanges = 
        formData.amount !== (invoice.amount?.toString() || '') ||
        formData.status !== (invoice.status || 'draft') ||
        formData.due_date !== (invoice.due_date || '') ||
        formData.description !== (invoice.description || '') ||
        formData.notes !== (invoice.notes || '') ||
        selectedClient?.id !== invoice.client_id;
      
      setIsDirty(hasChanges);
    }
  }, [formData, selectedClient, invoice]);

  const handleSave = () => {
    if (!selectedClient) {
      alert('Please select a client');
      return;
    }

    try {
      const updatedInvoice = {
        invoice_number: invoice.invoice_number,
        client_id: selectedClient.id,
        template_id: invoice.template_id,
        amount: parseFloat(formData.amount),
        status: formData.status,
        due_date: formData.due_date,
        description: formData.description,
        stripe_invoice_id: invoice.stripe_invoice_id,
        type: invoice.type,
        client_name: invoice.client_name,
        client_email: invoice.client_email,
        client_phone: invoice.client_phone,
        client_address: invoice.client_address,
        line_items: invoice.line_items,
        tax_amount: invoice.tax_amount,
        shipping_amount: invoice.shipping_amount,
        notes: formData.notes
      };

      invoiceOperations.update(parseInt(id!), updatedInvoice);
      setIsDirty(false);
      navigate('/invoices');
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('Error updating invoice');
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        invoiceOperations.delete(parseInt(id!));
        navigate('/invoices');
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Error deleting invoice');
      }
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Invoice not found</h2>
          <button
            onClick={() => navigate('/invoices')}
            className="text-primary hover:underline"
          >
            Return to invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => confirmNavigation('back')}
              className="flex items-center text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Invoices
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Edit Invoice #{invoice.invoice_number || invoice.id}
              </h1>
              <p className="text-muted-foreground">
                Created {new Date(invoice.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDelete}
              className="flex items-center px-4 py-2 text-destructive border border-destructive rounded-lg hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Invoice Details */}
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Invoice Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleFormChange('amount', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleFormChange('due_date', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={3}
                    placeholder="Invoice description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Client Information */}
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <ClientSelector
                clients={clients}
                selectedClient={selectedClient}
                onClientSelect={setSelectedClient}
                disabled={false}
              />
            </div>

            {/* Invoice Summary */}
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Invoice Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Number:</span>
                  <span className="text-card-foreground">#{invoice.invoice_number || invoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="text-card-foreground">{new Date(invoice.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    formData.status === 'paid' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                    formData.status === 'sent' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                    'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                  </span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-card-foreground">Total Amount:</span>
                    <span className="text-card-foreground">${formData.amount || '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <NavigationGuard />
    </div>
  );
};
