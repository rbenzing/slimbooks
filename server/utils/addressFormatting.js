// Address formatting utilities for invoices and client management
// Handles null/undefined values properly to avoid "null" appearing in addresses

/**
 * Formats a client address as a single line (for database storage)
 * @param {Object} fields - Object containing address components
 * @param {string|null} fields.address - Street address
 * @param {string|null} fields.city - City
 * @param {string|null} fields.state - State
 * @param {string|null} fields.zipCode - ZIP code
 * @param {string|null} fields.country - Country
 * @returns {string} Single-line formatted address string
 */
export const formatClientAddressSingleLine = (fields) => {
  if (!fields) return '';

  const { address, city, state, zipCode } = fields;

  // Filter out null, undefined, and empty string values
  const addressParts = [];

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
 * Formats a client address by combining available fields and filtering out null/empty values
 * @param {Object} fields - Object containing address components
 * @param {string|null} fields.address - Street address
 * @param {string|null} fields.city - City
 * @param {string|null} fields.state - State
 * @param {string|null} fields.zipCode - ZIP code
 * @param {string|null} fields.country - Country
 * @returns {string} Formatted address string or empty string if no valid fields
 */
export const formatClientAddress = (fields) => {
  if (!fields) return '';

  const { address, city, state, zipCode, country } = fields;

  // Filter out null, undefined, and empty string values
  const addressParts = [];

  // Add street address if available
  if (address && address.trim()) {
    addressParts.push(address.trim());
  }

  // Build city, state, zip line
  const locationParts = [];
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