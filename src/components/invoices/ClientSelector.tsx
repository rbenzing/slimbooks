
import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';

interface ClientSelectorProps {
  clients: any[];
  selectedClient: any;
  onClientSelect: (client: any) => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({ 
  clients, 
  selectedClient, 
  onClientSelect 
}) => {
  const [isEditing, setIsEditing] = useState(!selectedClient);

  const handleClientSelect = (client: any) => {
    onClientSelect(client);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    onClientSelect(null);
  };

  if (isEditing || !selectedClient) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Bill To:</h3>
        </div>
        <select
          value={selectedClient?.id || ''}
          onChange={(e) => {
            const client = clients.find(c => c.id === parseInt(e.target.value));
            if (client) {
              handleClientSelect(client);
            }
          }}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Select a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} - {client.company}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Bill To:</h3>
        <button
          onClick={handleEdit}
          className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
        >
          <Edit2 className="h-4 w-4 mr-1" />
          Edit
        </button>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="font-semibold">{selectedClient.name}</div>
        <div>{selectedClient.company}</div>
        <div>{selectedClient.address}</div>
        <div>{selectedClient.city}, {selectedClient.state} {selectedClient.zipCode}</div>
        <div>{selectedClient.email}</div>
      </div>
    </div>
  );
};
