
import React, { useState, useEffect } from 'react';
import { InvoicesTab } from './invoices/InvoicesTab';
import { TemplatesTab } from './invoices/TemplatesTab';
import { useLocation } from 'react-router-dom';

export const InvoiceManagement = () => {
  const [activeTab, setActiveTab] = useState('invoices');
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash === 'templates') {
      setActiveTab('templates');
    } else {
      setActiveTab('invoices');
    }
  }, [location.hash]);

  return (
    <div className="h-full bg-gray-100 dark:bg-gray-900">
      <div className="p-6">
        {activeTab === 'invoices' && <InvoicesTab />}
        {activeTab === 'templates' && <TemplatesTab />}
      </div>
    </div>
  );
};
