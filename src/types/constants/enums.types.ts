// Application enums and constant types

// Payment related enums
export const PaymentStatus = {
  RECEIVED: 'received',
  PENDING: 'pending',
  FAILED: 'failed',
  REFUNDED: 'refunded'
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const PaymentMethod = {
  CASH: 'cash',
  CHECK: 'check',
  BANK_TRANSFER: 'bank_transfer',
  CREDIT_CARD: 'credit_card',
  PAYPAL: 'paypal',
  OTHER: 'other'
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

// Invoice related enums
export const InvoiceStatus = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
} as const;

export type InvoiceStatus = typeof InvoiceStatus[keyof typeof InvoiceStatus];

// User roles
export const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Application states
export const AppTheme = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
} as const;

export type AppTheme = typeof AppTheme[keyof typeof AppTheme];

// File types
export const SupportedFileType = {
  PDF: 'pdf',
  CSV: 'csv',
  XLSX: 'xlsx',
  JSON: 'json'
} as const;

export type SupportedFileType = typeof SupportedFileType[keyof typeof SupportedFileType];

// Currency codes (ISO 4217)
export const CurrencyCode = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  CAD: 'CAD',
  AUD: 'AUD',
  JPY: 'JPY'
} as const;

export type CurrencyCode = typeof CurrencyCode[keyof typeof CurrencyCode];

// Date formats
export const DateFormat = {
  MM_DD_YYYY: 'MM/DD/YYYY',
  DD_MM_YYYY: 'DD/MM/YYYY',
  YYYY_MM_DD: 'YYYY-MM-DD',
  DD_MM_YYYY_DASH: 'DD-MM-YYYY'
} as const;

export type DateFormat = typeof DateFormat[keyof typeof DateFormat];

// Time formats
export const TimeFormat = {
  TWELVE_HOUR: '12h',
  TWENTY_FOUR_HOUR: '24h'
} as const;

export type TimeFormat = typeof TimeFormat[keyof typeof TimeFormat];

// Language codes (ISO 639-1)
export const LanguageCode = {
  EN: 'en',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
  IT: 'it',
  PT: 'pt'
} as const;

export type LanguageCode = typeof LanguageCode[keyof typeof LanguageCode];