
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './contexts/AuthContext';
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
import { LoginForm } from './components/LoginForm';
import NotFound from './pages/NotFound';
import { Toaster } from './components/ui/sonner';
import { processRecurringInvoices } from './utils/recurringProcessor';
import './App.css';

const queryClient = new QueryClient();

const App = () => {
  const { isAuthenticated } = useAuth();

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
      // Process immediately on load
      processRecurringInvoices();
      
      // Set up interval to check every hour
      const interval = setInterval(() => {
        processRecurringInvoices();
      }, 60 * 60 * 1000); // 1 hour in milliseconds
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoginForm />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="h-screen w-full flex bg-background overflow-hidden">
          <div className="w-[14%] min-w-[200px]">
            <Sidebar />
          </div>
          <main className="w-[86%] h-full overflow-y-auto bg-background">
            <Routes>
              <Route path="/" element={<DashboardOverview />} />
              <Route path="/clients" element={<ClientManagement />} />
              <Route path="/clients/new" element={<EditClientPage />} />
              <Route path="/clients/edit/:id" element={<EditClientPage />} />
              <Route path="/invoices" element={<InvoiceManagement />} />
              <Route path="/invoices/create" element={<CreateInvoicePage onBack={() => window.history.back()} />} />
              <Route path="/invoices/edit/:id" element={<EditInvoicePage />} />
              <Route path="/recurring-invoices/create" element={<CreateRecurringInvoicePage onBack={() => window.history.back()} />} />
              <Route path="/recurring-invoices/edit/:id" element={<CreateRecurringInvoicePage onBack={() => window.history.back()} />} />
              <Route path="/expenses" element={<ExpenseManagement />} />
              <Route path="/reports" element={<ReportsManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
};

export default App;
