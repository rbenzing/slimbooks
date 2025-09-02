
import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Building, Mail, Phone, LayoutGrid, Table, Edit, Trash2 } from 'lucide-react';
import { ClientForm } from './ClientForm';
import { ClientImportExport } from './clients/ClientImportExport';
import { PaginationControls } from './ui/PaginationControls';
import { clientOperations } from '../lib/database';
import { usePagination } from '@/hooks/usePagination';
import { toast } from 'sonner';
import { formatDateSync } from '@/components/ui/FormattedDate';
import { themeClasses, getButtonClasses, getIconColorClasses } from '@/utils/themeUtils.util';
import { Client, ClientFormData } from '@/types/client.types';

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

  const loadClients = async () => {
    try {
      const allClients = await clientOperations.getAll();
      setClients(allClients);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Failed to load clients');
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Use pagination hook
  const pagination = usePagination({
    data: filteredClients,
    searchTerm,
    filters: {}
  });

  const handleCreateClient = () => {
    setEditingClient(null);
    setShowCreateForm(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowCreateForm(true);
  };

  const handleSaveClient = async (clientData: ClientFormData) => {
    try {
      if (editingClient) {
        await clientOperations.update(editingClient.id, clientData);
        toast.success('Client updated successfully');
      } else {
        await clientOperations.create(clientData);
        toast.success('Client created successfully');
      }
      await loadClients();
      setShowCreateForm(false);
      setEditingClient(null);
    } catch (error) {
      toast.error('Failed to save client');
      console.error('Error saving client:', error);
    }
  };

  const handleDeleteClient = async (id: number) => {
    try {
      await clientOperations.delete(id);
      toast.success('Client deleted successfully');
      await loadClients();
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
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pagination.paginatedData.map((client) => (
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
                <td className="py-4 px-6 text-sm text-muted-foreground">
                  {client.phone || 'N/A'}
                </td>
                <td className="py-4 px-6 text-sm text-card-foreground">
                  {formatDateSync(client.created_at)}
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
      {pagination.paginatedData.map((client) => (
        <div
          key={client.id}
          className={themeClasses.cardHover}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className={themeClasses.cardTitle}>{client.name}</h3>
              <p className={themeClasses.mutedText}>{client.company}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEditClient(client)}
                className="p-1 text-muted-foreground hover:text-white"
                title="Edit Client"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteClientWithConfirm(client.id, client.name)}
                className="p-1 text-muted-foreground hover:text-white"
                title="Delete Client"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className={`flex items-center text-sm ${themeClasses.mutedText}`}>
              <Mail className={`${themeClasses.iconSmall} mr-2`} />
              <span className="truncate">{client.email}</span>
            </div>

            {client.phone && (
              <div className={`flex items-center text-sm ${themeClasses.mutedText}`}>
                <Phone className={`${themeClasses.iconSmall} mr-2`} />
                <span>{client.phone}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className={`text-xs ${themeClasses.mutedText}`}>
              Added {formatDateSync(client.created_at)}
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
    <div className={themeClasses.page}>
      <div className={themeClasses.pageContainer}>
        {/* Header */}
        <div className={themeClasses.sectionHeader}>
          <div>
            <h1 className={themeClasses.sectionTitle}>Clients</h1>
            <p className={themeClasses.sectionSubtitle}>Manage your client relationships</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowImportExport(true)}
              className={getButtonClasses('secondary')}
            >
              <Building className={themeClasses.iconButton} />
              Import/Export
            </button>
            <button
              onClick={handleCreateClient}
              className={getButtonClasses('primary')}
            >
              <Plus className={themeClasses.iconButton} />
              Add Client
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className={themeClasses.statsGrid}>
          <div className={themeClasses.statCard}>
            <div className={themeClasses.statCardContent}>
              <div>
                <p className={themeClasses.statLabel}>Total Clients</p>
                <p className={themeClasses.statValue}>{clients.length}</p>
              </div>
              <Users className={`${themeClasses.iconLarge} ${getIconColorClasses('blue')}`} />
            </div>
          </div>
          <div className={themeClasses.statCard}>
            <div className={themeClasses.statCardContent}>
              <div>
                <p className={themeClasses.statLabel}>Active This Month</p>
                <p className={`${themeClasses.statValueMedium} ${getIconColorClasses('green')}`}>{Math.floor(clients.length * 0.7)}</p>
              </div>
              <Building className={`${themeClasses.iconLarge} ${getIconColorClasses('green')}`} />
            </div>
          </div>
          <div className={themeClasses.statCard}>
            <div className={themeClasses.statCardContent}>
              <div>
                <p className={themeClasses.statLabel}>New This Month</p>
                <p className={`${themeClasses.statValueMedium} ${getIconColorClasses('purple')}`}>{Math.floor(clients.length * 0.2)}</p>
              </div>
              <Mail className={`${themeClasses.iconLarge} ${getIconColorClasses('purple')}`} />
            </div>
          </div>
          <div className={themeClasses.statCard}>
            <div className={themeClasses.statCardContent}>
              <div>
                <p className={themeClasses.statLabel}>Response Rate</p>
                <p className={`${themeClasses.statValueMedium} ${getIconColorClasses('orange')}`}>94%</p>
              </div>
              <Phone className={`${themeClasses.iconLarge} ${getIconColorClasses('orange')}`} />
            </div>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className={themeClasses.searchContainer}>
          <div className="flex justify-between items-center">
            {/* Left section - Search */}
            <div className="relative max-w-md flex-1 mr-6">
              <Search className={themeClasses.searchIcon} />
              <input
                type="text"
                placeholder="Search clients..."
                className={themeClasses.searchInput}
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

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          itemsPerPage={pagination.itemsPerPage}
          totalItems={pagination.totalItems}
          displayStart={pagination.displayStart}
          displayEnd={pagination.displayEnd}
          pageNumbers={pagination.pageNumbers}
          paginationSettings={pagination.paginationSettings}
          onPageChange={pagination.setCurrentPage}
          onItemsPerPageChange={pagination.setItemsPerPage}
          onNextPage={pagination.goToNextPage}
          onPrevPage={pagination.goToPrevPage}
          canGoNext={pagination.canGoNext}
          canGoPrev={pagination.canGoPrev}
          className="mt-6"
          itemType="clients"
        />

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
