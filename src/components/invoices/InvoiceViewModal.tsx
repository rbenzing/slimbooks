
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

  // Get template from localStorage or default to modern-blue
  const template = localStorage.getItem('invoiceTemplate') || 'modern-blue';

  const getTemplateStyles = () => {
    switch (template) {
      case 'classic-white':
        return {
          container: 'bg-white dark:bg-gray-800',
          header: 'bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600',
          title: 'text-gray-800 dark:text-gray-100',
          accent: 'text-gray-600 dark:text-gray-300',
          tableHeader: 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500',
          statusColors: {
            paid: 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 border-green-200 dark:border-green-700',
            sent: 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-blue-200 dark:border-blue-700',
            draft: 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'
          }
        };
      case 'professional-gray':
        return {
          container: 'bg-gray-50 dark:bg-gray-800',
          header: 'bg-gray-800 dark:bg-gray-900 text-white',
          title: 'text-white',
          accent: 'text-gray-300 dark:text-gray-400',
          tableHeader: 'bg-gray-200 dark:bg-gray-600 border-gray-400 dark:border-gray-500',
          statusColors: {
            paid: 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-200',
            sent: 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200',
            draft: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-200'
          }
        };
      default: // modern-blue
        return {
          container: 'bg-white dark:bg-gray-800',
          header: 'bg-blue-50 dark:bg-blue-900 border-b-2 border-blue-200 dark:border-blue-700',
          title: 'text-blue-900 dark:text-blue-100',
          accent: 'text-blue-600 dark:text-blue-300',
          tableHeader: 'bg-blue-50 dark:bg-blue-800 border-blue-300 dark:border-blue-600',
          statusColors: {
            paid: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
            sent: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
            draft: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
          }
        };
    }
  };

  const styles = getTemplateStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`${styles.container} rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
        <div className={`flex justify-between items-center p-6 ${styles.header}`}>
          <h2 className={`text-2xl font-bold ${styles.title}`}>Invoice Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className={`text-xl font-bold mb-2 ${styles.title}`}>INVOICE</h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p><strong>Invoice #:</strong> {invoice.invoice_number}</p>
                <p><strong>Date:</strong> {new Date(invoice.created_at).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    invoice.status === 'paid' ? styles.statusColors.paid :
                    invoice.status === 'sent' ? styles.statusColors.sent :
                    styles.statusColors.draft
                  }`}>
                    {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Draft'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="mb-8">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Bill To:</h4>
            <div className="text-sm text-gray-600 dark:text-gray-300">
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
                <tr className={`border-b-2 ${styles.tableHeader}`}>
                  <th className="text-left py-3 font-semibold text-gray-900 dark:text-gray-100">Description</th>
                  <th className="text-center py-3 font-semibold w-20 text-gray-900 dark:text-gray-100">Qty</th>
                  <th className="text-right py-3 font-semibold w-24 text-gray-900 dark:text-gray-100">Rate</th>
                  <th className="text-right py-3 font-semibold w-24 text-gray-900 dark:text-gray-100">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length > 0 ? lineItems.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-200 dark:border-gray-600">
                    <td className="py-3 text-gray-900 dark:text-gray-100">{item.description}</td>
                    <td className="py-3 text-center text-gray-900 dark:text-gray-100">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-900 dark:text-gray-100">${item.rate?.toFixed(2) || '0.00'}</td>
                    <td className="py-3 text-right font-medium text-gray-900 dark:text-gray-100">${item.amount?.toFixed(2) || '0.00'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-3 text-center text-gray-500 dark:text-gray-400">No line items available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="space-y-2 text-gray-900 dark:text-gray-100">
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
                <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${invoice.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Notes:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
