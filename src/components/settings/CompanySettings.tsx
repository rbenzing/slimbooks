
import React, { useState, useEffect } from 'react';
import { Building, Upload, Edit2 } from 'lucide-react';

interface CompanySettings {
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
    // Load company settings from localStorage
    const saved = localStorage.getItem('company_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('company_settings', JSON.stringify(settings));
      // Show success message (you could add a toast here)
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Building className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
      </div>
      
      <div className="space-y-6">
        {/* Branding Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Branding Image</label>
          <div className="flex items-center space-x-4">
            {settings.brandingImage ? (
              <div className="relative">
                <img 
                  src={settings.brandingImage} 
                  alt="Company Logo" 
                  className="h-16 w-16 object-cover rounded-lg border border-gray-300"
                />
                <button
                  onClick={() => document.getElementById('branding-upload')?.click()}
                  className="absolute -top-2 -right-2 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div>
              <input
                id="branding-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => document.getElementById('branding-upload')?.click()}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                {settings.brandingImage ? 'Change Image' : 'Upload Image'}
              </button>
            </div>
          </div>
        </div>

        {/* Company Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
            <input
              type="text"
              value={settings.ownerName}
              onChange={(e) => handleInputChange('ownerName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <input
            type="text"
            value={settings.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              value={settings.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input
              type="text"
              value={settings.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
            <input
              type="text"
              value={settings.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Company Settings'}
        </button>
      </div>
    </div>
  );
};
