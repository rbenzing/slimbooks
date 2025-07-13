
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
      <label className="block text-sm font-medium text-muted-foreground mb-2">Branding Image</label>
      <div className="flex items-center space-x-4">
        {settings.brandingImage ? (
          <div className="relative">
            <img
              src={settings.brandingImage}
              alt="Company Logo"
              className="h-16 w-16 object-cover rounded-lg border border-border"
            />
            <button
              onClick={() => document.getElementById('branding-upload')?.click()}
              className="absolute -top-2 -right-2 p-1 bg-primary text-primary-foreground rounded-full hover:bg-primary/90"
            >
              <Edit2 className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="h-16 w-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
            <Upload className="h-6 w-6 text-muted-foreground" />
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
            className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-accent hover:text-accent-foreground text-card-foreground bg-card"
          >
            {settings.brandingImage ? 'Change Image' : 'Upload Image'}
          </button>
        </div>
      </div>
    </div>
  );
};
