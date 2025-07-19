// Authentication utilities for password hashing, JWT tokens, and security

import bcrypt from 'bcryptjs';
import crypto from 'crypto-js';
import QRCode from 'qrcode';
import { PasswordRequirements } from '@/types/auth';

// Import environment configuration
import { securityConfig } from './env-config';

// JWT Secrets from environment variables
const JWT_SECRET = securityConfig.JWT_SECRET;
const JWT_REFRESH_SECRET = securityConfig.JWT_REFRESH_SECRET;

// Token expiration times from environment
const ACCESS_TOKEN_EXPIRY = securityConfig.ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRY = securityConfig.REFRESH_TOKEN_EXPIRY;
const EMAIL_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export class AuthUtils {
  // Password hashing
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Browser-compatible JWT token management
  static generateAccessToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string {
    const now = Date.now();
    const tokenPayload: JWTPayload = {
      ...payload,
      type: 'access',
      iat: Math.floor(now / 1000),
      exp: Math.floor((now + ACCESS_TOKEN_EXPIRY) / 1000)
    };

    return this.createSimpleJWT(tokenPayload, JWT_SECRET);
  }

  static generateRefreshToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string {
    const now = Date.now();
    const tokenPayload: JWTPayload = {
      ...payload,
      type: 'refresh',
      iat: Math.floor(now / 1000),
      exp: Math.floor((now + REFRESH_TOKEN_EXPIRY) / 1000)
    };

    return this.createSimpleJWT(tokenPayload, JWT_REFRESH_SECRET);
  }

  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      const decoded = this.verifySimpleJWT(token, JWT_SECRET);
      return decoded && decoded.type === 'access' ? decoded : null;
    } catch (error) {
      return null;
    }
  }

  static verifyRefreshToken(token: string): JWTPayload | null {
    try {
      const decoded = this.verifySimpleJWT(token, JWT_REFRESH_SECRET);
      return decoded && decoded.type === 'refresh' ? decoded : null;
    } catch (error) {
      return null;
    }
  }

  // Simple JWT implementation for browser compatibility
  private static createSimpleJWT(payload: JWTPayload, secret: string): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`, secret);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private static verifySimpleJWT(token: string, secret: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, signature] = parts;

      // Verify signature
      const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`, secret);
      if (signature !== expectedSignature) return null;

      // Decode payload
      const payload = JSON.parse(this.base64UrlDecode(encodedPayload)) as JWTPayload;

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) return null;

      return payload;
    } catch (error) {
      return null;
    }
  }

  private static createSignature(data: string, secret: string): string {
    return crypto.HmacSHA256(data, secret).toString(crypto.enc.Base64url);
  }

  private static base64UrlEncode(str: string): string {
    return crypto.enc.Base64url.stringify(crypto.enc.Utf8.parse(str));
  }

  private static base64UrlDecode(str: string): string {
    return crypto.enc.Base64url.parse(str).toString(crypto.enc.Utf8);
  }

  // Secure token generation
  static generateSecureToken(): string {
    return crypto.lib.WordArray.random(32).toString();
  }

  static generateEmailVerificationToken(): string {
    return crypto.lib.WordArray.random(32).toString();
  }

  static generatePasswordResetToken(): string {
    return crypto.lib.WordArray.random(32).toString();
  }

  // Token expiration helpers
  static getEmailTokenExpiry(): Date {
    return new Date(Date.now() + EMAIL_TOKEN_EXPIRY);
  }

  static getPasswordResetExpiry(): Date {
    return new Date(Date.now() + PASSWORD_RESET_EXPIRY);
  }

  static getSessionExpiry(): Date {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  // Password validation
  static validatePassword(password: string, requirements: PasswordRequirements): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < requirements.min_length) {
      errors.push(`Password must be at least ${requirements.min_length} characters long`);
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

  // Two-Factor Authentication (browser-compatible implementation)
  static generateTwoFactorSecret(userEmail: string, appName: string = 'Slimbooks'): {
    secret: string;
    otpauth_url: string;
  } {
    // Generate a random 32-character base32 secret
    const secret = this.generateBase32Secret(32);

    // Create OTP Auth URL
    const otpauth_url = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=${encodeURIComponent(appName)}`;

    return {
      secret,
      otpauth_url
    };
  }

  // Generate base32 secret
  private static generateBase32Secret(length: number): string {
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < length; i++) {
      secret += base32Chars[Math.floor(Math.random() * base32Chars.length)];
    }
    return secret;
  }

  static async generateQRCode(otpauth_url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauth_url);
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  static verifyTwoFactorToken(token: string, secret: string): boolean {
    try {
      // Get current time step (30-second intervals)
      const currentTime = Math.floor(Date.now() / 1000 / 30);

      // Check current time step and 2 steps before/after (2-minute window)
      for (let i = -2; i <= 2; i++) {
        const timeStep = currentTime + i;
        const expectedToken = this.generateTOTP(secret, timeStep);
        if (expectedToken === token) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      return false;
    }
  }

  // Generate TOTP token for a given time step
  private static generateTOTP(secret: string, timeStep: number): string {
    try {
      // Convert base32 secret to bytes
      const secretBytes = this.base32ToBytes(secret);

      // Convert time step to 8-byte array
      const timeBytes = new ArrayBuffer(8);
      const timeView = new DataView(timeBytes);
      timeView.setUint32(4, timeStep, false); // Big-endian

      // Generate HMAC-SHA1
      const hmac = crypto.HmacSHA1(
        crypto.lib.WordArray.create(new Uint8Array(timeBytes)),
        crypto.lib.WordArray.create(secretBytes)
      );

      // Convert to bytes
      const hmacBytes = new Uint8Array(hmac.words.length * 4);
      for (let i = 0; i < hmac.words.length; i++) {
        const word = hmac.words[i];
        hmacBytes[i * 4] = (word >>> 24) & 0xff;
        hmacBytes[i * 4 + 1] = (word >>> 16) & 0xff;
        hmacBytes[i * 4 + 2] = (word >>> 8) & 0xff;
        hmacBytes[i * 4 + 3] = word & 0xff;
      }

      // Dynamic truncation
      const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
      const code = ((hmacBytes[offset] & 0x7f) << 24) |
                   ((hmacBytes[offset + 1] & 0xff) << 16) |
                   ((hmacBytes[offset + 2] & 0xff) << 8) |
                   (hmacBytes[offset + 3] & 0xff);

      // Return 6-digit code
      return (code % 1000000).toString().padStart(6, '0');
    } catch (error) {
      console.error('Error generating TOTP:', error);
      return '000000';
    }
  }

  // Convert base32 string to bytes
  private static base32ToBytes(base32: string): Uint8Array {
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanBase32 = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');

    let bits = '';
    for (const char of cleanBase32) {
      const index = base32Chars.indexOf(char);
      if (index === -1) continue;
      bits += index.toString(2).padStart(5, '0');
    }

    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
      const byteBits = bits.substr(i * 8, 8);
      bytes[i] = parseInt(byteBits, 2);
    }

    return bytes;
  }

  // Backup codes generation
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = crypto.lib.WordArray.random(4).toString().substring(0, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  // Rate limiting helpers
  static isAccountLocked(failedAttempts: number, maxAttempts: number, lockedUntil?: string): boolean {
    // If failed attempts haven't reached the max, account is not locked
    if (failedAttempts < maxAttempts) return false;

    // If failed attempts >= max but no lockout time is set, account is not locked
    // (This handles cases where max attempts reached but no lockout time was set)
    if (!lockedUntil) return false;

    // If lockout time is set, check if it's still in effect
    return new Date() < new Date(lockedUntil);
  }

  static calculateLockoutTime(lockoutDuration: number): Date {
    return new Date(Date.now() + lockoutDuration * 60 * 1000);
  }

  // Email validation
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Secure data encryption/decryption for sensitive data
  static encryptSensitiveData(data: string, key: string = JWT_SECRET): string {
    return crypto.AES.encrypt(data, key).toString();
  }

  static decryptSensitiveData(encryptedData: string, key: string = JWT_SECRET): string {
    const bytes = crypto.AES.decrypt(encryptedData, key);
    return bytes.toString(crypto.enc.Utf8);
  }

  // Session token generation
  static generateSessionToken(): string {
    return crypto.lib.WordArray.random(32).toString();
  }

  // IP address and user agent helpers
  static getClientIP(): string {
    // In a browser environment, we can't directly get the IP
    // This would need to be obtained from a backend service
    return 'browser';
  }

  static getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  }

  // Password strength scoring
  static calculatePasswordStrength(password: string): {
    score: number; // 0-100
    level: 'weak' | 'fair' | 'good' | 'strong';
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    // Length scoring
    if (password.length >= 8) score += 20;
    else feedback.push('Use at least 8 characters');

    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Character variety
    if (/[a-z]/.test(password)) score += 15;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 15;
    else feedback.push('Add uppercase letters');

    if (/\d/.test(password)) score += 15;
    else feedback.push('Add numbers');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
    else feedback.push('Add special characters');

    // Patterns and common passwords
    if (!/(.)\1{2,}/.test(password)) score += 10; // No repeated characters
    else feedback.push('Avoid repeated characters');

    let level: 'weak' | 'fair' | 'good' | 'strong';
    if (score < 40) level = 'weak';
    else if (score < 60) level = 'fair';
    else if (score < 80) level = 'good';
    else level = 'strong';

    return { score, level, feedback };
  }
}
