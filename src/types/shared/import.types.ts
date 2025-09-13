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

