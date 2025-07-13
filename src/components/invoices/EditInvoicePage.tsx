
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Plus, X } from 'lucide-react';
import { invoiceOperations, clientOperations } from '@/lib/database';
import { ClientSelector } from './ClientSelector';
import { CompanyHeader } from './CompanyHeader';
import { useFormNavigation } from '@/hooks/useFormNavigation';
import { statusColors, themeClasses, getButtonClasses } from '@/lib/utils';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export const EditInvoicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '',
    due_date: '',
    status: 'draft'
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, amount: 0 }
  ]);
  const [companyLogo, setCompanyLogo] = useState('');
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [selectedTaxRate, setSelectedTaxRate] = useState<any>(null);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedShippingRate, setSelectedShippingRate] = useState<any>(null);
  const [thankYouMessage, setThankYouMessage] = useState('Thank you for your business!');
  const [isDirty, setIsDirty] = useState(false);

  const { confirmNavigation, NavigationGuard } = useFormNavigation({
    isDirty,
    isEnabled: true,
    entityType: 'invoice'
  });

  useEffect(() => {
    if (id) {
      // Load invoice data
      const invoiceRecord = invoiceOperations.getById(parseInt(id));

      if (invoiceRecord) {
        setInvoice(invoiceRecord);
        setInvoiceData({
          invoice_number: invoiceRecord.invoice_number || '',
          due_date: invoiceRecord.due_date || '',
          status: invoiceRecord.status || 'draft'
        });

        // Load line items if they exist
        if (invoiceRecord.line_items) {
          try {
            const parsedLineItems = JSON.parse(invoiceRecord.line_items);
            setLineItems(parsedLineItems.length > 0 ? parsedLineItems : [
              { id: '1', description: invoiceRecord.description || '', quantity: 1, rate: invoiceRecord.amount || 0, amount: invoiceRecord.amount || 0 }
            ]);
          } catch (e) {
            // Fallback to single line item from description and amount
            setLineItems([
              { id: '1', description: invoiceRecord.description || '', quantity: 1, rate: invoiceRecord.amount || 0, amount: invoiceRecord.amount || 0 }
            ]);
          }
        } else {
          // Fallback to single line item from description and amount
          setLineItems([
            { id: '1', description: invoiceRecord.description || '', quantity: 1, rate: invoiceRecord.amount || 0, amount: invoiceRecord.amount || 0 }
          ]);
        }

        // Set thank you message
        setThankYouMessage(invoiceRecord.notes || 'Thank you for your business!');

        // Load all clients first
        const allClients = clientOperations.getAll();
        setClients(allClients);

        // Find and set the client
        const client = allClients.find(c => c.id === invoiceRecord.client_id);
        if (client) {
          setSelectedClient(client);
        }
      }
      setLoading(false);
    }

    // Load tax rates from settings
    const savedTaxRates = localStorage.getItem('tax_rates');
    if (savedTaxRates) {
      const rates = JSON.parse(savedTaxRates);
      setTaxRates(rates);
      setSelectedTaxRate(rates.find((r: any) => r.isDefault) || rates[0]);
    }

    // Load shipping rates from settings
    const savedShippingRates = localStorage.getItem('shipping_rates');
    if (savedShippingRates) {
      const rates = JSON.parse(savedShippingRates);
      setShippingRates(rates);
      setSelectedShippingRate(rates.find((r: any) => r.isDefault) || rates[0]);
    }
  }, [id]);

  // Track form changes
  useEffect(() => {
    if (invoice) {
      const hasChanges =
        invoiceData.status !== (invoice.status || 'draft') ||
        invoiceData.due_date !== (invoice.due_date || '') ||
        invoiceData.invoice_number !== (invoice.invoice_number || '') ||
        selectedClient?.id !== invoice.client_id ||
        JSON.stringify(lineItems) !== (invoice.line_items || JSON.stringify([{ id: '1', description: invoice.description || '', quantity: 1, rate: invoice.amount || 0, amount: invoice.amount || 0 }]));

      setIsDirty(hasChanges);
    }
  }, [invoiceData, selectedClient, invoice, lineItems]);

  const handleSave = () => {
    if (!selectedClient) {
      alert('Please select a client');
      return;
    }

    // Calculate total amount from line items
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = selectedTaxRate ? (subtotal * selectedTaxRate.rate) / 100 : 0;
    const shippingAmount = selectedShippingRate ? selectedShippingRate.amount : 0;
    const total = subtotal + taxAmount + shippingAmount;

    try {
      const updatedInvoice = {
        invoice_number: invoiceData.invoice_number,
        client_id: selectedClient.id,
        template_id: invoice.template_id,
        amount: total,
        status: invoiceData.status,
        due_date: invoiceData.due_date,
        description: lineItems.map(item => item.description).join(', '),
        stripe_invoice_id: invoice.stripe_invoice_id,
        type: invoice.type,
        client_name: selectedClient.name,
        client_email: selectedClient.email,
        client_phone: selectedClient.phone,
        client_address: `${selectedClient.address}, ${selectedClient.city}, ${selectedClient.state} ${selectedClient.zipCode}`,
        line_items: JSON.stringify(lineItems),
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        notes: thankYouMessage
      };

      invoiceOperations.update(parseInt(id!), updatedInvoice);
      setIsDirty(false);
      // Navigate back to the appropriate page based on invoice type
      if (invoice.template_id) {
        navigate('/invoices#templates');
      } else {
        navigate('/invoices');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('Error updating invoice');
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        invoiceOperations.delete(parseInt(id!));
        // Navigate back to the appropriate page based on invoice type
        if (invoice.template_id) {
          navigate('/invoices#templates');
        } else {
          navigate('/invoices');
        }
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Error deleting invoice');
      }
    }
  };

  // Helper functions for line items
  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(items => items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const addLineItem = () => {
    const newId = (lineItems.length + 1).toString();
    setLineItems([...lineItems, { id: newId, description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanyLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = selectedTaxRate ? (subtotal * selectedTaxRate.rate) / 100 : 0;
  const shippingAmount = selectedShippingRate ? selectedShippingRate.amount : 0;
  const total = subtotal + taxAmount + shippingAmount;

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!invoice) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Invoice not found</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              const targetPath = invoice.template_id ? '/invoices#templates' : '/invoices';
              confirmNavigation(targetPath);
            }}
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {invoice.template_id ? 'Back to Templates' : 'Back to Invoices'}
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handleDelete}
              className="flex items-center px-4 py-2 text-destructive border border-destructive rounded-lg hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Update Invoice
            </button>
          </div>
        </div>

        {/* Invoice Layout */}
        <div className="bg-card rounded-lg shadow-lg p-8 border">
          {/* Company Header */}
          <div className="flex justify-between items-start mb-8">
            <CompanyHeader companyLogo={companyLogo} onLogoUpload={handleLogoUpload} />
            <div className="text-right">
              <h2 className="text-3xl font-bold text-card-foreground mb-2">INVOICE</h2>
              <div className="space-y-1">
                <div>
                  <label className="text-sm text-muted-foreground">Invoice # *</label>
                  <input
                    type="text"
                    value={invoiceData.invoice_number}
                    onChange={(e) => setInvoiceData({...invoiceData, invoice_number: e.target.value})}
                    className="block w-full border-0 border-b border-border focus:border-primary focus:ring-0 text-right bg-transparent text-card-foreground"
                    placeholder="INV-001"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Due Date *</label>
                  <input
                    type="date"
                    value={invoiceData.due_date}
                    onChange={(e) => setInvoiceData({...invoiceData, due_date: e.target.value})}
                    className="block w-full border-0 border-b border-border focus:border-primary focus:ring-0 text-right bg-transparent text-card-foreground [color-scheme:light] dark:[color-scheme:dark]"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <select
                    value={invoiceData.status}
                    onChange={(e) => setInvoiceData({...invoiceData, status: e.target.value})}
                    className="block w-full border-0 border-b border-border focus:border-primary focus:ring-0 text-right bg-transparent text-card-foreground"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="mb-8">
            <ClientSelector
              clients={clients}
              selectedClient={selectedClient}
              onClientSelect={setSelectedClient}
            />
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-3 font-semibold text-card-foreground">Description *</th>
                  <th className="text-center py-3 font-semibold w-20 text-card-foreground">Qty</th>
                  <th className="text-right py-3 font-semibold w-24 text-card-foreground">Rate</th>
                  <th className="text-right py-3 font-semibold w-24 text-card-foreground">Amount</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-border">
                    <td className="py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        className="w-full border-0 border-b border-transparent focus:border-primary focus:ring-0 bg-transparent text-card-foreground"
                        placeholder="Item description"
                        required
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-16 text-center border-0 border-b border-transparent focus:border-primary focus:ring-0 bg-transparent text-card-foreground"
                        min="0"
                        step="1"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-20 text-right border-0 border-b border-transparent focus:border-primary focus:ring-0 bg-transparent text-card-foreground"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="py-3 text-right text-card-foreground">
                      ${item.amount.toFixed(2)}
                    </td>
                    <td className="py-3">
                      {lineItems.length > 1 && (
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={addLineItem}
              className="mt-3 flex items-center text-primary hover:text-primary/80"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Line Item
            </button>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="flex justify-between items-center py-2">
                <span className="text-card-foreground">Subtotal:</span>
                <span className="text-card-foreground">${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Tax Rate</label>
                  <select
                    value={selectedTaxRate?.id || ''}
                    onChange={(e) => {
                      const rate = taxRates.find(r => r.id === e.target.value);
                      setSelectedTaxRate(rate || null);
                    }}
                    className="w-48 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-card-foreground"
                  >
                    <option value="">No Tax</option>
                    {taxRates.map(rate => (
                      <option key={rate.id} value={rate.id}>
                        {rate.name} ({rate.rate}%)
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-card-foreground">${taxAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Shipping</label>
                  <select
                    value={selectedShippingRate?.id || ''}
                    onChange={(e) => {
                      const rate = shippingRates.find(r => r.id === e.target.value);
                      setSelectedShippingRate(rate || null);
                    }}
                    className="w-48 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-card-foreground"
                  >
                    <option value="">No Shipping</option>
                    {shippingRates.map(rate => (
                      <option key={rate.id} value={rate.id}>
                        {rate.name} (${rate.amount})
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-card-foreground">${shippingAmount.toFixed(2)}</span>
              </div>

              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span className="text-card-foreground">Total:</span>
                  <span className="text-card-foreground">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Thank You Message */}
          <div className="border-t border-border pt-6">
            <label className="block text-sm font-medium text-card-foreground mb-2">Thank You Message</label>
            <textarea
              value={thankYouMessage}
              onChange={(e) => setThankYouMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-card-foreground"
              placeholder="Add a personal message to your client..."
            />
          </div>
        </div>
      </div>

      <NavigationGuard />
    </div>
  );
};
