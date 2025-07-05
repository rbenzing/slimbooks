
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, LayoutGrid, List } from 'lucide-react';
import { clientOperations } from '../lib/database';
import { ClientForm } from './ClientForm';
import { EditClientPage } from './clients/EditClientPage';
import { ClientImportExport } from './clients/ClientImportExport';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  created_at: string;
}

export const ClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showEditPage, setShowEditPage] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const loadClients = () => {
    try {
      const allClients = clientOperations.getAll();
      setClients(allClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowEditPage(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        clientOperations.delete(id);
        loadClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Error deleting client. Please try again.');
      }
    }
  };

  const handleFormSubmit = (clientData: Omit<Client, 'id' | 'created_at'>) => {
    try {
      clientOperations.create(clientData);
      setShowForm(false);
      loadClients();
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Error creating client. Please try again.');
    }
  };

  if (showEditPage && editingClient) {
    return (
      <EditClientPage
        client={editingClient}
        onBack={() => {
          setShowEditPage(false);
          setEditingClient(null);
          loadClients();
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">Manage your client information</p>
        </div>
        <div className="flex space-x-3">
          <ClientImportExport clients={clients} onImportComplete={loadClients} />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </button>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
          />
        </div>
        
        <div className="flex items-center space-x-2 bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded ${viewMode === 'table' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Clients Display */}
      {viewMode === 'table' ? (
        // Table View
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-card-foreground">Name</th>
                <th className="text-left py-3 px-6 font-medium text-card-foreground">Company</th>
                <th className="text-left py-3 px-6 font-medium text-card-foreground">Email</th>
                <th className="text-left py-3 px-6 font-medium text-card-foreground">Phone</th>
                <th className="text-left py-3 px-6 font-medium text-card-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className="border-t border-border hover:bg-muted/20">
                  <td className="py-3 px-6 text-card-foreground">{client.name}</td>
                  <td className="py-3 px-6 text-muted-foreground">{client.company}</td>
                  <td className="py-3 px-6 text-muted-foreground">{client.email}</td>
                  <td className="py-3 px-6 text-muted-foreground">{client.phone}</td>
                  <td className="py-3 px-6">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(client)}
                        className="text-primary hover:text-primary/80 p-2"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id, client.name)}
                        className="text-destructive hover:text-destructive/80 p-2"
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
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-card-foreground">{client.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(client)}
                    className="text-primary hover:text-primary/80 p-1"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id, client.name)}
                    className="text-destructive hover:text-destructive/80 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{client.company}</span>
                </div>
                <div className="flex items-center text-muted-foreground text-sm">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center text-muted-foreground text-sm">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{client.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredClients.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No clients found.</p>
        </div>
      )}

      {/* Add Client Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4 border">
            <h2 className="text-xl font-bold text-card-foreground mb-4">Add New Client</h2>
            <ClientForm 
              onSubmit={handleFormSubmit}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
