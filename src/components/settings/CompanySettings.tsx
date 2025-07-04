
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

  const [isLoading, setIsLoading] = useState(false);

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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('company_settings', JSON.stringify(settings));
      console.log('Company settings saved successfully');
    } catch (error) {
      console.error('Error saving company settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSettings({ ...settings, brandingImage: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    setSettings({ ...settings, [field]: value });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center mb-6">
        <Building className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Company Information</h3>
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

        <button 
          onClick={handleSave}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Company Settings'}
        </button>
      </div>
    </div>
  );
};
