
import { useState, useEffect, useRef } from 'react';
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
import { ProjectSettingsTab, ProjectSettingsRef } from './settings/ProjectSettingsTab';
import { DatabaseBackupSection } from './settings/DatabaseBackupSection';
import { themeClasses, getButtonClasses } from '@/utils/themeUtils.util';
import { toast } from 'sonner';
import { useProjectSettings } from '@/hooks/useProjectSettings';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const projectSettingsRef = useRef<ProjectSettingsRef>(null);
  const { settings: projectSettings } = useProjectSettings();

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const availableTabs = ['company', 'general', 'tax', 'shipping', 'email', 'notifications', 'appearance', 'project', 'backup'];
    
    // Add stripe tab only if the integration is enabled
    if (projectSettings?.stripe?.enabled) {
      availableTabs.push('stripe');
    }
    
    if (hash && availableTabs.includes(hash)) {
      setActiveTab(hash);
    } else if (hash === 'stripe' && !projectSettings?.stripe?.enabled) {
      // If trying to access stripe tab but it's disabled, redirect to project settings
      setActiveTab('project');
    } else {
      setActiveTab('company');
    }
  }, [location.hash, projectSettings?.stripe?.enabled]);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Handle specific tab saving
      if (activeTab === 'project' && projectSettingsRef.current) {
        await projectSettingsRef.current.saveSettings();
      } else if (activeTab === 'company') {
        // For company settings, trigger a manual save by dispatching a custom event
        const companyEvent = new CustomEvent('saveCompanySettings');
        window.dispatchEvent(companyEvent);
        toast.success('Settings saved successfully');
      } else if (activeTab === 'email') {
        // For email settings, trigger a manual save by dispatching a custom event
        const emailEvent = new CustomEvent('saveEmailSettings');
        window.dispatchEvent(emailEvent);
        toast.success('Settings saved successfully');
      } else if (activeTab === 'general') {
        // For general settings, trigger a manual save by dispatching a custom event
        const generalEvent = new CustomEvent('saveGeneralSettings');
        window.dispatchEvent(generalEvent);
        toast.success('Settings saved successfully');
      } else if (activeTab === 'appearance') {
        // For appearance settings, trigger a manual save by dispatching a custom event
        const appearanceEvent = new CustomEvent('saveAppearanceSettings');
        window.dispatchEvent(appearanceEvent);
        toast.success('Settings saved successfully');
      } else if (activeTab === 'notifications') {
        // For notification settings, trigger a manual save by dispatching a custom event
        const notificationEvent = new CustomEvent('saveNotificationSettings');
        window.dispatchEvent(notificationEvent);
        toast.success('Settings saved successfully');
      } else {
        // For other tabs, the individual settings components handle their own saving
        // This is just a unified save action that triggers success feedback
        await new Promise(resolve => setTimeout(resolve, 500));
        toast.success('Settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
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

        {/* Tab Navigation */}
        <div className="border-b border-border mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'company', label: 'Company' },
              { key: 'general', label: 'General' },
              { key: 'tax', label: 'Tax' },
              { key: 'shipping', label: 'Shipping' },
              { key: 'email', label: 'Email' },
              ...(projectSettings?.stripe?.enabled ? [{ key: 'stripe', label: 'Stripe' }] : []),
              { key: 'notifications', label: 'Notifications' },
              { key: 'appearance', label: 'Appearance' },
              { key: 'project', label: 'Project' },
              { key: 'backup', label: 'Backup' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  window.location.hash = tab.key;
                }}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.key 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'company' && <CompanySettings />}
          {activeTab === 'general' && <GeneralSettingsTab />}
          {activeTab === 'tax' && <TaxSettings />}
          {activeTab === 'shipping' && <ShippingSettings />}
          {activeTab === 'email' && <EmailSettings />}
          {activeTab === 'stripe' && projectSettings?.stripe?.enabled && <StripeSettingsTab />}
          {activeTab === 'notifications' && <NotificationSettingsTab />}
          {activeTab === 'appearance' && <AppearanceSettingsTab />}
          {activeTab === 'project' && <ProjectSettingsTab ref={projectSettingsRef} />}
          {activeTab === 'backup' && <DatabaseBackupSection />}
        </div>
      </div>
    </div>
  );
};
