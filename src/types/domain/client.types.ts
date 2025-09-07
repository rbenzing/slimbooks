// Client-related types and interfaces
// Consolidated from both frontend and backend definitions

import { BaseEntity } from './auth.types';

export interface Client extends BaseEntity {
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  zipCode?: string; // Legacy field alias for frontend compatibility
  zip_code?: string; // Legacy field alias
  country?: string;
  tax_id?: string;
  notes?: string;
  stripe_customer_id?: string;
  is_active?: number; // SQLite boolean (0/1)
}

export interface ClientFormData {
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  company?: string;
  companyEmail?: string;
  companyPhone?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
}

// For client statistics and reports
export interface ClientStats {
  total_clients: number;
  active_clients: number;
  total_revenue: number;
  average_invoice_amount: number;
  top_clients: Array<{
    client: Client;
    total_amount: number;
    invoice_count: number;
  }>;
}

// For client import/export
export interface ClientImportData {
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface ClientValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// For client filtering and searching
export interface ClientFilters {
  search?: string;
  company?: string;
  country?: string;
  has_invoices?: boolean;
  created_from?: string;
  created_to?: string;
}