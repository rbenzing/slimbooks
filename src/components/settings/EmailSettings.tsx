import React, { useState, useEffect } from 'react';
import { Mail, TestTube, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { sqliteService } from '@/lib/sqlite-service';
import { themeClasses } from '@/lib/utils';
import { toast } from 'sonner';

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecure: 'tls' | 'ssl' | 'none';
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
  isEnabled: boolean;
}

export const EmailSettings = () => {
  const [settings, setSettings] = useState<EmailSettings>({
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpSecure: 'tls',
    fromEmail: '',
    fromName: '',
    replyToEmail: '',
    isEnabled: false
  });

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      if (!sqliteService.isReady()) {
        await sqliteService.initialize();
      }

      const saved = await sqliteService.getSetting('email_settings');
      if (saved) {
        setSettings({
          smtpHost: saved.smtpHost || '',
          smtpPort: saved.smtpPort || 587,
          smtpUsername: saved.smtpUsername || '',
          smtpPassword: saved.smtpPassword || '',
          smtpSecure: saved.smtpSecure || 'tls',
          fromEmail: saved.fromEmail || '',
          fromName: saved.fromName || '',
          replyToEmail: saved.replyToEmail || '',
          isEnabled: saved.isEnabled || false
        });
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    }
  };

  const handleInputChange = (field: keyof EmailSettings, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset connection status when settings change
    if (connectionStatus !== 'unknown') {
      setConnectionStatus('unknown');
    }
  };

  const saveSettings = async () => {
    try {
      if (!sqliteService.isReady()) {
        await sqliteService.initialize();
      }

      await sqliteService.setSetting('email_settings', settings);
      toast.success('Email settings saved successfully');
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast.error('Failed to save email settings');
    }
  };

  const testConnection = async () => {
    if (!settings.smtpHost || !settings.smtpUsername || !settings.fromEmail) {
      toast.error('Please fill in required fields before testing');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('unknown');

    try {
      // Save settings first
      await saveSettings();

      // Test the connection using the email service
      const { EmailService } = await import('@/lib/email-service');
      const emailService = EmailService.getInstance();
      
      const testResult = await emailService.testConnection();
      
      if (testResult.success) {
        setConnectionStatus('success');
        toast.success('SMTP connection test successful!');
      } else {
        setConnectionStatus('error');
        toast.error(`Connection test failed: ${testResult.message}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Connection test failed: ' + error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const sendTestEmail = async () => {
    if (!settings.fromEmail) {
      toast.error('Please set a from email address');
      return;
    }

    try {
      const { EmailService } = await import('@/lib/email-service');
      const emailService = EmailService.getInstance();
      
      const result = await emailService.sendEmail(
        settings.fromEmail,
        'Test Email from Slimbooks',
        '<h2>Test Email</h2><p>This is a test email from your Slimbooks application. If you received this, your email configuration is working correctly!</p>',
        'Test Email\n\nThis is a test email from your Slimbooks application. If you received this, your email configuration is working correctly!'
      );

      if (result.success) {
        toast.success('Test email sent successfully!');
      } else {
        toast.error(`Failed to send test email: ${result.message}`);
      }
    } catch (error) {
      toast.error('Failed to send test email: ' + error);
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'success':
        return 'Connection successful';
      case 'error':
        return 'Connection failed';
      default:
        return 'Not tested';
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Configuration */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex items-center mb-6">
          <Mail className="h-5 w-5 text-primary mr-2" />
          <h3 className="text-lg font-medium text-card-foreground">Email Configuration</h3>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable Email */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-card-foreground">Enable Email Sending</h4>
              <p className="text-sm text-muted-foreground">Allow the application to send emails for invoices, reminders, and client communications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.isEnabled}
                onChange={(e) => handleInputChange('isEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center">
              {getConnectionStatusIcon()}
              <span className="ml-2 text-sm font-medium text-card-foreground">
                {getConnectionStatusText()}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={testConnection}
                disabled={isTestingConnection || !settings.isEnabled}
                className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={sendTestEmail}
                disabled={!settings.isEnabled || connectionStatus !== 'success'}
                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Test Email
              </button>
            </div>
          </div>

          {/* SMTP Server Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                SMTP Host *
              </label>
              <input
                type="text"
                value={settings.smtpHost}
                onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                placeholder="smtp.gmail.com"
                className={themeClasses.input}
                disabled={!settings.isEnabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                SMTP Port *
              </label>
              <input
                type="number"
                value={settings.smtpPort}
                onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value) || 587)}
                placeholder="587"
                className={themeClasses.input}
                disabled={!settings.isEnabled}
              />
            </div>
          </div>

          {/* Security Settings */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Security Protocol
            </label>
            <select
              value={settings.smtpSecure}
              onChange={(e) => handleInputChange('smtpSecure', e.target.value as 'tls' | 'ssl' | 'none')}
              className={themeClasses.select}
              disabled={!settings.isEnabled}
            >
              <option value="tls">TLS (Recommended - Port 587)</option>
              <option value="ssl">SSL (Port 465)</option>
              <option value="none">None (Port 25 - Not recommended)</option>
            </select>
          </div>

          {/* Authentication */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Username *
              </label>
              <input
                type="text"
                value={settings.smtpUsername}
                onChange={(e) => handleInputChange('smtpUsername', e.target.value)}
                placeholder="your-email@gmail.com"
                className={themeClasses.input}
                disabled={!settings.isEnabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={settings.smtpPassword}
                  onChange={(e) => handleInputChange('smtpPassword', e.target.value)}
                  placeholder="App password or account password"
                  className={themeClasses.input}
                  disabled={!settings.isEnabled}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  disabled={!settings.isEnabled}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>

          {/* Email Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                From Email *
              </label>
              <input
                type="email"
                value={settings.fromEmail}
                onChange={(e) => handleInputChange('fromEmail', e.target.value)}
                placeholder="invoices@yourcompany.com"
                className={themeClasses.input}
                disabled={!settings.isEnabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                From Name
              </label>
              <input
                type="text"
                value={settings.fromName}
                onChange={(e) => handleInputChange('fromName', e.target.value)}
                placeholder="Your Company Name"
                className={themeClasses.input}
                disabled={!settings.isEnabled}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Reply-To Email
            </label>
            <input
              type="email"
              value={settings.replyToEmail}
              onChange={(e) => handleInputChange('replyToEmail', e.target.value)}
              placeholder="support@yourcompany.com"
              className={themeClasses.input}
              disabled={!settings.isEnabled}
            />
          </div>


        </div>
      </div>

      {/* Help Section */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <h4 className="text-sm font-medium text-card-foreground mb-3">Common SMTP Settings</h4>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div>
            <strong>Gmail:</strong> smtp.gmail.com, Port 587 (TLS) or 465 (SSL)
            <br />
            <em>Note: Use App Password instead of regular password</em>
          </div>
          <div>
            <strong>Outlook/Hotmail:</strong> smtp-mail.outlook.com, Port 587 (TLS)
          </div>
          <div>
            <strong>Yahoo:</strong> smtp.mail.yahoo.com, Port 587 (TLS) or 465 (SSL)
          </div>
          <div>
            <strong>SendGrid:</strong> smtp.sendgrid.net, Port 587 (TLS)
          </div>
        </div>
      </div>
    </div>
  );
};
