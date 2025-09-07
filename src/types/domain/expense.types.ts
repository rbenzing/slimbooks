// Expense-related types and interfaces

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed';

export interface Expense {
  id: number;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  description?: string;
  receipt_url?: string;
  status: ExpenseStatus;
  created_at: string;
  updated_at: string;
}

export interface ExpenseFormData {
  date: string;
  merchant: string;
  category: string;
  amount: number;
  description?: string;
  receipt_url?: string;
  status: ExpenseStatus;
}

// For expense statistics and reports
export interface ExpenseStats {
  total_expenses: number;
  total_amount: number;
  by_category: Array<{
    category: string;
    count: number;
    amount: number;
  }>;
  by_month: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
  by_status: Record<ExpenseStatus, number>;
}

// For expense import/export
export interface ExpenseImportData {
  date: string;
  merchant: string;
  category: string;
  amount: number | string;
  description?: string;
  receipt_url?: string;
  status?: ExpenseStatus;
}

export interface ExpenseValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// For expense filtering and searching
export interface ExpenseFilters {
  status?: ExpenseStatus | ExpenseStatus[];
  category?: string;
  merchant?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string;
}

// Common expense categories
export const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Travel',
  'Meals & Entertainment',
  'Marketing',
  'Software & Subscriptions',
  'Equipment',
  'Professional Services',
  'Utilities',
  'Rent',
  'Insurance',
  'Other'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];