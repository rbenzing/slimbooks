// Enhanced API utility functions with authentication and token management
import { TokenManagerService } from '@/services/tokenManager.svc';

// API types moved to @/types/shared/api.types.ts
import type { ApiOptions, ApiResponse } from '@/types';

// Legacy function - get auth token from storage
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
};

// Legacy function - get auth headers
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Legacy basic authenticated fetch (for backward compatibility)
export const authenticatedFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  // Register API call as user activity (unless it's auth-related)
  if (!url.includes('/auth/')) {
    const tokenManager = TokenManagerService.getInstance();
    tokenManager.registerActivity();
  }
  
  const authHeaders = getAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
};

// Legacy basic API request (for backward compatibility)
export const apiRequest = async <T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: string }> => {
  try {
    const response = await authenticatedFetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Enhanced fetch function with automatic token validation and refresh
 * This is the recommended API function to use for all new code
 */
export const enhancedFetch = async <T = unknown>(
  url: string, 
  options: ApiOptions = {}
): Promise<ApiResponse<T>> => {
  const tokenManager = TokenManagerService.getInstance();
  
  try {
    // Register API call as user activity (unless it's auth-related)
    if (!options.skipAuth && !url.includes('/auth/')) {
      tokenManager.registerActivity();
    }
    
    // Skip token validation for login/register endpoints
    if (!options.skipAuth) {
      // Check if token is expired
      if (tokenManager.isTokenExpired()) {
        // Try to refresh token
        const refreshed = await tokenManager.refreshToken();
        if (!refreshed) {
          // Token refresh failed, redirect to login
          window.location.href = '/login';
          return { success: false, error: 'Session expired' };
        }
      }
    }

    // Get current token for authorization header
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add authorization header if we have a token and not skipping auth
    if (token && !options.skipAuth) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Make the request
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    // Handle 401 Unauthorized - token might be invalid
    if (response.status === 401 && !options.skipAuth) {
      // Try to refresh token once
      const refreshed = await tokenManager.refreshToken();
      if (refreshed) {
        // Register activity for successful token refresh
        tokenManager.registerActivity();
        
        // Retry the request with new token
        const newToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (newToken) {
          headers.Authorization = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, {
            method: options.method || 'GET',
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined
          });
          
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            return { success: true, data };
          }
        }
      }
      
      // Token refresh failed or retry failed
      window.location.href = '/login';
      return { success: false, error: 'Session expired' };
    }

    // Parse response
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { 
        success: false, 
        error: data.message || data.error || 'Request failed',
        message: data.message 
      };
    }
  } catch (error) {
    console.error('API request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
};

/**
 * Enhanced wrapper functions for common HTTP methods
 * These are the recommended functions to use for all new API calls
 */
export const apiGet = <T = unknown>(url: string, options: Omit<ApiOptions, 'method'> = {}) => 
  enhancedFetch<T>(url, { ...options, method: 'GET' });

export const apiPost = <T = unknown>(url: string, body: unknown, options: Omit<ApiOptions, 'method' | 'body'> = {}) => 
  enhancedFetch<T>(url, { ...options, method: 'POST', body });

export const apiPut = <T = unknown>(url: string, body: unknown, options: Omit<ApiOptions, 'method' | 'body'> = {}) => 
  enhancedFetch<T>(url, { ...options, method: 'PUT', body });

export const apiDelete = <T = unknown>(url: string, options: Omit<ApiOptions, 'method'> = {}) => 
  enhancedFetch<T>(url, { ...options, method: 'DELETE' });

/**
 * Check if user is authenticated with valid token
 */
export const isAuthenticated = (): boolean => {
  const tokenManager = TokenManagerService.getInstance();
  return !tokenManager.isTokenExpired();
};

/**
 * Get authorization header for manual API calls
 */
export const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};