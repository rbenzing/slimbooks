
import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Building, Mail, Phone, LayoutGrid, Table, Edit, Trash2 } from 'lucide-react';
import { ClientForm } from './ClientForm';
import { ClientImportExport } from './clients/ClientImportExport';
import { clientOperations } from '../lib/database';
import { toast } from 'sonner';
import { formatDate } from '@/utils/dateFormatting';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  created_at: string;
  updated_at: string;
}

export const ClientManagement: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [showImportExport, setShowImportExport] = useState(false);
  const [viewMode, setViewMode] = useState<'panel' | 'table'>('panel');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    const allClients = clientOperations.getAll();
    setClients(allClients);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClient = () => {
    setEditingClient(null);
    setShowCreateForm(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowCreateForm(true);
  };

  const handleSaveClient = (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingClient) {
        clientOperations.update(editingClient.id, clientData);
        toast.success('Client updated successfully');
      } else {
        clientOperations.create(clientData);
        toast.success('Client created successfully');
      }
      loadClients();
      setShowCreateForm(false);
      setEditingClient(null);
    } catch (error) {
      toast.error('Failed to save client');
      console.error('Error saving client:', error);
    }
  };

  const handleDeleteClient = (id: number) => {
    try {
      clientOperations.delete(id);
      toast.success('Client deleted successfully');
      loadClients();
    } catch (error) {
      toast.error('Failed to delete client');
      console.error('Error deleting client:', error);
    }
  };

  const handleDeleteClientWithConfirm = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      handleDeleteClient(id);
    }
  };

  const renderTableView = () => (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase">Name</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase">Company</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase">Email</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase">Phone</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase">Created</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-muted/50">
                <td className="py-4 px-6 text-sm font-medium text-card-foreground">
                  {client.name}
                </td>
                <td className="py-4 px-6 text-sm text-card-foreground">
                  {client.company}
                </td>
                <td className="py-4 px-6 text-sm text-card-foreground">
                  {client.email}
                </td>
                <td className="py-4 px-6 text-sm text-card-foreground">
                  {client.phone || 'N/A'}
                </td>
                <td className="py-4 px-6 text-sm text-card-foreground">
                  {formatDate(client.created_at)}
                </td>
                <td className="py-4 px-6 text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditClient(client)}
                      className="p-1 text-muted-foreground hover:text-blue-600"
                      title="Edit Client"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClientWithConfirm(client.id, client.name)}
                      className="p-1 text-muted-foreground hover:text-red-600"
                      title="Delete Client"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingClient(null);
  };

  const renderPanelView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredClients.map((client) => (
        <div
          key={client.id}
          className="bg-card p-6 rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-card-foreground">{client.name}</h3>
              <p className="text-muted-foreground">{client.company}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEditClient(client)}
                className="p-1 text-muted-foreground hover:text-blue-600"
                title="Edit Client"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteClientWithConfirm(client.id, client.name)}
                className="p-1 text-muted-foreground hover:text-red-600"
                title="Delete Client"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="h-4 w-4 mr-2" />
              <span className="truncate">{client.email}</span>
            </div>

            {client.phone && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mr-2" />
                <span>{client.phone}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Added {formatDate(client.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  if (showCreateForm) {
    return (
      <ClientForm 
        client={editingClient}
        onSave={handleSaveClient}
        onCancel={handleCloseForm}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground">Manage your client relationships</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowImportExport(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Building className="h-4 w-4 mr-2" />
              Import/Export
            </button>
            <button 
              onClick={handleCreateClient}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-3xl font-bold text-card-foreground">{clients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active This Month</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{Math.floor(clients.length * 0.7)}</p>
              </div>
              <Building className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New This Month</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{Math.floor(clients.length * 0.2)}</p>
              </div>
              <Mail className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">94%</p>
              </div>
              <Phone className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <div className="flex justify-between items-center">
            {/* Left section - Search */}
            <div className="relative max-w-md flex-1 mr-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search clients..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Right section - View Toggle */}
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('panel')}
                className={`p-2 rounded-lg border ${
                  viewMode === 'panel'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground'
                }`}
                title="Panel View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg border ${
                  viewMode === 'table'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground'
                }`}
                title="Table View"
              >
                <Table className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Clients Display */}
        {viewMode === 'panel' ? renderPanelView() : renderTableView()}

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? 'No clients found' : 'No clients yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Add your first client to get started'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={handleCreateClient}
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </button>
              )}
            </div>
          </div>
        )}

        {/* Import/Export Modal */}
        {showImportExport && (
          <ClientImportExport
            onClose={() => setShowImportExport(false)}
            onImportComplete={loadClients}
          />
        )}
      </div>
    </div>
  );
};
