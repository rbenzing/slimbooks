// Invoice-related types and interfaces
import { InvoiceStatus } from '../constants/enums.types';
export type { InvoiceStatus };
export type InvoiceType = 'one-time' | 'recurring' | 'subscription';
export type EmailStatus = 'not_sent' | 'sent' | 'sending' | 'failed' | 'bounced';

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// Alias for compatibility with server code
export type LineItem = InvoiceItem;
export type Template = InvoiceTemplate;

export interface Invoice {
  id: number;
  invoice_number: string;
  client_id: number;
  template_id?: number;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  due_date: string;
  issue_date: string;
  description?: string;
  items?: string; // JSON string of InvoiceItem[]
  notes?: string;
  payment_terms?: string;
  stripe_invoice_id?: string;
  stripe_payment_intent_id?: string;
  type: InvoiceType;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  line_items?: string; // JSON string of InvoiceItem[]
  tax_rate_id?: string;
  shipping_amount: number;
  shipping_rate_id?: string;
  email_status: EmailStatus;
  email_sent_at?: string;
  email_error?: string;
  last_email_attempt?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceFormData {
  client_id: number;
  template_id?: number;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  due_date: string;
  issue_date: string;
  description?: string;
  items: InvoiceItem[];
  notes?: string;
  payment_terms?: string;
  type: InvoiceType;
  shipping_amount: number;
}

export interface InvoiceTemplate {
  id: number;
  name: string;
  client_id: number;
  amount: number;
  description?: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  payment_terms: string;
  next_invoice_date: string;
  is_active: number; // SQLite uses INTEGER for boolean (0 or 1)
  line_items?: string; // JSON string of InvoiceItem[]
  tax_amount: number;
  tax_rate_id?: string;
  shipping_amount: number;
  shipping_rate_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceTemplateFormData {
  name: string;
  client_id: number;
  amount: number;
  description?: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  payment_terms: string;
  next_invoice_date: string;
  is_active: boolean;
  items: InvoiceItem[];
  tax_amount: number;
  shipping_amount: number;
  notes?: string;
}

// For invoice statistics and reports
export interface InvoiceStats {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  by_status: Record<InvoiceStatus, number>;
  by_month: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
}

// For invoice filtering and searching
export interface InvoiceFilters {
  status?: InvoiceStatus | InvoiceStatus[];
  client_id?: number;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string;
}

// For invoice email sending
export interface InvoiceEmailData {
  id: number;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  due_date: string;
  status: InvoiceStatus;
  notes?: string;
}

// Email status update interface
export interface EmailStatusUpdate {
  email_status: EmailStatus;
  email_sent_at?: string;
  email_error?: string;
  last_email_attempt: string;
}

// Scheduled invoice interface
export interface ScheduledInvoice {
  id: number;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  due_date: string;
  status: InvoiceStatus;
  notes?: string;
  email_status?: EmailStatus;
}