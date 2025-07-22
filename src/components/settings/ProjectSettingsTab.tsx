import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Settings, Globe, CreditCard, Mail, Shield, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { themeClasses } from '@/lib/utils';
import { sqliteService } from '@/services/sqlite.svc';
import { toast } from 'sonner';

interface ProjectSettings {
  google_oauth: {
    enabled: boolean;
    client_id: string;
    client_secret: string;
    configured: boolean;
  };
  stripe: {
    enabled: boolean;
    publishable_key: string;
    secret_key: string;
    configured: boolean;
  };
  email: {
    enabled: boolean;
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_pass: string;
    email_from: string;
    configured: boolean;
  };
  security: {
    require_email_verification: boolean;
    max_failed_login_attempts: number;
    account_lockout_duration: number;
  };
}

export interface ProjectSettingsRef {
  saveSettings: () => Promise<void>;
}

export const ProjectSettingsTab = forwardRef<ProjectSettingsRef>((props, ref) => {
  const [settings, setSettings] = useState<ProjectSettings>({
    google_oauth: {
      enabled: false,
      client_id: '',
      client_secret: '',
      configured: false
    },
    stripe: {
      enabled: false,
      publishable_key: '',
      secret_key: '',
      configured: false
    },
    email: {
      enabled: false,
      smtp_host: '',
      smtp_port: 587,
      smtp_user: '',
      smtp_pass: '',
      email_from: '',
      configured: false
    },
    security: {
      require_email_verification: true,
      max_failed_login_attempts: 5,
      account_lockout_duration: 1800000
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState({
    google_client_secret: false,
    stripe_secret_key: false,
    smtp_pass: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  // Expose saveSettings function to parent component
  useImperativeHandle(ref, () => ({
    saveSettings
  }));

  const loadSettings = async () => {
    try {
      if (!sqliteService.isReady()) {
        await sqliteService.initialize();
      }

      const projectSettings = await sqliteService.getProjectSettings();
      setSettings(projectSettings);
    } catch (error) {
      console.error('Error loading project settings:', error);
      toast.error('Failed to load project settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = (section: keyof ProjectSettings) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        enabled: !prev[section].enabled
      }
    }));
  };

  const handleInputChange = (section: keyof ProjectSettings, field: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const saveSettings = async () => {
    try {
      if (!sqliteService.isReady()) {
        await sqliteService.initialize();
      }

      await sqliteService.updateProjectSettings(settings);
      toast.success('Project settings saved successfully');
    } catch (error) {
      console.error('Error saving project settings:', error);
      toast.error('Failed to save project settings');
    }
  };

  const toggleSecretVisibility = (key: keyof typeof showSecrets) => {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-card-foreground">Project Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure integrations and features for your application. These settings override the default .env configuration.
        </p>
      </div>

      {/* Google OAuth Settings */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Globe className="h-5 w-5 text-primary mr-2" />
            <h4 className="text-md font-medium text-card-foreground">Google OAuth</h4>
            {settings.google_oauth.configured && (
              <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
            )}
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.google_oauth.enabled}
              onChange={() => handleToggleEnabled('google_oauth')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {!settings.google_oauth.configured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">
                Google OAuth is not configured in your .env file. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Client ID
            </label>
            <input
              type="text"
              value={settings.google_oauth.client_id}
              onChange={(e) => handleInputChange('google_oauth', 'client_id', e.target.value)}
              placeholder="Your Google OAuth Client ID"
              className={themeClasses.input}
              disabled={!settings.google_oauth.enabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Client Secret
            </label>
            <div className="relative">
              <input
                type={showSecrets.google_client_secret ? 'text' : 'password'}
                value={settings.google_oauth.client_secret}
                onChange={(e) => handleInputChange('google_oauth', 'client_secret', e.target.value)}
                placeholder="Your Google OAuth Client Secret"
                className={`${themeClasses.input} pr-10`}
                disabled={!settings.google_oauth.enabled}
              />
              <button
                type="button"
                onClick={() => toggleSecretVisibility('google_client_secret')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showSecrets.google_client_secret ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex items-center mb-4">
          <Shield className="h-5 w-5 text-primary mr-2" />
          <h4 className="text-md font-medium text-card-foreground">Security Settings</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-card-foreground">Require Email Verification</label>
              <p className="text-sm text-muted-foreground">Users must verify their email before accessing the application</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.security.require_email_verification}
                onChange={(e) => handleInputChange('security', 'require_email_verification', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>



          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Max Failed Login Attempts
            </label>
            <input
              type="number"
              value={settings.security.max_failed_login_attempts}
              onChange={(e) => handleInputChange('security', 'max_failed_login_attempts', parseInt(e.target.value))}
              min="1"
              max="10"
              className={themeClasses.input}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Account Lockout Duration (minutes)
            </label>
            <input
              type="number"
              value={Math.floor(settings.security.account_lockout_duration / 60000)}
              onChange={(e) => handleInputChange('security', 'account_lockout_duration', parseInt(e.target.value) * 60000)}
              min="1"
              max="1440"
              className={themeClasses.input}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

ProjectSettingsTab.displayName = 'ProjectSettingsTab';
