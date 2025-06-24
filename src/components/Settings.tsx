
import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  CreditCard, 
  Mail, 
  Bell, 
  Shield, 
  Palette,
  Database,
  Key,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'stripe', name: 'Stripe Integration', icon: CreditCard },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your application preferences and integrations</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`mr-3 h-4 w-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'stripe' && <StripeSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
        </div>
      </div>
    </div>
  );
};

const GeneralSettings = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-6">General Settings</h3>
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
        <input
          type="text"
          defaultValue="ClientBill Pro"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>USD - US Dollar</option>
          <option>EUR - Euro</option>
          <option>GBP - British Pound</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>America/New_York</option>
          <option>America/Los_Angeles</option>
          <option>Europe/London</option>
        </select>
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Save Changes
      </button>
    </div>
  </div>
);

const StripeSettings = () => (
  <div className="space-y-6">
    {/* Connection Status */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Stripe Connection</h3>
        <div className="flex items-center text-red-600">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Not Connected</span>
        </div>
      </div>
      <p className="text-gray-600 mb-4">
        Connect your Stripe account to enable payment processing and invoice automation. 
        You'll need to set up Supabase integration first.
      </p>
      <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
        <div>
          <p className="text-sm font-medium text-yellow-800">Supabase Required</p>
          <p className="text-sm text-yellow-700">
            Connect to Supabase first to enable secure Stripe integration and backend functionality.
          </p>
        </div>
      </div>
      <button 
        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
        disabled
      >
        Connect Stripe Account
      </button>
    </div>

    {/* Webhook Configuration */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Webhook Configuration</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Endpoint</label>
          <input
            type="text"
            placeholder="https://your-app.com/api/webhooks/stripe"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Events to Listen</label>
          <div className="space-y-2">
            {['invoice.payment_succeeded', 'invoice.payment_failed', 'customer.subscription.updated'].map((event) => (
              <label key={event} className="flex items-center">
                <input type="checkbox" className="mr-2" disabled />
                <span className="text-sm text-gray-500">{event}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const NotificationSettings = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h3>
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Email Notifications</h4>
        <div className="space-y-3">
          {[
            'New invoice created',
            'Payment received',
            'Invoice overdue',
            'Recurring invoice scheduled'
          ].map((notification) => (
            <label key={notification} className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-3" />
              <span className="text-sm text-gray-700">{notification}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Client Notifications</h4>
        <div className="space-y-3">
          {[
            'Send invoice automatically',
            'Send payment reminders',
            'Send payment confirmations'
          ].map((notification) => (
            <label key={notification} className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-3" />
              <span className="text-sm text-gray-700">{notification}</span>
            </label>
          ))}
        </div>
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Save Preferences
      </button>
    </div>
  </div>
);

const SecuritySettings = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h3>
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">API Access</h4>
        <p className="text-sm text-gray-600 mb-4">Manage API keys and access tokens for your application.</p>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Generate API Key
        </button>
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Data Export</h4>
        <p className="text-sm text-gray-600 mb-4">Download your data for backup or migration purposes.</p>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Export Data
        </button>
      </div>
    </div>
  </div>
);

const AppearanceSettings = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-6">Appearance</h3>
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>Light</option>
          <option>Dark</option>
          <option>System</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Template</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>Modern Blue</option>
          <option>Classic White</option>
          <option>Professional Gray</option>
        </select>
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Save Changes
      </button>
    </div>
  </div>
);
