
import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { InvoicesTab } from './invoices/InvoicesTab';
import { TemplatesTab } from './invoices/TemplatesTab';

export const InvoiceManagement = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
        <p className="text-gray-600">Create, track, and manage your client invoices</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices">Sent Invoices</TabsTrigger>
          <TabsTrigger value="templates">Recurring Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="invoices" className="space-y-6">
          <InvoicesTab />
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          <TemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
