const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const removeRefreshToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const clearAuthTokens = (): void => {
  removeToken();
  removeRefreshToken();
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

export const getTokenPayload = (token: string): any => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  return token !== null && !isTokenExpired(token);
};

export class AuthUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string, requirements: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < (requirements.min_length || 8)) {
      errors.push(`Password must be at least ${requirements.min_length || 8} characters long`);
    }

    if (requirements.require_uppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (requirements.require_lowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (requirements.require_numbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (requirements.require_special_chars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static async hashPassword(password: string): Promise<string> {
    // For security, password hashing should be done on the backend
    // This is just a placeholder that should not be used for actual hashing
    // The frontend should send plain password to backend for proper bcrypt hashing
    return password; // Backend will hash this properly
  }

  static generateEmailToken(email: string, userId: number): string {
    // Generate a simple token for email verification
    // In production, this should be done on the backend with proper JWT signing
    const payload = { email, userId, exp: Date.now() + 24 * 60 * 60 * 1000 }; // 24 hours
    return btoa(JSON.stringify(payload));
  }

  static generateAccessToken(payload: any, rememberMe: boolean = false): string {
    // Frontend should not generate tokens - this should be done by backend
    // This is a placeholder to prevent errors
    const expiry = rememberMe ? Date.now() + 7 * 24 * 60 * 60 * 1000 : Date.now() + 2 * 60 * 60 * 1000;
    return btoa(JSON.stringify({ ...payload, exp: expiry }));
  }

  static generateRefreshToken(payload: any, rememberMe: boolean = false): string {
    // Frontend should not generate tokens - this should be done by backend
    // This is a placeholder to prevent errors
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    return btoa(JSON.stringify({ ...payload, exp: expiry, type: 'refresh' }));
  }

  static verifyEmailToken(token: string): any {
    try {
      const payload = JSON.parse(atob(token));
      if (payload.exp && payload.exp < Date.now()) {
        return null; // Token expired
      }
      return payload;
    } catch {
      return null; // Invalid token
    }
  }
}