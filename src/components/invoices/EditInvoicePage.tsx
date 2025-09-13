
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Plus, X, Send, Printer } from 'lucide-react';
import { invoiceOperations, clientOperations } from '@/lib/database';
import { ClientSelector } from './ClientSelector';
import { CompanyHeader } from './CompanyHeader';
import { useFormNavigation } from '@/hooks/useFormNavigation';
import { validateInvoiceForSave, validateInvoiceForSend, autoFillInvoiceDefaults, getInvoiceStatusPermissions } from '@/utils/invoiceValidation';
import { invoiceService } from '@/services/invoices.svc';
import { pdfService } from '@/services/pdf.svc';
import { getEmailConfigurationStatus } from '@/utils/emailConfigUtils';
import { EmailConfigStatus } from '@/types';
import { toast } from 'sonner';
import { InvoiceItem, Invoice, InvoiceStatus } from '@/types';
import { Client } from '@/types';
import { TaxRate, ShippingRate, validateTaxRateArray } from '@/types';

export const EditInvoicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [invoiceData, setInvoiceData] = useState<{
    invoice_number: string;
    due_date: string;
    status: InvoiceStatus;
  }>({
    invoice_number: '',
    due_date: '',
    status: 'draft'
  });
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([
    { id: 1, description: '', quantity: 1, unit_price: 0, total: 0 }
  ]);
  const [companyLogo, setCompanyLogo] = useState('');
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [selectedTaxRate, setSelectedTaxRate] = useState<TaxRate | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShippingRate, setSelectedShippingRate] = useState<ShippingRate | null>(null);
  const [thankYouMessage, setThankYouMessage] = useState('Thank you for your business!');
  const [isDirty, setIsDirty] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [emailConfig, setEmailConfig] = useState<EmailConfigStatus | null>(null);

  const { confirmNavigation, NavigationGuard } = useFormNavigation({
    isDirty,
    isEnabled: true,
    entityType: 'invoice'
  });

  useEffect(() => {
    const loadInvoiceData = async () => {
      if (id) {
        try {
          // Load invoice data
          const invoiceRecord = await invoiceOperations.getById(parseInt(id));

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
                  { id: 1, description: invoiceRecord.description || '', quantity: 1, unit_price: invoiceRecord.amount || 0, total: invoiceRecord.amount || 0 }
                ]);
              } catch (e) {
                // Fallback to single line item from description and amount
                setLineItems([
                  { id: 1, description: invoiceRecord.description || '', quantity: 1, unit_price: invoiceRecord.amount || 0, total: invoiceRecord.amount || 0 }
                ]);
              }
            } else {
              // Fallback to single line item from description and amount
              setLineItems([
                { id: 1, description: invoiceRecord.description || '', quantity: 1, unit_price: invoiceRecord.amount || 0, total: invoiceRecord.amount || 0 }
              ]);
            }

            // Set thank you message
            setThankYouMessage(invoiceRecord.notes || 'Thank you for your business!');

            // Load all clients first
            const allClients = await clientOperations.getAll();
            setClients(allClients);

            // Find and set the client
            const client = allClients.find(c => c.id === invoiceRecord.client_id);
            if (client) {
              setSelectedClient(client);
            }

            // Load settings with invoice data to set correct tax/shipping rates
            await loadSettings(invoiceRecord);
          }
        } catch (error) {
          console.error('Error loading invoice data:', error);
        }
        setLoading(false);
      }
    };

    const loadSettings = async (invoiceRecord?: Invoice) => {
      try {
        // Load tax rates from SQLite settings
        const { sqliteService } = await import('@/services/sqlite.svc');
        if (sqliteService.isReady()) {
          const savedTaxRates = await sqliteService.getSetting('tax_rates');
          if (savedTaxRates) {
            setTaxRates(savedTaxRates as TaxRate[]);
            // If invoice has a saved tax rate ID, use that; otherwise use default
            if (invoiceRecord?.tax_rate_id) {
              const savedTaxRate = (savedTaxRates as TaxRate[]).find((r: TaxRate) => r.id === invoiceRecord.tax_rate_id);
              setSelectedTaxRate(savedTaxRate || null);
            } else {
              setSelectedTaxRate((savedTaxRates as TaxRate[]).find((r: TaxRate) => r.isDefault) || (savedTaxRates as TaxRate[])[0]);
            }
          }

          // Load shipping rates from SQLite settings
          const savedShippingRates = await sqliteService.getSetting('shipping_rates');
          if (savedShippingRates) {
            setShippingRates(savedShippingRates as ShippingRate[]);
            // If invoice has a saved shipping rate ID, use that; otherwise use default
            if (invoiceRecord?.shipping_rate_id) {
              const savedShippingRate = (savedShippingRates as ShippingRate[]).find((r: ShippingRate) => r.id === invoiceRecord.shipping_rate_id);
              setSelectedShippingRate(savedShippingRate || null);
            } else {
              setSelectedShippingRate((savedShippingRates as ShippingRate[]).find((r: ShippingRate) => r.isDefault) || (savedShippingRates as ShippingRate[])[0]);
            }
          }

          // Load email configuration
          const emailConfigStatus = await getEmailConfigurationStatus();
          setEmailConfig(emailConfigStatus);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadInvoiceData();
  }, [id]);

  // Track form changes
  useEffect(() => {
    if (invoice) {
      const hasChanges =
        invoiceData.status !== (invoice.status || 'draft') ||
        invoiceData.due_date !== (invoice.due_date || '') ||
        invoiceData.invoice_number !== (invoice.invoice_number || '') ||
        selectedClient?.id !== invoice.client_id ||
        JSON.stringify(lineItems) !== (invoice.line_items || JSON.stringify([{ id: 1, description: invoice.description || '', quantity: 1, unit_price: invoice.amount || 0, total: invoice.amount || 0 }]));

      setIsDirty(hasChanges);
    }
  }, [invoiceData, selectedClient, invoice, lineItems]);

  // Helper function to map InvoiceItem to LineItem format for validation
  const mapInvoiceItemsToLineItems = (items: InvoiceItem[]) => {
    return items.map(item => ({
      id: item.id?.toString() || '1',
      description: item.description,
      quantity: item.quantity,
      rate: item.unit_price,
      amount: item.total
    }));
  };

  // Validation functions
  const isValidForSave = () => {
    const validation = validateInvoiceForSave(invoiceData, selectedClient, mapInvoiceItemsToLineItems(lineItems));
    return validation.isValid;
  };

  const isValidForSend = () => {
    const validation = validateInvoiceForSend(invoiceData, selectedClient, mapInvoiceItemsToLineItems(lineItems));
    return validation.canSend;
  };

  const getStatusPermissions = () => {
    if (!invoice) return { canEdit: true, canSave: true, canSend: true, canDelete: true, showDeleteOnly: false };
    return getInvoiceStatusPermissions(invoice.status, invoice.due_date);
  };

  const handleSave = async () => {
    if (!isValidForSave() || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      // Calculate total amount from line items
      const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = selectedTaxRate ? (subtotal * selectedTaxRate.rate) / 100 : 0;
      const shippingAmount = selectedShippingRate ? selectedShippingRate.amount : 0;
      const total = subtotal + taxAmount + shippingAmount;

      const updatedInvoice = {
        invoice_number: invoiceData.invoice_number,
        client_id: selectedClient.id,
        template_id: invoice.template_id,
        amount: subtotal,
        total_amount: total,
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
        tax_rate_id: selectedTaxRate?.id || null,
        shipping_amount: shippingAmount,
        shipping_rate_id: selectedShippingRate?.id || null,
        notes: thankYouMessage
      };

      await invoiceOperations.update(parseInt(id!), updatedInvoice);
      setIsDirty(false);
      toast.success('Invoice updated successfully');

      // Navigate back to the appropriate page based on invoice type
      if (invoice.template_id) {
        navigate('/invoices#templates');
      } else {
        navigate('/invoices');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Error updating invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!isValidForSend() || isSending) {
      return;
    }

    setIsSending(true);
    try {
      // Auto-fill due date if not set
      const updatedInvoiceData = { ...invoiceData };
      if (!updatedInvoiceData.due_date || updatedInvoiceData.due_date.trim() === '') {
        updatedInvoiceData.due_date = new Date().toISOString().split('T')[0];
        // Update the state so user sees the auto-filled date
        setInvoiceData(updatedInvoiceData);
      }

      // Calculate total amount from line items
      const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = selectedTaxRate ? (subtotal * selectedTaxRate.rate) / 100 : 0;
      const shippingAmount = selectedShippingRate ? selectedShippingRate.amount : 0;
      const total = subtotal + taxAmount + shippingAmount;

      const updatedInvoice = {
        invoice_number: updatedInvoiceData.invoice_number,
        client_id: selectedClient.id,
        template_id: invoice.template_id,
        amount: total,
        status: 'sent' as InvoiceStatus,
        due_date: updatedInvoiceData.due_date,
        description: lineItems.map(item => item.description).join(', '),
        stripe_invoice_id: invoice.stripe_invoice_id,
        type: invoice.type,
        client_name: selectedClient.name,
        client_email: selectedClient.email,
        client_phone: selectedClient.phone,
        client_address: `${selectedClient.address}, ${selectedClient.city}, ${selectedClient.state} ${selectedClient.zipCode}`,
        line_items: JSON.stringify(lineItems),
        tax_amount: taxAmount,
        tax_rate_id: selectedTaxRate?.id || null,
        shipping_amount: shippingAmount,
        shipping_rate_id: selectedShippingRate?.id || null,
        notes: thankYouMessage
      };

      await invoiceOperations.update(parseInt(id!), updatedInvoice);

      // Update email status to sending
      await invoiceService.updateEmailStatus(parseInt(id!), 'sending');

      // Send email
      const emailResult = await invoiceService.sendInvoiceEmail({
        id: parseInt(id!),
        invoice_number: updatedInvoiceData.invoice_number,
        client_name: selectedClient.name,
        client_email: selectedClient.email,
        amount: total,
        due_date: updatedInvoiceData.due_date,
        status: 'sent',
        notes: thankYouMessage
      });

      if (emailResult.success) {
        await invoiceService.markInvoiceAsSent(parseInt(id!));
        toast.success('Invoice sent successfully');
      } else {
        await invoiceService.updateEmailStatus(parseInt(id!), 'failed', emailResult.message);
        toast.error(`Failed to send invoice: ${emailResult.message}`);
      }

      setIsDirty(false);

      // Navigate back to the appropriate page based on invoice type
      if (invoice.template_id) {
        navigate('/invoices#templates');
      } else {
        navigate('/invoices');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Error sending invoice');
    } finally {
      setIsSending(false);
    }
  };

  const handlePrintInvoice = async () => {
    if (!isValidForSave()) {
      return;
    }

    try {
      await pdfService.downloadInvoicePDF(
        invoice.id,
        invoice.invoice_number
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoiceOperations.delete(parseInt(id!));
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
  const updateLineItem = (id: number, field: keyof InvoiceItem, value: string | number) => {
    setLineItems(items => items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total = updatedItem.quantity * updatedItem.unit_price;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const addLineItem = () => {
    const newId = lineItems.length + 1;
    setLineItems([...lineItems, { id: newId, description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeLineItem = (id: number) => {
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
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = selectedTaxRate ? (subtotal * selectedTaxRate.rate) / 100 : 0;
  const shippingAmount = selectedShippingRate ? selectedShippingRate.amount : 0;
  const total = subtotal + taxAmount + shippingAmount;

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
            {(() => {
              const permissions = getStatusPermissions();
              const hasClientEmail = selectedClient?.email && selectedClient.email.trim() !== '';

              return (
                <>
                  {permissions.canDelete && (
                    <button
                      onClick={handleDelete}
                      className="flex items-center px-4 py-2 text-destructive border border-destructive rounded-lg hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  )}

                  {permissions.canSave && (
                    <button
                      onClick={handleSave}
                      disabled={!isValidForSave() || isSaving}
                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors"
                    >
                      {isSaving ? 'Saving...' : 'Save Invoice'}
                    </button>
                  )}

                  {(() => {
                    const canSendEmails = emailConfig?.canSendEmails ?? false;
                    const isInvoiceAlreadySent = invoice?.status === 'sent';

                    // Show send button only if:
                    // 1. Permissions allow sending
                    // 2. Client has email
                    // 3. Email is configured
                    // 4. Invoice is not already sent (unless we want to allow resending)
                    const shouldShowSendButton = permissions.canSend && hasClientEmail && canSendEmails && !isInvoiceAlreadySent;

                    if (shouldShowSendButton) {
                      return (
                        <button
                          onClick={handleSendInvoice}
                          disabled={!isValidForSend() || isSending}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isSending ? 'Sending...' : 'Send Invoice'}
                        </button>
                      );
                    } else if (hasClientEmail || !canSendEmails) {
                      // Show print button as fallback with tooltip explaining why send is not available
                      let tooltipMessage = '';
                      if (!hasClientEmail) {
                        tooltipMessage = 'Client email is required to send invoices';
                      } else if (!canSendEmails) {
                        tooltipMessage = 'Email settings need to be configured in Settings to send invoices';
                      } else if (isInvoiceAlreadySent) {
                        tooltipMessage = 'Invoice has already been sent';
                      }

                      return (
                        <div className="relative group">
                          <button
                            onClick={handlePrintInvoice}
                            disabled={!isValidForSave()}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors flex items-center"
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Print Invoice
                          </button>
                          {tooltipMessage && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                              {tooltipMessage}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </>
              );
            })()}
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
                    className="block w-full border-0 border-b-2 border-border dark:border-gray-500 focus:border-primary focus:ring-0 text-right bg-transparent text-card-foreground"
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
                    className="block w-full border-0 border-b-2 border-border dark:border-gray-500 focus:border-primary focus:ring-0 text-right bg-transparent text-card-foreground [color-scheme:light] dark:[color-scheme:dark]"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <select
                    value={invoiceData.status}
                    onChange={(e) => setInvoiceData({...invoiceData, status: e.target.value as InvoiceStatus})}
                    className="block w-full border-0 border-b-2 border-border dark:border-gray-500 focus:border-primary focus:ring-0 text-right bg-transparent text-card-foreground"
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
                <tr className="border-b-2 border-border dark:border-gray-500">
                  <th className="text-left py-3 font-semibold text-card-foreground">Description *</th>
                  <th className="text-center py-3 font-semibold w-20 text-card-foreground">Qty</th>
                  <th className="text-right py-3 font-semibold w-24 text-card-foreground">Rate</th>
                  <th className="text-right py-3 font-semibold w-24 text-card-foreground">Amount</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-border dark:border-gray-600">
                    <td className="py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        className="w-full border-0 border-b border-gray-300 dark:border-gray-500 focus:border-primary focus:ring-0 bg-transparent text-card-foreground"
                        placeholder="Item description"
                        required
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-16 text-center border-0 border-b border-gray-300 dark:border-gray-500 focus:border-primary focus:ring-0 bg-transparent text-card-foreground"
                        min="0"
                        step="1"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-20 text-right border-0 border-b border-gray-300 dark:border-gray-500 focus:border-primary focus:ring-0 bg-transparent text-card-foreground"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="py-3 text-right text-card-foreground">
                      ${item.total.toFixed(2)}
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

              <div className="border-t-2 border-border dark:border-gray-500 pt-2 mt-2">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span className="text-card-foreground">Total:</span>
                  <span className="text-card-foreground">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Thank You Message */}
          <div className="border-t-2 border-border dark:border-gray-500 pt-6">
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
