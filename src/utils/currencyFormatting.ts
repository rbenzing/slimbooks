// Currency formatting utilities with user settings support

export interface CurrencySettings {
  currency: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
  thousandsSeparator: ',' | '.' | ' ' | 'none';
  decimalSeparator: '.' | ',';
}

export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  currency: 'USD',
  symbolPosition: 'before',
  decimalPlaces: 2,
  thousandsSeparator: ',',
  decimalSeparator: '.'
};

// Currency format options for the settings UI
export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
  { value: 'CHF', label: 'CHF - Swiss Franc', symbol: 'CHF' },
  { value: 'CNY', label: 'CNY - Chinese Yuan', symbol: '¥' },
  { value: 'INR', label: 'INR - Indian Rupee', symbol: '₹' },
  { value: 'BRL', label: 'BRL - Brazilian Real', symbol: 'R$' }
];

export const SYMBOL_POSITION_OPTIONS = [
  { value: 'before', label: 'Before amount ($100.00)' },
  { value: 'after', label: 'After amount (100.00$)' }
];

export const DECIMAL_PLACES_OPTIONS = [
  { value: 0, label: '0 decimal places (100)' },
  { value: 1, label: '1 decimal place (100.0)' },
  { value: 2, label: '2 decimal places (100.00)' },
  { value: 3, label: '3 decimal places (100.000)' }
];

export const THOUSANDS_SEPARATOR_OPTIONS = [
  { value: ',', label: 'Comma (1,000.00)' },
  { value: '.', label: 'Period (1.000,00)' },
  { value: ' ', label: 'Space (1 000.00)' },
  { value: 'none', label: 'None (1000.00)' }
];

export const DECIMAL_SEPARATOR_OPTIONS = [
  { value: '.', label: 'Period (100.00)' },
  { value: ',', label: 'Comma (100,00)' }
];

// Get currency symbol for a given currency code
export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = CURRENCY_OPTIONS.find(c => c.value === currencyCode);
  return currency?.symbol || currencyCode;
};

// Cache for currency settings to prevent duplicate API calls
let currencySettingsCache: CurrencySettings | null = null;
let currencySettingsPromise: Promise<CurrencySettings> | null = null;

// Get current currency settings from SQLite (async)
export const getCurrencySettings = async (): Promise<CurrencySettings> => {
  // Return cached settings if available
  if (currencySettingsCache) {
    return currencySettingsCache;
  }

  // Return existing promise if one is already in progress
  if (currencySettingsPromise) {
    return currencySettingsPromise;
  }

  // Create new promise and cache it
  currencySettingsPromise = (async () => {
    try {
      // Use dynamic import to avoid circular dependencies
      const { sqliteService } = await import('@/services/sqlite.svc');

      if (sqliteService.isReady()) {
        const settings = await sqliteService.getSetting('currency_format_settings');
        if (settings) {
          const result = {
            currency: settings.currency || DEFAULT_CURRENCY_SETTINGS.currency,
            symbolPosition: settings.symbolPosition || DEFAULT_CURRENCY_SETTINGS.symbolPosition,
            decimalPlaces: settings.decimalPlaces ?? DEFAULT_CURRENCY_SETTINGS.decimalPlaces,
            thousandsSeparator: settings.thousandsSeparator || DEFAULT_CURRENCY_SETTINGS.thousandsSeparator,
            decimalSeparator: settings.decimalSeparator || DEFAULT_CURRENCY_SETTINGS.decimalSeparator
          };
          currencySettingsCache = result;
          return result;
        }
      }
    } catch (error) {
      console.error('Error loading currency settings:', error);
    }

    currencySettingsCache = DEFAULT_CURRENCY_SETTINGS;
    return DEFAULT_CURRENCY_SETTINGS;
  })();

  const result = await currencySettingsPromise;
  currencySettingsPromise = null; // Clear promise after completion
  return result;
};

// Save currency settings to SQLite
export const saveCurrencySettings = async (settings: CurrencySettings): Promise<void> => {
  try {
    // Use dynamic import to avoid circular dependencies
    const { sqliteService } = await import('@/services/sqlite.svc');

    if (sqliteService.isReady()) {
      await sqliteService.setSetting('currency_format_settings', settings, 'general');
    }
  } catch (error) {
    console.error('Error saving currency settings:', error);
  }
};

// Format a number according to currency settings
const formatNumber = (amount: number, settings: CurrencySettings): string => {
  const { decimalPlaces, thousandsSeparator, decimalSeparator } = settings;
  
  // Round to specified decimal places
  const rounded = Number(amount.toFixed(decimalPlaces));
  
  // Split into integer and decimal parts
  const parts = rounded.toFixed(decimalPlaces).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Add thousands separator
  if (thousandsSeparator !== 'none' && integerPart.length > 3) {
    const regex = /(\d)(?=(\d{3})+(?!\d))/g;
    integerPart = integerPart.replace(regex, `$1${thousandsSeparator}`);
  }
  
  // Combine with decimal separator
  let result = integerPart;
  if (decimalPlaces > 0) {
    result += decimalSeparator + decimalPart;
  }
  
  return result;
};

// Format currency according to user settings (async)
export const formatCurrency = async (amount: number | undefined | null, customSettings?: Partial<CurrencySettings>): Promise<string> => {
  const safeAmount = amount || 0;
  const settings = customSettings ? { ...await getCurrencySettings(), ...customSettings } : await getCurrencySettings();
  
  const symbol = getCurrencySymbol(settings.currency);
  const formattedNumber = formatNumber(safeAmount, settings);
  
  return settings.symbolPosition === 'before' 
    ? `${symbol}${formattedNumber}`
    : `${formattedNumber}${symbol}`;
};

// Synchronous version using default settings (for components that can't handle async)
export const formatCurrencySync = (amount: number | undefined | null, currency: string = 'USD'): string => {
  const safeAmount = amount || 0;
  const symbol = getCurrencySymbol(currency);
  
  // Use default formatting for sync version
  const formatted = safeAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `${symbol}${formatted}`;
};

// Get a preview of how currency will look with given settings
export const getCurrencyFormatPreview = (settings: CurrencySettings): string => {
  const sampleAmount = 1234.56;
  const symbol = getCurrencySymbol(settings.currency);
  const formattedNumber = formatNumber(sampleAmount, settings);
  
  return settings.symbolPosition === 'before' 
    ? `${symbol}${formattedNumber}`
    : `${formattedNumber}${symbol}`;
};

// Validate currency settings
export const validateCurrencySettings = (settings: Partial<CurrencySettings>): boolean => {
  if (settings.currency && !CURRENCY_OPTIONS.find(c => c.value === settings.currency)) {
    return false;
  }
  
  if (settings.symbolPosition && !['before', 'after'].includes(settings.symbolPosition)) {
    return false;
  }
  
  if (settings.decimalPlaces !== undefined && (settings.decimalPlaces < 0 || settings.decimalPlaces > 10)) {
    return false;
  }
  
  if (settings.thousandsSeparator && ![',' , '.', ' ', 'none'].includes(settings.thousandsSeparator)) {
    return false;
  }
  
  if (settings.decimalSeparator && !['.', ','].includes(settings.decimalSeparator)) {
    return false;
  }
  
  return true;
};
