// Central export file for all TypeScript types and interfaces
// Organized into logical categories for better maintainability

// === Shared Utility Types ===
// Generic TypeScript utilities, brand types, and common patterns
export * from './shared/utility.types';
export * from './shared/api.types';
export * from './shared/form.types';
export * from './shared/ui.types';
export * from './shared/database.types';
export * from './shared/import.types';
export * from './shared/theme.types';

// === Domain-Specific Types ===
// Business logic and feature-specific types
export * from './domain/auth.types';
export * from './domain/client.types';
export * from './domain/invoice.types';
export * from './domain/expense.types';
export * from './domain/payment.types';
export * from './domain/settings.types';

// Export additional domain types if they exist
export * from './domain/stripe.types';
export * from './domain/reports.types';

// === Constants and Enums ===
// Application constants, enums, and default values
export {
  PaymentStatus,
  PaymentMethod,
  InvoiceStatus,
  UserRole,
  AppTheme,
  SupportedFileType,
  CurrencyCode,
  DateFormat,
  TimeFormat,
  LanguageCode,
  DEFAULT_PAGINATION_SETTINGS,
  DEFAULT_ITEMS_PER_PAGE_OPTIONS,
  MAX_ITEMS_PER_PAGE_OPTIONS,
  AVAILABLE_PAGE_SIZES_OPTIONS,
  MAX_PAGE_NUMBERS_OPTIONS,
  DEFAULT_DATE_TIME_SETTINGS,
  DATE_FORMAT_OPTIONS,
  TIME_FORMAT_OPTIONS,
  DEFAULT_INVOICE_NUMBER_SETTINGS,
  SUGGESTED_INVOICE_PREFIXES
} from './constants/enums.types';

// === Shared Common Types ===
// Common types that may be used across multiple domains
export * from './shared/common.types';

// === Type Guards and Utilities ===
// Common type guard functions for runtime type checking
export const isValidEmail = (email: string): email is EmailString => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidURL = (url: string): url is URLString => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isNonNullable = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};