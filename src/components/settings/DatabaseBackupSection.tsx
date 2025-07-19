import React, { useState, useEffect } from 'react';
import { Download, Upload, Database, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';
import { sqliteService } from '@/lib/sqlite-service';
import { toast } from 'sonner';

interface DatabaseStats {
  clients: number;
  invoices: number;
  templates: number;
  expenses: number;
  users: number;
  settings: number;
  webhookLogs: number;
}

export const DatabaseBackupSection = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dbStats, setDbStats] = useState<DatabaseStats>({
    clients: 0,
    invoices: 0,
    templates: 0,
    expenses: 0,
    users: 0,
    settings: 0,
    webhookLogs: 0
  });

  useEffect(() => {
    loadDatabaseStats();
  }, []);

  const loadDatabaseStats = async () => {
    try {
      if (!sqliteService.isReady()) {
        await sqliteService.initialize();
      }

      // Helper function to safely get count from table
      const getTableCount = async (tableName: string): Promise<number> => {
        try {
          const result = await sqliteService.get(`SELECT COUNT(*) as count FROM ${tableName}`);
          return result?.count || 0;
        } catch (error) {
          console.warn(`Table ${tableName} not found or error counting:`, error);
          return 0;
        }
      };

      const stats = {
        clients: await getTableCount('clients'),
        invoices: await getTableCount('invoices'),
        templates: await getTableCount('templates'),
        expenses: await getTableCount('expenses'),
        users: await getTableCount('users'),
        settings: await getTableCount('settings'),
        webhookLogs: await getTableCount('stripe_webhook_logs')
      };

      setDbStats(stats);
    } catch (error) {
      console.error('Error loading database stats:', error);
    }
  };

  const handleExportDatabase = async () => {
    setIsExporting(true);
    try {
      const blob = await sqliteService.exportToFile();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      link.download = `slimbooks-backup-${timestamp}.db`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Database exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export database');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(db|sqlite|sqlite3)$/i)) {
      toast.error('Please select a valid database file (.db, .sqlite, or .sqlite3)');
      event.target.value = '';
      return;
    }

    setIsImporting(true);
    try {
      await sqliteService.importFromFile(file);

      // Reload database stats
      await loadDatabaseStats();

      toast.success('Database imported successfully. Please refresh the page to see changes.');

      // Reset the file input
      event.target.value = '';

      // Suggest page refresh
      setTimeout(() => {
        if (confirm('Database imported successfully! Would you like to refresh the page to see the changes?')) {
          window.location.reload();
        }
      }, 1000);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import database. Please check the file format and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center mb-6">
        <Database className="h-5 w-5 text-primary mr-2" />
        <h3 className="text-lg font-medium text-card-foreground">Database Backup & Restore</h3>
      </div>

      <div className="space-y-6">
        {/* Database Statistics */}
        <div className="border border-border rounded-lg p-4 bg-muted/30">
          <div className="flex items-start space-x-3">
            <BarChart3 className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-card-foreground">Current Database Contents</h4>
                <button
                  onClick={loadDatabaseStats}
                  className="text-xs text-primary hover:text-primary/80 underline"
                >
                  Refresh
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">{dbStats.clients}</div>
                  <div className="text-muted-foreground">Clients</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">{dbStats.invoices}</div>
                  <div className="text-muted-foreground">Invoices</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">{dbStats.templates}</div>
                  <div className="text-muted-foreground">Templates</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">{dbStats.expenses}</div>
                  <div className="text-muted-foreground">Expenses</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">{dbStats.users}</div>
                  <div className="text-muted-foreground">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">{dbStats.settings}</div>
                  <div className="text-muted-foreground">Settings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">{dbStats.webhookLogs}</div>
                  <div className="text-muted-foreground">Webhook Logs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">
                    {Object.values(dbStats).reduce((a, b) => a + b, 0)}
                  </div>
                  <div className="text-muted-foreground">Total Records</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Download className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-card-foreground mb-2">Export Database</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Download a backup of your entire database including all clients, invoices, templates, expenses, and settings.
              </p>
              <button
                onClick={handleExportDatabase}
                disabled={isExporting}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Database
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Upload className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-card-foreground mb-2">Import Database</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Restore your database from a previously exported backup file. This will replace all current data.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>Warning: This will replace all existing data. Make sure to export a backup first.</span>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept=".db,.sqlite,.sqlite3"
                    onChange={handleImportDatabase}
                    disabled={isImporting}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {isImporting && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-md">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                        Importing...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="border border-border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Backup Best Practices</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Export your database regularly to prevent data loss</li>
                <li>• Store backups in a secure location (cloud storage, external drive)</li>
                <li>• Test your backups by importing them in a test environment</li>
                <li>• Keep multiple backup versions for different time periods</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
