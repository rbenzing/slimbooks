
import React, { useState, useEffect } from 'react';
import { X, Upload, Download } from 'lucide-react';
import { getStatusColor } from '@/lib/utils';
import { formatDateSync } from '@/components/ui/FormattedDate';
import { FormattedCurrency } from '@/components/ui/FormattedCurrency';
import { pdfService } from '@/services/pdf.svc';

interface InvoiceViewModalProps {
  invoice: any;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({ invoice, isOpen, onClose }) => {
  const [companySettings, setCompanySettings] = useState<any>({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Use dynamic import to avoid circular dependencies
        const { sqliteService } = await import('@/services/sqlite.svc');

        if (!sqliteService.isReady()) {
          await sqliteService.initialize();
        }

        const saved = await sqliteService.getSetting('company_settings');
        if (saved) {
          setCompanySettings(saved);
        } else {
          setCompanySettings({
            companyName: 'ClientBill Pro',
            address: '123 Business Street',
            city: 'Business City',
            state: 'CA',
            zipCode: '90210',
            brandingImage: ''
          });
        }
      } catch (error) {
        console.error('Error loading company settings:', error);
        // Fallback to default settings
        setCompanySettings({
          companyName: 'ClientBill Pro',
          address: '123 Business Street',
          city: 'Business City',
          state: 'CA',
          zipCode: '90210',
          brandingImage: ''
        });
      }
    };

    loadSettings();
  }, []);

  if (!isOpen || !invoice) return null;

  // Handle line items - create from description if none exist
  let lineItems = [];
  if (invoice.line_items) {
    try {
      lineItems = JSON.parse(invoice.line_items);
    } catch (e) {
      lineItems = [];
    }
  }

  // If no line items exist, create one from the description and amount
  if (lineItems.length === 0 && invoice.description) {
    lineItems = [{
      id: '1',
      description: invoice.description,
      quantity: 1,
      rate: invoice.amount,
      amount: invoice.amount
    }];
  }

  const taxAmount = invoice.tax_amount || 0;
  const shippingAmount = invoice.shipping_amount || 0;
  const subtotal = invoice.amount - taxAmount - shippingAmount;

  // Get template from localStorage or default to modern-blue
  const template = localStorage.getItem('invoiceTemplate') || 'modern-blue';

  const getTemplateStyles = () => {
    const baseStyles = {
      container: 'bg-card border',
      modalHeader: 'bg-card border-b border-border',
      invoiceHeader: '',
      companySection: '',
      title: 'text-foreground',
      accent: 'text-muted-foreground',
      tableHeader: 'bg-muted/30 border-border',
      totalSection: 'bg-card',
      closeButton: 'text-muted-foreground hover:text-foreground',
      contentText: 'text-foreground',
      clientSection: 'bg-muted/20 border border-border',
      clientText: 'text-foreground',
      tableText: 'text-foreground',
      tableBorder: 'border-border',
    };

    switch (template) {
      case 'classic-white':
        return {
          ...baseStyles,
          container: 'bg-white border border-gray-300',
          modalHeader: 'bg-gray-50 border-b border-gray-300',
          invoiceHeader: 'bg-gray-100 border-b-2 border-gray-400 rounded-t-lg',
          companySection: 'bg-white',
          title: 'text-gray-900',
          accent: 'text-gray-700',
          tableHeader: 'bg-gray-200 border-gray-400',
          totalSection: 'bg-gray-50 rounded-lg border border-gray-300',
          closeButton: 'text-gray-700 hover:text-gray-900',
          contentText: 'text-gray-900',
          clientSection: 'bg-gray-50 border border-gray-300',
          clientText: 'text-gray-900',
          tableText: 'text-gray-900',
          tableBorder: 'border-gray-300',
        };
      case 'professional-gray':
        return {
          ...baseStyles,
          container: 'bg-white border border-slate-400',
          modalHeader: 'bg-slate-100 border-b border-slate-400',
          invoiceHeader: 'bg-gradient-to-r from-slate-700 to-slate-800 text-white border-b-2 border-slate-600 rounded-t-lg',
          companySection: 'bg-white',
          title: 'text-white',
          accent: 'text-slate-200',
          tableHeader: 'bg-slate-200 border-slate-400',
          totalSection: 'bg-slate-100 rounded-lg border border-slate-400',
          closeButton: 'text-slate-700 hover:text-slate-900',
          contentText: 'text-slate-900',
          clientSection: 'bg-slate-50 border border-slate-300',
          clientText: 'text-slate-900',
          tableText: 'text-slate-900',
          tableBorder: 'border-slate-300',
        };
      default: // modern-blue
        return {
          ...baseStyles,
          container: 'bg-white border border-blue-300',
          modalHeader: 'bg-blue-50 border-b border-blue-300',
          invoiceHeader: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-b-2 border-blue-500 rounded-t-lg',
          companySection: 'bg-white',
          title: 'text-white',
          accent: 'text-blue-100',
          tableHeader: 'bg-blue-100 border-blue-300',
          totalSection: 'bg-blue-50 rounded-lg border border-blue-300',
          closeButton: 'text-blue-700 hover:text-blue-900',
          contentText: 'text-blue-900',
          clientSection: 'bg-blue-50 border border-blue-200',
          clientText: 'text-blue-900',
          tableText: 'text-blue-900',
          tableBorder: 'border-blue-200',
        };
    }
  };

  const styles = getTemplateStyles();

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    setIsGeneratingPDF(true);
    try {
      // For authenticated users, use the direct invoice PDF method
      await pdfService.downloadInvoicePDF(
        invoice.id,
        invoice.invoice_number
      );
    } catch (error) {
      console.error('Error downloading PDF:', error);

      // Show user-friendly error dialog
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.';

      // Create and show error dialog
      const dialog = document.createElement('div');
      dialog.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        ">
          <div style="
            background: white;
            padding: 24px;
            border-radius: 8px;
            max-width: 400px;
            margin: 20px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          ">
            <h3 style="margin: 0 0 16px 0; color: #dc2626;">PDF Generation Failed</h3>
            <p style="margin: 0 0 20px 0; color: #374151;">${errorMessage}</p>
            <button onclick="this.closest('div').remove()" style="
              background: #dc2626;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
            ">Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(dialog);

      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (dialog.parentNode) {
          dialog.remove();
        }
      }, 10000);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`${styles.container} rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
        {/* Modal Header */}
        <div className={`flex justify-between items-center p-4 ${styles.modalHeader} rounded-t-lg`}>
          <h2 className="text-lg font-semibold text-foreground">Invoice Preview</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={onClose}
              className={styles.closeButton}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className={`p-8 ${styles.companySection}`}>
          {/* Company Header with Branding */}
          <div className={`p-6 mb-6 ${styles.invoiceHeader}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center border-2 border-white/30 overflow-hidden">
                  {companySettings.brandingImage ? (
                    <img src={companySettings.brandingImage} alt="Company Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="h-6 w-6 text-white/70" />
                  )}
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${styles.title}`}>{companySettings.companyName || 'ClientBill Pro'}</h1>
                  <p className={`${styles.accent} text-sm`}>{companySettings.address || '123 Business Street'}</p>
                  <p className={`${styles.accent} text-sm`}>
                    {companySettings.city || 'Business City'}, {companySettings.state || 'CA'} {companySettings.zipCode || '90210'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <h3 className={`text-3xl font-bold mb-2 ${styles.title}`}>INVOICE</h3>
                <div className={`space-y-1 text-sm ${styles.accent}`}>
                  <p><strong>Invoice #:</strong> {invoice.invoice_number}</p>
                  <p><strong>Date:</strong> {formatDateSync(invoice.created_at)}</p>
                  <p><strong>Due Date:</strong> {invoice.due_date ? formatDateSync(invoice.due_date) : 'N/A'}</p>
                  <p><strong>Status:</strong>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status || 'draft')}`}>
                      {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Draft'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="mb-8">
            <h4 className={`font-semibold mb-3 text-lg ${styles.contentText}`}>Bill To:</h4>
            <div className={`p-4 rounded-lg ${styles.clientSection}`}>
              <p className={`font-medium text-lg ${styles.clientText}`}>{invoice.client_name}</p>
              {invoice.client_email && <p className={styles.clientText}>{invoice.client_email}</p>}
              {invoice.client_phone && <p className={styles.clientText}>{invoice.client_phone}</p>}
              {invoice.client_address && (
                <div className="mt-2">
                  <p className={styles.clientText}>{invoice.client_address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <table className={`w-full rounded-lg overflow-hidden ${styles.tableBorder} border`}>
              <thead>
                <tr className={styles.tableHeader}>
                  <th className={`text-left py-4 px-4 font-semibold ${styles.tableText}`}>Description</th>
                  <th className={`text-center py-4 px-4 font-semibold w-20 ${styles.tableText}`}>Qty</th>
                  <th className={`text-right py-4 px-4 font-semibold w-24 ${styles.tableText}`}>Rate</th>
                  <th className={`text-right py-4 px-4 font-semibold w-24 ${styles.tableText}`}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length > 0 ? lineItems.map((item: any, index: number) => (
                  <tr key={index} className={`${styles.tableBorder} border-b last:border-b-0 hover:bg-muted/10`}>
                    <td className={`py-4 px-4 ${styles.tableText}`}>{item.description}</td>
                    <td className={`py-4 px-4 text-center ${styles.tableText}`}>{item.quantity}</td>
                    <td className={`py-4 px-4 text-right ${styles.tableText}`}>
                      <FormattedCurrency amount={item.rate || 0} />
                    </td>
                    <td className={`py-4 px-4 text-right font-medium ${styles.tableText}`}>
                      <FormattedCurrency amount={item.amount || 0} />
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className={`py-8 text-center ${styles.tableText} opacity-60`}>No line items available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className={`p-4 space-y-3 ${styles.totalSection}`}>
                <div className={`flex justify-between ${styles.contentText}`}>
                  <span>Subtotal:</span>
                  <span><FormattedCurrency amount={subtotal} /></span>
                </div>
                {taxAmount > 0 && (
                  <div className={`flex justify-between ${styles.contentText}`}>
                    <span>Tax:</span>
                    <span><FormattedCurrency amount={taxAmount} /></span>
                  </div>
                )}
                {shippingAmount > 0 && (
                  <div className={`flex justify-between ${styles.contentText}`}>
                    <span>Shipping:</span>
                    <span><FormattedCurrency amount={shippingAmount} /></span>
                  </div>
                )}
                <div className={`border-t ${styles.tableBorder} pt-3 flex justify-between font-bold text-lg ${styles.contentText}`}>
                  <span>Total:</span>
                  <span><FormattedCurrency amount={invoice.amount} /></span>
                </div>
              </div>
            </div>
          </div>

          {/* Thank You Message */}
          <div className={`border-t ${styles.tableBorder} pt-6`}>
            <h4 className={`font-semibold mb-2 ${styles.contentText}`}>Thank You Message:</h4>
            <p className={`text-sm ${styles.contentText} opacity-80`}>
              {invoice.notes || 'Thank you for your business!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
