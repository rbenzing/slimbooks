
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Building } from 'lucide-react';
import { BrandingImageSection } from './BrandingImageSection';
import { CompanyDetailsSection } from './CompanyDetailsSection';
import { CompanySettings as CompanySettingsType } from '@/types/shared/common.types';

export const CompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettingsType>({
    companyName: 'ClientBill Pro',
    ownerName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    email: '',
    phone: '',
    brandingImage: ''
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const settingsRef = useRef(settings);

  // Keep settings ref up to date
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Use dynamic import to avoid circular dependencies
        const { sqliteService } = await import('@/services/sqlite.svc');
        
        if (!sqliteService.isReady()) {
          await sqliteService.initialize();
        }

        const saved = await sqliteService.getSetting('company_settings');
        if (saved && typeof saved === 'object' && saved !== null) {
          // Type guard to safely access properties from unknown type
          const savedSettings = saved as Record<string, unknown>;
          setSettings({
            companyName: typeof savedSettings.companyName === 'string' ? savedSettings.companyName : 'ClientBill Pro',
            ownerName: typeof savedSettings.ownerName === 'string' ? savedSettings.ownerName : '',
            address: typeof savedSettings.address === 'string' ? savedSettings.address : '',
            city: typeof savedSettings.city === 'string' ? savedSettings.city : '',
            state: typeof savedSettings.state === 'string' ? savedSettings.state : '',
            zipCode: typeof savedSettings.zipCode === 'string' ? savedSettings.zipCode : '',
            email: typeof savedSettings.email === 'string' ? savedSettings.email : '',
            phone: typeof savedSettings.phone === 'string' ? savedSettings.phone : '',
            brandingImage: typeof savedSettings.brandingImage === 'string' ? savedSettings.brandingImage : ''
          });
        }
      } catch (error) {
        console.error('Error loading company settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Listen for save events from the main Settings component
  useEffect(() => {
    const handleSaveEvent = () => {
      // Use current settings from ref to avoid stale closure
      saveSettings(settingsRef.current);
    };

    window.addEventListener('saveCompanySettings', handleSaveEvent);
    return () => {
      window.removeEventListener('saveCompanySettings', handleSaveEvent);
    };
  }, []); // No dependencies - use ref for current settings

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const saveSettings = async (newSettings: CompanySettings) => {
    try {
      // Use unified sqlite service - much cleaner!
      const { sqliteService } = await import('@/services/sqlite.svc');
      await sqliteService.setSetting('company_settings', newSettings, 'company');
    } catch (error) {
      console.error('Error saving company settings:', error);
      throw error; // Re-throw so the UI can handle the error
    }
  };

  // Settings are only saved when the Save button is clicked

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const newSettings = { ...settings, brandingImage: result };
        setSettings(newSettings); // Only update UI, don't save yet
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings); // Only update UI, don't save until Save button is clicked
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center mb-6">
        <Building className="h-5 w-5 text-primary mr-2" />
        <h3 className="text-lg font-medium text-card-foreground">Company Information</h3>
      </div>

      <div className="space-y-6">
        <BrandingImageSection
          settings={settings}
          onImageUpload={handleImageUpload}
        />

        <CompanyDetailsSection
          settings={settings}
          onInputChange={handleInputChange}
        />


      </div>
    </div>
  );
};
