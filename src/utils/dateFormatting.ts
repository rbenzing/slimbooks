// Date and time formatting utilities that respect user settings

export interface DateTimeSettings {
  dateFormat: string;
  timeFormat: string;
}

// Default date and time formats
export const DEFAULT_DATE_TIME_SETTINGS: DateTimeSettings = {
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12-hour'
};

// Available date format options
export const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
  { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY (Dec 31, 2024)' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY (31 Dec 2024)' },
  { value: 'MMMM DD, YYYY', label: 'MMMM DD, YYYY (December 31, 2024)' }
];

// Available time format options
export const TIME_FORMAT_OPTIONS = [
  { value: '12-hour', label: '12-hour (2:30 PM)' },
  { value: '24-hour', label: '24-hour (14:30)' }
];

// Get current date/time settings from SQLite (synchronous version)
export const getDateTimeSettings = async (): Promise<DateTimeSettings> => {
  try {
    // Try to access sqliteService if it's already available globally
    if (typeof window !== 'undefined' && (window as unknown as { sqliteService?: { isReady(): boolean; getSetting(key: string): Promise<unknown> } }).sqliteService?.isReady()) {
      const sqliteService = (window as unknown as { sqliteService: { getSetting(key: string): Promise<DateTimeSettings | null> } }).sqliteService;
      const settings = await sqliteService.getSetting('date_time_settings');
      if (settings) {
        return {
          dateFormat: settings.dateFormat || DEFAULT_DATE_TIME_SETTINGS.dateFormat,
          timeFormat: settings.timeFormat || DEFAULT_DATE_TIME_SETTINGS.timeFormat
        };
      }
    }
  } catch (error) {
    console.error('Error loading date/time settings:', error);
  }
  return DEFAULT_DATE_TIME_SETTINGS;
};

// Async version for components that can handle async operations
export const getDateTimeSettingsAsync = async (): Promise<DateTimeSettings> => {
  try {
    const { sqliteService } = await import('@/services/sqlite.svc');

    if (sqliteService.isReady()) {
      const settings = await sqliteService.getSetting('date_time_settings');
      if (settings) {
        return {
          dateFormat: settings.dateFormat || DEFAULT_DATE_TIME_SETTINGS.dateFormat,
          timeFormat: settings.timeFormat || DEFAULT_DATE_TIME_SETTINGS.timeFormat
        };
      }
    }
  } catch (error) {
    console.error('Error loading date/time settings:', error);
  }
  return DEFAULT_DATE_TIME_SETTINGS;
};

// Save date/time settings to SQLite
export const saveDateTimeSettings = async (settings: DateTimeSettings): Promise<void> => {
  try {
    // Use dynamic import to avoid circular dependencies
    const { sqliteService } = await import('@/services/sqlite.svc');

    if (sqliteService.isReady()) {
      await sqliteService.setSetting('date_time_settings', settings, 'general');
    }
  } catch (error) {
    console.error('Error saving date/time settings:', error);
  }
};

// Convert date format string to Intl.DateTimeFormat options
const getDateFormatOptions = (format: string): Intl.DateTimeFormatOptions => {
  switch (format) {
    case 'MM/DD/YYYY':
      return { year: 'numeric', month: '2-digit', day: '2-digit' };
    case 'DD/MM/YYYY':
      return { year: 'numeric', month: '2-digit', day: '2-digit' };
    case 'YYYY-MM-DD':
      return { year: 'numeric', month: '2-digit', day: '2-digit' };
    case 'MMM DD, YYYY':
      return { year: 'numeric', month: 'short', day: 'numeric' };
    case 'DD MMM YYYY':
      return { year: 'numeric', month: 'short', day: 'numeric' };
    case 'MMMM DD, YYYY':
      return { year: 'numeric', month: 'long', day: 'numeric' };
    default:
      return { year: 'numeric', month: '2-digit', day: '2-digit' };
  }
};

// Convert time format string to Intl.DateTimeFormat options
const getTimeFormatOptions = (format: string): Intl.DateTimeFormatOptions => {
  return {
    hour: '2-digit',
    minute: '2-digit',
    hour12: format === '12-hour'
  };
};

// Format a date according to user settings
export const formatDate = async (date: Date | string, customFormat?: string): Promise<string> => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const settings = await getDateTimeSettings();
  const format = customFormat || settings.dateFormat;
  const options = getDateFormatOptions(format);

  // Handle special formatting cases
  if (format === 'DD/MM/YYYY') {
    const formatted = dateObj.toLocaleDateString('en-GB', options);
    return formatted;
  } else if (format === 'YYYY-MM-DD') {
    return dateObj.toISOString().split('T')[0];
  } else if (format === 'DD MMM YYYY') {
    const formatted = dateObj.toLocaleDateString('en-GB', options);
    return formatted;
  }

  return dateObj.toLocaleDateString('en-US', options);
};

// Format a time according to user settings
export const formatTime = async (date: Date | string, customFormat?: string): Promise<string> => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Time';
  }

  const settings = await getDateTimeSettings();
  const format = customFormat || settings.timeFormat;
  const options = getTimeFormatOptions(format);

  return dateObj.toLocaleTimeString('en-US', options);
};

// Format a date and time together according to user settings
export const formatDateTime = async (date: Date | string, customDateFormat?: string, customTimeFormat?: string): Promise<string> => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date/Time';
  }

  const formattedDate = await formatDate(dateObj, customDateFormat);
  const formattedTime = await formatTime(dateObj, customTimeFormat);
  
  return `${formattedDate} ${formattedTime}`;
};

// Format a date range according to user settings
export const formatDateRange = async (startDate: Date | string, endDate: Date | string, customFormat?: string): Promise<string> => {
  const start = await formatDate(startDate, customFormat);
  const end = await formatDate(endDate, customFormat);
  return `${start} - ${end}`;
};

// Synchronous version of formatDate using default format
export const formatDateSync = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  // Use default US format for synchronous version
  return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// Synchronous version of formatDateRange using default format
export const formatDateRangeSync = (startDate: Date | string, endDate: Date | string): string => {
  const startObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const endObj = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
    return 'Invalid Date Range';
  }

  // Use default US format for synchronous version
  const start = startObj.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const end = endObj.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  return `${start} - ${end}`;
};

// Get a preview of how dates will look with the given format (synchronous)
export const getDateFormatPreview = (format: string): string => {
  const sampleDate = new Date(2024, 11, 31); // December 31, 2024
  const options = getDateFormatOptions(format);

  // Handle special formatting cases
  if (format === 'DD/MM/YYYY') {
    return sampleDate.toLocaleDateString('en-GB', options);
  } else if (format === 'YYYY-MM-DD') {
    return sampleDate.toISOString().split('T')[0];
  } else if (format === 'DD MMM YYYY') {
    return sampleDate.toLocaleDateString('en-GB', options);
  }

  return sampleDate.toLocaleDateString('en-US', options);
};

// Get a preview of how times will look with the given format (synchronous)
export const getTimeFormatPreview = (format: string): string => {
  const sampleDate = new Date(2024, 11, 31, 14, 30); // December 31, 2024 2:30 PM
  const options = getTimeFormatOptions(format);
  return sampleDate.toLocaleTimeString('en-US', options);
};
