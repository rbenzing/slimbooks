
import React, { useState, useEffect } from 'react';
import { FileText, Calendar } from 'lucide-react';
import { InvoicesTab } from './invoices/InvoicesTab';
import { TemplatesTab } from './invoices/TemplatesTab';
import { useLocation, useNavigate } from 'react-router-dom';

export const InvoiceManagement = () => {
  const [activeTab, setActiveTab] = useState('invoices');
  const location = useLocation();
  const navigate = useNavigate();

  // Set active tab based on URL hash or default to invoices
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash === 'templates') {
      setActiveTab('templates');
    } else {
      setActiveTab('invoices');
    }
  }, [location.hash]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/invoices#${tab}`);
  };

  return (
    <div className="min-h-full bg-gray-100">
      {/* Sub Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => handleTabChange('invoices')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'invoices'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Sent Invoices
            </button>
            <button
              onClick={() => handleTabChange('templates')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'templates'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Recurring Templates
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'invoices' && <InvoicesTab />}
        {activeTab === 'templates' && <TemplatesTab />}
      </div>
    </div>
  );
};
