import { TimePeriod, DateRange, DateRangeFilterOption } from '@/types';

// Get start and end of day for proper date range comparison
const getStartOfDay = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getEndOfDay = (date: Date): Date => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

// Get start and end of week (Sunday to Saturday)
const getStartOfWeek = (date: Date): Date => {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  return getStartOfDay(start);
};

const getEndOfWeek = (date: Date): Date => {
  const end = new Date(date);
  const day = end.getDay();
  end.setDate(end.getDate() + (6 - day));
  return getEndOfDay(end);
};

// Get start and end of month
const getStartOfMonth = (date: Date): Date => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  return getStartOfDay(start);
};

const getEndOfMonth = (date: Date): Date => {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return getEndOfDay(end);
};

// Get start and end of year
const getStartOfYear = (date: Date): Date => {
  const start = new Date(date.getFullYear(), 0, 1);
  return getStartOfDay(start);
};

const getEndOfYear = (date: Date): Date => {
  const end = new Date(date.getFullYear(), 11, 31);
  return getEndOfDay(end);
};

export const dateRangeFilterOptions: DateRangeFilterOption[] = [
  {
    value: 'this-month',
    label: 'This Month',
    getDateRange: () => {
      const now = new Date();
      return {
        start: getStartOfMonth(now),
        end: getEndOfMonth(now)
      };
    }
  },
  {
    value: 'last-month',
    label: 'Last Month',
    getDateRange: () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        start: getStartOfMonth(lastMonth),
        end: getEndOfMonth(lastMonth)
      };
    }
  },
  {
    value: 'this-year',
    label: 'This Year',
    getDateRange: () => {
      const now = new Date();
      return {
        start: getStartOfYear(now),
        end: getEndOfYear(now)
      };
    }
  },
  {
    value: 'last-year',
    label: 'Last Year',
    getDateRange: () => {
      const now = new Date();
      const lastYear = new Date(now.getFullYear() - 1, 0, 1);
      return {
        start: getStartOfYear(lastYear),
        end: getEndOfYear(lastYear)
      };
    }
  },
  {
    value: 'last-30-days',
    label: 'Last 30 Days',
    getDateRange: () => {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return {
        start: getStartOfDay(thirtyDaysAgo),
        end: getEndOfDay(now)
      };
    }
  },
  {
    value: 'last-7-days',
    label: 'Last 7 Days',
    getDateRange: () => {
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return {
        start: getStartOfDay(sevenDaysAgo),
        end: getEndOfDay(now)
      };
    }
  },
  {
    value: 'this-week',
    label: 'This Week',
    getDateRange: () => {
      const now = new Date();
      return {
        start: getStartOfWeek(now),
        end: getEndOfWeek(now)
      };
    }
  },
  {
    value: 'last-week',
    label: 'Last Week',
    getDateRange: () => {
      const now = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(now.getDate() - 7);
      return {
        start: getStartOfWeek(lastWeek),
        end: getEndOfWeek(lastWeek)
      };
    }
  },
  {
    value: 'custom',
    label: 'Custom Range',
    getDateRange: () => {
      // This will be handled separately with date inputs
      const now = new Date();
      return {
        start: getStartOfDay(now),
        end: getEndOfDay(now)
      };
    }
  }
];

// Get date range for a given time period
export const getDateRangeForPeriod = (period: TimePeriod): DateRange => {
  const option = dateRangeFilterOptions.find(opt => opt.value === period);
  if (!option) {
    // Default to this month if period not found
    return dateRangeFilterOptions[0].getDateRange();
  }
  return option.getDateRange();
};

// Filter items by date range based on a date field
export const filterByDateRange = <T extends Record<string, unknown>>(
  items: T[],
  dateRange: DateRange,
  dateField: keyof T = 'date'
): T[] => {
  if (!items || items.length === 0) return [];

  return items.filter(item => {
    const itemDateStr = item[dateField];
    if (!itemDateStr) return false;

    const itemDate = new Date(itemDateStr);
    if (isNaN(itemDate.getTime())) return false;

    return itemDate >= dateRange.start && itemDate <= dateRange.end;
  });
};

// Check if a date is within a date range
export const isDateInRange = (date: Date | string, dateRange: DateRange): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return false;
  
  return dateObj >= dateRange.start && dateObj <= dateRange.end;
};

// Get a human-readable label for a date range
export const getDateRangeLabel = (dateRange: DateRange): string => {
  const start = dateRange.start.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const end = dateRange.end.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  // If same day, just show one date
  if (start === end) {
    return start;
  }
  
  return `${start} - ${end}`;
};

// Get default date range (this month)
export const getDefaultDateRange = (): DateRange => {
  return getDateRangeForPeriod('this-month');
};

// Format date range for API calls (ISO string format)
export const formatDateRangeForAPI = (dateRange: DateRange): { start: string; end: string } => {
  return {
    start: dateRange.start.toISOString().split('T')[0],
    end: dateRange.end.toISOString().split('T')[0]
  };
};