
import React from 'react';
import { Upload, Edit2 } from 'lucide-react';
import { CompanySettings } from './CompanySettings';

interface BrandingImageSectionProps {
  settings: CompanySettings;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BrandingImageSection: React.FC<BrandingImageSectionProps> = ({
  settings,
  onImageUpload
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branding Image</label>
      <div className="flex items-center space-x-4">
        {settings.brandingImage ? (
          <div className="relative">
            <img 
              src={settings.brandingImage} 
              alt="Company Logo" 
              className="h-16 w-16 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
            />
            <button
              onClick={() => document.getElementById('branding-upload')?.click()}
              className="absolute -top-2 -right-2 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Edit2 className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="h-16 w-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
            <Upload className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        <div>
          <input
            id="branding-upload"
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
          />
          <button
            onClick={() => document.getElementById('branding-upload')?.click()}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
          >
            {settings.brandingImage ? 'Change Image' : 'Upload Image'}
          </button>
        </div>
      </div>
    </div>
  );
};
