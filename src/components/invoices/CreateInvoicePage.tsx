import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Eye, Send, Printer } from 'lucide-react';
import { invoiceOperations } from '@/lib/database';
import { authenticatedFetch } from '@/utils/api';
import { ClientSelector } from './ClientSelector';
import { CompanyHeader } from './CompanyHeader';
import { useFormNavigation } from '@/hooks/useFormNavigation';
import { useNavigate } from 'react-router-dom';
import { themeClasses } from '@/utils/themeUtils.util';
import { validateInvoiceForSave, validateInvoiceForSend, getAvailableInvoiceActions } from '@/utils/data';
import { invoiceService } from '@/services/invoices.svc';
import { pdfService } from '@/services/pdf.svc';
import { getEmailConfigurationStatus } from '@/utils/emailConfig.util';
import { EmailConfigStatus } from '@/types';
import { EmailStatus } from '@/types/domain/invoice.types';
import { toast } from 'sonner';
import { InvoiceType, InvoiceStatus, InvoiceItem } from '@/types';
import { Client } from '@/types';
import { TaxRate, ShippingRate } from '@/types';
import { formatClientAddressSingleLine } from '@/utils/formatting';


interface CreateInvoicePageProps {
  onBack: () => void;
  editingInvoice?: any; // TODO: Type this properly based on Invoice interface
  viewOnly?: boolean;
}

export const CreateInvoicePage: React.FC<CreateInvoicePageProps> = ({ onBack, editingInvoice, viewOnly = false }) => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '',
    due_date: '',
    status: 'draft'
  });
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([
    { id: 1, description: '', quantity: 1, unit_price: 0, total: 0 }
  ]);
  const [selectedTaxRate, setSelectedTaxRate] = useState<TaxRate | null>(null);
  const [selectedShippingRate, setSelectedShippingRate] = useState<ShippingRate | null>(null);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [thankYouMessage, setThankYouMessage] = useState('Thank you for your business!');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [originalFormData, setOriginalFormData] = useState<any>(null); // TODO: Create proper interface for form data
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [emailConfig, setEmailConfig] = useState<EmailConfigStatus | null>(null);

  // Track if form has been modified
  const currentState = {
    selectedClient: selectedClient?.id || null,
    invoiceData,
    lineItems,
    selectedTaxRate: selectedTaxRate?.id || null,
    selectedShippingRate: selectedShippingRate?.id || null,
    thankYouMessage
  };
  const isDirty = originalFormData ?
    JSON.stringify(currentState) !== JSON.stringify(originalFormData) :
    // For new invoices, check if any meaningful fields have content
    selectedClient !== null ||
    lineItems.some(item => item.description.trim() !== '') ||
    thankYouMessage !== 'Thank you for your business!';
  
  const { confirmNavigation, NavigationGuard } = useFormNavigation({
    isDirty,
    isEnabled: !viewOnly,
    entityType: 'invoice'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await authenticatedFetch('/api/clients');
        const clientsData = await response.json();
        const allClients = clientsData.data;
        setClients(allClients);

        // Load tax rates from settings
        const savedTaxRates = localStorage.getItem('tax_rates');
        if (savedTaxRates) {
          const rates = JSON.parse(savedTaxRates);
          setTaxRates(rates as TaxRate[]);
          setSelectedTaxRate((rates as TaxRate[]).find((r: TaxRate) => r.isDefault) || (rates as TaxRate[])[0]);
        }

        // Load shipping rates from settings
        const savedShippingRates = localStorage.getItem('shipping_rates');
        if (savedShippingRates) {
          const rates = JSON.parse(savedShippingRates);
          setShippingRates(rates as ShippingRate[]);
          setSelectedShippingRate((rates as ShippingRate[]).find((r: ShippingRate) => r.isDefault) || (rates as ShippingRate[])[0]);
        }

        // Load email configuration
        const emailConfigStatus = await getEmailConfigurationStatus();
        setEmailConfig(emailConfigStatus);

        // Load existing invoice data if editing
        if (editingInvoice) {
          setInvoiceData({
            invoice_number: editingInvoice.invoice_number || '',
            due_date: editingInvoice.due_date || '',
            status: editingInvoice.status || 'draft'
          });

          // Find and set the client
          const client = allClients.find(c => c.id === editingInvoice.client_id);
          if (client) {
            setSelectedClient(client);
          }

          // Parse line items from description (basic implementation)
          // In a real app, you'd store line items separately
          if (editingInvoice.description) {
            const descriptions = editingInvoice.description.split(', ');
            const items = descriptions.map((desc: string, index: number) => ({
              id: index + 1,
              description: desc,
              quantity: 1,
              unit_price: editingInvoice.amount / descriptions.length,
              total: editingInvoice.amount / descriptions.length
            }));
            setLineItems(items);
          }
        } else {
          const tempNumber = await invoiceService.generateTemporaryInvoiceNumber();
          setInvoiceData(prev => ({
            ...prev,
            invoice_number: tempNumber
          }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();

    // Set original form data for dirty checking only when editing
    if (editingInvoice) {
      setTimeout(() => {
        setOriginalFormData({
          selectedClient: selectedClient?.id || null,
          invoiceData,
          lineItems,
          selectedTaxRate: selectedTaxRate?.id || null,
          selectedShippingRate: selectedShippingRate?.id || null,
          thankYouMessage
        });
      }, 100);
    }
  }, [editingInvoice]);

  const addLineItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now(),
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: number, field: keyof InvoiceItem, value: string | number) => {
    setLineItems(lineItems.map(item => {
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

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = selectedTaxRate ? subtotal * (selectedTaxRate.rate / 100) : 0;
  const shippingAmount = selectedShippingRate ? selectedShippingRate.amount : 0;
  const total = subtotal + taxAmount + shippingAmount;

  // Validation for save button
  const isValidForSave = () => {
    const validation = validateInvoiceForSave(invoiceData, selectedClient, lineItems, !editingInvoice);
    return validation.isValid;
  };

  const isValidForSend = () => {
    const validation = validateInvoiceForSend(invoiceData, selectedClient, lineItems, !editingInvoice);
    return validation.canSend;
  };

  const getActionAvailability = () => {
    return getAvailableInvoiceActions(invoiceData, selectedClient, lineItems, !editingInvoice);
  };

  const handleBackClick = () => {
    if (viewOnly) {
      navigate('/invoices');
    } else {
      confirmNavigation('/invoices');
    }
  };

  const handleSave = async () => {
    if (!isValidForSave() || viewOnly || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      // Auto-fill due date if not set (same logic as handleSendInvoice)
      const updatedInvoiceData = { ...invoiceData };
      if (!updatedInvoiceData.due_date || updatedInvoiceData.due_date.trim() === '') {
        updatedInvoiceData.due_date = new Date().toISOString().split('T')[0];
        // Update the state so user sees the auto-filled date
        setInvoiceData(updatedInvoiceData);
      }

      const basePayload = {
        client_id: selectedClient.id,
        amount: subtotal,
        total_amount: total,
        issue_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        description: lineItems.map(item => item.description).join(', '),
        type: 'one-time' as InvoiceType,
        status: updatedInvoiceData.status as InvoiceStatus,
        due_date: updatedInvoiceData.due_date,
        client_name: selectedClient.name,
        client_email: selectedClient.email,
        client_phone: selectedClient.phone,
        client_address: formatClientAddressSingleLine(selectedClient),
        line_items: JSON.stringify(lineItems),
        tax_amount: taxAmount,
        tax_rate_id: selectedTaxRate?.id || null,
        shipping_amount: shippingAmount,
        shipping_rate_id: selectedShippingRate?.id || null,
        notes: thankYouMessage,
        email_status: 'not_sent' as EmailStatus
      };

      // For updates, include the invoice number; for creates, let server auto-generate
      const invoicePayload = editingInvoice
        ? { ...basePayload, invoice_number: updatedInvoiceData.invoice_number }
        : basePayload;

      if (editingInvoice) {
        // Update existing invoice via API
        const response = await authenticatedFetch(`/api/invoices/${editingInvoice.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ invoiceData: invoicePayload }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update invoice: ${response.statusText}`);
        }

        toast.success('Invoice updated successfully');
      } else {
        // Create new invoice via API (server will auto-generate invoice number)
        const response = await authenticatedFetch('/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ invoiceData: invoicePayload }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create invoice: ${response.statusText}`);
        }

        const result = await response.json();
        const createdInvoice = result.data;

        // Update editingInvoice state so the UI knows it's saved
        setEditingInvoice(createdInvoice);

        toast.success('Invoice saved successfully');
      }

      // Don't navigate away - stay on the page so user can print or send
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Error saving invoice. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!isValidForSend() || viewOnly || isSending) {
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

      // Create invoice payload
      const invoicePayload = {
        ...updatedInvoiceData,
        client_id: selectedClient.id,
        amount: subtotal,
        total_amount: total,
        issue_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        description: lineItems.map(item => item.description).join(', '),
        type: 'one-time' as InvoiceType,
        client_name: selectedClient.name,
        client_email: selectedClient.email,
        client_phone: selectedClient.phone,
        client_address: formatClientAddressSingleLine(selectedClient),
        line_items: JSON.stringify(lineItems),
        tax_amount: taxAmount,
        tax_rate_id: selectedTaxRate?.id || null,
        shipping_amount: shippingAmount,
        shipping_rate_id: selectedShippingRate?.id || null,
        notes: thankYouMessage,
        status: 'sent' as InvoiceStatus,
        email_status: 'sent' as EmailStatus
      };

      let invoiceId: number;

      if (editingInvoice) {
        await invoiceOperations.update(editingInvoice.id, invoicePayload);
        invoiceId = editingInvoice.id;
      } else {
        // Generate a proper invoice number when creating new invoices
        const generatedNumber = await invoiceService.generateInvoiceNumber();
        const finalInvoicePayload = {
          ...invoicePayload,
          invoice_number: generatedNumber
        };
        const result = await invoiceOperations.create(finalInvoicePayload);
        invoiceId = result.lastInsertRowid;
      }

      // Update email status to sending
      await invoiceService.updateEmailStatus(invoiceId, 'sending');

      // Send email
      const emailResult = await invoiceService.sendInvoiceEmail({
        id: invoiceId,
        invoice_number: updatedInvoiceData.invoice_number,
        client_name: selectedClient.name,
        client_email: selectedClient.email,
        amount: total,
        due_date: updatedInvoiceData.due_date,
        status: 'sent',
        notes: thankYouMessage
      });

      if (emailResult.success) {
        await invoiceService.markInvoiceAsSent(invoiceId);
        toast.success('Invoice sent successfully');
      } else {
        await invoiceService.updateEmailStatus(invoiceId, 'failed', emailResult.message);
        toast.error(`Failed to send invoice: ${emailResult.message}`);
      }

      navigate('/invoices');
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Error sending invoice. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePrintInvoice = async () => {
    if (!editingInvoice?.id || viewOnly) {
      return;
    }

    try {
      await pdfService.downloadInvoicePDF(
        editingInvoice.id,
        editingInvoice.invoice_number
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (viewOnly) return;
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanyLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackClick}
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </button>
          {!viewOnly && (
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                disabled={!isValidForSave() || isSaving}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : (editingInvoice ? 'Update Invoice' : 'Save Invoice')}
              </button>

              {/* Print button in header - only show after invoice is saved */}
              {editingInvoice?.id && (
                <button
                  onClick={handlePrintInvoice}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Invoice
                </button>
              )}

              {(() => {
                const actions = getActionAvailability();
                const hasClientEmail = selectedClient?.email && selectedClient.email.trim() !== '';
                const isInvoiceAlreadySent = editingInvoice?.status === 'sent';
                const canSendEmails = emailConfig?.canSendEmails ?? false;

                // Show send button only if:
                // 1. Client has email
                // 2. Email is configured
                // 3. Invoice is not already sent
                const shouldShowSendButton = hasClientEmail && canSendEmails && !isInvoiceAlreadySent;

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
                } else {
                  // Show print button as fallback with tooltip explaining why send is not available
                  let tooltipMessage = '';
                  if (!hasClientEmail) {
                    tooltipMessage = 'Client email is required to send invoices';
                  } else if (!canSendEmails) {
                    tooltipMessage = 'Email settings need to be configured in Settings to send invoices';
                  } else if (isInvoiceAlreadySent) {
                    tooltipMessage = 'Invoice has already been sent';
                  }

                  // Determine print button tooltip
                  const printTooltipMessage = !editingInvoice?.id ? 'Save invoice first to enable printing' : '';
                  const showTooltip = tooltipMessage || printTooltipMessage;

                  return (
                    <div className="relative group">
                      <button
                        onClick={handlePrintInvoice}
                        disabled={!editingInvoice?.id}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Invoice
                      </button>
                      {showTooltip && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          {tooltipMessage || printTooltipMessage}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </div>
                  );
                }
              })()}
            </div>
          )}
          {viewOnly && (
            <div className="flex items-center text-primary">
              <Eye className="h-4 w-4 mr-2" />
              <span className="font-medium">View Mode</span>
            </div>
          )}
        </div>

        {/* Invoice Layout */}
        <div className="bg-card rounded-lg shadow-lg p-8 border">
          {/* Company Header */}
          <div className="flex justify-between items-start mb-8">
            <CompanyHeader companyLogo={companyLogo} onLogoUpload={viewOnly ? undefined : handleLogoUpload} />
            <div className="text-right">
              <h2 className="text-3xl font-bold text-card-foreground mb-2">INVOICE</h2>
              <div className="space-y-1">
                <div>
                  <label className="text-sm text-muted-foreground">Invoice # *</label>
                  <input
                    type="text"
                    value={invoiceData.invoice_number}
                    onChange={(e) => !viewOnly && editingInvoice && setInvoiceData({...invoiceData, invoice_number: e.target.value})}
                    className={`block w-full border-0 border-b border-border focus:border-primary focus:ring-0 text-right bg-transparent text-card-foreground ${viewOnly || !editingInvoice ? 'bg-muted cursor-not-allowed' : ''}`}
                    required
                    disabled={viewOnly || !editingInvoice}
                    placeholder={!editingInvoice ? 'Auto-generated' : ''}
                  />
                  {!editingInvoice && (
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      Invoice number will be auto-generated when saved
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Due Date</label>
                  <input
                    type="date"
                    value={invoiceData.due_date}
                    onChange={(e) => !viewOnly && setInvoiceData({...invoiceData, due_date: e.target.value})}
                    className={`block w-full border-0 border-b border-border focus:border-primary focus:ring-0 text-right bg-transparent text-card-foreground [color-scheme:light] dark:[color-scheme:dark] ${viewOnly ? 'bg-muted' : ''}`}
                    disabled={viewOnly}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <select
                    value={invoiceData.status}
                    onChange={(e) => !viewOnly && setInvoiceData({...invoiceData, status: e.target.value})}
                    className={`block w-full border-0 border-b border-border focus:border-primary focus:ring-0 text-right bg-transparent text-card-foreground ${viewOnly ? 'bg-muted' : ''}`}
                    disabled={viewOnly}
                  >
                    <option value="draft" className="bg-background text-foreground">Draft</option>
                    <option value="sent" className="bg-background text-foreground">Sent</option>
                    <option value="paid" className="bg-background text-foreground">Paid</option>
                    <option value="overdue" className="bg-background text-foreground">Overdue</option>
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
              onClientSelect={viewOnly ? () => {} : setSelectedClient}
              disabled={viewOnly}
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
                  {!viewOnly && <th className="w-8"></th>}
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-border">
                    <td className="py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => !viewOnly && updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Enter description *"
                        className={`w-full border-0 focus:ring-0 p-0 bg-transparent text-card-foreground ${viewOnly ? 'bg-muted' : ''}`}
                        required
                        disabled={viewOnly}
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => !viewOnly && updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className={`w-full text-center border-0 focus:ring-0 p-0 bg-transparent text-card-foreground ${viewOnly ? 'bg-muted' : ''}`}
                        min="0"
                        step="0.01"
                        disabled={viewOnly}
                      />
                    </td>
                    <td className="py-3 text-right">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => !viewOnly && updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        className={`w-full text-right border-0 focus:ring-0 p-0 bg-transparent text-card-foreground ${viewOnly ? 'bg-muted' : ''}`}
                        min="0"
                        step="0.01"
                        disabled={viewOnly}
                      />
                    </td>
                    <td className="py-3 text-right font-medium text-card-foreground">
                      ${item.total.toFixed(2)}
                    </td>
                    {!viewOnly && (
                      <td className="py-3">
                        {lineItems.length > 1 && (
                          <button
                            onClick={() => removeLineItem(item.id)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {!viewOnly && (
              <button
                onClick={addLineItem}
                className="mt-3 flex items-center text-primary hover:text-primary/80"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Line Item
              </button>
            )}
          </div>

          {/* Tax and Shipping */}
          <div className="flex justify-between mb-8">
            <div className="w-1/2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">Tax Rate</label>
                <select
                  value={selectedTaxRate?.id || ''}
                  onChange={(e) => {
                    if (!viewOnly) {
                      const rate = taxRates.find(r => r.id === e.target.value);
                      setSelectedTaxRate(rate || null);
                    }
                  }}
                  className={`w-48 ${themeClasses.select} ${viewOnly ? 'bg-muted' : ''}`}
                  disabled={viewOnly}
                >
                  <option value="">No Tax</option>
                  {taxRates.map((rate) => (
                    <option key={rate.id} value={rate.id}>
                      {rate.name} ({rate.rate}%)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">Shipping</label>
                <select
                  value={selectedShippingRate?.id || ''}
                  onChange={(e) => {
                    if (!viewOnly) {
                      const rate = shippingRates.find(r => r.id === e.target.value);
                      setSelectedShippingRate(rate || null);
                    }
                  }}
                  className={`w-48 ${themeClasses.select} ${viewOnly ? 'bg-muted' : ''}`}
                  disabled={viewOnly}
                >
                  <option value="">No Shipping</option>
                  {shippingRates.map((rate) => (
                    <option key={rate.id} value={rate.id}>
                      {rate.name} (${rate.amount.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="w-64">
              <div className="space-y-2">
                <div className="flex justify-between text-card-foreground">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {selectedTaxRate && selectedTaxRate.rate > 0 && (
                  <div className="flex justify-between text-card-foreground">
                    <span>Tax ({selectedTaxRate.name}):</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {selectedShippingRate && selectedShippingRate.amount > 0 && (
                  <div className="flex justify-between text-card-foreground">
                    <span>Shipping ({selectedShippingRate.name}):</span>
                    <span>${shippingAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between font-bold text-lg text-card-foreground">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Thank You Message */}
          <div className="border-t border-border pt-6">
            <label className="block text-sm font-medium text-card-foreground mb-2">Thank You Message</label>
            <textarea
              value={thankYouMessage}
              onChange={(e) => !viewOnly && setThankYouMessage(e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground ${viewOnly ? 'bg-muted' : ''}`}
              placeholder="Add a personal message to your client..."
              disabled={viewOnly}
            />
          </div>
        </div>
      </div>
      
      {!viewOnly && <NavigationGuard />}
    </div>
  );
};
