
import React from 'react';
import { X } from 'lucide-react';

interface InvoiceViewModalProps {
  invoice: any;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({ invoice, isOpen, onClose }) => {
  if (!isOpen || !invoice) return null;

  const lineItems = invoice.line_items ? JSON.parse(invoice.line_items) : [];
  const taxAmount = invoice.tax_amount || 0;
  const shippingAmount = invoice.shipping_amount || 0;
  const subtotal = invoice.amount - taxAmount - shippingAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">INVOICE</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Invoice #:</strong> {invoice.invoice_number}</p>
                <p><strong>Date:</strong> {new Date(invoice.created_at).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Draft'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="mb-8">
            <h4 className="font-semibold text-gray-900 mb-2">Bill To:</h4>
            <div className="text-sm text-gray-600">
              <p className="font-medium">{invoice.client_name}</p>
              {invoice.client_email && <p>{invoice.client_email}</p>}
              {invoice.client_phone && <p>{invoice.client_phone}</p>}
              {invoice.client_address && (
                <div className="mt-1">
                  <p>{invoice.client_address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 font-semibold">Description</th>
                  <th className="text-center py-3 font-semibold w-20">Qty</th>
                  <th className="text-right py-3 font-semibold w-24">Rate</th>
                  <th className="text-right py-3 font-semibold w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length > 0 ? lineItems.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-3">{item.description}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">${item.rate?.toFixed(2) || '0.00'}</td>
                    <td className="py-3 text-right font-medium">${item.amount?.toFixed(2) || '0.00'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-3 text-center text-gray-500">No line items available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {shippingAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>${shippingAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${invoice.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
