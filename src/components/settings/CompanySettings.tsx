
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Building } from 'lucide-react';
import { BrandingImageSection } from './BrandingImageSection';
import { CompanyDetailsSection } from './CompanyDetailsSection';
import { CompanySettings } from '@/types';

export const CompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettings>({
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
      // Use dynamic import to avoid circular dependencies
      const { sqliteService } = await import('@/services/sqlite.svc');
      await sqliteService.setSetting('company_settings', newSettings, 'company');
    } catch (error) {
      console.error('Error saving company settings:', error);
    }
  };

  // Debounced save function for text inputs (excludes branding image)
  const debouncedSaveTextSettings = useCallback((newSettings: CompanySettings) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      // Save only text settings, preserve existing branding image
      const textOnlySettings = {
        ...newSettings,
        brandingImage: settings.brandingImage // Keep existing image
      };
      saveSettings(textOnlySettings);
    }, 500); // 500ms debounce
  }, [settings.brandingImage]);

  // Immediate save for branding image
  const saveBrandingImage = async (newSettings: CompanySettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const newSettings = { ...settings, brandingImage: result };
        saveBrandingImage(newSettings);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings); // Update UI immediately
    debouncedSaveTextSettings(newSettings); // Save with debounce
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
