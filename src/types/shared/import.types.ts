// Import and export related types and interfaces

// Generic CSV record interface
export interface CSVRecord {
  [key: string]: string;
}

// Payment import specific types
export interface PaymentImportData {
  date: string;
  client_name: string;
  amount: number;
  method: string; // PaymentMethod type
  reference?: string;
  description?: string;
  status: string; // PaymentStatus type
}

export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
}

// Common field mapping interface used across import/export components
export interface FieldMapping {
  csvField: string;
  dbField: string;
}

// Generic preview data item interface
export interface PreviewDataItem {
  _originalIndex?: number;
  [key: string]: string | number | boolean | null | undefined;
}

// Component props interfaces for import/export modals
export interface ImportExportProps {
  onClose: () => void;
  onImportComplete: () => void;
}

// Client import specific types
export interface ClientImportData {
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  company?: string;
  notes?: string;
}

// Expense import specific types
export interface ExpenseImportData {
  date: string;
  merchant: string;
  amount: number;
  category?: string;
  description?: string;
  reference?: string;
  tax_amount?: number;
}

// Field definition interface for import/export fields
export interface ImportField {
  key: string;
  label: string;
  required: boolean;
}

// Import field definitions for different data types
export const PAYMENT_FIELDS: ImportField[] = [
  { key: 'date', label: 'Date', required: true },
  { key: 'client_name', label: 'Client Name', required: true },
  { key: 'amount', label: 'Amount', required: true },
  { key: 'method', label: 'Payment Method', required: true },
  { key: 'reference', label: 'Reference/Transaction ID', required: false },
  { key: 'description', label: 'Description/Notes', required: false },
  { key: 'status', label: 'Status', required: false }
];

export const CLIENT_FIELDS: ImportField[] = [
  { key: 'name', label: 'Full Name', required: false },
  { key: 'first_name', label: 'First Name', required: false },
  { key: 'last_name', label: 'Last Name', required: false },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'company', label: 'Company', required: false },
  { key: 'address', label: 'Address', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'zipCode', label: 'ZIP Code', required: false },
  { key: 'country', label: 'Country', required: false }
];

export const EXPENSE_FIELDS: ImportField[] = [
  { key: 'date', label: 'Date', required: true },
  { key: 'merchant', label: 'Merchant/Vendor', required: true },
  { key: 'amount', label: 'Amount', required: true },
  { key: 'category', label: 'Category', required: false },
  { key: 'description', label: 'Description', required: false },
  { key: 'reference', label: 'Reference', required: false },
  { key: 'tax_amount', label: 'Tax Amount', required: false }
];

