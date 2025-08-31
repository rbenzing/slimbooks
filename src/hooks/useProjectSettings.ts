import { useState, useEffect } from 'react';
import { sqliteService } from '@/services/sqlite.svc';

interface ProjectSettings {
  google_oauth: {
    enabled: boolean;
    client_id: string;
    configured: boolean;
  };
  stripe: {
    enabled: boolean;
    publishable_key: string;
    configured: boolean;
  };
  email: {
    enabled: boolean;
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    email_from: string;
    configured: boolean;
  };
  security: {
    require_email_verification: boolean;
    max_failed_login_attempts: number;
    account_lockout_duration: number;
  };
}

export const useProjectSettings = () => {
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Remove redundant initialization - getProjectSettings will handle it
        const projectSettings = await sqliteService.getProjectSettings();
        setSettings(projectSettings);
      } catch (err) {
        console.error('Error loading project settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project settings');
        
        // Set default settings if loading fails
        setSettings({
          google_oauth: {
            enabled: false,
            client_id: '',
            configured: false
          },
          stripe: {
            enabled: false,
            publishable_key: '',
            configured: false
          },
          email: {
            enabled: false,
            smtp_host: '',
            smtp_port: 587,
            smtp_user: '',
            email_from: '',
            configured: false
          },
          security: {
            require_email_verification: true,
            max_failed_login_attempts: 5,
            account_lockout_duration: 1800000
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const refreshSettings = async () => {
    try {
      // Remove redundant initialization - getProjectSettings will handle it
      const projectSettings = await sqliteService.getProjectSettings();
      setSettings(projectSettings);
      setError(null);
    } catch (err) {
      console.error('Error refreshing project settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh project settings');
    }
  };

  return {
    settings,
    isLoading,
    error,
    refreshSettings
  };
};
