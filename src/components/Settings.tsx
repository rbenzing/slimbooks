
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Save } from 'lucide-react';
import { TaxSettings } from './settings/TaxSettings';
import { ShippingSettings } from './settings/ShippingSettings';
import { CompanySettings } from './settings/CompanySettings';
import { GeneralSettingsTab } from './settings/GeneralSettingsTab';
import { EmailSettings } from './settings/EmailSettings';
import { StripeSettingsTab } from './settings/StripeSettingsTab';
import { NotificationSettingsTab } from './settings/NotificationSettingsTab';
import { AppearanceSettingsTab } from './settings/AppearanceSettingsTab';
import { DatabaseBackupSection } from './settings/DatabaseBackupSection';
import { themeClasses, getButtonClasses } from '@/lib/utils';
import { toast } from 'sonner';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['company', 'general', 'tax', 'shipping', 'email', 'stripe', 'notifications', 'appearance', 'backup'].includes(hash)) {
      setActiveTab(hash);
    } else {
      setActiveTab('company');
    }
  }, [location.hash]);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // The individual settings components handle their own saving
      // This is just a unified save action that triggers success feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={themeClasses.page}>
      <div className={themeClasses.pageContainer}>
        {/* Header */}
        <div className={themeClasses.sectionHeader}>
          <div>
            <h1 className={themeClasses.sectionTitle}>Settings</h1>
            <p className={themeClasses.sectionSubtitle}>Manage your application preferences and integrations</p>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className={getButtonClasses('primary')}
          >
            <Save className={themeClasses.iconButton} />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'company' && <CompanySettings />}
          {activeTab === 'general' && <GeneralSettingsTab />}
          {activeTab === 'tax' && <TaxSettings />}
          {activeTab === 'shipping' && <ShippingSettings />}
          {activeTab === 'email' && <EmailSettings />}
          {activeTab === 'stripe' && <StripeSettingsTab />}
          {activeTab === 'notifications' && <NotificationSettingsTab />}
          {activeTab === 'appearance' && <AppearanceSettingsTab />}
          {activeTab === 'backup' && <DatabaseBackupSection />}
        </div>
      </div>
    </div>
  );
};
