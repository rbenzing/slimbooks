
import {
  ClientImportData,
  ClientValidationResult,
  ExpenseImportData,
  ExpenseValidationResult,
  PaymentImportData,
  PaymentValidationResult
} from '@/types';
import { PaymentMethod, PaymentStatus } from '@/types';

// CSV types moved to @/types/shared/import.types.ts
import type { CSVRecord } from '@/types';

export const exportToCSV = (data: CSVRecord[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = (csvText: string): CSVRecord[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: CSVRecord = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }
  
  return data;
};

const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++; // Skip next quote
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

export const validateClientData = (data: CSVRecord): ClientValidationResult => {
  const errors: string[] = [];

  // Check if we have either a full name or first/last name
  const hasFullName = data.name && data.name.toString().trim() !== '';
  const hasFirstOrLastName = (data.first_name && data.first_name.toString().trim() !== '') ||
                            (data.last_name && data.last_name.toString().trim() !== '');

  if (!hasFullName && !hasFirstOrLastName) {
    errors.push('Name is required (either full name or first/last name)');
  }

  if (!data.email || data.email.toString().trim() === '') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.toString())) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateExpenseData = (data: CSVRecord): ExpenseValidationResult => {
  const errors: string[] = [];
  
  if (!data.merchant || data.merchant.toString().trim() === '') {
    errors.push('Merchant is required');
  }
  
  if (!data.amount || isNaN(parseFloat(data.amount.toString()))) {
    errors.push('Valid amount is required');
  }
  
  if (!data.date) {
    errors.push('Date is required');
  }
  
  if (!data.category || data.category.toString().trim() === '') {
    errors.push('Category is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Payment import types (imported at top)

export const validatePaymentData = (data: CSVRecord): PaymentValidationResult => {
  const errors: string[] = [];
  
  // Required fields validation
  if (!data.client_name || data.client_name.toString().trim() === '') {
    errors.push('Client name is required');
  }
  
  if (!data.amount || isNaN(parseFloat(data.amount.toString()))) {
    errors.push('Valid amount is required');
  } else if (parseFloat(data.amount.toString()) <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (!data.date) {
    errors.push('Date is required');
  } else {
    // Try to parse the date to ensure it's valid
    const dateStr = data.date.toString();
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Invalid date format');
    }
  }
  
  // Validate payment method
  const validMethods: PaymentMethod[] = ['cash', 'check', 'bank_transfer', 'credit_card', 'paypal', 'other'];
  if (data.method && !validMethods.includes(data.method as PaymentMethod)) {
    errors.push(`Invalid payment method. Valid methods: ${validMethods.join(', ')}`);
  }
  
  // Validate payment status
  const validStatuses: PaymentStatus[] = ['received', 'pending', 'failed', 'refunded'];
  if (data.status && !validStatuses.includes(data.status as PaymentStatus)) {
    errors.push(`Invalid payment status. Valid statuses: ${validStatuses.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
