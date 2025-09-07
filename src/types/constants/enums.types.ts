// Application enums and constant types

// Payment related enums
export type PaymentStatus = 'received' | 'pending' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'paypal' | 'other';

// Invoice related enums
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

// User roles
export type UserRole = 'admin' | 'user' | 'viewer';

// Application states
export type AppTheme = 'light' | 'dark' | 'system';

// File types
export type SupportedFileType = 'pdf' | 'csv' | 'xlsx' | 'json';

// Currency codes (ISO 4217)
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

// Date formats
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY';

// Time formats
export type TimeFormat = '12h' | '24h';

// Language codes (ISO 639-1)
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt';