
import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';

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
    // Load company settings from localStorage
    const saved = localStorage.getItem('company_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      setCompanySettings(settings);
    }
  }, []);

  const displayLogo = companyLogo || companySettings.brandingImage;

  return (
    <div className="flex items-center space-x-4">
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer relative overflow-hidden">
        {displayLogo ? (
          <img src={displayLogo} alt="Company Logo" className="w-full h-full object-cover" />
        ) : (
          <Upload className="h-6 w-6 text-gray-400" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={onLogoUpload}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{companySettings.companyName}</h1>
        <p className="text-gray-600">{companySettings.address}</p>
        <p className="text-gray-600">{companySettings.city}, {companySettings.state} {companySettings.zipCode}</p>
      </div>
    </div>
  );
};
