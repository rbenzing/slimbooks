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
export const getDateTimeSettings = (): DateTimeSettings => {
  try {
    // Try to access sqliteService if it's already available globally
    if (typeof window !== 'undefined' && (window as any).sqliteService && (window as any).sqliteService.isReady()) {
      const settings = (window as any).sqliteService.getSetting('date_time_settings');
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
    const { sqliteService } = await import('@/lib/sqlite-service');

    if (sqliteService.isReady()) {
      const settings = sqliteService.getSetting('date_time_settings');
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
    const { sqliteService } = await import('@/lib/sqlite-service');

    if (sqliteService.isReady()) {
      sqliteService.setSetting('date_time_settings', settings, 'general');
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
export const formatDate = (date: Date | string, customFormat?: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const settings = getDateTimeSettings();
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
export const formatTime = (date: Date | string, customFormat?: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Time';
  }

  const settings = getDateTimeSettings();
  const format = customFormat || settings.timeFormat;
  const options = getTimeFormatOptions(format);

  return dateObj.toLocaleTimeString('en-US', options);
};

// Format a date and time together according to user settings
export const formatDateTime = (date: Date | string, customDateFormat?: string, customTimeFormat?: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date/Time';
  }

  const formattedDate = formatDate(dateObj, customDateFormat);
  const formattedTime = formatTime(dateObj, customTimeFormat);
  
  return `${formattedDate} ${formattedTime}`;
};

// Format a date range according to user settings
export const formatDateRange = (startDate: Date | string, endDate: Date | string, customFormat?: string): string => {
  const start = formatDate(startDate, customFormat);
  const end = formatDate(endDate, customFormat);
  return `${start} - ${end}`;
};

// Get a preview of how dates will look with the given format
export const getDateFormatPreview = (format: string): string => {
  const sampleDate = new Date(2024, 11, 31); // December 31, 2024
  return formatDate(sampleDate, format);
};

// Get a preview of how times will look with the given format
export const getTimeFormatPreview = (format: string): string => {
  const sampleDate = new Date(2024, 11, 31, 14, 30); // December 31, 2024 2:30 PM
  return formatTime(sampleDate, format);
};
