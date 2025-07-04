
import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  CreditCard, 
  Bell, 
  Palette,
  CheckCircle,
  AlertTriangle,
  Percent,
  Truck,
  Building
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { TaxSettings } from './settings/TaxSettings';
import { ShippingSettings } from './settings/ShippingSettings';
import { CompanySettings } from './settings/CompanySettings';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('company');
  const location = useLocation();

  // Set active tab based on URL hash or default to company
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['company', 'general', 'tax', 'shipping', 'stripe', 'notifications', 'appearance'].includes(hash)) {
      setActiveTab(hash);
    } else {
      setActiveTab('company');
    }
  }, [location.hash]);

  return (
    <div className="h-full bg-gray-100 dark:bg-gray-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your application preferences and integrations</p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'company' && <CompanySettings />}
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'tax' && <TaxSettings />}
          {activeTab === 'shipping' && <ShippingSettings />}
          {activeTab === 'stripe' && <StripeSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
        </div>
      </div>
    </div>
  );
};

const GeneralSettings = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">General Settings</h3>
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Currency</label>
        <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <option>USD - US Dollar</option>
          <option>EUR - Euro</option>
          <option>GBP - British Pound</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Zone</label>
        <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <option>America/New_York</option>
          <option>America/Los_Angeles</option>
          <option>Europe/London</option>
        </select>
      </div>
      <button className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
        Save Changes
      </button>
    </div>
  </div>
);

const StripeSettings = () => (
  <div className="space-y-6">
    {/* Connection Status */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Stripe Connection</h3>
        <div className="flex items-center text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Not Connected</span>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Connect your Stripe account to enable payment processing and invoice automation.
      </p>
      <div className="flex items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
        <div>
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Backend Required</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Connect to a backend service to enable secure Stripe integration.
          </p>
        </div>
      </div>
      <button 
        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
        disabled
      >
        Connect Stripe Account
      </button>
    </div>

    {/* Webhook Configuration */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Webhook Configuration</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Webhook Endpoint</label>
          <input
            type="text"
            placeholder="https://your-app.com/api/webhooks/stripe"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Events to Listen</label>
          <div className="space-y-2">
            {['invoice.payment_succeeded', 'invoice.payment_failed', 'customer.subscription.updated'].map((event) => (
              <label key={event} className="flex items-center">
                <input type="checkbox" className="mr-2" disabled />
                <span className="text-sm text-gray-500 dark:text-gray-400">{event}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const NotificationSettings = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Notification Preferences</h3>
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Email Notifications</h4>
        <div className="space-y-3">
          {[
            'New invoice created',
            'Payment received',
            'Invoice overdue',
            'Recurring invoice scheduled'
          ].map((notification) => (
            <label key={notification} className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-3" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{notification}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Client Notifications</h4>
        <div className="space-y-3">
          {[
            'Send invoice automatically',
            'Send payment reminders',
            'Send payment confirmations'
          ].map((notification) => (
            <label key={notification} className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-3" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{notification}</span>
            </label>
          ))}
        </div>
      </div>
      <button className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
        Save Preferences
      </button>
    </div>
  </div>
);

const AppearanceSettings = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });
  
  const [invoiceTemplate, setInvoiceTemplate] = useState(() => {
    return localStorage.getItem('invoiceTemplate') || 'modern-blue';
  });

  useEffect(() => {
    const applyTheme = (selectedTheme: string) => {
      const root = document.documentElement;
      
      if (selectedTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.toggle('dark', systemTheme === 'dark');
      } else {
        root.classList.toggle('dark', selectedTheme === 'dark');
      }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    // Listen for system theme changes when theme is set to system
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('invoiceTemplate', invoiceTemplate);
  }, [invoiceTemplate]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const handleInvoiceTemplateChange = (newTemplate: string) => {
    setInvoiceTemplate(newTemplate);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Appearance</h3>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
          <select 
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invoice Template</label>
          <select 
            value={invoiceTemplate}
            onChange={(e) => handleInvoiceTemplateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="modern-blue">Modern Blue</option>
            <option value="classic-white">Classic White</option>
            <option value="professional-gray">Professional Gray</option>
          </select>
        </div>
        <button className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
};
