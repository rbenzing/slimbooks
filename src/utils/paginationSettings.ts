// Pagination settings utilities for consistent pagination across the application

export interface PaginationSettings {
  defaultItemsPerPage: number;
  availablePageSizes: number[];
  maxItemsPerPage: number;
  showItemsPerPageSelector: boolean;
  showPageNumbers: boolean;
  maxPageNumbers: number;
}

// Default pagination settings
export const DEFAULT_PAGINATION_SETTINGS: PaginationSettings = {
  defaultItemsPerPage: 25,
  availablePageSizes: [10, 25, 50, 100],
  maxItemsPerPage: 500,
  showItemsPerPageSelector: true,
  showPageNumbers: true,
  maxPageNumbers: 5
};

// Available options for settings UI
export const DEFAULT_ITEMS_PER_PAGE_OPTIONS = [
  { value: 10, label: '10 items' },
  { value: 25, label: '25 items' },
  { value: 50, label: '50 items' },
  { value: 100, label: '100 items' }
];

export const MAX_ITEMS_PER_PAGE_OPTIONS = [
  { value: 100, label: '100 items' },
  { value: 250, label: '250 items' },
  { value: 500, label: '500 items' },
  { value: 1000, label: '1000 items' }
];

export const AVAILABLE_PAGE_SIZES_OPTIONS = [
  { value: [5, 10, 25], label: 'Small (5, 10, 25)' },
  { value: [10, 25, 50], label: 'Medium (10, 25, 50)' },
  { value: [10, 25, 50, 100], label: 'Standard (10, 25, 50, 100)' },
  { value: [25, 50, 100, 250], label: 'Large (25, 50, 100, 250)' }
];

export const MAX_PAGE_NUMBERS_OPTIONS = [
  { value: 3, label: '3 pages' },
  { value: 5, label: '5 pages' },
  { value: 7, label: '7 pages' },
  { value: 10, label: '10 pages' }
];

// Get current pagination settings from SQLite (asynchronous version)
export const getPaginationSettings = async (): Promise<PaginationSettings> => {
  try {
    // Try to access sqliteService if it's available globally
    if (typeof window !== 'undefined' && (window as any).sqliteService?.isReady()) {
      const sqliteService = (window as any).sqliteService;
      const settings = await sqliteService.getSetting('pagination_settings');
      if (settings) {
        return {
          defaultItemsPerPage: settings.defaultItemsPerPage || DEFAULT_PAGINATION_SETTINGS.defaultItemsPerPage,
          availablePageSizes: settings.availablePageSizes || DEFAULT_PAGINATION_SETTINGS.availablePageSizes,
          maxItemsPerPage: settings.maxItemsPerPage || DEFAULT_PAGINATION_SETTINGS.maxItemsPerPage,
          showItemsPerPageSelector: settings.showItemsPerPageSelector !== undefined 
            ? settings.showItemsPerPageSelector 
            : DEFAULT_PAGINATION_SETTINGS.showItemsPerPageSelector,
          showPageNumbers: settings.showPageNumbers !== undefined 
            ? settings.showPageNumbers 
            : DEFAULT_PAGINATION_SETTINGS.showPageNumbers,
          maxPageNumbers: settings.maxPageNumbers || DEFAULT_PAGINATION_SETTINGS.maxPageNumbers
        };
      }
    }
  } catch (error) {
    console.error('Error loading pagination settings:', error);
  }
  return DEFAULT_PAGINATION_SETTINGS;
};

// Async version for components that can handle async operations
export const getPaginationSettingsAsync = async (): Promise<PaginationSettings> => {
  try {
    const { sqliteService } = await import('@/services/sqlite.svc');

    if (sqliteService.isReady()) {
      const settings = await sqliteService.getSetting('pagination_settings');
      if (settings) {
        return {
          defaultItemsPerPage: settings.defaultItemsPerPage || DEFAULT_PAGINATION_SETTINGS.defaultItemsPerPage,
          availablePageSizes: settings.availablePageSizes || DEFAULT_PAGINATION_SETTINGS.availablePageSizes,
          maxItemsPerPage: settings.maxItemsPerPage || DEFAULT_PAGINATION_SETTINGS.maxItemsPerPage,
          showItemsPerPageSelector: settings.showItemsPerPageSelector !== undefined 
            ? settings.showItemsPerPageSelector 
            : DEFAULT_PAGINATION_SETTINGS.showItemsPerPageSelector,
          showPageNumbers: settings.showPageNumbers !== undefined 
            ? settings.showPageNumbers 
            : DEFAULT_PAGINATION_SETTINGS.showPageNumbers,
          maxPageNumbers: settings.maxPageNumbers || DEFAULT_PAGINATION_SETTINGS.maxPageNumbers
        };
      }
    }
  } catch (error) {
    console.error('Error loading pagination settings:', error);
  }
  return DEFAULT_PAGINATION_SETTINGS;
};

// Save pagination settings to SQLite
export const savePaginationSettings = async (settings: PaginationSettings): Promise<void> => {
  try {
    // Use dynamic import to avoid circular dependencies
    const { sqliteService } = await import('@/services/sqlite.svc');

    if (sqliteService.isReady()) {
      await sqliteService.setSetting('pagination_settings', settings, 'general');
    }
  } catch (error) {
    console.error('Error saving pagination settings:', error);
  }
};

// Validate pagination settings
export const validatePaginationSettings = (settings: PaginationSettings): PaginationSettings => {
  return {
    defaultItemsPerPage: Math.max(1, Math.min(settings.defaultItemsPerPage, settings.maxItemsPerPage)),
    availablePageSizes: settings.availablePageSizes.filter(size => size <= settings.maxItemsPerPage && size > 0),
    maxItemsPerPage: Math.max(1, settings.maxItemsPerPage),
    showItemsPerPageSelector: settings.showItemsPerPageSelector,
    showPageNumbers: settings.showPageNumbers,
    maxPageNumbers: Math.max(3, Math.min(settings.maxPageNumbers, 15))
  };
};

// Get pagination info for display
export const getPaginationInfo = (
  currentPage: number, 
  itemsPerPage: number, 
  totalItems: number
): {
  startIndex: number;
  endIndex: number;
  totalPages: number;
  displayStart: number;
  displayEnd: number;
} => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  return {
    startIndex,
    endIndex,
    totalPages,
    displayStart: startIndex + 1,
    displayEnd: Math.min(endIndex, totalItems)
  };
};

// Generate page numbers for pagination UI
export const generatePageNumbers = (
  currentPage: number,
  totalPages: number,
  maxPageNumbers: number
): number[] => {
  if (totalPages <= maxPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const halfMax = Math.floor(maxPageNumbers / 2);
  let startPage = Math.max(1, currentPage - halfMax);
  let endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);

  // Adjust if we're near the end
  if (endPage - startPage + 1 < maxPageNumbers) {
    startPage = Math.max(1, endPage - maxPageNumbers + 1);
  }

  return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
};