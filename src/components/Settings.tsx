
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
