
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Clock, FileText } from 'lucide-react';
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
import { sqliteService } from '@/lib/sqlite-service';

export const GeneralSettingsTab = () => {
  const [dateTimeSettings, setDateTimeSettings] = useState<DateTimeSettings>({ dateFormat: 'MM/DD/YYYY', timeFormat: '12-hour' });
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceNumberSettings>({ prefix: 'INV' });
  const [currency, setCurrency] = useState('USD');
  const [timeZone, setTimeZone] = useState('America/New_York');

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!sqliteService.isReady()) {
          await sqliteService.initialize();
        }

        const savedCurrency = await sqliteService.getSetting('default_currency');
        const savedTimeZone = await sqliteService.getSetting('default_timezone');
        const savedInvoiceSettings = await getInvoiceNumberSettings();
        const savedDateTimeSettings = await getDateTimeSettings();

        if (savedCurrency) setCurrency(savedCurrency);
        if (savedTimeZone) setTimeZone(savedTimeZone);
        setInvoiceSettings(savedInvoiceSettings);
        setDateTimeSettings(savedDateTimeSettings);
      } catch (error) {
        console.error('Error loading general settings:', error);
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
        await saveDateTimeSettings(dateTimeSettings);
        await saveInvoiceNumberSettings(invoiceSettings);
        await sqliteService.setSetting('default_currency', currency, 'general');
        await sqliteService.setSetting('default_timezone', timeZone, 'general');
      } catch (error) {
        console.error('Error saving general settings:', error);
      }
    }, 500);
  }, [dateTimeSettings, invoiceSettings, currency, timeZone]);

  useEffect(() => {
    // Only save if not initial load
    if (dateTimeSettings.dateFormat !== 'MM/DD/YYYY' || dateTimeSettings.timeFormat !== '12-hour' ||
        invoiceSettings.prefix !== 'INV' || currency !== 'USD' || timeZone !== 'America/New_York') {
      debouncedSaveSettings();
    }
  }, [dateTimeSettings, invoiceSettings, currency, timeZone, debouncedSaveSettings]);

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

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <h3 className="text-lg font-medium text-card-foreground mb-6">General Settings</h3>
      <div className="space-y-6">
        {/* Currency Settings */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Default Currency</label>
          <select
            className={`w-full ${themeClasses.select}`}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
          </select>
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
      </div>
    </div>
  );
};
