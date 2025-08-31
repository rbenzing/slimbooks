// Payment-related types and interfaces

export type PaymentStatus = 'received' | 'pending' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'paypal' | 'other';

export interface Payment {
  id: number;
  date: string;
  client_name: string;
  invoice_id?: number;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  description?: string;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface PaymentFormData {
  date: string;
  client_name: string;
  invoice_id?: number;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  description?: string;
  status: PaymentStatus;
}

// For payment statistics and reports
export interface PaymentStats {
  total_payments: number;
  total_amount: number;
  by_method: Record<PaymentMethod, number>;
  by_status: Record<PaymentStatus, number>;
  by_month: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
  average_payment_amount: number;
}

// For payment filtering and searching
export interface PaymentFilters {
  status?: PaymentStatus | PaymentStatus[];
  method?: PaymentMethod | PaymentMethod[];
  client_name?: string;
  invoice_id?: number;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string;
}

// For bulk operations
export interface BulkPaymentOperation {
  payment_ids: number[];
  operation: 'delete' | 'update_status' | 'export';
  new_status?: PaymentStatus;
}