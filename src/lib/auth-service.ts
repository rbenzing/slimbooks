// Authentication service for login, registration, and session management

import { userOperations } from './database';
import { AuthUtils } from './auth-utils';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  TwoFactorSetup,
  DEFAULT_SECURITY_SETTINGS 
} from '@/types/auth';

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private sessionToken: string | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();

    }
    return AuthService.instance;
  }

  // Initialize admin user if it doesn't exist
  async initializeAdminUser(): Promise<void> {
    try {
      const adminUser = await userOperations.getByEmail('admin@slimbooks.app');

      if (!adminUser) {
        const hashedPassword = await AuthUtils.hashPassword('r1u2s3s4e5');
        await userOperations.create({
          name: 'Administrator',
          email: 'admin@slimbooks.app',
          username: 'admin@slimbooks.app',
          password_hash: hashedPassword,
          role: 'admin',
          email_verified: true,
          two_factor_enabled: false,
          backup_codes: [],
          failed_login_attempts: 0
        });
      }
    } catch (error) {
      console.error('Error initializing admin user:', error);
    }
  }

  // User registration
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Validate input
      if (!AuthUtils.isValidEmail(data.email)) {
        return { success: false, message: 'Invalid email address' };
      }

      if (data.password !== data.confirm_password) {
        return { success: false, message: 'Passwords do not match' };
      }

      // Check password strength
      const passwordValidation = AuthUtils.validatePassword(data.password, DEFAULT_SECURITY_SETTINGS.password_requirements);
      if (!passwordValidation.isValid) {
        return { success: false, message: passwordValidation.errors.join(', ') };
      }

      // Check if user already exists
      const existingUser = await userOperations.getByEmail(data.email);
      if (existingUser) {
        return { success: false, message: 'User with this email already exists' };
      }

      // Hash password and create user
      const hashedPassword = await AuthUtils.hashPassword(data.password);
      const result = await userOperations.create({
        name: data.name,
        email: data.email,
        username: data.email, // Using email as username for now
        password_hash: hashedPassword,
        role: 'user',
        email_verified: false,
        two_factor_enabled: false,
        backup_codes: [],
        failed_login_attempts: 0
      });

      const user = await userOperations.getById(result.lastInsertRowid);
      if (!user) {
        return { success: false, message: 'Failed to create user' };
      }

      // Send verification email if email verification is required
      if (DEFAULT_SECURITY_SETTINGS.require_email_verification) {
        try {
          const verificationToken = AuthUtils.generateEmailToken(user.email, user.id);

          // TODO: Send verification email using email service
          // For now, we'll just log the token in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`Verification token for ${user.email}: ${verificationToken}`);
            console.log(`Verification link: ${window.location.origin}/verify-email?token=${verificationToken}`);
          }
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
          // Don't fail registration if email sending fails
        }
      }

      return {
        success: true,
        user,
        message: 'Registration successful. Please check your email for verification instructions.',
        requires_email_verification: DEFAULT_SECURITY_SETTINGS.require_email_verification
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  }

  // User login
  async login(credentials: LoginCredentials & { rememberMe?: boolean }): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await userOperations.getByEmail(credentials.email);

      if (!user) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Check if account is locked
      if (AuthUtils.isAccountLocked(
        user.failed_login_attempts,
        DEFAULT_SECURITY_SETTINGS.max_failed_attempts,
        user.account_locked_until
      )) {
        return { success: false, message: 'Account is temporarily locked. Please try again later.' };
      }

      // Verify password
      if (!user.password_hash || !await AuthUtils.verifyPassword(credentials.password, user.password_hash)) {
        // Increment failed attempts
        const newAttempts = user.failed_login_attempts + 1;
        let lockedUntil: string | undefined;

        if (newAttempts >= DEFAULT_SECURITY_SETTINGS.max_failed_attempts) {
          lockedUntil = AuthUtils.calculateLockoutTime(DEFAULT_SECURITY_SETTINGS.lockout_duration).toISOString();
        }

        await userOperations.updateLoginAttempts(user.id, newAttempts, lockedUntil);
        return { success: false, message: 'Invalid email or password' };
      }

      // Check email verification
      if (!user.email_verified && DEFAULT_SECURITY_SETTINGS.require_email_verification) {
        return { 
          success: false, 
          message: 'Please verify your email address before logging in.',
          requires_email_verification: true
        };
      }

      // Check 2FA
      if (user.two_factor_enabled) {
        return {
          success: true,
          user,
          message: 'Two-factor authentication required',
          requires_2fa: true
        };
      }

      // Successful login
      await this.completeLogin(user);

      const tokens = this.generateTokens(user, credentials.rememberMe);
      return {
        success: true,
        user,
        session_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  // Complete login process (reset failed attempts, update last login)
  private async completeLogin(user: User): Promise<void> {
    await userOperations.updateLoginAttempts(user.id, 0);
    await userOperations.updateLastLogin(user.id);
    this.currentUser = user;
  }

  // Generate JWT tokens
  private generateTokens(user: User, rememberMe: boolean = false): { accessToken: string; refreshToken: string } {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return {
      accessToken: AuthUtils.generateAccessToken(payload, rememberMe),
      refreshToken: AuthUtils.generateRefreshToken(payload, rememberMe)
    };
  }

  // Verify 2FA token
  async verify2FA(userId: number, token: string): Promise<AuthResponse> {
    try {
      const user = await userOperations.getById(userId);
      if (!user || !user.two_factor_secret) {
        return { success: false, message: 'Invalid user or 2FA not enabled' };
      }

      // Check if it's a backup code
      if (user.backup_codes) {
        const backupCodes = JSON.parse(user.backup_codes);
        const codeIndex = backupCodes.indexOf(token.toUpperCase());
        if (codeIndex !== -1) {
          // Remove used backup code
          backupCodes.splice(codeIndex, 1);
          await userOperations.update(userId, { backup_codes: backupCodes });
          
          await this.completeLogin(user);
          const tokens = this.generateTokens(user, false); // 2FA doesn't use remember me
          return {
            success: true,
            user,
            session_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            message: 'Login successful with backup code'
          };
        }
      }

      // Verify TOTP token
      if (!AuthUtils.verifyTwoFactorToken(token, user.two_factor_secret)) {
        return { success: false, message: 'Invalid 2FA token' };
      }

      await this.completeLogin(user);
      const tokens = this.generateTokens(user, false); // 2FA doesn't use remember me
      return {
        success: true,
        user,
        session_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('2FA verification error:', error);
      return { success: false, message: '2FA verification failed' };
    }
  }

  // Setup 2FA for user
  async setup2FA(userId: number): Promise<TwoFactorSetup | null> {
    try {
      const user = await userOperations.getById(userId);
      if (!user) return null;

      const { secret, otpauth_url } = AuthUtils.generateTwoFactorSecret(user.email);
      const qr_code = await AuthUtils.generateQRCode(otpauth_url);
      const backup_codes = AuthUtils.generateBackupCodes();

      return {
        secret,
        qr_code,
        backup_codes
      };
    } catch (error) {
      console.error('2FA setup error:', error);
      return null;
    }
  }

  // Enable 2FA for user
  async enable2FA(userId: number, secret: string, token: string): Promise<{ success: boolean; message: string; backup_codes?: string[] }> {
    try {
      // Verify the token first
      if (!AuthUtils.verifyTwoFactorToken(token, secret)) {
        return { success: false, message: 'Invalid 2FA token' };
      }

      const backup_codes = AuthUtils.generateBackupCodes();
      await userOperations.enable2FA(userId, secret, backup_codes);

      return {
        success: true,
        message: '2FA enabled successfully',
        backup_codes
      };
    } catch (error) {
      console.error('Enable 2FA error:', error);
      return { success: false, message: 'Failed to enable 2FA' };
    }
  }

  // Disable 2FA for user
  async disable2FA(userId: number, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await userOperations.getById(userId);
      if (!user || !user.password_hash) {
        return { success: false, message: 'User not found' };
      }

      // Verify password
      if (!await AuthUtils.verifyPassword(password, user.password_hash)) {
        return { success: false, message: 'Invalid password' };
      }

      await userOperations.disable2FA(userId);
      return { success: true, message: '2FA disabled successfully' };
    } catch (error) {
      console.error('Disable 2FA error:', error);
      return { success: false, message: 'Failed to disable 2FA' };
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Set current user (for session restoration)
  setCurrentUser(user: User): void {
    this.currentUser = user;
  }

  // Logout
  logout(): void {
    this.currentUser = null;
    this.sessionToken = null;
    // In a real app, you'd also invalidate the session in the database
  }

  // Verify session token
  async verifyToken(token: string): Promise<User | null> {
    try {
      const payload = AuthUtils.verifyAccessToken(token);
      if (!payload) return null;

      const user = await userOperations.getById(payload.userId);
      if (!user) return null;

      this.currentUser = user;
      this.sessionToken = token;
      return user;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('admin');
  }
}
