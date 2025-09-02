// Simple token expiry monitoring service - only checks expiry time and redirects
export class TokenManagerService {
  private static instance: TokenManagerService;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 60000; // Check every minute (less frequent)
  private readonly WARNING_THRESHOLD_MS = 5 * 60 * 1000; // Warn 5 minutes before expiry
  private onTokenExpired?: () => void;
  private onTokenWarning?: (minutesLeft: number) => void;

  static getInstance(): TokenManagerService {
    if (!TokenManagerService.instance) {
      TokenManagerService.instance = new TokenManagerService();
    }
    return TokenManagerService.instance;
  }

  /**
   * Start monitoring token expiration - simple expiry check only
   */
  startMonitoring(onExpired: () => void, onWarning?: (minutesLeft: number) => void) {
    this.onTokenExpired = onExpired;
    this.onTokenWarning = onWarning;
    
    // Clear any existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Start checking token expiry time
    this.checkInterval = setInterval(() => {
      this.checkTokenExpiry();
    }, this.CHECK_INTERVAL_MS);

    // Perform immediate check
    this.checkTokenExpiry();
  }

  /**
   * Stop monitoring token expiration
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.onTokenExpired = undefined;
    this.onTokenWarning = undefined;
  }

  /**
   * Simple token expiry check - only reads JWT payload exp field
   */
  private checkTokenExpiry() {
    const token = this.getCurrentToken();
    if (!token) {
      return; // No token to check
    }

    // Simple JWT payload decode without verification
    const payload = this.decodeJWTPayload(token);
    if (!payload || !payload.exp) {
      console.warn('Invalid token format - no expiry found');
      return;
    }

    // Check if token has expired
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = (payload.exp - now) * 1000; // Convert to milliseconds

    if (timeUntilExpiry <= 0) {
      // Token has expired - redirect to login
      console.log('Token expired, redirecting to login');
      this.handleTokenExpiration();
    } else if (timeUntilExpiry <= this.WARNING_THRESHOLD_MS && this.onTokenWarning) {
      // Token will expire soon - show warning
      const minutesLeft = Math.ceil(timeUntilExpiry / (60 * 1000));
      this.handleTokenWarning(minutesLeft);
    }
  }

  /**
   * Simple JWT payload decoder - no verification, just base64 decode
   */
  private decodeJWTPayload(token: string): { exp?: number; userId?: number } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode the payload (second part)
      const payload = parts[1];
      // Add padding if needed for base64 decode
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      const decodedPayload = atob(paddedPayload);
      
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.warn('Failed to decode JWT payload:', error);
      return null;
    }
  }

  /**
   * Handle token expiration - simple redirect
   */
  private handleTokenExpiration() {
    if (this.onTokenExpired) {
      this.onTokenExpired();
    }
  }

  /**
   * Handle token warning (close to expiration)
   */
  private handleTokenWarning(minutesLeft: number) {
    console.log(`Token will expire in ${minutesLeft} minutes`);
    if (this.onTokenWarning) {
      this.onTokenWarning(minutesLeft);
    }
  }

  /**
   * Get the current access token
   */
  private getCurrentToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  /**
   * Get time until token expiration in milliseconds - simple version
   */
  getTimeUntilExpiry(): number | null {
    const token = this.getCurrentToken();
    if (!token) return null;

    const payload = this.decodeJWTPayload(token);
    if (!payload || !payload.exp) return null;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, (payload.exp - now) * 1000);
  }

  /**
   * Check if token is expired - simple version
   */
  isTokenExpired(): boolean {
    const token = this.getCurrentToken();
    if (!token) return true;

    const payload = this.decodeJWTPayload(token);
    if (!payload || !payload.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  }

  /**
   * Get token information for debugging - simple version
   */
  getTokenInfo(): {
    hasToken: boolean;
    expiresAt?: Date;
    timeUntilExpiry?: number;
    isExpired?: boolean;
  } {
    const token = this.getCurrentToken();
    if (!token) {
      return { hasToken: false };
    }

    const payload = this.decodeJWTPayload(token);
    if (!payload || !payload.exp) {
      return { hasToken: true, isExpired: true };
    }

    const expiresAt = new Date(payload.exp * 1000);
    const timeUntilExpiry = this.getTimeUntilExpiry();
    const isExpired = this.isTokenExpired();

    return {
      hasToken: true,
      expiresAt,
      timeUntilExpiry: timeUntilExpiry || 0,
      isExpired
    };
  }
}