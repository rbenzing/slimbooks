
import React, { useState, useCallback } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { clientOperations } from '@/lib/database';
import { exportToCSV, parseCSV, validateClientData } from '@/utils/csvUtils';
import { toast } from 'sonner';

interface ClientImportExportProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface FieldMapping {
  csvField: string;
  dbField: string;
}

const CLIENT_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'company', label: 'Company', required: false },
  { key: 'address', label: 'Address', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'zipCode', label: 'ZIP Code', required: false },
  { key: 'country', label: 'Country', required: false }
];

export const ClientImportExport: React.FC<ClientImportExportProps> = ({ onClose, onImportComplete }) => {
  const [mode, setMode] = useState<'select' | 'import' | 'export'>('select');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = () => {
    try {
      const clients = clientOperations.getAll();
      if (clients.length === 0) {
        toast.error('No clients to export');
        return;
      }
      
      const exportData = clients.map(client => ({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        company: client.company || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        zipCode: client.zipCode || '',
        country: client.country || ''
      }));
      
      exportToCSV(exportData, `clients-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Clients exported successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to export clients');
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
        const initialMappings = CLIENT_FIELDS.map(field => ({
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
          mappedRow[mapping.dbField] = row[mapping.csvField] || '';
        }
      });
      return mappedRow;
    });

    const validationResults = mappedData.map(row => validateClientData(row));
    
    setPreviewData(mappedData);
    setValidationResults(validationResults);
  };

  const handleImport = async () => {
    setIsProcessing(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const row of csvData) {
        const mappedRow: any = {};
        fieldMappings.forEach(mapping => {
          if (mapping.csvField) {
            mappedRow[mapping.dbField] = row[mapping.csvField] || '';
          }
        });

        const validation = validateClientData(mappedRow);
        if (validation.isValid) {
          clientOperations.create(mappedRow);
          successCount++;
        } else {
          errorCount++;
        }
      }

      toast.success(`Import completed: ${successCount} clients imported, ${errorCount} errors`);
      onImportComplete();
      onClose();
    } catch (error) {
      toast.error('Failed to import clients');
      console.error('Import error:', error);
    }
    
    setIsProcessing(false);
  };

  if (mode === 'select') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Import/Export Clients</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('export')}
              className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Download className="h-6 w-6 text-blue-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Export Clients</div>
                <div className="text-sm text-gray-600">Download all clients as CSV</div>
              </div>
            </button>

            <button
              onClick={() => document.getElementById('csv-upload')?.click()}
              className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Upload className="h-6 w-6 text-blue-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Import Clients</div>
                <div className="text-sm text-gray-600">Upload CSV file to import</div>
              </div>
            </button>

            <input
              id="csv-upload"
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Export Clients</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="text-center py-6">
            <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">Export all clients to a CSV file for backup or migration.</p>
            
            <div className="space-y-3">
              <button
                onClick={handleExport}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download CSV
              </button>
              <button
                onClick={() => setMode('select')}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Import Clients</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Field Mapping */}
          <div>
            <h3 className="text-lg font-medium mb-4">Map CSV Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CLIENT_FIELDS.map(field => (
                <div key={field.key} className="flex items-center space-x-3">
                  <div className="w-32">
                    <label className="text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                  </div>
                  <select
                    value={fieldMappings.find(m => m.dbField === field.key)?.csvField || ''}
                    onChange={(e) => updateFieldMapping(field.key, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Preview
            </button>
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Preview (First 5 Records)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                      {CLIENT_FIELDS.map(field => (
                        <th key={field.key} className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                          {field.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="px-4 py-2">
                          {validationResults[index]?.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </td>
                        {CLIENT_FIELDS.map(field => (
                          <td key={field.key} className="px-4 py-2 text-sm text-gray-900">
                            {row[field.key] || '-'}
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
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <div className="space-x-3">
              <button
                onClick={handleImport}
                disabled={isProcessing || previewData.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Importing...' : 'Import Clients'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
