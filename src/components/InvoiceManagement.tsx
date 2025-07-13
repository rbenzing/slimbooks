
import React, { useState, useEffect } from 'react';
import { InvoicesTab } from './invoices/InvoicesTab';
import { TemplatesTab } from './invoices/TemplatesTab';
import { EditInvoicePage } from './invoices/EditInvoicePage';
import { useLocation } from 'react-router-dom';

export const InvoiceManagement = () => {
  const [activeTab, setActiveTab] = useState('invoices');
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const pathname = location.pathname;
    
    // Check if we're on an edit route
    if (pathname.includes('/invoices/edit/')) {
      setActiveTab('edit');
    } else if (hash === 'templates') {
      setActiveTab('templates');
    } else {
      setActiveTab('invoices');
    }
  }, [location.hash, location.pathname]);

  return (
    <div className="h-full bg-background">
      <div className="p-6">
        {activeTab === 'invoices' && <InvoicesTab />}
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'edit' && <EditInvoicePage />}
      </div>
    </div>
  );
};
