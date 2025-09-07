// Authentication service for login, registration, and session management

import { userOperations } from '@/lib/database';
import { AuthUtils } from '@/utils/authUtils.util';
import { envConfig } from '@/lib/env-config';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  DEFAULT_SECURITY_SETTINGS 
} from '@/types';

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
        email_verified: 0,
        two_factor_enabled: 0,
        backup_codes: "",
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
          // In development, verification tokens would be logged here
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
      const response = await fetch(`${envConfig.API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          rememberMe: credentials.rememberMe || false
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Login failed. Please try again.'
        };
      }

      // Store user and token if login successful
      if (result.success && result.data?.user && result.data?.token) {
        this.currentUser = result.data.user;
        this.sessionToken = result.data.token;

        await this.completeLogin(result.data.user);
        
        // Transform the response to match what AuthContext expects
        return {
          success: result.success,
          user: result.data.user,
          session_token: result.data.token, // Map token to session_token
          message: result.message,
          requires_email_verification: result.requires_email_verification
        };
      }

      return result;
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

  // Verify session token with server
  async verifyToken(token: string): Promise<User | null> {
    try {
      // Make a simple authenticated API call to verify the token
      const response = await fetch(`${envConfig.API_URL}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        return null;
      }

      const user = result.data;
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
