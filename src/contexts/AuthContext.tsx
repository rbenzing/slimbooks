
// Authentication context for React application

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User, AuthResponse } from '@/types/auth';
import { AuthService } from '@/lib/auth-service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResponse>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<AuthResponse>;
  logout: () => void;
  verify2FA: (token: string) => Promise<AuthResponse>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authService = AuthService.getInstance();

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);

      // Initialize admin user
      await authService.initializeAdminUser();

      // Check for existing session (localStorage first, then sessionStorage)
      let token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token) {
        const user = await authService.verifyToken(token);
        if (user) {
          setUser(user);
          authService.setCurrentUser(user);
        } else {
          // Invalid token, remove it from both storages
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('remember_me');
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('refresh_token');
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> => {
    try {
      const response = await authService.login({ email, password, rememberMe });

      if (response.success && response.user && response.session_token) {
        setUser(response.user);

        // Store tokens based on remember me preference
        if (rememberMe) {
          // Use localStorage for persistent storage
          localStorage.setItem('auth_token', response.session_token);
          localStorage.setItem('remember_me', 'true');
          if (response.refresh_token) {
            localStorage.setItem('refresh_token', response.refresh_token);
          }
        } else {
          // Use sessionStorage for session-only storage
          sessionStorage.setItem('auth_token', response.session_token);
          localStorage.removeItem('remember_me');
          if (response.refresh_token) {
            sessionStorage.setItem('refresh_token', response.refresh_token);
          }
        }
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<AuthResponse> => {
    try {
      const response = await authService.register({
        name,
        email,
        password,
        confirm_password: confirmPassword
      });

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };

  const verify2FA = async (token: string): Promise<AuthResponse> => {
    try {
      if (!user) {
        return { success: false, message: 'No user found for 2FA verification' };
      }

      const response = await authService.verify2FA(user.id, token);

      if (response.success && response.user && response.session_token) {
        setUser(response.user);
        localStorage.setItem('auth_token', response.session_token);
        if (response.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token);
        }
      }

      return response;
    } catch (error) {
      console.error('2FA verification error:', error);
      return { success: false, message: '2FA verification failed. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    authService.logout();
    // Clear tokens from both storages
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token && user) {
        const updatedUser = await authService.verifyToken(token);
        if (updatedUser) {
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    verify2FA,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Protected Route component
interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  fallback
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page with current location as state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return fallback || (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Hook for checking permissions
export const usePermissions = () => {
  const { user } = useAuth();

  return {
    canViewAdminPanel: user?.role === 'admin',
    canManageUsers: user?.role === 'admin',
    canManageSettings: user?.role === 'admin',
    canViewReports: !!user,
    canCreateInvoices: !!user,
    canManageClients: !!user,
    canManageExpenses: !!user
  };
};
