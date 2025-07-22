
import React, { useState, useEffect } from 'react';
import { themeClasses } from '@/lib/utils';
import { sqliteService } from '@/services/sqlite.svc';

export const AppearanceSettingsTab = () => {
  const [theme, setTheme] = useState('system');
  const [invoiceTemplate, setInvoiceTemplate] = useState('modern-blue');
  const [pdfFormat, setPdfFormat] = useState('A4');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from database on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!sqliteService.isReady()) {
          await sqliteService.initialize();
        }

        const settings = await sqliteService.getAllSettings('appearance');

        // Migrate from localStorage if database settings don't exist
        if (!settings.theme && !settings.invoice_template) {
          const localTheme = localStorage.getItem('theme') || 'system';
          const localTemplate = localStorage.getItem('invoiceTemplate') || 'modern-blue';

          setTheme(localTheme);
          setInvoiceTemplate(localTemplate);
          setPdfFormat('A4'); // Default PDF format

          // Save to database and clear localStorage
          await sqliteService.setMultipleSettings({
            'theme': { value: localTheme, category: 'appearance' },
            'invoice_template': { value: localTemplate, category: 'appearance' },
            'pdf_format': { value: { format: 'A4' }, category: 'appearance' }
          });

          localStorage.removeItem('theme');
          localStorage.removeItem('invoiceTemplate');
        } else {
          // Use database settings
          if (settings.theme) setTheme(settings.theme);
          if (settings.invoice_template) setInvoiceTemplate(settings.invoice_template);
          if (settings.pdf_format) setPdfFormat(settings.pdf_format.format || 'A4');
        }

        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading appearance settings:', error);
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (!isLoaded) return;

    const applyTheme = (selectedTheme: string) => {
      const root = document.documentElement;

      if (selectedTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.toggle('dark', systemTheme === 'dark');
      } else {
        root.classList.toggle('dark', selectedTheme === 'dark');
      }
    };

    applyTheme(theme);

    // Save to database
    sqliteService.setSetting('theme', theme, 'appearance').catch(console.error);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, isLoaded]);

  // Save invoice template changes
  useEffect(() => {
    if (!isLoaded) return;

    sqliteService.setSetting('invoice_template', invoiceTemplate, 'appearance').catch(console.error);
  }, [invoiceTemplate, isLoaded]);

  // Save PDF format changes
  useEffect(() => {
    if (!isLoaded) return;

    sqliteService.setSetting('pdf_format', { format: pdfFormat }, 'appearance').catch(console.error);
  }, [pdfFormat, isLoaded]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const handleInvoiceTemplateChange = (newTemplate: string) => {
    setInvoiceTemplate(newTemplate);
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <h3 className="text-lg font-medium text-card-foreground mb-6">Appearance</h3>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Theme</label>
          <select
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value)}
            className={`w-full ${themeClasses.select}`}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Invoice Template</label>
          <select
            value={invoiceTemplate}
            onChange={(e) => handleInvoiceTemplateChange(e.target.value)}
            className={`w-full ${themeClasses.select}`}
          >
            <option value="modern-blue">Modern Blue</option>
            <option value="classic-white">Classic White</option>
            <option value="professional-gray">Professional Gray</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">PDF Format</label>
          <select
            value={pdfFormat}
            onChange={(e) => setPdfFormat(e.target.value)}
            className={`w-full ${themeClasses.select}`}
          >
            <option value="A4">A4 (210 × 297 mm)</option>
            <option value="Letter">Letter (8.5 × 11 in)</option>
            <option value="Legal">Legal (8.5 × 14 in)</option>
            <option value="A3">A3 (297 × 420 mm)</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Choose the default paper size for PDF invoices and reports
          </p>
        </div>

      </div>
    </div>
  );
};
