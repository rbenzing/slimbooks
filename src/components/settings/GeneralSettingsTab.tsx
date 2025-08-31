
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Clock, FileText, DollarSign, List } from 'lucide-react';
import { themeClasses } from '@/lib/utils';
import {
  getDateTimeSettings,
  saveDateTimeSettings,
  DATE_FORMAT_OPTIONS,
  TIME_FORMAT_OPTIONS,
  getDateFormatPreview,
  getTimeFormatPreview,
  type DateTimeSettings
} from '@/utils/dateFormatting';
import {
  getInvoiceNumberSettings,
  saveInvoiceNumberSettings,
  getInvoiceNumberPreview,
  getSuggestedPrefixes,
  type InvoiceNumberSettings
} from '@/utils/invoiceNumbering';
import {
  getCurrencySettings,
  saveCurrencySettings,
  CURRENCY_OPTIONS,
  SYMBOL_POSITION_OPTIONS,
  DECIMAL_PLACES_OPTIONS,
  THOUSANDS_SEPARATOR_OPTIONS,
  DECIMAL_SEPARATOR_OPTIONS,
  getCurrencyFormatPreview,
  type CurrencySettings
} from '@/utils/currencyFormatting';
import {
  getPaginationSettingsAsync,
  savePaginationSettings,
  DEFAULT_ITEMS_PER_PAGE_OPTIONS,
  MAX_ITEMS_PER_PAGE_OPTIONS,
  AVAILABLE_PAGE_SIZES_OPTIONS,
  MAX_PAGE_NUMBERS_OPTIONS,
  validatePaginationSettings,
  type PaginationSettings
} from '@/utils/paginationSettings';

export const GeneralSettingsTab = () => {
  const [dateTimeSettings, setDateTimeSettings] = useState<DateTimeSettings>({ dateFormat: 'MM/DD/YYYY', timeFormat: '12-hour' });
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceNumberSettings>({ prefix: 'INV' });
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>({
    currency: 'USD',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  });
  const [paginationSettings, setPaginationSettings] = useState<PaginationSettings>({
    defaultItemsPerPage: 25,
    availablePageSizes: [10, 25, 50, 100],
    maxItemsPerPage: 500,
    showItemsPerPageSelector: true,
    showPageNumbers: true,
    maxPageNumbers: 5
  });
  const [timeZone, setTimeZone] = useState('America/New_York');
  const [isLoaded, setIsLoaded] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Use dynamic import to avoid circular dependencies
        const { sqliteService } = await import('@/services/sqlite.svc');
        
        if (!sqliteService.isReady()) {
          await sqliteService.initialize();
        }

        // Use the new bulk settings API for better efficiency
        try {
          const allSettings = await sqliteService.getAllSettings('general');

          // Load settings from bulk response
          if (allSettings.default_timezone) setTimeZone(allSettings.default_timezone);
          if (allSettings.currency_format_settings) setCurrencySettings(allSettings.currency_format_settings);
          if (allSettings.date_time_settings) setDateTimeSettings(allSettings.date_time_settings);
          if (allSettings.invoice_number_settings) setInvoiceSettings(allSettings.invoice_number_settings);
          if (allSettings.pagination_settings) setPaginationSettings(allSettings.pagination_settings);
        } catch (bulkError) {
          console.warn('Bulk settings API failed, falling back to individual calls:', bulkError);

          // Fallback to individual calls if bulk API fails
          const savedTimeZone = await sqliteService.getSetting('default_timezone');
          const savedInvoiceSettings = await getInvoiceNumberSettings();
          const savedDateTimeSettings = await getDateTimeSettings();
          const savedCurrencySettings = await getCurrencySettings();
          const savedPaginationSettings = await getPaginationSettingsAsync();

          if (savedTimeZone) setTimeZone(savedTimeZone);
          setInvoiceSettings(savedInvoiceSettings);
          setDateTimeSettings(savedDateTimeSettings);
          setCurrencySettings(savedCurrencySettings);
          setPaginationSettings(savedPaginationSettings);
        }

        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading general settings:', error);
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Debounced save functions
  const debouncedSaveSettings = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Use bulk save for better efficiency
        const settingsToSave = {
          'date_time_settings': { value: dateTimeSettings, category: 'general' },
          'invoice_number_settings': { value: invoiceSettings, category: 'general' },
          'currency_format_settings': { value: currencySettings, category: 'general' },
          'pagination_settings': { value: validatePaginationSettings(paginationSettings), category: 'general' },
          'default_timezone': { value: timeZone, category: 'general' }
        };

        // Use dynamic import to avoid circular dependencies
        const { sqliteService } = await import('@/services/sqlite.svc');
        await sqliteService.setMultipleSettings(settingsToSave);
      } catch (error) {
        console.error('Error saving general settings:', error);

        // Fallback to individual saves if bulk save fails
        try {
          await saveDateTimeSettings(dateTimeSettings);
          await saveInvoiceNumberSettings(invoiceSettings);
          await saveCurrencySettings(currencySettings);
          await savePaginationSettings(validatePaginationSettings(paginationSettings));
          const { sqliteService: sqliteServiceFallback } = await import('@/services/sqlite.svc');
          await sqliteServiceFallback.setSetting('default_timezone', timeZone, 'general');
        } catch (fallbackError) {
          console.error('Error with fallback save:', fallbackError);
        }
      }
    }, 500);
  }, [dateTimeSettings, invoiceSettings, currencySettings, paginationSettings, timeZone]);

  useEffect(() => {
    // Only save if settings have been loaded and this is a user change
    if (isLoaded) {
      debouncedSaveSettings();
    }
  }, [dateTimeSettings, invoiceSettings, currencySettings, timeZone, debouncedSaveSettings, isLoaded]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleDateFormatChange = (format: string) => {
    setDateTimeSettings(prev => ({ ...prev, dateFormat: format }));
  };

  const handleTimeFormatChange = (format: string) => {
    setDateTimeSettings(prev => ({ ...prev, timeFormat: format }));
  };

  const handleInvoicePrefixChange = (prefix: string) => {
    setInvoiceSettings(prev => ({ ...prev, prefix: prefix.toUpperCase() }));
  };

  const handleCurrencyChange = (field: keyof CurrencySettings, value: string | number) => {
    setCurrencySettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <h3 className="text-lg font-medium text-card-foreground mb-6">General Settings</h3>
      <div className="space-y-6">
        {/* Currency Settings */}
        <div className="space-y-4">
          <div className="flex items-center mb-4">
            <DollarSign className="h-4 w-4 text-primary mr-2" />
            <h4 className="text-sm font-medium text-muted-foreground">Currency Format</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Currency</label>
              <select
                className={`w-full ${themeClasses.select}`}
                value={currencySettings.currency}
                onChange={(e) => handleCurrencyChange('currency', e.target.value)}
              >
                {CURRENCY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Symbol Position</label>
              <select
                className={`w-full ${themeClasses.select}`}
                value={currencySettings.symbolPosition}
                onChange={(e) => handleCurrencyChange('symbolPosition', e.target.value)}
              >
                {SYMBOL_POSITION_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Decimal Places</label>
              <select
                className={`w-full ${themeClasses.select}`}
                value={currencySettings.decimalPlaces}
                onChange={(e) => handleCurrencyChange('decimalPlaces', parseInt(e.target.value))}
              >
                {DECIMAL_PLACES_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Thousands Separator</label>
              <select
                className={`w-full ${themeClasses.select}`}
                value={currencySettings.thousandsSeparator}
                onChange={(e) => handleCurrencyChange('thousandsSeparator', e.target.value)}
              >
                {THOUSANDS_SEPARATOR_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Decimal Separator</label>
            <select
              className={`w-full md:w-1/2 ${themeClasses.select}`}
              value={currencySettings.decimalSeparator}
              onChange={(e) => handleCurrencyChange('decimalSeparator', e.target.value)}
            >
              {DECIMAL_SEPARATOR_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground mb-1">Preview:</p>
            <p className="text-sm font-medium text-card-foreground">
              {getCurrencyFormatPreview(currencySettings)}
            </p>
          </div>
        </div>

        {/* Time Zone Settings */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Time Zone</label>
          <select
            className={`w-full ${themeClasses.select}`}
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
          >
            <option value="America/New_York">America/New_York (EST/EDT)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
            <option value="America/Chicago">America/Chicago (CST/CDT)</option>
            <option value="America/Denver">America/Denver (MST/MDT)</option>
            <option value="Europe/London">Europe/London (GMT/BST)</option>
            <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
          </select>
        </div>

        {/* Date Format Settings */}
        <div>
          <div className="flex items-center mb-2">
            <Calendar className="h-4 w-4 text-primary mr-2" />
            <label className="block text-sm font-medium text-muted-foreground">Date Format</label>
          </div>
          <select
            className={`w-full ${themeClasses.select}`}
            value={dateTimeSettings.dateFormat}
            onChange={(e) => handleDateFormatChange(e.target.value)}
          >
            {DATE_FORMAT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Preview: {getDateFormatPreview(dateTimeSettings.dateFormat)}
          </p>
        </div>

        {/* Time Format Settings */}
        <div>
          <div className="flex items-center mb-2">
            <Clock className="h-4 w-4 text-primary mr-2" />
            <label className="block text-sm font-medium text-muted-foreground">Time Format</label>
          </div>
          <select
            className={`w-full ${themeClasses.select}`}
            value={dateTimeSettings.timeFormat}
            onChange={(e) => handleTimeFormatChange(e.target.value)}
          >
            {TIME_FORMAT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Preview: {getTimeFormatPreview(dateTimeSettings.timeFormat)}
          </p>
        </div>

        {/* Invoice Prefix Settings */}
        <div>
          <div className="flex items-center mb-2">
            <FileText className="h-4 w-4 text-primary mr-2" />
            <label className="block text-sm font-medium text-muted-foreground">Invoice Number Prefix</label>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              className={`flex-1 ${themeClasses.input}`}
              value={invoiceSettings.prefix}
              onChange={(e) => handleInvoicePrefixChange(e.target.value)}
              placeholder="Enter prefix (e.g., INV, INVOICE)"
              maxLength={10}
            />
            <select
              className={`${themeClasses.select} w-32`}
              value=""
              onChange={(e) => e.target.value && handleInvoicePrefixChange(e.target.value)}
            >
              <option value="">Quick Select</option>
              {getSuggestedPrefixes().map(prefix => (
                <option key={prefix} value={prefix}>
                  {prefix}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Preview: {getInvoiceNumberPreview(invoiceSettings.prefix)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Note: Changing the prefix will only affect new invoices. Existing invoices will keep their current numbers.
          </p>
        </div>

        {/* Pagination Settings */}
        <div className="space-y-4">
          <div className="flex items-center mb-4">
            <List className="h-4 w-4 text-primary mr-2" />
            <h4 className="text-sm font-medium text-muted-foreground">Pagination Settings</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Default Items Per Page */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Default Items Per Page
              </label>
              <select
                value={paginationSettings.defaultItemsPerPage}
                onChange={(e) => setPaginationSettings({
                  ...paginationSettings,
                  defaultItemsPerPage: Number(e.target.value)
                })}
                className={themeClasses.select}
              >
                {DEFAULT_ITEMS_PER_PAGE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Maximum Items Per Page */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Maximum Items Per Page
              </label>
              <select
                value={paginationSettings.maxItemsPerPage}
                onChange={(e) => setPaginationSettings({
                  ...paginationSettings,
                  maxItemsPerPage: Number(e.target.value)
                })}
                className={themeClasses.select}
              >
                {MAX_ITEMS_PER_PAGE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Available Page Sizes */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Available Page Sizes
              </label>
              <select
                value={JSON.stringify(paginationSettings.availablePageSizes)}
                onChange={(e) => setPaginationSettings({
                  ...paginationSettings,
                  availablePageSizes: JSON.parse(e.target.value)
                })}
                className={themeClasses.select}
              >
                {AVAILABLE_PAGE_SIZES_OPTIONS.map(option => (
                  <option key={JSON.stringify(option.value)} value={JSON.stringify(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Page Numbers */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Page Numbers to Show
              </label>
              <select
                value={paginationSettings.maxPageNumbers}
                onChange={(e) => setPaginationSettings({
                  ...paginationSettings,
                  maxPageNumbers: Number(e.target.value)
                })}
                className={themeClasses.select}
              >
                {MAX_PAGE_NUMBERS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pagination Feature Toggles */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showItemsPerPageSelector"
                checked={paginationSettings.showItemsPerPageSelector}
                onChange={(e) => setPaginationSettings({
                  ...paginationSettings,
                  showItemsPerPageSelector: e.target.checked
                })}
                className="rounded border-border"
              />
              <label htmlFor="showItemsPerPageSelector" className="ml-2 text-sm text-card-foreground">
                Show items per page selector
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showPageNumbers"
                checked={paginationSettings.showPageNumbers}
                onChange={(e) => setPaginationSettings({
                  ...paginationSettings,
                  showPageNumbers: e.target.checked
                })}
                className="rounded border-border"
              />
              <label htmlFor="showPageNumbers" className="ml-2 text-sm text-card-foreground">
                Show page numbers
              </label>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            These settings control pagination behavior across invoices, expenses, clients, and payments.
          </p>
        </div>
      </div>
    </div>
  );
};
