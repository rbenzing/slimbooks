
import React, { useState, useEffect } from 'react';

export const AppearanceSettingsTab = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });
  
  const [invoiceTemplate, setInvoiceTemplate] = useState(() => {
    return localStorage.getItem('invoiceTemplate') || 'modern-blue';
  });

  useEffect(() => {
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
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('invoiceTemplate', invoiceTemplate);
  }, [invoiceTemplate]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const handleInvoiceTemplateChange = (newTemplate: string) => {
    setInvoiceTemplate(newTemplate);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Appearance</h3>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
          <select 
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invoice Template</label>
          <select 
            value={invoiceTemplate}
            onChange={(e) => handleInvoiceTemplateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="modern-blue">Modern Blue</option>
            <option value="classic-white">Classic White</option>
            <option value="professional-gray">Professional Gray</option>
          </select>
        </div>
        <button className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
};
