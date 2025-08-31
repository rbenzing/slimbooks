// Common types and interfaces used across the application

// Generic API Response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: ValidationError[];
}

// Pagination interface
export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Validation error structure
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// Database timestamps
export interface Timestamps {
  created_at: string;
  updated_at: string;
}

// Generic entity with ID and timestamps
export interface BaseEntity extends Timestamps {
  id: number;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  error?: string;
}

// Form state types
export type FormMode = 'create' | 'edit' | 'view';

export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Table/List view types
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, item: T) => React.ReactNode;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface TableState<T> {
  data: T[];
  loading: boolean;
  error?: string;
  sort: SortConfig;
  filters: Record<string, unknown>;
  pagination: PaginationParams;
  selectedItems: T[];
}

// Time period types for reports
export type TimePeriod = 
  | 'today' 
  | 'yesterday' 
  | 'last-7-days' 
  | 'last-30-days' 
  | 'this-week' 
  | 'last-week' 
  | 'this-month' 
  | 'last-month' 
  | 'this-quarter' 
  | 'last-quarter' 
  | 'this-year' 
  | 'last-year' 
  | 'year-to-date' 
  | 'month-to-date' 
  | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

// Settings types
export interface AppSettings {
  key: string;
  value: string;
  category: string;
}

export interface ProjectSettings {
  key: string;
  value: string;
  enabled?: boolean;
  created_at: string;
  updated_at: string;
}

// Report types
export type ReportType = 'income' | 'expense' | 'profit_loss' | 'tax' | 'custom';

export interface Report {
  id: number;
  name: string;
  type: ReportType;
  date_range_start: string;
  date_range_end: string;
  data?: string; // JSON string of report data
  created_at: string;
}

// Dashboard data structure
export interface DashboardStats {
  total_revenue: number;
  total_expenses: number;
  profit: number;
  outstanding_invoices: number;
  overdue_invoices: number;
  total_clients: number;
  recent_activities: Activity[];
}

export interface Activity {
  id: number;
  type: 'invoice_created' | 'payment_received' | 'client_added' | 'expense_added';
  title: string;
  description?: string;
  amount?: number;
  date: string;
  related_id?: number;
}

// Search and filter utilities
export interface SearchParams {
  query?: string;
  filters: Record<string, unknown>;
  sort?: SortConfig;
  pagination?: PaginationParams;
}

// Export/Import types
export interface ExportOptions {
  format: 'csv' | 'pdf' | 'xlsx';
  dateRange?: DateRange;
  filters?: Record<string, unknown>;
  columns?: string[];
}

export interface ImportResult<T> {
  success: boolean;
  imported_count: number;
  skipped_count: number;
  error_count: number;
  errors: Array<{
    row: number;
    data: T;
    errors: string[];
  }>;
}