
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TaxSettings } from './settings/TaxSettings';
import { ShippingSettings } from './settings/ShippingSettings';
import { CompanySettings } from './settings/CompanySettings';
import { GeneralSettingsTab } from './settings/GeneralSettingsTab';
import { StripeSettingsTab } from './settings/StripeSettingsTab';
import { NotificationSettingsTab } from './settings/NotificationSettingsTab';
import { AppearanceSettingsTab } from './settings/AppearanceSettingsTab';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('company');
  const location = useLocation();

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
          {activeTab === 'general' && <GeneralSettingsTab />}
          {activeTab === 'tax' && <TaxSettings />}
          {activeTab === 'shipping' && <ShippingSettings />}
          {activeTab === 'stripe' && <StripeSettingsTab />}
          {activeTab === 'notifications' && <NotificationSettingsTab />}
          {activeTab === 'appearance' && <AppearanceSettingsTab />}
        </div>
      </div>
    </div>
  );
};
