// Address formatting utilities for invoices and client management
// Handles null/undefined values properly to avoid "null" appearing in addresses

interface AddressFields {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
}

/**
 * Formats a client address by combining available fields and filtering out null/empty values
 * @param fields - Object containing address components
 * @returns Formatted address string or empty string if no valid fields
 */
export const formatClientAddress = (fields: AddressFields): string => {
  if (!fields) return '';

  const { address, city, state, zipCode, country } = fields;

  // Filter out null, undefined, and empty string values
  const addressParts: string[] = [];

  // Add street address if available
  if (address && address.trim()) {
    addressParts.push(address.trim());
  }

  // Build city, state, zip line
  const locationParts: string[] = [];
  if (city && city.trim()) {
    locationParts.push(city.trim());
  }
  if (state && state.trim()) {
    locationParts.push(state.trim());
  }
  if (zipCode && zipCode.trim()) {
    locationParts.push(zipCode.trim());
  }

  // Add location line if we have any location parts
  if (locationParts.length > 0) {
    addressParts.push(locationParts.join(', '));
  }

  // Add country if available and different from default
  if (country && country.trim() && country.trim().toLowerCase() !== 'us' && country.trim().toLowerCase() !== 'usa') {
    addressParts.push(country.trim());
  }

  return addressParts.join('\n');
};

/**
 * Formats a client address as a single line (for database storage)
 * @param fields - Object containing address components
 * @returns Single-line formatted address string
 */
export const formatClientAddressSingleLine = (fields: AddressFields): string => {
  if (!fields) return '';

  const { address, city, state, zipCode } = fields;

  // Filter out null, undefined, and empty string values
  const addressParts: string[] = [];

  if (address && address.trim()) {
    addressParts.push(address.trim());
  }
  if (city && city.trim()) {
    addressParts.push(city.trim());
  }
  if (state && state.trim()) {
    addressParts.push(state.trim());
  }
  if (zipCode && zipCode.trim()) {
    addressParts.push(zipCode.trim());
  }

  return addressParts.join(', ');
};

/**
 * Formats a company address for invoices and emails
 * @param company - Company settings object
 * @returns Formatted company address
 */
export const formatCompanyAddress = (company: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}): string => {
  return formatClientAddress(company);
};