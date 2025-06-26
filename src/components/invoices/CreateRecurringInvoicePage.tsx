import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { clientOperations, invoiceOperations, templateOperations } from '@/lib/database';
import { ClientSelector } from './ClientSelector';
import { CompanyHeader } from './CompanyHeader';

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
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [templateData, setTemplateData] = useState({
    name: '',
    frequency: 'monthly',
    next_invoice_date: '',
    status: 'active'
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

  useEffect(() => {
    const allClients = clientOperations.getAll();
    setClients(allClients);
    
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
  }, [editingTemplate]);

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

  const handleSave = () => {
    if (!isValidForSave()) {
      return;
    }

    const templatePayload = {
      name: templateData.name,
      client_id: selectedClient.id,
      frequency: templateData.frequency,
      amount: total,
      description: lineItems.map(item => item.description).join(', '),
      next_invoice_date: templateData.next_invoice_date
    };

    try {
      if (editingTemplate) {
        templateOperations.update(editingTemplate.id, templatePayload);
      } else {
        templateOperations.create(templatePayload);
      }
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={!isValidForSave()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Save Template
            </button>
          </div>
        </div>

        {/* Template Layout */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Company Header */}
          <div className="flex justify-between items-start mb-8">
            <CompanyHeader companyLogo={companyLogo} onLogoUpload={handleLogoUpload} />
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">RECURRING INVOICE TEMPLATE</h2>
              <div className="space-y-1">
                <div>
                  <label className="text-sm text-gray-600">Template Name *</label>
                  <input
                    type="text"
                    value={templateData.name}
                    onChange={(e) => setTemplateData({...templateData, name: e.target.value})}
                    className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 text-right"
                    placeholder="Enter template name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Frequency</label>
                  <select
                    value={templateData.frequency}
                    onChange={(e) => setTemplateData({...templateData, frequency: e.target.value})}
                    className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 text-right"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Next Invoice Date</label>
                  <input
                    type="date"
                    value={templateData.next_invoice_date}
                    onChange={(e) => setTemplateData({...templateData, next_invoice_date: e.target.value})}
                    className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 text-right"
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
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 font-semibold">Description *</th>
                  <th className="text-center py-3 font-semibold w-20">Qty</th>
                  <th className="text-right py-3 font-semibold w-24">Rate</th>
                  <th className="text-right py-3 font-semibold w-24">Amount</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Enter description *"
                        className="w-full border-0 focus:ring-0 p-0"
                        required
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full text-center border-0 focus:ring-0 p-0"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full text-right border-0 focus:ring-0 p-0"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="py-3 text-right font-medium">
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
              className="mt-3 flex items-center text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Line Item
            </button>
          </div>

          {/* Tax and Shipping */}
          <div className="flex justify-between mb-8">
            <div className="w-1/2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate</label>
                <select
                  value={selectedTaxRate?.id || ''}
                  onChange={(e) => {
                    const rate = taxRates.find(r => r.id === e.target.value);
                    setSelectedTaxRate(rate || null);
                  }}
                  className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping</label>
                <select
                  value={selectedShippingRate?.id || ''}
                  onChange={(e) => {
                    const rate = shippingRates.find(r => r.id === e.target.value);
                    setSelectedShippingRate(rate || null);
                  }}
                  className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {selectedTaxRate && selectedTaxRate.rate > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({selectedTaxRate.name}):</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {selectedShippingRate && selectedShippingRate.amount > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping ({selectedShippingRate.name}):</span>
                    <span>${shippingAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Thank You Message */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Thank You Message</label>
            <textarea
              value={thankYouMessage}
              onChange={(e) => setThankYouMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a personal message to your client..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
