import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Download, Eye, AlertTriangle } from 'lucide-react';
import { invoiceOperations } from '@/lib/database';
import { CompanyHeader } from './invoices/CompanyHeader';
import { themeClasses } from '@/lib/utils';
import { formatDateSync } from '@/components/ui/FormattedDate';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export const PublicInvoiceView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [invoice, setInvoice] = useState<any>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string>('');

  useEffect(() => {
    const loadInvoice = async () => {
      if (!id || !token) {
        setError('Invalid invoice link');
        setLoading(false);
        return;
      }

      try {
        // Verify token and load invoice
        const isValidToken = await verifyInvoiceToken(id, token);
        if (!isValidToken) {
          setError('Invalid or expired link');
          setLoading(false);
          return;
        }

        const invoiceRecord = await invoiceOperations.getById(parseInt(id));
        if (!invoiceRecord) {
          setError('Invoice not found');
          setLoading(false);
          return;
        }

        setInvoice(invoiceRecord);

        // Parse line items
        if (invoiceRecord.line_items) {
          try {
            const parsedLineItems = JSON.parse(invoiceRecord.line_items);
            setLineItems(parsedLineItems.length > 0 ? parsedLineItems : [
              { id: '1', description: invoiceRecord.description || '', quantity: 1, rate: invoiceRecord.amount || 0, amount: invoiceRecord.amount || 0 }
            ]);
          } catch (e) {
            setLineItems([
              { id: '1', description: invoiceRecord.description || '', quantity: 1, rate: invoiceRecord.amount || 0, amount: invoiceRecord.amount || 0 }
            ]);
          }
        }

        // Load company logo
        const { sqliteService } = await import('@/lib/sqlite-service');
        if (sqliteService.isReady()) {
          const companySettings = await sqliteService.getSetting('company_settings');
          if (companySettings?.brandingImage) {
            setCompanyLogo(companySettings.brandingImage);
          }
        }

      } catch (error) {
        console.error('Error loading invoice:', error);
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [id, token]);

  const verifyInvoiceToken = async (invoiceId: string, token: string): Promise<boolean> => {
    // Simple token verification - in production, this should be more secure
    // For now, we'll use a simple hash of invoice ID + a secret
    const expectedToken = btoa(`invoice-${invoiceId}-${new Date().toDateString()}`);
    return token === expectedToken;
  };

  const generateInvoiceToken = (invoiceId: string): string => {
    return btoa(`invoice-${invoiceId}-${new Date().toDateString()}`);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = invoice?.tax_amount || 0;
  const shippingAmount = invoice?.shipping_amount || 0;
  const total = subtotal + taxAmount + shippingAmount;

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation
    console.log('Download PDF functionality to be implemented');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-card-foreground mb-2">Unable to Load Invoice</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact the sender for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with actions */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-card-foreground">Invoice {invoice.invoice_number}</h1>
            <p className="text-sm text-muted-foreground">
              From {invoice.client_name || 'Unknown Client'}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-card rounded-lg shadow-lg p-8 border">
          {/* Company Header */}
          <div className="flex justify-between items-start mb-8">
            <CompanyHeader companyLogo={companyLogo} />
            <div className="text-right">
              <h2 className="text-3xl font-bold text-card-foreground mb-2">INVOICE</h2>
              <div className="space-y-1">
                <div>
                  <span className="text-sm text-muted-foreground">Invoice # </span>
                  <span className="font-medium text-card-foreground">{invoice.invoice_number}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Due Date: </span>
                  <span className="font-medium text-card-foreground">{formatDateSync(invoice.due_date)}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status: </span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    invoice.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    invoice.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Bill To:</h3>
            <div className="text-muted-foreground">
              <div className="font-medium text-card-foreground">{invoice.client_name}</div>
              {invoice.client_email && <div>{invoice.client_email}</div>}
              {invoice.client_phone && <div>{invoice.client_phone}</div>}
              {invoice.client_address && <div className="whitespace-pre-line">{invoice.client_address}</div>}
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-3 font-semibold text-card-foreground">Description</th>
                  <th className="text-center py-3 font-semibold w-20 text-card-foreground">Qty</th>
                  <th className="text-right py-3 font-semibold w-24 text-card-foreground">Rate</th>
                  <th className="text-right py-3 font-semibold w-24 text-card-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-border">
                    <td className="py-3 text-card-foreground">{item.description}</td>
                    <td className="py-3 text-center text-muted-foreground">{item.quantity}</td>
                    <td className="py-3 text-right text-muted-foreground">${item.rate.toFixed(2)}</td>
                    <td className="py-3 text-right font-medium text-card-foreground">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax:</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
              )}
              {shippingAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping:</span>
                  <span>${shippingAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-card-foreground border-t border-border pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t border-border pt-6">
              <h4 className="font-semibold text-card-foreground mb-2">Notes:</h4>
              <p className="text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export the token generation function for use in email service
export { PublicInvoiceView as default };
export const generateInvoiceToken = (invoiceId: string): string => {
  return btoa(`invoice-${invoiceId}-${new Date().toDateString()}`);
};
