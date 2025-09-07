import React, { useState, useCallback } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { exportToCSV, parseCSV, validatePaymentData, PaymentImportData, PaymentValidationResult } from '@/utils/csvUtils';
import { toast } from 'sonner';
import { themeClasses, getIconColorClasses, getButtonClasses } from '@/utils/themeUtils.util';
import { PaymentMethod, PaymentStatus, Payment } from '@/types';
import { authenticatedFetch } from '@/utils/apiUtils.util';

interface PaymentImportExportProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface FieldMapping {
  csvField: string;
  dbField: string;
}

const PAYMENT_FIELDS = [
  { key: 'date', label: 'Date', required: true },
  { key: 'client_name', label: 'Client Name', required: true },
  { key: 'amount', label: 'Amount', required: true },
  { key: 'method', label: 'Payment Method', required: true },
  { key: 'reference', label: 'Reference/Transaction ID', required: false },
  { key: 'description', label: 'Description/Notes', required: false },
  { key: 'status', label: 'Status', required: false }
];

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'check', 'bank_transfer', 'credit_card', 'paypal', 'other'];
const PAYMENT_STATUSES: PaymentStatus[] = ['received', 'pending', 'failed', 'refunded'];

interface PreviewDataItem extends PaymentImportData {
  _originalIndex?: number;
}

export const PaymentImportExport: React.FC<PaymentImportExportProps> = ({ onClose, onImportComplete }) => {
  const [mode, setMode] = useState<'select' | 'import' | 'export'>('select');
  const [csvData, setCsvData] = useState<Array<Record<string, string | number | boolean | null | undefined>>>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [previewData, setPreviewData] = useState<PreviewDataItem[]>([]);
  const [validationResults, setValidationResults] = useState<PaymentValidationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = async () => {
    try {
      const response = await authenticatedFetch('/api/payments');
      const data = await response.json();
      
      if (!data.success || !data.data?.payments) {
        toast.error('Failed to fetch payments for export');
        return;
      }

      const payments: Payment[] = data.data.payments;
      
      if (payments.length === 0) {
        toast.error('No payments to export');
        return;
      }

      const exportData = payments.map(payment => ({
        date: payment.date,
        client_name: payment.client_name,
        amount: payment.amount,
        method: payment.method,
        reference: payment.reference || '',
        description: payment.description || '',
        status: payment.status
      }));

      exportToCSV(exportData, `payments-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Payments exported successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to export payments');
      console.error('Export error:', error);
    }
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const parsedData = parseCSV(csvText);
        
        if (parsedData.length === 0) {
          toast.error('CSV file is empty or invalid');
          return;
        }

        setCsvData(parsedData);
        setCsvHeaders(Object.keys(parsedData[0]));
        
        // Initialize field mappings
        const initialMappings = PAYMENT_FIELDS.map(field => ({
          csvField: '',
          dbField: field.key
        }));
        setFieldMappings(initialMappings);
        
        setMode('import');
      } catch (error) {
        toast.error('Failed to parse CSV file');
        console.error('CSV parsing error:', error);
      }
    };
    
    reader.readAsText(file);
  }, []);

  const updateFieldMapping = (dbField: string, csvField: string) => {
    setFieldMappings(prev => 
      prev.map(mapping => 
        mapping.dbField === dbField 
          ? { ...mapping, csvField }
          : mapping
      )
    );
  };

  const generatePreview = () => {
    if (csvData.length === 0) return;

    const mappedData = csvData.slice(0, 5).map(row => {
      const mappedRow: any = {};
      fieldMappings.forEach(mapping => {
        if (mapping.csvField) {
          let value = row[mapping.csvField] || '';
          
          // Apply transformations
          if (mapping.dbField === 'amount') {
            // Handle negative amounts and remove currency symbols
            value = Math.abs(parseFloat(String(value).replace(/[$,]/g, '')) || 0);
          } else if (mapping.dbField === 'method') {
            // Normalize payment method
            const methodStr = String(value).toLowerCase().replace(/\s+/g, '_');
            if (PAYMENT_METHODS.includes(methodStr as PaymentMethod)) {
              value = methodStr;
            } else {
              // Try to map common variations
              if (methodStr.includes('card') || methodStr.includes('credit')) value = 'credit_card';
              else if (methodStr.includes('bank') || methodStr.includes('transfer')) value = 'bank_transfer';
              else if (methodStr.includes('paypal')) value = 'paypal';
              else if (methodStr.includes('check') || methodStr.includes('cheque')) value = 'check';
              else if (methodStr.includes('cash')) value = 'cash';
              else value = 'other';
            }
          } else if (mapping.dbField === 'status') {
            // Normalize payment status
            const statusStr = String(value).toLowerCase();
            if (PAYMENT_STATUSES.includes(statusStr as PaymentStatus)) {
              value = statusStr;
            } else {
              // Try to map common variations
              if (statusStr.includes('received') || statusStr.includes('paid') || statusStr.includes('complete')) value = 'received';
              else if (statusStr.includes('pending') || statusStr.includes('processing')) value = 'pending';
              else if (statusStr.includes('failed') || statusStr.includes('error') || statusStr.includes('declined')) value = 'failed';
              else if (statusStr.includes('refund')) value = 'refunded';
              else value = 'pending'; // Default to pending
            }
          } else if (mapping.dbField === 'date') {
            // Try to normalize date format
            const dateStr = String(value);
            try {
              const parsedDate = new Date(dateStr);
              if (!isNaN(parsedDate.getTime())) {
                value = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
              }
            } catch (e) {
              // Keep original value if can't parse
            }
          }
          
          mappedRow[mapping.dbField] = value;
        }
      });
      
      // Set defaults for missing required fields
      if (!mappedRow.method) mappedRow.method = 'other';
      if (!mappedRow.status) mappedRow.status = 'pending';
      
      return mappedRow;
    });

    const validationResults = mappedData.map(row => validatePaymentData(row));
    
    setPreviewData(mappedData);
    setValidationResults(validationResults);
  };

  const handleImport = async () => {
    setIsProcessing(true);
    
    try {
      const validPayments = [];

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const mappedRow: any = {};
        
        fieldMappings.forEach(mapping => {
          if (mapping.csvField) {
            let value = row[mapping.csvField] || '';
            
            // Apply same transformations as in preview
            if (mapping.dbField === 'amount') {
              value = Math.abs(parseFloat(String(value).replace(/[$,]/g, '')) || 0);
            } else if (mapping.dbField === 'method') {
              const methodStr = String(value).toLowerCase().replace(/\s+/g, '_');
              if (PAYMENT_METHODS.includes(methodStr as PaymentMethod)) {
                value = methodStr;
              } else {
                if (methodStr.includes('card') || methodStr.includes('credit')) value = 'credit_card';
                else if (methodStr.includes('bank') || methodStr.includes('transfer')) value = 'bank_transfer';
                else if (methodStr.includes('paypal')) value = 'paypal';
                else if (methodStr.includes('check') || methodStr.includes('cheque')) value = 'check';
                else if (methodStr.includes('cash')) value = 'cash';
                else value = 'other';
              }
            } else if (mapping.dbField === 'status') {
              const statusStr = String(value).toLowerCase();
              if (PAYMENT_STATUSES.includes(statusStr as PaymentStatus)) {
                value = statusStr;
              } else {
                if (statusStr.includes('received') || statusStr.includes('paid') || statusStr.includes('complete')) value = 'received';
                else if (statusStr.includes('pending') || statusStr.includes('processing')) value = 'pending';
                else if (statusStr.includes('failed') || statusStr.includes('error') || statusStr.includes('declined')) value = 'failed';
                else if (statusStr.includes('refund')) value = 'refunded';
                else value = 'pending';
              }
            } else if (mapping.dbField === 'date') {
              const dateStr = String(value);
              try {
                const parsedDate = new Date(dateStr);
                if (!isNaN(parsedDate.getTime())) {
                  value = parsedDate.toISOString().split('T')[0];
                }
              } catch (e) {
                // Keep original value
              }
            }
            
            mappedRow[mapping.dbField] = value;
          }
        });

        // Set defaults
        if (!mappedRow.method) mappedRow.method = 'other';
        if (!mappedRow.status) mappedRow.status = 'pending';

        const validation = validatePaymentData(mappedRow);
        if (validation.isValid) {
          validPayments.push(mappedRow);
        }
      }

      if (validPayments.length === 0) {
        toast.error('No valid payments to import');
        setIsProcessing(false);
        return;
      }

      // Use bulk import endpoint
      const response = await authenticatedFetch('/api/payments/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payments: validPayments })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Import completed: ${result.data.imported} payments imported${result.data.failed > 0 ? `, ${result.data.failed} failed` : ''}`);
        
        // Show detailed errors if any
        if (result.data.failed > 0 && result.data.errors.length > 0) {
          console.warn('Import errors:', result.data.errors);
          toast.warning(`${result.data.failed} payments failed to import. Check console for details.`);
        }
      } else {
        throw new Error(result.error || 'Import failed');
      }

      onImportComplete();
      onClose();
    } catch (error) {
      toast.error('Failed to import payments');
      console.error('Import error:', error);
    }
    
    setIsProcessing(false);
  };

  if (mode === 'select') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className={`${themeClasses.card} w-full max-w-md`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={themeClasses.cardTitle}>Import/Export Payments</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className={themeClasses.iconSmall} />
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('export')}
              className="w-full flex items-center justify-center p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
            >
              <Download className={`${themeClasses.iconMedium} ${getIconColorClasses('blue')} mr-3`} />
              <div className="text-left">
                <div className="font-medium text-foreground">Export Payments</div>
                <div className="text-sm text-muted-foreground">Download all payments as CSV</div>
              </div>
            </button>

            <button
              onClick={() => document.getElementById('payment-csv-upload')?.click()}
              className="w-full flex items-center justify-center p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
            >
              <Upload className={`${themeClasses.iconMedium} ${getIconColorClasses('blue')} mr-3`} />
              <div className="text-left">
                <div className="font-medium text-foreground">Import Payments</div>
                <div className="text-sm text-muted-foreground">Upload CSV file to import</div>
              </div>
            </button>

            <input
              id="payment-csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'export') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className={`${themeClasses.card} w-full max-w-md`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={themeClasses.cardTitle}>Export Payments</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className={themeClasses.iconSmall} />
            </button>
          </div>

          <div className="text-center py-6">
            <FileText className={`h-12 w-12 ${getIconColorClasses('blue')} mx-auto mb-4`} />
            <p className="text-muted-foreground mb-6">Export all payments to a CSV file for backup or analysis.</p>

            <div className="space-y-3">
              <button
                onClick={handleExport}
                className={getButtonClasses('primary')}
              >
                Download CSV
              </button>
              <button
                onClick={() => setMode('select')}
                className={getButtonClasses('secondary')}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className={`${themeClasses.card} w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={themeClasses.cardTitle}>Import Payments</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className={themeClasses.iconSmall} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Field Mapping */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">Map CSV Fields</h3>
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Payment Method:</strong> Valid methods are: {PAYMENT_METHODS.join(', ')}. Common variations will be automatically mapped.
                <br />
                <strong>Status:</strong> Valid statuses are: {PAYMENT_STATUSES.join(', ')}. Default is "pending" if not specified.
                <br />
                <strong>Amount:</strong> Currency symbols will be removed and negative amounts will be converted to positive.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PAYMENT_FIELDS.map(field => (
                <div key={field.key} className="flex items-center space-x-3">
                  <div className="w-32">
                    <label className="text-sm font-medium text-foreground">
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                    </label>
                  </div>
                  <select
                    value={fieldMappings.find(m => m.dbField === field.key)?.csvField || ''}
                    onChange={(e) => updateFieldMapping(field.key, e.target.value)}
                    className={themeClasses.select}
                  >
                    <option value="">Select CSV Column</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <button
              onClick={generatePreview}
              className={`${getButtonClasses('primary')} mt-4`}
            >
              Generate Preview
            </button>
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Preview (First 5 Records)</h3>
              <div className="overflow-x-auto">
                <table className={themeClasses.table}>
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-foreground">Status</th>
                      {PAYMENT_FIELDS.map(field => (
                        <th key={field.key} className="px-4 py-2 text-left text-sm font-medium text-foreground">
                          {field.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="px-4 py-2">
                          {validationResults[index]?.isValid ? (
                            <CheckCircle className={`${themeClasses.iconSmall} ${getIconColorClasses('green')}`} />
                          ) : (
                            <AlertCircle className={`${themeClasses.iconSmall} ${getIconColorClasses('red')}`} />
                          )}
                        </td>
                        {PAYMENT_FIELDS.map(field => (
                          <td key={field.key} className="px-4 py-2 text-sm text-foreground">
                            {field.key === 'amount' ? `$${row[field.key] || 0}` : (row[field.key] || '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => setMode('select')}
              className={getButtonClasses('secondary')}
            >
              Back
            </button>
            <div className="space-x-3">
              <button
                onClick={handleImport}
                disabled={isProcessing || previewData.length === 0}
                className={`${getButtonClasses('primary')} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessing ? 'Importing...' : 'Import Payments'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};