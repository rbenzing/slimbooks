
import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { themeClasses } from '@/lib/utils';

interface CompanyHeaderProps {
  companyLogo: string;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({ companyLogo, onLogoUpload }) => {
  const [companySettings, setCompanySettings] = useState<any>({
    companyName: 'Your Company',
    address: '123 Business Street',
    city: 'City',
    state: 'State',
    zipCode: '12345',
    brandingImage: ''
  });

  useEffect(() => {
    // Load company settings from localStorage or use defaults
    const saved = localStorage.getItem('company_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      setCompanySettings(settings);
    } else {
      // Set default company settings if none exist
      const defaultSettings = {
        companyName: 'ClientBill Pro',
        address: '123 Business Street',
        city: 'Business City',
        state: 'CA',
        zipCode: '90210',
        brandingImage: ''
      };
      setCompanySettings(defaultSettings);
      // Save defaults to localStorage so they persist
      localStorage.setItem('company_settings', JSON.stringify(defaultSettings));
    }
  }, []);

  const displayLogo = companyLogo || companySettings.brandingImage;

  return (
    <div className="flex items-center space-x-4">
      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border hover:border-primary cursor-pointer relative overflow-hidden">
        {displayLogo ? (
          <img src={displayLogo} alt="Company Logo" className="w-full h-full object-cover" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={onLogoUpload}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-card-foreground">{companySettings.companyName}</h1>
        <p className="text-muted-foreground">{companySettings.address}</p>
        <p className="text-muted-foreground">{companySettings.city}, {companySettings.state} {companySettings.zipCode}</p>
      </div>
    </div>
  );
};
