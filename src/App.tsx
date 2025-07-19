
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth, ProtectedRoute } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { ClientManagement } from './components/ClientManagement';
import { EditClientPage } from './components/clients/EditClientPage';
import { InvoiceManagement } from './components/InvoiceManagement';
import { CreateInvoicePage } from './components/invoices/CreateInvoicePage';
import { EditInvoicePage } from './components/invoices/EditInvoicePage';
import { CreateRecurringInvoicePage } from './components/invoices/CreateRecurringInvoicePage';
import { ExpenseManagement } from './components/ExpenseManagement';
import { ReportsManagement } from './components/ReportsManagement';
import { Settings } from './components/Settings';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import NotFound from './pages/NotFound';
import PublicInvoiceView from './components/PublicInvoiceView';
import { Toaster } from './components/ui/sonner';
import { processRecurringInvoices } from './utils/recurringProcessor';
import { DatabaseMigrations } from './lib/database-migrations';
import './App.css';

const queryClient = new QueryClient();

const App = () => {
  const { isAuthenticated, loading } = useAuth();

  // Apply theme on app load
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'system';
    const root = document.documentElement;

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, []);

  // Process recurring invoices on app load and periodically
  useEffect(() => {
    if (isAuthenticated) {
      const initializeApp = async () => {
        try {
          // Run database migrations first
          const migrations = DatabaseMigrations.getInstance();
          await migrations.runMigrations();

          // Then process recurring invoices
          await processRecurringInvoices();
        } catch (error) {
          console.error('Error during app initialization:', error);
        }
      };

      // Initialize immediately on load
      initializeApp();

      // Set up interval to check every hour
      const interval = setInterval(() => {
        processRecurringInvoices().catch(console.error);
      }, 60 * 60 * 1000); // 1 hour in milliseconds

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

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
              <div className="h-screen w-full flex bg-background overflow-hidden">
                <div className="w-[14%] min-w-[200px]">
                  <Sidebar />
                </div>
                <main className="w-[86%] h-full overflow-y-auto bg-background">
                  <DashboardOverview />
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/clients" element={
            <ProtectedRoute>
              <div className="h-screen w-full flex bg-background overflow-hidden">
                <div className="w-[14%] min-w-[200px]">
                  <Sidebar />
                </div>
                <main className="w-[86%] h-full overflow-y-auto bg-background">
                  <ClientManagement />
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/clients/new" element={
            <ProtectedRoute>
              <div className="h-screen w-full flex bg-background overflow-hidden">
                <div className="w-[14%] min-w-[200px]">
                  <Sidebar />
                </div>
                <main className="w-[86%] h-full overflow-y-auto bg-background">
                  <EditClientPage />
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/clients/edit/:id" element={
            <ProtectedRoute>
              <div className="h-screen w-full flex bg-background overflow-hidden">
                <div className="w-[14%] min-w-[200px]">
                  <Sidebar />
                </div>
                <main className="w-[86%] h-full overflow-y-auto bg-background">
                  <EditClientPage />
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/invoices" element={
            <ProtectedRoute>
              <div className="h-screen w-full flex bg-background overflow-hidden">
                <div className="w-[14%] min-w-[200px]">
                  <Sidebar />
                </div>
                <main className="w-[86%] h-full overflow-y-auto bg-background">
                  <InvoiceManagement />
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/invoices/create" element={
            <ProtectedRoute>
              <div className="h-screen w-full flex bg-background overflow-hidden">
                <div className="w-[14%] min-w-[200px]">
                  <Sidebar />
                </div>
                <main className="w-[86%] h-full overflow-y-auto bg-background">
                  <CreateInvoicePage onBack={() => window.history.back()} />
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/invoices/edit/:id" element={
            <ProtectedRoute>
              <div className="h-screen w-full flex bg-background overflow-hidden">
                <div className="w-[14%] min-w-[200px]">
                  <Sidebar />
                </div>
                <main className="w-[86%] h-full overflow-y-auto bg-background">
                  <EditInvoicePage />
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/recurring-invoices/create" element={
            <ProtectedRoute>
              <div className="h-screen w-full flex bg-background overflow-hidden">
                <div className="w-[14%] min-w-[200px]">
                  <Sidebar />
                </div>
                <main className="w-[86%] h-full overflow-y-auto bg-background">
                  <CreateRecurringInvoicePage onBack={() => window.history.back()} />
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/recurring-invoices/edit/:id" element={
            <ProtectedRoute>
              <div className="h-screen w-full flex bg-background overflow-hidden">
                <div className="w-[14%] min-w-[200px]">
                  <Sidebar />
                </div>
                <main className="w-[86%] h-full overflow-y-auto bg-background">
                  <CreateRecurringInvoicePage onBack={() => window.history.back()} />
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/expenses" element={
            <ProtectedRoute>
              <div className="h-screen w-full flex bg-background overflow-hidden">
                <div className="w-[14%] min-w-[200px]">
                  <Sidebar />
                </div>
                <main className="w-[86%] h-full overflow-y-auto bg-background">
                  <ExpenseManagement />
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <div className="h-screen w-full flex bg-background overflow-hidden">
                <div className="w-[14%] min-w-[200px]">
                  <Sidebar />
                </div>
                <main className="w-[86%] h-full overflow-y-auto bg-background">
                  <ReportsManagement />
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <div className="h-screen w-full flex bg-background overflow-hidden">
                <div className="w-[14%] min-w-[200px]">
                  <Sidebar />
                </div>
                <main className="w-[86%] h-full overflow-y-auto bg-background">
                  <Settings />
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
};

export default App;
