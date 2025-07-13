
import React, { useState, useEffect } from 'react';
import { Building } from 'lucide-react';
import { BrandingImageSection } from './BrandingImageSection';
import { CompanyDetailsSection } from './CompanyDetailsSection';

export interface CompanySettings {
  companyName: string;
  ownerName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phone: string;
  brandingImage: string;
}

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

  useEffect(() => {
    const saved = localStorage.getItem('company_settings');
    if (saved) {
      const parsedSettings = JSON.parse(saved);
      setSettings({
        companyName: parsedSettings.companyName || 'ClientBill Pro',
        ownerName: parsedSettings.ownerName || '',
        address: parsedSettings.address || '',
        city: parsedSettings.city || '',
        state: parsedSettings.state || '',
        zipCode: parsedSettings.zipCode || '',
        email: parsedSettings.email || '',
        phone: parsedSettings.phone || '',
        brandingImage: parsedSettings.brandingImage || ''
      });
    }
  }, []);

  const saveSettings = (newSettings: CompanySettings) => {
    setSettings(newSettings);
    localStorage.setItem('company_settings', JSON.stringify(newSettings));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const newSettings = { ...settings, brandingImage: result };
        saveSettings(newSettings);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    const newSettings = { ...settings, [field]: value };
    saveSettings(newSettings);
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
