
import React from 'react';
import { User, Plus } from 'lucide-react';

interface ClientSelectorProps {
  clients: any[];
  selectedClient: any;
  onClientSelect: (client: any) => void;
  disabled?: boolean;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({ 
  clients, 
  selectedClient, 
  onClientSelect,
  disabled = false 
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Bill To:</h3>
      
      {selectedClient ? (
        <div className={`p-4 border rounded-lg ${disabled ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <User className="h-4 w-4 text-gray-600 mr-2" />
                <span className="font-medium text-gray-900">{selectedClient.name}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>{selectedClient.company}</div>
                <div>{selectedClient.email}</div>
                {selectedClient.phone && <div>{selectedClient.phone}</div>}
                {selectedClient.address && (
                  <div className="mt-2">
                    <div>{selectedClient.address}</div>
                    <div>
                      {selectedClient.city && `${selectedClient.city}, `}
                      {selectedClient.state && `${selectedClient.state} `}
                      {selectedClient.zip_code}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {!disabled && (
              <button
                onClick={() => onClientSelect(null)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Change
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <select
            onChange={(e) => {
              const client = clients.find(c => c.id === parseInt(e.target.value));
              if (client) onClientSelect(client);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value=""
            disabled={disabled}
          >
            <option value="">Select a client *</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} - {client.company}
              </option>
            ))}
          </select>
          
          {clients.length === 0 && (
            <div className="text-center p-6 border border-dashed border-gray-300 rounded-lg">
              <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-3">No clients found</p>
              <button className="flex items-center mx-auto px-3 py-1 text-sm text-blue-600 hover:text-blue-700">
                <Plus className="h-4 w-4 mr-1" />
                Add your first client
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
