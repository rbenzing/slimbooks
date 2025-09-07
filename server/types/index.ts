// Server-specific types and re-exports
// Note: Cannot directly import from src/ due to TypeScript rootDir constraints

// Server-specific API types
export * from './api.types.js';

// Re-export commonly needed types for server use
export type PaymentStatus = 'received' | 'pending' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'paypal' | 'other';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type UserRole = 'admin' | 'user' | 'viewer';

// Base entity interface for database entities
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

// Essential database entity types for server use
export interface User extends BaseEntity {
  name: string;
  email: string;
  username: string;
  password_hash?: string;
  role: UserRole;
  email_verified: number;
  google_id?: string;
  two_factor_enabled?: number;
  two_factor_secret?: string;
  backup_codes?: string;
  last_login?: string;
  failed_login_attempts: number;
  account_locked_until?: string;
  password_updated_at?: string;
  email_verified_at?: string;
}

export interface UserPublic extends Omit<User, 'password_hash' | 'two_factor_secret' | 'backup_codes'> {}

export interface Client extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  tax_id?: string;
  notes?: string;
  is_active?: number;
}

export interface Invoice extends BaseEntity {
  invoice_number: string;
  client_id: number;
  amount: number;
  status: InvoiceStatus;
  due_date?: string;
  paid_date?: string;
  notes?: string;
}

export interface LineItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Template extends BaseEntity {
  name: string;
  content: string;
  is_default?: number;
  frequency?: 'monthly' | 'yearly' | 'weekly' | 'daily' | 'once';
}

export interface Expense extends BaseEntity {
  description: string;
  amount: number;
  date: string;
  category?: string;
  receipt_url?: string;
}

export interface Payment extends BaseEntity {
  invoice_id?: number;
  client_id: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  notes?: string;
  date: string;
}

// Additional server-specific database types
export interface ServiceOptions {
  timeout?: number;
  retries?: number;
  throwOnError?: boolean;
  limit?: number;
  offset?: number;
}

export interface QueryResult {
  changes: number;
  lastInsertRowid: number;
}

export interface Setting extends BaseEntity {
  key: string;
  value: string;
  category?: string;
  description?: string;
  enabled?: boolean | number | null;
}

// Complete project configuration structure (copied from shared types)
export interface ProjectSettings {
  google_oauth: {
    enabled: boolean;
    client_id: string;
    client_secret?: string;
    configured: boolean;
  };
  stripe: {
    enabled: boolean;
    publishable_key: string;
    secret_key?: string;
    configured: boolean;
  };
  email: {
    enabled: boolean;
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    email_from?: string;
    smtp_host?: string;
    smtp_port?: number;
    smtp_user?: string;
    smtp_pass?: string;
    configured: boolean;
  };
  security: {
    jwt_secret?: string;
    session_secret?: string;
    require_email_verification?: boolean;
    max_failed_login_attempts?: number;
    account_lockout_duration?: number;
    password_policy?: {
      min_length: number;
      require_uppercase: boolean;
      require_lowercase: boolean;
      require_numbers: boolean;
      require_special: boolean;
    };
  };
}

export interface ProjectSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  category?: string;
  created_at: string;
  updated_at: string;
  email?: any;
  google_oauth?: {
    enabled?: boolean;
    client_id?: string;
    configured?: boolean;
  };
  stripe?: {
    enabled?: boolean;
    publishable_key?: string;
    configured?: boolean;
  };
  security?: {
    require_email_verification?: boolean;
    max_failed_login_attempts?: number;
    account_lockout_duration?: number;
  };
}

export interface InvoiceWithClient extends Invoice {
  client_name?: string;
  client_email?: string;
  client_company?: string;
  client_address?: string;
  client_city?: string;
  client_state?: string;
  client_zipCode?: string;
  client_country?: string;
  client_phone?: string;
}

export interface ExpenseFilters {
  category?: string;
  date_from?: string;
  date_to?: string;
  client_id?: number;
  is_billable?: boolean;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}