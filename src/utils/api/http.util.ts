import { getToken } from './auth.util';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:3002';
};

export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();
  const baseUrl = getBaseUrl();
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(fullUrl, config);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Ignore JSON parsing errors, use default message
      }

      throw new ApiError(errorMessage, response.status, response);
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error: Unable to connect to server');
    }

    throw new ApiError(error instanceof Error ? error.message : 'Unknown error occurred');
  }
};

export const apiRequest = async <T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await authenticatedFetch(url, options);

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }

  return await response.text() as unknown as T;
};

export const apiGet = async <T = any>(url: string): Promise<T> => {
  return apiRequest<T>(url, { method: 'GET' });
};

export const apiPost = async <T = any>(
  url: string,
  data: any
): Promise<T> => {
  return apiRequest<T>(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const apiPut = async <T = any>(
  url: string,
  data: any
): Promise<T> => {
  return apiRequest<T>(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const apiPatch = async <T = any>(
  url: string,
  data: any
): Promise<T> => {
  return apiRequest<T>(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const apiDelete = async <T = any>(url: string): Promise<T> => {
  return apiRequest<T>(url, { method: 'DELETE' });
};

export { ApiError };

export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};