
import { useEffect } from 'react';
import { useTheme } from './hooks/useTheme.hook';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth, ProtectedRoute } from './contexts/AuthContext';
import { ResponsiveLayout } from './components/ResponsiveLayout';
import { DashboardOverview } from './components/DashboardOverview';
import { ClientManagement } from './components/ClientManagement';
import { EditClientPage } from './components/clients/EditClientPage';
import { InvoiceManagement } from './components/InvoiceManagement';
import { CreateInvoicePage } from './components/invoices/CreateInvoicePage';
import { EditInvoicePage } from './components/invoices/EditInvoicePage';
import { CreateRecurringInvoicePage } from './components/invoices/CreateRecurringInvoicePage';
import { ExpenseManagement } from './components/ExpenseManagement';
import { PaymentManagement } from './components/PaymentManagement';
import { ReportsManagement } from './components/ReportsManagement';
import { ResponsiveSettings } from './components/ResponsiveSettings';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import NotFound from './pages/NotFound';
import PublicInvoiceView from './components/PublicInvoiceView';
import { Toaster } from './components/ui/sonner';
import { useConnectionMonitor } from './hooks/useConnectionMonitor';
import { ConnectionLostDialog } from './components/ConnectionLostDialog';
import './App.css';

const queryClient = new QueryClient();

const App = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // Initialize theme system
  useTheme();

  // Connection monitoring - only start when authenticated
  const {
    isConnected,
    isChecking,
    retryCount,
    hasExceededMaxRetries,
    lastError,
    startConnectionMonitoring,
    stopConnectionMonitoring
  } = useConnectionMonitor({
    checkInterval: 60000, // Check every minute when connected
    retryInterval: 20000, // Retry every 20 seconds when disconnected
    maxRetries: 30, // Max 30 retries (10 minutes)
  });


  // Start/stop connection monitoring based on authentication
  useEffect(() => {
    if (isAuthenticated) {
      startConnectionMonitoring();
    } else {
      stopConnectionMonitoring();
    }
  }, [isAuthenticated, startConnectionMonitoring, stopConnectionMonitoring]);

  // Removed global recurring invoice processing - now handled only on invoice-related pages

  // Show loading screen while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/invoice/:id" element={<PublicInvoiceView />} />

          {/* Root redirect */}
          <Route path="/" element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <DashboardOverview />
              </ResponsiveLayout>
            </ProtectedRoute>
          } />

          <Route path="/clients" element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <ClientManagement />
              </ResponsiveLayout>
            </ProtectedRoute>
          } />

          <Route path="/clients/new" element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <EditClientPage />
              </ResponsiveLayout>
            </ProtectedRoute>
          } />

          <Route path="/clients/edit/:id" element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <EditClientPage />
              </ResponsiveLayout>
            </ProtectedRoute>
          } />

          <Route path="/invoices" element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <InvoiceManagement />
              </ResponsiveLayout>
            </ProtectedRoute>
          } />

          <Route path="/invoices/create" element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <CreateInvoicePage onBack={() => window.history.back()} />
              </ResponsiveLayout>
            </ProtectedRoute>
          } />

          <Route path="/invoices/edit/:id" element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <EditInvoicePage />
              </ResponsiveLayout>
            </ProtectedRoute>
          } />

          <Route path="/recurring-invoices/create" element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <CreateRecurringInvoicePage onBack={() => window.history.back()} />
              </ResponsiveLayout>
            </ProtectedRoute>
          } />

          <Route path="/recurring-invoices/edit/:id" element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <CreateRecurringInvoicePage onBack={() => window.history.back()} />
              </ResponsiveLayout>
            </ProtectedRoute>
          } />

          <Route path="/expenses" element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <ExpenseManagement />
              </ResponsiveLayout>
            </ProtectedRoute>
          } />

          <Route path="/payments" element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <PaymentManagement />
              </ResponsiveLayout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <ReportsManagement />
              </ResponsiveLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <ResponsiveLayout>
                <ResponsiveSettings />
              </ResponsiveLayout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />

        {/* Connection Lost Dialog - only show when authenticated and disconnected */}
        <ConnectionLostDialog
          isVisible={isAuthenticated && !isConnected}
          retryCount={retryCount}
          maxRetries={30}
          isChecking={isChecking}
          hasExceededMaxRetries={hasExceededMaxRetries}
          lastError={lastError}
        />
      </Router>
    </QueryClientProvider>
  );
};

export default App;
