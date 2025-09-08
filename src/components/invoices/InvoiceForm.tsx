
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { clientOperations } from '@/lib/database';
import { themeClasses } from '@/utils/themeUtils.util';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: any) => void;
  invoice?: any;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ isOpen, onClose, onSave, invoice }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    amount: '',
    status: 'draft',
    due_date: '',
    issue_date: '',
    description: '',
    type: 'one-time'
  });

  useEffect(() => {
    const loadClients = async () => {
      if (isOpen) {
        try {
          // Load clients
          const allClients = await clientOperations.getAll();
          setClients(allClients);
        } catch (error) {
          console.error('Error loading clients:', error);
        }
      }
    };

    loadClients();
  }, [isOpen]);

  useEffect(() => {
    if (invoice) {
      setFormData({
        client_id: invoice.client_id?.toString() || '',
        amount: invoice.amount?.toString() || '',
        status: invoice.status || 'draft',
        due_date: invoice.due_date || '',
        issue_date: invoice.issue_date || '',
        description: invoice.description || '',
        type: invoice.type || 'one-time'
      });
    } else {
      setFormData({
        client_id: '',
        amount: '',
        status: 'draft',
        due_date: '',
        description: '',
        type: 'one-time'
      });
    }
  }, [invoice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClient = clients.find(c => c.id === parseInt(formData.client_id));
    
    // Ensure dates are in ISO format, default to current date if not provided
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const issueDate = formData.issue_date || currentDate;
    const dueDate = formData.due_date || currentDate;
    
    onSave({
      ...formData,
      client_id: parseInt(formData.client_id),
      amount: parseFloat(formData.amount),
      issue_date: issueDate,
      due_date: dueDate,
      client_name: selectedClient?.name,
      client_email: selectedClient?.email,
      client_phone: selectedClient?.phone,
      client_address: selectedClient ? `${selectedClient.address}, ${selectedClient.city}, ${selectedClient.state} ${selectedClient.zipCode}` : undefined,
      line_items: JSON.stringify([{
        id: '1',
        description: formData.description,
        quantity: 1,
        rate: parseFloat(formData.amount),
        amount: parseFloat(formData.amount)
      }])
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{invoice ? 'Edit Invoice' : 'Create New Invoice'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <select
                required
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className={`w-full ${themeClasses.select}`}
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.company}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={`w-full ${themeClasses.select}`}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
              <input
                type="date"
                required
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Invoice description..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {invoice ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
