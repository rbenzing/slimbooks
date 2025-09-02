import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { clientOperations, invoiceOperations, templateOperations } from '@/lib/database';
import { ClientSelector } from './ClientSelector';
import { CompanyHeader } from './CompanyHeader';
import { useFormNavigation } from '@/hooks/useFormNavigation';
import { themeClasses } from '@/utils/themeUtils.util';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface CreateRecurringInvoicePageProps {
  onBack: () => void;
  editingTemplate?: any;
}

export const CreateRecurringInvoicePage: React.FC<CreateRecurringInvoicePageProps> = ({ onBack, editingTemplate }) => {
  const { id } = useParams<{ id: string }>();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [templateData, setTemplateData] = useState({
    name: '',
    frequency: 'monthly',
    next_invoice_date: '',
    status: 'active',
    payment_terms: 'net_30'
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, amount: 0 }
  ]);
  const [selectedTaxRate, setSelectedTaxRate] = useState<any>(null);
  const [selectedShippingRate, setSelectedShippingRate] = useState<any>(null);
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [thankYouMessage, setThankYouMessage] = useState('Thank you for your business!');
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [loadedTemplate, setLoadedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { confirmNavigation, NavigationGuard } = useFormNavigation({
    isDirty,
    isEnabled: true,
    entityType: 'template',
    onCancel: onBack
  });



  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const allClients = await clientOperations.getAll();
        setClients(allClients);

        // Load template data if editing (from URL parameter)
        if (id) {
          const template = await templateOperations.getById(parseInt(id));
          if (template) {
            setLoadedTemplate(template);
          }
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
      } catch (error) {
        console.error('Error loading data:', error);
      }
      setLoading(false);
    };

    loadData();
  }, [id]);

  // Load editing template data
  useEffect(() => {
    const loadTemplateData = async () => {
      const template = editingTemplate || loadedTemplate;
      if (template) {
        // Load template data
        setTemplateData({
          name: template.name || '',
          frequency: template.frequency || 'monthly',
          next_invoice_date: template.next_invoice_date || '',
          status: template.status || 'active',
          payment_terms: template.payment_terms || 'net_30'
        });

        // Load client
        if (template.client_id) {
          try {
            const client = await clientOperations.getById(template.client_id);
            setSelectedClient(client);
          } catch (error) {
            console.error('Error loading client:', error);
          }
        }

        // Load line items
        if (template.line_items) {
          try {
            const items = JSON.parse(template.line_items);
            if (items && items.length > 0) {
              setLineItems(items);
            }
          } catch (error) {
            console.error('Error parsing line items:', error);
          }
        } else if (template.description && template.amount) {
          // Fallback: create line item from description and amount
          setLineItems([{
            id: '1',
            description: template.description,
            quantity: 1,
            rate: template.amount,
            amount: template.amount
          }]);
        }

        // Load thank you message
        if (template.notes) {
          setThankYouMessage(template.notes);
        }
      }
    };

    loadTemplateData();
  }, [editingTemplate, loadedTemplate]);

  // Update tax and shipping rates when rates are loaded and we have a template
  useEffect(() => {
    const template = editingTemplate || loadedTemplate;
    if (template && taxRates.length > 0 && shippingRates.length > 0) {
      // Set tax rate if saved in template
      if (template.tax_rate_id) {
        const savedTaxRate = taxRates.find((r: any) => r.id === template.tax_rate_id);
        if (savedTaxRate) {
          setSelectedTaxRate(savedTaxRate);
        }
      }

      // Set shipping rate if saved in template
      if (template.shipping_rate_id) {
        const savedShippingRate = shippingRates.find((r: any) => r.id === template.shipping_rate_id);
        if (savedShippingRate) {
          setSelectedShippingRate(savedShippingRate);
        }
      }
    }
  }, [editingTemplate, loadedTemplate, taxRates, shippingRates]);

  // Track form changes - set dirty when any field changes
  useEffect(() => {
    const template = editingTemplate || loadedTemplate;
    if (template) {
      // For editing, check if current values differ from original template
      const hasChanges =
        templateData.name !== (template.name || '') ||
        templateData.frequency !== (template.frequency || 'monthly') ||
        templateData.next_invoice_date !== (template.next_invoice_date || '') ||
        templateData.status !== (template.status || 'active') ||
        templateData.payment_terms !== (template.payment_terms || 'net_30') ||
        selectedClient?.id !== template.client_id ||
        thankYouMessage !== (template.notes || 'Thank you for your business!') ||
        JSON.stringify(lineItems) !== (template.line_items || JSON.stringify([{ id: '1', description: '', quantity: 1, rate: 0, amount: 0 }]));

      setIsDirty(hasChanges);
    } else {
      // For creating new template, check if any fields have content
      const hasContent =
        selectedClient !== null ||
        templateData.name.trim() !== '' ||
        lineItems.some(item => item.description.trim() !== '');

      setIsDirty(hasContent);
    }
  }, [editingTemplate, loadedTemplate, templateData, selectedClient, lineItems, thankYouMessage]);

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    setLineItems(lineItems.map(item => {
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

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = selectedTaxRate ? subtotal * (selectedTaxRate.rate / 100) : 0;
  const shippingAmount = selectedShippingRate ? selectedShippingRate.amount : 0;
  const total = subtotal + taxAmount + shippingAmount;

  // Validation for save button
  const isValidForSave = () => {
    // Check if client is selected
    if (!selectedClient) return false;
    
    // Check if template name is provided
    if (!templateData.name.trim()) return false;
    
    // Check if at least one line item has a description
    const hasValidLineItems = lineItems.some(item => item.description.trim() !== '');
    if (!hasValidLineItems) return false;
    
    return true;
  };

  const handleSave = async () => {
    if (!isValidForSave()) {
      return;
    }

    const templatePayload = {
      name: templateData.name,
      client_id: selectedClient.id,
      frequency: templateData.frequency,
      amount: total,
      description: lineItems.map(item => item.description).join(', '),
      payment_terms: templateData.payment_terms,
      next_invoice_date: templateData.next_invoice_date,
      line_items: JSON.stringify(lineItems),
      tax_amount: taxAmount,
      tax_rate_id: selectedTaxRate?.id || null,
      shipping_amount: shippingAmount,
      shipping_rate_id: selectedShippingRate?.id || null,
      notes: thankYouMessage
    };



    try {
      const template = editingTemplate || loadedTemplate;
      if (template) {
        await templateOperations.update(template.id, templatePayload);
      } else {
        await templateOperations.create(templatePayload);
      }
      setIsDirty(false); // Reset dirty state after successful save
      onBack();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template. Please try again.');
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
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => confirmNavigation('back')}
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={!isValidForSave()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors"
            >
              {(editingTemplate || loadedTemplate) ? 'Update Template' : 'Save Template'}
            </button>
          </div>
        </div>

        {/* Template Layout */}
        <div className="bg-card rounded-lg shadow-lg p-8 border">
          {/* Company Header */}
          <div className="flex justify-between items-start mb-8">
            <CompanyHeader companyLogo={companyLogo} onLogoUpload={handleLogoUpload} />
            <div className="text-right">
              <h2 className="text-3xl font-bold text-card-foreground mb-2">RECURRING TEMPLATE</h2>
              <div className="space-y-1">
                <div>
                  <label className="text-sm text-muted-foreground">Template Name *</label>
                  <input
                    type="text"
                    value={templateData.name}
                    onChange={(e) => setTemplateData({...templateData, name: e.target.value})}
                    className="block w-full border-0 border-b border-border focus:border-primary focus:ring-0 text-right bg-transparent text-card-foreground"
                    placeholder="Enter template name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Frequency</label>
                  <select
                    value={templateData.frequency}
                    onChange={(e) => setTemplateData({...templateData, frequency: e.target.value})}
                    className="block w-full border-0 border-b border-border focus:border-primary focus:ring-0 text-right bg-transparent text-card-foreground"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Payment Terms</label>
                  <select
                    value={templateData.payment_terms}
                    onChange={(e) => setTemplateData({...templateData, payment_terms: e.target.value})}
                    className="block w-full border-0 border-b border-border focus:border-primary focus:ring-0 text-right bg-transparent text-card-foreground"
                  >
                    <option value="due_on_receipt">Due on Receipt</option>
                    <option value="net_15">Net 15</option>
                    <option value="net_30">Net 30</option>
                    <option value="net_60">Net 60</option>
                    <option value="net_90">Net 90</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Next Invoice Date</label>
                  <input
                    type="date"
                    value={templateData.next_invoice_date}
                    onChange={(e) => setTemplateData({...templateData, next_invoice_date: e.target.value})}
                    className="block w-full border-0 border-b border-border focus:border-primary focus:ring-0 text-right bg-transparent text-card-foreground [color-scheme:light] dark:[color-scheme:dark]"
                  />
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
                        placeholder="Enter description *"
                        className="w-full border-0 focus:ring-0 p-0 bg-transparent text-card-foreground"
                        required
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full text-center border-0 focus:ring-0 p-0 bg-transparent text-card-foreground"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full text-right border-0 focus:ring-0 p-0 bg-transparent text-card-foreground"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="py-3 text-right font-medium text-card-foreground">
                      ${item.amount.toFixed(2)}
                    </td>
                    <td className="py-3">
                      {lineItems.length > 1 && (
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="text-red-400 hover:text-red-600"
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

          {/* Tax and Shipping */}
          <div className="flex justify-between mb-8">
            <div className="w-1/2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">Tax Rate</label>
                <select
                  value={selectedTaxRate?.id || ''}
                  onChange={(e) => {
                    const rate = taxRates.find(r => r.id === e.target.value);
                    setSelectedTaxRate(rate || null);
                  }}
                  className={`w-48 ${themeClasses.select}`}
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
                    const rate = shippingRates.find(r => r.id === e.target.value);
                    setSelectedShippingRate(rate || null);
                  }}
                  className={`w-48 ${themeClasses.select}`}
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
              onChange={(e) => setThankYouMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              placeholder="Add a personal message to your client..."
            />
          </div>
        </div>
      </div>

      <NavigationGuard />
    </div>
  );
};
