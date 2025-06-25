
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { ClientManagement } from './components/ClientManagement';
import { EditClientPage } from './components/clients/EditClientPage';
import { InvoiceManagement } from './components/InvoiceManagement';
import { CreateInvoicePage } from './components/invoices/CreateInvoicePage';
import { CreateRecurringInvoicePage } from './components/invoices/CreateRecurringInvoicePage';
import { Settings } from './components/Settings';
import { LoginForm } from './components/LoginForm';
import NotFound from './pages/NotFound';
import { Toaster } from './components/ui/sonner';
import './App.css';

const queryClient = new QueryClient();

const App = () => {
  const { isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoginForm />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex h-screen bg-gray-100">
          <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              <Routes>
                <Route path="/" element={<DashboardOverview />} />
                <Route path="/clients" element={<ClientManagement />} />
                <Route path="/clients/new" element={<EditClientPage />} />
                <Route path="/clients/edit/:id" element={<EditClientPage />} />
                <Route path="/invoices" element={<InvoiceManagement />} />
                <Route path="/invoices/create" element={<CreateInvoicePage onBack={() => window.history.back()} />} />
                <Route path="/invoices/edit/:id" element={<CreateInvoicePage onBack={() => window.history.back()} />} />
                <Route path="/recurring-invoices/create" element={<CreateRecurringInvoicePage onBack={() => window.history.back()} />} />
                <Route path="/recurring-invoices/edit/:id" element={<CreateRecurringInvoicePage onBack={() => window.history.back()} />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </main>
        </div>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
};

export default App;
